export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// Firearms instructors and training organizations
// Sources: NRA instructor directory, USCCA, Gun Talk, public instructor websites
const INSTRUCTORS = [
  // ── MAJOR TRAINING ORGANIZATIONS ─────────────────────────────────────────
  { name:'NRA Training',                    email:'training@nrahq.org',               website:'https://www.nratraining.com',            city:'Fairfax',         state:'VA', notes:'NRA instructor certification programs. 125k+ certified instructors nationwide. Contact for instructor network outreach.' },
  { name:'USCCA (US Concealed Carry Assoc)',email:'support@uscca.com',                website:'https://www.usconcealedcarry.com',        city:'West Bend',       state:'WI', notes:'500k+ members. Training arm with certified instructor network. Delta Defense parent company.' },
  { name:'Gunsite Academy',                 email:'info@gunsite.com',                 website:'https://www.gunsite.com',                city:'Paulden',         state:'AZ', notes:'Premier firearms training school. Founded by Jeff Cooper. Law enforcement and civilian courses.' },
  { name:'Thunder Ranch',                   email:'info@thunderranchinc.com',          website:'https://www.thunderranchinc.com',         city:'Lakeview',        state:'OR', notes:'Clint Smith\'s school. Defensive rifle, handgun, shotgun. Elite-level training.' },
  { name:'Frontsight Firearms Training',    email:'info@frontsight.com',              website:'https://www.frontsight.com',             city:'Pahrump',         state:'NV', notes:'Large Nevada training facility. Multiple courses, high student volume.' },
  { name:'Magpul Dynamics / Art of the Dynamic Carbine', email:'info@magpul.com',     website:'https://www.magpul.com',                 city:'Austin',          state:'TX', notes:'Industry-leading carbine training content and courses.' },
  { name:'Haley Strategic Partners',        email:'info@haleystrategic.com',           website:'https://www.haleystrategic.com',          city:'Phoenix',         state:'AZ', notes:'Travis Haley. Combat-proven curriculum. Strong online following.' },
  { name:'Vickers Tactical',               email:'info@vickerstactical.com',          website:'https://www.vickerstactical.com',         city:'Fayetteville',    state:'NC', notes:'Larry Vickers. Special Forces veteran. Handgun and rifle courses.' },
  { name:'Alias Training & Security Services',email:'info@aliastraining.com',         website:'https://www.aliastraining.com',           city:'Orlando',         state:'FL', notes:'Law enforcement and civilian training. Florida-based.' },
  { name:'Sentinel Concepts',              email:'info@sentinelconcepts.com',          website:'https://www.sentinelconcepts.com',        city:'Myrtle Beach',    state:'SC', notes:'Steve Fisher. Shotgun and carbine specialist. Competition and defensive.' },
  { name:'Ken Hackathorn Training',        email:'info@kenhackathorn.com',             website:'https://www.kenhackathorn.com',           city:'Cincinnati',      state:'OH', notes:'Ken Hackathorn. Legendary pistol instructor. FBI and DEA trainer.' },
  { name:'Rangemaster Firearms Training',  email:'tom@rangemaster.us',                website:'https://www.rangemaster.us',             city:'Memphis',         state:'TN', notes:'Tom Givens. High round-count defensive pistol. 60+ student gunfight alumni.' },
  { name:'Citizens Defense Research',      email:'info@citizensdefenseresearch.com',   website:'https://www.citizensdefenseresearch.com', city:'Nashville',       state:'TN', notes:'John Johnston & Melody Lauer. Research-based defensive training.' },
  { name:'I.C.E. Training Company',        email:'info@icetraining.us',               website:'https://www.icetraining.us',             city:'Portland',        state:'OR', notes:'Rob Pincus. Combat Focus Shooting methodology. 600+ instructors certified.' },
  { name:'MDT (Mountain Dynamics Training)',email:'info@mountaindynamicstraining.com', website:'https://www.mountaindynamicstraining.com',city:'Kalispell',       state:'MT', notes:'Precision rifle and carbine. Northwest focus.' },

  // ── YOUTUBE / MEDIA INSTRUCTORS ───────────────────────────────────────────
  { name:'Active Self Protection (John Correia)', email:'john@activeselfprotection.com', website:'https://activeselfprotection.com',     city:'Gilbert',         state:'AZ', notes:'John Correia. 4M+ YouTube subscribers. Daily DGU analysis. Premier training brand.' },
  { name:'Warrior Poet Society (John Lovell)',    email:'info@warriorpoetsociety.net',    website:'https://www.warriorpoetsociety.net',    city:'Atlanta',         state:'GA', notes:'John Lovell. 2M+ YouTube subs. Faith-based warrior culture. Strong brand.' },
  { name:'Pew Pew Tactical',                      email:'hello@pewpewtactical.com',       website:'https://www.pewpewtactical.com',        city:'Phoenix',         state:'AZ', notes:'Large firearms media/training brand. 1M+ monthly readers.' },
  { name:'Paul Harrell (Estate/Archive)',          email:'contact@paulharrell.com',        website:'https://www.youtube.com/@PaulHarrell',  city:'Kennewick',       state:'WA', notes:'Legendary instructor. Passed 2024. Archive videos still valuable for coverage.' },
  { name:'Colion Noir',                           email:'colionnoir@gmail.com',            website:'https://www.colionnoir.com',            city:'Houston',         state:'TX', notes:'NRA News commentator. 2M+ YouTube. Attorney and firearms advocate.' },

  // ── REGIONAL INSTRUCTORS ─────────────────────────────────────────────────
  { name:'Firearms Academy of Seattle',    email:'info@firearmsacademy.com',            website:'https://www.firearmsacademy.com',         city:'Onalaska',        state:'WA', notes:'Marty Hayes. WA state flagship training school. Force science background.' },
  { name:'Insights Training Center',      email:'info@insightstraining.com',            website:'https://www.insightstraining.com',        city:'Bellevue',        state:'WA', notes:'WA state. Greg Hamilton. Renowned defensive pistol.' },
  { name:'InSights Training Center',      email:'greg@insightstraining.com',            website:'https://www.insightstraining.com',        city:'Redmond',         state:'WA', notes:'Priority WA contact for DownRange.' },
  { name:'Firearms Training Associates',  email:'info@firearmsassociates.com',          website:'https://www.firearmsassociates.com',      city:'Laguna Hills',    state:'CA', notes:'CA-based. John Farnam\'s school. DTI courses.' },
  { name:'Defense Training International',email:'dti@defense-training.com',            website:'https://www.defense-training.com',        city:'Laporte',         state:'CO', notes:'John Farnam. Seminal defensive firearms trainer.' },
  { name:'Texas Defensive Firearms Training',email:'info@texasdefensive.com',          website:'https://www.texasdefensive.com',          city:'Austin',          state:'TX', notes:'TX-based. Multiple instructor staff.' },
  { name:'Tac-1 (Texas Accuracy Concepts)',email:'info@tac-1.net',                     website:'https://www.tac-1.net',                  city:'Bedford',         state:'TX', notes:'TX law enforcement and civilian training.' },
  { name:'Florida Firearms Academy',      email:'info@floridafirearmsacademy.com',      website:'https://www.floridafirearmsacademy.com',  city:'Orlando',         state:'FL', notes:'FL state. Multiple certification courses.' },
  { name:'Tactical Response',            email:'info@tacticalresponse.com',             website:'https://www.tacticalresponse.com',        city:'Camden',          state:'TN', notes:'James Yeager. Controversial but high-traffic YouTube.' },
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let created = 0, skipped = 0

  for (const inst of INSTRUCTORS) {
    const existing = await sanity.fetch(
      '*[_type=="outreachContact" && name==$n][0]{_id}',
      { n: inst.name }
    )
    if (existing) { skipped++; continue }

    await sanity.create({
      _type:    'outreachContact',
      name:     inst.name,
      type:     'instructor',
      email:    inst.email,
      website:  inst.website,
      city:     inst.city,
      state:    inst.state,
      notes:    inst.notes,
      status:   'active',
    })
    created++
  }

  return Response.json({ ok: true, created, skipped, total: INSTRUCTORS.length })
}
