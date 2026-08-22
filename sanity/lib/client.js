import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   || 'production',
  apiVersion: '2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN, // needed for private dataset reads
})

export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   || 'production',
  apiVersion: '2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)
export const urlFor = (source) => builder.image(source)

/**
 * Resolve the best image URL from an article.
 * Priority: uploaded Sanity image > external imageUrl field.
 */
export function resolveImage(article) {
  if (article?.heroImage?.asset?.url) return article.heroImage.asset.url
  if (article?.imageUrl) return article.imageUrl
  return null
}

// ── ARTICLES ──────────────────────────────────────────────────────────────────

export async function fetchArticles(limit = 20, category = null) {
  const filter = category ? `&& category == "${category}"` : '&& category != "deals"'
  return client.fetch(`
    *[_type == "newsArticle" && approved == true && defined(slug.current) ${filter}] | order(publishedAt desc, _createdAt desc) [0...${limit}] {
      _id, title, slug, excerpt, summary, category, urgencyScore, publishedAt,
      author->{name, slug},
      heroImage { asset->{url}, alt },
      imageUrl, imageAlt,
      source, externalUrl, tags
    }
  `, {}, { next: { revalidate: 120 } })
}


// ── PAGINATED / SEARCH — for News page ──────────────────────────────────────
export async function fetchArticlesPaginated({ page = 1, perPage = 20, category = null, days = null, search = null } = {}) {
  const offset = (page - 1) * perPage
  let filters = `_type == "newsArticle" && approved == true && category != "deals" && defined(slug.current)`
  if (category) filters += ` && category == "${category}"`
  if (days) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    filters += ` && publishedAt >= "${since}"`
  }
  if (search) {
    const q = search.replace(/"/g, '').slice(0, 80)
    filters += ` && (title match "*${q}*" || summary match "*${q}*" || source match "*${q}*")`
  }
  const [articles, total] = await Promise.all([
    client.fetch(`*[${filters}] | order(publishedAt desc, _createdAt desc) [${offset}...${offset + perPage}] {
      _id, title, slug, excerpt, summary, category, urgencyScore, publishedAt,
      heroImage { asset->{url}, alt },
      imageUrl, imageAlt,
      source, externalUrl, tags
    }`),
    client.fetch(`count(*[${filters}])`),
  ])
  return { articles, total, pages: Math.ceil(total / perPage), page, perPage }
}

// Look up article by Sanity _id — used to redirect old broken URLs
export async function getArticleById(id) {
  return client.fetch(
    `*[_type == "newsArticle" && _id == $id][0] { _id, slug, title }`,
    { id }
  )
}

export async function getArticleBySlug(slug) {
  return client.fetch(`
    *[_type == "newsArticle" && slug.current == $slug][0] {
      _id, title, slug, excerpt, summary, body, category, urgencyScore, publishedAt,
      author->{name, slug, bio, photo{asset->{url}}},
      heroImage { asset->{url}, alt },
      imageUrl, imageAlt,
      source, externalUrl, tags, relatedStates
    }
  `, { slug })
}

export async function getRecentArticles(limit = 6) {
  return client.fetch(`
    *[_type == "newsArticle" && approved == true] | order(publishedAt desc, _createdAt desc) [0...${limit}] {
      _id, title, slug, category, urgencyScore, publishedAt,
      heroImage { asset->{url}, alt },
      imageUrl, imageAlt,
      source
    }
  `, {}, { next: { revalidate: 120 } })
}

// ── BREAKING ─────────────────────────────────────────────────────────────────

export async function fetchBreakingAlerts(limit = 10) {
  return client.fetch(`
    *[_type == "breakingAlert" && active == true] | order(publishedAt desc) [0...${limit}] {
      _id, headline, summary, publishedAt, url, urgencyScore
    }
  `)
}

// ── LEGISLATION ───────────────────────────────────────────────────────────────

export async function fetchLegislation(limit = 20, level = null) {
  const filter = level ? `&& level == "${level}"` : ''
  return client.fetch(`
    *[_type == "legislation" ${filter}] | order(lastActionDate desc) [0...${limit}] {
      _id, title, billNumber, status, level, state, summary, lastActionDate, url, impact
    }
  `)
}

// ── REVIEWS ───────────────────────────────────────────────────────────────────

export async function fetchReviews(limit = 12, category = null) {
  const filter = category ? `&& category == "${category}"` : '&& category != "deals"'
  return client.fetch(`
    *[_type == "review" ${filter}] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, score, verdict, category, publishedAt, featured,
      brand, model, caliber, msrp, testRounds,
      heroImage { asset->{url}, alt },
      "imageUrl": select(
        defined(imageUrl) && imageUrl != null => imageUrl,
        defined(heroImage.asset) => heroImage.asset->url,
        null
      ),
      author->{name}
    }
  `)
}

// ── RELEASES ──────────────────────────────────────────────────────────────────

export async function fetchReleases(limit = 200) {
  return client.fetch(`
    *[_type == "firearmRelease" && approved == true] | order(publishedAt desc) [0...${limit}] {
      _id, title, brand, model, caliber, action, category, msrp, publishedAt, isJustDropped,
      slug, heroImage { asset->{url}, alt },
      imageUrl,
      summary, pressReleaseExcerpt, specs, sourceUrl, availableDate
    }
  `)
}

// ── STATE HUB ─────────────────────────────────────────────────────────────────

export async function fetchStateProfile(abbr) {
  return client.fetch(`
    *[_type == "stateProfile" && abbr == $abbr][0] {
      _id, name, abbr, rating,
      constitutionalCarry, ccwPermit, redFlagLaw, magLimit, waitPeriod,
      awbStatus, suppressors, openCarry, bgcPrivate,
      reciprocityStates[], recentBills[], summary, lastUpdated,
      richContent, updatedAt
    }
  `, { abbr: abbr.toUpperCase() })
}

export async function fetchAllStateProfiles() {
  return client.fetch(`
    *[_type == "stateProfile"] | order(name asc) {
      _id, name, abbr, rating,
      constitutionalCarry, redFlagLaw, magLimit, awbStatus
    }
  `)
}

// ── AMMO PRICES ───────────────────────────────────────────────────────────────



// ── VIDEOS ────────────────────────────────────────────────────────────────────

export async function fetchVideos(limit = 10, category = null) {
  const filter = category ? `&& category == "${category}"` : ''
  // Use writeClient (no CDN) so newly-added videos appear immediately
  return writeClient.fetch(`
    *[_type == "video" && active != false ${filter}] | order(publishedAt desc, addedAt desc) [0...${limit}] {
      _id, title, youtubeId, videoId, channelName, thumbnail, category, publishedAt, addedAt, featured, duration
    }
  `)
}

// ── GLOBAL STATS ──────────────────────────────────────────────────────────────

export async function fetchGlobalStats() {
  return client.fetch(`*[_type == "globalStats"][0]`)
}


// ── SECTION SEARCH functions ─────────────────────────────────────────────────

export async function searchReviews(q, limit = 20) {
  const safe = `*${q.replace(/['"\\]/g,'').slice(0,80)}*`
  return client.fetch(
    `*[_type=="review" && (title match $q || brand match $q || model match $q || summary match $q || caliber match $q)]
     | score(boost(brand match $q,10), boost(model match $q,8), boost(title match $q,5), boost(summary match $q,1))
     | order(_score desc) [0...$lim] {
       _id, _score, "title": brand+" "+model, "slug": slug.current,
       summary, category, score, publishedAt, brand, model, caliber, msrp,
       "imageUrl": select(
         defined(imageUrl) && imageUrl != null => imageUrl,
         defined(heroImage.asset) => heroImage.asset->url,
         null
       )
     }`, { q: safe, lim: limit }
  ).catch(() => [])
}

export async function fetchBlogPosts(limit = 50, category = null) {
  const filter = category ? `&& category == "${category}"` : ''
  return client.fetch(
    `*[_type == "blogPost" && status == "published" ${filter}] | order(_createdAt desc) [0...$lim] {
       _id, title, slug, category, excerpt, body, imageUrl, author,
       status, publishedAt, readTime, _createdAt, tags
     }`, { lim: limit }
  ).catch(() => [])
}

export async function fetchBlogPostsPaginated({ page = 1, perPage = 12, category = null, search = null, sort = 'newest' }) {
  const offset = (page - 1) * perPage
  const catFilter = category ? `&& category == "${category}"` : ''

  let query, params
  if (search) {
    const safe = '*' + search.replace(/['"\\]/g,'').slice(0,80) + '*'
    query = `{
      "posts": *[_type == "blogPost" && (status == "published" || published == true) ${catFilter}
        && (title match $q || excerpt match $q || body match $q || tags[] match $q)]
        | order(featured desc, _createdAt desc) [$offset...$end] {
          _id, title, slug, category, excerpt, imageUrl, author,
          status, publishedAt, readTime, _createdAt, tags, featured
        },
      "total": count(*[_type == "blogPost" && (status == "published" || published == true) ${catFilter}
        && (title match $q || excerpt match $q || body match $q || tags[] match $q)])
    }`
    params = { q: safe, offset, end: offset + perPage }
  } else {
    const orderField = sort === 'oldest' ? '_createdAt asc' : '_createdAt desc'
    // Featured posts always sort first (page 1, position 0). Must stay consistent across
    // every page — mixing orderings between pages would duplicate/skip results under
    // offset-based pagination.
    const orderClause = `featured desc, ${orderField}`
    query = `{
      "posts": *[_type == "blogPost" && (status == "published" || published == true) ${catFilter}]
        | order(${orderClause}) [$offset...$end] {
          _id, title, slug, category, excerpt, imageUrl, author,
          status, publishedAt, readTime, _createdAt, tags, featured
        },
      "total": count(*[_type == "blogPost" && (status == "published" || published == true) ${catFilter}])
    }`
    params = { offset, end: offset + perPage }
  }
  const result = await client.fetch(query, params).catch(() => ({ posts: [], total: 0 }))
  return {
    posts:  result.posts || [],
    total:  result.total || 0,
    pages:  Math.max(1, Math.ceil((result.total || 0) / perPage)),
    page,
  }
}

// Get all blog post slugs for static generation (includes drafts so URLs don't 404)
export async function fetchAllBlogSlugs() {
  try {
    return await client.fetch(
      '*[_type == "blogPost" && defined(slug.current)] { "slug": slug.current }'
    )
  } catch {
    return []
  }
}

export async function fetchBlogPostBySlug(slug) {
  try {
    return await client.fetch(
      '*[_type == "blogPost" && slug.current == $s][0] { _id, title, "slug": slug.current, category, excerpt, body, imageUrl, author, authorRole, authorImg, published, publishedAt, readTime, tags, status, _createdAt }',
      { s: slug }
    )
  } catch { return null }
}

export async function searchBlogPosts(q, limit = 20) {
  const safe = `*${q.replace(/['"\\]/g,'').slice(0,80)}*`
  return client.fetch(
    `*[_type=="blogPost" && (title match $q || summary match $q || body match $q || tags[]match $q)]
     | score(boost(title match $q,10), boost(summary match $q,3), boost(body match $q,1))
     | order(_score desc) [0...$lim] {
       _id, _score, title, "slug": slug.current,
       summary, category, publishedAt, imageUrl
     }`, { q: safe, lim: limit }
  ).catch(() => [])
}

export async function searchReleases(q, limit = 20) {
  const safe = `*${q.replace(/['"\\]/g,'').slice(0,80)}*`
  return client.fetch(
    `*[_type=="firearmRelease" && (brand match $q || model match $q || caliber match $q || summary match $q)]
     | score(boost(brand match $q,10), boost(model match $q,8), boost(caliber match $q,5), boost(summary match $q,1))
     | order(_score desc, publishedAt desc) [0...$lim] {
       _id, _score, "title": brand+" "+model, "slug": slug.current,
       summary, category, publishedAt, imageUrl, brand, model, caliber, msrp, isJustDropped
     }`, { q: safe, lim: limit }
  ).catch(() => [])
}

export async function searchLegislation(q, limit = 30) {
  const safe = `*${q.replace(/['"\\]/g,'').slice(0,80)}*`
  return client.fetch(
    `*[_type=="legislation" && (title match $q || billNumber match $q || summary match $q || state match $q)]
     | score(boost(title match $q,10), boost(billNumber match $q,8), boost(state match $q,5), boost(summary match $q,1))
     | order(_score desc) [0...$lim] {
       _id, _score, title, billNumber, status, level, state, summary, lastActionDate, url, impact
     }`, { q: safe, lim: limit }
  ).catch(() => [])
}

// Aliases for pages that use these names
export async function getReviewBySlug(slug) {
  return client.fetch(`
    *[_type == "review" && slug.current == $slug][0] {
      _id, title, slug, score, verdict, category, publishedAt, featured,
      brand, model, caliber, msrp, testRounds,
      heroImage { asset->{url}, alt },
      imageUrl,
      pros[], cons[],
      specs[]{ label, value },
      body,
      author->{name, slug}
    }
  `, { slug })
}

export async function getStateProfile(abbr) {
  return fetchStateProfile(abbr)
}

export async function getRelatedArticles(category, excludeSlug, limit = 6) {
  return client.fetch(`
    *[_type=="newsArticle"&&approved==true&&category==$cat&&slug.current!=$slug]|order(publishedAt desc)[0...$limit]{
      _id, title, slug, category, urgencyScore, publishedAt,
      heroImage{asset->{url},alt}, imageUrl, source
    }
  `, { cat: category, slug: excludeSlug, limit })
}

export async function fetchAmmoByType(caliber) {

}
