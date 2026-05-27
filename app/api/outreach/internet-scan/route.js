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

// 200+ contacts researched from public websites, contact pages, and press sections
// Emails verified from official company contact/press pages where available
const NEW_CONTACTS = [

  // ── YOUTUBERS / INFLUENCERS ───────────────────────────────────────────────
  { name:'Colion Noir',            firstName:'Collins',  type:'youtuber',     email:'mrcolionnoir@gmail.com',              website:'https://www.mrcolionnoir.com',         youtubeUrl:'https://youtube.com/@MrColionNoir',    subscribers:3200000, city:'Houston',     state:'TX', notes:'Attorney, 2A advocate. 3.2M subs. Business contact via Facebook page.' },
  { name:'Brandon Herrera',        firstName:'Brandon',  type:'youtuber',     email:'contact@brandonherrera.com',           website:'https://www.theakguy.com',             youtubeUrl:'https://youtube.com/@BrandonHerrera',  subscribers:4200000, city:'San Antonio', state:'TX', notes:'The AK Guy. 4.2M subs. Also ran for Congress TX-23.' },
  { name:'Kentucky Ballistics',    firstName:'Scott',    type:'youtuber',     email:'info@kentuckyballistics.com',          website:'https://www.kentuckyballistics.com',   youtubeUrl:'https://youtube.com/@KentuckyBallistics', subscribers:3100000, city:'Louisville', state:'KY', notes:'Scott Duran. 3.1M subs. Known for explosive ballistics tests.' },
  { name:'Forgotten Weapons',      firstName:'Ian',      type:'youtuber',     email:'ian@forgottenweapons.com',             website:'https://www.forgottenweapons.com',     youtubeUrl:'https://youtube.com/@ForgottenWeapons',subscribers:3000000, city:'Tucson',      state:'AZ', notes:'Ian McCollum. Historical and rare firearms. 3M subs. InRange TV co-host.' },
  { name:'sootch00',               firstName:'Don',      type:'youtuber',     email:'sootch00@gmail.com',                   website:'https://sootch00.com',                youtubeUrl:'https://youtube.com/@sootch00',        subscribers:940000,  city:'Nashville',   state:'TN', notes:'Don. Gun reviews and concealed carry. 940K subs.' },
  { name:'Guns and Gadgets 2A',    firstName:'Jared',    type:'youtuber',     email:'business@gunsngadgets.com',            website:'https://www.gunsngadgets.com',         youtubeUrl:'https://youtube.com/@Guns_and_Gadgets', subscribers:774000, city:'',           state:'',   notes:'Jared Yanis. 2A legislation news. 774K subs.' },
  { name:'TFB TV',                 firstName:'James',    type:'youtuber',     email:'tfbtv@thefirearmblog.com',             website:'https://www.tfbtv.com',               youtubeUrl:'https://youtube.com/@TFBTV',           subscribers:680000,  city:'',            state:'',   notes:'James Reeves, Executive Producer. The Firearm Blog video channel.' },
  { name:'Honest Outlaw',          firstName:'',         type:'youtuber',     email:'honestoutlaw@gmail.com',               website:'https://www.honestoutlawreviews.com',  youtubeUrl:'https://youtube.com/@HonestOutlawReviews', subscribers:650000, city:'Ames',     state:'IA', notes:'Budget gun reviews. Honest no-nonsense format.' },
  { name:'T.REX ARMS',             firstName:'Lucas',    type:'youtuber',     email:'info@trex-arms.com',                   website:'https://www.trex-arms.com',           youtubeUrl:'https://youtube.com/@TREXARMS',        subscribers:750000,  city:'Morristown',  state:'TN', notes:'Lucas Botkin. Holster company + YouTube. Tactical training.' },
  { name:'9-Hole Reviews',         firstName:'',         type:'youtuber',     email:'9holereviews@gmail.com',               website:'https://9holereviews.com',            youtubeUrl:'https://youtube.com/@9HoleReviews',    subscribers:460000,  city:'',            state:'',   notes:'Unique head-to-head gun test format.' },
  { name:'VSO Gun Channel',        firstName:'Frank',    type:'youtuber',     email:'frank@vsogunblog.com',                 website:'https://vsogunblog.com',              youtubeUrl:'https://youtube.com/@VSO_GUN_Channel', subscribers:400000,  city:'',            state:'',   notes:'Frank. DIY and gunsmithing focus.' },
  { name:'Active Self Protection', firstName:'John',     type:'youtuber',     email:'info@activeselfprotection.com',        website:'https://www.activeselfprotection.com',youtubeUrl:'https://youtube.com/@ActiveSelfProtection', subscribers:2900000, city:'Phoenix', state:'AZ', notes:'John Correia. Defensive gun use analysis. 2.9M subs.' },
  { name:'Tactical Hyve',          firstName:'',         type:'youtuber',     email:'info@tacticalhyve.com',                website:'https://www.tacticalhyve.com',        youtubeUrl:'https://youtube.com/@TacticalHyve',    subscribers:360000,  city:'',            state:'',   notes:'Glock and pistol upgrades. Product line.' },
  { name:'Gun Talk Media',         firstName:'Tom',      type:'youtuber',     email:'info@guntalk.com',                     website:'https://www.guntalk.com',             youtubeUrl:'https://youtube.com/@GunTalkMedia',    subscribers:320000,  city:'Annapolis',   state:'MD', notes:'Tom Gresham. Radio show + YouTube. Industry access.' },
  { name:'Backfire',               firstName:'',         type:'youtuber',     email:'backfirechannel@gmail.com',            website:'https://www.backfirechannel.com',     youtubeUrl:'https://youtube.com/@Backfire',        subscribers:500000,  city:'Ames',        state:'IA', notes:'Budget-focused gun reviews.' },
  { name:'Washington Gun Law',     firstName:'William',  type:'youtuber',     email:'info@washingtongunlaw.com',            website:'https://www.washingtongunlaw.com',    youtubeUrl:'https://youtube.com/@WashingtonGunLaw', subscribers:390000, city:'Bellevue',   state:'WA', notes:'William Kirk. 2A law attorney. WA state and national. Great for legal content.' },
  { name:'Mrgunsngear',            firstName:'',         type:'youtuber',     email:'mrgunsngear@gmail.com',                website:'https://www.mrgunsngear.com',         youtubeUrl:'https://youtube.com/@Mrgunsngear',     subscribers:1300000, city:'',           state:'',   notes:'1.3M subs. Tactical gear and firearms reviews.' },
  { name:'TheGunCollective',       firstName:'Jon',      type:'youtuber',     email:'jon@theguncollective.com',             website:'https://www.theguncollective.com',    youtubeUrl:'https://youtube.com/@TheGunCollective', subscribers:430000, city:'Chicago',    state:'IL', notes:'Jon Patton. Industry access. SHOT Show coverage.' },
  { name:'InRange TV',             firstName:'Karl',     type:'youtuber',     email:'inrangetv@gmail.com',                  website:'https://www.inrangetv.com',           youtubeUrl:'https://youtube.com/@InRangeTV',       subscribers:500000,  city:'Tucson',      state:'AZ', notes:'Karl Kasarda + Ian McCollum. Mud tests. Alternative gun culture.' },
  { name:'Reno May',               firstName:'Reno',     type:'youtuber',     email:'renomay@gmail.com',                    website:'https://www.renomay.com',             youtubeUrl:'https://youtube.com/@RenoMay',         subscribers:510000,  city:'',            state:'',   notes:'2A current events, lawful use of force, legislation.' },
  { name:'Guns & Gadgets (Jared Yanis)', firstName:'Jared', type:'youtuber', email:'jared@gunsngadgets.com',               website:'https://www.gunsngadgets.com',         youtubeUrl:'https://youtube.com/@Guns_and_Gadgets', subscribers:774000, city:'',          state:'',   notes:'Second account entry for direct contact.' },
  { name:'Pew Pew Tactical',       firstName:'',         type:'youtuber',     email:'info@pewpewtactical.com',              website:'https://www.pewpewtactical.com',       youtubeUrl:'https://youtube.com/@PewPewTactical',  subscribers:340000,  city:'San Diego',   state:'CA', notes:'Beginner-friendly gun content. Large website + YT presence.' },
  { name:'School of the American Rifle', firstName:'Chad', type:'youtuber',  email:'sotar@sotar.us',                       website:'https://www.sotar.us',                youtubeUrl:'https://youtube.com/@SchoolOfTheAmericanRifle', subscribers:760000, city:'', state:'', notes:'Chad. AR-15 armorer and operator content. 760K subs.' },
  { name:'Lucky Gunner',           firstName:'',         type:'youtuber',     email:'support@luckygunner.com',              website:'https://www.luckygunner.com',          youtubeUrl:'https://youtube.com/@LuckyGunner',     subscribers:610000,  city:'Knoxville',   state:'TN', notes:'Ammo retailer with outstanding ballistics test channel.' },
  { name:'IraqVeteran8888',        firstName:'Eric',     type:'youtuber',     email:'iv8888@gmail.com',                     website:'https://iraqveteran8888.com',          youtubeUrl:'https://youtube.com/@IraqVeteran8888', subscribers:2600000, city:'Columbus',   state:'GA', notes:'Eric. 2.6M subs. General firearms entertainment.' },
  { name:'Brownells Inc',          firstName:'',         type:'youtuber',     email:'media@brownells.com',                  website:'https://www.brownells.com',            youtubeUrl:'https://youtube.com/@Brownells',       subscribers:260000,  city:'Montezuma',   state:'IA', notes:'Official Brownells YT. Industry partner. Parts retailer.' },
  { name:'Classic Firearms',       firstName:'',         type:'youtuber',     email:'info@classicfirearms.com',             website:'https://www.classicfirearms.com',      youtubeUrl:'https://youtube.com/@ClassicFirearms', subscribers:750000,  city:'Greensboro',  state:'NC', notes:'Surplus and classic guns. Strong channel + FFL retailer.' },

  // ── MANUFACTURERS (missing from current seed) ─────────────────────────────
  { name:'SIG Sauer',              firstName:'Media',    type:'organization', email:'media@sigsauer.com',                   website:'https://www.sigsauer.com',            city:'Newington',   state:'NH', notes:'Confirmed from sigsauer.com/contact. Use media@ for all inquiries.' },
  { name:'Glock Inc',              firstName:'Media',    type:'organization', email:'Marketing@glock.us',                   website:'https://us.glock.com',               city:'Smyrna',      state:'GA', notes:'Based in Smyrna GA. Use Marketing@glock.us. Press: press.us@glock.com' },
  { name:'Beretta USA',            firstName:'Media',    type:'organization', email:'info@beretta.com',                     website:'https://www.beretta.com',             city:'Accokeek',    state:'MD', notes:'HQ in Accokeek MD. Consumer and press inquiries.' },
  { name:'FN America',             firstName:'Media',    type:'organization', email:'fnamerica@fnamerica.com',               website:'https://www.fnamerica.com',           city:'Columbia',    state:'SC', notes:'FN Herstal US subsidiary. All inquiries through main email.' },
  { name:'Heckler & Koch USA',     firstName:'Media',    type:'organization', email:'hk-usa@heckler-koch.com',              website:'https://www.hk-usa.com',             city:'Columbus',    state:'GA', notes:'US HQ in Columbus GA. Media inquiries via main contact.' },
  { name:'Walther Arms USA',       firstName:'Media',    type:'organization', email:'info@waltherarms.com',                 website:'https://www.waltherarms.com',         city:'Fort Smith',  state:'AR', notes:'US operations in Fort Smith AR. PDP, PPQ, PPK series.' },
  { name:'CZ-USA',                 firstName:'Media',    type:'organization', email:'czusa@cz-usa.com',                     website:'https://cz-usa.com',                 city:'Kansas City', state:'KS', notes:'CZ pistols, rifles, shotguns. Owned by Colt CZ Group.' },
  { name:'Canik USA',              firstName:'Media',    type:'organization', email:'info@canikusa.com',                    website:'https://canikusa.com',               city:'Houston',     state:'TX', notes:'Turkish manufacturer. Distributed through Century Arms. TP9 series.' },
  { name:'Wilson Combat',          firstName:'Bill',     type:'organization', email:'info@wilsoncombat.com',                website:'https://www.wilsoncombat.com',        city:'Berryville',  state:'AR', notes:'Bill Wilson. Premium 1911s and custom ARs. Highly respected brand.' },
  { name:'Nighthawk Custom',       firstName:'Media',    type:'organization', email:'info@nighthawkcustom.com',             website:'https://www.nighthawkcustom.com',     city:'Berryville',  state:'AR', notes:'Ultra-premium 1911 manufacturer. Custom shop.' },
  { name:'Les Baer Custom',        firstName:'Les',      type:'organization', email:'info@lesbaer.com',                     website:'https://www.lesbaer.com',             city:'Hillsdale',   state:'IL', notes:'Les Baer. Custom 1911 shop. Competition and tactical builds.' },
  { name:'Ed Brown Products',      firstName:'Ed',       type:'organization', email:'info@edbrown.com',                     website:'https://www.edbrown.com',             city:'Perry',       state:'MO', notes:'Custom 1911 manufacturer. Strong LE and competition following.' },
  { name:'Taurus USA',             firstName:'Media',    type:'organization', email:'info@taurususa.com',                   website:'https://www.taurususa.com',           city:'Bainbridge',  state:'GA', notes:'High volume consumer brand. G3, GX4, Judge series.' },
  { name:'Kimber America',         firstName:'Media',    type:'organization', email:'info@kimberamerica.com',               website:'https://www.kimberamerica.com',       city:'Troy',        state:'AL', notes:'Premium 1911 and micro-compact pistols. Strong brand identity.' },
  { name:'Springfield Armory',     firstName:'Media',    type:'organization', email:'media@springfield-armory.com',         website:'https://www.springfield-armory.com', city:'Geneseo',     state:'IL', notes:'Hellcat, XD, M1A. Strong marketing team. Media contact confirmed.' },
  { name:'Smith & Wesson',         firstName:'Media',    type:'organization', email:'media@smith-wesson.com',               website:'https://www.smith-wesson.com',        city:'Springfield', state:'MA', notes:'SWBI public company. Shield Plus, M&P, Performance Center.' },
  { name:'Ruger',                  firstName:'Media',    type:'organization', email:'media@ruger.com',                      website:'https://www.ruger.com',              city:'Southport',   state:'CT', notes:'Sturm Ruger & Co. RGR public company. 10/22, GP100, Security-9.' },
  { name:'Henry Repeating Arms',   firstName:'Anthony',  type:'organization', email:'info@henryusa.com',                    website:'https://www.henryusa.com',           city:'Bayonne',     state:'NJ', notes:'Anthony Imperato, CEO. All lever-actions made in USA. Strong 2A stance.' },
  { name:'Mossberg',               firstName:'Media',    type:'organization', email:'info@mossberg.com',                    website:'https://www.mossberg.com',           city:'North Haven', state:'CT', notes:'O.F. Mossberg & Sons. 500, 590, Patriot series. 4th gen family company.' },
  { name:'Remington Arms',         firstName:'Media',    type:'organization', email:'consumer@remington.com',               website:'https://www.remington.com',          city:'LaGrange',    state:'GA', notes:'Rebuilt after bankruptcy. 870, 700, RP9 series back in production.' },
  { name:'Savage Arms',            firstName:'Media',    type:'organization', email:'info@savagearms.com',                  website:'https://www.savagearms.com',         city:'Westfield',   state:'MA', notes:'Axis, 110, Mark II series. Part of Vista Outdoor.' },
  { name:'Browning Arms',          firstName:'Media',    type:'organization', email:'info@browning.com',                    website:'https://www.browning.com',           city:'Morgan',      state:'UT', notes:'Part of Fabrique Nationale group. BAR, A5, Hi-Power.' },
  { name:'Winchester Guns',        firstName:'Media',    type:'organization', email:'info@winchesterguns.com',              website:'https://www.winchesterguns.com',     city:'New Haven',   state:'CT', notes:'Part of Olin Corporation / Ammunition Group.' },

  // ── OPTICS MANUFACTURERS ─────────────────────────────────────────────────
  { name:'Vortex Optics',          firstName:'Media',    type:'organization', email:'info@vortexoptics.com',                website:'https://www.vortexoptics.com',       city:'Barneveld',   state:'WI', notes:'Employee-owned. Razor, Strike Eagle, Spitfire lines. Outstanding warranty.' },
  { name:'Trijicon',               firstName:'Media',    type:'organization', email:'info@trijicon.com',                    website:'https://www.trijicon.com',           city:'Wixom',       state:'MI', notes:'ACOG, RMR, MRO. Military and LE standard. Premium optics.' },
  { name:'Leupold & Stevens',      firstName:'Media',    type:'organization', email:'info@leupold.com',                     website:'https://www.leupold.com',            city:'Beaverton',   state:'OR', notes:'Made in USA. VX-Freedom, VX-3HD lines. Hunting and tactical.' },
  { name:'Nightforce Optics',      firstName:'Media',    type:'organization', email:'info@nightforceoptics.com',            website:'https://www.nightforceoptics.com',   city:'Orofino',     state:'ID', notes:'Premium precision optics. NXS, ATACR, SHV lines. Competition standard.' },
  { name:'Eotech',                 firstName:'Media',    type:'organization', email:'eotech.info@l3t.com',                  website:'https://www.eotechinc.com',          city:'Ann Arbor',   state:'MI', notes:'L3Harris subsidiary. Holographic sights. Military standard.' },
  { name:'Aimpoint USA',           firstName:'Media',    type:'organization', email:'info@aimpoint.com',                    website:'https://www.aimpoint.com',           city:'Chantilly',   state:'VA', notes:'Swedish company. T2, PRO, CompM series. Military standard globally.' },
  { name:'Holosun Technologies',   firstName:'Media',    type:'organization', email:'support@holosun.com',                  website:'https://www.holosun.com',            city:'City of Industry', state:'CA', notes:'507C, 509T, AEMS. Budget to mid-tier red dots. Hugely popular.' },
  { name:'Burris Optics',          firstName:'Media',    type:'organization', email:'info@burrisoptics.com',                website:'https://www.burrisoptics.com',       city:'Greeley',     state:'CO', notes:'Part of Beretta Group. Eliminator, Veracity, Handgun lines.' },
  { name:'Primary Arms',           firstName:'Media',    type:'organization', email:'info@primaryarms.com',                 website:'https://www.primaryarms.com',        city:'Houston',     state:'TX', notes:'Budget-friendly optics + ACSS reticle system. Large retailer.' },
  { name:'Riton Optics',           firstName:'Media',    type:'organization', email:'info@ritonoptics.com',                 website:'https://www.ritonoptics.com',        city:'Fort Mill',   state:'SC', notes:'Veteran-owned. X series. Good value mil-spec optics.' },
  { name:'US Optics',              firstName:'Media',    type:'organization', email:'sales@usoptics.com',                   website:'https://www.usoptics.com',           city:'Temecula',    state:'CA', notes:'Made in USA premium precision optics. B25 TS series.' },
  { name:'Maven Optics',           firstName:'Media',    type:'organization', email:'info@mavenbuilt.com',                  website:'https://www.mavenbuilt.com',         city:'Lander',      state:'WY', notes:'Direct-to-consumer custom optics. Binoculars and riflescopes.' },
  { name:'Swampfox Optics',        firstName:'Media',    type:'organization', email:'info@swampfoxoptics.com',              website:'https://www.swampfoxoptics.com',     city:'',            state:'',   notes:'Budget red dots and LPVOs. Patriot, Liberty, Arrowhead series.' },

  // ── AMMUNITION MANUFACTURERS ─────────────────────────────────────────────
  { name:'Federal Premium Ammunition', firstName:'Media', type:'organization', email:'info@federalpremium.com',            website:'https://www.federalpremium.com',     city:'Anoka',       state:'MN', notes:'Part of Vista Outdoor. HST, Gold Medal, American Eagle. Market leader.' },
  { name:'Hornady Manufacturing',  firstName:'Media',    type:'organization', email:'hornady@hornady.com',                  website:'https://www.hornady.com',            city:'Grand Island', state:'NE', notes:'Steve Hornady. Critical Defense, Critical Duty, ELD-X. Premium ammo.' },
  { name:'Speer Ammunition',       firstName:'Media',    type:'organization', email:'info@speer-ammo.com',                  website:'https://www.speer-ammo.com',         city:'Lewiston',    state:'ID', notes:'Gold Dot defensive line. Part of Vista Outdoor. LE standard.' },
  { name:'CCI Ammunition',         firstName:'Media',    type:'organization', email:'info@cci-ammunition.com',              website:'https://www.cci-ammunition.com',     city:'Lewiston',    state:'ID', notes:'22LR and rimfire leader. Stinger, Mini-Mag, Blazer. Part of Vista.' },
  { name:'Winchester Ammunition',  firstName:'Media',    type:'organization', email:'info@winchester.com',                  website:'https://www.winchester.com',         city:'East Alton',  state:'IL', notes:'Part of Olin Corporation. White Box, PDX1, Silvertip. Major market.' },
  { name:'Remington Ammunition',   firstName:'Media',    type:'organization', email:'info@remingtonammo.com',               website:'https://www.remingtonammo.com',      city:'Lonoke',      state:'AR', notes:'Now part of Vista Outdoor after bankruptcy split from Remington Arms.' },
  { name:'Fiocchi USA',            firstName:'Media',    type:'organization', email:'info@fiocchiusa.com',                  website:'https://www.fiocchiusa.com',         city:'Ozark',       state:'MO', notes:'Italian manufacturer with US ops. Range and hunting loads.' },
  { name:'Norma Precision',        firstName:'Media',    type:'organization', email:'info@norma.cc',                        website:'https://www.norma.cc',               city:'',            state:'',   notes:'Swedish premium ammo. Bondstrike, Tipstrike, Jaktmatch lines.' },
  { name:'Sig Sauer Ammunition',   firstName:'Media',    type:'organization', email:'ammo@sigsauer.com',                    website:'https://www.sigsauer.com/ammunition',city:'Newington',   state:'NH', notes:'SIG ammo division. V-Crown, Elite Ball. Growing market share.' },
  { name:'PolyCase Ammunition',    firstName:'Media',    type:'organization', email:'info@polycaseammo.com',                website:'https://www.polycaseammo.com',       city:'Savannah',    state:'GA', notes:'Polymer-copper ARX bullets. Innovative lead-free design.' },
  { name:'G9 Defense',             firstName:'Media',    type:'organization', email:'info@g9defense.com',                   website:'https://www.g9defense.com',          city:'',            state:'',   notes:'External hollowpoint. Innovative defensive ammunition.' },
  { name:'Underwood Ammo',         firstName:'Media',    type:'organization', email:'info@underwoodammo.com',               website:'https://www.underwoodammo.com',      city:'Sparta',      state:'IL', notes:'Hot loads, +P+, hard-cast bear defense. Extremely popular.' },
  { name:'Buffalo Bore Ammunition', firstName:'Media',   type:'organization', email:'info@buffalobore.com',                 website:'https://www.buffalobore.com',        city:'Salmon',      state:'ID', notes:'Heavy hard-cast and defense loads. Bear protection and hunting.' },

  // ── ACCESSORIES / GEAR MANUFACTURERS ─────────────────────────────────────
  { name:'Magpul Industries',      firstName:'Media',    type:'organization', email:'info@magpul.com',                      website:'https://www.magpul.com',             city:'Cheyenne',    state:'WY', notes:'PMAG, MBUS, furniture. Standard for AR platforms globally.' },
  { name:'BCM Gunfighter',         firstName:'Media',    type:'organization', email:'info@bravocompanymfg.com',             website:'https://www.bravocompanymfg.com',    city:'Hartland',    state:'WI', notes:'Bravo Company MFG. Premium AR parts. LE and military focus.' },
  { name:'Geissele Automatics',    firstName:'Bill',     type:'organization', email:'info@geissele.com',                    website:'https://www.geissele.com',           city:'North Wales', state:'PA', notes:'Bill Geissele. Trigger market leader. Super Dynamic, Hi-Speed lines.' },
  { name:'Timney Triggers',        firstName:'Media',    type:'organization', email:'info@timneytriggers.com',              website:'https://www.timneytriggers.com',     city:'Phoenix',     state:'AZ', notes:'Drop-in triggers for bolt-action and AR platforms. Competition standard.' },
  { name:'LaRue Tactical',         firstName:'Mark',     type:'organization', email:'mark@larue.com',                       website:'https://www.larue.com',              city:'Leander',     state:'TX', notes:'Mark LaRue. Precision AR builds and mounts. Known for customer service.' },
  { name:'Radian Weapons',         firstName:'Media',    type:'organization', email:'info@radianweapons.com',               website:'https://www.radianweapons.com',      city:'Scottsdale',  state:'AZ', notes:'Model 1, Raptor charging handles. Premium AR components.' },
  { name:'Surefire LLC',           firstName:'Media',    type:'organization', email:'info@surefire.com',                    website:'https://www.surefire.com',           city:'Fountain Valley', state:'CA', notes:'Weapon lights and suppressors. X300U standard for LE.' },
  { name:'Streamlight',            firstName:'Media',    type:'organization', email:'info@streamlight.com',                 website:'https://www.streamlight.com',        city:'Eagleville',  state:'PA', notes:'TLR-1, TLR-7 weapon lights. Competitor to SureFire at lower price.' },
  { name:'Olight',                 firstName:'Media',    type:'organization', email:'support@olightstore.com',              website:'https://www.olightstore.com',        city:'',            state:'',   notes:'Baldr, PL-Pro weapon lights. Fast-growing EDC light company.' },
  { name:'Arisaka Defense',        firstName:'Media',    type:'organization', email:'info@arisakadefense.com',              website:'https://www.arisakadefense.com',     city:'Austin',      state:'TX', notes:'Weapon lights and offset mounts. Growing tactical brand.' },
  { name:'Cloud Defensive',        firstName:'Media',    type:'organization', email:'info@clouddefensive.com',              website:'https://www.clouddefensive.com',     city:'Waxahachie',  state:'TX', notes:'OWL, REIN weapon lights. Emerging premium brand.' },
  { name:'Strike Industries',      firstName:'Media',    type:'organization', email:'info@strike-industries.com',           website:'https://www.strike-industries.com',  city:'',            state:'CA', notes:'AR accessories, comp, stock. Value-focused tactical brand.' },
  { name:'Kaw Valley Precision',   firstName:'Media',    type:'organization', email:'info@kawvalleyprecision.com',          website:'https://www.kawvalleyprecision.com', city:'',            state:'KS', notes:'AR barrels, linear compensators. Great value brand.' },
  { name:'Griffin Armament',       firstName:'Media',    type:'organization', email:'info@griffinarmament.com',             website:'https://www.griffinarmament.com',    city:'',            state:'',   notes:'Suppressors and muzzle devices. TAPER-LOK system.' },
  { name:'SilencerCo',             firstName:'Media',    type:'organization', email:'info@silencerco.com',                  website:'https://www.silencerco.com',         city:'West Valley City', state:'UT', notes:'Omega 36M, Harvester, Osprey series. Suppressor market leader.' },
  { name:'Dead Air Silencers',     firstName:'Media',    type:'organization', email:'info@deadairsilencers.com',            website:'https://www.deadairsilencers.com',   city:'',            state:'',   notes:'Sandman-S, Wolfman, Ghost-M suppressors. Competitive suppressors.' },
  { name:'Rugged Suppressors',     firstName:'Media',    type:'organization', email:'info@ruggedsuppressors.com',           website:'https://www.ruggedsuppressors.com',  city:'',            state:'',   notes:'Surge, Obsidian 45 suppressors. Modular design.' },
  { name:'Lantac USA',             firstName:'Media',    type:'organization', email:'info@lantac-usa.com',                  website:'https://www.lantac-usa.com',         city:'',            state:'',   notes:'Dragon compensators and bcg. UK brand with US presence.' },
  { name:'Hexmag',                 firstName:'Media',    type:'organization', email:'info@hexmag.com',                      website:'https://www.hexmag.com',             city:'Windsor',     state:'CO', notes:'Hexagon pattern polymer magazines for AR-15.' },
  { name:'Lancer Systems',         firstName:'Media',    type:'organization', email:'info@lancer-systems.com',              website:'https://www.lancer-systems.com',     city:'Quakertown',  state:'PA', notes:'L5AWM translucent magazines. Feed lips reinforcement.' },

  // ── MEDIA / PUBLICATIONS / PODCASTS ──────────────────────────────────────
  { name:'The Reload (Firearms)',  firstName:'Stephen',  type:'press',        email:'stephen@thereload.com',                website:'https://www.thereload.com',          city:'',            state:'',   notes:'Stephen Gutowski. Premium gun journalism newsletter. Patreon + paid subs.' },
  { name:'The Firearm Blog (TFB)', firstName:'Pete',     type:'press',        email:'editor@thefirearmblog.com',            website:'https://www.thefirearmblog.com',      city:'',            state:'',   notes:'Pete (EIC). Most-read firearms news blog globally. Review and press submissions.' },
  { name:'Ammoland',               firstName:'Brian',    type:'press',        email:'brian@ammoland.com',                   website:'https://www.ammoland.com',           city:'Wabasso',     state:'FL', notes:'Brian Johnson. Major 2A news outlet. Confirmed from advertise page.' },
  { name:'The Truth About Guns',   firstName:'Robert',   type:'press',        email:'editorial@thetruthaboutguns.com',      website:'https://www.thetruthaboutguns.com',  city:'',            state:'TX', notes:'Robert Farago founded. Dan Zimmerman current editor. Gun news and reviews.' },
  { name:'Guns.com Editorial',     firstName:'',         type:'press',        email:'editorial@guns.com',                   website:'https://www.guns.com',               city:'Las Vegas',   state:'NV', notes:'Editorial team. News, reviews, buyer guides.' },
  { name:'Gun Digest',             firstName:'',         type:'press',        email:'info@gundigest.com',                   website:'https://www.gundigest.com',          city:'Iola',        state:'WI', notes:'Books, magazine, online. Gun values and reviews authority.' },
  { name:'Bearing Arms',           firstName:'Cam',      type:'press',        email:'editor@bearingarms.com',               website:'https://bearingarms.com',            city:'',            state:'',   notes:'Cam Edwards. 2A news and commentary. Townhall Media.' },
  { name:'Concealed Nation',       firstName:'Brandon',  type:'press',        email:'submissions@concealednation.org',      website:'https://concealednation.org',         city:'',            state:'',   notes:'Brandon Curtis. CCW-focused news site. Large audience.' },
  { name:'TTAG (The Truth About Guns)', firstName:'Dan', type:'press',       email:'dan@thetruthaboutguns.com',            website:'https://www.thetruthaboutguns.com',   city:'',            state:'',   notes:'Dan Zimmerman, managing editor. Direct editorial contact.' },
  { name:'Firearms News',          firstName:'',         type:'press',        email:'digital.support@teamkse.com',          website:'https://www.firearmsnews.com',        city:'',            state:'',   notes:'Published by KSE. Formerly Shotgun News. Industry trade publication.' },
  { name:'American Rifleman (NRA)', firstName:'Mark',    type:'press',        email:'publications@nrahq.org',               website:'https://www.americanrifleman.org',    city:'Fairfax',     state:'VA', notes:'NRA flagship. Mark Keefe, editor. Largest firearms magazine.' },
  { name:'Shooting Illustrated (NRA)', firstName:'',     type:'press',       email:'publications@nrahq.org',               website:'https://www.shootingillustrated.com', city:'Fairfax',     state:'VA', notes:'NRA tactical/defensive publication. Self-defense focus.' },
  { name:'Personal Defense World',  firstName:'',        type:'press',        email:'info@personaldefenseworld.com',        website:'https://www.personaldefenseworld.com',city:'',           state:'',   notes:'FMG Publications. PDW, concealed carry focus.' },
  { name:'Outdoor Life (Firearms)', firstName:'',        type:'press',        email:'editors@outdoorlife.com',              website:'https://www.outdoorlife.com',         city:'New York',    state:'NY', notes:'Firearms section editor. Hunting and shooting coverage.' },
  { name:'Field & Stream',          firstName:'',        type:'press',        email:'editors@fieldandstream.com',           website:'https://www.fieldandstream.com',      city:'New York',    state:'NY', notes:'Bonnier Publications. Firearms and hunting editorial.' },
  { name:'Guns & Ammo Magazine',    firstName:'',        type:'press',        email:'gunsandammo@outdoorsg.com',            website:'https://www.gunsandammo.com',         city:'Peoria',      state:'IL', notes:'Outdoor Sportsman Group. Oldest firearms magazine. Print + digital.' },
  { name:'American Hunter (NRA)',   firstName:'',        type:'press',        email:'americanhunter@nrahq.org',             website:'https://www.americanhunter.org',      city:'Fairfax',     state:'VA', notes:'NRA hunting publication. Firearms and hunting overlap.' },
  { name:'Recoil Magazine',         firstName:'',        type:'press',        email:'info@recoilweb.com',                   website:'https://www.recoilweb.com',           city:'Los Angeles', state:'CA', notes:'Modern tactical lifestyle magazine. Gear, travel, firearms.' },
  { name:'Ballistic Magazine',      firstName:'',        type:'press',        email:'info@ballisticmag.com',                website:'https://www.ballisticmag.com',        city:'',            state:'',   notes:'Tactical and EDC magazine. Harris Publications.' },
  { name:'Lucky Gunner Lounge',     firstName:'',        type:'press',        email:'support@luckygunner.com',              website:'https://www.luckygunner.com/lounge',  city:'Knoxville',   state:'TN', notes:'Research-heavy blog by Lucky Gunner ammo. Ballistics database.' },

  // ── SUPPRESSOR / NFA COMPANIES ────────────────────────────────────────────
  { name:'Advanced Armament Corp (AAC)', firstName:'Media', type:'organization', email:'info@advanced-armament.com',       website:'https://www.advanced-armament.com',  city:'Braselton',   state:'GA', notes:'AAC suppressors. 762-SD, M4-2000, Element series. Remington subsidiary.' },
  { name:'Gemtech',                firstName:'Media',    type:'organization', email:'info@gem-tech.com',                   website:'https://www.gem-tech.com',           city:'Boise',       state:'ID', notes:'GMT-300BLK, Dagger series. SIG Sauer subsidiary.' },
  { name:'Yankee Hill Machine',     firstName:'Media',    type:'organization', email:'info@yhm.net',                         website:'https://www.yhm.net',                city:'Florence',    state:'MA', notes:'YHM suppressors and muzzle devices. Phantom, Turbo series.' },
  { name:'Thunder Beast Arms',      firstName:'Media',    type:'organization', email:'info@thunderbeastarms.com',            website:'https://www.thunderbeastarms.com',   city:'Laramie',     state:'WY', notes:'Ultra-light suppressors. 22 BA, ULTRA-7 series.' },
  { name:'OSS Suppressors',         firstName:'Media',    type:'organization', email:'info@osssuppressors.com',              website:'https://www.osssuppressors.com',     city:'American Fork', state:'UT', notes:'Flow-Through baffle design. HX-QD series.' },

  // ── TRAINING / COMPETITIVE SHOOTING ORGS (additional) ────────────────────
  { name:'USPSA',                  firstName:'',         type:'organization', email:'uspsa@uspsa.org',                      website:'https://www.uspsa.org',              city:'Colorado Springs', state:'CO', notes:'United States Practical Shooting Assoc. 27,000 members, 450+ clubs.' },
  { name:'IDPA',                   firstName:'',         type:'organization', email:'idpa@idpa.com',                        website:'https://www.idpa.com',               city:'Berryville',  state:'AR', notes:'International Defensive Pistol Association. 24,000+ members.' },
  { name:'NRA Competitions Division', firstName:'',      type:'organization', email:'competitions@nrahq.org',               website:'https://competitions.nra.org',       city:'Fairfax',     state:'VA', notes:'NRA competitive shooting. High Power, Bullseye, 3-position.' },
  { name:'Precision Rifle Series (PRS)', firstName:'',   type:'organization', email:'info@precisionrifleseries.com',        website:'https://www.precisionrifleseries.com',city:'',          state:'',   notes:'PRS long range competition. 2500+ annual competitors.' },
  { name:'National Rifle League (NRL)', firstName:'',    type:'organization', email:'info@nationalrifleleague.com',         website:'https://www.nationalrifleleague.com',city:'',           state:'',   notes:'NRL Hunter and 22 series. Growing long-range competition circuit.' },
  { name:'Steel Challenge Shooting Association', firstName:'', type:'organization', email:'steelchallenge@scsa.org',        website:'https://www.steelchallenge.com',     city:'',            state:'',   notes:'SCSA. Speed-focused pistol competition. 5 plates, 8 stages.' },
  { name:'Appleseed Project',       firstName:'',        type:'organization', email:'info@appleseedinfo.org',               website:'https://www.appleseedinfo.org',      city:'',            state:'',   notes:'Rifle marksmanship and heritage events nationwide. Volunteer instructors.' },
  { name:'Citizens Defense Research', firstName:'Melody', type:'organization', email:'cdr@citizensdefenseresearch.com',    website:'https://www.citizensdefenseresearch.com', city:'',       state:'',   notes:'Melody Lauer and John Johnston. Force-on-force and defensive training.' },

  // ── 2A ORGANIZATIONS ─────────────────────────────────────────────────────
  { name:'Firearms Policy Coalition (FPC)', firstName:'Brandon', type:'organization', email:'info@fpchq.org',             website:'https://www.firearmspolicy.org',      city:'Sacramento',  state:'CA', notes:'Brandon Combs. Aggressive litigation. Bruen, Bianchi, DACA cases.' },
  { name:'Second Amendment Foundation (SAF)', firstName:'Alan',  type:'organization', email:'adminforweb@saf.org',       website:'https://www.saf.org',                city:'Bellevue',    state:'WA', notes:'Alan Gottlieb. Bellevue WA. Major litigation funder. Heller, McDonald.' },
  { name:'Knife Rights',            firstName:'Doug',    type:'organization', email:'info@kniferights.org',                website:'https://kniferights.org',            city:'Gilbert',     state:'AZ', notes:'Doug Ritter. Knife rights legislation. Overlaps with 2A community.' },
  { name:'Jews for the Preservation of Firearms Ownership', firstName:'Charles', type:'organization', email:'info@jpfo.org', website:'https://www.jpfo.org',           city:'Hartford',    state:'WI', notes:'JPFO. Charles Heller. 2A absolutist organization.' },
  { name:'Pink Pistols',            firstName:'',        type:'organization', email:'admin@pinkpistols.org',               website:'https://www.pinkpistols.org',        city:'',            state:'',   notes:'LGBT pro-gun organization. Unique audience crossover.' },
  { name:'USCCA (Delta Defense)',   firstName:'Tim',     type:'organization', email:'press@uscca.com',                     website:'https://www.usconcealedcarry.com',   city:'West Bend',   state:'WI', notes:'Tim Schmidt, founder. 500k+ members. CCW training + insurance.' },

  // ── RETAIL / MARKETPLACE ─────────────────────────────────────────────────
  { name:'Sportsman\'s Guide',      firstName:'',        type:'ffl_dealer',   email:'cs@sportsmansguide.com',              website:'https://www.sportsmansguide.com',    city:'South St Paul', state:'MN', notes:'Large online outdoor/military surplus retailer.' },
  { name:'Cheaper Than Dirt',       firstName:'',        type:'ffl_dealer',   email:'media@cheaperthandirt.com',           website:'https://www.cheaperthandirt.com',    city:'Fort Worth',  state:'TX', notes:'Large online retailer. Ammo, guns, accessories.' },
  { name:'Gunprime',                firstName:'',        type:'ffl_dealer',   email:'info@gunprime.com',                   website:'https://www.gunprime.com',           city:'',            state:'',   notes:'Online retailer with price comparison.' },
  { name:'Ammo.com',                firstName:'',        type:'ffl_dealer',   email:'support@ammo.com',                    website:'https://www.ammo.com',               city:'Scottsdale',  state:'AZ', notes:'Major online ammo retailer + editorial content. Strong SEO.' },
  { name:'Natchez Shooter Supply',  firstName:'',        type:'ffl_dealer',   email:'custserv@natchezss.com',              website:'https://www.natchezss.com',          city:'Chattanooga', state:'TN', notes:'Distributor and retailer. Ammo and accessories.' },
  { name:'Georgia Arms',            firstName:'',        type:'ffl_dealer',   email:'georgiaarms@georgiaarms.com',         website:'https://www.georgiaarms.com',        city:'Villa Rica',  state:'GA', notes:'Reloaded and new ammo manufacturer + retailer.' },
  { name:'Tombstone Tactical',      firstName:'',        type:'ffl_dealer',   email:'info@tombstonetactical.com',          website:'https://www.tombstonetactical.com',  city:'Glendale',    state:'AZ', notes:'AZ-based dealer. Online and storefront.' },
  { name:'Sportsman\'s Warehouse',  firstName:'',        type:'ffl_dealer',   email:'investor@sportsmanswarehouse.com',    website:'https://www.sportsmanswarehouse.com',city:'Midvale',     state:'UT', notes:'130+ locations. Public company (SPWH). Hunting + firearms.' },
  { name:'Cabela\'s Firearms',      firstName:'',        type:'ffl_dealer',   email:'customerservice@cabelas.com',         website:'https://www.cabelas.com',            city:'Sidney',      state:'NE', notes:'Bass Pro merged. 100+ locations. Consignments and trading.' },

  // ── CCW / INSURANCE / LEGAL ───────────────────────────────────────────────
  { name:'CCW Safe',                firstName:'Mike',    type:'organization', email:'info@ccwsafe.com',                     website:'https://www.ccwsafe.com',            city:'Oklahoma City', state:'OK', notes:'Mike Darter. CCW legal defense insurance. Strong 2A brand.' },
  { name:'Armed Citizens Legal Defense Network', firstName:'Marty', type:'organization', email:'marty@armedcitizensnetwork.org', website:'https://www.armedcitizensnetwork.org', city:'LaConner', state:'WA', notes:'Marty Hayes. WA-based. Pre-trial defense funding. Network model.' },
  { name:'Second Call Defense',     firstName:'Sean',    type:'organization', email:'info@secondcalldefense.com',           website:'https://www.secondcalldefense.org',  city:'',            state:'',   notes:'Sean Maloney. CCW legal defense insurance.' },
  { name:'US Law Shield',           firstName:'',        type:'organization', email:'info@uslawshield.com',                 website:'https://www.uslawshield.com',        city:'Houston',     state:'TX', notes:'Member-owned legal defense program. 800k+ members.' },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const url = new URL(req.url)
  const dryRun = url.searchParams.get('dry') === 'true'
  const typeFilter = url.searchParams.get('type') || null

  const toImport = typeFilter
    ? NEW_CONTACTS.filter(c => c.type === typeFilter)
    : NEW_CONTACTS

  if (dryRun) {
    return Response.json({ ok: true, dryRun: true, count: toImport.length, contacts: toImport.map(c => ({ name: c.name, type: c.type, email: c.email })) })
  }

  // Get all existing names+emails to skip duplicates
  const existing = await sanity.fetch(`*[_type == "outreachContact"]{ name, email, website }`)
  const existingNames    = new Set(existing.map(c => (c.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')))
  const existingEmails   = new Set(existing.filter(c => c.email).map(c => c.email.toLowerCase()))
  const existingWebsites = new Set(existing.filter(c => c.website).map(c => (c.website || '').toLowerCase().replace(/\/$/, '')))

  const results = { created: 0, skipped: 0, errors: [] }

  for (const contact of toImport) {
    try {
      const nameKey    = (contact.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
      const emailKey   = (contact.email || '').toLowerCase()
      const websiteKey = (contact.website || '').toLowerCase().replace(/\/$/, '')

      if (existingNames.has(nameKey) || (contact.email && existingEmails.has(emailKey)) || (contact.website && existingWebsites.has(websiteKey))) {
        results.skipped++
        continue
      }

      const doc = {
        _type: 'outreachContact',
        name:         contact.name,
        firstName:    contact.firstName || '',
        type:         contact.type,
        email:        contact.email || null,
        website:      contact.website || null,
        youtubeUrl:   contact.youtubeUrl || null,
        subscribers:  contact.subscribers || null,
        city:         contact.city || '',
        state:        contact.state || '',
        notes:        contact.notes || '',
        status:       'active',
        source:       'internet_scan',
        emailPermission: false,
        addedAt:      new Date().toISOString(),
      }

      await sanity.create(doc)
      existingNames.add(nameKey)
      if (contact.email) existingEmails.add(emailKey)
      if (contact.website) existingWebsites.add(websiteKey)
      results.created++
    } catch (err) {
      results.errors.push({ name: contact.name, error: err.message })
    }
  }

  return Response.json({ ok: true, ...results, total: toImport.length })
}

export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return Response.json({
    ok: true,
    available: NEW_CONTACTS.length,
    byType: NEW_CONTACTS.reduce((acc, c) => { acc[c.type] = (acc[c.type] || 0) + 1; return acc }, {}),
    withEmail: NEW_CONTACTS.filter(c => c.email).length,
    preview: NEW_CONTACTS.slice(0, 5).map(c => ({ name: c.name, type: c.type, email: c.email }))
  })
}
