import BallisticsCalc from './BallisticsCalc'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'Ballistics Calculator — DownRange',
  description: 'G1 external ballistics calculator with drop tables, wind drift, MOA/MRAD corrections, and trajectory charts for any caliber out to 1,000 yards.',
  alternates: { canonical: 'https://downrangeco.com/ballistics' },
  openGraph: {
    type: 'website',
    url: 'https://downrangeco.com/ballistics',
    title: 'Ballistics Calculator — DownRange',
    description: 'Free external ballistics calculator: drop charts, wind drift, and scope adjustments for any cartridge.',
    images: [{ url: 'https://downrangeco.com/og-default.png', width: 1200, height: 630 }],
  },
}

export default async function Page() {
  const alerts = await fetchBreakingAlerts().catch(() => [])
  return (
    <>
      <Masthead />
      <BreakingTicker alerts={alerts} />
      <BallisticsCalc />
      <Footer />
    </>
  )
}
