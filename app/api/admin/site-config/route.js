export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY ||
    req.headers.get('x-vercel-cron') === '1'
}

// Default bio - used as fallback if Sanity has nothing
const DEFAULT_BIO = "DJ Cavalcanti is the founder of DownRange — built to give every American gun owner one place for the news, laws, market data, and practical knowledge they actually need. No algorithms, no paywalls, no corporate backing."

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const config = await sanity.fetch(
      `*[_type == "siteConfig"][0] { authorBio, authorBioUpdatedAt, breakingUrgencyThreshold }`
    )
    return Response.json({
      ok: true,
      authorBio: config?.authorBio || DEFAULT_BIO,
      authorBioUpdatedAt: config?.authorBioUpdatedAt || null,
      breakingUrgencyThreshold: config?.breakingUrgencyThreshold || 8,
    })
  } catch (e) {
    return Response.json({ ok: true, authorBio: DEFAULT_BIO, error: e.message })
  }
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { authorBio } = body
  if (!authorBio || authorBio.trim().length < 20) {
    return Response.json({ error: 'authorBio must be at least 20 characters' }, { status: 400 })
  }

  // Upsert siteConfig doc
  await sanity.createOrReplace({
    _id:    'siteConfig',
    _type:  'siteConfig',
    authorBio: authorBio.trim(),
    authorBioUpdatedAt: new Date().toISOString(),
  })

  return Response.json({ ok: true, saved: authorBio.trim().slice(0, 80) + '...' })
}
