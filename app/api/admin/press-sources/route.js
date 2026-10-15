export const dynamic = 'force-dynamic'
export const maxDuration = 30

import { createClient } from '@sanity/client'
import { PRESS_SOURCES, brandSlug } from '@/lib/pressSources'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

// GET: every configured manufacturer with its last pull result and how many releases are on the site.
export async function GET(req) {
  if (!process.env.ADMIN_KEY || req.headers.get('x-admin-key') !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  try {
    const [docs, state] = await Promise.all([
      sanity.fetch(`*[_type == "pressRelease"]{ brand, approved, publishedAt, sourceDate, "img": defined(heroImage.asset) || defined(imageUrl) }`),
      sanity.fetch(`*[_id == "press-pull-state"][0]{ lastRunAt, lastCreated, sources }`).catch(() => null),
    ])
    const byBrand = {}
    for (const d of docs) {
      const k = brandSlug(d.brand)
      const b = byBrand[k] || (byBrand[k] = { total: 0, live: 0, noImage: 0, latest: null })
      b.total++
      if (d.approved !== false) b.live++
      if (!d.img) b.noImage++
      const when = d.sourceDate || d.publishedAt
      if (when && (!b.latest || when > b.latest)) b.latest = when
    }
    const last = Object.fromEntries((state?.sources || []).map(s => [s._key || brandSlug(s.brand), s]))
    const rows = PRESS_SOURCES.map(src => {
      const slug = brandSlug(src.brand)
      const c = byBrand[slug] || { total: 0, live: 0, noImage: 0, latest: null }
      const l = last[slug] || null
      let health = 'never'
      if (l) {
        if (l.status === 'unreachable') health = 'unreachable'
        else if (l.status === 'no-links') health = 'no-links'
        else health = c.live > 0 ? 'healthy' : 'empty'
      } else if (c.live > 0) health = 'healthy'
      return {
        brand: src.brand, slug, url: src.url, kind: src.kind, health,
        status: l?.status || null, note: l?.note || '', candidates: l?.candidates ?? null,
        createdLastRun: l?.created ?? null, checkedAt: l?.checkedAt || null,
        published: c.live, total: c.total, missingImage: c.noImage, latest: c.latest,
      }
    })
    return Response.json({
      ok: true, rows,
      lastRunAt: state?.lastRunAt || null, lastCreated: state?.lastCreated ?? null,
      totals: { manufacturers: rows.length, releases: docs.length },
    })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
