import ValueEstimatorPage from "./PageClient"

export const metadata = {
  title:       "Gun Value Estimator — What Is Your Firearm Worth? | DownRange",
  description: "Estimate the current market value of your firearm. Compare used gun prices across platforms and condition grades.",
  alternates:  { canonical: "https://www.downrangeco.com/value-estimator" },
  openGraph: {
    title:       "Gun Value Estimator — What Is Your Firearm Worth? | DownRange",
    description: "Estimate the current market value of your firearm. Compare used gun prices across platforms and condition grades.",
    url:         "https://www.downrangeco.com/value-estimator",
    type:        "website",
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Gun Value Estimator — What Is Your Firearm Worth? | DownRange",
    description: "Estimate the current market value of your firearm. Compare used gun prices across platforms.",
  },
}

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DownRange Gun Value Estimator',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://www.downrangeco.com/value-estimator',
    description: 'Estimate the current market value of your firearm based on model, condition, and regional market trends. Covers 50+ popular handguns, rifles, and shotguns.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': 'https://www.downrangeco.com/#organization' },
    featureList: [
      'Values for 50+ popular firearms',
      'Six condition grades (Poor to NIB)',
      'Regional market trend overlay',
      'Resale platform comparison (private sale vs dealer vs consignment)',
      'Pro tips for getting top dollar',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: 'Gun Value Estimator', item: 'https://www.downrangeco.com/value-estimator' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How is gun resale value determined?',
        acceptedAnswer: { '@type': 'Answer', text: 'Used firearm value is primarily driven by model demand, condition, and the current local market. High-demand models like the Glock 19 and SIG P365 hold value extremely well because buyers are always in the market. Condition grades — from Poor to NIB (New in Box) — can shift value by 50% or more on the same model. Accessories, original box, extra magazines, and provenance (military or police surplus) all affect final sale price.' },
      },
      {
        '@type': 'Question',
        name: 'Where is the best place to sell a used gun?',
        acceptedAnswer: { '@type': 'Answer', text: 'The three main channels are private sale, dealer trade-in, and consignment. Private sale (through GunBroker, Armslist, or local gun shows) typically gets you the most money but requires more time and handling paperwork. Dealer trade-in is fastest but you\'ll receive 40-60% of retail value. Consignment at a local gun shop splits the difference — you get a higher price than trade-in without managing the transaction yourself.' },
      },
      {
        '@type': 'Question',
        name: 'Does condition matter that much for gun resale?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes — condition is the single biggest variable after model. A Glock 19 in "Very Good" shape (minor holster wear, strong bore) might fetch $450-480, while the same model in "Poor" condition (heavy wear, pitting, questionable function) might only bring $200-250. Original box and all factory accessories can add $30-80 on top of condition value on most modern pistols.' },
      },
      {
        '@type': 'Question',
        name: 'What is a blue book value for guns?',
        acceptedAnswer: { '@type': 'Answer', text: 'The Blue Book of Gun Values is a reference guide published annually that lists estimated retail and trade-in values for thousands of firearms by model, manufacturer, and condition. It\'s widely used by dealers and auctioneers. However, real-world sold prices on platforms like GunBroker often differ from blue book values — actual market demand matters more than published guides in active markets.' },
      },
    ],
  },
]

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <ValueEstimatorPage />
    </>
  )
}
