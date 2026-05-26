export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  const deals = []

  // ── Source 1: old.reddit.com JSON (no OAuth, works server-side) ──────────
  try {
    const res = await fetch(
      'https://old.reddit.com/r/gundeals/hot.json?limit=40&raw_json=1',
      {
        headers: {
          'User-Agent': 'DownRange/2.0 (firearms intelligence platform; contact@downrangeco.com)',
          'Accept': 'application/json',
        },
        next: { revalidate: 0 },
      }
    )
    if (res.ok) {
      const data = await res.json()
      const posts = data?.data?.children || []
      for (const { data: p } of posts) {
        if (p.stickied || !p.title || p.score < 5) continue
        deals.push({
          id: 'r-' + p.id,
          title: p.title,
          url: p.url || `https://reddit.com${p.permalink}`,
          score: p.score,
          comments: p.num_comments,
          created: p.created_utc * 1000,
          flair: p.link_flair_text || 'Other',
          source: 'r/gundeals',
          domain: p.domain,
          permalink: `https://reddit.com${p.permalink}`,
        })
      }
    }
  } catch {}

  // ── Source 2: gun.deals RSS (aggregates r/gundeals + more) ───────────────
  if (deals.length < 10) {
    try {
      const res = await fetch('https://gun.deals/feed/snap', {
        headers: { 'User-Agent': 'DownRange/2.0' },
        next: { revalidate: 0 },
      })
      if (res.ok) {
        const xml = await res.text()
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
        for (const item of items.slice(0, 20)) {
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
            || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const link = item.match(/<link>(https?[^<]+)<\/link>/)?.[1] || ''
          const desc = item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/)?.[1] || ''
          const price = desc.match(/\$[\d,]+\.?\d*/)?.[0] || ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
          if (!title) continue
          deals.push({
            id: 'gd-' + Buffer.from(link).toString('base64').slice(0, 8),
            title: price ? `${title} — ${price}` : title,
            url: link,
            score: null,
            comments: null,
            created: pubDate ? new Date(pubDate).getTime() : Date.now(),
            flair: 'Deals',
            source: 'gun.deals',
            domain: 'gun.deals',
          })
        }
      }
    } catch {}
  }

  // ── Source 3: AmmoLand RSS ────────────────────────────────────────────────
  try {
    const res = await fetch('https://www.ammoland.com/feed/', {
      headers: { 'User-Agent': 'DownRange/2.0' },
      next: { revalidate: 0 },
    })
    if (res.ok) {
      const xml = await res.text()
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
      for (const item of items.slice(0, 12)) {
        const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
          || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
        const link = item.match(/<link>(https?[^<]+)<\/link>/)?.[1]
          || item.match(/<link\/>(https?[^<]+)/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        if (!title) continue
        deals.push({
          id: 'al-' + Buffer.from(title).toString('base64').slice(0, 8),
          title,
          url: link,
          score: null,
          comments: null,
          created: pubDate ? new Date(pubDate).getTime() : Date.now(),
          flair: 'Ammo',
          source: 'AmmoLand',
          domain: 'ammoland.com',
        })
      }
    }
  } catch {}

  // ── Source 4: Mr. Guns N Gear — Squarespace Commerce product feed ──────────
  try {
    // Squarespace commerce API endpoint (public product data)
    const mggRes = await fetch('https://www.mrgunsngear.com/api/2/products?limit=20&sortBy=createdOn&sortOrder=desc', {
      headers: { 'User-Agent': 'DownRange/2.0', 'Accept': 'application/json' },
      next: { revalidate: 0 },
    })
    if (mggRes.ok) {
      const mggData = await mggRes.json()
      const products = mggData?.products || mggData?.items || []
      for (const p of products.slice(0, 10)) {
        const title = p.title || p.name || p.fullTitle || ''
        const url = `https://www.mrgunsngear.com/shop/${p.urlSlug || p.id || ''}`
        const price = p.variants?.[0]?.priceMoney?.value || p.price || p.defaultPrice || null
        const priceStr = price ? ` — $${(price/100).toFixed(2)}` : ''
        if (!title) continue
        deals.push({
          id: 'mgg-' + (p.id || title.slice(0,8)),
          title: `[Gear] ${title}${priceStr}`,
          url,
          score: null, comments: null,
          created: Date.now() - Math.random() * 86400000,
          flair: 'Gear',
          source: 'Mr. Guns N Gear',
          domain: 'mrgunsngear.com',
          imageUrl: p.mainImage?.url || null,
        })
      }
    }
  } catch {}

  // Always add pinned MrGunsNGear store link
  deals.push({
    id: 'mgg-store',
    title: '🎯 Mr. Guns N Gear Official Store — Tactical Gear, Apparel & Accessories',
    url: 'https://www.mrgunsngear.com/shop/',
    score: null, comments: null,
    created: Date.now(),
    flair: 'Gear',
    source: 'Mr. Guns N Gear',
    domain: 'mrgunsngear.com',
    featured: true,
    pinned: true,
  })

  // Sort: pinned first, then by score desc, then by date
  const pinned  = deals.filter(d => d.pinned)
  const rest    = deals.filter(d => !d.pinned).sort((a, b) => {
    if (b.score !== null && a.score !== null) return b.score - a.score
    return b.created - a.created
  })

  return Response.json({
    deals: [...pinned, ...rest],
    total: deals.length,
    live: deals.filter(d => d.source === 'r/gundeals').length > 0,
    sources: {
      reddit:   deals.filter(d => d.source === 'r/gundeals').length,
      gunDeals: deals.filter(d => d.source === 'gun.deals').length,
      ammoland: deals.filter(d => d.source === 'AmmoLand').length,
      featured: deals.filter(d => d.featured).length,
    }
  })
}
