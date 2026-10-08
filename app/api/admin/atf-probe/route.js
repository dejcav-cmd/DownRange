export const dynamic = 'force-dynamic'
export const maxDuration = 60
// TEMPORARY probe: can a Vercel function reach atf.gov's FFL listing form?
const URL0 = 'https://www.atf.gov/firearms/tools-and-services-firearms-industry/federal-firearms-listings'
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
export async function GET(req) {
  const out = {}
  try {
    const g = await fetch(URL0, { headers: { 'user-agent': UA, accept: 'text/html,*/*', 'accept-language': 'en-US,en;q=0.9' }, redirect: 'follow' })
    const html = await g.text()
    out.get = { status: g.status, len: html.length }
    const m = html.match(/name="form_build_id"[^>]*value="([^"]+)"/) || html.match(/value="([^"]+)"[^>]*name="form_build_id"/)
    out.formBuildId = m ? m[1].slice(0, 12) : null
    out.cookie = !!g.headers.get('set-cookie')
    if (m) {
      const body = new URLSearchParams({ year: '26', month: '09', state: 'RI', form_build_id: m[1], form_id: 'ffl-listing-export-form', op: 'Apply' })
      const p = await fetch(URL0, { method: 'POST', body, headers: { 'user-agent': UA, 'content-type': 'application/x-www-form-urlencoded', referer: URL0, origin: 'https://www.atf.gov', cookie: (g.headers.get('set-cookie') || '').split(',').map(c => c.split(';')[0]).join('; ') }, redirect: 'manual' })
      const t = await p.text()
      out.post = { status: p.status, ct: p.headers.get('content-type'), loc: p.headers.get('location'), len: t.length, head: t.slice(0, 300) }
    }
  } catch (e) { out.error = e.message }
  return Response.json(out)
}
