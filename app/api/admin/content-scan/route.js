export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const AI_PHRASES = [
  'comprehensive','dive into','cutting-edge','robust','seamlessly','leverage',
  'empower','game-changer','landscape','navigate','delve','utilize','innovative',
  'unprecedented','paradigm','synergy','moving forward','shed light on',
  'it remains to be seen','stakeholders','holistic','takeaway','unpack',
  'groundbreaking','pivotal','significant development','notably',
  'it\'s worth noting','furthermore','in conclusion','in summary',
  'at the end of the day','a wide range of','it is important to note',
  'in the realm of','when it comes to',
]

function scoreBody(body, title) {
  if (!body || body.length < 100) return { score: 0, issues: ['missing body'] }
  const text = body.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').toLowerCase()
  const words = text.split(/\s+/).filter(Boolean)
  const issues = []

  if (words.length < 400) issues.push(`too short (${words.length} words, need 400+)`)

  const found = AI_PHRASES.filter(p => text.includes(p.toLowerCase()))
  if (found.length > 0) issues.push(`AI phrases: "${found.slice(0,3).join('", "')}"${found.length > 3 ? ` +${found.length-3} more` : ''}`)

  // Check for padded opener
  const firstSentence = text.slice(0, 200)
  if (/in recent (months|years|weeks)|there has been|as (we|the country|gun owners)|it (is|has) (important|worth|become)/i.test(firstSentence)) {
    issues.push('padded opener detected')
  }

  // Check h2 structure for news articles  
  const h2count = (body.match(/<h2/gi) || []).length
  if (h2count < 2 && words.length > 100) issues.push(`weak structure (${h2count} h2 sections)`)

  const score = Math.max(0, 100 - (issues.length * 25) - (found.length * 5))
  return { score, issues, words: words.length, aiPhrases: found.length }
}

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error:'Unauthorized' }, { status:401 })

  const QUERIES = [
    { type:'newsArticle',    label:'News Articles',  q:`*[_type=="newsArticle" && defined(title)] | order(publishedAt desc) [0...200] { _id, title, body, qualityReviewed, publishedAt }` },
    { type:'blogPost',       label:'Blog Posts',     q:`*[_type=="blogPost" && defined(title)] | order(publishedAt desc) [0...100] { _id, title, body, qualityReviewed }` },
    { type:'firearmRelease', label:'Gun Releases',   q:`*[_type=="firearmRelease" && defined(brand)] | order(_createdAt desc) [0...100] { _id, "title": brand + " " + model, body, qualityReviewed }` },
    { type:'canadaContent',  label:'Canada',         q:`*[_type=="canadaContent" && defined(title)] | order(_createdAt desc) [0...100] { _id, title, body, qualityReviewed }` },
  ]

  const allItems = []
  const summary = {}

  for (const { type, label, q } of QUERIES) {
    try {
      const docs = await sanity.fetch(q)
      const items = docs.map(doc => {
        const { score, issues, words, aiPhrases } = scoreBody(doc.body, doc.title)
        return {
          _id: doc._id,
          type,
          label,
          title: (doc.title || '').slice(0, 80),
          score,
          issues,
          words: words || 0,
          aiPhrases: aiPhrases || 0,
          qualityReviewed: doc.qualityReviewed || false,
          needsRewrite: !doc.qualityReviewed && score < 70,
        }
      })
      summary[type] = {
        label,
        total: items.length,
        reviewed: items.filter(i => i.qualityReviewed).length,
        needsRewrite: items.filter(i => i.needsRewrite).length,
        passing: items.filter(i => i.score >= 70).length,
      }
      allItems.push(...items)
    } catch(e) {
      console.error('[SCAN]', type, e.message)
    }
  }

  const needsRewrite = allItems.filter(i => i.needsRewrite)
  const passing      = allItems.filter(i => i.score >= 70)
  const reviewed     = allItems.filter(i => i.qualityReviewed)

  return Response.json({
    ok: true,
    total: allItems.length,
    needsRewrite: needsRewrite.length,
    passing: passing.length,
    reviewed: reviewed.length,
    summary,
    items: allItems.sort((a,b) => a.score - b.score), // worst first
  })
}

// Mark item as quality reviewed (skip on future scans)
export async function PATCH(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error:'Unauthorized' }, { status:401 })
  const { id, reviewed = true } = await req.json()
  await sanity.patch(id).set({ qualityReviewed: reviewed }).commit()
  return Response.json({ ok: true, id, reviewed })
}
