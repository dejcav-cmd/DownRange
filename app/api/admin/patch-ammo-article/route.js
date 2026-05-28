export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Articles stuck with bad images — source URLs block og:image scraping from Vercel
const STUCK = [
  { slug: 'missouri-bullet-company-hard-cast-bullets-and-the-frankford-arsenal-precision-press-a-reloader-s', photo: '/img/photos/ammo.jpg' },
  { slug: 'dog-fires-shotgun-in-parked-truck-injures-woman-in-nebraska', photo: '/img/photos/shotgun.jpg' },
  { slug: 'new-house-bill-by-rep-patronis-would-repeal-hughes-amendment-legalize-machine-guns', photo: '/img/photos/law.jpg' },
  { slug: 'texans-dump-cornyn-over-gun-bill-betrayal', photo: '/img/photos/law.jpg' },
  { slug: 'house-passes-veterans-second-amendment-protection-act-locking-in-va-fiduciary-reform', photo: '/img/photos/law.jpg' },
  { slug: 'gun-rights-groups-sue-maryland-over-glock-ban', photo: '/img/photos/pistol.jpg' },
  { slug: 'tell-president-trump-pardon-tate-adamiak', photo: '/img/photos/law.jpg' },
  { slug: 'multiple-loaded-firearms-seized-after-traffic-stop-on-staten-island', photo: '/img/photos/law.jpg' }
]

async function patchSlug({ slug, photo }) {
  const article = await sanity.fetch(
    `*[_type == "newsArticle" && slug.current == $slug][0]{ _id, title, imageUrl, editorLocked }`,
    { slug }
  )
  if (!article) return { slug, ok: false, error: 'not found' }
  if (article.editorLocked) return { slug, ok: true, skipped: true, reason: 'editorLocked' }
  const current = article.imageUrl || ''
  if (current.startsWith('https://cdn.sanity.io')) return { slug, ok: true, skipped: true, reason: 'already CDN image' }
  await sanity.patch(article._id).set({ imageUrl: photo }).commit()
  return { slug, ok: true, _id: article._id, was: current.slice(0,60), now: photo }
}

export async function GET(req) {
  const cronSecret = process.env.CRON_SECRET
  const isCron = cronSecret && req.headers.get('authorization') === `Bearer ${cronSecret}`
  const isAdmin = req.headers.get('x-admin-key') === process.env.ADMIN_KEY
  if (!isCron && !isAdmin) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const results = await Promise.all(STUCK.map(patchSlug))
  const done = results.filter(r => r.ok && !r.skipped).length
  const skipped = results.filter(r => r.skipped).length
  return Response.json({ ok: true, done, skipped, results })
}

export async function POST(req) { return GET(req) }
