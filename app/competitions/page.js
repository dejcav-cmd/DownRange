import CompetitionsClient from './PageClient'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title:       'Shooting Competitions — NRA, USPSA, IDPA, PRS Calendar | DownRange',
  description: 'Find your next match. NRA, USPSA/IPSC, IDPA, PRS, Steel Challenge, 3-Gun, and NRL22 competitions nationwide. Calendar, finder, and org guides.',
  alternates:  { canonical: 'https://downrangeco.com/competitions' },
  openGraph: {
    title:       'Shooting Competitions — DownRange',
    description: 'NRA · USPSA · IDPA · PRS · 3-Gun · Steel Challenge. Find your next match.',
    url:         'https://downrangeco.com/competitions',
    type:        'website',
  },
}

export default function CompetitionsPage() {
  const alerts = await fetchBreakingAlerts(3).catch(() => [])
  return <>
    <BreakingTicker alerts={alerts} />
    <CompetitionsClient />
}