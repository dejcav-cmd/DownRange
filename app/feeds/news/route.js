export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const articles = await sanity.fetch(
    `*[_type=="newsArticle"&&approved==true]|order(publishedAt desc)[0...50]{title,slug,summary,excerpt,category,publishedAt,imageUrl,source}`
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
    title:       'DownRange — Firearms News',
    description: 'Live 2A and firearms news — ATF actions, legislation, industry, breaking stories.',
    feedUrl:     'https://www.downrangeco.com/feeds/news',
    items,
  })
}
