import RSSPageClient from './PageClient'

export const metadata = {
  title:       'RSS Feeds — DownRange',
  description: 'Subscribe to DownRange RSS feeds — firearms news, legislation, new releases, giveaways, deals, videos, hunting, competitions, Canada, and more. 12 feeds updated continuously.',
  alternates: {
    types: {
      'application/rss+xml': [
        { url: 'https://www.downrangeco.com/feed.xml',             title: 'DownRange — All Content' },
        { url: 'https://www.downrangeco.com/feeds/news',           title: 'DownRange — Firearms News' },
        { url: 'https://www.downrangeco.com/feeds/laws',           title: 'DownRange — Laws & Legislation' },
        { url: 'https://www.downrangeco.com/feeds/releases',       title: 'DownRange — New Releases' },
        { url: 'https://www.downrangeco.com/feeds/blog',           title: 'DownRange — Blog & Analysis' },
        { url: 'https://www.downrangeco.com/feeds/reviews',        title: 'DownRange — Gun Reviews' },
        { url: 'https://www.downrangeco.com/feeds/giveaways',      title: 'DownRange — Gun Giveaways' },
        { url: 'https://www.downrangeco.com/feeds/hunting',        title: 'DownRange — Hunting & Outdoors' },
        { url: 'https://www.downrangeco.com/feeds/deals',          title: 'DownRange — Gun Deals' },
        { url: 'https://www.downrangeco.com/feeds/video',          title: 'DownRange — Firearms Videos' },
        { url: 'https://www.downrangeco.com/feeds/competitions',   title: 'DownRange — Competitions' },
        { url: 'https://www.downrangeco.com/feeds/canada',         title: 'DownRange — Canada' },
      ]
    }
  }
}

export default function RSSPage() {
  return <RSSPageClient />
}
