import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import BreakingTicker from '../../../components/layout/BreakingTicker'
import Link from 'next/link'
import { fetchBreakingAlerts } from '../../../sanity/lib/client'
import { notFound } from 'next/navigation'

export const revalidate = 900 // 15 min

// Curated RSS feeds per state — actual firearms/political news sources
const STATE_FEEDS = {
  TX: [
    { name:'Texas Tribune — Law', url:'https://www.texastribune.org/series/texas-legislature/feed/' },
    { name:'Texas Scorecard', url:'https://texasscorecard.com/feed/' },
    { name:'KXAN Austin', url:'https://www.kxan.com/news/local/feed/' },
  ],
  CA: [
    { name:'CalGuns Foundation', url:'https://www.calguns.net/forum/external.php?type=RSS2' },
    { name:'CRPA News', url:'https://crpa.org/feed/' },
    { name:'Cal Matters', url:'https://calmatters.org/feed/' },
  ],
  FL: [
    { name:'Florida Politics', url:'https://floridapolitics.com/feed/' },
    { name:'NRAILA Florida', url:'https://www.nraila.org/rss/' },
    { name:'Tampa Bay Times', url:'https://www.tampabay.com/feed/' },
  ],
  WA: [
    { name:'NW Firearms — WA', url:'https://www.northwestfirearms.com/forums/-/index.rss' },
    { name:'Washington Policy Center', url:'https://www.washingtonpolicy.org/feed' },
    { name:'Kiro 7 Seattle', url:'https://www.kiro7.com/rss/news/' },
  ],
  TX2: null,
}

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',
  OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',
  WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming'
}

// Fetch news from our Sanity database filtered by state
async function fetchStateNews(abbr, sort = 'newest') {
  const { createClient } = await import('@sanity/client')
  const client = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
    dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
  })

  const orderBy = sort === 'urgency' ? 'urgencyScore desc' : 'publishedAt desc'

  try {
    return await client.fetch(`
      *[_type=="newsArticle" && approved==true && ($state in relatedStates || title match $pattern || summary match $pattern)] | order(${orderBy}) [0...30] {
        _id, title, slug, summary, excerpt, category, urgencyScore, publishedAt, source, externalUrl, imageUrl
      }
    `, { state: abbr, pattern: `*${STATE_NAMES[abbr]}*` })
  } catch { return [] }
}

// Fetch from RSS in real-time for additional state coverage
async function fetchStateRSS(abbr) {
  const stateFeeds = STATE_FEEDS[abbr]
  if (!stateFeeds) return []

  const results = []
  try {
    const Parser = (await import('rss-parser')).default
    const parser = new Parser({ timeout: 4000 })

    for (const feed of stateFeeds) {
      try {
        const f = await parser.parseURL(feed.url)
        f.items.slice(0, 5).forEach(item => {
          results.push({
            _id: `rss-${feed.name}-${item.guid || item.link}`,
            title: item.title,
            source: feed.name,
            externalUrl: item.link,
            publishedAt: item.pubDate || item.isoDate,
            summary: item.contentSnippet?.slice(0, 200),
            category: 'news',
            fromRSS: true,
          })
        })
      } catch {}
    }
  } catch {}

  return results.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
}

function timeAgo(d) {
  if (!d) return ''
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

const CAT_COLORS = {
  breaking:'#EF4444', law:'#60A5FA', industry:'#C8922A',
  news:'#9CA3AF', opinion:'#C084FC', training:'#34D399',
}

export async function generateStaticParams() {
  return Object.keys(STATE_NAMES).map(s => ({ state: s.toLowerCase() }))
}

export async function generateMetadata({ params }) {
  const abbr = params.state.toUpperCase()
  const name = STATE_NAMES[abbr]
  if (!name) return { title: 'State News — DownRange' }
  return {
    title: `${name} Firearms News — DownRange`,
    description: `Latest firearms news, laws, and legislation for ${name}. Updated every 15 minutes.`,
  }
}

export default async function StateNewsPage({ params, searchParams }) {
  const abbr = params.state.toUpperCase()
  const stateName = STATE_NAMES[abbr]
  if (!stateName) notFound()

  const sort = searchParams?.sort || 'newest'
  const cat  = searchParams?.cat || null

  const [sanityNews, rssNews, alerts] = await Promise.all([
    fetchStateNews(abbr, sort).catch(() => []),
    fetchStateRSS(abbr).catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])

  // Merge Sanity + RSS, deduplicate by title, sort by date
  const allNews = [...sanityNews, ...rssNews]
    .filter((item, idx, arr) => arr.findIndex(a => a.title === item.title) === idx)
    .filter(item => !cat || item.category === cat)
    .sort((a, b) => {
      if (sort === 'urgency') return (b.urgencyScore || 0) - (a.urgencyScore || 0)
      return new Date(b.publishedAt) - new Date(a.publishedAt)
    })

  const categories = ['all', 'breaking', 'law', 'news', 'industry', 'opinion']

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title={abbr}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <Link href="/state-hub" style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', textDecoration:'none' }}>← STATE HUB</Link>
            <span style={{ color:'#1F2428' }}>›</span>
            <Link href={`/state-hub/${params.state}`} style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', textDecoration:'none' }}>{stateName} Laws</Link>
            <span style={{ color:'#1F2428' }}>›</span>
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A' }}>News</span>
          </div>
          <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', flexWrap:'wrap', gap:12 }}>
            <div>
              <h1 className="page-hero-title">{stateName} Firearms News</h1>
              <p className="page-hero-sub">{allNews.length} articles · Updated every 15 min · Sorted by {sort}</p>
            </div>
            <div className="live-badge"><span className="pulse-dot" />Live Feed</div>
          </div>
        </div>
      </div>

      <div style={{ padding:'32px 0' }}>
        <div className="container">

          {/* Controls bar */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px', flexWrap:'wrap', gap:12 }}>
            {/* Category filters */}
            <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
              {categories.map(c => (
                <a key={c} href={`/state-news/${params.state}?cat=${c==='all'?'':c}&sort=${sort}`}
                  style={{ fontFamily:'monospace', fontSize:'10px', padding:'4px 12px', border:'1px solid #1F2428',
                    color: (cat===c||(c==='all'&&!cat)) ? '#C8922A' : '#4B5563',
                    background: (cat===c||(c==='all'&&!cat)) ? '#C8922A20' : 'transparent',
                    textDecoration:'none', textTransform:'uppercase', letterSpacing:'0.05em' }}>
                  {c === 'all' ? 'All' : c}
                </a>
              ))}
            </div>

            {/* Sort options */}
            <div style={{ display:'flex', gap:'6px' }}>
              <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563', alignSelf:'center' }}>SORT:</span>
              {[['newest','📅 Newest'],['urgency','⚡ Urgency']].map(([key,label]) => (
                <a key={key} href={`/state-news/${params.state}?cat=${cat||''}&sort=${key}`}
                  style={{ fontFamily:'monospace', fontSize:'10px', padding:'4px 12px', border:'1px solid #1F2428',
                    color: sort===key ? '#C8922A' : '#4B5563',
                    background: sort===key ? '#C8922A20' : 'transparent',
                    textDecoration:'none' }}>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* News list */}
          {allNews.length === 0 ? (
            <div style={{ textAlign:'center', padding:'80px', fontFamily:'monospace', fontSize:'13px', color:'#4B5563' }}>
              <div style={{ fontSize:'4rem', marginBottom:'16px', opacity:0.2 }}>◈</div>
              No {stateName} firearms news indexed yet. The AI agent will populate this as it finds relevant articles.
              <br/><br/>
              <a href="/news" style={{ color:'#C8922A', textDecoration:'none' }}>← See all national news</a>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr', gap:'32px' }}>
              {/* Main feed */}
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {allNews.map((article, i) => {
                  const catColor = CAT_COLORS[article.category] || '#9CA3AF'
                  const href = article.fromRSS
                    ? (article.externalUrl || '#')
                    : `/news/${article.slug?.current || article._id}`
                  const isExternal = article.fromRSS || !!article.externalUrl

                  return (
                    <a key={article._id || i} href={href}
                      target={isExternal ? '_blank' : '_self'}
                      rel={isExternal ? 'noopener noreferrer' : ''}
                      style={{ display:'block', textDecoration:'none', background:'#111318', border:'1px solid #1F2428', padding:'14px 18px', borderLeft:`3px solid ${i < 3 ? catColor : '#1F2428'}` }}>
                      {/* Top meta row */}
                      <div style={{ display:'flex', gap:'10px', alignItems:'center', marginBottom:'6px', flexWrap:'wrap' }}>
                        {article.category && (
                          <span style={{ fontFamily:'monospace', fontSize:'9px', color:catColor, letterSpacing:'0.12em' }}>
                            {article.category.toUpperCase()}
                          </span>
                        )}
                        {article.urgencyScore >= 8 && (
                          <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#EF4444', background:'#1A0000', padding:'1px 6px' }}>
                            ⚡ {article.urgencyScore}/10
                          </span>
                        )}
                        {article.fromRSS && (
                          <span style={{ fontFamily:'monospace', fontSize:'9px', color:'#34D399', background:'#001A0A', padding:'1px 6px' }}>
                            RSS LIVE
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize:'14px', fontWeight:600, color:'#F0EDE6', lineHeight:1.35, marginBottom:'6px' }}>
                        {article.title}
                      </div>
                      {(article.summary || article.excerpt) && (
                        <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.6, marginBottom:'8px' }}>
                          {(article.summary || article.excerpt)?.slice(0, 160)}
                        </p>
                      )}
                      <div style={{ display:'flex', gap:'12px', fontFamily:'monospace', fontSize:'10px', color:'#374151' }}>
                        <span>{article.source || 'DownRange'}</span>
                        <span>·</span>
                        <span>{timeAgo(article.publishedAt)}</span>
                        {isExternal && <span style={{ color:'#4B5563' }}>↗ External</span>}
                      </div>
                    </a>
                  )
                })}
              </div>

              {/* Sidebar */}
              <aside>
                {/* State law summary */}
                <div style={{ background:'#111318', border:'1px solid #1F2428', padding:'18px', marginBottom:'16px' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'12px', fontWeight:700 }}>
                    {stateName.toUpperCase()} QUICK LAWS
                  </div>
                  <Link href={`/state-hub/${params.state}`}
                    style={{ display:'block', fontFamily:'monospace', fontSize:'11px', color:'#60A5FA', marginBottom:'10px', textDecoration:'none' }}>
                    View full {stateName} law profile →
                  </Link>
                  <Link href={`/laws?tab=state&state=${abbr}`}
                    style={{ display:'block', fontFamily:'monospace', fontSize:'11px', color:'#60A5FA', textDecoration:'none' }}>
                    {stateName} bills in tracker →
                  </Link>
                </div>

                {/* Other states */}
                <div style={{ background:'#111318', border:'1px solid #1F2428', padding:'18px' }}>
                  <div style={{ fontFamily:'monospace', fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'12px', fontWeight:700 }}>
                    OTHER STATE NEWS
                  </div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'6px' }}>
                    {['TX','CA','FL','WA','IL','NY','AZ','CO','GA','OH'].filter(s=>s!==abbr).map(s=>(
                      <a key={s} href={`/state-news/${s.toLowerCase()}`}
                        style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', background:'#0D1117', border:'1px solid #1F2428', padding:'3px 8px', textDecoration:'none' }}>
                        {s}
                      </a>
                    ))}
                  </div>
                </div>
              </aside>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
