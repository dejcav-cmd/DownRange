/**
 * Newsletter Preview Send
 * Auth: Authorization: Bearer {SANITY_API_TOKEN}
 * POST { to: "email@example.com" }
 * Generates a live newsletter from current content and sends it.
 */
export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

function getResend() {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token || token !== process.env.SANITY_API_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to } = await req.json().catch(() => ({}))
  const recipient = to || 'dj@downrangeco.com'

  const [stories, deals, alerts] = await Promise.all([
    sanity.fetch(`*[_type=="newsArticle" && defined(slug.current) && defined(publishedAt)] | order(urgencyScore desc, publishedAt desc) [0...5] { title, slug, summary, category, urgencyScore }`).catch(() => []),
    sanity.fetch(`*[_type=="gunDeal"] | order(_createdAt desc) [0...3] { title, name, price, store }`).catch(() => []),
    sanity.fetch(`*[_type=="breakingAlert" && active==true] | order(_createdAt desc) [0...2] { text, title }`).catch(() => []),
  ])

  const date = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const CAT_COLOR = { breaking: '#EF4444', law: '#60A5FA', industry: '#C8922A', news: '#9CA3AF', opinion: '#C084FC', training: '#34D399', review: '#C8922A' }

  const alertsHtml = alerts.length > 0 ? `
    <div style="background:#2a0000;border:1px solid #EF4444;border-left:4px solid #EF4444;padding:14px 18px;margin-bottom:24px;">
      <div style="font-family:monospace;font-size:10px;color:#EF4444;letter-spacing:0.15em;font-weight:700;margin-bottom:8px;">⚡ BREAKING ALERTS</div>
      ${alerts.map(a => `<div style="font-family:Arial,sans-serif;font-size:13px;color:#F5F5F3;margin-bottom:4px;">• ${a.text || a.title || ''}</div>`).join('')}
    </div>` : ''

  const storiesHtml = stories.map((s, i) => `
    <div style="border-bottom:1px solid #1F2428;padding:18px 0;${i === 0 ? 'padding-top:0;' : ''}">
      <div style="font-family:monospace;font-size:10px;color:${CAT_COLOR[s.category] || '#9CA3AF'};letter-spacing:0.12em;font-weight:700;margin-bottom:6px;">${(s.category || 'NEWS').toUpperCase()}</div>
      <h3 style="font-family:Arial,sans-serif;font-size:${i === 0 ? '20px' : '16px'};color:#F5F5F3;margin:0 0 8px;line-height:1.35;font-weight:700;">
        <a href="https://www.downrangeco.com/news/${s.slug?.current}" style="color:#F5F5F3;text-decoration:none;">${s.title}</a>
      </h3>
      ${s.summary ? `<p style="font-family:Arial,sans-serif;font-size:13px;color:#94A3B8;margin:0 0 10px;line-height:1.6;">${s.summary}</p>` : ''}
      <a href="https://www.downrangeco.com/news/${s.slug?.current}" style="font-family:monospace;font-size:11px;color:#C8922A;text-decoration:none;letter-spacing:0.06em;">READ MORE →</a>
    </div>`).join('')

  const dealsHtml = deals.length > 0 ? `
    <div style="background:#111318;border:1px solid #1F2428;padding:20px;margin:24px 0;">
      <div style="font-family:monospace;font-size:10px;color:#C8922A;letter-spacing:0.15em;font-weight:700;margin-bottom:16px;border-bottom:1px solid #1F2428;padding-bottom:10px;">🔥 TOP GUN DEALS THIS WEEK</div>
      ${deals.map(d => `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #1F2428;">
          <div>
            <div style="font-family:Arial,sans-serif;font-size:13px;color:#F5F5F3;font-weight:600;margin-bottom:2px;">${d.title || d.name || ''}</div>
            ${d.store ? `<div style="font-family:monospace;font-size:10px;color:#4B5563;">${d.store}</div>` : ''}
          </div>
          ${d.price ? `<div style="font-family:Arial,sans-serif;font-size:18px;color:#34D399;font-weight:700;white-space:nowrap;margin-left:12px;">$${d.price}</div>` : ''}
        </div>`).join('')}
      <a href="https://www.downrangeco.com/deals" style="display:inline-block;margin-top:14px;font-family:monospace;font-size:11px;color:#C8922A;text-decoration:none;letter-spacing:0.06em;">ALL DEALS →</a>
    </div>` : ''

  const topTitle = stories[0]?.title || ''
  const subject = alerts.length > 0
    ? `🚨 ${(alerts[0].text || alerts[0].title || '').slice(0, 60)} — DownRange Alert`
    : `${topTitle.slice(0, 65)} — DownRange Brief`

  const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09090B;">
<div style="max-width:620px;margin:0 auto;background:#09090B;">
  <div style="background:#0D1117;border-bottom:2px solid #C8922A;padding:24px 28px;text-align:center;">
    <div style="font-family:Arial,sans-serif;font-size:42px;font-weight:900;color:#C8922A;letter-spacing:6px;line-height:1;">DOWNRANGE</div>
    <div style="font-family:monospace;font-size:10px;color:#4B5563;letter-spacing:0.12em;margin-top:4px;">AMERICA'S FIREARMS INTELLIGENCE HUB</div>
    <div style="font-family:monospace;font-size:10px;color:#374151;margin-top:8px;">${date}</div>
  </div>
  <div style="padding:28px;">
    ${alertsHtml}
    <div style="font-family:monospace;font-size:10px;color:#C8922A;letter-spacing:0.15em;font-weight:700;margin-bottom:16px;border-bottom:1px solid #1F2428;padding-bottom:10px;">TOP STORIES</div>
    ${storiesHtml}
    ${dealsHtml}
    <div style="background:#111318;border:1px solid #1F2428;padding:20px;text-align:center;margin:24px 0;">
      <div style="font-family:monospace;font-size:11px;color:#4B5563;margin-bottom:12px;">TOOLS WORTH BOOKMARKING</div>
      <div>
        ${[['Ballistics Calc','/ballistics'],['Range Finder','/ranges'],['Gun Value Est.','/value-estimator'],['NFA Wait Times','/nfa-tracker'],['State Gun Laws','/laws']].map(([l,p])=>`<a href="https://www.downrangeco.com${p}" style="font-family:monospace;font-size:10px;color:#C8922A;background:#09090B;border:1px solid #2A2F38;padding:6px 10px;text-decoration:none;letter-spacing:0.06em;display:inline-block;margin:3px;">${l}</a>`).join('')}
      </div>
    </div>
  </div>
  <div style="background:#0D1117;border-top:1px solid #1F2428;padding:18px 28px;text-align:center;">
    <div style="font-family:monospace;font-size:10px;color:#374151;margin-bottom:8px;">DownRange · downrangeco.com · DJ Cavalcanti, Founder</div>
    <div style="font-family:monospace;font-size:10px;color:#374151;">
      <a href="https://www.downrangeco.com/unsubscribe" style="color:#4B5563;text-decoration:underline;">Unsubscribe</a>
      &nbsp;·&nbsp;
      <a href="https://www.downrangeco.com/privacy" style="color:#4B5563;text-decoration:underline;">Privacy Policy</a>
    </div>
  </div>
</div>
</body></html>`

  if (!process.env.RESEND_API_KEY) {
    return Response.json({ ok: false, error: 'RESEND_API_KEY not set', subject, stories: stories.length })
  }

  const resend = getResend()
  await resend.emails.send({
    from: 'DownRange <news@downrangeco.com>',
    to: recipient,
    subject: `[PREVIEW] ${subject}`,
    html,
  })

  return Response.json({ ok: true, subject, to: recipient, stories: stories.length, deals: deals.length, alerts: alerts.length })
}
