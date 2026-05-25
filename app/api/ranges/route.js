export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')
  if (!zip) return Response.json({ error: 'ZIP required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return Response.json({
      ranges: [],
      notice: 'GOOGLE_PLACES_API_KEY not configured. Add it to Vercel environment variables to enable range finder.'
    })
  }

  try {
    // Geocode the ZIP/city to lat/lng
    const geoRes = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)},USA&key=${apiKey}`,
      { next: { revalidate: 86400 } }
    )
    const geoData = await geoRes.json()

    if (geoData.status !== 'OK' || !geoData.results?.[0]) {
      return Response.json({ error: `Could not find location: ${zip}. Try a city name or full ZIP code.` }, { status: 400 })
    }

    const { lat, lng } = geoData.results[0].geometry.location
    const locationName = geoData.results[0].formatted_address

    // Search nearby shooting ranges — use both keyword and type for best coverage
    const [res1, res2] = await Promise.all([
      fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&keyword=shooting+range+gun+range&key=${apiKey}`),
      fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&keyword=indoor+shooting+range&key=${apiKey}`),
    ])

    const [data1, data2] = await Promise.all([res1.json(), res2.json()])

    // Merge + deduplicate by place_id
    const seen = new Set()
    const all = [...(data1.results || []), ...(data2.results || [])]
      .filter(p => {
        if (seen.has(p.place_id)) return false
        seen.add(p.place_id)
        return true
      })
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))
      .slice(0, 15)

    if (all.length === 0) {
      return Response.json({ ranges: [], location: locationName, notice: `No shooting ranges found within 50 miles of ${zip}. Try searching a nearby city.` })
    }

    // Calculate approximate distance from search center
    function distMiles(lat1, lng1, lat2, lng2) {
      const R = 3959
      const dLat = (lat2 - lat1) * Math.PI / 180
      const dLng = (lng2 - lng1) * Math.PI / 180
      const a = Math.sin(dLat/2)**2 + Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLng/2)**2
      return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1)
    }

    const ranges = all.map(p => ({
      name:     p.name,
      address:  p.vicinity,
      rating:   p.rating || null,
      reviews:  p.user_ratings_total || 0,
      open:     p.opening_hours?.open_now ?? null,
      distance: distMiles(lat, lng, p.geometry.location.lat, p.geometry.location.lng) + ' mi',
      mapsUrl:  `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
      placeId:  p.place_id,
    }))
    .sort((a, b) => parseFloat(a.distance) - parseFloat(b.distance))

    return Response.json({ ranges, location: locationName, total: ranges.length })
  } catch (err) {
    console.error('Ranges API error:', err)
    return Response.json({ error: 'Search failed. Please try again.' }, { status: 500 })
  }
}
