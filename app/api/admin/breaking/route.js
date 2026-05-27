export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({ projectId:process.env.NEXT_PUBLIC_SANITY_PROJECT_ID||'vbnsqnkg', dataset:'production', apiVersion:'2024-01-01', token:process.env.SANITY_API_TOKEN, useCdn:false })

export async function POST(req) {
  const auth = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) return Response.json({ error:'Unauthorized' }, { status:401 })
  const { headline, urgencyScore, url } = await req.json()
  if (!headline) return Response.json({ error:'headline required' }, { status:400 })
  const doc = { _type:'breakingAlert', headline, urgencyScore: urgencyScore||8, url: url||null, publishedAt: new Date().toISOString() }
  await sanity.create(doc)
  return Response.json({ success:true })
}
