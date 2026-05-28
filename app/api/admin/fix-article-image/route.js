export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function pickPhoto(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen/.test(t)) return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc|p365|hellcat|shield|kimber|walther/.test(t)) return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr|ar.10|ddm4|scar|ruger.pc|m16|fn.*15|daniel|bcm/.test(t)) return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|remington.*870|benelli|gauge|pump|590|870/.test(t)) return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa|omega|dead.air|surefire|thunder|obsidian/.test(t)) return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic|hst|gold.dot|hornady|federal|speer|reload|press|powder|brass|cast/.test(t)) return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl|turkey|bear|boar/.test(t)) return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa|ipsc|3.gun|steel.*match|bianchi/.test(t)) return '/img/photos/competition.jpg'
  if (/train|range|practice|marksmanship|drill|dry.fire/.test(t)) return '/img/photos/training.jpg'
  if (/gear|holster|optic|sight|scope|light|sling|magazine|accessory/.test(t)) return '/img/photos/gear.jpg'
  if (/home.*defense|nightstand|self.defense/.test(t)) return '/img/photos/homedefense.jpg'
  if (/military|army|marine|navy|soldier|combat|veteran/.test(t)) return '/img/photos/military.jpg'
  return '/img/photos/news.jpg'
}

async function extractOgImage(pageUrl) {
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(10000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const patterns = [
      /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
      /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
      /<meta[^>]+content=["']([^"']+)["'][^>]+name=["']twitter:image["']/i,
    ]
    for (const pat of patterns) {
      const m = html.match(pat)
      if (m?.[1]) {
        let url = m[1].trim()
        if (url.startsWith("//")) url = "https:" + url
        if (url.startsWith("/")) { const b = new URL(pageUrl); url = b.origin + url }
        if (url.match(/\.(jpg|jpeg|png|webp)/i) && !url.includes("logo") && !url.includes("favicon") && !url.includes("1x1")) return url
      }
    }
    return null
  } catch { return null }
}

async function uploadToSanity(imageUrl, filename) {
  try {
    const res = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': imageUrl, 'Accept': 'image/*' },
      signal: AbortSignal.timeout(15000),
    })
    if (!res.ok) return null
    const ct = res.headers.get("content-type") || "image/jpeg"
    if (!ct.includes("image")) return null
    const buf = await res.arrayBuffer()
    if (buf.byteLength < 5000) return null
    const asset = await sanity.assets.upload("image", Buffer.from(buf), { filename, contentType: ct })
    return asset?.url || null
  } catch { return null }
}

// POST /api/admin/fix-article-image
// Body: { slug: "article-slug" }  OR  { id: "_id" }
export async function POST(req) {
  const key = req.headers.get("x-admin-key")
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: "Unauthorized" }, { status: 401 })

  const { slug, id } = await req.json().catch(() => ({}))
  if (!slug && !id) return Response.json({ error: "slug or id required" }, { status: 400 })

  const filter = id
    ? `_id == "${id}"`
    : `slug.current == "${slug}"`

  const article = await sanity.fetch(
    `*[_type == "newsArticle" && ${filter}][0]{ _id, title, externalUrl, imageUrl, category }`
  )
  if (!article) return Response.json({ error: "Article not found" }, { status: 404 })

  const externalUrl = article.externalUrl
  if (!externalUrl) return Response.json({ error: "Article has no externalUrl to fetch image from", _id: article._id }, { status: 422 })

  // Step 1: fetch og:image from source
  const ogImage = await extractOgImage(externalUrl)

  // If source blocks scraping, fall back to a relevant local photo
  if (!ogImage) {
    const fallback = pickPhoto(article.title, article.category)
    await sanity.patch(article._id).set({ imageUrl: fallback }).commit()
    return Response.json({ ok: true, _id: article._id, title: article.title, usedFallback: true, imageUrl: fallback })
  }

  // Step 2: upload to Sanity CDN
  const slugStr = (article.title || "article").toLowerCase().replace(/[^a-z0-9]/g, "-").slice(0, 40)
  const cdnUrl = await uploadToSanity(ogImage, `${slugStr}-${article._id.slice(-6)}.jpg`)
  if (!cdnUrl) {
    // Upload failed — fall back to local photo
    const fallback = pickPhoto(article.title, article.category)
    await sanity.patch(article._id).set({ imageUrl: fallback }).commit()
    return Response.json({ ok: true, _id: article._id, title: article.title, usedFallback: true, imageUrl: fallback })
  }

  // Step 3: patch article
  await sanity.patch(article._id).set({ imageUrl: cdnUrl }).commit()

  return Response.json({ ok: true, _id: article._id, title: article.title, ogImage, cdnUrl })
}
