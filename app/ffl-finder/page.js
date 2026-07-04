import FFLFinderPage from "./PageClient"

export const metadata = {
  title:       "FFL Dealer Finder — 60,000+ Licensed Dealers Near You | DownRange",
  description: "Find licensed FFL firearms dealers by ZIP code. Search 60,000+ ATF-licensed dealers nationwide.",
  alternates:  { canonical: "https://www.downrangeco.com/ffl-finder" },
  openGraph: {
    title:       "FFL Dealer Finder — 60,000+ Licensed Dealers Near You | DownRange",
    description: "Find licensed FFL firearms dealers by ZIP code. Search 60,000+ ATF-licensed dealers nationwide.",
    url:         "https://www.downrangeco.com/ffl-finder",
    type:        "website",
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630 }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "FFL Dealer Finder — 60,000+ Licensed Dealers Near You | DownRange",
    description: "Find licensed FFL firearms dealers by ZIP code. Search 60,000+ ATF-licensed dealers nationwide.",
  },
}

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DownRange FFL Dealer Finder',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://www.downrangeco.com/ffl-finder',
    description: 'Search 60,000+ ATF-licensed FFL dealers by ZIP code. Find the nearest licensed firearms dealer for transfers, purchases, and services.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': 'https://www.downrangeco.com/#organization' },
    featureList: [
      'Search 60,000+ ATF-licensed FFL dealers',
      'Filter by ZIP code and radius',
      'See dealer license type (Type 01, 07, 08, etc.)',
      'Find dealers for transfers, purchases, and NFA items',
      'Updated from ATF Federal Firearms Licensee database',
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: 'FFL Finder', item: 'https://www.downrangeco.com/ffl-finder' },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is an FFL dealer?',
        acceptedAnswer: { '@type': 'Answer', text: 'A Federal Firearms Licensee (FFL) is a business or individual licensed by the ATF to manufacture, import, or deal in firearms. You need an FFL dealer to complete the background check and transfer paperwork (Form 4473) when buying a gun, receiving a transfer from an online purchase, or picking up an NFA item after ATF approval.' },
      },
      {
        '@type': 'Question',
        name: 'Do I need an FFL dealer for an online gun purchase?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes. Federal law requires all firearm sales, including online purchases, to be transferred through a licensed FFL dealer in your state. The dealer runs the NICS background check and completes Form 4473 before transferring the firearm to you. The seller ships to your chosen FFL; you pick it up there after passing the check.' },
      },
      {
        '@type': 'Question',
        name: 'How much does an FFL transfer cost?',
        acceptedAnswer: { '@type': 'Answer', text: 'FFL transfer fees vary by dealer, typically ranging from $15 to $75 per transfer. Some dealers charge flat fees; others charge more for handguns, long guns, or NFA items. Always call ahead and confirm the transfer fee before having a firearm shipped.' },
      },
      {
        '@type': 'Question',
        name: 'What FFL license types handle NFA items?',
        acceptedAnswer: { '@type': 'Answer', text: 'Class III dealers (SOT — Special Occupational Taxpayer status on top of a Type 01 or 07 FFL) are licensed to transfer NFA items including suppressors, short-barreled rifles (SBRs), machine guns, and destructive devices. Not all FFLs are Class III, so confirm NFA handling before shipping.' },
      },
      {
        '@type': 'Question',
        name: 'Can I use any FFL in my state?',
        acceptedAnswer: { '@type': 'Answer', text: 'You can use any FFL licensed in your state of residence for standard firearm transfers. For handguns specifically, federal law requires the transfer to occur in your state of residence. Long guns can be transferred from an FFL in any state, though many dealers only ship to another FFL in the buyer\'s state.' },
      },
    ],
  },
]

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <FFLFinderPage />
    </>
  )
}
