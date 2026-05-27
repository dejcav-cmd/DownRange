export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const LAW_IMAGE    = 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/US_Supreme_Court_Building.jpg/1280px-US_Supreme_Court_Building.jpg'
const PISTOL_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg'
const RIFLE_IMAGE  = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/M4A1_SOPMOD_Block_II.jpg/1280px-M4A1_SOPMOD_Block_II.jpg'

function pickImage(title, category) {
  const t = (title || '').toLowerCase()
  if (/glock|pistol|handgun|9mm|45acp|sig|ruger|carry|ccw|springfield|kimber/.test(t)) return PISTOL_IMAGE
  if (/ar.?15|rifle|carbine|5\.56|\.223|ak-?47|308|6\.5/.test(t))                      return RIFLE_IMAGE
  if (/congress|bill|senate|house|vote|legislation|legis|amendment|act |h\.r\.|s\.|most.viewed/.test(t)) return LAW_IMAGE
  if (/law|atf|scotus|court|ban|2a|saf|nra|lawsuit|challenge|rights/.test(t)) return LAW_IMAGE
  const catMap = { law: LAW_IMAGE, breaking: LAW_IMAGE, industry: RIFLE_IMAGE }
  return catMap[category] || PISTOL_IMAGE
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Find all articles missing imageUrl
  const missing = await sanity.fetch(
    '*[_type=="newsArticle" && approved==true && (!defined(imageUrl) || imageUrl == "")][0...200]{_id,title,category,slug}'
  )

  let fixed = 0
  const results = []

  for (const a of missing) {
    const img = pickImage(a.title, a.category)
    await sanity.patch(a._id).set({ imageUrl: img }).commit()
    results.push({ slug: a.slug?.current, title: a.title?.slice(0,60), img: img.split('/').pop() })
    fixed++
  }

  return Response.json({ ok: true, fixed, results })
}

// GET for easy browser testing
export async function GET(req) { return POST(req) }
