const crypto = require('crypto')
const axios = require('axios')

// ── CLAUDE REWRITER ───────────────────────────────────────────────────
async function rewriteWithClaude(item) {
  const inputContent = (item.description || item.content || item.contentSnippet || '').slice(0, 3000)
  const prompt = [
    `You are the senior editorial AI for DownRange — America's definitive firearms, Second Amendment, and tactical intelligence publication.`,
    `Your audience: gun owners, dealers, collectors, hunters, competitive shooters, and 2A advocates who demand substance. They know their guns, their laws, and their rights.`,
    ``,
    `Transform the raw source material below into a COMPLETE, FULLY WRITTEN DownRange editorial article.`,
    `This is NOT a summary. It is a full published article with sections, context, and editorial opinion.`,
    ``,
    `Return a JSON object with these exact fields:`,
    ``,
    `"summary": Sharp 2-3 sentence lede. States the key fact and immediate impact. Max 350 characters.`,
    ``,
    `"body": The full article as a single HTML string. MANDATORY STRUCTURE:`,
    `<h2>[Title: What Happened — be specific]</h2>`,
    `<p>[Opening: The hard news. Who, what, when, where. Names, agencies, bill numbers, case citations, calibers, models. 120-150 words.]</p>`,
    `<h2>Background &amp; Context</h2>`,
    `<p>[Why this matters in the broader 2A landscape. Reference Heller, Bruen, McDonald, prior legislation, agency history, industry trends as relevant. 130-160 words.]</p>`,
    `<h2>What This Means for Gun Owners</h2>`,
    `<p>[Specific impact on the reader. Which states, which platforms, which calibers, what dollar amounts. Concrete and actionable. 130-160 words.]</p>`,
    `<h2>Industry &amp; Market Impact</h2>`,
    `<p>[Manufacturer, retailer, dealer impact. Stock effects, production, imports, pricing. If purely legal/political, cover advocacy org responses. 110-140 words.]</p>`,
    `<h2>What to Watch Next</h2>`,
    `<p>[Forward-looking specifics: court dates, hearing schedules, legislative calendar, regulatory timelines. Give readers exactly what to monitor and when. 110-140 words.]</p>`,
    `<p><strong>DownRange Bottom Line:</strong> [2-3 sentence direct editorial verdict. What should a serious gun owner DO with this information? Be opinionated — that is the DownRange voice.]</p>`,
    ``,
    `BODY LENGTH: Minimum 750 words. Target 900-1100 words. Non-negotiable.`,
    `HTML TAGS ALLOWED: h2, p, strong, em, ul, li ONLY. No div, no span, no br, no other tags.`,
    ``,
    `"category": one of: breaking, news, law, industry, opinion, training`,
    `"urgencyScore": 1-10 (10=SCOTUS ruling, 9=major court/ATF action, 8=landmark bill passed, 7=major product/legislation, 5-6=industry news, 1-4=soft news)`,
    `"tags": 4-8 specific kebab-case tags`,
    `"relatedStates": array of US state abbreviations mentioned, else []`,
    `"isBreaking": true only if urgencyScore >= 8`,
    ``,
    `SOURCE MATERIAL:`,
    `Title: ${item.title}`,
    `Source: ${item.source || 'Unknown'}`,
    `Published: ${item.publishedAt || new Date().toISOString()}`,
    `Content: ${inputContent}`,
    ``,
    `CRITICAL: Return ONLY a valid JSON object. Start with { end with }. No markdown, no explanation. Escape all quotes in the body HTML string properly.`,
  ].join('\n')

  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    })
    const text = res.data.content[0].text.trim()
    // Strip any accidental markdown fences
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    const parsed = JSON.parse(clean)
    // Ensure body is a string
    if (typeof parsed.body !== 'string') parsed.body = ''
    return parsed
  } catch (err) {
    console.error('Claude rewrite error:', err.message)
    return {
      summary: item.description?.slice(0, 300) || item.title,
      body: `<p>${item.description || item.title}</p>`,
      category: 'news',
      urgencyScore: 3,
      tags: [],
      relatedStates: [],
      isBreaking: false
    }
  }
}

// ── CLAUDE LAW ENRICHER ────────────────────────────────────────────────
async function enrichLawWithClaude(bill) {
  const prompt = `You are the legal intelligence AI for DownRange, a premier Second Amendment news portal. Write a detailed analysis of this firearms legislation for a knowledgeable 2A audience.

Produce a JSON response with:
- summary: A comprehensive 4-6 sentence summary of this bill or law. Include: what it does specifically, who introduced it and when, current status, what legal standard it would have to survive (use Bruen if relevant), and what it means for gun owners in practical terms. Be specific — include bill numbers, sponsor names, committee names, vote counts if known, and affected regulations.
- impact: one of: HIGH, MED, LOW
- analysis: A 2-3 sentence legal analysis: does this law face constitutional challenges under Bruen/Heller? What circuit is handling it? What's the likely timeline to resolution?

Bill data:
Title: ${bill.title}
Number: ${bill.billNumber || 'N/A'}
Status: ${bill.status}
State: ${bill.state || 'Federal'}
Level: ${bill.level}
Current summary: ${bill.summary || 'None'}
Last action: ${bill.lastActionText || bill.lastActionDate || 'Unknown'}

Return ONLY valid JSON, no markdown, no explanation.`

  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 600,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    })
    const text = res.data.content[0].text.trim()
    const clean = text.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.error('Claude law enrichment error:', err.message)
    return { summary: bill.summary, impact: 'MED', analysis: '' }
  }
}

// ── DEDUPLICATION ─────────────────────────────────────────────────────
const seenHashes = new Set()

function hashUrl(url) {
  return crypto.createHash('md5').update(url || '').digest('hex')
}

function isDuplicate(url) {
  const h = hashUrl(url)
  if (seenHashes.has(h)) return true
  seenHashes.add(h)
  return false
}

function resetDedup() { seenHashes.clear() }

// ── DISCORD NOTIFIER ─────────────────────────────────────────────────
async function discordNotify(webhookUrl, embed) {
  if (!webhookUrl) return
  try {
    await axios.post(webhookUrl, { embeds: [embed] })
  } catch (err) {
    console.error('Discord notify error:', err.message)
  }
}

async function notifyStatus({ done, total, failed, lastFeed, cycleNum, eta }) {
  await discordNotify(process.env.DISCORD_WEBHOOK_URL, {
    title: '⚡ DownRange Agent Status',
    color: 0xC8922A,
    fields: [
      { name: 'Cycle', value: `#${cycleNum}`, inline: true },
      { name: 'Progress', value: `${done}/${total}`, inline: true },
      { name: 'Failed', value: `${failed}`, inline: true },
      { name: 'Last Feed', value: lastFeed || '—', inline: true },
      { name: 'ETA', value: eta || 'Calculating...', inline: true },
    ],
    timestamp: new Date().toISOString()
  })
}

async function notifyBreaking(item) {
  await discordNotify(process.env.DISCORD_BREAKING_WEBHOOK, {
    title: '🚨 BREAKING: ' + item.title,
    description: item.summary || item.description?.slice(0, 200),
    color: 0xB91C1C,
    fields: [
      { name: 'Score', value: `${item.urgencyScore}/10`, inline: true },
      { name: 'Source', value: item.source || 'Unknown', inline: true },
    ],
    url: item.url || item.externalUrl,
    timestamp: new Date().toISOString()
  })
}

async function notifyError(message, context = '') {
  await discordNotify(process.env.DISCORD_ERRORS_WEBHOOK, {
    title: '❌ Agent Error',
    description: message,
    color: 0xEF4444,
    fields: context ? [{ name: 'Context', value: context }] : [],
    timestamp: new Date().toISOString()
  })
}

// ── SANITY WRITER ─────────────────────────────────────────────────────
async function publishToSanity(doc) {
  try {
    const res = await axios.post(
      `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}`,
      { mutations: [{ createOrReplace: doc }] },
      {
        headers: {
          Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    )
    return res.data
  } catch (err) {
    console.error('Sanity write error:', err.response?.data || err.message)
    throw err
  }
}

// ── RATE LIMITER ──────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function rateLimitedBatch(items, fn, delayMs = 1000) {
  const results = []
  for (const item of items) {
    try {
      results.push(await fn(item))
    } catch (err) {
      console.error('Batch item error:', err.message)
      results.push(null)
    }
    await sleep(delayMs)
  }
  return results
}

module.exports = {
  rewriteWithClaude,
  enrichLawWithClaude,
  hashUrl, isDuplicate, resetDedup,
  discordNotify, notifyStatus, notifyBreaking, notifyError,
  publishToSanity,
  sleep, rateLimitedBatch
}
