import ReleasesPage from './ReleasesPage'
import { fetchReleases, searchReleases, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'New Gun Releases 2026 | DownRange',
  description: 'Latest firearm announcements, new pistol, rifle, and shotgun releases. Full specs, MSRP, and availability — updated daily.',
  alternates: { canonical: 'https://www.downrangeco.com/releases' },
  openGraph: {
    type: 'website', url: 'https://www.downrangeco.com/releases',
    title: 'New Gun Releases 2026 | DownRange',
    description: 'New pistols, rifles, shotguns, and suppressors — full specs and MSRP.',
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630, alt: 'New Gun Releases' }],
  },
}
export const revalidate = 3600

export default async function Page({ searchParams }) {
  const q = searchParams?.q || null
  const [releases, alerts] = await Promise.all([
    q ? searchReleases(q, 200) : fetchReleases(200).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type':    'CollectionPage',
    '@id':      'https://www.downrangeco.com/releases',
    name:       'New Gun Releases 2026',
    description:'Latest firearm announcements — new pistols, rifles, shotguns, and suppressors with full specs and MSRP.',
    url:        'https://www.downrangeco.com/releases',
    isPartOf:   { '@id': 'https://www.downrangeco.com/#website' },
    publisher:  { '@id': 'https://www.downrangeco.com/#organization' },
    inLanguage: 'en-US',
  }
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ReleasesPage releases={releases} alerts={alerts} searchQ={q} />
    </>
  )
}
