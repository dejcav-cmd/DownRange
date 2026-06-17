export const dynamic = 'force-dynamic'
export const maxDuration = 120

// Quick diagnostic — runs the RSS fetch + brand detection, no Sanity writes
export async function GET(req) {
  const adminKey = req.headers.get('x-admin-key')
  if (adminKey !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const RELEASE_FEEDS = [
    'https://www.thetruthaboutguns.com/feed/',
    'https://www.ammoland.com/feed/',
    'https://www.guns.com/feed',
    'https://www.gunsandammo.com/feed/',
    'https://www.pewpewtactical.com/feed/',
  ]

  const RELEASE_KEYWORDS = [
    'new ','release','launch','introduces','announced','debuts',
    'first look','hands on','review','just dropped','available now',
    'ships','shipping','unveiled','reveals',
  ]

  const KNOWN_BRANDS = [
    'Glock','Sig Sauer','SIG','Smith & Wesson','S&W','Ruger','Springfield',
    'Taurus','Beretta','FN','Heckler & Koch','H&K','HK','CZ','Walther',
    'Kimber','Wilson Combat','Daniel Defense','Aero Precision','Mossberg',
    'Remington','Winchester','Browning','Benelli','Savage','Tikka',
    'Christensen','Barrett','Holosun','Trijicon','Vortex','Leupold',
    'Dead Air','SilencerCo','Maxim Defense','IWI','Canik','Shadow Systems',
    'ZEV Technologies','Geissele','Surefire','Streamlight','Magpul',
  ]

  async function parseFeed(url) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
        signal: AbortSignal.timeout(12000),
      })
      if (!r.ok) return { url, error: `HTTP ${r.status}`, items: [] }
      const xml = await r.text()
      const items = []
      const itemMatches = xml.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)
      for (const m of itemMatches) {
        const block   = m[1]
        const title   = (block.match(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/) || [])[1]?.trim() || ''
        const link    = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/) || [])[1]?.trim()
                     || (block.match(/<guid[^>]*>(https?[^<]+)<\/guid>/) || [])[1]?.trim() || ''
        const desc    = (block.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/) || [])[1]?.trim() || ''
        const pubDate = (block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/) || [])[1]?.trim() || ''
        if (title && link) items.push({ title, link, pubDate, desc: desc.replace(/<[^>]+>/g,'').slice(0,200) })
      }
      return { url, itemCount: items.length, items: items.slice(0, 5), error: null }
    } catch(e) {
      return { url, error: e.message, items: [] }
    }
  }

  function detectBrand(text) {
    const t = text.toLowerCase()
    for (const b of KNOWN_BRANDS) {
      if (t.includes(b.toLowerCase())) return b
    }
    return null
  }

  function isReleaseArticle(title, desc) {
    const text = (title + ' ' + desc).toLowerCase()
    return RELEASE_KEYWORDS.some(k => text.includes(k))
  }

  try {
    const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const feedResults = await Promise.all(RELEASE_FEEDS.map(parseFeed))

    const allItems = feedResults.flatMap(f => f.items || [])
    const totalFetched = feedResults.reduce((n, f) => n + (f.itemCount || 0), 0)

    const candidates = allItems.filter(item => {
      if (!isReleaseArticle(item.title, item.desc)) return false
      const pub = item.pubDate ? new Date(item.pubDate) : null
      if (pub && pub < cutoff) return false
      return true
    }).map(item => ({
      title:  item.title,
      pubDate: item.pubDate,
      brand:  detectBrand(item.title + ' ' + item.desc),
      isRelease: true,
      link:   item.link,
    }))

    return Response.json({
      ok: true,
      totalFetched,
      candidatesFound: candidates.length,
      candidatesWithBrand: candidates.filter(c => c.brand).length,
      feedStatus: feedResults.map(f => ({ url: f.url, items: f.itemCount, error: f.error })),
      sampleCandidates: candidates.slice(0, 10),
      cutoffDate: cutoff.toISOString(),
    })
  } catch(e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 })
  }
}
