export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import crypto from 'crypto'

function verifySignature(body, signature, secret) {
  const hash = crypto.createHmac('sha256', secret).update(body).digest('hex')
  return signature === hash
}

// POST /api/webhook/sanity
// Called by Sanity when a document is published
export async function POST(req) {
  const body = await req.text()
  const signature = req.headers.get('sanity-webhook-signature') || ''

  // Verify webhook signature
  if (process.env.SANITY_WEBHOOK_SECRET) {
    const valid = verifySignature(body, signature, process.env.SANITY_WEBHOOK_SECRET)
    if (!valid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }
  }

  let doc
  try {
    doc = JSON.parse(body)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const docType = doc._type

  // Sync to Algolia if configured
  if (process.env.ALGOLIA_ADMIN_KEY && process.env.ALGOLIA_APP_ID) {
    try {
      const indexMap = {
        newsArticle: 'news',
        legislation: 'laws',
        review: 'reviews',
        firearmRelease: 'releases',
        stateProfile: 'states',
        video: 'videos',
      }
      const indexName = indexMap[docType]

      if (indexName) {
        const algoliaRes = await fetch(`https://${process.env.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${indexName}/${doc._id}`, {
          method: 'PUT',
          headers: {
            'X-Algolia-Application-Id': process.env.ALGOLIA_APP_ID,
            'X-Algolia-API-Key': process.env.ALGOLIA_ADMIN_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            objectID: doc._id,
            ...flattenDoc(doc)
          })
        })
        console.log(`[WEBHOOK] Synced ${doc._id} to Algolia index: ${indexName}`)
      }
    } catch (err) {
      console.error('[WEBHOOK] Algolia sync error:', err.message)
    }
  }

  return NextResponse.json({ success: true, docId: doc._id, docType })
}

function flattenDoc(doc) {
  const flat = { ...doc }
  // Remove heavy fields not needed for search
  delete flat.body
  delete flat.fullText
  // Flatten nested objects
  if (doc.slug) flat.slug = doc.slug.current
  if (doc.author) flat.authorName = doc.author.name
  if (doc.heroImage) delete flat.heroImage
  if (doc.productImage) delete flat.productImage
  return flat
}
