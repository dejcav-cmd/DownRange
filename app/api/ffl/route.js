export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')
  if (!zip) return Response.json({ error: 'ZIP required' }, { status: 400 })

  try {
    // Use Google Places to find gun dealers (FFL dealers appear as "gun shops" / "firearms dealer")
    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return Response.json({ dealers: [
        { name: 'Demo FFL Dealer', address: '123 Main St', city: 'Your City', state: 'ST', zip: '00000', type: '01', license: 'XX-XXX-XXX-XX-XXXXX', phone: '(555) 000-0000' },
      ], notice: 'Add GOOGLE_PLACES_API_KEY to Vercel env vars to enable live FFL search' })
    }

    const geo = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)},USA&key=${apiKey}`)
    const geoData = await geo.json()
    if (!geoData.results?.[0]) return Response.json({ dealers: [] })
    const { lat, lng } = geoData.results[0].geometry.location

    const places = await fetch(`https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=40000&keyword=gun+store+firearms+dealer+FFL&key=${apiKey}`)
    const placesData = await places.json()

    const dealers = (placesData.results || []).slice(0, 15).map(p => ({
      name:    p.name,
      address: p.vicinity?.split(',')[0] || '',
      city:    p.vicinity?.split(',')[1]?.trim() || '',
      state:   '',
      zip:     '',
      type:    '01',
      license: 'Verify at atf.gov/firearms/listing-federal-firearms-licensees',
      phone:   null,
      rating:  p.rating,
      mapsUrl: `https://www.google.com/maps/place/?q=place_id:${p.place_id}`,
    }))

    return Response.json({ dealers })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
