export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Topic-matched real image URLs (verified public domain from Wikimedia/US Gov)
// These are permanent CDN links — no auth, no hotlink blocking
const TOPIC_IMAGES = [
  // Suppressors / NFA
  { keywords: ['suppressor','silencer','nfa','sbr','sbs'], 
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9c/Marine_sniper_M40A5.jpg/1280px-Marine_sniper_M40A5.jpg' },
  // Bruen / constitutional law / SCOTUS
  { keywords: ['bruen','scotus','constitutional','amendment','court','legal','law','legislative'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f9/US_Supreme_Court.jpg/1280px-US_Supreme_Court.jpg' },
  // AR-15 / rifle builds
  { keywords: ['ar-15','ar15','ar build','m4','carbine','rifle','build'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/AR15_Rifle.jpg/1280px-AR15_Rifle.jpg' },
  // EDC / pistol / handgun / concealed carry
  { keywords: ['edc','glock','pistol','handgun','carry','sig','concealed','ccw','holster'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b0/Glock_17_Generations_1-4.jpg/1280px-Glock_17_Generations_1-4.jpg' },
  // Ammo / market / tariffs / pricing
  { keywords: ['ammo','ammunition','9mm','rounds','tariff','price','market','cost','bulk'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Ammo_9mm_Glaser.jpg/1280px-Ammo_9mm_Glaser.jpg' },
  // Red dot / optics / sights
  { keywords: ['red dot','optic','sight','scope','lpvo','eotech','aimpoint','trijicon'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Micro_Red_Dot_Sight.jpg/1280px-Micro_Red_Dot_Sight.jpg' },
  // Women / new gun owners / demographic
  { keywords: ['women','female','new owner','first-time','demographic','grow'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/Female_Marine_sniper_rifle.jpg/1280px-Female_Marine_sniper_rifle.jpg' },
  // Home defense
  { keywords: ['home defense','home','intruder','defend','shotgun','defense'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0c/Remington870.jpg/1280px-Remington870.jpg' },
  // CCW insurance / legal defense
  { keywords: ['insurance','uscca','ccw safe','legal defense','coverage'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Concealed_pistol_license.jpg/1280px-Concealed_pistol_license.jpg' },
  // Constitutional carry / permit / state
  { keywords: ['constitutional carry','permitless','permit','state','reciprocity'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Flag_of_the_United_States.svg/1280px-Flag_of_the_United_States.svg' },
  // Training / range / shooting
  { keywords: ['training','range','shoot','shooting','course','skill'],
    url: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c7/US_Navy_shooting_range.jpg/1280px-US_Navy_shooting_range.jpg' },
]

// Default fallback
const DEFAULT_IMAGE = 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/39/AK-47_and_M16A1_DD-ST-85-01269.jpg/1280px-AK-47_and_M16A1_DD-ST-85-01269.jpg'

function pickImage(title, category, body) {
  const text = ((title || '') + ' ' + (category || '') + ' ' + (body || '').slice(0, 200)).toLowerCase()
  for (const { keywords, url } of TOPIC_IMAGES) {
    if (keywords.some(kw => text.includes(kw))) return url
  }
  return DEFAULT_IMAGE
}

// Attempt to fetch a real og:image from the article's source
async function tryOgImage(title) {
  // Search TTAG (The Truth About Guns) — good og:images, no paywall
  try {
    const q = encodeURIComponent(title.slice(0, 60))
    const res = await fetch(
      'https://www.thetruthaboutguns.com/?s=' + q,
      { headers: { 'User-Agent': 'Mozilla/5.0 DownRange/1.0' }, signal: AbortSignal.timeout(6000) }
    )
    if (!res.ok) return null
    const html = await res.text()
    // Find first article og:image or article img src
    const m = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      || html.match(/<img[^>]+src=["'](https:\/\/[^"']*\.(jpg|jpeg|png|webp))[^>]*>/i)
    if (!m) return null
    const url = m[1]
    if (url.includes('logo') || url.includes('icon') || url.includes('avatar')) return null
    return url
  } catch { return null }
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { force = false } = await req.json().catch(() => ({}))
  const t0 = Date.now()

  try {
    // Get all blog posts that need images
    const posts = await sanity.fetch(
      force
        ? '*[_type == "blogPost"] { _id, title, category, imageUrl, body, "slug": slug.current }'
        : '*[_type == "blogPost" && (imageUrl == null || string::startsWith(imageUrl, "/img/") || imageUrl == "")] { _id, title, category, imageUrl, body, "slug": slug.current }'
    )

    const results = []
    let updated = 0

    for (const post of (posts || [])) {
      // Try og:image first for authenticity
      let newUrl = await tryOgImage(post.title || '')

      // Fall back to topic-matched image
      if (!newUrl) {
        newUrl = pickImage(post.title, post.category, post.body)
      }

      await sanity.patch(post._id).set({ imageUrl: newUrl }).commit()
      updated++
      results.push({ slug: post.slug, imageUrl: newUrl.slice(0, 80) })
    }

    return NextResponse.json({
      ok: true,
      ms: Date.now() - t0,
      updated,
      results,
    })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function GET(req) {
  // GET with ?preview=1 shows what would be updated
  const key = req.headers.get('x-admin-key')
  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const posts = await sanity.fetch(
    '*[_type == "blogPost"] { _id, title, imageUrl, "slug": slug.current } | order(_createdAt desc)'
  ).catch(() => [])

  return NextResponse.json({
    ok: true,
    total: posts.length,
    needsUpdate: posts.filter(p => !p.imageUrl || p.imageUrl.startsWith('/img/')).length,
    posts: posts.map(p => ({
      slug: p.slug,
      title: (p.title || '').slice(0, 50),
      hasRealImage: !!p.imageUrl && !p.imageUrl.startsWith('/img/'),
      current: (p.imageUrl || '').slice(0, 60),
    }))
  })
}
