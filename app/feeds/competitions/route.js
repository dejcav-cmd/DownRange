export const dynamic = 'force-dynamic'
import { buildFeed, sanity } from '@/lib/feedHelper'

export async function GET() {
  const articles = await sanity.fetch(
    `*[_type=="competition"&&approved==true]|order(startDate asc)[0...50]{name,slug,org,discipline,matchType,startDate,endDate,city,state,entryFee,registrationUrl,description}`
  ).catch(() => [])

  let items = []
  items = articles.map(m => ({
      title:       `${m.name} — ${m.org}`,
      url:         m.registrationUrl || `https://downrangeco.com/competitions`,
      description: `${m.discipline} · ${m.city}, ${m.state} · ${m.startDate}${m.entryFee ? ' · $'+m.entryFee : ''}. ${m.description||''}`,
      date:        m.startDate,
      category:    m.discipline,
      author:      m.org,
      image:       null,
    }))

  return buildFeed({
    title:       'DownRange — Shooting Competitions',
    description: 'NRA, USPSA, IDPA, PRS, NRL22, Steel Challenge and more — competition calendar.',
    feedUrl:     'https://downrangeco.com/feeds/competitions',
    items,
  })
}
