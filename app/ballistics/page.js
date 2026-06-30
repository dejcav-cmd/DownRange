import BallisticsCalc from './BallisticsCalc'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'Ballistics Calculator — Free Drop Tables & Wind Drift | DownRange',
  description: 'Free G1 external ballistics calculator. Bullet drop tables, wind drift, MOA/MRAD scope corrections, and trajectory charts for 38 calibers out to 1,000 yards. Compare two loads.',
  keywords: 'ballistics calculator, bullet drop calculator, external ballistics, MOA calculator, wind drift, trajectory chart, scope correction',
  alternates: { canonical: 'https://downrangeco.com/ballistics' },
  openGraph: {
    type: 'website',
    url: 'https://downrangeco.com/ballistics',
    title: 'Free Ballistics Calculator — Drop Tables, Wind Drift & MOA | DownRange',
    description: 'G1 ballistics engine: bullet drop tables, wind drift, MOA/MRAD corrections, and trajectory charts for 38 calibers to 1,000 yards.',
    images: [{ url: 'https://downrangeco.com/og-default.png', width: 1200, height: 630, alt: 'DownRange Ballistics Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: 'Free Ballistics Calculator | DownRange', description: 'Drop tables, wind drift, MOA corrections for 38 calibers.' },
}

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DownRange Ballistics Calculator',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://downrangeco.com/ballistics',
    description: 'Free G1 external ballistics calculator with drop tables, wind drift, MOA/MRAD scope corrections, and dual-load comparison for 38 calibers out to 1,000 yards.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': 'https://downrangeco.com/#organization' },
    featureList: [
      '38 caliber presets from .17 HMR to .338 Lapua',
      'Full PRC family (6.5 PRC, 7mm PRC, .300 PRC)',
      'Bullet drop tables in inches',
      'Wind drift for any crosswind speed',
      'MOA and MRAD scope correction values',
      'Compare two loads side-by-side',
      'Trajectory chart with subsonic zone',
      'Altitude and temperature corrections',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: 'Ballistics Calculator', item: 'https://downrangeco.com/ballistics' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I pick a load in the ballistics calculator?',
        acceptedAnswer: { '@type': 'Answer', text: 'Choose a preset from the category dropdown (Rimfire through Magnum, including the full PRC family) or switch to Custom and enter your own bullet weight, ballistic coefficient, and muzzle velocity. Presets use published G1 BCs; for G7 BC bullets, multiply by roughly 2.0 to approximate G1.' },
      },
      {
        '@type': 'Question',
        name: 'Why does altitude and temperature matter for bullet drop?',
        acceptedAnswer: { '@type': 'Answer', text: 'Altitude and temperature change air density, which changes drag on the bullet. Entering your actual range conditions instead of default values measurably shifts drop and wind drift, especially past 400 yards.' },
      },
      {
        '@type': 'Question',
        name: 'What scope height should I use?',
        acceptedAnswer: { '@type': 'Answer', text: 'Use your scope\u2019s actual center-to-bore measurement, not a generic rifle spec. Bullet path, MOA, and MRAD corrections are all calculated relative to this value and your zero distance.' },
      },
      {
        '@type': 'Question',
        name: 'How accurate is a G1 ballistics calculator for long-range shooting?',
        acceptedAnswer: { '@type': 'Answer', text: 'G1 models are solid for hunting and general-purpose loads but less precise for very-low-drag long-range bullets, where a true G7 calculator tracks closer to observed drop past 600-700 yards. Use the output as a strong starting point and confirm final corrections with verified dope at the range.' },
      },
    ],
  },
]

export default async function Page() {
  const alerts = await fetchBreakingAlerts().catch(() => [])
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <Masthead />
      <BreakingTicker alerts={alerts} />
      <BallisticsCalc />
      <Footer />
    </>
  )
}
