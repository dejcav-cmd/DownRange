export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req) {
  const adminKey = process.env.ADMIN_KEY
  const provided = req.headers.get('x-admin-key')
  if (adminKey && provided !== adminKey) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const Parser = (await import('rss-parser')).default
  const parser = new Parser({
    timeout: 8000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0; +https://downrangeco.com/about)',
      'Accept': 'application/rss+xml, application/atom+xml, application/xml, text/xml, */*',
    },
  })

  const TEST_FEEDS = [
    { name: 'TTAG',         url: 'https://www.thetruthaboutguns.com/feed/' },
    { name: 'AmmoLand',     url: 'https://www.ammoland.com/feed/' },
    { name: 'TFB',          url: 'https://www.thefirearmblog.com/blog/feed/' },
    { name: 'Bearing Arms', url: 'https://bearingarms.com/feed/' },
    { name: 'GOA',          url: 'https://www.gunowners.org/feed/' },
    { name: 'NRA-ILA',      url: 'https://www.nraila.org/XML/RSS.aspx' },
    { name: 'Gun Digest',   url: 'https://gundigest.com/feed/' },
    { name: 'Pew Pew',      url: 'https://www.pewpewtactical.com/feed/' },
  ]

  const results = await Promise.all(TEST_FEEDS.map(async feed => {
    try {
      const r = await parser.parseURL(feed.url)
      const items = r.items.slice(0, 3).map(i => ({ title: i.title?.slice(0,60), pubDate: i.pubDate || i.isoDate }))
      return { name: feed.name, ok: true, count: r.items.length, items }
    } catch (e) {
      return { name: feed.name, ok: false, error: e.message.slice(0,80) }
    }
  }))

  return Response.json({
    env: {
      NEWSAPI_KEY: !!process.env.NEWSAPI_KEY,
      ANTHROPIC_API_KEY: !!process.env.ANTHROPIC_API_KEY,
    },
    feeds: results
  })
}
