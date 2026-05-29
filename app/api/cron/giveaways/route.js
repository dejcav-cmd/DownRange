export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Category detection from title
function detectCategory(title) {
  const t = title.toLowerCase()
  if (t.includes('pistol') || t.includes('handgun') || t.includes('glock') || t.includes('sig') || t.includes('9mm') || t.includes('1911')) return 'pistol'
  if (t.includes('ar-15') || t.includes('ar15') || t.includes('rifle') || t.includes('carbine') || t.includes('ak') || t.includes('m4')) return 'rifle'
  if (t.includes('shotgun') || t.includes('gauge')) return 'shotgun'
  if (t.includes('ammo') || t.includes('rounds') || t.includes('brass')) return 'ammo'
  if (t.includes('optic') || t.includes('scope') || t.includes('red dot') || t.includes('lpvo') || t.includes('eotech') || t.includes('vortex')) return 'optics'
  if (t.includes('suppressor') || t.includes('silencer')) return 'nfa'
  if (t.includes('gear') || t.includes('tactical') || t.includes('holster') || t.includes('light')) return 'gear'
  return 'accessories'
}

function parseValue(str) {
  if (!str) return 0
  const m = str.replace(/,/g, '').match(/[\d.]+/)
  return m ? parseInt(m[0]) : 0
}

function parseEndDate(str) {
  if (!str) return null
  try {
    // Format: M/D/YY — convert to ISO
    const parts = str.split('/')
    if (parts.length === 3) {
      const y = parseInt(parts[2]) < 100 ? 2000 + parseInt(parts[2]) : parseInt(parts[2])
      return new Date(y, parseInt(parts[0]) - 1, parseInt(parts[1])).toISOString().split('T')[0]
    }
    return null
  } catch { return null }
}

async function scrapeWinTheGuns() {
  const res = await fetch('https://wintheguns.com/', {
    headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error('wintheguns.com returned ' + res.status)
  const html = await res.text()

  const giveaways = []
  // Parse table rows: <tr><td><a href="...">Title</a></td><td>$Value</td><td>M/D/YY</td><td>M/D/YY</td></tr>
  const rowRegex = /<tr[^>]*>\s*<td[^>]*>\s*<a\s+href="([^"]+)"[^>]*>([^<]+)<\/a>\s*<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>\s*<td[^>]*>([^<]*)<\/td>/gi
  let match
  while ((match = rowRegex.exec(html)) !== null) {
    const [, href, title, value, endDate, addedDate] = match
    if (!href || !title || href.includes('avantlink') || href.includes('javascript')) continue
    const cleanTitle = title.replace(/\*/g, '').trim()
    if (cleanTitle.length < 10) continue
    giveaways.push({
      title:     cleanTitle,
      entryUrl:  href.trim(),
      prize:     cleanTitle,
      prizeValue:parseValue(value),
      endDate:   parseEndDate(endDate.trim()),
      addedDate: parseEndDate(addedDate.trim()),
      category:  detectCategory(cleanTitle),
      sponsor:   extractSponsor(cleanTitle),
      type:      'external',
      featured:  parseValue(value) >= 2000,
      active:    true,
      source:    'wintheguns.com',
    })
  }
  return giveaways.slice(0, 50) // cap at 50
}

function extractSponsor(title) {
  const brands = ['Glock','SIG Sauer','Ruger','Smith & Wesson','Springfield Armory','Taurus',
    'Beretta','CZ','Heckler & Koch','Walther','Shadow Systems','Palmetto State Armory','PSA',
    'Century Arms','Faxon','AT3','Mad Pig Customs','Bul Armory','NDZ','EOTech','Vortex',
    'Primary Arms','Dead Air','SilencerCo','Streamlight','Swampfox','Magpul']
  for (const b of brands) {
    if (title.toLowerCase().includes(b.toLowerCase())) return b
  }
  return 'Various'
}

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')

  const isCron  = cronSecret && auth === 'Bearer ' + cronSecret
  const isAdmin = adminKey === ADMIN_KEY
  if (!isCron && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const stats = { scraped: 0, added: 0, skipped: 0, expired: 0 }

  try {
    const giveaways = await scrapeWinTheGuns()
    stats.scraped = giveaways.length

    // Get existing giveaway URLs to avoid duplicates
    const existing = await sanity.fetch(
      '*[_type == "giveaway"] { _id, entryUrl, endDate }'
    ).catch(() => [])
    const existingUrls = new Set((existing || []).map(g => g.entryUrl))

    // Mark expired giveaways
    const today = new Date().toISOString().split('T')[0]
    for (const g of existing || []) {
      if (g.endDate && g.endDate < today) {
        await sanity.patch(g._id).set({ active: false }).commit().catch(() => {})
        stats.expired++
      }
    }

    // Add new giveaways
    const mutations = []
    for (const g of giveaways) {
      if (existingUrls.has(g.entryUrl)) { stats.skipped++; continue }
      if (g.endDate && g.endDate < today) { stats.expired++; continue }
      mutations.push({
        create: {
          _type:      'giveaway',
          title:      g.title,
          entryUrl:   g.entryUrl,
          prize:      g.prize,
          prizeValue: g.prizeValue,
          endDate:    g.endDate,
          category:   g.category,
          sponsor:    g.sponsor,
          type:       g.type,
          featured:   g.featured,
          active:     g.active,
          source:     g.source,
          addedAt:    new Date().toISOString(),
        }
      })
      stats.added++
    }

    if (mutations.length > 0) {
      await sanity.mutate(mutations)
    }

    return NextResponse.json({
      ok: true,
      ms: Date.now() - t0,
      ...stats,
      message: stats.added + ' new giveaways added from wintheguns.com',
    })
  } catch (err) {
    console.error('[giveaways-cron]', err.message)
    return NextResponse.json({ ok: false, error: err.message, ms: Date.now() - t0 }, { status: 500 })
  }
}
