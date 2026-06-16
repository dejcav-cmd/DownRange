export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// NRA-ILA State Gun Laws Sync
// Scrapes https://www.nraila.org/gun-laws/state-gun-laws/ every 10 days
// Runs: 0 0 * * 0,3,6 (Sunday, Wednesday, Saturday at midnight UTC)
// Extracts: Magazine limits, AWB status, CCW info, suppressors, waiting periods, etc.
// Rewrites content to avoid copyright issues
// Updates Sanity stateProfile documents

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_ALERTS || 'https://discordapp.com/api/webhooks/1508603923727126568/...'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const STATE_CODES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
]

const STATE_NAMES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming',
}

// Parse NRA-ILA state page HTML and extract law categories
async function scrapeNRAILAState(stateCode) {
  const stateName = STATE_NAMES[stateCode]
  const url = `https://www.nraila.org/gun-laws/state-gun-laws/${stateCode.toLowerCase()}/`
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (DownRange Law Research)' },
      signal: AbortSignal.timeout(10000),
    })
    
    if (!response.ok) {
      console.error(`[nra-sync] Failed to fetch ${stateCode}: ${response.status}`)
      return null
    }
    
    const html = await response.text()
    
    // Extract key law sections from HTML
    // NRA-ILA structure: each law is in a <div> or <section> with class like "law-category"
    const laws = extractLawSections(html, stateCode)
    
    return {
      state: stateCode,
      stateName,
      url,
      laws,
      fetchedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error(`[nra-sync] Error scraping ${stateCode}:`, err.message)
    return null
  }
}

// Extract and categorize gun laws from HTML
function extractLawSections(html, stateCode) {
  const laws = {
    magazineRestrictions: null,
    awb: null,
    ccw: null,
    suppressors: null,
    waitingPeriod: null,
    permitToCarry: null,
    redFlagLaw: null,
    bgCheck: null,
    otherRestrictions: [],
  }
  
  try {
    // Remove script/style tags
    let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    
    // Extract main content area
    const contentMatch = clean.match(/<main[^>]*>[\s\S]*?<\/main>/i) || clean.match(/<div[^>]*class="[^"]*content[^"]*"[^>]*>[\s\S]*?<\/div>/i)
    const content = contentMatch ? contentMatch[0] : clean
    
    // Look for law sections (headings followed by text)
    const lawRegex = /<h[2-4][^>]*>([^<]+)<\/h[2-4]>([\s\S]*?)(?=<h[2-4]|$)/gi
    let match
    
    while ((match = lawRegex.exec(content)) !== null) {
      const heading = match[1].toLowerCase()
      const text = stripHTML(match[2]).trim().slice(0, 500) // First 500 chars
      
      if (heading.includes('magazine')) {
        laws.magazineRestrictions = text || 'See NRA-ILA for details'
      } else if (heading.includes('assault weapon') || heading.includes('awb')) {
        laws.awb = text || 'See NRA-ILA for details'
      } else if (heading.includes('conceal') || heading.includes('carry permit')) {
        laws.ccw = text || 'See NRA-ILA for details'
      } else if (heading.includes('suppress') || heading.includes('silencer')) {
        laws.suppressors = text || 'See NRA-ILA for details'
      } else if (heading.includes('waiting') || heading.includes('wait period')) {
        laws.waitingPeriod = text || 'See NRA-ILA for details'
      } else if (heading.includes('permit') && heading.includes('purchase')) {
        laws.permitToCarry = text || 'See NRA-ILA for details'
      } else if (heading.includes('red flag') || heading.includes('extreme risk')) {
        laws.redFlagLaw = text || 'See NRA-ILA for details'
      } else if (heading.includes('background') || heading.includes('bgc')) {
        laws.bgCheck = text || 'See NRA-ILA for details'
      } else if (text) {
        laws.otherRestrictions.push({ category: heading, description: text })
      }
    }
  } catch (err) {
    console.error(`[nra-sync] Error parsing HTML for ${stateCode}:`, err.message)
  }
  
  return laws
}

function stripHTML(html) {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// Use Claude to paraphrase NRA-ILA content (avoid copyright)
async function paraphraseForDownRange(lawText, category, stateCode) {
  if (!lawText || lawText === 'See NRA-ILA for details') return lawText
  
  if (!CLAUDE_KEY) return lawText // Fallback if no API key
  
  const prompt = `You are rewriting gun law information for DownRange, a 2A intelligence portal.
Original source: NRA-ILA state gun laws
State: ${stateCode}
Category: ${category}

Original text (max 2 sentences):
"${lawText.slice(0, 200)}"

Rewrite this in your own words (1-2 sentences) to explain the law clearly without copying the original phrasing. Be specific about restrictions or permissions. Avoid starting with "The law" or "The state".`

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 200,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(10000),
    })
    
    if (!res.ok) {
      console.error(`[nra-sync] Claude API error: ${res.status}`)
      return lawText
    }
    
    const data = await res.json()
    return data.content?.[0]?.text || lawText
  } catch (err) {
    console.error(`[nra-sync] Claude paraphrase failed:`, err.message)
    return lawText
  }
}

// Post changes to Discord
async function postToDiscord(changes) {
  if (!changes.length || !DISCORD_WEBHOOK) return
  
  const embed = {
    title: '🔫 Gun Laws Updated (NRA-ILA Sync)',
    description: `${changes.length} state(s) updated`,
    color: 0xC8922A,
    fields: changes.slice(0, 10).map(c => ({
      name: c.state,
      value: c.changes.slice(0, 150) + (c.changes.length > 150 ? '...' : ''),
      inline: false,
    })),
    footer: { text: 'DownRange | NRA-ILA Source' },
    timestamp: new Date().toISOString(),
  }
  
  try {
    await fetch(DISCORD_WEBHOOK, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ embeds: [embed] }),
      signal: AbortSignal.timeout(5000),
    })
  } catch (err) {
    console.error('[nra-sync] Discord post failed:', err.message)
  }
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const key = req.headers.get('x-admin-key') || searchParams.get('key')
  const stateFilter = searchParams.get('state')?.toUpperCase()
  const dry = searchParams.get('dry') === '1'
  
  if (key !== ADMIN_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  const statesToProcess = stateFilter ? [stateFilter] : STATE_CODES
  const results = []
  const changes = []
  let updated = 0
  
  console.log(`[nra-sync] Starting NRA-ILA sync for ${statesToProcess.length} state(s)`)
  
  for (const stateCode of statesToProcess) {
    try {
      // Fetch NRA-ILA page
      const scraped = await scrapeNRAILAState(stateCode)
      if (!scraped) {
        results.push({ state: stateCode, status: 'fetch_failed' })
        continue
      }
      
      // Get existing Sanity record
      const existing = await sanity.fetch(
        '*[_type == "stateProfile" && abbr == $abbr][0]{ _id, name, nraLawSummary, lastNRAUpdate }',
        { abbr: stateCode }
      )
      
      if (!existing?._id) {
        results.push({ state: stateCode, status: 'no_sanity_record' })
        continue
      }
      
      // Build law summary by paraphrasing each category
      const lawCategories = []
      for (const [key, text] of Object.entries(scraped.laws)) {
        if (text && key !== 'otherRestrictions') {
          const category = key
            .replace(/([A-Z])/g, ' $1')
            .toLowerCase()
            .trim()
          const paraphrased = await paraphraseForDownRange(text, category, stateCode)
          if (paraphrased && paraphrased !== 'See NRA-ILA for details') {
            lawCategories.push(`${category}: ${paraphrased}`)
          }
        }
      }
      
      const newSummary = lawCategories.join('\n\n') || 'See NRA-ILA for complete state law information.'
      
      // Check if changed
      const changed = existing.nraLawSummary !== newSummary
      
      if (!dry && changed) {
        await sanity.patch(existing._id).set({
          nraLawSummary: newSummary,
          lastNRAUpdate: new Date().toISOString(),
        }).commit()
        
        updated++
        changes.push({
          state: stateCode,
          changes: newSummary.slice(0, 200),
        })
        
        results.push({ state: stateCode, status: 'updated', changed: true })
      } else if (dry) {
        results.push({ state: stateCode, status: 'dry_run', changed })
      } else {
        results.push({ state: stateCode, status: 'no_change' })
      }
      
      // Rate limit: 1 state/second
      await new Promise(r => setTimeout(r, 1000))
      
    } catch (err) {
      console.error(`[nra-sync] Error processing ${stateCode}:`, err)
      results.push({ state: stateCode, status: 'error', error: err.message })
    }
  }
  
  // Post to Discord if changes
  if (!dry && changes.length > 0) {
    await postToDiscord(changes)
  }
  
  console.log(`[nra-sync] Completed: ${updated} state(s) updated`)
  
  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    source: 'NRA-ILA (https://www.nraila.org/gun-laws/state-gun-laws/)',
    processed: statesToProcess.length,
    updated,
    dry,
    changed: changes.length,
    results,
  })
}
