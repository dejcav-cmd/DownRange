const crypto = require('crypto')
const axios = require('axios')

// ── CLAUDE REWRITER ───────────────────────────────────────────────────
async function rewriteWithClaude(item) {
  const inputContent = (item.description || item.content || item.contentSnippet || '').slice(0, 3000)
  const prompt = `Write a DownRange article. DownRange is a firearms and Second Amendment portal run by DJ Cavalcanti, a gun owner based in Washington State.

WRITING RULES — violating these ruins the article:
- Write like a person, not a content generator. Direct sentences. Active voice. Specific facts.
- BANNED WORDS: comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, shed light on, it remains to be seen, stakeholders, holistic, takeaway, unpack, explore
- NO padded openings. Start with the hardest fact. First sentence names who did what.
- NO hedging: "may potentially", "could possibly", "appears to suggest". State facts as facts.
- NO passive when active works. The governor signed the bill — not the bill was signed.
- NO empty transitions: Furthermore, Additionally, Moreover, In light of this.
- Short sentences that land. Specific over vague. Named people, numbered laws, dollar amounts, calibers.
- Opinions go in Bottom Line only. State them plainly.

GOOD OPENING: "The ATF reversed course on pistol braces Thursday, rescinding the rule that reclassified millions of pistols as short-barreled rifles."
BAD OPENING: "In a significant development with far-reaching implications for the firearms community..."

Return ONLY a valid JSON object:

"summary": 2-3 sentences. Key facts and why it matters to gun owners. Max 350 characters. No AI phrases.

"body": Complete article as HTML. MANDATORY STRUCTURE:

<h2>[Specific factual headline — what happened, who did it]</h2>
<p>[Opening: hard news. Names, agencies, bill numbers, calibers, dollar amounts. First sentence is the full story. 120-150 words.]</p>

<h2>Background and Context</h2>
<p>[Why this matters in the broader 2A landscape. Reference Heller, Bruen, McDonald, prior laws, agency history, market context as relevant. 130-160 words.]</p>

<h2>What This Means for Gun Owners</h2>
<p>[Direct, specific impact. Which states, which products, what dollar amounts, what they can do. Concrete. 130-160 words.]</p>

<h2>Industry Impact</h2>
<p>[Manufacturer, dealer, retailer effects. Or advocacy group positions from NRA, GOA, SAF, FPC — their actual stated positions. 110-140 words.]</p>

<h2>What to Watch Next</h2>
<p>[Forward-looking specifics: court dates, hearing dates, comment periods, bill markups. Name the judges, circuits, committees. 110-140 words.]</p>

<p><strong>DownRange Bottom Line:</strong> [2-3 sentences. Direct editorial verdict. What should a serious gun owner do right now? State an opinion plainly.]</p>

REQUIREMENTS:
- Minimum 750 words. Target 900-1100 words.
- HTML ONLY: h2, p, strong, em, ul, li. No div, span, br, or other tags.
- strong = names, bill numbers, key facts. em = key terms, used sparingly.

"category": one of: breaking, news, law, industry, opinion, training
"urgencyScore": 1-10 integer
"tags": 4-8 specific kebab-case tags
"relatedStates": array of affected US state abbreviations, else []
"isBreaking": true only if urgencyScore >= 8

SOURCE MATERIAL:
Title: ${item.title}
Source: ${item.source || 'Unknown'}
Published: ${item.publishedAt || new Date().toISOString()}
Content: ${inputContent}

CRITICAL: Return ONLY a valid JSON object. Start with { end with }. No markdown, no explanation. Escape all quotes in the HTML.`

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
  const prompt = `Analyze this firearms bill or law for DownRange gun owners. No AI phrases. No "comprehensive", "landmark", "significant development", "it remains to be seen", or padded language. Write like a gun owner who reads case law.

Produce a JSON response with:
- summary: 4-6 direct sentences. What the bill does, who sponsored it, current status, what it means for gun owners in plain terms. Include bill number, sponsor name, committee, vote counts if known. First sentence states the bottom line.
- impact: one of: HIGH, MED, LOW
- analysis: 2-3 sentences. Does this survive Bruen/Heller scrutiny? What circuit, what timeline? State a conclusion — do not hedge.

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
