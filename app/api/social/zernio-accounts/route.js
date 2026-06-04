export const dynamic = 'force-dynamic'

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const apiKey = process.env.ZERNIO_API_KEY
  if (!apiKey) return Response.json({ ok: false, error: 'ZERNIO_API_KEY not set in Vercel env vars' })

  try {
    const res  = await fetch('https://zernio.com/api/v1/accounts', {
      headers: { 'Authorization': `Bearer ${apiKey}` }
    })
    const data = await res.json()
    if (!res.ok) return Response.json({ ok: false, error: data.message || data.error || `Zernio error ${res.status}` })
    // Return simplified list
    const accounts = (data.accounts || data.data || []).map(a => ({
      id:       a._id || a.id,
      platform: a.platform,
      name:     a.name || a.username || a.handle || a.displayName || a.accountName,
    }))
    return Response.json({ ok: true, accounts })
  } catch (e) {
    return Response.json({ ok: false, error: e.message })
  }
}
