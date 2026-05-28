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

// Map any content topic → good image search query
function buildImageQuery(title, category) {
  const safe = String(title || category || '').toLowerCase()
  const t = safe + ' ' + String(category || '').toLowerCase()

  if (/home.?defense|self.?defense|defend|protect|home.?security/.test(t)) return 'home defense firearm'
  if (/conceal|carry|edc|holster|ccw|iwb|owb/.test(t))                     return 'concealed carry holster EDC'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic/.test(t))           return 'firearm ammunition'
  if (/clean|maintain|mainten|lube|oil/.test(t))                            return 'gun cleaning maintenance'
  if (/train|drill|range|marksmanship|dry.fire|practice/.test(t))           return 'shooting range training'
  if (/law|legal|court|atf|bill|nfa|regulation|legislat|bruen|heller/.test(t)) return 'Second Amendment law constitution'
  if (/suppressor|silencer/.test(t))                                        return 'suppressor silencer firearm'
  if (/storage|safe|lock|secure/.test(t))                                   return 'gun safe firearm storage'
  if (/ar.?15|rifle|carbine|m4|5.56/.test(t))                               return 'AR-15 rifle range'
  if (/pistol|handgun|9mm|glock|sig|beretta/.test(t))                       return 'handgun pistol shooting'
  if (/shotgun|gauge|pump|mossberg/.test(t))                                 return 'shotgun shooting clay'
  if (/first.?time|beginner|new.?gun|start/.test(t))                        return 'first time gun owner safety'
  if (/suppressor|sbr|sbs|machine.gun|title.ii/.test(t))                    return 'NFA firearms class 3'
  if (/red.dot|optic|sight|scope/.test(t))                                  return 'firearm optic red dot pistol'
  if (/review|test|evaluation/.test(t))                                     return 'firearm review testing range'
  if (/competition|uspsa|idpa|3.gun/.test(t))                               return 'shooting competition match'
  if (/hunt|deer|elk|game|waterfowl/.test(t))                               return 'hunting rifle outdoors'
  if (/canada|c-21|pal|restricted/.test(t))                                 return 'Canadian firearm law'
  if (/video|youtube|channel/.test(t))                                      return 'firearms video content'

  // Generic fallback using first 40 chars of title + firearms
  const slug = safe.replace(/[^a-z0-9 ]/g, '').trim().split(' ').slice(0, 5).join(' ')
  return (slug || 'firearm') + ' firearms'
}

// Curated local fallback photos
function getFallbackPhotos(title, category) {
  const t = String(title || '').toLowerCase() + ' ' + String(category || '').toLowerCase()
  const map = [
    [/home.?defense|protect|self.?defense/,    '/img/photos/homedefense.jpg'],
    [/conceal|carry|edc|holster|ccw/,          '/img/photos/pistol.jpg'],
    [/ammo|ammunition|cartridge|bullet/,       '/img/photos/ammo.jpg'],
    [/clean|maintain|lube|oil/,                '/img/photos/pistol.jpg'],
    [/train|drill|range|practice/,             '/img/photos/training.jpg'],
    [/law|legal|court|atf|bill|bruen/,         '/img/photos/law.jpg'],
    [/suppressor|silencer/,                    '/img/photos/suppressor.jpg'],
    [/storage|safe|lock/,                      '/img/photos/pistol.jpg'],
    [/ar.?15|rifle|carbine/,                   '/img/photos/rifle.jpg'],
    [/shotgun/,                                '/img/photos/shotgun.jpg'],
    [/hunt/,                                   '/img/photos/hunting.jpg'],
    [/competi/,                                '/img/photos/competition.jpg'],
    [/militar|vet/,                            '/img/photos/military.jpg'],
    [/gear|optic|accessory|red.dot/,           '/img/photos/gear.jpg'],
    [/canada/,                                 '/img/photos/law.jpg'],
  ]
  for (const [pat, img] of map) {
    if (pat.test(t)) return [{ url: img, largeUrl: img, thumb: img, source: 'Local', author: 'DownRange' }]
  }
  return [{ url: '/img/photos/pistol.jpg', largeUrl: '/img/photos/pistol.jpg', thumb: '/img/photos/pistol.jpg', source: 'Local', author: 'DownRange' }]
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
    url.searchParams.set('per_page', '6')
    url.searchParams.set('safesearch', 'true')
    url.searchParams.set('order', 'popular')
    const res = await fetch(url.toString())
    const data = await res.json()
    return (data.hits || []).map(h => ({
      url: h.webformatURL, largeUrl: h.largeImageURL, thumb: h.previewURL,
      author: h.user, source: 'Pixabay', tags: h.tags || '',
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
      url: p.src.large, largeUrl: p.src.original, thumb: p.src.medium,
      author: p.photographer, source: 'Pexels', tags: '',
    }))
  } catch { return [] }
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const body = await req.json().catch(() => ({}))
    const { id, title, category, action } = body

    if (action === 'search') {
      const query = buildImageQuery(title, category)
      console.log('[IMG-SEARCH] query:', query, 'for:', title)

      const [pexels, pixabay] = await Promise.all([
        searchPexels(query),
        searchPixabay(query),
      ])

      const results = [...pexels, ...pixabay, ...getFallbackPhotos(title, category)]
      return Response.json({ ok: true, query, results: results.slice(0, 10) })
    }

    if (action === 'apply') {
      const { imageUrl } = body
      if (!id || !imageUrl) return Response.json({ error: 'id and imageUrl required' }, { status: 400 })
      await sanity.patch(id).set({ imageUrl }).commit()
      return Response.json({ ok: true, imageUrl })
    }

    return Response.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e) {
    console.error('[IMG-SEARCH] error:', e.message)
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
