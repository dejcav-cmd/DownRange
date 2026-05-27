import { callAIText } from '@/lib/aiClient.js'
import { reportCronRun } from '@/lib/cronReporter'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * GET /api/intelligence
 * Runs nightly at midnight via Vercel cron.
 * 
 * Pipeline:
 *   1. Research competitors & firearms media landscape via web search
 *   2. Check trending 2A / firearms topics
 *   3. Audit DownRange's current content coverage
 *   4. Send everything to Claude for analysis
 *   5. Claude generates: competitor gaps, recommendations, content ideas, issues
 *   6. Save to Sanity as a dailyBriefing document
 *   7. Email digest to dejcav@gmail.com
 *
 * Secured by CRON_SECRET or ADMIN_KEY.
 */

import { createClient } from '@sanity/client'
import { Resend }        from 'resend'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const getResend = () => new Resend(process.env.RESEND_API_KEY || "re_placeholder")

// ── Auth ──────────────────────────────────────────────────────────────────────
function isAuthorized(req) {
  const auth = req.headers.get('authorization')
  const cron = req.headers.get('x-vercel-cron')
  const key  = req.headers.get('x-admin-key')
  return cron === '1'
    || (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`)
    || key === process.env.ADMIN_KEY
}

// ── Web search via Anthropic API with web_search tool ─────────────────────────
async function webSearch(query) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5',
        max_tokens: 1500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{
          role: 'user',
          content: `Search for: ${query}\n\nReturn a concise factual summary of the top findings. Focus on specific features, content, and capabilities.`
        }],
      }),
    })
    const d = await res.json()
    return d.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || ''
  } catch (err) {
    return `Search failed: ${err.message}`
  }
}

// ── Gather site data from Sanity ───────────────────────────────────────────────
async function gatherSiteData() {
  const [articles, releases, laws, reviews, videos] = await Promise.all([
    sanity.fetch(`count(*[_type == "newsArticle" && approved == true])`),
    sanity.fetch(`count(*[_type == "firearmRelease"])`),
    sanity.fetch(`count(*[_type == "legislation"])`),
    sanity.fetch(`count(*[_type == "review"])`),
    sanity.fetch(`count(*[_type == "video"])`),
  ])

  const recentArticles = await sanity.fetch(
    `*[_type == "newsArticle" && approved == true] | order(publishedAt desc) [0...10] { title, category, publishedAt }`
  )

  const missingImages = await sanity.fetch(
    `count(*[_type == "newsArticle" && approved == true && (!defined(imageUrl) || imageUrl == "")])`
  )

  return {
    articles, releases, laws, reviews, videos, missingImages,
    recentTopics: recentArticles.map(a => a.title).slice(0, 10),
  }
}

// ── Main analysis via Claude ───────────────────────────────────────────────────
async function runAnalysis({ competitorData, trendingData, siteData, today }) {
  const prompt = `You are the chief intelligence analyst for DownRange — America's independent firearms and Second Amendment portal (downrangeco.com). 

Today's date: ${today}

SITE DATA:
- Published articles: ${siteData.articles}
- Firearm releases tracked: ${siteData.releases}
- Laws/legislation tracked: ${siteData.laws}
- Reviews: ${siteData.reviews}
- Videos indexed: ${siteData.videos}
- Articles missing images: ${siteData.missingImages}
- Recent article topics: ${siteData.recentTopics.join(', ')}

COMPETITOR & MARKET RESEARCH (from web searches today):
${competitorData}

TRENDING TOPICS RESEARCH:
${trendingData}

DownRange's mission: Grow the Second Amendment and firearms community. We cover breaking news, legislation, new releases, market data, state laws, training, and community. We are independent — no manufacturer money, no political funding. Our audience is gun owners, dealers, instructors, and 2A advocates.

Current pages: Home, News, Laws, Reviews, Guns (encyclopedia), Releases, Market, Deals, Ranges, FFL Finder, CCW Insurance, Video, Learning Center, Training, Hunting, Precision, Preparedness, Safe Storage, State Hub, NFA Tracker, Compare, Value Estimator, Holsters, Blog, Press, Canada.

Analyze everything and return ONLY a valid JSON object with this exact structure (no markdown, no preamble):

{
  "score": 82,
  "headline": "One sharp sentence describing the most important finding today",
  "summary": "3-4 sentences executive summary. Be direct and specific.",
  "competitorFindings": [
    {
      "source": "The Truth About Guns / TTAG",
      "finding": "What they have or are doing that's notable",
      "gap": "Our gap or specific opportunity to beat them",
      "priority": "high"
    }
  ],
  "recommendations": [
    {
      "category": "features",
      "title": "Short title of the recommendation",
      "why": "Specific reason this matters for DownRange's audience and mission",
      "howTo": "Concrete implementation steps — specific enough to act on",
      "effort": "quick-win",
      "impact": "high"
    }
  ],
  "issues": [
    {
      "severity": "medium",
      "page": "/news",
      "issue": "Specific issue description"
    }
  ],
  "contentGaps": [
    {
      "topic": "Specific topic or keyword",
      "volume": "Trend signal or estimated search volume",
      "angle": "Specific angle DownRange should cover — what makes our take unique",
      "urgency": "timely"
    }
  ]
}

Rules:
- competitorFindings: 4-6 items covering TTAG, AmmoLand, Pew Pew Tactical, The Firearm Blog, NRA publications, Gun Digest, and any others found in research
- recommendations: 6-10 items, mix of quick wins and strategic moves, always specific and actionable
- issues: any real problems found in today's data (missing images, coverage gaps, stale data)
- contentGaps: 5-8 trending topics or searches that DownRange doesn't cover or covers poorly
- Be direct and critical. Don't say "consider" — say what to do and why.
- score: honest 0-100 rating of overall site health and competitive position today`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const d = await res.json()
  const raw = d.content?.[0]?.text || '{}'
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

// ── Send email digest ─────────────────────────────────────────────────────────
async function sendDigestEmail(briefing, today) {
  const recBadge = (effort, impact) => {
    const c = impact === 'high' ? '#22c55e' : impact === 'medium' ? '#f59e0b' : '#6b7280'
    return `<span style="background:${c}22;color:${c};border:1px solid ${c}44;padding:1px 7px;font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${impact} impact · ${effort}</span>`
  }
  const sevColor = s => ({ critical:'#ef4444', high:'#f97316', medium:'#f59e0b', low:'#6b7280' }[s] || '#6b7280')

  const recsHtml = (briefing.recommendations || []).map(r => `
    <tr style="border-bottom:1px solid #1f2428;">
      <td style="padding:10px 12px;">
        <div style="font-size:13px;color:#e5e7eb;font-weight:700;margin-bottom:3px;">${r.title}</div>
        <div style="font-size:11px;color:#9ca3af;line-height:1.6;margin-bottom:4px;">${r.why}</div>
        <div style="font-size:10px;color:#6b7280;font-style:italic;">${r.howTo?.slice(0, 120)}${r.howTo?.length > 120 ? '...' : ''}</div>
      </td>
      <td style="padding:10px 12px;text-align:right;white-space:nowrap;vertical-align:top;">
        ${recBadge(r.effort, r.impact)}
        <div style="font-size:10px;color:#6b7280;margin-top:3px;">${r.category}</div>
      </td>
    </tr>`).join('')

  const gapsHtml = (briefing.contentGaps || []).map(g => `
    <tr style="border-bottom:1px solid #1f2428;">
      <td style="padding:8px 12px;font-size:13px;color:#e5e7eb;font-weight:700;">${g.topic}</td>
      <td style="padding:8px 12px;font-size:11px;color:#9ca3af;">${g.angle}</td>
      <td style="padding:8px 12px;font-size:10px;color:#C8922A;white-space:nowrap;">${g.urgency} · ${g.volume || ''}</td>
    </tr>`).join('')

  const issuesHtml = (briefing.issues || []).map(i => `
    <div style="padding:8px 12px;border-left:3px solid ${sevColor(i.severity)};background:${sevColor(i.severity)}11;margin-bottom:6px;">
      <span style="font-size:10px;color:${sevColor(i.severity)};font-weight:700;text-transform:uppercase;">${i.severity}</span>
      <span style="font-size:11px;color:#9ca3af;margin-left:8px;">${i.page}</span>
      <div style="font-size:12px;color:#e5e7eb;margin-top:3px;">${i.issue}</div>
    </div>`).join('')

  const competitorHtml = (briefing.competitorFindings || []).map(c => `
    <tr style="border-bottom:1px solid #1f2428;">
      <td style="padding:8px 12px;font-size:12px;color:#C8922A;font-weight:700;white-space:nowrap;">${c.source}</td>
      <td style="padding:8px 12px;font-size:11px;color:#9ca3af;">${c.finding}</td>
      <td style="padding:8px 12px;font-size:11px;color:#e5e7eb;">${c.gap}</td>
    </tr>`).join('')

  const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;color:#e5e7eb;">
<div style="max-width:720px;margin:0 auto;background:#0A0B0C;border:1px solid #1f2428;">

  <!-- Header -->
  <div style="background:#0A0B0C;border-bottom:3px solid #C8922A;padding:24px 32px;">
    <div style="display:flex;align-items:center;justify-content:space-between;">
      <div>
        <div style="font-family:Georgia,serif;font-size:24px;font-weight:900;color:#C8922A;letter-spacing:0.1em;">DOWNRANGE</div>
        <div style="font-size:10px;color:#6b7280;letter-spacing:0.2em;margin-top:2px;">DAILY INTELLIGENCE BRIEFING</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:28px;font-weight:900;color:${briefing.score >= 80 ? '#22c55e' : briefing.score >= 60 ? '#f59e0b' : '#ef4444'};">${briefing.score}/100</div>
        <div style="font-size:10px;color:#6b7280;">SITE HEALTH SCORE</div>
      </div>
    </div>
    <div style="margin-top:16px;font-size:14px;color:#e5e7eb;line-height:1.6;border-left:3px solid #C8922A;padding-left:14px;">
      <strong>${briefing.headline}</strong>
    </div>
    <div style="margin-top:8px;font-size:12px;color:#9ca3af;line-height:1.7;">${briefing.summary}</div>
    <div style="margin-top:16px;">
      <a href="https://www.downrangeco.com/admin" style="background:#C8922A;color:#000;padding:8px 18px;text-decoration:none;font-weight:700;font-size:12px;letter-spacing:.06em;display:inline-block;">OPEN MISSION CONTROL →</a>
    </div>
  </div>

  <!-- Issues -->
  ${(briefing.issues?.length > 0) ? `
  <div style="padding:20px 32px;border-bottom:1px solid #1f2428;">
    <div style="font-size:11px;color:#ef4444;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;">⚠ ISSUES FOUND</div>
    ${issuesHtml}
  </div>` : ''}

  <!-- Recommendations -->
  <div style="padding:20px 32px;border-bottom:1px solid #1f2428;">
    <div style="font-size:11px;color:#C8922A;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;">⚡ RECOMMENDATIONS (${(briefing.recommendations || []).length})</div>
    <table style="width:100%;border-collapse:collapse;">
      <tbody>${recsHtml}</tbody>
    </table>
  </div>

  <!-- Content gaps -->
  <div style="padding:20px 32px;border-bottom:1px solid #1f2428;">
    <div style="font-size:11px;color:#3b82f6;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;">📝 CONTENT GAPS & TRENDING TOPICS</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #C8922A;">
          <th style="padding:6px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">TOPIC</th>
          <th style="padding:6px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">ANGLE</th>
          <th style="padding:6px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">URGENCY</th>
        </tr>
      </thead>
      <tbody>${gapsHtml}</tbody>
    </table>
  </div>

  <!-- Competitor intel -->
  <div style="padding:20px 32px;border-bottom:1px solid #1f2428;">
    <div style="font-size:11px;color:#a855f7;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;">🔍 COMPETITOR INTELLIGENCE</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #C8922A;">
          <th style="padding:6px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">SOURCE</th>
          <th style="padding:6px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">WHAT THEY HAVE</th>
          <th style="padding:6px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">OUR OPPORTUNITY</th>
        </tr>
      </thead>
      <tbody>${competitorHtml}</tbody>
    </table>
  </div>

  <!-- Footer -->
  <div style="padding:16px 32px;font-size:10px;color:#374151;line-height:1.8;">
    Generated ${today} at midnight · DownRange Intelligence Engine · <a href="https://www.downrangeco.com/admin" style="color:#C8922A;">Mission Control</a>
  </div>

</div>
</body>
</html>`

  return getResend().emails.send({
    from:    'DownRange Intelligence <intelligence@downrangeco.com>',
    to:      ['dejcav@gmail.com'],
    subject: `[DownRange] Daily Briefing — ${today} · Score: ${briefing.score}/100`,
    html,
  })
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const today = new Date().toISOString().split('T')[0]
  let briefingId = null
  const errors = []

  // Create initial record
  const initial = await sanity.create({
    _type: 'dailyBriefing',
    date:   today,
    runAt:  new Date().toISOString(),
    status: 'running',
  })
  briefingId = initial._id

  try {
    console.log('[intelligence] Starting daily briefing run:', today)

    // Step 1: Gather site data
    const siteData = await gatherSiteData()
    console.log('[intelligence] Site data gathered:', siteData)

    // Step 2: Research competitors (parallel web searches)
    console.log('[intelligence] Researching competitors...')
    const [
      ttag, ammoland, pewpew, tfb, nra, gundigest, trending1, trending2, trending3
    ] = await Promise.allSettled([
      webSearch('The Truth About Guns site:thetruthaboutguns.com new features content 2025 2026'),
      webSearch('AmmoLand News firearms coverage features 2025 2026'),
      webSearch('Pew Pew Tactical website features tools gun reviews 2026'),
      webSearch('The Firearm Blog TFB features content coverage 2026'),
      webSearch('NRA American Rifleman digital features new coverage 2026'),
      webSearch('Gun Digest website features tools digital 2026'),
      webSearch('trending firearms searches Second Amendment news June 2026'),
      webSearch('new gun laws legislation 2026 most searched firearms topics'),
      webSearch('viral firearms YouTube content popular gun topics 2026'),
    ])

    const competitorData = [
      `TTAG: ${ttag.value || 'N/A'}`,
      `AmmoLand: ${ammoland.value || 'N/A'}`,
      `Pew Pew Tactical: ${pewpew.value || 'N/A'}`,
      `The Firearm Blog: ${tfb.value || 'N/A'}`,
      `NRA/American Rifleman: ${nra.value || 'N/A'}`,
      `Gun Digest: ${gundigest.value || 'N/A'}`,
    ].join('\n\n---\n\n').slice(0, 8000)

    const trendingData = [
      trending1.value || '',
      trending2.value || '',
      trending3.value || '',
    ].join('\n\n').slice(0, 3000)

    // Step 3: Run Claude analysis
    console.log('[intelligence] Running Claude analysis...')
    const analysis = await runAnalysis({ competitorData, trendingData, siteData, today })

    // Step 4: Save complete briefing to Sanity
    await sanity.patch(briefingId).set({
      status:               'complete',
      score:                analysis.score || 0,
      headline:             analysis.headline || '',
      summary:              analysis.summary || '',
      competitorFindings:   (analysis.competitorFindings || []).map((f, i) => ({ ...f, _key: `cf${i}` })),
      recommendations:      (analysis.recommendations || []).map((r, i) => ({ ...r, _key: `rec${i}`, done: false })),
      issues:               (analysis.issues || []).map((iss, i) => ({ ...iss, _key: `iss${i}`, fixed: false })),
      contentGaps:          (analysis.contentGaps || []).map((g, i) => ({ ...g, _key: `gap${i}` })),
      siteHealthData:       JSON.stringify(siteData, null, 2),
      searchData:           trendingData.slice(0, 2000),
    }).commit()

    // Step 5: Send email digest
    try {
      await sendDigestEmail(analysis, today)
      await sanity.patch(briefingId).set({ emailSent: true, emailSentAt: new Date().toISOString() }).commit()
    } catch (emailErr) {
      errors.push(`Email failed: ${emailErr.message}`)
    }

    console.log('[intelligence] Briefing complete. Score:', analysis.score)

    const elapsed = Date.now() - new Date(initial.runAt).getTime()
    await reportCronRun('intelligence', { status:'success', ms:elapsed, details:`score:${analysis.score} recs:${(analysis.recommendations||[]).length}` })

    return Response.json({
      ok:        true,
      date:      today,
      briefingId,
      score:     analysis.score,
      headline:  analysis.headline,
      recs:      (analysis.recommendations || []).length,
      gaps:      (analysis.contentGaps || []).length,
      issues:    (analysis.issues || []).length,
      errors,
    })

  } catch (err) {
    console.error('[intelligence] Fatal error:', err)
    await reportCronRun('intelligence', { status:'failed', error:err.message })
    if (briefingId) {
      await sanity.patch(briefingId).set({
        status:   'failed',
        errorLog: err.message,
      }).commit()
    }
    return Response.json({ ok: false, error: err.message, briefingId }, { status: 500 })
  }
}

// Also support POST for manual trigger from admin
export async function POST(req) { return GET(req) }
