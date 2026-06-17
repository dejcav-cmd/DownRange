export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'
import { callAIText }    from '@/lib/aiClient'

const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     false,
  token:      process.env.SANITY_API_TOKEN,
})

// ── HELPERS ───────────────────────────────────────────────────────────────────

function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/, '').slice(0, 90)
}

function md5hex(str) {
  // Simple hash for dedup IDs — deterministic from title
  let h = 0
  for (let i = 0; i < str.length; i++) { h = (Math.imul(31, h) + str.charCodeAt(i)) | 0 }
  return Math.abs(h).toString(16).padStart(8, '0')
}

async function fetchPixabay(query) {
  const key = process.env.PIXABAY_API_KEY
  if (!key) return null
  try {
    const url = `https://pixabay.com/api/?key=${key}&q=${encodeURIComponent(query)}&image_type=photo&orientation=horizontal&min_width=800&per_page=5&safesearch=true`
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!r.ok) return null
    const d = await r.json()
    return d.hits?.[0]?.largeImageURL || d.hits?.[0]?.webformatURL || null
  } catch { return null }
}

async function fetchPexels(query) {
  const key = process.env.PEXELS_API_KEY
  if (!key) return null
  try {
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`
    const r = await fetch(url, { headers: { Authorization: key }, signal: AbortSignal.timeout(8000) })
    if (!r.ok) return null
    const d = await r.json()
    return d.photos?.[0]?.src?.large2x || d.photos?.[0]?.src?.large || null
  } catch { return null }
}

async function uploadImageToSanity(imageUrl, filename) {
  try {
    const r = await fetch(imageUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'image/*,*/*', Referer: imageUrl },
      signal: AbortSignal.timeout(15000),
    })
    if (!r.ok) return null
    const ct  = r.headers.get('content-type') || 'image/jpeg'
    if (!ct.includes('image')) return null
    const buf = await r.arrayBuffer()
    if (buf.byteLength < 5000) return null
    const asset = await sanity.assets.upload('image', Buffer.from(buf), { filename, contentType: ct })
    return asset?.url || null
  } catch { return null }
}

// Try to get the exact manufacturer product page image first
async function scrapeManufacturerImage(brand, model, sourceUrl) {
  const candidates = []
  if (sourceUrl) candidates.push(sourceUrl)

  // Build likely manufacturer URLs
  const brandSlug = brand.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9]/g, '')
  const modelSlug = model.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
  const brandUrls = {
    'glock':       `https://us.glock.com/en/find-your-glock`,
    'sig sauer':   `https://www.sigsauer.com/firearms`,
    'smith & wesson': `https://www.smith-wesson.com/firearms`,
    'ruger':       `https://www.ruger.com/products`,
    'springfield armory': `https://www.springfield-armory.com/firearms`,
    'fn america':  `https://fnamerica.com/products`,
    'heckler & koch': `https://www.heckler-koch.com`,
    'staccato':    `https://staccato2011.com`,
    'taurus':      `https://www.taurususa.com`,
    'mossberg':    `https://www.mossberg.com`,
    'kimber':      `https://www.kimberamerica.com`,
    'cz':          `https://cz-usa.com`,
    'walther':     `https://www.waltherarms.com`,
    'beretta':     `https://www.beretta.com`,
    'silencerco':  `https://silencerco.com`,
    'dead air':    `https://www.deadairsilencers.com`,
    'maxim defense': `https://maximdefense.com`,
    'daniel defense': `https://danieldefense.com`,
  }
  const brandKey = Object.keys(brandUrls).find(k => brand.toLowerCase().includes(k))
  if (brandKey) candidates.push(brandUrls[brandKey])

  for (const url of candidates.slice(0, 2)) {
    try {
      const r = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36' },
        signal: AbortSignal.timeout(8000),
      })
      if (!r.ok) continue
      const html = await r.text()

      // Look for product images in various patterns
      const patterns = [
        /<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']>/i,
        /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']>/i,
        /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']>/i,
        new RegExp(`<img[^>]+(?:alt|title)=["'][^"']*${model.split(' ')[0]}[^"']*["'][^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["']`, 'i'),
        /<img[^>]+class=["'][^"']*(?:product|hero|feature|main)[^"']*["'][^>]+src=["']([^"']+\.(?:jpg|jpeg|png|webp))["'][^>]*>/i,
      ]

      for (const pat of patterns) {
        const m = html.match(pat)
        if (m?.[1]) {
          let imgUrl = m[1].trim()
          if (imgUrl.startsWith('//'))  imgUrl = 'https:' + imgUrl
          if (imgUrl.startsWith('/'))   imgUrl = new URL(url).origin + imgUrl
          if (imgUrl.match(/\.(jpg|jpeg|png|webp)/i) && imgUrl.length > 20 &&
              !imgUrl.includes('logo') && !imgUrl.includes('favicon') && !imgUrl.includes('1x1')) {
            console.log(`[RELEASES-CRON] Got mfr image: ${imgUrl.slice(0, 70)}`)
            return imgUrl
          }
        }
      }
    } catch (e) {
      console.log(`[RELEASES-CRON] Scrape failed for ${url}: ${e.message}`)
    }
  }
  return null
}

async function getImageForGun(brand, model, category, sourceUrl) {
  // Priority: 1. Manufacturer page OG/product image 2. Model-specific Pexels/Pixabay 3. Category fallback
  const mfrImage = await scrapeManufacturerImage(brand, model, sourceUrl)
  if (mfrImage) return mfrImage

  const modelQuery = `${brand} ${model} gun firearm`
  const catQuery   = {
    pistol:    'pistol handgun semi-automatic firearm',
    rifle:     'rifle semi-automatic tactical firearm',
    shotgun:   'shotgun 12 gauge pump semi-auto firearm',
    revolver:  'revolver stainless handgun magnum',
    suppressor:'gun suppressor silencer titanium',
    carbine:   'carbine rifle compact tactical',
  }[category] || 'firearm gun tactical'

  for (const query of [modelQuery, `${brand} ${category}`, catQuery]) {
    const img = await fetchPexels(query) || await fetchPixabay(query)
    if (img) return img
  }
  return null
}

// ── AI: Search for new releases ───────────────────────────────────────────────

async function discoverNewReleases() {
  const now    = new Date()
  const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 1 week ago (cron now runs daily)
  const dateStr = cutoff.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  const prompt = `You are a firearm industry analyst. List the 12 most significant NEW gun releases announced or shipped in the last 2 weeks (after ${dateStr}). Include pistols, rifles, shotguns, revolvers, and suppressors from major manufacturers.

For each release, provide EXACTLY this JSON structure (array of objects):
[
  {
    "brand": "Manufacturer name",
    "model": "Exact model name",
    "category": "pistol|rifle|shotgun|revolver|suppressor|carbine",
    "caliber": "e.g. 9mm Luger",
    "msrp": "e.g. $699",
    "summary": "2-3 sentence summary of what makes this release notable",
    "keyFeatures": ["feature1", "feature2", "feature3"],
    "announcedDate": "approximate month/year",
    "sourceUrl": "manufacturer website URL if known, else empty string"
  }
]

Focus on REAL, VERIFIABLE releases from 2025-2026. Do not invent products. If you are not confident about a release, omit it. Return ONLY the JSON array, no other text.`

  const raw = await callAIText({ prompt, useCase: 'article', maxTokens: 2000 })
  const cleaned = raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim()

  try {
    const parsed = JSON.parse(cleaned)
    return Array.isArray(parsed) ? parsed : []
  } catch (e) {
    console.error('[RELEASES-CRON] JSON parse failed:', e.message, '| raw:', cleaned.slice(0, 200))
    return []
  }
}

// ── AI: Write full article ─────────────────────────────────────────────────────

async function writeReleaseArticle(release) {
  const prompt = `Write a high-quality firearms product article about the ${release.brand} ${release.model}.

Product details:
- Category: ${release.category}
- Caliber: ${release.caliber}
- MSRP: ${release.msrp}
- Key features: ${(release.keyFeatures || []).join(', ')}
- Summary: ${release.summary}

Write like a gun owner who carries daily and reads 2A case law — direct, specific, no AI filler.
Article must be 600-900 words. Use HTML with h2 tags for sections. No markdown fences.
Structure: intro paragraph → What's New (h2) → Key Features/Specs (h2) → Who It's For (h2) → Bottom Line (h2).
MSRP: ${release.msrp}. Brand site: ${release.sourceUrl || `https://www.${release.brand.toLowerCase().replace(/\s/g,'')}.com`}

Return ONLY the HTML body content. No preamble, no closing note, no code fences.`

  const raw = await callAIText({ prompt, useCase: 'article', maxTokens: 2500 })
  return raw.replace(/^```[a-z]*\s*/i, '').replace(/\s*```\s*$/i, '').trim()
}

// ── DEDUP CHECK ───────────────────────────────────────────────────────────────

async function alreadyExists(brand, model) {
  const count = await sanity.fetch(
    `count(*[_type == "firearmRelease" && brand == $brand && model == $model])`,
    { brand, model }
  ).catch(() => 0)
  return count > 0
}

// ── MAIN HANDLER ──────────────────────────────────────────────────────────────

export async function GET(req) {
  const t0     = Date.now()
  const auth   = req.headers.get('authorization')
  const cron   = req.headers.get('x-vercel-cron')
  const admin  = req.headers.get('x-admin-key')
  const secret = process.env.CRON_SECRET

  if (cron !== '1' && auth !== `Bearer ${secret}` && admin !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const stats = { discovered: 0, created: 0, skipped: 0, failed: 0 }

  try {
    console.log('[RELEASES-CRON] Discovering new gun releases...')
    const releases = await discoverNewReleases()
    stats.discovered = releases.length
    console.log(`[RELEASES-CRON] AI discovered ${releases.length} releases`)

    for (const rel of releases) {
      if (!rel.brand || !rel.model) { stats.skipped++; continue }

      // Skip if already in Sanity
      if (await alreadyExists(rel.brand, rel.model)) {
        console.log(`[RELEASES-CRON] Already exists: ${rel.brand} ${rel.model}`)
        stats.skipped++
        continue
      }

      console.log(`[RELEASES-CRON] Creating: ${rel.brand} ${rel.model}`)

      // Write full article
      const body = await writeReleaseArticle(rel).catch(() => null)
      if (!body || body.length < 200) { stats.failed++; continue }

      // Get real image
      const rawImgUrl = await getImageForGun(rel.brand, rel.model, rel.category, rel.sourceUrl)
      let imageUrl    = rawImgUrl || null
      if (rawImgUrl) {
        const slug    = slugify(`${rel.brand}-${rel.model}`)
        const cdnUrl  = await uploadImageToSanity(rawImgUrl, `release-${slug}.jpg`)
        if (cdnUrl) imageUrl = cdnUrl
      }

      // Fallback local photo
      if (!imageUrl) {
        imageUrl = {
          pistol:    '/img/photos/pistol.jpg',
          rifle:     '/img/photos/rifle.jpg',
          shotgun:   '/img/photos/shotgun.jpg',
          revolver:  '/img/photos/pistol.jpg',
          suppressor:'/img/photos/suppressor.jpg',
          carbine:   '/img/photos/rifle.jpg',
        }[rel.category] || '/img/photos/news.jpg'
      }

      const slug = slugify(`${rel.brand}-${rel.model}`)
      const _id  = `release-${md5hex(rel.brand + rel.model)}`

      await sanity.createOrReplace({
        _id,
        _type:           'firearmRelease',
        title:           `${rel.brand} ${rel.model}: ${rel.summary?.split('.')[0] || 'New Release'}`,
        slug:            { _type: 'slug', current: slug },
        brand:           rel.brand,
        model:           rel.model,
        category:        rel.category,
        caliber:         rel.caliber || '',
        msrp:            rel.msrp || '',
        summary:         rel.summary || '',
        body,
        imageUrl,
        sourceUrl:       rel.sourceUrl || null,
        approved:        true,
        isJustDropped:   true,
        qualityReviewed: false,
        publishedAt:     new Date().toISOString(),
        autoGenerated:   true,
      })

      stats.created++
      console.log(`[RELEASES-CRON] ✓ Created: ${rel.brand} ${rel.model}`)

      // Rate limit
      await new Promise(r => setTimeout(r, 1500))
    }

    const ms      = Date.now() - t0
    const details = `discovered:${stats.discovered} created:${stats.created} skipped:${stats.skipped} failed:${stats.failed} (${ms}ms)`

    await reportCronRun('weekly-gun-releases', { status: 'success', ms, details }).catch(() => {})
    return Response.json({ ok: true, ...stats, ms, message: details })

  } catch (err) {
    const ms = Date.now() - t0
    console.error('[RELEASES-CRON]', err.message)
    await reportCronRun('weekly-gun-releases', { status: 'failed', ms, error: err.message }).catch(() => {})
    return Response.json({ ok: false, error: err.message, ...stats }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
