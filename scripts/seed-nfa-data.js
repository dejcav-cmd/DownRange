// Run via: node scripts/seed-nfa-data.js
// Seeds current NFA wait time baseline to Sanity so tracker shows fresh data

const https = require('https')

const PROJECT_ID = 'vbnsqnkg'
const DATASET    = 'production'
const TOKEN      = process.env.SANITY_API_TOKEN

const doc = {
  _id:           `nfa-wait-${Date.now()}`,
  _type:         'nfaWaitTime',
  fetchedAt:     new Date().toISOString(),
  reportMonth:   'June 2026',
  reportedByAtf: false,
  sourceUrl:     'https://www.atf.gov/resource-center/current-processing-times',
  communityNotes: 'Baseline data seeded June 2026 — cron will update Mon+Thu 6am UTC',
  forms: [
    { _type:'object', _key:'f4e-ind',  formType:'Form 4 eFile Individual', category:'suppressor',      method:'eForms', avgDays:4,   minDays:1,   maxDays:14,  trend:'down',   note:'Individual NICS checks often approve same-day. Per ATF + Silencer Central June 2026.' },
    { _type:'object', _key:'f4e-tru',  formType:'Form 4 eFile Trust',      category:'suppressor',      method:'eForms', avgDays:18,  minDays:7,   maxDays:45,  trend:'down',   note:'Multi-party trusts take longer. Per Silencer Central May 2026.' },
    { _type:'object', _key:'f4-paper', formType:'Form 4 Paper',            category:'suppressor',      method:'Paper',  avgDays:286, minDays:180, maxDays:420, trend:'stable', note:'Paper forms manually processed. ATF recommends eForms.' },
    { _type:'object', _key:'f1-efile', formType:'Form 1 eFile (Make SBR)', category:'sbr-make',        method:'eForms', avgDays:22,  minDays:7,   maxDays:60,  trend:'down',   note:'For making SBR/SBS. Faster than Form 4.' },
    { _type:'object', _key:'f3',       formType:'Form 3 (Dealer Transfer)', category:'dealer-transfer', method:'eForms', avgDays:3,   minDays:1,   maxDays:7,   trend:'stable', note:'FFL-to-FFL transfer; often approved within 24 hours.' },
    { _type:'object', _key:'f4-mg',    formType:'Form 4 (Machine Gun)',    category:'machinegun',       method:'eForms', avgDays:365, minDays:270, maxDays:540, trend:'up',     note:'Pre-86 transferable MGs only. Limited supply, higher scrutiny.' },
  ]
}

const body = JSON.stringify({
  mutations: [{ create: doc }]
})

const options = {
  hostname: `${PROJECT_ID}.api.sanity.io`,
  path:     `/v2024-01-01/data/mutate/${DATASET}`,
  method:   'POST',
  headers:  {
    'Content-Type':  'application/json',
    'Authorization': `Bearer ${TOKEN}`,
    'Content-Length': Buffer.byteLength(body)
  }
}

const req = https.request(options, res => {
  let data = ''
  res.on('data', chunk => data += chunk)
  res.on('end', () => {
    const parsed = JSON.parse(data)
    if (parsed.error) { console.error('Error:', parsed.error); process.exit(1) }
    console.log('✓ NFA baseline data seeded:', parsed.results?.[0]?.id || 'ok')
  })
})
req.on('error', e => { console.error('Request error:', e.message); process.exit(1) })
req.write(body)
req.end()
