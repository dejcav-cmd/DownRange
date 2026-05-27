export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// National FFL dealers — major retailers with verified contact info
// Sources: company websites, ATF FFL database, industry directories
const FFL_DEALERS = [
  // ── MAJOR NATIONAL ONLINE RETAILERS ──────────────────────────────────────
  { name:'GunBroker.com',              type:'ffl_dealer', email:'support@gunbroker.com',         website:'https://www.gunbroker.com',          city:'Kennesaw',       state:'GA', notes:'Largest online firearms marketplace. 6M+ listings.' },
  { name:'Brownells',                  type:'ffl_dealer', email:'media@brownells.com',            website:'https://www.brownells.com',          city:'Montezuma',      state:'IA', notes:'Largest firearms parts retailer. 80k+ SKUs. PR contact.' },
  { name:'MidwayUSA',                  type:'ffl_dealer', email:'customerservice@midwayusa.com',  website:'https://www.midwayusa.com',          city:'Columbia',       state:'MO', notes:'Major ammo and accessories retailer.' },
  { name:'Palmetto State Armory',      type:'ffl_dealer', email:'pr@palmettostatearmory.com',     website:'https://palmettostatearmory.com',    city:'Columbia',       state:'SC', notes:'Major AR-15 manufacturer and retailer. Budget builds.' },
  { name:'Primary Arms',               type:'ffl_dealer', email:'info@primaryarms.com',           website:'https://www.primaryarms.com',        city:'Houston',        state:'TX', notes:'Major optics and firearms retailer.' },
  { name:'Sportsman\'s Warehouse',     type:'ffl_dealer', email:'investor@sportsmanswarehouse.com',website:'https://www.sportsmanswarehouse.com',city:'Midvale',        state:'UT', notes:'130+ retail locations nationwide.' },
  { name:'Cabela\'s / Bass Pro Shops', type:'ffl_dealer', email:'customerservice@cabelas.com',    website:'https://www.cabelas.com',            city:'Sidney',         state:'NE', notes:'Largest outdoor retailer. 100+ stores. Merged with Bass Pro.' },
  { name:'Academy Sports + Outdoors',  type:'ffl_dealer', email:'ir@academy.com',                website:'https://www.academy.com',            city:'Katy',           state:'TX', notes:'260+ stores across the South and Midwest.' },
  { name:'Guns.com',                   type:'ffl_dealer', email:'support@guns.com',               website:'https://guns.com',                   city:'Las Vegas',      state:'NV', notes:'Online retailer with large used gun inventory.' },
  { name:'GrabAGun',                   type:'ffl_dealer', email:'info@grabagung.com',             website:'https://www.grabagung.com',          city:'McKinney',       state:'TX', notes:'Online FFL dealer, competitive pricing.' },
  { name:'Kygunco',                    type:'ffl_dealer', email:'info@kygunco.com',               website:'https://www.kygunco.com',            city:'Bardstown',      state:'KY', notes:'Online retailer, good handgun selection.' },
  { name:'AIM Surplus',                type:'ffl_dealer', email:'info@aimsurplus.com',            website:'https://www.aimsurplus.com',         city:'Springboro',     state:'OH', notes:'Military surplus and affordable firearms.' },
  { name:'Impact Guns',                type:'ffl_dealer', email:'contactus@impactguns.com',       website:'https://www.impactguns.com',         city:'Ogden',          state:'UT', notes:'Online and retail, Utah-based.' },
  { name:'Bud\'s Gun Shop',            type:'ffl_dealer', email:'budsgunshop@gmail.com',          website:'https://www.budsgunshop.com',        city:'Lexington',      state:'KY', notes:'Major online dealer, large inventory.' },
  { name:'Classic Firearms',           type:'ffl_dealer', email:'service@classicfirearms.com',    website:'https://www.classicfirearms.com',    city:'Albemarle',      state:'NC', notes:'Surplus and collectible firearms. YouTube channel.' },

  // ── REGIONAL CHAINS ───────────────────────────────────────────────────────
  { name:'Shoot Straight (FL)',        type:'ffl_dealer', email:'info@shootstraight.com',         website:'https://www.shootstraight.com',      city:'Tampa',          state:'FL', notes:'10 Florida locations. Range + retail.' },
  { name:'Ellett Brothers',            type:'ffl_dealer', email:'info@ellettbrothers.com',        website:'https://www.ellettbrothers.com',     city:'Chapin',         state:'SC', notes:'Major Southeast wholesale distributor.' },
  { name:'Davidson\'s',                type:'ffl_dealer', email:'info@davidsonsinc.com',          website:'https://www.davidsonsinc.com',       city:'Prescott',       state:'AZ', notes:'Major wholesale distributor. GalleryOfGuns.com.' },
  { name:'Jerry\'s Enterprises',       type:'ffl_dealer', email:'info@jerrys.com',                website:'https://www.jerrys.com',             city:'Coon Rapids',    state:'MN', notes:'Large Midwest retailer.' },
  { name:'Frontier Justice',           type:'ffl_dealer', email:'info@shopliberty.com',           website:'https://www.shopliberty.com',        city:'Lee\'s Summit',  state:'MO', notes:'Missouri chain, strong 2A brand.' },
  { name:'Sportsman\'s Guide',         type:'ffl_dealer', email:'customerservice@sportsmansguide.com',website:'https://www.sportsmansguide.com',city:'South St. Paul', state:'MN', notes:'Online retailer, large ammo selection.' },
  { name:'The Sportsman\'s Shop',      type:'ffl_dealer', email:'info@sshop.com',                 website:'https://www.sshop.com',              city:'New Providence',  state:'PA', notes:'PA retailer, strong hunting focus.' },
  { name:'Heritage Guild',             type:'ffl_dealer', email:'info@heritageguild.com',         website:'https://www.heritageguild.com',      city:'Easton',         state:'PA', notes:'Large PA retailer and range.' },
  { name:'Georgia Gun Store',          type:'ffl_dealer', email:'info@georgiagunstore.com',       website:'https://www.georgiagunstore.com',    city:'Buford',         state:'GA', notes:'Georgia retailer with strong online presence.' },
  { name:'Guns & Ammo Warehouse',      type:'ffl_dealer', email:'info@gunsammowarehouse.com',     website:'https://www.gunsammowarehouse.com',  city:'Hendersonville',  state:'TN', notes:'Southeast dealer.' },

  // ── DISTRIBUTOR / WHOLESALE ───────────────────────────────────────────────
  { name:'Lipseys',                    type:'ffl_dealer', email:'info@lipseys.com',               website:'https://www.lipseys.com',            city:'Baton Rouge',    state:'LA', notes:'Major wholesale distributor. Exclusive models.' },
  { name:'Sports South',               type:'ffl_dealer', email:'info@sportssouth.com',           website:'https://www.sportssouth.com',        city:'Shreveport',     state:'LA', notes:'Major wholesale distributor.' },
  { name:'Jerry\'s Enterprises Dist.', type:'ffl_dealer', email:'info@jerrys.com',                website:'https://www.jerrys.com',             city:'Coon Rapids',    state:'MN', notes:'Midwest wholesale and retail.' },
  { name:'Zanders Sporting Goods',     type:'ffl_dealer', email:'info@zanders.com',               website:'https://www.zanders.com',            city:'Sparta',         state:'IL', notes:'Major Midwest distributor.' },
  { name:'RSR Group',                  type:'ffl_dealer', email:'customerservice@rsrgroup.com',   website:'https://www.rsrgroup.com',           city:'Orange',         state:'FL', notes:'National firearms distributor.' },
]

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let created = 0, skipped = 0

  for (const dealer of FFL_DEALERS) {
    const existing = await sanity.fetch(
      '*[_type=="outreachContact" && name==$n][0]{_id}',
      { n: dealer.name }
    )
    if (existing) { skipped++; continue }

    await sanity.create({
      _type:    'outreachContact',
      name:     dealer.name,
      type:     dealer.type,
      email:    dealer.email,
      website:  dealer.website,
      city:     dealer.city,
      state:    dealer.state,
      notes:    dealer.notes,
      status:   'active',
    })
    created++
  }

  return Response.json({ ok: true, created, skipped, total: FFL_DEALERS.length })
}
