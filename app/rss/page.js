import RSSPageClient from './PageClient'

export const metadata = {
  title:       'RSS Feeds — DownRange',
  description: 'Subscribe to DownRange feeds in your RSS reader. Firearms news, legislation, new releases, reviews, competitions, Canada, and more.',
  alternates: {
    types: {
      'application/rss+xml': [
        { url: 'https://downrangeco.com/feed.xml', title: 'DownRange — All Content' },
        { url: 'https://downrangeco.com/feeds/news', title: 'DownRange — News' },
        { url: 'https://downrangeco.com/feeds/laws', title: 'DownRange — Laws & Legislation' },
        { url: 'https://downrangeco.com/feeds/blog', title: 'DownRange — Blog' },
        { url: 'https://downrangeco.com/feeds/releases', title: 'DownRange — New Releases' },
        { url: 'https://downrangeco.com/feeds/competitions', title: 'DownRange — Competitions' },
        { url: 'https://downrangeco.com/feeds/canada', title: 'DownRange — Canada' },
        { url: 'https://downrangeco.com/feeds/reviews', title: 'DownRange — Reviews' },
      ]
    }
  }
}

export default function RSSPage() {
  return <RSSPageClient />
}
