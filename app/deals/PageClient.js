'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import { sendGAEvent } from '@next/third-parties/google'

// ── FLAIR CONFIG ──────────────────────────────────────────────────────────────
const FLAIR_META = {
  'Handgun':     { color:'#60A5FA', bg:'rgba(96,165,250,0.12)',  label:'HANDGUN'     },
  'Rifle':       { color:'#34D399', bg:'rgba(52,211,153,0.12)',  label:'RIFLE'       },
  'Shotgun':     { color:'#FBBF24', bg:'rgba(251,191,36,0.12)',  label:'SHOTGUN'     },
  'Ammo':        { color:'#C8922A', bg:'rgba(200,146,42,0.12)',  label:'AMMO'        },
  'Accessories': { color:'#C084FC', bg:'rgba(192,132,252,0.12)', label:'ACCESSORIES' },
  'NFA':         { color:'#EF4444', bg:'rgba(239,68,68,0.12)',   label:'NFA'         },
  'Optic':       { color:'#34D399', bg:'rgba(52,211,153,0.12)',  label:'OPTIC'       },
  'Gear':        { color:'#9CA3AF', bg:'rgba(156,163,175,0.12)', label:'GEAR'        },
  'Deals':       { color:'#FBBF24', bg:'rgba(251,191,36,0.12)',  label:'DEAL'        },
  'Other':       { color:'#4B5563', bg:'rgba(75,85,99,0.12)',    label:'OTHER'       },
}

const CATS = [
  { val:null,          label:'All Deals',       icon:'🔥' },
  { val:'Handgun',     label:'Handguns',         icon:'🔫' },
  { val:'Rifle',       label:'Rifles',           icon:'🎯' },
  { val:'Shotgun',     label:'Shotguns',         icon:'💥' },
  { val:'Ammo',        label:'Ammo',             icon:'◎'  },
  { val:'NFA',         label:'NFA / Suppressors',icon:'🔇' },
  { val:'Optic',       label:'Optics',           icon:'🔭' },
  { val:'Accessories', label:'Accessories',      icon:'⚙'  },
  { val:'Gear',        label:'Gear',             icon:'🎒' },
]

// No fake seed deals — page starts empty, real data loads from API
const SEED = []

// ── HELPERS ───────────────────────────────────────────────────────────────────
function timeAgo(ts) {
  if (!ts) return ''
  const d = Date.now() - Number(ts)
  if (d < 0) return 'just now'
  const m = Math.floor(d / 60000)
  if (m < 2) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function scoreColor(s) {
  if (!s) return '#4B5563'
  if (s >= 1000) return '#EF4444'
  if (s >= 500)  return '#F97316'
  if (s >= 200)  return '#C8922A'
  return '#6B7280'
}

// ── DEAL CARD (Amazon-style product tile) ─────────────────────────────────────
function DealCard({ deal }) {
  const [imgError, setImgError] = useState(false)
  const fm = FLAIR_META[deal.flair] || FLAIR_META.Other
  const hasImage = deal.imageUrl && !imgError

  // Strip [Flair] prefix from title for cleaner display
  const cleanTitle = deal.title
    .replace(/^\[(handgun|rifle|shotgun|ammo|ammo|optic|nfa|accessories|gear|deal|deals?|other)\]\s*/i, '')
    .trim()

  const price = deal.price || null
  const isHot = (deal.score || 0) >= 300

  return (
    <a href={deal.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration:'none', display:'block' }}
      onClick={() => sendGAEvent('event', 'deal_click', {
        deal_title:  deal.title?.slice(0, 100),
        deal_flair:  deal.flair,
        deal_source: deal.source,
        deal_domain: deal.domain,
        deal_price:  deal.price,
        deal_score:  deal.score,
      })}
      onMouseEnter={e => e.currentTarget.querySelector('.deal-card-inner').style.borderColor = fm.color}
      onMouseLeave={e => e.currentTarget.querySelector('.deal-card-inner').style.borderColor = 'var(--border)'}>
      <div className="deal-card-inner" style={{
        background:'var(--bg2)',
        border:'1px solid var(--border)',
        overflow:'hidden',
        height:'100%',
        display:'flex',
        flexDirection:'column',
        transition:'border-color 0.15s, transform 0.15s',
        position:'relative',
      }}>

        {/* Image area */}
        <div style={{
          width:'100%',
          height:180,
          background:'#0D0E10',
          overflow:'hidden',
          position:'relative',
          flexShrink:0,
        }}>
          {hasImage ? (
            <img
              src={deal.imageUrl}
              alt={cleanTitle}
              onError={() => setImgError(true)}
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }}
            />
          ) : (
            /* Placeholder with flair icon + gradient */
            <div style={{
              width:'100%', height:'100%',
              background:`linear-gradient(135deg, #0D0E10 0%, ${fm.bg} 100%)`,
              display:'flex', alignItems:'center', justifyContent:'center',
              flexDirection:'column', gap:8,
            }}>
              <span style={{ fontSize:40, opacity:0.25, lineHeight:1 }}>
                {deal.flair === 'Ammo' ? '◎' :
                 deal.flair === 'Rifle' ? '◈' :
                 deal.flair === 'NFA' ? '◈' :
                 deal.flair === 'Optic' ? '◎' : '◉'}
              </span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:fm.color, opacity:0.5, letterSpacing:'0.15em' }}>
                {fm.label}
              </span>
            </div>
          )}

          {/* Badges overlaid on image */}
          <div style={{ position:'absolute', top:8, left:8, display:'flex', gap:4, flexDirection:'column', alignItems:'flex-start' }}>
            <span style={{
              background:fm.bg,
              color:fm.color,
              fontFamily:"'IBM Plex Mono',monospace",
              fontSize:8, fontWeight:700, letterSpacing:'0.12em',
              padding:'2px 7px',
              border:`1px solid ${fm.color}40`,
              backdropFilter:'blur(4px)',
            }}>{fm.label}</span>
            {isHot && (
              <span style={{ background:'#B91C1C', color:'#fff', fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, padding:'2px 6px', letterSpacing:'0.1em' }}>
                🔥 HOT
              </span>
            )}
          </div>

          {/* Score badge top-right */}
          {deal.score != null && (
            <div style={{
              position:'absolute', top:8, right:8,
              background:'rgba(9,9,11,0.85)',
              border:`1px solid ${scoreColor(deal.score)}40`,
              padding:'3px 7px',
              backdropFilter:'blur(4px)',
              textAlign:'center',
            }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:15, color:scoreColor(deal.score), lineHeight:1 }}>
                {deal.score >= 1000 ? `${(deal.score/1000).toFixed(1)}k` : deal.score}
              </div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7, color:'#4B5563', letterSpacing:'0.08em' }}>▲</div>
            </div>
          )}
        </div>

        {/* Content */}
        <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', flex:1, gap:6 }}>

          {/* Price — prominent like Amazon */}
          {price && (
            <div style={{
              fontFamily:"'Bebas Neue',cursive",
              fontSize:'1.5rem',
              color:'var(--gold)',
              letterSpacing:'0.03em',
              lineHeight:1,
            }}>{price}</div>
          )}

          {/* Title */}
          <div style={{
            fontFamily:"'Barlow Condensed',sans-serif",
            fontSize:14,
            fontWeight:600,
            color:'var(--text)',
            lineHeight:1.35,
            display:'-webkit-box',
            WebkitLineClamp:3,
            WebkitBoxOrient:'vertical',
            overflow:'hidden',
            flex:1,
          }}>{cleanTitle}</div>

          {/* Meta row */}
          <div style={{
            display:'flex', justifyContent:'space-between', alignItems:'center',
            marginTop:'auto',
            paddingTop:8,
            borderTop:'1px solid var(--border)',
          }}>
            <div style={{ display:'flex', flexDirection:'column', gap:2 }}>
              <span style={{
                fontFamily:"'IBM Plex Mono',monospace",
                fontSize:9, fontWeight:700,
                color: deal.source === 'r/gundeals' ? '#FF4500' :
                       deal.source === 'gun.deals'  ? '#FF6314' :
                       deal.source === 'AmmoLand'   ? '#C8922A' : '#6B7280',
                letterSpacing:'0.05em',
              }}>● {deal.source}</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563' }}>
                {deal.domain && deal.domain !== deal.source ? deal.domain + ' · ' : ''}
                {timeAgo(deal.created)}
              </span>
            </div>
            {deal.comments != null && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563' }}>
                💬 {deal.comments}
              </span>
            )}
          </div>

        </div>

        {/* Bottom CTA strip */}
        <div style={{
          padding:'8px 14px',
          background:'var(--bg3)',
          borderTop:'1px solid var(--border)',
          fontFamily:"'IBM Plex Mono',monospace",
          fontSize:10, fontWeight:700,
          color:'var(--gold)',
          letterSpacing:'0.08em',
          textAlign:'center',
        }}>
          VIEW DEAL →
        </div>
      </div>
    </a>
  )
}

// ── PAGE ───────────────────────────────────────────────────────────────────────
export default function DealsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [deals,    setDeals]    = useState(SEED)
  const [status,   setStatus]   = useState('loading')
  const [meta,     setMeta]     = useState(null)
  const [cat,      setCat]      = useState(() => searchParams.get('cat') || null)
  const [sort,     setSort]     = useState(() => searchParams.get('sort') || 'hot')
  const [search,   setSearch]   = useState(() => searchParams.get('q') || '')
  const [lastFetch,setLastFetch]= useState(null)

  // Sync URL when cat/sort changes
  useEffect(() => {
    const p = new URLSearchParams()
    if (cat)  p.set('cat',  cat)
    if (sort && sort !== 'hot') p.set('sort', sort)
    if (search) p.set('q', search)
    const qs = p.toString()
    router.replace(qs ? `/deals?${qs}` : '/deals', { scroll: false })
  }, [cat, sort, search])

  const load = useCallback(async (c, s, q) => {
    setStatus('loading')
    try {
      const params = new URLSearchParams()
      if (c) params.set('cat', c)
      if (s) params.set('sort', s)
      const res  = await fetch(`/api/deals?${params}`, { cache:'no-store' })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      if (data.deals?.length >= 0) {
        setDeals(data.deals)
        setMeta(data)
        setStatus(data.live ? 'live' : 'seed')
      } else {
        setDeals([])
        setStatus('empty')
      }
      setLastFetch(Date.now())
    } catch {
      setDeals([])
      setStatus('error')
    }
  }, [])

  useEffect(() => { load(cat, sort, search) }, [cat, sort, load])

  const totalSources = meta
    ? [meta.sources?.sanity   > 0 && `${meta.sources.sanity} curated`,
       meta.sources?.reddit   > 0 && `r/gundeals`,
       meta.sources?.gunDeals > 0 && `gun.deals`]
        .filter(Boolean).join(', ')
    : ''

  return (
    <>
      <Masthead />

      {/* ── HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:20, paddingTop:10 }}>DEALS</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:640 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>LIVE DEALS</span>
              {status === 'live' && (
                <span style={{ display:'flex', alignItems:'center', gap:5, background:'#001A0A', color:'#22C55E', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, padding:'3px 10px', border:'1px solid #22C55E40' }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', animation:'pulse 1.2s infinite', display:'inline-block' }} />
                  LIVE
                </span>
              )}
              {status === 'loading' && (
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4B5563' }}>CONNECTING...</span>
              )}
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:14 }}>
              Firearms &amp; Ammo<br />
              <span style={{ color:'var(--gold)' }}>Best Deals Today</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:16, color:'var(--text-muted)', lineHeight:1.7, maxWidth:520 }}>
              {deals.length > 0 ? `${deals.length} deals` : 'Loading deals...'} · Curated + r/gundeals + gun.deals · Updated every 30 min
              {totalSources && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4B5563', display:'block', marginTop:4 }}>{totalSources}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY BAR (standard DownRange pattern) ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', justifyContent:'space-between', alignItems:'stretch' }}>

            {/* Category tabs */}
            <div style={{ display:'flex', gap:0, overflowX:'auto', scrollbarWidth:'none' }}>
              {CATS.map(cat_ => {
                const active = cat === cat_.val
                return (
                  <button key={cat_.val || 'all'}
                    onClick={() => setCat(cat_.val)}
                    style={{
                      display:'inline-flex', alignItems:'center', gap:5,
                      padding:'12px 16px',
                      fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
                      border:'none',
                      borderBottom:`2px solid ${active ? 'var(--gold)' : 'transparent'}`,
                      color: active ? 'var(--gold)' : 'var(--text-dim)',
                      background:'none', cursor:'pointer',
                      whiteSpace:'nowrap', letterSpacing:'0.05em',
                      transition:'color 0.15s',
                    }}>
                    <span style={{ opacity: active ? 1 : 0.6 }}>{cat_.icon}</span>
                    {cat_.label}
                  </button>
                )
              })}
            </div>

            {/* Sort + Search + Refresh */}
            <div style={{ display:'flex', gap:4, alignItems:'center', padding:'0 0 0 12px', borderLeft:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563' }}>SORT:</span>
              {[['hot','🔥 Hot'],['new','🆕 New']].map(([k,l]) => (
                <button key={k} onClick={() => setSort(k)}
                  style={{
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:10,
                    padding:'4px 10px',
                    border:`1px solid ${sort===k ? 'var(--gold)' : 'var(--border)'}`,
                    background: sort===k ? 'rgba(200,146,42,0.15)' : 'transparent',
                    color: sort===k ? 'var(--gold)' : 'var(--text-dim)',
                    cursor:'pointer', transition:'all 0.12s',
                  }}>
                  {l}
                </button>
              ))}
              <button onClick={() => load(cat, sort)}
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'4px 10px', border:'1px solid var(--border)', background:'transparent', color:'var(--text-dim)', cursor:'pointer' }}
                title="Refresh deals">↺</button>
            </div>

            {/* Search */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'0 0 0 12px', borderLeft:'1px solid var(--border)' }}>
              <input
                type="search"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search deals…"
                style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
                  background:'var(--bg)', border:'1px solid var(--border)',
                  color:'var(--text)', padding:'5px 10px', width:160, outline:'none',
                }}
              />
              {search && (
                <button onClick={() => setSearch('')}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', background:'none', border:'none', cursor:'pointer', padding:'0 4px' }}>
                  ✕
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          <style>{`
            @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
            @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
            .deal-card-inner:hover { transform: translateY(-2px); }
          `}</style>

          {/* Loading skeleton */}
          {status === 'loading' && deals.length === 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12, marginBottom:24 }}>
              {[...Array(12)].map((_,i) => (
                <div key={i} style={{ height:340, background:'linear-gradient(90deg, var(--bg2) 25%, var(--bg3) 50%, var(--bg2) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', borderRadius:0, border:'1px solid var(--border)' }} />
              ))}
            </div>
          )}

          {/* Deal grid — Amazon product tile style */}
          {(status !== 'loading' || deals.length > 0) && (
            <>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)' }}>
                  {deals.length} {cat ? `${cat} ` : ''}deals
                  {lastFetch && <span style={{ marginLeft:8, color:'#4B5563' }}>· refreshed {timeAgo(lastFetch)}</span>}
                </div>
                <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                  {[['Curated','#C8922A'],['r/gundeals','#FF4500'],['gun.deals','#FF6314']].map(([src,col])=>(
                    <div key={src} style={{ display:'flex', alignItems:'center', gap:4 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:col }} />
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563' }}>{src}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(210px, 1fr))', gap:12 }}>
                {(search
                    ? deals.filter(d => d.title?.toLowerCase().includes(search.toLowerCase()) || d.source?.toLowerCase().includes(search.toLowerCase()))
                    : deals
                  ).map((deal, i) => <DealCard key={deal.id || i} deal={deal} />)}
              </div>

              {deals.length === 0 && (
                <div style={{ padding:'80px', textAlign:'center', color:'#4B5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
                  No deals found for this category. Try &quot;All Deals&quot; or refresh.
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div style={{ marginTop:32, padding:'14px 18px', background:'var(--bg2)', border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563', lineHeight:1.6 }}>
              Deals sourced from DownRange curated picks, r/gundeals, and gun.deals. Always verify pricing at the retailer before purchasing.
            </span>
            <div style={{ display:'flex', gap:12, flexShrink:0 }}>
              <a href="https://www.reddit.com/r/gundeals" target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#FF4500', textDecoration:'none' }}>r/gundeals ↗</a>
              <a href="https://gun.deals" target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#FF6314', textDecoration:'none' }}>gun.deals ↗</a>
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
