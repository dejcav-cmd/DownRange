/**
 * Newsletter Preview Send
 * Auth: Authorization: Bearer {SANITY_API_TOKEN}
 * POST { to: "email@example.com" }
 * Generates a live newsletter from current content and sends it.
 */
export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'
import { generateNewsletterHTML } from '@/lib/emailTemplates'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  token: process.env.SANITY_API_TOKEN,
  useCdn: false,
})

function getResend() {
  const { Resend } = require('resend')
  return new Resend(process.env.RESEND_API_KEY)
}

export async function POST(req) {
  const auth = req.headers.get('authorization') || ''
  const token = auth.replace('Bearer ', '')
  if (!token || token !== process.env.SANITY_API_TOKEN) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { to } = await req.json().catch(() => ({}))
  const recipient = to || 'dj@downrangeco.com'

  const [stories, deals, alerts, videos, ammo, nfa] = await Promise.all([
    sanity.fetch(`*[_type=="newsArticle" && defined(slug.current) && defined(publishedAt)] | order(urgencyScore desc, publishedAt desc) [0...10] { title, slug, summary, category, urgencyScore, imageUrl }`).catch(() => []),
    sanity.fetch(`*[_type=="gunDeal"] | order(_createdAt desc) [0...4] { title, name, price, dealPrice, originalPrice, store, retailer, url, imageUrl }`).catch(() => []),
    sanity.fetch(`*[_type=="breakingAlert" && active==true] | order(_createdAt desc) [0...3] { text, title }`).catch(() => []),
    sanity.fetch(`*[_type=="video" && active==true] | order(addedAt desc) [0...3] { title, youtubeId, videoId, channelName, thumbnail, thumbnailUrl, category, duration }`).catch(() => []),
    sanity.fetch(`*[_type=="ammoPrice"] | order(recordedAt desc) [0...6] { caliber, pricePerRound, trendDir, trendPct, inStock }`).catch(() => []),
    sanity.fetch(`*[_type=="nfaWaitTime"] | order(fetchedAt desc) [0] { forms, reportMonth }`).catch(() => null),
  ])

  const html = generateNewsletterHTML({ news: stories, deals, alerts, videos, ammo, nfa,
    unsubUrl: `https://www.downrangeco.com/unsubscribe` }, true)

  const subject = alerts.length > 0
    ? `[PREVIEW] ⚡ ${(alerts[0].text||alerts[0].title||'').slice(0,60)} — DownRange Alert`
    : stories.length > 0
      ? `[PREVIEW] ${stories[0].title.slice(0,68)} — DownRange Brief`
      : '[PREVIEW] DownRange Weekly Brief'

  const resend = getResend()
  const result = await resend.emails.send({
    from: 'DownRange <news@downrangeco.com>',
    to: recipient,
    subject,
    html,
  })

  if (result.error) {
    return Response.json({ error: result.error }, { status: 500 })
  }

  return Response.json({ success: true, to: recipient, id: result.data?.id })
}
