import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import NewsCard from '../../components/ui/NewsCard'
import LiveNewsRefresher from '../../components/ui/LiveNewsRefresher'
import { fetchArticlesPaginated, fetchBreakingAlerts, fetchLegislation } from '../../sanity/lib/client'

export const metadata = { title: 'News — DownRange', description: 'Latest firearms and Second Amendment news from across the United States.' }
export const revalidate = 60 // revalidate every 60s for fresher content

const CATEGORIES = [
  { label: 'All News', val: null },
  { label: '⚡ Breaking', val: 'breaking' },
  { label: '⚖ Law', val: 'law' },
  { label: '◈ Industry', val: 'industry' },
  { label: '◇ Opinion', val: 'opinion' },
  { label: '▲ Training', val: 'training' },
  { label: '★ Reviews', val: 'review' },
]

const PER_PAGE = 20

export default async function NewsPage({ searchParams }) {
  const cat    = searchParams?.cat    || null
  const sort   = searchParams?.sort   || 'newest'
  const page   = Math.max(1, parseInt(searchParams?.page || '1'))
  const search = searchParams?.q || null
  const days   = search ? null : 10  // 10-day window unless searching

  // Fetch data
  const [{ articles, total, pages }, alerts, legislation] = await Promise.all([
    fetchArticlesPaginated({ page, perPage: PER_PAGE, category: cat, days, search }).catch(() => ({ articles: [], total: 0, pages: 1, page: 1 })),
    fetchBreakingAlerts(8).catch(() => []),
    fetchLegislation(5).catch(() => []),
  ])

  const featured = page === 1 && !search ? articles[0] : null
  const grid     = page === 1 && !search ? articles.slice(1) : articles

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* ── PAGE HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>NEWS</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:640 }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>LATEST NEWS</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, background:'#001A0A', color:'#22C55E', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 10px', border:'1px solid #22C55E40' }}>
                <span className="pulse-dot" /> LIVE FEED
              </span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'14px' }}>
              Firearms &amp; 2A<br />
              <span style={{ color:'var(--gold)' }}>Intelligence Feed</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7 }}>
              {total > 0 ? total : '—'} stories in last 10 days · Updated every 15 minutes · All sources aggregatedregated
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY BAR (Learn pattern) ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', justifyContent:'space-between', alignItems:'stretch' }}>
            <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
              {CATEGORIES.map(c => (
                <a key={c.val || 'all'} href={c.val ? `/news?cat=${c.val}` : '/news'}
                  style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${(cat===c.val||(!cat&&!c.val))?'var(--gold)':'transparent'}`, color:(cat===c.val||(!cat&&!c.val))?'var(--gold)':'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                  {c.label}
                </a>
              ))}
            </div>
            <div style={{ display:'flex', gap:'5px', alignItems:'center', padding:'0 0 0 12px', borderLeft:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>SORT:</span>
              {[['newest','📅 Newest'],['urgency','⚡ Urgency']].map(([key,label]) => (
                <a key={key} href={`/news?cat=${cat||''}&sort=${key}`}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'4px 10px', border:'1px solid var(--border)', color:sort===key?'#C8922A':'#4B5563', textDecoration:'none', background:sort===key?'#C8922A20':'transparent' }}>
                  {label}
                </a>
              ))}
            </div>
            {/* ── Search bar ── */}
            <form action="/news" method="get" style={{ display:'flex', alignItems:'center', gap:6, padding:'0 0 0 12px', borderLeft:'1px solid var(--border)' }}>
              {cat && <input type="hidden" name="cat" value={cat} />}
              <input
                type="search"
                name="q"
                defaultValue={search || ''}
                placeholder="Search all articles…"
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text)', padding:'5px 10px', width:180, outline:'none' }}
              />
              <button type="submit" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, background:'var(--gold)', color:'#000', border:'none', padding:'6px 12px', cursor:'pointer', fontWeight:700, flexShrink:0 }}>⌕</button>
              {search && <a href="/news" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', textDecoration:'none', flexShrink:0 }}>✕ Clear</a>}
            </form>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="sidebar-layout">
            <div>
              {/* Featured */}
              {featured && (
                <div style={{ marginBottom: '24px' }}>
                  <NewsCard article={featured} featured />
                </div>
              )}

              {/* Grid — live refresh every 2 min */}
              <LiveNewsRefresher initialArticles={grid} category={cat} />

              {articles.length === 0 && (
                <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280', fontFamily: "'IBM Plex Mono', monospace" }}>
                  No articles found. Agent will populate content shortly.
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              <div>
                <div className="widget-title"><div className="widget-accent" />Breaking Alerts</div>
                {(alerts.length > 0 ? alerts : [
                  { _id:'a1', headline:'ATF Finalizes Pistol Brace Rule — 5th Circuit Injunction Holds', urgencyScore:9, url:'/laws' },
                  { _id:'a2', headline:'House Passes SHARE Act — Suppressor Reform Advances', urgencyScore:8, url:'/laws' },
                  { _id:'a3', headline:'California AWB Ruled Unconstitutional — Appeal Filed', urgencyScore:8, url:'/laws' },
                ]).slice(0, 5).map(alert => (
                  <a key={alert._id} href={alert.url || '#'} target="_blank" rel="noreferrer"
                    style={{ display: 'block', padding: '12px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                      <span className="pulse-dot" />
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#EF4444' }}>{alert.urgencyScore}/10</span>
                    </div>
                    <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.3 }}>
                      {alert.headline}
                    </div>
                  </a>
                ))}
              </div>

              <div>
                <div className="widget-title"><div className="widget-accent" />Recent Legislation</div>
                {(legislation.length > 0 ? legislation : [
                  { _id:'l1', title:'Firearm Safety Act', billNumber:'H.R. 7910', status:'committee', summary:'Universal background checks on all firearm transfers.' },
                  { _id:'l2', title:'National Reciprocity Act', billNumber:'H.R. 38', status:'passed', summary:'Allows CCW permit holders to carry in all 50 states.' },
                  { _id:'l3', title:'BSCA Implementation', billNumber:'S. 2938', status:'signed', summary:'Enhanced background checks for under-21 buyers.' },
                ]).map(bill => (
                  <a key={bill._id} href={bill.url || '#'} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}>
                    <div style={{ flexShrink: 0 }}>
                      <span className={`status-badge status-${bill.status}`}>{bill.status}</span>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280', marginTop: '3px' }}>{bill.billNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.3 }}>{bill.title}</div>
                      {bill.summary && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '3px' }}>{bill.summary.slice(0, 100)}</div>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Pagination ── */}
      {pages > 1 && (
        <div style={{ padding:'32px 0', display:'flex', justifyContent:'center' }}>
          <div className="container">
            <div style={{ display:'flex', gap:6, alignItems:'center', justifyContent:'center', flexWrap:'wrap' }}>
              {/* Prev */}
              {page > 1 && (
                <a href={`/news?${new URLSearchParams({ ...(cat&&{cat}), ...(search&&{q:search}), page: page-1 }).toString()}`}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 16px', border:'1px solid var(--border)', color:'var(--text)', textDecoration:'none' }}>
                  ← Prev
                </a>
              )}

              {/* Page numbers — show up to 7 around current */}
              {Array.from({ length: pages }, (_,i) => i+1)
                .filter(p => p === 1 || p === pages || Math.abs(p - page) <= 2)
                .reduce((acc, p, idx, arr) => {
                  if (idx > 0 && p - arr[idx-1] > 1) acc.push('…')
                  acc.push(p)
                  return acc
                }, [])
                .map((p, i) => p === '…'
                  ? <span key={`e${i}`} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 6px', color:'#6b7280' }}>…</span>
                  : <a key={p} href={`/news?${new URLSearchParams({ ...(cat&&{cat}), ...(search&&{q:search}), page: p }).toString()}`}
                      style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 14px', border:'1px solid var(--border)', color: p===page ? '#000' : 'var(--text)', background: p===page ? 'var(--gold)' : 'transparent', textDecoration:'none', fontWeight: p===page ? 700 : 400 }}>
                      {p}
                    </a>
                )}

              {/* Next */}
              {page < pages && (
                <a href={`/news?${new URLSearchParams({ ...(cat&&{cat}), ...(search&&{q:search}), page: page+1 }).toString()}`}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 16px', border:'1px solid var(--border)', color:'var(--text)', textDecoration:'none' }}>
                  Next →
                </a>
              )}

              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', marginLeft:12 }}>
                {(page-1)*PER_PAGE + 1}–{Math.min(page*PER_PAGE, total)} of {total}
              </span>
            </div>

            {/* Search context label */}
            {search && (
              <div style={{ textAlign:'center', marginTop:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#6b7280' }}>
                Showing results for <span style={{ color:'var(--gold)' }}>"{search}"</span>
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
