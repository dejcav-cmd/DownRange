import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    true,
})

const BASE = 'https://downrangeco.com'

const US_STATES = [
  'alabama','alaska','arizona','arkansas','california','colorado','connecticut',
  'delaware','florida','georgia','hawaii','idaho','illinois','indiana','iowa',
  'kansas','kentucky','louisiana','maine','maryland','massachusetts','michigan',
  'minnesota','mississippi','missouri','montana','nebraska','nevada',
  'new-hampshire','new-jersey','new-mexico','new-york','north-carolina',
  'north-dakota','ohio','oklahoma','oregon','pennsylvania','rhode-island',
  'south-carolina','south-dakota','tennessee','texas','utah','vermont',
  'virginia','washington','west-virginia','wisconsin','wyoming'
]

const NOW = new Date()
const STATIC_PAGES = [
  { url: BASE,               priority: 1.0,  changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/news`,     priority: 0.9,  changeFrequency: 'hourly',  lastModified: NOW },
  { url: `${BASE}/video`,    priority: 0.85, changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/laws`,     priority: 0.85, changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/deals`,    priority: 0.85, changeFrequency: 'hourly',  lastModified: NOW },
  { url: `${BASE}/releases`, priority: 0.85, changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/reviews`,  priority: 0.8,  changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/blog`,     priority: 0.8,  changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/market`,   priority: 0.75, changeFrequency: 'hourly',  lastModified: NOW },
  { url: `${BASE}/giveaways`,priority: 0.75, changeFrequency: 'daily',   lastModified: NOW },
  { url: `${BASE}/about`,    priority: 0.6,  changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/press`,    priority: 0.6,  changeFrequency: 'monthly', lastModified: NOW },
  { url: `${BASE}/ccw`,      priority: 0.85, changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/state-hub`,priority: 0.85, changeFrequency: 'weekly',  lastModified: NOW },
  { url: `${BASE}/search`,   priority: 0.5,  changeFrequency: 'weekly',  lastModified: NOW },
]

export default async function sitemap() {
  try {
    // Fetch all published article slugs
    const [articles, blogPosts] = await Promise.all([
      sanity.fetch(
        `*[_type == "newsArticle" && approved == true && defined(slug.current)]
         | order(publishedAt desc) [0...2000] { slug, publishedAt, _updatedAt }`
      ).catch(() => []),
      sanity.fetch(
        `*[_type == "blogPost" && status == "published" && defined(slug.current)]
         | order(publishedAt desc) [0...500] { slug, publishedAt }`
      ).catch(() => []),
    ])

    const articleUrls = articles.map(a => ({
      url:             `${BASE}/news/${a.slug.current}`,
      lastModified:    a._updatedAt ? new Date(a._updatedAt) : (a.publishedAt ? new Date(a.publishedAt) : new Date()),
      priority:        0.7,
      changeFrequency: 'weekly',
    }))

    const blogUrls = blogPosts.map(p => ({
      url:             `${BASE}/blog/${p.slug.current}`,
      lastModified:    p.publishedAt ? new Date(p.publishedAt) : new Date(),
      priority:        0.65,
      changeFrequency: 'monthly',
    }))

    const stateUrls = US_STATES.map(state => ({
      url: `${BASE}/state-hub/${state.toUpperCase()}`, priority: 0.75, changeFrequency: 'weekly',
    }))

    const [releases] = await Promise.all([
      sanity.fetch(
        `*[_type == "firearmRelease" && defined(slug.current)]
         | order(publishedAt desc) [0...500] { slug, publishedAt, _updatedAt }`
      ).catch(() => []),
    ])

    const releaseUrls = releases.map(r => ({
      url:             `${BASE}/releases/${r.slug.current}`,
      lastModified:    r._updatedAt ? new Date(r._updatedAt) : (r.publishedAt ? new Date(r.publishedAt) : new Date()),
      priority:        0.75,
      changeFrequency: 'weekly',
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
