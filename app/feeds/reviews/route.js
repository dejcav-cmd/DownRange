export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const articles = await sanity.fetch(
    `*[_type=="review"]|order(publishedAt desc)[0...30]{title,slug,excerpt,category,publishedAt,imageUrl,author}`
  ).catch(() => [])

  let items = []
  items = articles.map(a => ({
      title:       a.title,
      url:         `https://downrangeco.com/reviews/${a.slug?.current}`,
      description: a.excerpt || '',
      date:        a.publishedAt,
      category:    a.category,
      author:      a.author || 'DownRange',
      image:       a.imageUrl,
    }))

  return buildFeed({
    title:       'DownRange — Gun Reviews',
    description: 'Firearm and gear reviews from DownRange.',
    feedUrl:     'https://downrangeco.com/feeds/reviews',
    items,
  })
}
