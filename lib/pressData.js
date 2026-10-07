// Read-side helpers for the Manufacturer Press Releases section (server components).
import { createClient } from '@sanity/client'

const client = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false, // rule: slug/detail pages never use the CDN
})

export const PRESS_PER_PAGE = 12
// RULE: an article is only public with a real manufacturer image (Sanity CDN). No placeholders.
const REAL_IMG = '(defined(heroImage.asset) || imageUrl match "https://cdn.sanity.io/*")'
const BASE = `_type == "pressRelease" && approved == true && defined(slug.current) && ${REAL_IMG}`
const CARD = `_id, title, "slug": slug.current, brand, brandSlug, kind, category, summary, publishedAt, readTime,
  sourceUrl, "image": coalesce(heroImage.asset->url, imageUrl)`

function filterClause({ brand, kind, month }) {
  let f = BASE
  if (brand) f += ' && brandSlug == $brand'
  if (kind)  f += ' && kind == $kind'
  if (month) f += ' && publishedAt >= $from && publishedAt < $to'
  return f
}

function monthRange(month) {
  const m = /^(\d{4})-(\d{2})$/.exec(month || '')
  if (!m) return {}
  const from = new Date(Date.UTC(+m[1], +m[2] - 1, 1))
  const to   = new Date(Date.UTC(+m[1], +m[2], 1))
  return { from: from.toISOString(), to: to.toISOString() }
}

export async function getPressPage({ page = 1, brand = null, kind = null, month = null } = {}) {
  const params = { brand, kind, ...monthRange(month) }
  const f = filterClause({ brand, kind, month: month && params.from })
  const offset = (page - 1) * PRESS_PER_PAGE
  const [items, total] = await Promise.all([
    client.fetch(`*[${f}] | order(publishedAt desc, _createdAt desc) [${offset}...${offset + PRESS_PER_PAGE}] { ${CARD} }`, params),
    client.fetch(`count(*[${f}])`, params),
  ])
  return { items, total, pages: Math.max(1, Math.ceil(total / PRESS_PER_PAGE)), page }
}

// Manufacturer list with counts, plus the months that have releases (for the time navigation)
export async function getPressFacets() {
  const rows = await client.fetch(`*[${BASE}]{ brand, brandSlug, publishedAt, kind }`)
  const brands = {}
  const months = {}
  const kinds = {}
  let latest = null
  for (const r of rows) {
    if (r.brandSlug) {
      const b = brands[r.brandSlug] || (brands[r.brandSlug] = { brand: r.brand, brandSlug: r.brandSlug, count: 0 })
      b.count++
    }
    if (r.publishedAt) {
      const k = r.publishedAt.slice(0, 7)
      months[k] = (months[k] || 0) + 1
      if (!latest || r.publishedAt > latest) latest = r.publishedAt
    }
    if (r.kind) kinds[r.kind] = (kinds[r.kind] || 0) + 1
  }
  return {
    total: rows.length,
    brands: Object.values(brands).sort((a, b) => b.count - a.count || a.brand.localeCompare(b.brand)),
    months: Object.entries(months).sort((a, b) => b[0].localeCompare(a[0])).map(([key, count]) => ({ key, count })),
    kinds, latest,
  }
}

export async function getPressBySlug(slug) {
  return client.fetch(
    `*[${BASE} && slug.current == $slug][0]{
      ${CARD}, body, sourceTitle, sourceDate, tags, _updatedAt }`, { slug })
}

export async function getPressNeighbors(publishedAt) {
  const [newer, older] = await Promise.all([
    client.fetch(`*[${BASE} && publishedAt > $d] | order(publishedAt asc)[0]{ title, "slug": slug.current, brand, publishedAt }`, { d: publishedAt }),
    client.fetch(`*[${BASE} && publishedAt < $d] | order(publishedAt desc)[0]{ title, "slug": slug.current, brand, publishedAt }`, { d: publishedAt }),
  ])
  return { newer, older }
}

export async function getMoreFromBrand(brandSlug, excludeId, limit = 3) {
  return client.fetch(
    `*[${BASE} && brandSlug == $b && _id != $id] | order(publishedAt desc)[0...${limit}]{ ${CARD} }`, { b: brandSlug, id: excludeId })
}

export async function getAllPressSlugs() {
  return client.fetch(`*[${BASE}]{ "slug": slug.current, publishedAt, _updatedAt }`)
}
