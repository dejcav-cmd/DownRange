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
    date: 'publishedAt',
  },
  legislation: {
    label: 'Laws',
    filter: 'defined(title)',
    fields: ['title','summary','billNumber','state'],
    project: '_id, _type, title, "slug": _id, summary, status, level, state, lastActionDate, billNumber, url',
    date: 'lastActionDate',
  },
  blogPost: {
    label: 'Blog',
    filter: 'defined(title)',
    fields: ['title','summary','body','tags'],
    project: '_id, _type, title, "slug": slug.current, summary, category, publishedAt, imageUrl, "heroImg": heroImage.asset->url',
    date: 'publishedAt',
  },
  pressRelease: {
    label: 'Press Releases',
    filter: 'approved == true && defined(slug.current)',
    fields: ['title','brand','summary','body'],
    project: '_id, _type, title, "slug": slug.current, summary, category, brand, publishedAt, "imageUrl": coalesce(heroImage.asset->url, imageUrl)',
    date: 'publishedAt',
  },
  gunDeal: {
    label: 'Deals',
    filter: 'approved == true',
    fields: ['title','store','summary','tags'],
    project: '_id, _type, title, externalUrl, price, store, category, publishedAt, imageUrl, source, summary',
    date: 'publishedAt',
  },
  stateProfile: {
    label: 'State Laws',
    filter: 'defined(name)',
    fields: ['name','abbr','summary'],
    project: '_id, _type, name, abbr, rating, summary, "slug": lower(abbr)',
    date: '_updatedAt',
  },
}

// Build GROQ with score() for ranked results
// Sanity score() boosts documents where terms appear in title vs body
function buildQuery(type, config, q, limit = 10, sort = 'relevance', since = null) {
  const titleField = config.fields[0]  // first field = title, highest boost
  const bodyFields = config.fields.slice(1)
  const dateExpr   = `coalesce(${config.date}, _updatedAt)`

  const boosts = [
    `boost(${titleField} match $q, 10)`,
    ...bodyFields.map(f => `boost(${f} match $q, 1)`),
  ].join(', ')

  const sinceClause = since ? ` && ${dateExpr} >= $since` : ''
  const order = sort === 'newest' ? `| order(${dateExpr} desc)`
              : sort === 'oldest' ? `| order(${dateExpr} asc)`
              : `| score(${boosts}) | order(_score desc)`

  return `*[_type == "${type}" && ${config.filter} && (${config.fields.map(f => `${f} match $q`).join(' || ')})${sinceClause}]
    ${order}
    [0...${limit}] {
      ${sort === 'relevance' ? '_score,' : ''}
      "_date": ${dateExpr},
      ${config.project}
    }`
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = (searchParams.get('q') || '').trim()
  const type = searchParams.get('type') || 'all'
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '20'))
  const sort  = ['newest', 'oldest'].includes(searchParams.get('sort')) ? searchParams.get('sort') : 'relevance'
  const days  = parseInt(searchParams.get('days') || '0')
  const since = days > 0 ? new Date(Date.now() - days * 86400000).toISOString() : null
  const params = (qv) => (since ? { q: qv, since } : { q: qv })

  if (!q || q.length < 2) return Response.json({ results: [], total: 0, q })

  const searchQ = `*${q}*`

  try {
    let results = []

    if (type === 'all') {
      // Search all types in parallel — top 8 per type then merge
      const typeQueries = Object.entries(TYPES).map(([typeName, config]) => ({
        typeName,
        config,
        query: buildQuery(typeName, config, searchQ, sort === 'relevance' ? 8 : 15, sort, since),
      }))

      const responses = await Promise.allSettled(
        typeQueries.map(({ query }) => sanity.fetch(query, params(searchQ)))
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

      if (sort === 'relevance') results.sort((a, b) => (b._score || 0) - (a._score || 0))
      else results.sort((a, b) => (new Date(b._date || 0) - new Date(a._date || 0)) * (sort === 'newest' ? 1 : -1))
      results = results.slice(0, limit)

    } else if (TYPES[type]) {
      // Single-type search
      const config = TYPES[type]
      const query = buildQuery(type, config, searchQ, limit, sort, since)
      const docs = await sanity.fetch(query, params(searchQ))
      results = docs.map(doc => ({
        ...doc,
        _typeLabel: config.label,
        _href: buildHref(type, doc),
      }))
    }

    return Response.json({ results, total: results.length, q, sort, days })
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
    case 'pressRelease':  return `/news/manufacturer-press-releases/${doc.slug}`
    case 'gunDeal':        return doc.externalUrl || '/deals'
    case 'stateProfile':  return `/laws/${(doc.abbr||'').toUpperCase()}`
    default:              return '/'
  }
}
