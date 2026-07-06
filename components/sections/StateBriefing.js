'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const MONO = "'IBM Plex Mono',monospace"
const DISP = "'Bebas Neue',cursive"
const COND = "'Barlow Condensed',sans-serif"

const QUICK = ['TX', 'FL', 'CA', 'NY', 'PA', 'GA']

function ok(t)   { return { lvl: 'ok',   ico: '✓', text: t } }
function warn(t) { return { lvl: 'warn', ico: '⚠', text: t } }
function no(t)   { return { lvl: 'no',   ico: '✗', text: t } }

// The differentiator: judge a deal category against the selected state's real attributes
function verdict(cat, s) {
  if (!s) return ok('Legal')
  switch (cat) {
    case 'RIFLE':
      if (s.awbFull)       return no(`Banned configuration in ${s.name}`)
      if (s.awbRestricted) return warn(`${s.name}: featureless build required`)
      return ok(`Legal as-is in ${s.name}`)
    case 'MAGAZINE':
      if (s.mag)           return no(`Blocked — ${s.mag}-rd max in ${s.name}`)
      return ok(`Standard capacity legal in ${s.name}`)
    case 'SUPPRESSOR':
      if (!s.suppLegal)    return no(`Illegal to own in ${s.name}`)
      return ok('Legal · Form 4 / NFA')
    case 'AMMO':
      if (s.abbr === 'CA') return warn('CA: in-person pickup + background check')
      if (s.abbr === 'NY') return warn('NY: dealer transfer only — no direct ship')
      return ok('Ships to your door')
    case 'HANDGUN':
      if (s.abbr === 'CA') return warn('Must be on the CA approved roster')
      if (s.awbFull || s.abbr === 'NY') return warn(`${s.name}: permit / registration required`)
      return ok(`Legal in ${s.name}`)
    default:
      return ok(`Legal in ${s.name}`)
  }
}

const V_STYLE = {
  ok:   { bg:'rgba(34,197,94,.09)',  bd:'rgba(34,197,94,.22)',  fg:'#6ee7a3' },
  warn: { bg:'rgba(245,158,11,.09)', bd:'rgba(245,158,11,.22)', fg:'#fbbf68' },
  no:   { bg:'rgba(239,68,68,.09)',  bd:'rgba(239,68,68,.22)',  fg:'#fca5a5' },
}
const GRADE_COLOR = g => {
  const c = (g || '').charAt(0)
  if (c === 'A') return '#22C55E'
  if (c === 'B') return '#84cc16'
  if (c === 'C') return '#F59E0B'
  if (c === 'D') return '#f97316'
  return '#EF4444'
}
const yn = (v, goodIsYes = true) => {
  const good = goodIsYes ? v : !v
  return { txt: v ? 'Yes' : 'No', color: good ? '#22C55E' : '#EF4444' }
}

export default function StateBriefing({ states = [], deals = [], articles = [] }) {
  const byAbbr = {}
  for (const s of states) byAbbr[s.abbr] = s
  const has = a => byAbbr[a]
  const initial = has('TX') ? 'TX' : (states[0]?.abbr || 'TX')
  const [abbr, setAbbr] = useState(initial)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('dr_state')
      if (saved && byAbbr[saved]) setAbbr(saved)
    } catch {}
  }, []) // eslint-disable-line

  const pick = a => {
    setAbbr(a)
    try { localStorage.setItem('dr_state', a) } catch {}
  }

  const s = byAbbr[abbr] || states[0]
  if (!s) return null

  // News that mentions this state, else fall back to latest (labeled national)
  const nl = s.name.toLowerCase()
  const stateNews = articles.filter(a =>
    (a.title || '').toLowerCase().includes(nl) ||
    (a.tags || []).some(t => (t || '').toLowerCase().includes(nl) || (t || '').toLowerCase() === abbr.toLowerCase())
  )
  const news = (stateNews.length >= 2 ? stateNews : articles).slice(0, 2)
  const newsIsState = stateNews.length >= 2

  const carry = yn(s.carry)
  const rf    = yn(s.rf, false)

  return (
    <>
      {/* ══ BRIEFING — the single organizing idea ══ */}
      <section style={{ padding:'40px 0 32px', borderBottom:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 90% at 12% 0%, rgba(200,146,42,.10), transparent 60%)', pointerEvents:'none' }} />
        <div className="container" style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:20 }}>
            <span style={{ fontFamily:MONO, fontSize:11, letterSpacing:'.22em', textTransform:'uppercase', color:'#C8922A' }}>Today&rsquo;s Briefing</span>
            <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:MONO, fontSize:10, color:'#22C55E', letterSpacing:'.1em' }}>
              <span className="pulse-dot" /> LIVE
            </span>
          </div>

          <h1 style={{ fontFamily:DISP, fontSize:'clamp(30px,4.6vw,50px)', lineHeight:.94, letterSpacing:'.01em', maxWidth:760, marginBottom:10 }}>
            Every deal, release, and law &mdash;<br /><span style={{ color:'#C8922A' }}>checked against your state.</span>
          </h1>
          <p style={{ fontFamily:MONO, fontSize:12.5, color:'#9CA3AF', lineHeight:1.6, maxWidth:560, marginBottom:24 }}>
            Other sites hand you a price list and a rulebook and make you connect them. DownRange connects them for you. Set your state &mdash; everything below re-checks itself.
          </p>

          {/* State picker — the anchor interaction */}
          <div style={{ display:'flex', alignItems:'center', gap:12, flexWrap:'wrap', marginBottom:24 }}>
            <span style={{ fontFamily:MONO, fontSize:11, letterSpacing:'.14em', textTransform:'uppercase', color:'#6B7280' }}>Your state →</span>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {QUICK.filter(has).map(a => (
                <button key={a} onClick={() => pick(a)} style={{
                  fontFamily:COND, fontWeight:700, fontSize:15, letterSpacing:'.06em', padding:'8px 15px',
                  background: a === abbr ? '#C8922A' : 'var(--bg3)', color: a === abbr ? '#000' : '#9CA3AF',
                  border:`1px solid ${a === abbr ? '#C8922A' : 'var(--border-mid)'}`, cursor:'pointer', transition:'.14s',
                }}>{byAbbr[a].name}</button>
              ))}
            </div>
            <select value={abbr} onChange={e => pick(e.target.value)} aria-label="Choose your state" style={{
              fontFamily:MONO, fontSize:12, background:'var(--bg3)', color:'#F0EDE6',
              border:'1px solid var(--border-mid)', padding:'9px 12px', cursor:'pointer',
            }}>
              {states.map(x => <option key={x.abbr} value={x.abbr}>{x.name}</option>)}
            </select>
          </div>

          {/* Status strip — real 50-state data */}
          <div style={{ display:'grid', gridTemplateColumns:'auto 1fr', border:'1px solid var(--border-mid)', background:'var(--bg2)' }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'20px 26px', borderRight:'1px solid var(--border-mid)', minWidth:130 }}>
              <div style={{ fontFamily:DISP, fontSize:56, lineHeight:.8, color:GRADE_COLOR(s.grade) }}>{s.grade || '—'}</div>
              <div style={{ fontFamily:MONO, fontSize:9, letterSpacing:'.14em', color:'#6B7280', textTransform:'uppercase', marginTop:6 }}>Freedom Grade</div>
            </div>
            <div className="briefing-stats" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)' }}>
              {[
                ['Const. Carry', carry.txt, carry.color],
                ['Mag Limit', s.mag ? `${s.mag} rds` : 'None', s.mag ? '#EF4444' : '#22C55E'],
                ['"Assault Weapon"', s.awbFull ? 'Full ban' : s.awbRestricted ? 'Banned' : 'None', (s.awbFull || s.awbRestricted) ? '#EF4444' : '#22C55E'],
                ['Suppressors', s.suppLegal ? 'Legal' : 'Illegal', s.suppLegal ? '#22C55E' : '#EF4444'],
                ['Red Flag Law', rf.txt, rf.color],
              ].map(([k, v, c], i) => (
                <div key={k} style={{ padding:'16px 14px', borderRight: i < 4 ? '1px solid var(--border)' : 'none', display:'flex', flexDirection:'column', gap:5 }}>
                  <span style={{ fontFamily:MONO, fontSize:9, letterSpacing:'.1em', color:'#6B7280', textTransform:'uppercase' }}>{k}</span>
                  <span style={{ fontFamily:COND, fontWeight:700, fontSize:16, letterSpacing:'.03em', color:c }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ DEALS — each verdict'd against the chosen state ══ */}
      <section style={{ padding:'30px 0', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            <h2 style={{ fontFamily:DISP, fontSize:22, letterSpacing:'.04em' }}>Deals you can actually buy in <span style={{ color:'#C8922A' }}>{s.name}</span></h2>
            <Link href="/deals" className="section-link" style={{ fontFamily:MONO, fontSize:10, color:'#C8922A', letterSpacing:'.1em' }}>ALL LIVE DEALS →</Link>
          </div>
          <div className="briefing-deals" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {deals.map((d, i) => {
              const v = verdict(d.cat, s)
              const vs = V_STYLE[v.lvl]
              return (
                <Link key={i} href="/deals" className="release-card" style={{ background:'var(--bg2)', border:'1px solid var(--border-mid)', display:'flex', flexDirection:'column', overflow:'hidden' }}>
                  <div style={{ height:96, background:'linear-gradient(135deg,#1a1f2a,#0c0f14)', position:'relative' }}>
                    <span style={{ position:'absolute', top:8, left:8, fontFamily:MONO, fontSize:8, fontWeight:700, letterSpacing:'.1em', color:'#C8922A', background:'rgba(200,146,42,.14)', padding:'2px 6px' }}>{d.cat}</span>
                  </div>
                  <div style={{ padding:'12px 13px', display:'flex', flexDirection:'column', flex:1 }}>
                    <div style={{ fontFamily:MONO, fontSize:8.5, color:'#6B7280', marginBottom:3, letterSpacing:'.05em' }}>{d.brand}</div>
                    <div style={{ fontFamily:COND, fontWeight:700, fontSize:15, lineHeight:1.12, marginBottom:7 }}>{d.name}</div>
                    <div style={{ fontFamily:DISP, fontSize:22, color:'#C8922A', letterSpacing:'.02em', marginBottom:10 }}>{d.price} {d.was && <s style={{ fontFamily:MONO, fontSize:11, color:'#6B7280', marginLeft:6 }}>{d.was}</s>}</div>
                    <div style={{ marginTop:'auto', fontFamily:MONO, fontSize:10, lineHeight:1.4, padding:'7px 8px', borderRadius:2, display:'flex', gap:6, alignItems:'flex-start', background:vs.bg, border:`1px solid ${vs.bd}`, color:vs.fg }}>
                      <span style={{ fontWeight:700 }}>{v.ico}</span><span>{v.text}</span>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
          <p style={{ fontFamily:MONO, fontSize:9.5, color:'#4B5563', marginTop:12, letterSpacing:'.04em' }}>
            Legality checks run on live 50-state law data. Featured picks refresh weekly — the full live feed is on the deals page.
          </p>
        </div>
      </section>

      {/* ══ NEWS filtered to this state ══ */}
      <section style={{ padding:'30px 0', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:16, flexWrap:'wrap' }}>
            <h2 style={{ fontFamily:DISP, fontSize:22, letterSpacing:'.04em' }}>
              {newsIsState ? <>Affects <span style={{ color:'#C8922A' }}>{s.name}</span> owners this week</> : <>Latest 2A intel <span style={{ color:'#6B7280', fontSize:14 }}>· national</span></>}
            </h2>
            <Link href="/news" className="section-link" style={{ fontFamily:MONO, fontSize:10, color:'#C8922A', letterSpacing:'.1em' }}>ALL 2A NEWS →</Link>
          </div>
          <div className="briefing-news" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {news.map((n, i) => (
              <Link key={n._id || i} href={n.slug ? `/news/${n.slug}` : '/news'} className="review-card" style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'14px 16px', display:'flex', flexDirection:'column', gap:6 }}>
                <span style={{ fontFamily:MONO, fontSize:8, fontWeight:700, letterSpacing:'.08em', color:'#3B82F6', background:'rgba(59,130,246,.12)', padding:'1px 6px', width:'fit-content' }}>⚖ {(n.category || 'NEWS').toUpperCase()}</span>
                <div style={{ fontFamily:COND, fontWeight:600, fontSize:15, lineHeight:1.2 }}>{n.title}</div>
                <div style={{ fontFamily:MONO, fontSize:9, color:'#6B7280' }}>{n.source}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.35; } }
        .pulse-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#22c55e; animation:pulse 1.6s infinite; }
        .release-card:hover { border-color:#C8922A !important; }
        .review-card:hover { border-color:#C8922A !important; }
        .section-link:hover { color:#E5A83A !important; }
        @media(max-width:900px){ .briefing-deals{ grid-template-columns:repeat(2,1fr) !important; } }
        @media(max-width:760px){ .briefing-stats{ grid-template-columns:repeat(2,1fr) !important; } }
        @media(max-width:640px){ .briefing-news{ grid-template-columns:1fr !important; } }
        @media(max-width:520px){ .briefing-deals{ grid-template-columns:1fr !important; } }
      `}</style>
    </>
  )
}
