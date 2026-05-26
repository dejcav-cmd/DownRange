export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({ projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'vbnsqnkg', dataset:'production', apiVersion:'2024-01-01', useCdn:true })

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  if (!q) return Response.json({ results:[], total:0 })
  const results = await sanity.fetch(
    `*[_type=="newsArticle"&&approved==true&&(title match $q||summary match $q)]|order(publishedAt desc)[0...20]{_id,title,slug,summary,category,publishedAt,source,externalUrl}`,
    { q: `*${q}*` }
  ).catch(()=>[])
  return Response.json({ results, total: results.length })
}
