import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your_project_id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
  token: process.env.SANITY_API_TOKEN,
})

export const writeClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'your_project_id',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const builder = imageUrlBuilder(client)
export const urlFor = (source) => builder.image(source)

// Fetch helpers
export async function fetchArticles(limit = 20, category = null) {
  const filter = category ? `&& category == "${category}"` : ''
  return client.fetch(`
    *[_type == "newsArticle" ${filter}] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, excerpt, category, urgencyScore, publishedAt,
      author->{name, slug},
      heroImage{asset->{url}, alt},
      source, externalUrl
    }
  `)
}

export async function fetchBreakingAlerts(limit = 10) {
  return client.fetch(`
    *[_type == "breakingAlert" && active == true] | order(publishedAt desc) [0...${limit}] {
      _id, headline, publishedAt, url, urgencyScore
    }
  `)
}

export async function fetchLegislation(limit = 20, level = null) {
  const filter = level ? `&& level == "${level}"` : ''
  return client.fetch(`
    *[_type == "legislation" ${filter}] | order(lastActionDate desc) [0...${limit}] {
      _id, title, billNumber, status, level, state, summary, lastActionDate, url
    }
  `)
}

export async function fetchReviews(limit = 12, category = null) {
  const filter = category ? `&& category == "${category}"` : ''
  return client.fetch(`
    *[_type == "review" ${filter}] | order(publishedAt desc) [0...${limit}] {
      _id, title, slug, score, verdict, category, publishedAt, featured,
      firearmName, brand, caliber, msrp,
      heroImage{asset->{url}, alt},
      author->{name}
    }
  `)
}

export async function fetchReleases(limit = 20) {
  return client.fetch(`
    *[_type == "firearmRelease"] | order(announceDate desc) [0...${limit}] {
      _id, brand, model, caliber, actionType, msrp, announceDate, isNew,
      productImage{asset->{url}, alt},
      tags[], specUrl
    }
  `)
}

export async function fetchStateProfile(stateAbbr) {
  return client.fetch(`
    *[_type == "stateProfile" && abbr == "${stateAbbr}"][0] {
      _id, name, abbr, region,
      ccStatus, ccwPermit, redFlagLaw, magLimit, waitPeriod, awbStatus,
      reciprocityStates[],
      recentBills[]{billNumber, title, status, summary},
      lastUpdated
    }
  `)
}

export async function fetchAllStateProfiles() {
  return client.fetch(`
    *[_type == "stateProfile"] | order(name asc) {
      _id, name, abbr, region, ccStatus, redFlagLaw, magLimit, awbStatus
    }
  `)
}

export async function fetchAmmoPrices() {
  return client.fetch(`
    *[_type == "ammoPrice"] | order(caliber asc) {
      _id, caliber, pricePerRound, unit, trendPercent, trendDirection,
      availabilityIndex, lastUpdated
    }
  `)
}

export async function fetchVideos(limit = 10, category = null) {
  const filter = category ? `&& category == "${category}"` : ''
  return client.fetch(`
    *[_type == "video" ${filter}] | order(publishedAt desc) [0...${limit}] {
      _id, title, videoId, channelName, channelId, duration, viewCount,
      thumbnailUrl, category, publishedAt
    }
  `)
}

export async function fetchGlobalStats() {
  return client.fetch(`*[_type == "globalStats"][0]`)
}
