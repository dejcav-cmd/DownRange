const crypto = require('crypto')
const axios = require('axios')

// ── CLAUDE REWRITER ───────────────────────────────────────────────────
async function rewriteWithClaude(item) {
  const prompt = `You are the editorial AI for DownRange, America's premier firearms and Second Amendment news portal. Your voice is authoritative, factual, and direct — like a seasoned firearms journalist.

Given this raw news item, produce a JSON response with these fields:
- summary: 2-sentence DownRange editorial summary (max 200 chars). No fluff.
- category: one of: breaking, news, law, industry, opinion, training
- urgencyScore: integer 1-10. (9-10=BREAKING law/SCOTUS, 7-8=major legislation, 5-6=industry news, 1-4=opinion/training)
- tags: array of 3-5 relevant tags (e.g. ["ATF","pistol-brace","5th-circuit"])
- relatedStates: array of US state abbreviations mentioned (e.g. ["TX","FL"]) or empty array
- isBreaking: boolean, true if urgencyScore >= 8

Raw item:
Title: ${item.title}
Source: ${item.source || 'Unknown'}
Description: ${item.description || item.content || ''}

Return ONLY valid JSON, no markdown, no explanation.`

  try {
    const res = await axios.post('https://api.anthropic.com/v1/messages', {
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    }, {
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json'
      }
    })
    const text = res.data.content[0].text.trim()
    return JSON.parse(text)
  } catch (err) {
    console.error('Claude rewrite error:', err.message)
    return {
      summary: item.description?.slice(0, 200) || item.title,
      category: 'news',
      urgencyScore: 3,
      tags: [],
      relatedStates: [],
      isBreaking: false
    }
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
  hashUrl, isDuplicate, resetDedup,
  discordNotify, notifyStatus, notifyBreaking, notifyError,
  publishToSanity,
  sleep, rateLimitedBatch
}
