import { createClient } from '@sanity/client'
import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import BreakingTicker from '../../../components/layout/BreakingTicker'
import ArticleHeroImage from '../../../components/ui/ArticleHeroImage'

export const revalidate = 3600

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    true,
  token:     process.env.SANITY_API_TOKEN,
})

export async function generateMetadata({ params }) {
  const r = await sanity.fetch(
    '*[_type=="firearmRelease" && slug.current==$slug][0]{title,brand,model,summary,imageUrl,heroImage{asset->{url}}}',
    { slug: params.slug }
  ).catch(() => null)
  if (!r) return { title: 'Release — DownRange' }
  return {
    title: `${r.brand} ${r.model || r.title} — DownRange`,
    description: r.summary?.slice(0,155) || '',
    openGraph: { images: [r.heroImage?.asset?.url || r.imageUrl || ''] },
  }
}

export default async function ReleasePage({ params }) {
  const [release, alerts, related] = await Promise.all([
    sanity.fetch(
      `*[_type=="firearmRelease" && slug.current==$slug][0]{
        _id, title, brand, model, category, caliber, action, msrp, body, summary,
        specs, sourceUrl, availableDate, isJustDropped, publishedAt,
        imageUrl, heroImage{asset->{url}}, pressReleaseExcerpt
      }`,
      { slug: params.slug }
    ).catch(() => null),
    sanity.fetch('*[_type=="breakingAlert" && !(_id in path("drafts.**"))][0...3]{headline,url}').catch(() => []),
    sanity.fetch(
      '*[_type=="firearmRelease" && slug.current!=$slug && approved==true] | order(publishedAt desc) [0...4]{_id,title,brand,model,slug,imageUrl,category,caliber,heroImage{asset->{url}}}',
      { slug: params.slug }
    ).catch(() => []),
  ])

  if (!release) notFound()

  const img = release.heroImage?.asset?.url || release.imageUrl || 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg'

  const specRows = release.specs?.length > 0 ? release.specs : [
    release.caliber     && { label:'Caliber',    value: release.caliber },
    release.action      && { label:'Action',     value: release.action },
    release.msrp        && { label:'MSRP',       value: '$' + Number(release.msrp).toLocaleString() },
    release.category    && { label:'Category',   value: release.category },
    release.availableDate && { label:'Available', value: release.availableDate },
  ].filter(Boolean)

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div style={{ background:'var(--bg)', minHeight:'100vh' }}>
        <div className="container" style={{ maxWidth:900, padding:'0 20px', paddingTop:40, paddingBottom:80 }}>

          {/* ── BREADCRUMB ── */}
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', marginBottom:20, display:'flex', gap:8, alignItems:'center' }}>
            <a href="/releases" style={{ color:'#C8922A', textDecoration:'none' }}>Releases</a>
            <span>›</span>
            <span>{release.brand}</span>
            <span>›</span>
            <span style={{ color:'var(--text)' }}>{release.model || release.title}</span>
          </div>

          {/* ── HERO ── */}
          <div style={{ position:'relative', marginBottom:32 }}>
            <div style={{ width:'100%', height:'clamp(260px,40vw,480px)', overflow:'hidden', position:'relative' }}>
              <ArticleHeroImage src={img} alt={`${release.brand} ${release.model}`}
                fallback="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg" />
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, #09090B 0%, transparent 60%)' }} />
            </div>

            {/* Badges */}
            <div style={{ position:'absolute', top:16, left:16, display:'flex', gap:8 }}>
              {(release.isJustDropped || release.isNew) && (
                <span style={{ background:'#B91C1C', color:'#fff', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, letterSpacing:'.15em', padding:'4px 10px' }}>● NEW DROP</span>
              )}
              {release.category && (
                <span style={{ background:'rgba(0,0,0,.75)', color:'#C8922A', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, letterSpacing:'.1em', padding:'4px 10px' }}>
                  {release.category.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {/* ── HEADER ── */}
          <div style={{ marginBottom:32 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#C8922A', letterSpacing:'.1em', marginBottom:6 }}>
              {release.brand}
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.4rem,6vw,4rem)', color:'var(--text)', letterSpacing:'.04em', lineHeight:1, margin:'0 0 16px' }}>
              {release.model || release.title}
            </h1>
            {release.summary && (
              <p style={{ fontSize:16, color:'#9ca3af', lineHeight:1.7, margin:'0 0 20px', maxWidth:700 }}>
                {release.summary}
              </p>
            )}

            <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
              {release.msrp && (
                <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'#C8922A', letterSpacing:'.05em' }}>
                  ${Number(release.msrp).toLocaleString()}
                </span>
              )}
              {release.sourceUrl && (
                <a href={release.sourceUrl} target="_blank" rel="noreferrer"
                  style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase',
                    background:'#C8922A', color:'#000', padding:'10px 20px', textDecoration:'none', display:'inline-block' }}>
                  View on {release.brand} Site ↗
                </a>
              )}
            </div>
          </div>

          {/* ── SPECS TABLE ── */}
          {specRows.length > 0 && (
            <div style={{ marginBottom:40, border:'1px solid var(--border)' }}>
              <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.1em', textTransform:'uppercase', fontWeight:700, background:'rgba(0,0,0,.3)' }}>
                Specifications
              </div>
              {specRows.map((spec, i) => (
                <div key={i} style={{ display:'grid', gridTemplateColumns:'160px 1fr', borderBottom: i < specRows.length-1 ? '1px solid var(--border)' : 'none' }}>
                  <div style={{ padding:'10px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', borderRight:'1px solid var(--border)', background:'rgba(0,0,0,.15)' }}>
                    {spec.label}
                  </div>
                  <div style={{ padding:'10px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text)' }}>
                    {spec.value}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── ARTICLE BODY ── */}
          {release.body && (
            <div className="dr-article-body" style={{ marginBottom:40 }}
              dangerouslySetInnerHTML={{ __html: release.body }} />
          )}

          {/* ── PRESS RELEASE EXCERPT ── */}
          {release.pressReleaseExcerpt && (
            <div style={{ marginBottom:40, padding:'20px 24px', borderLeft:'3px solid #C8922A', background:'rgba(200,146,42,.06)' }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#C8922A', letterSpacing:'.1em', marginBottom:10, textTransform:'uppercase', fontWeight:700 }}>
                From the Manufacturer
              </div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#9ca3af', lineHeight:1.8, margin:0, fontStyle:'italic' }}>
                "{release.pressReleaseExcerpt}"
              </p>
            </div>
          )}

          {/* ── CTA ── */}
          {release.sourceUrl && (
            <div style={{ padding:24, border:'1px solid var(--border)', background:'var(--bg2)', marginBottom:40, display:'flex', gap:16, alignItems:'center', justifyContent:'space-between', flexWrap:'wrap' }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:4 }}>
                  Get the Full Story from {release.brand}
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b' }}>
                  Specs, availability, and dealer locator on the manufacturer site.
                </div>
              </div>
              <a href={release.sourceUrl} target="_blank" rel="noreferrer"
                style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase',
                  background:'#C8922A', color:'#000', padding:'12px 24px', textDecoration:'none', flexShrink:0 }}>
                {release.brand} Official Page ↗
              </a>
            </div>
          )}

          {/* ── RELATED RELEASES ── */}
          {related.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:16 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.05em' }}>More Releases</div>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12 }}>
                {related.map(r => (
                  <a key={r._id} href={'/releases/' + r.slug?.current}
                    style={{ textDecoration:'none', display:'block', background:'var(--bg2)', border:'1px solid var(--border)', overflow:'hidden', transition:'border-color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor='#C8922A'}
                    onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}>
                    <div style={{ height:120, overflow:'hidden', background:'#111' }}>
                      <img src={r.heroImage?.asset?.url || r.imageUrl || ''} alt={r.model}
                        style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.8 }} />
                    </div>
                    <div style={{ padding:'10px 12px' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#C8922A', marginBottom:2 }}>{r.brand}</div>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:16, color:'var(--text)', letterSpacing:'.03em' }}>{r.model || r.title}</div>
                      {r.caliber && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', marginTop:3 }}>{r.caliber}</div>}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
