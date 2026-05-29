import { createClient } from '@sanity/client'
import Link from 'next/link'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'Hunting — Season Dates, Game by State, Cartridge Guides | DownRange',
  description: 'Complete hunting resource: 2025-2026 season dates for all 50 states, species guides, cartridge selection, draw deadlines, field skills, and gear recommendations.',
  alternates: { canonical: 'https://downrangeco.com/hunting' },
  openGraph: {
    title: 'Hunting — Season Dates by State, Game & Cartridge Guides | DownRange',
    description: '2025-2026 hunting seasons for deer, elk, turkey, bear & waterfowl across all 50 states. Cartridge guides, draw deadlines, and field skills.',
    url: 'https://downrangeco.com/hunting',
  },
}

export const revalidate = 3600

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
})

// ── SEASON DATA BY STATE ──────────────────────────────────────────────────────
const STATE_SEASONS = [
  { state:'Alabama',      abbr:'AL', deer:'Nov 15 – Jan 31', turkey:'Mar 15 – Apr 30', bear:'N/A',         waterfowl:'Nov–Jan', license:'$15 res / $105 non-res', notes:'Rut peaks late Oct–early Nov' },
  { state:'Alaska',       abbr:'AK', deer:'Aug 1 – Dec 31', turkey:'N/A',              bear:'Aug 10–Jun 30',waterfowl:'Sep–Jan', license:'$25 res / $160 non-res', notes:'Brown bear requires guide for non-res' },
  { state:'Arizona',      abbr:'AZ', deer:'Oct 18 – Nov 1',  turkey:'Oct–Nov',          bear:'Sep 6–Dec 31', waterfowl:'Oct–Jan', license:'$37 res / $160 non-res', notes:'Unit draw required; apply by June' },
  { state:'Arkansas',     abbr:'AR', deer:'Oct 1 – Jan 31',  turkey:'Apr 15 – May 15',  bear:'Oct–Nov',     waterfowl:'Nov–Jan', license:'$10.5 res / $50 non-res', notes:'Strong public land opportunity' },
  { state:'California',   abbr:'CA', deer:'Aug 10 – Oct 26', turkey:'Mar 29 – May 4',   bear:'Nov 2–Dec 27',waterfowl:'Oct–Jan', license:'$52 res / $183 non-res', notes:'Zone A deer archery opens July' },
  { state:'Colorado',     abbr:'CO', deer:'Aug 31 – Nov 20', turkey:'Apr 1 – May 31',   bear:'Sep 2–Nov 20',waterfowl:'Oct–Jan', license:'$36 res / $371 non-res', notes:'Primary draw closed; leftover tags available' },
  { state:'Connecticut',  abbr:'CT', deer:'Sep 15 – Dec 31', turkey:'May 1–31',          bear:'N/A',         waterfowl:'Oct–Jan', license:'$19 res / $91 non-res',  notes:'Limited hunting access' },
  { state:'Delaware',     abbr:'DE', deer:'Sep 1 – Jan 31',  turkey:'Apr 21 – May 24',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$14 res / $56 non-res',  notes:'Small state; most hunting on private land' },
  { state:'Florida',      abbr:'FL', deer:'Oct 19 – Jan 19', turkey:'Mar 1 – Apr 20',    bear:'Closed',      waterfowl:'Nov–Jan', license:'$17.50 res / $151 non-res', notes:'Osceola turkey only in FL' },
  { state:'Georgia',      abbr:'GA', deer:'Oct 19 – Jan 15', turkey:'Mar 22 – May 15',   bear:'Oct 10–Nov 30',waterfowl:'Nov–Jan', license:'$15 res / $100 non-res', notes:'Good public WMAs statewide' },
  { state:'Idaho',        abbr:'ID', deer:'Aug 30 – Nov 20', turkey:'Aug 30 – Dec 31',   bear:'Sep–Jun',     waterfowl:'Oct–Jan', license:'$14.75 res / $154 non-res', notes:'Draw apps for 2026 run May 1–Jun 5' },
  { state:'Illinois',     abbr:'IL', deer:'Oct 1 – Jan 15',  turkey:'Apr 17 – May 25',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$12 res / $157 non-res', notes:'Firearm zone restrictions apply' },
  { state:'Indiana',      abbr:'IN', deer:'Oct 1 – Jan 31',  turkey:'Apr 23 – May 11',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$17 res / $109 non-res', notes:'Good CWD management zones' },
  { state:'Iowa',         abbr:'IA', deer:'Oct 1 – Jan 10',  turkey:'Apr 14 – May 18',   bear:'N/A',         waterfowl:'Oct–Jan', license:'$28 res / $601 non-res', notes:'Trophy whitetail state; apply early' },
  { state:'Kansas',       abbr:'KS', deer:'Sep 15 – Dec 31', turkey:'Apr 16 – May 31',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$27.50 res / $442 non-res', notes:'Over-the-counter archery; draw for firearms' },
  { state:'Kentucky',     abbr:'KY', deer:'Sep 6 – Jan 18',  turkey:'Apr 15 – May 15',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$25 res / $135 non-res', notes:'Good public land in Daniel Boone NF' },
  { state:'Louisiana',    abbr:'LA', deer:'Oct 1 – Feb 15',  turkey:'Mar 21 – Apr 30',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$15 res / $100 non-res', notes:'Swamp and piney woods hunting' },
  { state:'Maine',        abbr:'ME', deer:'Oct 1 – Nov 30',  turkey:'May 1 – Jun 1',     bear:'Aug 26–Nov 30',waterfowl:'Oct–Jan', license:'$26 res / $115 non-res', notes:'Largest black bear population in lower 48' },
  { state:'Maryland',     abbr:'MD', deer:'Sep 10 – Jan 31', turkey:'Apr 19 – May 30',   bear:'Oct 25–28',   waterfowl:'Oct–Jan', license:'$15 res / $130 non-res', notes:'Limited bear permits' },
  { state:'Massachusetts',abbr:'MA', deer:'Oct 5 – Dec 31',  turkey:'Apr 27 – May 23',   bear:'Sep 7–Dec 12',waterfowl:'Oct–Jan', license:'$27.50 res / $67.50 non-res', notes:'Shotgun and archery seasons overlap' },
  { state:'Michigan',     abbr:'MI', deer:'Oct 1 – Jan 31',  turkey:'Apr 23 – Jun 7',    bear:'Sep 10–Oct 26',waterfowl:'Oct–Jan', license:'$11 res / $151 non-res', notes:'Famous Nov 15 firearm opener' },
  { state:'Minnesota',    abbr:'MN', deer:'Sep 14 – Dec 31', turkey:'Apr 19 – May 31',   bear:'Sep 1–Oct 14',waterfowl:'Oct–Dec', license:'$22 res / $155 non-res', notes:'Zone licensing for deer management' },
  { state:'Mississippi',  abbr:'MS', deer:'Oct 1 – Feb 15',  turkey:'Mar 15 – Apr 30',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$10 res / $150 non-res', notes:'Some of the longest deer seasons in the US' },
  { state:'Missouri',     abbr:'MO', deer:'Sep 15 – Jan 15', turkey:'Apr 14 – May 4',    bear:'N/A',         waterfowl:'Nov–Jan', license:'$19 res / $130 non-res', notes:'Strong Ozarks turkey population' },
  { state:'Montana',      abbr:'MT', deer:'Oct 25 – Nov 30', turkey:'N/A general',        bear:'Apr 15–Jun 15',waterfowl:'Oct–Jan', license:'$20 res / $628 non-res', notes:'Elk draw required for most units' },
  { state:'Nebraska',     abbr:'NE', deer:'Sep 1 – Jan 15',  turkey:'Apr 1 – May 31',    bear:'N/A',         waterfowl:'Oct–Jan', license:'$30 res / $252 non-res', notes:'Sandhills unit known for trophy mule deer' },
  { state:'Nevada',       abbr:'NV', deer:'Oct 1 – Nov 30',  turkey:'N/A',               bear:'Aug 10–Nov 30',waterfowl:'Oct–Jan', license:'$33 res / $142 non-res', notes:'Draw-only; apply by June deadline' },
  { state:'New Hampshire',abbr:'NH', deer:'Sep 15 – Dec 15', turkey:'May 1 – Jun 1',     bear:'Sep 1–Nov 30',waterfowl:'Oct–Jan', license:'$15 res / $103 non-res', notes:'Bear hounding popular' },
  { state:'New Jersey',   abbr:'NJ', deer:'Sep 11 – Feb 28', turkey:'Apr 26 – May 31',   bear:'Dec 8–12',    waterfowl:'Nov–Jan', license:'$28 res / $135 non-res', notes:'Urban hunting zone regulations complex' },
  { state:'New Mexico',   abbr:'NM', deer:'Oct 19 – Nov 3',  turkey:'Oct–Nov',            bear:'Sep 1–Dec 15',waterfowl:'Oct–Jan', license:'$15 res / $195 non-res', notes:'Archery elk over-the-counter in many units' },
  { state:'New York',     abbr:'NY', deer:'Oct 1 – Dec 31',  turkey:'May 1 – Jun 8',     bear:'Sep 27–Nov 30',waterfowl:'Oct–Jan', license:'$22 res / $101 non-res', notes:'Southern zone vs Northern zone seasons differ' },
  { state:'North Carolina',abbr:'NC',deer:'Sep 6 – Jan 1',   turkey:'Apr 4 – May 1',     bear:'Oct–Nov',     waterfowl:'Nov–Jan', license:'$25 res / $100 non-res', notes:'Multiple management zones' },
  { state:'North Dakota', abbr:'ND', deer:'Sep 26 – Nov 16', turkey:'Apr 12 – Jun 1',    bear:'N/A',         waterfowl:'Sep–Jan', license:'$30 res / $390 non-res', notes:'Resident-first tag system' },
  { state:'Ohio',         abbr:'OH', deer:'Sep 27 – Feb 8',  turkey:'Apr 19 – May 18',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$19 res / $124 non-res', notes:'Some of best whitetail habitat in the Midwest' },
  { state:'Oklahoma',     abbr:'OK', deer:'Oct 1 – Jan 15',  turkey:'Mar 29 – May 4',    bear:'N/A',         waterfowl:'Nov–Jan', license:'$25 res / $200 non-res', notes:'Scissortail and creek-bottom whitetails' },
  { state:'Oregon',       abbr:'OR', deer:'Aug 24 – Nov 30', turkey:'Aug 1 – Dec 31',    bear:'Aug 1–Dec 31',waterfowl:'Oct–Jan', license:'$34 res / $152 non-res', notes:'Columbia Blacktail and Roosevelt elk unique species' },
  { state:'Pennsylvania', abbr:'PA', deer:'Sep 16 – Dec 14', turkey:'Apr 26 – May 31',   bear:'Nov 17–21',   waterfowl:'Oct–Jan', license:'$21 res / $101 non-res', notes:'Largest antlered deer harvest in the US' },
  { state:'Rhode Island', abbr:'RI', deer:'Sep 13 – Feb 1',  turkey:'Apr 26 – May 25',   bear:'N/A',         waterfowl:'Oct–Jan', license:'$18 res / $40 non-res',  notes:'Small state; limited public land' },
  { state:'South Carolina',abbr:'SC',deer:'Aug 15 – Jan 1',  turkey:'Mar 22 – Apr 5',    bear:'N/A',         waterfowl:'Nov–Jan', license:'$10 res / $100 non-res', notes:'Earliest deer archery opener in the US' },
  { state:'South Dakota', abbr:'SD', deer:'Sep 27 – Jan 31', turkey:'Sep 27 – Jan 31',   bear:'N/A',         waterfowl:'Sep–Jan', license:'$26 res / $160 non-res', notes:'Pheasant hunting world-class' },
  { state:'Tennessee',    abbr:'TN', deer:'Sep 28 – Jan 31', turkey:'Mar 29 – May 11',   bear:'Oct–Nov',     waterfowl:'Nov–Jan', license:'$34 res / $100 non-res', notes:'Cherokee NF elk reintroduction successful' },
  { state:'Texas',        abbr:'TX', deer:'Nov 1 – Jan 19',  turkey:'Mar 28 – May 10',   bear:'N/A',         waterfowl:'Nov–Jan', license:'$25 res / $315 non-res', notes:'Private land dominant; lease system common' },
  { state:'Utah',         abbr:'UT', deer:'Aug 19 – Nov 30', turkey:'Sep–Nov',            bear:'Aug 19–Nov 30',waterfowl:'Oct–Jan', license:'$32 res / $263 non-res', notes:'Draw required; apply by Feb' },
  { state:'Vermont',      abbr:'VT', deer:'Oct 4 – Dec 15',  turkey:'May 1 – Jun 8',     bear:'Sep 1–Nov 30',waterfowl:'Oct–Jan', license:'$28 res / $102 non-res', notes:'Youth hunt available weekends prior' },
  { state:'Virginia',     abbr:'VA', deer:'Oct 5 – Jan 4',   turkey:'Apr 5 – May 15',    bear:'Oct 5–Jan 4', waterfowl:'Nov–Jan', license:'$23 res / $122 non-res', notes:'National Forest units — good public land' },
  { state:'Washington',   abbr:'WA', deer:'Nov 10 – Dec 15', turkey:'Apr 15 – May 31',   bear:'Apr 1–May 31',waterfowl:'Oct–Jan', license:'$42 res / $199 non-res', notes:'Roosevelt elk in Olympics; mule deer east side' },
  { state:'West Virginia',abbr:'WV', deer:'Sep 28 – Dec 31', turkey:'Apr 19 – May 11',   bear:'Oct 7–Dec 31',waterfowl:'Nov–Jan', license:'$19 res / $100 non-res', notes:'Black bear hunting growing' },
  { state:'Wisconsin',    abbr:'WI', deer:'Sep 13 – Jan 4',  turkey:'Apr 14 – May 31',   bear:'Sep 3–Oct 12',waterfowl:'Oct–Jan', license:'$20 res / $160 non-res', notes:'Famous 9-day gun deer season Nov 22' },
  { state:'Wyoming',      abbr:'WY', deer:'Sep 15 – Nov 30', turkey:'N/A',               bear:'Sep 1–Nov 30',waterfowl:'Oct–Jan', license:'$46 res / $627 non-res', notes:'Elk draw required; archery OTC in many units' },
]

const GAME_TYPES = [
  {
    id:'whitetail', icon:'🦌', name:'Whitetail Deer',
    range:'SE, Midwest, NE, TX', peak:'Oct–Dec',
    cartridges:['.308 Win','.30-06','6.5 Creedmoor','7mm-08','.243 Win'],
    tips:'Rut peaks mid-November across most of the country. Scout food sources in October. Entry and exit routes matter more than stand placement.',
    license:'Over-the-counter in most states',
  },
  {
    id:'elk', icon:'🫎', name:'Rocky Mountain Elk',
    range:'CO, WY, MT, ID, NM, UT, AZ',  peak:'Aug–Sep (rut)',
    cartridges:['.300 Win Mag','7mm Rem Mag','.338 Win Mag','6.5 Creedmoor (archery range)'],
    tips:'Bugling bulls respond to cow calls and bugles Sept 1–25. Public land elk require fitness — plan 10–15 mile days. Draw tags required in most units.',
    license:'Draw required — apply Feb–April depending on state',
  },
  {
    id:'turkey', icon:'🦃', name:'Wild Turkey',
    range:'49 states (not Alaska)',        peak:'Apr–May (spring)',
    cartridges:['12 GA #4–6 shot','20 GA heavy load','.410 (limited range)'],
    tips:'Spring gobblers respond to yelps and clucks at first light. Set up before first light. Patience beats moving. Fall turkey runs Sept–Nov in most states.',
    license:'Over-the-counter in most states',
  },
  {
    id:'bear', icon:'🐻', name:'Black Bear',
    range:'30+ states',                   peak:'Fall (Oct–Nov)',
    cartridges:['.308 Win','.30-06','.44 Mag (handgun)','.350 Legend'],
    tips:'Bait hunting legal in some states — check regulations. Spot-and-stalk over food sources in fall. Spring bear hunts available in OR, MT, ID, AK.',
    license:'Varies: OTC in some states, draw in others',
  },
  {
    id:'waterfowl', icon:'🦆', name:'Waterfowl (Duck/Goose)',
    range:'All 4 flyways',                peak:'Nov–Jan',
    cartridges:['12 GA steel shot (required)','3" and 3.5" loads','#2 or #BB steel for geese'],
    tips:'Federal duck stamp required ($25) for hunters 16+. Scout migration maps by flyway. Timber hole hunting produces in flooded fields. Cold fronts push birds south.',
    license:'Federal Duck Stamp + state license required',
  },
  {
    id:'mule-deer', icon:'🦌', name:'Mule Deer',
    range:'Western states — CO, WY, UT, NV, AZ, NM',  peak:'Oct–Nov',
    cartridges:['.308 Win','6.5 Creedmoor','.30-06','7mm Rem Mag'],
    tips:'Spot-and-stalk on high ridgelines. Glassing is the skill — cover country before committing. Bucks often bed below ridgelines on the downwind side.',
    license:'Draw required in most states',
  },
]

const CARTRIDGE_GUIDE = [
  { cal:'6.5 Creedmoor', use:'Deer, elk under 400 yards', recoil:'Mild', notes:'Best all-around cartridge for new hunters. Flat trajectory, excellent BC bullets.' },
  { cal:'.308 Winchester', use:'Deer, elk, bear', recoil:'Moderate', notes:'Most versatile hunting cartridge. Ammo available everywhere. 500-yard effective range on deer.' },
  { cal:'.30-06 Springfield', use:'Deer, elk, bear, moose', recoil:'Moderate', notes:'Proven 100+ years. Energy to handle any North American big game. Legacy choice.' },
  { cal:'.300 Win Mag', use:'Elk, moose, bear, long range', recoil:'Heavy', notes:'Go-to for elk hunters. Extra punch at distance. Learn to shoot it before season.' },
  { cal:'7mm Rem Mag', use:'Deer, elk, long range', recoil:'Moderate-heavy', notes:'Flatter than .300 Win Mag with similar energy. Popular in Western mountains.' },
  { cal:'.243 Winchester', use:'Deer, varmints', recoil:'Very mild', notes:'Youth and recoil-sensitive hunters. Accurate and effective on deer to 300 yards.' },
  { cal:'.350 Legend', use:'Deer (straight-wall states)', recoil:'Mild', notes:'Required in OH, IA, IN, MI shotgun zones. Excellent for 200-yard work.' },
  { cal:'.450 Bushmaster', use:'Deer (straight-wall states)', recoil:'Heavy', notes:'AR-platform option for Midwest straight-wall zones. Hard-hitting at close range.' },
]

const DRAW_DEADLINES = [
  { state:'Colorado',    species:'Deer/Elk',         deadline:'Early April', url:'https://cpw.state.co.us' },
  { state:'Wyoming',     species:'Deer/Elk/Antelope', deadline:'Jan–Feb',    url:'https://wgfd.wyo.gov' },
  { state:'Montana',     species:'Elk',              deadline:'March',       url:'https://myfwp.mt.gov' },
  { state:'Idaho',       species:'Deer/Elk/Bear',    deadline:'May 1–Jun 5', url:'https://idfg.idaho.gov' },
  { state:'Arizona',     species:'Deer/Elk/Bear',    deadline:'June',        url:'https://azgfd.com' },
  { state:'New Mexico',  species:'Deer/Elk',         deadline:'Jan–Feb',     url:'https://wildlife.state.nm.us' },
  { state:'Utah',        species:'Deer/Elk/Bear',    deadline:'February',    url:'https://wildlife.utah.gov' },
  { state:'Nevada',      species:'Deer/Bear',        deadline:'May',         url:'https://ndow.org' },
  { state:'Oregon',      species:'Deer/Elk',         deadline:'Mar–Apr',     url:'https://myodfw.com' },
  { state:'Iowa',        species:'Deer',             deadline:'July',        url:'https://iowadnr.gov' },
  { state:'Kansas',      species:'Deer (firearms)',  deadline:'May',         url:'https://ksoutdoors.com' },
]

const GEAR_ESSENTIALS = [
  { cat:'Optics', items:['Binoculars 8–10x42 (get quality glass)',  'Rangefinder (500+ yard)',  'Rifle scope 3-9x or 4-16x'] },
  { cat:'Clothing', items:['Merino wool base layers', 'Scent-control outer layer', 'Insulated waterproof boots', 'Blaze orange (check state requirement)'] },
  { cat:'Field Dressing', items:['Sharp skinning knife', 'Bone saw or Wyoming saw', 'Latex gloves (disease prevention)', 'Game bags to cool meat fast'] },
  { cat:'Navigation', items:['OnX Hunt app (offline maps)', 'Compass + topo map backup', 'GPS unit for spot marking'] },
  { cat:'Pack', items:['Daypack 2,500–3,500 cu in for day hunts', 'Frame pack 4,500+ cu in for backcountry', 'Pack cover (waterproof)'] },
  { cat:'Safety', items:['First aid kit with tourniquet', 'Emergency fire starter', 'Satellite communicator (Garmin inReach)', 'Hunter orange vest + hat'] },
]

export default async function HuntingPage({ searchParams }) {
  const tab   = searchParams?.tab   || 'seasons'
  const state = searchParams?.state || null
  const alerts = await fetchBreakingAlerts(5).catch(() => [])

  // Try to load fresh content from Sanity
  let huntingContent = []
  try {
    huntingContent = await sanity.fetch(
      `*[_type == "huntingContent"] | order(publishedAt desc) [0...20] {
        _id, title, category, body, publishedAt, slug
      }`
    )
  } catch {}

  const filteredStates = state
    ? STATE_SEASONS.filter(s => s.state === state || s.abbr === state)
    : STATE_SEASONS

  const TABS = [
    { key:'seasons',     label:'📅 Season Dates'    },
    { key:'game',        label:'🎯 Game Guides'      },
    { key:'cartridges',  label:'🔫 Cartridge Guide'  },
    { key:'draws',       label:'🎲 Draw Deadlines'   },
    { key:'gear',        label:'🎒 Gear Essentials'  },
  ]

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* HERO */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(34,197,94,0.08) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'45%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'15vw', color:'#22c55e', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>HUNT</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span style={{ background:'#22c55e', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>HUNTING</span>
              <span style={{ background:'rgba(34,197,94,.12)', color:'#22c55e', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, padding:'3px 10px', border:'1px solid rgba(34,197,94,.3)' }}>2025–2026 SEASONS</span>
              <span style={{ background:'var(--border)', color:'#9CA3AF', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, padding:'3px 10px' }}>ALL 50 STATES</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.4rem,5vw,3.8rem)', color:'var(--text)', letterSpacing:'0.04em', lineHeight:1, marginBottom:12 }}>
              HUNTING SEASONS,<br />
              <span style={{ color:'#22c55e' }}>SPECIES & STRATEGY</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'var(--text-dim)', lineHeight:1.7, maxWidth:560 }}>
              Season dates for deer, elk, turkey, bear, and waterfowl across all 50 states. Cartridge selection, draw deadlines, field skills, and the gear that actually matters.
            </p>
          </div>
        </div>
      </div>

      {/* STICKY TABS */}
      <div style={{ borderBottom:'1px solid var(--border)', background:'var(--bg2)', position:'sticky', top:60, zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none' }}>
            {TABS.map(t => (
              <Link key={t.key} href={`/hunting?tab=${t.key}`}
                style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700,
                  letterSpacing:'.06em', padding:'12px 18px', whiteSpace:'nowrap', textDecoration:'none',
                  color: tab === t.key ? '#000' : 'var(--text-dim)',
                  background: tab === t.key ? '#22c55e' : 'transparent',
                  borderBottom: tab === t.key ? '3px solid #22c55e' : '3px solid transparent' }}>
                {t.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'40px 0 80px', background:'var(--bg)' }}>
        <div className="container">

          {/* ── SEASONS TAB ── */}
          {tab === 'seasons' && (
            <div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>2025–2026 HUNTING SEASONS BY STATE</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6 }}>
                  Dates shown are general rifle/archery windows. Many states have overlapping archery, muzzleloader, and antlerless seasons. Always verify with your state wildlife agency before purchasing a license.
                </p>
              </div>

              {/* State filter */}
              <div style={{ overflowX:'auto', marginBottom:32 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid #22c55e' }}>
                      {['State','Deer','Turkey','Bear','Waterfowl','License (approx.)','Notes'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#22c55e', fontWeight:700, letterSpacing:'.06em', fontSize:10, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {STATE_SEASONS.map((s, i) => (
                      <tr key={s.abbr} style={{ borderBottom:'1px solid var(--border)', background: i%2===0 ? 'transparent' : 'rgba(255,255,255,.02)' }}>
                        <td style={{ padding:'8px 12px', color:'var(--gold)', fontWeight:700, whiteSpace:'nowrap' }}>{s.state}</td>
                        <td style={{ padding:'8px 12px', color:'var(--text)', whiteSpace:'nowrap' }}>{s.deer}</td>
                        <td style={{ padding:'8px 12px', color:'var(--text)', whiteSpace:'nowrap' }}>{s.turkey}</td>
                        <td style={{ padding:'8px 12px', color:'var(--text)', whiteSpace:'nowrap' }}>{s.bear}</td>
                        <td style={{ padding:'8px 12px', color:'var(--text)', whiteSpace:'nowrap' }}>{s.waterfowl}</td>
                        <td style={{ padding:'8px 12px', color:'#9CA3AF', whiteSpace:'nowrap' }}>{s.license}</td>
                        <td style={{ padding:'8px 12px', color:'#6B7280', fontSize:10, maxWidth:200 }}>{s.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={{ padding:'16px 20px', background:'rgba(34,197,94,.07)', border:'1px solid rgba(34,197,94,.2)' }}>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#22c55e', fontWeight:700 }}>⚠ VERIFY BEFORE YOU HUNT: </span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)' }}>Season dates change annually. Always confirm with your state wildlife agency before purchasing licenses or tags.</span>
              </div>
            </div>
          )}

          {/* ── GAME GUIDES TAB ── */}
          {tab === 'game' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:24 }}>NORTH AMERICAN GAME SPECIES GUIDE</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:16 }}>
                {GAME_TYPES.map(g => (
                  <div key={g.id} style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', borderTop:'3px solid #22c55e' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
                      <span style={{ fontSize:28 }}>{g.icon}</span>
                      <div>
                        <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--text)', letterSpacing:'.04em' }}>{g.name}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', letterSpacing:'.06em' }}>{g.range}</div>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, background:'rgba(34,197,94,.12)', color:'#22c55e', padding:'2px 8px', border:'1px solid rgba(34,197,94,.3)' }}>PEAK: {g.peak}</span>
                    </div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.6, marginBottom:12 }}>{g.tips}</div>
                    <div style={{ borderTop:'1px solid var(--border)', paddingTop:10 }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6B7280', marginBottom:6, letterSpacing:'.06em' }}>TOP CARTRIDGES</div>
                      <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {g.cartridges.map(c => (
                          <span key={c} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, background:'var(--bg2)', color:'var(--text-dim)', padding:'2px 6px', border:'1px solid var(--border)' }}>{c}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginTop:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563' }}>License: {g.license}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── CARTRIDGE TAB ── */}
          {tab === 'cartridges' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>HUNTING CARTRIDGE SELECTION GUIDE</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24 }}>Pick the cartridge for your game and terrain. For deer-sized game within 300 yards, almost any centerfire rifle will work. For elk at distance or in timber, energy and bullet construction matter more than caliber debates.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12 }}>
                {CARTRIDGE_GUIDE.map(c => (
                  <div key={c.cal} style={{ background:'#111318', border:'1px solid var(--border)', padding:'18px', borderLeft:'3px solid var(--gold)' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', letterSpacing:'.04em', marginBottom:4 }}>{c.cal}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#22c55e', marginBottom:6 }}>Best for: {c.use}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6B7280', marginBottom:8 }}>Recoil: {c.recoil}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.5 }}>{c.notes}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DRAWS TAB ── */}
          {tab === 'draws' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>DRAW DEADLINES — WESTERN BIG GAME</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24 }}>Western states use draw systems for elk, mule deer, pronghorn, and bear tags. Missing the application window means waiting another year. Mark these on your calendar now. Deadlines shift slightly year-to-year — verify with the state agency link.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12, marginBottom:32 }}>
                {DRAW_DEADLINES.map(d => (
                  <div key={d.state} style={{ background:'#111318', border:'1px solid var(--border)', padding:'18px', borderTop:'3px solid var(--gold)' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--gold)', letterSpacing:'.04em', marginBottom:4 }}>{d.state}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text)', marginBottom:4 }}>Species: {d.species}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#22c55e', fontWeight:700, marginBottom:10 }}>Deadline: {d.deadline}</div>
                    <a href={d.url} target="_blank" rel="noopener noreferrer"
                      style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--text-dim)', textDecoration:'underline' }}>
                      Official portal →
                    </a>
                  </div>
                ))}
              </div>
              <div style={{ padding:'20px', background:'rgba(200,146,42,.07)', border:'1px solid rgba(200,146,42,.25)' }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:'var(--gold)', marginBottom:8 }}>PREFERENCE POINT STRATEGY</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6 }}>
                  If you can't draw a tag this year, apply anyway and bank preference points. Colorado, Wyoming, Arizona, and Utah all use point systems — each unsuccessful application builds toward a future draw. For elk in top units, hunters accumulate 10–20 points before drawing. Start now.
                </div>
              </div>
            </div>
          )}

          {/* ── GEAR TAB ── */}
          {tab === 'gear' && (
            <div>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>HUNTING GEAR ESSENTIALS</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6, marginBottom:24 }}>Buy quality glass before a better rifle. Optics find game; rifles kill it. A $200 scope on a $800 rifle is a worse investment than a $600 scope on a $400 rifle. These are the categories where money makes a real difference.</p>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:16 }}>
                {GEAR_ESSENTIALS.map(g => (
                  <div key={g.cat} style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', borderTop:'3px solid var(--gold)' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--gold)', letterSpacing:'.04em', marginBottom:12 }}>{g.cat}</div>
                    <ul style={{ margin:0, padding:0, listStyle:'none', display:'flex', flexDirection:'column', gap:8 }}>
                      {g.items.map(item => (
                        <li key={item} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)', lineHeight:1.5, paddingLeft:12, position:'relative' }}>
                          <span style={{ position:'absolute', left:0, color:'#22c55e' }}>▸</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FRESH CONTENT FROM CRON */}
          {huntingContent.length > 0 && (
            <div style={{ marginTop:48 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--text)', letterSpacing:'.04em' }}>LATEST HUNTING INTEL</div>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:12 }}>
                {huntingContent.slice(0,6).map(post => (
                  <div key={post._id} style={{ background:'#111318', border:'1px solid var(--border)', padding:'18px' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#22c55e', letterSpacing:'.08em', marginBottom:6 }}>{post.category?.toUpperCase()}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'var(--text)', lineHeight:1.3, marginBottom:8 }}>{post.title}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563' }}>{post.publishedAt ? new Date(post.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}) : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
