import { callAIText } from '@/lib/aiClient.js'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// Curated images for each article topic — all verified Wikimedia URLs
const BLOG_IMAGES = {
  'home-defense-basics':          '/img/photos/rifle.jpg',
  'safe-storage-guide-beginners': '/img/photos/pistol.jpg',
  'ammo-guide-beginners':         '/img/photos/ammo.jpg',
  'shooting-range-first-visit':   '/img/photos/pistol.jpg',
  'cleaning-maintaining-your-gun':'/img/photos/pistol.jpg',
  'understanding-gun-laws':       '/img/photos/law.jpg',
  'choosing-holster-beginners':   '/img/photos/pistol.jpg',
  'dry-fire-training-beginners':  '/img/photos/pistol.jpg',
  'what-is-nfa':                  '/img/photos/law.jpg',
}

const ARTICLES = [
  { slug:'home-defense-basics',           title:'Home Defense Basics: What You Actually Need',       category:'home-defense', readTime:'11 min' },
  { slug:'safe-storage-guide-beginners',  title:'Safe Storage 101: Secure and Accessible',           category:'safety',       readTime:'9 min'  },
  { slug:'ammo-guide-beginners',          title:'Ammunition Explained: What to Buy and Why',          category:'ammunition',   readTime:'10 min' },
  { slug:'shooting-range-first-visit',    title:'Your First Time at a Shooting Range',               category:'beginner',     readTime:'7 min'  },
  { slug:'cleaning-maintaining-your-gun', title:'How to Clean and Maintain Your Firearm',            category:'maintenance',  readTime:'10 min' },
  { slug:'understanding-gun-laws',        title:'Understanding Gun Laws: Beginner Overview',          category:'legal',        readTime:'13 min' },
  { slug:'choosing-holster-beginners',    title:'How to Choose a Holster for Concealed Carry',       category:'carry',        readTime:'11 min' },
  { slug:'dry-fire-training-beginners',   title:'Dry Fire Training: Get Better Without Ammo',        category:'training',     readTime:'9 min'  },
  { slug:'what-is-nfa',                   title:'What Is the NFA? Suppressors, SBRs, and More',      category:'legal',        readTime:'12 min' },
]

async function writeArticle(article) {
  const prompt = [
    'Write a blog post for DownRange, signed by DJ Cavalcanti.',
    'DJ is a gun owner and 2A advocate based in Washington State. He carries daily and built DownRange.',
    '',
    'Article: ' + article.title,
    'Audience: Gun owners ranging from first-time buyers to experienced carriers.',
    '',
    'WRITING RULES:',
    '- Write in first person as DJ. "I carry a Glock 19 appendix. Here\'s why." type voice.',
    '- Direct sentences. Specific facts. Active voice.',
    '- BANNED: comprehensive, dive into, cutting-edge, robust, leverage, game-changer, seamlessly, unprecedented',
    '- No padded intros. Start with the most important thing.',
    '- Include specific product recommendations where relevant (real brands, real prices).',
    '- Opinions are welcome and expected. DJ has preferences and states them.',
    '',
    'FORMAT: Return JSON with:',
    '"title": article title',
    '"excerpt": 1-2 sentence summary for SEO. No AI phrases.',
    '"body": Complete article as HTML. Use h2, h3, p, ul, li, strong only.',
    '  - 1000-1500 words minimum',
    '  - 4-6 h2 sections',
    '  - Specific callouts in <strong> tags',
    '  - End with a personal sign-off from DJ',
    '"seoTitle": 60-char max SEO title',
    '"metaDesc": 155-char max meta description',
    '',
    'CRITICAL: Return only valid JSON. No markdown fences.',
  ].join('\n')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  const d = await res.json()
  if (!res.ok) throw new Error('Claude error ' + res.status + ': ' + JSON.stringify(d).slice(0,200))
  const raw = d.content?.[0]?.text || '{}'
  const clean = raw.split('```json').join('').split('```').join('').trim()
  return JSON.parse(clean)
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not configured' }, { status: 400 })

  const { searchParams } = new URL(req.url)
  const slugFilter = searchParams.get('slug') // optionally write just one article

  const toWrite = slugFilter ? ARTICLES.filter(a => a.slug === slugFilter) : ARTICLES

  const results = []

  for (const article of toWrite) {
    try {
      // Check if already written
      const existing = await sanity.fetch(
        '*[_type=="blogPost" && slug.current==$slug][0]{_id, title}',
        { slug: article.slug }
      )

      const ai = await writeArticle(article)

      const doc = {
        _type:      'blogPost',
        title:      ai.title || article.title,
        slug:       { _type: 'slug', current: article.slug },
        excerpt:    ai.excerpt || '',
        body:       ai.body || '',        category:   article.category,
        readTime:   article.readTime,
        imageUrl:   BLOG_IMAGES[article.slug] || '/img/photos/pistol.jpg',
        author:     'DJ Cavalcanti',
        seoTitle:   ai.seoTitle || ai.title || article.title,
        metaDesc:   ai.metaDesc || ai.excerpt || '',
        status:     'draft',  // requires your approval before publishing
        publishedAt: null,
        _createdAt:  new Date().toISOString(),
      }

      if (existing) {
        await sanity.patch(existing._id).set(doc).commit()
        results.push({ slug: article.slug, status: 'updated', title: doc.title })
      } else {
        await sanity.create(doc)
        results.push({ slug: article.slug, status: 'created', title: doc.title })
      }
    } catch (e) {
      results.push({ slug: article.slug, status: 'failed', error: e.message })
    }

    // Pause between Claude calls
    if (toWrite.indexOf(article) < toWrite.length - 1) {
      await new Promise(r => setTimeout(r, 500))
    }
  }

  const created = results.filter(r => r.status === 'created').length
  const updated = results.filter(r => r.status === 'updated').length
  const failed  = results.filter(r => r.status === 'failed').length

  return Response.json({
    ok: true,
    message: created + ' created, ' + updated + ' updated, ' + failed + ' failed. All drafts need your approval before publishing.',
    results,
  })
}
