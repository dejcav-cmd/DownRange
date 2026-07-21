/**
 * Giveaways Feed — DownRange v3
 * 
 * Real web scraping via Jina proxy (r.jina.ai) — no hallucination.
 * Sources: wintheguns.com, gungiveaways.net, popularsuppressors.com,
 *          PSA, Lucky Gunner, Brownells, NRA, GOA, Honest Outlaw, Pew Pew Tactical
 * 
 * Runs: 8:03am + 8:03pm UTC daily via vercel.json
 */
import { publishToSanity, sleep } from '../utils.js'

const SOURCES = [
  { name: 'wintheguns.com',         url: 'https://r.jina.ai/https://wintheguns.com/',                         type: 'aggregator'   },
  { name: 'gungiveaways.net',        url: 'https://r.jina.ai/https://gungiveaways.net/',                       type: 'aggregator'   },
  { name: 'popularsuppressors.com',  url: 'https://r.jina.ai/https://popularsuppressors.com/',                 type: 'aggregator'   },
  { name: 'Palmetto State Armory',   url: 'https://r.jina.ai/https://palmettostatearmory.com/giveaways',       type: 'retailer'     },
  { name: 'Lucky Gunner',            url: 'https://r.jina.ai/https://www.luckygunner.com/lounge/giveaways/',   type: 'retailer'     },
  { name: 'Brownells',               url: 'https://r.jina.ai/https://www.brownells.com/promotions/',           type: 'retailer'     },
  { name: 'NRA Foundation',          url: 'https://r.jina.ai/https://www.nrafoundation.org/sweepstakes/',      type: 'organization' },
  { name: 'GOA',                     url: 'https://r.jina.ai/https://gunowners.org/contests/',                  type: 'organization' },
  { name: 'Pew Pew Tactical',        url: 'https://r.jina.ai/https://www.pewpewtactical.com/giveaway/',        type: 'youtuber'     },
  { name: 'Honest Outlaw',           url: 'https://r.jina.ai/https://www.honestoutlaw.com/giveaway/',          type: 'youtuber'     },
]

function detectCategory(text) {
  const t = (text || '').toLowerCase()
  if (/pistol|handgun|glock|sig|p365|p320|9mm|1911|revolver|canik|hellcat/.test(t)) return 'pistol'
  if (/ar-15|ar15|rifle|carbine|\.223|5\.56|ak-?47|m4|sbr|pcc/.test(t)) return 'rifle'
  if (/shotgun|gauge|mossberg|benelli|remington 870/.test(t)) return 'shotgun'
  if (/ammo|rounds|brass|ammunition|bulk/.test(t)) return 'ammo'
  if (/suppressor|silencer|can |nfa|form 4/.test(t)) return 'nfa'
  if (/scope|optic|red dot|lpvo|eotech|aimpoint|vortex|trijicon|holosun/.test(t)) return 'optics'
  if (/holster|sling|light|knife|bag|case|vest|plate carrier/.test(t)) return 'gear'
  return 'accessories'
}

function extractSponsor(text, sourceName) {
  const brands = ['Glock','SIG Sauer','SIG','Ruger','Smith & Wesson','Springfield Armory',
    'Taurus','Beretta','CZ','Walther','Shadow Systems','Palmetto State Armory','PSA',
    'Century Arms','Faxon','EOTech','Vortex','Primary Arms','Dead Air','SilencerCo',
    'Streamlight','Swampfox','Magpul','Kimber','Colt','Benelli','Mossberg',
    'Brownells','Lucky Gunner','Daniel Defense','Aero Precision','BCM','Wilson Combat',
    'Nightforce','Trijicon','Aimpoint','Holosun','Leupold','LWRCI','Noveske',
    'Canik','FN America','Staccato','IWI','Christensen Arms','Kel-Tec',
  ]
  const t = (text || '').toLowerCase()
  for (const b of brands) { if (t.includes(b.toLowerCase())) return b }
  return sourceName || 'Various'
}

function parseEndDate(text) {
  const iso = text.match(/20\d\d[-\/](0?[1-9]|1[0-2])[-\/](0?[1-9]|[12]\d|3[01])/)
  if (iso) {
    const parts = iso[0].match(/(\d{4})[-\/](\d{1,2})[-\/](\d{1,2})/)
    if (parts) return `${parts[1]}-${parts[2].padStart(2,'0')}-${parts[3].padStart(2,'0')}`
  }
  const us = text.match(/(\d{1,2})\/(\d{1,2})\/(20\d\d|\d\d)/)
  if (us) {
    const year = us[3].length === 2 ? '20' + us[3] : us[3]
    return `${year}-${us[1].padStart(2,'0')}-${us[2].padStart(2,'0')}`
  }
  return null
}

function extractValue(text) {
  const m = (text || '').match(/\$\s*([\d,]+)/g)
  if (!m) return 0
  return Math.max(...m.map(v => parseInt(v.replace(/[$,]/g, ''))))
}

function extractGiveawayLinks(markdown, sourceName) {
  const results = []
  const today = new Date().toISOString().split('T')[0]

  const linkRe = /\[([^\]]{8,200})\]\((https?:\/\/[^\s\)]{10,300})\)/g
  let match
  while ((match = linkRe.exec(markdown)) !== null) {
    const [, text, url] = match
    if (/^(home|about|contact|privacy|terms|menu|search|subscribe)/i.test(text.trim())) continue
    if (/\.(png|jpg|jpeg|gif|svg|webp|ico)(\?|$)/i.test(url)) continue
    if (/twitter\.com|facebook\.com|instagram\.com|youtube\.com\/channel|tiktok\.com/i.test(url)) continue
    // Must contain a genuine giveaway action word
    const isGiveawayText = /(win a|win an|give ?away|enter to win|sweepstake|contest|free (gun|rifle|pistol|ammo|suppressor|firearm)|prize pack|enter now|enter here)/i.test(text)
    // OR be a pure giveaway platform URL (gleam, rafflecopter, etc.)
    const isGiveawayPlatform = /(gleam\.io|wn\.nr|swee\.ps|rafflecopter\.com|kingsumo\.com|share-w\.in|woobox\.com|viral-loops\.com)/i.test(url)
    if (!isGiveawayText && !isGiveawayPlatform) continue
    // Skip article titles masquerading as links
    if (/^(how |why |what |the |a |an |inside |meet |review|guide|tips|podcast|blog|news|about|learn|shop|store|join|download|program|contact)/i.test(text.trim())) continue

    const ctxStart = Math.max(0, match.index - 50)
    const ctx = markdown.slice(ctxStart, match.index + text.length + 250)
    const endDate = parseEndDate(ctx)
    if (endDate && endDate < today) continue
    const value = extractValue(ctx)

    results.push({
      title: text.replace(/\*/g, '').replace(/\s+/g, ' ').trim(),
      entryUrl: url.split(')')[0].trim(),
      prize: text.replace(/\*/g, '').trim(),
      prizeValue: value,
      endDate,
      category: detectCategory(text),
      sponsor: extractSponsor(text, sourceName),
      sourceType: 'external',
      featured: value >= 1500,
      source: sourceName,
    })
  }

  // Also catch giveaway platform URLs directly
  const platformRe = /\bhttps?:\/\/(?:wn\.nr|swee\.ps|gleam\.io|kingsumo\.com|rafflecopter\.com|share-w\.in|viral-loops\.com|woobox\.com)[^\s\)>\]"]{5,150}/g
  while ((match = platformRe.exec(markdown)) !== null) {
    const url = match[0].replace(/[.,;:!?)]+$/, '')
    const ctx = markdown.slice(Math.max(0, match.index - 200), match.index + 300)
    if (!/(win a|giveaway|enter to win|sweepstake|contest|free (gun|rifle|pistol|ammo)|prize)/i.test(ctx)) continue
    const titleMatch = ctx.match(/#{1,3}\s+([^\n]{10,120})|(?:\*\*|__)([^\n*_]{10,120})(?:\*\*|__)/m)
    const title = titleMatch ? (titleMatch[1] || titleMatch[2] || '').trim() : ''
    if (!title) continue
    const endDate = parseEndDate(ctx)
    if (endDate && endDate < new Date().toISOString().split('T')[0]) continue
    results.push({
      title: title.replace(/\*/g,'').trim(),
      entryUrl: url,
      prize: title.replace(/\*/g,'').trim(),
      prizeValue: extractValue(ctx),
      endDate,
      category: detectCategory(ctx),
      sponsor: extractSponsor(ctx, sourceName),
      sourceType: 'external',
      featured: extractValue(ctx) >= 1500,
      source: sourceName,
    })
  }
  return results
}

async function fetchSource(source) {
  try {
    const res = await fetch(source.url, {
      headers: { 'Accept': 'text/plain,text/html,*/*', 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)' },
      signal: AbortSignal.timeout(18000),
    })
    if (!res.ok) { console.warn(`[GIVEAWAYS] ${source.name}: HTTP ${res.status}`); return [] }
    const text = await res.text()
    if (!text || text.length < 200) { console.warn(`[GIVEAWAYS] ${source.name}: empty`); return [] }
    const results = extractGiveawayLinks(text, source.name)
    console.log(`[GIVEAWAYS] ${source.name}: ${results.length} found`)
    return results
  } catch (e) {
    console.warn(`[GIVEAWAYS] ${source.name} failed: ${e.message}`)
    return []
  }
}

function dedup(list) {
  const seen = new Set()
  return list.filter(g => {
    const key = (g.entryUrl || '').toLowerCase().replace(/[?#].*/,'').replace(/\/$/,'')
    if (!key || key.length < 10 || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function runGiveawaysFeed() {
  console.log('[GIVEAWAYS] ===== Giveaways feed v3 ====')
  const t = Date.now()
  let done = 0, skipped = 0, expired = 0
  const errors = [], saved = []

  const { createClient } = await import('@sanity/client')
  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
    dataset: 'production', apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN, useCdn: false,
  })
  const today = new Date().toISOString().split('T')[0]

  // Expire old giveaways
  try {
    const expiredDocs = await sanity.fetch(
      `*[_type=="giveaway" && active==true && defined(endDate) && endDate < $today]{_id,endDate}`,
      { today }
    )
    if (expiredDocs.length > 0) {
      await sanity.mutate(expiredDocs.map(g => ({ patch: { id: g._id, set: { active: false } } })))
      expired = expiredDocs.length
      console.log(`[GIVEAWAYS] Expired ${expired}`)
    }
  } catch (e) { console.warn('[GIVEAWAYS] Expiry failed:', e.message) }

  // Get existing URLs
  let existingUrls = new Set()
  try {
    const existing = await sanity.fetch('*[_type=="giveaway"]{entryUrl}')
    existingUrls = new Set((existing || []).map(g =>
      (g.entryUrl || '').toLowerCase().replace(/[?#].*/,'').replace(/\/$/,'')))
    console.log(`[GIVEAWAYS] ${existingUrls.size} existing in Sanity`)
  } catch (e) { console.warn('[GIVEAWAYS] Could not fetch existing:', e.message) }

  // Scrape all sources
  const allRaw = []
  for (let i = 0; i < SOURCES.length; i += 3) {
    const batch = SOURCES.slice(i, i + 3)
    const results = await Promise.allSettled(batch.map(s => fetchSource(s)))
    for (const r of results) { if (r.status === 'fulfilled') allRaw.push(...r.value) }
    if (i + 3 < SOURCES.length) await sleep(800)
  }

  const giveaways = dedup(allRaw)
  console.log(`[GIVEAWAYS] ${allRaw.length} raw → ${giveaways.length} after dedup`)

  const mutations = []
  for (const g of giveaways) {
    if (!g.entryUrl || !g.title) { skipped++; continue }
    if (g.endDate && g.endDate < today) { skipped++; continue }
    try { new URL(g.entryUrl) } catch { skipped++; continue }
    const normUrl = g.entryUrl.toLowerCase().replace(/[?#].*/,'').replace(/\/$/,'')
    if (existingUrls.has(normUrl)) { skipped++; continue }

    const _id = 'giveaway-' + Buffer.from(g.entryUrl).toString('base64').slice(0,24).replace(/[^a-zA-Z0-9]/g,'')
    mutations.push({
      createIfNotExists: {
        _id, _type: 'giveaway',
        title: g.title, sponsor: g.sponsor || 'Various', entryUrl: g.entryUrl,
        prize: g.prize || g.title, prizeValue: g.prizeValue || 0,
        endDate: g.endDate || null, category: g.category || 'accessories',
        sourceType: g.sourceType || 'external', featured: g.featured || false,
        active: true, source: g.source || 'web', addedAt: new Date().toISOString(),
      }
    })
    done++
    saved.push(g.title.slice(0,60))
  }

  for (let i = 0; i < mutations.length; i += 50) {
    try { await sanity.mutate(mutations.slice(i, i+50), { returnDocuments: false }) }
    catch (e) { errors.push(e.message.slice(0,80)) }
  }

  const ms = Date.now() - t
  console.log(`[GIVEAWAYS] ${done} new, ${skipped} skipped, ${expired} expired, ${errors.length} errors in ${ms}ms`)
  return { done, skipped, expired, errors, ms, saved, headlines: saved.slice(0,20) }
}
