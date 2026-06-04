export const dynamic  = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { callAIText }   from '../../../../lib/aiClient.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const key = req.headers.get('x-admin-key')
  const cron = req.headers.get('authorization')
  return key === process.env.ADMIN_KEY || cron === 'Bearer ' + process.env.CRON_SECRET
}

// All 50 states with core data for AI prompt context
const STATES = [
  { abbr:'AL', name:'Alabama',        cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'AK', name:'Alaska',         cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'AZ', name:'Arizona',        cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'AR', name:'Arkansas',       cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'CA', name:'California',     cc:false, redFlag:true,  magLimit:10,    waitDays:10, awb:true,  rating:'F' },
  { abbr:'CO', name:'Colorado',       cc:false, redFlag:true,  magLimit:15,    waitDays:3,  awb:false, rating:'C' },
  { abbr:'CT', name:'Connecticut',    cc:false, redFlag:true,  magLimit:10,    waitDays:14, awb:true,  rating:'D' },
  { abbr:'DE', name:'Delaware',       cc:false, redFlag:true,  magLimit:17,    waitDays:0,  awb:false, rating:'C-' },
  { abbr:'FL', name:'Florida',        cc:true,  redFlag:true,  magLimit:null,  waitDays:3,  awb:false, rating:'B+' },
  { abbr:'GA', name:'Georgia',        cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'HI', name:'Hawaii',         cc:false, redFlag:true,  magLimit:10,    waitDays:14, awb:false, rating:'F' },
  { abbr:'ID', name:'Idaho',          cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'IL', name:'Illinois',       cc:false, redFlag:true,  magLimit:null,  waitDays:72, awb:true,  rating:'D+' },
  { abbr:'IN', name:'Indiana',        cc:true,  redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'B+' },
  { abbr:'IA', name:'Iowa',           cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A-' },
  { abbr:'KS', name:'Kansas',         cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'KY', name:'Kentucky',       cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'LA', name:'Louisiana',      cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'ME', name:'Maine',          cc:true,  redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'B+' },
  { abbr:'MD', name:'Maryland',       cc:false, redFlag:true,  magLimit:10,    waitDays:7,  awb:true,  rating:'D-' },
  { abbr:'MA', name:'Massachusetts',  cc:false, redFlag:true,  magLimit:10,    waitDays:7,  awb:true,  rating:'F' },
  { abbr:'MI', name:'Michigan',       cc:false, redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'C+' },
  { abbr:'MN', name:'Minnesota',      cc:false, redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'C' },
  { abbr:'MS', name:'Mississippi',    cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'MO', name:'Missouri',       cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'MT', name:'Montana',        cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'NE', name:'Nebraska',       cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'B+' },
  { abbr:'NV', name:'Nevada',         cc:false, redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'C' },
  { abbr:'NH', name:'New Hampshire',  cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'NJ', name:'New Jersey',     cc:false, redFlag:true,  magLimit:10,    waitDays:0,  awb:true,  rating:'F' },
  { abbr:'NM', name:'New Mexico',     cc:false, redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'C' },
  { abbr:'NY', name:'New York',       cc:false, redFlag:true,  magLimit:10,    waitDays:0,  awb:true,  rating:'F' },
  { abbr:'NC', name:'North Carolina', cc:false, redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'B-' },
  { abbr:'ND', name:'North Dakota',   cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'OH', name:'Ohio',           cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'OK', name:'Oklahoma',       cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'OR', name:'Oregon',         cc:false, redFlag:true,  magLimit:10,    waitDays:0,  awb:false, rating:'D' },
  { abbr:'PA', name:'Pennsylvania',   cc:false, redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'B-' },
  { abbr:'RI', name:'Rhode Island',   cc:false, redFlag:true,  magLimit:10,    waitDays:7,  awb:false, rating:'D' },
  { abbr:'SC', name:'South Carolina', cc:false, redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'B+' },
  { abbr:'SD', name:'South Dakota',   cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'TN', name:'Tennessee',      cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'TX', name:'Texas',          cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A' },
  { abbr:'UT', name:'Utah',           cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'VT', name:'Vermont',        cc:true,  redFlag:true,  magLimit:10,    waitDays:0,  awb:false, rating:'B' },
  { abbr:'VA', name:'Virginia',       cc:false, redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'C' },
  { abbr:'WA', name:'Washington',     cc:false, redFlag:true,  magLimit:10,    waitDays:10, awb:true,  rating:'D' },
  { abbr:'WV', name:'West Virginia',  cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
  { abbr:'WI', name:'Wisconsin',      cc:false, redFlag:true,  magLimit:null,  waitDays:0,  awb:false, rating:'C+' },
  { abbr:'WY', name:'Wyoming',        cc:true,  redFlag:false, magLimit:null,  waitDays:0,  awb:false, rating:'A+' },
]

async function generateStateContent(state) {
  const prompt = `Write a comprehensive, factual 600-word guide to firearms laws in ${state.name} for gun owners and people considering moving there.

State facts to work with:
- Constitutional carry: ${state.cc ? 'YES — no permit needed' : 'NO — permit required'}
- Red flag law (ERPO): ${state.redFlag ? 'YES' : 'NO'}
- Magazine limit: ${state.magLimit ? `${state.magLimit} rounds max` : 'None'}
- Handgun purchase wait period: ${state.waitDays ? `${state.waitDays} days` : 'None'}
- Assault weapon ban: ${state.awb ? 'YES' : 'NO'}
- DownRange 2A rating: ${state.rating}

Structure with these exact 4 HTML h2 headings:
<h2>Concealed Carry Laws in ${state.name}</h2>
<h2>Firearm Purchase and Transfer Rules</h2>
<h2>Restrictions and Prohibited Items</h2>
<h2>${state.name} Self-Defense and Castle Doctrine</h2>

Write factually. Each section 2-3 paragraphs. Mention the NFA (National Firearms Act) applies federally for suppressors and SBRs. Note that laws change and readers should verify current statutes. Tone: informative, second-amendment friendly, written for everyday gun owners.

Return only HTML paragraphs and h2 tags. No intro text, no markdown, no code fences.`

  const html = await callAIText({ prompt, useCase: 'blog', maxTokens: 900 })
  // Strip any accidental markdown fences
  return html.replace(/```html?/g, '').replace(/```/g, '').trim()
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url     = new URL(req.url)
  const batchSz = parseInt(url.searchParams.get('batch') || '5')
  const onlyAbbr = url.searchParams.get('state') // optionally run single state

  // Find which states already have enriched content in Sanity
  const existing = await sanity.fetch(
    `*[_type == "stateProfile" && defined(richContent) && richContent != ""][].abbr`
  ).catch(() => [])
  const existingSet = new Set(existing.map(a => a?.toUpperCase()))

  let targets = STATES.filter(s => !existingSet.has(s.abbr))
  if (onlyAbbr) targets = STATES.filter(s => s.abbr === onlyAbbr.toUpperCase())
  targets = targets.slice(0, batchSz)

  if (targets.length === 0) {
    return Response.json({ ok: true, message: 'All states already enriched', total: STATES.length, enriched: existing.length })
  }

  const results = []
  for (const state of targets) {
    try {
      const richContent = await generateStateContent(state)
      if (!richContent || richContent.length < 200) {
        results.push({ abbr: state.abbr, status: 'skipped', reason: 'short output' })
        continue
      }

      // Upsert state profile with rich content
      await sanity.createOrReplace({
        _type:        'stateProfile',
        _id:          `state-${state.abbr.toLowerCase()}`,
        name:         state.name,
        abbr:         state.abbr,
        richContent,
        constitutionalCarry: state.cc,
        redFlagLaw:          state.redFlag,
        magLimit:            state.magLimit,
        waitPeriod:          state.waitDays ? `${state.waitDays} days (handguns)` : 'None',
        awbStatus:           state.awb ? 'Banned' : 'None',
        suppressors:         'Legal (NFA rules apply)',
        openCarry:           state.cc ? 'Legal (no permit)' : 'Varies — check local laws',
        bgcPrivate:          ['CA','CO','IL','NY','NJ','MA','MD','OR','WA'].includes(state.abbr),
        rating:              state.rating,
        updatedAt:           new Date().toISOString(),
      })
      results.push({ abbr: state.abbr, status: 'enriched', chars: richContent.length })
    } catch (e) {
      results.push({ abbr: state.abbr, status: 'error', error: e.message })
    }
  }

  const done    = results.filter(r => r.status === 'enriched').length
  const total   = STATES.length
  const enriched = existing.length + done

  return Response.json({
    ok: true,
    done,
    remaining: total - enriched,
    enriched,
    total,
    results,
    message: `${done} states enriched. ${total - enriched} remaining.`,
  })
}
