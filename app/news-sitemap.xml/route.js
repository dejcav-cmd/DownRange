export const dynamic = 'force-dynamic'
import { client } from '../../sanity/lib/client'

export async function GET() {
  const articles = await client.fetch(`*[_type=="newsArticle"&&approved==true]|order(publishedAt desc)[0...1000]{title,slug,publishedAt,source}`).catch(()=>[])
  const items = articles.map(a=>`<url>
    <loc>https://downrangeco.com/news/${a.slug?.current}</loc>
    <news:news>
      <news:publication><news:name>DownRange</news:name><news:language>en</news:language></news:publication>
      <news:publication_date>${new Date(a.publishedAt||Date.now()).toISOString()}</news:publication_date>
      <news:title><![CDATA[${a.title||''}]]></news:title>
    </news:news>
  </url>`).join('\n')
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${items}</urlset>`
  return new Response(xml, { headers:{ 'Content-Type':'application/xml', 'Cache-Control':'public, max-age=3600' }})
}
