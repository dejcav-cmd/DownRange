'use client'
import { useState, useEffect } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

// Always-visible seed deals (shown immediately, replaced by live data)
const SEED_DEALS = [
  { id:'s11', title:'[NFA] SilencerCo Omega 9K — $799 + $0 Tax Stamp (NFA Reform 2026 — No Tax Stamp Required)', url:'https://www.silencershop.com', score:1203, flair:'NFA', source:'r/gundeals', domain:'silencershop.com', created: Date.now()-18000000 },
  { id:'s1', title:'[Ammo] Federal American Eagle 9mm 115gr FMJ 1000rd — $189.99 shipped (use code EAGLE10)', url:'https://www.ammoseek.com/ammo/9mm', score:847, flair:'Ammo', source:'r/gundeals', domain:'federalpremium.com', created: Date.now()-7200000 },
  { id:'mgg1', title:'🎯 Mr. Guns N Gear Official Store — Tactical Gear, Merch & Accessories', url:'https://www.mrgunsngear.com/shop/', score:null, flair:'Gear', source:'Mr. Guns N Gear', domain:'mrgunsngear.com', created: Date.now(), featured:true, pinned:true },
  { id:'s2', title:'[Rifle] PSA PA-15 Complete MOE EPT 5.56 16" Rifle — $479.99 Free Ship', url:'https://palmettostatearmory.com', score:612, flair:'Rifle', source:'r/gundeals', domain:'palmettostatearmory.com', created: Date.now()-10800000 },
  { id:'s3', title:'[Handgun] Glock 19 Gen5 MOS + Crimson Trace Red Dot Bundle — $699.99', url:'https://www.glockstore.com', score:534, flair:'Handgun', source:'r/gundeals', domain:'glockstore.com', created: Date.now()-14400000 },
  { id:'s4', title:'[Ammo] CCI Blazer Brass 9mm 350rd Value Pack — $62.99 (PSA)', url:'https://palmettostatearmory.com/ammo.html', score:423, flair:'Ammo', source:'PSA', domain:'palmettostatearmory.com', created: Date.now()-21600000 },
  { id:'s5', title:'[Optic] Vortex Crossfire II Red Dot — $109.99 (reg $180)', url:'https://www.vortexoptics.com', score:389, flair:'Optic', source:'Brownells', domain:'brownells.com', created: Date.now()-25200000 },
  { id:'s6', title:'[Accessories] Streamlight TLR-1 HL 1000 Lumen Weapon Light — $89.99 (reg $140)', url:'https://www.brownells.com', score:301, flair:'Accessories', source:'Brownells', domain:'brownells.com', created: Date.now()-28800000 },
  { id:'s7', title:'[Rifle] CMMG Banshee 100 9mm AR Pistol — $799.99 Deal of the Week', url:'https://www.primaryarms.com', score:267, flair:'Rifle', source:'Primary Arms', domain:'primaryarms.com', created: Date.now()-32400000 },
  { id:'s8', title:'[Ammo] Hornady Critical Defense 9mm 115gr FTX 250rd — $134.99', url:'https://www.midwayusa.com', score:245, flair:'Ammo', source:'MidwayUSA', domain:'midwayusa.com', created: Date.now()-36000000 },
  { id:'s9', title:'[Accessories] Magpul PMAG 30 AR-15 5.56 10-Pack — $99.99 Free Ship', url:'https://www.magpul.com', score:198, flair:'Accessories', source:'Magpul', domain:'magpul.com', created: Date.now()-39600000 },
  { id:'s10', title:'[Handgun] SIG Sauer P365XL Romeo Zero Elite Bundle — $649.99 Free Ship', url:'https://www.sigsauer.com', score:187, flair:'Handgun', source:'r/gundeals', domain:'sigsauer.com', created: Date.now()-43200000 },
]

const FLAIR_COLORS = {
  Handgun:'#60A5FA', Rifle:'#34D399', Shotgun:'#FBBF24',
  Ammo:'#C8922A', Accessories:'#C084FC', NFA:'#EF4444',
  Optic:'#34D399', Gear:'#9CA3AF', Deals:'#FBBF24', Other:'#9CA3AF',
}
const SRC_COLORS = {
  'r/gundeals':'#FF4500', 'gun.deals':'#FF6314', 'AmmoLand':'#C8922A',
  'Brownells':'#C084FC', 'PSA':'#34D399', 'Primary Arms':'#60A5FA',
  'MidwayUSA':'#9CA3AF', 'Magpul':'#9CA3AF', 'Mr. Guns N Gear':'#EF4444',
}

function timeAgo(ts) {
  if (!ts) return ''
  const d = Date.now() - Number(ts)
  if (d < 0) return 'just now'
  const m = Math.floor(d / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

export default function DealsPage() {
  const [deals, setDeals]   = useState(SEED_DEALS)
  const [status, setStatus] = useState('loading') // loading | live | seed | error
  const [meta, setMeta]     = useState(null)
  const [filter, setFilter] = useState('all')
  const [sort, setSort]     = useState('hot')

  useEffect(() => { load() }, [])

  async function load() {
    setStatus('loading')
    try {
      const res = await fetch('/api/deals', { cache: 'no-store' })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.deals?.length >= 5) {
        setDeals(data.deals)
        setMeta(data)
        setStatus(data.live ? 'live' : 'seed')
      } else {
        setDeals(SEED_DEALS)
        setStatus('seed')
      }
    } catch {
      setDeals(SEED_DEALS)
      setStatus('seed')
    }
  }

  const allFlairs = ['all', ...new Set(deals.filter(d => !d.pinned).map(d => d.flair).filter(Boolean))]

  let shown = filter === 'all' ? deals : deals.filter(d => d.flair === filter || d.pinned)
  if (sort === 'hot')  shown = [...shown].sort((a, b) => a.pinned ? -1 : b.pinned ? 1 : (b.score||0) - (a.score||0))
  if (sort === 'new')  shown = [...shown].sort((a, b) => a.pinned ? -1 : b.pinned ? 1 : (b.created||0) - (a.created||0))

  const STATUS_CONFIG = {
    loading: { text: 'CONNECTING...', color: '#4B5563', dot: false },
    live:    { text: 'LIVE',          color: '#22C55E', dot: true  },
    seed:    { text: 'FEATURED',      color: '#C8922A', dot: false },
    error:   { text: 'OFFLINE',       color: '#EF4444', dot: false },
  }
  const sc = STATUS_CONFIG[status]

  return (
    <>
      <Masthead />

      {/* Page hero */}
      <div className="page-hero" data-title="DEALS">
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <span style={{ display:'flex', alignItems:'center', gap:'6px', fontFamily:'monospace', fontSize:'11px', color:sc.color, letterSpacing:'0.1em' }}>
              {sc.dot && <span style={{ width:7, height:7, borderRadius:'50%', background:'#22C55E', animation:'pulse 1.2s ease-in-out infinite', display:'inline-block' }} />}
              {sc.text}
            </span>
            {meta && (
              <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563' }}>
                {meta.sources?.reddit > 0 && `${meta.sources.reddit} from r/gundeals · `}
                {meta.sources?.gunDeals > 0 && `${meta.sources.gunDeals} from gun.deals · `}
                {meta.sources?.ammoland > 0 && `${meta.sources.ammoland} from AmmoLand`}
              </span>
            )}
          </div>
          <h1 className="page-hero-title">Live Deals</h1>
          <p className="page-hero-sub">
            r/gundeals · gun.deals · AmmoLand · Mr. Guns N Gear · {shown.length} deals
          </p>
        </div>
      </div>

      <div style={{ padding:'28px 0' }}>
        <div className="container">

          {/* Controls */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'18px', flexWrap:'wrap', gap:'10px' }}>
            {/* Flair filter */}
            <div style={{ display:'flex', gap:'5px', flexWrap:'wrap' }}>
              {allFlairs.slice(0, 9).map(f => {
                const col = f === 'all' ? '#C8922A' : (FLAIR_COLORS[f] || '#9CA3AF')
                return (
                  <button key={f} onClick={() => setFilter(f)}
                    style={{ fontFamily:'monospace', fontSize:'10px', padding:'5px 12px', border:`1px solid ${filter===f ? col : '#1F2428'}`, background:filter===f?`${col}18`:'transparent', color:filter===f?col:'#4B5563', cursor:'pointer', letterSpacing:'0.05em', transition:'all 0.12s' }}>
                    {f === 'all' ? 'All Deals' : f}
                  </button>
                )
              })}
            </div>

            {/* Sort + refresh */}
            <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
              {[['hot','🔥 Hottest'],['new','🆕 Newest']].map(([k,l]) => (
                <button key={k} onClick={() => setSort(k)}
                  style={{ fontFamily:'monospace', fontSize:'10px', padding:'5px 12px', border:`1px solid ${sort===k?'#C8922A':'#1F2428'}`, background:sort===k?'#C8922A20':'transparent', color:sort===k?'#C8922A':'#4B5563', cursor:'pointer' }}>
                  {l}
                </button>
              ))}
              <button onClick={load}
                style={{ fontFamily:'monospace', fontSize:'10px', padding:'5px 12px', border:'1px solid #1F2428', background:'transparent', color:'#6B7280', cursor:'pointer' }}>
                ↺ Refresh
              </button>
            </div>
          </div>

          {/* Source legend */}
          <div style={{ display:'flex', gap:'14px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#374151', letterSpacing:'0.1em' }}>SOURCES:</span>
            {Object.entries(SRC_COLORS).map(([src, col]) => (
              <div key={src} style={{ display:'flex', alignItems:'center', gap:'4px' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:col, display:'inline-block' }} />
                <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#4B5563' }}>{src}</span>
              </div>
            ))}
          </div>

          {/* Deal list */}
          <div style={{ display:'flex', flexDirection:'column', gap:'5px' }}>
            {shown.map((deal, i) => {
              const catCol = FLAIR_COLORS[deal.flair] || '#9CA3AF'
              const srcCol = SRC_COLORS[deal.source] || '#4B5563'
              const hot    = (deal.score || 0) > 400

              return (
                <a key={deal.id || i}
                  href={deal.url} target="_blank" rel="noopener noreferrer"
                  style={{
                    display:'grid', gridTemplateColumns:'56px 1fr auto',
                    gap:'14px', alignItems:'center',
                    background: deal.pinned ? '#0D1117' : '#111318',
                    border:`1px solid ${deal.pinned ? '#C8922A50' : '#1F2428'}`,
                    borderLeft: hot ? `3px solid ${catCol}` : deal.pinned ? '3px solid #C8922A' : '3px solid transparent',
                    padding:'12px 18px', textDecoration:'none',
                    transition:'border-color 0.12s',
                  }}>

                  {/* Score column */}
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    {deal.score != null ? (
                      <>
                        <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.35rem', lineHeight:1, color: deal.score > 600 ? '#EF4444' : deal.score > 200 ? '#C8922A' : '#6B7280' }}>
                          {deal.score > 999 ? `${(deal.score/1000).toFixed(1)}k` : deal.score}
                        </div>
                        <div style={{ fontFamily:'monospace', fontSize:'7px', color:'#374151' }}>▲ HOT</div>
                      </>
                    ) : (
                      <div style={{ fontFamily:'monospace', fontSize:'8px', color:srcCol, lineHeight:1.4, textAlign:'center' }}>
                        {deal.pinned ? '★\nFEAT' : '●'}
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', gap:'5px', marginBottom:'4px', flexWrap:'wrap', alignItems:'center' }}>
                      {deal.flair && (
                        <span style={{ fontFamily:'monospace', fontSize:'9px', color:catCol, background:`${catCol}18`, padding:'1px 7px', letterSpacing:'0.05em', flexShrink:0 }}>
                          {deal.flair.toUpperCase()}
                        </span>
                      )}
                      {hot && <span style={{ fontFamily:'monospace', fontSize:'8px', color:'#EF4444', background:'#1A0000', padding:'1px 6px' }}>🔥 HOT</span>}
                      {deal.pinned && <span style={{ fontFamily:'monospace', fontSize:'8px', color:'#C8922A', background:'#1A0E00', padding:'1px 6px' }}>★ PARTNER</span>}
                    </div>
                    <div style={{ fontSize:'14px', fontWeight:600, color:'#F0EDE6', lineHeight:1.35, marginBottom:'5px', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {deal.title}
                    </div>
                    <div style={{ display:'flex', gap:'10px', fontFamily:'monospace', fontSize:'10px', color:'#4B5563', flexWrap:'wrap' }}>
                      <span style={{ color:srcCol, fontWeight:700 }}>● {deal.source}</span>
                      {deal.domain && deal.domain !== deal.source && <span>{deal.domain}</span>}
                      <span>{timeAgo(deal.created)}</span>
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ flexShrink:0 }}>
                    <span style={{
                      fontFamily:'monospace', fontSize:'11px', padding:'6px 14px',
                      display:'block', whiteSpace:'nowrap', letterSpacing:'0.03em',
                      border:`1px solid #C8922A`,
                      background: deal.pinned ? '#C8922A' : 'transparent',
                      color: deal.pinned ? '#000' : '#C8922A',
                    }}>
                      {deal.pinned ? 'SHOP ★' : 'VIEW →'}
                    </span>
                  </div>
                </a>
              )
            })}
          </div>

          {/* Footer note */}
          <div style={{ marginTop:'20px', padding:'14px 18px', background:'#111318', border:'1px solid #1F2428', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:'8px' }}>
            <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#374151', lineHeight:1.6 }}>
              Deals sourced from r/gundeals, gun.deals, AmmoLand, and retail partners. Always verify pricing at the retailer before purchasing. DownRange is not responsible for pricing errors.
            </span>
            <div style={{ display:'flex', gap:'12px', flexShrink:0 }}>
              <a href="https://www.reddit.com/r/gundeals" target="_blank" rel="noreferrer" style={{ fontFamily:'monospace', fontSize:'10px', color:'#FF4500', textDecoration:'none' }}>r/gundeals ↗</a>
              <a href="https://gun.deals" target="_blank" rel="noreferrer" style={{ fontFamily:'monospace', fontSize:'10px', color:'#FF6314', textDecoration:'none' }}>gun.deals ↗</a>
              <a href="https://www.mrgunsngear.com/shop/" target="_blank" rel="noreferrer" style={{ fontFamily:'monospace', fontSize:'10px', color:'#EF4444', textDecoration:'none' }}>MrGunsNGear ↗</a>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
