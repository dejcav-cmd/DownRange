import RangesPage from "./PageClient"

export const metadata = {
  title:       "Shooting Ranges Near Me — Find Gun Ranges | DownRange",
  description: "Find shooting ranges near you. Search 86+ curated indoor and outdoor gun ranges by location, with hours, amenities, and directions.",
  keywords:    'shooting ranges near me, gun range finder, indoor shooting range, outdoor gun range, pistol range',
  alternates:  { canonical: "https://www.downrangeco.com/ranges" },
  openGraph: {
    title:       "Shooting Ranges Near Me — Find Gun Ranges | DownRange",
    description: "Search 86+ curated indoor and outdoor shooting ranges by location.",
    url:         "https://www.downrangeco.com/ranges",
    type:        "website",
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "Shooting Ranges Near Me | DownRange", description: "Search 86+ curated gun ranges by location." },
}

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DownRange Range Finder',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://www.downrangeco.com/ranges',
    description: 'Find shooting ranges near you. Covers 86+ curated US gun ranges with indoor/outdoor filters, hours, and amenities.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': 'https://www.downrangeco.com/#organization' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: 'Range Finder', item: 'https://www.downrangeco.com/ranges' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How do I find a shooting range near me?',
        acceptedAnswer: { '@type': 'Answer', text: 'Enter your ZIP code or city in the DownRange Range Finder above. Results pull from our curated database of 86+ verified shooting ranges, OpenStreetMap community data, and Google Places. Filter by indoor or outdoor, sort by distance or rating, and tap any result for hours and directions.' },
      },
      {
        '@type': 'Question',
        name: 'What is the difference between an indoor and outdoor shooting range?',
        acceptedAnswer: { '@type': 'Answer', text: 'Indoor ranges are climate-controlled, typically capped at pistol-caliber distances (25–50 yards), and available year-round. Outdoor ranges allow rifle-caliber distances (100–1000+ yards), are often less expensive, and offer a broader variety of target configurations including steel and 3D. Many outdoor ranges also allow drawing from holster, which indoor ranges often restrict.' },
      },
      {
        '@type': 'Question',
        name: 'Can I bring my own gun to a shooting range?',
        acceptedAnswer: { '@type': 'Answer', text: 'Most public shooting ranges allow you to bring your own firearm (BYOG). You will typically need to show a valid ID, sign a liability waiver, and purchase range ammunition (some ranges prohibit steel-core or reloaded ammo for lead management reasons). Call ahead to confirm their specific ammunition and caliber policies before visiting.' },
      },
      {
        '@type': 'Question',
        name: 'Do shooting ranges rent guns?',
        acceptedAnswer: { '@type': 'Answer', text: 'Many indoor shooting ranges offer firearm rentals, allowing you to try different pistols, revolvers, and sometimes rifles before buying. Rental fees typically run $10-20 per gun per session on top of lane and ammo costs. Some ranges require you to purchase their ammunition when renting — a safety precaution to prevent substitution of range guns with personal magazines.' },
      },
    ],
  },
]

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <RangesPage />
    </>
  )
}
