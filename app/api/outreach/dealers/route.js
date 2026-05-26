export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

/**
 * Major US online gun dealers and large retailers.
 * Contact notes explain the best outreach route for each.
 * Email format: where a direct press/media email is known it is listed.
 * Where only a contact form exists, the URL is in contactUrl.
 * Email pattern: where the corporate format is known (e.g. first.last@domain.com)
 * it is noted so you can build targeted outreach using tools like Apollo or Hunter.io.
 */
const DEALERS = [

  // ── MEGA ONLINE RETAILERS ────────────────────────────────────────────────────
  {
    name: 'Palmetto State Armory',
    firstName: 'Media',
    website: 'https://www.palmettostatearmory.com',
    email: 'media@palmettostatearmory.com',    // corporate email pattern: First.Last@palmettostatearmory.com
    phone: '803-724-6950',
    city: 'Columbia', state: 'SC',
    tags: ['mega-retailer','online','AR','ammo','deals','FFL'],
    notes: 'Largest US online gun retailer. No public press email — use media@ or contact form at palmettostatearmory.com/help-center/contact.html. Corporate format: First.Last@palmettostatearmory.com. PR/marketing team reachable via LinkedIn.',
    contactUrl: 'https://palmettostatearmory.com/help-center/contact.html',
  },
  {
    name: 'Brownells',
    firstName: 'Media',
    website: 'https://www.brownells.com',
    email: 'media@brownells.com',
    phone: '800-741-0015',
    city: 'Montezuma', state: 'IA',
    tags: ['mega-retailer','parts','gunsmithing','FFL','AR'],
    notes: 'Premier gunsmith supply and retail. Email format: FirstLast@brownellco.com. Press contact via brownells.com/contact-us. Strong media presence and industry sponsorships.',
    contactUrl: 'https://www.brownells.com/contact-us/',
  },
  {
    name: "Bud's Gun Shop",
    firstName: 'Media',
    website: 'https://www.budsgunshop.com',
    email: 'customerservice@budsgunshop.com',
    phone: '859-368-0371',
    city: 'Lexington', state: 'KY',
    tags: ['mega-retailer','online','FFL','4-million-customers'],
    notes: '4M+ customers. One of the largest online firearms retailers in the US. Contact via budsgunshop.com/contact_us.php — no public press email found. Customer service at (859) 368-0371.',
    contactUrl: 'https://www.budsgunshop.com/contact_us.php',
  },
  {
    name: 'Classic Firearms',
    firstName: 'Media',
    website: 'https://www.classicfirearms.com',
    email: 'info@classicfirearms.com',
    city: 'Indian Trail', state: 'NC',
    tags: ['online-retailer','surplus','military','collectible'],
    notes: 'Specializes in surplus, military, and collectible firearms. Contact: classicfirearms.com/contacts/ — PO Box 125, Indian Trail NC 28079.',
    contactUrl: 'https://www.classicfirearms.com/contacts/',
  },
  {
    name: 'GrabAGun',
    firstName: 'Media',
    website: 'https://www.grabagun.com',
    email: 'info@grabagun.com',
    city: 'Sherman', state: 'TX',
    tags: ['online-retailer','FFL','deals','low-price'],
    notes: 'Texas-based major online dealer. Known for low prices. Contact via grabagun.com.',
  },
  {
    name: 'Kentucky Gun Co (KYGUNCO)',
    firstName: 'Media',
    website: 'https://www.kygunco.com',
    email: 'info@kygunco.com',
    phone: '270-932-2600',
    city: 'Bardstown', state: 'KY',
    tags: ['online-retailer','FFL','80-years','honest'],
    notes: 'Family-operated since 1946. No-gimmick pricing. Solid reputation in the community.',
  },
  {
    name: "Sportsman's Warehouse",
    firstName: 'Media',
    website: 'https://www.sportsmans.com',
    email: 'content@sportsmans.com',
    phone: '800-286-3076',
    city: 'Midvale', state: 'UT',
    tags: ['mega-retailer','national-chain','public','SPWH','145-stores'],
    notes: 'Public company (NASDAQ: SPWH). 145 stores across 29 states. Media contact: content@sportsmans.com. Customer service: customerservice@sportsmanswarehouse.com.',
  },
  {
    name: 'MidwayUSA',
    firstName: 'Media',
    website: 'https://www.midwayusa.com',
    email: 'customerservice@midwayusa.com',
    phone: '800-243-3220',
    city: 'Columbia', state: 'MO',
    tags: ['online-retailer','ammo','reloading','accessories','reliable'],
    notes: 'Larry Potterfield founded. 2A philanthropy focus. Fast, reliable shipping. Reloading supplies specialty.',
  },
  {
    name: 'Guns.com',
    firstName: 'Media',
    website: 'https://www.guns.com',
    email: 'media@guns.com',
    city: 'Baton Rouge', state: 'LA',
    tags: ['online-retailer','used-guns','certified','FFL'],
    notes: 'Specializes in certified used firearms. Strong SEO presence. Good for used gun buyers.',
  },
  {
    name: 'GunBroker.com',
    firstName: 'Media',
    website: 'https://www.gunbroker.com',
    email: 'support@gunbroker.com',
    city: 'Delray Beach', state: 'FL',
    tags: ['marketplace','auction','largest-online-marketplace'],
    notes: 'Largest online gun marketplace/auction. Not a direct retailer — facilitates peer sales. Huge reach. Press contact via gunbroker.com.',
  },
  {
    name: 'Cheaper Than Dirt',
    firstName: 'Media',
    website: 'https://www.cheaperthandirt.com',
    email: 'customerservice@cheaperthandirt.com',
    city: 'Fort Worth', state: 'TX',
    tags: ['online-retailer','ammo','accessories','survival'],
    notes: 'Texas-based. Had controversy during Sandy Hook (stopped gun sales briefly) but returned. Large catalog.',
  },
  {
    name: 'Aim Surplus',
    firstName: 'Media',
    website: 'https://www.aimsurplus.com',
    email: 'sales@aimsurplus.com',
    city: 'Fairfield', state: 'OH',
    tags: ['online-retailer','surplus','police-trade-ins','value'],
    notes: 'Specializes in police trade-in and surplus firearms. Strong value proposition.',
  },
  {
    name: 'Davidson\'s / GunGenie',
    firstName: 'Media',
    website: 'https://www.davidsonsinc.com',
    email: 'customerservice@davidsonsinc.com',
    phone: '800-367-4867',
    city: 'Prescott', state: 'AZ',
    tags: ['distributor','gungenie','lifetime-warranty','dealer-network'],
    notes: 'Major firearms distributor (not direct consumer). GunGenie platform connects consumers to dealers. Lifetime warranty program is major differentiator. B2B focus but strong brand.',
  },
  {
    name: 'Primary Arms',
    firstName: 'Media',
    website: 'https://www.primaryarms.com',
    email: 'media@primaryarms.com',
    city: 'Houston', state: 'TX',
    tags: ['online-retailer','optics','ACSS','value','AR'],
    notes: 'Strong brand in optics and AR accessories. Own-brand ACSS reticle is industry-respected. Texas-based.',
  },
  {
    name: 'OpticsPlanet',
    firstName: 'Media',
    website: 'https://www.opticsplanet.com',
    email: 'media@opticsplanet.com',
    city: 'Northbrook', state: 'IL',
    tags: ['online-retailer','optics','tactical','large-catalog'],
    notes: 'Massive catalog, optics specialty. OP Bucks loyalty program. Known for coupons and stacking savings.',
  },
  {
    name: 'Impact Guns',
    firstName: 'Media',
    website: 'https://www.impactguns.com',
    email: 'info@impactguns.com',
    city: 'Ogden', state: 'UT',
    tags: ['online-retailer','FFL','Utah-based'],
    notes: 'Utah-based retailer with strong online presence.',
  },
  {
    name: 'J&G Sales',
    firstName: 'Media',
    website: 'https://www.jgsales.com',
    email: 'info@jgsales.com',
    city: 'Prescott', state: 'AZ',
    tags: ['online-retailer','surplus','military','value'],
    notes: 'Military surplus and firearms specialist.',
  },
  {
    name: 'Sportsman\'s Guide',
    firstName: 'Media',
    website: 'https://www.sportsmansguide.com',
    email: 'customerservice@sportsmansguide.com',
    city: 'South Saint Paul', state: 'MN',
    tags: ['online-retailer','surplus','outdoor','ammo'],
    notes: 'Surplus and outdoor gear. Membership model (Buyer\'s Club). Ammo and military surplus focus.',
  },

  // ── LARGE BRICK-AND-MORTAR WITH ONLINE ───────────────────────────────────────
  {
    name: 'Bass Pro Shops / Cabela\'s',
    firstName: 'Media',
    website: 'https://www.basspro.com',
    email: 'media@basspro.com',
    city: 'Springfield', state: 'MO',
    tags: ['mega-retailer','brick-mortar','national','outdoor','Cabelas'],
    notes: 'Owns Cabela\'s. Combined, largest outdoor retail chain in the US. Press: media@basspro.com. Strong buy-online/pickup-in-store program.',
  },
  {
    name: 'Cabela\'s',
    firstName: 'Media',
    website: 'https://www.cabelas.com',
    email: 'media@basspro.com',
    city: 'Sidney', state: 'NE',
    tags: ['mega-retailer','brick-mortar','outdoor','hunting','national'],
    notes: 'Now owned by Bass Pro Shops. Same press contact. Strong hunting and outdoor focus.',
  },
  {
    name: 'Academy Sports + Outdoors',
    firstName: 'Media',
    website: 'https://www.academy.com',
    email: 'media@academy.com',
    city: 'Katy', state: 'TX',
    tags: ['mega-retailer','public','brick-mortar','Texas','ASO'],
    notes: 'Public company (NASDAQ: ASO). 270+ stores, Southeast and Midwest focus. Corporate media contact: media@academy.com.',
  },

  // ── SPECIALTY & REGIONAL HIGH-VOLUME ────────────────────────────────────────
  {
    name: 'Whittaker Guns',
    firstName: 'Media',
    website: 'https://www.whittakerguns.com',
    email: 'info@whittakerguns.com',
    city: 'Owensboro', state: 'KY',
    tags: ['online-retailer','FFL','Kentucky','reliable'],
    notes: 'Kentucky-based, well-regarded for service. Popular in online firearms communities.',
  },
  {
    name: 'Roanoke Firearms',
    firstName: 'Media',
    website: 'https://www.roanokefirearms.com',
    email: 'info@roanokefirearms.com',
    city: 'Roanoke', state: 'VA',
    tags: ['online-retailer','FFL','Virginia'],
  },
  {
    name: 'Turners Outdoorsman',
    firstName: 'Media',
    website: 'https://www.turners.com',
    email: 'info@turners.com',
    city: 'Industry', state: 'CA',
    tags: ['brick-mortar','California','regional-chain','West-Coast'],
    notes: 'Major California/West Coast chain. Important for WA/PNW outreach — California-compliant inventory expertise.',
  },
  {
    name: 'Tombstone Tactical',
    firstName: 'Media',
    website: 'https://www.tombstonetactical.com',
    email: 'info@tombstonetactical.com',
    city: 'Peoria', state: 'AZ',
    tags: ['online-retailer','FFL','Arizona','AR','tactical'],
    notes: 'Arizona-based, tactical focus. AR and accessories specialty.',
  },
  {
    name: 'Elk Ridge Outfitters (Sportsman\'s Outlet)',
    firstName: 'Media',
    website: 'https://www.sportsmanoutlet.com',
    email: 'info@sportsmanoutlet.com',
    city: 'Twin Falls', state: 'ID',
    tags: ['online-retailer','FFL','Idaho','hunting'],
  },

  // ── DISTRIBUTOR LEVEL (wholesale — worth knowing) ────────────────────────────
  {
    name: 'Lipsey\'s',
    firstName: 'Media',
    website: 'https://www.lipseys.com',
    email: 'info@lipseys.com',
    city: 'Baton Rouge', state: 'LA',
    tags: ['distributor','wholesale','exclusive-models','dealer-only'],
    notes: 'Major firearms distributor. Known for exclusive model runs with manufacturers. Dealer-facing but massive industry influence.',
  },
  {
    name: 'Sports South',
    firstName: 'Media',
    website: 'https://www.sportssouth.com',
    email: 'customerservice@sportssouth.com',
    city: 'Shreveport', state: 'LA',
    tags: ['distributor','wholesale','dealer-only'],
    notes: 'Major national firearms distributor. B2B only but key industry player.',
  },
  {
    name: 'Jerry\'s Enterprises (RSR Group)',
    firstName: 'Media',
    website: 'https://www.rsrgroup.com',
    email: 'customerservice@rsrgroup.com',
    city: 'Winter Garden', state: 'FL',
    tags: ['distributor','wholesale','national','dealer-only'],
    notes: 'RSR Group is one of the largest US firearms distributors. B2B only.',
  },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = { created: 0, skipped: 0, errors: [] }

  for (const dealer of DEALERS) {
    try {
      const exists = await sanity.fetch(
        `*[_type == "outreachContact" && website == $url][0]._id`,
        { url: dealer.website }
      )
      if (exists) { results.skipped++; continue }

      await sanity.create({
        _type: 'outreachContact',
        type: 'ffl_dealer',
        status: 'active',
        source: 'manual',
        country: 'USA',
        emailPermission: false,
        addedAt: new Date().toISOString(),
        ...dealer,
      })
      results.created++
    } catch (err) {
      results.errors.push({ name: dealer.name, error: err.message })
    }
    await new Promise(r => setTimeout(r, 120))
  }

  return Response.json({
    ok: true,
    total: DEALERS.length,
    created: results.created,
    skipped: results.skipped,
    errors: results.errors.slice(0, 10),
  })
}
