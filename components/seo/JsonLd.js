// Server-rendered JSON-LD helper. Duplicates created by hydration are removed by
// JsonLdDedupe in the root layout.
const BASE = 'https://www.downrangeco.com'

export function breadcrumb(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [{ name: 'Home', path: '' }, ...items].map((it, i) => ({
      '@type': 'ListItem', position: i + 1, name: it.name, item: `${BASE}${it.path}`,
    })),
  }
}

export function collectionPage({ name, path, description, about, inLanguage = 'en-US' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name, url: `${BASE}${path}`, description, inLanguage,
    ...(about ? { about } : {}),
    isPartOf: { '@type': 'WebSite', name: 'DownRange', url: BASE },
  }
}

export default function JsonLd({ data }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
}
