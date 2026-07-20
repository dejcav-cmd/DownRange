'use client'
import { useState, useEffect, useCallback, useRef, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import EmailCapture from '../../components/ui/EmailCapture'
import { sendGAEvent } from '@next/third-parties/google'
import { isAWBWeapon } from '@/lib/gunCompliance'

const GOLD  = 'var(--gold)'
const MONO  = "'IBM Plex Mono',monospace"
const BARLOW= "'Barlow Condensed',sans-serif"
const BEBAS = "'Bebas Neue',cursive"
const PER_PAGE = 24

// ── FLAIR META (for card badge color only) ────────────────────────────────────
const FLAIR_META = {
  Firearm:    { color:'#60A5FA' }, Ammo:       { color:'#C8922A' },
  Optic:      { color:'#34D399' }, NFA:        { color:'#EF4444' },
  Accessories:{ color:'#C084FC' }, Gear:       { color:'#9CA3AF' },
  Archery:    { color:'#84CC16' }, Deals:      { color:'#FBBF24' },
}

// ── STATE RESTRICTION RULES ──────────────────────────────────────────────────
// Fallback used until /api/state-rules responds (Sanity + stateSeed merged).
// Split mag limits: many states have different limits for handguns vs long guns.
//   magLimitHandgun — applies to pistols/revolvers
//   magLimitLonggun — applies to rifles & shotguns
//   (null = no state limit for that category)
// Sources: NRA-ILA, Giffords, state statutes — verified July 2026.
// DC: Benson v. United States (Mar 2026) struck down DC's ban — not enforced.
// VA: SB 749 blocked by twin injunctions Jun 2026 — not in effect.
const STATE_RULES = {
  // ── 10-round states (both gun types) ─────────────────────────────────────
  CA:{ name:'California',    magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  },
  CT:{ name:'Connecticut',   magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  },
  HI:{ name:'Hawaii',        magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  },
  MA:{ name:'Massachusetts', magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  },
  MD:{ name:'Maryland',      magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  },
  NJ:{ name:'New Jersey',    magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  },
  NY:{ name:'New York',      magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  },
  OR:{ name:'Oregon',        magLimitHandgun:10, magLimitLonggun:10,  awb:false, noSuppressor:false }, // BM114 eff Mar 15 2026; OR SC appeal pending
  RI:{ name:'Rhode Island',  magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  }, // AWB eff Jul 1 2026 (Assault Weapons Ban Act)
  WA:{ name:'Washington',    magLimitHandgun:10, magLimitLonggun:10,  awb:true,  noSuppressor:true  },
  // ── Split limits: handguns vs long guns differ ───────────────────────────
  IL:{ name:'Illinois',      magLimitHandgun:15, magLimitLonggun:10,  awb:true,  noSuppressor:true  }, // PICA: 15 handgun, 10 long gun
  VT:{ name:'Vermont',       magLimitHandgun:15, magLimitLonggun:10,  awb:false, noSuppressor:false }, // Act 94: 15 handgun, 10 long gun
  // ── Higher limits ────────────────────────────────────────────────────────
  CO:{ name:'Colorado',      magLimitHandgun:15, magLimitLonggun:15,  awb:false, noSuppressor:false },
  DE:{ name:'Delaware',      magLimitHandgun:17, magLimitLonggun:17,  awb:false, noSuppressor:false },
}

// All 50 state names for the selector
const ALL_STATES = [
  ['AL','Alabama'],['AK','Alaska'],['AZ','Arizona'],['AR','Arkansas'],['CA','California'],
  ['CO','Colorado'],['CT','Connecticut'],['DE','Delaware'],['FL','Florida'],['GA','Georgia'],
  ['HI','Hawaii'],['ID','Idaho'],['IL','Illinois'],['IN','Indiana'],['IA','Iowa'],
  ['KS','Kansas'],['KY','Kentucky'],['LA','Louisiana'],['ME','Maine'],['MD','Maryland'],
  ['MA','Massachusetts'],['MI','Michigan'],['MN','Minnesota'],['MS','Mississippi'],['MO','Missouri'],
  ['MT','Montana'],['NE','Nebraska'],['NV','Nevada'],['NH','New Hampshire'],['NJ','New Jersey'],
  ['NM','New Mexico'],['NY','New York'],['NC','North Carolina'],['ND','North Dakota'],['OH','Ohio'],
  ['OK','Oklahoma'],['OR','Oregon'],['PA','Pennsylvania'],['RI','Rhode Island'],['SC','South Carolina'],
  ['SD','South Dakota'],['TN','Tennessee'],['TX','Texas'],['UT','Utah'],['VT','Vermont'],
  ['VA','Virginia'],['WA','Washington'],['WV','West Virginia'],['WI','Wisconsin'],['WY','Wyoming'],
]

// Returns restriction alerts for a deal in a given state.
// Severity: mag_banned / suppressor_banned (error) > awb (warning) — never conflates ban with permit requirement.
function getStateAlerts(deal, stateCode, rulesMap = STATE_RULES) {
  if (!stateCode) return []
  const rules = rulesMap[stateCode]
  if (!rules) return [] // free state — no restrictions
  const alerts = []

  // Magazine capacity — apply the correct limit based on firearm type.
  // Many states have different limits for handguns vs long guns (IL: 15/10, VT: 15/10).
  // liveRules from /api/state-rules may only have magLimit (legacy); split fields take priority.
  // Determine long gun vs handgun from title (flair is now coarse 'Firearm')
  const isLongGun = /\brifle\b|\bshotgun\b|\bcarbine\b|ar-15|ar15|ak-|\bsbr\b|lever.?action|bolt.?action|pump.?action/i.test(deal.title || '')
  const magLimit = isLongGun
    ? (rules.magLimitLonggun ?? rules.magLimit ?? null)
    : (rules.magLimitHandgun ?? rules.magLimit ?? null)
  if (magLimit && deal.detectedCapacity && deal.detectedCapacity > magLimit) {
    alerts.push({
      type: 'mag_banned',
      color: '#EF4444',
      bg:    'rgba(239,68,68,0.13)',
      label: `\u{1F6AB} ${deal.detectedCapacity}-RD MAG BANNED IN ${stateCode}`,
      detail:`${stateCode} limits magazines to ${magLimit} rounds for ${isLongGun ? 'long guns' : 'handguns'}`,
    })
  }

  // Suppressor ban
  if (rules.noSuppressor && /suppressor|silencer/i.test(deal.title || '')) {
    alerts.push({
      type: 'suppressor_banned',
      color: '#EF4444',
      bg:    'rgba(239,68,68,0.13)',
      label: `\u{1F6AB} SUPPRESSOR BANNED IN ${stateCode}`,
      detail:`${stateCode} prohibits civilian suppressor ownership`,
    })
  }

  // AWB — rifles AND AR-pattern pistols (covered by most state AWBs, e.g. WA HB 1240, CA, NY)
  if (rules.awb && isAWBWeapon(deal.title)) {
    alerts.push({
      type: 'awb_banned',
      color: '#EF4444',
      bg:    'rgba(239,68,68,0.13)',
      label: `🚫 BANNED — assault weapon in ${stateCode}`,
      detail:`${stateCode} bans this semi-auto firearm under its assault weapons law. Not legal to purchase or receive here.`,
    })
  }

  return alerts
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

// ── DEAL CARD ─────────────────────────────────────────────────────────────────
function DealCard({ deal, userState, liveRules }) {
  const [imgError, setImgError] = useState(false)
  const fm = FLAIR_META[deal.flair] || FLAIR_META.Deals
  const hasImage = deal.imageUrl && !imgError
  const cleanTitle = (deal.title || '')
    .replace(/^\[(firearm|handgun|rifle|shotgun|ammo|optic|nfa|accessories|gear|deal|deals?|other)\]\s*/i, '')
    .trim()
  const isHot = (deal.score || 0) >= 300

  return (
    <a href={deal.url} target="_blank" rel="noopener noreferrer"
      style={{ textDecoration:'none', display:'block' }}
      onClick={() => sendGAEvent('event', 'deal_click', {
        deal_title: deal.title?.slice(0,100), deal_source: deal.source,
        deal_price: deal.price, deal_score: deal.score,
      })}
      onMouseEnter={e => e.currentTarget.querySelector('.dc-inner').style.borderColor = GOLD}
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
              background:'linear-gradient(135deg, #111318 0%, #0D0E10 72%)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:7,
            }}>
              <span style={{ fontFamily:BEBAS, fontSize:'1.5rem', color:'#374151', letterSpacing:'.04em' }}>DOWNRANGE</span>
              <span style={{ fontFamily:MONO, fontSize:9, color:'#374151', letterSpacing:'.14em' }}>NO IMAGE</span>
            </div>
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

        {/* ── Restriction badges — computed from DownRange's own engine, not gun.deals ── */}
        {(() => {
          const rulesMap = liveRules || STATE_RULES
          // Compute alerts for every restricted state (13 states, lightweight)
          const byState = Object.entries(rulesMap)
            .map(([code]) => ({ code, alerts: getStateAlerts(deal, code, rulesMap) }))
            .filter(x => x.alerts.length > 0)
          if (byState.length === 0) return null

          // Group by type for compact multi-state display
          const magBanCodes = byState.filter(x => x.alerts.some(a => a.type === 'mag_banned')).map(x => x.code)
          const awbCodes    = byState.filter(x => x.alerts.some(a => a.type === 'awb_banned')).map(x => x.code)
          const suppCodes   = byState.filter(x => x.alerts.some(a => a.type === 'suppressor_banned')).map(x => x.code)
          // User's specific state alerts (shown first, prominently)
          const myAlerts    = userState ? (byState.find(x => x.code === userState)?.alerts || []) : []
          const myTypes     = new Set(myAlerts.map(a => a.type))

          const fmt = (codes, max = 6) => codes.length <= max
            ? codes.join(' · ')
            : codes.slice(0, max).join(' · ') + ` +${codes.length - max}`

          return (
            <div style={{ padding:'0 14px 8px', display:'flex', flexDirection:'column', gap:3 }}>
              {/* User's state: full-detail alerts */}
              {myAlerts.map((a, i) => (
                <div key={i} title={a.detail} style={{
                  background: a.bg, border:`1px solid ${a.color}40`,
                  color: a.color, fontFamily:MONO, fontSize:9,
                  padding:'4px 8px', letterSpacing:'.06em', lineHeight:1.4, cursor:'help',
                }}>{a.label}</div>
              ))}
              {/* Compact multi-state summary (skip type if user's state already shows it) */}
              {magBanCodes.length > 0 && !myTypes.has('mag_banned') && (
                <div title={`Magazine banned: ${magBanCodes.join(', ')}`} style={{
                  background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)',
                  color:'#fca5a5', fontFamily:MONO, fontSize:8,
                  padding:'3px 8px', letterSpacing:'.05em', cursor:'help',
                }}>🚫 MAG BANNED: {fmt(magBanCodes)}</div>
              )}
              {awbCodes.length > 0 && !myTypes.has('awb_banned') && (
                <div title={`Assault weapon banned: ${awbCodes.join(', ')}`} style={{
                  background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)',
                  color:'#fca5a5', fontFamily:MONO, fontSize:8,
                  padding:'3px 8px', letterSpacing:'.05em', cursor:'help',
                }}>🚫 AWB BANNED: {fmt(awbCodes)}</div>
              )}
              {suppCodes.length > 0 && !myTypes.has('suppressor_banned') && (
                <div title={`Suppressor banned: ${suppCodes.join(', ')}`} style={{
                  background:'rgba(239,68,68,0.07)', border:'1px solid rgba(239,68,68,0.22)',
                  color:'#fca5a5', fontFamily:MONO, fontSize:8,
                  padding:'3px 8px', letterSpacing:'.05em', cursor:'help',
                }}>🚫 SUPPRESSOR BANNED: {fmt(suppCodes)}</div>
              )}
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
  const [userState, setUserState] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('dr_user_state') || ''
    return ''
  })

  // Live rules fetched from /api/state-rules — Sanity + stateSeed merged, updated weekly
  const [liveRules, setLiveRules] = useState(null) // null while loading; falls back to STATE_RULES
  useEffect(() => {
    fetch('/api/state-rules')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.rules) setLiveRules(data.rules) })
      .catch(() => {}) // silently fall back to STATE_RULES
  }, [])

  // Persist state selection
  function handleStateChange(code) {
    setUserState(code)
    if (typeof window !== 'undefined') {
      if (code) localStorage.setItem('dr_user_state', code)
      else localStorage.removeItem('dr_user_state')
    }
  }
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
       meta.sources?.amazon   > 0 && `amazon`,
       meta.sources?.reddit   > 0 && `r/gundeals`,
       meta.sources?.web      > 0 && `retail`]
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

            {/* State filter */}
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 0 8px 12px', borderLeft:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:MONO, fontSize:10, color:'#4B5563' }}>STATE:</span>
              <select
                value={userState}
                onChange={e => handleStateChange(e.target.value)}
                style={{
                  fontFamily:MONO, fontSize:10,
                  background:'var(--bg)', border:`1px solid ${userState && (liveRules || STATE_RULES)[userState] ? '#EF4444' : 'var(--border)'}`,
                  color: userState && (liveRules || STATE_RULES)[userState] ? '#EF4444' : 'var(--text-muted)',
                  padding:'5px 8px', outline:'none', cursor:'pointer',
                }}
              >
                <option value="">All States</option>
                {ALL_STATES.map(([code, name]) => (
                  <option key={code} value={code}>{code} — {name}{STATE_RULES[code] ? ' ⚠' : ''}</option>
                ))}
              </select>
              {userState && (liveRules || STATE_RULES)[userState] && (() => {
                const r = (liveRules || STATE_RULES)[userState]
                return (
                  <span style={{ fontFamily:MONO, fontSize:9, color:'#EF4444' }}>
                    {r.magLimit ? `${r.magLimit}-rd limit` : ''}
                    {r.awb ? ' · AWB' : ''}
                    {liveRules ? '' : ' ·⏳'}
                  </span>
                )
              })()}
            </div>

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
                    {paginated.map((deal, i) => <DealCard key={deal.id || i} deal={deal} userState={userState} liveRules={liveRules} />)}
                    {[0,1,2,3].map(i => <div key={'ghost-'+i} aria-hidden="true" style={{ visibility:'hidden', height:0, overflow:'hidden', padding:0, margin:0 }} />)}
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
                Deals sourced from DownRange curated picks, gun.deals, Amazon, r/gundeals, and direct retailer pages. Always verify pricing at the retailer before purchasing. As an Amazon Associate DownRange earns from qualifying purchases.
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
