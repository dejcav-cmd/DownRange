import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET   || 'production',
  apiVersion: '2024-01-01',
  useCdn:    true,
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
    *[_type == "newsArticle" && approved == true ${filter}] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, excerpt, summary, category, urgencyScore, publishedAt,
      author->{name, slug},
      heroImage { asset->{url}, alt },
      imageUrl, imageAlt,
      source, externalUrl, tags
    }
  `)
}


// ── PAGINATED / SEARCH — for News page ──────────────────────────────────────
export async function fetchArticlesPaginated({ page = 1, perPage = 20, category = null, days = null, search = null } = {}) {
  const offset = (page - 1) * perPage
  let filters = `_type == "newsArticle" && approved == true && category != "deals"`
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
    client.fetch(`*[${filters}] | order(publishedAt desc) [${offset}...${offset + perPage}] {
      _id, title, slug, excerpt, summary, category, urgencyScore, publishedAt,
      heroImage { asset->{url}, alt },
      imageUrl, imageAlt,
      source, externalUrl, tags
    }`),
    client.fetch(`count(*[${filters}])`),
  ])
  return { articles, total, pages: Math.ceil(total / perPage), page, perPage }
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
    *[_type == "newsArticle" && approved == true] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, category, urgencyScore, publishedAt,
      heroImage { asset->{url}, alt },
      imageUrl, imageAlt,
      source
    }
  `)
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
      brand, model, caliber, msrp,
      heroImage { asset->{url}, alt },
      imageUrl,
      author->{name}
    }
  `)
}

// ── RELEASES ──────────────────────────────────────────────────────────────────

export async function fetchReleases(limit = 20) {
  return client.fetch(`
    *[_type == "firearmRelease"] | order(publishedAt desc) [0...${limit}] {
      _id, title, brand, model, caliber, action, category, msrp, publishedAt, isJustDropped,
      heroImage { asset->{url}, alt },
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
      reciprocityStates[], recentBills[], summary, lastUpdated
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

export async function fetchAmmoPrices() {
  return client.fetch(`
    *[_type == "ammoPrice"] | order(caliber asc) {
      _id, caliber, pricePerRound, price30DayAvg, trendDir, trendPct,
      bestVendor, bestPrice, inStock, recordedAt
    }
  `)
}

// ── VIDEOS ────────────────────────────────────────────────────────────────────

export async function fetchVideos(limit = 10, category = null) {
  const filter = category ? `&& category == "${category}"` : '&& category != "deals"'
  return client.fetch(`
    *[_type == "video" ${filter}] | order(publishedAt desc) [0...${limit}] {
      _id, title, youtubeId, channelName, thumbnail, category, publishedAt, featured, duration
    }
  `)
}

// ── GLOBAL STATS ──────────────────────────────────────────────────────────────

export async function fetchGlobalStats() {
  return client.fetch(`*[_type == "globalStats"][0]`)
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
  return client.fetch(`*[_type=="ammoPrice"&&caliber==$cal]|order(updatedAt desc)[0...10]`, { cal: caliber })
}
