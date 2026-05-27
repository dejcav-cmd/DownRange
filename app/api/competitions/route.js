export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    true,
  token:     process.env.SANITY_API_TOKEN,
})

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const org   = searchParams.get('org')
  const state = searchParams.get('state')
  const disc  = searchParams.get('discipline')

  let filter = '_type=="competition" && approved==true'
  if (org)   filter += ' && org==$org'
  if (state) filter += ' && state==$state'
  if (disc)  filter += ' && discipline==$disc'

  const matches = await sanity.fetch(
    `*[${filter}] | order(startDate asc) [0...200] {
      _id, name, org, discipline, matchType, level,
      startDate, endDate, registrationDeadline,
      venue, city, state, country, entryFee, capacity,
      registrationUrl, websiteUrl, description, imageUrl, featured
    }`,
    { org: org||null, state: state||null, disc: disc||null }
  ).catch(() => [])

  return Response.json({ ok: true, matches, total: matches.length })
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error:'Unauthorized' }, { status:401 })

  const body = await req.json().catch(()=>({}))
  const { action, id } = body

  if (action === 'create') {
    const doc = await sanity.create({
      _type:       'competition',
      name:        body.name,
      slug:        { _type:'slug', current: (body.name||'').toLowerCase().replace(/[^a-z0-9]+/g,'-') },
      org:         body.org,
      discipline:  body.discipline,
      matchType:   body.matchType,
      level:       body.level,
      startDate:   body.startDate,
      endDate:     body.endDate || null,
      registrationDeadline: body.registrationDeadline || null,
      venue:       body.venue || null,
      city:        body.city,
      state:       body.state,
      country:     body.country || 'USA',
      entryFee:    body.entryFee ? parseFloat(body.entryFee) : null,
      capacity:    body.capacity ? parseInt(body.capacity) : null,
      registrationUrl: body.registrationUrl || null,
      websiteUrl:  body.websiteUrl || null,
      description: body.description || null,
      imageUrl:    body.imageUrl || null,
      featured:    body.featured || false,
      approved:    false,
      source:      'Manual',
      createdAt:   new Date().toISOString(),
    })
    return Response.json({ ok:true, id:doc._id })
  }

  if (action === 'patch') {
    await sanity.patch(id).set(body.fields).commit()
    return Response.json({ ok:true })
  }

  if (action === 'delete') {
    await sanity.delete(id)
    return Response.json({ ok:true })
  }

  if (action === 'seed') {
    // Seed initial competition data
    const SEED = [
      { name:'NRA Bianchi Cup', org:'NRA', discipline:'Practical Pistol', matchType:'National', level:'Advanced', startDate:'2026-06-12', endDate:'2026-06-15', city:'Columbia', state:'MO', entryFee:150, registrationUrl:'https://competitions.nra.org', description:'Oldest and most prestigious practical pistol championship in the world.', featured:true },
      { name:'USPSA Area 3 Championship', org:'USPSA/IPSC', discipline:'Practical Pistol', matchType:'Area Match', level:'All Levels', startDate:'2026-07-18', endDate:'2026-07-20', city:'Tulsa', state:'OK', entryFee:120, registrationUrl:'https://practiscore.com', description:'USPSA Area 3 Championship. Multi-gun stages. All divisions.' },
      { name:'PRS National Championship', org:'PRS', discipline:'Precision Rifle', matchType:'National', level:'Advanced', startDate:'2026-09-14', endDate:'2026-09-19', city:'Tulsa', state:'OK', entryFee:500, registrationUrl:'https://precisionrifleseries.com', description:'The Super Bowl of precision rifle. 200 top shooters. 12-stage match.', featured:true },
      { name:'IDPA Indoor Nationals', org:'IDPA', discipline:'Practical Pistol', matchType:'National', level:'All Levels', startDate:'2026-10-08', endDate:'2026-10-12', city:'Tulsa', state:'OK', entryFee:175, registrationUrl:'https://idpa.com', description:'IDPA Indoor Nationals. All divisions.' },
      { name:'NRL22 National Championship', org:'NRL', discipline:'Precision Rifle', matchType:'National', level:'All Levels', startDate:'2026-08-07', endDate:'2026-08-09', city:'Rockcastle', state:'KY', entryFee:200, registrationUrl:'https://nationalrifleleague.org', description:'NRL22 rimfire precision rifle nationals.' },
      { name:'Ironman 3-Gun', org:'Other', discipline:'3-Gun', matchType:'National', level:'All Levels', startDate:'2026-10-22', endDate:'2026-10-25', city:'Talladega', state:'AL', entryFee:300, registrationUrl:'https://ironman3gun.com', description:'Premier 3-gun match at Talladega Marksmanship Park.', featured:true },
      { name:'Steel Challenge World Speed Shooting Championship', org:'USPSA/IPSC', discipline:'Steel Challenge', matchType:'World', level:'All Levels', startDate:'2026-08-24', endDate:'2026-08-29', city:'Talladega', state:'AL', entryFee:200, registrationUrl:'https://practiscore.com', description:'World Steel Challenge Championship. Speed only — 5 stage formats, all divisions.', featured:true },
      { name:'NSSF Rimfire Challenge Championship', org:'NSSF', discipline:'Rimfire', matchType:'National', level:'Beginner Friendly', startDate:'2026-07-25', endDate:'2026-07-27', city:'Wyandotte', state:'MI', entryFee:85, registrationUrl:'https://nssf.org', description:'Family-friendly rimfire competition. Great first match.' },
      { name:'PRS Season Opener', org:'PRS', discipline:'Precision Rifle', matchType:'Regional', level:'Intermediate', startDate:'2026-06-06', endDate:'2026-06-07', city:'Wendell', state:'NC', entryFee:275, registrationUrl:'https://precisionrifleseries.com', description:'PRS season opener. Gas gun division available.' },
      { name:'NRA High Power Long Range — Camp Perry', org:'NRA', discipline:'Long Range', matchType:'National', level:'Intermediate', startDate:'2026-07-07', endDate:'2026-07-12', city:'Port Clinton', state:'OH', entryFee:130, registrationUrl:'https://competitions.nra.org', description:'F-Class and service rifle long range at Camp Perry National Matches.' },
      { name:'USPSA Multi-Gun Nationals', org:'USPSA/IPSC', discipline:'3-Gun', matchType:'National', level:'All Levels', startDate:'2026-11-04', endDate:'2026-11-08', city:'Talladega', state:'AL', entryFee:350, registrationUrl:'https://practiscore.com', description:'USPSA Multi-Gun National Championship at Talladega Marksmanship Park.' },
      { name:'IDPA Southeast Regional', org:'IDPA', discipline:'Practical Pistol', matchType:'Regional', level:'All Levels', startDate:'2026-06-27', endDate:'2026-06-28', city:'Macon', state:'GA', entryFee:90, registrationUrl:'https://idpa.com', description:'IDPA Southeast Regional. All divisions.' },
    ]
    let created = 0
    for (const m of SEED) {
      const exists = await sanity.fetch('*[_type=="competition" && name==$n][0]{_id}', { n: m.name })
      if (exists) continue
      await sanity.create({ _type:'competition', ...m, slug:{_type:'slug',current:m.name.toLowerCase().replace(/[^a-z0-9]+/g,'-')}, approved:true, source:'Manual', createdAt:new Date().toISOString(), country:'USA' })
      created++
    }
    return Response.json({ ok:true, created })
  }

  return Response.json({ error:'Unknown action' }, { status:400 })
}
