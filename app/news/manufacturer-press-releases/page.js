import Masthead       from '../../../components/layout/Masthead'
import Footer         from '../../../components/layout/Footer'
import BreakingTicker from '../../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../../sanity/lib/client'
import PressStyles    from '../../../components/press/PressStyles'
import PressFilterBar from '../../../components/press/PressFilterBar'
import PressCard      from '../../../components/press/PressCard'
import PressGrid      from '../../../components/press/PressGrid'
import PressPager     from '../../../components/press/PressPager'
import PressKeys      from '../../../components/press/PressKeys'
import { getPressPage, getPressFacets } from '../../../lib/pressData'
import { PRESS_SOURCES } from '../../../lib/pressSources'
import { pressHref, timeAgo, PRESS_BASE } from '../../../lib/pressUi'

export const revalidate = 300

const SITE = 'https://www.downrangeco.com'

export async function generateMetadata({ searchParams }) {
  const filtered = !!(searchParams?.brand || searchParams?.type || searchParams?.month || (searchParams?.page && searchParams.page !== '1'))
  return {
    title: 'Manufacturer Press Releases — DownRange',
    description: 'Every new press release from the major US firearm manufacturers, rewritten as short articles and linked to the original source. Filter by manufacturer and browse back through time.',
    alternates: { canonical: SITE + PRESS_BASE },
    robots: filtered ? { index: false, follow: true } : undefined,
    openGraph: {
      title: 'Manufacturer Press Releases — DownRange',
      description: 'New product, corporate and industry announcements from the top US firearm makers, updated twice a week.',
      url: SITE + PRESS_BASE,
      type: 'website',
    },
  }
}

const clean = v => (typeof v === 'string' ? v.replace(/[^a-z0-9-]/gi, '').slice(0, 60) : null) || null

export default async function PressReleasesPage({ searchParams }) {
  const brand = clean(searchParams?.brand)
  const kind  = clean(searchParams?.type)
  const month = /^\d{4}-\d{2}$/.test(searchParams?.month || '') ? searchParams.month : null
  const page  = Math.max(1, parseInt(searchParams?.page || '1', 10) || 1)

  const [alerts, data, facets] = await Promise.all([
    fetchBreakingAlerts(5).catch(() => []),
    getPressPage({ page, brand, kind, month, featured: !brand && !kind && !month }).catch(() => ({ items: [], total: 0, pages: 1, page: 1 })),
    getPressFacets().catch(() => ({ total: 0, brands: [], months: [], kinds: {}, latest: null })),
  ])

  const { items, total, pages } = data
  const hasLive = facets.total > 0
  const featured = page === 1 && !brand && !kind && !month ? items[0] : null
  const rest = featured ? items.slice(1) : items
  const newerHref = page > 1 ? pressHref({ brand, kind, month, page: page - 1 }) : null
  const olderHref = page < pages ? pressHref({ brand, kind, month, page: page + 1 }) : null

  const jsonLd = [
    {
      '@context': 'https://schema.org', '@type': 'CollectionPage',
      name: 'Manufacturer Press Releases', url: SITE + PRESS_BASE,
      description: 'Press releases from US firearm manufacturers, summarized by DownRange.',
      isPartOf: { '@id': SITE + '/#website' },
    },
    {
      '@context': 'https://schema.org', '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: SITE },
        { '@type': 'ListItem', position: 2, name: 'News', item: SITE + '/news' },
        { '@type': 'ListItem', position: 3, name: 'Manufacturer Press Releases', item: SITE + PRESS_BASE },
      ],
    },
  ]

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Masthead />
      <BreakingTicker alerts={alerts} />
      <PressStyles />
      <PressKeys newer={newerHref} older={olderHref} />

      <div className="page-hero" data-title="PRESS" id="pr-top">
        <div className="container">
          <h1 className="page-hero-title">Manufacturer Press Releases</h1>
          <p className="page-hero-sub">Straight from the makers. New announcements from the major US firearm manufacturers, rewritten for readers and linked back to the original release.</p>
          <div className="pr-pills">
            <span className="pr-pill pr-pill-live">● UPDATED TWICE WEEKLY</span>
            <span className="pr-pill"><b>{PRESS_SOURCES.length}</b> MANUFACTURERS TRACKED</span>
            {hasLive && <span className="pr-pill"><b>{facets.total}</b> RELEASES</span>}
            {facets.latest && <span className="pr-pill">LATEST {timeAgo(facets.latest).toUpperCase()}</span>}
          </div>
        </div>
      </div>

      {hasLive && (
        <PressFilterBar brands={facets.brands} activeBrand={brand} activeKind={kind} month={month} total={facets.total} />
      )}

      <main style={{ background: 'var(--bg)', paddingBottom: 48 }}>
        <div className="pr-wrap">
          {!hasLive ? (
            <div className="pr-empty" style={{ marginTop: 28 }}>
              <h3>First Pull In Progress</h3>
              <p>DownRange checks the press rooms of the major US firearm makers every Tuesday and Friday, writes up what is new, and links each article back to the original release. The first batch is being collected now, so check back shortly.</p>
              <div className="pr-track">
                {PRESS_SOURCES.map(s => <a key={s.brand} href={s.url} target="_blank" rel="noopener noreferrer">{s.brand}</a>)}
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="pr-empty" style={{ marginTop: 28 }}>
              <h3>Nothing Here Yet</h3>
              <p>No releases match these filters. Try another manufacturer, type or month.</p>
              <a href={PRESS_BASE} className="dr-btn-outline">Clear filters</a>
            </div>
          ) : (
            <>
              <div className="pr-results-head">
                <span>{total} release{total === 1 ? '' : 's'}</span>
                <span>Page {page} / {pages}</span>
              </div>
              {featured && <PressCard item={featured} featured />}
              <PressGrid items={rest} style={featured ? { marginTop: 18 } : undefined} />
              <PressPager page={page} pages={pages} total={total} brand={brand} kind={kind} month={month} months={facets.months} />
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
