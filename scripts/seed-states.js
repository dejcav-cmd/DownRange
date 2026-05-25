/**
 * Seed all 50 state profiles into Sanity
 * Run: node scripts/seed-states.js
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

const states = [
  // name, abbr, rating, constitutionalCarry, redFlagLaw, magLimit, waitPeriod, awbStatus, suppressors, openCarry, bgcPrivate
  ['Alabama',        'AL', 'A',  true,  false, null, null, 'None',    true,  'Legal',           false],
  ['Alaska',         'AK', 'A+', true,  false, null, null, 'None',    true,  'Legal',           false],
  ['Arizona',        'AZ', 'A',  true,  false, null, null, 'None',    true,  'Legal',           false],
  ['Arkansas',       'AR', 'A',  true,  false, null, null, 'None',    true,  'Legal',           false],
  ['California',     'CA', 'F',  false, true,  10,   10,  'Full',    false, 'Permit Required', true],
  ['Colorado',       'CO', 'C',  false, true,  15,   3,   'None',    true,  'Legal',           true],
  ['Connecticut',    'CT', 'D',  false, true,  10,   14,  'Full',    true,  'Permit Required', true],
  ['Delaware',       'DE', 'D',  false, true,  17,   null,'Partial', true,  'Permit Required', false],
  ['Florida',        'FL', 'B+', false, false, null, 3,   'None',    true,  'Prohibited',      false],
  ['Georgia',        'GA', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Hawaii',         'HI', 'F',  false, true,  10,   14,  'Full',    false, 'Prohibited',      true],
  ['Idaho',          'ID', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
  ['Illinois',       'IL', 'D',  false, true,  null, 72,  'Partial', true,  'Permit Required', true],
  ['Indiana',        'IN', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Iowa',           'IA', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Kansas',         'KS', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Kentucky',       'KY', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Louisiana',      'LA', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Maine',          'ME', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Maryland',       'MD', 'D',  false, true,  10,   7,   'Full',    true,  'Prohibited',      true],
  ['Massachusetts',  'MA', 'F',  false, true,  10,   null,'Full',    false, 'Permit Required', true],
  ['Michigan',       'MI', 'B',  false, false, null, null,'None',    true,  'Legal',           true],
  ['Minnesota',      'MN', 'C',  false, true,  null, null,'None',    true,  'Permit Required', false],
  ['Mississippi',    'MS', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
  ['Missouri',       'MO', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Montana',        'MT', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
  ['Nebraska',       'NE', 'B',  false, false, null, null,'None',    true,  'Legal',           false],
  ['Nevada',         'NV', 'C',  false, true,  null, null,'None',    true,  'Legal',           true],
  ['New Hampshire',  'NH', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
  ['New Jersey',     'NJ', 'F',  false, true,  10,   7,   'Full',    false, 'Prohibited',      true],
  ['New Mexico',     'NM', 'C',  false, true,  null, null,'None',    true,  'Legal',           false],
  ['New York',       'NY', 'F',  false, true,  10,   null,'Full',    false, 'Prohibited',      true],
  ['North Carolina', 'NC', 'B',  false, false, null, null,'None',    true,  'Legal',           false],
  ['North Dakota',   'ND', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
  ['Ohio',           'OH', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Oklahoma',       'OK', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
  ['Oregon',         'OR', 'D',  false, true,  10,   null,'Partial', true,  'Legal',           true],
  ['Pennsylvania',   'PA', 'B',  false, false, null, null,'None',    true,  'Legal',           false],
  ['Rhode Island',   'RI', 'D',  false, false, 10,   7,   'None',    true,  'Permit Required', false],
  ['South Carolina', 'SC', 'B+', false, false, null, null,'None',    true,  'Legal',           false],
  ['South Dakota',   'SD', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
  ['Tennessee',      'TN', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Texas',          'TX', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Utah',           'UT', 'A',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Vermont',        'VT', 'B',  true,  false, null, null,'None',    true,  'Legal',           false],
  ['Virginia',       'VA', 'C',  false, true,  null, null,'None',    true,  'Legal',           true],
  ['Washington',     'WA', 'D',  false, true,  null, 10,  'Partial', true,  'Permit Required', true],
  ['West Virginia',  'WV', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
  ['Wisconsin',      'WI', 'B',  false, false, null, 48,  'None',    true,  'Legal',           false],
  ['Wyoming',        'WY', 'A+', true,  false, null, null,'None',    true,  'Legal',           false],
]

async function seed() {
  console.log(`Seeding ${states.length} states...`)
  const tx = sanity.transaction()
  for (const [name, abbr, rating, cc, rfl, magLimit, wait, awb, suppressors, openCarry, bgc] of states) {
    tx.createOrReplace({
      _id:   `state-${abbr.toLowerCase()}`,
      _type: 'stateProfile',
      name, abbr, rating,
      slug: { current: abbr.toLowerCase() },
      constitutionalCarry: cc,
      redFlagLaw: rfl,
      magLimit:   magLimit,
      waitPeriod: wait,
      awbStatus:  awb,
      suppressors,
      openCarry,
      bgcPrivate: bgc,
      lastUpdated: new Date().toISOString(),
    })
  }
  await tx.commit()
  console.log('Done. All 50 states seeded.')
}

seed().catch(err => { console.error(err); process.exit(1) })
