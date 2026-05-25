export const dynamic = 'force-dynamic'
import algoliasearch from 'algoliasearch'
import { createClient } from '@sanity/client'

const algolia = algoliasearch(
  process.env.ALGOLIA_APP_ID,
  process.env.ALGOLIA_ADMIN_KEY
)

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn:    false,
})

const INDEX_MAP = {
  newsArticle:    'news',
  legislation:    'laws',
  review:         'reviews',
  firearmRelease: 'releases',
  stateProfile:   'states',
  breakingAlert:  'breaking',
}

function flattenDoc(doc) {
  const flat = {
    objectID:  doc._id,
    type:      doc._type,
    title:     doc.title || doc.headline || doc.name || '',
    slug:      doc.slug?.current || '',
    summary:   doc.summary || doc.description || '',
    category:  doc.category || doc.status || '',
    updatedAt: doc._updatedAt,
  }
  // Type-specific fields
  if (doc._type === 'newsArticle')    flat.urgency = doc.urgencyScore
  if (doc._type === 'legislation')    flat.state   = doc.state
  if (doc._type === 'stateProfile')   flat.state   = doc.abbr
  if (doc._type === 'firearmRelease') flat.brand   = doc.brand
  return flat
}

export async function POST(req) {
  // Validate Sanity webhook secret
  const secret = req.headers.get('x-sanity-webhook-secret')
  if (secret !== process.env.SANITY_WEBHOOK_SECRET) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { _id, _type, operation } = body

    if (!_id || !_type) {
      return Response.json({ error: 'Missing _id or _type' }, { status: 400 })
    }

    const indexName = INDEX_MAP[_type]
    if (!indexName) {
      return Response.json({ message: `Type ${_type} not indexed` })
    }

    const index = algolia.initIndex(indexName)

    // Handle delete
    if (operation === 'delete') {
      await index.deleteObject(_id)
      return Response.json({ success: true, action: 'deleted', id: _id })
    }

    // Fetch full doc from Sanity
    const doc = await sanity.getDocument(_id)
    if (!doc) {
      return Response.json({ error: 'Document not found' }, { status: 404 })
    }

    // Upsert to Algolia
    await index.saveObject(flattenDoc(doc))
    return Response.json({ success: true, action: 'indexed', id: _id, index: indexName })
  } catch (err) {
    console.error('Algolia sync error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}

// Full reindex — call manually when needed
export async function GET(req) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {}
  for (const [sanityType, indexName] of Object.entries(INDEX_MAP)) {
    const docs = await sanity.fetch(`*[_type == "${sanityType}"][0...500]`)
    const index = algolia.initIndex(indexName)
    await index.saveObjects(docs.map(flattenDoc))
    results[indexName] = docs.length
  }

  return Response.json({ success: true, indexed: results })
}
