import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import { fetchAmmoPrices, fetchBreakingAlerts } from '../../sanity/lib/client'
import { createClient } from '@sanity/client'
import Link from 'next/link'

export const metadata = { title: 'Market Watch — DownRange', description: 'Daily ammo price analysis, availability trends, and market intelligence for US firearms owners.' }
export const revalidate = 1800

const sanity = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'vbnsqnkg', dataset:'production', apiVersion:'2024-01-01', useCdn:true })

const SEED_PRICES = [
  { _id:'1', caliber:'9mm', pricePerRound:0.189, unit:'115gr FMJ', brand:'Federal/Blazer avg', trendPercent:-4.2, trendDirection:'down', availabilityIndex:92, weekHigh:0.21, weekLow:0.18 },
  { _id:'2', caliber:'.223 / 5.56', pricePerRound:0.321, unit:'55gr FMJ', brand:'PMC/Federal avg', trendPercent:1.8, trendDirection:'up', availabilityIndex:78, weekHigh:0.35, weekLow:0.31 },
  { _id:'3', caliber:'.308 WIN', pricePerRound:0.745, unit:'147gr FMJ', brand:'Federal/Hornady avg', trendPercent:-2.1, trendDirection:'down', availabilityIndex:65, weekHigh:0.80, weekLow:0.72 },
  { _id:'4', caliber:'.45 ACP', pricePerRound:0.387, unit:'230gr FMJ', brand:'Federal/Blazer avg', trendPercent:0.9, trendDirection:'up', availabilityIndex:80, weekHigh:0.42, weekLow:0.38 },
  { _id:'5', caliber:'12 GA', pricePerRound:0.412, unit:'00 Buck', brand:'Federal/Winchester avg', trendPercent:-1.3, trendDirection:'down', availabilityIndex:88, weekHigh:0.45, weekLow:0.40 },
  { _id:'6', caliber:'6.5 Creedmoor', pricePerRound:1.42, unit:'140gr match', brand:'Hornady/Federal avg', trendPercent:3.4, trendDirection:'up', availabilityIndex:52, weekHigh:1.55, weekLow:1.38 },
  { _id:'7', caliber:'.22 LR', pricePerRound:0.071, unit:'40gr', brand:'CCI/Federal avg', trendPercent:-0.5, trendDirection:'down', availabilityIndex:94, weekHigh:0.08, weekLow:0.07 },
  { _id:'8', caliber:'7.62x39', pricePerRound:0.285, unit:'123gr FMJ', brand:'Wolf/Tula avg', trendPercent:8.2, trendDirection:'up', availabilityIndex:55, weekHigh:0.32, weekLow:0.27 },
]

async function fetchDailyAnalysis() {
  try {
    return await sanity.fetch(`*[_type=="marketAnalysis"]|order(publishedAt desc)[0]{title,summary,bullets,publishedAt,author}`)
  } catch { return null }
}

function PriceCard({ ammo }) {
  const up = ammo.trendDirection==='up'
  const dn = ammo.trendDirection==='down'
  const tc = up ? '#EF4444' : dn ? '#34D399' : '#9CA3AF'
  const pct = ammo.availabilityIndex || 75

  return (
    <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px 16px', position:'relative', overflow:'hidden', borderBottom:`2px solid ${tc}` }}>
      <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.1rem', color:'#F0EDE6', marginBottom:'4px', letterSpacing:'0.03em' }}>{ammo.caliber}</div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginBottom:'10px' }}>{ammo.unit} · {ammo.brand}</div>
      <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:'#C8922A', letterSpacing:'0.03em', lineHeight:1 }}>
        {ammo.pricePerRound < 1 ? `${Math.round(ammo.pricePerRound * 100)}¢` : `$${ammo.pricePerRound.toFixed(2)}`}
      </div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#4B5563', marginBottom:'8px' }}>per round</div>

      <div style={{ display:'flex', justifyContent:'space-between', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', marginBottom:'6px' }}>
        <span style={{ color:tc, fontWeight:700 }}>{up?'↑':'↓'} {Math.abs(ammo.trendPercent).toFixed(1)}% <span style={{ color:'#4B5563', fontWeight:400 }}>30d</span></span>
        <span style={{ color:'#374151' }}>
          <span style={{ color:'#34D399' }}>{ammo.weekLow ? `${Math.round(ammo.weekLow*100)}¢` : '—'}</span>
          <span style={{ color:'#4B5563' }}> / </span>
          <span style={{ color:'#EF4444' }}>{ammo.weekHigh ? `${Math.round(ammo.weekHigh*100)}¢` : '—'}</span>
        </span>
      </div>

      <div style={{ height:'4px', background:'#1C2028', borderRadius:'2px', overflow:'hidden' }}>
        <div style={{ height:'100%', background: pct > 80 ? '#34D399' : pct > 50 ? '#FBBF24' : '#EF4444', width:`${pct}%`, transition:'width 0.5s' }} />
      </div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#4B5563', marginTop:'3px' }}>
        {pct}% availability · {pct > 80 ? 'IN STOCK' : pct > 50 ? 'LIMITED' : 'LOW STOCK'}
      </div>
    </div>
  )
}

export default async function MarketPage() {
  const [prices, alerts, analysis] = await Promise.all([
    fetchAmmoPrices().catch(()=>[]),
    fetchBreakingAlerts(3).catch(()=>[]),
    fetchDailyAnalysis().catch(()=>null),
  ])
  const displayPrices = prices.length > 0 ? prices : SEED_PRICES
  const today = new Date().toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric',year:'numeric'})

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="MARKET">
        <div className="container">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 className="page-hero-title">Market Watch</h1>
              <p className="page-hero-sub">Daily ammo price index · {displayPrices.length} calibers tracked · Updated every 30 min</p>
            </div>
            <div style={{ textAlign:'right' }}>
              <div className="live-badge"><span className="pulse-dot" />Live</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginTop:'4px' }}>{today}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding:'32px 0' }}>
        <div className="container">

          {/* Daily analysis */}
          {analysis ? (
            <div style={{ background:'#0D1117', border:'1px solid #C8922A40', borderLeft:'4px solid #C8922A', padding:'24px 28px', marginBottom:'36px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:16, flexWrap:'wrap' }}>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A', letterSpacing:'0.15em', fontWeight:700, marginBottom:'6px' }}>
                    📊 DAILY MARKET BRIEF · {analysis.publishedAt ? new Date(analysis.publishedAt).toLocaleDateString('en-US',{month:'short',day:'numeric'}) : today}
                  </div>
                  <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#F0EDE6', letterSpacing:'0.03em', marginBottom:'8px' }}>{analysis.title}</h2>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280', lineHeight:1.7 }}>{analysis.summary}</p>
                  {analysis.bullets?.length > 0 && (
                    <ul style={{ marginTop:'12px', paddingLeft:0, listStyle:'none', display:'flex', flexDirection:'column', gap:'5px' }}>
                      {analysis.bullets.map((b,i)=>(
                        <li key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#94A3B8', paddingLeft:'12px', position:'relative' }}>
                          <span style={{ position:'absolute', left:0, color:'#C8922A' }}>◈</span> {b}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ background:'#111318', border:'1px solid var(--border)', borderLeft:'4px solid #C8922A', padding:'20px 24px', marginBottom:'36px' }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A', letterSpacing:'0.15em', fontWeight:700, marginBottom:'8px' }}>
                📊 DAILY MARKET BRIEF · {today}
              </div>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.3rem', color:'#F0EDE6', marginBottom:'8px' }}>Market Analysis Loading</h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7 }}>
                Daily AI-generated market analysis runs at 6:00 AM EST. Highlights include price movement, availability shifts, and buying opportunities across all tracked calibers.
              </p>
              <div style={{ marginTop:'12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151' }}>
                → To enable: run OpenClaw agent with market analysis prompt template (<Link href="/admin" style={{ color:'#C8922A', textDecoration:'none' }}>see Admin → Settings</Link>)
              </div>
            </div>
          )}

          {/* Price grid */}
          <div style={{ marginBottom:'12px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', fontWeight:700 }}>AMMO PRICE INDEX</div>
            <div style={{ display:'flex', gap:'16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563' }}>
              <span>WK RANGE: <span style={{ color:'#34D399' }}>LOW</span> / <span style={{ color:'#EF4444' }}>HIGH</span></span>
              <span style={{ color:'#34D399' }}>↓ = FALLING (good)</span>
              <span style={{ color:'#EF4444' }}>↑ = RISING</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px', marginBottom:'40px' }}>
            {displayPrices.map(a=><PriceCard key={a._id} ammo={a} />)}
          </div>

          {/* Market Intel + links */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'24px' }}>
            <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.3rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>MARKET INTELLIGENCE</h2>
              {[
                ['NICS Check Trend','↓ 3.2% MoM — Inventory building, slight buyer\'s market'],
                ['Import Supply','7.62x39 constrained (sanctions), European 9mm plentiful'],
                ['Best Value Caliber','9mm at 18-19¢/rd — all-time low territory'],
                ['Watch List','6.5CM and .300BLK tightening — buy before surge'],
              ].map(([k,v])=>(
                <div key={k} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)', display:'grid', gridTemplateColumns:'140px 1fr', gap:12 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>{k}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#D1D5DB', lineHeight:1.5 }}>{v}</span>
                </div>
              ))}
            </div>

            <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.3rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>LIVE DEALS</h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7, marginBottom:'16px' }}>
                Best ammo prices sourced from major retailers updated every 30 minutes.
              </p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {[
                  { label:'r/gundeals — Current hot deals', href:'https://reddit.com/r/gundeals', badge:'REDDIT' },
                  { label:'GrabAGun Bulk Ammo', href:'https://www.grabagun.com', badge:'RETAILER' },
                  { label:'Palmetto State Armory Deals', href:'https://www.palmettostatearmory.com/ammo.html', badge:'RETAILER' },
                  { label:'Ammunition Depot Sales', href:'https://www.ammunitiondepot.com', badge:'RETAILER' },
                ].map(d=>(
                  <a key={d.label} href={d.href} target="_blank" rel="noreferrer"
                    style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 12px', background:'#0D1117', border:'1px solid var(--border)', textDecoration:'none' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#D1D5DB' }}>{d.label}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#4B5563', background:'#1F2428', padding:'2px 6px' }}>{d.badge} ↗</span>
                  </a>
                ))}
              </div>
              <div style={{ marginTop:'12px' }}>
                <Link href="/deals" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', textDecoration:'none' }}>
                  View All Live Deals →
                </Link>
              </div>
            </div>
          </div>

          {/* OpenClaw agent instructions */}
          <div style={{ marginTop:'32px', background:'#0D1117', border:'1px solid #374151', padding:'20px 24px' }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#374151', letterSpacing:'0.12em', marginBottom:'8px', fontWeight:700 }}>OPENCLAW AGENT — MARKET ANALYSIS SETUP</div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151', lineHeight:1.7 }}>
              To enable daily AI market analysis: configure your OpenClaw/Ollama agent to POST to /api/market-analysis with the template below at 6:00 AM daily.
              See <Link href="/admin" style={{ color:'#4B5563' }}>Admin → Settings</Link> for full agent configuration guide.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
