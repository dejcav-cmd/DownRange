export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const items = await sanity.fetch(
    `*[_type=="gunDeal"&&approved==true]|order(publishedAt desc, _createdAt desc)[0...50]{title,summary,price,store,category,externalUrl,publishedAt,_createdAt,imageUrl,source,tags}`
  ).catch(() => [])

  return buildFeed({
    title:       'DownRange — Gun Deals',
    description: 'Firearms, ammo, and gear deals from verified retailers — checked against your state.',
    feedUrl:     'https://www.downrangeco.com/feeds/deals',
    items: items.map(d => ({
      title:       `${d.title}${d.price ? ` — ${d.price}` : ''}`,
      url:         d.externalUrl || 'https://www.downrangeco.com/deals',
      description: d.summary || `${d.store || 'Deal'} · ${d.category || 'firearms'}`,
      date:        d.publishedAt || d._createdAt,
      category:    d.category || 'deals',
      author:      d.store || d.source || 'DownRange',
      image:       d.imageUrl,
    })),
  })
}
