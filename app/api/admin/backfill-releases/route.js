export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import crypto from 'crypto'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── 41 MANUFACTURER SOURCES ───────────────────────────────────────────────────
const SOURCES = [
  { brand: 'Smith & Wesson',      url: 'https://www.smith-wesson.com/products/new' },
  { brand: 'Ruger',               url: 'https://ruger.com/micros/newProducts/' },
  { brand: 'SIG Sauer',           url: 'https://www.sigsauer.com/blog/category/company-news' },
  { brand: 'Springfield Armory',  url: 'https://www.springfield-armory.com/intel/press-releases/' },
  { brand: 'Savage Arms',         url: 'https://savagearms.com/news' },
  { brand: 'Mossberg',            url: 'https://www.mossberg.com/corporate/press-releases' },
  { brand: 'FN America',          url: 'https://fnamerica.com/press-releases/' },
  { brand: 'Benelli USA',         url: 'https://www.benelliusa.com/resources/press-releases' },
  { brand: 'Browning',            url: 'https://www.browning.com/news/articles.html' },
  { brand: 'Palmetto State Armory', url: 'https://palmettostatearmory.com/blog/category/product-releases.html' },
  { brand: 'KelTec',              url: 'https://www.keltecweapons.com/blog/' },
  { brand: 'Winchester',          url: 'https://www.winchesterguns.com/news/articles.html' },
  { brand: 'Colt',                url: 'https://www.colt.com/category/colt-news/' },
  { brand: 'Glock',               url: 'https://us.glock.com/en/press-release' },
  { brand: 'CZ-USA',              url: 'https://cz-usa.com/' },
  { brand: 'Daniel Defense',      url: 'https://danieldefense.com/blog/' },
  { brand: 'Kimber',              url: 'https://www.kimberamerica.com/press' },
  { brand: 'Walther',             url: 'https://waltherarms.com/blog/' },
  { brand: 'Beretta',             url: 'https://www.beretta.com/en-us/news' },
  { brand: 'Canik',               url: 'https://www.canikusa.com/news' },
  { brand: 'Taurus',              url: 'https://www.taurususa.com/blog' },
  { brand: 'Henry Repeating',     url: 'https://www.henryusa.com/news/' },
  { brand: 'Weatherby',           url: 'https://weatherby.com/news/' },
  { brand: 'Christensen Arms',    url: 'https://christensenarms.com/blog/' },
  { brand: 'Bergara',             url: 'https://www.bergara.online/us/' },
  { brand: 'Tikka',               url: 'https://choose.tikka.fi/usa/news' },
  { brand: 'Staccato',            url: 'https://staccato2011.com/shop/new-arrivals' },
  { brand: 'Wilson Combat',       url: 'https://wilsoncombat.com/news/' },
  { brand: 'Shadow Systems',      url: 'https://shadowsystemscorp.com/category/press-release/' },
  { brand: 'IWI US',              url: 'https://iwi.us/news/' },
  { brand: 'Aero Precision',      url: 'https://www.aeroprecisionusa.com/blog' },
  { brand: 'Fusion Firearms',     url: 'https://fusionfirearms.com/videovault/category/announcements' },
  { brand: null, rss:true, label:'TTAG',       url: 'https://www.thetruthaboutguns.com/feed/' },
  { brand: null, rss:true, label:'AmmoLand',   url: 'https://www.ammoland.com/feed/' },
  { brand: null, rss:true, label:'Guns.com',   url: 'https://www.guns.com/feed' },
  { brand: null, rss:true, label:'G&A',        url: 'https://www.gunsandammo.com/feed/' },
  { brand: null, rss:true, label:'AmRifleman', url: 'https://www.americanrifleman.org/feed/' },
  { brand: null, rss:true, label:'PPT',        url: 'https://www.pewpewtactical.com/feed/' },
  { brand: null, rss:true, label:'SI',         url: 'https://www.shootingillustrated.com/feed/' },
]

// ── ONLY BLOCK OBVIOUS JUNK — let AI decide the rest ─────────────────────────
// These patterns NEVER appear in real gun product announcements
const HARD_EXCLUDE = [
  'daily deal', 'flash deal', 'deal of the day',
  'blemished', ' blem-',
  'rifle kit', 'pistol kit', 'build kit', 'lower parts kit', 'upper parts kit',
  'stripped lower', 'stripped upper', 'complete upper receiver',
  't-shirt', 'hoodie', 'apparel collection',
  'horoscope', 'astrology', 'zodiac',
  'earnings report', 'quarterly results',
]

// RSS sources need at least one of these to be gun-related
const GUN_SIGNALS = [
  'pistol','rifle','shotgun','revolver','firearm','handgun','carbine',
  'announces','introduces','launches','unveiled','new model','now available',
  'now shipping','1911','ar-15','ak-47','bolt-action','semi-auto',
]

const SKIP_URLS = ['/about','/contact','/careers','/privacy','/terms','/cart','/account','/warranty']
const CAT_IMG   = { Pistol:'/img/photos/pistol.jpg', Revolver:'/img/photos/pistol.jpg',
                    Rifle:'/img/photos/rifle.jpg', Shotgun:'/img/photos/shotgun.jpg',
                    Suppressor:'/img/photos/suppressor.jpg', default:'/img/photos/pistol.jpg' }

// ── HTTP FETCH ─────────────────────────────────────────────────────────────────
async function get(url, timeout=12000) {
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      signal: AbortSignal.timeout(timeout),
      redirect: 'follow',
    })
    return r.ok ? await r.text() : null
  } catch { return null }
}

// ── RSS PARSE ──────────────────────────────────────────────────────────────────
function parseRSS(xml) {
  const items=[]; const rx=/<item[^>]*>([\s\S]*?)<\/item>/gi; let m
  while((m=rx.exec(xml))!==null){
    const b=m[1]
    const get=(p)=>(b.match(p)||[])[1]?.trim()||''
    const title   = get(/<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/)
    const link    = get(/<link[^>]*>([\s\S]*?)<\/link>/) || get(/<guid[^>]*>(https?[^<]+)<\/guid>/)
    const desc    = get(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/)
                    .replace(/<[^>]+>/g,'').slice(0,600)
    const pubDate = get(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/)
    if(title && link) items.push({title,link,desc,pubDate})
  }
  return items
}

// ── EXTRACT LINKS FROM HTML PAGE ───────────────────────────────────────────────
function extractLinks(html, baseUrl) {
  try {
    const base=new URL(baseUrl); const seen=new Set(); const links=[]
    const rx=/<a[^>]+href=["']([^"'#][^"']*?)["'][^>]*>/gi; let m
    while((m=rx.exec(html))!==null){
      const href=m[1]?.trim()
      if(!href||href.startsWith('javascript')||href.startsWith('mailto')) continue
      try {
        const abs=href.startsWith('http')?href:new URL(href,base).href
        // Same domain (handles www. vs non-www)
        const absHost=new URL(abs).hostname.replace(/^www\./,'')
        const baseHost=base.hostname.replace(/^www\./,'')
        if(!absHost.includes(baseHost)&&!baseHost.includes(absHost)) continue
        if(abs===baseUrl||abs===baseUrl+'/') continue
        if(SKIP_URLS.some(s=>abs.toLowerCase().includes(s))) continue
        if(/\.(pdf|zip|jpg|jpeg|png|gif|svg|css|js|ico|woff|mp4|webp)$/i.test(abs)) continue
        if(!seen.has(abs)){ seen.add(abs); links.push(abs) }
      } catch {}
    }
    return links.slice(0,60)
  } catch { return [] }
}

// ── FIND NEXT PAGE ─────────────────────────────────────────────────────────────
function findNextPage(html, currentUrl) {
  try {
    const base=new URL(currentUrl)
    for(const rx of [
      /<a[^>]+href="([^"]+)"[^>]*>\s*(?:Next|next|›|»|→|Older)[^<]*<\/a>/i,
      /<a[^>]+rel="next"[^>]*href="([^"]+)"/i,
      /<a[^>]+href="([^"]+)"[^>]*rel="next"/i,
    ]){
      const m=html.match(rx)
      if(m?.[1]){
        const next=m[1].startsWith('http')?m[1]:new URL(m[1],base).href
        if(next!==currentUrl) return next
      }
    }
  } catch {}
  return null
}

// ── EXTRACT OG IMAGE ───────────────────────────────────────────────────────────
function extractOgImage(html) {
  if(!html) return null
  for(const rx of [
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
    /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
    /<meta[^>]+content="([^"]+)"[^>]+name="twitter:image"/i,
  ]){
    const m=html.match(rx)
    if(m?.[1]?.startsWith('http')&&!m[1].includes('logo')&&!m[1].includes('icon')&&m[1].length>20)
      return m[1]
  }
  return null
}

// ── SEARCH FOR GUN IMAGE via Bing ──────────────────────────────────────────────
async function findGunImage(brand, model, category) {
  // Try manufacturer website direct search first
  const searchUrl = `https://www.bing.com/images/search?q=${encodeURIComponent(`${brand} ${model} ${category} official product photo`)}&mkt=en-US&qft=+filterui:photo-photo`
  try {
    const html = await get(searchUrl, 8000)
    if(!html) return null
    // Extract first image URL from Bing results
    const patterns = [
      /"murl":"([^"]+\.(?:jpg|jpeg|png|webp))"/gi,
      /imgurl=([^&"]+\.(?:jpg|jpeg|png|webp))/gi,
    ]
    for(const rx of patterns){
      const m=rx.exec(html)
      if(m?.[1]){
        const url=decodeURIComponent(m[1])
        if(url.startsWith('http')&&!url.includes('bing.com')&&!url.includes('gstatic')) return url
      }
    }
  } catch {}
  
  // Try direct manufacturer CDN patterns
  const brandSlug=brand.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
  const modelSlug=model.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,'')
  const mfrAttempts=[
    `https://us.glock.com/content/dam/glock/global/products/${modelSlug.replace(/-/g,'')}.jpg`,
    `https://www.sigsauer.com/media/catalog/product/${modelSlug}.jpg`,
    `https://www.smith-wesson.com/media/catalog/product/${modelSlug}.jpg`,
    `https://fnamerica.com/content/uploads/${modelSlug}.jpg`,
    `https://www.ruger.com/files/productImages/${modelSlug}.jpg`,
  ]
  for(const url of mfrAttempts){
    try{
      const r=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(3000)})
      if(r.ok) return url
    } catch {}
  }
  return null
}

// ── AI: EXTRACT PRODUCT DATA ───────────────────────────────────────────────────
async function aiExtract(title, text, url, brand) {
  if(!process.env.ANTHROPIC_API_KEY) return null
  const prompt=`You are a firearms intelligence editor for DownRange Co. Analyze this content.

SOURCE URL: ${url}
MANUFACTURER HINT: ${brand||'unknown'}
TITLE: ${title}
CONTENT: ${text.slice(0,3000)}

YOUR JOB: Extract ANY new firearm product announcement — pistol, rifle, shotgun, revolver, or suppressor.

BE LIBERAL: Accept product announcements, new model reveals, spec releases, availability notices.
BE STRICT only about: deal/sale posts, pure accessory announcements (no firearm), apparel, financial news.

If this mentions a specific firearm model being newly released or announced, extract it.
If you are UNSURE whether it's new, still extract it (we can review later).
Only return skip:true if it is CLEARLY not about a specific firearm product.

Return ONLY valid JSON (no markdown):
{
  "brand": "Exact manufacturer name",
  "model": "Exact model name/designation only (SHORT — under 6 words)",
  "category": "Pistol|Rifle|Shotgun|Revolver|Suppressor",
  "caliber": "e.g. 9mm, .308 Win, 12 Gauge — or null",
  "action": "Semi-Auto|Bolt-Action|Pump|Lever-Action|Revolver|Single-Shot — or null",
  "msrp": 0,
  "summary": "2-3 sentences. What makes this gun notable? Who should buy it?",
  "body": "<h2>Overview</h2><p>...</p><h2>Key Features</h2><p>...</p><h2>Specs & Availability</h2><p>...</p><h2>Bottom Line</h2><p>...</p>",
  "specs": [{"label":"Barrel Length","value":"4 in"},{"label":"Overall Length","value":"7.5 in"},{"label":"Weight","value":"25 oz"},{"label":"Capacity","value":"15+1"}],
  "imageSearchQuery": "${brand||''} [model] [category] product photo",
  "skip": false
}`
  try{
    const res=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json','x-api-key':process.env.ANTHROPIC_API_KEY,'anthropic-version':'2023-06-01'},
      body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:1500,messages:[{role:'user',content:prompt}]}),
      signal:AbortSignal.timeout(30000),
    })
    const data=await res.json()
    const raw=data.content?.[0]?.text||''
    const clean=raw.replace(/^```[a-z]*\s*/i,'').replace(/\s*```\s*$/i,'').trim()
    if(!clean) return null
    const parsed=JSON.parse(clean)
    if(parsed.skip) return null
    if(!parsed.brand||!parsed.model) return null
    // Validate model isn't a news headline
    const modelWords=parsed.model.split(/\s+/).length
    if(modelWords>7) return null
    return parsed
  } catch(e){ console.error('[AI]',e.message); return null }
}

// ── SAVE TO SANITY ─────────────────────────────────────────────────────────────
async function saveRelease(ext, sourceUrl, imageUrl, pubDate) {
  const eightMonthsAgo=new Date(Date.now()-240*24*60*60*1000)
  const slug=`${ext.brand}-${ext.model}`.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,90)
  const _id='release-'+crypto.createHash('md5').update(`${ext.brand}::${ext.model}`.toLowerCase()).digest('hex').slice(0,12)
  return sanity.createOrReplace({
    _id, _type:'firearmRelease',
    title:`${ext.brand} ${ext.model}`.slice(0,100),
    slug:{_type:'slug',current:slug},
    brand:ext.brand, model:ext.model,
    category:ext.category||'Rifle',
    caliber:ext.caliber||null, action:ext.action||null,
    msrp:typeof ext.msrp==='number'?ext.msrp:0,
    summary:ext.summary||'',
    body:ext.body||null,
    imageUrl: imageUrl||CAT_IMG[ext.category]||CAT_IMG.default,
    specs:(ext.specs||[]).map(s=>({_type:'object',_key:s.label.toLowerCase().replace(/\s+/g,'-'),label:s.label,value:s.value})),
    sourceUrl,
    isJustDropped:true, approved:true, qualityReviewed:true,
    publishedAt:(pubDate&&pubDate>eightMonthsAgo)?pubDate.toISOString():new Date().toISOString(),
  })
}

// ── AUTH ───────────────────────────────────────────────────────────────────────
function isAuth(req){
  return req.headers.get('x-admin-key')===process.env.ADMIN_KEY
      || req.headers.get('authorization')===`Bearer ${process.env.ADMIN_KEY}`
      || req.headers.get('x-vercel-cron')==='1'
}

// ── MAIN ───────────────────────────────────────────────────────────────────────
export async function GET(req) {
  if(!isAuth(req)) return Response.json({error:'Unauthorized'},{status:401})

  const { searchParams }=new URL(req.url)
  const offset    =parseInt(searchParams.get('offset')||'0')
  const batchSize =parseInt(searchParams.get('batch')||String(SOURCES.length))
  const sourceBatch=SOURCES.slice(offset,offset+batchSize)

  const t0=Date.now()
  const stats={created:0,skipped:0,failed:0,saved:[],errors:[],
    skipFetch:0,skipFilter:0,skipAI:0,skipDupe:0,sourceLog:[]}
  const seenKeys=new Set()

  const existing=await sanity.fetch(`*[_type=="firearmRelease"]{brand,model}`).catch(()=>[])
  const existingKeys=new Set(existing.map(d=>`${d.brand}::${d.model}`.toLowerCase()))
  console.log(`[BACKFILL] offset=${offset} sources=${sourceBatch.length} existing=${existingKeys.size} AI=${!!process.env.ANTHROPIC_API_KEY}`)

  for(const source of sourceBatch){
    if(stats.created>=300) break
    const label=source.brand||source.label||'?'
    const html=await get(source.url)
    if(!html){ console.log(`[${label}] fetch failed`); stats.sourceLog.push(`${label}: ✗ fetch`); continue }

    let candidates=[]

    if(source.rss){
      const items=parseRSS(html)
      for(const item of items){
        const t=`${item.title} ${item.desc}`.toLowerCase()
        if(HARD_EXCLUDE.some(k=>t.includes(k))) continue
        if(!GUN_SIGNALS.some(k=>t.includes(k))) continue
        candidates.push({title:item.title,url:item.link,desc:item.desc,pubDate:item.pubDate})
      }
      console.log(`[${label}] RSS: ${candidates.length}/${items.length}`)
      stats.sourceLog.push(`${label}: ${candidates.length}/${items.length} RSS`)
    } else {
      // Paginate manufacturer pages up to 5 pages
      let pageUrl=source.url, pageNum=0
      const seenLinks=new Set()
      while(pageUrl&&pageNum<5){
        const ph=pageNum===0?html:await get(pageUrl)
        if(!ph) break
        pageNum++
        const links=extractLinks(ph,source.url)
        let added=0
        for(const link of links){
          if(!seenLinks.has(link)){
            seenLinks.add(link)
            candidates.push({title:link.split('/').pop().replace(/-/g,' '),url:link,brand:source.brand})
            added++
          }
        }
        if(added>0) console.log(`[${label}] p${pageNum}: +${added} links`)
        const next=findNextPage(ph,pageUrl)
        pageUrl=(next&&next!==source.url)?next:null
        if(pageUrl) await sleep(400)
      }
      console.log(`[${label}] ${candidates.length} links (${pageNum}p)`)
      stats.sourceLog.push(`${label}: ${candidates.length}/${pageNum}p`)
    }

    let srcCreated=0
    const eightMonthsAgo=new Date(Date.now()-240*24*60*60*1000)

    for(const cand of candidates.slice(0,40)){
      if(stats.created>=300) break

      // Fetch article page
      const aHtml=await get(cand.url)
      if(!aHtml){ stats.skipped++;stats.skipFetch++;continue }

      // Get OG title
      const ogTitle=
        (aHtml.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i)||[])[1]||
        (aHtml.match(/<title[^>]*>([^<]+)/i)||[])[1]?.split(/[|\-–]/)[0]?.trim()||
        cand.title

      // Get publish date
      const pubRaw=
        (aHtml.match(/<meta[^>]+property="article:published_time"[^>]+content="([^"]+)"/i)||[])[1]||
        (aHtml.match(/<time[^>]+datetime="([^"]+)"/i)||[])[1]||
        (aHtml.match(/"datePublished"\s*:\s*"([^"]+)"/i)||[])[1]||
        cand.pubDate||null
      const pubDate=pubRaw?new Date(pubRaw):null
      if(pubDate&&!isNaN(pubDate)&&pubDate<eightMonthsAgo){
        stats.skipped++;stats.skipFilter++
        console.log(`[SKIP:old] ${ogTitle.slice(0,50)} (${pubDate.toISOString().slice(0,10)})`)
        continue
      }

      // Hard exclude check on title only
      if(HARD_EXCLUDE.some(k=>ogTitle.toLowerCase().includes(k))){
        stats.skipped++;stats.skipFilter++;continue
      }

      // Clean article text for AI
      const aText=aHtml
        .replace(/<script[\s\S]*?<\/script>/gi,'')
        .replace(/<style[\s\S]*?<\/style>/gi,'')
        .replace(/<nav[\s\S]*?<\/nav>/gi,'')
        .replace(/<footer[\s\S]*?<\/footer>/gi,'')
        .replace(/<header[\s\S]*?<\/header>/gi,'')
        .replace(/<[^>]+>/g,' ')
        .replace(/\s+/g,' ').trim()

      // AI extract
      const ext=await aiExtract(ogTitle,aText,cand.url,cand.brand||source.brand)
      if(!ext){
        console.log(`[SKIP:AI] ${ogTitle.slice(0,60)}`)
        stats.skipped++;stats.skipAI++;await sleep(150);continue
      }

      // Dedup
      const key=`${ext.brand}::${ext.model}`.toLowerCase()
      if(seenKeys.has(key)||existingKeys.has(key)){
        console.log(`[SKIP:dupe] ${ext.brand} — ${ext.model}`)
        stats.skipped++;stats.skipDupe++;continue
      }
      seenKeys.add(key);existingKeys.add(key)

      // ── IMAGE STRATEGY ──────────────────────────────────────────────────────
      // 1. OG image from article
      let imageUrl=extractOgImage(aHtml)

      // 2. If no OG image or looks like a generic site image, search for gun-specific image
      if(!imageUrl||imageUrl.includes('logo')||imageUrl.includes('default')){
        const searchQuery=ext.imageSearchQuery||`${ext.brand} ${ext.model} ${ext.category}`
        imageUrl=await findGunImage(ext.brand,ext.model,ext.category)||null
      }

      // 3. Category fallback (self-hosted)
      if(!imageUrl) imageUrl=CAT_IMG[ext.category]||CAT_IMG.default

      // Save
      try{
        await saveRelease(ext,cand.url,imageUrl,pubDate)
        stats.created++;srcCreated++
        stats.saved.push(`${ext.brand} — ${ext.model}`)
        console.log(`[SAVED ✓] [${stats.created}] ${ext.brand} — ${ext.model} (${ext.category}) img:${imageUrl.slice(0,50)}`)
      } catch(e){
        stats.failed++
        stats.errors.push(`${ext.brand} ${ext.model}: ${e.message}`)
        console.error(`[ERR] ${e.message}`)
      }
      await sleep(600)
    }
    if(srcCreated>0) console.log(`[${label}] ✓ ${srcCreated} saved`)
    await sleep(300)
  }

  const ms=Date.now()-t0
  const details=[
    `created:${stats.created} skipped:${stats.skipped} failed:${stats.failed} (${ms}ms)`,
    `skips→ fetch:${stats.skipFetch} filter:${stats.skipFilter} AI:${stats.skipAI} dupe:${stats.skipDupe}`,
    stats.saved.length?`saved: `+stats.saved.slice(0,15).join(', '):'none saved',
  ].join(' | ')

  console.log('[BACKFILL]',details)
  await reportCronRun('backfill-releases',{status:'success',ms,details}).catch(()=>{})

  const nextOffset=offset+batchSize
  return Response.json({
    ok:true,created:stats.created,skipped:stats.skipped,failed:stats.failed,
    saved:stats.saved,errors:stats.errors,ms,
    skipBreakdown:{fetch:stats.skipFetch,filter:stats.skipFilter,ai:stats.skipAI,dupe:stats.skipDupe},
    sourceLog:stats.sourceLog,details,
    pagination:{offset,nextOffset:nextOffset<SOURCES.length?nextOffset:null,totalSources:SOURCES.length},
  })
}
export async function POST(req){return GET(req)}
