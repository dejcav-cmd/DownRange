export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
})

// Returns embeddable JS snippet for gun stores
export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state')?.toUpperCase()
  const format = searchParams.get('format') || 'json'

  if (!state) return Response.json({ error: 'state param required' }, { status: 400 })

  const profile = await sanity.fetch(
    `*[_type=="stateProfile"&&abbr==$abbr][0]{name,abbr,constitutionalCarry,ccwPermit,redFlagLaw,magLimit,waitPeriod,awbStatus,rating}`,
    { abbr: state }
  ).catch(() => null)

  if (!profile) return Response.json({ error: 'State not found' }, { status: 404 })

  if (format === 'js') {
    // Embeddable widget script
    const js = `
(function() {
  var data = ${JSON.stringify(profile)};
  var el = document.getElementById('downrange-widget');
  if (!el) return;
  el.innerHTML = '<div style="font-family:monospace;font-size:12px;background:#111318;color:#F5F5F3;padding:16px;border:1px solid #C8922A40;max-width:320px">' +
    '<div style="color:#C8922A;font-size:14px;font-weight:bold;margin-bottom:10px">⚖ ' + data.name + ' GUN LAWS</div>' +
    '<div style="display:flex;flex-direction:column;gap:6px">' +
    '<div><span style="color:#6B7280">Constitutional Carry:</span> <span style="color:' + (data.constitutionalCarry ? '#34D399' : '#EF4444') + '">' + (data.constitutionalCarry ? 'YES' : 'NO') + '</span></div>' +
    '<div><span style="color:#6B7280">CCW Permit:</span> <span style="color:#D1D5DB">' + (data.ccwPermit || 'Check state') + '</span></div>' +
    '<div><span style="color:#6B7280">Red Flag Law:</span> <span style="color:' + (data.redFlagLaw ? '#EF4444' : '#34D399') + '">' + (data.redFlagLaw ? 'YES' : 'NO') + '</span></div>' +
    (data.magLimit ? '<div><span style="color:#6B7280">Mag Limit:</span> <span style="color:#FBBF24">' + data.magLimit + ' rounds</span></div>' : '') +
    (data.waitPeriod ? '<div><span style="color:#6B7280">Wait Period:</span> <span style="color:#FBBF24">' + data.waitPeriod + '</span></div>' : '') +
    '</div>' +
    '<div style="margin-top:12px;padding-top:10px;border-top:1px solid #1F2428"><a href="https://downrangeco.com/state-hub/' + data.abbr.toLowerCase() + '" target="_blank" style="color:#C8922A;font-size:11px;text-decoration:none">Full ' + data.name + ' law guide → downrangeco.com</a></div>' +
    '</div>';
})();`
    return new Response(js, { headers: { 'Content-Type': 'application/javascript', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'public, max-age=3600' } })
  }

  return Response.json({ ...profile }, { headers: { 'Access-Control-Allow-Origin': '*' } })
}
