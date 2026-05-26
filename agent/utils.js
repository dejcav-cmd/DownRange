const crypto = require('crypto')
const axios = require('axios')

// ── CLAUDE REWRITER ───────────────────────────────────────────────────
async function rewriteWithClaude(item) {
  const prompt = `You are the editorial AI for DownRange, America's premier firearms and Second Amendment intelligence portal. Your voice is authoritative, factual, and direct — like a seasoned firearms journalist writing for a sophisticated 2A audience.

Given this raw news item, produce a JSON response with these fields:
- summary: A 2-3 sentence lede paragraph for the article. Hard-hitting, specific, no filler. Max 300 chars.
- body: A full DownRange editorial rewrite of this story. Write 4-6 paragraphs as HTML using only <p>, <strong>, <em>, and <ul><li> tags. Structure: (1) Lead paragraph — what happened, why it matters; (2) Background context — history or legal framework relevant to 2A readers; (3) Impact paragraph — what this means for gun owners, dealers, or 2A rights specifically; (4) What to watch — next steps, court dates, legislative calendar, or action items for readers. Do NOT use any heading tags. Write for an audience that knows their guns and their rights. Be specific with names, case numbers, bill numbers, and states. Minimum 350 words.
- category: one of: breaking, news, law, industry, opinion, training
- urgencyScore: integer 1-10. (9-10=BREAKING SCOTUS/ATF ruling, 7-8=major legislation passed, 5-6=industry/product news, 1-4=opinion/training content)
- tags: array of 3-6 relevant tags using kebab-case (e.g. ["atf","pistol-brace","5th-circuit","texas"])
- relatedStates: array of US state abbreviations if any states are specifically mentioned (e.g. ["TX","FL"]) or empty array
- isBreaking: boolean, true only if urgencyScore >= 8

Raw item:
Title: ${item.title}
Source: ${item.source || 'Unknown'}
Content: ${(item.description || item.content || '').slice(0, 1500)}

Return ONLY valid JSON with no markdown fences, no explanation, no preamble. The body field must be valid HTML string.`

  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
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
