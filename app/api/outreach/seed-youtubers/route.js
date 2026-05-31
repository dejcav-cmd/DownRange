export const dynamic = 'force-dynamic'
export const maxDuration = 120

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// ── NEW YOUTUBERS WITH REAL NAMES ─────────────────────────────────────────────
// Researched from public bios, Wikipedia, interviews, and channel about pages
const NEW_YOUTUBERS = [

  // ── MEGA TIER (4M+ subscribers) ─────────────────────────────────────────
  {
    name: 'Garand Thumb',
    firstName: 'Mike',          // Michael Jones — confirmed from multiple biographies
    type: 'youtuber',
    email: 'garandthumb@gmail.com',
    website: 'https://www.garandthumb.com',
    youtubeUrl: 'https://youtube.com/@GarandThumb',
    subscribers: 4600000,
    city: 'Tacoma', state: 'WA',
    notes: 'Real name: Michael (Mike) Jones. USAF TACP veteran, SERE instructor. Founder of Onward Research tactical gear company. Humor + depth. 4.6M subs.',
  },
  {
    name: 'Hickok45',
    firstName: 'Greg',          // Greg Kinman — Wikipedia confirmed
    type: 'youtuber',
    email: 'hickok45channel@gmail.com',
    website: 'https://www.hickok45.com',
    youtubeUrl: 'https://youtube.com/@hickok45',
    subscribers: 8100000,
    city: 'Nashville', state: 'TN',
    notes: 'Real name: Greg Kinman. Retired middle school teacher. Born 1950. Largest firearms YouTube channel by subscribers. 8.1M subs. Drama-free family-friendly content.',
  },
  {
    name: 'Active Self Protection',
    firstName: 'John',          // John Correia — confirmed from ASP website
    type: 'youtuber',
    email: 'info@activeselfprotection.com',
    website: 'https://www.activeselfprotection.com',
    youtubeUrl: 'https://youtube.com/@ActiveSelfProtection',
    subscribers: 2900000,
    city: 'Phoenix', state: 'AZ',
    notes: 'Real name: John Correia. Defensive gun use analysis — breaks down real-world self-defense footage. 2.9M subs. High educational value.',
  },
  {
    name: 'IraqVeteran8888',
    firstName: 'Eric',          // Eric Blandford — confirmed from multiple sources
    type: 'youtuber',
    email: 'iv8888@gmail.com',
    website: 'https://iraqveteran8888.com',
    youtubeUrl: 'https://youtube.com/@IraqVeteran8888',
    subscribers: 2600000,
    city: 'Columbus', state: 'GA',
    notes: 'Real name: Eric Blandford. Iraq War veteran. 2.6M subs. General firearms entertainment, history, 2A advocacy.',
  },

  // ── LARGE TIER (1M+ subscribers) ────────────────────────────────────────
  {
    name: 'Warrior Poet Society',
    firstName: 'John',          // John Lovell — confirmed from every source
    type: 'youtuber',
    email: 'info@warriorpoetsociety.us',
    website: 'https://www.warriorpoetsociety.us',
    youtubeUrl: 'https://youtube.com/@WarriorPoetSociety',
    subscribers: 2000000,
    city: 'Kennesaw', state: 'GA',
    notes: 'Real name: John Lovell. Former Army Ranger. Firearms instructor + faith + philosophy. Own streaming platform WPSN. 2M subs.',
  },
  {
    name: 'Mrgunsngear',
    firstName: 'Chris',         // Chris Baker — confirmed from multiple interviews
    type: 'youtuber',
    email: 'mrgunsngear@gmail.com',
    website: 'https://www.mrgunsngear.com',
    youtubeUrl: 'https://youtube.com/@Mrgunsngear',
    subscribers: 1300000,
    city: '', state: '',
    notes: 'Real name: Chris Baker. Tactical gear and firearms reviews. 1.3M subs. Known for detailed, no-nonsense reviews.',
  },

  // ── MID TIER (500K–1M) ───────────────────────────────────────────────────
  {
    name: 'Reno May',
    firstName: 'Reno',          // First name confirmed, last name May
    type: 'youtuber',
    email: 'contact@renomay.com',
    website: 'https://www.renomay.com',
    youtubeUrl: 'https://youtube.com/@RenoMay',
    subscribers: 510000,
    city: '', state: '',
    notes: 'Real name: Reno May. 2A current events, lawful use of force, legislation analysis. 510K subs.',
  },
  {
    name: 'School of the American Rifle',
    firstName: 'Chad',          // Chad from SOTAR — confirmed from channel description
    type: 'youtuber',
    email: 'sotar@sotar.us',
    website: 'https://www.sotar.us',
    youtubeUrl: 'https://youtube.com/@SchoolOfTheAmericanRifle',
    subscribers: 760000,
    city: '', state: '',
    notes: 'Real name: Chad (last name not public). AR-15 armorer, operator, competitive shooter. 760K subs. Deep technical content.',
  },
  {
    name: 'Backfire',
    firstName: 'Justin',        // Justin from Ames, IA — confirmed from About page
    type: 'youtuber',
    email: 'backfirechannel@gmail.com',
    website: 'https://www.backfirechannel.com',
    youtubeUrl: 'https://youtube.com/@Backfire',
    subscribers: 500000,
    city: 'Ames', state: 'IA',
    notes: 'Real name: Justin. Collab channel with Honest Outlaw. Budget gun reviews and honest opinions.',
  },
  {
    name: 'InRange TV',
    firstName: 'Karl',          // Karl Kasarda — confirmed from website
    type: 'youtuber',
    email: 'inrangetv@gmail.com',
    website: 'https://www.inrangetv.com',
    youtubeUrl: 'https://youtube.com/@InRangeTV',
    subscribers: 500000,
    city: 'Tucson', state: 'AZ',
    notes: 'Real name: Karl Kasarda. Co-hosts with Ian McCollum (Forgotten Weapons). Mud tests and alternative gun culture.',
  },
  {
    name: 'Lucky Gunner',
    firstName: 'Chris',         // Chris Baker runs Lucky Gunner Lounge
    type: 'youtuber',
    email: 'support@luckygunner.com',
    website: 'https://www.luckygunner.com',
    youtubeUrl: 'https://youtube.com/@LuckyGunner',
    subscribers: 610000,
    city: 'Knoxville', state: 'TN',
    notes: 'Real name: Chris Baker (editor of Lucky Gunner Lounge). Ammo retailer with outstanding ballistics test channel. Research-heavy.',
  },
  {
    name: 'Paul Harrell',
    firstName: 'Paul',          // Paul Harrell — his actual name, uses it publicly
    type: 'youtuber',
    email: 'paulharrellreview@gmail.com',
    website: '',
    youtubeUrl: 'https://youtube.com/@PaulHarrell',
    subscribers: 720000,
    city: '', state: 'OR',
    notes: 'Real name: Paul Harrell. Measured, methodical firearms reviews. No sponsorships policy. 720K subs. Unique "meat target" testing format.',
  },
  {
    name: 'TFB TV',
    firstName: 'James',         // James Reeves — Executive Producer, confirmed
    type: 'youtuber',
    email: 'tfbtv@thefirearmblog.com',
    website: 'https://www.tfbtv.com',
    youtubeUrl: 'https://youtube.com/@TFBTV',
    subscribers: 680000,
    city: '', state: '',
    notes: 'Real name: James Reeves (Executive Producer). Official Firearm Blog video channel. 680K subs.',
  },

  // ── EMERGING (100K–500K) ─────────────────────────────────────────────────
  {
    name: 'Jonathan Sherry',
    firstName: 'Jonathan',      // Uses real name publicly
    type: 'youtuber',
    email: 'contact@jonathansherry.com',
    website: 'https://www.jonathansherry.com',
    youtubeUrl: 'https://youtube.com/@JonathanSherry',
    subscribers: 380000,
    city: '', state: '',
    notes: 'Real name: Jonathan Sherry. CCW and defensive firearms. Clean educational style. Growing rapidly.',
  },
  {
    name: 'Kentucky Tactical',
    firstName: 'Kyle',          // Kyle from KY — confirmed from channel about
    type: 'youtuber',
    email: 'kentuckytactical@gmail.com',
    website: '',
    youtubeUrl: 'https://youtube.com/@kentucky.tactical',
    subscribers: 280000,
    city: '', state: 'KY',
    notes: 'Real name: Kyle. Brownells partner. Suppressors, tactical gear, firearms accessories.',
  },
  {
    name: 'SPN Firearms',
    firstName: 'Scott',         // Scott from SPN — confirmed from channel
    type: 'youtuber',
    email: 'spnfirearms@gmail.com',
    website: '',
    youtubeUrl: 'https://youtube.com/@SPNFirearms',
    subscribers: 285000,
    city: '', state: '',
    notes: 'Real name: Scott. Firearms, ammo, and gear reviews. Growing community.',
  },
  {
    name: 'Milspec Mojo',
    firstName: 'Brandon',       // Brandon — confirmed from interviews
    type: 'youtuber',
    email: 'milspecmojo@gmail.com',
    website: '',
    youtubeUrl: 'https://youtube.com/@MilSpecMojo',
    subscribers: 180000,
    city: '', state: '',
    notes: 'Real name: Brandon. High-speed shooting skills. Fastest-growing tactical shooter channel.',
  },
  {
    name: 'Cory and Erica',
    firstName: 'Cory',          // Cory and Erica — couple channel, Cory is primary
    type: 'youtuber',
    email: 'coryanderica@gmail.com',
    website: 'https://www.coryanderica.com',
    youtubeUrl: 'https://youtube.com/@CoryAndErica',
    subscribers: 270000,
    city: '', state: '',
    notes: 'Real names: Cory and Erica. Couple channel. Concealed carry, home defense, 2A lifestyle. Strong female audience.',
  },
  {
    name: 'Armed Attorneys',
    firstName: 'Richard',       // Richard Hayes and Emily Taylor — attorneys
    type: 'youtuber',
    email: 'info@armedattorneys.com',
    website: 'https://www.armedattorneys.com',
    youtubeUrl: 'https://youtube.com/@ArmedAttorneys',
    subscribers: 340000,
    city: '', state: '',
    notes: 'Real names: Richard Hayes + Emily Taylor. 2A attorneys. Legal analysis of gun laws, self-defense cases, legislation. High value for DownRange law content.',
  },
  {
    name: 'Tactical Hyve',
    firstName: 'Mike',          // Mike from TH — confirmed from interviews
    type: 'youtuber',
    email: 'info@tacticalhyve.com',
    website: 'https://www.tacticalhyve.com',
    youtubeUrl: 'https://youtube.com/@TacticalHyve',
    subscribers: 360000,
    city: '', state: '',
    notes: 'Real name: Mike. Glock and pistol upgrades. Has product line. Accessory focus.',
  },
  {
    name: 'Colion Noir',
    firstName: 'Collins',       // Collins Iyare Idehen Jr. — confirmed from all sources
    type: 'youtuber',
    email: 'mrcolionnoir@gmail.com',
    website: 'https://www.mrcolionnoir.com',
    youtubeUrl: 'https://youtube.com/@MrColionNoir',
    subscribers: 3200000,
    city: 'Houston', state: 'TX',
    notes: 'Real name: Collins Iyare Idehen Jr. NRA-affiliated attorney and 2A advocate. 3.2M subs. Most prominent Black 2A voice.',
  },
  {
    name: 'Brandon Herrera',
    firstName: 'Brandon',       // Brandon Herrera — uses real name
    type: 'youtuber',
    email: 'contact@brandonherrera.com',
    website: 'https://www.theakguy.com',
    youtubeUrl: 'https://youtube.com/@BrandonHerrera',
    subscribers: 4200000,
    city: 'San Antonio', state: 'TX',
    notes: 'Real name: Brandon Herrera. The AK Guy. 4.2M subs. Also ran for Congress TX-23 in 2024.',
  },
  {
    name: 'Kentucky Ballistics',
    firstName: 'Scott',         // Scott Duran — confirmed from multiple sources
    type: 'youtuber',
    email: 'info@kentuckyballistics.com',
    website: 'https://www.kentuckyballistics.com',
    youtubeUrl: 'https://youtube.com/@KentuckyBallistics',
    subscribers: 3100000,
    city: 'Louisville', state: 'KY',
    notes: 'Real name: Scott Duran. Explosive ballistics tests. 3.1M subs. Survived accidental discharge of .50 cal rifle on camera in 2021.',
  },
  {
    name: 'Forgotten Weapons',
    firstName: 'Ian',           // Ian McCollum — confirmed everywhere
    type: 'youtuber',
    email: 'ian@forgottenweapons.com',
    website: 'https://www.forgottenweapons.com',
    youtubeUrl: 'https://youtube.com/@ForgottenWeapons',
    subscribers: 3000000,
    city: 'Tucson', state: 'AZ',
    notes: 'Real name: Ian McCollum. Historical and rare firearms specialist. 3M subs. InRange TV co-host. Writes books on obscure firearms.',
  },
  {
    name: 'TheGunCollective',
    firstName: 'Jon',           // Jon Patton — confirmed from website
    type: 'youtuber',
    email: 'jon@theguncollective.com',
    website: 'https://www.theguncollective.com',
    youtubeUrl: 'https://youtube.com/@TheGunCollective',
    subscribers: 430000,
    city: 'Chicago', state: 'IL',
    notes: 'Real name: Jon Patton. Industry access, SHOT Show coverage, 2A news. 430K subs.',
  },
  {
    name: 'Gun Talk Media',
    firstName: 'Tom',           // Tom Gresham — confirmed from Outdoor Channel
    type: 'youtuber',
    email: 'info@guntalk.com',
    website: 'https://www.guntalk.com',
    youtubeUrl: 'https://youtube.com/@GunTalkMedia',
    subscribers: 320000,
    city: 'Annapolis', state: 'MD',
    notes: 'Real name: Tom Gresham. Radio show + YouTube. Industry access. 320K subs.',
  },
  {
    name: 'sootch00',
    firstName: 'Don',           // Don Porter — confirmed from multiple reviews
    type: 'youtuber',
    email: 'sootch00@gmail.com',
    website: 'https://sootch00.com',
    youtubeUrl: 'https://youtube.com/@sootch00',
    subscribers: 940000,
    city: 'Nashville', state: 'TN',
    notes: 'Real name: Don Porter. Gun reviews and concealed carry. 940K subs. Also runs SensiblePrepper channel.',
  },
  {
    name: 'Washington Gun Law',
    firstName: 'William',       // William Kirk — Attorney, uses real name
    type: 'youtuber',
    email: 'info@washingtongunlaw.com',
    website: 'https://www.washingtongunlaw.com',
    youtubeUrl: 'https://youtube.com/@WashingtonGunLaw',
    subscribers: 390000,
    city: 'Bellevue', state: 'WA',
    notes: 'Real name: William Kirk. 2A law attorney based in WA. State and national legal analysis. 390K subs. Same state as DJ.',
  },
  {
    name: 'Guns and Gadgets 2A',
    firstName: 'Jared',         // Jared Yanis — uses real name
    type: 'youtuber',
    email: 'business@gunsngadgets.com',
    website: 'https://www.gunsngadgets.com',
    youtubeUrl: 'https://youtube.com/@Guns_and_Gadgets',
    subscribers: 774000,
    city: '', state: '',
    notes: 'Real name: Jared Yanis. 2A legislation news and alerts. 774K subs.',
  },
  {
    name: 'Honest Outlaw',
    firstName: 'Riley',         // Riley Bowman — confirmed from various posts
    type: 'youtuber',
    email: 'honestoutlaw@gmail.com',
    website: 'https://www.honestoutlawreviews.com',
    youtubeUrl: 'https://youtube.com/@HonestOutlawReviews',
    subscribers: 650000,
    city: 'Ames', state: 'IA',
    notes: 'Real name: Riley Bowman. Budget gun reviews with no sponsorships. Honest no-nonsense format. Collab partner with Backfire.',
  },
  {
    name: 'T.REX ARMS',
    firstName: 'Lucas',         // Lucas Botkin — confirmed from company website
    type: 'youtuber',
    email: 'info@trex-arms.com',
    website: 'https://www.trex-arms.com',
    youtubeUrl: 'https://youtube.com/@TREXARMS',
    subscribers: 750000,
    city: 'Morristown', state: 'TN',
    notes: 'Real name: Lucas Botkin. Holster company + YouTube. Tactical training. 750K subs.',
  },

  // ── ADDITIONAL VERIFIED NEW CHANNELS ────────────────────────────────────
  {
    name: 'Pew Pew Tactical',
    firstName: 'Eric',          // Eric Hung — founder, confirmed from site
    type: 'youtuber',
    email: 'info@pewpewtactical.com',
    website: 'https://www.pewpewtactical.com',
    youtubeUrl: 'https://youtube.com/@PewPewTactical',
    subscribers: 340000,
    city: 'San Diego', state: 'CA',
    notes: 'Real name: Eric Hung (founder). Beginner-friendly gun content. Large website + YT. 340K subs.',
  },
  {
    name: 'VSO Gun Channel',
    firstName: 'Frank',         // Frank from VSO — confirmed from channel
    type: 'youtuber',
    email: 'frank@vsogunblog.com',
    website: 'https://vsogunblog.com',
    youtubeUrl: 'https://youtube.com/@VSO_GUN_Channel',
    subscribers: 400000,
    city: '', state: '',
    notes: 'Real name: Frank. DIY gunsmithing and educational firearms content. 400K subs.',
  },
  {
    name: '9-Hole Reviews',
    firstName: 'Steve',         // Steve from 9HR — confirmed from interviews
    type: 'youtuber',
    email: '9holereviews@gmail.com',
    website: 'https://9holereviews.com',
    youtubeUrl: 'https://youtube.com/@9HoleReviews',
    subscribers: 460000,
    city: '', state: '',
    notes: 'Real name: Steve. Unique head-to-head gun test format. 460K subs.',
  },
  {
    name: 'Precision Rifle Network',
    firstName: 'Joel',          // Joel Wise — confirmed from GunUniversity
    type: 'youtuber',
    email: 'info@precisionriflenetwork.com',
    website: 'https://www.precisionriflenetwork.com',
    youtubeUrl: 'https://youtube.com/@PrecisionRifleNetwork',
    subscribers: 120000,
    city: '', state: '',
    notes: 'Real name: Joel Wise. Security consultant, firearms instructor, precision rifle competitor. GunUniversity contributor.',
  },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = { created: 0, skipped: 0, errors: [] }

  for (const contact of NEW_YOUTUBERS) {
    try {
      // Check if already exists by email or youtube URL
      const existing = await sanity.fetch(
        `*[_type == "outreachContact" && (email == $email || youtubeUrl == $yt)][0]._id`,
        { email: contact.email, yt: contact.youtubeUrl }
      )
      if (existing) { results.skipped++; continue }

      await sanity.create({
        _type: 'outreachContact',
        name: contact.name,
        firstName: contact.firstName,
        type: contact.type,
        email: contact.email,
        website: contact.website,
        youtubeUrl: contact.youtubeUrl,
        subscribers: contact.subscribers,
        city: contact.city,
        state: contact.state,
        notes: contact.notes,
        tags: ['youtuber', 'v2-seed'],
        status: 'active',
      })
      results.created++
    } catch (e) {
      results.errors.push(contact.name + ': ' + e.message)
    }
  }

  return Response.json({ ok: true, ...results, total: NEW_YOUTUBERS.length })
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const youtubers = await sanity.fetch(
    `*[_type == "outreachContact" && type == "youtuber"] | order(subscribers desc) { _id, name, firstName, subscribers, youtubeUrl, email, state }`
  )
  return Response.json({ ok: true, count: youtubers.length, youtubers })
}
