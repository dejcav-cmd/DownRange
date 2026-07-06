'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import EmailCapture from '../../components/ui/EmailCapture'
import { sendGAEvent } from '@next/third-parties/google'

const GOLD  = 'var(--gold)'
const MONO  = "'IBM Plex Mono',monospace"
const BARLOW= "'Barlow Condensed',sans-serif"
const BEBAS = "'Bebas Neue',cursive"
const PER_PAGE = 24

// ── FLAIR META (for card badge color only) ────────────────────────────────────
const FLAIR_META = {
  Handgun:    { color:'#60A5FA' }, Rifle:      { color:'#34D399' },
  Shotgun:    { color:'#FBBF24' }, Ammo:       { color:'#C8922A' },
  Accessories:{ color:'#C084FC' }, NFA:        { color:'#EF4444' },
  Optic:      { color:'#34D399' }, Gear:       { color:'#9CA3AF' },
  Deals:      { color:'#FBBF24' }, Other:      { color:'#4B5563' },
}

function timeAgo(ts) {
  if (!ts) return ''
  const d = Date.now() - Number(ts)
  if (d < 0) return 'just now'
  const m = Math.floor(d / 60000)
  if (m < 2)  return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

// ── STATE LEGALITY VERDICT ────────────────────────────────────────────────────
const V_STYLE = {
  ok:   { bg:'rgba(34,197,94,.09)',  bd:'rgba(34,197,94,.28)',  fg:'#6ee7a3' },
  warn: { bg:'rgba(245,158,11,.09)', bd:'rgba(245,158,11,.28)', fg:'#fbbf68' },
  no:   { bg:'rgba(239,68,68,.09)',  bd:'rgba(239,68,68,.28)',  fg:'#fca5a5' },
}
function inferCat(title = '') {
  const t = title.toLowerCase()
  if (/magazine|pmag|\bmag\b|\bdrum\b/.test(t)) return 'MAGAZINE'
  if (/suppressor|silencer|\bnfa\b|form ?4/.test(t)) return 'SUPPRESSOR'
  if (/ar-?15|ak-?47|\brifle\b|carbine|\bsbr\b|upper|lower receiver/.test(t)) return 'RIFLE'
  if (/\bammo\b|9mm|5\.56|\.223|\.308|7\.62|\.45|rounds|\bgr\b fmj/.test(t)) return 'AMMO'
  if (/pistol|handgun|glock|sig ?p|revolver|1911/.test(t)) return 'HANDGUN'
  return 'GENERAL'
}
function stateVerdict(title, s) {
  if (!s) return null
  const ok = t => ({ lvl:'ok', ico:'✓', text:t }), warn = t => ({ lvl:'warn', ico:'⚠', text:t }), no = t => ({ lvl:'no', ico:'✗', text:t })
  switch (inferCat(title)) {
    case 'RIFLE':      if (s.awbFull) return no(`Banned config in ${s.name}`); if (s.awbRestricted) return warn(`${s.name}: featureless required`); return ok(`Legal in ${s.name}`)
    case 'MAGAZINE':   if (s.mag) return no(`Blocked — ${s.mag}-rd max in ${s.name}`); return ok(`Legal in ${s.name}`)
    case 'SUPPRESSOR': if (!s.suppLegal) return no(`Illegal in ${s.name}`); return ok('Legal · NFA')
    case 'AMMO':       if (s.abbr === 'CA') return warn('CA: in-person + background check'); if (s.abbr === 'NY') return warn('NY: dealer transfer only'); return ok('Ships to your door')
    case 'HANDGUN':    if (s.abbr === 'CA') return warn('Must be on CA roster'); if (s.awbFull || s.abbr === 'NY') return warn(`${s.name}: permit required`); return ok(`Legal in ${s.name}`)
    default:           return ok(`No state restriction`)
  }
}

// ── DEAL CARD ─────────────────────────────────────────────────────────────────
function DealCard({ deal, stateObj }) {
  const [imgError, setImgError] = useState(false)
  const fm = FLAIR_META[deal.flair] || FLAIR_META.Other
  const hasImage = deal.imageUrl && !imgError
  const cleanTitle = (deal.title || '')
    .replace(/^\[(handgun|rifle|shotgun|ammo|optic|nfa|accessories|gear|deal|deals?|other)\]\s*/i, '')
    .trim()
  const isHot = (deal.score || 0) >= 300

  return (
    <a href={deal.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration:'none', display:'block' }}
      onClick={() => sendGAEvent('event', 'deal_click', {
        deal_title: deal.title?.slice(0,100), deal_source: deal.source,
        deal_price: deal.price, deal_score: deal.score,
      })}
      onMouseEnter={e => e.currentTarget.querySelector('.dc-inner').style.borderColor = fm.color}
      onMouseLeave={e => e.currentTarget.querySelector('.dc-inner').style.borderColor = 'var(--border)'}>
      <div className="dc-inner" style={{
        background:'var(--bg2)', border:'1px solid var(--border)',
        overflow:'hidden', height:'100%', display:'flex', flexDirection:'column',
        transition:'border-color 0.15s, transform 0.15s', position:'relative',
      }}>
        {/* Image */}
        <div style={{ width:'100%', height:160, background:'#0D0E10', overflow:'hidden', flexShrink:0, position:'relative' }}>
          {hasImage ? (
            <img src={deal.imageUrl} alt={cleanTitle} onError={() => setImgError(true)}
              loading="lazy" referrerPolicy="no-referrer"
              style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
          ) : (
            <div style={{
              width:'100%', height:'100%',
              background:`linear-gradient(135deg, ${fm.bg} 0%, #0D0E10 72%)`,
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:7,
            }}>
              <span style={{ fontFamily:BEBAS, fontSize:'1.5rem', color:fm.color, letterSpacing:'.04em', opacity:.6 }}>{fm.label}</span>
              <span style={{ fontFamily:MONO, fontSize:9, color:'#4B5563', letterSpacing:'.14em' }}>DOWNRANGE</span>
            </div>
          )}
          {/* Flair badge */}
          {deal.flair && deal.flair !== 'Other' && (
            <span style={{
              position:'absolute', top:8, left:8,
              background: fm.color + '22', border:`1px solid ${fm.color}55`,
              color: fm.color, fontFamily:MONO, fontSize:9,
              padding:'2px 7px', letterSpacing:'.08em', textTransform:'uppercase',
            }}>{deal.flair}</span>
          )}
          {isHot && (
            <span style={{
              position:'absolute', top:8, right:8,
              background:'rgba(239,68,68,0.15)', border:'1px solid #ef444440',
              color:'#ef4444', fontFamily:MONO, fontSize:9, padding:'2px 6px',
            }}>🔥 HOT</span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', flex:1, gap:6 }}>
          {deal.price && (
            <div style={{ fontFamily:BEBAS, fontSize:'1.4rem', color:GOLD, lineHeight:1 }}>
              {deal.price}
            </div>
          )}
          <div style={{ fontFamily:BARLOW, fontSize:14, fontWeight:700, color:'var(--text)', lineHeight:1.3, flex:1 }}>
            {cleanTitle}
          </div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:4 }}>
            <span style={{ fontFamily:MONO, fontSize:9, color:'#4B5563' }}>
              {deal.domain || deal.source}
            </span>
            <span style={{ fontFamily:MONO, fontSize:9, color:'#374151' }}>
              {timeAgo(deal.created)}
            </span>
          </div>
          {deal.score !== null && deal.score !== undefined && (
            <div style={{ fontFamily:MONO, fontSize:9, color:'#374151' }}>
              ▲ {deal.score} · {deal.comments || 0} comments
            </div>
          )}
        </div>

        {/* Per-state legality verdict */}
        {stateObj && (() => {
          const v = stateVerdict(deal.title || '', stateObj)
          const vs = V_STYLE[v.lvl]
          return (
            <div style={{ margin:'0 14px 8px', fontFamily:MONO, fontSize:9.5, lineHeight:1.4, padding:'6px 8px', display:'flex', gap:6, alignItems:'flex-start', background:vs.bg, border:`1px solid ${vs.bd}`, color:vs.fg }}>
              <span style={{ fontWeight:700 }}>{v.ico}</span><span>{v.text}</span>
            </div>
          )
        })()}

        {/* CTA */}
        <div style={{ padding:'8px 14px 12px' }}>
          <div style={{
            background:GOLD, color:'#000', fontFamily:BEBAS, fontSize:'0.9rem',
            letterSpacing:'.08em', padding:'6px 14px', textAlign:'center',
          }}>VIEW DEAL →</div>
        </div>
      </div>
    </a>
  )
}

// ── INNER PAGE (uses useSearchParams — must be inside Suspense) ───────────────
function DealsInner({ states = [] }) {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [deals,     setDeals]     = useState([])
  const [status,    setStatus]    = useState('loading')
  const [meta,      setMeta]      = useState(null)
  const [sort,      setSort]      = useState(() => searchParams.get('sort') || 'hot')
  const [search,    setSearch]    = useState(() => searchParams.get('q') || '')
  const [page,      setPage]      = useState(() => parseInt(searchParams.get('p') || '1'))
  const [stateFilter, setStateFilter] = useState('')
  const selState = states.find(s => s.abbr === stateFilter) || null
  const [lastFetch, setLastFetch] = useState(null)
  const searchInput = useRef(null)

  // Sync URL
  useEffect(() => {
    const p = new URLSearchParams()
    if (sort && sort !== 'hot') p.set('sort', sort)
    if (search) p.set('q', search)
    if (page > 1) p.set('p', String(page))
    const qs = p.toString()
    router.replace(qs ? `/deals?${qs}` : '/deals', { scroll: false })
  }, [sort, search, page])

  const load = useCallback(async (s) => {
    setStatus('loading')
    try {
      const params = new URLSearchParams()
      if (s) params.set('sort', s)
      const res  = await fetch(`/api/deals?${params}`, { cache:'no-store' })
      if (!res.ok) throw new Error('API error')
      const data = await res.json()
      setDeals(data.deals || [])
      setMeta(data)
      setStatus(data.live ? 'live' : 'loaded')
      setLastFetch(Date.now())
    } catch {
      setDeals([])
      setStatus('error')
    }
  }, [])

  useEffect(() => { load(sort) }, [sort])

  // Reset page when search changes
  useEffect(() => { setPage(1) }, [search])

  // Client-side search filter
  const filtered = search
    ? deals.filter(d =>
        (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.source || '').toLowerCase().includes(search.toLowerCase()) ||
        (d.domain || '').toLowerCase().includes(search.toLowerCase())
      )
    : deals

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const safePage   = Math.min(Math.max(1, page), totalPages)
  const paginated  = filtered.slice((safePage - 1) * PER_PAGE, safePage * PER_PAGE)

  function handleSearch(e) {
    e.preventDefault()
    const q = searchInput.current?.value || ''
    setSearch(q)
    setPage(1)
  }

  const sources = meta
    ? [meta.sources?.sanity   > 0 && `${meta.sources.sanity} curated`,
       meta.sources?.gunDeals > 0 && `gun.deals`,
       meta.sources?.amazon   > 0 && `amazon`]
        .filter(Boolean).join(' · ')
    : null

  return (
    <>
      <Masthead />
      <EmailCapture variant="banner" />

      <main style={{ background:'var(--bg)', minHeight:'100vh' }}>

        {/* Hero */}
        <div style={{
          background:'radial-gradient(ellipse at top, rgba(200,146,42,.1) 0%, transparent 60%)',
          borderBottom:'1px solid var(--border)', padding:'48px 24px 32px',
        }}>
          <div className="container">
            <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:16 }}>
              <div>
                <div style={{ fontFamily:MONO, fontSize:11, color:GOLD, letterSpacing:'.18em', textTransform:'uppercase', marginBottom:8 }}>
                  {status === 'live' && (
                    <span style={{ display:'inline-flex', alignItems:'center', gap:5, marginRight:10,
                      color:'#22C55E', background:'#001A0A', border:'1px solid #22C55E40',
                      padding:'2px 8px', fontSize:10 }}>
                      <span style={{ width:5, height:5, borderRadius:'50%', background:'#22C55E',
                        animation:'pulse 1.2s infinite', display:'inline-block' }} /> LIVE
                    </span>
                  )}
                  Live Deals · Updated every 30 min
                </div>
                <h1 style={{ fontFamily:BEBAS, fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'.02em', lineHeight:0.95, marginBottom:12 }}>
                  Firearms &amp; Ammo<br />
                  <span style={{ color:GOLD }}>Best Deals Today</span>
                </h1>
                <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:15, color:'var(--text-muted)', lineHeight:1.6, maxWidth:500 }}>
                  {filtered.length > 0 ? `${filtered.length} deals` : status === 'loading' ? 'Loading…' : 'No deals found'}
                  {sources && <span style={{ fontFamily:MONO, fontSize:10, color:'#4B5563', marginLeft:8 }}>· {sources}</span>}
                </p>
              </div>
              {/* Stats */}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {[
                  ['🔥', deals.length, 'Total Deals'],
                  ['⭐', deals.filter(d => (d.score||0) >= 300).length, 'Hot'],
                  ['🆕', deals.filter(d => Date.now() - d.created < 3600000 * 6).length, 'Last 6h'],
                ].map(([icon, val, label]) => (
                  <div key={label} style={{ background:'rgba(200,146,42,.06)', border:'1px solid rgba(200,146,42,.18)', padding:'10px 18px', textAlign:'center', minWidth:72 }}>
                    <div style={{ fontSize:18 }}>{icon}</div>
                    <div style={{ fontFamily:BEBAS, fontSize:'1.3rem', color:GOLD, lineHeight:1 }}>{val}</div>
                    <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', letterSpacing:'.1em', textTransform:'uppercase', marginTop:2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── STICKY TOOLBAR ── */}
        <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
          <div className="container">
            <div style={{ display:'flex', alignItems:'stretch', justifyContent:'space-between', gap:0 }}>

              {/* Sort */}
              <div style={{ display:'flex', alignItems:'center', gap:4, padding:'8px 0' }}>
                <span style={{ fontFamily:MONO, fontSize:10, color:'#4B5563', marginRight:4 }}>SORT:</span>
                {[['hot','🔥 Hot'],['new','🆕 New']].map(([k,l]) => (
                  <button key={k} onClick={() => { setSort(k); setPage(1) }}
                    style={{
                      fontFamily:MONO, fontSize:10, padding:'5px 12px', cursor:'pointer',
                      border:`1px solid ${sort===k ? GOLD : 'var(--border)'}`,
                      background: sort===k ? 'rgba(200,146,42,0.15)' : 'transparent',
                      color: sort===k ? GOLD : 'var(--text-dim)',
                      transition:'all 0.12s',
                    }}>{l}</button>
                ))}
                <button onClick={() => load(sort)}
                  title="Refresh"
                  style={{ fontFamily:MONO, fontSize:11, padding:'5px 10px', border:'1px solid var(--border)', background:'transparent', color:'var(--text-dim)', cursor:'pointer' }}>↺</button>
              </div>

              {/* State legality filter */}
              {states.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 0 8px 12px', borderLeft:'1px solid var(--border)' }}>
                  <span style={{ fontFamily:MONO, fontSize:10, color:'#4B5563' }}>STATE:</span>
                  <select value={stateFilter} onChange={e => setStateFilter(e.target.value)}
                    style={{ fontFamily:MONO, fontSize:10, background:'var(--bg)', color:'var(--text)', border:`1px solid ${stateFilter ? GOLD : 'var(--border)'}`, padding:'5px 8px', cursor:'pointer', maxWidth:150 }}>
                    <option value="">Check legality…</option>
                    {states.map(s => <option key={s.abbr} value={s.abbr}>{s.name}</option>)}
                  </select>
                  {stateFilter && (
                    <button onClick={() => setStateFilter('')}
                      style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', background:'none', border:'none', cursor:'pointer' }}>✕</button>
                  )}
                </div>
              )}

              {/* Search */}
              <form onSubmit={handleSearch}
                style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 0 8px 12px', borderLeft:'1px solid var(--border)' }}>
                <input
                  ref={searchInput}
                  type="search"
                  defaultValue={search}
                  placeholder="Search deals…"
                  style={{
                    fontFamily:MONO, fontSize:11,
                    background:'var(--bg)', border:'1px solid var(--border)',
                    color:'var(--text)', padding:'5px 10px', width:200, outline:'none',
                  }}
                />
                <button type="submit"
                  style={{ fontFamily:MONO, fontSize:10, background:GOLD, color:'#000', border:'none', padding:'6px 12px', cursor:'pointer', fontWeight:700 }}>⌕</button>
                {search && (
                  <button type="button" onClick={() => { setSearch(''); setPage(1); if (searchInput.current) searchInput.current.value = '' }}
                    style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', background:'none', border:'none', cursor:'pointer' }}>✕ Clear</button>
                )}
              </form>

            </div>
          </div>
        </div>

        <div className="dr-page">
          <div className="container">
            <style>{`
              @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
              @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
              .dc-inner:hover { transform: translateY(-2px); }
            `}</style>

            {/* Count + last fetch */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:8 }}>
              <div style={{ fontFamily:MONO, fontSize:11, color:'var(--text-dim)' }}>
                {search
                  ? <>{filtered.length} result{filtered.length !== 1 ? 's' : ''} for <span style={{ color:GOLD }}>"{search}"</span></>
                  : <>{filtered.length} deals</>
                }
                {lastFetch && <span style={{ marginLeft:8, color:'#4B5563' }}>· refreshed {timeAgo(lastFetch)}</span>}
              </div>
              <div style={{ fontFamily:MONO, fontSize:10, color:'#374151' }}>
                Page {safePage} of {totalPages}
              </div>
            </div>

            {/* Loading skeleton */}
            {status === 'loading' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12, marginBottom:24 }}>
                {[...Array(PER_PAGE)].map((_,i) => (
                  <div key={i} style={{ height:320, background:'linear-gradient(90deg, var(--bg2) 25%, var(--bg3,#1a1d22) 50%, var(--bg2) 75%)', backgroundSize:'200% 100%', animation:'shimmer 1.5s infinite', border:'1px solid var(--border)' }} />
                ))}
              </div>
            )}

            {/* Deal grid */}
            {status !== 'loading' && (
              <>
                {paginated.length > 0 ? (
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12, marginBottom:32 }}>
                    {paginated.map((deal, i) => <DealCard key={deal.id || i} deal={deal} stateObj={selState} />)}
                  </div>
                ) : (
                  <div style={{ padding:'80px 0', textAlign:'center', color:'#4B5563', fontFamily:MONO, fontSize:12 }}>
                    {search ? `No deals matching "${search}". Try a different search.` : 'No deals available right now. Check back soon.'}
                  </div>
                )}

                {/* ── PAGINATION ── */}
                {totalPages > 1 && (
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:4, marginBottom:32, flexWrap:'wrap' }}>
                    <button onClick={() => { setPage(1); window.scrollTo(0,0) }} disabled={safePage === 1}
                      style={{ fontFamily:MONO, fontSize:11, padding:'6px 12px', border:'1px solid var(--border)', background:'transparent', color: safePage===1?'#374151':GOLD, cursor:safePage===1?'default':'pointer' }}>« First</button>
                    <button onClick={() => { setPage(p => Math.max(1, p-1)); window.scrollTo(0,0) }} disabled={safePage === 1}
                      style={{ fontFamily:MONO, fontSize:11, padding:'6px 12px', border:'1px solid var(--border)', background:'transparent', color: safePage===1?'#374151':GOLD, cursor:safePage===1?'default':'pointer' }}>‹ Prev</button>

                    {/* Page numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(n => n === 1 || n === totalPages || Math.abs(n - safePage) <= 2)
                      .reduce((acc, n, i, arr) => {
                        if (i > 0 && n - arr[i-1] > 1) acc.push('…')
                        acc.push(n)
                        return acc
                      }, [])
                      .map((n, i) => n === '…'
                        ? <span key={`e${i}`} style={{ fontFamily:MONO, fontSize:11, color:'#374151', padding:'0 4px' }}>…</span>
                        : <button key={n} onClick={() => { setPage(n); window.scrollTo(0,0) }}
                            style={{ fontFamily:MONO, fontSize:11, padding:'6px 12px',
                              border:`1px solid ${safePage===n ? GOLD : 'var(--border)'}`,
                              background: safePage===n ? 'rgba(200,146,42,0.15)' : 'transparent',
                              color: safePage===n ? GOLD : 'var(--text-dim)', cursor:'pointer' }}>{n}</button>
                      )
                    }

                    <button onClick={() => { setPage(p => Math.min(totalPages, p+1)); window.scrollTo(0,0) }} disabled={safePage === totalPages}
                      style={{ fontFamily:MONO, fontSize:11, padding:'6px 12px', border:'1px solid var(--border)', background:'transparent', color: safePage===totalPages?'#374151':GOLD, cursor:safePage===totalPages?'default':'pointer' }}>Next ›</button>
                    <button onClick={() => { setPage(totalPages); window.scrollTo(0,0) }} disabled={safePage === totalPages}
                      style={{ fontFamily:MONO, fontSize:11, padding:'6px 12px', border:'1px solid var(--border)', background:'transparent', color: safePage===totalPages?'#374151':GOLD, cursor:safePage===totalPages?'default':'pointer' }}>Last »</button>
                  </div>
                )}
              </>
            )}

            {/* Footer */}
            <div style={{ marginTop:16, padding:'14px 18px', background:'var(--bg2)', border:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:8 }}>
              <span style={{ fontFamily:MONO, fontSize:10, color:'#4B5563', lineHeight:1.6 }}>
                Deals sourced from DownRange curated picks, gun.deals, and Amazon. Always verify pricing at the retailer before purchasing. As an Amazon Associate DownRange earns from qualifying purchases.
              </span>
              <div style={{ display:'flex', gap:12, flexShrink:0 }}>
                <a href="https://gun.deals" target="_blank" rel="noreferrer"
                  style={{ fontFamily:MONO, fontSize:10, color:'#FF6314', textDecoration:'none' }}>gun.deals ↗</a>
              </div>
            </div>

          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

// ── EXPORT — wraps inner in Suspense (required for useSearchParams in Next 14) ─
export default function DealsPage({ states = [] }) {
  return (
    <Suspense fallback={
      <div style={{ background:'var(--bg)', minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#4B5563' }}>Loading deals…</span>
      </div>
    }>
      <DealsInner states={states} />
    </Suspense>
  )
}
