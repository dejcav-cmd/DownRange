export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({ projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'vbnsqnkg', dataset:'production', apiVersion:'2024-01-01', token:process.env.SANITY_API_TOKEN, useCdn:false })

export async function POST(req) {
  const auth = req.headers.get('authorization')
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error:'Unauthorized' }, { status:401 })

  const { title, summary, bullets, author, publishedAt } = await req.json()
  if (!title || !summary) return Response.json({ error:'title and summary required' }, { status:400 })

  const doc = { _id:'market-analysis-daily', _type:'marketAnalysis', title, summary, bullets:bullets||[], author:author||'DownRange AI', publishedAt: publishedAt||new Date().toISOString() }

  await sanity.createOrReplace(doc)
  return Response.json({ success:true, title })
}
