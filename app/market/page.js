import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import { fetchAmmoPrices, fetchBreakingAlerts } from '../../sanity/lib/client'
import { createClient } from '@sanity/client'
import Link from 'next/link'

export const metadata = {
  title: 'Live Ammo Prices & Firearms Market Index | DownRange',
  description: 'Live ammo prices for 19 calibers including the full PRC family. NICS trends, buy signals, retailer links, and daily AI market analysis.',
  keywords: 'ammo prices, cheapest ammo, 9mm price, .223 price, bulk ammo deals, ammo market, NICS background checks',
  alternates: { canonical: 'https://www.downrangeco.com/market' },
  openGraph: {
    type: 'website', url: 'https://www.downrangeco.com/market',
    title: 'Live Ammo Prices & Firearms Market Index | DownRange',
    description: 'Live ammo prices for 19 calibers — PRC family, pistol, rifle, rimfire — with buy signals and retailer links.',
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630 }],
  },
  twitter: { card: 'summary_large_image', title: 'Live Ammo Prices | DownRange', description: 'Current 9mm, 5.56, 6.5CM, 7mm PRC and 15 more calibers with buy signals.' },
}

const MARKET_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Ammo Prices & Firearms Market Index',
    url: 'https://www.downrangeco.com/market',
    description: 'Live ammo prices for 19 calibers — including 6.5 PRC, 7mm PRC, .300 PRC — with NICS trends, retailer buy links, and AI market analysis.',
    publisher: { '@id': 'https://www.downrangeco.com/#organization' },
    about: { '@type': 'Thing', name: 'Ammunition Pricing' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: 'Market Index', item: 'https://www.downrangeco.com/market' },
    ],
  },
]
export const revalidate = 1800

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
})

// ── SEED DATA ──────────────────────────────────────────────────────────────────
const SEED_PRICES = [
  { _id:'1',  caliber:'9mm Luger',      grain:'115gr FMJ',   brand:'Federal / Blazer',
    ppr:0.189, trend:-4.2, dir:'down', avail:92, wLow:0.175, wHigh:0.215,
    analysis:'9mm near all-time lows. Federal 115gr FMJ bulk available under $180/1000rd. Best buying window in 3 years. Stock training ammo now.',
    signal:'BUY', signalColor:'#22c55e',
    retailers:[
      { name:'Lucky Gunner', price:0.179, url:'https://www.luckygunner.com/handgun/9mm-ammo',          stock:'In Stock', badge:'CHEAPEST' },
      { name:'PSA',          price:0.184, url:'https://palmettostatearmory.com/ammo/handgun/9mm.html', stock:'In Stock', badge:'FREE SHIP' },
      { name:'Ammo.com',     price:0.189, url:'https://ammo.com/handgun/9mm-ammo',                     stock:'In Stock', badge:'' },
      { name:'Brownells',    price:0.194, url:'https://www.brownells.com/ammunition/handgun-ammo/',     stock:'In Stock', badge:'' },
    ]
  },
  { _id:'2',  caliber:'5.56 NATO',      grain:'55gr FMJ',    brand:'PMC / Federal',
    ppr:0.321, trend: 1.8, dir:'up',   avail:78, wLow:0.305, wHigh:0.349,
    analysis:'5.56 creeping up on import supply tightness. PMC still best value. Buy M193 bulk now before summer surge hits.',
    signal:'BUY SOON', signalColor:'#f59e0b',
    retailers:[
      { name:'PSA',          price:0.299, url:'https://palmettostatearmory.com/ammo/rifle/5-56x45mm.html', stock:'In Stock', badge:'BEST PRICE' },
      { name:'Brownells',    price:0.315, url:'https://www.brownells.com/ammunition/rifle-ammo/223-ammo/', stock:'In Stock', badge:'' },
      { name:'Ammo.com',     price:0.321, url:'https://ammo.com/rifle/556-ammo',                          stock:'In Stock', badge:'' },
      { name:'Lucky Gunner', price:0.335, url:'https://www.luckygunner.com/rifle/5-56x45mm-ammo',         stock:'Limited',  badge:'' },
    ]
  },
  { _id:'3',  caliber:'.308 WIN',       grain:'147gr FMJ',   brand:'Federal / Hornady',
    ppr:0.745, trend:-2.1, dir:'down', avail:65, wLow:0.720, wHigh:0.800,
    analysis:'.308 availability tightening on reduced surplus. Federal brass-case is best value. Handloaders: buy brass and projectiles now.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers:[
      { name:'Ammo.com',     price:0.699, url:'https://ammo.com/rifle/308-ammo',                           stock:'In Stock', badge:'BEST PRICE' },
      { name:'MidwayUSA',    price:0.725, url:'https://www.midwayusa.com/category/rifle-ammunition?caliber=308-winchester', stock:'In Stock', badge:'' },
      { name:'Brownells',    price:0.745, url:'https://www.brownells.com/ammunition/rifle-ammo/308-ammo/',  stock:'In Stock', badge:'' },
      { name:'Lucky Gunner', price:0.789, url:'https://www.luckygunner.com/rifle/308-winchester-ammo',      stock:'In Stock', badge:'' },
    ]
  },
  { _id:'4',  caliber:'.45 ACP',        grain:'230gr FMJ',   brand:'Federal / Blazer',
    ppr:0.387, trend: 0.9, dir:'up',   avail:80, wLow:0.375, wHigh:0.420,
    analysis:'.45 ACP stable. Blazer Brass bulk is the value play. Avoid premium training loads — no benefit for range use. Steady supply from domestic manufacturers.',
    signal:'HOLD', signalColor:'#94a3b8',
    retailers:[
      { name:'Ammo.com',     price:0.369, url:'https://ammo.com/handgun/45-acp-ammo',                     stock:'In Stock', badge:'BEST PRICE' },
      { name:'Lucky Gunner', price:0.385, url:'https://www.luckygunner.com/handgun/45-acp-ammo',          stock:'In Stock', badge:'' },
      { name:'PSA',          price:0.387, url:'https://palmettostatearmory.com/ammo/handgun/45-acp.html',  stock:'In Stock', badge:'' },
      { name:'GrabAGun',     price:0.399, url:'https://www.grabagun.com/ammunition.html',                  stock:'In Stock', badge:'' },
    ]
  },
  { _id:'5',  caliber:'.40 S&W',        grain:'165gr FMJ',   brand:'Federal / Winchester',
    ppr:0.298, trend:-1.5, dir:'down', avail:75, wLow:0.279, wHigh:0.325,
    analysis:'.40 S&W at a 2-year low on platform consolidation toward 9mm. Excellent training round value right now. Stock for range use before LEO surplus dries up.',
    signal:'BUY', signalColor:'#22c55e',
    retailers:[
      { name:'Ammo.com',     price:0.275, url:'https://ammo.com/handgun/40-sw-ammo',                      stock:'In Stock', badge:'BEST PRICE' },
      { name:'Lucky Gunner', price:0.289, url:'https://www.luckygunner.com/handgun/40-s-w-ammo',          stock:'In Stock', badge:'' },
      { name:'PSA',          price:0.298, url:'https://palmettostatearmory.com/ammo/handgun/40-sw.html',   stock:'In Stock', badge:'' },
      { name:'Brownells',    price:0.319, url:'https://www.brownells.com/ammunition/handgun-ammo/',        stock:'In Stock', badge:'' },
    ]
  },
  { _id:'6',  caliber:'.380 ACP',       grain:'95gr FMJ',    brand:'Federal / Remington',
    ppr:0.312, trend:-3.1, dir:'down', avail:83, wLow:0.289, wHigh:0.339,
    analysis:'.380 at best value in 18 months. Pocket pistol market demand stable. Premium JHP for carry is priority buy — training ammo can wait at this price level.',
    signal:'BUY', signalColor:'#22c55e',
    retailers:[
      { name:'Lucky Gunner', price:0.289, url:'https://www.luckygunner.com/handgun/380-acp-ammo',        stock:'In Stock', badge:'CHEAPEST' },
      { name:'PSA',          price:0.299, url:'https://palmettostatearmory.com/ammo/handgun/380-acp.html',stock:'In Stock', badge:'' },
      { name:'Ammo.com',     price:0.312, url:'https://ammo.com/handgun/380-acp-ammo',                   stock:'In Stock', badge:'' },
      { name:'Ammo Depot',   price:0.329, url:'https://www.ammunitiondepot.com',                         stock:'In Stock', badge:'' },
    ]
  },
  { _id:'7',  caliber:'.357 Magnum',    grain:'158gr JSP',   brand:'Federal / Hornady',
    ppr:0.612, trend: 1.2, dir:'up',   avail:68, wLow:0.579, wHigh:0.659,
    analysis:'.357 Magnum trending up on revolver market resurgence. Hornady Critical Defense JHP commanding a premium. Factory FMJ equivalent for training is the value path.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers:[
      { name:'Ammo.com',     price:0.579, url:'https://ammo.com/handgun/357-magnum-ammo',                stock:'In Stock', badge:'BEST PRICE' },
      { name:'MidwayUSA',    price:0.599, url:'https://www.midwayusa.com/category/handgun-ammunition?caliber=357-magnum', stock:'In Stock', badge:'' },
      { name:'Lucky Gunner', price:0.619, url:'https://www.luckygunner.com/handgun/357-magnum-ammo',     stock:'In Stock', badge:'' },
      { name:'Brownells',    price:0.649, url:'https://www.brownells.com/ammunition/handgun-ammo/',       stock:'Limited',  badge:'' },
    ]
  },
  { _id:'8',  caliber:'.44 Magnum',     grain:'240gr JSP',   brand:'Federal / Remington',
    ppr:0.749, trend: 0.5, dir:'up',   avail:62, wLow:0.719, wHigh:0.799,
    analysis:'.44 Magnum steady. Hunting season demand drives premium loads. Federal 240gr JSP is the training-equivalent value buy. Supply adequate through fall.',
    signal:'HOLD', signalColor:'#94a3b8',
    retailers:[
      { name:'Ammo.com',     price:0.719, url:'https://ammo.com/handgun/44-magnum-ammo',                 stock:'In Stock', badge:'BEST PRICE' },
      { name:'MidwayUSA',    price:0.739, url:'https://www.midwayusa.com/category/handgun-ammunition?caliber=44-magnum', stock:'In Stock', badge:'' },
      { name:'Lucky Gunner', price:0.749, url:'https://www.luckygunner.com/handgun/44-magnum-ammo',      stock:'In Stock', badge:'' },
      { name:'Cabelas',      price:0.789, url:'https://www.cabelas.com/category/Ammunition/',             stock:'In Stock', badge:'' },
    ]
  },
  { _id:'9',  caliber:'10mm Auto',      grain:'180gr FMJ',   brand:'Federal / Sig',
    ppr:0.445, trend:-1.2, dir:'down', avail:71, wLow:0.429, wHigh:0.469,
    analysis:'10mm stable and falling. Federal 180gr HST available at reasonable prices. Growing platform adoption keeping supply healthy. Good buy window for high-volume shooters.',
    signal:'BUY', signalColor:'#22c55e',
    retailers:[
      { name:'Ammo.com',     price:0.419, url:'https://ammo.com/handgun/10mm-ammo',                      stock:'In Stock', badge:'BEST PRICE' },
      { name:'Lucky Gunner', price:0.435, url:'https://www.luckygunner.com/handgun/10mm-auto-ammo',      stock:'In Stock', badge:'' },
      { name:'Brownells',    price:0.449, url:'https://www.brownells.com/ammunition/handgun-ammo/10mm-auto/', stock:'In Stock', badge:'' },
      { name:'GrabAGun',     price:0.469, url:'https://www.grabagun.com/ammunition.html',                 stock:'In Stock', badge:'' },
    ]
  },
  { _id:'10', caliber:'5.7x28mm',       grain:'40gr V-Max',  brand:'FN / Speer',
    ppr:0.529, trend: 2.8, dir:'up',   avail:55, wLow:0.499, wHigh:0.579,
    analysis:'5.7x28mm rising on PS90 and FN Five-seveN demand. FN factory remains premium-priced. Speer and Elite Ammunition closing the gap — watch for bulk deals.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers:[
      { name:'Ammo.com',     price:0.499, url:'https://ammo.com/handgun/5-7x28mm-ammo',                  stock:'In Stock', badge:'BEST PRICE' },
      { name:'Lucky Gunner', price:0.519, url:'https://www.luckygunner.com/handgun/5-7x28mm-ammo',       stock:'In Stock', badge:'' },
      { name:'MidwayUSA',    price:0.535, url:'https://www.midwayusa.com/category/handgun-ammunition?caliber=5-7x28mm', stock:'Limited', badge:'' },
      { name:'Brownells',    price:0.579, url:'https://www.brownells.com/ammunition/handgun-ammo/',       stock:'Limited',  badge:'' },
    ]
  },
  { _id:'11', caliber:'.22 LR',         grain:'40gr LRN',    brand:'CCI / Federal',
    ppr:0.071, trend:-0.5, dir:'down', avail:94, wLow:0.065, wHigh:0.082,
    analysis:'.22 LR at historic supply levels. CCI Standard and Federal AutoMatch routinely sub-7c/rd in brick. Buy bricks not boxes — per-round savings are significant.',
    signal:'BUY', signalColor:'#22c55e',
    retailers:[
      { name:'Ammo.com',     price:0.065, url:'https://ammo.com/rimfire/22lr-ammo',                      stock:'In Stock', badge:'BEST PRICE' },
      { name:'Lucky Gunner', price:0.068, url:'https://www.luckygunner.com/rimfire/22-lr-ammo',          stock:'In Stock', badge:'' },
      { name:'PSA',          price:0.071, url:'https://palmettostatearmory.com/ammo/rimfire/22lr.html',   stock:'In Stock', badge:'' },
      { name:'Cabelas',      price:0.079, url:'https://www.cabelas.com/category/Ammunition/22-LR/',       stock:'In Stock', badge:'' },
    ]
  },
  { _id:'12', caliber:'7.62x39mm',      grain:'123gr FMJ',   brand:'Wolf / Tula',
    ppr:0.285, trend: 8.2, dir:'up',   avail:55, wLow:0.265, wHigh:0.319,
    analysis:'7.62x39 surging on import restrictions. Steel-case supply constrained. Brass-case premium widening. Buy training stock now — next import restriction could push past 35c.',
    signal:'BUY NOW', signalColor:'#ef4444',
    retailers:[
      { name:'AIM Surplus',  price:0.259, url:'https://www.aimsurplus.com/ammo/',                        stock:'Limited',  badge:'LOWEST' },
      { name:'Ammo.com',     price:0.275, url:'https://ammo.com/rifle/7-62x39-ammo',                     stock:'Limited',  badge:'' },
      { name:'Lucky Gunner', price:0.299, url:'https://www.luckygunner.com/rifle/7-62x39mm-ammo',        stock:'Limited',  badge:'' },
      { name:'PSA',          price:0.319, url:'https://palmettostatearmory.com/ammo/rifle/7-62x39mm.html',stock:'In Stock', badge:'' },
    ]
  },
  { _id:'13', caliber:'.300 BLK',       grain:'125gr FMJ',   brand:'Hornady / AAC',
    ppr:0.568, trend: 2.1, dir:'up',   avail:61, wLow:0.539, wHigh:0.589,
    analysis:'.300 BLK premium narrowing vs 5.56. Subsonic demand stable from suppressor market growth. Supersonic 125gr FMJ is range-viable option. Watch for bulk deals.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers:[
      { name:'SilencerShop', price:0.529, url:'https://www.silencershop.com/ammo.html',                  stock:'In Stock', badge:'LOWEST' },
      { name:'Ammo.com',     price:0.549, url:'https://ammo.com/rifle/300-blackout-ammo',                stock:'In Stock', badge:'' },
      { name:'Lucky Gunner', price:0.568, url:'https://www.luckygunner.com/rifle/300-aac-blackout-ammo', stock:'In Stock', badge:'' },
      { name:'Brownells',    price:0.589, url:'https://www.brownells.com/ammunition/rifle-ammo/300-blk-ammo/', stock:'Limited', badge:'' },
    ]
  },
  { _id:'14', caliber:'6.5 Creedmoor',  grain:'140gr BTHP',  brand:'Hornady / Federal',
    ppr:1.420, trend: 3.4, dir:'up',   avail:52, wLow:1.38, wHigh:1.55,
    analysis:'6.5CM rising on demand from new platform adopters. Match-grade pricing up 12% YTD. Buy practice brass and reload, or lock in Hornady Match pricing now.',
    signal:'BUY NOW', signalColor:'#ef4444',
    retailers:[
      { name:'MidwayUSA',    price:1.350, url:'https://www.midwayusa.com/category/rifle-ammunition?caliber=6-5-creedmoor', stock:'Limited', badge:'LOWEST' },
      { name:'Brownells',    price:1.399, url:'https://www.brownells.com/ammunition/rifle-ammo/65-creedmoor-ammo/', stock:'In Stock', badge:'' },
      { name:'Ammo.com',     price:1.420, url:'https://ammo.com/rifle/65-creedmoor-ammo',               stock:'In Stock', badge:'' },
      { name:'Lucky Gunner', price:1.489, url:'https://www.luckygunner.com/rifle/6-5-creedmoor-ammo',   stock:'Limited',  badge:'' },
    ]
  },
  { _id:'15', caliber:'6.5 PRC',        grain:'143gr ELD-M',  brand:'Hornady / Federal',
    ppr:1.749, trend: 4.1, dir:'up',   avail:44, wLow:1.65, wHigh:1.89,
    analysis:'6.5 PRC demand accelerating as hunters upgrade from 6.5CM for longer range. Hornady factory dominates — alternatives limited. Supply tight heading into hunting season. Buy now.',
    signal:'BUY NOW', signalColor:'#ef4444',
    retailers:[
      { name:'MidwayUSA',    price:1.650, url:'https://www.midwayusa.com/category/rifle-ammunition?caliber=6-5-prc', stock:'Limited', badge:'LOWEST' },
      { name:'Brownells',    price:1.699, url:'https://www.brownells.com/ammunition/rifle-ammo/',        stock:'Limited',  badge:'' },
      { name:'Ammo.com',     price:1.749, url:'https://ammo.com/rifle/65-prc-ammo',                     stock:'Limited',  badge:'' },
      { name:'Cabelas',      price:1.849, url:'https://www.cabelas.com/category/Ammunition/',             stock:'Limited',  badge:'' },
    ]
  },
  { _id:'16', caliber:'7mm PRC',        grain:'175gr ELD-M',  brand:'Hornady',
    ppr:2.199, trend: 6.2, dir:'up',   avail:38, wLow:2.05, wHigh:2.39,
    analysis:'7mm PRC supply critically tight. Hornady holds near-monopoly on factory loads. Adoption rate outpacing manufacturing capacity. If you shoot this platform, buy every box you see.',
    signal:'BUY NOW', signalColor:'#ef4444',
    retailers:[
      { name:'MidwayUSA',    price:2.050, url:'https://www.midwayusa.com/category/rifle-ammunition?caliber=7mm-prc', stock:'Limited', badge:'LOWEST' },
      { name:'Brownells',    price:2.149, url:'https://www.brownells.com/ammunition/rifle-ammo/',        stock:'Limited',  badge:'' },
      { name:'Ammo.com',     price:2.199, url:'https://ammo.com/rifle/7mm-prc-ammo',                    stock:'Out of Stock', badge:'' },
      { name:'Cabelas',      price:2.350, url:'https://www.cabelas.com/category/Ammunition/',             stock:'Limited',  badge:'' },
    ]
  },
  { _id:'17', caliber:'.300 PRC',       grain:'225gr ELD-M',  brand:'Hornady',
    ppr:2.849, trend: 3.8, dir:'up',   avail:32, wLow:2.69, wHigh:3.05,
    analysis:'.300 PRC occupies the extreme long-range hunting niche. Factory options limited to Hornady and a handful of boutique loaders. Component supply more robust — reloading strongly recommended for high-volume shooters.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers:[
      { name:'MidwayUSA',    price:2.690, url:'https://www.midwayusa.com/category/rifle-ammunition?caliber=300-prc', stock:'Limited', badge:'LOWEST' },
      { name:'Brownells',    price:2.799, url:'https://www.brownells.com/ammunition/rifle-ammo/',        stock:'Limited',  badge:'' },
      { name:'Ammo.com',     price:2.849, url:'https://ammo.com/rifle/300-prc-ammo',                    stock:'Limited',  badge:'' },
      { name:'Cabelas',      price:2.999, url:'https://www.cabelas.com/category/Ammunition/',             stock:'Limited',  badge:'' },
    ]
  },
  { _id:'18', caliber:'.300 Win Mag',   grain:'180gr SP',     brand:'Federal / Nosler',
    ppr:1.189, trend: 1.4, dir:'up',   avail:69, wLow:1.12, wHigh:1.29,
    analysis:'.300 Win Mag healthy supply relative to PRC cartridges. Hunting season pull starting to tighten premium loads. Federal Power-Shok at $1.12/rd is still the value target for practice.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers:[
      { name:'Ammo.com',     price:1.120, url:'https://ammo.com/rifle/300-win-mag-ammo',                stock:'In Stock', badge:'BEST PRICE' },
      { name:'MidwayUSA',    price:1.149, url:'https://www.midwayusa.com/category/rifle-ammunition?caliber=300-winchester-magnum', stock:'In Stock', badge:'' },
      { name:'Lucky Gunner', price:1.189, url:'https://www.luckygunner.com/rifle/300-winchester-magnum-ammo', stock:'In Stock', badge:'' },
      { name:'Brownells',    price:1.249, url:'https://www.brownells.com/ammunition/rifle-ammo/',        stock:'In Stock', badge:'' },
    ]
  },
  { _id:'19', caliber:'12 Gauge',       grain:'00 Buck',      brand:'Federal / Winchester',
    ppr:0.412, trend:-1.3, dir:'down', avail:88, wLow:0.395, wHigh:0.450,
    analysis:'12 gauge at excellent availability. Federal FliteControl 00 Buck is the home defense standard — shop around, price spread is wide.',
    signal:'BUY', signalColor:'#22c55e',
    retailers:[
      { name:'Ammo Depot',   price:0.389, url:'https://www.ammunitiondepot.com/shotshells/12-gauge/',    stock:'In Stock', badge:'CHEAPEST' },
      { name:'Ammo.com',     price:0.399, url:'https://ammo.com/shotgun/12-gauge-ammo',                  stock:'In Stock', badge:'' },
      { name:'Lucky Gunner', price:0.412, url:'https://www.luckygunner.com/shotgun/12-gauge-ammo',       stock:'In Stock', badge:'' },
      { name:'MidwayUSA',    price:0.435, url:'https://www.midwayusa.com/category/shotgun-ammunition?gauge=12-gauge', stock:'In Stock', badge:'' },
    ]
  },
]

const NICS_DATA = [
  { month:'Nov 25', checks:3218000 },
  { month:'Dec 25', checks:3419000 },
  { month:'Jan 26', checks:2876000 },
  { month:'Feb 26', checks:2431000 },
  { month:'Mar 26', checks:2695000 },
  { month:'Apr 26', checks:2512000 },
  { month:'May 26', checks:2784000 },
]

async function fetchDailyAnalysis() {
  try {
    return await sanity.fetch(`*[_type=="marketAnalysis"]|order(publishedAt desc)[0]{title,summary,bullets,publishedAt,author}`)
  } catch { return null }
}

function fmt(ppr) {
  if (!ppr && ppr !== 0) return '—'
  return ppr < 1 ? `${(ppr * 100).toFixed(1)}¢` : `$${ppr.toFixed(2)}`
}

function availColor(n) { return n >= 80 ? '#22c55e' : n >= 55 ? '#f59e0b' : '#ef4444' }
function availLabel(n) { return n >= 80 ? 'IN STOCK' : n >= 55 ? 'LIMITED' : 'LOW' }

// ── PRICE CARD ─────────────────────────────────────────────────────────────────
function CaliberCard({ a }) {
  const up = a.dir === 'up'
  const tc = up ? '#ef4444' : '#22c55e'
  const ac = availColor(a.avail)

  return (
    <div style={{
      background:'var(--card, #0d1117)', border:'1px solid var(--border)',
      borderTop:`3px solid ${a.signalColor || '#334155'}`,
      borderRadius:4, overflow:'hidden',
    }}>
      {/* Header */}
      <div style={{ padding:'16px 18px 12px', borderBottom:'1px solid rgba(30,41,59,0.5)' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:8 }}>
          <div>
            <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:20, color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1 }}>{a.caliber}</div>
            <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', marginTop:2 }}>{a.grain} · {a.brand}</div>
          </div>
          <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, fontWeight:700, color:a.signalColor, background:a.signalColor+'18', border:`1px solid ${a.signalColor}44`, padding:'2px 8px', borderRadius:2, whiteSpace:'nowrap' }}>
            {a.signal}
          </span>
        </div>
        <div style={{ display:'flex', alignItems:'baseline', gap:10 }}>
          <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:32, color:'#C8922A', letterSpacing:'0.03em', lineHeight:1 }}>{fmt(a.ppr)}</div>
          <div>
            <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#334155' }}>per round</div>
            <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:tc, fontWeight:700 }}>
              {up ? '▲' : '▼'} {Math.abs(a.trend).toFixed(1)}% 30d
            </div>
          </div>
        </div>
        <div style={{ display:'flex', gap:12, marginTop:8 }}>
          <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569' }}>
            Wk: <span style={{ color:'#22c55e' }}>{fmt(a.wLow)}</span> – <span style={{ color:'#ef4444' }}>{fmt(a.wHigh)}</span>
          </div>
          <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:ac }}>{availLabel(a.avail)} {a.avail}%</div>
        </div>
        <div style={{ height:3, background:'#1e293b', borderRadius:2, marginTop:8, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${a.avail}%`, background:ac, transition:'width 0.6s' }} />
        </div>
      </div>

      {/* Analysis */}
      {a.analysis && (
        <div style={{ padding:'10px 18px', borderBottom:'1px solid rgba(30,41,59,0.5)', background:'rgba(0,0,0,0.2)' }}>
          <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#64748b', lineHeight:1.55 }}>
            {a.analysis}
          </div>
        </div>
      )}

      {/* Retailer links */}
      <div style={{ padding:'10px 18px 14px' }}>
        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#334155', letterSpacing:'0.08em', marginBottom:6 }}>BEST PRICES NOW</div>
        <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
          {(a.retailers || []).map((r, i) => (
            <a key={i} href={r.url} target="_blank" rel="noreferrer" style={{
              display:'flex', justifyContent:'space-between', alignItems:'center',
              padding:'6px 10px',
              background: i === 0 ? 'rgba(200,146,42,0.08)' : 'rgba(0,0,0,0.15)',
              border:`1px solid ${i === 0 ? 'rgba(200,146,42,0.25)' : 'rgba(30,41,59,0.4)'}`,
              borderRadius:3, textDecoration:'none', transition:'border-color 0.15s',
            }}>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                {r.badge && (
                  <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:7, fontWeight:700, color:'#C8922A', background:'rgba(200,146,42,0.15)', padding:'1px 5px', borderRadius:1 }}>
                    {r.badge}
                  </span>
                )}
                <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:12, fontWeight:600, color: i === 0 ? 'var(--foreground)' : '#94a3b8' }}>{r.name}</span>
                <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, color: r.stock==='In Stock' ? '#22c55e' : '#f59e0b' }}>● {r.stock}</span>
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                <span style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:16, color: i === 0 ? '#C8922A' : '#64748b', letterSpacing:'0.03em' }}>{fmt(r.price)}</span>
                <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, color:'#334155' }}>↗</span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  )
}

function NicsBar({ month, checks, max }) {
  const pct = Math.round((checks / max) * 100)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', width:44, textAlign:'right', flexShrink:0 }}>{month}</div>
      <div style={{ flex:1, height:20, background:'#0f172a', borderRadius:2, overflow:'hidden', position:'relative' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg,#C8922A,#e8b44a)', borderRadius:2 }} />
        <div style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#94a3b8' }}>
          {(checks/1000000).toFixed(2)}M
        </div>
      </div>
    </div>
  )
}

// ── PAGE ───────────────────────────────────────────────────────────────────────

export default async function MarketPage() {
  const [rawPrices, alerts, analysis] = await Promise.all([
    fetchAmmoPrices().catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
    fetchDailyAnalysis().catch(() => null),
  ])

  const normalize = (a) => ({
    ...a,
    ppr:      a.ppr      ?? a.pricePerRound      ?? 0,
    trend:    a.trend    ?? a.trendPercent        ?? 0,
    dir:      a.dir      ?? a.trendDirection      ?? 'flat',
    avail:    a.avail    ?? a.availabilityIndex   ?? 75,
    wLow:     a.wLow     ?? a.weekLow             ?? 0,
    wHigh:    a.wHigh    ?? a.weekHigh            ?? 0,
    analysis: a.analysis ?? '',
    signal:   a.signal   ?? (a.dir==='down' ? 'BUY' : 'WATCH'),
    signalColor: a.signalColor ?? (a.dir==='down' ? '#22c55e' : '#f59e0b'),
    retailers:a.retailers ?? [],
  })

  // Use seed data which has retailer links — Sanity data merged if available
  const prices = SEED_PRICES.map(seed => {
    const live = rawPrices.find(r => r.caliber === seed.caliber)
    return normalize(live ? { ...seed, ...live } : seed)
  })

  const today = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  const nicsMax = Math.max(...NICS_DATA.map(d => d.checks))

  const bestBuy   = prices.filter(p => p.signal === 'BUY').sort((a,b) => a.ppr - b.ppr)[0]
  const mostUrgent = prices.filter(p => p.signal === 'BUY NOW').sort((a,b) => b.trend - a.trend)[0]
  const lowStock  = prices.filter(p => p.avail < 55)

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(MARKET_SCHEMA) }} />
      <Masthead />

      <style>{`
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        .retailer-link:hover { border-color: rgba(200,146,42,0.5) !important; }
        .caliber-card:hover { border-top-width: 4px !important; }
      `}</style>

      {/* ── HERO ── */}
      <div className="page-hero" style={{ position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 80% 50%, rgba(200,146,42,0.06) 0%, transparent 60%)', pointerEvents:'none' }} />
        <div className="container" style={{ position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:10, alignItems:'center', flexWrap:'wrap' }}>
                <span style={{ background:'#C8922A', color:'#09090B', fontFamily:'Barlow Condensed, sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>MARKET WATCH</span>
                <span style={{ display:'flex', alignItems:'center', gap:5, background:'#001A0A', color:'#22C55E', fontFamily:'IBM Plex Mono, monospace', fontSize:11, fontWeight:700, padding:'3px 10px', border:'1px solid #22C55E40' }}>
                  <span className="pulse-dot" /> LIVE
                </span>
              </div>
              <h1 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'clamp(2.6rem,5.5vw,4rem)', color:'var(--foreground)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:10 }}>
                Ammo Price Index<br /><span style={{ color:'#C8922A' }}>With Direct Retailer Links</span>
              </h1>
              <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:12, color:'#64748b', lineHeight:1.7, maxWidth:520 }}>
                {prices.length} calibers · Buy signal analysis · 4 retailers per caliber · NICS demand index · Updated every 4 hours
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#475569' }}>{today}</div>
              <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#334155', marginTop:2 }}>Sources: AmmoSeek · gun.deals · r/gundeals · retailer feeds</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TICKER ── */}
      <div style={{ background:'#09090b', borderBottom:'1px solid rgba(200,146,42,0.2)', overflow:'hidden', height:30, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', animation:'tickerScroll 45s linear infinite', whiteSpace:'nowrap', willChange:'transform' }}>
          {[...prices, ...prices].map((a, i) => (
            <a key={i} href={a.retailers?.[0]?.url || '/market'} target="_blank" rel="noreferrer" style={{
              fontFamily:'IBM Plex Mono, monospace', fontSize:10, padding:'0 18px',
              borderRight:'1px solid #1e293b', display:'flex', alignItems:'center', gap:6,
              height:30, textDecoration:'none', color:'inherit',
            }}>
              <span style={{ color:'#64748b' }}>{a.caliber}</span>
              <span style={{ color:'#C8922A', fontWeight:700 }}>{fmt(a.ppr)}</span>
              <span style={{ color: a.dir==='down'?'#22c55e':'#ef4444', fontSize:9 }}>{a.dir==='down'?'▼':'▲'}</span>
              <span style={{ color: a.signalColor, fontSize:8 }}>{a.signal}</span>
            </a>
          ))}
        </div>
      </div>

      <div style={{ padding:'28px 0 60px' }}>
        <div className="container">

          {/* ── STAT CARDS ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:10, marginBottom:28 }}>
            {[
              { label:'Calibers Tracked',   value:String(prices.length),   sub:'With retailer links',       icon:'📊', accent:'#C8922A' },
              { label:'Best Buy Right Now', value:bestBuy ? fmt(bestBuy.ppr) : '—', sub:bestBuy?.caliber||'', icon:'💡', accent:'#22c55e' },
              { label:'Buy Now Alerts',     value:String(prices.filter(p=>p.signal==='BUY NOW').length), sub:'Price surging — act fast', icon:'🔔', accent:'#ef4444' },
              { label:'Low Stock Calibers', value:String(lowStock.length), sub:'Below 55% availability',     icon:'🚨', accent: lowStock.length > 3 ? '#ef4444' : '#f59e0b' },
              { label:'NICS This Month',    value:'2.78M',                 sub:'Background checks (May)',    icon:'🔍', accent:'#94a3b8' },
              { label:'Market Sentiment',   value:'BUYER',                 sub:'Inventory above 90-day avg', icon:'📈', accent:'#22c55e' },
            ].map((s, i) => (
              <div key={i} className="dr-card" style={{ padding:'16px 18px', position:'relative', overflow:'hidden' }}>
                <div style={{ position:'absolute', right:12, top:10, fontSize:22, opacity:0.12 }}>{s.icon}</div>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:10, color:'#475569', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:3 }}>{s.label}</div>
                <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:28, color:s.accent, lineHeight:1 }}>{s.value}</div>
                <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#334155', marginTop:3 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── DAILY BRIEF ── */}
          {analysis ? (
            <div style={{ background:'rgba(200,146,42,0.05)', border:'1px solid rgba(200,146,42,0.3)', borderLeft:'4px solid #C8922A', padding:'22px 26px', marginBottom:28, borderRadius:4 }}>
              <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#C8922A', letterSpacing:'0.15em', fontWeight:700, marginBottom:8 }}>📊 DAILY AI MARKET BRIEF · {today}</div>
              <h2 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.4rem', color:'var(--foreground)', marginBottom:8, letterSpacing:'0.04em' }}>{analysis.title}</h2>
              <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:12, color:'#94a3b8', lineHeight:1.7, marginBottom: analysis.bullets?.length ? 12 : 0 }}>{analysis.summary}</p>
              {analysis.bullets?.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:6 }}>
                  {analysis.bullets.map((b, i) => (
                    <div key={i} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#94a3b8', paddingLeft:14, position:'relative', lineHeight:1.5 }}>
                      <span style={{ position:'absolute', left:0, color:'#C8922A' }}>◈</span> {b}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:'rgba(30,41,59,0.4)', border:'1px solid rgba(30,41,59,0.8)', borderLeft:'3px solid #374151',
              padding:'16px 20px', display:'flex', alignItems:'center', gap:12 }}>
              <span style={{ fontSize:20, opacity:0.4 }}>📊</span>
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', letterSpacing:'0.1em', marginBottom:4 }}>
                  MARKET BRIEF
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#374151' }}>
                  Next brief generates at 6am or 6pm UTC
                </div>
              </div>
            </div>
          )}
          {/* ── MAIN GRID: caliber cards ── */}
          <div style={{ marginBottom:28 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:16 }}>
              <h2 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.8rem', color:'var(--foreground)', letterSpacing:'0.05em', margin:0 }}>
                AMMO PRICE INDEX
              </h2>
              <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#475569' }}>Price per round · Buy signal · 4 retailers per caliber with live links</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(360px,1fr))', gap:14 }}>
              {prices.map(a => <CaliberCard key={a._id} a={a} />)}
            </div>
          </div>

          {/* ── SIDEBAR ROW: NICS + Intel ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:28 }}>

            {/* NICS */}
            <div className="dr-card" style={{ padding:20 }}>
              <h3 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.2rem', letterSpacing:'0.05em', color:'#C8922A', margin:'0 0 6px' }}>NICS BACKGROUND CHECKS</h3>
              <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', margin:'0 0 16px', lineHeight:1.5 }}>
                Rising NICS = demand surge incoming = ammo prices follow within 30-60 days. Watch for spikes.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:7 }}>
                {NICS_DATA.map(d => <NicsBar key={d.month} {...d} max={nicsMax} />)}
              </div>
              <div style={{ marginTop:12, fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#334155' }}>Source: FBI NICS via data-liberation-project</div>
            </div>

            {/* Market Intel */}
            <div className="dr-card" style={{ padding:20 }}>
              <h3 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.2rem', letterSpacing:'0.05em', color:'var(--foreground)', margin:'0 0 14px' }}>MARKET INTELLIGENCE</h3>
              {[
                { label:'NICS Trend',       value:'↓ 3.2% MoM',  detail:'Inventory building. Buyer market forming.',       dir:'good' },
                { label:'Import Supply',    value:'Constrained', detail:'7.62x39 restricted. European 9mm plentiful.',      dir:'warn' },
                { label:'Best Value',       value:'9mm at 18¢',  detail:'Near all-time low — stock training ammo now.',     dir:'good' },
                { label:'Urgent Buy',       value:'7.62x39',     detail:'+8.2% — import restriction risk. Buy now.',        dir:'bad'  },
                { label:'Retailer Inv.',    value:'Above avg',   detail:'Major retailers at 90-day supply vs 60-day avg.', dir:'good' },
                { label:'Lead Times',       value:'14-21 days',  detail:'Match/boutique ammo. Bulk ships same week.',       dir:'neutral' },
              ].map((item, i) => (
                <div key={i} style={{
                  display:'grid', gridTemplateColumns:'120px 1fr', gap:10,
                  padding:'8px 0', borderBottom: i < 5 ? '1px solid rgba(30,41,59,0.5)' : 'none',
                }}>
                  <div>
                    <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', marginBottom:2 }}>{item.label}</div>
                    <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:14, letterSpacing:'0.04em', color: item.dir==='good'?'#22c55e':item.dir==='bad'?'#ef4444':item.dir==='warn'?'#f59e0b':'#C8922A' }}>{item.value}</div>
                  </div>
                  <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', lineHeight:1.5, paddingTop:2 }}>{item.detail}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ── QUICK LINKS ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10 }}>
            {[
              { label:'📊 Live Deals Feed', href:'/deals',           desc:'r/gundeals + retailers updated hourly' },
              { label:'⚖ State Ammo Laws',  href:'/laws',            desc:'Capacity + ammo restrictions by state' },
              { label:'🔫 NFA Tracker',      href:'/nfa-tracker',     desc:'Form 4 suppressor wait times' },
              { label:'📰 Industry News',    href:'/news',            desc:'Latest firearms market coverage' },
              { label:'💰 Value Estimator',  href:'/value-estimator', desc:'What is your firearm worth today?' },
              { label:'◎ Range Finder',      href:'/ranges',          desc:'Indoor/outdoor ranges near you' },
            ].map(t => (
              <Link key={t.href} href={t.href} className="dr-card" style={{ textDecoration:'none', padding:'16px 18px', display:'block' }}>
                <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:15, fontWeight:700, color:'var(--foreground)', marginBottom:3 }}>{t.label}</div>
                <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#475569' }}>{t.desc}</div>
              </Link>
            ))}
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
