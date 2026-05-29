import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const authHeader = req.headers.get('authorization')
  const adminKey   = req.headers.get('x-admin-key')
  const secret     = process.env.CRON_SECRET
  const aKey       = process.env.ADMIN_KEY
  return (secret && authHeader === 'Bearer ' + secret)
      || (aKey && adminKey === aKey)
      || req.headers.get('x-vercel-cron') === '1'
}

function stripAttribution(body) {
  if (!body || typeof body !== 'string') return body
  return body
    .replace(/<div[^>]+class="dr-source-attribution"[^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .replace(/<div[^>]+class='dr-source-attribution'[^>]*>[\s\S]*?<\/div>\s*/gi, '')
    .trim()
}

async function commitBatch(mutations) {
  if (!mutations.length) return
  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
  const res = await fetch(
    'https://' + projectId + '.api.sanity.io/v2024-01-01/data/mutate/production',
    {
      method:  'POST',
      headers: { Authorization: 'Bearer ' + process.env.SANITY_API_TOKEN, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ mutations }),
    }
  )
  if (!res.ok) {
    const err = await res.text()
    throw new Error('Sanity batch ' + res.status + ': ' + err.slice(0, 200))
  }
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0      = Date.now()
  const results = { cleaned: 0, skipped: 0, errors: 0, articleFixes: [], batches: 0 }

  try {
    // 1. Fix genomics article image
    const genomicsSlug = 'whole-genome-variant-detection-in-long-read-sequencing-data-from-ultra-low-input-patient-samples'
    const genomicsArticle = await sanity.fetch(
      '*[_type == "newsArticle" && slug.current == $slug][0]{ _id, title, imageUrl, body }',
      { slug: genomicsSlug }
    )
    if (genomicsArticle?._id) {
      const patch = { imageUrl: '/img/photos/news.jpg' }
      if (genomicsArticle.body) {
        const stripped = stripAttribution(genomicsArticle.body)
        if (stripped !== genomicsArticle.body) patch.body = stripped
      }
      await sanity.patch(genomicsArticle._id).set(patch).commit()
      results.articleFixes.push({ slug: genomicsSlug, patched: Object.keys(patch) })
    }

    // 2. Fetch ALL articles with a body — then JS-filter for the attribution string
    //    GROQ match/contains is unreliable for hyphenated class names, so we pull all
    //    bodies and filter in JS. Use pagination to avoid memory issues.
    for (const type of ['newsArticle', 'blogPost']) {
      let offset = 0
      const PAGE = 200

      while (true) {
        const docs = await sanity.fetch(
          '*[_type == $type && defined(body) && length(body) > 100] | order(_createdAt desc) [$from...$to] { _id, body }',
          { type, from: offset, to: offset + PAGE }
        )

        if (!docs.length) break

        const mutations = []
        for (const doc of docs) {
          if (!doc.body || !doc.body.includes('dr-source-attribution')) { results.skipped++; continue }
          const stripped = stripAttribution(doc.body)
          if (stripped === doc.body) { results.skipped++; continue }
          mutations.push({ patch: { id: doc._id, set: { body: stripped } } })
        }

        if (mutations.length > 0) {
          try {
            await commitBatch(mutations)
            results.cleaned += mutations.length
            results.batches += 1
            console.log('[CLEANUP] Batch ' + results.batches + ': cleaned ' + mutations.length + ' ' + type + ' (offset ' + offset + ')')
          } catch (e) {
            console.error('[CLEANUP] Batch error:', e.message)
            results.errors += mutations.length
          }
        } else {
          results.skipped += docs.length
        }

        offset += PAGE
        if (docs.length < PAGE) break
        await new Promise(r => setTimeout(r, 200))
      }
    }

    const ms  = Date.now() - t0
    const msg = results.cleaned + ' docs cleaned in ' + results.batches + ' batches. ' + results.skipped + ' already clean. ' + results.errors + ' errors. ' + (ms/1000).toFixed(1) + 's'
    console.log('[CLEANUP] Done:', msg)
    return Response.json({ ok: true, ...results, ms, message: msg })

  } catch (e) {
    console.error('[CLEANUP] Fatal:', e.message)
    return Response.json({ ok: false, error: e.message, ms: Date.now() - t0 }, { status: 500 })
  }
}
