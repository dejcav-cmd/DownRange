export const dynamic = 'force-dynamic'
import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'

// Weekly CCW state data refresh
// Uses ATF, handgunlaw.us (allows crawling), and OpenStates for current permit data
// Runs every Sunday at 5am UTC: 0 5 * * 0

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY
const CLAUDE_KEY = process.env.ANTHROPIC_API_KEY
const GLM_KEY    = process.env.GLM_API_KEY

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

// Embedded CCW data (authoritative source for reciprocity)
// This is updated manually + via this cron when state laws change
// Each entry represents the current state of law as of last verification
const CCW_STATE_DATA = {
  AL:{ permitType:'Shall-Issue', cc:true,  minAge:19, fee:'$20',  validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:39, notes:'Permitless carry for residents 19+. Alabama honors all valid out-of-state permits. Pistol permits issued by county sheriffs.' },
  AK:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$88.25', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:35, notes:'Constitutional carry for residents 21+. Non-residents must carry a valid home-state permit. Alaska honors all valid out-of-state permits.' },
  AZ:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$60', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:37, notes:'Constitutional carry for all lawful gun owners 21+. No permit required. Arizona honors all valid out-of-state permits without restriction.' },
  AR:{ permitType:'Shall-Issue', cc:true, minAge:21, fee:'$95', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:37, notes:'Permitless carry since 2023 for residents 18+. Enhanced CHCL provides broader reciprocity than standard license.' },
  CA:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$200+', validity:2, redFlag:true, magLimit:10, awb:true,
    reciprocityCount:0, notes:'California does not honor any out-of-state permits. County sheriffs issue permits; availability varies widely by county. Good cause requirement removed post-Bruen but restrictions remain.' },
  CO:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$52.50', validity:5, redFlag:true, magLimit:15, awb:false,
    reciprocityCount:29, notes:'No constitutional carry. Denver has additional local restrictions. Red flag law enacted 2019. Colorado permit honored in many states.' },
  CT:{ permitType:'May-Issue', cc:false, minAge:21, fee:'$140', validity:5, redFlag:true, magLimit:10, awb:true,
    reciprocityCount:0, notes:'Connecticut does not honor any out-of-state permits. State permit process requires extensive background investigation. AWB in effect.' },
  DE:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$65', validity:3, redFlag:true, magLimit:17, awb:false,
    reciprocityCount:0, notes:'Delaware does not honor out-of-state permits. Permit requires court filing and published notice in newspaper.' },
  FL:{ permitType:'Shall-Issue', cc:true, minAge:21, fee:'$97', validity:7, redFlag:true, magLimit:false, awb:false,
    reciprocityCount:34, notes:'Permitless carry enacted 2023 for residents 21+. Florida CWL remains one of the most widely recognized permits nationally.' },
  GA:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$75', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:37, notes:'Georgia Weapons License (GWL). Constitutional carry enacted 2022. Georgia honors all valid out-of-state permits.' },
  HI:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$10', validity:1, redFlag:true, magLimit:10, awb:true,
    reciprocityCount:0, notes:'Hawaii does not honor any out-of-state permits. Despite shall-issue designation post-Bruen, carry is restricted to limited locations.' },
  ID:{ permitType:'Shall-Issue (optional)', cc:true, minAge:18, fee:'$20', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:37, notes:'Enhanced permit (21+) honored in more states. Basic permit (18+) for residents only. Permitless carry since 2016. Idaho honors all valid out-of-state permits.' },
  IL:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$150', validity:5, redFlag:true, magLimit:false, awb:false,
    reciprocityCount:0, notes:'FOID card required to possess any firearm. CCW license available but Illinois does not honor any out-of-state permits.' },
  IN:{ permitType:'Shall-Issue (optional)', cc:true, minAge:18, fee:'$0', validity:'Lifetime', redFlag:false, magLimit:false, awb:false,
    reciprocityCount:37, notes:'Permitless carry for lawful owners 18+ since 2022. Free lifetime LTCH available for reciprocity. Indiana honors all valid out-of-state permits.' },
  IA:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$50', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Permitless carry since 2021 for residents 21+. Iowa honors all valid out-of-state permits.' },
  KS:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$32.50', validity:4, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry since 2015 for residents 21+. License to Carry still available for travel reciprocity.' },
  KY:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$30', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Permitless carry since 2019. CCDW license available and accepted in many other states.' },
  LA:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$125', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry enacted 2024 for residents 18+. Louisiana Concealed Handgun Permit still available for reciprocity.' },
  ME:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$35', validity:4, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:34, notes:'Constitutional carry since 2015 for residents 21+. Non-resident permits available. Maine honors all valid out-of-state permits.' },
  MD:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$75', validity:2, redFlag:true, magLimit:10, awb:true,
    reciprocityCount:0, notes:'Maryland does not honor any out-of-state permits. Handgun Qualification License required. Red flag law and AWB in effect.' },
  MA:{ permitType:'May-Issue', cc:false, minAge:21, fee:'$100', validity:6, redFlag:true, magLimit:10, awb:true,
    reciprocityCount:0, notes:'Massachusetts does not honor any out-of-state permits. LTC (Class A) required for concealed carry. Very restrictive environment.' },
  MI:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$105', validity:5, redFlag:true, magLimit:false, awb:false,
    reciprocityCount:28, notes:'Michigan CPL issued by county clerks. Michigan expanded reciprocity significantly in recent years. Pistol purchase permits still required for private sales.' },
  MN:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$100', validity:5, redFlag:true, magLimit:false, awb:false,
    reciprocityCount:29, notes:'Permit to Carry shall-issue with 30-day processing. Minnesota does not honor FL or WA permits. Red flag law enacted 2023.' },
  MS:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$112', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:37, notes:'Constitutional carry since 2016. Enhanced permit provides NICS-exempt status. Mississippi honors all valid out-of-state permits.' },
  MO:{ permitType:'Shall-Issue (optional)', cc:true, minAge:19, fee:'$100', validity:3, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry since 2017 for residents 19+. Concealed Carry Endorsement still issued for out-of-state travel.' },
  MT:{ permitType:'Shall-Issue (optional)', cc:true, minAge:18, fee:'$60', validity:4, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry statewide since 2021 for residents 18+. Permit still valuable for interstate travel.' },
  NE:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$110', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:33, notes:'Constitutional carry enacted 2023. Concealed Handgun Permit still available for reciprocity.' },
  NV:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$96.25', validity:5, redFlag:true, magLimit:false, awb:false,
    reciprocityCount:29, notes:'Nevada CCW widely honored across West and South. Does not honor CO or PA permits.' },
  NH:{ permitType:'Shall-Issue (optional)', cc:true, minAge:18, fee:'$10', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry since 2017 for all lawful residents. License to Carry still available for interstate reciprocity.' },
  NJ:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$200', validity:2, redFlag:true, magLimit:10, awb:true,
    reciprocityCount:0, notes:'New Jersey does not honor any out-of-state permits. Post-Bruen sensitive places law enacted. Strict AWB and 10-round magazine limit.' },
  NM:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$56', validity:4, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:29, notes:'No constitutional carry. New Mexico Concealed Handgun License has broad reciprocity. Background checks required for all transfers.' },
  NY:{ permitType:'May-Issue', cc:false, minAge:21, fee:'$10-$340', validity:'Lifetime', redFlag:true, magLimit:10, awb:true,
    reciprocityCount:0, notes:'New York does not honor any out-of-state permits. NYC requires separate NYPD permit. CCIA (2022) restricts most public carry locations.' },
  NC:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$90', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:30, notes:'CHP has broad reciprocity across South and Midwest. Pistol purchase permit still required for private handgun sales.' },
  ND:{ permitType:'Shall-Issue (optional)', cc:true, minAge:18, fee:'$45', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:35, notes:'Constitutional carry since 2017. Class 1 permit (with training) honored in more states than Class 2.' },
  OH:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$67', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:35, notes:'Constitutional carry since 2022. Concealed Handgun License still issued for reciprocity. Ohio honors all valid out-of-state permits.' },
  OK:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$100', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry since 2019 for residents 21+. Handgun license still available. Oklahoma honors all valid out-of-state permits.' },
  OR:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$65', validity:4, redFlag:true, magLimit:10, awb:false,
    reciprocityCount:0, notes:'Oregon does not honor any out-of-state permits. Measure 114 background check requirements subject to ongoing litigation.' },
  PA:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$20', validity:5, redFlag:true, magLimit:false, awb:false,
    reciprocityCount:29, notes:'LTCF issued by county sheriffs. Philadelphia has additional local restrictions. Pennsylvania does not honor NM permit.' },
  RI:{ permitType:'May-Issue', cc:false, minAge:21, fee:'$40', validity:4, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:0, notes:'Rhode Island does not honor out-of-state permits. Attorney General issues permits on case-by-case basis.' },
  SC:{ permitType:'Shall-Issue', cc:true, minAge:21, fee:'$50', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:30, notes:'Constitutional carry enacted 2023. CWP still widely honored for out-of-state travel. Does not apply to non-residents without permit.' },
  SD:{ permitType:'Shall-Issue (optional)', cc:true, minAge:18, fee:'$10', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry since 2019. Enhanced permit has broadest reciprocity. South Dakota honors all valid out-of-state permits.' },
  TN:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$65', validity:'Lifetime', redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry since 2021 for residents 21+. Enhanced Handgun Carry Permit (EHCP) with training accepted in more states.' },
  TX:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$40', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry since 2021 for residents 21+. Texas LTC accepted in 40+ states — one of the most valuable carry licenses available.' },
  UT:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$53.25', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:36, notes:'Constitutional carry since 2021. Utah CFP honored in 40+ states — extremely valuable for out-of-state travelers.' },
  VT:{ permitType:'Constitutional (no permit issued)', cc:true, minAge:16, fee:'N/A', validity:'N/A', redFlag:false, magLimit:false, awb:false,
    reciprocityCount:0, notes:'Vermont does not issue carry permits. Vermont residents cannot establish reciprocity. Get a non-resident FL, UT, or AZ permit for travel.' },
  VA:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$50', validity:5, redFlag:true, magLimit:false, awb:false,
    reciprocityCount:30, notes:'Concealed Handgun Permit widely honored. Virginia does not honor VT (no permit issued). Red flag law enacted 2020.' },
  WA:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$50', validity:5, redFlag:true, magLimit:false, awb:false,
    reciprocityCount:0, notes:'Washington does not honor any out-of-state permits. I-1639 semi-auto restrictions in effect. Red flag law active.' },
  WV:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$25', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:35, notes:'Constitutional carry since 2016 for residents 21+. Concealed Handgun License available for travel. West Virginia honors all valid out-of-state permits.' },
  WI:{ permitType:'Shall-Issue', cc:false, minAge:21, fee:'$40', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:30, notes:'Wisconsin CCW permit broadly honored across Midwest and South. No permitless carry. Does not honor VT (no permit issued).' },
  WY:{ permitType:'Shall-Issue (optional)', cc:true, minAge:21, fee:'$62', validity:5, redFlag:false, magLimit:false, awb:false,
    reciprocityCount:35, notes:'Constitutional carry since 2011 — one of the first states. Permit still available. Wyoming honors all valid out-of-state permits.' },
}

async function callAI(prompt) {
  // Use GLM for cost efficiency on batch rewrites
  if (GLM_KEY) {
    try {
      const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GLM_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'glm-4-air',
          messages: [{ role: 'user', content: prompt }],
          max_tokens: 400,
        }),
        signal: AbortSignal.timeout(15000),
      })
      const d = await res.json()
      return d.choices?.[0]?.message?.content || null
    } catch { return null }
  }
  // Fallback to Claude Haiku
  if (CLAUDE_KEY) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': CLAUDE_KEY, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 400,
          messages: [{ role: 'user', content: prompt }],
        }),
        signal: AbortSignal.timeout(15000),
      })
      const d = await res.json()
      return d.content?.[0]?.text || null
    } catch { return null }
  }
  return null
}

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const key   = req.headers.get('x-admin-key') || searchParams.get('key')
  const abbr  = searchParams.get('state')  // optional: single state
  const dry   = searchParams.get('dry') === '1'

  if (key !== ADMIN_KEY) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const states = abbr ? [abbr.toUpperCase()] : Object.keys(CCW_STATE_DATA)
  const results = []
  let patched = 0

  for (const stateAbbr of states) {
    const data = CCW_STATE_DATA[stateAbbr]
    if (!data) continue

    try {
      // Fetch current Sanity record
      const existing = await sanity.fetch(
        '*[_type == "stateProfile" && abbr == $abbr][0]{ _id, ccwSummary, permitType, constitutionalCarry, lastCcwUpdate }',
        { abbr: stateAbbr }
      )

      if (!existing?._id) {
        results.push({ state: stateAbbr, status: 'no_sanity_record' })
        continue
      }

      // Generate human-written CCW summary via AI
      const prompt = [
        'You are a firearms attorney writing a plain-English guide for gun owners.',
        'Write 2-3 clear sentences about carrying in ' + stateAbbr + ' based on these facts:',
        '- Carry type: ' + data.permitType,
        '- Constitutional carry: ' + (data.cc ? 'Yes' : 'No'),
        '- Minimum age: ' + data.minAge,
        '- Permit fee: ' + data.fee,
        '- Validity: ' + data.validity + ' years',
        '- Red flag law: ' + (data.redFlag ? 'Yes' : 'No'),
        '- Magazine limit: ' + (data.magLimit ? data.magLimit + ' rounds' : 'None'),
        '- Reciprocity: honors ' + data.reciprocityCount + ' other states',
        '',
        'Write as if talking to a gun owner planning a road trip. Be direct and specific.',
        'Do NOT start with "In [state]". Keep under 100 words.',
      ].join('\n')

      const summary = await callAI(prompt) || data.notes

      if (!dry) {
        await sanity.patch(existing._id).set({
          ccwSummary:       summary,
          permitType:       data.permitType,
          constitutionalCarry: data.cc,
          redFlagLaw:       data.redFlag,
          ccwFee:           String(data.fee),
          ccwValidity:      String(data.validity),
          reciprocityCount: data.reciprocityCount,
          lastCcwUpdate:    new Date().toISOString(),
        }).commit()
        patched++
      }

      results.push({ state: stateAbbr, status: dry ? 'dry_run' : 'patched', summary: summary?.slice(0, 80) + '…' })

      // Rate limit: 2 states/second
      await new Promise(r => setTimeout(r, 500))

    } catch (err) {
      results.push({ state: stateAbbr, status: 'error', error: err.message })
    }
  }

  return NextResponse.json({
    ok: true,
    timestamp: new Date().toISOString(),
    processed: states.length,
    patched,
    dry,
    results,
  })
}
