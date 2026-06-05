import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import IntlArticleCard, { IntlFeaturedArticle } from '../../components/ui/IntlArticleCard'
import CanadaExtras from './CanadaExtras'
import { fetchBreakingAlerts } from '../../sanity/lib/client'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Canada — Firearms News, PAL, C-21 | DownRange',
  description: 'Canadian firearms news, PAL licensing, Bill C-21 updates, and province-by-province laws.',
  alternates: { canonical: 'https://downrangeco.com/canada' },
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})

const CATS = [
  { label: 'All',       val: null      },
  { label: 'LAW',       val: 'LAW'     },
  { label: 'POLICY',    val: 'POLICY'  },
  { label: 'GUIDE',     val: 'GUIDE'   },
]

export default async function CanadaPage({ searchParams }) {
  const cat = searchParams?.cat || null

  const [items, breaking] = await Promise.all([
    sanity.fetch(
      '*[_type=="canadaContent" && active == true] | order(publishedAt desc) { _id, type, title, slug, status, impact, effectiveDate, summary, detail, sourceUrl, abbr, rating, highlights, body, imageUrl, tag, readMins, author, cadPrice, usdEquiv, availability, trend, note, value, color, order, publishedAt }'
    ).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const rawArticles = items.filter(i => i.type === 'article')
  const articles = cat ? rawArticles.filter(a => a.tag === cat) : rawArticles
  const laws = items.filter(i => i.type === 'law')
  const provinces = items.filter(i => i.type === 'province')
  const ammo = items.filter(i => i.type === 'ammo')

  const featured = articles[0] || null
  const grid = articles.slice(1)

  return (
    <>
      <Masthead />

      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(255,0,0,0.05) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'2rem' }}>🇨🇦</span>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'.2em', padding:'3px 12px' }}>CANADA</span>
              <span style={{ background:'#001A0A', color:'#22C55E', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, padding:'3px 10px', border:'1px solid #22C55E40', display:'flex', alignItems:'center', gap:5 }}>
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

      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', alignItems:'stretch' }}>
            {CATS.map(c => (
              <a key={c.val || 'all'} href={c.val ? '/canada?cat=' + c.val : '/canada'}
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
                  borderBottom:'2px solid ' + ((cat === c.val || (!cat && !c.val)) ? 'var(--gold)' : 'transparent'),
                  color:(cat === c.val || (!cat && !c.val)) ? 'var(--gold)' : 'var(--text-dim)',
                  textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'.05em' }}>
                {c.label}
              </a>
            ))}
            <a href="/canada#laws" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', borderLeft:'1px solid var(--border)' }}>⚖ Laws</a>
            <a href="/canada#pal" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap' }}>📋 PAL Guide</a>
            <a href="/canada#provinces" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap' }}>🗺 Provinces</a>
            <a href="/canada#ammo" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap' }}>💰 Ammo</a>
          </div>
        </div>
      </div>

      <div style={{ padding:'32px 0' }}>
        <div className="container">
          <div className="sidebar-layout">
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

            <div className="sidebar">
              <div>
                <div className="widget-title"><div className="widget-accent" />Key Laws</div>
                {(laws.length > 0 ? laws : [
                  { _id:'l1', title:'Bill C-21 — Handgun Freeze', status:'IN FORCE', effectiveDate:'Aug 2023', sourceUrl:null },
                  { _id:'l2', title:'OIC Rifle Ban', status:'IN FORCE', effectiveDate:'May 2020', sourceUrl:null },
                  { _id:'l3', title:'PAL / RPAL Requirement', status:'REQUIRED', effectiveDate:'Ongoing', sourceUrl:null },
                ]).slice(0,5).map(l => (
                  <div key={l._id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#60A5FA', marginBottom:3 }}>{l.status} · {l.effectiveDate}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:600, color:'#F0EDE6', lineHeight:1.3 }}>{l.title}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="widget-title"><div className="widget-accent" />Province Ratings</div>
                {(provinces.length > 0 ? provinces : [
                  { _id:'p1', abbr:'AB', title:'Alberta',    rating:'B+', color:'#22c55e' },
                  { _id:'p2', abbr:'SK', title:'Saskatchewan', rating:'B', color:'#22c55e' },
                  { _id:'p3', abbr:'ON', title:'Ontario',    rating:'C-', color:'#ef4444' },
                  { _id:'p4', abbr:'QC', title:'Quebec',     rating:'D',  color:'#dc2626' },
                ]).slice(0,6).map(p => (
                  <div key={p._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, color:'var(--gold)', minWidth:26 }}>{p.abbr}</div>
                    <div style={{ flex:1, fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, color:'#E5E5E5' }}>{p.title}</div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:p.color || '#9ca3af' }}>{p.rating}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <CanadaExtras laws={laws} provinces={provinces} ammo={ammo} />
      <Footer />
    </>
  )
}
