import BallisticsCalc from './BallisticsCalc'
import ToolShell from '../../components/tools/ToolShell'

export const metadata = {
  title: 'Precision Ballistics Calculator: 188 Bullets, G1 and G7, Wind and DOPE Card',
  description: 'Free precision ballistics calculator with a library of 188 bullets from Hornady, Berger, Nosler, Lapua and Warner. G1 and G7 drag, wind, slope, altitude and temperature. Printable DOPE card and shareable setups.',
  keywords: 'ballistics calculator, bullet drop calculator, external ballistics, MOA calculator, wind drift, trajectory chart, scope correction',
  alternates: { canonical: 'https://www.downrangeco.com/ballistics' },
  openGraph: {
    type: 'website',
    url: 'https://www.downrangeco.com/ballistics',
    title: 'Precision Ballistics Calculator: 188 Bullets, G1 and G7 | DownRange',
    description: 'Pick your bullet, enter your muzzle velocity and get a drop and wind table with turret clicks. G1 and G7, 188 bullets.',
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630, alt: 'DownRange Ballistics Calculator' }],
  },
  twitter: { card: 'summary_large_image', title: 'Free Ballistics Calculator | DownRange', description: 'Drop tables, wind drift, MOA corrections for 38 calibers.' },
}

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'DownRange Precision Ballistics Calculator',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://www.downrangeco.com/ballistics',
    description: 'Free precision ballistics calculator: 188 bullets with published G1 and G7 coefficients, wind, slope, altitude, turret clicks, dual-load comparison and a printable DOPE card.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': 'https://www.downrangeco.com/#organization' },
    featureList: [
      '188 bullets with published G1 and G7 ballistic coefficients',
      'Hornady, Berger, Nosler, Lapua and Warner bullet lines',
      'G1 and G7 drag models',
      'Wind drift for any speed and direction',
      'Slope, altitude, temperature and humidity corrections',
      'Turret clicks in MOA or MRAD',
      'Compare two loads side by side',
      'Printable DOPE card and shareable link',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: 'Ballistics Calculator', item: 'https://www.downrangeco.com/ballistics' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I pick a load in the ballistics calculator?',
        acceptedAnswer: { '@type': 'Answer', text: 'Pick a maker, caliber and bullet from the library, then enter your chronographed muzzle velocity. You can also choose a factory load or enter a custom ballistic coefficient. Library bullets use the BC published by the manufacturer, with G7 used when the maker publishes it.' },
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
        name: 'Should I use G1 or G7 for long-range shooting?',
        acceptedAnswer: { '@type': 'Answer', text: 'G7 matches the shape of modern boat-tail match bullets, so it tracks real drop more closely past 600 yards. G1 is fine for flat-base hunting bullets. Use the BC model the manufacturer publishes for your bullet, and confirm final corrections with verified dope at the range.' },
      },
    ],
  },
]

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <ToolShell schema={false} path="/ballistics" name="Precision Ballistics Calculator" headline="Precision" accent="calculator" intro="Pick your bullet, enter your chronographed velocity, and get a drop and wind table with turret clicks. 188 bullets, G1 and G7, one printable DOPE card.">
        <BallisticsCalc />
      </ToolShell>
    </>
  )
}
