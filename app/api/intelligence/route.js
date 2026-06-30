import { createClient } from '@sanity/client'
import { Resend }        from 'resend'
import { reportCronRun } from '@/lib/cronReporter'
export const dynamic    = 'force-dynamic'
export const maxDuration = 300

const sanity    = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })
const getResend = () => new Resend(process.env.RESEND_API_KEY || 're_placeholder')

function isAuthorized(req) {
  const auth = req.headers.get('authorization')
  const cron = req.headers.get('x-vercel-cron')
  const key  = req.headers.get('x-admin-key')
  return cron === '1' || (process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) || key === process.env.ADMIN_KEY
}

// ── Web search using Anthropic web_search tool ────────────────────────────────
// Uses Haiku — web_search tool works identically across models; Sonnet not needed
// for factual retrieval tasks. Saves ~$18/mo vs prior Sonnet usage (14 calls/day).
async function webSearch(query, maxTokens = 1200) {
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: maxTokens,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        messages: [{ role: 'user', content: `Search for: ${query}\n\nReturn a detailed, factual summary of key findings. Include specific features, dates, article titles, and metrics where available.` }],
      }),
    })
    const d = await res.json()
    return d.content?.filter(b => b.type === 'text').map(b => b.text).join('\n') || ''
  } catch (err) {
    return `Search failed: ${err.message}`
  }
}

// ── Deep site data from Sanity ─────────────────────────────────────────────────
async function gatherSiteData() {
  const cutoff24h  = new Date(Date.now() - 86400000).toISOString()
  const cutoff7d   = new Date(Date.now() - 7 * 86400000).toISOString()
  const cutoff30d  = new Date(Date.now() - 30 * 86400000).toISOString()

  const [
    totalArticles, totalReleases, totalLaws, totalReviews, totalVideos,
    articles24h, articles7d,
    missingImages, missingBody, cronFails,
    recentByCategory, staleStateLaws, topCategories,
    recentCronRuns,
  ] = await Promise.all([
    sanity.fetch(`count(*[_type == "newsArticle" && approved == true])`),
    sanity.fetch(`count(*[_type == "firearmRelease"])`),
    sanity.fetch(`count(*[_type == "legislation"])`),
    sanity.fetch(`count(*[_type == "review"])`),
    sanity.fetch(`count(*[_type == "video"])`),
    sanity.fetch(`count(*[_type == "newsArticle" && approved == true && publishedAt > $c])`, { c: cutoff24h }),
    sanity.fetch(`count(*[_type == "newsArticle" && approved == true && publishedAt > $c])`, { c: cutoff7d }),
    sanity.fetch(`count(*[_type == "newsArticle" && approved == true && (!defined(imageUrl) || imageUrl == "")])`),
    sanity.fetch(`count(*[_type == "newsArticle" && approved == true && (!defined(body) || body == "" || length(body) < 200)])`),
    sanity.fetch(`count(*[_type == "cronRun" && status == "failed" && runAt > $c])`, { c: cutoff24h }).catch(() => 0),
    sanity.fetch(`*[_type == "newsArticle" && approved == true && publishedAt > $c] { category } | order(publishedAt desc)`, { c: cutoff7d }),
    sanity.fetch(`count(*[_type == "legislation" && _updatedAt < $c])`, { c: cutoff30d }),
    sanity.fetch(`*[_type == "newsArticle" && approved == true] | order(publishedAt desc)[0...5] { title, category, publishedAt, source }`),
    sanity.fetch(`*[_type == "cronRun"] | order(runAt desc)[0...20] { jobId, status, runAt, details }`).catch(() => []),
  ])

  // Category frequency map from last 7 days
  const catMap = {}
  recentByCategory.forEach(a => { catMap[a.category || 'uncategorized'] = (catMap[a.category || 'uncategorized'] || 0) + 1 })
  const categoryCoverage = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  // Cron health summary
  const cronHealth = {}
  recentCronRuns.forEach(r => {
    if (!cronHealth[r.jobId]) cronHealth[r.jobId] = { runs: 0, fails: 0, last: r.runAt, lastStatus: r.status }
    cronHealth[r.jobId].runs++
    if (r.status === 'failed') cronHealth[r.jobId].fails++
  })

  // Articles per day average
  const avgArticlesPerDay = Math.round(articles7d / 7)
  const imageFixRate       = totalArticles > 0 ? Math.round(((totalArticles - missingImages) / totalArticles) * 100) : 100

  return {
    totals: { articles: totalArticles, releases: totalReleases, laws: totalLaws, reviews: totalReviews, videos: totalVideos },
    velocity: { articles24h, articles7d, avgArticlesPerDay },
    health: { missingImages, missingBody, cronFails24h: cronFails, imageFixRate, staleStateLaws },
    categoryCoverage,
    recentArticles: topCategories,
    cronHealth,
  }
}

// ── Competitor research (8 targeted searches) ────────────────────────────────
async function runCompetitorResearch() {
  const today = new Date().toISOString().split('T')[0]
  const [ttag, tfb, pewpew, reload, nraila, gundigest, reddit, caselaw] = await Promise.allSettled([
    webSearch(`site:thetruthaboutguns.com articles published ${today} OR new features 2026`),
    webSearch(`site:thefirearmblog.com new articles reviews ${today} 2026 firearms`),
    webSearch(`site:pewpewtactical.com new content guides reviews 2026`),
    webSearch(`"The Reload" Reload.news firearms journalism Second Amendment 2026 articles`),
    webSearch(`site:nraila.org new legislative alerts 2026 gun laws`),
    webSearch(`site:gundigest.com new articles reviews guides 2026`),
    webSearch(`site:reddit.com/r/guns OR site:reddit.com/r/firearms top posts today viral topics`),
    webSearch(`Second Amendment court cases Supreme Court decisions 2026 Bruen Rahimi`),
  ])

  return {
    ttag:      ttag.value      || 'Unavailable',
    tfb:       tfb.value       || 'Unavailable',
    pewpew:    pewpew.value    || 'Unavailable',
    reload:    reload.value    || 'Unavailable',
    nraila:    nraila.value    || 'Unavailable',
    gundigest: gundigest.value || 'Unavailable',
    reddit:    reddit.value    || 'Unavailable',
    caselaw:   caselaw.value   || 'Unavailable',
  }
}

// ── Trending topic research ───────────────────────────────────────────────────
async function runTrendingResearch() {
  const [trends, searches, youtube, legislation, market] = await Promise.allSettled([
    webSearch(`trending firearms topics gun news today ${new Date().toISOString().split('T')[0]}`),
    webSearch(`most searched gun firearms topics Google Trends 2026 United States`),
    webSearch(`top firearms YouTube videos trending this week 2A content creators`),
    webSearch(`new gun control legislation bills 2026 Congress state laws passed`),
    webSearch(`ammunition prices 2026 market trends gun sales NICS background checks`),
  ])

  return [
    trends.value || '', searches.value || '', youtube.value || '',
    legislation.value || '', market.value || '',
  ].join('\n\n---\n\n').slice(0, 6000)
}

// ── Deep Claude analysis ──────────────────────────────────────────────────────
async function runAnalysis({ competitors, trending, site, today }) {
  // Calculate a real signal-based score
  const imageScore    = site.health.imageFixRate               // 0-100
  const velocityScore = Math.min(100, site.velocity.articles24h * 5)  // 5pts per article, cap 100
  const cronScore     = Math.max(0, 100 - (site.health.cronFails24h * 20)) // -20 per failure
  const coverageScore = Math.min(100, site.velocity.articles7d * 2)   // 2pts per article/week
  const baseScore     = Math.round((imageScore * 0.25) + (velocityScore * 0.3) + (cronScore * 0.25) + (coverageScore * 0.2))

  const prompt = `You are the Chief Intelligence Analyst for DownRange — America's independent firearms and Second Amendment media portal (downrangeco.com). Your briefings go directly to the founder. Be direct, specific, and ruthlessly honest. No hedging. No filler.

TODAY: ${today}

═══════════════════════════════════════════
SITE METRICS (REAL DATA — today)
═══════════════════════════════════════════
Content totals: ${site.totals.articles} articles · ${site.totals.releases} releases · ${site.totals.laws} laws · ${site.totals.reviews} reviews · ${site.totals.videos} videos
Velocity: ${site.velocity.articles24h} articles published last 24h · ${site.velocity.articles7d} this week · avg ${site.velocity.avgArticlesPerDay}/day
Image health: ${site.health.missingImages} articles missing images (${site.health.imageFixRate}% covered)
Body health: ${site.health.missingBody} articles with empty or near-empty body
Cron failures (last 24h): ${site.health.cronFails24h}
Stale state laws (>30 days): ${site.health.staleStateLaws}
Category coverage this week: ${site.categoryCoverage.map(([c, n]) => `${c}(${n})`).join(', ')}
Recent articles: ${site.recentArticles.map(a => a.title).join(' | ')}
Calculated health signal score: ${baseScore}/100

═══════════════════════════════════════════
COMPETITOR RESEARCH (live web data)
═══════════════════════════════════════════
TTAG (thetruthaboutguns.com):
${competitors.ttag.slice(0, 800)}

The Firearm Blog:
${competitors.tfb.slice(0, 800)}

Pew Pew Tactical:
${competitors.pewpew.slice(0, 600)}

The Reload (premium journalism):
${competitors.reload.slice(0, 600)}

NRA-ILA:
${competitors.nraila.slice(0, 500)}

Gun Digest:
${competitors.gundigest.slice(0, 500)}

Reddit r/guns + r/firearms (community pulse):
${competitors.reddit.slice(0, 600)}

2A / Court cases:
${competitors.caselaw.slice(0, 500)}

═══════════════════════════════════════════
TRENDING RESEARCH
═══════════════════════════════════════════
${trending.slice(0, 3000)}

═══════════════════════════════════════════
DOWNRANGE PLATFORM
═══════════════════════════════════════════
Pages: News, Laws, Reviews, Guns (encyclopedia), Releases, Market, Deals, Ranges, FFL Finder, CCW Insurance, Video, Learning Center, Training, Hunting, Precision, Preparedness, Safe Storage, State Hub, NFA Tracker, Compare, Value Estimator, Holsters, Blog, Press, Canada.
Mission: Independent firearms media. No manufacturer funding. No political money. Audience: gun owners, dealers, instructors, 2A advocates.

Return ONLY a valid JSON object — no markdown, no preamble, no explanation:

{
  "score": ${baseScore},
  "scoreBreakdown": {
    "imageHealth": ${imageScore},
    "publishVelocity": ${velocityScore},
    "cronReliability": ${cronScore},
    "contentCoverage": ${coverageScore},
    "notes": "One sentence explaining the biggest driver of today's score"
  },
  "executiveSummary": {
    "headline": "One razor-sharp sentence — the single most important finding today",
    "situation": "2 sentences: what is the current state of DownRange right now?",
    "opportunity": "2 sentences: what is the single biggest opportunity this week?",
    "threat": "2 sentences: what is the single biggest risk or competitive threat right now?"
  },
  "competitorIntel": [
    {
      "competitor": "Name",
      "strength": "What they do better than DownRange right now — be specific",
      "weakness": "Their exploitable weakness",
      "actionableGap": "Exactly what DownRange should build or publish to outflank them",
      "timeToAct": "today|this-week|this-month",
      "priority": "critical|high|medium"
    }
  ],
  "recommendations": [
    {
      "rank": 1,
      "title": "Short action title",
      "problem": "Specific problem this solves — cite actual data from site metrics",
      "action": "Step-by-step what to do — specific enough that a developer can execute",
      "expectedOutcome": "What will be measurably different after this is done",
      "effort": "hours|days|week",
      "impact": "critical|high|medium",
      "category": "content|seo|features|ops|growth"
    }
  ],
  "contentGaps": [
    {
      "topic": "Specific topic or keyword phrase",
      "searchSignal": "Evidence this is trending or high-volume",
      "angle": "The specific take DownRange should own — what makes it unique",
      "format": "article|guide|tool|video|series",
      "urgency": "breaking|timely|evergreen",
      "estimatedImpact": "Why this matters for audience growth"
    }
  ],
  "operationalAlerts": [
    {
      "severity": "critical|high|medium|low",
      "system": "System or page name",
      "finding": "Specific observable problem — cite numbers from the data",
      "immediateAction": "What to do right now to fix or mitigate"
    }
  ],
  "weeklyFocus": {
    "theme": "One strategic theme for this week",
    "topThreeActions": ["Action 1", "Action 2", "Action 3"],
    "metricToWatch": "The one number to track this week and why"
  }
}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({ model: 'claude-sonnet-4-5-20251022', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] }),
  })
  const d = await res.json()
  const raw = d.content?.[0]?.text || '{}'
  return JSON.parse(raw.replace(/```json|```/g, '').trim())
}

// ── Build enterprise email ────────────────────────────────────────────────────
function buildEmail(b, site, today) {
  const score    = b.score || 0
  const scoreClr = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444'
  const ringClr  = score >= 80 ? '#14532d' : score >= 60 ? '#451a03' : '#450a0a'
  const ex       = b.executiveSummary || {}

  const priorityColor = p => ({ critical: '#ef4444', high: '#f97316', medium: '#f59e0b', low: '#6b7280' })[p] || '#6b7280'
  const urgencyColor  = u => ({ breaking: '#ef4444', timely: '#f97316', evergreen: '#22c55e' })[u] || '#6b7280'
  const effortBadge   = e => ({ hours: '#22c55e', days: '#f59e0b', week: '#6b7280' })[e] || '#6b7280'

  // Score breakdown mini bars
  const sb = b.scoreBreakdown || {}
  const scoreBar = (label, val, color) => `
    <div style="margin-bottom:8px;">
      <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
        <span style="font-size:10px;color:#9ca3af;letter-spacing:.06em;">${label.toUpperCase()}</span>
        <span style="font-size:10px;font-weight:700;color:${color};">${val}/100</span>
      </div>
      <div style="height:4px;background:#1f2428;border-radius:2px;">
        <div style="height:4px;width:${val}%;background:${color};border-radius:2px;"></div>
      </div>
    </div>`

  // Competitor intel rows
  const compRows = (b.competitorIntel || []).slice(0, 6).map(c => `
    <div style="border:1px solid #1f2428;margin-bottom:10px;padding:14px 16px;background:#0d0e10;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px;">
        <span style="font-size:13px;font-weight:700;color:#C8922A;">${c.competitor}</span>
        <span style="background:${priorityColor(c.priority)}22;color:${priorityColor(c.priority)};border:1px solid ${priorityColor(c.priority)}44;font-size:9px;font-weight:700;padding:2px 8px;letter-spacing:.08em;text-transform:uppercase;">${c.priority} · ${c.timeToAct}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:8px;">
        <div>
          <div style="font-size:9px;color:#ef4444;font-weight:700;letter-spacing:.08em;margin-bottom:3px;">THEIR EDGE</div>
          <div style="font-size:11px;color:#d1d5db;line-height:1.5;">${c.strength}</div>
        </div>
        <div>
          <div style="font-size:9px;color:#22c55e;font-weight:700;letter-spacing:.08em;margin-bottom:3px;">THEIR WEAKNESS</div>
          <div style="font-size:11px;color:#d1d5db;line-height:1.5;">${c.weakness}</div>
        </div>
      </div>
      <div style="background:#0a0b0d;border-left:3px solid #C8922A;padding:8px 12px;">
        <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.08em;margin-bottom:3px;">OUR MOVE</div>
        <div style="font-size:11px;color:#e5e7eb;line-height:1.5;">${c.actionableGap}</div>
      </div>
    </div>`).join('')

  // Recommendations ranked list
  const recRows = (b.recommendations || []).sort((a, b) => a.rank - b.rank).slice(0, 8).map((r, i) => `
    <div style="border:1px solid #1f2428;margin-bottom:10px;background:#0d0e10;">
      <div style="padding:12px 16px;border-bottom:1px solid #1f2428;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
          <span style="font-size:18px;font-weight:900;color:${priorityColor(r.impact)};min-width:24px;">${String(r.rank || (i+1)).padStart(2,'0')}</span>
          <span style="font-size:13px;font-weight:700;color:#e5e7eb;">${r.title}</span>
        </div>
        <div style="display:flex;gap:6px;align-items:center;">
          <span style="background:${priorityColor(r.impact)}22;color:${priorityColor(r.impact)};font-size:9px;font-weight:700;padding:2px 7px;letter-spacing:.06em;text-transform:uppercase;">${r.impact}</span>
          <span style="background:${effortBadge(r.effort)}22;color:${effortBadge(r.effort)};font-size:9px;font-weight:700;padding:2px 7px;letter-spacing:.06em;text-transform:uppercase;">${r.effort}</span>
          <span style="font-size:9px;color:#6b7280;padding:2px 7px;border:1px solid #1f2428;text-transform:uppercase;">${r.category}</span>
        </div>
      </div>
      <div style="padding:12px 16px;display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        <div>
          <div style="font-size:9px;color:#f97316;font-weight:700;letter-spacing:.08em;margin-bottom:4px;">PROBLEM</div>
          <div style="font-size:11px;color:#9ca3af;line-height:1.6;">${r.problem}</div>
        </div>
        <div>
          <div style="font-size:9px;color:#22c55e;font-weight:700;letter-spacing:.08em;margin-bottom:4px;">EXPECTED OUTCOME</div>
          <div style="font-size:11px;color:#9ca3af;line-height:1.6;">${r.expectedOutcome}</div>
        </div>
      </div>
      <div style="padding:0 16px 12px;">
        <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.08em;margin-bottom:4px;">ACTION STEPS</div>
        <div style="font-size:11px;color:#e5e7eb;line-height:1.7;font-style:italic;">${r.action}</div>
      </div>
    </div>`).join('')

  // Content gaps
  const gapRows = (b.contentGaps || []).slice(0, 6).map(g => `
    <tr style="border-bottom:1px solid #1f2428;">
      <td style="padding:10px 12px;">
        <div style="font-size:13px;font-weight:700;color:#e5e7eb;">${g.topic}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">${g.searchSignal}</div>
      </td>
      <td style="padding:10px 12px;font-size:11px;color:#9ca3af;line-height:1.5;">${g.angle}</td>
      <td style="padding:10px 12px;text-align:center;">
        <span style="background:${urgencyColor(g.urgency)}22;color:${urgencyColor(g.urgency)};font-size:9px;font-weight:700;padding:2px 8px;letter-spacing:.06em;text-transform:uppercase;display:block;margin-bottom:4px;">${g.urgency}</span>
        <span style="font-size:9px;color:#6b7280;text-transform:uppercase;">${g.format}</span>
      </td>
    </tr>`).join('')

  // Ops alerts
  const alertRows = (b.operationalAlerts || []).map(a => `
    <div style="padding:10px 14px;border-left:3px solid ${priorityColor(a.severity)};background:${priorityColor(a.severity)}0d;margin-bottom:6px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px;">
        <span style="font-size:10px;font-weight:700;color:${priorityColor(a.severity)};text-transform:uppercase;letter-spacing:.08em;">${a.severity} · ${a.system}</span>
      </div>
      <div style="font-size:12px;color:#e5e7eb;margin-bottom:4px;">${a.finding}</div>
      <div style="font-size:11px;color:#6b7280;">→ ${a.immediateAction}</div>
    </div>`).join('')

  const wf = b.weeklyFocus || {}

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:'Arial',sans-serif;color:#e5e7eb;">
<div style="max-width:760px;margin:0 auto;background:#09090B;">

  <!-- MASTHEAD -->
  <div style="background:#0A0B0C;border-bottom:3px solid #C8922A;padding:28px 36px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-family:Georgia,serif;font-size:28px;font-weight:900;color:#C8922A;letter-spacing:0.12em;">DOWNRANGE</div>
        <div style="font-size:9px;color:#4b5563;letter-spacing:0.28em;margin-top:3px;text-transform:uppercase;">Daily Intelligence Briefing · ${today}</div>
      </div>
      <div style="text-align:center;background:${ringClr};border:2px solid ${scoreClr};padding:12px 18px;">
        <div style="font-size:36px;font-weight:900;color:${scoreClr};line-height:1;">${score}</div>
        <div style="font-size:8px;color:${scoreClr};letter-spacing:.14em;margin-top:2px;">SITE SCORE</div>
      </div>
    </div>
  </div>

  <!-- EXEC SUMMARY -->
  <div style="background:#0d0e10;border-bottom:1px solid #1f2428;padding:24px 36px;">
    <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.2em;margin-bottom:12px;">EXECUTIVE SUMMARY</div>
    <div style="font-size:16px;font-weight:700;color:#f9fafb;line-height:1.4;margin-bottom:16px;border-left:4px solid #C8922A;padding-left:16px;">${ex.headline || ''}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;">
      <div style="padding:12px;background:#0a0b0d;border:1px solid #1f2428;">
        <div style="font-size:9px;color:#6b7280;letter-spacing:.12em;margin-bottom:6px;">SITUATION</div>
        <div style="font-size:11px;color:#d1d5db;line-height:1.6;">${ex.situation || ''}</div>
      </div>
      <div style="padding:12px;background:#0a0b0d;border:1px solid #14532d;">
        <div style="font-size:9px;color:#22c55e;letter-spacing:.12em;margin-bottom:6px;">OPPORTUNITY</div>
        <div style="font-size:11px;color:#d1d5db;line-height:1.6;">${ex.opportunity || ''}</div>
      </div>
      <div style="padding:12px;background:#0a0b0d;border:1px solid #450a0a;">
        <div style="font-size:9px;color:#ef4444;letter-spacing:.12em;margin-bottom:6px;">THREAT</div>
        <div style="font-size:11px;color:#d1d5db;line-height:1.6;">${ex.threat || ''}</div>
      </div>
    </div>
  </div>

  <!-- SCORE BREAKDOWN + SITE VITALS -->
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;display:grid;grid-template-columns:1fr 1fr;gap:24px;">
    <div>
      <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.2em;margin-bottom:12px;">SCORE BREAKDOWN</div>
      ${scoreBar('Image Coverage', sb.imageHealth || 0, '#3b82f6')}
      ${scoreBar('Publish Velocity', sb.publishVelocity || 0, '#22c55e')}
      ${scoreBar('Cron Reliability', sb.cronReliability || 0, '#f59e0b')}
      ${scoreBar('Content Coverage', sb.contentCoverage || 0, '#a855f7')}
      <div style="margin-top:8px;font-size:10px;color:#6b7280;font-style:italic;">${sb.notes || ''}</div>
    </div>
    <div>
      <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.2em;margin-bottom:12px;">SITE VITALS</div>
      ${[
        ['Articles (total)',    site.totals.articles],
        ['Published (24h)',     site.velocity.articles24h],
        ['Published (7d)',      site.velocity.articles7d],
        ['Avg/day',            site.velocity.avgArticlesPerDay],
        ['Missing images',     site.health.missingImages],
        ['Missing body',       site.health.missingBody],
        ['Cron failures (24h)',site.health.cronFails24h],
        ['Image coverage',     site.health.imageFixRate + '%'],
      ].map(([l, v]) => `<div style="display:flex;justify-content:space-between;padding:5px 0;border-bottom:1px solid #1a1c20;">
        <span style="font-size:11px;color:#6b7280;">${l}</span>
        <span style="font-size:11px;font-weight:700;color:#e5e7eb;">${v}</span>
      </div>`).join('')}
    </div>
  </div>

  <!-- OPERATIONAL ALERTS -->
  ${(b.operationalAlerts || []).length > 0 ? `
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#ef4444;font-weight:700;letter-spacing:.2em;margin-bottom:12px;">⚠ OPERATIONAL ALERTS (${(b.operationalAlerts || []).length})</div>
    ${alertRows}
  </div>` : ''}

  <!-- WEEKLY FOCUS -->
  <div style="background:#0d0e10;border-bottom:1px solid #1f2428;border-left:4px solid #C8922A;padding:20px 36px;">
    <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.2em;margin-bottom:8px;">THIS WEEK'S FOCUS</div>
    <div style="font-size:15px;font-weight:700;color:#f9fafb;margin-bottom:12px;">${wf.theme || ''}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:12px;">
      ${(wf.topThreeActions || []).map((a, i) => `
        <div style="padding:10px;background:#0a0b0d;border:1px solid #1f2428;">
          <div style="font-size:20px;font-weight:900;color:#C8922A;margin-bottom:4px;">${i + 1}</div>
          <div style="font-size:11px;color:#d1d5db;line-height:1.5;">${a}</div>
        </div>`).join('')}
    </div>
    <div style="font-size:11px;color:#9ca3af;font-style:italic;">📊 Metric to watch: ${wf.metricToWatch || ''}</div>
  </div>

  <!-- COMPETITOR INTELLIGENCE -->
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#a855f7;font-weight:700;letter-spacing:.2em;margin-bottom:14px;">🔍 COMPETITOR INTELLIGENCE (${(b.competitorIntel || []).length} sources)</div>
    ${compRows}
  </div>

  <!-- RANKED RECOMMENDATIONS -->
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#22c55e;font-weight:700;letter-spacing:.2em;margin-bottom:14px;">⚡ RANKED RECOMMENDATIONS (${(b.recommendations || []).length})</div>
    ${recRows}
  </div>

  <!-- CONTENT GAPS -->
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#3b82f6;font-weight:700;letter-spacing:.2em;margin-bottom:14px;">📝 CONTENT GAPS & TRENDING OPPORTUNITIES</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #C8922A;">
          <th style="padding:8px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">TOPIC</th>
          <th style="padding:8px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">ANGLE</th>
          <th style="padding:8px 12px;text-align:center;font-size:9px;color:#C8922A;letter-spacing:.1em;">SIGNAL</th>
        </tr>
      </thead>
      <tbody>${gapRows}</tbody>
    </table>
  </div>

  <!-- FOOTER -->
  <div style="padding:16px 36px;background:#0a0b0d;border-top:1px solid #1f2428;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:10px;color:#374151;">DownRange Intelligence Engine · ${today} · 1:00 AM</div>
    <a href="https://downrangeco.com/admin" style="background:#C8922A;color:#000;padding:8px 16px;text-decoration:none;font-weight:700;font-size:11px;letter-spacing:.06em;">MISSION CONTROL →</a>
  </div>

</div>
</body></html>`
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!isAuthorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const today     = new Date().toISOString().split('T')[0]
  let   briefingId = null
  const t0         = Date.now()

  const initial = await sanity.create({ _type: 'dailyBriefing', date: today, runAt: new Date().toISOString(), status: 'running' })
  briefingId = initial._id

  try {
    console.log('[intel] Gathering site data...')
    const site = await gatherSiteData()

    console.log('[intel] Running competitor research (8 searches)...')
    const competitors = await runCompetitorResearch()

    console.log('[intel] Running trending research (5 searches)...')
    const trending = await runTrendingResearch()

    console.log('[intel] Running deep Claude analysis...')
    const analysis = await runAnalysis({ competitors, trending, site, today })

    await sanity.patch(briefingId).set({
      status:             'complete',
      score:              analysis.score || 0,
      headline:           analysis.executiveSummary?.headline || '',
      summary:            analysis.executiveSummary?.situation || '',
      competitorFindings: (analysis.competitorIntel || []).map((f, i) => ({ ...f, _key: `cf${i}` })),
      recommendations:    (analysis.recommendations || []).map((r, i) => ({ ...r, _key: `rec${i}`, done: false })),
      issues:             (analysis.operationalAlerts || []).map((a, i) => ({ severity: a.severity, page: a.system, issue: a.finding, _key: `iss${i}`, fixed: false })),
      contentGaps:        (analysis.contentGaps || []).map((g, i) => ({ ...g, _key: `gap${i}` })),
      siteHealthData:     JSON.stringify(site, null, 2),
    }).commit()

    const html = buildEmail(analysis, site, today)

    await getResend().emails.send({
      from:    'DownRange Intelligence <intelligence@downrangeco.com>',
      to:      ['dejcav@gmail.com'],
      subject: `[DownRange] Intelligence Briefing ${today} · Score ${analysis.score}/100 · ${(analysis.recommendations || []).length} actions`,
      html,
    })

    await sanity.patch(briefingId).set({ emailSent: true, emailSentAt: new Date().toISOString() }).commit()
    await reportCronRun('intelligence', { status: 'success', ms: Date.now() - t0, details: `score:${analysis.score} recs:${(analysis.recommendations||[]).length} gaps:${(analysis.contentGaps||[]).length}` })

    return Response.json({ ok: true, date: today, briefingId, score: analysis.score, ms: Date.now() - t0 })
  } catch (err) {
    console.error('[intel] Fatal:', err)
    await reportCronRun('intelligence', { status: 'failed', error: err.message })
    if (briefingId) await sanity.patch(briefingId).set({ status: 'failed', errorLog: err.message }).commit()
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
