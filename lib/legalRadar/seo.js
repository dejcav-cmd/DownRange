// SEO helpers for the cases portal: metadata with OG/Twitter and JSON-LD builders.
export const BASE = 'https://www.downrangeco.com'

export function pageMeta({ title, description, path }) {
  const url = `${BASE}${path}`
  return {
    title, description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: 'website', siteName: 'DownRange', images: [{ url: '/og-default.png', width: 1200, height: 630 }] },
    twitter: { card: 'summary_large_image', title, description, images: ['/og-default.png'] },
  }
}

export const crumbs = (list) => ({
  '@context': 'https://schema.org', '@type': 'BreadcrumbList',
  itemListElement: list.map(([name, path], i) => ({ '@type': 'ListItem', position: i + 1, name, item: `${BASE}${path}` })),
})

const ORG = { '@type': 'Organization', name: 'DownRange', url: BASE }

export const dataset = ({ name, description, path, modified }) => ({
  '@context': 'https://schema.org', '@type': 'Dataset', name, description, url: `${BASE}${path}`,
  creator: ORG, publisher: ORG, isAccessibleForFree: true, inLanguage: 'en',
  ...(modified ? { dateModified: modified } : {}),
  keywords: ['Second Amendment', 'gun law', 'Supreme Court', 'firearms litigation'],
})

export const webPage = ({ name, description, path, modified }) => ({
  '@context': 'https://schema.org', '@type': 'WebPage', name, description, url: `${BASE}${path}`,
  isPartOf: { '@type': 'WebSite', name: 'DownRange', url: BASE }, publisher: ORG,
  ...(modified ? { dateModified: modified } : {}),
})

export const faq = (pairs) => ({
  '@context': 'https://schema.org', '@type': 'FAQPage',
  mainEntity: pairs.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })),
})

export const itemList = (name, items) => ({
  '@context': 'https://schema.org', '@type': 'ItemList', name,
  itemListElement: items.map((i, idx) => ({ '@type': 'ListItem', position: idx + 1, url: `${BASE}/laws/cases/${i.slug}`, name: i.title })),
})
