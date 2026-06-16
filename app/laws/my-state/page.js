import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import MyStateClient from './MyStateClient'
import { fetchAllStateProfiles, fetchBreakingAlerts } from '../../../sanity/lib/client'

export const metadata = {
  title: 'Your State\'s Gun Laws | DownRange',
  description: 'Your state\'s concealed carry laws, magazine limits, AWB status, reciprocity map, and active legislation — auto-detected from your location.',
  alternates: { canonical: 'https://downrangeco.com/laws/my-state' },
}
export const revalidate = 1800

export default async function MyStatePage() {
  const [profiles, alerts] = await Promise.all([
    fetchAllStateProfiles().catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])
  const profileMap = {}
  for (const p of profiles) { if (p?.abbr) profileMap[p.abbr] = p }

  // Build reciprocity matrix
  const reciprocityMatrix = {}
  for (const p of profiles) {
    reciprocityMatrix[p.abbr] = {
      honorsStates: p.reciprocityStates || [],
      honoredByStates: [],
    }
  }
  for (const [abbr, data] of Object.entries(reciprocityMatrix)) {
    for (const s of data.honorsStates) {
      if (reciprocityMatrix[s]) reciprocityMatrix[s].honoredByStates.push(abbr)
    }
  }

  return (
    <>
      <Masthead />
      <MyStateClient profiles={profiles} profileMap={profileMap} reciprocityMatrix={reciprocityMatrix} alerts={alerts} />
      <Footer />
    </>
  )
}
