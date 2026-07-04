import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import MarketClient from './MarketClient'
import { fetchAmmoPrices, fetchBreakingAlerts } from '../../sanity/lib/client'
import { createClient } from '@sanity/client'

export const metadata = {
  title: 'Live Ammo Prices & Firearms Market Index | DownRange',
  description: 'Live ammo prices for 19 calibers including the full PRC family. Buy signal analysis, retailer links, NICS trends, and daily AI market briefs.',
  keywords: 'ammo prices, cheapest ammo, 9mm price, 6.5 PRC price, 7mm PRC price, bulk ammo deals, ammo market, NICS background checks',
  alternates: { canonical: 'https://www.downrangeco.com/market' },
  openGraph: {
    type: 'website', url: 'https://www.downrangeco.com/market',
    title: 'Live Ammo Prices & Firearms Market Index | DownRange',
    description: 'Live ammo prices for 19 calibers with buy signals, NICS trends, and direct retailer links.',
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630 }]
  },
  twitter: { card: 'summary_large_image', title: 'Live Ammo Prices | DownRange', description: 'Current 9mm, 5.56, 6.5CM, 7mm PRC and 15 more calibers with buy signals and retailer links.' }
  }

const MARKET_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Ammo Prices & Firearms Market Index',
    url: 'https://www.downrangeco.com/market',
    description: 'Live ammo prices for 19 calibers with NICS background check trends, retailer buy links, and AI market analysis.',
    publisher: { '@id': 'https://www.downrangeco.com/#organization' },
    about: { '@type': 'Thing', name: 'Ammunition Pricing' }
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: 'Market Index', item: 'https://www.downrangeco.com/market' },
    ]
  },
]

export const revalidate = 14400

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true
  })

async function fetchDailyAnalysis() {
  try {
    return await sanity.fetch(`*[_type=="marketAnalysis"]|order(publishedAt desc)[0]{title,summary,bullets,publishedAt,signal,signalReason}`)
  } catch { return null }
}

// ── SEED DATA ──────────────────────────────────────────────────────────────────
export const SEED_PRICES = [
  { _id:'1',  caliber:'9mm Luger',  caliberSlug:'9mm',      cat:'pistol',   grain:'115gr FMJ',   brand:'Federal / Blazer',
    ppr:0.189, trend:-4.2, dir:'down', avail:92, wLow:0.175, wHigh:0.215,
    analysis:'Near all-time lows. Federal 115gr FMJ bulk available under $180/1000rd. Best buying window in 3 years.',
    signal:'BUY', signalColor:'#22c55e',
    retailers: []
  },
  { _id:'2',  caliber:'5.56 NATO',  caliberSlug:'223-remington',      cat:'rifle',    grain:'55gr FMJ',    brand:'PMC / Federal',
    ppr:0.321, trend: 1.8, dir:'up',   avail:78, wLow:0.305, wHigh:0.349,
    analysis:'Creeping up on import supply tightness. PMC still best value. Buy M193 bulk now before summer surge hits.',
    signal:'BUY SOON', signalColor:'#f59e0b',
    retailers: []
  },
  { _id:'3',  caliber:'.308 WIN',  caliberSlug:'308-winchester',       cat:'rifle',    grain:'147gr FMJ',   brand:'Federal / Hornady',
    ppr:0.745, trend:-2.1, dir:'down', avail:65, wLow:0.720, wHigh:0.800,
    analysis:'Availability tightening on reduced surplus. Federal brass-case best value. Handloaders: buy brass and projectiles now.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers: []
  },
  { _id:'4',  caliber:'.45 ACP',  caliberSlug:'45-acp',        cat:'pistol',   grain:'230gr FMJ',   brand:'Federal / Blazer',
    ppr:0.387, trend: 0.9, dir:'up',   avail:80, wLow:0.375, wHigh:0.420,
    analysis:'Stable. Blazer Brass bulk is the value play. Steady supply from domestic manufacturers.',
    signal:'HOLD', signalColor:'#94a3b8',
    retailers: []
  },
  { _id:'5',  caliber:'.40 S&W',  caliberSlug:'40-sw',        cat:'pistol',   grain:'165gr FMJ',   brand:'Federal / Winchester',
    ppr:0.298, trend:-1.5, dir:'down', avail:75, wLow:0.279, wHigh:0.325,
    analysis:'2-year low on platform consolidation toward 9mm. Excellent training value right now.',
    signal:'BUY', signalColor:'#22c55e',
    retailers: []
  },
  { _id:'6',  caliber:'.380 ACP',  caliberSlug:'380-acp',       cat:'pistol',   grain:'95gr FMJ',    brand:'Federal / Remington',
    ppr:0.312, trend:-3.1, dir:'down', avail:83, wLow:0.289, wHigh:0.339,
    analysis:'Best value in 18 months. Stock premium JHP for carry first — training ammo can wait.',
    signal:'BUY', signalColor:'#22c55e',
    retailers: []
  },
  { _id:'7',  caliber:'.357 Magnum',  caliberSlug:'357-magnum',    cat:'pistol',   grain:'158gr JSP',   brand:'Federal / Hornady',
    ppr:0.612, trend: 1.2, dir:'up',   avail:68, wLow:0.579, wHigh:0.659,
    analysis:'Trending up on revolver market resurgence. Factory FMJ equivalent for training is the value path.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers: []
  },
  { _id:'8',  caliber:'.44 Magnum',  caliberSlug:'44-magnum',     cat:'pistol',   grain:'240gr JSP',   brand:'Federal / Remington',
    ppr:0.749, trend: 0.5, dir:'up',   avail:62, wLow:0.719, wHigh:0.799,
    analysis:'Steady. Hunting season demand drives premium loads. Federal 240gr JSP is the training-equivalent value buy.',
    signal:'HOLD', signalColor:'#94a3b8',
    retailers: []
  },
  { _id:'9',  caliber:'10mm Auto',  caliberSlug:'10mm-auto',      cat:'pistol',   grain:'180gr FMJ',   brand:'Federal / Sig',
    ppr:0.445, trend:-1.2, dir:'down', avail:71, wLow:0.429, wHigh:0.469,
    analysis:'Stable and falling. Growing platform adoption keeping supply healthy. Good buy window for high-volume shooters.',
    signal:'BUY', signalColor:'#22c55e',
    retailers: []
  },
  { _id:'10', caliber:'5.7x28mm',  caliberSlug:'57x28',       cat:'pistol',   grain:'40gr V-Max',  brand:'FN / Speer',
    ppr:0.529, trend: 2.8, dir:'up',   avail:55, wLow:0.499, wHigh:0.579,
    analysis:'Rising on PS90 and FN Five-seveN demand. Watch for bulk deals from Speer and Elite Ammunition.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers: []
  },
  { _id:'11', caliber:'.22 LR',  caliberSlug:'22-lr',         cat:'rimfire',  grain:'40gr LRN',    brand:'CCI / Federal',
    ppr:0.071, trend:-0.5, dir:'down', avail:94, wLow:0.065, wHigh:0.082,
    analysis:'Historic supply levels. Buy bricks not boxes — per-round savings are significant at this price.',
    signal:'BUY', signalColor:'#22c55e',
    retailers: []
  },
  { _id:'12', caliber:'7.62x39mm',  caliberSlug:'762x39',      cat:'rifle',    grain:'123gr FMJ',   brand:'Wolf / Tula',
    ppr:0.285, trend: 8.2, dir:'up',   avail:55, wLow:0.265, wHigh:0.319,
    analysis:'Surging on import restrictions. Buy training stock now — next restriction could push past 35 cents.',
    signal:'BUY NOW', signalColor:'#ef4444',
    retailers: []
  },
  { _id:'13', caliber:'.300 BLK',  caliberSlug:'300-blackout',       cat:'rifle',    grain:'125gr FMJ',   brand:'Hornady / AAC',
    ppr:0.568, trend: 2.1, dir:'up',   avail:61, wLow:0.539, wHigh:0.589,
    analysis:'Subsonic demand stable from suppressor market growth. Supersonic 125gr FMJ is the range-viable value option.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers: []
  },
  { _id:'14', caliber:'6.5 Creedmoor',  caliberSlug:'65-creedmoor',  cat:'precision', grain:'140gr BTHP',  brand:'Hornady / Federal',
    ppr:1.420, trend: 3.4, dir:'up',   avail:52, wLow:1.38, wHigh:1.55,
    analysis:'Rising on new platform adopters. Match-grade pricing up 12% YTD. Buy practice brass and reload now.',
    signal:'BUY NOW', signalColor:'#ef4444',
    retailers: []
  },
  { _id:'15', caliber:'6.5 PRC',  caliberSlug:'65-prc',        cat:'precision', grain:'143gr ELD-M',  brand:'Hornady / Federal',
    ppr:1.749, trend: 4.1, dir:'up',   avail:44, wLow:1.65, wHigh:1.89,
    analysis:'Demand accelerating as hunters upgrade from 6.5CM. Supply tight heading into hunting season.',
    signal:'BUY NOW', signalColor:'#ef4444',
    retailers: []
  },
  { _id:'16', caliber:'7mm PRC',  caliberSlug:'7mm-prc',        cat:'precision', grain:'175gr ELD-M',  brand:'Hornady',
    ppr:2.199, trend: 6.2, dir:'up',   avail:38, wLow:2.05, wHigh:2.39,
    analysis:'Supply critically tight. Hornady holds near-monopoly on factory loads. Buy every box you see.',
    signal:'BUY NOW', signalColor:'#ef4444',
    retailers: []
  },
  { _id:'17', caliber:'.300 PRC',  caliberSlug:'300-prc',       cat:'precision', grain:'225gr ELD-M',  brand:'Hornady',
    ppr:2.849, trend: 3.8, dir:'up',   avail:32, wLow:2.69, wHigh:3.05,
    analysis:'Factory options limited to Hornady and boutique loaders. Reloading strongly recommended for volume shooters.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers: []
  },
  { _id:'18', caliber:'.300 Win Mag',  caliberSlug:'300-win-mag',   cat:'magnum',   grain:'180gr SP',     brand:'Federal / Nosler',
    ppr:1.189, trend: 1.4, dir:'up',   avail:69, wLow:1.12, wHigh:1.29,
    analysis:'Healthy supply relative to PRC cartridges. Federal Power-Shok at $1.12/rd is still the practice value target.',
    signal:'WATCH', signalColor:'#f59e0b',
    retailers: []
  },
  { _id:'19', caliber:'12 Gauge',  caliberSlug:'12-gauge',       cat:'shotgun',  grain:'00 Buck',      brand:'Federal / Winchester',
    ppr:0.412, trend:-1.3, dir:'down', avail:88, wLow:0.395, wHigh:0.450,
    analysis:'Excellent availability. Federal FliteControl 00 Buck is the home defense standard. Shop around — price spread is wide.',
    signal:'BUY', signalColor:'#22c55e',
    retailers: []
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
    signal:   a.signal   ?? (a.dir === 'down' ? 'BUY' : 'WATCH'),
    signalColor: a.signalColor ?? (a.dir === 'down' ? '#22c55e' : '#f59e0b'),
    // liveRetailers: from Sanity (AmmoSeek RSS data, populated every 4h by market cron)
    // Each entry has: { vendor, price, url (AmmoSeek redirect to retailer), inStock, label }
    liveRetailers: a.retailers ?? []
  })

  const prices = SEED_PRICES.map(seed => {
    const live = rawPrices.find(r => r.caliber === seed.caliber)
    return normalize(live ? { ...seed, ...live } : seed)
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(MARKET_SCHEMA) }} />
      <Masthead />
      <BreakingTicker alerts={alerts} />
      <MarketClient prices={prices} analysis={analysis} nicsData={NICS_DATA} />
      <Footer />
    </>
  )
}
