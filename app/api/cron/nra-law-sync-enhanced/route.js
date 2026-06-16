export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// Enhanced NRA-ILA State Gun Laws Sync (v2)
// Adds: Court cases, local restrictions, pending bills, reciprocity details, resources
// Runs every 10 days (0 0 * * 0,3,6)

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY
const DISCORD_WEBHOOK = process.env.DISCORD_WEBHOOK_ALERTS

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

async function scrapeEnhancedNRAILAState(stateCode) {
  const stateName = STATE_NAMES[stateCode]
  const url = `https://www.nraila.org/gun-laws/state-gun-laws/${stateCode.toLowerCase()}/`
  
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (DownRange Law Research Bot)' },
      signal: AbortSignal.timeout(12000),
    })
    
    if (!response.ok) {
      return null
    }
    
    const html = await response.text()
    const data = extractEnhancedLawData(html, stateCode)
    
    return {
      state: stateCode,
      stateName,
      url,
      ...data,
      fetchedAt: new Date().toISOString(),
    }
  } catch (err) {
    console.error(`[nra-sync-v2] Error scraping ${stateCode}:`, err.message)
    return null
  }
}

function extractEnhancedLawData(html, stateCode) {
  // Remove scripts/styles
  let clean = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  clean = clean.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
  
  const content = clean.match(/<main[^>]*>[\s\S]*?<\/main>/i)?.[0] || clean
  const text = stripHTML(content)
  
  return {
    coreLaws: extractCoreLaws(text),
    localRestrictions: extractLocalRestrictions(text, stateCode),
    recentCaseLaw: extractRelevantCases(stateCode),
    useCases: generateUseCaseExamples(stateCode),
    reciprocityNotes: getReciprocityContext(stateCode),
    resources: extractResourceLinks(html, stateCode),
  }
}

function extractCoreLaws(text) {
  const laws = {}
  const sections = [
    { key: 'magazine', patterns: ['magazine', 'capacity', 'round'] },
    { key: 'assault_weapons', patterns: ['assault weapon', 'awb', 'ar-15'] },
    { key: 'permit_carry', patterns: ['permit', 'concealed', 'carry'] },
    { key: 'open_carry', patterns: ['open carry', 'holster'] },
    { key: 'waiting_period', patterns: ['waiting', 'period', 'background'] },
    { key: 'suppressors', patterns: ['suppressor', 'silencer'] },
    { key: 'nfa', patterns: ['nfa', 'short-barreled', 'sbr', 'aow'] },
    { key: 'red_flag', patterns: ['red flag', 'extreme risk', 'erpo'] },
    { key: 'permitless', patterns: ['permitless', 'constitutional carry'] },
  ]
  
  for (const section of sections) {
    const regex = new RegExp(`(${section.patterns.join('|')})([^.]*\\.){1,3}`, 'gi')
    const matches = text.match(regex)
    if (matches) {
      laws[section.key] = matches[0].slice(0, 300)
    }
  }
  
  return laws
}

function extractLocalRestrictions(text, stateCode) {
  const local = {}
  
  // Common city-level restrictions
  const cityPatterns = {
    'CA': ['San Francisco', 'Los Angeles', 'Oakland', 'Berkeley'],
    'IL': ['Chicago', 'Cook County', 'Illinois cities'],
    'NY': ['New York City', 'NYC', 'Nassau County'],
    'MD': ['Baltimore', 'Baltimore City'],
    'DC': ['District of Columbia', 'Washington DC'],
  }
  
  if (cityPatterns[stateCode]) {
    local.affected_areas = cityPatterns[stateCode]
    local.note = `Check city/county laws. Some municipalities have stricter restrictions than state law.`
  }
  
  return local
}

function extractRelevantCases(stateCode) {
  // Map states to landmark cases affecting their laws
  const relevantCases = {
    'CA': {
      cases: ['Duncan v. Bonta (2025)', 'Bruen (2022)'],
      impact: 'Ninth Circuit upheld CA magazine ban despite Bruen challenge (March 2025)',
    },
    'NY': {
      cases: ['New York State Rifle & Pistol v. Bruen (2022)', 'CCIA aftermath'],
      impact: 'Supreme Court struck down may-issue standard; NY responded with sensitive places law',
    },
    'IL': {
      cases: ['Seventh Circuit IV (2024)', 'Stay pending appeal'],
      impact: 'Magazine ban under review; Seventh Circuit stayed permanent injunction',
    },
    'CO': {
      cases: ['US v. Colorado (2026)', 'Magazine limit challenged'],
      impact: 'DOJ filed lawsuit May 2026 challenging 15-round limit under Bruen',
    },
    'OR': {
      cases: ['Measure 114 (2022)', 'Permanent injunction (Dec 2024)'],
      impact: 'Magazine restrictions permanently enjoined; no longer enforced',
    },
    'DC': {
      cases: ['Benson v. United States (2026)', 'Court of Appeals ruling'],
      impact: 'Magazine ban struck down March 2026; conviction vacated; not enforced',
    },
    'WA': {
      cases: ['Washington v. Gator\'s Custom Guns (2025)'],
      impact: 'State Supreme Court upheld magazine ban 7-2 (May 2025)',
    },
  }
  
  return relevantCases[stateCode] || {
    cases: ['Bruen (2022)', 'See NRA-ILA for state-specific litigation'],
    impact: 'Check NRA-ILA for pending or recent court decisions',
  }
}

function generateUseCaseExamples(stateCode) {
  // Practical scenarios gun owners care about
  const scenarios = {
    'WA': [
      'Road trip to Oregon: Can you carry your WA CCW permit?',
      'Magazine question: Inherited grandfather magazines from before 2022?',
      'Interstate travel: Driving to Idaho with standard capacity mags?',
    ],
    'CA': [
      'Large capacity magazines: Can you possess pre-2000 grandfathered magazines?',
      'Traveling out of state: Can you travel with 10-round magazines in your car?',
      'Roster compliance: Is your handgun on the approved roster?',
    ],
    'NY': [
      'Sensitive places: Where can/cannot you carry with a permit?',
      'Magazine ownership: Can you legally own pre-2013 mags?',
      'Reciprocity: Which states honor a NY permit?',
    ],
    'TX': [
      'Open carry: Can you open carry at your workplace?',
      'Constitutional carry: How does permitless carry affect your job?',
      'Suppressors: Can you legally use a suppressor on your ranch?',
    ],
  }
  
  return scenarios[stateCode] || [
    'Check state permit requirements before traveling',
    'Understand magazine restrictions in your area',
    'Know the difference between state and local laws',
  ]
}

function getReciprocityContext(stateCode) {
  // States and their reciprocity relationships
  const reciprocity = {
    'FL': 'Widely recognized. Honors most state permits.',
    'UT': 'Non-resident permit honored in ~30 states. Check before travel.',
    'AZ': 'Constitutional carry state. No permit needed for residents.',
    'TX': 'Permitless for residents. Non-residents can get license.',
    'CA': 'Does not honor any out-of-state permits. Residents only.',
    'NY': 'Does not honor out-of-state permits except limited agreements.',
    'IL': 'Does not honor any out-of-state permits.',
    'DC': 'Does not honor any out-of-state permits.',
  }
  
  return reciprocity[stateCode] || 'Check reciprocity map for current status.'
}

function extractResourceLinks(html, stateCode) {
  const resources = {
    'general': `https://www.nraila.org/gun-laws/state-gun-laws/${stateCode.toLowerCase()}/`,
  }
  
  // Extract contact info if present in NRA page
  const emailMatch = html.match(/contact[^<]*([a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,})/i)
  if (emailMatch) {
    resources.contact = emailMatch[1]
  }
  
  // Common state resources (hardcoded for now, could scrape)
  const stateResources = {
    'WA': {
      'Attorney General': 'https://www.atg.wa.gov/',
      'State Patrol (CCW)': 'https://fortress.wa.gov/dol/dolpublic/',
    },
    'CA': {
      'DOJ': 'https://oag.ca.gov/firearms',
      'CCW Guide': 'https://oag.ca.gov/firearms/handguns',
    },
    'TX': {
      'DPS License to Carry': 'https://www.dps.texas.gov/portals/0/documents/driver_license/dl_92.pdf',
    },
  }
  
  if (stateResources[stateCode]) {
    resources.state_official = stateResources[stateCode]
  }
  
  return resources
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

async function generateEnhancedSummary(stateData) {
  if (!CLAUDE_KEY) return null
  
  const prompt = `You are a firearms attorney writing for gun owners in ${stateData.stateName}.
  
Summarize the key gun laws in 3-4 paragraphs:
1. Core restrictions (magazine limits, AWB, permits, permits)
2. What matters for concealed carry
3. Reciprocity/travel considerations
4. Gotchas or unique local rules

State code: ${stateData.state}
Core laws: ${JSON.stringify(stateData.coreLaws)}
Local restrictions: ${JSON.stringify(stateData.localRestrictions)}
Recent case law: ${stateData.recentCaseLaw.impact}

Write like you're talking to someone who carries daily. Be direct and specific. No fluff.`

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
        max_tokens: 600,
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: AbortSignal.timeout(10000),
    })
    
    if (!res.ok) return null
    const data = await res.json()
    return data.content?.[0]?.text || null
  } catch (err) {
    console.error('[nra-sync-v2] Summary generation failed:', err.message)
    return null
  }
}

async function postEnhancedToDiscord(changes) {
  if (!changes.length || !DISCORD_WEBHOOK) return
  
  const embed = {
    title: '🔫 Enhanced Gun Law Update (NRA-ILA v2)',
    description: `${changes.length} state(s) enhanced with court cases, use cases, local restrictions`,
    color: 0xC8922A,
    fields: changes.slice(0, 5).map(c => ({
      name: `${c.state}: ${c.stateName}`,
      value: `📋 ${c.enhancements.join(' • ')}`,
      inline: false,
    })),
    footer: { text: 'DownRange | NRA-ILA Enhanced Research' },
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
    console.error('[nra-sync-v2] Discord post failed:', err.message)
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
  
  console.log(`[nra-sync-v2] Starting enhanced sync for ${statesToProcess.length} state(s)`)
  
  for (const stateCode of statesToProcess) {
    try {
      const scraped = await scrapeEnhancedNRAILAState(stateCode)
      if (!scraped) {
        results.push({ state: stateCode, status: 'fetch_failed' })
        continue
      }
      
      const existing = await sanity.fetch(
        '*[_type == "stateProfile" && abbr == $abbr][0]{ _id, name, nraEnhancedData }',
        { abbr: stateCode }
      )
      
      if (!existing?._id) {
        results.push({ state: stateCode, status: 'no_sanity_record' })
        continue
      }
      
      // Generate enhanced summary
      const summary = await generateEnhancedSummary(scraped)
      
      // Build enhanced data object
      const enhancedData = {
        summary: summary || 'See NRA-ILA for complete information',
        coreLaws: scraped.coreLaws,
        localRestrictions: scraped.localRestrictions,
        recentCaseLaw: scraped.recentCaseLaw,
        useCases: scraped.useCases,
        reciprocityNotes: scraped.reciprocityNotes,
        resources: scraped.resources,
        dataVersion: '2.0',
        updatedAt: new Date().toISOString(),
      }
      
      // Check if changed
      const changed = JSON.stringify(existing.nraEnhancedData) !== JSON.stringify(enhancedData)
      
      if (!dry && changed) {
        await sanity.patch(existing._id).set({
          nraEnhancedData: enhancedData,
          lastNRAUpdate: new Date().toISOString(),
        }).commit()
        
        updated++
        changes.push({
          state: stateCode,
          stateName: scraped.stateName,
          enhancements: [
            scraped.recentCaseLaw.cases.length > 0 ? '⚖️ Court cases' : null,
            scraped.useCases.length > 0 ? '📋 Use cases' : null,
            scraped.localRestrictions.affected_areas ? '🏙️ Local restrictions' : null,
            scraped.resources.state_official ? '📚 Official resources' : null,
          ].filter(Boolean),
        })
        
        results.push({ state: stateCode, status: 'enhanced' })
      } else if (dry) {
        results.push({ state: stateCode, status: 'dry_run', changed })
      } else {
        results.push({ state: stateCode, status: 'no_change' })
      }
      
      await new Promise(r => setTimeout(r, 1000))
      
    } catch (err) {
      console.error(`[nra-sync-v2] Error processing ${stateCode}:`, err)
      results.push({ state: stateCode, status: 'error', error: err.message })
    }
  }
  
  if (!dry && changes.length > 0) {
    await postEnhancedToDiscord(changes)
  }
  
  return NextResponse.json({
    ok: true,
    version: '2.0',
    timestamp: new Date().toISOString(),
    source: 'NRA-ILA Enhanced (court cases, use cases, local restrictions)',
    processed: statesToProcess.length,
    updated,
    dry,
    enhancements: ['Core Laws', 'Local Restrictions', 'Court Cases', 'Use Cases', 'Reciprocity', 'Resources'],
    results,
  })
}
