export const dynamic = 'force-dynamic'
export const maxDuration = 30

function auth(req) {
  const k = req.headers.get('x-admin-key')
  return k && k === process.env.ADMIN_KEY
}

async function searchPexels(query) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []
  try {
    const res = await fetch(
      'https://api.pexels.com/v1/search?' + new URLSearchParams({ query, per_page: 12, orientation: 'landscape' }),
      { headers: { Authorization: key } }
    )
    const data = await res.json()
    return (data.photos || []).map(p => ({
      url:      p.src.large,
      largeUrl: p.src.original,
      thumb:    p.src.medium,
      author:   p.photographer,
      source:   'Pexels',
    }))
  } catch { return [] }
}

async function searchPixabay(query) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) return []
  try {
    const url = new URL('https://pixabay.com/api/')
    url.searchParams.set('key', key)
    url.searchParams.set('q', query)
    url.searchParams.set('image_type', 'photo')
    url.searchParams.set('orientation', 'horizontal')
    url.searchParams.set('min_width', '1200')
    url.searchParams.set('per_page', '12')
    url.searchParams.set('safesearch', 'true')
    url.searchParams.set('order', 'popular')
    const res  = await fetch(url.toString())
    const data = await res.json()
    return (data.hits || []).map(h => ({
      url:      h.webformatURL,
      largeUrl: h.largeImageURL,
      thumb:    h.previewURL,
      author:   h.user,
      source:   'Pixabay',
    }))
  } catch { return [] }
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { query, source = 'all' } = await req.json()
    if (!query?.trim()) return Response.json({ error: 'query required' }, { status: 400 })

    let results = []
    if (source === 'pexels') {
      results = await searchPexels(query)
    } else if (source === 'pixabay') {
      results = await searchPixabay(query)
    } else {
      const [pexels, pixabay] = await Promise.all([searchPexels(query), searchPixabay(query)])
      // interleave for variety
      const maxLen = Math.max(pexels.length, pixabay.length)
      for (let i = 0; i < maxLen; i++) {
        if (pexels[i])  results.push(pexels[i])
        if (pixabay[i]) results.push(pixabay[i])
      }
      const seen = new Set()
      results = results.filter(r => { if (seen.has(r.url)) return false; seen.add(r.url); return true })
    }

    return Response.json({ ok: true, query: query.trim(), results: results.slice(0, 24) })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
