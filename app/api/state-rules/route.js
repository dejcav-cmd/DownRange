export const dynamic = 'force-dynamic'
export const revalidate = 0

import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { STATE_SEED } from '@/lib/stateSeed'

// ── State Restriction Rules API ───────────────────────────────────────────────
// Returns restriction-relevant fields for all 50 states.
// Source priority for each field:
//   magLimit  → Sanity stateProfile (auto-updated weekly by ccw-update cron) → stateSeed fallback
//   awbStatus → Sanity stateProfile → stateSeed fallback
//   suppressors → Sanity stateProfile → stateSeed fallback
//
// Client-side usage:
//   const { rules } = await fetch('/api/state-rules').then(r => r.json())
//   // rules: { WA: { magLimit:10, awb:true, noSuppressor:true }, ... }

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

function normAwb(awbStatus) {
  if (!awbStatus) return false
  const s = String(awbStatus).toLowerCase()
  return s === 'full' || s === 'partial' || s === 'true'
}

export async function GET() {
  try {
    // Fetch restriction fields for all stateProfile docs from Sanity
    const profiles = await sanity.fetch(
      `*[_type=="stateProfile"]{abbr, magLimit, awbStatus, suppressors, lastUpdated}`
    ).catch(() => [])

    // Build lookup map from Sanity (abbr → profile)
    const sanityMap = {}
    for (const p of (profiles || [])) {
      if (p.abbr) sanityMap[p.abbr] = p
    }

    // Build final rules — merge Sanity (primary) with stateSeed (fallback)
    // Only emit states that have at least one restriction
    const rules = {}
    for (const [abbr, seed] of Object.entries(STATE_SEED)) {
      const sanity_ = sanityMap[abbr] || {}

      // magLimit: Sanity wins if set; else stateSeed; else null
      const magLimit = sanity_.magLimit != null
        ? sanity_.magLimit
        : (seed.magLimit ?? null)

      // awbStatus: Sanity wins if set; else stateSeed
      const awb = sanity_.awbStatus != null
        ? normAwb(sanity_.awbStatus)
        : (seed.awbStatus && seed.awbStatus !== 'none')

      // suppressors: Sanity wins if set; else stateSeed (true = legal, false = banned)
      const suppressorLegal = sanity_.suppressors != null
        ? sanity_.suppressors
        : (seed.suppressors !== false)

      const noSuppressor = !suppressorLegal

      // Only include states with at least one restriction relevant to deals
      if (magLimit || awb || noSuppressor) {
        rules[abbr] = {
          name: seed.name,
          magLimit: magLimit || null,
          awb:      awb,
          noSuppressor,
        }
      }
    }

    return NextResponse.json({
      rules,
      count:    Object.keys(rules).length,
      source:   profiles?.length > 0 ? 'sanity+seed' : 'seed-only',
      sanityProfiles: profiles?.length || 0,
      updatedAt: new Date().toISOString(),
    }, {
      headers: {
        // Cache 1 hour at CDN — ccw-update runs weekly so this is safe
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      }
    })
  } catch (err) {
    console.error('[state-rules] Error:', err.message)
    // On error, fall back to stateSeed entirely
    const rules = {}
    for (const [abbr, seed] of Object.entries(STATE_SEED)) {
      const magLimit = seed.magLimit ?? null
      const awb = seed.awbStatus && seed.awbStatus !== 'none'
      const noSuppressor = seed.suppressors === false
      if (magLimit || awb || noSuppressor) {
        rules[abbr] = { name: seed.name, magLimit, awb, noSuppressor }
      }
    }
    return NextResponse.json({
      rules, source: 'seed-fallback', error: err.message, updatedAt: new Date().toISOString()
    })
  }
}

// ── POST: save admin edits from the Compliance Rules panel ─────────────────────
// Previously the panel POSTed to a route that didn't exist and swallowed the error,
// so rule edits were never saved. rulesOverride tells the weekly ccw-update cron
// not to overwrite these fields with its hardcoded data.
export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (!key || key !== (process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const { abbr, mag, awbFull, awbRestricted, suppLegal } = await req.json()
    const code = String(abbr || '').toUpperCase()
    if (!STATE_SEED[code]) return NextResponse.json({ error: 'Unknown state' }, { status: 400 })
    const profile = await sanity.fetch('*[_type=="stateProfile" && abbr==$abbr][0]{_id}', { abbr: code })
    if (!profile?._id) return NextResponse.json({ error: 'No stateProfile for ' + code }, { status: 404 })
    const magLimit = mag === '' || mag == null || mag === false ? null : Number(mag)
    const awbStatus = awbFull ? 'Full' : awbRestricted ? 'partial' : 'none'
    const suppressors = suppLegal !== false
    const now = new Date().toISOString()
    await sanity.patch(profile._id).set({
      magLimit: Number.isFinite(magLimit) ? magLimit : null,
      awbStatus, suppressors,
      rulesOverride: { by: 'admin', at: now },
      lastUpdated: now,
    }).commit()
    return NextResponse.json({ ok: true, abbr: code, magLimit, awbStatus, suppressors })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
