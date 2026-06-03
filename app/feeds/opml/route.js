export const dynamic = 'force-dynamic'

export async function GET() {
  const feeds = [
    { title: 'DownRange — All Content',         url: 'https://downrangeco.com/feed.xml' },
    { title: 'DownRange — Firearms News',        url: 'https://downrangeco.com/feeds/news' },
    { title: 'DownRange — Laws & Legislation',   url: 'https://downrangeco.com/feeds/laws' },
    { title: 'DownRange — New Gun Releases',     url: 'https://downrangeco.com/feeds/releases' },
    { title: 'DownRange — Blog & Analysis',      url: 'https://downrangeco.com/feeds/blog' },
    { title: 'DownRange — Gun Reviews',          url: 'https://downrangeco.com/feeds/reviews' },
    { title: 'DownRange — Gun Giveaways',        url: 'https://downrangeco.com/feeds/giveaways' },
    { title: 'DownRange — Hunting & Outdoors',   url: 'https://downrangeco.com/feeds/hunting' },
    { title: 'DownRange — Gun Deals',            url: 'https://downrangeco.com/feeds/deals' },
    { title: 'DownRange — Firearms Videos',      url: 'https://downrangeco.com/feeds/video' },
    { title: 'DownRange — Competitions',         url: 'https://downrangeco.com/feeds/competitions' },
    { title: 'DownRange — Canada',               url: 'https://downrangeco.com/feeds/canada' },
  ]

  const outlines = feeds.map(f =>
    `  <outline type="rss" text="${f.title}" title="${f.title}" xmlUrl="${f.url}" htmlUrl="https://downrangeco.com"/>`
  ).join('\n')

  const opml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>DownRange — All RSS Feeds</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
    <ownerName>DownRange</ownerName>
    <ownerEmail>dj@downrangeco.com</ownerEmail>
  </head>
  <body>
    <outline text="DownRange" title="DownRange — Firearms &amp; 2A Intelligence">
${outlines}
    </outline>
  </body>
</opml>`

  return new Response(opml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="downrange-feeds.opml"',
      'Cache-Control': 'public, max-age=3600',
    }
  })
}
