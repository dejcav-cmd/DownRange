import ReleasesPage from './ReleasesPage'
import { fetchReleases, searchReleases, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'New Releases — DownRange', description: 'Latest firearm announcements, new model releases, and product launches.' }
export const revalidate = 3600

export default async function Page({ searchParams }) {
  const q = searchParams?.q || null
  const [releases, alerts] = await Promise.all([
    q ? searchReleases(q, 40) : fetchReleases(40).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])
  return <ReleasesPage releases={releases} alerts={alerts} searchQ={q} />
}
