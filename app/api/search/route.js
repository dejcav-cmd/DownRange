export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})

// Per-type search configs — fields searched and their boost weights
const TYPES = {
  newsArticle: {
    label: 'News',
    filter: 'approved == true',
    fields: ['title','summary','body','source','tags'],
    project: '_id, _type, title, "slug": slug.current, summary, category, publishedAt, imageUrl, "heroImg": heroImage.asset->url, source',
    href: (r) => `/news/${r.slug}`,
  },
  legislation: {
    label: 'Laws',
    filter: 'defined(title)',
    fields: ['title','summary','billNumber','state'],
    project: '_id, _type, title, "slug": _id, summary, status, level, state, lastActionDate, billNumber, url',
    href: (r) => r.url || `/laws`,
  },
  blogPost: {
    label: 'Blog',
    filter: 'defined(title)',
    fields: ['title','summary','body','tags'],
    project: '_id, _type, title, "slug": slug.current, summary, category, publishedAt, imageUrl, "heroImg": heroImage.asset->url',
    href: (r) => `/blog/${r.slug}`,
  },
  review: {
    label: 'Reviews',
    filter: 'defined(title)',
    fields: ['title','brand','model','caliber','summary','body'],
    project: '_id, _type, "title": brand + " " + model, "slug": slug.current, summary, category, score, publishedAt, imageUrl, brand, model',
    href: (r) => `/reviews/${r.slug}`,
  },
  firearmRelease: {
    label: 'Releases',
    filter: 'defined(brand)',
    fields: ['brand','model','caliber','summary','pressReleaseExcerpt'],
    project: '_id, _type, "title": brand + " " + model, "slug": slug.current, summary, category, publishedAt, imageUrl, brand, model, caliber, msrp',
    href: (r) => `/releases/${r.slug}`,
  },
  stateProfile: {
    label: 'State Laws',
    filter: 'defined(name)',
    fields: ['name','abbr','summary'],
    project: '_id, _type, name, abbr, rating, summary, "slug": lower(abbr)',
    href: (r) => `/state-hub/${r.slug}`,
  },
}

// Build GROQ with score() for ranked results
// Sanity score() boosts documents where terms appear in title vs body
function buildQuery(type, config, q, limit = 10) {
  const safe = q.replace(/['"\\]/g, '').slice(0, 80)
  const titleField = config.fields[0]  // first field = title, highest boost
  const bodyFields = config.fields.slice(1)

  // Build score expression: title match gets 10x boost, other fields 1x
  const boosts = [
    `boost(${titleField} match $q, 10)`,
    ...bodyFields.map(f => `boost(${f} match $q, 1)`),
  ].join(', ')

  return `*[_type == "${type}" && ${config.filter} && (${config.fields.map(f => `${f} match $q`).join(' || ')})]
    | score(${boosts})
    | order(_score desc)
    [0...${limit}] {
      _score,
      ${config.project}
    }`
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const type = searchParams.get('type') || 'all'
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))

  if (!q || q.length < 2) return Response.json({ results: [], total: 0, q })

  const searchQ = `*${q}*`

  try {
    let results = []

    if (type === 'all') {
      // Search all types in parallel — top 8 per type then merge
      const typeQueries = Object.entries(TYPES).map(([typeName, config]) => ({
        typeName,
        config,
        query: buildQuery(typeName, config, searchQ, 8),
      }))

      const responses = await Promise.allSettled(
        typeQueries.map(({ query }) => sanity.fetch(query, { q: searchQ }))
      )

      responses.forEach((res, i) => {
        if (res.status === 'fulfilled' && res.value) {
          const { typeName, config } = typeQueries[i]
          res.value.forEach(doc => {
            results.push({
              ...doc,
              _typeLabel: config.label,
              _href: buildHref(typeName, doc),
            })
          })
        }
      })

      // Sort by _score descending
      results.sort((a, b) => (b._score || 0) - (a._score || 0))
      results = results.slice(0, limit)

    } else if (TYPES[type]) {
      // Single-type search
      const config = TYPES[type]
      const query = buildQuery(type, config, searchQ, limit)
      const docs = await sanity.fetch(query, { q: searchQ })
      results = docs.map(doc => ({
        ...doc,
        _typeLabel: config.label,
        _href: buildHref(type, doc),
      }))
    }

    return Response.json({ results, total: results.length, q })
  } catch (err) {
    console.error('[search]', err.message)
    return Response.json({ results: [], total: 0, q, error: err.message })
  }
}

function buildHref(typeName, doc) {
  switch (typeName) {
    case 'newsArticle':   return `/news/${doc.slug}`
    case 'legislation':   return doc.url || '/laws'
    case 'blogPost':      return `/blog/${doc.slug}`
    case 'review':        return `/reviews/${doc.slug}`
    case 'firearmRelease':return `/releases/${doc.slug}`
    case 'stateProfile':  return `/state-hub/${(doc.abbr||'').toLowerCase()}`
    default:              return '/'
  }
}
