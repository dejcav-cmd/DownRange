import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import { fetchAmmoPrices, fetchBreakingAlerts } from '../../sanity/lib/client'
import { createClient } from '@sanity/client'
import Link from 'next/link'

export const metadata = {
  title: 'Market Watch — DownRange',
  description: 'Real-time ammo price index, NICS background check trends, retailer stock alerts, and market intelligence for US gun owners.',
}
export const revalidate = 1800

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
})

// ── SEED DATA ──────────────────────────────────────────────────────────────────
const SEED_PRICES = [
  { _id:'1',  caliber:'9mm Luger',       grain:'115gr FMJ',  brand:'Federal / Blazer',   ppr:0.189, trend:-4.2, dir:'down', avail:92, wLow:0.18, wHigh:0.21, bestRetailer:'Lucky Gunner', bestUrl:'https://www.luckygunner.com/handgun/9mm-ammo' },
  { _id:'2',  caliber:'5.56 NATO',        grain:'55gr FMJ',   brand:'PMC / Federal',       ppr:0.321, trend: 1.8, dir:'up',   avail:78, wLow:0.31, wHigh:0.35, bestRetailer:'PSA',          bestUrl:'https://palmettostatearmory.com/ammo' },
  { _id:'3',  caliber:'.308 WIN',         grain:'147gr FMJ',  brand:'Federal / Hornady',   ppr:0.745, trend:-2.1, dir:'down', avail:65, wLow:0.72, wHigh:0.80, bestRetailer:'Ammo.com',     bestUrl:'https://ammo.com/rifle/308-ammo' },
  { _id:'4',  caliber:'.45 ACP',          grain:'230gr FMJ',  brand:'Federal / Blazer',    ppr:0.387, trend: 0.9, dir:'up',   avail:80, wLow:0.38, wHigh:0.42, bestRetailer:'GrabAGun',     bestUrl:'https://www.grabagun.com' },
  { _id:'5',  caliber:'12 Gauge',         grain:'00 Buck',    brand:'Federal / Winchester', ppr:0.412, trend:-1.3, dir:'down', avail:88, wLow:0.40, wHigh:0.45, bestRetailer:'Ammo Depot',   bestUrl:'https://www.ammunitiondepot.com' },
  { _id:'6',  caliber:'6.5 Creedmoor',    grain:'140gr BTHP', brand:'Hornady / Federal',   ppr:1.420, trend: 3.4, dir:'up',   avail:52, wLow:1.38, wHigh:1.55, bestRetailer:'MidwayUSA',    bestUrl:'https://www.midwayusa.com' },
  { _id:'7',  caliber:'.22 LR',           grain:'40gr LRN',   brand:'CCI / Federal',       ppr:0.071, trend:-0.5, dir:'down', avail:94, wLow:0.07, wHigh:0.08, bestRetailer:'Ammo.com',     bestUrl:'https://ammo.com/rimfire/22lr-ammo' },
  { _id:'8',  caliber:'7.62x39mm',        grain:'123gr FMJ',  brand:'Wolf / Tula',         ppr:0.285, trend: 8.2, dir:'up',   avail:55, wLow:0.27, wHigh:0.32, bestRetailer:'AIM Surplus',  bestUrl:'https://www.aimsurplus.com' },
  { _id:'9',  caliber:'.300 BLK',         grain:'125gr FMJ',  brand:'Hornady / AAC',       ppr:0.568, trend: 2.1, dir:'up',   avail:61, wLow:0.54, wHigh:0.59, bestRetailer:'SilencerShop', bestUrl:'https://www.silencershop.com' },
  { _id:'10', caliber:'10mm Auto',         grain:'180gr FMJ',  brand:'Federal / Sig',       ppr:0.445, trend:-1.2, dir:'down', avail:71, wLow:0.43, wHigh:0.47, bestRetailer:'Ammo.com',     bestUrl:'https://ammo.com/handgun/10mm-ammo' },
  { _id:'11', caliber:'.380 ACP',          grain:'95gr FMJ',   brand:'Federal / Remington',  ppr:0.312, trend:-3.1, dir:'down', avail:83, wLow:0.29, wHigh:0.34, bestRetailer:'PSA',          bestUrl:'https://palmettostatearmory.com/ammo' },
  { _id:'12', caliber:'.338 Lapua',        grain:'250gr BTHP', brand:'Lapua / Hornady',     ppr:4.200, trend: 5.6, dir:'up',   avail:34, wLow:3.90, wHigh:4.50, bestRetailer:'MidwayUSA',    bestUrl:'https://www.midwayusa.com' },
]

const NICS_DATA = [
  { month:'Nov', checks:3218000 },
  { month:'Dec', checks:3419000 },
  { month:'Jan', checks:2876000 },
  { month:'Feb', checks:2431000 },
  { month:'Mar', checks:2695000 },
  { month:'Apr', checks:2512000 },
  { month:'May', checks:2784000 },
]

const MARKET_INTEL = [
  { label:'NICS Trend',        value:'↓ 3.2% MoM', detail:'Inventory building. Slight buyer market forming in pistol segment.', dir:'down' },
  { label:'Import Supply',     value:'Constrained', detail:'7.62x39 restricted (Ukraine sanctions). European 9mm remains plentiful.', dir:'warn' },
  { label:'Best Value',        value:'9mm at 18¢',  detail:'Near all-time low per round. Stock up before next demand surge.', dir:'good' },
  { label:'Watch List',        value:'6.5CM rising', detail:'6.5 Creedmoor and .300 BLK tightening. Demand outpacing import supply.', dir:'up' },
  { label:'Retailer Inventory','value':'Above avg',  detail:'Major retailers running 90-day supply vs 60-day historical average.', dir:'good' },
  { label:'Lead Times',        value:'14-21 days',  detail:'Standard for boutique match ammo. Bulk plinking ammo ships same week.', dir:'neutral' },
]

const RETAILER_DEALS = [
  { name:'Lucky Gunner',           deal:'9mm 115gr FMJ 1000rd — $179',  badge:'BEST PRICE',  url:'https://www.luckygunner.com', color:'#22c55e' },
  { name:'Palmetto State Armory',  deal:'5.56 55gr 1000rd — $319',      badge:'FREE SHIP',   url:'https://palmettostatearmory.com/ammo', color:'#C8922A' },
  { name:'Ammo.com',               deal:'.22LR 500rd Brick — $34.99',   badge:'HOT',         url:'https://ammo.com', color:'#ef4444' },
  { name:'GrabAGun',               deal:'.45 ACP 250rd — $94',          badge:'IN STOCK',    url:'https://www.grabagun.com', color:'#3b82f6' },
  { name:'Ammunition Depot',       deal:'12ga 00 Buck 250rd — $99',     badge:'DEAL',        url:'https://www.ammunitiondepot.com', color:'#a855f7' },
  { name:'Sportsman',              deal:'6.5 Creedmoor 20rd — $26.99',  badge:'LIMITED',     url:'https://www.sportsmansguide.com', color:'#f59e0b' },
]

const PRICE_ALERTS = [
  { caliber:'9mm 115gr FMJ',    threshold:'< 16¢/rd',  status:'watching', msg:'Currently 18.9¢ — 18% above alert' },
  { caliber:'5.56 55gr FMJ',    threshold:'< 28¢/rd',  status:'close',    msg:'Currently 32¢ — 14% above alert' },
  { caliber:'.22 LR 40gr',      threshold:'< 6¢/rd',   status:'hit',      msg:'TRIGGERED — currently 7.1¢ — near alert' },
]

async function fetchDailyAnalysis() {
  try {
    return await sanity.fetch(`*[_type=="marketAnalysis"]|order(publishedAt desc)[0]{title,summary,bullets,publishedAt,author}`)
  } catch { return null }
}

// ── HELPERS ────────────────────────────────────────────────────────────────────

function fmt(ppr) {
  return ppr < 1 ? `${(ppr * 100).toFixed(1)}¢` : `$${ppr.toFixed(2)}`
}

function availColor(n) {
  if (n >= 80) return '#22c55e'
  if (n >= 55) return '#f59e0b'
  return '#ef4444'
}

function availLabel(n) {
  if (n >= 80) return 'IN STOCK'
  if (n >= 55) return 'LIMITED'
  return 'LOW'
}

// ── SUB-COMPONENTS ─────────────────────────────────────────────────────────────

function PriceRow({ a, rank }) {
  const up  = a.dir === 'up'
  const tc  = up ? '#ef4444' : '#22c55e'
  const ac  = availColor(a.avail)

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '24px 1fr 80px 80px 80px 90px 60px 100px',
      gap: 12, alignItems: 'center',
      padding: '11px 16px',
      borderBottom: '1px solid rgba(30,41,59,0.6)',
      background: rank % 2 === 0 ? 'rgba(255,255,255,0.01)' : 'transparent',
    }}>
      {/* Rank */}
      <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#334155', textAlign:'center' }}>{rank}</span>

      {/* Caliber */}
      <div>
        <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:15, color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1 }}>{a.caliber}</div>
        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', marginTop:2 }}>{a.grain} · {a.brand}</div>
      </div>

      {/* Price */}
      <div style={{ textAlign:'right' }}>
        <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:22, color:'#C8922A', letterSpacing:'0.03em', lineHeight:1 }}>{fmt(a.ppr)}</div>
        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, color:'#475569' }}>per round</div>
      </div>

      {/* Trend */}
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:tc, fontWeight:700 }}>
          {up ? '▲' : '▼'} {Math.abs(a.trend).toFixed(1)}%
        </div>
        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, color:'#334155' }}>30-day</div>
      </div>

      {/* Week range */}
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10 }}>
          <span style={{ color:'#22c55e' }}>{fmt(a.wLow)}</span>
          <span style={{ color:'#334155' }}> – </span>
          <span style={{ color:'#ef4444' }}>{fmt(a.wHigh)}</span>
        </div>
        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, color:'#334155' }}>wk range</div>
      </div>

      {/* Availability bar */}
      <div>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
          <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, color:ac }}>{availLabel(a.avail)}</span>
          <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, color:'#334155' }}>{a.avail}%</span>
        </div>
        <div style={{ height:3, background:'#1e293b', borderRadius:2, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${a.avail}%`, background:ac, transition:'width 0.6s' }} />
        </div>
      </div>

      {/* Best price link */}
      <div style={{ textAlign:'center' }}>
        {a.ppr <= a.wLow * 1.05 && (
          <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, background:'#14532d', color:'#4ade80', padding:'2px 5px', borderRadius:2 }}>FLOOR</span>
        )}
      </div>

      {/* Retailer */}
      <a href={a.bestUrl} target="_blank" rel="noreferrer" style={{
        fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#C8922A',
        textDecoration:'none', border:'1px solid #C8922A33', padding:'3px 7px',
        borderRadius:3, whiteSpace:'nowrap', display:'inline-block',
        transition:'background 0.15s',
      }}>
        {a.bestRetailer} ↗
      </a>
    </div>
  )
}

function NicsBar({ month, checks, max }) {
  const pct = Math.round((checks / max) * 100)
  const inM = (checks / 1000000).toFixed(2)
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
      <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', width:28, textAlign:'right', flexShrink:0 }}>{month}</div>
      <div style={{ flex:1, height:18, background:'#0f172a', borderRadius:2, overflow:'hidden', position:'relative' }}>
        <div style={{ height:'100%', width:`${pct}%`, background:'linear-gradient(90deg, #C8922A, #e8b44a)', borderRadius:2 }} />
        <div style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', fontFamily:'IBM Plex Mono, monospace', fontSize:8, color:'#94a3b8' }}>{inM}M</div>
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
  // Normalize Sanity field names to match seed data schema
  const normalize = (a) => ({
    ...a,
    ppr:   a.ppr   ?? a.pricePerRound ?? 0,
    trend: a.trend ?? a.trendPercent  ?? 0,
    dir:   a.dir   ?? a.trendDirection ?? 'flat',
    avail: a.avail ?? a.availabilityIndex ?? 75,
    wLow:  a.wLow  ?? a.weekLow  ?? 0,
    wHigh: a.wHigh ?? a.weekHigh ?? 0,
  })
  const prices  = (rawPrices.length > 0 ? rawPrices : SEED_PRICES).map(normalize)
  const today   = new Date().toLocaleDateString('en-US', { weekday:'long', month:'long', day:'numeric', year:'numeric' })
  const nicsMax = Math.max(...NICS_DATA.map(d => d.checks))

  const bestValue  = [...prices].sort((a, b) => (a.ppr || a.pricePerRound) - (b.ppr || b.pricePerRound))[0]
  const mostRising = [...prices].filter(a => (a.dir || a.trendDirection) === 'up').sort((a, b) => (b.trend || b.trendPercent) - (a.trend || a.trendPercent))[0]
  const lowStock   = [...prices].filter(a => (a.avail || a.availabilityIndex) < 60)

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <style>{`
        .mkt-row:hover { background: rgba(200,146,42,0.04) !important; }
        .retailer-card:hover { border-color: var(--gold) !important; }
        .intel-row:hover { background: rgba(255,255,255,0.03) !important; }
        .alert-row-hit  { border-left: 3px solid #22c55e !important; }
        .alert-row-close { border-left: 3px solid #f59e0b !important; }
        .alert-row-watching { border-left: 3px solid #334155 !important; }
        @keyframes ticker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>

      {/* ── HERO ── */}
      <div className="page-hero" style={{ position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 80% 50%, rgba(200,146,42,0.06) 0%, transparent 60%)', pointerEvents:'none' }} />
        <div className="container" style={{ position:'relative' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:10, flexWrap:'wrap', alignItems:'center' }}>
                <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:'Barlow Condensed, sans-serif', fontSize:11, fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>MARKET WATCH</span>
                <span style={{ display:'flex', alignItems:'center', gap:5, background:'#001A0A', color:'#22C55E', fontFamily:'IBM Plex Mono, monospace', fontSize:11, fontWeight:700, padding:'3px 10px', border:'1px solid #22C55E40' }}>
                  <span className="pulse-dot" /> LIVE
                </span>
              </div>
              <h1 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'clamp(2.6rem,5.5vw,4rem)', color:'var(--foreground)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:10 }}>
                Ammo Price Intelligence<br />
                <span style={{ color:'var(--gold)' }}>& Market Analysis</span>
              </h1>
              <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:12, color:'#64748b', lineHeight:1.7, maxWidth:500 }}>
                {prices.length} calibers tracked · NICS background check index · Retailer stock alerts · Daily AI brief
              </p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#475569' }}>{today}</div>
              <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#334155', marginTop:3 }}>Updated every 30 min · Data: AmmoSeek, gun.deals, r/gundeals</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── SCROLLING PRICE TICKER ── */}
      <div style={{ background:'#09090b', borderBottom:'1px solid rgba(200,146,42,0.2)', overflow:'hidden', height:28, display:'flex', alignItems:'center' }}>
        <div style={{ display:'flex', gap:0, animation:'ticker 40s linear infinite', whiteSpace:'nowrap', willChange:'transform' }}>
          {[...prices, ...prices].map((a, i) => {
            const ppr = a.ppr || a.pricePerRound
            const dir = a.dir || a.trendDirection
            const cal = a.caliber
            const tc  = dir === 'up' ? '#ef4444' : '#22c55e'
            return (
              <span key={i} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, padding:'0 20px', borderRight:'1px solid #1e293b', display:'flex', alignItems:'center', gap:6, height:28 }}>
                <span style={{ color:'#64748b' }}>{cal}</span>
                <span style={{ color:'#C8922A', fontWeight:700 }}>{fmt(ppr)}</span>
                <span style={{ color:tc, fontSize:9 }}>{dir === 'up' ? '▲' : '▼'}</span>
              </span>
            )
          })}
        </div>
      </div>

      <div style={{ padding:'32px 0 60px' }}>
        <div className="container">

          {/* ── STAT BAR ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px,1fr))', gap:10, marginBottom:32 }}>
            {[
              { label:'Calibers Tracked',   value:String(prices.length),       sub:'Updated 30 min',        icon:'📊', accent:'#C8922A' },
              { label:'Best Value Right Now', value:bestValue ? fmt(bestValue.ppr || bestValue.pricePerRound) : '—', sub:bestValue?.caliber || '—', icon:'💡', accent:'#22c55e' },
              { label:'Fastest Rising',      value:mostRising ? mostRising.caliber : '—', sub:mostRising ? `+${(mostRising.trend || mostRising.trendPercent).toFixed(1)}% 30d` : '—', icon:'⚡', accent:'#ef4444' },
              { label:'Low Stock Alert',     value:String(lowStock.length),     sub:'calibers below 60%',    icon:'🚨', accent: lowStock.length > 3 ? '#ef4444' : '#f59e0b' },
              { label:'NICS This Month',     value:'2.78M',                     sub:'Background checks',     icon:'🔍', accent:'#94a3b8' },
              { label:'Market Sentiment',    value:'BUYER',                     sub:'Inventory above avg',   icon:'📈', accent:'#22c55e' },
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
            <div style={{ background:'rgba(200,146,42,0.05)', border:'1px solid rgba(200,146,42,0.3)', borderLeft:'4px solid #C8922A', padding:'22px 26px', marginBottom:32, borderRadius:4 }}>
              <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#C8922A', letterSpacing:'0.15em', fontWeight:700, marginBottom:8 }}>📊 DAILY MARKET BRIEF · {today}</div>
              <h2 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.4rem', color:'var(--foreground)', marginBottom:8, letterSpacing:'0.04em' }}>{analysis.title}</h2>
              <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:12, color:'#94a3b8', lineHeight:1.7, marginBottom: analysis.bullets?.length ? 12 : 0 }}>{analysis.summary}</p>
              {analysis.bullets?.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(240px,1fr))', gap:6 }}>
                  {analysis.bullets.map((b, i) => (
                    <div key={i} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#94a3b8', paddingLeft:14, position:'relative', lineHeight:1.5 }}>
                      <span style={{ position:'absolute', left:0, color:'#C8922A' }}>◈</span> {b}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ background:'rgba(200,146,42,0.04)', border:'1px solid rgba(200,146,42,0.2)', borderLeft:'4px solid #C8922A', padding:'18px 22px', marginBottom:32, borderRadius:4 }}>
              <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#C8922A', letterSpacing:'0.15em', fontWeight:700, marginBottom:8 }}>📊 DAILY MARKET BRIEF</div>
              <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.1rem', color:'var(--foreground)', marginBottom:6, letterSpacing:'0.04em' }}>AI-generated brief runs at 6:00 AM EST via OpenClaw</div>
              <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#475569', lineHeight:1.7 }}>
                Covers price movement, availability shifts, and caliber-specific buying windows. <Link href="/admin" style={{ color:'#C8922A', textDecoration:'none' }}>Configure OpenClaw agent →</Link>
              </p>
            </div>
          )}

          {/* ── MAIN CONTENT GRID ── */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

            {/* LEFT — Price table */}
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
                <div>
                  <h2 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.6rem', color:'var(--foreground)', letterSpacing:'0.05em', margin:0 }}>AMMO PRICE INDEX</h2>
                  <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#475569', margin:'2px 0 0' }}>Price per round · Retailer avg · Availability index</p>
                </div>
                <a href="https://gun.deals" target="_blank" rel="noreferrer" style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#C8922A', textDecoration:'none', border:'1px solid rgba(200,146,42,0.3)', padding:'5px 10px', borderRadius:3 }}>
                  Live Deals ↗
                </a>
              </div>

              {/* Table header */}
              <div className="dr-card" style={{ overflow:'hidden' }}>
                <div style={{ display:'grid', gridTemplateColumns:'24px 1fr 80px 80px 80px 90px 60px 100px', gap:12, padding:'8px 16px', borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,0.3)' }}>
                  {['#', 'CALIBER', 'PRICE/RD', '30D', 'WK RANGE', 'AVAIL', '', 'BEST AT'].map((h, i) => (
                    <div key={i} style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#334155', letterSpacing:'0.1em', textAlign: i >= 2 && i <= 5 ? 'center' : 'left' }}>{h}</div>
                  ))}
                </div>
                {prices.map((a, i) => <PriceRow key={a._id || i} a={a} rank={i + 1} />)}
              </div>

              <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#1e293b', marginTop:8, textAlign:'center' }}>
                Data sourced from AmmoSeek, gun.deals, r/gundeals, major retailer feeds · Updated every 30 minutes
              </div>
            </div>

            {/* RIGHT — Sidebar */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* NICS Chart */}
              <div className="dr-card" style={{ padding:18 }}>
                <h3 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.1rem', letterSpacing:'0.05em', color:'#C8922A', margin:'0 0 4px' }}>NICS BACKGROUND CHECKS</h3>
                <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', margin:'0 0 14px', lineHeight:1.5 }}>
                  FBI monthly check volume = proxy for gun sales. Rising = demand surge incoming.
                </p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {NICS_DATA.map(d => <NicsBar key={d.month} {...d} max={nicsMax} />)}
                </div>
                <div style={{ marginTop:10, fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#334155' }}>
                  Source: FBI NICS / data-liberation-project · Monthly
                </div>
              </div>

              {/* Market Intel */}
              <div className="dr-card" style={{ padding:18 }}>
                <h3 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.1rem', letterSpacing:'0.05em', color:'var(--foreground)', margin:'0 0 12px' }}>MARKET INTELLIGENCE</h3>
                <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
                  {MARKET_INTEL.map((item, i) => (
                    <div key={i} className="intel-row" style={{
                      display:'grid', gridTemplateColumns:'110px 1fr', gap:10,
                      padding:'9px 0',
                      borderBottom: i < MARKET_INTEL.length - 1 ? '1px solid rgba(30,41,59,0.5)' : 'none',
                      transition:'background 0.1s',
                    }}>
                      <div>
                        <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', letterSpacing:'0.04em', marginBottom:2 }}>{item.label}</div>
                        <div style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:14, letterSpacing:'0.04em', color: item.dir === 'good' ? '#22c55e' : item.dir === 'up' ? '#ef4444' : item.dir === 'warn' ? '#f59e0b' : '#C8922A' }}>{item.value}</div>
                      </div>
                      <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', lineHeight:1.5, paddingTop:2 }}>{item.detail}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Price Alert Setup */}
              <div className="dr-card" style={{ padding:18 }}>
                <h3 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.1rem', letterSpacing:'0.05em', color:'var(--foreground)', margin:'0 0 4px' }}>PRICE ALERTS</h3>
                <p style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', margin:'0 0 12px', lineHeight:1.5 }}>Community-tracked thresholds. Alerts when price drops below target.</p>
                <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                  {PRICE_ALERTS.map((a, i) => (
                    <div key={i} className={`alert-row-${a.status}`} style={{ padding:'8px 10px', background:'rgba(0,0,0,0.2)', borderRadius:3 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:12, fontWeight:700, color:'var(--foreground)' }}>{a.caliber}</span>
                        <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color: a.status === 'hit' ? '#22c55e' : a.status === 'close' ? '#f59e0b' : '#475569' }}>
                          {a.status === 'hit' ? '🔔 TRIGGERED' : a.status === 'close' ? '⚡ CLOSE' : '● WATCHING'}
                        </span>
                      </div>
                      <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569' }}>Target: {a.threshold}</div>
                      <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color: a.status === 'hit' ? '#22c55e' : '#334155', marginTop:2 }}>{a.msg}</div>
                    </div>
                  ))}
                </div>
                <Link href="/deals" style={{ display:'block', marginTop:12, fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#C8922A', textDecoration:'none' }}>
                  Set custom alerts in Deals →
                </Link>
              </div>

            </div>
          </div>

          {/* ── RETAILER DEALS STRIP ── */}
          <div style={{ marginTop:32 }}>
            <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:14 }}>
              <h2 style={{ fontFamily:'Bebas Neue, sans-serif', fontSize:'1.6rem', color:'var(--foreground)', letterSpacing:'0.05em', margin:0 }}>BEST DEALS RIGHT NOW</h2>
              <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:10, color:'#475569' }}>Community curated · Updated hourly</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(250px, 1fr))', gap:10 }}>
              {RETAILER_DEALS.map((d, i) => (
                <a key={i} href={d.url} target="_blank" rel="noreferrer" className="retailer-card dr-card" style={{
                  textDecoration:'none', padding:'14px 16px',
                  borderLeft:`3px solid ${d.color}`,
                  transition:'border-color 0.15s',
                }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:6 }}>
                    <div style={{ fontFamily:'Barlow Condensed, sans-serif', fontSize:14, fontWeight:700, color:'var(--foreground)' }}>{d.name}</div>
                    <span style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:8, background:d.color + '22', color:d.color, border:`1px solid ${d.color}44`, padding:'2px 6px', borderRadius:2, flexShrink:0 }}>{d.badge}</span>
                  </div>
                  <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:11, color:'#94a3b8', lineHeight:1.4 }}>{d.deal}</div>
                  <div style={{ fontFamily:'IBM Plex Mono, monospace', fontSize:9, color:'#475569', marginTop:6 }}>Click to view deal ↗</div>
                </a>
              ))}
            </div>
          </div>

          {/* ── BOTTOM TOOLS ── */}
          <div style={{ marginTop:32, display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px,1fr))', gap:10 }}>
            {[
              { label:'📊 All Deals',        href:'/deals',           desc:'Live feed from Reddit + retailers' },
              { label:'⚖ State Laws',         href:'/laws',            desc:'Ammo restrictions by state' },
              { label:'🔫 NFA Tracker',       href:'/nfa-tracker',     desc:'Form 4 wait times & suppressor data' },
              { label:'📰 Industry News',     href:'/news',            desc:'Latest firearms market coverage' },
              { label:'💰 Value Estimator',   href:'/value-estimator', desc:'What is your firearm worth?' },
              { label:'◎ Range Finder',       href:'/ranges',          desc:'Indoor/outdoor ranges near you' },
            ].map(t => (
              <Link key={t.href} href={t.href} className="dr-card" style={{
                textDecoration:'none', padding:'16px 18px', display:'block', transition:'border-color 0.2s',
              }}>
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
