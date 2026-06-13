import { notFound }       from 'next/navigation'
import { createClient }   from '@sanity/client'
import Masthead           from '../../../components/layout/Masthead'
import Footer             from '../../../components/layout/Footer'
import BreakingTicker     from '../../../components/layout/BreakingTicker'
import ArticleHeroImage   from '../../../components/ui/ArticleHeroImage'
import { fetchBreakingAlerts } from '../../../sanity/lib/client'

export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const FALLBACK = '/img/photos/law.jpg'

function getFallback(article) {
  const t = (article?.title || '').toLowerCase()
  if (/rifle|carabina|ar.?15|semi.auto/.test(t))  return '/img/photos/rifle.jpg'
  if (/pistola|revolver|porte|carry/.test(t))      return '/img/photos/pistol.jpg'
  if (/munição|municao|cartucho/.test(t))           return '/img/photos/ammo.jpg'
  if (/caça|caca|veado|javali/.test(t))             return '/img/photos/hunting.jpg'
  if (/supressor|silenciador/.test(t))              return '/img/photos/suppressor.jpg'
  return '/img/photos/law.jpg'
}

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })
}

function timeAgo(date) {
  if (!date) return ''
  const diff = Date.now() - new Date(date).getTime()
  const min  = Math.floor(diff / 60000)
  if (min < 60)  return `${min}min atrás`
  const hr = Math.floor(min / 60)
  if (hr < 24)   return `${hr}h atrás`
  return `${Math.floor(hr / 24)}d atrás`
}

function readingTime(text) {
  if (!text) return '1 min de leitura'
  const words = text.replace(/<[^>]+>/g, '').trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200)) + ' min de leitura'
}

async function getArtigo(slug) {
  return sanity.fetch(
    `*[_type == "brazilContent" && type == "artigo" && active == true && slug.current == $slug][0] {
      _id, title, slug, body, summary, imageUrl, tag, readMins, author,
      sourceUrl, publishedAt, active
    }`,
    { slug }
  ).catch(() => null)
}

async function getRelated(slug) {
  return sanity.fetch(
    `*[_type == "brazilContent" && type == "artigo" && active == true && slug.current != $slug]
      | order(publishedAt desc) [0...5] {
      _id, title, slug, imageUrl, tag, publishedAt
    }`,
    { slug }
  ).catch(() => [])
}

export async function generateMetadata({ params }) {
  const article = await getArtigo(params.slug)
  if (!article) return { title: 'Artigo não encontrado | DownRange' }
  const url = `https://downrangeco.com/brazil/${params.slug}`
  return {
    title:       `${article.title} | DownRange Brasil`,
    description: article.summary || article.title,
    alternates:  { canonical: url },
    openGraph: {
      type:  'article',
      url,
      title: article.title,
      description: article.summary || article.title,
      publishedTime: article.publishedAt,
      images: article.imageUrl ? [{ url: article.imageUrl, width: 1200, height: 630 }] : [],
    },
    twitter: {
      card:  'summary_large_image',
      title: article.title,
      description: article.summary || article.title,
      images: article.imageUrl ? [article.imageUrl] : [],
    },
  }
}

const TAG_COLORS = {
  LEI:      { color: '#60A5FA', bg: '#001a2a', label: 'LEI'      },
  POLÍTICA: { color: '#C084FC', bg: '#1a0a2a', label: 'POLÍTICA' },
  GUIA:     { color: '#34D399', bg: '#001a0a', label: 'GUIA/CAC' },
  SETOR:    { color: '#C8922A', bg: '#1a1000', label: 'SETOR'    },
  ALERTA:   { color: '#EF4444', bg: '#2a0000', label: 'ALERTA'   },
  NEWS:     { color: '#9CA3AF', bg: '#1a1f2e', label: 'NOTÍCIA'  },
}

export default async function BrazilArtigoPage({ params }) {
  const [article, related, alerts] = await Promise.all([
    getArtigo(params.slug),
    getRelated(params.slug),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  if (!article) notFound()

  const tag      = article.tag || 'NEWS'
  const tagStyle = TAG_COLORS[tag] || TAG_COLORS.NEWS
  const imageUrl = article.imageUrl || getFallback(article)
  const pageUrl  = `https://downrangeco.com/brazil/${params.slug}`

  return (
    <>
      <Masthead />

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        '@context':  'https://schema.org',
        '@type':     'NewsArticle',
        headline:    article.title,
        description: article.summary || article.title,
        image:       imageUrl ? [imageUrl] : [],
        datePublished: article.publishedAt,
        inLanguage:  'pt-BR',
        author: [{ '@type': 'Person', name: article.author || 'DownRange Brasil' }],
        publisher: {
          '@type': 'Organization', name: 'DownRange',
          url: 'https://downrangeco.com',
          logo: { '@type': 'ImageObject', url: 'https://downrangeco.com/favicon.svg' },
        },
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        url: pageUrl,
      }) }} />

      <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* Hero image */}
        <div style={{ width: '100%', height: 'clamp(280px, 45vw, 520px)', overflow: 'hidden', position: 'relative' }}>
          <ArticleHeroImage src={imageUrl} alt={article.title} fallback={FALLBACK} />
          <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', background: 'linear-gradient(0deg, #0A0B0C 0%, transparent 100%)' }} />
        </div>

        {/* Header */}
        <div style={{ background: 'transparent', borderBottom: '1px solid var(--border)', marginTop: '-80px', position: 'relative', zIndex: 1 }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>

            {/* Breadcrumb */}
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: '1.5rem', fontSize: '0.72rem', fontFamily: "'IBM Plex Mono',monospace" }}>
              <a href="/" style={{ color: '#4B5563', textDecoration: 'none' }}>HOME</a>
              <span style={{ color: '#2D3748' }}>›</span>
              <a href="/brazil" style={{ color: '#4B5563', textDecoration: 'none' }}>🇧🇷 BRASIL</a>
              <span style={{ color: '#2D3748' }}>›</span>
              <span style={{ color: '#C8922A' }}>{tagStyle.label}</span>
            </div>

            {/* Tag badge */}
            <div style={{ display: 'flex', gap: 8, marginBottom: '1.25rem', flexWrap: 'wrap' }}>
              <span style={{ background: tagStyle.bg, color: tagStyle.color, padding: '3px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.7rem', fontWeight: 700, border: `1px solid ${tagStyle.color}40`, letterSpacing: '0.1em' }}>
                🇧🇷 {tagStyle.label}
              </span>
            </div>

            {/* Title */}
            <h1 style={{ fontFamily: "'Bebas Neue', Impact, sans-serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.05, color: '#F5F5F3', letterSpacing: '0.02em', marginBottom: '1.25rem' }}>
              {article.title}
            </h1>

            {/* Summary lede */}
            {article.summary && (
              <p style={{ fontSize: '1.1rem', lineHeight: 1.7, color: '#94A3B8', marginBottom: '1.5rem', borderLeft: '3px solid #C8922A', paddingLeft: '1rem', maxWidth: 700 }}>
                {article.summary}
              </p>
            )}

            {/* Meta */}
            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap', fontSize: '0.78rem', color: '#4B5563', fontFamily: "'IBM Plex Mono',monospace" }}>
              <span>{article.author || 'DownRange Brasil'}</span>
              <span style={{ color: '#2D3748' }}>|</span>
              <span>{formatDate(article.publishedAt)}</span>
              <span style={{ color: '#2D3748' }}>|</span>
              <span style={{ color: '#C8922A' }}>{timeAgo(article.publishedAt)}</span>
              <span style={{ color: '#2D3748' }}>|</span>
              <span>{article.readMins || readingTime(article.body)}</span>
              {article.sourceUrl && (
                <>
                  <span style={{ color: '#2D3748' }}>|</span>
                  <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                    style={{ color: '#60A5FA', textDecoration: 'none', fontSize: '0.72rem' }}>
                    FONTE ORIGINAL ↗
                  </a>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Body + Sidebar */}
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '2.5rem' }}>

          {/* Main */}
          <div>
            {article.body ? (
              <>
                <style>{`
                  .dr-article-body h2 {
                    font-family: 'Bebas Neue', sans-serif;
                    font-size: 1.5rem;
                    letter-spacing: 0.04em;
                    color: #F0EDE6;
                    margin: 2.5rem 0 0.75rem;
                    padding-bottom: 0.4rem;
                    border-bottom: 2px solid #C8922A;
                    line-height: 1.1;
                  }
                  .dr-article-body h2:first-child { margin-top: 0; }
                  .dr-article-body p {
                    font-size: 1.05rem;
                    line-height: 1.85;
                    color: #CBD5E1;
                    margin-bottom: 1.4rem;
                    font-family: 'IBM Plex Sans', Arial, sans-serif;
                    text-align: justify;
                  }
                  .dr-article-body strong { color: #F0EDE6; font-weight: 700; }
                  .dr-article-body em { color: #C8922A; font-style: normal; font-weight: 600; }
                  .dr-article-body ul { margin: 0.75rem 0 1.4rem 0; padding-left: 0; list-style: none; }
                  .dr-article-body li {
                    font-size: 1rem;
                    line-height: 1.75;
                    color: #CBD5E1;
                    padding: 0.3rem 0 0.3rem 1.2rem;
                    position: relative;
                    font-family: 'IBM Plex Sans', Arial, sans-serif;
                    border-bottom: 1px solid rgba(30,41,59,0.4);
                  }
                  .dr-article-body li:before {
                    content: '◈';
                    position: absolute;
                    left: 0;
                    color: #C8922A;
                    font-size: 0.7rem;
                    top: 0.45rem;
                  }
                `}</style>
                <div className="dr-article-body" dangerouslySetInnerHTML={{ __html: article.body }} />

                {article.sourceUrl && (
                  <div style={{ margin: '2.5rem 0 0', padding: '1.25rem 1.5rem', background: 'rgba(200,146,42,0.06)', border: '1px solid rgba(200,146,42,0.25)', borderLeft: '4px solid #C8922A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                    <div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.65rem', color: '#C8922A', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 4 }}>FONTE ORIGINAL</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '0.8rem', color: '#6B7280', lineHeight: 1.6 }}>Escrito pelo DownRange com base no artigo original. Leia a fonte primária para mais detalhes.</div>
                    </div>
                    <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8922A', color: '#000', padding: '0.6rem 1.4rem', fontFamily: "'IBM Plex Mono', monospace", fontWeight: 700, fontSize: '0.75rem', textDecoration: 'none', letterSpacing: '0.06em', whiteSpace: 'nowrap', flexShrink: 0 }}>
                      LER ORIGINAL ↗
                    </a>
                  </div>
                )}
              </>
            ) : (
              <div>
                {article.summary && (
                  <p style={{ fontSize: '1.1rem', lineHeight: 1.9, color: '#CBD5E1', marginBottom: '1.5rem' }}>{article.summary}</p>
                )}
                {article.sourceUrl && (
                  <div style={{ marginTop: '2rem', padding: '1.5rem 2rem', background: '#0D1117', border: '1px solid #C8922A30', borderLeft: '4px solid #C8922A' }}>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.65rem', color: '#C8922A', letterSpacing: '0.15em', fontWeight: 700, marginBottom: 8 }}>FONTE ORIGINAL</div>
                    <p style={{ color: '#6B7280', marginBottom: '1rem', fontSize: '0.875rem', lineHeight: 1.6 }}>Escrito pelo DownRange com base no artigo original.</p>
                    <a href={article.sourceUrl} target="_blank" rel="noopener noreferrer"
                      style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#C8922A', color: '#000', padding: '0.65rem 1.5rem', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '0.8rem', textDecoration: 'none', letterSpacing: '0.05em' }}>
                      LER ARTIGO ORIGINAL ↗
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Share */}
            <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border)', display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <span style={{ fontSize: '0.7rem', color: '#4B5563', fontFamily: "'IBM Plex Mono',monospace", letterSpacing: '0.1em' }}>COMPARTILHAR:</span>
              {[
                { label: 'X / TWITTER', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(article.title)}&url=${encodeURIComponent(pageUrl)}` },
                { label: 'FACEBOOK',    href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}` },
                { label: 'WHATSAPP',    href: `https://wa.me/?text=${encodeURIComponent(article.title + ' ' + pageUrl)}` },
              ].map(s => (
                <a key={s.label} href={s.href} target="_blank" rel="noopener noreferrer"
                  style={{ color: '#4B5563', textDecoration: 'none', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', padding: '4px 8px', border: '1px solid var(--border)' }}>
                  {s.label}
                </a>
              ))}
            </div>
          </div>

          {/* Sidebar */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ background: '#111318', border: '1px solid var(--border)', padding: '1.25rem' }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', color: '#C8922A', letterSpacing: '0.12em', marginBottom: '1rem', fontWeight: 700 }}>🇧🇷 MAIS DO BRASIL</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {related.map(a => (
                  <a key={a._id} href={`/brazil/${a.slug?.current}`} style={{ textDecoration: 'none', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <div style={{ width: 54, height: 40, flexShrink: 0, overflow: 'hidden', background: '#1a1000' }}>
                      {a.imageUrl && <img src={a.imageUrl} alt={a.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      {a.tag && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.6rem', color: TAG_COLORS[a.tag]?.color || '#9CA3AF', marginBottom: 3, letterSpacing: '0.1em' }}>{a.tag}</div>}
                      <div style={{ fontSize: '0.82rem', color: '#D1D5DB', lineHeight: 1.35, fontWeight: 600 }}>
                        {a.title?.length > 75 ? a.title.slice(0, 75) + '…' : a.title}
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#4B5563', marginTop: 3, fontFamily: "'IBM Plex Mono',monospace" }}>{timeAgo(a.publishedAt)}</div>
                    </div>
                  </a>
                ))}
              </div>
              <a href="/brazil" style={{ display: 'block', textAlign: 'center', marginTop: '1rem', color: '#C8922A', textDecoration: 'none', fontFamily: "'IBM Plex Mono',monospace", fontSize: '0.68rem', letterSpacing: '0.1em' }}>
                TODOS OS ARTIGOS →
              </a>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </>
  )
}
