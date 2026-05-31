import { client } from '../sanity/lib/client'

export const DEFAULT_BIO = "DJ Cavalcanti is the founder of DownRange — built to give every American gun owner one place for the news, laws, market data, and practical knowledge they actually need. No algorithms, no paywalls, no corporate backing."

export async function fetchAuthorBio() {
  try {
    const config = await client.fetch('*[_type == "siteConfig"][0] { authorBio }')
    return config?.authorBio || DEFAULT_BIO
  } catch (e) {
    return DEFAULT_BIO
  }
}
