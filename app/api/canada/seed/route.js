export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const SEED_DATA = [
  // ── LAWS ──────────────────────────────────────────────────────────────────
  { type:'law', order:1, title:'Bill C-21 — Handgun Freeze', status:'IN FORCE', impact:'CRITICAL', effectiveDate:'Aug 2023',
    summary:'Froze all civilian handgun transfers, purchases, imports. Existing owners keep theirs. No new acquisitions. CCFR court challenge ongoing.',
    detail:'This is the single biggest firearms law change in Canadian history since the 1995 Firearms Act. An estimated 1.1 million registered handguns are now effectively frozen in place. Dealers cannot sell existing inventory to civilians. Border Services seized transfer requests. The CCFR filed a constitutional challenge in federal court arguing the freeze is arbitrary and violates section 7 rights.',
    sourceUrl:'https://www.parl.ca/legisinfo/en/bill/44-1/c-21' },
  { type:'law', order:2, title:'Order in Council — Assault Weapon Ban', status:'IN FORCE', impact:'CRITICAL', effectiveDate:'May 2020',
    summary:'Banned 1,500+ rifle models by OIC — AR-15, Mini-14, and others. Mandatory buyback stalled. Owners retain under amnesty.',
    detail:'The OIC was issued without Parliamentary vote. The buyback program was announced, contracted, then cancelled when the Conservative government took office in 2025. Current status: owners retain prohibited weapons under ongoing amnesty.',
    sourceUrl:'https://www.canada.ca/en/public-safety-canada/news/2020/05/government-of-canada-takes-action-to-protect-canadians-from-gun-violence.html' },
  { type:'law', order:3, title:'PAL / RPAL — Possession and Acquisition Licence', status:'REQUIRED', impact:'HIGH', effectiveDate:'Ongoing',
    summary:'Every firearms owner needs a PAL. Restricted class requires RPAL. Background check, references, safety course.',
    detail:'PAL processing time: 45–120 days by province. RPAL adds CRFSC course. New applicants undergo criminal record check, mental health screening, spouse notification, and reference verification. PAL must be renewed every 5 years.',
    sourceUrl:'https://www.rcmp-grc.gc.ca/en/firearms/obtaining-firearms-licence' },
  { type:'law', order:4, title:'Magazine Capacity Limits', status:'IN FORCE', impact:'HIGH', effectiveDate:'Ongoing',
    summary:'5 rounds for semi-auto centrefire. 10 rounds for handguns. Must be pinned. Rimfire exempt.',
    detail:'Grandfathered pre-ban large-capacity magazines are prohibited. Conversion by pinning is legal — unpinning is a criminal offence. Competition exemptions exist for specific IPSC divisions.',
    sourceUrl:'https://www.rcmp-grc.gc.ca/en/firearms/firearm-types' },
  { type:'law', order:5, title:'Safe Storage Requirements', status:'REQUIRED', impact:'MED', effectiveDate:'Ongoing',
    summary:'Trigger lock + unloaded + ammo separate. Restricted need locked container. Non-compliance is a criminal offence.',
    detail:'SOR/98-209 regulations: non-restricted require trigger lock or locked container. Restricted require both. Transport of restricted requires ATT from CFO.',
    sourceUrl:'https://laws-lois.justice.gc.ca/eng/regulations/sor-98-209/' },
  { type:'law', order:6, title:'Bill C-71 — Enhanced Background Checks', status:'IN FORCE', impact:'MED', effectiveDate:'Jul 2019',
    summary:'Dealers must verify PAL with RCMP before every sale. Lifetime background checks. Record-keeping for 20 years.',
    detail:'Before C-71, dealers could visually inspect a PAL without verifying it. Now every transaction requires a real-time RCMP database check. Records kept 20 years, available to police without warrant.',
    sourceUrl:'https://www.parl.ca/legisinfo/en/bill/42-1/c-71' },
  // ── PROVINCES ────────────────────────────────────────────────────────────
  { type:'province', order:1, title:'Alberta', abbr:'AB', rating:'B+', color:'#22c55e',
    summary:'Most gun-friendly province. Strong conservative rural base, provincial opposition to C-21, and an active Firearms Advisory Committee.',
    highlights:['Provincial opposition to OIC ban','Alberta Firearms Advisory Committee active','Strong hunting and sport shooting culture','CFO processing times among best nationally'] },
  { type:'province', order:2, title:'Saskatchewan', abbr:'SK', rating:'B', color:'#22c55e',
    summary:'Saskatchewan Firearms Act provides provincial protections. Strong rural community. RCMP jurisdiction.',
    highlights:['SK Firearms Act protects lawful owners','Strong rural hunting majority','RCMP jurisdiction — no provincial CFO','Good PAL processing times'] },
  { type:'province', order:3, title:'Manitoba', abbr:'MB', rating:'C+', color:'#f59e0b',
    summary:'Average enforcement. Rural-friendly policies. CFO offices accessible.',
    highlights:['No additional provincial restrictions','Rural hunting tradition strong','Reasonable CFO processing','RCMP and CFO co-jurisdiction'] },
  { type:'province', order:4, title:'New Brunswick', abbr:'NB', rating:'C+', color:'#f59e0b',
    summary:'Strong rural hunting culture. RCMP jurisdiction. Above-average processing times.',
    highlights:['RCMP jurisdiction','Strong hunting tradition','No provincial registry','Above-average PAL processing'] },
  { type:'province', order:5, title:'Nova Scotia', abbr:'NS', rating:'C', color:'#f97316',
    summary:'Rural hunting tradition strong but urban Halifax driving policy tighter.',
    highlights:['RCMP jurisdiction','Rural majority still influential','No provincial long-gun registry','Standard federal enforcement'] },
  { type:'province', order:6, title:'Ontario', abbr:'ON', rating:'C-', color:'#ef4444',
    summary:'Strict CFO enforcement. Toronto handgun transfer was de facto impossible even pre-C-21.',
    highlights:['Strictest CFO in country','Toronto municipal pressure','Long ATT processing times','Rural/urban split significant'] },
  { type:'province', order:7, title:'British Columbia', abbr:'BC', rating:'C-', color:'#ef4444',
    summary:'Metro areas very restrictive. CFO enforcement strict. Provincial data sharing with RCMP.',
    highlights:['Strict Metro Vancouver CFO enforcement','Data sharing with provincial police','Long PAL and ATT wait times','Rural BC much more accessible'] },
  { type:'province', order:8, title:'Quebec', abbr:'QC', rating:'D', color:'#dc2626',
    summary:'Most restrictive province. Provincial long-gun registry active. Separate firearms database.',
    highlights:['Provincial long-gun registry active','Bill 64 separate registration required','Most restrictive CFO in Canada','Legal challenges have failed provincially'] },
  // ── AMMO ─────────────────────────────────────────────────────────────────
  { type:'ammo', order:1, title:'9mm Luger',     cadPrice:'C$0.42/rd', usdEquiv:'~US$0.31', availability:'High',     trend:'up',   note:'Import-dependent. Weak CAD vs USD adds ~30% vs US retail.' },
  { type:'ammo', order:2, title:'.22 LR',        cadPrice:'C$0.14/rd', usdEquiv:'~US$0.10', availability:'High',     trend:'flat', note:'No import restrictions. Most accessible caliber in Canada.' },
  { type:'ammo', order:3, title:'.223 / 5.56',   cadPrice:'C$0.85/rd', usdEquiv:'~US$0.63', availability:'Moderate', trend:'up',   note:'OIC-banned rifles created demand drop then stockpiling.' },
  { type:'ammo', order:4, title:'.308 WIN',       cadPrice:'C$1.65/rd', usdEquiv:'~US$1.22', availability:'Moderate', trend:'flat', note:'Bolt-action staple. Still widely stocked for hunting.' },
  { type:'ammo', order:5, title:'12 Gauge',       cadPrice:'C$0.85/rd', usdEquiv:'~US$0.63', availability:'High',     trend:'flat', note:'Hunting-oriented. Plentiful nationwide.' },
  { type:'ammo', order:6, title:'6.5 Creedmoor',  cadPrice:'C$2.10/rd', usdEquiv:'~US$1.55', availability:'Low',      trend:'up',   note:'Growing precision rifle use. Import limited.' },
  { type:'ammo', order:7, title:'7.62x39',        cadPrice:'C$0.65/rd', usdEquiv:'~US$0.48', availability:'Low',      trend:'down', note:'AK-platform banned by OIC. Demand cratered.' },
  // ── ALERTS ───────────────────────────────────────────────────────────────
  { type:'alert', order:1, title:'Handgun Freeze Active', color:'#ef4444',
    summary:'Bill C-21 handgun freeze in force since Aug 2023. No civilian handgun purchases or transfers permitted.',
    sourceUrl:'https://www.ccfr.ca' },
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error:'Unauthorized' }, { status:401 })

  let created = 0, skipped = 0
  for (const item of SEED_DATA) {
    try {
      const exists = await sanity.fetch(
        '*[_type=="canadaContent" && type==$t && title==$n][0]{_id}',
        { t: item.type, n: item.title }
      )
      if (exists) { skipped++; continue }
      await sanity.create({ _type:'canadaContent', ...item, active:true, publishedAt: new Date().toISOString() })
      created++
    } catch(e) { console.error('seed error:', e.message) }
  }
  return Response.json({ ok:true, created, skipped, total: SEED_DATA.length })
}
