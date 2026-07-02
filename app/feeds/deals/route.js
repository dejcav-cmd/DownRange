export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const items = await sanity.fetch(
    `*[_type=="deal"&&(active==true||status=="active")]|order(publishedAt desc, _createdAt desc)[0...50]{title,slug,description,price,msrp,brand,category,dealUrl,publishedAt,_createdAt,imageUrl}`
  ).catch(() => [])

  return buildFeed({
    title:       'DownRange — Gun Deals',
    description: 'Firearms, ammo, and gear deals from verified retailers.',
    feedUrl:     'https://www.downrangeco.com/feeds/deals',
    items: items.map(d => ({
      title:       `${d.title}${d.price ? ` — $${d.price}` : ''}`,
      url:         d.dealUrl || `https://www.downrangeco.com/deals`,
      description: d.description || '',
      date:        d.publishedAt || d._createdAt,
      category:    d.category || 'deals',
      author:      d.brand || 'DownRange',
      image:       d.imageUrl,
    })),
  })
}
