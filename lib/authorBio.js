import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: true, // cached reads are fine for bio
})

export const DEFAULT_BIO = "DJ Cavalcanti is the founder of DownRange — built to give every American gun owner one place for the news, laws, market data, and practical knowledge they actually need. No algorithms, no paywalls, no corporate backing."

export async function fetchAuthorBio() {
  try {
    const config = await sanity.fetch(
      `*[_type == "siteConfig"][0] { authorBio }`
    )
    return config?.authorBio || DEFAULT_BIO
  } catch {
    return DEFAULT_BIO
  }
}
