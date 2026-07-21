/**
 * POST /api/admin/test-sms  — sends a live test SMS with ?key= or x-admin-key
 * GET  /api/admin/test-sms  — HTML diagnostic page (same as shop)
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { sendSMSAlert, getSMSConfigStatus } from '@/lib/smsAlert'

const ADMIN_KEY = process.env.ADMIN_KEY ?? process.env.AGENT_SECRET ?? 'drco-admin'

function auth(req) {
  const url = new URL(req.url)
  return (req.headers.get('x-admin-key') ?? url.searchParams.get('key')) === ADMIN_KEY
}

function hashKey(k) {
  let h = 0
  for (let i = 0; i < k.length; i++) h = ((h << 5) - h + k.charCodeAt(i)) | 0
  return Math.abs(h).toString(16).slice(0, 6)
}

function html(body, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SMS Diagnostic — DownRange-News</title>
    <style>*{box-sizing:border-box;margin:0;padding:0}body{font:14px/1.7 monospace;padding:32px 24px;background:#09090B;color:#E5E5E5;max-width:640px}
    h2{font:900 22px 'Barlow Condensed',sans-serif;color:#C8922A;letter-spacing:.1em;margin-bottom:4px;text-transform:uppercase}
    h3{font:700 13px sans-serif;color:#e0a830;margin:16px 0 8px;letter-spacing:.06em;text-transform:uppercase}
    table{width:100%;border-collapse:collapse;margin-bottom:20px}td{padding:7px 10px 7px 0;border-bottom:1px solid #1F2428;vertical-align:top}
    td:first-child{color:#9CA3AF;width:220px;font-size:12px}.ok{color:#6adb8a}.bad{color:#e08080}.warn{color:#e0a830}
    .btn{display:inline-block;background:#C8922A;color:#09090B;border:none;padding:11px 24px;font:700 12px monospace;letter-spacing:.1em;cursor:pointer;text-transform:uppercase;text-decoration:none}
    .btn:hover{background:#E5A83A}.card{background:#111318;border:1px solid #1F2428;padding:16px;margin-bottom:16px}
    hr{border:none;border-top:1px solid #1F2428;margin:20px 0}p{margin-bottom:10px;color:#9CA3AF}a{color:#C8922A}
    code{color:#C8922A}</style>
    </head><body>${body}</body></html>`,
    { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
  )
}

export async function GET(req) {
  const url     = new URL(req.url)
  const key     = url.searchParams.get('key') ?? ''
  const authed  = key === ADMIN_KEY
  const srvHash = hashKey(ADMIN_KEY)
  const cfg     = getSMSConfigStatus()

  const row = (k, v, ok) => `<tr><td>${k}</td><td class="${ok ? 'ok' : 'bad'}">${v}</td></tr>`

  const authSection = authed
    ? `<div class="card"><p class="ok">Authenticated ✓ — ready to send.</p>
        <form method="POST" action="/api/admin/test-sms?key=${key}">
          <button class="btn" type="submit">SEND TEST SMS NOW</button>
        </form></div>`
    : `<div class="card"><p class="warn">Enter admin key to send a test:</p>
        <form method="GET" action="/api/admin/test-sms" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <input name="key" type="text" placeholder="Admin key" style="flex:1;min-width:200px;background:#1C2028;border:1px solid #2A2F38;color:#E5E5E5;padding:10px 12px;font:13px monospace;outline:none">
          <button class="btn" type="submit">VERIFY</button>
        </form>
        <p style="margin-top:10px;font-size:11px;color:#6B7280">
          Server hash: <code>${srvHash}</code> &nbsp;—&nbsp;
          ${key ? `Your hash: <code style="color:${hashKey(key)===srvHash?'#6adb8a':'#e08080'}">${hashKey(key)}</code> ${hashKey(key)===srvHash?'(matches)':'(no match)'}` : 'No key provided'}
        </p></div>`

  return html(`
    <h2>⬡ DownRange-News SMS Diagnostic</h2>
    <p style="font-size:11px;color:#4b5563;margin-bottom:16px">downrangeco.com · news portal</p>
    ${authSection}
    <h3>Twilio Configuration</h3>
    <table>
      ${row('TWILIO_ACCOUNT_SID',  cfg.sidSet   ? 'Set ✓'          : 'NOT SET IN VERCEL', cfg.sidSet)}
      ${row('TWILIO_AUTH_TOKEN',   cfg.tokenSet ? 'Set ✓'          : 'NOT SET IN VERCEL', cfg.tokenSet)}
      ${row('TWILIO_FROM_NUMBER',  cfg.from     ? cfg.from + ' ✓'  : 'NOT SET IN VERCEL', !!cfg.from)}
      ${row('ALERT_PHONE_NUMBER',  cfg.to       ? cfg.to + ' ✓'    : 'NOT SET IN VERCEL', !!cfg.to)}
      ${row('SMS_ALERTS_ENABLED',  cfg.enabled  ? 'true ✓'         : 'false (disabled)',  cfg.enabled)}
      ${row('Cooldown',            `${cfg.cooldownSecs}s (${Math.round(cfg.cooldownSecs/60)}min)`, true)}
      ${row('Quiet Hours (UTC)',   `${cfg.quietStart}:00 – ${cfg.quietEnd}:00`, true)}
      ${row('Critical Jobs',       cfg.criticalJobs.join(', '), true)}
    </table>
    ${!cfg.configured ? `<div class="card">
      <p class="bad">⚠ Twilio credentials not configured — SMS alerts cannot send.</p>
      <h3 style="color:#ef4444;margin-top:12px">Setup Steps</h3>
      <ol style="padding-left:16px;margin-top:8px;color:#9ca3af;font-size:12px;line-height:2">
        <li>Go to <a href="https://console.twilio.com" target="_blank">console.twilio.com</a> → get Account SID + Auth Token</li>
        <li>Buy or verify a Twilio phone number (or use the existing +12062036281)</li>
        <li>Go to <a href="https://vercel.com/dejcav-cmd/downrangeco/settings/environment-variables" target="_blank">Vercel → downrangeco → Settings → Env Vars</a></li>
        <li>Add these four variables (all environments):<br>
          <code style="display:block;margin-top:6px;background:#1c2028;padding:10px;line-height:2.2">
            TWILIO_ACCOUNT_SID = ACxxxxxxxxxxxxxxxx<br>
            TWILIO_AUTH_TOKEN  = (from Twilio Console)<br>
            TWILIO_FROM_NUMBER = +12062036281<br>
            ALERT_PHONE_NUMBER = +12066016076
          </code>
        </li>
        <li>Redeploy: Vercel → downrangeco → Deployments → ⋯ → Redeploy</li>
      </ol>
    </div>` : `<div class="card"><p class="ok">✓ All credentials configured. Ready to send.</p></div>`}
    <hr>
    <p style="font-size:11px;color:#4b5563">Configure alert preferences in Admin → System → SMS Alerts</p>
  `)
}

export async function POST(req) {
  const url = new URL(req.url)
  const urlKey  = url.searchParams.get('key')
  const hdrKey  = req.headers.get('x-admin-key')
  const ct      = req.headers.get('content-type') ?? ''
  let bodyKey   = ''

  if (ct.includes('application/json')) {
    const b = await req.json().catch(() => ({}))
    bodyKey = b.key ?? ''
  }

  const key = urlKey ?? hdrKey ?? bodyKey
  if (key !== ADMIN_KEY) {
    const accept = req.headers.get('accept') ?? ''
    if (accept.includes('text/html') || ct.includes('form')) {
      return html(`<h2>⬡ DownRange-News SMS Diagnostic</h2><p class="bad">Wrong admin key. <a href="/api/admin/test-sms">Try again</a></p>`, 401)
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const msg    = `🟢 DownRange-News — SMS test OK\n${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT`
  const result = await sendSMSAlert(msg, { jobId: 'sms-test', bypassCooldown: true, critical: true })

  const accept = req.headers.get('accept') ?? ''
  if (accept.includes('text/html') || ct.includes('form')) {
    const ok = result.sent
    return html(`
      <h2>⬡ SMS TEST RESULT</h2>
      <div class="card">
        ${ok
          ? `<p class="ok">✓ SMS SENT SUCCESSFULLY</p>
             <table>
               <tr><td>Twilio SID</td><td class="ok">${result.sid}</td></tr>
               <tr><td>Status</td><td class="ok">${result.status}</td></tr>
               <tr><td>Latency</td><td class="ok">${result.ms}ms</td></tr>
             </table>`
          : `<p class="bad">✕ SMS FAILED</p>
             <table>
               <tr><td>Error</td><td class="bad">${result.error ?? result.reason ?? 'Unknown'}</td></tr>
               <tr><td>HTTP Status</td><td class="warn">${result.httpStatus ?? '—'}</td></tr>
             </table>
             ${(result.reason||'').includes('Missing') ? '<p class="warn" style="margin-top:12px">→ Twilio credentials not set in Vercel. See setup instructions on the diagnostic page.</p>' : ''}
             ${result.httpStatus === 401 ? '<p class="warn" style="margin-top:8px">→ Wrong TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN. Check Twilio Console.</p>' : ''}
             ${result.httpStatus === 400 ? '<p class="warn" style="margin-top:8px">→ Invalid phone number or Twilio config. Verify TWILIO_FROM_NUMBER and ALERT_PHONE_NUMBER.</p>' : ''}`
        }
      </div>
      <p><a href="/api/admin/test-sms?key=${key}">← Back to diagnostic</a></p>
    `)
  }

  return NextResponse.json(result)
}
