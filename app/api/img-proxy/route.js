// /app/api/img-proxy/route.js
// Server-side image proxy for gun.deals CDN images (blocked by hotlink protection)
export const dynamic = 'force-dynamic'

const ALLOWED_HOSTS = [
  'gun.deals',
  'www.gun.deals',
]

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return new Response('Missing url param', { status: 400 })
  }

  // Only proxy allowed hosts
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return new Response('Invalid URL', { status: 400 })
  }

  const hostname = parsed.hostname.replace(/^www\./, '')
  if (!ALLOWED_HOSTS.some(h => h.replace(/^www\./, '') === hostname)) {
    return new Response('Host not allowed', { status: 403 })
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://gun.deals/',
        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return new Response('Upstream error: ' + res.status, { status: 502 })
    }

    const contentType = res.headers.get('content-type') || 'image/jpeg'
    const buffer = await res.arrayBuffer()

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    return new Response('Proxy error: ' + err.message, { status: 502 })
  }
}
