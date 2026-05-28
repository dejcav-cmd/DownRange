import { createClient } from '@sanity/client'
export const dynamic = 'force-dynamic'
export const maxDuration = 30

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

// Keyword mapping for blog topics → high-quality stock/editorial image search terms
function buildImageQuery(title, category) {
  const t = (title + ' ' + (category||'')).toLowerCase()

  if (/home.?defense|self.?defense|defend|protect|home.?security/.test(t))
    return 'home defense firearm setup'
  if (/conceal|carry|edc|holster|ccw|iwb|owb/.test(t))
    return 'concealed carry holster EDC'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic/.test(t))
    return 'firearm ammunition boxes'
  if (/clean|maintain|mainten|lube|oil/.test(t))
    return 'gun cleaning kit maintenance'
  if (/train|drill|range|marksmanship|dry.fire|practice/.test(t))
    return 'shooting range training firearms'
  if (/law|legal|court|atf|bill|nfa|regulation|legislat/.test(t))
    return 'law books Second Amendment'
  if (/suppressor|silencer/.test(t))
    return 'suppressor silencer firearm'
  if (/storage|safe|lock|secure/.test(t))
    return 'gun safe firearm storage'
  if (/ar.?15|rifle|carbine/.test(t))
    return 'AR-15 rifle range'
  if (/pistol|handgun|9mm|glock|sig/.test(t))
    return 'handgun pistol shooting range'
  if (/shotgun|gauge/.test(t))
    return 'shotgun clay shooting'
  if (/first.?time|beginner|new.?gun|start/.test(t))
    return 'first time gun owner firearm safety'
  if (/nfa|sbr|sbs|machine.gun|title.ii/.test(t))
    return 'NFA regulated firearms class 3'

  return title.slice(0, 50) + ' firearms'
}

async function searchUnsplash(query) {
  // Use Unsplash source API (no key needed for simple redirects, but for search we need key)
  // Fall back to Pixabay which has a free tier
  const key = process.env.PIXABAY_API_KEY
  if (!key) return []

  try {
    const url = new URL('https://pixabay.com/api/')
    url.searchParams.set('key', key)
    url.searchParams.set('q', query)
    url.searchParams.set('image_type', 'photo')
    url.searchParams.set('orientation', 'horizontal')
    url.searchParams.set('min_width', '1200')
    url.searchParams.set('per_page', '6')
    url.searchParams.set('safesearch', 'true')
    url.searchParams.set('order', 'popular')

    const res = await fetch(url.toString())
    const data = await res.json()
    return (data.hits || []).map(h => ({
      url:       h.webformatURL,
      largeUrl:  h.largeImageURL,
      thumb:     h.previewURL,
      width:     h.webformatWidth,
      height:    h.webformatHeight,
      author:    h.user,
      source:    'Pixabay',
      tags:      h.tags,
    }))
  } catch { return [] }
}

async function searchPexels(query) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return []

  try {
    const res = await fetch(
      'https://api.pexels.com/v1/search?' + new URLSearchParams({ query, per_page: 6, orientation: 'landscape' }),
      { headers: { Authorization: key } }
    )
    const data = await res.json()
    return (data.photos || []).map(p => ({
      url:      p.src.large,
      largeUrl: p.src.original,
      thumb:    p.src.medium,
      width:    p.width,
      height:   p.height,
      author:   p.photographer,
      source:   'Pexels',
      tags:     '',
    }))
  } catch { return [] }
}

// Fallback: curated local photos by topic
function getFallbackPhotos(title, category) {
  const t = (title + ' ' + (category||'')).toLowerCase()
  const map = [
    [/home.?defense|protect|self.?defense/, '/img/photos/homedefense.jpg'],
    [/conceal|carry|edc|holster|ccw/,       '/img/photos/pistol.jpg'],
    [/ammo|ammunition|cartridge|bullet/,    '/img/photos/ammo.jpg'],
    [/clean|maintain|lube|oil/,             '/img/photos/pistol.jpg'],
    [/train|drill|range|practice/,          '/img/photos/training.jpg'],
    [/law|legal|court|atf|bill|nfa/,        '/img/photos/law.jpg'],
    [/suppressor|silencer/,                 '/img/photos/suppressor.jpg'],
    [/storage|safe|lock/,                   '/img/photos/pistol.jpg'],
    [/ar.?15|rifle|carbine/,               '/img/photos/rifle.jpg'],
    [/shotgun/,                             '/img/photos/shotgun.jpg'],
    [/hunt/,                                '/img/photos/hunting.jpg'],
    [/competi/,                             '/img/photos/competition.jpg'],
    [/militar|vet/,                         '/img/photos/military.jpg'],
    [/gear|optic|accessory/,               '/img/photos/gear.jpg'],
  ]
  for (const [pat, img] of map) {
    if (pat.test(t)) return [{ url: img, largeUrl: img, thumb: img, source: 'Local', author: 'DownRange' }]
  }
  return [{ url: '/img/photos/pistol.jpg', largeUrl: '/img/photos/pistol.jpg', thumb: '/img/photos/pistol.jpg', source: 'Local', author: 'DownRange' }]
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json()
    const { id, title, category, action } = body

    if (action === 'search') {
      const query = buildImageQuery(title, category)
      console.log('[BLOG-IMG] searching:', query)

      // Try paid APIs first, then fall back to local
      let results = []
      const [pixabay, pexels] = await Promise.all([
        searchPixabay(query),
        searchPexels(query),
      ])
      results = [...pexels, ...pixabay]

      // Always include local fallback options
      const locals = getFallbackPhotos(title, category)
      results = [...results, ...locals]

      return Response.json({ ok: true, query, results: results.slice(0, 8) })
    }

    if (action === 'apply') {
      // Save selected image URL to Sanity
      const { imageUrl } = body
      if (!id || !imageUrl) return Response.json({ error: 'id and imageUrl required' }, { status: 400 })
      await sanity.patch(id).set({ imageUrl }).commit()
      return Response.json({ ok: true, imageUrl })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}

// Note: named searchPixabay in the POST handler
async function searchPixabay(query) {
  return searchUnsplash(query)
}
