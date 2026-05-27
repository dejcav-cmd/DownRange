export const dynamic = 'force-dynamic'

export async function GET() {
  const now = new Date().toISOString()
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>DownRange RSS Feeds</title>
    <dateCreated>${now}</dateCreated>
    <dateModified>${now}</dateModified>
    <ownerName>DownRange</ownerName>
    <ownerEmail>dj@downrangeco.com</ownerEmail>
    <docs>http://opml.org/spec2.opml</docs>
  </head>
  <body>
    <outline text="DownRange" title="DownRange — downrangeco.com">
      <outline type="rss" text="All Content (Master Feed)"
        title="DownRange — All Content"
        xmlUrl="https://downrangeco.com/feed.xml"
        htmlUrl="https://downrangeco.com"/>
      <outline type="rss" text="Firearms News"
        title="DownRange — Firearms News"
        xmlUrl="https://downrangeco.com/feeds/news"
        htmlUrl="https://downrangeco.com/news"/>
      <outline type="rss" text="Laws &amp; Legislation"
        title="DownRange — Laws &amp; Legislation"
        xmlUrl="https://downrangeco.com/feeds/laws"
        htmlUrl="https://downrangeco.com/laws"/>
      <outline type="rss" text="Blog &amp; Analysis"
        title="DownRange — Blog"
        xmlUrl="https://downrangeco.com/feeds/blog"
        htmlUrl="https://downrangeco.com/blog"/>
      <outline type="rss" text="New Gun Releases"
        title="DownRange — New Releases"
        xmlUrl="https://downrangeco.com/feeds/releases"
        htmlUrl="https://downrangeco.com/releases"/>
      <outline type="rss" text="Competitions Calendar"
        title="DownRange — Competitions"
        xmlUrl="https://downrangeco.com/feeds/competitions"
        htmlUrl="https://downrangeco.com/competitions"/>
      <outline type="rss" text="Canadian Firearms News"
        title="DownRange — Canada"
        xmlUrl="https://downrangeco.com/feeds/canada"
        htmlUrl="https://downrangeco.com/canada"/>
      <outline type="rss" text="Gun Reviews"
        title="DownRange — Reviews"
        xmlUrl="https://downrangeco.com/feeds/reviews"
        htmlUrl="https://downrangeco.com/reviews"/>
    </outline>
  </body>
</opml>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Content-Disposition': 'attachment; filename="downrange-feeds.opml"',
      'Cache-Control': 'public, max-age=86400',
    }
  })
}
