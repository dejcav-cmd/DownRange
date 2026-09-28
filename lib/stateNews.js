// State-filtered news from Sanity — shared by /state-news/[state] and the
// "Latest {State} News" block on /laws/[state].
//
// Articles match when the AI tagger listed the state in relatedStates, or the
// state's name appears in the title/summary. Two names need special handling:
//   - "Washington" also means the federal government / D.C. Only match the
//     explicit "Washington State" phrase (or the relatedStates tag).
//   - "Virginia" also matches "West Virginia" (GROQ match is token-based), so
//     Virginia relies on relatedStates plus results with "West Virginia" removed.
import { createClient } from '@sanity/client'

export const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

const NAME_PATTERN = { WA: 'Washington State' }

const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
})

export async function fetchStateNews(abbr, { sort = 'newest', limit = 30 } = {}) {
  const name = STATE_NAMES[abbr]
  if (!name) return []
  const orderBy = sort === 'urgency' ? 'urgencyScore desc, publishedAt desc' : 'publishedAt desc'
  const phrase = NAME_PATTERN[abbr] || name
  try {
    const rows = await client.fetch(
      `*[_type=="newsArticle" && approved==true && (
          $state in relatedStates || title match $pattern || summary match $pattern
        )] | order(${orderBy}) [0...$fetchN] {
        _id, title, slug, summary, excerpt, category, urgencyScore, publishedAt, source, externalUrl, imageUrl, relatedStates
      }`,
      { state: abbr, pattern: phrase, fetchN: limit * 2 },  // multi-word = all tokens must match
      { next: { revalidate: 180 } }
    )
    const filtered = rows.filter(a => {
      if ((a.relatedStates || []).includes(abbr)) return true
      const text = `${a.title || ''} ${a.summary || ''}`
      if (abbr === 'VA') return /\bVirginia\b/.test(text.replace(/West Virginia/g, ''))
      if (abbr === 'WA') return /Washington State/i.test(text)
      return true
    })
    return filtered.slice(0, limit)
  } catch {
    return []
  }
}
