require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@sanity/client')

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

const REVIEWS = [
  {
    _id: 'review-glock-43x-mos',
    _type: 'review',
    title: 'Glock 43X MOS Review — The Gold Standard EDC',
    slug: { _type: 'slug', current: 'glock-43x-mos-review' },
    brand: 'Glock', model: 'G43X MOS', caliber: '9mm', category: 'Pistol',
    msrp: 580, score: 9.2, verdict: 'Highly Recommended',
    featured: true, publishedAt: new Date('2024-11-15').toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=1200&q=85',
    summary: 'The G43X MOS delivers Glock reliability in a slim, optics-ready package perfect for everyday carry. After 2,000 rounds of Federal HST and Speer Gold Dot, zero malfunctions.',
    pros: ['Zero malfunctions in 2,000+ rounds', 'MOS plate system fits major micro red dots', 'Slim 1.1" width ideal for IWB carry', 'Aggressive grip texture without being painful', 'Ships with two 10-round magazines'],
    cons: ['Factory trigger is mediocre (reset is mushy)', 'Only 10+1 capacity without flush-fit mags', 'No manual safety — preference issue'],
    specs: [
      { label: 'Action', value: 'Safe Action Striker-Fired' },
      { label: 'Capacity', value: '10+1 (flush) / 15+1 (extended)' },
      { label: 'Barrel', value: '3.41"' },
      { label: 'Overall Length', value: '6.5"' },
      { label: 'Weight', value: '18.7 oz unloaded' },
      { label: 'Width', value: '1.1"' },
    ],
  },
  {
    _id: 'review-sig-p365xl',
    _type: 'review',
    title: 'SIG Sauer P365XL Review — Redefined the Micro-Compact Category',
    slug: { _type: 'slug', current: 'sig-p365xl-review' },
    brand: 'SIG Sauer', model: 'P365XL', caliber: '9mm', category: 'Pistol',
    msrp: 699, score: 9.5, verdict: 'Best in Class',
    featured: true, publishedAt: new Date('2024-10-20').toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1200&q=85',
    summary: 'The P365XL stands as the benchmark micro-compact pistol. Excellent trigger, optics-ready, 12+1 capacity in a package smaller than most compacts. It started a revolution.',
    pros: ['Best-in-class trigger for a striker-fired carry gun', 'ROMEO Zero Elite optic cut standard', '12+1 capacity in a tiny package', 'Grip module is replaceable', 'Exceptional accuracy for barrel length'],
    cons: ['Higher price than competitors', 'Grip texture may be too aggressive for some holsters', 'Small controls require practice to manipulate quickly'],
    specs: [
      { label: 'Action', value: 'Striker-Fired' },
      { label: 'Capacity', value: '12+1' },
      { label: 'Barrel', value: '3.7"' },
      { label: 'Overall Length', value: '6.6"' },
      { label: 'Weight', value: '20.7 oz unloaded' },
    ],
  },
  {
    _id: 'review-daniel-defense-ddm4v7',
    _type: 'review',
    title: 'Daniel Defense DDM4 V7 Review — Built for Serious Use',
    slug: { _type: 'slug', current: 'daniel-defense-ddm4-v7-review' },
    brand: 'Daniel Defense', model: 'DDM4 V7', caliber: '5.56 NATO / .223 Wylde', category: 'Rifle',
    msrp: 1999, score: 9.0, verdict: 'Highly Recommended',
    featured: false, publishedAt: new Date('2024-09-10').toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1200&q=85',
    summary: 'The DDM4 V7 is what you get when a firearms manufacturer refuses to cut corners. Cold hammer-forged barrel, 5,000-round test without a single malfunction. Built for work.',
    pros: ['Cold hammer-forged CHF barrel — exceptional longevity', 'Milspec+ construction throughout', 'M-LOK handguard is lightweight and stiff', 'Pinned gas block stays zeroed', 'Ships with 32-round Pmag'],
    cons: ['$2,000 price point excludes many buyers', 'Stock trigger adequate but not exceptional', 'Heavy compared to budget AR-15s'],
    specs: [
      { label: 'Action', value: 'Direct Impingement Semi-Auto' },
      { label: 'Barrel', value: '16" CHF 1:7 twist' },
      { label: 'Overall Length', value: '34.75" – 38"' },
      { label: 'Weight', value: '6.4 lbs' },
      { label: 'Handguard', value: '15" M-LOK' },
    ],
  },
  {
    _id: 'review-mossberg-590a1',
    _type: 'review',
    title: 'Mossberg 590A1 Review — The Military-Grade Home Defense Shotgun',
    slug: { _type: 'slug', current: 'mossberg-590a1-review' },
    brand: 'Mossberg', model: '590A1', caliber: '12 Gauge', category: 'Shotgun',
    msrp: 699, score: 9.1, verdict: 'Highly Recommended',
    featured: false, publishedAt: new Date('2024-08-05').toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1200&q=85',
    summary: 'The 590A1 is the civilian version of the shotgun the US military trusts. Heavy-walled barrel, metal trigger guard, metal safety — built to take abuse and keep running.',
    pros: ['Heavy-walled barrel withstands magnum loads', 'Metal trigger guard and safety (not plastic)', '9+1 capacity with 20" barrel', 'Ambidextrous tang safety', 'Passes all MIL-SPEC tests'],
    cons: ['Heavier than polymer-stocked competitors', 'Factory bead sight is rudimentary', 'Pump stroke slightly long vs Remington 870'],
    specs: [
      { label: 'Action', value: 'Pump' },
      { label: 'Capacity', value: '9+1 (2.75" shells)' },
      { label: 'Barrel', value: '20"' },
      { label: 'Overall Length', value: '40"' },
      { label: 'Weight', value: '7.25 lbs' },
    ],
  },
  {
    _id: 'review-vortex-viper-pst-gen2',
    _type: 'review',
    title: 'Vortex Viper PST Gen II 1-6x24 Review — The Budget Long-Range Standard',
    slug: { _type: 'slug', current: 'vortex-viper-pst-gen2-review' },
    brand: 'Vortex', model: 'Viper PST Gen II 1-6x24', caliber: null, category: 'Optic',
    msrp: 649, score: 8.8, verdict: 'Highly Recommended',
    featured: false, publishedAt: new Date('2024-07-22').toISOString(),
    imageUrl: 'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=1200&q=85',
    summary: 'At $649, the Viper PST Gen II offers optical quality that challenges scopes twice its price. The VMR-2 MRAD reticle is intuitive for holdovers. The VIP warranty is unmatched.',
    pros: ['Optical clarity rivals $1,200+ scopes', 'True 1x magnification on low setting', 'VMR-2 reticle works perfectly for 0-600 yard shooting', 'Vortex VIP no-fault lifetime warranty', 'Excellent turret feel and repeatability'],
    cons: ['Heavier than premium alternatives at the same power', 'Eye box can be unforgiving at 6x', 'Illumination battery life could be better'],
    specs: [
      { label: 'Magnification', value: '1-6x' },
      { label: 'Objective', value: '24mm' },
      { label: 'Reticle', value: 'VMR-2 MRAD (illuminated)' },
      { label: 'Weight', value: '22.8 oz' },
      { label: 'Length', value: '10.4"' },
    ],
  },
]

async function seed() {
  console.log(`Seeding ${REVIEWS.length} reviews...`)
  for (const review of REVIEWS) {
    try {
      await client.createOrReplace(review)
      console.log(`✓ ${review.title}`)
    } catch (err) {
      console.error(`✗ ${review.title}: ${err.message}`)
    }
  }
  console.log('Done!')
}

seed().catch(console.error)
