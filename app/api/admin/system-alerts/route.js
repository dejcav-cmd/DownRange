export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    // Pull last 200 cron runs — all statuses — sorted newest first
    const runs = await sanity.fetch(
      `*[_type == "cronRun"] | order(runAt desc, _createdAt desc) [0...200] {
        _id, jobId, feed, status, details, error, trigger,
        runAt, _createdAt, ms
      }`
    )

    // Annotate: mark runs as warning if details mentions 0 items / skipped all
    const annotated = runs.map(r => {
      let status = r.status || 'success'
      const det = (r.details || '').toLowerCase()
      // downgrade to warning if succeeded but pulled/wrote nothing
      if (status === 'success' && (
        det.includes('0 articles') ||
        det.includes('created 0') ||
        det.includes('rewrote 0') ||
        det.includes('no items')
      )) status = 'warning'
      return { ...r, status }
    })

    return Response.json({ ok: true, runs: annotated, count: annotated.length })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
