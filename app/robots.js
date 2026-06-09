export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/studio/', '/admin/', '/api/', '/_next/'],
      },
      {
        // Block AI scrapers from hammering the API
        userAgent: ['GPTBot', 'ChatGPT-User', 'CCBot', 'anthropic-ai', 'Claude-Web'],
        allow: '/',
        disallow: ['/api/'],
      },
    ],
    sitemap: [
      'https://downrangeco.com/sitemap.xml',
      'https://downrangeco.com/news-sitemap.xml',
    ],
    host: 'https://downrangeco.com',
  }
}
