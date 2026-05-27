export const dynamic = 'force-dynamic'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const zip = searchParams.get('zip')
  if (!zip) return Response.json({ error: 'ZIP required' }, { status: 400 })

  const apiKey = process.env.GOOGLE_PLACES_API_KEY

  if (!apiKey) {
    return Response.json({
      dealers: [],
      error: 'GOOGLE_PLACES_API_KEY not configured in Vercel. Add it at Vercel → Project → Settings → Environment Variables.',
    })
  }

  try {
    // Step 1: Geocode the ZIP to lat/lng
    const geoRes  = await fetch(
      'https://maps.googleapis.com/maps/api/geocode/json?address=' + encodeURIComponent(zip + ', USA') + '&key=' + apiKey
    )
    const geoData = await geoRes.json()

    if (geoData.status !== 'OK' || !geoData.results?.[0]) {
      return Response.json({ dealers: [], error: 'Location not found for: ' + zip + ' (Geocode status: ' + geoData.status + ')' })
    }

    const { lat, lng } = geoData.results[0].geometry.location
    const locationName  = geoData.results[0].formatted_address

    // Step 2: Search nearby gun stores / FFL dealers using Text Search
    const searchRes  = await fetch(
      'https://maps.googleapis.com/maps/api/place/textsearch/json?query=gun+store+firearms+dealer+near+' +
      encodeURIComponent(zip) + '&location=' + lat + ',' + lng + '&radius=40000&key=' + apiKey
    )
    const searchData = await searchRes.json()

    if (searchData.status !== 'OK' && searchData.status !== 'ZERO_RESULTS') {
      return Response.json({
        dealers: [],
        error: 'Google Places error: ' + searchData.status + ' — ' + (searchData.error_message || 'Check that Places API is enabled in Google Cloud Console'),
      })
    }

    const dealers = (searchData.results || []).slice(0, 20).map(p => ({
      name:     p.name,
      address:  p.formatted_address || p.vicinity || '',
      city:     (p.formatted_address || '').split(',')[1]?.trim() || '',
      state:    (p.formatted_address || '').split(',')[2]?.trim()?.split(' ')[1] || '',
      zip:      (p.formatted_address || '').match(/\b\d{5}\b/)?.[0] || '',
      type:     '01',
      license:  'Verify at atf.gov/firearms/listing-federal-firearms-licensees',
      phone:    p.formatted_phone_number || null,
      rating:   p.rating,
      reviews:  p.user_ratings_total,
      open:     p.opening_hours?.open_now,
      mapsUrl:  'https://www.google.com/maps/place/?q=place_id:' + p.place_id,
      placeId:  p.place_id,
      lat:      p.geometry?.location?.lat,
      lng:      p.geometry?.location?.lng,
    }))

    return Response.json({ dealers, location: locationName, lat, lng, total: dealers.length, mapsKey: apiKey })

  } catch (err) {
    return Response.json({ error: 'Search failed: ' + err.message }, { status: 500 })
  }
}
