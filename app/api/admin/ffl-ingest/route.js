export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'
import { reportCronRun } from '../../../../lib/cronReporter'

// Monthly ATF FFL import. atf.gov blocks datacenter IPs (GitHub, Vercel), so a script on a
// home machine (scripts/atf_ffl_fetch.py) downloads each state's ATF listing and POSTs it here.
// One Sanity doc per state: fflState-XX { state, month, count, dealers:[...] }.
// POST {state:'WA', month:'2026-10', dealers:[{lic,name,biz,street,city,zip,phone,type,exp}]}
// POST {done:true, month, states:50} at the end -> reports the cron run.

export async function POST(req) {
  const adm = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
  if (!adm || req.headers.get('x-admin-key') !== adm) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const t0 = Date.now()
  const body = await req.json()
  const sanity = createClient({ projectId: 'vbnsqnkg', dataset: 'production', apiVersion: '2024-01-01', token: process.env.SANITY_TOKEN, useCdn: false })
  try {
    if (body.done) {
      await reportCronRun('ffl-sync', { status: body.failed?.length ? 'warning' : 'success', ms: 0, details: `${body.states} states, ${body.total} dealers, ${body.month}`, error: body.failed?.length ? `failed: ${body.failed.join(',')}` : null })
      return Response.json({ ok: true })
    }
    const st = String(body.state || '').toUpperCase()
    const dealers = Array.isArray(body.dealers) ? body.dealers : []
    if (!/^[A-Z]{2}$/.test(st)) throw new Error('bad state')
    if (dealers.length < 5) throw new Error(`${st}: only ${dealers.length} dealers, refusing to overwrite`)
    await sanity.createOrReplace({
      _id: `fflState-${st.toLowerCase()}`, _type: 'fflState', state: st, month: body.month,
      count: dealers.length, updatedAt: new Date().toISOString(), dealers,
    })
    return Response.json({ ok: true, state: st, count: dealers.length })
  } catch (e) {
    await reportCronRun('ffl-sync', { status: 'failed', ms: Date.now() - t0, error: e.message }).catch(() => {})
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
