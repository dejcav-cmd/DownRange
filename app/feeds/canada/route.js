export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const articles = await sanity.fetch(
    `*[_type=="newsArticle"&&approved==true&&(category=="canada"||lower(title) match "*canad*"||lower(summary) match "*canad*")]|order(publishedAt desc)[0...30]{title,slug,summary,excerpt,category,publishedAt,imageUrl,source}`
  ).catch(() => [])

  let items = []
  items = articles.map(a => ({
      title:       a.title,
      url:         `https://www.downrangeco.com/news/${a.slug?.current}`,
      description: a.summary || a.excerpt || '',
      date:        a.publishedAt,
      category:    'canada',
      author:      a.source || 'DownRange',
      image:       a.imageUrl,
    }))

  return buildFeed({
    title:       'DownRange — Canadian Firearms News',
    description: 'Canadian firearms law, PAL news, C-21 updates, OIC ban, and 2A advocacy in Canada.',
    feedUrl:     'https://www.downrangeco.com/feeds/canada',
    items,
  })
}
