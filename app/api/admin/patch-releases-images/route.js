export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const sleep = ms => new Promise(r => setTimeout(r, ms))

const CAT_IMG = {
  Pistol:'/img/photos/pistol.jpg', Revolver:'/img/photos/pistol.jpg',
  Rifle:'/img/photos/rifle.jpg', Shotgun:'/img/photos/shotgun.jpg',
  Suppressor:'/img/photos/suppressor.jpg', default:'/img/photos/pistol.jpg',
}

function isAuth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
    || req.headers.get('authorization') === `Bearer ${process.env.ADMIN_KEY}`
}

async function fetchHTML(url, timeout=12000) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(timeout), redirect: 'follow',
    })
    return r.ok ? await r.text() : null
  } catch { return null }
}

// ── EXTRACT ALL IMAGE CANDIDATES FROM A PAGE ──────────────────────────────────
function extractImageCandidates(html, sourceUrl) {
  if (!html) return []
  const candidates = []
  const seen = new Set()

  function add(url, priority) {
    if (!url || !url.startsWith('http') || seen.has(url)) return
    // Skip obvious non-gun images
    const u = url.toLowerCase()
    if (u.includes('logo') || u.includes('favicon') || u.includes('icon-') ||
        u.includes('avatar') || u.includes('placeholder') || u.includes('blank') ||
        u.includes('sprite') || u.includes('banner') || u.includes('.gif') ||
        u.includes('advertisement') || u.includes('/ad/') || u.includes('pixel') ||
        u.includes('tracking') || u.includes('analytics')) return
    seen.add(url)
    candidates.push({ url, priority })
  }

  // OG image (high priority — but still needs vision check)
  const og = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i)
           || html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
  if (og?.[1]) add(og[1], 10)

  // Twitter image
  const tw = html.match(/<meta[^>]+name="twitter:image[^"]*"[^>]+content="([^"]+)"/i)
           || html.match(/<meta[^>]+content="([^"]+)"[^>]+name="twitter:image/i)
  if (tw?.[1]) add(tw[1], 9)

  // JSON-LD
  const ldRx = /<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi
  let ldm
  while ((ldm = ldRx.exec(html)) !== null) {
    try {
      const walk = (o) => {
        if (!o) return
        if (typeof o === 'string' && o.startsWith('http') && /\.(jpe?g|png|webp)/i.test(o)) add(o, 8)
        if (typeof o === 'object') Object.values(o).forEach(walk)
      }
      walk(JSON.parse(ldm[1]))
    } catch {}
  }

  // Large img tags — ranked by size attributes
  const imgRx = /<img[^>]+src="(https?:\/\/[^"]+\.(?:jpe?g|png|webp)[^"]*)"[^>]*(?:width="(\d+)")?[^>]*>/gi
  let im
  while ((im = imgRx.exec(html)) !== null) {
    const w = parseInt(im[2] || '0')
    add(im[1], w > 600 ? 7 : w > 300 ? 5 : 3)
  }

  // Srcset
  const srRx = /srcset="([^"]+)"/gi; let sm
  while ((sm = srRx.exec(html)) !== null) {
    sm[1].split(',').forEach(p => {
      const u = p.trim().split(/\s+/)[0]
      if (u?.startsWith('http') && /\.(jpe?g|png|webp)/i.test(u)) add(u, 4)
    })
  }

  return candidates.sort((a,b) => b.priority - a.priority)
}

// ── CLAUDE VISION: IS THIS ACTUALLY A FIREARM IMAGE? ─────────────────────────
async function isFirearmImage(imageUrl, brand, model) {
  if (!process.env.ANTHROPIC_API_KEY) return { isGun: false, confidence: 0 }
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 100,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'url', url: imageUrl },
            },
            {
              type: 'text',
              text: `Does this image show a FIREARM (pistol, rifle, shotgun, revolver, or suppressor)?
Expected gun: ${brand} ${model}

Reply with ONLY valid JSON:
{"isGun": true/false, "isCorrectGun": true/false, "confidence": 0-100, "description": "one line"}

isGun=true if the image shows ANY firearm.
isCorrectGun=true if it specifically appears to be the ${brand} ${model}.
confidence=how sure you are this is an actual product photo (not a logo/graphic/ad).`,
            },
          ],
        }],
      }),
      signal: AbortSignal.timeout(15000),
    })
    const data = await res.json()
    const raw = data.content?.[0]?.text || '{}'
    const clean = raw.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    return JSON.parse(clean)
  } catch (e) {
    console.error('[VISION]', e.message)
    return { isGun: false, confidence: 0 }
  }
}

// ── GOOGLE IMAGE SEARCH ───────────────────────────────────────────────────────
async function googleImageSearch(brand, model, category) {
  const query = encodeURIComponent(`"${brand}" "${model}" ${category} firearm product photo -logo -graphic`)
  const html = await fetchHTML(`https://www.google.com/search?q=${query}&tbm=isch&tbs=isz:l`)
  if (!html) return []

  const urls = []
  const patterns = [
    /"ou":"(https?:\/\/(?!encrypted)[^"]+\.(?:jpe?g|png|webp)[^"]*)"/gi,
    /\["(https?:\/\/[^"]+\.(?:jpe?g|png|webp)(?:\?[^"]*)?)",\s*\d{3,},\s*\d{3,}\]/gi,
  ]
  for (const rx of patterns) {
    let m; while ((m = rx.exec(html)) !== null) {
      const url = decodeURIComponent(m[1]).replace(/\\u003d/g,'=').replace(/\\u0026/g,'&')
      if (url.startsWith('http') && !url.includes('google') && !url.includes('gstatic') &&
          !url.includes('logo') && !url.includes('icon')) {
        urls.push(url)
        if (urls.length >= 8) break
      }
    }
  }
  return urls
}

// ── MAIN IMAGE FINDER: finds the ACTUAL gun photo ────────────────────────────
async function findGunPhoto(doc) {
  const { brand, model, category, sourceUrl } = doc
  const label = `${brand} — ${model}`
  console.log(`\n[${label}]`)

  const allCandidates = []

  // Step 1: Collect candidates from the source article
  if (sourceUrl) {
    const html = await fetchHTML(sourceUrl)
    if (html) {
      const pageCandidates = extractImageCandidates(html, sourceUrl)
      console.log(`  Article: ${pageCandidates.length} image candidates`)
      allCandidates.push(...pageCandidates.slice(0, 6).map(c => ({ ...c, source: 'article' })))
    }
  }

  // Step 2: Google image search candidates
  const googleUrls = await googleImageSearch(brand, model, category || 'firearm')
  console.log(`  Google: ${googleUrls.length} image candidates`)
  allCandidates.push(...googleUrls.slice(0, 6).map(url => ({ url, priority: 6, source: 'google' })))

  if (allCandidates.length === 0) {
    console.log(`  No candidates found — using category fallback`)
    return { url: CAT_IMG[category] || CAT_IMG.default, method: 'fallback', score: 5, description: 'no candidates found' }
  }

  // Step 3: Vision check each candidate until we find an actual gun photo
  let bestResult = null

  for (const cand of allCandidates) {
    console.log(`  Checking [${cand.source}]: ${cand.url.slice(0, 70)}`)
    const vision = await isFirearmImage(cand.url, brand, model)
    console.log(`    → isGun:${vision.isGun} isCorrect:${vision.isCorrectGun} confidence:${vision.confidence} "${vision.description}"`)

    if (vision.isGun && vision.confidence >= 60) {
      // Prefer isCorrectGun, but accept any gun photo with high confidence
      const score = vision.isCorrectGun ? 95 : 75
      if (!bestResult || score > bestResult.score) {
        bestResult = {
          url: cand.url,
          method: vision.isCorrectGun ? `${cand.source}_verified` : `${cand.source}_gun`,
          score,
          description: vision.description,
        }
        // If we found the exact gun, stop immediately
        if (vision.isCorrectGun) break
      }
    }
    await sleep(200)
  }

  if (bestResult) {
    console.log(`  ✓ Best: [${bestResult.method}] score:${bestResult.score} "${bestResult.description}"`)
    return bestResult
  }

  console.log(`  ✗ No gun photo found — using category fallback`)
  return { url: CAT_IMG[category] || CAT_IMG.default, method: 'fallback', score: 5, description: 'vision: no gun found in any candidate' }
}

// ── HANDLER ───────────────────────────────────────────────────────────────────
async function handler(req) {
  if (!isAuth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const forceAll = searchParams.get('force') === 'true'
  const offset   = parseInt(searchParams.get('offset') || '0')
  const limit    = parseInt(searchParams.get('limit') || '15') // 15/batch — vision calls take ~2s each

  const docs = await sanity.fetch(`
    *[_type=="firearmRelease"] | order(publishedAt desc) [0...300] {
      _id, brand, model, category, sourceUrl, imageUrl,
      imageStatus, imageScore
    }
  `).catch(() => [])

  // Skip only images that have been VISION-VERIFIED (method contains '_verified')
  const toProcess = docs.filter(d => {
    if (forceAll) return true
    // Already vision-verified with high score → skip
    if (d.imageStatus === 'verified' && (d.imageScore || 0) >= 90) return false
    return true
  })

  const skipped = docs.length - toProcess.length
  const paginated = toProcess.slice(offset, offset + limit)

  console.log(`[PATCH-IMG] total:${docs.length} pending:${toProcess.length} skipped:${skipped} batch:${paginated.length} (offset:${offset})`)

  const stats = { verified: 0, gun: 0, fallback: 0, errors: 0 }
  const results = []

  for (const doc of paginated) {
    const { url, method, score, description } = await findGunPhoto(doc)
    try {
      await sanity.patch(doc._id).set({
        imageUrl: url,
        imageStatus: score >= 90 ? 'verified' : score >= 70 ? 'gun' : 'fallback',
        imageMethod: method,
        imageScore: score,
        imageVerifiedAt: new Date().toISOString(),
      }).commit()

      if (score >= 90) stats.verified++
      else if (score >= 70) stats.gun++
      else stats.fallback++

      results.push({ brand: doc.brand, model: doc.model, method, score, description, url: url.slice(0,80) })
    } catch(e) {
      stats.errors++
      console.error(`  ✗ save: ${e.message}`)
    }
    await sleep(500)
  }

  const nextOffset = offset + limit
  const msg = `verified:${stats.verified} gun:${stats.gun} fallback:${stats.fallback} errors:${stats.errors} | batch ${offset}-${offset+paginated.length} of ${toProcess.length} pending`
  console.log('[PATCH-IMG] Done:', msg)

  return Response.json({
    ok: true, total: docs.length, processed: paginated.length,
    totalPending: toProcess.length, skipped, stats, results, message: msg,
    pagination: {
      offset, limit, nextOffset: nextOffset < toProcess.length ? nextOffset : null,
      hasMore: nextOffset < toProcess.length,
      remaining: Math.max(0, toProcess.length - nextOffset),
    },
  })
}

export async function POST(req) { return handler(req) }
export async function GET(req)  { return handler(req) }
