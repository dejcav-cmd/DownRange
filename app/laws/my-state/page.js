import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import MyStateClient from './MyStateClient'
import { fetchAllStateProfiles, fetchBreakingAlerts } from '../../../sanity/lib/client'
import { STATE_SEED } from '../../../lib/stateSeed'

export const metadata = {
  title: "Your State's Gun Laws | DownRange",
  description: "Your state's concealed carry laws, magazine limits, AWB status, waiting periods, and reciprocity — auto-detected from your location.",
  alternates: { canonical: 'https://downrangeco.com/laws/my-state' },
}
export const revalidate = 1800

export default async function MyStatePage() {
  const [sanityProfiles, alerts] = await Promise.all([
    fetchAllStateProfiles().catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])

  // Seed is the baseline — Sanity data overrides only non-null values
  const profileMap = {}
  for (const p of Object.values(STATE_SEED)) { profileMap[p.abbr] = { ...p } }
  for (const p of sanityProfiles) {
    if (p?.abbr && profileMap[p.abbr]) {
      for (const [k, v] of Object.entries(p)) {
        if (v !== null && v !== undefined) profileMap[p.abbr][k] = v
      }
    }
  }
  const profiles = Object.values(profileMap).sort((a, b) => a.name.localeCompare(b.name))

  const reciprocityMatrix = {}
  for (const p of profiles) {
    reciprocityMatrix[p.abbr] = { honorsStates: p.reciprocityStates || [], honoredByStates: [] }
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
