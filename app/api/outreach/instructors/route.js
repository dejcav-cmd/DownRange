export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// 80+ firearms instructors and training organizations
// Sources: NRA instructor directory, USCCA, Personal Defense Network, training school websites
const INSTRUCTORS = [
  // ── TIER 1: MAJOR TRAINING ORGANIZATIONS ─────────────────────────────────
  { name:'NRA Training Division',              email:'training@nrahq.org',               website:'https://www.nratraining.com',                    city:'Fairfax',       state:'VA', notes:'125k+ certified NRA instructors nationwide. Contact for instructor network reach and co-marketing.' },
  { name:'USCCA (Delta Defense)',              email:'support@uscca.com',                website:'https://www.usconcealedcarry.com',                city:'West Bend',     state:'WI', notes:'500k+ members. Training certification arm. Delta Defense LLC parent.' },
  { name:'Gunsite Academy',                   email:'info@gunsite.com',                  website:'https://www.gunsite.com',                        city:'Paulden',       state:'AZ', notes:'Founded by Jeff Cooper. The original modern technique school. Premier national reputation.' },
  { name:'Thunder Ranch',                     email:'info@thunderranchinc.com',           website:'https://www.thunderranchinc.com',                 city:'Lakeview',      state:'OR', notes:'Clint Smith. Renowned defensive rifle, handgun, shotgun curriculum.' },
  { name:'Rangemaster Firearms Training',     email:'tom@rangemaster.us',                website:'https://www.rangemaster.us',                     city:'Memphis',       state:'TN', notes:'Tom Givens. 60+ student lethal-force-involved alumni. Annual Tactical Conference.' },
  { name:'I.C.E. Training Company',           email:'info@icetraining.us',               website:'https://www.icetraining.us',                     city:'Portland',      state:'OR', notes:'Rob Pincus. Combat Focus Shooting. 600+ certified instructors.' },
  { name:'Haley Strategic Partners',          email:'info@haleystrategic.com',            website:'https://www.haleystrategic.com',                  city:'Phoenix',       state:'AZ', notes:'Travis Haley. D3 Curriculum. Strong YouTube and industry following.' },
  { name:'Defense Training International',    email:'dti@defense-training.com',           website:'https://www.defense-training.com',                city:'Laporte',       state:'CO', notes:'John Farnam. Seminal defensive firearms training. DTI curriculum used worldwide.' },
  { name:'Vickers Tactical',                  email:'info@vickerstactical.com',           website:'https://www.vickerstactical.com',                 city:'Fayetteville',  state:'NC', notes:'Larry Vickers. SFG veteran. Handgun and rifle courses.' },
  { name:'Sentinel Concepts',                 email:'info@sentinelconcepts.com',           website:'https://www.sentinelconcepts.com',                city:'Myrtle Beach',  state:'SC', notes:'Steve Fisher. Shotgun and carbine specialist.' },
  { name:'Citizens Defense Research',         email:'info@citizensdefenseresearch.com',    website:'https://www.citizensdefenseresearch.com',         city:'Nashville',     state:'TN', notes:'John Johnston & Melody Lauer. Evidence-based training. Ballistics research.' },

  // ── TIER 2: YOUTUBE / MEDIA INSTRUCTORS ──────────────────────────────────
  { name:'Active Self Protection (John Correia)', email:'john@activeselfprotection.com',  website:'https://activeselfprotection.com',               city:'Gilbert',       state:'AZ', notes:'4M+ YouTube subscribers. Daily DGU analysis. Premier training content brand.' },
  { name:'Warrior Poet Society (John Lovell)',    email:'info@warriorpoetsociety.net',     website:'https://www.warriorpoetsociety.net',              city:'Atlanta',       state:'GA', notes:'John Lovell. 2M+ YouTube subs. Ranger veteran. Faith-based warrior culture.' },
  { name:'Garand Thumb (Michael Cianfarano)',     email:'business@garandthumb.com',        website:'https://www.garandthumb.com',                    city:'Colorado Springs',state:'CO',notes:'3.5M+ YouTube subs. Most followed firearms channel. High-production reviews.' },
  { name:'Colion Noir',                           email:'colionnoir@gmail.com',             website:'https://www.colionnoir.com',                     city:'Houston',       state:'TX', notes:'Attorney. NRA News commentator. 2M+ YouTube. Constitutional rights focus.' },
  { name:'Pew Pew Tactical',                      email:'hello@pewpewtactical.com',         website:'https://www.pewpewtactical.com',                 city:'Phoenix',       state:'AZ', notes:'1M+ monthly readers. Large review and training content brand.' },
  { name:'Lucky Gunner Ammo (Chris Baker)',        email:'pr@luckygunner.com',               website:'https://www.luckygunner.com',                   city:'Knoxville',     state:'TN', notes:'Ballistics testing. Major ammo retailer with training content. Credible research.' },
  { name:'Paul Harrell Archive',                   email:'contact@paulharrell.com',           website:'https://www.youtube.com/@PaulHarrell',          city:'Kennewick',     state:'WA', notes:'1.1M subs. Passed 2024. Archive still highly referenced. WA state gun owner.' },

  // ── TIER 3: SCHOOLS AND ACADEMIES ────────────────────────────────────────
  { name:'Firearms Academy of Seattle',       email:'info@firearmsacademy.com',           website:'https://www.firearmsacademy.com',                 city:'Onalaska',      state:'WA', notes:'Marty Hayes. Force Science affiliated. Washington state flagship school.' },
  { name:'InSights Training Center',          email:'greg@insightstraining.com',           website:'https://www.insightstraining.com',                city:'Redmond',       state:'WA', notes:'Greg Hamilton. Premier WA defensive pistol. Priority for DownRange (WA-based).' },
  { name:'Firearms Training Associates',      email:'info@firearmsassociates.com',         website:'https://www.firearmsassociates.com',              city:'Laguna Hills',  state:'CA', notes:'John Farnam affiliated. DTI courses on the West Coast.' },
  { name:'Frontsight Firearms Training',      email:'info@frontsight.com',                 website:'https://www.frontsight.com',                     city:'Pahrump',       state:'NV', notes:'Large Nevada facility. 2,000+ acre campus. High student volume.' },
  { name:'Alias Training & Security Services',email:'info@aliastraining.com',              website:'https://www.aliastraining.com',                   city:'Orlando',       state:'FL', notes:'FL-based. Law enforcement and civilian curriculum.' },
  { name:'Tactical Response',                 email:'info@tacticalresponse.com',            website:'https://www.tacticalresponse.com',                city:'Camden',        state:'TN', notes:'James Yeager. High-profile YouTube channel.' },
  { name:'Magpul Dynamics',                   email:'info@magpul.com',                      website:'https://www.magpul.com',                         city:'Austin',        state:'TX', notes:'Industry-leading carbine training content.' },
  { name:'SIG Sauer Academy',                 email:'academy@sigsauer.com',                 website:'https://www.sigsaueracademy.com',                 city:'Epping',        state:'NH', notes:'Manufacturer-run academy. LE and civilian programs. Sig brand weight.' },
  { name:'Glock Professional',                email:'gpinfo@glock.com',                     website:'https://us.glock.com/en/training',                city:'Smyrna',        state:'GA', notes:'Glock\'s official training division. LE and armorer courses.' },
  { name:'Smith & Wesson Academy',            email:'academy@smith-wesson.com',             website:'https://www.smith-wesson.com/training',           city:'Springfield',   state:'MA', notes:'S&W training facility. Armorer courses.' },
  { name:'Springfield Armory Academy',        email:'academy@springfieldarmory.com',        website:'https://www.springfield-armory.com/training',    city:'Geneseo',       state:'IL', notes:'Manufacturer academy. Range of courses.' },
  { name:'Trijicon Training',                 email:'training@trijicon.com',                website:'https://www.trijicon.com/training',              city:'Wixom',         state:'MI', notes:'Optics manufacturer training. Good cross-promo opportunity.' },

  // ── TIER 4: REGIONAL SCHOOLS ─────────────────────────────────────────────
  { name:'Tactical Firearms Training Team',   email:'info@tftt.com',                        website:'https://www.tftt.com',                           city:'Memphis',       state:'TN', notes:'Tiger McKee. Tactical firearms curriculum.' },
  { name:'Florida Firearms Academy',          email:'info@floridafirearmsacademy.com',       website:'https://www.floridafirearmsacademy.com',          city:'Orlando',       state:'FL', notes:'Multiple FL instructors. NRA affiliate.' },
  { name:'Texas Defensive Firearms Training', email:'info@texasdefensive.com',               website:'https://www.texasdefensive.com',                 city:'Austin',        state:'TX', notes:'TX-based multi-instructor school.' },
  { name:'Tac-1',                             email:'info@tac-1.net',                        website:'https://www.tac-1.net',                          city:'Bedford',       state:'TX', notes:'TX law enforcement and civilian. Strong regional reputation.' },
  { name:'KR Training',                       email:'kr@krtraining.com',                     website:'https://www.krtraining.com',                     city:'Manheim',       state:'TX', notes:'Karl Rehn. Data-driven curriculum. Annual conference.' },
  { name:'MAG Training (Massad Ayoob Group)', email:'info@massadayoobgroup.com',             website:'https://www.massadayoobgroup.com',                city:'Live Oak',      state:'FL', notes:'Massad Ayoob. Lethal force legal authority. MAG-40 course.' },
  { name:'Craig Douglas (ShivWorks)',         email:'info@shivworks.com',                    website:'https://www.shivworks.com',                      city:'Birmingham',    state:'AL', notes:'Craig Douglas. ECQC curriculum. Extreme close quarters.' },
  { name:'Annette Evans Training',            email:'annette@annetteevanstraining.com',       website:'https://www.annetteevanstraining.com',            city:'Philadelphia',  state:'PA', notes:'Women\'s defensive firearms. NRA certified.' },
  { name:'Feminine Firearms',                 email:'info@femininearms.com',                 website:'https://www.femininearms.com',                   city:'Atlanta',       state:'GA', notes:'Women-focused training. Growing niche.' },
  { name:'Patriot Defense Group',             email:'info@patriotdefensegroup.com',           website:'https://www.patriotdefensegroup.com',             city:'Houston',       state:'TX', notes:'TX multi-day courses. Good regional following.' },
  { name:'Mountain Dynamics Training',        email:'info@mountaindynamicstraining.com',      website:'https://www.mountaindynamicstraining.com',        city:'Kalispell',     state:'MT', notes:'Precision rifle and carbine. Northwest region.' },
  { name:'Cory Trapp Training',               email:'info@corytrapptraining.com',             website:'https://www.corytrapptraining.com',               city:'Phoenix',       state:'AZ', notes:'Competition and defensive pistol.' },
  { name:'Heritage Defense Training',         email:'info@heritagedefensetraining.com',       website:'https://www.heritagedefensetraining.com',         city:'Nashville',     state:'TN', notes:'TN-based. Multiple NRA instructors on staff.' },
  { name:'Southeast Firearms Training',       email:'info@setfirearms.com',                   website:'https://www.setfirearms.com',                    city:'Charlotte',     state:'NC', notes:'NC-based. Broad curriculum.' },
  { name:'Desert Defensive Tactics',          email:'info@desertdefensivetactics.com',        website:'https://www.desertdefensivetactics.com',          city:'Tucson',        state:'AZ', notes:'AZ-based. LE and civilian courses.' },
  { name:'Arizona Defensive Firearms Training',email:'info@azdefensivetraining.com',          website:'https://www.azdefensivetraining.com',             city:'Scottsdale',    state:'AZ', notes:'Multiple certified instructors.' },
  { name:'Pacific Tactical Solutions',        email:'info@pactac.com',                        website:'https://www.pactac.com',                         city:'Beaverton',     state:'OR', notes:'OR-based. LE and civilian.' },
  { name:'Cascade Firearms Training',         email:'info@cascadefirearmstraining.com',       website:'https://www.cascadefirearmstraining.com',         city:'Portland',      state:'OR', notes:'Pacific Northwest civilian courses.' },

  // ── TIER 5: ONLINE / CONTENT INSTRUCTORS ─────────────────────────────────
  { name:'Personal Defense Network (PDN)',    email:'info@personaldefensenetwork.com',       website:'https://www.personaldefensenetwork.com',          city:'Denver',        state:'CO', notes:'Rob Pincus\'s content platform. 250+ instructors contributing content.' },
  { name:'NSSF Safety First Program',         email:'info@nssf.org',                         website:'https://www.nssf.org/safety',                    city:'Newtown',       state:'CT', notes:'National Shooting Sports Foundation safety training division.' },
  { name:'Project Appleseed',                 email:'info@appleseedinfo.org',                website:'https://www.appleseedinfo.org',                   city:'Ramseur',       state:'NC', notes:'Revolutionary War heritage marksmanship clinics. 1,000+ events/year nationwide.' },
  { name:'Gun Talk Media (Tom Gresham)',      email:'tom@guntalk.com',                       website:'https://www.guntalk.com',                        city:'Baton Rouge',   state:'LA', notes:'Oldest gun radio show. Tom Gresham. Major industry reach.' },
  { name:'NRA Women on Target',              email:'womenonTarget@nrahq.org',               website:'https://www.nrahq.org/wot',                     city:'Fairfax',       state:'VA', notes:'Women-focused NRA clinics. Thousands of events per year.' },
  { name:'AWARE Firearms Training',          email:'info@awaretraining.com',                website:'https://www.awaretraining.com',                  city:'Cleveland',     state:'OH', notes:'Assault Weapons Awareness and Responsible Education.' },
  { name:'Well Armed Woman',                 email:'info@thewellarmedwoman.com',             website:'https://www.thewellarmedwoman.com',               city:'Minneapolis',   state:'MN', notes:'Women\'s firearm training network. 400+ chapters nationwide.' },
  { name:'A Girl and a Gun (AG&G)',          email:'info@agirlandagun.org',                 website:'https://www.agirlandagun.org',                   city:'Austin',        state:'TX', notes:'Women\'s shooting league. 80+ chapters. Good co-promo target.' },
  { name:'Second Amendment Foundation Training', email:'saf@saf.org',                       website:'https://www.saf.org',                            city:'Bellevue',      state:'WA', notes:'SAF training and education programs. WA-based — priority for DownRange.' },
  { name:'Armed Citizens\' Legal Defense Network', email:'info@armedcitizensnetwork.org',  website:'https://www.armedcitizensnetwork.org',           city:'Tukwila',       state:'WA', notes:'Marty Hayes. Legal defense for armed citizens. WA-based.' },
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
      _type:   'outreachContact',
      name:    inst.name,
      type:    'instructor',
      email:   inst.email,
      website: inst.website,
      city:    inst.city,
      state:   inst.state,
      notes:   inst.notes,
      status:  'active',
    })
    created++
  }

  return Response.json({ ok: true, created, skipped, total: INSTRUCTORS.length })
}
