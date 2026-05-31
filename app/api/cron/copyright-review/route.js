import { createClient } from '@sanity/client'
import { Resend }        from 'resend'
import { reportCronRun } from '@/lib/cronReporter'
export const dynamic    = 'force-dynamic'
export const maxDuration = 300

const sanity    = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg', dataset: 'production', apiVersion: '2024-01-01', useCdn: false, token: process.env.SANITY_API_TOKEN })
const getResend = () => new Resend(process.env.RESEND_API_KEY)

function auth(req) {
  const adminKey   = req.headers.get('x-admin-key')
  const authHeader = req.headers.get('authorization')
  const cronHeader = req.headers.get('x-vercel-cron')
  const secret     = process.env.CRON_SECRET
  if (adminKey && adminKey === process.env.ADMIN_KEY) return true
  if (secret && authHeader === 'Bearer ' + secret)    return true
  if (!secret && cronHeader === '1')                  return true
  if (!secret)                                        return true
  return false
}

// ── Risk signal definitions ───────────────────────────────────────────────────
const RISK_PHRASES = [
  'according to the article','the article states','the report says','as reported by',
  'the original article','the author writes','the piece notes','the story reports',
  'in their words','their report','as they describe','as noted in the',
]
const OLD_STRUCTURE_PHRASES = [
  'Background and Context','What This Means for Gun Owners','Industry Impact','What to Watch Next','DownRange Bottom Line',
]

// ── Per-article static analysis ───────────────────────────────────────────────
function analyzeArticle(article) {
  const bodyText  = (article.body || '').replace(/<[^>]+>/g, ' ')
  const wordCount = bodyText.split(/\s+/).filter(Boolean).length
  const issues    = []
  let   riskScore = 0

  if (!article.externalUrl && !article.source) {
    issues.push({ type: 'no_source', severity: 'high', msg: 'No source URL — attribution missing entirely' })
    riskScore += 30
  }

  const oldCount = OLD_STRUCTURE_PHRASES.filter(p => bodyText.includes(p)).length
  if (oldCount >= 3) {
    issues.push({ type: 'old_structure', severity: 'high', msg: `Uses pre-copyright structure (${oldCount}/5 old headings present) — full rewrite needed` })
    riskScore += 40
  }

  const hasAnalysis = /downrange analysis|downrange take|bottom line/i.test(bodyText)
  if (!hasAnalysis && wordCount > 200) {
    issues.push({ type: 'no_analysis', severity: 'medium', msg: 'Missing DownRange Analysis section — no original editorial commentary' })
    riskScore += 20
  }

  const derivatives = RISK_PHRASES.filter(p => bodyText.toLowerCase().includes(p))
  if (derivatives.length > 0) {
    issues.push({ type: 'derivative_language', severity: 'medium', msg: `Derivative phrasing detected: "${derivatives.slice(0,2).join('", "')}"` })
    riskScore += derivatives.length * 10
  }

  if (wordCount > 900) {
    issues.push({ type: 'excessive_length', severity: 'low', msg: `${wordCount} words — verify content is original, not padded from source` })
    riskScore += 10
  }

  const hasSourceLink = (article.body || '').includes('href=') &&
    (/(source|original|read more|via)/i.test(article.body || ''))
  if (!hasSourceLink && wordCount > 200) {
    issues.push({ type: 'no_source_link_in_body', severity: 'medium', msg: 'No source attribution link in article body' })
    riskScore += 15
  }

  if (article.title && article.sourceTitle) {
    const norm = s => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
    const dWords = new Set(norm(article.title).split(' ').filter(w => w.length > 3))
    const sWords = norm(article.sourceTitle).split(' ').filter(w => w.length > 3)
    if (sWords.length > 0) {
      const overlap = sWords.filter(w => dWords.has(w)).length / sWords.length
      if (overlap >= 1.0) {
        issues.push({ type: 'duplicate_title', severity: 'high', msg: 'Title identical to source — must be rewritten immediately' })
        riskScore += 40
      } else if (overlap >= 0.7) {
        issues.push({ type: 'near_duplicate_title', severity: 'high', msg: `Title ${Math.round(overlap * 100)}% word-overlap with source — needs rewrite` })
        riskScore += 30
      }
    }
  }

  return {
    _id: article._id, _type: article._type || 'newsArticle',
    slug: article.slug?.current || '', title: article.title || '',
    source: article.source || '', sourceTitle: article.sourceTitle || '',
    externalUrl: article.externalUrl || '',
    wordCount, riskScore: Math.min(100, riskScore),
    issues, riskLevel: riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
    publishedAt: article.publishedAt,
  }
}

// ── AI verdict on high-risk articles ─────────────────────────────────────────
async function getAIVerdict(article) {
  if (!process.env.ANTHROPIC_API_KEY) return null
  try {
    const snippet = (article.body || '').replace(/<[^>]+>/g, ' ').slice(0, 600)
    const prompt  = `You are a copyright compliance reviewer for DownRange, a firearms media site.

Article title: "${article.title}"
Source title: "${article.sourceTitle || 'unknown'}"
Source URL: ${article.externalUrl || 'not provided'}
Body excerpt (first 600 chars): "${snippet}"

Assess in 2-3 sentences:
1. Is this article original commentary or is it derivative/paraphrased from the source?
2. What specifically makes it risky or safe from a copyright standpoint?
3. What is the ONE most important change needed?

Be direct and specific. No hedging.`

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({ model: 'claude-haiku-4-5-20251001', max_tokens: 250, messages: [{ role: 'user', content: prompt }] }),
    })
    const d = await res.json()
    return d.content?.[0]?.text?.trim() || null
  } catch { return null }
}

// ── Load 7-day compliance history from Sanity ─────────────────────────────────
async function loadComplianceHistory() {
  const docs = await sanity.fetch(
    `*[_type == "cronRunStore" && jobId == "copyright-review"] | order(date desc)[0...7] { date, data }`,
    {}
  ).catch(() => [])
  return docs.map(d => {
    try { const r = JSON.parse(d.data); return { date: d.date, rate: r.complianceRate || 0, high: r.highRisk || 0 } }
    catch { return { date: d.date, rate: 0, high: 0 } }
  }).reverse()
}

// ── Build enterprise email ────────────────────────────────────────────────────
function buildEmail({ report, history, aiVerdicts, oldStructureArticles, today }) {
  const scoreColor = report.complianceRate >= 85 ? '#22c55e' : report.complianceRate >= 65 ? '#f59e0b' : '#ef4444'
  const ringColor  = report.complianceRate >= 85 ? '#14532d' : report.complianceRate >= 65 ? '#451a03' : '#450a0a'
  const riskColor  = r => r === 'HIGH' ? '#ef4444' : r === 'MEDIUM' ? '#f59e0b' : '#22c55e'
  const riskBg     = r => r === 'HIGH' ? '#450a0a' : r === 'MEDIUM' ? '#451a03' : '#14532d'

  // Trend arrow
  const prevRate = history.length >= 2 ? history[history.length - 2]?.rate : null
  const trendArrow = prevRate === null ? '—' : report.complianceRate > prevRate ? `↑ +${report.complianceRate - prevRate}%` : report.complianceRate < prevRate ? `↓ ${report.complianceRate - prevRate}%` : '→ flat'
  const trendColor = prevRate === null ? '#6b7280' : report.complianceRate >= prevRate ? '#22c55e' : '#ef4444'

  // 7-day spark bars
  const maxRate = Math.max(...history.map(h => h.rate), 1)
  const sparkBars = history.map(h => {
    const pct = Math.round((h.rate / maxRate) * 100)
    const c   = h.rate >= 85 ? '#22c55e' : h.rate >= 65 ? '#f59e0b' : '#ef4444'
    return `<div style="display:flex;flex-direction:column;align-items:center;gap:3px;flex:1;">
      <div style="font-size:8px;color:#6b7280;">${h.rate}%</div>
      <div style="width:100%;background:#1f2428;height:40px;position:relative;">
        <div style="position:absolute;bottom:0;width:100%;background:${c};height:${pct}%;"></div>
      </div>
      <div style="font-size:7px;color:#4b5563;">${h.date.slice(5)}</div>
    </div>`
  }).join('')

  // Article table rows
  const articleRows = report.articles
    .filter(a => a.riskLevel !== 'LOW' || a.issues.length > 0)
    .slice(0, 25)
    .map(a => {
      const verdict = aiVerdicts[a._id]
      return `<tr style="border-bottom:1px solid #1a1c20;">
        <td style="padding:10px 12px;">
          <div style="font-size:12px;color:#e5e7eb;font-weight:600;margin-bottom:2px;">${a.title}</div>
          <div style="font-size:10px;color:#4b5563;margin-top:1px;">${a.source || 'no source'} · ${a.wordCount}w · ${a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : 'no date'}</div>
          ${verdict ? `<div style="margin-top:6px;padding:6px 8px;background:#111;border-left:2px solid #C8922A;font-size:10px;color:#9ca3af;line-height:1.5;font-style:italic;">${verdict}</div>` : ''}
        </td>
        <td style="padding:10px 12px;text-align:center;vertical-align:top;">
          <span style="background:${riskBg(a.riskLevel)};color:${riskColor(a.riskLevel)};font-size:9px;font-weight:700;padding:3px 10px;letter-spacing:.08em;white-space:nowrap;">${a.riskLevel} · ${a.riskScore}</span>
        </td>
        <td style="padding:10px 12px;font-size:10px;color:#9ca3af;vertical-align:top;max-width:220px;">
          ${a.issues.map(i => `<div style="margin-bottom:4px;">· ${i.msg}</div>`).join('')}
        </td>
        <td style="padding:10px 12px;vertical-align:top;">
          <a href="https://downrangeco.com/news/${a.slug}" style="color:#C8922A;font-size:10px;text-decoration:none;white-space:nowrap;">VIEW ↗</a>
        </td>
      </tr>`
    }).join('')

  // Old-structure list
  const oldStructureList = oldStructureArticles.slice(0, 10).map(a =>
    `<div style="padding:8px 12px;border-bottom:1px solid #1a1c20;display:flex;justify-content:space-between;">
      <div>
        <div style="font-size:12px;color:#e5e7eb;">${a.title}</div>
        <div style="font-size:10px;color:#6b7280;margin-top:2px;">${a.publishedAt ? new Date(a.publishedAt).toLocaleDateString() : ''} · <a href="https://downrangeco.com/news/${a.slug}" style="color:#C8922A;">view ↗</a></div>
      </div>
      <span style="font-size:9px;color:#f97316;font-weight:700;padding:2px 8px;background:#431407;align-self:flex-start;white-space:nowrap;">NEEDS REWRITE</span>
    </div>`
  ).join('')

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;color:#e5e7eb;">
<div style="max-width:760px;margin:0 auto;background:#09090B;">

  <!-- MASTHEAD -->
  <div style="background:#0A0B0C;border-bottom:3px solid #C8922A;padding:24px 36px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;">
      <div>
        <div style="font-family:Georgia,serif;font-size:26px;font-weight:900;color:#C8922A;letter-spacing:0.12em;">DOWNRANGE</div>
        <div style="font-size:9px;color:#4b5563;letter-spacing:0.24em;margin-top:3px;">DAILY COPYRIGHT COMPLIANCE REPORT · ${today}</div>
      </div>
      <div style="text-align:center;background:${ringColor};border:2px solid ${scoreColor};padding:12px 18px;">
        <div style="font-size:36px;font-weight:900;color:${scoreColor};line-height:1;">${report.complianceRate}%</div>
        <div style="font-size:8px;color:${scoreColor};letter-spacing:.14em;margin-top:2px;">COMPLIANT</div>
        <div style="font-size:10px;color:${trendColor};margin-top:4px;font-weight:700;">${trendArrow}</div>
      </div>
    </div>
    <!-- Stat pills -->
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:16px;">
      ${[
        ['Scanned',      report.scanned,          '#9ca3af'],
        ['Clean',        report.clean,            '#22c55e'],
        ['High Risk',    report.highRisk,         '#ef4444'],
        ['Medium Risk',  report.medRisk,          '#f59e0b'],
        ['Old Structure',report.oldStructureCount,'#f97316'],
        ['No Analysis',  report.noAnalysisCount,  '#a78bfa'],
        ['AI Verdicts',  Object.keys(aiVerdicts).length, '#C8922A'],
      ].map(([l, v, c]) => `<div style="text-align:center;padding:8px 14px;background:#111;border:1px solid #1f2428;">
        <div style="font-size:22px;font-weight:900;color:${c};">${v}</div>
        <div style="font-size:8px;color:#4b5563;letter-spacing:.08em;">${l.toUpperCase()}</div>
      </div>`).join('')}
    </div>
  </div>

  <!-- 7-DAY COMPLIANCE TREND -->
  ${history.length > 1 ? `
  <div style="background:#0d0e10;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.2em;margin-bottom:14px;">7-DAY COMPLIANCE TREND</div>
    <div style="display:flex;gap:6px;align-items:flex-end;height:72px;">
      ${sparkBars}
    </div>
  </div>` : ''}

  <!-- AI VERDICT SECTION (high-risk articles) -->
  ${Object.keys(aiVerdicts).length > 0 ? `
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#ef4444;font-weight:700;letter-spacing:.2em;margin-bottom:4px;">⚠ AI COMPLIANCE VERDICTS — HIGH RISK ARTICLES</div>
    <div style="font-size:10px;color:#6b7280;margin-bottom:14px;">Claude reviewed each high-risk article and assessed copyright exposure.</div>
    ${report.articles.filter(a => aiVerdicts[a._id]).map(a => `
      <div style="border:1px solid #450a0a;margin-bottom:10px;background:#0d0e10;">
        <div style="padding:10px 14px;border-bottom:1px solid #1f2428;display:flex;justify-content:space-between;">
          <span style="font-size:12px;font-weight:700;color:#e5e7eb;">${a.title}</span>
          <span style="font-size:9px;font-weight:700;color:#ef4444;padding:2px 8px;background:#450a0a;">RISK ${a.riskScore}</span>
        </div>
        <div style="padding:10px 14px;font-size:11px;color:#9ca3af;line-height:1.7;border-left:3px solid #ef4444;">${aiVerdicts[a._id]}</div>
        <div style="padding:8px 14px;background:#0a0b0d;display:flex;gap:12px;">
          <a href="https://downrangeco.com/news/${a.slug}" style="color:#C8922A;font-size:10px;text-decoration:none;">View article ↗</a>
          ${a.externalUrl ? `<a href="${a.externalUrl}" style="color:#6b7280;font-size:10px;text-decoration:none;">View source ↗</a>` : ''}
        </div>
      </div>`).join('')}
  </div>` : ''}

  <!-- OLD STRUCTURE LIST -->
  ${report.oldStructureCount > 0 ? `
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#f97316;font-weight:700;letter-spacing:.2em;margin-bottom:4px;">⚡ OLD STRUCTURE — ${report.oldStructureCount} ARTICLES NEED REWRITE</div>
    <div style="font-size:10px;color:#6b7280;margin-bottom:14px;">
      These were written before the copyright update and use the old 5-section format (Background/Industry Impact etc). 
      Each needs full regeneration. Run Quality Rewrite cron or use the backfill tool.
    </div>
    <div style="border:1px solid #1f2428;">
      ${oldStructureList}
      ${report.oldStructureCount > 10 ? `<div style="padding:10px 12px;font-size:11px;color:#6b7280;font-style:italic;">…and ${report.oldStructureCount - 10} more. <a href="https://downrangeco.com/admin" style="color:#C8922A;">View all in admin →</a></div>` : ''}
    </div>
  </div>` : ''}

  <!-- FULL ARTICLE TABLE -->
  ${report.articles.filter(a => a.riskLevel !== 'LOW' || a.issues.length > 0).length > 0 ? `
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:20px 36px;">
    <div style="font-size:9px;color:#C8922A;font-weight:700;letter-spacing:.2em;margin-bottom:14px;">
      ARTICLES REQUIRING ATTENTION (${report.articles.filter(a => a.riskLevel !== 'LOW').length})
    </div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #C8922A;">
          <th style="padding:8px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">ARTICLE</th>
          <th style="padding:8px 12px;text-align:center;font-size:9px;color:#C8922A;letter-spacing:.1em;">RISK</th>
          <th style="padding:8px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">ISSUES</th>
          <th style="padding:8px 12px;font-size:9px;color:#C8922A;letter-spacing:.1em;"></th>
        </tr>
      </thead>
      <tbody>${articleRows}</tbody>
    </table>
  </div>` : `
  <div style="background:#0A0B0C;border-bottom:1px solid #1f2428;padding:28px 36px;text-align:center;">
    <div style="font-size:32px;margin-bottom:8px;">✅</div>
    <div style="font-size:14px;font-weight:700;color:#22c55e;">All scanned articles are compliant</div>
    <div style="font-size:11px;color:#6b7280;margin-top:4px;">No HIGH or MEDIUM risk articles found in this scan.</div>
  </div>`}

  <!-- FOOTER -->
  <div style="padding:16px 36px;background:#0a0b0d;border-top:1px solid #1f2428;display:flex;justify-content:space-between;align-items:center;">
    <div style="font-size:10px;color:#374151;">DownRange Copyright Engine · ${today} · 6:00 AM</div>
    <a href="https://downrangeco.com/admin" style="background:#C8922A;color:#000;padding:8px 16px;text-decoration:none;font-weight:700;font-size:11px;letter-spacing:.06em;">OPEN ADMIN →</a>
  </div>

</div>
</body></html>`
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0    = Date.now()
  const today = new Date().toISOString().split('T')[0]
  const url   = new URL(req.url)
  const isFull = url.searchParams.get('full') === '1'

  const cutoff48h = new Date(Date.now() - 48 * 3600000).toISOString()
  const cutoff7d  = new Date(Date.now() - 7 * 86400000).toISOString()

  // Fetch articles to scan
  let articles = []
  if (isFull) {
    const results = await Promise.all(['newsArticle', 'blogPost', 'firearmRelease', 'review'].map(type =>
      sanity.fetch(`*[_type == $type && (approved == true || status == "published" || published == true)] | order(_createdAt desc)[0...200] { _id, _type, title, sourceTitle, slug, body, source, externalUrl, publishedAt, category, wordCount }`, { type })
    ))
    articles = results.flat()
  } else {
    const [recent, spot] = await Promise.all([
      sanity.fetch(`*[_type == "newsArticle" && publishedAt > $c && approved == true] | order(publishedAt desc)[0...60] { _id, _type, title, sourceTitle, slug, body, source, externalUrl, publishedAt, category, wordCount }`, { c: cutoff48h }),
      sanity.fetch(`*[_type == "newsArticle" && publishedAt < $c1 && publishedAt > $c2 && approved == true] | order(_createdAt desc)[0...15] { _id, _type, title, sourceTitle, slug, body, source, externalUrl, publishedAt, category, wordCount }`, { c1: cutoff48h, c2: cutoff7d }),
    ])
    articles = [...recent, ...spot]
  }

  const results          = articles.map(analyzeArticle)
  const highRisk         = results.filter(r => r.riskLevel === 'HIGH')
  const medRisk          = results.filter(r => r.riskLevel === 'MEDIUM')
  const lowRisk          = results.filter(r => r.riskLevel === 'LOW')
  const clean            = results.filter(r => r.issues.length === 0)
  const oldStructureList = results.filter(r => r.issues.some(i => i.type === 'old_structure'))
  const complianceRate   = articles.length > 0 ? Math.round((clean.length / articles.length) * 100) : 100

  // AI verdicts on top high-risk (up to 5 to control cost)
  const aiVerdicts = {}
  if (highRisk.length > 0) {
    const targets = highRisk.slice(0, 5)
    await Promise.allSettled(targets.map(async a => {
      const verdict = await getAIVerdict(a)
      if (verdict) aiVerdicts[a._id] = verdict
    }))
  }

  const report = {
    date: today, scanned: articles.length,
    highRisk: highRisk.length, medRisk: medRisk.length, lowRisk: lowRisk.length,
    clean: clean.length, complianceRate,
    oldStructureCount: oldStructureList.length,
    noAnalysisCount: results.filter(r => r.issues.some(i => i.type === 'no_analysis')).length,
    articles: results,
  }

  // Save to Sanity
  try {
    await sanity.createOrReplace({ _id: 'copyright-report-' + today, _type: 'cronRunStore', jobId: 'copyright-review', data: JSON.stringify(report), date: today, runAt: new Date().toISOString() })
  } catch (e) { console.error('[copyright] Sanity save failed:', e.message) }

  // Load history for trend bars
  const history = await loadComplianceHistory()

  // Only send email if there's something to report
  const hasIssues = highRisk.length > 0 || medRisk.length > 0 || report.oldStructureCount > 0

  // Always send on Mondays (weekly roll-up), otherwise only if issues exist
  const isMonday = new Date().getDay() === 1

  if (hasIssues || isMonday) {
    const html = buildEmail({ report, history, aiVerdicts, oldStructureArticles: oldStructureList, today })
    try {
      await getResend().emails.send({
        from:    'DownRange Compliance <intelligence@downrangeco.com>',
        to:      ['dejcav@gmail.com'],
        subject: `[DownRange] Copyright ${today} · ${complianceRate}% compliant · ${highRisk.length} high-risk · ${Object.keys(aiVerdicts).length} AI verdicts`,
        html,
      })
    } catch (e) { console.error('[copyright] Email failed:', e.message) }
  }

  const ms = Date.now() - t0
  await reportCronRun('copyright-review', {
    status:  highRisk.length > 5 ? 'failed' : 'success', ms,
    details: `${complianceRate}% compliant · ${clean.length} clean · ${highRisk.length} high-risk · ${Object.keys(aiVerdicts).length} AI verdicts`,
  })
  return Response.json({ ok: true, ...report, aiVerdicts: Object.keys(aiVerdicts).length, ms })
}

export async function POST(req) { return GET(req) }
