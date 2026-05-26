import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import NewsCard from '../../components/ui/NewsCard'
import { fetchArticles, fetchBreakingAlerts, fetchLegislation } from '../../sanity/lib/client'

export const metadata = { title: 'News — DownRange', description: 'Latest firearms and Second Amendment news from across the United States.' }
export const revalidate = 300 // revalidate every 5 min

const CATEGORIES = [
  { label: 'All News', val: null },
  { label: '⚡ Breaking', val: 'breaking' },
  { label: '⚖ Law', val: 'law' },
  { label: '◈ Industry', val: 'industry' },
  { label: '◇ Opinion', val: 'opinion' },
  { label: '▲ Training', val: 'training' },
  { label: '★ Reviews', val: 'review' },
]

export default async function NewsPage({ searchParams }) {
  const cat  = searchParams?.cat  || null
  const sort = searchParams?.sort || 'newest'

  // Fetch data
  const [articles, alerts, legislation] = await Promise.all([
    fetchArticles(30, cat).catch(() => []),
    fetchBreakingAlerts(8).catch(() => []),
    fetchLegislation(5).catch(() => []),
  ])

  const featured = articles[0]
  const grid = articles.slice(1)

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="NEWS">
        <div className="container">
          <div style={{ position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <span className="pulse-dot" />
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#22C55E', letterSpacing: '0.1em' }}>LIVE FEED</span>
            </div>
            <h1 className="page-hero-title">Latest News</h1>
            <p className="page-hero-sub">
              {articles.length} stories · Updated every 15 minutes · All sources aggregated
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 0', borderBottom: '1px solid #1F2428' }}>
        <div className="container">
          {/* Category tabs */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'8px', flexWrap:'wrap', gap:8 }}>
            <div className="filter-tabs" style={{ marginBottom:0 }}>
            {CATEGORIES.map(c => (
              <a key={c.val || 'all'} href={c.val ? `/news?cat=${c.val}` : '/news'}
                className={`filter-tab ${(cat === c.val || (!cat && !c.val)) ? 'active' : ''}`}>
                {c.label}
              </a>
            ))}
          </div>

          <div className="sidebar-layout">
            <div>
              {/* Featured */}
              {featured && (
                <div style={{ marginBottom: '24px' }}>
                  <NewsCard article={featured} featured />
                </div>
              )}

              {/* Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {grid.map(article => (
                  <NewsCard key={article._id} article={article} />
                ))}
              </div>

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
                    style={{ display: 'block', padding: '12px 0', borderBottom: '1px solid #1F2428', textDecoration: 'none' }}>
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
                    style={{ display: 'flex', gap: '10px', padding: '10px 0', borderBottom: '1px solid #1F2428', textDecoration: 'none' }}>
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

      <Footer />
    </>
  )
}
