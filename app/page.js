import Masthead from '../components/layout/Masthead'
import BreakingTicker from '../components/layout/BreakingTicker'
import StatsBar from '../components/layout/StatsBar'
import Footer from '../components/layout/Footer'
import NewsCard from '../components/ui/NewsCard'
import StateHub from '../components/sections/StateHub'
import {
  fetchArticles, fetchBreakingAlerts, fetchLegislation,
  fetchReleases, fetchReviews, fetchAmmoPrices,
  fetchVideos, fetchGlobalStats, fetchAllStateProfiles
} from '../sanity/lib/client'

export const revalidate = 300

export default async function HomePage() {
  const [
    articles, alerts, legislation,
    releases, reviews, ammoPrices,
    videos, globalStats, stateProfiles
  ] = await Promise.allSettled([
    fetchArticles(10), fetchBreakingAlerts(10), fetchLegislation(6),
    fetchReleases(10), fetchReviews(4), fetchAmmoPrices(),
    fetchVideos(5), fetchGlobalStats(), fetchAllStateProfiles()
  ]).then(r => r.map(p => p.status === 'fulfilled' ? p.value : []))

  const profileMap = {}
  for (const p of (stateProfiles || [])) { if (p?.abbr) profileMap[p.abbr] = p }

  const featuredArticle = articles[0]
  const sidebarArticles = articles.slice(1, 5)
  const newsGrid = articles.slice(5)

  const CAT_COLOR = { breaking:'#EF4444', news:'#9CA3AF', law:'#60A5FA', industry:'#C8922A', opinion:'#C084FC' }

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* HERO */}
      <section style={{ padding: '32px 0', borderBottom: '1px solid #1F2428' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '2px' }}>
            {/* Featured story */}
            <div style={{ position: 'relative', overflow: 'hidden', background: '#16191F', minHeight: '480px', cursor: 'pointer' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #1a1f2e 0%, #0d1117 40%, #1a120a 100%)' }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(200,146,42,0.04) 1px, transparent 1px),linear-gradient(90deg, rgba(200,146,42,0.04) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: '32px', background: 'linear-gradient(0deg, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.5) 50%, transparent 100%)' }}>
                {featuredArticle ? (
                  <>
                    {featuredArticle.urgencyScore >= 8 && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#B91C1C', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', padding: '4px 12px', textTransform: 'uppercase', marginBottom: '14px', width: 'fit-content' }}>
                        <span className="pulse-dot" />
                        Breaking News
                      </div>
                    )}
                    <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '52px', lineHeight: 0.95, color: '#F0EDE6', letterSpacing: '0.02em', marginBottom: '14px', maxWidth: '700px' }}>
                      {featuredArticle.title}
                    </h1>
                    {featuredArticle.excerpt && (
                      <p style={{ fontSize: '15px', color: '#9CA3AF', maxWidth: '600px', marginBottom: '20px', lineHeight: 1.5 }}>
                        {featuredArticle.excerpt}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                        {featuredArticle.author?.name || featuredArticle.source} · Just now
                      </span>
                      <a href={featuredArticle.externalUrl || `/news/${featuredArticle.slug?.current}`} target={featuredArticle.externalUrl ? '_blank' : '_self'} className="btn-gold">Read Full Story →</a>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#B91C1C', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', padding: '4px 12px', marginBottom: '14px', width: 'fit-content' }}>
                      <span className="pulse-dot" />Breaking News
                    </div>
                    <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '52px', lineHeight: 0.95, color: '#F0EDE6', letterSpacing: '0.02em', marginBottom: '14px' }}>
                      Supreme Court Takes Up Landmark 2A Challenge
                    </h1>
                    <p style={{ fontSize: '15px', color: '#9CA3AF', maxWidth: '600px', marginBottom: '20px', lineHeight: 1.5 }}>
                      SCOTUS agreed to hear arguments in Harrington v. ATF, the most significant Second Amendment case since Bruen.
                    </p>
                    <a href="/news" className="btn-gold">Read Full Story →</a>
                  </>
                )}
              </div>
            </div>

            {/* Sidebar stories */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(sidebarArticles.length > 0 ? sidebarArticles : [
                { title: 'Glock 47 Gen 6 Officially Announced — Ships October 2026', category: 'release', externalUrl: '/releases' },
                { title: 'National Reciprocity Act Advances in Senate — 11 States Would Gain', category: 'law', externalUrl: '/laws' },
                { title: 'HK VP9 Match Edition — Best Out-of-Box Trigger Under $900?', category: 'review', externalUrl: '/reviews' },
                { title: '9mm FMJ Drops Below $0.19/rd — Cheapest Since January 2024', category: 'market', externalUrl: '/market' },
              ]).map((article, i) => (
                <a key={article._id || i} href={article.externalUrl || `/news/${article.slug?.current || ''}`}
                  target={article.externalUrl?.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
                  style={{ flex: 1, background: '#16191F', padding: '20px', cursor: 'pointer', borderLeft: '3px solid transparent', transition: 'border-color 0.2s, background 0.2s', textDecoration: 'none', display: 'block' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#1C2028'; e.currentTarget.style.borderLeftColor = '#C8922A' }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#16191F'; e.currentTarget.style.borderLeftColor = 'transparent' }}>
                  <div style={{ color: CAT_COLOR[article.category] || '#9CA3AF', fontFamily: "'Barlow Condensed',sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: '8px' }}>
                    {article.category?.toUpperCase() || 'NEWS'}
                  </div>
                  <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: '18px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.2 }}>{article.title}</div>
                </a>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StatsBar stats={globalStats || {}} />

      {/* NEWS GRID */}
      <section className="page-section">
        <div className="container">
          <div className="sidebar-layout">
            <div>
              <div className="section-header">
                <h2 className="section-title">Latest News</h2>
                <div className="live-badge"><span className="pulse-dot" />Live Feed</div>
                <div className="section-rule" />
                <div className="section-badge">Updated 4 min ago</div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {(newsGrid.length > 0 ? newsGrid : Array(6).fill(null)).map((article, i) => (
                  article ? <NewsCard key={article._id} article={article} /> : (
                    <div key={i} className="card" style={{ height: '280px', background: '#16191F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#6B7280' }}>Loading...</span>
                    </div>
                  )
                ))}
              </div>
              <a href="/news" className="btn-ghost" style={{ display: 'block', textAlign: 'center', marginTop: '20px' }}>Load More Stories →</a>
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              <div>
                <div className="widget-title"><div className="widget-accent" />Laws & Legislation</div>
                {(legislation.length > 0 ? legislation.slice(0,5) : [
                  { title: 'ATF Pistol Brace Rule Challenge', billNumber: 'H.R. 4521', status: 'challenged', summary: 'Injunction in 5th Circuit.' },
                  { title: 'National Concealed Carry Reciprocity Act', billNumber: 'S. 1892', status: 'pending', summary: '47 co-sponsors secured.' },
                  { title: 'Texas Firearms Freedom Act', billNumber: 'TX SB 214', status: 'passed', summary: 'Removes licensing for open carry.' },
                ]).map((bill, i) => (
                  <a key={bill._id || i} href={bill.url || '/laws'} target={bill.url ? '_blank' : '_self'}
                    style={{ display: 'flex', gap: '12px', padding: '12px 0', borderBottom: '1px solid #1F2428', textDecoration: 'none' }}>
                    <div style={{ flexShrink: 0 }}>
                      <span className={`status-badge status-${bill.status}`}>{bill.status}</span>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: '#6B7280', marginTop: '3px' }}>{bill.billNumber}</div>
                    </div>
                    <div>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: '14px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.3 }}>{bill.title}</div>
                      {bill.summary && <div style={{ fontSize: '11px', color: '#6B7280', marginTop: '2px' }}>{bill.summary.slice(0,80)}</div>}
                    </div>
                  </a>
                ))}
              </div>
              <div>
                <div className="widget-title"><div className="widget-accent" />Quick Links</div>
                {[['Find Your State Laws','/state-hub'],['CPL / CCW Lookup','/state-hub'],['Find FFL Dealers','/ffl-finder'],['ATF Rules Database','/laws?cat=atf'],['Ammo Price Tracker','/market']].map(([label,href]) => (
                  <a key={href} href={href} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: '#16191F', border: '1px solid #1F2428', marginBottom: '6px', textDecoration: 'none', color: '#9CA3AF', fontFamily: "'Barlow Condensed',sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em', transition: 'border-color 0.2s' }}>
                    {label}<span style={{ color: '#C8922A' }}>→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="gold-divider" />

      {/* STATE HUB */}
      <section style={{ padding: '48px 0', background: '#111318', borderBottom: '1px solid #1F2428' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Your State · Your Rights</h2>
            <div className="section-rule" />
            <div className="section-badge">All 50 States</div>
          </div>
          <StateHub profiles={profileMap} />
        </div>
      </section>

      <div className="gold-divider" />

      {/* RELEASES */}
      <section className="page-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Just Dropped</h2>
            <div className="live-badge"><span className="pulse-dot" />New Releases</div>
            <div className="section-rule" />
          </div>
          <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
            {(releases.length > 0 ? releases : [
              { _id:'1', brand:'Glock', model:'G47 Gen 6', caliber:'9mm', msrp:699, isNew:true },
              { _id:'2', brand:'Smith & Wesson', model:'M&P 2.0 Pro', caliber:'9mm', msrp:749, isNew:false },
              { _id:'3', brand:'Sig Sauer', model:'P365 XMacro', caliber:'9mm', msrp:649, isNew:true },
              { _id:'4', brand:'HK', model:'VP9 Match', caliber:'9mm', msrp:899, isNew:false },
              { _id:'5', brand:'Ruger', model:'LC Carbine', caliber:'.45 ACP', msrp:799, isNew:true },
              { _id:'6', brand:'Springfield', model:'Hellcat RDP', caliber:'9mm', msrp:599, isNew:false },
            ]).map(r => (
              <div key={r._id} style={{ width: '200px', flexShrink: 0, background: '#111318', border: '1px solid #1F2428' }}>
                <div style={{ height: '130px', background: '#16191F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', position: 'relative' }}>
                  🔫
                  {r.isNew && <div style={{ position: 'absolute', top: '8px', left: '8px', background: '#B91C1C', color: '#fff', fontFamily: "'Barlow Condensed',sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', padding: '2px 6px' }}>NEW</div>}
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: '#C8922A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '3px' }}>{r.brand}</div>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '20px', color: '#F0EDE6', letterSpacing: '0.03em', lineHeight: 1, marginBottom: '6px' }}>{r.model}</div>
                  {r.caliber && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', padding: '2px 6px', background: '#1C2028', border: '1px solid #2A2F38', color: '#6B7280', display: 'inline-block', marginBottom: '8px' }}>{r.caliber}</div>}
                  {r.msrp && <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '18px', color: '#C8922A' }}>${r.msrp.toLocaleString()}</div>}
                </div>
              </div>
            ))}
          </div>
          <a href="/releases" className="btn-ghost" style={{ display: 'inline-block', marginTop: '16px' }}>View All Releases →</a>
        </div>
      </section>

      {/* REVIEWS */}
      <section className="page-section" style={{ background: '#111318' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Field Tested</h2>
            <div className="section-rule" />
            <div className="section-badge">Expert Reviews</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px' }}>
            {reviews.slice(0,1).map(r => (
              <a key={r._id} href={`/reviews/${r.slug?.current || r._id}`} style={{ textDecoration: 'none' }}>
                <div className="card">
                  <div style={{ height: '220px', background: '#16191F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' }}>
                    {r.heroImage?.asset?.url ? <img src={r.heroImage.asset.url} alt={r.firearmName} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} /> : '🔫'}
                  </div>
                  <div style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', gap: '3px', marginBottom: '10px' }}>
                      {Array.from({length:5},(_,i)=><span key={i} style={{color: i < Math.floor((r.score||8.5)/2) ? '#C8922A' : '#2A2F38', fontSize:'14px'}}>★</span>)}
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px', color: '#C8922A', marginLeft: '8px' }}>{(r.score||8.5).toFixed(1)} / 10</span>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '28px', color: '#F0EDE6', letterSpacing: '0.03em', marginBottom: '6px' }}>{r.firearmName}</div>
                    {r.verdict && <p style={{ fontSize: '14px', color: '#9CA3AF', fontStyle: 'italic' }}>"{r.verdict}"</p>}
                  </div>
                </div>
              </a>
            ))}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {(reviews.slice(1,4).length > 0 ? reviews.slice(1,4) : [
                { _id:'r1', firearmName:'Glock 19 Gen 5 MOS', score:8.2, verdict:'Still the gold standard for carry pistols.' },
                { _id:'r2', firearmName:'Sig P320 AXG Legion', score:9.4, verdict:'The AXG chassis transforms the P320.' },
              ]).map(r => (
                <a key={r._id} href={`/reviews/${r.slug?.current || r._id}`}
                  style={{ flex: 1, display: 'flex', gap: '16px', background: '#111318', border: '1px solid #1F2428', padding: '20px', textDecoration: 'none', transition: 'border-color 0.2s' }}>
                  <div style={{ width: '80px', flexShrink: 0, height: '70px', background: '#16191F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px' }}>🔫</div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <span style={{ color: '#C8922A', fontSize: '11px' }}>{'★'.repeat(Math.floor((r.score||8)/2))}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#C8922A' }}>{(r.score||8).toFixed(1)}/10</span>
                    </div>
                    <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '20px', color: '#F0EDE6', letterSpacing: '0.03em', lineHeight: 1, marginBottom: '4px' }}>{r.firearmName}</div>
                    {r.verdict && <div style={{ fontSize: '12px', color: '#9CA3AF' }}>{r.verdict.slice(0,80)}</div>}
                  </div>
                </a>
              ))}
            </div>
          </div>
          <a href="/reviews" className="btn-ghost" style={{ display: 'inline-block', marginTop: '16px' }}>All Reviews →</a>
        </div>
      </section>

      {/* MARKET WATCH */}
      <section className="page-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Market Watch</h2>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#6B7280' }}>¢/round avg</div>
            <div className="section-rule" />
            <div className="live-badge"><span className="pulse-dot" />Live</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '2px', marginBottom: '16px' }}>
            {(ammoPrices.length > 0 ? ammoPrices.slice(0,6) : [
              { _id:'1', caliber:'9mm', pricePerRound:0.189, trendDirection:'down', trendPercent:4.2, availabilityIndex:85 },
              { _id:'2', caliber:'.223/5.56', pricePerRound:0.321, trendDirection:'up', trendPercent:1.8, availabilityIndex:70 },
              { _id:'3', caliber:'.308 WIN', pricePerRound:0.745, trendDirection:'down', trendPercent:2.1, availabilityIndex:60 },
              { _id:'4', caliber:'.45 ACP', pricePerRound:0.387, trendDirection:'up', trendPercent:0.9, availabilityIndex:75 },
              { _id:'5', caliber:'12 GA', pricePerRound:0.412, trendDirection:'down', trendPercent:1.3, availabilityIndex:90 },
              { _id:'6', caliber:'6.5 CM', pricePerRound:1.42, trendDirection:'up', trendPercent:3.4, availabilityIndex:50 },
            ]).map(a => (
              <div key={a._id} style={{ background: '#111318', border: '1px solid #1F2428', padding: '16px', textAlign: 'center', borderBottom: `2px solid ${a.trendDirection==='down'?'#4ADE80':'#EF4444'}` }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', fontWeight: 500, color: '#F0EDE6', marginBottom: '6px' }}>{a.caliber}</div>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '26px', color: '#C8922A', letterSpacing: '0.03em' }}>
                  {a.pricePerRound < 1 ? `${Math.round(a.pricePerRound*100)}¢` : `$${a.pricePerRound?.toFixed(2)}`}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: a.trendDirection==='down'?'#4ADE80':'#EF4444' }}>
                  {a.trendDirection==='down'?'↓':'↑'} {a.trendPercent?.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
          <a href="/market" className="btn-ghost">Full Market Watch →</a>
        </div>
      </section>

      {/* NEWSLETTER */}
      <section style={{ padding: '60px 0', background: '#111318', borderBottom: '1px solid #1F2428', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', fontFamily: "'Bebas Neue',cursive", fontSize: '220px', color: 'rgba(200,146,42,0.03)', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          DOWNRANGE
        </div>
        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '60px', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '52px', color: '#F0EDE6', lineHeight: 0.95, letterSpacing: '0.02em', marginBottom: '16px' }}>
                Stay <span style={{ color: '#C8922A' }}>Armed</span><br />& Informed
              </h2>
              <p style={{ fontSize: '15px', color: '#9CA3AF', lineHeight: 1.6, marginBottom: '24px' }}>
                Join 400,000+ Americans getting DownRange's daily intelligence briefing — breaking news, new laws, gear releases, and ammo prices every morning.
              </p>
              <form style={{ display: 'flex', gap: '0' }}>
                <input type="email" placeholder="your@email.com" style={{ flex: 1, background: '#16191F', border: '1px solid #2A2F38', borderRight: 'none', color: '#F0EDE6', fontFamily: "'IBM Plex Sans',sans-serif", fontSize: '14px', padding: '14px 18px', outline: 'none' }} />
                <button type="submit" className="btn-gold" style={{ flexShrink: 0 }}>Subscribe Free →</button>
              </form>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#6B7280', marginTop: '10px' }}>
                No spam. Unsubscribe anytime. Your data is never sold.
              </p>
            </div>
            <div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '12px', marginBottom: '20px' }}>
                {[['412K','Subscribers'],['50','State Guides'],['Daily','Briefings']].map(([num,label]) => (
                  <div key={label} style={{ textAlign: 'center', padding: '20px 12px', background: '#16191F', border: '1px solid #1F2428' }}>
                    <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '36px', color: '#C8922A', letterSpacing: '0.03em' }}>{num}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {[['𝕏 Twitter','#'],['▶ YouTube','#'],['📡 Rumble','#'],['✈ Telegram','#']].map(([label,href]) => (
                  <a key={label} href={href} className="btn-ghost" style={{ fontSize: '11px', padding: '8px 12px' }}>{label}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
