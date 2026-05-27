export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const articles = await sanity.fetch(
    `*[_type=="firearmRelease"&&approved==true]|order(publishedAt desc)[0...30]{title,slug,brand,model,category,caliber,msrp,summary,publishedAt,imageUrl,sourceUrl}`
  ).catch(() => [])

  let items = []
  items = articles.map(r => ({
      title:       `${r.brand} ${r.model || r.title}`,
      url:         `https://downrangeco.com/releases/${r.slug?.current}`,
      description: r.summary || `${r.brand} ${r.model}. ${r.caliber||''} ${r.category||''}. MSRP: $${r.msrp||'TBD'}`,
      date:        r.publishedAt,
      category:    r.category,
      author:      r.brand,
      image:       r.imageUrl,
    }))

  return buildFeed({
    title:       'DownRange — New Gun Releases',
    description: 'New firearm releases and product announcements from major manufacturers.',
    feedUrl:     'https://downrangeco.com/feeds/releases',
    items,
  })
}
