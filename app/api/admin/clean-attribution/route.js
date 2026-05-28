import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const k = req.headers.get('x-admin-key')
  return k && k === process.env.ADMIN_KEY
}

// Strip embedded attribution divs from body HTML
function stripAttribution(body) {
  if (!body || typeof body !== 'string') return body
  return body
    .replace(/<div\s+class="dr-source-attribution"[\s\S]*?<\/div>\s*/gi, '')
    .replace(/<div\s+class='dr-source-attribution'[\s\S]*?<\/div>\s*/gi, '')
    .trim()
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { types = ['newsArticle', 'blogPost'], limit = 500 } = await req.json().catch(() => ({}))
    let cleaned = 0, skipped = 0, errors = 0

    for (const type of types) {
      // Fetch all docs of this type that have a body field
      const docs = await sanity.fetch(
        `*[_type == $type && defined(body)] | order(_createdAt desc) [0...$limit] { _id, body }`,
        { type, limit }
      )
      console.log(`[CLEAN-ATTR] ${type}: checking ${docs.length} docs`)

      for (const doc of docs) {
        if (!doc.body || !doc.body.includes('dr-source-attribution')) {
          skipped++
          continue
        }
        const stripped = stripAttribution(doc.body)
        if (stripped !== doc.body) {
          try {
            await sanity.patch(doc._id).set({ body: stripped }).commit()
            cleaned++
          } catch (e) {
            console.error('[CLEAN-ATTR] patch failed:', doc._id, e.message)
            errors++
          }
        } else {
          skipped++
        }
      }
    }

    return Response.json({
      ok: true,
      cleaned,
      skipped,
      errors,
      message: `Stripped attribution from ${cleaned} docs (${skipped} already clean, ${errors} errors)`,
    })
  } catch (e) {
    console.error('[CLEAN-ATTR] error:', e.message)
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// GET: count docs with embedded attribution
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const [news, blog] = await Promise.all([
      sanity.fetch('count(*[_type == "newsArticle" && defined(body) && body match "*dr-source-attribution*"])'),
      sanity.fetch('count(*[_type == "blogPost"    && defined(body) && body match "*dr-source-attribution*"])'),
    ])
    return Response.json({ ok: true, newsArticle: news, blogPost: blog, total: news + blog })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
