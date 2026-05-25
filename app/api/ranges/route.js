export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')
  if (!zip) return Response.json({ error: 'ZIP required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    // Return mock data if no key configured
    return Response.json({ ranges: [
      { name: 'Demo Range — Add GOOGLE_PLACES_API_KEY to enable live data', address: 'Configure your Google Places API key in Vercel env vars', rating: null, open: null, distance: null, mapsUrl: null }
    ]})
  }

  try {
    // Geocode ZIP first
    const geoRes = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)}&key=${apiKey}`)
    const geoData = await geoRes.json()
    if (!geoData.results?.[0]) return Response.json({ ranges: [] })

    const { lat, lng } = geoData.results[0].geometry.location

    // Search for shooting ranges
    const placesRes = await fetch(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=40000&keyword=shooting+range&key=${apiKey}`
    )
    const placesData = await placesRes.json()

    const ranges = (placesData.results || []).slice(0, 12).map(p => ({
      name:     p.name,
      address:  p.vicinity,
      rating:   p.rating,
      open:     p.opening_hours?.open_now,
      mapsUrl:  `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }))

    return Response.json({ ranges })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
