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
]

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <RangesPage />
    </>
  )
}
