import { createClient } from '@sanity/client'
import { Resend } from 'resend'
import { reportCronRun } from '@/lib/cronReporter'
import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 300

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const getResend = () => new Resend(process.env.RESEND_API_KEY)

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || req.headers.get('x-vercel-cron') === '1'
    || (process.env.CRON_SECRET && req.headers.get('authorization') === 'Bearer ' + process.env.CRON_SECRET)
}

// Copyright risk signals
const RISK_PHRASES = [
  'according to the article', 'the article states', 'the report says', 'as reported by',
  'the original article', 'the author writes', 'the piece notes', 'the story reports',
  'in their words', 'their report', 'as they describe', 'as noted in the',
]

const STRUCTURE_PHRASES = [
  'Background and Context', 'What This Means for Gun Owners', 'Industry Impact',
  'What to Watch Next', 'DownRange Bottom Line',
]

const REQUIRED_SECTIONS = ['Key Details', 'Why It Matters', 'DownRange Analysis']

function analyzeArticle(article) {
  const body = (article.body || '').replace(/<[^>]+>/g, ' ')
  const wordCount = body.split(/\s+/).filter(Boolean).length
  const issues = []
  let riskScore = 0

  // Check 1: No source URL
  if (!article.externalUrl && !article.source) {
    issues.push({ type: 'no_source', severity: 'high', msg: 'No source URL — attribution missing' })
    riskScore += 30
  }

  // Check 2: Old structure (pre-copyright-update)
  const hasOldStructure = STRUCTURE_PHRASES.filter(p => body.includes(p)).length >= 3
  if (hasOldStructure) {
    issues.push({ type: 'old_structure', severity: 'high', msg: 'Uses old article structure (Background/Industry Impact) — needs rewrite' })
    riskScore += 40
  }

  // Check 3: Missing DownRange Analysis (new structure)
  const hasAnalysis = body.toLowerCase().includes('downrange analysis') || body.toLowerCase().includes('downrange take') || body.toLowerCase().includes('bottom line')
  if (!hasAnalysis && wordCount > 200) {
    issues.push({ type: 'no_analysis', severity: 'medium', msg: 'Missing DownRange Analysis section — no original commentary' })
    riskScore += 20
  }

  // Check 4: Derivative language patterns
  const derivativeMatches = RISK_PHRASES.filter(p => body.toLowerCase().includes(p))
  if (derivativeMatches.length > 0) {
    issues.push({ type: 'derivative_language', severity: 'medium', msg: 'Contains derivative phrases: ' + derivativeMatches.slice(0,3).join(', ') })
    riskScore += derivativeMatches.length * 10
  }

  // Check 5: Very long article from likely short RSS snippet (word count > 900)
  if (wordCount > 900) {
    issues.push({ type: 'excessive_length', severity: 'low', msg: `Article is ${wordCount} words — may be padding/derivative content` })
    riskScore += 10
  }

  // Check 6: No source link in body
  const hasSourceLink = (article.body || '').includes('href=') && 
    ((article.body || '').toLowerCase().includes('source') || (article.body || '').toLowerCase().includes('original'))
  if (!hasSourceLink && wordCount > 200) {
    issues.push({ type: 'no_source_link_in_body', severity: 'medium', msg: 'No source link embedded in article body' })
    riskScore += 15
  }

  return {
    _id:        article._id,
    slug:       article.slug?.current || '',
    title:      article.title || '',
    source:     article.source || '',
    wordCount,
    riskScore:  Math.min(100, riskScore),
    issues,
    riskLevel:  riskScore >= 60 ? 'HIGH' : riskScore >= 30 ? 'MEDIUM' : 'LOW',
    publishedAt: article.publishedAt,
    externalUrl: article.externalUrl || '',
  }
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const t0   = Date.now()
  const today = new Date().toISOString().split('T')[0]

  // Sample strategy: pick 25 recent articles + 5 older articles for spot-check diversity
  const cutoff48h = new Date(Date.now() - 48 * 3600000).toISOString()
  const cutoff7d  = new Date(Date.now() - 7 * 24 * 3600000).toISOString()

  const [recent, older] = await Promise.all([
    // Last 48h — all of them (usually 10-30 articles)
    sanity.fetch(
      `*[_type == "newsArticle" && publishedAt > $cutoff && approved == true] | order(publishedAt desc) [0...50] {
        _id, title, slug, body, source, externalUrl, publishedAt, category, wordCount
      }`,
      { cutoff: cutoff48h }
    ),
    // 7d-48h window — random sample of 10 for ongoing spot-checking
    sanity.fetch(
      `*[_type == "newsArticle" && publishedAt < $cutoffNew && publishedAt > $cutoffOld && approved == true] | order(_createdAt desc) [0...10] {
        _id, title, slug, body, source, externalUrl, publishedAt, category, wordCount
      }`,
      { cutoffNew: cutoff48h, cutoffOld: cutoff7d }
    ),
  ])
  const articles = [...recent, ...older]

  const results   = articles.map(analyzeArticle)
  const highRisk  = results.filter(r => r.riskLevel === 'HIGH')
  const medRisk   = results.filter(r => r.riskLevel === 'MEDIUM')
  const lowRisk   = results.filter(r => r.riskLevel === 'LOW')
  const clean     = results.filter(r => r.issues.length === 0)

  const oldStructureCount = results.filter(r => r.issues.some(i => i.type === 'old_structure')).length
  const noAnalysisCount   = results.filter(r => r.issues.some(i => i.type === 'no_analysis')).length

  const report = {
    date:       today,
    scanned:    articles.length,
    highRisk:   highRisk.length,
    medRisk:    medRisk.length,
    lowRisk:    lowRisk.length,
    clean:      clean.length,
    complianceRate: articles.length > 0 ? Math.round((clean.length / articles.length) * 100) : 100,
    oldStructureCount,
    noAnalysisCount,
    articles:   results,
    topIssues:  highRisk.slice(0, 10).map(r => ({
      title:  r.title.slice(0, 80),
      slug:   r.slug,
      score:  r.riskScore,
      issues: r.issues.map(i => i.msg),
    }))
  }

  // Save to Sanity as a copyrightReport doc (use upsert by date)
  try {
    await sanity.createOrReplace({
      _id:   'copyright-report-' + today,
      _type: 'cronRunStore',
      jobId: 'copyright-review',
      data:  JSON.stringify(report),
      date:  today,
      runAt: new Date().toISOString(),
    })
  } catch (e) {
    console.error('[COPYRIGHT] Failed to save report:', e.message)
  }

  // Send email if there are high-risk articles
  if (highRisk.length > 0 || medRisk.length > 0) {
    const rows = results
      .filter(r => r.riskLevel !== 'LOW' || r.issues.length > 0)
      .slice(0, 20)
      .map(r => `
        <tr style="border-bottom:1px solid #1f2428;">
          <td style="padding:8px 12px;">
            <div style="font-size:13px;color:#e5e7eb;font-weight:600;">${r.title.slice(0,70)}</div>
            <div style="font-size:10px;color:#6b7280;margin-top:2px;">${r.source || 'no source'} · ${r.wordCount}w · ${new Date(r.publishedAt).toLocaleDateString()}</div>
          </td>
          <td style="padding:8px 12px;text-align:center;">
            <span style="background:${r.riskLevel==='HIGH'?'#7f1d1d':r.riskLevel==='MEDIUM'?'#78350f':'#14532d'};color:${r.riskLevel==='HIGH'?'#fca5a5':r.riskLevel==='MEDIUM'?'#fcd34d':'#86efac'};font-size:10px;font-weight:700;padding:2px 8px;letter-spacing:.06em;">${r.riskLevel}</span>
          </td>
          <td style="padding:8px 12px;font-size:11px;color:#9ca3af;">
            ${r.issues.map(i => '· ' + i.msg).join('<br>')}
          </td>
          <td style="padding:8px 12px;">
            <a href="https://downrangeco.com/news/${r.slug}" target="_blank" style="color:#C8922A;font-size:10px;text-decoration:none;">VIEW ↗</a>
          </td>
        </tr>`).join('')

    const scoreColor = report.complianceRate >= 80 ? '#22c55e' : report.complianceRate >= 60 ? '#f59e0b' : '#ef4444'

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#09090B;font-family:Arial,sans-serif;color:#e5e7eb;">
<div style="max-width:700px;margin:0 auto;background:#0A0B0C;border:1px solid #1f2428;">
  <div style="background:#0A0B0C;border-bottom:3px solid #C8922A;padding:24px 32px;">
    <div style="display:flex;justify-content:space-between;align-items:center;">
      <div>
        <div style="font-family:Georgia,serif;font-size:22px;font-weight:900;color:#C8922A;letter-spacing:0.1em;">DOWNRANGE</div>
        <div style="font-size:10px;color:#6b7280;letter-spacing:0.2em;margin-top:2px;">DAILY COPYRIGHT COMPLIANCE REPORT</div>
      </div>
      <div style="text-align:right;">
        <div style="font-size:32px;font-weight:900;color:${scoreColor};">${report.complianceRate}%</div>
        <div style="font-size:10px;color:#6b7280;">COMPLIANCE RATE</div>
      </div>
    </div>
    <div style="margin-top:16px;display:flex;gap:16px;flex-wrap:wrap;">
      ${[
        ['Scanned', report.scanned, '#9ca3af'],
        ['Clean', report.clean, '#22c55e'],
        ['High Risk', report.highRisk, '#ef4444'],
        ['Med Risk', report.medRisk, '#f59e0b'],
        ['Old Structure', report.oldStructureCount, '#f97316'],
        ['No Analysis', report.noAnalysisCount, '#a78bfa'],
      ].map(([l,v,c]) => `<div style="text-align:center;padding:8px 14px;background:#111;border:1px solid #1f2428;">
        <div style="font-size:20px;font-weight:900;color:${c};">${v}</div>
        <div style="font-size:9px;color:#4b5563;letter-spacing:.06em;">${l.toUpperCase()}</div>
      </div>`).join('')}
    </div>
  </div>
  <div style="padding:20px 32px;">
    <div style="font-size:11px;color:#C8922A;font-weight:700;letter-spacing:.12em;text-transform:uppercase;margin-bottom:12px;">⚠ ARTICLES REQUIRING ATTENTION</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>
        <tr style="border-bottom:1px solid #C8922A;">
          <th style="padding:6px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">ARTICLE</th>
          <th style="padding:6px 12px;font-size:9px;color:#C8922A;letter-spacing:.1em;">RISK</th>
          <th style="padding:6px 12px;text-align:left;font-size:9px;color:#C8922A;letter-spacing:.1em;">ISSUES</th>
          <th style="padding:6px 12px;font-size:9px;color:#C8922A;letter-spacing:.1em;">LINK</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  </div>
  ${report.oldStructureCount > 0 ? `
  <div style="padding:0 32px 20px;">
    <div style="padding:12px 16px;background:rgba(249,115,22,.08);border-left:4px solid #f97316;">
      <div style="font-size:11px;color:#f97316;font-weight:700;margin-bottom:6px;">ACTION REQUIRED: ${report.oldStructureCount} articles use old structure</div>
      <div style="font-size:11px;color:#9ca3af;line-height:1.6;">
        These articles were written before the copyright update and use the old 5-section format 
        (Background/Industry Impact/What to Watch Next). They should be regenerated using the new 
        copyright-compliant structure. Use the Quality Rewrite cron or Content Hub backfill to fix them.
      </div>
    </div>
  </div>` : ''}
  <div style="padding:12px 32px 20px;font-size:10px;color:#374151;border-top:1px solid #1f2428;">
    Generated ${today} · DownRange Copyright Compliance Engine · <a href="https://downrangeco.com/admin" style="color:#C8922A;">Open Admin →</a>
  </div>
</div>
</body></html>`

    try {
      await getResend().emails.send({
        from: 'DownRange Compliance <intelligence@downrangeco.com>',
        to: ['dejcav@gmail.com'],
        subject: `[DownRange] Copyright Review — ${today} · ${report.complianceRate}% compliant · ${highRisk.length} high-risk`,
        html,
      })
    } catch (e) {
      console.error('[COPYRIGHT] Email failed:', e.message)
    }
  }

  const ms  = Date.now() - t0
  const msg = `${report.complianceRate}% compliant (${clean.length} clean, ${highRisk.length} high-risk, ${medRisk.length} medium-risk) of ${articles.length} articles`
  await reportCronRun('copyright-review', { status: highRisk.length > 5 ? 'failed' : 'success', ms, details: msg })

  return Response.json({ ok: true, ...report, ms })
}

export async function POST(req) { return GET(req) }
