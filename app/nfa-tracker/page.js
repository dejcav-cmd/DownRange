import NFATrackerPage from "./PageClient"

export const metadata = {
  title:       "NFA Wait Time Tracker — Form 4 & Form 1 ATF Approval Times | DownRange",
  description: "Current ATF NFA wait times for Form 4 suppressors, SBRs, SBSs, and Form 1 builds. Community-sourced approval data updated weekly.",
  keywords:    'NFA wait times, Form 4 wait time, ATF approval time, suppressor wait time, SBR Form 4, NFA tracker',
  alternates:  { canonical: "https://www.downrangeco.com/nfa-tracker" },
  openGraph: {
    title:       "NFA Wait Time Tracker — Form 4 & Form 1 Approval Times | DownRange",
    description: "Current ATF NFA processing times for Form 4 suppressors, SBRs, and Form 1 builds.",
    url:         "https://www.downrangeco.com/nfa-tracker",
    type:        "website",
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image", title: "NFA Wait Time Tracker | DownRange", description: "Current ATF Form 4 & Form 1 approval times." },
}

const SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'DownRange NFA Wait Time Tracker',
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    url: 'https://www.downrangeco.com/nfa-tracker',
    description: 'Tracks current ATF NFA wait times for Form 4 suppressors, SBRs, SBSs, and Form 1 builds using community-sourced approval data.',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
    publisher: { '@id': 'https://www.downrangeco.com/#organization' },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'How long does Form 4 NFA approval take?',
        acceptedAnswer: { '@type': 'Answer', text: 'Form 4 NFA approval times currently average 8–14 months depending on the transfer type (individual vs trust) and item category. Electronic Form 4 submissions are significantly faster than paper.' },
      },
      {
        '@type': 'Question',
        name: 'How long does Form 1 NFA approval take?',
        acceptedAnswer: { '@type': 'Answer', text: 'ATF Form 1 (Make) approvals for SBRs and suppressors typically run 30–90 days for electronic submissions, and 6–12 months for paper Form 1.' },
      },
      {
        '@type': 'Question',
        name: 'What is the NFA wait time for suppressors?',
        acceptedAnswer: { '@type': 'Answer', text: 'Suppressor Form 4 wait times currently average 10–14 months for individual/trust transfers. eForms (electronic) are much faster at roughly 3–6 months.' },
      },
    ],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
      { '@type': 'ListItem', position: 2, name: 'NFA Wait Time Tracker', item: 'https://www.downrangeco.com/nfa-tracker' },
    ],
  },
]

export default function Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
      <NFATrackerPage />
    </>
  )
}
