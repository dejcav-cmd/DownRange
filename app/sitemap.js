import { client } from '../sanity/lib/client'

const BASE = 'https://downrangeco.com'

function url(path, freq = 'weekly', priority = 0.7, lastMod = new Date()) {
  return { url: BASE + path, lastModified: lastMod, changeFrequency: freq, priority }
}

export default async function sitemap() {
  const [articles, reviews, states, releases] = await Promise.all([
    client.fetch(`*[_type=="newsArticle"&&approved==true]{slug,publishedAt,_updatedAt}`).catch(()=>[]),
    client.fetch(`*[_type=="review"]{slug,_updatedAt}`).catch(()=>[]),
    client.fetch(`*[_type=="stateProfile"]{abbr,_updatedAt}`).catch(()=>[]),
    client.fetch(`*[_type=="firearmRelease"&&defined(slug)]{slug,_updatedAt}`).catch(()=>[]),
  ])

  // Blog posts (static)
  const BLOG_SLUGS = [
    'suppressor-revolution-2026',
    'micro-compact-pistol-market-2026',
    'gun-prices-tariffs-2026',
    'bruen-standard-state-battles-2026',
    'red-dot-carry-guide-2026',
  ]

  // Learn center articles (static)
  const LEARN_SLUGS = [
    'buying-your-first-gun',
    'how-to-get-ccw-license',
    'firearms-safety-four-rules',
    'home-defense-basics',
    'dry-fire-training-beginners',
    'understanding-gun-laws',
    'how-to-clean-your-gun',
    'ar-15-buyers-guide',
    'concealed-carry-holsters',
    'ammunition-guide-beginners',
    'gun-safe-storage-guide',
    'suppressor-buyers-guide',
  ]

  // State hub paths
  const STATE_ABBRS = ['al','ak','az','ar','ca','co','ct','de','fl','ga','hi','id','il','in','ia','ks','ky','la','me','md','ma','mi','mn','ms','mo','mt','ne','nv','nh','nj','nm','ny','nc','nd','oh','ok','or','pa','ri','sc','sd','tn','tx','ut','vt','va','wa','wv','wi','wy']

  // Ammo caliber pages
  const AMMO_CALIBERS = ['9mm','556','308','45-acp','22lr','762x39','6-5-creedmoor','12-gauge','40-sw','357-mag']

  return [
    // Core pages — high priority
    url('',           'hourly',  1.0),
    url('/news',      'hourly',  0.95),
    url('/laws',      'daily',   0.9),
    url('/market',    'daily',   0.9),
    url('/deals',     'hourly',  0.85),
    url('/blog',      'weekly',  0.85),
    url('/learn',     'weekly',  0.85),
    url('/reviews',   'weekly',  0.8),
    url('/guns',      'weekly',  0.8),
    url('/releases',  'daily',   0.8),
    url('/video',     'daily',   0.75),
    url('/state-hub', 'weekly',  0.8),
    url('/ranges',    'weekly',  0.75),
    url('/search',    'monthly', 0.6),
    url('/ffl-finder','weekly',  0.7),
    url('/nfa-tracker','weekly', 0.75),
    url('/training',  'monthly', 0.65),
    url('/hunting',   'monthly', 0.65),
    url('/precision', 'monthly', 0.6),
    url('/compare/glock-19-vs-sig-p320', 'monthly', 0.65),
    url('/value-estimator', 'monthly', 0.6),
    url('/carry-insurance', 'monthly', 0.65),
    url('/safe-storage',    'monthly', 0.65),
    url('/preparedness',    'monthly', 0.6),
    url('/canada',    'weekly',  0.65),
    url('/about',     'monthly', 0.5),
    url('/contact',   'monthly', 0.4),
    url('/privacy',   'yearly',  0.3),
    url('/terms',     'yearly',  0.3),

    // Blog posts
    ...BLOG_SLUGS.map(s => url(`/blog/${s}`, 'monthly', 0.8)),

    // Learn center
    ...LEARN_SLUGS.map(s => url(`/learn/${s}`, 'monthly', 0.75)),

    // Ammo caliber pages
    ...AMMO_CALIBERS.map(c => url(`/ammo/${c}`, 'weekly', 0.7)),

    // State hub
    ...STATE_ABBRS.map(s => url(`/state-hub/${s}`, 'weekly', 0.7)),

    // State news
    ...['ca','tx','fl','ny','il','wa','co','az','ga','pa'].map(s => url(`/state-news/${s}`, 'daily', 0.65)),

    // Dynamic articles
    ...articles.map(a => ({
      url: `${BASE}/news/${a.slug?.current}`,
      lastModified: new Date(a._updatedAt || a.publishedAt || Date.now()),
      changeFrequency: 'weekly',
      priority: 0.7,
    })),

    // Reviews
    ...reviews.map(r => ({
      url: `${BASE}/reviews/${r.slug?.current}`,
      lastModified: new Date(r._updatedAt || Date.now()),
      changeFrequency: 'monthly',
      priority: 0.65,
    })),

    // Gun model pages
    ...releases.filter(r => r.slug?.current).map(r => ({
      url: `${BASE}/guns/${r.slug.current}`,
      lastModified: new Date(r._updatedAt || Date.now()),
      changeFrequency: 'monthly',
      priority: 0.6,
    })),
  ]
}
