export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN, useCdn: false,
})

// Parse ISO duration to seconds
function isoToSecs(iso = '') {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!m) return 0
  return (parseInt(m[1]||0)*3600)+(parseInt(m[2]||0)*60)+parseInt(m[3]||0)
}

// Scrape gun.deals RSS — the best community-aggregated deals site
async function fetchGunDeals() {
  const res = await fetch('https://gun.deals/feed/syndication/rss', {
    headers: { 'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)' },
    signal: AbortSignal.timeout(12000),
  })
  if (!res.ok) throw new Error('gun.deals returned ' + res.status)
  const xml = await res.text()

  const items = []
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi
  let match
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1]
    const get = (tag) => {
      const m = block.match(new RegExp('<' + tag + '[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/' + tag + '>'))
               || block.match(new RegExp('<' + tag + '[^>]*>([^<]*)<\\/' + tag + '>'))
      return m ? m[1].trim() : ''
    }
    const title = get('title')
    const link  = get('link') || get('guid')
    const desc  = get('description')
    const date  = get('pubDate')
    const price = desc.match(/\$[\d,]+\.?\d*/)?.[0] || ''

    if (!title || !link) continue
    items.push({ title, link, desc, date, price })
  }
  return items
}

function detectCategory(title) {
  const t = title.toLowerCase()
  if (t.includes('ammo') || t.includes('9mm') || t.includes('rounds') || t.includes('.223') || t.includes('5.56') || t.includes('bulk'))
    return 'ammo'
  if (t.includes('ar-15') || t.includes('rifle') || t.includes('ak-47') || t.includes('carbine'))
    return 'rifle'
  if (t.includes('pistol') || t.includes('glock') || t.includes('handgun') || t.includes('sig ') || t.includes('p365') || t.includes('p320'))
    return 'pistol'
  if (t.includes('shotgun') || t.includes('gauge'))
    return 'shotgun'
  if (t.includes('suppressor') || t.includes('silencer'))
    return 'suppressor'
  if (t.includes('optic') || t.includes('scope') || t.includes('red dot') || t.includes('sight'))
    return 'optic'
  if (t.includes('holster') || t.includes('magazine') || t.includes('mag ') || t.includes('parts'))
    return 'accessory'
  return 'deal'
}

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const auth = req.headers.get('authorization')
  const adminKey = req.headers.get('x-admin-key')
  const isCron  = cronSecret && auth === 'Bearer ' + cronSecret
  const isAdmin = adminKey === ADMIN_KEY
  if (!isCron && !isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  const stats = { fetched: 0, added: 0, skipped: 0 }

  try {
    const deals = await fetchGunDeals()
    stats.fetched = deals.length

    // Get existing deal URLs to dedup
    const existing = await sanity.fetch(
      '*[_type == "newsArticle" && source == "gun.deals"] { externalUrl }'
    ).catch(() => [])
    const existingUrls = new Set((existing || []).map(d => d.externalUrl))

    const mutations = []
    for (const deal of deals.slice(0, 40)) {
      if (existingUrls.has(deal.link)) { stats.skipped++; continue }
      mutations.push({
        create: {
          _type:       'newsArticle',
          title:       deal.title,
          summary:     (deal.desc || '').slice(0, 300),
          externalUrl: deal.link,
          source:      'gun.deals',
          category:    detectCategory(deal.title),
          approved:    true,
          published:   true,
          publishedAt: deal.date ? new Date(deal.date).toISOString() : new Date().toISOString(),
          imageUrl:    'https://upload.wikimedia.org/wikipedia/commons/thumb/3/32/Ammo_9mm_Glaser.jpg/1280px-Ammo_9mm_Glaser.jpg',
          tags:        ['deals', 'gun.deals', detectCategory(deal.title)],
          price:       deal.price,
        }
      })
      stats.added++
    }

    if (mutations.length) await sanity.mutate(mutations)

    return NextResponse.json({ ok: true, ms: Date.now() - t0, ...stats })
  } catch (err) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
