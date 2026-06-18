export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})
const sleep = ms => new Promise(r => setTimeout(r, ms))
const CAT_IMG = { Pistol:'/img/photos/pistol.jpg', Revolver:'/img/photos/pistol.jpg',
                  Rifle:'/img/photos/rifle.jpg', Shotgun:'/img/photos/shotgun.jpg',
                  Suppressor:'/img/photos/suppressor.jpg', default:'/img/photos/pistol.jpg' }

function isAuth(req){
  return req.headers.get('x-admin-key')===process.env.ADMIN_KEY
      || req.headers.get('authorization')===`Bearer ${process.env.ADMIN_KEY}`
}

async function fetchPage(url){
  try{
    const r=await fetch(url,{
      headers:{'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125.0 Safari/537.36'},
      signal:AbortSignal.timeout(10000),redirect:'follow'
    })
    return r.ok?await r.text():null
  } catch{return null}
}

function extractOgImage(html){
  if(!html) return null
  for(const rx of [
    /<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i,
    /<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i,
    /<meta[^>]+name="twitter:image"[^>]+content="([^"]+)"/i,
  ]){
    const m=html.match(rx)
    if(m?.[1]?.startsWith('http')&&!m[1].includes('logo')&&!m[1].includes('icon')&&m[1].length>20)
      return m[1]
  }
  // Also look for large images in content
  const imgRx=/<img[^>]+src="(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"[^>]*(?:width="(\d+)")?/gi
  let best=null,bestW=0; let im
  while((im=imgRx.exec(html))!==null){
    const w=parseInt(im[2]||'0')
    const url=im[1]
    if(url.includes('logo')||url.includes('icon')||url.includes('avatar')) continue
    if(w>bestW){bestW=w;best=url}
    else if(!best&&!url.includes('thumb')) best=url
  }
  return best
}

async function findBingImage(brand, model, category){
  try{
    const q=encodeURIComponent(`${brand} ${model} firearm ${category} official`)
    const html=await fetchPage(`https://www.bing.com/images/search?q=${q}&qft=+filterui:photo-photo&form=IRFLTR`)
    if(!html) return null
    const murl=html.match(/"murl":"(https?:\/\/[^"]+\.(?:jpg|jpeg|png|webp))"/i)
    if(murl?.[1]&&!murl[1].includes('bing')&&!murl[1].includes('microsoft')) return murl[1]
    const imgurl=html.match(/imgurl=([^&"]+\.(?:jpg|jpeg|png|webp))/i)
    if(imgurl?.[1]) return decodeURIComponent(imgurl[1])
  } catch{}
  return null
}

async function processRelease(doc){
  // Try 1: fetch OG image from source URL
  if(doc.sourceUrl){
    const html=await fetchPage(doc.sourceUrl)
    const img=extractOgImage(html)
    if(img&&img.startsWith('http')) return {imageUrl:img,method:'og'}
  }
  // Try 2: search Bing for gun-specific image
  const bingImg=await findBingImage(doc.brand,doc.model,doc.category)
  if(bingImg) return {imageUrl:bingImg,method:'bing'}
  // Try 3: category fallback
  return {imageUrl:CAT_IMG[doc.category]||CAT_IMG.default,method:'fallback'}
}

async function handler(req){
  if(!isAuth(req)) return Response.json({error:'Unauthorized'},{status:401})

  // Get all releases that need image updates
  const docs=await sanity.fetch(
    `*[_type=="firearmRelease"] | order(publishedAt desc) [0...300] {
       _id, brand, model, category, sourceUrl, imageUrl
    }`
  ).catch(()=>[])

  console.log(`[PATCH-IMG] Found ${docs.length} releases`)

  // Filter: only process ones with missing or generic images
  const toProcess=docs.filter(d=>
    !d.imageUrl ||
    d.imageUrl.includes('/img/photos/') ||
    d.imageUrl.includes('unsplash.com') ||
    d.imageUrl.includes('pexels.com')
  )

  console.log(`[PATCH-IMG] ${toProcess.length} need real images`)

  let patched=0, fallback=0, skipped=0, errors=0
  const results=[]

  for(const doc of toProcess){
    const {imageUrl,method}=await processRelease(doc)
    try{
      await sanity.patch(doc._id).set({imageUrl}).commit()
      const label=`${doc.brand} — ${doc.model}`
      if(method==='fallback'){fallback++;console.log(`[IMG:fallback] ${label}`)}
      else{patched++;console.log(`[IMG:${method}] ${label} → ${imageUrl.slice(0,60)}`)}
      results.push({id:doc._id,brand:doc.brand,model:doc.model,method,imageUrl})
    } catch(e){
      errors++
      console.error(`[IMG:err] ${doc.brand} ${doc.model}: ${e.message}`)
    }
    await sleep(500)
  }

  const msg=`patched:${patched} fallback:${fallback} skipped:${skipped} errors:${errors} / ${docs.length} total`
  console.log('[PATCH-IMG] Done:',msg)

  return Response.json({ok:true,patched,fallback,skipped,errors,total:docs.length,message:msg,results})
}

export async function POST(req){return handler(req)}
export async function GET(req){return handler(req)}
