export const dynamic = 'force-dynamic'
import { client } from '../../sanity/lib/client'

// Google News Sitemap spec:
// - ONLY articles published within the last 2 days (48h)
// - Max 1000 items per sitemap
// - news:publication_date must be accurate ISO 8601
// - news:title required; image preferred for News Top Stories eligibility
export async function GET() {
  const cutoff = new Date(Date.now() - 48 * 3600 * 1000).toISOString()

  const articles = await client.fetch(
    `*[_type=="newsArticle" && approved==true && publishedAt > $cutoff]
     | order(publishedAt desc)[0...1000]
     { title, slug, publishedAt, _updatedAt, imageUrl, "heroImg": heroImage.asset->url, source, category }`,
    { cutoff }
  ).catch(() => [])

  const esc = s => (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  const items = articles.map(a => {
    const url  = `https://www.downrangeco.com/news/${a.slug?.current}`
    const date = a._updatedAt || a.publishedAt || new Date().toISOString()
    const img  = a.heroImg || a.imageUrl || null
    return `<url>
    <loc>${url}</loc>
    <lastmod>${new Date(date).toISOString()}</lastmod>
    <news:news>
      <news:publication>
        <news:name>DownRange</news:name>
        <news:language>en</news:language>
      </news:publication>
      <news:publication_date>${new Date(a.publishedAt || Date.now()).toISOString()}</news:publication_date>
      <news:title><![CDATA[${a.title || ''}]]></news:title>
    </news:news>${img ? `
    <image:image>
      <image:loc>${esc(img)}</image:loc>
      <image:title><![CDATA[${a.title || ''}]]></image:title>
    </image:image>` : ''}
  </url>`
  }).join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${items}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=900, stale-while-revalidate=1800',
    }
  })
}
