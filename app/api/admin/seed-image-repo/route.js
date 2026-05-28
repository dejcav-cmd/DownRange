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

// Map category → local SVG path (self-hosted, no egress needed)
const CAT_SVG = {
  pistol:      '/img/pistol.svg',
  rifle:       '/img/rifle.svg',
  shotgun:     '/img/shotgun.svg',
  suppressor:  '/img/suppressor.svg',
  ammo:        '/img/ammo.svg',
  law:         '/img/law.svg',
  training:    '/img/pistol.svg',
  competition: '/img/rifle.svg',
  hunting:     '/img/rifle.svg',
  news:        '/img/news.svg',
  gear:        '/img/pistol.svg',
  homedefense: '/img/pistol.svg',
}

// Curated image metadata — cdnUrl points to self-hosted SVGs
const IMAGE_SEEDS = [
  // ── PISTOLS ──────────────────────────────────────────────────────────────
  { id:'pistol-001', title:'Glock 17 Gen5 Service Pistol',          category:'pistol',   tags:['glock','9mm','service','duty'] },
  { id:'pistol-002', title:'SIG Sauer P320 M17 US Army',            category:'pistol',   tags:['sig','p320','m17','army'] },
  { id:'pistol-003', title:'Beretta M9 Service Pistol',             category:'pistol',   tags:['beretta','m9','9mm','military'] },
  { id:'pistol-004', title:'1911 Classic .45 ACP',                  category:'pistol',   tags:['1911','45acp','colt','classic'] },
  { id:'pistol-005', title:'Glock 19 Compact Carry',                category:'pistol',   tags:['glock','g19','compact','carry','edc'] },
  { id:'pistol-006', title:'Smith & Wesson Model 686 Revolver',     category:'pistol',   tags:['revolver','sw','357','magnum'] },
  { id:'pistol-007', title:'Ruger LCP Pocket Carry .380',           category:'pistol',   tags:['ruger','lcp','pocket','380','micro'] },
  { id:'pistol-008', title:'Desert Eagle .50 AE',                   category:'pistol',   tags:['desert-eagle','50ae','magnum'] },
  { id:'pistol-009', title:'CZ 75 B Czech Pistol',                  category:'pistol',   tags:['cz','75','czech','9mm'] },
  { id:'pistol-010', title:'HK USP Tactical Pistol',                category:'pistol',   tags:['hk','usp','tactical','9mm'] },
  { id:'pistol-011', title:'SIG Sauer P226 Navy SEAL Pistol',       category:'pistol',   tags:['sig','p226','navy','9mm'] },
  { id:'pistol-012', title:'Browning Hi-Power 9mm',                 category:'pistol',   tags:['browning','hi-power','9mm','classic'] },
  { id:'pistol-013', title:'Colt Python .357 Magnum Revolver',      category:'pistol',   tags:['colt','python','357','revolver'] },
  { id:'pistol-014', title:'Springfield Hellcat Micro Compact',     category:'pistol',   tags:['springfield','hellcat','micro','9mm','edc'] },
  { id:'pistol-015', title:'FN 509 Tactical Suppressor Ready',      category:'pistol',   tags:['fn','509','tactical','suppressor','9mm'] },
  // ── RIFLES ───────────────────────────────────────────────────────────────
  { id:'rifle-001',  title:'M4A1 SOPMOD Block II US Military',      category:'rifle',    tags:['ar15','m4','556','military','sopmod'] },
  { id:'rifle-002',  title:'AR-15 Sporting Rifle',                  category:'rifle',    tags:['ar15','556','223','sporting'] },
  { id:'rifle-003',  title:'AK-47 Pattern Rifle',                   category:'rifle',    tags:['ak47','762x39','semi-auto'] },
  { id:'rifle-004',  title:'Remington 700 Bolt Action Precision',   category:'rifle',    tags:['remington','700','bolt-action','precision'] },
  { id:'rifle-005',  title:'Barrett M82A1 .50 BMG Anti-Material',   category:'rifle',    tags:['barrett','m82','50bmg','anti-material'] },
  { id:'rifle-006',  title:'FN SCAR-17S Heavy .308',                category:'rifle',    tags:['fn','scar','308','762'] },
  { id:'rifle-007',  title:'HK 416 Assault Rifle',                  category:'rifle',    tags:['hk','416','556'] },
  { id:'rifle-008',  title:'Ruger 10/22 Semiauto Rimfire',          category:'rifle',    tags:['ruger','1022','22lr','rimfire','training'] },
  { id:'rifle-009',  title:'Springfield M1A SOCOM .308',            category:'rifle',    tags:['springfield','m1a','308','socom'] },
  { id:'rifle-010',  title:'SIG MCX Spear 6.8x51 Next-Gen',        category:'rifle',    tags:['sig','mcx','spear','68x51','xm5'] },
  { id:'rifle-011',  title:'Winchester Model 70 Hunting Rifle',     category:'rifle',    tags:['winchester','70','hunting','bolt-action'] },
  { id:'rifle-012',  title:'Marlin Model 336 .30-30 Lever Action',  category:'rifle',    tags:['marlin','336','3030','lever-action','hunting'] },
  { id:'rifle-013',  title:'Ruger PC Carbine 9mm PCC',              category:'rifle',    tags:['ruger','pc-carbine','9mm','pcc'] },
  { id:'rifle-014',  title:'Daniel Defense DDM4 V7 .556',           category:'rifle',    tags:['daniel-defense','ddm4','556','m4'] },
  { id:'rifle-015',  title:'Christensen Arms Mesa Lightweight',     category:'rifle',    tags:['christensen','mesa','lightweight','hunting'] },
  // ── SHOTGUNS ─────────────────────────────────────────────────────────────
  { id:'shotgun-001',title:'Mossberg 500 Pump Action',              category:'shotgun',  tags:['mossberg','500','pump','12gauge'] },
  { id:'shotgun-002',title:'Remington 870 Express Tactical',        category:'shotgun',  tags:['remington','870','pump','tactical','12gauge'] },
  { id:'shotgun-003',title:'Benelli M4 Semi-Auto Tactical',         category:'shotgun',  tags:['benelli','m4','semi-auto','tactical','military'] },
  { id:'shotgun-004',title:'Winchester SXP Defender Home Defense',  category:'shotgun',  tags:['winchester','sxp','defender','home-defense'] },
  { id:'shotgun-005',title:'Beretta A400 Semi-Auto Sporting',       category:'shotgun',  tags:['beretta','a400','semi-auto','sporting','hunting'] },
  // ── SUPPRESSORS / NFA ─────────────────────────────────────────────────────
  { id:'supp-001',   title:'SilencerCo Omega 45K Suppressor',       category:'suppressor',tags:['silencerco','omega','45k','45acp','suppressor','nfa'] },
  { id:'supp-002',   title:'Dead Air Sandman-S 7.62 Can',           category:'suppressor',tags:['dead-air','sandman','762','suppressor','nfa'] },
  { id:'supp-003',   title:'Yankee Hill Machine Turbo 5.56',        category:'suppressor',tags:['yhm','turbo','556','suppressor','nfa'] },
  { id:'supp-004',   title:'Rugged Obsidian 45 Pistol Suppressor',  category:'suppressor',tags:['rugged','obsidian','45','pistol','suppressor'] },
  { id:'supp-005',   title:'SureFire SOCOM 300 Suppressor',         category:'suppressor',tags:['surefire','socom','300','suppressor','military'] },
  // ── AMMUNITION ───────────────────────────────────────────────────────────
  { id:'ammo-001',   title:'Federal HST 9mm 147gr Hollow Point',    category:'ammo',     tags:['federal','hst','9mm','jhp','defensive'] },
  { id:'ammo-002',   title:'Hornady Critical Defense .380 ACP',     category:'ammo',     tags:['hornady','critical-defense','380','jhp'] },
  { id:'ammo-003',   title:'Speer Gold Dot 9mm +P 124gr',           category:'ammo',     tags:['speer','gold-dot','9mm','defensive','law-enforcement'] },
  { id:'ammo-004',   title:'Remington .308 Win 168gr Match',        category:'ammo',     tags:['remington','308','match','precision'] },
  { id:'ammo-005',   title:'CCI Stinger .22 LR Rimfire',            category:'ammo',     tags:['cci','stinger','22lr','rimfire'] },
  { id:'ammo-006',   title:'Winchester PDX1 12ga Defender',         category:'ammo',     tags:['winchester','pdx1','12gauge','defensive','shotgun'] },
  { id:'ammo-007',   title:'Fiocchi 5.56 NATO 55gr FMJ Training',   category:'ammo',     tags:['fiocchi','556','nato','fmj','training'] },
  { id:'ammo-008',   title:'Sig Sauer Elite Performance 9mm V-Crown',category:'ammo',    tags:['sig','v-crown','9mm','defensive','jhp'] },
  // ── LAW / LEGAL ──────────────────────────────────────────────────────────
  { id:'law-001',    title:'Second Amendment US Constitution',       category:'law',      tags:['second-amendment','constitution','2a','rights'] },
  { id:'law-002',    title:'ATF Regulation Compliance Federal',      category:'law',      tags:['atf','federal','regulation','compliance'] },
  { id:'law-003',    title:'Concealed Carry Permit CCW License',     category:'law',      tags:['ccw','carry','permit','concealed'] },
  { id:'law-004',    title:'Bruen Supreme Court Decision 2022',      category:'law',      tags:['bruen','supreme-court','2022','carry','ruling'] },
  { id:'law-005',    title:'NFA National Firearms Act Suppressor',   category:'law',      tags:['nfa','tax-stamp','suppressor','silencer','form4'] },
  { id:'law-006',    title:'NICS Background Check System FBI',       category:'law',      tags:['nics','background-check','fbi','4473'] },
  // ── NEWS / INDUSTRY ──────────────────────────────────────────────────────
  { id:'news-001',   title:'SHOT Show Las Vegas Firearms Industry',  category:'news',     tags:['shot-show','industry','trade','nssf','las-vegas'] },
  { id:'news-002',   title:'Gun Store FFL Dealer Counter',           category:'news',     tags:['ffl','dealer','gun-store','retail','counter'] },
  { id:'news-003',   title:'Firearms Industry Manufacturing',        category:'news',     tags:['manufacturing','factory','industry','production'] },
  { id:'news-004',   title:'Black Friday Record Gun Sales NICS',     category:'news',     tags:['black-friday','gun-sales','nics','record'] },
  { id:'news-005',   title:'Glock Factory Smyrna Georgia',           category:'news',     tags:['glock','factory','smyrna','georgia','manufacturing'] },
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  const cronAuth = req.headers.get('authorization')
  const isCron = process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`
  if (key !== process.env.ADMIN_KEY && !isCron) return Response.json({ error:'Unauthorized' }, { status:401 })

  const { force = false } = await req.json().catch(() => ({}))

  const existingRaw = await sanity.fetch('*[_type == "imageAsset"]{_id}')
  const existingIds = new Set(existingRaw.map(d => d._id))

  const results = { seeded:0, skipped:0, failed:0, total:IMAGE_SEEDS.length }

  for (const seed of IMAGE_SEEDS) {
    const docId = `image-asset-${seed.id}`
    if (!force && existingIds.has(docId)) { results.skipped++; continue }

    const svgUrl = CAT_SVG[seed.category] || '/img/news.svg'

    try {
      await sanity.createOrReplace({
        _id:      docId,
        _type:    'imageAsset',
        title:    seed.title,
        alt:      seed.title,
        category: seed.category,
        tags:     seed.tags,
        source:   'DownRange Self-Hosted',
        cdnUrl:   svgUrl,
        imageUrl: svgUrl,
        approved: true,
        usageCount: 0,
      })
      results.seeded++
    } catch (e) {
      console.error('Seed error:', seed.id, e.message)
      results.failed++
    }
  }

  return Response.json({
    ok: true,
    seeded:  results.seeded,
    skipped: results.skipped,
    failed:  results.failed,
    total:   results.total,
    message: `${results.seeded} seeded · ${results.skipped} already existed · ${results.failed} failed (of ${results.total} total)`
  })
}
