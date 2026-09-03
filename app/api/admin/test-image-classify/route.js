import { isPhotographicImage } from '../../../../agent/utils.js'

export const runtime = 'nodejs'
export const maxDuration = 30

// TEMPORARY — verification route for the vector-image-detection fix.
// Accepts { tests: [{ label, url? , base64?, contentType }] }, fetches or
// decodes each, runs it through isPhotographicImage, returns results.
// Remove after confirming the patch works in production.
export async function POST(req) {
  const xkey = req.headers.get('x-admin-key') || ''
  if (!process.env.ADMIN_KEY || xkey !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try { body = await req.json() } catch { return Response.json({ error: 'bad json' }, { status: 400 }) }
  const tests = Array.isArray(body?.tests) ? body.tests : []

  const results = []
  for (const t of tests) {
    try {
      let buf, contentType = t.contentType || 'image/jpeg'
      if (t.url) {
        const res = await fetch(t.url, { signal: AbortSignal.timeout(10000) })
        if (!res.ok) { results.push({ label: t.label, error: `fetch ${res.status}` }); continue }
        contentType = res.headers.get('content-type') || contentType
        buf = Buffer.from(await res.arrayBuffer())
      } else if (t.base64) {
        buf = Buffer.from(t.base64, 'base64')
      } else {
        results.push({ label: t.label, error: 'no url or base64 provided' }); continue
      }
      const isPhoto = await isPhotographicImage(buf, contentType)
      results.push({ label: t.label, bytes: buf.length, contentType, isPhoto })
    } catch (e) {
      results.push({ label: t.label, error: e.message })
    }
  }

  return Response.json({ ok: true, results })
}
