import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const PATTERNS = [
  /<p[^>]*>\s*<em>\s*Source:[^<]*visit the original[^<]*article[^<]*<\/em>\s*<\/p>/gi,
  /<p[^>]*>\s*Source:[^<]*visit the original[^<]*<\/p>/gi,
  /\n?Source:\s*visit the original[^\n.]*\./gi,
]

function strip(body) {
  if (!body) return { out: body, changed: false }
  let out = body
  for (const p of PATTERNS) out = out.replace(p, '')
  out = out.trim()
  return { out, changed: out !== body }
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const docs = await sanity.fetch(`*[_type == "newsArticle" && defined(body)]{ _id, body }`)
  let patched = 0, skipped = 0
  const BATCH = 50

  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH)
    const tx = sanity.transaction()
    let hasWork = false
    for (const doc of batch) {
      const { out, changed } = strip(doc.body)
      if (changed) { tx.patch(doc._id, p => p.set({ body: out })); hasWork = true; patched++ }
      else skipped++
    }
    if (hasWork) await tx.commit()
  }

  return Response.json({ ok: true, total: docs.length, patched, skipped })
}
