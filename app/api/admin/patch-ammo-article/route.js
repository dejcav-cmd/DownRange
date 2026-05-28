export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

function pickPhoto(title = '', category = '') {
  const t = (title + ' ' + category).toLowerCase()
  if (/law|atf|bill|court|constitution|legal|2a|amendment|ban|rule|scotus|bruen/.test(t)) return '/img/photos/law.jpg'
  if (/pistol|handgun|glock|sig|beretta|colt|revolver|1911|carry|edc|p365|hellcat|shield/.test(t)) return '/img/photos/pistol.jpg'
  if (/rifle|ar.?15|m4|carbine|ak|sbr/.test(t)) return '/img/photos/rifle.jpg'
  if (/shotgun|mossberg|benelli|gauge|pump/.test(t)) return '/img/photos/shotgun.jpg'
  if (/suppressor|silencer|nfa/.test(t)) return '/img/photos/suppressor.jpg'
  if (/ammo|ammunition|cartridge|bullet|grain|ballistic|reload|press|powder|brass|cast/.test(t)) return '/img/photos/ammo.jpg'
  if (/hunt|deer|elk|game|waterfowl/.test(t)) return '/img/photos/hunting.jpg'
  if (/competi|uspsa|idpa|ipsc|3.gun/.test(t)) return '/img/photos/competition.jpg'
  if (/train|range|practice|marksmanship/.test(t)) return '/img/photos/training.jpg'
  if (/gear|holster|optic|sight|scope|light|sling/.test(t)) return '/img/photos/gear.jpg'
  return '/img/photos/news.jpg'
}

async function runPatch() {
  const slug = 'missouri-bullet-company-hard-cast-bullets-and-the-frankford-arsenal-precision-press-a-reloader-s'
  const article = await sanity.fetch(
    `*[_type == "newsArticle" && slug.current == $slug][0]{ _id, title, imageUrl, category }`,
    { slug }
  )
  if (!article) return { ok: false, error: 'Article not found' }

  // Already has a real image — skip
  const current = article.imageUrl || ''
  if (current.startsWith('https://cdn.sanity.io')) return { ok: true, skipped: true, reason: 'already has CDN image', imageUrl: current }

  const imageUrl = pickPhoto(article.title, article.category)
  await sanity.patch(article._id).set({ imageUrl }).commit()
  return { ok: true, _id: article._id, title: article.title, imageUrl }
}

export async function GET(req) {
  // Allow Vercel cron OR admin key
  const cronSecret = process.env.CRON_SECRET
  const isCron = cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`
  const isAdmin = req.headers.get('x-admin-key') === process.env.ADMIN_KEY
  if (!isCron && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const result = await runPatch()
  return Response.json(result)
}

export async function POST(req) {
  return GET(req)
}
