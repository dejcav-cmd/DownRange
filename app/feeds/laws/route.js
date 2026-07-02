export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const articles = await sanity.fetch(
    `*[_type=="newsArticle"&&approved==true&&(category=="law"||category=="breaking")]|order(publishedAt desc)[0...50]{title,slug,summary,excerpt,category,publishedAt,imageUrl,source}`
  ).catch(() => [])

  let items = []
  items = articles.map(a => ({
      title:       a.title,
      url:         `https://www.downrangeco.com/news/${a.slug?.current}`,
      description: a.summary || a.excerpt || '',
      date:        a.publishedAt,
      category:    a.category,
      author:      a.source || 'DownRange',
      image:       a.imageUrl,
    }))

  return buildFeed({
    title:       'DownRange — Gun Laws & Legislation',
    description: 'Second Amendment legislation, court cases, ATF rules, and 2A legal news.',
    feedUrl:     'https://www.downrangeco.com/feeds/laws',
    items,
  })
}
