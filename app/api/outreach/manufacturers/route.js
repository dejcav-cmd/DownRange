export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// ─────────────────────────────────────────────────────────────────────────────
// US MANUFACTURERS — FIREARMS, SUPPRESSORS, ACCESSORIES
// ─────────────────────────────────────────────────────────────────────────────

const MANUFACTURERS = [

  // ── MAJOR HANDGUN / RIFLE MANUFACTURERS ─────────────────────────────────────
  { name:'Smith & Wesson / American Outdoor Brands', firstName:'Media',  website:'https://www.smith-wesson.com',       city:'Springfield',  state:'MA', tags:['handgun','revolver','rifle','major','public'], notes:'Public company (SWBI). Media contact via investor relations or PR.' },
  { name:'Sturm, Ruger & Co.',          firstName:'Media',  website:'https://www.ruger.com',              city:'Southport',    state:'CT', tags:['handgun','revolver','rifle','shotgun','major','public'], notes:'Public company (RGR). One of the largest US manufacturers.' },
  { name:'Springfield Armory',          firstName:'Media',  website:'https://www.springfield-armory.com', city:'Geneseo',      state:'IL', tags:['handgun','rifle','1911','major'], notes:'Large consumer manufacturer. Known for Hellcat, XD, M1A series.' },
  { name:'Taurus USA',                  firstName:'Media',  website:'https://www.taurususa.com',          city:'Bainbridge',   state:'GA', tags:['handgun','revolver','rifle','major'], notes:'Brazilian-owned but US-based operations. High volume consumer brand.' },
  { name:'Kimber America',              firstName:'Media',  website:'https://www.kimberamerica.com',      city:'Troy',         state:'AL', tags:['1911','handgun','rifle','major'], notes:'Premium 1911 and bolt-action rifles. Strong dealer network.' },
  { name:'Kahr Arms',                   firstName:'Media',  website:'https://www.kahr.com',               city:'Greeley',      state:'PA', tags:['handgun','CCW','major'] },
  { name:'Kel-Tec CNC Industries',      firstName:'Media',  website:'https://www.keltecweapons.com',      city:'Cocoa',        state:'FL', tags:['handgun','rifle','shotgun','innovative'] },
  { name:'Savage Arms',                 firstName:'Media',  website:'https://www.savagearms.com',         city:'Westfield',    state:'MA', tags:['rifle','handgun','bolt-action','major'] },
  { name:'Mossberg',                    firstName:'Media',  website:'https://www.mossberg.com',           city:'North Haven',  state:'CT', tags:['shotgun','rifle','major'] },
  { name:'Remington Arms',              firstName:'Media',  website:'https://www.remington.com',          city:'LaGrange',     state:'GA', tags:['rifle','shotgun','revolver','major'] },
  { name:'Browning Arms',               firstName:'Media',  website:'https://www.browning.com',           city:'Morgan',       state:'UT', tags:['rifle','shotgun','handgun','major'] },
  { name:'Winchester Repeating Arms',   firstName:'Media',  website:'https://www.winchesterguns.com',     city:'New Haven',    state:'CT', tags:['rifle','shotgun','lever-action','major'] },
  { name:'Marlin Firearms (via Ruger)', firstName:'Media',  website:'https://www.marlinfirearms.com',     city:'Mayodan',      state:'NC', tags:['rifle','lever-action'] },
  { name:'Henry Repeating Arms',        firstName:'Media',  website:'https://www.henryusa.com',           city:'Bayonne',      state:'NJ', tags:['lever-action','rifle','made-in-usa'] },
  { name:'CZ-USA',                      firstName:'Media',  website:'https://cz-usa.com',                 city:'Kansas City',  state:'KS', tags:['handgun','rifle','shotgun','major'] },

  // ── AR / TACTICAL RIFLE MANUFACTURERS ───────────────────────────────────────
  { name:'Daniel Defense',             firstName:'Marty',  website:'https://danieldefense.com',          city:'Black Creek',  state:'GA', tags:['AR','rifle','premium','tactical'], notes:'Marty Daniel is the founder. Premium AR-15/M4 manufacturer, military contracts.' },
  { name:'Bravo Company Mfg (BCM)',    firstName:'Media',  website:'https://www.bravocompanymfg.com',    city:'Hartland',     state:'WI', tags:['AR','rifle','milspec'] },
  { name:'LWRC International',         firstName:'Media',  website:'https://www.lwrci.com',              city:'Cambridge',    state:'MD', tags:['AR','piston','rifle','premium'] },
  { name:'Windham Weaponry',           firstName:'Richard',website:'https://www.windhamweaponry.com',    city:'Windham',      state:'ME', tags:['AR','rifle','made-in-usa'], notes:'Richard Dyke, founder. Original Bushmaster team. All American-made.' },
  { name:'Christensen Arms',           firstName:'Media',  website:'https://www.christensenarms.com',    city:'Gunnison',     state:'UT', tags:['rifle','carbon-fiber','precision','bolt-action'] },
  { name:'LaRue Tactical',             firstName:'Mark',   website:'https://www.larue.com',              city:'Leander',      state:'TX', tags:['AR','precision','optics-mounts'], notes:'Mark LaRue runs the company directly. Opinionated and engaged online.' },
  { name:'Noveske Rifleworks',         firstName:'Media',  website:'https://www.noveske.com',            city:'Grants Pass',  state:'OR', tags:['AR','premium','tactical'] },
  { name:'Aero Precision',             firstName:'Media',  website:'https://www.aeroprecisionusa.com',   city:'Tacoma',       state:'WA', tags:['AR','80-percent','parts','affordable'], notes:'Based in Tacoma WA — direct geographic overlap with DownRange.' },
  { name:'Sons of Liberty Gun Works',  firstName:'Mike',   website:'https://www.slgw.com',               city:'San Antonio',  state:'TX', tags:['AR','rifle','competition'] },
  { name:'Stag Arms',                  firstName:'Media',  website:'https://www.stagarms.com',           city:'New Britain',  state:'CT', tags:['AR','left-handed','rifle'] },
  { name:'Rock River Arms',            firstName:'Media',  website:'https://rockriverarms.com',          city:'Colona',       state:'IL', tags:['AR','rifle','competition'] },

  // ── PRECISION / BOLT-ACTION ──────────────────────────────────────────────────
  { name:'Accuracy International (AI US)', firstName:'Media', website:'https://www.accuracyinternational.com', city:'Portsmouth', state:'NH', tags:['precision','bolt-action','military','sniper'] },
  { name:'Proof Research',             firstName:'Media',  website:'https://www.proofresearch.com',      city:'Columbia Falls', state:'MT', tags:['precision','carbon-barrel','bolt-action'] },
  { name:'Surgeon Rifles',             firstName:'Media',  website:'https://www.surgeonrifles.com',      city:'Prague',       state:'OK', tags:['precision','custom','bolt-action'] },
  { name:'Tikka (Sako USA)',           firstName:'Media',  website:'https://www.sako.fi/en-us',          city:'Accokeek',     state:'MD', tags:['precision','bolt-action','Finnish'] },

  // ── 1911 / CUSTOM / BOUTIQUE ─────────────────────────────────────────────────
  { name:'Wilson Combat',              firstName:'Bill',   website:'https://www.wilsoncombat.com',       city:'Berryville',   state:'AR', tags:['1911','custom','premium','CCW'], notes:'Bill Wilson still actively engaged. Top-tier custom shop.' },
  { name:'Nighthawk Custom',           firstName:'Mark',   website:'https://www.nighthawkcustom.com',    city:'Berryville',   state:'AR', tags:['1911','custom','premium'] },
  { name:'Les Baer Custom',            firstName:'Les',    website:'https://www.lesbaer.com',            city:'LeClaire',     state:'IA', tags:['1911','custom','precision'] },
  { name:'Ed Brown Products',          firstName:'Media',  website:'https://edbrown.com',                city:'Perry',        state:'MO', tags:['1911','custom','premium'] },
  { name:'Cabot Guns',                 firstName:'Rob',    website:'https://cabotguns.com',              city:'Butler',       state:'PA', tags:['1911','ultra-premium','artisan'] },

  // ── SUPPRESSORS / NFA ────────────────────────────────────────────────────────
  { name:'SilencerCo',                 firstName:'Media',  website:'https://www.silencerco.com',         city:'West Valley City', state:'UT', tags:['suppressor','NFA','major','advocacy'], notes:'Most influential suppressor manufacturer. Strong 2A advocacy arm.' },
  { name:'Dead Air Silencers',         firstName:'Media',  website:'https://www.deadairsilencers.com',   city:'Provo',        state:'UT', tags:['suppressor','NFA','premium'] },
  { name:'Gemtech',                    firstName:'Media',  website:'https://www.gem-tech.com',           city:'Boise',        state:'ID', tags:['suppressor','NFA','milspec'] },
  { name:'Surefire',                   firstName:'Media',  website:'https://www.surefire.com',           city:'Fountain Valley', state:'CA', tags:['suppressor','lights','accessories','military'] },
  { name:'Advanced Armament Corp (AAC)', firstName:'Media', website:'https://www.advanced-armament.com', city:'Lawrenceville', state:'GA', tags:['suppressor','NFA'] },
  { name:'Yankee Hill Machine (YHM)',  firstName:'Media',  website:'https://www.yhm.net',                city:'Florence',     state:'MA', tags:['suppressor','AR-parts','NFA'] },
  { name:'Rugged Suppressors',         firstName:'Media',  website:'https://www.ruggedsuppressors.com',  city:'Dayton',       state:'VA', tags:['suppressor','NFA','modular'] },
  { name:'Thunder Beast Arms',         firstName:'Media',  website:'https://www.thunderbeastarms.com',   city:'Casper',       state:'WY', tags:['suppressor','precision','bolt-action'] },
  { name:'Obsidian Arms',              firstName:'Media',  website:'https://obsidianarms.com',           city:'Cheyenne',     state:'WY', tags:['suppressor','NFA'] },
  { name:'Liberty Defense Group',      firstName:'Media',  website:'https://www.libertydefense.com',     city:'Spanish Fork',  state:'UT', tags:['suppressor','NFA'] },

  // ── OPTICS ───────────────────────────────────────────────────────────────────
  { name:'Trijicon',                   firstName:'Media',  website:'https://www.trijicon.com',           city:'Wixom',        state:'MI', tags:['optics','ACOG','RMR','military','premium'] },
  { name:'EOTech',                     firstName:'Media',  website:'https://www.eotechinc.com',          city:'Ann Arbor',    state:'MI', tags:['optics','holographic','military'] },
  { name:'Vortex Optics',              firstName:'Media',  website:'https://www.vortexoptics.com',       city:'Barneveld',    state:'WI', tags:['optics','value','popular','warranty'] },
  { name:'Leupold & Stevens',          firstName:'Media',  website:'https://www.leupold.com',            city:'Beaverton',    state:'OR', tags:['optics','precision','hunting','made-in-usa'] },
  { name:'Nightforce Optics',          firstName:'Media',  website:'https://www.nightforceoptics.com',   city:'Orofino',      state:'ID', tags:['optics','precision','competition','premium'] },
  { name:'Aimpoint (US)',              firstName:'Media',  website:'https://www.aimpoint.com',           city:'Chantilly',    state:'VA', tags:['optics','red-dot','military'] },
  { name:'Holosun Technologies',       firstName:'Media',  website:'https://www.holosun.com',            city:'City of Industry', state:'CA', tags:['optics','red-dot','value','MRDS'] },
  { name:'Primary Arms',               firstName:'Media',  website:'https://www.primaryarms.com',        city:'Houston',      state:'TX', tags:['optics','ACSS','value','retailer'] },

  // ── HOLSTERS & CARRY GEAR ────────────────────────────────────────────────────
  { name:'Safariland',                 firstName:'Media',  website:'https://www.safariland.com',         city:'Jacksonville', state:'FL', tags:['holster','duty','law-enforcement','military'] },
  { name:'Blackhawk',                  firstName:'Media',  website:'https://www.blackhawk.com',          city:'Norfolk',      state:'VA', tags:['holster','gear','duty'] },
  { name:'Alien Gear Holsters',        firstName:'Media',  website:'https://aliengearholsters.com',      city:'Hayden',       state:'ID', tags:['holster','CCW','IWB','OWB'] },
  { name:'Vedder Holsters',            firstName:'Media',  website:'https://www.vedderholsters.com',     city:'Spring Hill',  state:'FL', tags:['holster','CCW','kydex','custom'] },
  { name:'T.Rex Arms',                 firstName:'Lucas',  website:'https://www.trex-arms.com',          city:'Conway',       state:'SC', tags:['holster','CCW','appendix','YouTube'], notes:'Lucas Botkin runs the company and the YouTube channel. Dual approach — manufacturer + YouTuber.' },
  { name:'Crossbreed Holsters',        firstName:'Media',  website:'https://www.crossbreedholsters.com', city:'Springfield',  state:'MO', tags:['holster','CCW','hybrid','IWB'] },

  // ── AMMUNITION ───────────────────────────────────────────────────────────────
  { name:'Federal Premium Ammunition', firstName:'Media',  website:'https://www.federalpremium.com',     city:'Anoka',        state:'MN', tags:['ammo','major','public','hunting'] },
  { name:'Hornady Manufacturing',      firstName:'Media',  website:'https://www.hornady.com',            city:'Grand Island',  state:'NE', tags:['ammo','premium','hunting','defense'] },
  { name:'Speer Ammunition',           firstName:'Media',  website:'https://www.speer.com',              city:'Lewiston',     state:'ID', tags:['ammo','law-enforcement','defense'] },
  { name:'Winchester Ammunition',      firstName:'Media',  website:'https://www.winchester.com',         city:'East Alton',   state:'IL', tags:['ammo','major','hunting','defense'] },
  { name:'Remington Ammunition',       firstName:'Media',  website:'https://remingtonammo.com',          city:'Lonoke',       state:'AR', tags:['ammo','major'] },
  { name:'CCI Ammunition',             firstName:'Media',  website:'https://www.cci-ammunition.com',     city:'Lewiston',     state:'ID', tags:['ammo','rimfire','popular'] },
  { name:'SIG Sauer Ammunition',       firstName:'Media',  website:'https://www.sigsauer.com/ammunition', city:'Newington',   state:'NH', tags:['ammo','defense','military'] },
  { name:'Fiocchi Ammunition',         firstName:'Media',  website:'https://www.fiocchiusa.com',         city:'Ozark',        state:'MO', tags:['ammo','imported','range'] },

  // ── MAGAZINES & PARTS ────────────────────────────────────────────────────────
  { name:'Magpul Industries',          firstName:'Media',  website:'https://www.magpul.com',             city:'Austin',       state:'TX', tags:['magazines','accessories','AR','popular','2A-advocacy'], notes:'Strong 2A advocacy. Left Colorado over magazine ban. High influence.' },
  { name:'Lancer Systems',             firstName:'Media',  website:'https://www.lancer-systems.com',     city:'Quakertown',   state:'PA', tags:['magazines','AR','hybrid'] },
  { name:'Hexmag',                     firstName:'Media',  website:'https://www.hexmag.com',             city:'Brighton',     state:'CO', tags:['magazines','AR'] },
  { name:'Geissele Automatics',        firstName:'Bill',   website:'https://www.geissele.com',           city:'North Wales',  state:'PA', tags:['triggers','AR-parts','premium'], notes:'Bill Geissele is the founder. Premium triggers and rail systems. Military contracts.' },
  { name:'Timney Triggers',            firstName:'Media',  website:'https://www.timneytriggers.com',     city:'Phoenix',      state:'AZ', tags:['triggers','aftermarket','bolt-action'] },
  { name:'JP Enterprises',             firstName:'Media',  website:'https://jprifles.com',               city:'Hugo',         state:'MN', tags:['AR','competition','bolt-action','parts'] },

  // ── TRAINING / RANGE GEAR ────────────────────────────────────────────────────
  { name:'SIRT Training Pistols (Next Level Training)', firstName:'Media', website:'https://www.nextleveltraining.com', city:'Hanford', state:'CA', tags:['training','dry-fire','instructor'] },
  { name:'Mantis X',                   firstName:'Media',  website:'https://mantisx.com',                city:'Mesa',         state:'AZ', tags:['training','dry-fire','technology'] },
  { name:'LaserLyte',                  firstName:'Media',  website:'https://laserlyte.com',              city:'Cottonwood',   state:'AZ', tags:['training','laser','dry-fire'] },

  // ── WASHINGTON STATE / PNW MANUFACTURERS (local angle) ───────────────────────
  { name:'Aero Precision (WA)',        firstName:'Media',  website:'https://www.aeroprecisionusa.com',   city:'Tacoma',       state:'WA', tags:['AR','parts','WA-based','local'], notes:'PRIORITY — Washington state manufacturer. Direct geographic alignment.' },
  { name:'Olympic Arms',               firstName:'Media',  website:'https://www.olyarms.com',            city:'Olympia',      state:'WA', tags:['AR','rifle','WA-based','local'], notes:'Washington state AR manufacturer. Local partnership potential.' },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = { created: 0, skipped: 0, errors: [] }

  for (const mfr of MANUFACTURERS) {
    try {
      const exists = await sanity.fetch(
        `*[_type == "outreachContact" && website == $url][0]._id`,
        { url: mfr.website }
      )
      if (exists) { results.skipped++; continue }

      await sanity.create({
        _type: 'outreachContact',
        type: 'organization',
        status: 'active',
        source: 'manual',
        country: 'USA',
        emailPermission: false,
        addedAt: new Date().toISOString(),
        ...mfr,
      })
      results.created++
    } catch (err) {
      results.errors.push({ name: mfr.name, error: err.message })
    }
    await new Promise(r => setTimeout(r, 120))
  }

  return Response.json({
    ok: true,
    total: MANUFACTURERS.length,
    created: results.created,
    skipped: results.skipped,
    errors: results.errors.slice(0, 10),
  })
}
