/**
 * Master Firearms Manufacturer Registry
 * Used by the releases scraper to identify and attribute new product announcements.
 * PRNewswire RSS is the primary source — all major manufacturers distribute there.
 */

export const MANUFACTURERS = [
  // ── PISTOLS / HANDGUNS ───────────────────────────────────────────────────────
  {
    brand: 'Glock',
    website: 'https://us.glock.com',
    pressPage: 'https://us.glock.com/en/press-release/news-page',
    prnKeyword: 'GLOCK',
    country: 'Austria',
    category: ['Pistol'],
    logoKeywords: ['glock'],
  },
  {
    brand: 'SIG Sauer',
    website: 'https://www.sigsauer.com',
    pressPage: 'https://www.sigsauer.com/blog/category/new-products',
    prnKeyword: 'SIG SAUER',
    country: 'USA/Germany',
    category: ['Pistol', 'Rifle', 'Suppressor', 'Optic'],
    logoKeywords: ['sig sauer', 'sig-sauer'],
  },
  {
    brand: 'Smith & Wesson',
    website: 'https://www.smith-wesson.com',
    pressPage: 'https://investor.smith-wesson.com/news-releases',
    prnKeyword: 'Smith & Wesson',
    country: 'USA',
    category: ['Pistol', 'Revolver', 'Rifle'],
    logoKeywords: ['smith & wesson', 'smith and wesson', 'american outdoor brands'],
  },
  {
    brand: 'Ruger',
    website: 'https://www.ruger.com',
    pressPage: 'https://www.ruger.com/micros/newProducts/',
    prnKeyword: 'Sturm, Ruger',
    country: 'USA',
    category: ['Pistol', 'Revolver', 'Rifle', 'Shotgun'],
    logoKeywords: ['ruger', 'sturm ruger'],
  },
  {
    brand: 'Springfield Armory',
    website: 'https://www.springfield-armory.com',
    pressPage: 'https://www.springfield-armory.com/news/',
    prnKeyword: 'Springfield Armory',
    country: 'USA',
    category: ['Pistol', 'Rifle'],
    logoKeywords: ['springfield armory'],
  },
  {
    brand: 'Beretta',
    website: 'https://www.beretta.com',
    pressPage: 'https://www.beretta.com/en-us/news/',
    prnKeyword: 'Beretta',
    country: 'Italy/USA',
    category: ['Pistol', 'Shotgun', 'Rifle'],
    logoKeywords: ['beretta'],
  },
  {
    brand: 'Walther',
    website: 'https://www.waltherarms.com',
    pressPage: 'https://www.waltherarms.com/news/',
    prnKeyword: 'Walther',
    country: 'Germany',
    category: ['Pistol'],
    logoKeywords: ['walther'],
  },
  {
    brand: 'HK USA',
    website: 'https://www.hk-usa.com',
    pressPage: 'https://www.hk-usa.com/news/',
    prnKeyword: 'Heckler & Koch',
    country: 'Germany/USA',
    category: ['Pistol', 'Rifle'],
    logoKeywords: ['heckler', 'h&k', 'hk usa'],
  },
  {
    brand: 'CZ-USA',
    website: 'https://cz-usa.com',
    pressPage: 'https://cz-usa.com/news/',
    prnKeyword: 'CZ-USA',
    country: 'Czech Republic',
    category: ['Pistol', 'Rifle', 'Shotgun'],
    logoKeywords: ['cz-usa', 'cz usa', 'česká zbrojovka'],
  },
  {
    brand: 'Kimber',
    website: 'https://www.kimberamerica.com',
    pressPage: 'https://www.kimberamerica.com/news',
    prnKeyword: 'Kimber',
    country: 'USA',
    category: ['Pistol'],
    logoKeywords: ['kimber'],
  },
  {
    brand: 'Taurus',
    website: 'https://www.taurususa.com',
    pressPage: 'https://www.taurususa.com/news/',
    prnKeyword: 'Taurus',
    country: 'Brazil/USA',
    category: ['Pistol', 'Revolver', 'Rifle'],
    logoKeywords: ['taurus usa'],
  },
  {
    brand: 'FN America',
    website: 'https://www.fnamerica.com',
    pressPage: 'https://www.fnamerica.com/news/',
    prnKeyword: 'FN America',
    country: 'Belgium/USA',
    category: ['Pistol', 'Rifle'],
    logoKeywords: ['fn america', 'fabrique nationale'],
  },
  {
    brand: 'Kahr Arms',
    website: 'https://www.kahr.com',
    pressPage: 'https://www.kahr.com/news/',
    prnKeyword: 'Kahr Arms',
    country: 'USA',
    category: ['Pistol'],
    logoKeywords: ['kahr'],
  },
  {
    brand: 'Kel-Tec',
    website: 'https://www.keltecweapons.com',
    pressPage: 'https://www.keltecweapons.com/news/',
    prnKeyword: 'Kel-Tec',
    country: 'USA',
    category: ['Pistol', 'Rifle', 'Shotgun'],
    logoKeywords: ['kel-tec', 'keltec'],
  },

  // ── RIFLES / LONG GUNS ───────────────────────────────────────────────────────
  {
    brand: 'Daniel Defense',
    website: 'https://danieldefense.com',
    pressPage: 'https://danieldefense.com/blog/',
    prnKeyword: 'Daniel Defense',
    country: 'USA',
    category: ['Rifle'],
    logoKeywords: ['daniel defense'],
  },
  {
    brand: 'BCM (Bravo Company)',
    website: 'https://www.bravocompanymfg.com',
    pressPage: 'https://www.bravocompanymfg.com/blog/',
    prnKeyword: 'Bravo Company',
    country: 'USA',
    category: ['Rifle'],
    logoKeywords: ['bravo company', 'bcm'],
  },
  {
    brand: 'LWRC International',
    website: 'https://www.lwrci.com',
    pressPage: 'https://www.lwrci.com/blogs/news',
    prnKeyword: 'LWRC',
    country: 'USA',
    category: ['Rifle'],
    logoKeywords: ['lwrc', 'lwrci'],
  },
  {
    brand: 'LaRue Tactical',
    website: 'https://www.larue.com',
    pressPage: 'https://www.larue.com/pages/news',
    prnKeyword: 'LaRue Tactical',
    country: 'USA',
    category: ['Rifle'],
    logoKeywords: ['larue'],
  },
  {
    brand: 'Windham Weaponry',
    website: 'https://www.windhamweaponry.com',
    pressPage: 'https://www.windhamweaponry.com/news/',
    prnKeyword: 'Windham Weaponry',
    country: 'USA',
    category: ['Rifle'],
    logoKeywords: ['windham'],
  },
  {
    brand: 'Savage Arms',
    website: 'https://www.savagearms.com',
    pressPage: 'https://www.savagearms.com/news',
    prnKeyword: 'Savage Arms',
    country: 'USA',
    category: ['Rifle', 'Pistol'],
    logoKeywords: ['savage arms'],
  },
  {
    brand: 'Tikka',
    website: 'https://www.tikka.fi/en',
    pressPage: 'https://www.tikka.fi/en/news',
    prnKeyword: 'Tikka',
    country: 'Finland',
    category: ['Rifle'],
    logoKeywords: ['tikka'],
  },
  {
    brand: 'Christensen Arms',
    website: 'https://www.christensenarms.com',
    pressPage: 'https://www.christensenarms.com/blogs/news',
    prnKeyword: 'Christensen Arms',
    country: 'USA',
    category: ['Rifle'],
    logoKeywords: ['christensen arms'],
  },

  // ── SHOTGUNS ────────────────────────────────────────────────────────────────
  {
    brand: 'Mossberg',
    website: 'https://www.mossberg.com',
    pressPage: 'https://www.mossberg.com/news/',
    prnKeyword: 'Mossberg',
    country: 'USA',
    category: ['Shotgun', 'Rifle'],
    logoKeywords: ['mossberg', 'o.f. mossberg'],
  },
  {
    brand: 'Benelli',
    website: 'https://www.benelliusa.com',
    pressPage: 'https://www.benelliusa.com/news/',
    prnKeyword: 'Benelli',
    country: 'Italy',
    category: ['Shotgun', 'Rifle'],
    logoKeywords: ['benelli'],
  },
  {
    brand: 'Browning',
    website: 'https://www.browning.com',
    pressPage: 'https://www.browning.com/news/',
    prnKeyword: 'Browning',
    country: 'USA',
    category: ['Shotgun', 'Rifle', 'Pistol'],
    logoKeywords: ['browning'],
  },
  {
    brand: 'Winchester Repeating Arms',
    website: 'https://www.winchesterguns.com',
    pressPage: 'https://www.winchesterguns.com/news/',
    prnKeyword: 'Winchester Repeating Arms',
    country: 'USA',
    category: ['Rifle', 'Shotgun'],
    logoKeywords: ['winchester repeating', 'winchester firearms'],
  },
  {
    brand: 'Remington',
    website: 'https://www.remington.com',
    pressPage: 'https://www.remington.com/news/',
    prnKeyword: 'Remington Arms',
    country: 'USA',
    category: ['Rifle', 'Shotgun', 'Pistol'],
    logoKeywords: ['remington arms', 'remington firearms'],
  },

  // ── 1911 / PRECISION / CUSTOM ────────────────────────────────────────────────
  {
    brand: 'Wilson Combat',
    website: 'https://www.wilsoncombat.com',
    pressPage: 'https://www.wilsoncombat.com/news/',
    prnKeyword: 'Wilson Combat',
    country: 'USA',
    category: ['Pistol', 'Rifle'],
    logoKeywords: ['wilson combat'],
  },
  {
    brand: 'Nighthawk Custom',
    website: 'https://www.nighthawkcustom.com',
    pressPage: 'https://www.nighthawkcustom.com/news/',
    prnKeyword: 'Nighthawk Custom',
    country: 'USA',
    category: ['Pistol'],
    logoKeywords: ['nighthawk custom'],
  },
  {
    brand: 'Les Baer Custom',
    website: 'https://www.lesbaer.com',
    pressPage: 'https://www.lesbaer.com/news/',
    prnKeyword: 'Les Baer',
    country: 'USA',
    category: ['Pistol', 'Rifle'],
    logoKeywords: ['les baer'],
  },

  // ── SUPPRESSORS / NFA ────────────────────────────────────────────────────────
  {
    brand: 'SilencerCo',
    website: 'https://www.silencerco.com',
    pressPage: 'https://www.silencerco.com/news/',
    prnKeyword: 'SilencerCo',
    country: 'USA',
    category: ['Suppressor'],
    logoKeywords: ['silencerco'],
  },
  {
    brand: 'Dead Air Silencers',
    website: 'https://www.deadairsilencers.com',
    pressPage: 'https://www.deadairsilencers.com/news/',
    prnKeyword: 'Dead Air Silencers',
    country: 'USA',
    category: ['Suppressor'],
    logoKeywords: ['dead air'],
  },
  {
    brand: 'Gemtech',
    website: 'https://www.gem-tech.com',
    pressPage: 'https://www.gem-tech.com/news/',
    prnKeyword: 'Gemtech',
    country: 'USA',
    category: ['Suppressor'],
    logoKeywords: ['gemtech'],
  },
]

/**
 * All PRN search keywords — used to build the RSS query
 */
export const ALL_PRN_KEYWORDS = MANUFACTURERS.map(m => m.prnKeyword)

/**
 * Look up a manufacturer by a keyword found in a press release title/body
 */
export function matchManufacturer(text) {
  const lower = text.toLowerCase()
  return MANUFACTURERS.find(m =>
    m.logoKeywords.some(kw => lower.includes(kw.toLowerCase()))
  ) || null
}
