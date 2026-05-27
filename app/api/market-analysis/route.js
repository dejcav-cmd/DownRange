export const dynamic = 'force-dynamic'
import { reportCronRun } from '@/lib/cronReporter'
import { createClient } from '@sanity/client'

const sanity = createClient({ projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'vbnsqnkg', dataset:'production', apiVersion:'2024-01-01', token:process.env.SANITY_API_TOKEN, useCdn:false })

export async function POST(req) {
  const t = Date.now()
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error:'Unauthorized' }, { status:401 })

  try {
    const { title, summary, bullets, author, publishedAt } = await req.json()
    if (!title || !summary) return Response.json({ error:'title and summary required' }, { status:400 })

    const doc = { _id:'market-analysis-daily', _type:'marketAnalysis', title, summary, bullets:bullets||[], author:author||'DownRange AI', publishedAt: publishedAt||new Date().toISOString() }
    await sanity.createOrReplace(doc)
    await reportCronRun('market', { status:'success', ms:Date.now()-t, details:'market analysis saved: '+title.slice(0,60) })
    return Response.json({ success:true, title })
  } catch (err) {
    await reportCronRun('market', { status:'failed', ms:Date.now()-t, error:err.message })
    return Response.json({ error: err.message }, { status:500 })
  }
}
