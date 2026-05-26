export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const zip    = searchParams.get('zip')
  const radius = parseInt(searchParams.get('radius') || '25') // miles
  const type   = searchParams.get('type') || 'all' // all | indoor | outdoor | public | private

  if (!zip) return Response.json({ error: 'ZIP required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    return Response.json({
      ranges: [], notice: 'GOOGLE_PLACES_API_KEY not configured in Vercel env vars.'
    })
  }

  const radiusMeters = Math.min(radius * 1609, 50000) // max 50km API limit

  try {
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)},USA&key=${apiKey}`
    )
    const geoData = await geoRes.json()
    if (geoData.status !== 'OK' || !geoData.results?.[0]) {
      return Response.json({ error: `Location not found: ${zip}` }, { status: 400 })
    }
    const { lat, lng } = geoData.results[0].geometry.location
    const locationName = geoData.results[0].formatted_address

    // Run 4 parallel searches with different keywords for maximum coverage
    const keywords = [
      'shooting range',
      'gun range',
      'indoor shooting range',
      'outdoor shooting range',
    ]

    const allResults = await Promise.all(
      keywords.map(kw =>
        fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radiusMeters}&keyword=${encodeURIComponent(kw)}&key=${apiKey}`)
          .then(r => r.json())
          .then(d => d.results || [])
          .catch(() => [])
      )
    )

    // Merge and deduplicate
    const seen = new Set()
    let merged = allResults.flat().filter(p => {
      if (seen.has(p.place_id)) return false
      seen.add(p.place_id)
      // Filter by type if selected
      const name = (p.name || '').toLowerCase()
      if (type === 'indoor' && !name.includes('indoor') && !p.name.toLowerCase().includes('pistol') && !p.name.toLowerCase().includes('gun shop')) return true
      if (type === 'outdoor' && name.includes('indoor')) return false
      return true
    })

    function distMiles(lat1, lng1, lat2, lng2) {
      const R = 3959
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
      return +(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)
    }

    const ranges = merged
      .map(p => ({
        name:      p.name,
        address:   p.vicinity,
        rating:    p.rating || null,
        reviews:   p.user_ratings_total || 0,
        open:      p.opening_hours?.open_now ?? null,
        distance:  distMiles(lat, lng, p.geometry.location.lat, p.geometry.location.lng),
        lat:       p.geometry.location.lat,
        lng:       p.geometry.location.lng,
        mapsUrl:   `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
        placeId:   p.place_id,
        photos:    p.photos?.length || 0,
        types:     p.types || [],
      }))
      .filter(r => r.distance <= radius)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 20)

    return Response.json({
      ranges,
      location: locationName,
      total: ranges.length,
      lat, lng,
      radiusMiles: radius,
    })
  } catch (err) {
    console.error('Ranges error:', err)
    return Response.json({ error: err.message }, { status: 500 })
  }
}
