export const dynamic = 'force-dynamic'
import { client } from '../../sanity/lib/client'

export async function GET() {
  const articles = await client.fetch(`*[_type=="newsArticle"&&approved==true]|order(publishedAt desc)[0...20]{title,slug,excerpt,summary,category,publishedAt,source,imageUrl}`).catch(()=>[])
  const items = articles.map(a=>{
    const url=`https://downrangeco.com/news/${a.slug?.current}`
    return `<item><title><![CDATA[${a.title||''}]]></title><link>${url}</link><guid isPermaLink="true">${url}</guid><description><![CDATA[${a.summary||a.excerpt||''}]]></description><pubDate>${new Date(a.publishedAt||Date.now()).toUTCString()}</pubDate><category>${a.category||'news'}</category>${a.imageUrl?`<enclosure url="${a.imageUrl}" type="image/jpeg"/>`:''}
    </item>`
  }).join('\n')
  const xml=`<?xml version="1.0" encoding="UTF-8"?><rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom"><channel><title>DownRange — America's Firearms Intelligence Hub</title><link>https://downrangeco.com</link><description>Live. Loaded. Lawful.</description><language>en-us</language><lastBuildDate>${new Date().toUTCString()}</lastBuildDate><atom:link href="https://downrangeco.com/feed.xml" rel="self" type="application/rss+xml"/>${items}</channel></rss>`
  return new Response(xml,{headers:{'Content-Type':'application/rss+xml; charset=utf-8','Cache-Control':'public, max-age=900'}})
}
