import { notFound }    from 'next/navigation'
import Masthead        from '../../../components/layout/Masthead'
import Footer          from '../../../components/layout/Footer'
import BreakingTicker  from '../../../components/layout/BreakingTicker'
import Link            from 'next/link'
import { BLOG_POSTS }  from '../page'
import { fetchBreakingAlerts, fetchBlogPostsPaginated, fetchBlogPostBySlug } from '../../../sanity/lib/client'

export const revalidate = 60
export const dynamicParams = true // render unknown slugs on-demand, not 404

// Merge static BLOG_POSTS with Sanity posts so all slugs resolve
async function getAllPosts() {
  try {
    const sanityPosts = await fetchBlogPostsPaginated({ page: 1, perPage: 50 }).then(r => r.posts || []).catch(() => [])
    // Map Sanity posts to same shape, static BLOG_POSTS take precedence
    const sanityMapped = (sanityPosts || []).map(p => ({
      slug:       p.slug?.current || p.slug,
      title:      p.title || '',
      subtitle:   p.excerpt || '',
      author:     p.author || 'DJ Cavalcanti',
      authorRole: 'Founder, DownRange',
      date:       p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : '',
      readTime:   p.readTime || '8 min read',
      category:   (p.category || 'general').toUpperCase(),
      catColor:   '#C8922A',
      featured:   false,
      img:        p.imageUrl || '/img/photos/rifle.jpg',
      excerpt:    p.excerpt || '',
      tags:       p.tags || [],
      body:       p.body || p.summary || p.excerpt || '',
      _fromSanity: true,
    }))
    const staticSlugs = new Set(BLOG_POSTS.map(p => p.slug))
    const merged = [...BLOG_POSTS, ...sanityMapped.filter(p => !staticSlugs.has(p.slug))]
    return merged
  } catch {
    return BLOG_POSTS
  }
}

export async function generateStaticParams() {
  const allPosts = await getAllPosts().catch(() => BLOG_POSTS)
  return allPosts.map(p => ({ slug: p.slug }))
}

export async function generateMetadata({ params }) {
  const allPosts = await getAllPosts().catch(() => BLOG_POSTS)
  const post = allPosts.find(p => p.slug === params.slug)
  if (!post) return { title: 'Article Not Found | DownRange' }
  const url = `https://www.downrangeco.com/blog/${params.slug}`
  return {
    title:       `${post.title} | DownRange Blog`,
    description: post.excerpt,
    alternates:  { canonical: url },
    openGraph: {
      type:        'article',
      url,
      title:       post.title,
      description: post.excerpt,
      publishedTime: post.date,
      authors:     [post.author],
      tags:        post.tags || [],
      images: post.img
        ? [{ url: post.img, width: 1400, height: 900, alt: post.title }]
        : [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       post.title,
      description: (post.excerpt || '').slice(0, 160),
      images:      [post.img || 'https://www.downrangeco.com/og-default.png'],
    },
  }
}

export default async function BlogArticlePage({ params }) {
  const allPosts = await getAllPosts().catch(() => BLOG_POSTS)

  // First try to get full post with body from Sanity directly (most reliable for body content)
  let post = null
  const sanityPost = await fetchBlogPostBySlug(params.slug).catch(() => null)
  if (sanityPost) {
    post = {
      slug:       sanityPost.slug || params.slug,
      title:      sanityPost.title || '',
      subtitle:   sanityPost.excerpt || '',
      author:     sanityPost.author || 'DJ Cavalcanti',
      authorRole: sanityPost.authorRole || 'Founder, DownRange',
      date:       sanityPost.publishedAt ? new Date(sanityPost.publishedAt).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric'}) : '',
      readTime:   sanityPost.readTime ? sanityPost.readTime + ' min read' : '8 min read',
      category:   (sanityPost.category || 'general').toUpperCase(),
      catColor:   '#C8922A',
      featured:   false,
      img:        sanityPost.imageUrl || '/img/photos/rifle.jpg',
      excerpt:    sanityPost.excerpt || '',
      tags:       sanityPost.tags || [],
      body:       sanityPost.body || '',
      _fromSanity: true,
    }
  } else {
    // Fall back to static posts
    post = allPosts.find(p => p.slug === params.slug)
  }

  if (!post) notFound()

  const alerts      = await fetchBreakingAlerts(3).catch(() => [])
  const DEFAULT_BIO = "DJ Cavalcanti is the founder of DownRange — built to give every American gun owner one place for the news, laws, market data, and practical knowledge they actually need. No algorithms, no paywalls, no corporate backing."
  let authorBio = DEFAULT_BIO
  try {
    const m = await import('../../../lib/authorBio')
    authorBio = await m.fetchAuthorBio() || DEFAULT_BIO
  } catch (e) { authorBio = DEFAULT_BIO }
  const postIndex   = allPosts.findIndex(p => p.slug === params.slug)
  const prevPost    = allPosts[postIndex + 1] || null
  const nextPost    = allPosts[postIndex - 1] || null
  const relatedPosts = allPosts.filter(p => p.slug !== post.slug).slice(0, 3)

  return (
    <>
      <Masthead />

      {/* ── Structured data: BlogPosting + BreadcrumbList ── */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([
        {
          '@context':   'https://schema.org',
          '@type':      'BlogPosting',
          '@id':        `https://www.downrangeco.com/blog/${post.slug}#article`,
          headline:     post.title,
          description:  (post.excerpt || '').slice(0, 160),
          image: post.img
            ? [{ '@type': 'ImageObject', url: post.img, width: 1400, height: 900 }]
            : [{ '@type': 'ImageObject', url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630 }],
          datePublished: post.date,
          dateModified:  post.date,
          author: [{
            '@type':   'Person',
            name:      post.author || 'DJ Cavalcanti',
            url:       'https://www.downrangeco.com/about',
            jobTitle:  'Founder, DownRange',
          }],
          publisher: {
            '@type': 'Organization',
            '@id':   'https://www.downrangeco.com/#organization',
            name:    'DownRange',
            url:     'https://www.downrangeco.com',
            logo:    { '@type': 'ImageObject', url: 'https://www.downrangeco.com/img/logo.png', width: 560, height: 162 },
          },
          mainEntityOfPage: {
            '@type': 'WebPage',
            '@id':   `https://www.downrangeco.com/blog/${post.slug}`,
          },
          isPartOf: { '@id': 'https://www.downrangeco.com/#website' },
          keywords: (post.tags || []).join(', '),
          url: `https://www.downrangeco.com/blog/${post.slug}`,
          inLanguage: 'en-US',
        },
        {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
            { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://www.downrangeco.com/blog' },
            { '@type': 'ListItem', position: 3, name: post.title, item: `https://www.downrangeco.com/blog/${post.slug}` },
          ],
        },
      ]) }} />

      <style>{`
        .blog-article-body h2 {
          font-family: 'Bebas Neue', sans-serif;
          font-size: 1.55rem;
          letter-spacing: 0.04em;
          color: #F0EDE6;
          margin: 2.8rem 0 0.9rem;
          padding-bottom: 0.45rem;
          border-bottom: 2px solid #C8922A;
          line-height: 1.1;
        }
        .blog-article-body h2:first-child { margin-top: 0; }
        .blog-article-body p {
          font-size: 1.08rem;
          line-height: 1.88;
          color: #CBD5E1;
          margin-bottom: 1.5rem;
          font-family: 'IBM Plex Sans', Georgia, serif;
          text-align: justify;
        }
        .blog-article-body strong { color: #F0EDE6; font-weight: 700; }
        .blog-article-body em { color: #C8922A; font-style: italic; }
        .blog-article-body ul {
          margin: 0.75rem 0 1.5rem 0;
          padding-left: 0;
          list-style: none;
        }
        .blog-article-body li {
          font-size: 1.05rem;
          line-height: 1.78;
          color: #CBD5E1;
          padding: 0.5rem 0 0.5rem 1.4rem;
          position: relative;
          font-family: 'IBM Plex Sans', Georgia, serif;
          border-bottom: 1px solid rgba(30,41,59,0.4);
        }
        .blog-article-body li:before {
          content: '◈';
          position: absolute;
          left: 0;
          color: #C8922A;
          font-size: 0.7rem;
          top: 0.6rem;
        }
        .related-card:hover { border-color: var(--gold) !important; }
        .related-card { transition: border-color 0.2s; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ width:'100%', height:'clamp(320px, 50vw, 580px)', position:'relative', overflow:'hidden' }}>
        <img src={post.img} alt={post.title}
          style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.55) 50%, rgba(9,9,11,0.15) 100%)' }} />

        {/* Hero text overlay */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0 }}>
          <div style={{ maxWidth:900, margin:'0 auto', padding:'0 1.5rem 3rem' }}>
            <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color: post.catColor === '#C8922A' || post.catColor === '#22c55e' ? '#000' : '#fff', background:post.catColor, padding:'3px 12px', letterSpacing:'0.1em' }}>
                {post.category}
              </span>
              <Link href="/blog" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'rgba(255,255,255,0.45)', textDecoration:'none', letterSpacing:'0.06em' }}>
                ← THE RANGE REPORT
              </Link>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2rem, 5vw, 3.2rem)', lineHeight:1.0, color:'#F5F5F3', letterSpacing:'0.02em', marginBottom:14, maxWidth:800 }}>
              {post.title}
            </h1>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'rgba(203,213,225,0.8)', maxWidth:680, lineHeight:1.65, marginBottom:20 }}>
              {post.subtitle}
            </p>
            {/* Author bar */}
            <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <img src="/img/dj-avatar.png" alt="DJ Cavalcanti" width="38" height="38" style={{ borderRadius:'50%', border:'2px solid #C8922A', objectFit:'cover', flexShrink:0 }} />
                <div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'#F0EDE6' }}>{post.author}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'rgba(203,213,225,0.6)' }}>{post.authorRole}</div>
                </div>
              </div>
              <span style={{ color:'rgba(255,255,255,0.2)' }}>|</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'rgba(203,213,225,0.6)' }}>{post.date}</span>
              <span style={{ color:'rgba(255,255,255,0.2)' }}>|</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A' }}>{post.readTime}</span>
              <div style={{ display:'flex', gap:6, marginLeft:8, flexWrap:'wrap' }}>
                {(post.tags || []).map(t => (
                  <span key={t} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'rgba(203,213,225,0.45)', background:'rgba(255,255,255,0.07)', padding:'2px 7px', borderRadius:2 }}>
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ARTICLE BODY ── */}
      <main style={{ background:'var(--bg)' }}>
        <div style={{ maxWidth:900, margin:'0 auto', padding:'3rem 1.5rem' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 240px', gap:'3rem', alignItems:'start' }}>

            {/* Main content */}
            <article>
              {/* Pull quote / excerpt */}
              <div style={{ background:'rgba(200,146,42,0.06)', borderLeft:'4px solid #C8922A', padding:'1.25rem 1.5rem', marginBottom:'2.5rem', borderRadius:3 }}>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:13, color:'#94a3b8', lineHeight:1.7, margin:0, fontStyle:'italic' }}>
                  {post.excerpt}
                </p>
              </div>

              {/* Body HTML */}
              {post.body && post.body.trim().length > 20 ? (
                <div className="blog-article-body" dangerouslySetInnerHTML={{ __html: post.body }} />
              ) : (
                <div className="blog-article-body" style={{ color:'var(--text-muted)', fontStyle:'italic', padding:'2rem 0' }}>
                  <p>This article is being written. Check back shortly — it will be live soon.</p>
                </div>
              )}

              {/* Tags */}
              <div style={{ marginTop:'3rem', paddingTop:'1.5rem', borderTop:'1px solid rgba(30,41,59,0.5)' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#334155', marginBottom:8, letterSpacing:'0.1em' }}>TAGS</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {(post.tags || []).map(t => (
                    <span key={t} style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'#64748b', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'4px 10px', borderRadius:2 }}>
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Author card */}
              <div style={{ marginTop:'2.5rem', padding:'1.5rem 1.75rem', background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:4, display:'flex', gap:16, alignItems:'flex-start' }}>
                <img src="/img/dj-avatar.png" alt="DJ Cavalcanti" width="72" height="72" style={{ borderRadius:'50%', border:'3px solid #C8922A', objectFit:'cover', flexShrink:0, boxShadow:'0 0 0 3px rgba(200,146,42,.15)' }} />
                <div>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', letterSpacing:'0.04em', color:'var(--foreground)', marginBottom:4 }}>DJ Cavalcanti</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'var(--gold)', marginBottom:8 }}>Founder, DownRange · Washington State</div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:1.65, margin:0 }}>
                    {authorBio}
                  </p>
                </div>
              </div>

              {/* Prev / Next navigation */}
              <div style={{ marginTop:'2.5rem', display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                {prevPost && (
                  <Link href={`/blog/${prevPost.slug}`} style={{ textDecoration:'none', background:'var(--bg2)', border:'1px solid var(--border)', padding:'14px 16px', borderRadius:3, display:'block' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#334155', marginBottom:4 }}>← PREVIOUS</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--foreground)', lineHeight:1.2 }}>{prevPost.title}</div>
                  </Link>
                )}
                {nextPost && (
                  <Link href={`/blog/${nextPost.slug}`} style={{ textDecoration:'none', background:'var(--bg2)', border:'1px solid var(--border)', padding:'14px 16px', borderRadius:3, display:'block', textAlign:'right', gridColumn: prevPost ? 'auto' : '2' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#334155', marginBottom:4 }}>NEXT →</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--foreground)', lineHeight:1.2 }}>{nextPost.title}</div>
                  </Link>
                )}
              </div>
            </article>

            {/* Sidebar */}
            <aside style={{ position:'sticky', top:80 }}>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', letterSpacing:'0.1em', marginBottom:12 }}>MORE FROM DJ</div>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  {relatedPosts.map(rp => (
                    <Link key={rp.slug} href={`/blog/${rp.slug}`} style={{ textDecoration:'none' }} className="related-card">
                      <div style={{ border:'1px solid var(--border)', borderRadius:3, overflow:'hidden' }}>
                        <div style={{ height:110, overflow:'hidden' }}>
                          <img src={rp.img} alt={rp.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                        </div>
                        <div style={{ padding:'10px 12px' }}>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:7, color:rp.catColor, marginBottom:4, letterSpacing:'0.08em' }}>{rp.category}</div>
                          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--foreground)', lineHeight:1.2 }}>{rp.title}</div>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#475569', marginTop:4 }}>{rp.readTime}</div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderRadius:4, padding:'16px' }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', letterSpacing:'0.05em', color:'var(--foreground)', marginBottom:8 }}>THE RANGE REPORT</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', lineHeight:1.6, marginBottom:12 }}>
                  Expert analysis on firearms, 2A law, and industry intelligence from DJ Cavalcanti and the DownRange team.
                </p>
                <Link href="/blog" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', textDecoration:'none', display:'block', textAlign:'center', background:'rgba(200,146,42,0.1)', border:'1px solid rgba(200,146,42,0.3)', padding:'8px', borderRadius:3 }}>
                  All Articles →
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
