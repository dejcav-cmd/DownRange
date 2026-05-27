export const dynamic = 'force-dynamic'
export const maxDuration = 300

/**
 * POST /api/outreach/scrape
 * Body: { source: 'ffl' | 'nra' | 'youtube', params: {} }
 *
 * ffl:     Scrapes ATF FFL database (public CSV download)
 * nra:     Scrapes NRA instructor finder API
 * youtube: Enriches YouTube channel data for existing contacts
 */

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// ── FFL Database scraper ──────────────────────────────────────────────────────
// ATF publishes monthly FFL listing as downloadable CSV at:
// https://www.atf.gov/firearms/listing-federal-firearms-licensees
// We fetch the most recent file and parse type-01 (dealer), type-02 (pawnbroker),
// type-07 (manufacturer), type-08 (importer) licenses.
async function scrapeFFL({ state, licenseType = '01', limit = 200 }) {
  try {
    // ATF FFL CSV URL pattern (updated monthly)
    const year  = new Date().getFullYear()
    const month = String(new Date().getMonth() + 1).padStart(2, '0')
    // Try current month, fall back to last month
    const urls = [
      `https://www.atf.gov/firearms/docs/${year}${month}-ffl-list/download`,
      `https://www.atf.gov/system/files/Arms-Data/${year}${String(new Date().getMonth()).padStart(2,'0')}-ffl.csv`,
    ]

    let csvText = null
    for (const url of urls) {
      try {
        const _r = await fetch(url, {
          timeout: 15000,
          headers: { 'User-Agent': 'Mozilla/5.0' },
          responseType: 'text',
        }); const data = await _r.json()
        if (data && data.length > 100) { csvText = data; break }
      } catch {}
    }

    if (!csvText) {
      // Return structured sample data if ATF is unreachable
      return {
        source: 'ffl',
        note: 'ATF FFL CSV unreachable — returning sample data for testing. Download manually from atf.gov/firearms/listing-federal-firearms-licensees and use CSV Import.',
        contacts: generateFFLSamples(state, limit),
        count: limit,
      }
    }

    // Parse CSV — ATF format: LicRegn, LicDist, LicCnty, LicType, LicXprdte, LicSeqn, LicenseName, BusinessName, PremisStreet, PremisCity, PremisState, PremisZip, MailStreet, MailCity, MailState, MailZip, VoicePhone, VoiceFax
    const lines = csvText.split('\n').slice(1)
    const contacts = []

    for (const line of lines) {
      if (contacts.length >= limit) break
      const cols = line.split(',').map(c => c.replace(/^"|"$/g, '').trim())
      if (cols.length < 17) continue

      const licType    = cols[3]?.trim()
      const premState  = cols[10]?.trim()
      const bizName    = cols[7]?.trim() || cols[6]?.trim()
      const phone      = cols[16]?.trim()
      const city       = cols[9]?.trim()
      const zip        = cols[11]?.trim()
      const licNum     = `${cols[0]}-${cols[1]}-${cols[2]}-${cols[3]}-${cols[4]}-${cols[5]}`.trim()

      if (state && premState !== state.toUpperCase()) continue
      if (licenseType && licType !== licenseType) continue
      if (!bizName) continue

      contacts.push({
        type: 'ffl_dealer',
        name: bizName,
        phone: phone || null,
        city: city || null,
        state: premState || null,
        zip: zip || null,
        fflLicense: licNum,
        source: 'ffl_database',
        status: 'active',
        tags: [`ffl-type-${licType}`],
      })
    }

    return { source: 'ffl', contacts, count: contacts.length }
  } catch (err) {
    throw new Error(`FFL scrape failed: ${err.message}`)
  }
}

// Sample FFL data for testing when ATF is unreachable
function generateFFLSamples(state = 'WA', count = 50) {
  const cities = { WA: ['Seattle','Tacoma','Spokane','Bellevue','Redmond'], TX: ['Dallas','Houston','Austin','San Antonio'], FL: ['Miami','Tampa','Orlando','Jacksonville'] }
  const shopNames = ['Eagle Arms', 'Patriot Firearms', 'Freedom Armory', 'Range Master', 'Tactical Supply', 'Liberty Guns', 'American Arms', 'Pro Shooter', 'Delta Firearms', 'Guardian Weapons']
  const cityList = cities[state] || ['Springfield', 'Riverside', 'Lincoln', 'Union']
  return Array.from({ length: Math.min(count, shopNames.length * cityList.length) }, (_, i) => ({
    type: 'ffl_dealer',
    name: `${shopNames[i % shopNames.length]} of ${cityList[i % cityList.length]}`,
    city: cityList[i % cityList.length],
    state,
    fflLicense: `1-${state}-0${String(i+1).padStart(3,'0')}-01-SAMPLE`,
    source: 'ffl_database',
    status: 'active',
    tags: ['ffl-type-01', 'sample'],
  }))
}

// ── NRA Instructor scraper ────────────────────────────────────────────────────
async function scrapeNRA({ state, discipline, limit = 200 }) {
  try {
    // NRA instructor finder public API
    const url = 'https://apps.nra.org/apps/instructors/api/search'
    const _nraRes = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0',
        'Referer': 'https://apps.nra.org/apps/instructors/',
      },
      body: JSON.stringify({ State: state || '', Discipline: discipline || '', Distance: 100, ZipCode: '' }),
      signal: AbortSignal.timeout(10000),
    })
    const data = await _nraRes.json()

    const instructors = (data?.Instructors || data?.results || data || []).slice(0, limit)
    const contacts = instructors.map(inst => ({
      type: 'instructor',
      name: [inst.FirstName, inst.LastName].filter(Boolean).join(' ') || inst.Name || 'NRA Instructor',
      firstName: inst.FirstName || null,
      city: inst.City || null,
      state: inst.State || state || null,
      zip: inst.ZipCode || null,
      nraInstructorId: inst.InstructorId || inst.ID || null,
      specialties: (inst.Disciplines || inst.Certifications || []).map(d => d.toLowerCase()),
      source: 'nra_instructor',
      status: 'active',
      tags: ['nra-instructor'],
    }))

    return { source: 'nra', contacts, count: contacts.length }
  } catch (err) {
    // NRA API may block — return sample data
    return {
      source: 'nra',
      note: `NRA API returned error: ${err.message}. Use manual CSV import or visit apps.nra.org/apps/instructors/`,
      contacts: generateNRASamples(state, limit),
      count: limit,
    }
  }
}

function generateNRASamples(state = 'WA', count = 30) {
  const firstNames = ['John', 'Mike', 'Robert', 'James', 'David', 'Tom', 'Chris', 'Steve', 'Mark', 'Jeff', 'Sarah', 'Lisa', 'Karen']
  const lastNames  = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Miller', 'Davis', 'Wilson', 'Moore', 'Taylor']
  const disciplines = [['pistol','ccw'], ['rifle'], ['shotgun','hunting'], ['pistol'], ['ccw','home-defense']]
  return Array.from({ length: count }, (_, i) => ({
    type: 'instructor',
    name: `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`,
    firstName: firstNames[i % firstNames.length],
    state,
    specialties: disciplines[i % disciplines.length],
    source: 'nra_instructor',
    status: 'active',
    tags: ['nra-instructor', 'sample'],
  }))
}

// ── YouTube channel enricher ──────────────────────────────────────────────────
// Given channel handles/URLs, fetch subscriber counts and metadata
async function enrichYouTube({ channels }) {
  const apiKey = process.env.YOUTUBE_API_KEY
  const contacts = []

  for (const channel of (channels || [])) {
    try {
      let channelId = channel.id
      // If we have a handle, resolve to channel ID first
      if (!channelId && channel.handle) {
        const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channel.handle)}&key=${apiKey}`
        if (apiKey) {
          const _r = await fetch(searchUrl); const data = await _r.json()
          channelId = data.items?.[0]?.snippet?.channelId
        }
      }

      const url = channelId && apiKey
        ? `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${apiKey}`
        : null

      if (url) {
        const _r = await fetch(url); const data = await _r.json()
        const ch = data.items?.[0]
        if (ch) {
          contacts.push({
            type: 'youtuber',
            name: ch.snippet?.title || channel.name,
            youtubeChannel: channelId,
            youtubeUrl: `https://www.youtube.com/channel/${channelId}`,
            subscribers: parseInt(ch.statistics?.subscriberCount || '0'),
            source: 'youtube_scrape',
            status: 'active',
            tags: ['youtube', 'firearms-content'],
          })
          continue
        }
      }

      // No API key — create contact from provided data
      contacts.push({
        type: 'youtuber',
        name: channel.name || channel.handle,
        youtubeUrl: channel.url || `https://www.youtube.com/@${channel.handle}`,
        youtubeChannel: channel.id || null,
        source: 'youtube_scrape',
        status: 'active',
        tags: ['youtube', 'firearms-content'],
      })
    } catch {}
    await new Promise(r => setTimeout(r, 300))
  }

  return { source: 'youtube', contacts, count: contacts.length }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { source, params = {}, saveToDatabase = false } = await req.json()

  let result
  switch (source) {
    case 'ffl':     result = await scrapeFFL(params);         break
    case 'nra':     result = await scrapeNRA(params);         break
    case 'youtube': result = await enrichYouTube(params);     break
    default: return Response.json({ error: `Unknown source: ${source}` }, { status: 400 })
  }

  // Optionally save scraped contacts to Sanity
  if (saveToDatabase && result.contacts?.length) {
    let created = 0, skipped = 0
    for (const contact of result.contacts) {
      try {
        // Dedup by email or fflLicense
        const dupeFilter = contact.email
          ? `email == "${contact.email}"`
          : contact.fflLicense
          ? `fflLicense == "${contact.fflLicense}"`
          : null

        if (dupeFilter) {
          const exists = await sanity.fetch(`*[_type == "outreachContact" && ${dupeFilter}][0]._id`)
          if (exists) { skipped++; continue }
        }

        await sanity.create({ _type: 'outreachContact', ...contact, addedAt: new Date().toISOString() })
        created++
      } catch {}
      await new Promise(r => setTimeout(r, 100))
    }
    result.saved = { created, skipped }
  }

  return Response.json({ ok: true, ...result })
}
