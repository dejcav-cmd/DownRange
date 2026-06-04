export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// ── RESEARCHED UPDATES — verified from official websites, Facebook pages, and public sources ──
const YOUTUBER_UPDATES = [
  {
    youtubeUrl: 'https://youtube.com/@MrColionNoir',
    name: 'Colion Noir',
    firstName: 'Collins',
    email: 'info@mrcolionnoir.com',
    notes: 'Real name: Collins Iyare Idehen Jr. NRA-affiliated attorney and 2A advocate. 3.2M subs. Most prominent Black 2A voice. Business/customer email: info@mrcolionnoir.com (confirmed from official shop FAQ at shop.mrcolionnoir.com). Company: Noir Inc, LLC.',
  },
  {
    youtubeUrl: 'https://youtube.com/@KentuckyBallistics',
    name: 'Kentucky Ballistics',
    firstName: 'Scott',
    email: 'contact.kentuckyballistics@gmail.com',
    notes: 'Real name: Scott DeShields (confirmed Wikitubia). Former Kentucky State Trooper. 3.1M subs. Survived .50 cal accidental discharge on camera Apr 2021. Business email confirmed from Facebook page: contact.kentuckyballistics@gmail.com',
  },
  {
    youtubeUrl: 'https://youtube.com/@IraqVeteran8888',
    name: 'IraqVeteran8888',
    firstName: 'Eric',
    email: 'brandy@iraqveteran8888.com',
    notes: 'Real name: Eric Blandford. Iraq War veteran. 2.6M subs. Company: 88 Industries LLC. Business Manager: Brandy Kerrison handles ALL business inquiries — brandy@iraqveteran8888.com (confirmed ContactOut/iraqveteran8888.com). GOA Georgia State Director.',
  },
  {
    youtubeUrl: 'https://youtube.com/@WarriorPoetSociety',
    name: 'Warrior Poet Society',
    firstName: 'John',
    email: 'customersupport@warriorpoetsociety.us',
    notes: 'Real name: John Lovell. Founder/CEO. Former Army Ranger (2nd Ranger Battalion). 2M subs. Business: customersupport@warriorpoetsociety.us (confirmed official site). Training inquiries: training@warriorpoetsociety.us. Email format for direct contact: jlovell@warriorpoetsociety.us.',
  },
  {
    youtubeUrl: 'https://youtube.com/@GarandThumb',
    name: 'Garand Thumb',
    firstName: 'Mike',
    email: 'garandthumb@gmail.com',
    notes: 'Real name: Michael (Mike) Jones. Born Apr 6 1986. USAF TACP veteran, SERE instructor. Founder of Onward Research (onwardresearch.com). 4.6M subs. Business outreach best via @garand_thumb Instagram. Gmail is his primary public contact.',
  },
  {
    youtubeUrl: 'https://youtube.com/@hickok45',
    name: 'Hickok45',
    firstName: 'Greg',
    email: 'hickok45channel@gmail.com',
    notes: 'Real name: Greg Kinman (born 1950). Retired English teacher. 8.1M subs — largest firearms channel. Private individual, no business email on record. Gmail channel email is best contact. Trademark registered. Son John Kinman co-runs channel.',
  },
]

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const results = { updated: 0, notFound: 0, errors: [], details: [] }

  for (const u of YOUTUBER_UPDATES) {
    try {
      // Find existing contact by YouTube URL
      const existing = await sanity.fetch(
        `*[_type == "outreachContact" && (youtubeUrl == $yt || youtubeUrl == $yt2)][0]{_id, name, email, notes}`,
        {
          yt: u.youtubeUrl,
          yt2: u.youtubeUrl.replace('https://youtube.com/@', 'https://www.youtube.com/@')
        }
      )

      if (!existing?._id) {
        results.notFound++
        results.details.push({ name: u.name, status: 'not_found' })
        continue
      }

      // Patch the contact
      await sanity.patch(existing._id).set({
        email: u.email,
        firstName: u.firstName,
        notes: u.notes,
      }).commit()

      results.updated++
      results.details.push({
        name: u.name,
        status: 'updated',
        oldEmail: existing.email || '(none)',
        newEmail: u.email,
      })
    } catch (e) {
      results.errors.push(u.name + ': ' + e.message)
    }
  }

  return Response.json({ ok: true, ...results, total: YOUTUBER_UPDATES.length })
}

// GET — preview what will be updated
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  return Response.json({
    ok: true,
    message: 'POST to this endpoint to apply updates',
    willUpdate: YOUTUBER_UPDATES.map(u => ({ name: u.name, newEmail: u.email }))
  })
}
