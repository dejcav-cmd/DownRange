export const dynamic = 'force-dynamic'
export const revalidate = 0

// ── IMAGE UTILITIES ────────────────────────────────────────────────────────

// Extract product image from Reddit post preview data
function extractRedditImage(post) {
  // Try preview images first (best quality)
  const preview = post.preview?.images?.[0]
  if (preview) {
    // resolutions array gives smaller sizes — use source for full, or largest resolution
    const resolutions = preview.resolutions || []
    if (resolutions.length > 0) {
      // Pick ~640px wide if available
      const mid = resolutions.find(r => r.width >= 400) || resolutions[resolutions.length - 1]
      if (mid?.url) return mid.url.replace(/&amp;/g, '&')
    }
    if (preview.source?.url) return preview.source.url.replace(/&amp;/g, '&')
  }
  // Thumbnail fallback (small but fast)
  const thumb = post.thumbnail
  if (thumb && thumb.startsWith('http')) return thumb
  return null
}

// ── PRICE EXTRACTION ───────────────────────────────────────────────────────

function extractPrice(title) {
  // Match $XX.XX or $X,XXX.XX patterns
  const match = title.match(/\$[\d,]+(?:\.\d{2})?/)
  return match ? match[0] : null
}

// ── FLAIR CATEGORY → DISPLAY ───────────────────────────────────────────────

const FLAIR_META = {
  'Handgun':     { color:'#60A5FA', bg:'#001a2a', icon:'🔫' },
  'Rifle':       { color:'#34D399', bg:'#001a0a', icon:'◈' },
  'Shotgun':     { color:'#FBBF24', bg:'#1a1000', icon:'◉' },
  'Ammo':        { color:'#C8922A', bg:'#1a0800', icon:'◎' },
  'Accessories': { color:'#C084FC', bg:'#0d001a', icon:'◈' },
  'NFA':         { color:'#EF4444', bg:'#1a0000', icon:'◈' },
  'Optic':       { color:'#34D399', bg:'#001a0a', icon:'◎' },
  'Gear':        { color:'#9CA3AF', bg:'#111318', icon:'◈' },
  'Deals':       { color:'#FBBF24', bg:'#1a1000', icon:'◈' },
  'Other':       { color:'#4B5563', bg:'#111318', icon:'◈' },
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const catFilter = searchParams.get('cat') || null
  const sortBy    = searchParams.get('sort') || 'hot'

  const deals = []
  const sources = { reddit: 0, gunDeals: 0, ammoland: 0 }

  // ── Source 1: r/gundeals (hot + new for freshness) ────────────────────────
  const redditUrls = [
    'https://old.reddit.com/r/gundeals/hot.json?limit=50&raw_json=1',
    'https://old.reddit.com/r/gundeals/new.json?limit=25&raw_json=1',
    'https://old.reddit.com/r/ammo/hot.json?limit=20&raw_json=1',
  ]
  for (const url of redditUrls) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'DownRange/2.0 (firearms intelligence platform; contact@downrangeco.com)',
          'Accept': 'application/json',
        },
        next: { revalidate: 0 },
      })
      if (!res.ok) continue
      const data = await res.json()
      const posts = data?.data?.children || []
      for (const { data: p } of posts) {
        if (p.stickied || !p.title || p.score < 5) continue
        if (deals.find(d => d.id === 'r-' + p.id)) continue // dedup

        const imageUrl = extractRedditImage(p)
        const price    = extractPrice(p.title)
        const flair    = p.link_flair_text || 'Other'

        deals.push({
          id:         'r-' + p.id,
          title:      p.title,
          url:        p.url?.startsWith('http') ? p.url : `https://reddit.com${p.permalink}`,
          permalink:  `https://reddit.com${p.permalink}`,
          score:      p.score,
          comments:   p.num_comments,
          created:    p.created_utc * 1000,
          flair,
          flairMeta:  FLAIR_META[flair] || FLAIR_META.Other,
          source:     'r/gundeals',
          domain:     p.domain,
          imageUrl,
          price,
          isNSFW:     p.over_18,
        })
        sources.reddit++
      }
    } catch { /* Reddit unreachable — continue */ }
    if (sources.reddit > 0) break // if hot worked, skip new
  }

  // ── Source 2: gun.deals via RSS proxy ────────────────────────────────────
  // gun.deals uses Cloudflare which blocks direct server fetches.
  // Use rss2json.com as a proxy — free tier, no auth needed, bypasses CF.
  const gunDealsUrls = [
    'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://gun.deals/rss.xml') + '&count=40',
    'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://gun.deals/blog/feed') + '&count=40',
  ]
  for (const gdUrl of gunDealsUrls) {
    try {
      const res = await fetch(gdUrl, {
        headers: { 'User-Agent': 'DownRange/2.0 (contact@downrangeco.com)' },
        next: { revalidate: 0 },
      })
      if (!res.ok) continue
      const json = await res.json()
      // rss2json returns { status:'ok', items:[...] }
      if (json.status === 'ok' && json.items?.length > 0) {
        for (const item of json.items.slice(0, 30)) {
          const title    = item.title || ''
          const link     = item.link || item.guid || ''
          const desc     = item.description || item.content || ''
          const pubDate  = item.pubDate || ''
          const imageUrl = item.enclosure?.link || item.thumbnail || null
          const price    = extractPrice(title) || extractPrice(desc)
          if (!title || !link) continue
          let flair = 'Deals'
          const tl = title.toLowerCase()
          if (tl.includes('handgun')||tl.includes('pistol')||tl.includes('glock')||tl.includes('sig ')) flair='Handgun'
          else if (tl.includes('rifle')||tl.includes('ar-15')||tl.includes('ar15')) flair='Rifle'
          else if (tl.includes('shotgun')||tl.includes('mossberg')) flair='Shotgun'
          else if (tl.includes('ammo')||tl.includes('9mm')||tl.includes('.223')||tl.includes('rounds')) flair='Ammo'
          else if (tl.includes('suppressor')||tl.includes('silencer')||tl.includes('nfa')) flair='NFA'
          else if (tl.includes('scope')||tl.includes('optic')||tl.includes('red dot')) flair='Optic'
          else if (tl.includes('holster')||tl.includes('magazine')||tl.includes('pmag')) flair='Accessories'
          deals.push({ id:'gd-'+Buffer.from(link).toString('base64').slice(0,10), title, url:link, permalink:link, score:null, comments:null, created:pubDate?new Date(pubDate).getTime():Date.now(), flair, flairMeta:FLAIR_META[flair]||FLAIR_META.Deals, source:'gun.deals', domain:'gun.deals', imageUrl, price })
          sources.gunDeals++
        }
        if (sources.gunDeals > 0) break
      }
      // Fallback: try parsing as XML if JSON failed
      const xml = ''
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []

      for (const item of items.slice(0, 30)) {
        const title   = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                      || item.match(/<title>(.*?)<\/title>/)?.[1] || '').trim()
        const link    = (item.match(/<link>(https?[^<]+)<\/link>/)?.[1]
                      || item.match(/<feedburner:origLink>(https?[^<]+)<\/feedburner:origLink>/)?.[1] || '').trim()
        const desc    = item.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1] || ''
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        const encImg  = item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] || null
        // Try to extract image from description HTML
        const descImg = desc.match(/<img[^>]+src="([^"]+)"/)?.[1] || null
        const imageUrl = encImg || descImg || null
        const price   = extractPrice(title) || extractPrice(desc)

        if (!title || !link) continue

        // Infer flair from title keywords
        let flair = 'Deals'
        const tl = title.toLowerCase()
        if (tl.includes('handgun') || tl.includes('pistol') || tl.includes('glock') || tl.includes('sig ') || tl.includes('beretta')) flair = 'Handgun'
        else if (tl.includes('rifle') || tl.includes('ar-15') || tl.includes('ar15') || tl.includes('ak-') || tl.includes(' sbr')) flair = 'Rifle'
        else if (tl.includes('shotgun') || tl.includes('mossberg') || tl.includes('remington 870')) flair = 'Shotgun'
        else if (tl.includes('ammo') || tl.includes('9mm') || tl.includes('.223') || tl.includes('.308') || tl.includes(' gr ') || tl.includes(' gr,') || tl.includes('rounds')) flair = 'Ammo'
        else if (tl.includes('suppressor') || tl.includes('silencer') || tl.includes(' nfa') || tl.includes('form 4')) flair = 'NFA'
        else if (tl.includes('scope') || tl.includes('optic') || tl.includes('red dot') || tl.includes('lpvo') || tl.includes('vortex') || tl.includes('leupold')) flair = 'Optic'
        else if (tl.includes('holster') || tl.includes('magazine') || tl.includes('pmag') || tl.includes('light') || tl.includes('streamlight')) flair = 'Accessories'

        deals.push({
          id:        'gd-' + Buffer.from(link).toString('base64').slice(0, 10),
          title,
          url:       link,
          permalink: link,
          score:     null,
          comments:  null,
          created:   pubDate ? new Date(pubDate).getTime() : Date.now(),
          flair,
          flairMeta: FLAIR_META[flair] || FLAIR_META.Deals,
          source:    'gun.deals',
          domain:    'gun.deals',
          imageUrl,
          price,
        })
        sources.gunDeals++
      }
      if (sources.gunDeals > 0) break
    } catch { /* gun.deals unreachable */ }
  }

  // ── Source 3: AmmoLand (deals category) ────────────────────────────────────
  try {
    const res = await fetch('https://www.ammoland.com/feed/', {
      headers: { 'User-Agent': 'DownRange/2.0 (contact@downrangeco.com)' },
      next: { revalidate: 0 },
    })
    if (res.ok) {
      const xml = await res.text()
      const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
      for (const item of items.slice(0, 15)) {
        const title   = (item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1]
                      || item.match(/<title>(.*?)<\/title>/)?.[1] || '').trim()
        const link    = (item.match(/<link>(https?[^<]+)<\/link>/)?.[1] || '').trim()
        const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
        const imgUrl  = item.match(/<media:content[^>]+url="([^"]+)"/)?.[1]
                      || item.match(/<enclosure[^>]+url="([^"]+)"/)?.[1] || null
        const price   = extractPrice(title)
        if (!title || !link) continue

        let flair = 'Ammo'
        const tl = title.toLowerCase()
        if (tl.includes('deal') || tl.includes('sale') || tl.includes('discount')) flair = 'Deals'
        else if (tl.includes('handgun') || tl.includes('pistol')) flair = 'Handgun'
        else if (tl.includes('rifle')) flair = 'Rifle'
        else if (tl.includes('accessories') || tl.includes('gear')) flair = 'Accessories'

        deals.push({
          id:        'al-' + Buffer.from(title).toString('base64').slice(0, 10),
          title,
          url:       link,
          permalink: link,
          score:     null,
          comments:  null,
          created:   pubDate ? new Date(pubDate).getTime() : Date.now(),
          flair,
          flairMeta: FLAIR_META[flair] || FLAIR_META.Ammo,
          source:    'AmmoLand',
          domain:    'ammoland.com',
          imageUrl:  imgUrl,
          price,
        })
        sources.ammoland++
      }
    }
  } catch { /* AmmoLand unreachable */ }

  // ── Sort ───────────────────────────────────────────────────────────────────
  let sorted
  if (sortBy === 'new') {
    sorted = deals.sort((a, b) => b.created - a.created)
  } else {
    // hot: Reddit score wins, null-score items sorted by date after
    sorted = deals.sort((a, b) => {
      if (a.score !== null && b.score !== null) return b.score - a.score
      if (a.score !== null) return -1
      if (b.score !== null) return 1
      return b.created - a.created
    })
  }

  // ── Filter by category ────────────────────────────────────────────────────
  const filtered = catFilter ? sorted.filter(d => d.flair === catFilter) : sorted

  const live = sources.reddit > 0 || sources.gunDeals > 0

  return Response.json({
    deals: filtered,
    total: filtered.length,
    live,
    sources,
    cached: false,
    ts: Date.now(),
  })
}
