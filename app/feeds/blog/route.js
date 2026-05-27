export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const articles = await sanity.fetch(
    `*[_type=="blogPost"&&status=="published"]|order(publishedAt desc)[0...30]{title,slug,excerpt,category,publishedAt,imageUrl,author}`
  ).catch(() => [])

  let items = []
  items = articles.map(a => ({
      title:       a.title,
      url:         `https://downrangeco.com/blog/${a.slug?.current}`,
      description: a.excerpt || '',
      date:        a.publishedAt,
      category:    a.category,
      author:      a.author || 'DJ Cavalcanti',
      image:       a.imageUrl,
    }))

  return buildFeed({
    title:       'DownRange — Blog',
    description: 'In-depth firearms articles, guides, and analysis from DJ Cavalcanti.',
    feedUrl:     'https://downrangeco.com/feeds/blog',
    items,
  })
}
