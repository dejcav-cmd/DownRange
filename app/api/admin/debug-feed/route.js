export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const [total, approved, sinceJun, latest5, cronNews, brokenArticle] = await Promise.all([
      sanity.fetch('count(*[_type == "newsArticle"])'),
      sanity.fetch('count(*[_type == "newsArticle" && approved == true])'),
      sanity.fetch('count(*[_type == "newsArticle" && _createdAt > "2026-06-01"])'),
      sanity.fetch('*[_type == "newsArticle"] | order(_createdAt desc)[0...5]{title, _createdAt, "slug": slug.current, approved, publishedAt, externalUrl}'),
      sanity.fetch('*[_type == "cronRun" && sourceId == "news"] | order(_updatedAt desc)[0...5]{status, details, error, _updatedAt}'),
      sanity.fetch('*[_id == "news-ed2885a86a33802b8759352ff4b98b4a"][0]{_id, title, "slug": slug.current, approved, externalUrl}'),
    ])
    return Response.json({ total, approved, sinceJun, latest5, cronNews, brokenArticle })
  } catch(e) {
    return Response.json({ error: e.message }, { status: 500 })
  }
}
