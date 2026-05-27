export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// Known PR/media emails for major manufacturers (researched)
const KNOWN_EMAILS = {
  // Manufacturers
  'smith-wesson.com':            'media@smith-wesson.com',
  'ruger.com':                   'media@ruger.com',
  'glock.com':                   'info@glock.com',
  'sigsauer.com':                'press@sigsauer.com',
  'fnamerica.com':               'fnamerica@fnamerica.com',
  'heckler-koch.com':            'hk-usa@heckler-koch.com',
  'springfield-armory.com':      'media@springfield-armory.com',
  'taurususa.com':               'customerservice@taurususa.com',
  'kimberamerica.com':           'info@kimberamerica.com',
  'colt.com':                    'press@colt.com',
  'keltecweapons.com':           'info@keltecweapons.com',
  'savagearms.com':              'info@savagearms.com',
  'mossberg.com':                'info@mossberg.com',
  'remington.com':               'consumer@remington.com',
  'browning.com':                'info@browning.com',
  'winchesterguns.com':          'info@winchesterguns.com',
  'henryusa.com':                'info@henryusa.com',
  'cz-usa.com':                  'czusa@cz-usa.com',
  'walther-arms.com':            'info@walther-arms.com',
  'berettausa.com':              'info@berettausa.com',
  'danieldefense.com':           'info@danieldefense.com',
  'aeroprecisionusa.com':        'info@aeroprecisionusa.com',
  'christensenarms.com':         'info@christensenarms.com',
  'larue.com':                   'mark@larue.com',
  'windhamweaponry.com':         'info@windhamweaponry.com',
  'noveske.com':                 'info@noveske.com',
  'stagarms.com':                'info@stagarms.com',
  'rockriverarms.com':           'sales@rockriverarms.com',
  'lwrci.com':                   'info@lwrci.com',
  'proofresearch.com':           'info@proofresearch.com',
  'kahr.com':                    'info@kahr.com',
  'eotech.com':                  'eotech.info@l3t.com',
  'trijicon.com':                'info@trijicon.com',
  'vortexoptics.com':            'info@vortexoptics.com',
  'leupold.com':                 'info@leupold.com',
  'nightforceoptics.com':        'info@nightforceoptics.com',
  'primaryarms.com':             'info@primaryarms.com',
  'hornady.com':                 'hornady@hornady.com',
  'federalpremium.com':          'info@federalpremium.com',
  'speer-ammo.com':              'info@speer-ammo.com',
  'winchester.com':              'info@winchester.com',
  'cci-ammunition.com':          'info@cci-ammunition.com',
  'remingtonammo.com':           'info@remingtonammo.com',
  'americandefensemanufacturing.com': 'info@americandefense.us',
  'bcmgunfighter.com':           'info@bravocompanymfg.com',
  'bravocompanymfg.com':         'info@bravocompanymfg.com',
  // Holster companies
  'safariland.com':              'customerservice@safariland.com',
  'galco.com':                   'info@galco.com',
  'crossbreedholsters.com':      'info@crossbreedholsters.com',
  'aliengearholsters.com':       'info@aliengearholsters.com',
  'desantisholster.com':         'desantis@desantisholster.com',
  'foxxholsters.com':            'info@foxxholsters.com',
  'dara-holsters.com':           'info@dara-holsters.com',
  'blackhawk.com':               'customerservice@blackhawk.com',
  'gunfightersinc.com':          'info@gunfightersinc.com',
  'vedderholsters.com':          'info@vedderholsters.com',
  'concealment-express.com':     'service@concealment-express.com',
  'tulsterholster.com':          'info@tulsterholster.com',
  // Major YouTubers (contact via YouTube/email)
  'garandthumb.com':             'business@garandthumb.com',
  'hickok45.com':                'hickok45@yahoo.com',
  'paulharrell.com':             'paul@paulharrell.com',
  // Organizations
  'nra.org':                     'contact@nrahq.org',
  'nraila.org':                  'media@nrahq.org',
  'gunowners.org':               'info@gunowners.org',
  'saf.org':                     'adminforweb@saf.org',
  'fpchq.org':                   'info@fpchq.org',
  'nssf.org':                    'info@nssf.org',
}

function extractDomain(url) {
  if (!url) return null
  try {
    const u = new URL(url.startsWith('http') ? url : 'https://' + url)
    return u.hostname.replace(/^www\./, '')
  } catch { return null }
}

async function scrapeEmailFromSite(url) {
  if (!url) return null
  try {
    // Try /contact page first, then root
    const urls = [
      url.replace(/\/$/, '') + '/contact',
      url.replace(/\/$/, '') + '/contact-us',
      url.replace(/\/$/, '') + '/about',
      url,
    ]
    for (const u of urls.slice(0, 2)) {
      try {
        const res = await fetch(u, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0)' },
          signal: AbortSignal.timeout(6000),
        })
        if (!res.ok) continue
        const text = await res.text()
        // Extract emails via regex
        const matches = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g)
        if (!matches) continue
        // Filter out common non-contact emails
        const filtered = matches.filter(e => {
          const lower = e.toLowerCase()
          return !lower.includes('example') && !lower.includes('test@') &&
                 !lower.includes('noreply') && !lower.includes('no-reply') &&
                 !lower.includes('.png') && !lower.includes('.jpg') &&
                 !lower.includes('sentry') && !lower.includes('schema') &&
                 !lower.includes('wix') && !lower.includes('shopify')
        })
        // Prefer press@, media@, info@, contact@
        const priority = filtered.find(e => /^(press|media|info|contact|pr|marketing|hello|business)@/i.test(e))
        if (priority) return priority
        if (filtered[0]) return filtered[0]
      } catch {}
    }
  } catch {}
  return null
}

// GET — find emails for contacts missing them
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const limit = Math.min(50, parseInt(url.searchParams.get('limit') || '20'))

  // Get contacts without emails that have websites
  const contacts = await sanity.fetch(`
    *[_type == "outreachContact" && (email == null || email == "") && defined(website) && website != ""] 
    | order(addedAt asc) [0...${limit}] {
      _id, name, type, website
    }
  `)

  const results = []
  for (const c of contacts) {
    const domain = extractDomain(c.website)
    let email = domain ? KNOWN_EMAILS[domain] : null

    if (!email && c.website) {
      email = await scrapeEmailFromSite(c.website)
    }

    results.push({
      _id:     c._id,
      name:    c.name,
      type:    c.type,
      website: c.website,
      email:   email || null,
      source:  KNOWN_EMAILS[domain] ? 'known' : email ? 'scraped' : 'not-found',
    })
  }

  return Response.json({ ok: true, results, found: results.filter(r => r.email).length, total: results.length })
}

// POST — apply found emails to contacts
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { action, results } = await req.json()

  if (action === 'apply') {
    let saved = 0
    for (const r of results) {
      if (!r._id || !r.email) continue
      try {
        await sanity.patch(r._id).set({ email: r.email }).commit()
        saved++
      } catch {}
    }
    return Response.json({ ok: true, saved })
  }

  // Single contact lookup
  if (action === 'lookup') {
    const { contactId } = req.body || {}
    const c = await sanity.fetch(`*[_type == "outreachContact" && _id == $id][0]{ _id, name, website }`, { id: contactId })
    if (!c) return Response.json({ error: 'Not found' }, { status: 404 })
    const domain = extractDomain(c.website)
    const email = (domain && KNOWN_EMAILS[domain]) || await scrapeEmailFromSite(c.website)
    return Response.json({ ok: true, email })
  }

  return Response.json({ error: 'Unknown action' }, { status: 400 })
}
