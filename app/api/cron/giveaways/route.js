export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Category detection from title
function detectCategory(title) {
  const t = title.toLowerCase()
  if (t.includes('pistol') || t.includes('handgun') || t.includes('glock') || t.includes('sig') || t.includes('9mm') || t.includes('1911') || t.includes('revolver')) return 'pistol'
  if (t.includes('ar-15') || t.includes('ar15') || t.includes('rifle') || t.includes('carbine') || t.includes('ak') || t.includes('m4')) return 'rifle'
  if (t.includes('shotgun') || t.includes('gauge')) return 'shotgun'
  if (t.includes('ammo') || t.includes('rounds') || t.includes('brass') || t.includes('ammunition')) return 'ammo'
  if (t.includes('optic') || t.includes('scope') || t.includes('red dot') || t.includes('lpvo') || t.includes('eotech') || t.includes('vortex')) return 'optics'
  if (t.includes('suppressor') || t.includes('silencer')) return 'nfa'
  if (t.includes('gear') || t.includes('tactical') || t.includes('holster') || t.includes('light') || t.includes('knife') || t.includes('bag')) return 'gear'
  return 'accessories'
}

function parseValue(str) {
  if (!str) return 0
  const m = str.replace(/[$,]/g, '').match(/[\d.]+/)
  return m ? Math.round(parseFloat(m[0])) : 0
}

function parseEndDate(str) {
  if (!str) return null
  str = str.trim()
  try {
    // M/D/YY or M/D/YYYY
    const slashParts = str.split('/')
    if (slashParts.length === 3) {
      const y = parseInt(slashParts[2]) < 100 ? 2000 + parseInt(slashParts[2]) : parseInt(slashParts[2])
      const m = parseInt(slashParts[0])
      const d = parseInt(slashParts[1])
      if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
        return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
      }
    }
    // Try ISO or natural language date
    const parsed = new Date(str)
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2025) {
      return parsed.toISOString().split('T')[0]
    }
    return null
  } catch { return null }
}

function extractSponsor(title) {
  const brands = [
    'Glock','SIG Sauer','SIG','Ruger','Smith & Wesson','S&W','Springfield Armory',
    'Taurus','Beretta','CZ','Heckler & Koch','H&K','Walther','Shadow Systems',
    'Palmetto State Armory','PSA','Century Arms','Faxon','AT3','Mad Pig Customs',
    'Bul Armory','EOTech','Vortex','Primary Arms','Dead Air','SilencerCo',
    'Streamlight','Swampfox','Magpul','Kimber','Colt','Benelli','Mossberg',
    'Remington','Winchester','Browning','Savage','Tikka','Christensen Arms',
    'Daniel Defense','Aero Precision','BCM','Wilson Combat','Nightforce',
    'Trijicon','Aimpoint','Holosun','Leupold','Burris','Bushnell',
    'LWRCI','Noveske','Canik','FN America','Staccato','Kahr','Kel-Tec',
    'CMMG','KRISS','B&T','IWI','Steyr',
  ]
  for (const b of brands) {
    if (title.toLowerCase().includes(b.toLowerCase())) return b
  }
  return 'Various'
}

// ── SCRAPER: WinTheGuns.com ───────────────────────────────────────────────────
async function scrapeWinTheGuns() {
  const res = await fetch('https://r.jina.ai/https://wintheguns.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
    },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new Error('wintheguns.com returned ' + res.status)
  const html = await res.text()

  const giveaways = []

  // Jina returns markdown: parse [text](url) format
  let match
  const mdRe = /\[([^\]]{8,200})\]\((https?:\/\/[^\s\)]{10,300})\)/g
  while ((match = mdRe.exec(html)) !== null) {
    const [, title, href] = match
    if (!href || !title) continue
    const cleanTitle = title.replace(/\*/g, '').replace(/&amp;/g, '&').trim()
    if (cleanTitle.length < 8) continue
    if (/^(home|about|contact|privacy|terms|search|subscribe|categories)/i.test(cleanTitle)) continue
    if (!/(win|giveaway|enter|free|prize|firearm|gun|rifle|pistol|ammo|gear|suppressor)/i.test(cleanTitle)) continue
    if (/\.(png|jpg|jpeg|gif|svg|webp)/i.test(href)) continue

    const ctxStart = Math.max(0, match.index - 50)
    const ctx = html.slice(ctxStart, ctxStart + 400)
    const valueMatch = ctx.match(/\$\s*([\d,]+)/)
    const dateMatches = ctx.match(/(\d{1,2}\/\d{1,2}\/\d{2,4})/g)
    const prizeValue = valueMatch ? parseValue(valueMatch[0]) : 0
    const endDate = dateMatches?.length >= 2
      ? parseEndDate(dateMatches[1])
      : dateMatches?.length === 1 ? parseEndDate(dateMatches[0]) : null

    giveaways.push({
      title: cleanTitle,
      entryUrl: href.trim().startsWith('/') ? 'https://wintheguns.com' + href.trim() : href.trim(),
      prize: cleanTitle,
      prizeValue,
      endDate,
      category: detectCategory(cleanTitle),
      sponsor: extractSponsor(cleanTitle),
      type: 'external',
      featured: prizeValue >= 1500,
      active: true,
      source: 'wintheguns.com',
    })
  }

  console.log('[GIVEAWAYS] wintheguns.com: scraped', giveaways.length, 'raw entries')
  return giveaways.slice(0, 80)
}

// ── SCRAPER: GunGiveaways.net ────────────────────────────────────────────────
async function scrapeGunGiveaways() {
  try {
    const res = await fetch('https://r.jina.ai/https://gungiveaways.net/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)',
      },
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return []
    const html = await res.text()
    const giveaways = []

    // Look for giveaway links on the page
    const re = /<a\s+href="(https?:\/\/[^"]+)"[^>]*[^>]*>([^<]{15,150})<\/a>/gi
    let match
    while ((match = re.exec(html)) !== null) {
      const [, href, title] = match
      if (!title || title.length < 15) continue
      const cleanTitle = title.replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim()
      // Skip nav/footer links
      if (/^(home|about|contact|privacy|terms|search|categories)/i.test(cleanTitle)) continue
      if (!/(gun|pistol|rifle|shotgun|firearm|ammo|glock|sig|ruger|revolver|ar-15|45|9mm|357|44|22|mag|suppressor|optic|scope)/i.test(cleanTitle.toLowerCase())) continue

      giveaways.push({
        title: cleanTitle,
        entryUrl: href,
        prize: cleanTitle,
        prizeValue: 0,
        endDate: null,
        category: detectCategory(cleanTitle),
        sponsor: extractSponsor(cleanTitle),
        type: 'external',
        featured: false,
        active: true,
        source: 'gungiveaways.net',
      })
    }
    console.log('[GIVEAWAYS] gungiveaways.net:', giveaways.length, 'entries')
    return giveaways.slice(0, 30)
  } catch (e) {
    console.warn('[GIVEAWAYS] gungiveaways.net failed:', e.message)
    return []
  }
}

// ── SCRAPER: Manufacturer Giveaway Pages ─────────────────────────────────────
const MANUFACTURER_PAGES = [
  { name: 'Palmetto State Armory', url: 'https://palmettostatearmory.com/giveaways', type: 'retailer' },
  { name: 'Springfield Armory',    url: 'https://www.springfield-armory.com/promotions/', type: 'manufacturer' },
  { name: 'Taurus USA',            url: 'https://www.taurususa.com/promotions', type: 'manufacturer' },
  { name: 'Brownells',             url: 'https://www.brownells.com/promotions/', type: 'retailer' },
  { name: 'MidwayUSA',             url: 'https://www.midwayusa.com/promotions', type: 'retailer' },
]

async function scrapeManufacturerPages() {
  const results = []
  for (const page of MANUFACTURER_PAGES) {
    try {
      const res = await fetch(page.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0; +https://downrangeco.com)' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const html = await res.text()

      // Look for giveaway/sweepstakes keywords near links
      const giveawaySection = html.match(/(giveaway|sweepstake|win a|enter to win)[^]{0,2000}/gi) || []
      for (const section of giveawaySection.slice(0, 3)) {
        const linkMatch = section.match(/href="(https?:\/\/[^"]{20,150})"[^>]*>([^<]{10,100})</)
        if (linkMatch) {
          results.push({
            title: `${page.name} Giveaway — ${linkMatch[2].trim()}`,
            entryUrl: linkMatch[1],
            prize: linkMatch[2].trim(),
            prizeValue: 0,
            endDate: null,
            category: detectCategory(linkMatch[2]),
            sponsor: page.name,
            type: page.type,
            featured: false,
            active: true,
            source: page.name,
          })
        }
      }
    } catch (e) {
      console.warn(`[GIVEAWAYS] ${page.name} failed:`, e.message)
    }
    await new Promise(r => setTimeout(r, 500))
  }
  return results
}

function deduplicateGiveaways(giveaways) {
  const seen = new Set()
  return giveaways.filter(g => {
    const key = (g.entryUrl || '').toLowerCase().replace(/[?#].*/, '').replace(/\/$/, '')
    if (!key || key.length < 10) return false
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')

  const isCron  = cronSecret && auth === 'Bearer ' + cronSecret
  const isAdmin = adminKey === ADMIN_KEY
  if (!isCron && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const stats = { scraped: 0, added: 0, skipped: 0, expired: 0, sources: {} }

  try {
    // Expire past giveaways
    const today = new Date().toISOString().split('T')[0]
    const existing = await sanity.fetch('*[_type == "giveaway"] { _id, entryUrl, endDate }').catch(() => [])
    const existingUrls = new Set((existing || []).map(g => (g.entryUrl || '').toLowerCase().replace(/\/$/, '')))

    for (const g of existing || []) {
      if (g.endDate && g.endDate < today) {
        await sanity.patch(g._id).set({ active: false }).commit().catch(() => {})
        stats.expired++
      }
    }

    // Scrape all sources
    const [mainGiveaways, altGiveaways, mfrGiveaways] = await Promise.allSettled([
      scrapeWinTheGuns(),
      scrapeGunGiveaways(),
      scrapeManufacturerPages(),
    ])

    const allRaw = [
      ...(mainGiveaways.status === 'fulfilled' ? mainGiveaways.value : []),
      ...(altGiveaways.status === 'fulfilled' ? altGiveaways.value : []),
      ...(mfrGiveaways.status === 'fulfilled' ? mfrGiveaways.value : []),
    ]

    stats.scraped = allRaw.length
    const giveaways = deduplicateGiveaways(allRaw)

    const mutations = []
    for (const g of giveaways) {
      if (!g.entryUrl || !g.title) { stats.skipped++; continue }
      // Skip expired
      if (g.endDate && g.endDate < today) { stats.expired++; continue }
      // Skip if already in Sanity
      const normUrl = g.entryUrl.toLowerCase().replace(/\/$/, '')
      if (existingUrls.has(normUrl)) { stats.skipped++; continue }

      try { new URL(g.entryUrl) } catch { stats.skipped++; continue }

      mutations.push({
        create: {
          _type:       'giveaway',
          title:       g.title,
          entryUrl:    g.entryUrl,
          prize:       g.prize || g.title,
          prizeValue:  g.prizeValue || 0,
          endDate:     g.endDate || null,
          category:    g.category || 'gear',
          sponsor:     g.sponsor || 'Various',
          sourceType:  g.type || 'external',
          featured:    g.featured || false,
          active:      true,
          source:      g.source || 'web',
          addedAt:     new Date().toISOString(),
        }
      })
      stats.added++
      stats.sources[g.source] = (stats.sources[g.source] || 0) + 1
    }

    if (mutations.length > 0) {
      await sanity.mutate(mutations)
    }

    console.log('[GIVEAWAYS] Done:', stats)
    return NextResponse.json({
      ok: true,
      ms: Date.now() - t0,
      ...stats,
      message: `${stats.added} new giveaways from ${Object.keys(stats.sources).join(', ')}`,
    })
  } catch (err) {
    console.error('[giveaways-cron]', err.message)
    return NextResponse.json({ ok: false, error: err.message, ms: Date.now() - t0 }, { status: 500 })
  }
}
