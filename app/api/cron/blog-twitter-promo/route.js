export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { createClient } from '@sanity/client'
import { reportCronRun } from '@/lib/cronReporter'
import { runSocialAgent } from '../../../../agent/social/socialAgent.js'

// DownRange Blog → Twitter Promotion — Tuesdays + Thursdays, 8:00 AM Pacific
// (28 min after blog-writer publishes at 7:32 AM Pacific, so the article is
// guaranteed live in Sanity before this runs).
//
// This is ADDITIVE to the existing daily generic Twitter cron
// (/api/social/cron/twitter, 13:04 UTC daily) — that job pulls from a mixed
// news+blog pool ordered by urgency/date, and in practice blog posts almost
// never win that ranking against same-day news articles, so they were
// effectively never getting tweeted. This job guarantees the week's 2 new/
// refreshed blog articles (from the blog-writer cron) each get a dedicated
// tweet, specifically, via forceArticleId — no pool, no competition with news.

const ADMIN_KEY = process.env.DR_ADMIN_KEY || process.env.ADMIN_KEY

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  const key  = req.headers.get('x-admin-key')
  const cron = req.headers.get('authorization')
  return key === process.env.ADMIN_KEY || cron === 'Bearer ' + process.env.CRON_SECRET
}

export async function GET(req) {
  if (!auth(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const t0 = Date.now()
  try {
    // The blog-writer cron publishes/refreshes exactly one blogPost right
    // before this runs (same Tue/Thu 7:32 AM Pacific slot) — the most
    // recently published post is reliably that one.
    const article = await sanity.fetch(
      `*[_type == "blogPost" && status == "published" && defined(slug.current)] | order(publishedAt desc)[0]{
        _id, title, "slug": slug.current, publishedAt
      }`
    )

    if (!article) {
      await reportCronRun('blog-twitter-promo', { status: 'warning', ms: Date.now() - t0, error: 'No published blogPost found to promote' })
      return NextResponse.json({ ok: true, skipped: true, reason: 'No published blogPost found' })
    }

    const result = await runSocialAgent({ platform: 'twitter', forceArticleId: article._id })

    const posted = result?.results?.[0]
    await reportCronRun('blog-twitter-promo', {
      status: posted?.status === 'posted' ? 'success' : 'warning',
      ms: Date.now() - t0,
      details: `Promoted "${article.title}" → ${posted?.status || 'unknown'}${posted?.error ? ' — ' + posted.error : ''}`,
      error: posted?.status === 'posted' ? null : (posted?.error || 'Post did not confirm success'),
    })

    return NextResponse.json({ ok: true, article: { id: article._id, title: article.title, slug: article.slug }, result })
  } catch (err) {
    await reportCronRun('blog-twitter-promo', { status: 'failed', ms: Date.now() - t0, error: err.message })
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}

export async function POST(req) { return GET(req) }
