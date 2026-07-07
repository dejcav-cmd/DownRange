export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/studio/',
          '/admin/',
          '/admin-app/',
          '/admin-login/',
          '/api/',
          '/_next/',
        ],
        crawlDelay: 1,
      },
      {
        // Block AI scrapers from hammering the API
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web'],
        allow: '/',
        disallow: ['/api/'],
      },
      {
        userAgent: 'Bingbot',
        allow: '/',
        disallow: [
          '/studio/',
          '/admin/',
          '/admin-app/',
          '/admin-login/',
          '/api/',
          '/_next/',
        ],
        crawlDelay: 2,
      },
    ],
    sitemap: [
      'https://www.downrangeco.com/sitemap.xml',
      'https://www.downrangeco.com/news-sitemap.xml',
      'https://www.downrangeco.com/feed.xml',
      'https://www.downrangeco.com/feeds/news',
      'https://www.downrangeco.com/feeds/releases',
      'https://www.downrangeco.com/feeds/deals',
      'https://www.downrangeco.com/feeds/laws',
      'https://www.downrangeco.com/feeds/blog',
      'https://www.downrangeco.com/feeds/opml',
    ],
    host: 'https://www.downrangeco.com',
  }
}
