// Manufacturer press / news pages that feed the Manufacturer Press Releases section.
// Verified Oct 7 2026. `pathHint` helps the link finder keep only real release links.
// kind: 'press' = formal press-release listing, 'news' = news hub, 'blog' = blog used as newsroom.

export const PRESS_SOURCES = [
  { brand: 'Smith & Wesson',        url: 'https://ir.smith-wesson.com/press-releases',                  kind: 'press', pathHint: '/news-releases/' },
  { brand: 'Ruger',                 url: 'https://www.ruger.com/news/',                                 kind: 'news',  pathHint: '/news/' },
  { brand: 'Glock',                 url: 'https://us.glock.com/press-release/news-page',                kind: 'press', pathHint: '/press-release/' },
  { brand: 'SIG Sauer',             url: 'https://www.sigsauer.com/blog/category/company-news',         kind: 'blog',  pathHint: '/blog/' },
  { brand: 'Springfield Armory',    url: 'https://www.springfield-armory.com/intel/press-releases/',    kind: 'press', pathHint: '/intel/press-releases/' },
  { brand: 'Taurus',                url: 'https://www.taurususa.com/company/news',                      kind: 'news',  pathHint: '/company/news' },
  { brand: 'Mossberg',              url: 'https://mossberg.com/corporate/press-releases',               kind: 'press', pathHint: '/corporate/press-releases' },
  { brand: 'Remington',             url: 'https://www.remington.com/news.html',                         kind: 'news',  pathHint: '/news' },
  { brand: 'Savage Arms',           url: 'https://savagearms.com/news',                                 kind: 'press', pathHint: '/news' },
  { brand: 'Henry Repeating Arms',  url: 'https://www.henryusa.com/about-us/henry-news/',               kind: 'news',  pathHint: '/about-us/henry-news/' },
  { brand: 'Winchester Repeating Arms', url: 'https://www.winchesterguns.com/news/articles.html',       kind: 'news',  pathHint: '/news/' },
  { brand: 'Browning',              url: 'https://www.browning.com/news/articles.html',                 kind: 'news',  pathHint: '/news/' },
  { brand: 'Kimber',                url: 'https://www.kimberamerica.com/press',                         kind: 'press', pathHint: '/press' },
  { brand: 'CZ-USA',                url: 'https://www.czfirearms.com/en-us/news/',                      kind: 'news',  pathHint: '/news/' },
  { brand: 'FN America',            url: 'https://fnamerica.com/press-releases/',                       kind: 'press', pathHint: '/press-releases/' },
  { brand: 'Heckler & Koch',        url: 'https://www.hk-usa.com/news/',                                kind: 'news',  pathHint: '/news/' },
  { brand: 'Beretta USA',           url: 'https://www.beretta.com/en-us/blog',                          kind: 'blog',  pathHint: '/blog' },
  { brand: 'Daniel Defense',        url: 'https://danieldefense.com/wire',                              kind: 'blog',  pathHint: '/wire' },
  { brand: 'Colt',                  url: 'https://www.colt.com/colt-news/',                             kind: 'news',  pathHint: '/colt-news/' },
  { brand: 'Marlin Firearms',       url: 'https://marlinfirearms.com/s/news/',                          kind: 'news',  pathHint: '/news/' },
  { brand: 'Walther Arms',          url: 'https://www.waltherarms.com/news/',                           kind: 'news',  pathHint: '/news/' },
  { brand: 'Canik',                 url: 'https://www.canik.com/blogs/news',                            kind: 'blog',  pathHint: '/blogs/news' },
  { brand: 'Kel-Tec',               url: 'https://keltecweapons.com/blog/category/press/',              kind: 'press', pathHint: '/blog/' },
  { brand: 'Barrett',               url: 'https://barrett.net/news/',                                   kind: 'news',  pathHint: '/news/' },
  { brand: 'Christensen Arms',      url: 'https://christensenarms.com/blog/',                           kind: 'blog',  pathHint: '/blog/' },
  { brand: 'Weatherby',             url: 'https://www.weatherby.com/blog/',                             kind: 'blog',  pathHint: '/blog/' },
  { brand: 'Benelli USA',           url: 'https://www.benelliusa.com/resources/press-releases',         kind: 'press', pathHint: '/resources/press-releases' },
  { brand: 'Bergara',               url: 'https://www.bergara.online/us/blog/',                         kind: 'blog',  pathHint: '/blog/' },
  { brand: 'Tikka',                 url: 'https://www.sako.global/en/news',                             kind: 'news',  pathHint: '/news' },
  { brand: 'Fusion Firearms',       url: 'https://fusionfirearms.com/blog/',                            kind: 'blog',  pathHint: '/blog' },
]

export function brandSlug(brand) {
  return String(brand || '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
