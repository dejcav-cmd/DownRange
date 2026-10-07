import { createClient } from '@sanity/client'
import { GUN_MODELS } from '../lib/gunData'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
})

const BASE = 'https://www.downrangeco.com'

// Rebuild at most hourly so new articles appear without a deploy (the sitemap cron
// also calls revalidatePath('/sitemap.xml')).
export const revalidate = 3600

// 2-letter state codes — matches /laws/[state] route params
const US_STATE_CODES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA',
  'HI','ID','IL','IN','IA','KS','KY','LA','ME','MD',
  'MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC',
  'SD','TN','TX','UT','VT','VA','WA','WV','WI','WY',
]


const STATIC_PAGES = [
  // Core — highest traffic
  { url: BASE,                          priority: 1.0,  changeFrequency: 'daily' },
  { url: `${BASE}/news`,                priority: 0.9,  changeFrequency: 'hourly' },
  { url: `${BASE}/news/manufacturer-press-releases`, priority: 0.8, changeFrequency: 'daily' },
  { url: `${BASE}/laws`,                priority: 0.9,  changeFrequency: 'daily' },
  { url: `${BASE}/laws/federal`,        priority: 0.85, changeFrequency: 'weekly' },
  { url: `${BASE}/laws/states`,         priority: 0.85, changeFrequency: 'weekly' },
  { url: `${BASE}/laws/my-state`,       priority: 0.85, changeFrequency: 'weekly' },
  { url: `${BASE}/deals`,               priority: 0.9,  changeFrequency: 'hourly' },
  { url: `${BASE}/releases`,            priority: 0.85, changeFrequency: 'daily' },
  { url: `${BASE}/video`,               priority: 0.8,  changeFrequency: 'daily' },
  { url: `${BASE}/blog`,                priority: 0.8,  changeFrequency: 'daily' },
  { url: `${BASE}/giveaways`,           priority: 0.75, changeFrequency: 'daily' },

  // CCW / Carry tools — high-intent search queries
  { url: `${BASE}/carry-insurance`,     priority: 0.85, changeFrequency: 'monthly' },

  // Tools — commercial intent
  { url: `${BASE}/ballistics`,          priority: 0.85, changeFrequency: 'monthly' },
  { url: `${BASE}/ranges`,              priority: 0.85, changeFrequency: 'weekly' },
  { url: `${BASE}/nfa-tracker`,         priority: 0.8,  changeFrequency: 'weekly' },
  { url: `${BASE}/ffl-finder`,          priority: 0.8,  changeFrequency: 'weekly' },
  { url: `${BASE}/safe-storage`,        priority: 0.75, changeFrequency: 'monthly' },

  // Learning / Content — informational queries
  { url: `${BASE}/learn`,               priority: 0.8,  changeFrequency: 'weekly' },
  { url: `${BASE}/hunting`,             priority: 0.75, changeFrequency: 'monthly' },
  { url: `${BASE}/precision`,           priority: 0.75, changeFrequency: 'monthly' },
  { url: `${BASE}/training`,            priority: 0.75, changeFrequency: 'monthly' },

  // International
  { url: `${BASE}/canada`,              priority: 0.7,  changeFrequency: 'daily' },
  { url: `${BASE}/brazil`,              priority: 0.7,  changeFrequency: 'daily' },

  // Site info
  { url: `${BASE}/about`,               priority: 0.6,  changeFrequency: 'monthly' },
  { url: `${BASE}/press`,               priority: 0.6,  changeFrequency: 'monthly' },
  { url: `${BASE}/contact`,             priority: 0.5,  changeFrequency: 'monthly' },
  { url: `${BASE}/contribute`,          priority: 0.5,  changeFrequency: 'monthly' },
  { url: `${BASE}/privacy`,             priority: 0.3,  changeFrequency: 'yearly' },
  { url: `${BASE}/terms`,               priority: 0.3,  changeFrequency: 'yearly' },
  { url: `${BASE}/dmca`,                priority: 0.3,  changeFrequency: 'yearly' },
  { url: `${BASE}/cookies`,             priority: 0.3,  changeFrequency: 'yearly' },

  // Market intelligence (missing from prior sitemap)
]

// RSS / Atom feeds — helps Google discover and crawl them

export default async function sitemap() {
  try {
    const [articles, blogPosts, releases, stateProfiles, canada, brazil, pressReleases] = await Promise.all([
      // No cap: the old [0...2000] silently dropped ~470 older articles
      sanity.fetch(
        `*[_type == "newsArticle" && approved == true && defined(slug.current)]
         | order(publishedAt desc) [0...20000] { slug, publishedAt }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "blogPost" && status == "published" && defined(slug.current)]
         | order(publishedAt desc) [0...2000] { slug, publishedAt }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "firearmRelease" && defined(slug.current)]
         | order(publishedAt desc) [0...2000] { slug, publishedAt }`
      ).catch(() => []),
      sanity.fetch(`*[_type == "stateProfile" && defined(abbr)]{ abbr, _updatedAt }`).catch(() => []),
      // Same filters the article pages use, so every URL resolves
      sanity.fetch(
        `*[_type == "canadaContent" && type == "article" && active == true && defined(slug.current)]
         | order(publishedAt desc) { slug, publishedAt, _createdAt }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "brazilContent" && type == "artigo" && active == true && defined(slug.current)]
         | order(publishedAt desc) { slug, publishedAt, _createdAt }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "pressRelease" && approved == true && defined(slug.current)]
         | order(publishedAt desc) [0...5000] { slug, publishedAt }`
      ).catch(() => []),
    ])

    // lastmod must be a real content date. It used to be NOW (every static/state/gun page
    // "changed" on every read) or _updatedAt (bumped by image-fix/rewrite crons), which
    // teaches Google to ignore lastmod for the whole sitemap.
    const d = v => (v ? new Date(v) : undefined)
    const latestNews = articles[0]?.publishedAt

    const articleUrls = articles.map(a => ({
      url:             `${BASE}/news/${a.slug.current}`,
      lastModified:    d(a.publishedAt),
      priority:        0.7,
      changeFrequency: 'weekly',
    }))

    const pressUrls = pressReleases.map(p => ({
      url:             `${BASE}/news/manufacturer-press-releases/${p.slug.current}`,
      lastModified:    d(p.publishedAt),
      priority:        0.6,
      changeFrequency: 'monthly',
    }))

    const blogUrls = blogPosts.map(p => ({
      url:             `${BASE}/blog/${p.slug.current}`,
      lastModified:    d(p.publishedAt),
      priority:        0.65,
      changeFrequency: 'monthly',
    }))

    const releaseUrls = releases.map(r => ({
      url:             `${BASE}/releases/${r.slug.current}`,
      lastModified:    d(r.publishedAt),
      priority:        0.75,
      changeFrequency: 'weekly',
    }))

    // Individual state law pages — canonical destination for all state traffic
    const profileDate = Object.fromEntries(stateProfiles.map(p => [p.abbr, p._updatedAt]))
    const stateUrls = US_STATE_CODES.map(code => ({
      url:             `${BASE}/laws/${code}`,
      priority:        0.75,
      changeFrequency: 'weekly',
      lastModified:    d(profileDate[code]),
    }))

    // State news — linked from every /laws/[state] page; lowercase matches page canonical
    const stateNewsUrls = [
      { url: `${BASE}/state-news`, priority: 0.6, changeFrequency: 'daily', lastModified: d(latestNews) },
      ...US_STATE_CODES.map(code => ({
        url: `${BASE}/state-news/${code.toLowerCase()}`,
        priority: 0.6, changeFrequency: 'daily',
      })),
    ]

    // Firearm encyclopedia — ranked in Google without ever being in the sitemap
    const gunUrls = [
      { url: `${BASE}/guns`, priority: 0.7, changeFrequency: 'monthly' },
      ...GUN_MODELS.map(m => ({ url: `${BASE}/guns/${m}`, priority: 0.6, changeFrequency: 'monthly' })),
    ]

    const intlUrls = [
      ...canada.map(c => ({ url: `${BASE}/canada/${c.slug.current}`, priority: 0.6, changeFrequency: 'monthly', lastModified: d(c.publishedAt || c._createdAt) })),
      ...brazil.map(b => ({ url: `${BASE}/brazil/${b.slug.current}`, priority: 0.6, changeFrequency: 'monthly', lastModified: d(b.publishedAt || b._createdAt) })),
    ]

    // /news reflects the newest article; other static pages carry no lastmod rather than a fake one
    const staticPages = STATIC_PAGES.map(p => p.url === `${BASE}/news` && latestNews ? { ...p, lastModified: d(latestNews) } : p)

    return [
      ...staticPages,
      ...stateUrls,
      ...gunUrls,
      ...stateNewsUrls,
      ...articleUrls,
      ...pressUrls,
      ...blogUrls,
      ...releaseUrls,
      ...intlUrls,
    ]
  } catch (e) {
    console.error('[SITEMAP] Error:', e.message)
    return STATIC_PAGES
  }
}
