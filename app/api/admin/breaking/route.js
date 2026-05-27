export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({ projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'vbnsqnkg', dataset:'production', apiVersion:'2024-01-01', token:process.env.SANITY_API_TOKEN, useCdn:false })

export async function POST(req) {
  const t = Date.now()
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error:'Unauthorized' }, { status:401 })
  try {
    const { headline, urgencyScore, url } = await req.json()
    if (!headline) return Response.json({ error:'headline required' }, { status:400 })
    const doc = { _type:'breakingAlert', headline, urgencyScore: urgencyScore||8, url: url||null, publishedAt: new Date().toISOString() }
    await sanity.create(doc)
    await reportCronRun('breaking', { status:'success', ms:Date.now()-t, details:'alert created: '+headline.slice(0,60) })
    return Response.json({ ok:true, headline })
  } catch (err) {
    await reportCronRun('breaking', { status:'failed', ms:Date.now()-t, error:err.message })
    return Response.json({ error:err.message }, { status:500 })
  }
}
