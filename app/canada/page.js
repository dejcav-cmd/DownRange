import Masthead        from '../../components/layout/Masthead'
import BreakingTicker  from '../../components/layout/BreakingTicker'
import Footer          from '../../components/layout/Footer'
import IntlArticleCard, { IntlFeaturedArticle } from '../../components/ui/IntlArticleCard'
import CanadaExtras    from './CanadaExtras'
import { fetchBreakingAlerts } from '../../sanity/lib/client'
import { createClient } from '@sanity/client'

export const metadata = {
  title:       'Canada — Firearms News, PAL, C-21 | DownRange',
  description: 'Canadian firearms news, PAL licensing, Bill C-21 updates, and province-by-province laws — all in one place.',
  alternates:  { canonical: 'https://downrangeco.com/canada' },
}
export const revalidate = 900

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})

const CATS = [
  { label: 'All', val: null },
  { label: '⚖ Law',    val: 'LAW'    },
  { label: '📋 Policy', val: 'POLICY' },
  { label: '📖 Guide',  val: 'GUIDE'  },
]

export default async function CanadaPage({ searchParams }) {
  const cat = searchParams?.cat || null

  const [items, breaking] = await Promise.all([
    sanity.fetch(`*[_type=="canadaContent"] | order(publishedAt desc) {
      _id, type, title, slug, status, impact, effectiveDate, summary,
      detail, sourceUrl, abbr, rating, highlights, body, imageUrl,
      tag, readMins, author, cadPrice, usdEquiv, availability, trend,
      note, value, color, order, publishedAt
    }`).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const rawArticles = items.filter(i => i.type === 'article')
  const articles    = cat ? rawArticles.filter(a => a.tag === cat) : rawArticles
  const laws        = items.filter(i => i.type === 'law')
  const provinces   = items.filter(i => i.type === 'province')
  const ammo        = items.filter(i => i.type === 'ammo')

  const featured = articles[0] || null
  const grid     = articles.slice(1)

  return (
    <>
      <BreakingTicker alerts={breaking} />
      <Masthead />

      {/* ── HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(255,0,0,0.05) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'40%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'#FF0000', lineHeight:0.85, textAlign:'right', paddingRight:20, paddingTop:10 }}>CA</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'2rem' }}>🇨🇦</span>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'.2em', padding:'3px 12px' }}>CANADA</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, background:'#001A0A', color:'#22C55E', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, padding:'3px 10px', border:'1px solid #22C55E40' }}>
                <span className="pulse-dot" /> LIVE FEED
              </span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'.02em', lineHeight:0.95, marginBottom:14 }}>
              Canadian Firearms<br />
              <span style={{ color:'var(--gold)' }}>News &amp; Intelligence</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:16, color:'var(--text-muted)', lineHeight:1.7 }}>
              {articles.length > 0 ? articles.length : '—'} articles · PAL · C-21 · Province laws · Weekly analysis
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY CATEGORY BAR ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', alignItems:'stretch' }}>
            {CATS.map(c => (
              <a key={c.val||'all'} href={c.val ? `/canada?cat=${c.val}` : '/canada'}
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
                  borderBottom:`2px solid ${(cat===c.val||(!cat&&!c.val))?'var(--gold)':'transparent'}`,
                  color:(cat===c.val||(!cat&&!c.val))?'var(--gold)':'var(--text-dim)',
                  textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'.05em' }}>
                {c.label}
              </a>
            ))}
            {/* Extras: Laws / Guide / Ammo */}
            {[
              { href:'/canada#laws',      label:'⚖ Federal Laws' },
              { href:'/canada#pal',       label:'📋 PAL Guide' },
              { href:'/canada#provinces', label:'🗺 Provinces' },
              { href:'/canada#ammo',      label:'💰 Ammo Prices' },
            ].map(l => (
              <a key={l.href} href={l.href}
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
                  borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'.05em',
                  borderLeft:'1px solid var(--border)' }}>
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ padding:'32px 0' }}>
        <div className="container">
          <div className="sidebar-layout">

            {/* ── LEFT: article feed ── */}
            <div>
              {articles.length === 0 ? (
                <div style={{ padding:60, textAlign:'center', color:'#6B7280', fontFamily:"'IBM Plex Mono',monospace" }}>
                  Articles loading — check back shortly.
                </div>
              ) : (
                <>
                  {featured && (
                    <div style={{ marginBottom:24 }}>
                      <IntlFeaturedArticle article={featured} lang="en" />
                    </div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                    {grid.map(a => <IntlArticleCard key={a._id} article={a} lang="en" />)}
                  </div>
                </>
              )}
            </div>

            {/* ── RIGHT: sidebar ── */}
            <div className="sidebar">
              <div>
                <div className="widget-title"><div className="widget-accent" />Latest Laws</div>
                {(laws.length > 0 ? laws : [
                  { _id:'l1', title:"Bill C-21 — Handgun Freeze", status:'IN FORCE', effectiveDate:'Aug 2023' },
                  { _id:'l2', title:"OIC Assault Rifle Ban", status:'IN FORCE', effectiveDate:'May 2020' },
                  { _id:'l3', title:"PAL / RPAL Requirement", status:'REQUIRED', effectiveDate:'Ongoing' },
                ]).slice(0,5).map(l => (
                  <a key={l._id} href={l.sourceUrl||'#'} target="_blank" rel="noreferrer"
                    style={{ display:'block', padding:'10px 0', borderBottom:'1px solid var(--border)', textDecoration:'none' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#60A5FA', marginBottom:3 }}>{l.status} · {l.effectiveDate}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:600, color:'#F0EDE6', lineHeight:1.3 }}>{l.title}</div>
                    {l.summary && <div style={{ fontSize:11, color:'#6B7280', marginTop:3, lineHeight:1.4 }}>{l.summary.slice(0,100)}…</div>}
                  </a>
                ))}
              </div>

              <div>
                <div className="widget-title"><div className="widget-accent" />Province Ratings</div>
                {(provinces.length > 0 ? provinces : [
                  { _id:'p1', abbr:'AB', title:'Alberta',          rating:'B+', color:'#22c55e' },
                  { _id:'p2', abbr:'SK', title:'Saskatchewan',     rating:'B',  color:'#22c55e' },
                  { _id:'p3', abbr:'BC', title:'British Columbia', rating:'C-', color:'#ef4444' },
                  { _id:'p4', abbr:'ON', title:'Ontario',          rating:'C-', color:'#ef4444' },
                  { _id:'p5', abbr:'QC', title:'Quebec',           rating:'D',  color:'#dc2626' },
                ]).slice(0,7).map(p => (
                  <div key={p._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, color:'var(--gold)', minWidth:28 }}>{p.abbr}</div>
                    <div style={{ flex:1, fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, color:'#E5E5E5' }}>{p.title}</div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:p.color||'#9ca3af' }}>{p.rating}</div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── REFERENCE SECTIONS (Laws / PAL / Provinces / Ammo) ── */}
      <CanadaExtras laws={laws} provinces={provinces} ammo={ammo} />

      <Footer />
    </>
  )
}
