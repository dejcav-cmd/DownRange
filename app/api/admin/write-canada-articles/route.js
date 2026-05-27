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

const CANADA_ARTICLES = [
  {
    slug:     'canada-handgun-freeze-what-gun-owners-need-to-know',
    title:    'Canada\'s Handgun Freeze: What Every Gun Owner Actually Needs to Know',
    category: 'canada',
    tag:      'LAW',
    readMins: '9 min',
    imageUrl: '/img/law.svg',
    prompt:   `Write a detailed blog post for DownRange titled "Canada's Handgun Freeze: What Every Gun Owner Actually Needs to Know" — written by DJ Cavalcanti as someone who covers Canadian firearms law closely.

Cover these points thoroughly:
1. What the freeze actually does (can't buy, sell, or transfer handguns — but can keep what you have)
2. The practical impact on dealers (inventory frozen, businesses strangled)
3. What happens when you die (bequeath to licensed heirs, but they can't sell either)
4. The CCFR constitutional challenge — what's being argued, why it may or may not succeed
5. What Canadian gun owners should do right now (keep PAL current, document everything, stay plugged into CCFR)
6. The political context under the Conservative government — what may or may not change

Voice: DJ Cavalcanti. Direct, informed, written for gun owners not law professors. 900-1100 words.
Format: HTML with h2 sections, p, ul, li, strong. No h1.`,
  },
  {
    slug:     'canada-oic-ban-legal-limbo-what-happens-next',
    title:    'The OIC Rifle Ban: Still Illegal to Sell, Still Legal to Own — Here\'s the Mess Explained',
    category: 'canada',
    tag:      'POLICY',
    readMins: '8 min',
    imageUrl: '/img/rifle.svg',
    prompt:   `Write a detailed blog post for DownRange titled "The OIC Rifle Ban: Still Illegal to Sell, Still Legal to Own — Here's the Mess Explained" — by DJ Cavalcanti.

Cover:
1. What the 2020 Order in Council actually banned (AR-15, Mini-14, Vz-58, etc.) and how classification works
2. The ongoing amnesty — what it allows (storage) and what it doesn't (transport, sale, transfer)
3. The cancelled buyback program — how C$756M+ was budgeted, contracted, then cancelled by Conservatives
4. What the Conservative government has said about reversing the ban (what's been promised vs done)
5. What owners of banned firearms should do: stay current on amnesty renewals, document ownership, watch CCFR
6. Whether a reversal is realistic — legislative vs OIC, timelines, political obstacles

Voice: DJ Cavalcanti. Frustrated but analytical. This is real money and real property at stake. 900-1100 words.
Format: HTML h2/p/ul/li/strong. No h1.`,
  },
  {
    slug:     'canada-pal-complete-guide-how-to-get-your-licence',
    title:    'How to Get Your PAL in Canada: The Complete Realistic Guide',
    category: 'canada',
    tag:      'GUIDE',
    readMins: '11 min',
    imageUrl: '/img/pistol.svg',
    prompt:   `Write a comprehensive practical guide for DownRange titled "How to Get Your PAL in Canada: The Complete Realistic Guide" — by DJ Cavalcanti.

Cover step by step:
1. The CFSC course — what to expect, how to find an instructor, practical vs written, pass rate
2. The CRFSC — when you need it, how it differs from CFSC
3. The application (form RCMP 3005) — what documents, the spousal notification requirement, references
4. Processing: realistic timelines by province (AB 45-60 days, QC 90-180, others in between)
5. What trips people up (references not answering, lapsed information, prior record)
6. PAL vs RPAL vs POL — what each allows
7. After you get it: ATT for restricted, storage rules, renewal every 5 years
8. Specific advice for people with prior legal issues (not disqualifying by default)

Be specific with real costs, timelines, and province differences. 1000-1200 words.
Voice: DJ Cavalcanti. Helpful and direct, like a buddy who's been through the process.
Format: HTML h2/p/ul/li/strong. No h1.`,
  },
  {
    slug:     'canada-magazine-capacity-limits-what-you-can-and-cant-own',
    title:    'Canadian Magazine Laws: What You Can Own, What\'s Illegal, and the Pinning Trap',
    category: 'canada',
    tag:      'LAW',
    readMins: '7 min',
    imageUrl: '/img/pistol.svg',
    prompt:   `Write a detailed explainer for DownRange titled "Canadian Magazine Laws: What You Can Own, What's Illegal, and the Pinning Trap" — by DJ Cavalcanti.

Cover:
1. The baseline rules: 5-round limit for semi-auto centrefire, 10 for handguns, no limit for rimfire or manually-operated
2. What "pinned" means legally and how it must be done to be compliant
3. The criminal risk of removing pins — it's not a regulatory offence, it's a Criminal Code offence
4. Grandfathered magazines — what qualifies, what proof you need (none — but document anyway)
5. The 2023 amendment attempt and where it went
6. Practical advice: what to buy, what magazines are legal on restricted vs non-restricted platforms
7. The competition exemption — what it is, which IPSC divisions it applies to

Be precise and practical. 800-1000 words.
Voice: DJ Cavalcanti. 
Format: HTML h2/p/ul/li/strong. No h1.`,
  },
  {
    slug:     'canada-safe-storage-rules-criminal-offence-you-might-be-committing',
    title:    'Canadian Safe Storage: The Criminal Offence You Might Not Know You\'re Committing',
    category: 'canada',
    tag:      'GUIDE',
    readMins: '6 min',
    imageUrl: '/img/pistol.svg',
    prompt:   `Write a practical safety and legal guide for DownRange titled "Canadian Safe Storage: The Criminal Offence You Might Not Know You're Committing" — by DJ Cavalcanti.

Cover:
1. The baseline storage rules by class: non-restricted, restricted, prohibited
2. The trigger lock requirement — what qualifies as a compliant lock
3. The "readily accessible" concept and how it's interpreted
4. Ammunition storage — the "separate" requirement and what that actually means
5. The R v Montague case and warrantless compliance inspections
6. What police look for during a welfare check that can turn into a storage charge
7. Transport rules for restricted firearms — the ATT and when it's required
8. Practical recommendations: gun safes, quick-access pistol vaults, what's compliant

Be concrete and specific. This is criminal law — be accurate.
800-1000 words. Voice: DJ Cavalcanti, serious and precise. 
Format: HTML h2/p/ul/li/strong. No h1.`,
  },
]

async function writeArticle(article) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model:      'claude-sonnet-4-5',
      max_tokens: 4000,
      messages: [{ role: 'user', content: article.prompt }],
    }),
  })
  const d = await res.json()
  if (!res.ok) throw new Error('Anthropic ' + res.status)
  return d.content?.[0]?.text?.trim()
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  if (!process.env.ANTHROPIC_API_KEY) return Response.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 400 })

  const results = []

  for (const article of CANADA_ARTICLES) {
    try {
      const existing = await sanity.fetch(
        '*[_type=="blogPost" && slug.current==$slug][0]{_id,body}',
        { slug: article.slug }
      )

      const body = await writeArticle(article)
      if (!body) throw new Error('Empty response from Claude')

      const excerpt = body.replace(/<[^>]+>/g, '').slice(0, 200).trim() + '...'

      if (existing) {
        await sanity.patch(existing._id).set({ body, excerpt }).commit()
        results.push({ slug: article.slug, status: 'updated' })
      } else {
        await sanity.create({
          _type:       'blogPost',
          title:       article.title,
          slug:        { _type: 'slug', current: article.slug },
          category:    article.category,
          excerpt,
          body,
          imageUrl:    article.imageUrl,
          author:      'DJ Cavalcanti',
          readTime:    article.readMins,
          status:      'draft',
          publishedAt: null,
          _createdAt:  new Date().toISOString(),
        })
        results.push({ slug: article.slug, status: 'created', title: article.title })
      }

      // Brief pause between Claude calls
      await new Promise(r => setTimeout(r, 400))
    } catch (e) {
      results.push({ slug: article.slug, status: 'failed', error: e.message })
    }
  }

  const created = results.filter(r => r.status === 'created').length
  const failed  = results.filter(r => r.status === 'failed').length

  return Response.json({
    ok: true,
    message: `${created} articles written. ${failed} failed. All saved as drafts — approve in Admin → Blog.`,
    results,
  })
}
