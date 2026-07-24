/**
 * POST /api/admin/test-sms  — sends a live test alert email
 * GET  /api/admin/test-sms  — HTML diagnostic page
 *
 * Renamed endpoint kept at the same URL for backward compatibility with
 * any admin bookmarks. Now uses Resend email instead of Twilio SMS.
 */
export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { sendCronAlert, getCronAlertStatus } from '@/lib/cronAlert'

const ADMIN_KEY = process.env.ADMIN_KEY ?? process.env.AGENT_SECRET ?? 'drco-admin'

function auth(req) {
  const url = new URL(req.url)
  return (req.headers.get('x-admin-key') ?? url.searchParams.get('key')) === ADMIN_KEY
}

function html(body, status = 200) {
  return new NextResponse(
    `<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Alert Diagnostic — DownRange</title>
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
  const url    = new URL(req.url)
  const key    = url.searchParams.get('key') ?? ''
  const authed = key === ADMIN_KEY
  const cfg    = getCronAlertStatus()

  const row = (k, v, ok) => `<tr><td>${k}</td><td class="${ok ? 'ok' : 'bad'}">${v}</td></tr>`

  const authSection = authed
    ? `<div class="card"><p class="ok">Authenticated ✓ — ready to send a test alert.</p>
        <form method="POST" action="/api/admin/test-sms?key=${key}">
          <button class="btn" type="submit">SEND TEST ALERT NOW</button>
        </form></div>`
    : `<div class="card"><p class="warn">Enter admin key to send a test:</p>
        <form method="GET" action="/api/admin/test-sms" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
          <input name="key" type="text" placeholder="Admin key" style="flex:1;min-width:200px;background:#1C2028;border:1px solid #2A2F38;color:#E5E5E5;padding:10px 12px;font:13px monospace;outline:none">
          <button class="btn" type="submit">VERIFY</button>
        </form></div>`

  return html(`
    <h2>⬡ DownRange Alert Diagnostic</h2>
    <p style="font-size:11px;color:#4b5563;margin-bottom:16px">Cron failure alerts via Resend email</p>
    ${authSection}
    <h3>Alert Configuration</h3>
    <table>
      ${row('Provider',       cfg.provider, true)}
      ${row('RESEND_API_KEY', cfg.configured ? 'Set ✓' : 'NOT SET IN VERCEL', cfg.configured)}
      ${row('Alert email',    cfg.alertEmail, true)}
      ${row('Alerts enabled', cfg.enabled ? 'true ✓' : 'false (disabled)', cfg.enabled)}
      ${row('Cooldown',       `${cfg.cooldownSecs}s (${Math.round(cfg.cooldownSecs / 60)} min)`, true)}
    </table>
    ${!cfg.configured
      ? `<div class="card">
          <p class="bad">⚠ RESEND_API_KEY not set — alert emails cannot send.</p>
          <p style="margin-top:10px;font-size:12px;color:#9ca3af">
            Add <code>RESEND_API_KEY</code> in
            <a href="https://vercel.com/dejcav-cmd/downrangeco/settings/environment-variables" target="_blank">Vercel → Settings → Env Vars</a>,
            then redeploy.
          </p>
        </div>`
      : `<div class="card"><p class="ok">✓ Resend configured. Alert emails will reach ${cfg.alertEmail}.</p></div>`
    }
    <hr>
    <p style="font-size:11px;color:#4b5563">Alerts trigger after 3 consecutive feed failures. See Mission Control for cron status.</p>
  `)
}

export async function POST(req) {
  const url    = new URL(req.url)
  const urlKey = url.searchParams.get('key')
  const hdrKey = req.headers.get('x-admin-key')
  const ct     = req.headers.get('content-type') ?? ''
  let bodyKey  = ''

  if (ct.includes('application/json')) {
    const b = await req.json().catch(() => ({}))
    bodyKey = b.key ?? ''
  }

  const key = urlKey ?? hdrKey ?? bodyKey
  if (key !== ADMIN_KEY) {
    const accept = req.headers.get('accept') ?? ''
    if (accept.includes('text/html') || ct.includes('form')) {
      return html(`<h2>⬡ DownRange Alert Diagnostic</h2><p class="bad">Wrong admin key. <a href="/api/admin/test-sms">Try again</a></p>`, 401)
    }
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const msg    = `DownRange — test alert OK\n${new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' })} PT`
  const result = await sendCronAlert(msg, {
    jobId: 'alert-test',
    bypassCooldown: true,
    context: {
      error: 'TypeError: Cannot read properties of undefined (reading \'slug\')',
      stack: `TypeError: Cannot read properties of undefined (reading 'slug')
    at buildArticle (/app/api/agent/route.js:84:22)
    at processQueue (/app/api/agent/route.js:142:18)
    at async handler (/app/api/agent/route.js:31:5)`,
      meta: {
        triggeredBy: 'Manual test via /api/admin/test-sms',
        env: process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? 'unknown',
        nodeVersion: process.version,
        timestamp: new Date().toISOString(),
      },
    },
  })

  const accept = req.headers.get('accept') ?? ''
  if (accept.includes('text/html') || ct.includes('form')) {
    return html(`
      <h2>⬡ ALERT TEST RESULT</h2>
      <div class="card">
        ${result.sent
          ? `<p class="ok">✓ ALERT EMAIL SENT</p>
             <p style="margin-top:8px;font-size:12px;color:#9ca3af">Check <strong style="color:#e5e7eb">dejcav@gmail.com</strong> for the test alert.</p>`
          : `<p class="bad">✕ ALERT FAILED</p>
             <table>
               <tr><td>Error</td><td class="bad">${result.error ?? result.reason ?? 'Unknown'}</td></tr>
             </table>
             ${(result.reason || '').includes('RESEND_API_KEY')
               ? '<p class="warn" style="margin-top:12px">→ RESEND_API_KEY not set in Vercel.</p>'
               : ''
             }`
        }
      </div>
      <p><a href="/api/admin/test-sms?key=${key}">← Back to diagnostic</a></p>
    `)
  }

  return NextResponse.json(result)
}
