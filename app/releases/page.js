import ReleasesPage from './ReleasesPage'
import { fetchReleases, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'New Releases — DownRange', description: 'Latest firearm announcements, new model releases, and product launches.' }
export const revalidate = 3600

export default async function Page() {
  const [releases, alerts] = await Promise.all([
    fetchReleases(40).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])
  return <ReleasesPage releases={releases} alerts={alerts} />
}
