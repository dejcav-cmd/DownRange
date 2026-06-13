import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

const SEED_RELEASES = [
  { brand:'Glock',              model:'G47 MOS',            category:'Pistol',   caliber:'9mm',       action:'Safe Action',   msrp:599,  isJustDropped:true,  imageUrl:'/img/photos/pistol.jpg', summary:'Full-size duty pistol with optics-ready slide, 17+1 capacity.', sourceUrl:'https://us.glock.com/en/pistols/g47-mos.html' },
  { brand:'SIG Sauer',          model:'P365-XMACRO Comp',   category:'Pistol',   caliber:'9mm',       action:'Striker-Fired', msrp:699,  isJustDropped:true,  imageUrl:'/img/photos/pistol.jpg', summary:'Compensated micro-compact with 17+1 capacity and integrated comp.', sourceUrl:'https://www.sigsauer.com/p365-xmacro-comp.html' },
  { brand:'Smith & Wesson',     model:'M&P15 Sport III',    category:'Rifle',    caliber:'5.56 NATO', action:'Semi-Auto',     msrp:749,  isJustDropped:true,  imageUrl:'/img/photos/rifle.jpg', summary:'Updated MSR with M-LOK handguard standard.', sourceUrl:'https://www.smith-wesson.com/firearms/rifles/mp-15' },
  { brand:'Ruger',              model:'LC Carbine',         category:'Rifle',    caliber:'5.7x28mm',  action:'Semi-Auto',     msrp:829,  isJustDropped:false, imageUrl:'/img/photos/rifle.jpg', summary:'PCC in 5.7x28mm taking FN FiveseveN magazines.', sourceUrl:'https://www.ruger.com/products/lcCarbine/models.html' },
  { brand:'Springfield Armory', model:'Echelon',            category:'Pistol',   caliber:'9mm',       action:'Striker-Fired', msrp:599,  isJustDropped:false, imageUrl:'/img/photos/pistol.jpg', summary:'Full-size with Variable Interface System for direct-mount optics.', sourceUrl:'https://www.springfield-armory.com/echelon-series/' },
  { brand:'Daniel Defense',     model:'DDM4 V7 Pro',        category:'Rifle',    caliber:'5.56 NATO', action:'Semi-Auto',     msrp:2299, isJustDropped:false, imageUrl:'/img/photos/rifle.jpg', summary:'Pro-series with Geissele SSA trigger and Surefire SOCOM brake.', sourceUrl:'https://danieldefense.com/ddm4-v7-pro.html' },
  { brand:'FN America',         model:'FN 15 DMR3',         category:'Rifle',    caliber:'5.56 NATO', action:'Semi-Auto',     msrp:1899, isJustDropped:true,  imageUrl:'/img/photos/rifle.jpg', summary:'Designated marksman rifle with Vortex Viper PST II optic included.', sourceUrl:'https://www.fnamerica.com/products/rifles/fn-15-dmr3/' },
  { brand:'CZ',                 model:'P-10 F Competition', category:'Pistol',   caliber:'9mm',       action:'Striker-Fired', msrp:799,  isJustDropped:false, imageUrl:'/img/photos/pistol.jpg', summary:'Competition-ready with extended mag well, flat trigger, ported barrel.', sourceUrl:'https://cz-usa.com/product/cz-p-10-f-competition-ready/' },
  { brand:'Mossberg',           model:'590S Shockwave',     category:'Shotgun',  caliber:'12 Gauge',  action:'Pump',          msrp:549,  isJustDropped:false, imageUrl:'/img/photos/pistol.jpg', summary:'Multi-caliber pump accepting 1.75in, 2.75in, and 3in shells.', sourceUrl:'https://www.mossberg.com/product/590s-shockwave' },
  { brand:'Kimber',             model:'Rapide Black Ice',   category:'Pistol',   caliber:'9mm',       action:'Single Action', msrp:1599, isJustDropped:false, imageUrl:'/img/photos/pistol.jpg', summary:'1911-platform with KimPro II finish and optics-ready cut.', sourceUrl:'https://www.kimberamerica.com/rapide-black-ice' },
]

async function writeBody(release) {
  const prompt = [
    `Write a detailed firearms product article for the ${release.brand} ${release.model}.`,
    `You are DJ Cavalcanti — a gun owner and 2A advocate in Washington State who carries daily.`,
    '',
    `Brand: ${release.brand} | Model: ${release.model} | Type: ${release.category}`,
    `Caliber: ${release.caliber} | Action: ${release.action} | MSRP: $${release.msrp}`,
    `Summary: ${release.summary}`,
    release.sourceUrl ? `Manufacturer: ${release.sourceUrl}` : '',
    '',
    'Write 600-800 words in HTML (h2, h3, p, ul, li, strong only).',
    'Cover: what it is, key specs, who should buy it, how it stacks against competition, bottom line.',
    'Voice: direct, informed, no fluff. Sound like a gun owner, not a press release.',
    'BANNED: comprehensive, game-changer, cutting-edge, innovative, robust, seamlessly',
    'End with: <p><strong>Bottom Line:</strong> [2 sentences max]</p>',
    'Return HTML only — no markdown, no h1.',
  ].filter(Boolean).join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01', 'content-type':'application/json' },
    body: JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:2000, messages:[{role:'user',content:prompt}] }),
  })
  const d = await res.json()
  return d.content?.[0]?.text?.trim() || null
}

function slug(brand, model) {
  return (brand+'-'+model).toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error:'Unauthorized' }, { status:401 })

  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error:'ANTHROPIC_API_KEY not configured' }, { status:400 })

  const results = []

  for (const r of SEED_RELEASES) {
    try {
      const slugStr = slug(r.brand, r.model)

      // Check if already exists
      const existing = await sanity.fetch(
        '*[_type=="firearmRelease" && slug.current==$s][0]{_id,body}',
        { s: slugStr }
      )

      const body = await writeBody(r)

      if (existing) {
        // Update body if missing
        if (!existing.body && body) {
          await sanity.patch(existing._id).set({ body, imageUrl: r.imageUrl }).commit()
          results.push({ slug:slugStr, status:'updated' })
        } else {
          results.push({ slug:slugStr, status:'skipped' })
        }
      } else {
        await sanity.create({
          _type:      'firearmRelease',
          title:      r.brand + ' ' + r.model,
          slug:       { _type:'slug', current: slugStr },
          brand:      r.brand,
          model:      r.model,
          category:   r.category,
          caliber:    r.caliber,
          action:     r.action,
          msrp:       r.msrp,
          imageUrl:   r.imageUrl,
          sourceUrl:  r.sourceUrl,
          summary:    r.summary,
          body,
          isJustDropped: r.isJustDropped,
          approved:   false,  // require manual approval
          publishedAt: new Date().toISOString(),
        })
        results.push({ slug:slugStr, status:'created' })
      }
    } catch(e) {
      results.push({ slug: r.brand+' '+r.model, status:'failed', error:e.message })
    }
    // Small pause between Claude calls
    await new Promise(res => setTimeout(res, 300))
  }

  const created = results.filter(r=>r.status==='created').length
  const updated = results.filter(r=>r.status==='updated').length
  return Response.json({ ok:true, created, updated, results })
}
