#!/usr/bin/env node
// test-topic-filter.mjs  — verify GATE 4 catches off-topic and passes on-topic articles
// Run: node scripts/test-topic-filter.mjs

import { readFileSync } from 'fs'

// Extract FIREARMS_KEYWORDS and isFirearmsRelevant from news.js inline
// (mirrors the exact logic in the feed file)
const FIREARMS_KEYWORDS = [
  'gun','guns','firearm','firearms','pistol','pistols','rifle','rifles',
  'shotgun','shotguns','revolver','handgun','handguns','ammo','ammunition',
  'caliber','calibre','cartridge','bullet','bullets','suppressor','silencer',
  'holster','magazine','clip','trigger','barrel','receiver','frame','slide',
  'second amendment','2nd amendment','2a','gun rights','gun control','gun law',
  'gun bill','gun ban','assault weapon','nra','nra-ila','saf','fpc','goa',
  'gun owners','concealed carry','ccw','shall-issue','may-issue','constitutional carry',
  'red flag','atf','batfe','background check','nics','ffl','4473',
  'bruen','heller','mcdonald','ghost gun','80%',
  'glock','sig sauer','smith & wesson','smith and wesson','ruger','colt',
  'springfield','beretta','fn','hk','walther','taurus','mossberg','remington',
  'winchester','hornady','federal premium','speer','nosler','ar-15','ar15',
  'ak-47','ak47','1911','9mm','45 acp','.357','.44 mag','.308','5.56',
  'shooting','range','hunt','hunting','hunter','bow hunting','archery',
  'self-defense','self defense','home defense','concealed','open carry',
  'gun store','gun shop','gun dealer','gun sale','gun show','gunsmith',
]

const FIREARMS_REGEX = new RegExp(
  '\\b(' + FIREARMS_KEYWORDS.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|') + ')\\b',
  'i'
)

function isFirearmsRelevant(item) {
  const text = ((item.title || '') + ' ' + (item.description || '')).slice(0, 600)
  return FIREARMS_REGEX.test(text)
}

// ── Test cases ────────────────────────────────────────────────────────────────
const SHOULD_BLOCK = [
  { title: 'Chaos Continues in Northern Ireland: Anti-Migration Rioters Clash with Police, Set 7 Buses Ablaze', description: 'Unrest in Belfast amid migration protests.' },
  { title: 'Trump Signs Executive Order on Border Security', description: 'President signs order targeting immigration enforcement.' },
  { title: 'EU Leaders Meet for Emergency Summit on Ukraine Aid', description: 'Brussels summit addresses military funding.' },
  { title: 'Democrat Budget Bill Passes Senate 51-49', description: 'Spending package advances to the House.' },
  { title: 'Stock Market Rally Continues Amid Fed Rate Pause', description: 'S&P 500 hits record high.' },
]

const SHOULD_PASS = [
  { title: 'ATF Finalizes New Rule on Pistol Braces', description: 'Bureau releases final rulemaking on stabilizing braces.' },
  { title: 'New Hampshire Passes Constitutional Carry Expansion', description: 'Legislature approves permitless carry bill.' },
  { title: 'Glock 17 Gen 5 Review: Is It Still the Best Service Pistol?', description: 'Testing the flagship 9mm handgun.' },
  { title: 'Supreme Court Takes Up New Bruen Challenge from Illinois', description: 'SCOTUS agrees to hear assault weapons ban case.' },
  { title: 'NSSF: Gun Sales Up 12% in Q1 2025', description: 'Background check data shows firearm demand rising.' },
  { title: 'Ruger Announces New Rifle in .308 Winchester', description: 'New bolt-action at $699 MSRP.' },
  { title: 'Red Flag Law Signed in Virginia — What Gun Owners Need to Know', description: 'Governor signs ERPO legislation into law.' },
]

let passed = 0
let failed = 0

console.log('── SHOULD BLOCK (off-topic) ──────────────────────────────────')
for (const item of SHOULD_BLOCK) {
  const relevant = isFirearmsRelevant(item)
  const ok = !relevant
  const mark = ok ? '✓ BLOCKED' : '✗ LEAKED '
  if (ok) passed++; else failed++
  console.log(`  ${mark}  "${item.title.slice(0, 70)}"`)
}

console.log()
console.log('── SHOULD PASS (firearms/2A) ─────────────────────────────────')
for (const item of SHOULD_PASS) {
  const relevant = isFirearmsRelevant(item)
  const ok = relevant
  const mark = ok ? '✓ PASSED ' : '✗ BLOCKED'
  if (ok) passed++; else failed++
  console.log(`  ${mark}  "${item.title.slice(0, 70)}"`)
}

console.log()
console.log(`─────────────────────────────────────────────────────────────`)
console.log(`Result: ${passed}/${passed + failed} tests passed${failed > 0 ? ` — ${failed} FAILURES` : ''}`)
if (failed > 0) process.exit(1)
