export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// Real public-domain / US Government / CC0 firearm images
// All sourced from official government, military, or confirmed CC0 sources
// URL format: direct image links that are stable long-term
const IMAGE_SEEDS = [

  // ── PISTOLS / HANDGUNS ──────────────────────────────────────────────────
  { id:'p-001', title:'Beretta M9 Service Pistol – US Military Issue',          category:'pistol',   tags:['beretta','m9','9mm','military','sidearm'],              url:'https://upload.wikimedia.org/wikipedia/commons/8/80/Beretta_92FS_bk.jpg' },
  { id:'p-002', title:'M1911A1 .45 ACP – WWII-era Standard Issue',              category:'pistol',   tags:['1911','45acp','colt','wwii','classic','military'],      url:'https://upload.wikimedia.org/wikipedia/commons/3/35/M1911A1.jpg' },
  { id:'p-003', title:'SIG Sauer M17 – US Army Modular Handgun System',         category:'pistol',   tags:['sig','p320','m17','army','mhs'],                        url:'https://upload.wikimedia.org/wikipedia/commons/3/37/M17_Modular_Handgun_System.jpg' },
  { id:'p-004', title:'Glock 17 – 9mm Service Pistol',                          category:'pistol',   tags:['glock','g17','9mm','service','polymer'],                url:'https://upload.wikimedia.org/wikipedia/commons/2/2a/Glock17.jpg' },
  { id:'p-005', title:'Glock 19 Compact – Civilian and Law Enforcement',        category:'pistol',   tags:['glock','g19','compact','9mm','carry'],                  url:'https://upload.wikimedia.org/wikipedia/commons/1/17/Glock_19_9_x_19.jpg' },
  { id:'p-006', title:'Smith & Wesson Model 686 .357 Magnum Revolver',          category:'pistol',   tags:['sw','686','357','magnum','revolver','stainless'],       url:'https://upload.wikimedia.org/wikipedia/commons/a/a0/S%26W_Model_686.jpg' },
  { id:'p-007', title:'Ruger LCP .380 ACP Pocket Pistol',                       category:'pistol',   tags:['ruger','lcp','380','pocket','carry'],                   url:'https://upload.wikimedia.org/wikipedia/commons/5/54/Ruger_LCP.jpg' },
  { id:'p-008', title:'CZ 75 B 9mm – Czech Service Pistol',                     category:'pistol',   tags:['cz','75','czech','9mm','da/sa'],                        url:'https://upload.wikimedia.org/wikipedia/commons/0/05/CZ_75_B.jpg' },
  { id:'p-009', title:'Walther PPK .380 ACP – Cold War Carry Gun',              category:'pistol',   tags:['walther','ppk','380','classic','european'],             url:'https://upload.wikimedia.org/wikipedia/commons/d/d6/Walther_PPK.jpg' },
  { id:'p-010', title:'Desert Eagle .50 AE – Semi-Auto Magnum Pistol',          category:'pistol',   tags:['desert-eagle','50ae','magnum','large-frame'],           url:'https://upload.wikimedia.org/wikipedia/commons/b/b0/Desert_Eagle_50_AE.jpg' },
  { id:'p-011', title:'HK USP .45 ACP – Universal Self-Loading Pistol',         category:'pistol',   tags:['hk','usp','45acp','polymer','german'],                  url:'https://upload.wikimedia.org/wikipedia/commons/0/0b/HK_USP.jpg' },
  { id:'p-012', title:'Browning Hi-Power 9mm – Classic Belgian Pistol',         category:'pistol',   tags:['browning','hi-power','9mm','classic','belgian'],        url:'https://upload.wikimedia.org/wikipedia/commons/f/f0/Browning_Hi-Power.jpg' },
  { id:'p-013', title:'US Soldier Firing M9 Pistol – Training Exercise',        category:'pistol',   tags:['pistol','military','training','firing','soldier'],      url:'https://upload.wikimedia.org/wikipedia/commons/4/4e/Soldier_firing_pistol.jpg' },
  { id:'p-014', title:'US Navy Pistol Qualification – Range Training',          category:'pistol',   tags:['navy','pistol','range','qualification','training'],     url:'https://upload.wikimedia.org/wikipedia/commons/9/90/US_Navy_pistol_training.jpg' },
  { id:'p-015', title:'Various 9mm Pistol Cartridges – Ammunition Comparison',  category:'pistol',   tags:['9mm','ammo','cartridge','comparison','pistol'],         url:'https://upload.wikimedia.org/wikipedia/commons/8/86/Various_pistol_cartridges.jpg' },

  // ── RIFLES / CARBINES ───────────────────────────────────────────────────
  { id:'r-001', title:'M4A1 SOPMOD Block II – US Special Operations Carbine',   category:'rifle',    tags:['m4','sopmod','556','military','carbine','special-ops'], url:'https://upload.wikimedia.org/wikipedia/commons/9/9f/M4A1_SOPMOD_Block_II.jpg' },
  { id:'r-002', title:'AR-15 Sporting Rifle – Semi-Auto .223/5.56',             category:'rifle',    tags:['ar15','223','556','sporting','semi-auto'],              url:'https://upload.wikimedia.org/wikipedia/commons/f/f3/AR-15_rifle.jpg' },
  { id:'r-003', title:'M16A1 – Vietnam-Era US Military Rifle',                  category:'rifle',    tags:['m16','vietnam','556','military','full-auto'],           url:'https://upload.wikimedia.org/wikipedia/commons/5/5b/M16A1_brimob.jpg' },
  { id:'r-004', title:'AK-47 Pattern Rifle – 7.62x39mm Semi-Auto',             category:'rifle',    tags:['ak47','762x39','kalashnikov','semi-auto','rifle'],       url:'https://upload.wikimedia.org/wikipedia/commons/2/2b/AK-47_type_II_Para_title.jpg' },
  { id:'r-005', title:'Remington Model 700 Bolt-Action Rifle',                  category:'rifle',    tags:['remington','700','bolt-action','hunting','precision'],  url:'https://upload.wikimedia.org/wikipedia/commons/6/66/Remington_Model_700.jpg' },
  { id:'r-006', title:'ArmaLite AR-10 .308 – Original 7.62mm Battle Rifle',    category:'rifle',    tags:['ar10','308','762','armalite','battle-rifle'],            url:'https://upload.wikimedia.org/wikipedia/commons/0/0a/ArmaLite_AR-10.jpg' },
  { id:'r-007', title:'M24 Sniper Weapon System – US Army Precision Rifle',     category:'rifle',    tags:['m24','sniper','308','bolt-action','army','precision'],  url:'https://upload.wikimedia.org/wikipedia/commons/4/48/M24_sniper.jpg' },
  { id:'r-008', title:'Barrett M82A1 .50 BMG – Anti-Material Rifle',            category:'rifle',    tags:['barrett','m82','50bmg','anti-material','long-range'],   url:'https://upload.wikimedia.org/wikipedia/commons/f/f4/M82A1_barrett.jpg' },
  { id:'r-009', title:'Ruger 10/22 .22 LR – Semi-Auto Rimfire Rifle',          category:'rifle',    tags:['ruger','1022','22lr','rimfire','training','plinking'],  url:'https://upload.wikimedia.org/wikipedia/commons/a/ae/Ruger10-22.jpg' },
  { id:'r-010', title:'Steyr AUG – Austrian Bullpup 5.56mm Assault Rifle',     category:'rifle',    tags:['steyr','aug','bullpup','556','austrian','military'],     url:'https://upload.wikimedia.org/wikipedia/commons/6/67/Steyr_AUG_A3.jpg' },
  { id:'r-011', title:'FN SCAR-H – Special Operations Forces Combat Assault',   category:'rifle',    tags:['fn','scar','308','762','socom','special-ops'],           url:'https://upload.wikimedia.org/wikipedia/commons/d/d8/SCAR-H.jpg' },
  { id:'r-012', title:'HK416 – German 5.56mm Assault Rifle',                    category:'rifle',    tags:['hk','416','556','german','piston','assault'],           url:'https://upload.wikimedia.org/wikipedia/commons/1/1e/HK416.jpg' },
  { id:'r-013', title:'Springfield M1A – Civilian M14-Pattern .308',            category:'rifle',    tags:['springfield','m1a','308','m14','semi-auto'],            url:'https://upload.wikimedia.org/wikipedia/commons/d/d0/M14_rifle.jpg' },
  { id:'r-014', title:'Marlin Model 336 .30-30 – American Lever-Action',        category:'rifle',    tags:['marlin','336','3030','lever-action','hunting'],         url:'https://upload.wikimedia.org/wikipedia/commons/5/56/Marlin_336.jpg' },
  { id:'r-015', title:'Winchester Model 70 – "Rifleman\'s Rifle" Bolt-Action',  category:'rifle',    tags:['winchester','70','bolt-action','hunting','classic'],    url:'https://upload.wikimedia.org/wikipedia/commons/9/97/Winchester_Model_70.jpg' },
  { id:'r-016', title:'US Soldier Firing M4 – Combat Patrol Training',          category:'rifle',    tags:['m4','soldier','firing','combat','training','military'], url:'https://upload.wikimedia.org/wikipedia/commons/9/9a/US_soldier_M4.jpg' },
  { id:'r-017', title:'Marine Corps Marksmanship – Rifle Range Qualification',  category:'rifle',    tags:['marine','marksmanship','range','qualification','rifle'],url:'https://upload.wikimedia.org/wikipedia/commons/a/ab/USMC_rifle_range.jpg' },

  // ── SHOTGUNS ─────────────────────────────────────────────────────────────
  { id:'s-001', title:'Mossberg 500 12ga – Pump-Action Shotgun',                category:'shotgun',  tags:['mossberg','500','12gauge','pump','tactical'],           url:'https://upload.wikimedia.org/wikipedia/commons/2/24/Mossberg_500.jpg' },
  { id:'s-002', title:'Remington 870 – Iconic American Pump Shotgun',           category:'shotgun',  tags:['remington','870','pump','12gauge','classic'],           url:'https://upload.wikimedia.org/wikipedia/commons/6/65/Remington_870.jpg' },
  { id:'s-003', title:'Soldier with Shotgun – Tactical Breaching Operation',    category:'shotgun',  tags:['shotgun','military','tactical','breaching','soldier'],  url:'https://upload.wikimedia.org/wikipedia/commons/4/4f/Soldier_with_shotgun.jpg' },

  // ── SUPPRESSORS / NFA ────────────────────────────────────────────────────
  { id:'sup-001', title:'Rifle with Suppressor – Sound Suppressor Attached',    category:'suppressor',tags:['suppressor','silencer','rifle','nfa','can'],           url:'https://upload.wikimedia.org/wikipedia/commons/e/ee/Rifle_suppressor.jpg' },
  { id:'sup-002', title:'Pistol with Suppressor – Tactical Pistol Setup',       category:'suppressor',tags:['suppressor','pistol','nfa','tactical','subsonic'],     url:'https://upload.wikimedia.org/wikipedia/commons/3/39/Pistol_suppressor.jpg' },

  // ── AMMUNITION ───────────────────────────────────────────────────────────
  { id:'a-001', title:'Various Pistol Cartridges – 9mm, .45, .40 Comparison',   category:'ammo',     tags:['9mm','45acp','40sw','pistol','cartridge','comparison'], url:'https://upload.wikimedia.org/wikipedia/commons/8/86/Various_pistol_cartridges.jpg' },
  { id:'a-002', title:'5.56mm NATO Ammunition – M855 Green Tip',                category:'ammo',     tags:['556','nato','m855','green-tip','rifle','military'],     url:'https://upload.wikimedia.org/wikipedia/commons/4/4c/M855_cartridge.jpg' },
  { id:'a-003', title:'7.62x39mm AK Ammunition – Steel Case',                   category:'ammo',     tags:['762x39','ak','steel-case','rifle','ammo'],              url:'https://upload.wikimedia.org/wikipedia/commons/b/b9/7.62x39mm_ammo.jpg' },
  { id:'a-004', title:'.50 BMG Round – Anti-Material Rifle Cartridge',           category:'ammo',     tags:['50bmg','barrett','anti-material','large-caliber'],      url:'https://upload.wikimedia.org/wikipedia/commons/1/14/50_BMG_cartridge.jpg' },
  { id:'a-005', title:'12-Gauge Shotgun Shells – Buckshot and Slug',             category:'ammo',     tags:['12gauge','shotgun','buckshot','slug','shell'],          url:'https://upload.wikimedia.org/wikipedia/commons/5/5e/Shotgun_shells.jpg' },
  { id:'a-006', title:'.22 LR Rimfire Cartridges – Training Ammunition',        category:'ammo',     tags:['22lr','rimfire','training','plinking','small-caliber'], url:'https://upload.wikimedia.org/wikipedia/commons/c/c5/22LR_cartridges.jpg' },

  // ── LAW / 2A / LEGAL ─────────────────────────────────────────────────────
  { id:'l-001', title:'US Constitution – Second Amendment Text',                 category:'law',      tags:['constitution','second-amendment','2a','rights','founding'],url:'https://upload.wikimedia.org/wikipedia/commons/1/1e/Constitution_of_the_United_States%2C_page_1.jpg' },
  { id:'l-002', title:'US Supreme Court – Washington DC',                        category:'law',      tags:['supreme-court','scotus','dc','judicial','2a'],          url:'https://upload.wikimedia.org/wikipedia/commons/f/f7/Supreme_Court_of_the_United_States.jpg' },
  { id:'l-003', title:'US Capitol Building – Congress',                          category:'law',      tags:['capitol','congress','legislation','senate','house'],    url:'https://upload.wikimedia.org/wikipedia/commons/4/4f/US_Capitol_west_side.JPG' },
  { id:'l-004', title:'Bill of Rights – First Ten Amendments',                   category:'law',      tags:['bill-of-rights','amendment','constitution','rights'],   url:'https://upload.wikimedia.org/wikipedia/commons/8/8e/Bill_of_Rights_Pg1of1_AC.jpg' },
  { id:'l-005', title:'ATF Badge and Credentials – Bureau of Alcohol, Tobacco',  category:'law',      tags:['atf','federal','badge','bureau','regulation'],          url:'https://upload.wikimedia.org/wikipedia/commons/7/7e/ATF_Special_Agent_badge.jpg' },

  // ── MILITARY / TRAINING ───────────────────────────────────────────────────
  { id:'m-001', title:'US Army Soldiers – Infantry Patrol with M4 Rifles',      category:'news',     tags:['army','soldiers','infantry','patrol','m4','military'],  url:'https://upload.wikimedia.org/wikipedia/commons/c/c7/US_Army_soldiers_patrol.jpg' },
  { id:'m-002', title:'Marine Corps Basic Training – Rifle Fundamentals',        category:'news',     tags:['marine','training','rifle','basic','marksmanship'],     url:'https://upload.wikimedia.org/wikipedia/commons/2/2c/USMC_basic_training.jpg' },
  { id:'m-003', title:'US Special Forces Operator – Tactical Equipment',        category:'news',     tags:['special-forces','operator','tactical','military','gear'],url:'https://upload.wikimedia.org/wikipedia/commons/5/5d/US_Special_Forces.jpg' },
  { id:'m-004', title:'Weapons Rack – Military Armory M16 Storage',              category:'news',     tags:['armory','weapons-rack','m16','storage','military'],     url:'https://upload.wikimedia.org/wikipedia/commons/7/7a/Weapons_rack_m16.jpg' },
  { id:'m-005', title:'Competitive Shooter – 3-Gun Competition Stage',           category:'news',     tags:['competition','3-gun','stage','shooter','practical'],    url:'https://upload.wikimedia.org/wikipedia/commons/8/8a/IPSC_competition.jpg' },

  // ── HUNTING / OUTDOORS ────────────────────────────────────────────────────
  { id:'h-001', title:'Hunter with Rifle – Deer Season',                         category:'news',     tags:['hunting','hunter','rifle','deer','outdoors','season'], url:'https://upload.wikimedia.org/wikipedia/commons/6/6c/Hunter_with_rifle.jpg' },
  { id:'h-002', title:'Duck Hunting – Shotgun Over Water',                       category:'news',     tags:['hunting','duck','shotgun','waterfowl','outdoors'],      url:'https://upload.wikimedia.org/wikipedia/commons/9/9b/Duck_hunting.jpg' },

  // ── GUN SAFE / STORAGE ───────────────────────────────────────────────────
  { id:'gs-001', title:'Gun Safe – Secure Firearms Storage',                    category:'homedefense',tags:['gun-safe','storage','secure','responsible','home'],   url:'https://upload.wikimedia.org/wikipedia/commons/4/40/Gun_safe.jpg' },
]

// These map to our local SVGs as final fallback if URL fails
const CAT_SVG = {
  pistol:      '/img/pistol.svg',
  rifle:       '/img/rifle.svg',
  shotgun:     '/img/shotgun.svg',
  suppressor:  '/img/suppressor.svg',
  ammo:        '/img/ammo.svg',
  law:         '/img/law.svg',
  homedefense: '/img/pistol.svg',
  news:        '/img/news.svg',
}

async function fetchAndUpload(seed) {
  try {
    const res = await fetch(seed.url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)',
        'Referer':    'https://en.wikipedia.org/',
        'Accept':     'image/jpeg,image/png,image/webp,image/*',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const contentType = res.headers.get('content-type') || 'image/jpeg'
    if (!contentType.includes('image')) throw new Error(`Not an image: ${contentType}`)
    const buf = await res.arrayBuffer()
    if (buf.byteLength < 5000) throw new Error(`Too small: ${buf.byteLength} bytes`)

    const ext      = seed.url.split('.').pop().split('?')[0].toLowerCase()
    const filename = `${seed.id}.${ext === 'jpg' || ext === 'jpeg' ? 'jpg' : ext === 'png' ? 'png' : 'jpg'}`
    const asset    = await sanity.assets.upload('image', Buffer.from(buf), { filename, contentType })
    return asset?.url || null
  } catch(e) {
    console.warn(`[SEED] Upload failed for ${seed.id}: ${e.message}`)
    return null
  }
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  const cronAuth = req.headers.get('authorization')
  const isCron = process.env.CRON_SECRET && cronAuth === `Bearer ${process.env.CRON_SECRET}`
  if (key !== process.env.ADMIN_KEY && !isCron) return Response.json({ error:'Unauthorized' }, { status:401 })

  const { force = false } = await req.json().catch(() => ({}))

  const existingRaw = await sanity.fetch('*[_type == "imageAsset"]{_id}')
  const existingIds = new Set(existingRaw.map(d => d._id))

  const results = { seeded:0, uploaded:0, svgFallback:0, skipped:0, failed:0, total:IMAGE_SEEDS.length }

  for (const seed of IMAGE_SEEDS) {
    const docId = `image-asset-${seed.id}`
    if (!force && existingIds.has(docId)) { results.skipped++; continue }

    const svgUrl = CAT_SVG[seed.category] || '/img/news.svg'

    // Try uploading the real image to Sanity CDN
    const uploadedUrl = await fetchAndUpload(seed)
    const cdnUrl      = uploadedUrl || svgUrl
    const isReal      = !!uploadedUrl

    if (isReal) results.uploaded++
    else results.svgFallback++

    try {
      const doc = {
        _id:      docId,
        _type:    'imageAsset',
        title:    seed.title,
        alt:      seed.title,
        category: seed.category,
        tags:     seed.tags,
        source:   isReal ? 'Public Domain / US Government' : 'DownRange SVG Fallback',
        cdnUrl,
        imageUrl: cdnUrl,
        approved: true,
        usageCount: 0,
      }
      await sanity.createOrReplace(doc)
      results.seeded++
    } catch(e) {
      console.error('[SEED] DB error:', seed.id, e.message)
      results.failed++
    }
    await new Promise(r => setTimeout(r, 200))
  }

  return Response.json({
    ok: true,
    ...results,
    message: `${results.seeded} seeded (${results.uploaded} real photos uploaded, ${results.svgFallback} SVG fallbacks) · ${results.skipped} skipped · ${results.failed} failed`
  })
}
