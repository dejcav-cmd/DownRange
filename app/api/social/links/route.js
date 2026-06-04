export const dynamic = 'force-dynamic'
export const revalidate = 300 // 5 min cache

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: true,
})

export async function GET() {
  try {
    const config = await sanity.fetch(`*[_type == "socialConfig"][0]{ socialLinks }`)
    return Response.json({ ok: true, links: config?.socialLinks || {} }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
  } catch (e) {
    return Response.json({ ok: false, links: {} })
  }
}
