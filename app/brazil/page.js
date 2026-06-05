import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import IntlArticleCard, { IntlFeaturedArticle } from '../../components/ui/IntlArticleCard'
import BrazilExtras from './BrazilExtras'
import { fetchBreakingAlerts } from '../../sanity/lib/client'
import { createClient } from '@sanity/client'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Brasil — Notícias sobre Armas, CAC, Leis | DownRange',
  description: 'Notícias sobre armas de fogo no Brasil, legislação, guia CAC, análise por estado — tudo em português.',
  alternates: { canonical: 'https://downrangeco.com/brazil' },
}

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})

const CATS = [
  { label: 'Tudo',       val: null       },
  { label: 'LEI',        val: 'LEI'      },
  { label: 'GUIA/CAC',   val: 'GUIA'     },
  { label: 'POLÍTICA',   val: 'POLÍTICA' },
  { label: 'SETOR',      val: 'SETOR'    },
]

export default async function BrazilPage({ searchParams }) {
  const cat = searchParams?.cat || null

  const [items, breaking] = await Promise.all([
    sanity.fetch(
      '*[_type=="brazilContent" && active == true] | order(publishedAt desc) { _id, type, title, slug, status, impact, effectiveDate, summary, detail, sourceUrl, abbr, rating, highlights, body, imageUrl, tag, readMins, author, brlPrice, usdEquiv, availability, trend, note, value, color, order, publishedAt }'
    ).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const rawArticles = items.filter(i => i.type === 'artigo')
  const articles = cat ? rawArticles.filter(a => a.tag === cat) : rawArticles
  const leis = items.filter(i => i.type === 'lei')
  const estados = items.filter(i => i.type === 'estado')
  const municao = items.filter(i => i.type === 'municao')

  const featured = articles[0] || null
  const grid = articles.slice(1)

  return (
    <>
      <Masthead />

      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(0,156,59,0.06) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ fontSize:'2rem' }}>🇧🇷</span>
              <span style={{ background:'#009C3B', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'.2em', padding:'3px 12px' }}>BRASIL</span>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'.2em', padding:'3px 12px' }}>EM PORTUGUÊS</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'.02em', lineHeight:0.95, marginBottom:14 }}>
              Armas de Fogo no<br />
              <span style={{ color:'#009C3B' }}>Brasil</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:16, color:'var(--text-muted)', lineHeight:1.7 }}>
              {articles.length > 0 ? articles.length : '—'} artigos · CAC · Estatuto · Decretos · Análise por estado
            </p>
          </div>
        </div>
      </div>

      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', alignItems:'stretch' }}>
            {CATS.map(c => (
              <a key={c.val || 'all'} href={c.val ? '/brazil?cat=' + c.val : '/brazil'}
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
                  borderBottom:'2px solid ' + ((cat === c.val || (!cat && !c.val)) ? 'var(--gold)' : 'transparent'),
                  color:(cat === c.val || (!cat && !c.val)) ? 'var(--gold)' : 'var(--text-dim)',
                  textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'.05em' }}>
                {c.label}
              </a>
            ))}
            <a href="/brazil#leis" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', borderLeft:'1px solid var(--border)' }}>⚖ Leis</a>
            <a href="/brazil#cac" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap' }}>🎯 CAC</a>
            <a href="/brazil#estados" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap' }}>🗺 Estados</a>
            <a href="/brazil#municao" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, borderBottom:'2px solid transparent', color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap' }}>🔴 Munição</a>
          </div>
        </div>
      </div>

      <div style={{ padding:'32px 0' }}>
        <div className="container">
          <div className="sidebar-layout">
            <div>
              {articles.length === 0 ? (
                <div style={{ padding:60, textAlign:'center', color:'#6B7280', fontFamily:"'IBM Plex Mono',monospace" }}>
                  Artigos sendo gerados — volte em breve.
                </div>
              ) : (
                <>
                  {featured && (
                    <div style={{ marginBottom:24 }}>
                      <IntlFeaturedArticle article={featured} lang="pt" />
                    </div>
                  )}
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:16 }}>
                    {grid.map(a => <IntlArticleCard key={a._id} article={a} lang="pt" />)}
                  </div>
                </>
              )}
            </div>

            <div className="sidebar">
              <div>
                <div className="widget-title"><div className="widget-accent" />Legislação Recente</div>
                {(leis.length > 0 ? leis : [
                  { _id:'l1', title:'Estatuto do Desarmamento', status:'EM VIGOR', effectiveDate:'Dez 2003' },
                  { _id:'l2', title:'Decreto Lula — Reversão CAC', status:'EM VIGOR', effectiveDate:'Jan 2023' },
                  { _id:'l3', title:'Decretos Bolsonaro (CAC)', status:'PARCIAL', effectiveDate:'2019–2022' },
                ]).slice(0,5).map(l => (
                  <div key={l._id} style={{ padding:'10px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#009C3B', marginBottom:3 }}>{l.status} · {l.effectiveDate}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:600, color:'#F0EDE6', lineHeight:1.3 }}>{l.title}</div>
                  </div>
                ))}
              </div>
              <div>
                <div className="widget-title"><div className="widget-accent" />Classificação por Estado</div>
                {(estados.length > 0 ? estados : [
                  { _id:'e1', abbr:'RS', title:'Rio Grande do Sul', rating:'B',  color:'#22c55e' },
                  { _id:'e2', abbr:'MT', title:'Mato Grosso',       rating:'B+', color:'#22c55e' },
                  { _id:'e3', abbr:'SP', title:'São Paulo',         rating:'D',  color:'#dc2626' },
                  { _id:'e4', abbr:'RJ', title:'Rio de Janeiro',    rating:'D',  color:'#dc2626' },
                ]).slice(0,6).map(e => (
                  <div key={e._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, fontWeight:700, color:'var(--gold)', minWidth:26 }}>{e.abbr}</div>
                    <div style={{ flex:1, fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, color:'#E5E5E5' }}>{e.title || e.nome}</div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:e.color || '#9ca3af' }}>{e.rating}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BrazilExtras leis={leis} estados={estados} municao={municao} />
      <Footer />
    </>
  )
}
