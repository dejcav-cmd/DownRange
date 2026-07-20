'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { getCompliance, COMPLIANCE_STYLES } from '@/lib/gunCompliance'

const MONO = "'IBM Plex Mono',monospace"
const DISP = "'Bebas Neue',cursive"
const COND = "'Barlow Condensed',sans-serif"

const QUICK = ['TX', 'FL', 'CA', 'NY', 'PA', 'GA']

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1) return 'just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`
  return `${Math.floor(diff / 1440)}d ago`
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

export default function StateBriefing({ states = [], deals = [], articles = [], heroImage = null }) {
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
    setDealPage(0)
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
  const news = (stateNews.length >= 4 ? stateNews : articles).slice(0, 6)
  const newsIsState = stateNews.length >= 4

  const carry = yn(s.carry)
  const rf    = yn(s.rf, false)

  const DEALS_PER_PAGE = 24
  const [dealPage, setDealPage] = useState(0)
  const totalDealPages = Math.ceil(deals.length / DEALS_PER_PAGE)
  const shownDeals = deals.slice(dealPage * DEALS_PER_PAGE, (dealPage + 1) * DEALS_PER_PAGE)
  const flagged = shownDeals.filter(d => getCompliance(d, s).type !== 'ok').length

  return (
    <>
      {/* ══ BRIEFING — the single organizing idea ══ */}
      <section style={{ padding:'40px 0 32px', borderBottom:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
        {heroImage && <div style={{ position:'absolute', inset:0, backgroundImage:`url(${heroImage})`, backgroundSize:'cover', backgroundPosition:'center', opacity:.42, pointerEvents:'none' }} />}
        {heroImage && <div style={{ position:'absolute', inset:0, background:'linear-gradient(95deg, rgba(8,8,10,.92) 0%, rgba(8,8,10,.72) 46%, rgba(8,8,10,.4) 100%)', pointerEvents:'none' }} />}
        {heroImage && <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(8,8,10,.85) 0%, transparent 55%)', pointerEvents:'none' }} />}
        <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 90% at 12% 0%, rgba(200,146,42,.12), transparent 60%)', pointerEvents:'none' }} />
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
            <h2 style={{ fontFamily:DISP, fontSize:22, letterSpacing:'.04em' }}>Deals you can actually buy in <span style={{ color:'#C8922A' }}>{s.name}</span>{flagged > 0 && <span style={{ fontFamily:MONO, fontSize:11, color:'#fbbf68', marginLeft:10, letterSpacing:'.04em' }}>· {flagged} flagged for your state</span>}</h2>
            <Link href="/deals" style={{ fontFamily:MONO, fontSize:11, fontWeight:700, color:'#000', background:'#C8922A', letterSpacing:'.12em', padding:'7px 18px', textDecoration:'none', display:'inline-block', whiteSpace:'nowrap', flexShrink:0 }}>ALL LIVE DEALS →</Link>
          </div>
          {deals.length > 0 ? (
            <div className="briefing-deals" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(190px,1fr))', gap:12 }}>
              {shownDeals.map((d, i) => {
                const v  = getCompliance(d, s)
                const vs = COMPLIANCE_STYLES[v.type]
                return (
                  <a key={i} href={d.url || '/deals'} target="_blank" rel="noopener noreferrer" className="release-card" style={{ background:'var(--bg2)', border:'1px solid var(--border-mid)', display:'flex', flexDirection:'column', overflow:'hidden', textDecoration:'none' }}>
                    <div style={{ height:120, background:'linear-gradient(135deg,#1a1f2a,#0c0f14)', position:'relative', overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      {d.imageUrl
                        ? <img src={d.imageUrl} alt="" onError={e => { e.currentTarget.style.display = 'none' }} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        : <span style={{ fontSize:26, opacity:.18 }}>🎯</span>}
                    </div>
                    <div style={{ padding:'12px 13px', display:'flex', flexDirection:'column', flex:1 }}>
                      <div style={{ fontFamily:MONO, fontSize:8.5, color:'#6B7280', marginBottom:3, letterSpacing:'.05em' }}>{d.brand}</div>
                      <div style={{ fontFamily:COND, fontWeight:700, fontSize:14.5, lineHeight:1.14, marginBottom:8, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{d.name}</div>
                      {d.price && <div style={{ fontFamily:DISP, fontSize:22, color:'#C8922A', letterSpacing:'.02em', marginBottom:10 }}>{d.price}</div>}
                      <div style={{ marginTop:'auto', fontFamily:MONO, fontSize:9.5, lineHeight:1.4, padding:'7px 8px', borderRadius:2, display:'flex', gap:6, alignItems:'flex-start', background:vs.bg, border:`1px solid ${vs.bd}`, color:vs.fg }}>
                        <span style={{ fontWeight:700 }}>{vs.ico}</span><span>{v.label}</span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          ) : (
            <Link href="/deals" style={{ display:'block', background:'var(--bg2)', border:'1px dashed var(--border-mid)', padding:'28px', textAlign:'center', fontFamily:MONO, fontSize:12, color:'#9CA3AF', textDecoration:'none' }}>
              Browse the full live deal feed on the deals page →
            </Link>
          )}
          {/* Pagination */}
          {totalDealPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:20, flexWrap:'wrap' }}>
              <button
                onClick={() => setDealPage(p => Math.max(0, p - 1))}
                disabled={dealPage === 0}
                style={{ fontFamily:MONO, fontSize:10, fontWeight:700, padding:'7px 14px', background:'transparent', border:'1px solid var(--border-mid)', color: dealPage === 0 ? '#374151' : '#C8922A', cursor: dealPage === 0 ? 'default' : 'pointer', letterSpacing:'.06em' }}
              >← PREV</button>
              {Array.from({ length: totalDealPages }, (_, i) => (
                <button key={i} onClick={() => setDealPage(i)}
                  style={{ fontFamily:MONO, fontSize:10, fontWeight:700, padding:'7px 13px', border:'1px solid var(--border-mid)', background: i === dealPage ? '#C8922A' : 'transparent', color: i === dealPage ? '#000' : '#9CA3AF', cursor:'pointer', letterSpacing:'.04em' }}
                >{i + 1}</button>
              ))}
              <button
                onClick={() => setDealPage(p => Math.min(totalDealPages - 1, p + 1))}
                disabled={dealPage === totalDealPages - 1}
                style={{ fontFamily:MONO, fontSize:10, fontWeight:700, padding:'7px 14px', background:'transparent', border:'1px solid var(--border-mid)', color: dealPage === totalDealPages - 1 ? '#374151' : '#C8922A', cursor: dealPage === totalDealPages - 1 ? 'default' : 'pointer', letterSpacing:'.06em' }}
              >NEXT →</button>
              <span style={{ fontFamily:MONO, fontSize:9, color:'#4B5563', marginLeft:6, letterSpacing:'.04em' }}>
                {dealPage * DEALS_PER_PAGE + 1}–{Math.min((dealPage + 1) * DEALS_PER_PAGE, deals.length)} of {deals.length} deals
              </span>
            </div>
          )}
          <p style={{ fontFamily:MONO, fontSize:9.5, color:'#4B5563', marginTop:10, letterSpacing:'.04em' }}>
            Legality checks run on live 50-state law data. Full live feed on the deals page.
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
          <div style={{ border:'1px solid var(--border)', background:'var(--bg2)' }}>
            {news.map((n, i) => {
              const cat = (n.category || 'news').toLowerCase()
              const cc = { law:'#3B82F6', breaking:'#EF4444', industry:'#C8922A', opinion:'#a855f7', training:'#22c55e', news:'#9CA3AF' }[cat] || '#9CA3AF'
              const redirects = (n.source || '').toLowerCase().includes('ammoland') || cat === 'deals'
              const external = redirects && !!n.externalUrl
              const href = external
                ? n.externalUrl
                : (n.slug ? `/news/${encodeURIComponent(n.slug)}` : (n._id ? `/news/${n._id}` : '/news'))
              const rowStyle = { display:'flex', alignItems:'center', gap:14, padding:'13px 16px', borderBottom: i < news.length - 1 ? '1px solid var(--border)' : 'none', textDecoration:'none' }
              const inner = (
                <>
                  <span style={{ fontFamily:MONO, fontSize:8, fontWeight:700, letterSpacing:'.08em', color:cc, background:cc + '1a', border:`1px solid ${cc}44`, padding:'2px 7px', textTransform:'uppercase', flexShrink:0, minWidth:66, textAlign:'center' }}>{cat}</span>
                  <span className="news-row-title" style={{ fontFamily:COND, fontWeight:600, fontSize:16, lineHeight:1.2, color:'#F0EDE6', flex:1, transition:'color .14s' }}>{n.title}</span>
                  <span style={{ fontFamily:MONO, fontSize:9, color:'#6B7280', flexShrink:0, whiteSpace:'nowrap' }}>{n.source}{n.publishedAt ? ` · ${timeAgo(n.publishedAt)}` : ''}</span>
                </>
              )
              return external
                ? <a key={n._id || i} href={href} target="_blank" rel="noopener noreferrer" className="news-row" style={rowStyle}>{inner}</a>
                : <Link key={n._id || i} href={href} className="news-row" style={rowStyle}>{inner}</Link>
            })}
          </div>
        </div>
      </section>

      <style>{`
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:.35; } }
        .pulse-dot { display:inline-block; width:6px; height:6px; border-radius:50%; background:#22c55e; animation:pulse 1.6s infinite; }
        .release-card:hover { border-color:#C8922A !important; }
        .section-link:hover { color:#E5A83A !important; }
        .news-row:hover { background:rgba(200,146,42,.04); }
        .news-row:hover .news-row-title { color:#C8922A !important; }
        @media(max-width:760px){ .briefing-stats{ grid-template-columns:repeat(2,1fr) !important; } }
      `}</style>
    </>
  )
}
