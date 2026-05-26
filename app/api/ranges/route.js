export const dynamic = 'force-dynamic'

// Curated database of top shooting ranges by metro area (always available, no API key)
const RANGE_DATABASE = [
  // Seattle / Bellevue, WA
  { name:'Bellevue Gun Club', address:'2424 151st Pl NE, Redmond, WA 98052', city:'Redmond', state:'WA', zip:'98052', lat:47.665, lng:-122.126, type:'Indoor', rating:4.8, phone:'(425) 885-3800', website:'https://www.bellevuegunclub.com', features:['31,000 sq ft','25 lanes','NSSF 5-Star','Rentals','Training'], hours:'Mon-Sun 9am-9pm' },
  { name:'Bellevue Indoor Range (Wade\'s)', address:'10601 SE 36th St, Bellevue, WA 98006', city:'Bellevue', state:'WA', zip:'98006', lat:47.582, lng:-122.178, type:'Indoor', rating:4.5, phone:'(425) 746-2575', website:'https://www.bellevueindoorrange.com', features:['26,000 sq ft','24 lanes','Rifle to 7.62x39','Rentals','Pro shop'], hours:'Mon-Fri 10am-9pm, Sat-Sun 9am-9pm' },
  { name:'West Coast Armory Indoor Range', address:'3808 Factoria Blvd SE, Bellevue, WA 98006', city:'Bellevue', state:'WA', zip:'98006', lat:47.568, lng:-122.172, type:'Indoor', rating:4.7, phone:'(425) 747-3844', website:'https://www.westcoastarmory.com', features:['Indoor','Pistol & rifle','Rentals','FFL dealer','Suppressor-friendly'], hours:'Mon-Sat 10am-8pm, Sun 11am-6pm' },
  { name:'West Coast Armory North', address:'10707 NE 10th St, Bellevue, WA 98004', city:'Bellevue', state:'WA', zip:'98004', lat:47.621, lng:-122.188, type:'Indoor', rating:4.6, phone:'(425) 454-4867', website:'https://www.westcoastarmory.com', features:['Indoor pistol range','Retail','Gunsmithing'], hours:'Mon-Sat 10am-7pm, Sun 11am-5pm' },
  { name:'Champion Arms Shooting Range', address:'18801 E Valley Hwy, Kent, WA 98032', city:'Kent', state:'WA', zip:'98032', lat:47.407, lng:-122.226, type:'Indoor', rating:4.3, phone:'(253) 872-4004', website:'https://www.championarms.com', features:['Open 365 days','Pistol & rifle','Rentals','Lessons'], hours:'Mon-Sun 9am-10pm' },
  { name:'Kitsap Rifle & Revolver Club', address:'6700 Sunnyslope Rd NW, Bremerton, WA 98312', city:'Bremerton', state:'WA', zip:'98312', lat:47.614, lng:-122.778, type:'Outdoor', rating:4.6, phone:'(360) 373-6612', website:'https://www.krrc.org', features:['Members club','Multiple ranges','Long range 600yd','Pistol bays'], hours:'Members only – see website' },
  { name:'Renton Fish & Game Club', address:'15825 SE Renton Maple Valley Hwy, Renton, WA 98058', city:'Renton', state:'WA', zip:'98058', lat:47.462, lng:-122.076, type:'Outdoor', rating:4.4, phone:'(425) 228-2400', website:'https://www.rentonfishgame.com', features:['Members + guests','Pistol, rifle, shotgun','Trap & skeet'], hours:'Varies by range – members club' },
  // TX – Dallas / Fort Worth
  { name:'Top Gun Shooting Sports', address:'5232 Airport Fwy, Fort Worth, TX 76117', city:'Fort Worth', state:'TX', zip:'76117', lat:32.829, lng:-97.222, type:'Indoor', rating:4.5, phone:'(817) 834-8696', website:'https://www.topgunshootingsports.com', features:['25 lanes','Pistol & rifle','Rentals','Concealed carry classes'], hours:'Mon-Fri 10am-9pm, Sat-Sun 9am-8pm' },
  { name:'DFW Shooters', address:'3250 US-377, Granbury, TX 76049', city:'Granbury', state:'TX', zip:'76049', lat:32.428, lng:-97.781, type:'Outdoor', rating:4.6, phone:'(817) 573-6700', website:'https://www.dfwshooters.com', features:['Outdoor','250yd rifle','Pistol bays','Steel targets','Memberships'], hours:'Tue-Sun 9am-6pm' },
  // FL – Orlando / Tampa
  { name:'The Gun Store Orlando', address:'5995 Lakehurst Dr, Orlando, FL 32819', city:'Orlando', state:'FL', zip:'32819', lat:28.453, lng:-81.458, type:'Indoor', rating:4.4, phone:'(407) 992-2222', website:'https://www.thegunstoreusa.com', features:['Machine guns available','Tourist-friendly','Rentals','Video range'], hours:'Mon-Sun 10am-7pm' },
  { name:'Shoot Straight Tampa', address:'5418 W Hillsborough Ave, Tampa, FL 33634', city:'Tampa', state:'FL', zip:'33634', lat:27.987, lng:-82.567, type:'Indoor', rating:4.6, phone:'(813) 885-7668', website:'https://www.shootstraight.com', features:['25 lanes','Pistol & rifle','Large retail','Classes'], hours:'Mon-Thu 10am-9pm, Fri-Sat 9am-9pm, Sun 10am-7pm' },
  // GA – Atlanta
  { name:'Adventure Outdoors', address:'1648 S Cobb Dr, Smyrna, GA 30080', city:'Smyrna', state:'GA', zip:'30080', lat:33.848, lng:-84.514, type:'Indoor', rating:4.5, phone:'(770) 432-2825', website:'https://www.adventureoutdoors.com', features:['10 lanes','Pistol range','Large retail','FFL'], hours:'Mon-Sat 9am-8pm, Sun 11am-6pm' },
  // CO – Denver
  { name:'Bristlecone Shooting, Training & Retail', address:'11379 E Yucca Ridge Rd, Parker, CO 80138', city:'Parker', state:'CO', zip:'80138', lat:39.513, lng:-104.701, type:'Indoor', rating:4.7, phone:'(720) 851-7890', website:'https://www.bristleconeshooting.com', features:['40 lanes','Pistol & rifle to .308','State of the art HVAC','Rentals'], hours:'Mon-Fri 10am-9pm, Sat-Sun 9am-8pm' },
  // AZ – Phoenix
  { name:'Scottsdale Gun Club', address:'15770 N Hayden Rd, Scottsdale, AZ 85260', city:'Scottsdale', state:'AZ', zip:'85260', lat:33.629, lng:-111.925, type:'Indoor', rating:4.8, phone:'(480) 348-1111', website:'https://www.scottsdalegc.com', features:['100 lanes','Pistol & rifle','Machine gun rental','VIP memberships'], hours:'Mon-Sun 9am-10pm' },
  // CA – Los Angeles
  { name:'LAX Firing Range', address:'927 W Manchester Blvd, Inglewood, CA 90301', city:'Inglewood', state:'CA', zip:'90301', lat:33.959, lng:-118.345, type:'Indoor', rating:4.3, phone:'(310) 568-1515', website:'https://www.laxfiringrange.com', features:['25 lanes','Rentals','Concierge service','Near LAX'], hours:'Mon-Fri 11am-9pm, Sat-Sun 9am-9pm' },
]

function distMiles(lat1, lng1, lat2, lng2) {
  const R = 3959
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
  return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)
}

// Simple ZIP → lat/lng lookup for major metros
const ZIP_COORDS = {
  // WA
  '98006': [47.565, -122.170], '98004': [47.621, -122.188], '98007': [47.601, -122.143],
  '98008': [47.598, -122.125], '98052': [47.665, -122.126], '98033': [47.682, -122.201],
  '98034': [47.703, -122.219], '98101': [47.608, -122.335], '98103': [47.660, -122.340],
  '98115': [47.684, -122.284], '98118': [47.536, -122.262], '98136': [47.532, -122.379],
  '98032': [47.407, -122.226], '98058': [47.462, -122.076], '98056': [47.513, -122.176],
  // TX
  '76117': [32.829, -97.222], '75001': [32.978, -96.828], '75201': [32.780, -96.797],
  '76049': [32.428, -97.781], '78201': [29.462, -98.534], '78701': [30.267, -97.743],
  // FL
  '32819': [28.453, -81.458], '33634': [27.987, -82.567], '33301': [26.122, -80.143],
  // GA
  '30301': [33.749, -84.388], '30080': [33.848, -84.514],
  // CO
  '80138': [39.513, -104.701], '80202': [39.752, -104.999],
  // AZ
  '85260': [33.629, -111.925], '85001': [33.449, -112.075],
  // CA
  '90301': [33.959, -118.345], '90001': [33.973, -118.249],
}

async function geocodeZip(zip, apiKey) {
  // First try static lookup
  const coords = ZIP_COORDS[zip.replace(/\s/g, '').substring(0, 5)]
  if (coords) return { lat: coords[0], lng: coords[1], name: null }

  // Try Google if available
  if (apiKey) {
    try {
      const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)},USA&key=${apiKey}`)
      const d = await res.json()
      if (d.results?.[0]) {
        const { lat, lng } = d.results[0].geometry.location
        return { lat, lng, name: d.results[0].formatted_address }
      }
    } catch {}
  }

  // Try Nominatim (free OpenStreetMap geocoding) 
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?postalcode=${encodeURIComponent(zip)}&country=US&format=json&limit=1`,
      { headers: { 'User-Agent': 'DownRange-RangeFinder/1.0 (contact@downrangeco.com)' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name }
    }
  } catch {}

  // Try city search as last resort
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(zip)}&countrycodes=us&format=json&limit=1`,
      { headers: { 'User-Agent': 'DownRange-RangeFinder/1.0 (contact@downrangeco.com)' } }
    )
    if (res.ok) {
      const data = await res.json()
      if (data[0]) return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon), name: data[0].display_name }
    }
  } catch {}

  return null
}

async function searchOverpass(lat, lng, radiusMeters) {
  // Overpass API — free, no key, uses OpenStreetMap data
  const query = `[out:json][timeout:20];(node["leisure"="shooting_range"](around:${radiusMeters},${lat},${lng});way["leisure"="shooting_range"](around:${radiusMeters},${lat},${lng});node["sport"="shooting"](around:${radiusMeters},${lat},${lng});way["sport"="shooting"](around:${radiusMeters},${lat},${lng}););out center tags;`
  
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      body: 'data=' + encodeURIComponent(query),
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'DownRange/1.0' },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.elements || []).map(el => {
      const elLat = el.lat || el.center?.lat
      const elLng = el.lon || el.center?.lon
      return {
        name: el.tags?.name || el.tags?.['name:en'] || 'Shooting Range',
        address: [el.tags?.['addr:housenumber'], el.tags?.['addr:street'], el.tags?.['addr:city'], el.tags?.['addr:state']].filter(Boolean).join(' ') || 'See Google Maps for address',
        lat: elLat, lng: elLng,
        website: el.tags?.website || el.tags?.url || null,
        phone: el.tags?.phone || el.tags?.['contact:phone'] || null,
        type: el.tags?.['building:type'] === 'indoor' ? 'Indoor' : el.tags?.covered === 'yes' ? 'Indoor' : 'Outdoor',
        source: 'OpenStreetMap',
      }
    }).filter(r => r.lat && r.lng)
  } catch { return [] }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const zip    = searchParams.get('zip')?.trim()
  const radius = Math.min(parseInt(searchParams.get('radius') || '25'), 100)
  const type   = searchParams.get('type') || 'all'

  if (!zip) return Response.json({ error: 'ZIP or city required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  // 1. Geocode the query
  const coords = await geocodeZip(zip, apiKey)
  if (!coords) {
    return Response.json({ error: `Could not find location: "${zip}". Try your city name or ZIP code.` }, { status: 400 })
  }
  const { lat, lng } = coords
  const radiusMeters = radius * 1609

  // 2. Search curated database first (always works)
  const curatedResults = RANGE_DATABASE
    .map(r => ({ ...r, distance: distMiles(lat, lng, r.lat, r.lng), source: 'curated' }))
    .filter(r => r.distance <= radius)
    .filter(r => type === 'all' || r.type?.toLowerCase() === type)
    .sort((a, b) => a.distance - b.distance)

  // 3. Search Overpass API (free, no key)
  let osmResults = []
  try { osmResults = await searchOverpass(lat, lng, Math.min(radiusMeters, 50000)) } catch {}
  
  const osmMapped = osmResults
    .map(r => ({ ...r, distance: distMiles(lat, lng, r.lat, r.lng) }))
    .filter(r => r.distance <= radius)
    .filter(r => type === 'all' || r.type?.toLowerCase() === type)

  // 4. Google Places (if key available)
  let googleResults = []
  if (apiKey) {
    try {
      const searches = ['shooting range', 'gun range', 'indoor shooting range']
      const all = await Promise.all(searches.map(kw =>
        fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${Math.min(radiusMeters, 50000)}&keyword=${encodeURIComponent(kw)}&key=${apiKey}`)
          .then(r => r.json()).then(d => d.results || []).catch(() => [])
      ))
      const seen = new Set()
      googleResults = all.flat().filter(p => {
        if (seen.has(p.place_id)) return false
        seen.add(p.place_id); return true
      }).map(p => ({
        name: p.name,
        address: p.vicinity,
        lat: p.geometry.location.lat,
        lng: p.geometry.location.lng,
        rating: p.rating,
        reviews: p.user_ratings_total,
        open: p.opening_hours?.open_now,
        mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
        distance: distMiles(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
        source: 'google',
      })).filter(r => r.distance <= radius)
        .filter(r => type === 'all' || true)
    } catch {}
  }

  // 5. Merge all results, deduplicate by name proximity
  const seen = new Set()
  const merged = [...curatedResults, ...googleResults, ...osmMapped].filter(r => {
    const key = r.name?.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 12)
    if (seen.has(key)) return false
    seen.add(key); return true
  }).sort((a, b) => a.distance - b.distance).slice(0, 25)

  // Always add Google Maps search link even if no results
  const mapsSearchUrl = `https://www.google.com/maps/search/shooting+range/@${lat},${lng},12z`

  if (merged.length === 0) {
    return Response.json({
      ranges: [],
      lat, lng,
      location: coords.name || zip,
      mapsSearchUrl,
      notice: `No ranges found in our database within ${radius} miles of ${zip}. Use the Google Maps link below to search directly.`
    })
  }

  return Response.json({
    ranges: merged,
    total: merged.length,
    lat, lng,
    location: coords.name || zip,
    radiusMiles: radius,
    sources: {
      curated: curatedResults.length,
      google: googleResults.length,
      osm: osmMapped.length,
    },
    mapsSearchUrl,
  })
}
