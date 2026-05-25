/**
 * Seed initial ammo price baseline into Sanity
 * Run: node scripts/seed-ammo.js
 */
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset:   process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  token:     process.env.SANITY_API_TOKEN,
  useCdn:    false,
})

// Baseline prices as of May 2026 — agent will update these automatically
const ammoData = [
  { caliber: '9mm',        pricePerRound: 0.24, price30DayAvg: 0.26, trendDir: 'down',   trendPct: -7.7,  bestVendor: 'AmmoSeek',  bestPrice: 0.21, inStock: 'Available' },
  { caliber: '.223 Rem',   pricePerRound: 0.42, price30DayAvg: 0.45, trendDir: 'down',   trendPct: -6.7,  bestVendor: 'Palmetto',  bestPrice: 0.38, inStock: 'Available' },
  { caliber: '.308 Win',   pricePerRound: 0.89, price30DayAvg: 0.91, trendDir: 'stable', trendPct: -2.2,  bestVendor: 'MidwayUSA', bestPrice: 0.82, inStock: 'Available' },
  { caliber: '.45 ACP',    pricePerRound: 0.38, price30DayAvg: 0.40, trendDir: 'down',   trendPct: -5.0,  bestVendor: 'AmmoSeek',  bestPrice: 0.34, inStock: 'Available' },
  { caliber: '12 Gauge',   pricePerRound: 0.58, price30DayAvg: 0.57, trendDir: 'up',     trendPct: 1.8,   bestVendor: 'Walmart',   bestPrice: 0.52, inStock: 'Available' },
  { caliber: '6.5 Creedmoor', pricePerRound: 1.12, price30DayAvg: 1.15, trendDir: 'down', trendPct: -2.6, bestVendor: 'Hornady', bestPrice: 1.05, inStock: 'Limited' },
  { caliber: '.22 LR',     pricePerRound: 0.07, price30DayAvg: 0.07, trendDir: 'stable', trendPct: 0,     bestVendor: 'CCI',       bestPrice: 0.06, inStock: 'Available' },
]

async function seed() {
  const tx = sanity.transaction()
  for (const a of ammoData) {
    tx.createOrReplace({
      _id:   `ammo-${a.caliber.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
      _type: 'ammoPrice',
      ...a,
      recordedAt: new Date().toISOString(),
    })
  }
  await tx.commit()
  console.log(`Seeded ${ammoData.length} calibers.`)
}
seed().catch(err => { console.error(err); process.exit(1) })
