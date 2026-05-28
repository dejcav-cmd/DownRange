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

// Strip the embedded attribution div from body HTML
function stripAttribution(body) {
  if (!body) return body
  // Remove the baked-in attribution div (both variants)
  return body
    .replace(/<div\s+class="dr-source-attribution"[^>]*>[\s\S]*?<\/div>/gi, '')
    .replace(/<div\s+class=\'dr-source-attribution\'[^>]*>[\s\S]*?<\/div>/gi, '')
    .trim()
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { types = ['newsArticle', 'blogPost'] } = await req.json().catch(() => ({}))
    let cleaned = 0, skipped = 0

    for (const type of types) {
      const docs = await sanity.fetch(
        `*[_type == $type && defined(body) && body match "*dr-source-attribution*"] {_id, body}`,
        { type }
      )
      console.log(`[CLEAN-ATTR] ${type}: ${docs.length} docs with embedded attribution`)
      
      for (const doc of docs) {
        const stripped = stripAttribution(doc.body)
        if (stripped !== doc.body) {
          await sanity.patch(doc._id).set({ body: stripped }).commit()
          cleaned++
        } else {
          skipped++
        }
      }
    }

    return Response.json({ ok: true, cleaned, skipped, message: `Stripped attribution from ${cleaned} docs` })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// GET: preview what would be cleaned
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const count = await sanity.fetch(
      'count(*[_type in ["newsArticle","blogPost"] && defined(body) && body match "*dr-source-attribution*"])'
    )
    return Response.json({ ok: true, count, message: count + ' docs have embedded attribution' })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
