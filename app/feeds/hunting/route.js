export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const items = await sanity.fetch(
    `*[_type=="huntingContent" && defined(slug.current)]|order(publishedAt desc)[0...12]{title,slug,excerpt,body,category,publishedAt,imageUrl}`
  ).catch(() => [])

  return buildFeed({
    title:       'DownRange — Hunting & Outdoors',
    description: 'Hunting news, gear reviews, season updates, and outdoors content.',
    feedUrl:     'https://www.downrangeco.com/feeds/hunting',
    items: items.map(a => ({
      title:       a.title,
      url:         `https://www.downrangeco.com/hunting#${a.slug?.current || ''}`,
      description: a.excerpt || String(a.body || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 400),
      date:        a.publishedAt,
      category:    a.category || 'hunting',
      author:      'DownRange',
      image:       a.imageUrl,
    })),
  })
}
