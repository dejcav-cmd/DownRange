import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY ||
    req.headers.get('x-vercel-cron') === '1' ||
    (req.headers.get('authorization') || '') === 'Bearer ' + process.env.CRON_SECRET
}

async function fetchImage(query) {
  const pKey = process.env.PEXELS_API_KEY
  if (pKey) {
    try {
      const r = await fetch('https://api.pexels.com/v1/search?query=' + encodeURIComponent(query) + '&per_page=5&orientation=landscape', { headers: { Authorization: pKey }, signal: AbortSignal.timeout(8000) })
      const d = await r.json()
      const p = d.photos?.[0]
      if (p) return p.src.large2x || p.src.large
    } catch {}
  }
  const xKey = process.env.PIXABAY_API_KEY
  if (xKey) {
    try {
      const r = await fetch('https://pixabay.com/api/?key=' + xKey + '&q=' + encodeURIComponent(query) + '&image_type=photo&orientation=horizontal&min_width=800&per_page=5&safesearch=true', { signal: AbortSignal.timeout(8000) })
      const d = await r.json()
      const h = d.hits?.[0]
      if (h) return h.largeImageURL || h.webformatURL
    } catch {}
  }
  return null
}

function buildQuery(title, country) {
  const t = (title || '').toLowerCase()
  if (country === 'brazil') {
    if (/lei|estatuto|decreto|legal/.test(t)) return 'Brazil firearms law government'
    if (/atirador|tiro|cac/.test(t)) return 'shooting range sport pistol Brazil'
    if (/munição/.test(t)) return 'ammunition bullets firearm'
    return 'Brazil firearms gun rights'
  }
  if (/law|bill|c-21|pal|ban|legislation/.test(t)) return 'Canada firearms law regulation'
  if (/ammo|ammunition/.test(t)) return 'ammunition bullets firearm Canada'
  return 'Canada firearms gun'
}

function isBad(url) {
  if (!url) return true
  return ['/img/photos/','/img/pistol','/img/rifle','/img/law','/img/shotgun',
    '/img/suppressor','/img/ammo','/img/news','/img/gear','/img/training',
    '/img/hunting','/img/military','/img/homedefense'].some(p => url.includes(p))
}

export async function GET(req) { return handler(req) }
export async function POST(req) { return handler(req) }

async function handler(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const country = body.type || 'both'
  const stats = { fixed: 0, skipped: 0, failed: 0 }

  const configs = []
  if (country === 'canada' || country === 'both') configs.push({ t: 'canadaContent', c: 'canada' })
  if (country === 'brazil' || country === 'both') configs.push({ t: 'brazilContent', c: 'brazil' })

  for (const { t, c } of configs) {
    const items = await sanity.fetch(
      '*[_type==$t && (type=="article" || type=="artigo")] | order(publishedAt desc) [0...50] { _id, title, imageUrl }',
      { t }
    ).catch(() => [])

    for (const item of items) {
      if (!isBad(item.imageUrl)) { stats.skipped++; continue }
      const imageUrl = await fetchImage(buildQuery(item.title, c))
      if (imageUrl) {
        try { await sanity.patch(item._id).set({ imageUrl }).commit(); stats.fixed++ }
        catch { stats.failed++ }
      } else { stats.failed++ }
      await new Promise(r => setTimeout(r, 150))
    }
  }

  return Response.json({ ok: true, ...stats })
}
