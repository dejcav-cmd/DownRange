import { createClient }       from '@sanity/client'
import Masthead               from '../../components/layout/Masthead'
import Footer                 from '../../components/layout/Footer'
import BreakingTicker         from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'
import GiveawaysClient        from './GiveawaysClient'

// ── Seed data — shown when Sanity returns nothing ─────────────────────────────
const SEED_GIVEAWAYS = [
  { _id:'seed-1',  title:'PSA Weekly Gun Giveaway',             sponsor:'Palmetto State Armory', entryUrl:'https://palmettostatearmory.com/giveaways',                    category:'rifle',       value:799,   endDate:null, featured:true  },
  { _id:'seed-2',  title:'Lucky Gunner Ammo Giveaway',          sponsor:'Lucky Gunner',          entryUrl:'https://www.luckygunner.com/blog/category/giveaway/',          category:'ammo',        value:350,   endDate:null, featured:false },
  { _id:'seed-3',  title:'GOA Member Gun Giveaway — Glock 19',  sponsor:'Gun Owners of America', entryUrl:'https://gunowners.org/goa-giveaway/',                          category:'pistol',      value:599,   endDate:null, featured:true  },
  { _id:'seed-4',  title:'Taurus Win a G3c Sweepstakes',        sponsor:'Taurus USA',            entryUrl:'https://www.taurususa.com/promotions',                         category:'pistol',      value:349,   endDate:null, featured:false },
  { _id:'seed-5',  title:'Springfield Armory XD-M Elite Giveaway', sponsor:'Springfield Armory', entryUrl:'https://www.springfield-armory.com/promotions/',               category:'pistol',      value:699,   endDate:null, featured:false },
  { _id:'seed-6',  title:'Brownells Monthly Sweepstakes — $500 Gift Card', sponsor:'Brownells',  entryUrl:'https://www.brownells.com/promotions/',                        category:'accessories', value:500,   endDate:null, featured:false },
  { _id:'seed-7',  title:'Holosun 507C Red Dot Giveaway',       sponsor:'Holosun',               entryUrl:'https://wintheguns.com',                                       category:'optics',      value:299,   endDate:null, featured:false },
  { _id:'seed-8',  title:'Warrior Poet Society Rifle + Gear Bundle', sponsor:'Warrior Poet Society', entryUrl:'https://www.warriorpoetsociety.net',                      category:'rifle',       value:1200,  endDate:null, featured:true  },
  { _id:'seed-9',  title:'NRA Foundation Firearm Sweepstakes',  sponsor:'NRA Foundation',        entryUrl:'https://wintheguns.com',                                       category:'rifle',       value:1000,  endDate:null, featured:false },
  { _id:'seed-10', title:'Ammo.com Free Ammo Giveaway',         sponsor:'Ammo.com',              entryUrl:'https://www.ammo.com/giveaways',                               category:'ammo',        value:200,   endDate:null, featured:false },
]

// ── Metadata ──────────────────────────────────────────────────────────────────
export const metadata = {
  title: 'Gun Giveaways 2026 — Win Free Firearms, Ammo & Gear | DownRange',
  description: 'Active gun giveaways from top manufacturers, retailers, and 2A organizations. Win free firearms, ammo, and gear. Updated 3× daily — no spam, verified sources only.',
  alternates: { canonical: 'https://www.downrangeco.com/giveaways' },
  openGraph: {
    title: 'Gun Giveaways 2026 — Win Free Firearms | DownRange',
    description: 'Active gun giveaways updated 3× daily. Free firearms, ammo, and gear.',
    url: 'https://www.downrangeco.com/giveaways',
  },
}

export const revalidate = 0
export const dynamic    = 'force-dynamic'

// ── Sanity client ─────────────────────────────────────────────────────────────
const sanity = createClient({
  projectId:  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:    'production',
  apiVersion: '2024-01-01',
  useCdn:     true,
})

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function GiveawaysPage() {
  let giveaways   = []
  let lastUpdated = null

  const today = new Date().toISOString().split('T')[0]

  const [alerts, live, lastLog] = await Promise.all([
    fetchBreakingAlerts().catch(() => []),
    sanity.fetch(
      `*[_type == "giveaway" && active == true && (endDate == null || endDate >= $today)]
       | order(featured desc, _createdAt desc) [0...120]
       { _id, title, sponsor, prize, entryUrl, category, endDate, featured, value, prizeValue }`,
      { today }
    ).catch(() => []),
    sanity.fetch(
      `*[_type == "cronRun" && jobId == "giveaways"] | order(_createdAt desc) [0] { _createdAt }`
    ).catch(() => null),
  ])

  // Normalise value field — agent uses prizeValue, older entries use value
  giveaways = (live || []).map(g => ({ ...g, value: g.value || g.prizeValue || 0 }))

  if (lastLog?._createdAt) {
    const d = new Date(lastLog._createdAt)
    lastUpdated = d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
    }) + ' UTC'
  }

  // Rule #13: seed fallback — page is never empty
  const display = giveaways.length > 0 ? giveaways : SEED_GIVEAWAYS
  const isSeed  = giveaways.length === 0

  return (
    <>
      <Masthead />
      <BreakingTicker alerts={alerts} />
      <GiveawaysClient
        giveaways={display}
        isSeed={isSeed}
        lastUpdated={lastUpdated}
      />
      <Footer />
    </>
  )
}
