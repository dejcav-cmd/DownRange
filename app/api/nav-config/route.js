export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Public: which top-nav tabs the admin has hidden.
export async function GET() {
  let hiddenItems = []
  try {
    const doc = await sanity.fetch('*[_id == "nav-visibility-config"][0]{hiddenItems}')
    hiddenItems = Array.isArray(doc?.hiddenItems) ? doc.hiddenItems.filter(x => typeof x === 'string') : []
  } catch {}
  return Response.json({ hiddenItems }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}
