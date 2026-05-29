export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Public domain images from Wikimedia Commons / US DoD — no hotlink restrictions
// These load reliably on Vercel and browsers without any CORS issues
const TOPIC_MAP = [
  { kw:['suppressor','silencer','nfa','sbr','sbs','can'],
    url:'/img/photos/suppressor.jpg' },
  { kw:['bruen','scotus','supreme court','constitutional','amendment','court','legal','law','legislation','statute','senate','congress'],
    url:'/img/photos/law.jpg' },
  { kw:['ar-15','ar15','m4','carbine','build','rifle','long gun','assault'],
    url:'/img/photos/rifle.jpg' },
  { kw:['glock','pistol','handgun','edc','carry','concealed','ccw','sig','smith','shield','hellcat','p365'],
    url:'/img/photos/blog-edc-pistol.jpg' },
  { kw:['ammo','ammunition','9mm','round','brass','bullet','cartridge','tariff','price','market','cost'],
    url:'/img/photos/blog-ammo-market.jpg' },
  { kw:['red dot','optic','sight','scope','lpvo','eotech','aimpoint','trijicon','holosun'],
    url:'/img/photos/blog-red-dot.jpg' },
  { kw:['women','female','woman','lady','her','she'],
    url:'/img/photos/military.jpg' },
  { kw:['home defense','home','intruder','defend','shotgun','mossberg','remington'],
    url:'/img/photos/shotgun.jpg' },
  { kw:['insurance','uscca','ccw safe','legal defense','self-defense insurance','liability'],
    url:'/img/photos/blog-bruen-law.jpg' },
  { kw:['constitutional carry','permitless','permit','reciprocity','state law','carry law'],
    url:'/img/photos/blog-bruen-law.jpg' },
  { kw:['training','range','shoot','shooting','course','skill','drill','practice'],
    url:'/img/photos/training.jpg' },
]

const DEFAULT_IMG = '/img/photos/suppressor.jpg'

function pickImage(title, category, body) {
  const text = ((title||'') + ' ' + (category||'') + ' ' + ((body||'').slice(0,400))).toLowerCase()
  for (const { kw, url } of TOPIC_MAP) {
    if (kw.some(k => text.includes(k))) return url
  }
  return DEFAULT_IMG
}

// Try to scrape a real image from the open web for more variety
async function scrapeImage(title) {
  // Search Bearing Arms — firearms news site with rich og:images
  try {
    const q = encodeURIComponent(title.slice(0, 60).replace(/['"]/g, ''))
    const res = await fetch('https://bearingarms.com/?s=' + q, {
      headers: { 'User-Agent': 'Mozilla/5.0 DownRange/1.0 (+https://downrangeco.com)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const html = await res.text()
    // Find first article link, then get its og:image
    const linkMatch = html.match(/href="(https:\/\/bearingarms\.com\/[a-z0-9/-]+(?:\/[0-9]+){3}\/[a-z0-9-]+)"/i)
    if (!linkMatch) return null
    const articleRes = await fetch(linkMatch[1], {
      headers: { 'User-Agent': 'Mozilla/5.0 DownRange/1.0' },
      signal: AbortSignal.timeout(6000),
    })
    if (!articleRes.ok) return null
    const articleHtml = await articleRes.text()
    const ogMatch = articleHtml.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || articleHtml.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i)
    if (!ogMatch) return null
    const url = ogMatch[1]
    if (!url.startsWith('http') || url.includes('logo') || url.includes('avatar') || url.includes('icon')) return null
    return url
  } catch { return null }
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const force = body.force === true
  const t0 = Date.now()

  // Get all Sanity blog posts that need image updates
  const filter = force
    ? '*[_type == "blogPost"]'
    : '*[_type == "blogPost" && (imageUrl == null || imageUrl == "" || string::startsWith(imageUrl, "/img/"))]'

  const posts = await sanity.fetch(
    filter + ' { _id, title, category, imageUrl, body, "slug": slug.current } | order(_createdAt desc)'
  ).catch(() => [])

  const results = []

  for (const post of (posts || [])) {
    // Try scraping a real image first
    let newUrl = await scrapeImage(post.title || '')
    // Fall back to topic-matched Wikimedia image
    if (!newUrl) newUrl = pickImage(post.title, post.category, post.body)

    await sanity.patch(post._id).set({ imageUrl: newUrl }).commit().catch(() => {})
    results.push({
      slug: post.slug,
      title: (post.title || '').slice(0, 50),
      newUrl: newUrl.slice(0, 80),
      scraped: !newUrl.includes('wikimedia'),
    })
  }

  return NextResponse.json({
    ok: true,
    ms: Date.now() - t0,
    updated: results.length,
    results,
  })
}

// GET: preview which posts need updating
export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const posts = await sanity.fetch(
    '*[_type == "blogPost"] { _id, title, imageUrl, "slug": slug.current } | order(_createdAt desc)'
  ).catch(() => [])

  return NextResponse.json({
    ok: true,
    total: posts.length,
    needUpdate: posts.filter(p => !p.imageUrl || p.imageUrl.startsWith('/img/')).length,
    posts: posts.map(p => ({
      slug: p.slug,
      title: (p.title || '').slice(0, 50),
      ok: !!(p.imageUrl && !p.imageUrl.startsWith('/img/')),
      image: (p.imageUrl || 'NONE').slice(0, 70),
    }))
  })
}
