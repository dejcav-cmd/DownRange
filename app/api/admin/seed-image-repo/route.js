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

// Curated public domain / CC0 firearm image sources
// All sourced from US Government, manufacturer press kits, or CC0 repositories
const IMAGE_SEEDS = [
  // ── PISTOLS ──────────────────────────────────────────────────────────────
  { id:'pistol-001', title:'Glock 17 Gen5 Service Pistol', category:'pistol', tags:['glock','9mm','striker-fired','service'], source:'Public Domain - US Military',
    url:'https://upload.wikimedia.org/wikipedia/commons/2/2a/Glock17.jpg' },
  { id:'pistol-002', title:'SIG Sauer P320 M17 (US Army)', category:'pistol', tags:['sig','p320','m17','army','9mm'], source:'US Army Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/3/37/M17_Modular_Handgun_System.jpg' },
  { id:'pistol-003', title:'Beretta M9 Service Pistol', category:'pistol', tags:['beretta','m9','9mm','military'], source:'US Military Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/8/80/Beretta_92FS_bk.jpg' },
  { id:'pistol-004', title:'1911 Classic .45 ACP', category:'pistol', tags:['1911','45acp','colt','classic'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/3/35/M1911A1.jpg' },
  { id:'pistol-005', title:'Glock 19 Compact Carry', category:'pistol', tags:['glock','g19','compact','carry','edc'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/1/17/Glock_19_9_x_19.jpg' },
  { id:'pistol-006', title:'Springfield XD-M Competition', category:'pistol', tags:['springfield','xdm','competition'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/4/42/Springfield_Armory_XDM.jpg' },
  { id:'pistol-007', title:'Smith & Wesson Model 686 Revolver', category:'pistol', tags:['revolver','sw','357','magnum'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/a/a0/S%26W_Model_686.jpg' },
  { id:'pistol-008', title:'Ruger LCP Pocket Carry', category:'pistol', tags:['ruger','lcp','pocket','380','carry'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/5/54/Ruger_LCP.jpg' },

  // ── RIFLES ───────────────────────────────────────────────────────────────
  { id:'rifle-001', title:'M4A1 SOPMOD Block II - US Military', category:'rifle', tags:['ar15','m4','556','military','sopmod'], source:'US DoD Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'rifle-002', title:'AR-15 Sporting Rifle', category:'rifle', tags:['ar15','556','223','semi-auto','sporting'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'rifle-003', title:'AK-47 Pattern Rifle', category:'rifle', tags:['ak47','762x39','semi-auto'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/2/2b/AK-47_type_II_Para_title.jpg' },
  { id:'rifle-004', title:'Ruger Mini-14 Ranch Rifle', category:'rifle', tags:['ruger','mini14','ranch','223'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/Ruger_Mini-14.jpg' },
  { id:'rifle-005', title:'Remington 700 Bolt Action', category:'rifle', tags:['remington','700','bolt-action','precision'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },
  { id:'rifle-006', title:'AR-10 .308 Precision Rifle', category:'rifle', tags:['ar10','308','762','precision','semi-auto'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/0/0a/ArmaLite_AR-10.jpg' },
  { id:'rifle-007', title:'M16A1 Vietnam Era Rifle', category:'rifle', tags:['m16','vietnam','military','556'], source:'US Military Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/5/5b/M16A1_brimob.jpg' },

  // ── SHOTGUNS ─────────────────────────────────────────────────────────────
  { id:'shotgun-001', title:'Mossberg 500 Pump Action', category:'shotgun', tags:['mossberg','500','pump','12gauge'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/2/24/Mossberg_500.jpg' },
  { id:'shotgun-002', title:'Remington 870 Wingmaster', category:'shotgun', tags:['remington','870','pump','12gauge','classic'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/6/6d/Remington_870_Wingmaster.jpg' },
  { id:'shotgun-003', title:'Benelli M4 Tactical Shotgun', category:'shotgun', tags:['benelli','m4','tactical','semi-auto','12gauge'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/1/1f/M1014_Semi-Automatic_Shotgun.jpg' },

  // ── SUPPRESSORS / NFA ─────────────────────────────────────────────────────
  { id:'supp-001', title:'Pistol Suppressor / Silencer', category:'suppressor', tags:['suppressor','silencer','nfa','pistol'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/1/10/Silencer.jpg' },
  { id:'supp-002', title:'Rifle Suppressor Attached', category:'suppressor', tags:['suppressor','rifle','nfa','300blk'], source:'US Military Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/1/1d/SOPMOD_Kit.jpg' },

  // ── AMMUNITION ───────────────────────────────────────────────────────────
  { id:'ammo-001', title:'Pistol Cartridge Lineup', category:'ammo', tags:['ammo','9mm','45acp','40sw','cartridge'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/8/86/Various_pistol_cartridges.jpg' },
  { id:'ammo-002', title:'Rifle Cartridge Comparison', category:'ammo', tags:['ammo','556','308','762','rifle','cartridge'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/3/30/Rifle_cartridge_comparison.jpg' },
  { id:'ammo-003', title:'JHP Hollow Point Ammunition', category:'ammo', tags:['jhp','hollow-point','defensive','ammo'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/f/f0/Hollowpoint_bullet.jpg' },
  { id:'ammo-004', title:'Shotgun Shell 12 Gauge', category:'ammo', tags:['shotgun','shell','12gauge','00buck'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/0/09/Shotgun_shells_2.jpg' },
  { id:'ammo-005', title:'.22 LR Rimfire Cartridges', category:'ammo', tags:['22lr','rimfire','plinking','training'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/5/5e/.22_Long_Rifle_Comparison.JPG' },

  // ── LAW / 2A / LEGAL ─────────────────────────────────────────────────────
  { id:'law-001', title:'US Supreme Court Building', category:'law', tags:['supreme-court','scotus','law','2a'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/f/f5/US_Supreme_Court_Building.jpg' },
  { id:'law-002', title:'United States Constitution Document', category:'law', tags:['constitution','2a','rights','document'], source:'US National Archives',
    url:'https://upload.wikimedia.org/wikipedia/commons/1/1e/Constitution_of_the_United_States%2C_page_1.jpg' },
  { id:'law-003', title:'Second Amendment Text', category:'law', tags:['2a','constitution','bill-of-rights','text'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/e/e4/Bill_of_Rights_Pg1of1_AC.jpg' },
  { id:'law-004', title:'US Capitol Building', category:'law', tags:['congress','capitol','legislation','politics'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/4/4f/US_Capitol_west_side.JPG' },
  { id:'law-005', title:'ATF Bureau Seal', category:'law', tags:['atf','federal','agency','bureau'], source:'US Government Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/5/57/US-AlcoholTobaccoFirearmsAndExplosives-Seal.svg' },

  // ── TRAINING / RANGE ─────────────────────────────────────────────────────
  { id:'train-001', title:'Pistol Shooting Stance - Isosceles', category:'training', tags:['training','stance','pistol','range'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'train-002', title:'Marine Corps Rifle Qualification Range', category:'training', tags:['marine','rifle','range','qualification'], source:'US Military Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/6/6b/USMC_rifle_qualification.jpg' },
  { id:'train-003', title:'Concealed Carry Draw Practice', category:'training', tags:['concealed-carry','ccw','draw','holster'], source:'US Military Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/9/90/US_Navy_pistol_training.jpg' },

  // ── COMPETITION ───────────────────────────────────────────────────────────
  { id:'comp-001', title:'Competitive Shooting IPSC/USPSA Stage', category:'competition', tags:['uspsa','ipsc','competition','3gun'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/2/2e/IPSC_practical_shooting.jpg' },
  { id:'comp-002', title:'Long Range Precision Rifle Match', category:'competition', tags:['prs','precision','long-range','competition'], source:'US Army Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/d/d8/Sniper_competition.jpg' },

  // ── HUNTING ──────────────────────────────────────────────────────────────
  { id:'hunt-001', title:'Whitetail Deer Hunt - Bolt Action Rifle', category:'hunting', tags:['hunting','deer','whitetail','bolt-action'], source:'US Fish & Wildlife Service',
    url:'https://upload.wikimedia.org/wikipedia/commons/1/13/Deer_hunting.jpg' },
  { id:'hunt-002', title:'Turkey Hunting with Shotgun', category:'hunting', tags:['hunting','turkey','shotgun','spring'], source:'US Fish & Wildlife Service',
    url:'https://upload.wikimedia.org/wikipedia/commons/b/be/Turkey_hunt.jpg' },

  // ── GEAR / ACCESSORIES ───────────────────────────────────────────────────
  { id:'gear-001', title:'Gun Safe Home Storage', category:'gear', tags:['safe','storage','home-defense','security'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/4/40/Gun_safe.jpg' },
  { id:'gear-002', title:'Tactical Holster IWB Carry', category:'gear', tags:['holster','iwb','carry','edc'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/a/a6/Police_holster.jpg' },
  { id:'gear-003', title:'Red Dot Optic on Pistol', category:'gear', tags:['optic','red-dot','mos','rmr'], source:'Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/0/0f/Trijicon_RMR_on_Glock.jpg' },
  { id:'gear-004', title:'AR-15 LPVO Scope Mount', category:'gear', tags:['scope','optic','ar15','lpvo'], source:'US Military Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/c/c7/ACOG_on_M16.jpg' },

  // ── HOME DEFENSE ─────────────────────────────────────────────────────────
  { id:'hd-001', title:'Home Defense Shotgun Setup', category:'homedefense', tags:['home-defense','shotgun','12gauge','tactical'], source:'US Military Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/c/c5/Benelli_M1014.jpg' },
  { id:'hd-002', title:'Pistol with Weapon Light', category:'homedefense', tags:['pistol','weapon-light','home-defense','tactical'], source:'US Military Public Domain',
    url:'https://upload.wikimedia.org/wikipedia/commons/8/85/Pistol_with_light.jpg' },
]

async function uploadFromUrl(imageUrl, filename) {
  try {
    const res = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Referer':    'https://en.wikipedia.org/',
        'Accept':     'image/*,*/*',
      },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!contentType.includes('image') && !contentType.includes('svg')) return null

    const buffer = await res.arrayBuffer()
    if (buffer.byteLength < 2000) return null

    const asset = await sanity.assets.upload('image', Buffer.from(buffer), {
      filename,
      contentType,
    })
    return asset?.url || null
  } catch (e) {
    console.error(`Upload failed for ${filename}:`, e.message)
    return null
  }
}

export async function POST(req) {
  const key       = req.headers.get('x-admin-key')
  const cronAuth  = req.headers.get('authorization')
  const isCron    = process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`
  if (key !== process.env.ADMIN_KEY && !isCron) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { force = false, category = null } = await req.json().catch(() => ({}))

  // Check which ones already exist
  const existing = await sanity.fetch(
    `*[_type == "imageAsset"]{_id}`
  )
  const existingIds = new Set(existing.map(e => e._id))

  const seeds = category
    ? IMAGE_SEEDS.filter(s => s.category === category)
    : IMAGE_SEEDS

  const results = { seeded: 0, skipped: 0, failed: 0, total: seeds.length, items: [] }

  for (const seed of seeds) {
    const docId = `imageAsset-${seed.id}`

    if (!force && existingIds.has(docId)) {
      results.skipped++
      continue
    }

    console.log(`[IMG-SEED] Processing: ${seed.title}`)

    // Upload image to Sanity CDN
    const filename = `${seed.id}.${seed.url.endsWith('.svg') ? 'svg' : 'jpg'}`
    const cdnUrl = await uploadFromUrl(seed.url, filename)

    if (!cdnUrl) {
      results.failed++
      results.items.push({ id: seed.id, status: 'failed', title: seed.title })
      await new Promise(r => setTimeout(r, 200))
      continue
    }

    // Create imageAsset document in Sanity
    // We store it using the URL reference since we've uploaded to assets
    // Get the asset ref from the URL
    const assetId = cdnUrl.split('/').pop()?.replace(/\.[^.]+$/, '')

    try {
      await sanity.createOrReplace({
        _id:      docId,
        _type:    'imageAsset',
        title:    seed.title,
        alt:      seed.title,
        category: seed.category,
        tags:     seed.tags,
        source:   seed.source,
        approved: true,
        usageCount: 0,
        // Store CDN URL directly for easy access
        cdnUrl,
        // Also store as imageUrl for compatibility
        imageUrl: cdnUrl,
      })

      results.seeded++
      results.items.push({ id: seed.id, status: 'seeded', title: seed.title, url: cdnUrl.slice(0, 60) })
      console.log(`[IMG-SEED] ✓ ${seed.title} → ${cdnUrl.slice(0, 50)}`)
    } catch (e) {
      results.failed++
      results.items.push({ id: seed.id, status: 'db-error', title: seed.title, error: e.message })
    }

    await new Promise(r => setTimeout(r, 400))
  }

  return Response.json({ ok: true, ...results })
}

export async function GET(req) { return POST(req) }
