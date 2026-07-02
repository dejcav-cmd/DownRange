export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const items = await sanity.fetch(
    `*[_type=="giveaway"&&active==true]|order(_createdAt desc)[0...50]{title,entryUrl,prize,sponsor,category,endDate,_createdAt}`
  ).catch(() => [])

  return buildFeed({
    title:       'DownRange — Gun Giveaways',
    description: 'Active firearm and gear giveaways from top manufacturers, retailers, and 2A organizations.',
    feedUrl:     'https://www.downrangeco.com/feeds/giveaways',
    items: items.map(g => ({
      title:       g.title,
      url:         g.entryUrl || 'https://www.downrangeco.com/giveaways',
      description: `${g.prize || g.title}${g.sponsor ? ` — sponsored by ${g.sponsor}` : ''}${g.endDate ? ` · Ends ${g.endDate}` : ''}`,
      date:        g._createdAt,
      category:    g.category || 'giveaway',
      author:      g.sponsor || 'DownRange',
    })),
  })
}
