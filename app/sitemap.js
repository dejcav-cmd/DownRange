import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    true,
})

const BASE = 'https://downrangeco.com'

// 2-letter state codes — matches /state-hub/[state] route params
const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]

const NOW = new Date()

const STATIC_PAGES = [
  // Core — highest traffic
  { url: BASE,                          priority: 1.0,  changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/news`,                priority: 0.9,  changeFrequency: 'hourly',  lastModified: NOW },
  { url: `${BASE}/laws`,                priority: 0.9,  changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/laws/federal`,        priority: 0.85, changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/laws/states`,         priority: 0.85, changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/laws/my-state`,       priority: 0.85, changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/deals`,               priority: 0.9,  changeFrequency: 'hourly',  lastModified: NOW },
  { url: `${BASE}/releases`,            priority: 0.85, changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/market`,              priority: 0.85, changeFrequency: 'hourly',  lastModified: NOW },
  { url: `${BASE}/reviews`,             priority: 0.85, changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/video`,               priority: 0.8,  changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/blog`,                priority: 0.8,  changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/giveaways`,           priority: 0.75, changeFrequency: 'daily',   lastModified: NOW },

  // CCW / Carry tools — high-intent search queries
  { url: `${BASE}/carry-insurance`,     priority: 0.85, changeFrequency: 'monthly', lastModified: NOW },

  // Tools — commercial intent
  { url: `${BASE}/ballistics`,          priority: 0.85, changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/ranges`,              priority: 0.85, changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/nfa-tracker`,         priority: 0.8,  changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/value-estimator`,     priority: 0.8,  changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/ffl-finder`,          priority: 0.8,  changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/safe-storage`,        priority: 0.75, changeFrequency: 'monthly', lastModified: NOW },

  // Learning / Content — informational queries
  { url: `${BASE}/learn`,               priority: 0.8,  changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/hunting`,             priority: 0.75, changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/precision`,           priority: 0.75, changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/training`,            priority: 0.75, changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/preparedness`,        priority: 0.7,  changeFrequency: 'monthly', lastModified: NOW },

  // International
  { url: `${BASE}/canada`,              priority: 0.7,  changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/brazil`,              priority: 0.7,  changeFrequency: 'daily',   lastModified: NOW },

  // Site info
  { url: `${BASE}/about`,               priority: 0.6,  changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/press`,               priority: 0.6,  changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/contact`,             priority: 0.5,  changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/contribute`,          priority: 0.5,  changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/privacy`,             priority: 0.3,  changeFrequency: 'yearly',  lastModified: NOW },
  { url: `${BASE}/terms`,               priority: 0.3,  changeFrequency: 'yearly',  lastModified: NOW },
]

export default async function sitemap() {
  try {
    const [articles, blogPosts, releases] = await Promise.all([
      sanity.fetch(
        `*[_type == "newsArticle" && approved == true && defined(slug.current)]
         | order(publishedAt desc) [0...2000] { slug, publishedAt, _updatedAt }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "blogPost" && status == "published" && defined(slug.current)]
         | order(publishedAt desc) [0...500] { slug, publishedAt }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "firearmRelease" && defined(slug.current)]
         | order(publishedAt desc) [0...500] { slug, publishedAt, _updatedAt }`
      ).catch(() => []),
    ])

    const articleUrls = articles.map(a => ({
      url:             `${BASE}/news/${a.slug.current}`,
      lastModified:    a._updatedAt ? new Date(a._updatedAt) : (a.publishedAt ? new Date(a.publishedAt) : NOW),
      priority:        0.7,
      changeFrequency: 'weekly',
    }))

    const blogUrls = blogPosts.map(p => ({
      url:             `${BASE}/blog/${p.slug.current}`,
      lastModified:    p.publishedAt ? new Date(p.publishedAt) : NOW,
      priority:        0.65,
      changeFrequency: 'monthly',
    }))

    const releaseUrls = releases.map(r => ({
      url:             `${BASE}/releases/${r.slug.current}`,
      lastModified:    r._updatedAt ? new Date(r._updatedAt) : (r.publishedAt ? new Date(r.publishedAt) : NOW),
      priority:        0.75,
      changeFrequency: 'weekly',
    }))

    // Individual state law pages — canonical destination for all state traffic
    const stateUrls = US_STATE_CODES.map(code => ({
      url:             `${BASE}/laws/${code}`,
      priority:        0.75,
      changeFrequency: 'weekly',
      lastModified:    NOW,
    }))

    return [
      ...STATIC_PAGES,
      ...stateUrls,
      ...articleUrls,
      ...blogUrls,
      ...releaseUrls,
    ]
  } catch (e) {
    console.error('[SITEMAP] Error:', e.message)
    return STATIC_PAGES
  }
}
