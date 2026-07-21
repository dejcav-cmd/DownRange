export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse }    from 'next/server'
import { createClient }    from '@sanity/client'
import { reportCronRun }   from '@/lib/cronReporter'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  token:      process.env.SANITY_API_TOKEN,
  useCdn:     false,
})

// ── AUTH ──────────────────────────────────────────────────────────────────────
function isAuthorized(req) {
  const isVercel = req.headers.get('x-vercel-cron') === '1'
  const isAuth   = process.env.CRON_SECRET && req.headers.get('authorization') === `Bearer ${process.env.CRON_SECRET}`
  const isAdmin  = req.headers.get('x-admin-key') === ADMIN_KEY
  return isVercel || isAuth || isAdmin
}

// ── HELPERS ───────────────────────────────────────────────────────────────────
function detectCategory(title) {
  const t = (title || '').toLowerCase()
  if (/pistol|handgun|glock|sig|9mm|1911|revolver|p365|hellcat|g19|g17|m&p/.test(t))  return 'pistol'
  if (/ar-?15|ar-?10|rifle|carbine|\bak\b|m4|308|6\.5|bolt.?action/.test(t))          return 'rifle'
  if (/shotgun|\bgauge\b|pump.?gun/.test(t))                                           return 'shotgun'
  if (/ammo|rounds?|brass|ammunition|cartridge/.test(t))                               return 'ammo'
  if (/optic|scope|red.?dot|lpvo|eotech|vortex|trijicon|aimpoint|holosun/.test(t))    return 'optics'
  if (/suppressor|silencer|sbr|sbs|full.?auto/.test(t))                               return 'nfa'
  if (/gear|tactical|holster|light|knife|bag|chest.?rig|plate.?carrier/.test(t))      return 'gear'
  return 'accessories'
}

function parseValue(str) {
  if (!str) return 0
  const m = String(str).replace(/[$,]/g, '').match(/[\d.]+/)
  return m ? Math.round(parseFloat(m[0])) : 0
}

function parseEndDate(str) {
  if (!str) return null
  str = String(str).trim()
  // M/D/YY or M/D/YYYY
  const slashParts = str.split('/')
  if (slashParts.length === 3) {
    const y = parseInt(slashParts[2]) < 100 ? 2000 + parseInt(slashParts[2]) : parseInt(slashParts[2])
    const m = parseInt(slashParts[0])
    const d = parseInt(slashParts[1])
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 2025) {
      return `${y}-${String(m).padStart(2,'0')}-${String(d).padStart(2,'0')}`
    }
  }
  try {
    const parsed = new Date(str)
    if (!isNaN(parsed.getTime()) && parsed.getFullYear() >= 2025) {
      return parsed.toISOString().split('T')[0]
    }
  } catch { /* ignore */ }
  return null
}

function extractSponsor(title) {
  const brands = [
    'Glock','SIG Sauer','SIG','Ruger','Smith & Wesson','S&W','Springfield Armory',
    'Taurus','Beretta','CZ','Heckler & Koch','H&K','Walther','Shadow Systems',
    'Palmetto State Armory','PSA','Century Arms','Faxon','AT3','Staccato',
    'Bul Armory','EOTech','Vortex','Primary Arms','Dead Air','SilencerCo',
    'Streamlight','Swampfox','Magpul','Kimber','Colt','Benelli','Mossberg',
    'Remington','Winchester','Browning','Savage','Tikka','Christensen Arms',
    'Daniel Defense','Aero Precision','BCM','Wilson Combat','Nightforce',
    'Trijicon','Aimpoint','Holosun','Leupold','Burris','Bushnell',
    'LWRCI','Noveske','Canik','FN America','Kahr','Kel-Tec','CMMG',
    'Lucky Gunner','Ammo.com','Brownells','MidwayUSA',
    'Gun Owners of America','GOA','NRA','Second Amendment Foundation','SAF',
    'Warrior Poet Society','Colion Noir','Garand Thumb',
  ]
  for (const b of brands) {
    if ((title || '').toLowerCase().includes(b.toLowerCase())) return b
  }
  return null
}

// ── SCRAPER: WinTheGuns.com ───────────────────────────────────────────────────
async function scrapeWinTheGuns() {
  const res = await fetch('https://wintheguns.com/', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      'Accept':     'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    },
    signal: AbortSignal.timeout(20000),
  })
  if (!res.ok) throw new Error('wintheguns.com returned ' + res.status)
  const html = await res.text()
  const giveaways = []

  // Strategy 1: parse table rows with linked titles + adjacent date/value cells
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi
  let rowMatch
  while ((rowMatch = rowRe.exec(html)) !== null) {
    const row = rowMatch[1]
    const linkMatch = row.match(/<a\s+href="([^"]+)"[^>]*>([^<]{5,150})<\/a>/i)
    if (!linkMatch) continue
    const [, href, rawTitle] = linkMatch
    if (!href || /javascript|^#/.test(href)) continue

    const title = rawTitle.replace(/\*/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').trim()
    if (title.length < 8) continue
    if (/^(home|about|contact|privacy|nav|menu|sponsor|click|enter|view all)/i.test(title)) continue

    // Extract all <td> text values from this row
    const cells = []
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi
    let cellMatch
    while ((cellMatch = cellRe.exec(row)) !== null) {
      cells.push(cellMatch[1].replace(/<[^>]+>/g, '').trim())
    }
    const dateCells   = cells.slice(1).filter(c => /\d/.test(c))
    const valueCell   = cells.find(c => /\$[\d,]/.test(c))
    const prizeValue  = parseValue(valueCell)
    const endDate     = parseEndDate(dateCells[1]) || parseEndDate(dateCells[0])

    const entryUrl = href.trim().startsWith('/')
      ? 'https://wintheguns.com' + href.trim()
      : href.trim()

    try { new URL(entryUrl) } catch { continue }

    giveaways.push({
      title, entryUrl, prize: title, prizeValue, endDate,
      category:   detectCategory(title),
      sponsor:    extractSponsor(title) || 'Various',
      sourceType: 'external',
      featured:   prizeValue >= 1500,
      active:     true,
      source:     'wintheguns.com',
    })
  }

  // Strategy 2: fallback — scan all firearm-keyword links on the page
  if (giveaways.length < 3) {
    const fbRe = /<a\s+href="(https?:\/\/[^"]+)"[^>]*>([^<]{12,140})<\/a>/gi
    let fm
    while ((fm = fbRe.exec(html)) !== null) {
      const [, href, rawTitle] = fm
      const title = rawTitle.replace(/&amp;/g, '&').trim()
      if (!/gun|pistol|rifle|shotgun|firearm|glock|sig|ruger|win a|giveaway/i.test(title)) continue
      if (/^(home|about|contact|privacy)/i.test(title)) continue
      try { new URL(href) } catch { continue }
      giveaways.push({
        title, entryUrl: href, prize: title, prizeValue: 0, endDate: null,
        category:   detectCategory(title),
        sponsor:    extractSponsor(title) || 'Various',
        sourceType: 'external',
        featured:   false,
        active:     true,
        source:     'wintheguns.com',
      })
    }
  }

  console.log('[GIVEAWAYS] wintheguns.com:', giveaways.length, 'entries')
  return giveaways.slice(0, 80)
}

// ── SCRAPER: GunGiveaways.net ────────────────────────────────────────────────
async function scrapeGunGiveaways() {
  try {
    const res = await fetch('https://gungiveaways.net/', {
      headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return []
    const html = await res.text()
    const giveaways = []
    const re = /<a\s+href="(https?:\/\/[^"]+)"[^>]*>([^<]{15,150})<\/a>/gi
    let m
    while ((m = re.exec(html)) !== null) {
      const [, href, rawTitle] = m
      const title = rawTitle.replace(/\s+/g, ' ').replace(/&amp;/g, '&').trim()
      if (/^(home|about|contact|privacy|terms|search|categories|read more)/i.test(title)) continue
      if (!/gun|pistol|rifle|shotgun|firearm|ammo|glock|sig|ruger|revolver|ar.15|handgun/i.test(title)) continue
      try { new URL(href) } catch { continue }
      giveaways.push({
        title, entryUrl: href, prize: title, prizeValue: 0, endDate: null,
        category:   detectCategory(title),
        sponsor:    extractSponsor(title) || 'Various',
        sourceType: 'external',
        featured:   false,
        active:     true,
        source:     'gungiveaways.net',
      })
    }
    console.log('[GIVEAWAYS] gungiveaways.net:', giveaways.length, 'entries')
    return giveaways.slice(0, 30)
  } catch (e) {
    console.warn('[GIVEAWAYS] gungiveaways.net failed:', e.message)
    return []
  }
}

// ── SCRAPER: Manufacturer Giveaway / Promotions Pages ────────────────────────
const MFR_PAGES = [
  { name: 'Palmetto State Armory', url: 'https://palmettostatearmory.com/blog/category/psa-giveaways/', type: 'retailer' },
  { name: 'Lucky Gunner',          url: 'https://www.luckygunner.com/blog/category/giveaway/',         type: 'retailer' },
  { name: 'Springfield Armory',    url: 'https://www.springfield-armory.com/promotions/',              type: 'manufacturer' },
  { name: 'Gun Owners of America', url: 'https://gunowners.org/goa-giveaway/',                         type: 'organization' },
  { name: 'Taurus USA',            url: 'https://www.taurususa.com/promotions',                        type: 'manufacturer' },
]

async function scrapeManufacturerPages() {
  const results = []
  for (const page of MFR_PAGES) {
    try {
      const res = await fetch(page.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0; +https://downrangeco.com)' },
        signal: AbortSignal.timeout(10000),
      })
      if (!res.ok) continue
      const html = await res.text()

      const re = /(giveaway|sweepstake|win a|enter to win)[^]{0,2000}/gi
      let match
      while ((match = re.exec(html)) !== null) {
        const linkMatch = match[0].match(/<a\s+href="(https?:\/\/[^"]{20,200})"[^>]*>([^<]{10,120})</)
        if (!linkMatch) continue
        const title = `${page.name} — ${linkMatch[2].trim()}`
        try { new URL(linkMatch[1]) } catch { continue }
        results.push({
          title, entryUrl: linkMatch[1], prize: linkMatch[2].trim(),
          prizeValue: 0, endDate: null,
          category:   detectCategory(title),
          sponsor:    page.name,
          sourceType: page.type,
          featured:   false,
          active:     true,
          source:     page.name,
        })
      }
    } catch (e) {
      console.warn(`[GIVEAWAYS] ${page.name} failed:`, e.message)
    }
    await new Promise(r => setTimeout(r, 400))
  }
  return results
}

// ── DEDUP ─────────────────────────────────────────────────────────────────────
function dedup(arr) {
  const seen = new Set()
  return arr.filter(g => {
    const key = (g.entryUrl || '').toLowerCase().replace(/[?#].*/, '').replace(/\/$/, '')
    if (!key || key.length < 12 || seen.has(key)) return false
    seen.add(key)
    return true
  })
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
export async function GET(req)  { return handler(req) }
export async function POST(req) { return handler(req) }

async function handler(req) {
  if (!isAuthorized(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0    = Date.now()
  const stats = { scraped: 0, added: 0, skipped: 0, expired: 0, errors: [], sources: {} }

  try {
    const today    = new Date().toISOString().split('T')[0]
    const existing = await sanity.fetch('*[_type == "giveaway"] { _id, entryUrl, endDate, active }').catch(() => [])
    const existingUrls = new Set(
      (existing || []).map(g => (g.entryUrl || '').toLowerCase().replace(/\/$/, ''))
    )

    // Expire past giveaways
    const toExpire = (existing || []).filter(g => g.active && g.endDate && g.endDate < today)
    if (toExpire.length > 0) {
      await sanity.mutate(toExpire.map(g => ({ patch: { id: g._id, set: { active: false } } })))
      stats.expired = toExpire.length
    }

    // Scrape in parallel
    const [mainRes, altRes, mfrRes] = await Promise.allSettled([
      scrapeWinTheGuns(),
      scrapeGunGiveaways(),
      scrapeManufacturerPages(),
    ])
    const allRaw = [
      ...(mainRes.status === 'fulfilled' ? mainRes.value : (stats.errors.push('wintheguns: ' + mainRes.reason?.message), [])),
      ...(altRes.status  === 'fulfilled' ? altRes.value  : (stats.errors.push('gungiveaways: ' + altRes.reason?.message),  [])),
      ...(mfrRes.status  === 'fulfilled' ? mfrRes.value  : (stats.errors.push('mfr: ' + mfrRes.reason?.message), [])),
    ]

    stats.scraped = allRaw.length
    const giveaways = dedup(allRaw)

    const mutations = []
    for (const g of giveaways) {
      if (!g.entryUrl || !g.title) { stats.skipped++; continue }
      if (g.endDate && g.endDate < today) { stats.expired++; continue }
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
          sourceType:  g.sourceType || 'external',
          featured:    g.featured || false,
          active:      true,
          addedAt:     new Date().toISOString(),
        }
      })
      stats.added++
      stats.sources[g.source] = (stats.sources[g.source] || 0) + 1
    }

    if (mutations.length > 0) await sanity.mutate(mutations)

    const ms = Date.now() - t0
    console.log('[GIVEAWAYS] Done:', stats)
    await reportCronRun('giveaways', { status: 'success', ms, added: stats.added, expired: stats.expired })
    return NextResponse.json({ ok: true, ms, ...stats })

  } catch (err) {
    const ms = Date.now() - t0
    console.error('[giveaways-cron]', err.message)
    await reportCronRun('giveaways', { status: 'failed', ms, error: err.message })
    return NextResponse.json({ ok: false, error: err.message, ms }, { status: 500 })
  }
}
