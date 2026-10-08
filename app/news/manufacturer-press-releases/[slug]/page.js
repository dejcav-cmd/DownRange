import { notFound } from 'next/navigation'
import Link from 'next/link'
import Masthead       from '../../../../components/layout/Masthead'
import Footer         from '../../../../components/layout/Footer'
import BreakingTicker from '../../../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../../../sanity/lib/client'
import PressStyles    from '../../../../components/press/PressStyles'
import PressGrid      from '../../../../components/press/PressGrid'
import ReadProgress   from '../../../../components/press/ReadProgress'
import { getPressBySlug, getPressNeighbors, getMoreFromBrand } from '../../../../lib/pressData'
import { KIND_META, fmtDate, pressHref, PRESS_BASE } from '../../../../lib/pressUi'

export const revalidate = 300

const SITE = 'https://www.downrangeco.com'

export async function generateMetadata({ params }) {
  const r = await getPressBySlug(params.slug).catch(() => null)
  if (!r) return { title: 'Press Release Not Found' }
  const url = `${SITE}${PRESS_BASE}/${params.slug}`
  const img = r.image || SITE + '/og-default.png'
  const desc = (r.summary || r.title).slice(0, 160)
  return {
    title: r.title,
    description: desc,
    alternates: { canonical: url },
    openGraph: { type: 'article', url, title: r.title, description: desc, publishedTime: r.publishedAt, section: r.brand,
      images: [{ url: img.startsWith('http') ? img : SITE + img, width: 1200, height: 630, alt: r.title }] },
    twitter: { card: 'summary_large_image', title: r.title, description: desc },
  }
}

export default async function PressArticlePage({ params }) {
  const r = await getPressBySlug(params.slug).catch(() => null)
  if (!r) notFound()

  const [alerts, nb, more] = await Promise.all([
    fetchBreakingAlerts(5).catch(() => []),
    getPressNeighbors(r.publishedAt).catch(() => ({ newer: null, older: null })),
    getMoreFromBrand(r.brandSlug, r._id, 3).catch(() => []),
  ])

  const kind = KIND_META[r.kind] || KIND_META.product
  const img = r.image
  const url = `${SITE}${PRESS_BASE}/${r.slug}`
  let sourceHost = ''
  try { sourceHost = new URL(r.sourceUrl).hostname.replace(/^www\./, '') } catch {}

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'NewsArticle', '@id': url + '#article',
      headline: r.title, description: (r.summary || r.title).slice(0, 160),
      image: [img],
      datePublished: r.publishedAt, dateModified: r._updatedAt || r.publishedAt,
      author: [{ '@type': 'Person', name: 'DJ Cavalcanti', url: SITE + '/about', jobTitle: 'DownRange Founder' }],
      publisher: { '@type': 'Organization', '@id': SITE + '/#organization', name: 'DownRange', url: SITE,
        logo: { '@type': 'ImageObject', url: SITE + '/img/logo.png' } },
      mainEntityOfPage: { '@type': 'WebPage', '@id': url },
      isBasedOn: r.sourceUrl, keywords: (r.tags || []).join(', '), inLanguage: 'en-US',
      about: { '@type': 'Organization', name: r.brand },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'News', item: SITE + '/news' },
        { '@type': 'ListItem', position: 3, name: 'Manufacturer Press Releases', item: SITE + PRESS_BASE },
        { '@type': 'ListItem', position: 4, name: r.title, item: url },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Masthead />
      <BreakingTicker alerts={alerts} />
      <PressStyles />
      <ReadProgress />

      <main style={{ background: 'var(--bg)', minHeight: '100vh', paddingBottom: 56 }}>
        <div className="pr-art-hero"><img src={img + '?w=1600&auto=format&q=82'} alt={r.title} decoding="async" fetchPriority="high" /></div>

        <header className="pr-art-head">
          <nav className="pr-crumbs" aria-label="Breadcrumb">
            <Link href="/">HOME</Link><span>›</span>
            <Link href="/news">NEWS</Link><span>›</span>
            <Link href={PRESS_BASE}>PRESS RELEASES</Link><span>›</span>
            <Link href={pressHref({ brand: r.brandSlug })} style={{ color: 'var(--gold)' }}>{r.brand.toUpperCase()}</Link>
          </nav>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span className="pr-badge-kind" style={{ position: 'static', color: kind.color, borderColor: kind.color }}>{kind.label}</span>
          </div>
          <h1 className="pr-art-title">{r.title}</h1>
          {r.summary && <p className="pr-art-lede">{r.summary}</p>}
          <div className="pr-art-meta">
            <span>By DJ Cavalcanti, DownRange Founder</span>
            <span>{fmtDate(r.publishedAt)}</span>
            {r.readTime ? <span>{r.readTime} min read</span> : null}
          </div>
        </header>

        <article className="pr-art-body">
          <div className="dr-article-body" dangerouslySetInnerHTML={{ __html: r.body || '' }} />

          <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="pr-src-btn">
            READ THE ORIGINAL RELEASE ↗
          </a>
          <div className="pr-src-card">
            Source: <a href={r.sourceUrl} target="_blank" rel="noopener noreferrer nofollow">{r.sourceTitle || r.sourceUrl}</a>
            {sourceHost ? ` (${sourceHost})` : ''}.
            {' '}This article summarizes an announcement published by {r.brand}. Details, specifications and pricing come from the manufacturer and may change.
          </div>
          {r.tags && r.tags.length > 0 && (
            <div className="pr-pills">
              {r.tags.slice(0, 8).map(t => <span key={t} className="pr-pill">#{t}</span>)}
            </div>
          )}
        </article>

        <nav className="pr-art-nav" aria-label="Previous and next release">
          {nb.newer ? (
            <Link href={`${PRESS_BASE}/${nb.newer.slug}`} className="pr-navcard" rel="prev">
              <small>← NEWER</small><span>{nb.newer.title}</span>
            </Link>
          ) : <span />}
          {nb.older ? (
            <Link href={`${PRESS_BASE}/${nb.older.slug}`} className="pr-navcard r" rel="next">
              <small>OLDER →</small><span>{nb.older.title}</span>
            </Link>
          ) : <span />}
        </nav>

        {more.length > 0 && (
          <section className="pr-more">
            <h2>More from {r.brand}</h2>
            <PressGrid items={more} />
          </section>
        )}

        <div style={{ textAlign: 'center', marginTop: 30 }}>
          <Link href={PRESS_BASE} className="dr-btn-outline">← All press releases</Link>
        </div>
      </main>
      <Footer />
    </>
  )
}
