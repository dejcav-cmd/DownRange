import React from 'react'
import Masthead from '../components/layout/Masthead'
import LiveNewsGrid from '../components/ui/LiveNewsGrid'
import BreakingTicker from '../components/layout/BreakingTicker'
import Footer from '../components/layout/Footer'
import NewsCard from '../components/ui/NewsCard'
import WhatsHot from '../components/ui/WhatsHot'
import StateHub from '../components/sections/StateHub'
import NewsletterSignup from '../components/sections/NewsletterSignup'
import Link from 'next/link'
import {
  fetchArticles, fetchBreakingAlerts, fetchLegislation,
  fetchReleases, fetchReviews, fetchAmmoPrices,
  fetchVideos, fetchAllStateProfiles
} from '../sanity/lib/client'

export const revalidate = 300

export const metadata = {
  title: 'DownRange — Firearms & Second Amendment Intelligence',
  description: 'Real-time 2A news, state gun laws, ammo prices, new releases, and CCW guides for American gun owners.',
  alternates: { canonical: 'https://downrangeco.com' },
}

// ── SEED DATA ─────────────────────────────────────────────────────────────────

const SEED_ARTICLES = [
  { _id:'s1', title:'Supreme Court Takes Up Landmark 2A Challenge — Harrington v. ATF', category:'breaking', urgencyScore:9, source:'SCOTUSblog', publishedAt: new Date(Date.now()-300000).toISOString(), excerpt:'SCOTUS agreed to hear arguments in the most significant Second Amendment case since Bruen.', slug:{ current:'scotus-harrington-atf' } },
  { _id:'s2', title:'National Reciprocity Act Advances in Senate — 11 States Would Gain Full Reciprocity', category:'law', urgencyScore:8, source:'NRA-ILA', publishedAt: new Date(Date.now()-900000).toISOString(), excerpt:'Senate Judiciary Committee passed the bill 11-7 along party lines.', slug:{ current:'national-reciprocity-senate' } },
  { _id:'s3', title:'Glock Officially Announces G47 Gen 6 — Ships October 2026', category:'industry', urgencyScore:6, source:'The Firearm Blog', publishedAt: new Date(Date.now()-1800000).toISOString(), excerpt:'New Gen 6 frame with improved grip texture and factory-installed optic cut.', slug:{ current:'glock-g47-gen6-announced' } },
  { _id:'s4', title:'9mm FMJ Drops Below 18¢/rd — Cheapest Since January 2024', category:'industry', urgencyScore:5, source:'AmmoSeek', publishedAt: new Date(Date.now()-3600000).toISOString(), excerpt:'Federal and Blazer bulk pack hitting all-time lows at major retailers.', slug:{ current:'9mm-price-18-cents' } },
  { _id:'s5', title:'California AWB Ruled Unconstitutional by 9th Circuit Panel', category:'law', urgencyScore:9, source:'TTAG', publishedAt: new Date(Date.now()-5400000).toISOString(), excerpt:'Divided 9th Circuit panel found California assault weapons ban violates Bruen standard.', slug:{ current:'california-awb-9th-circuit' } },
  { _id:'s6', title:'ATF Brace Rule Vacated Nationwide — DOJ Declines to Appeal', category:'breaking', urgencyScore:9, source:'GOA', publishedAt: new Date(Date.now()-7200000).toISOString(), excerpt:'Fifth Circuit ruling stands after DOJ announcement.', slug:{ current:'atf-brace-rule-vacated' } },
  { _id:'s7', title:'SIG Sauer Wins $88M Army Contract for P320 MHS Upgrade Program', category:'industry', urgencyScore:5, source:'Defense News', publishedAt: new Date(Date.now()-10800000).toISOString(), excerpt:'Contract covers P320 AXG and optic system upgrades for active-duty units.', slug:{ current:'sig-p320-army-contract' } },
  { _id:'s8', title:'House SHARE Act Would Remove Suppressors from NFA — Floor Vote Set', category:'law', urgencyScore:8, source:'NRA-ILA', publishedAt: new Date(Date.now()-14400000).toISOString(), excerpt:'SHARE Act scheduled for full House floor vote next week.', slug:{ current:'share-act-floor-vote' } },
]

const SEED_AMMO = [
  { _id:'1', caliber:'9mm',      pricePerRound:0.189, trendDirection:'down', trendPercent:4.2, bestUrl:'https://www.luckygunner.com/handgun/9mm-ammo' },
  { _id:'2', caliber:'.223/5.56', pricePerRound:0.321, trendDirection:'up',   trendPercent:1.8, bestUrl:'https://palmettostatearmory.com/ammo' },
  { _id:'3', caliber:'.308 WIN',  pricePerRound:0.745, trendDirection:'down', trendPercent:2.1, bestUrl:'https://ammo.com/rifle/308-ammo' },
  { _id:'4', caliber:'.45 ACP',   pricePerRound:0.387, trendDirection:'up',   trendPercent:0.9, bestUrl:'https://www.grabagun.com' },
  { _id:'5', caliber:'12 GA',     pricePerRound:0.412, trendDirection:'down', trendPercent:1.3, bestUrl:'https://www.ammunitiondepot.com' },
  { _id:'6', caliber:'6.5 CM',    pricePerRound:1.42,  trendDirection:'up',   trendPercent:3.4, bestUrl:'https://www.midwayusa.com' },
]

const CAT_COLOR = {
  breaking: '#ef4444', law: '#3b82f6', industry: '#C8922A',
  news: '#9ca3af', opinion: '#a855f7', training: '#22c55e',
}

const CAT_LABEL = {
  breaking:'⚡ BREAKING', law:'⚖ LAW', industry:'◈ INDUSTRY',
  news:'📰 NEWS', opinion:'◇ OPINION', training:'▲ TRAINING',
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)  return 'Just now'
  if (diff < 60) return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  return `${Math.floor(diff/1440)}d ago`
}

export default async function HomePage() {
  const [
    articles, alerts, legislation,
    releases, reviews, ammoPrices,
    videos, stateProfiles
  ] = await Promise.allSettled([
    fetchArticles(20), fetchBreakingAlerts(10), fetchLegislation(6),
    fetchReleases(8), fetchReviews(4), fetchAmmoPrices(),
    fetchVideos(4), fetchAllStateProfiles()
  ]).then(r => r.map(p => p.status === 'fulfilled' ? p.value : []))

  const profileMap = {}
  for (const p of (stateProfiles || [])) { if (p?.abbr) profileMap[p.abbr] = p }

  const allArticles  = articles.length > 0 ? articles : SEED_ARTICLES
  const heroArticles = allArticles.slice(0, 6)  // rotate through first 6
  const listArticles = allArticles.slice(0, 12) // left list
  const gridArticles = allArticles.slice(6, 14) // bottom grid
  const ammo = (ammoPrices.length > 0 ? ammoPrices : SEED_AMMO)
    .map(a => ({ ...a, ppr: a.ppr ?? a.pricePerRound ?? 0, dir: a.dir ?? a.trendDirection ?? 'up', trendPercent: a.trendPercent ?? a.trend ?? Math.random()*3+0.5, url: a.url ?? a.bestUrl ?? '/market' }))

  return (
    <>
      {/* AvantLink affiliate ownership verification — delete after approval */}
      <div style={{display:'none'}} dangerouslySetInnerHTML={{__html:'<script src="https://classic.avantlink.com/affiliate_app_confirm.php?mode=js&application_id=1604521"></script>'}} />
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <style>{`
        /* Hero rotator */
        @keyframes heroFadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes heroProgress { from { width:0; } to { width:100%; } }
        @keyframes tickerScroll { 0% { transform:translateX(0); } 100% { transform:translateX(-50%); } }
        .hero-slide { animation: heroFadeIn 0.5s ease forwards; }
        .news-list-item:hover { background: rgba(200,146,42,0.05) !important; border-left-color: #C8922A !important; }
        .news-list-item:hover .nl-title { color: #C8922A !important; }
        .ammo-card:hover { border-color: #C8922A !important; transform: translateY(-2px); }
        .release-card:hover { border-color: #C8922A !important; }
        .section-link:hover { color: #C8922A !important; }
        .review-card:hover { border-color: #C8922A !important; }
        .dr-page { padding: 0; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        .pulse-dot { display:inline-block; width:7px; height:7px; border-radius:50%; background:#22c55e; animation:pulse 1.5s infinite; }
      `}</style>

      {/* ════════════════════════════════════════════════════════
          HERO — rotating big story + news list
      ════════════════════════════════════════════════════════ */}
      <section style={{ background:'var(--bg)', borderBottom:'1px solid var(--border)' }}>

        {/* Section label */}
        <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'8px 0' }}>
          <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ background:'#C8922A', color:'#000', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.2em', padding:'2px 10px' }}>LATEST NEWS</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, color:'#22c55e', fontFamily:"'IBM Plex Mono',monospace", fontSize:10 }}>
                <span className="pulse-dot" /> LIVE FEED
              </span>
            </div>
            <Link href="/news" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', textDecoration:'none', letterSpacing:'0.06em' }}>
              ALL NEWS →
            </Link>
          </div>
        </div>

        <div className="container" style={{ padding:'0' }}>
          <div className="hero-grid-split" style={{ display:'grid', gridTemplateColumns:'minmax(280px,340px) 1fr', minHeight:560 }}>

            {/* LEFT — scrollable news list */}
            <div className="hero-list-col" style={{ borderRight:'1px solid var(--border)', overflowY:'auto', maxHeight:560 }}>
              {listArticles.map((a, i) => {
                const slug = a.slug?.current || a._id
                const cc   = CAT_COLOR[a.category] || '#9ca3af'
                return (
                  <Link key={a._id || i} href={`/news/${slug}`} style={{ textDecoration:'none', display:'block' }}
                    className="news-list-item"
                  >
                    <div style={{
                      padding:'14px 16px',
                      borderBottom:'1px solid rgba(30,41,59,0.6)',
                      borderLeft:`3px solid ${i === 0 ? '#C8922A' : 'transparent'}`,
                      background: i === 0 ? 'rgba(200,146,42,0.06)' : 'transparent',
                      transition:'all 0.15s',
                    }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:5 }}>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, color:cc, background:cc+'18', padding:'1px 6px', borderRadius:2, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                          {CAT_LABEL[a.category] || a.category}
                        </span>
                        {a.urgencyScore >= 8 && (
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#ef4444' }}>●</span>
                        )}
                      </div>
                      <div className="nl-title" style={{
                        fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700,
                        color: i === 0 ? '#C8922A' : 'var(--foreground)', lineHeight:1.25,
                        marginBottom:4, transition:'color 0.15s',
                      }}>
                        {a.title}
                      </div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#334155' }}>
                        {a.source} · {timeAgo(a.publishedAt)}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* RIGHT — rotating hero */}
            <div style={{ position:'relative', overflow:'hidden', background:'#0a0b0d' }}>

              {/* Hero content — client component for rotation */}
              <HeroRotator articles={heroArticles} />

            </div>
          </div>
        </div>
      </section>

      {/* ════ MARKET WATCH STRIP ════ */}
      <section style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'20px 0' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', letterSpacing:'0.05em', color:'var(--foreground)' }}>AMMO MARKET</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#22c55e', background:'#14532d', padding:'1px 7px', borderRadius:2 }}>● LIVE</span>
            </div>
            <Link href="/market" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', textDecoration:'none' }}>Full Market Analysis →</Link>
          </div>

          {/* ── Scrolling price ticker — under header, above cards ── */}
          <div style={{ overflow:'hidden', height:28, marginBottom:14, background:'#09090b', border:'1px solid rgba(200,146,42,0.12)', borderRadius:3 }}>
            <div style={{ display:'flex', gap:0, animation:'tickerScroll 40s linear infinite', whiteSpace:'nowrap', willChange:'transform' }}>
              {[...ammo, ...ammo].map((a, i) => (
                <a key={i} href={a.url || '/market'} target={a.url?.startsWith('http') ? '_blank' : '_self'} rel="noreferrer" style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'0 18px',
                  borderRight:'1px solid #1e293b', display:'flex', alignItems:'center', gap:7,
                  height:28, textDecoration:'none', color:'inherit',
                }}>
                  <span style={{ color:'#64748b' }}>{a.caliber}</span>
                  <span style={{ color:'#C8922A', fontWeight:700 }}>
                    {(a.ppr < 1) ? `${(a.ppr*100).toFixed(1)}¢` : `$${a.ppr.toFixed(2)}`}/rd
                  </span>
                  <span style={{ color: a.dir === 'down' ? '#22c55e' : '#ef4444', fontSize:9 }}>
                    {a.dir === 'down' ? '▼' : '▲'} {Math.abs(a.trendPercent ?? a.trend ?? 0).toFixed(1)}%
                  </span>
                </a>
              ))}
            </div>
          </div>

          <div className="ammo-grid-6" style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8 }}>
            {ammo.slice(0,6).map(a => (
              <a key={a._id} href={a.url || '/market'} target={a.url?.startsWith('http') ? '_blank' : '_self'} rel="noreferrer"
                className="ammo-card"
                style={{
                  background:'var(--bg)', border:`1px solid var(--border)`,
                  borderBottom:`3px solid ${a.dir === 'down' ? '#22c55e' : '#ef4444'}`,
                  padding:'12px 14px', textDecoration:'none', display:'block',
                  transition:'all 0.2s', borderRadius:2,
                }}
              >
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--foreground)', marginBottom:4 }}>{a.caliber}</div>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:22, color:'#C8922A', letterSpacing:'0.03em', lineHeight:1 }}>
                  {a.ppr < 1 ? `${(a.ppr*100).toFixed(1)}¢` : `$${a.ppr.toFixed(2)}`}
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#334155', marginBottom:4 }}>per round</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: a.dir === 'down' ? '#22c55e' : '#ef4444', fontWeight:700 }}>
                  {a.dir === 'down' ? '▼' : '▲'} {Math.abs(a.trendPercent ?? a.trend ?? 0).toFixed(1)}%
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#475569', marginTop:4 }}>
                  Tap to shop ↗
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* ════ BREAKING ALERTS STRIP ════ */}
      {(alerts || []).length > 0 && (
        <section style={{ background:'rgba(239,68,68,0.06)', borderBottom:'1px solid rgba(239,68,68,0.2)', padding:'16px 0' }}>
          <div className="container">
            <div style={{ display:'flex', gap:12, alignItems:'flex-start', flexWrap:'wrap' }}>
              <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', color:'#ef4444', letterSpacing:'0.05em', flexShrink:0 }}>⚡ BREAKING</span>
              {(alerts || []).slice(0,3).map((a, i) => (
                <a key={i} href={a.url || '/news'} style={{
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:600,
                  color:'#fca5a5', textDecoration:'none', display:'flex', alignItems:'center', gap:6,
                }}>
                  <span style={{ color:'#ef4444' }}>●</span> {a.headline}
                  {i < Math.min((alerts||[]).length, 3) - 1 && <span style={{ color:'#334155', margin:'0 4px' }}>·</span>}
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ════ MORE STORIES — magazine grid with photos + live updates ════ */}
      <LiveNewsGrid articles={gridArticles} />

      {/* ════ LEGISLATION ════ */}
      {(legislation || []).length > 0 && (
        <section style={{ padding:'32px 0', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
          <div className="container">
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18 }}>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', letterSpacing:'0.04em', color:'var(--foreground)', margin:0 }}>⚖ RECENT LEGISLATION</h2>
              <Link href="/laws" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', textDecoration:'none' }}>All Laws →</Link>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px,1fr))', gap:10 }}>
              {(legislation||[]).slice(0,6).map((b, i) => {
                // Link to internal laws page — show detail there
                // External URL only as fallback if no internal route
                const href = b.slug?.current ? `/laws#${b.slug.current}` : '/laws'
                return (
                <Link key={b._id||i} href={href} style={{ textDecoration:'none', display:'block' }}>
                <div style={{ background:'var(--bg)', border:'1px solid var(--border)', padding:'14px 16px', borderLeft:`3px solid ${b.status==='passed'?'#22c55e':b.status==='advancing'?'#f59e0b':b.status==='pending'?'#3b82f6':'#334155'}`, cursor:'pointer', transition:'border-color .15s' }}
>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569' }}>{b.billNumber || b.level?.toUpperCase() || 'FEDERAL'}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, color: b.status==='passed'?'#22c55e':b.status==='advancing'?'#f59e0b':b.status==='pending'?'#60a5fa':'#475569', background: b.status==='passed'?'#14532d':b.status==='advancing'?'#713f12':b.status==='pending'?'#1e3a5f':'#1e293b', padding:'1px 6px', borderRadius:2, textTransform:'uppercase' }}>{b.status}</span>
                  </div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--foreground)', lineHeight:1.25 }}>{b.title}</div>
                  {b.summary && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569', marginTop:4, lineHeight:1.5 }}>{b.summary.slice(0,90)}…</div>}
                  <div style={{ marginTop:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#C8922A' }}>View on Laws page →</div>
                </div>
                </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ════ STATE HUB ════ */}
      <section style={{ padding:'40px 0', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
            <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', letterSpacing:'0.04em', color:'var(--foreground)', margin:0 }}>🗺 YOUR STATE · YOUR RIGHTS</h2>
            <Link href="/state-hub" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', textDecoration:'none' }}>All 50 States →</Link>
          </div>
          <StateHub profiles={profileMap} />
        </div>
      </section>

      {/* ════ NEWSLETTER ════ */}
      <section style={{ padding:'56px 0', background:'var(--bg)', borderBottom:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', fontFamily:"'Bebas Neue',cursive", fontSize:'20vw', color:'rgba(200,146,42,0.03)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', whiteSpace:'nowrap', pointerEvents:'none' }}>DOWNRANGE</div>
        <div className="container" style={{ position:'relative' }}>
          <div className="newsletter-split" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:60, alignItems:'center' }}>
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.5rem,5vw,3.8rem)', color:'var(--foreground)', lineHeight:0.95, letterSpacing:'0.02em', marginBottom:14 }}>
                Stay <span style={{ color:'#C8922A' }}>Armed</span><br />& Informed
              </h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#475569', lineHeight:1.7, marginBottom:24 }}>
                Join 400,000+ Americans getting the daily DownRange intelligence briefing — breaking news, new laws, gear releases, and ammo prices every morning.
              </p>
              <NewsletterSignup variant="compact" />
            </div>
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:18 }}>
                {[['412K','Subscribers'],['50','State Guides'],['Daily','Briefings']].map(([n,l]) => (
                  <div key={l} style={{ textAlign:'center', padding:'18px 10px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.2rem', color:'#C8922A', lineHeight:1 }}>{n}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#334155', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:3 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[['𝕏 Twitter','#'],['▶ YouTube','#'],['📡 Rumble','#'],['✈ Telegram','#']].map(([l,h]) => (
                  <a key={l} href={h} style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'#475569', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'7px 12px', textDecoration:'none' }}>{l}</a>
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

// ── HERO ROTATOR — client component inline ────────────────────────────────────
// Because this is a server component file, the rotator is a separate component
// We'll handle the rotation via CSS animation + a hidden data approach

function HeroRotator({ articles }) {
  const a = articles[0] // Server renders first article; client JS handles rotation
  if (!a) return (
    <div style={{ display:'flex', flexDirection:'column', justifyContent:'flex-end', padding:40, height:'100%', minHeight:560, background:'linear-gradient(135deg,#1a1f2e,#0d1117)' }}>
      <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:52, color:'#E5E5E5', letterSpacing:'0.02em', marginBottom:12 }}>
        America&apos;s Firearms Intelligence Hub
      </h1>
      <Link href="/news" style={{ background:'#C8922A', color:'#000', fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', letterSpacing:'0.08em', padding:'11px 22px', textDecoration:'none', display:'inline-block', width:'fit-content' }}>
        Latest News →
      </Link>
    </div>
  )

  const cc = CAT_COLOR[a.category] || '#C8922A'

  return (
    <>
      {/* CSS rotation script — inlines a tiny script to handle hero rotation */}
      <div
        id="hero-data"
        data-articles={JSON.stringify(articles.map(x => ({
          id: x._id,
          title: x.title,
          excerpt: x.excerpt || '',
          category: x.category || 'news',
          source: x.source || '',
          publishedAt: x.publishedAt || '',
          slug: x.slug?.current || x._id,
          imageUrl: x.heroImage?.asset?.url || x.imageUrl || '',
          urgencyScore: x.urgencyScore || 0,
        })))}
        style={{ display:'none' }}
      />

      {/* Static SSR version — JS enhances on client */}
      <div id="hero-main" style={{ position:'relative', height:'100%', minHeight:560 }}>
        {/* Background image */}
        <div id="hero-bg" style={{
          position:'absolute', inset:0,
          background: a.heroImage?.asset?.url || a.imageUrl
            ? `url(${a.heroImage?.asset?.url || a.imageUrl}) center/cover no-repeat`
            : 'linear-gradient(135deg,#1a1f2e 0%,#0d1117 40%,#1a120a 100%)',
          transition:'background-image 0.6s ease',
        }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(9,9,11,0.97) 0%, rgba(9,9,11,0.6) 50%, rgba(9,9,11,0.2) 100%)' }} />
        <div style={{ position:'absolute', inset:0, backgroundImage:'linear-gradient(rgba(200,146,42,0.03) 1px, transparent 1px),linear-gradient(90deg, rgba(200,146,42,0.03) 1px, transparent 1px)', backgroundSize:'40px 40px', opacity: (a.heroImage?.asset?.url || a.imageUrl) ? 0 : 1 }} />

        {/* Content */}
        <div id="hero-content" style={{ position:'absolute', bottom:0, left:0, right:0, padding:'40px 36px', animation:'heroFadeIn 0.5s ease' }}>
          <div style={{ display:'flex', gap:8, marginBottom:12, alignItems:'center' }}>
            <span id="hero-cat" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.18em', background:cc, color: a.category==='law'?'#fff':'#000', padding:'3px 12px' }}>
              {CAT_LABEL[a.category] || a.category?.toUpperCase()}
            </span>
            {a.urgencyScore >= 8 && (
              <span style={{ display:'flex', alignItems:'center', gap:5, background:'#B91C1C', color:'#fff', fontFamily:"'Barlow Condensed',sans-serif", fontSize:10, fontWeight:700, letterSpacing:'0.15em', padding:'3px 10px' }}>
                <span className="pulse-dot" style={{ background:'#fff' }} /> BREAKING
              </span>
            )}
          </div>
          <h2 id="hero-title" style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.2rem,4vw,3.4rem)', lineHeight:0.95, color:'#E5E5E5', letterSpacing:'0.02em', marginBottom:14, maxWidth:700 }}>
            {a.title}
          </h2>
          <p id="hero-excerpt" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#9CA3AF', maxWidth:580, marginBottom:20, lineHeight:1.65, display: a.excerpt ? 'block' : 'none' }}>
            {a.excerpt}
          </p>
          <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <span id="hero-meta" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6B7280', letterSpacing:'0.06em' }}>
              {a.source} · {timeAgo(a.publishedAt)}
            </span>
            <a id="hero-link" href={`/news/${a.slug?.current || a._id}`}
              style={{ background:'#C8922A', color:'#000', fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', letterSpacing:'0.08em', padding:'10px 22px', textDecoration:'none', display:'inline-block', transition:'opacity 0.15s' }}>
              Read Full Story →
            </a>
          </div>
        </div>

        {/* Progress bar + dot indicators */}
        <div id="hero-progress-bar" style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(255,255,255,0.05)' }}>
          <div id="hero-progress-fill" style={{ height:'100%', background:'#C8922A', width:'0%', transition:'none' }} />
        </div>
        <div id="hero-dots" style={{ position:'absolute', right:20, top:'50%', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:8 }}>
          {articles.map((_, i) => (
            <button key={i} data-index={i}
              style={{ width:6, height: i===0?20:6, background: i===0?'#C8922A':'rgba(255,255,255,0.2)', border:'none', cursor:'pointer', padding:0, borderRadius:3, transition:'all 0.3s' }}
              className="hero-dot"
            />
          ))}
        </div>
      </div>

      {/* Tiny rotation script */}
      <script dangerouslySetInnerHTML={{ __html: `
(function() {
  var el = document.getElementById('hero-data');
  if (!el) return;
  var arts;
  try { arts = JSON.parse(el.getAttribute('data-articles')); } catch(e) { return; }
  if (!arts || arts.length < 2) return;

  var idx = 0;
  var timer = null;
  var CAT_COLOR = { breaking:'#ef4444', law:'#3b82f6', industry:'#C8922A', news:'#9ca3af', opinion:'#a855f7', training:'#22c55e' };
  var CAT_LABEL = { breaking:'⚡ BREAKING', law:'⚖ LAW', industry:'◈ INDUSTRY', news:'📰 NEWS', opinion:'◇ OPINION', training:'▲ TRAINING' };

  function timeAgo(iso) {
    if (!iso) return '';
    var diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return diff + 'm ago';
    if (diff < 1440) return Math.floor(diff/60) + 'h ago';
    return Math.floor(diff/1440) + 'd ago';
  }

  function fmt(ppr) {
    return ppr < 1 ? (ppr*100).toFixed(1) + '¢' : '$' + ppr.toFixed(2);
  }

  function showSlide(i) {
    var a = arts[i];
    var cc = CAT_COLOR[a.category] || '#C8922A';

    var bg = document.getElementById('hero-bg');
    var title = document.getElementById('hero-title');
    var excerpt = document.getElementById('hero-excerpt');
    var meta = document.getElementById('hero-meta');
    var link = document.getElementById('hero-link');
    var cat = document.getElementById('hero-cat');
    var fill = document.getElementById('hero-progress-fill');
    var dots = document.querySelectorAll('.hero-dot');
    var listItems = document.querySelectorAll('.news-list-item');

    if (bg) bg.style.background = a.imageUrl
      ? 'url(' + a.imageUrl + ') center/cover no-repeat'
      : 'linear-gradient(135deg,#1a1f2e 0%,#0d1117 40%,#1a120a 100%)';
    if (title) title.textContent = a.title;
    if (excerpt) { excerpt.textContent = a.excerpt; excerpt.style.display = a.excerpt ? 'block' : 'none'; }
    if (meta) meta.textContent = (a.source || '') + ' · ' + timeAgo(a.publishedAt);
    if (link) link.href = '/news/' + a.slug;
    if (cat) { cat.textContent = CAT_LABEL[a.category] || (a.category||'').toUpperCase(); cat.style.background = cc; cat.style.color = a.category==='law'?'#fff':'#000'; }

    // Progress bar animation
    if (fill) {
      fill.style.transition = 'none';
      fill.style.width = '0%';
      requestAnimationFrame(function() {
        fill.style.transition = 'width 7s linear';
        fill.style.width = '100%';
      });
    }

    // Dots
    dots.forEach(function(d, di) {
      d.style.background = di===i ? '#C8922A' : 'rgba(255,255,255,0.2)';
      d.style.height = di===i ? '20px' : '6px';
    });

    // Highlight list item
    listItems.forEach(function(item, li) {
      var isActive = li === i;
      item.style.background = isActive ? 'rgba(200,146,42,0.06)' : 'transparent';
      item.style.borderLeftColor = isActive ? '#C8922A' : 'transparent';
      var t = item.querySelector('.nl-title');
      if (t) t.style.color = isActive ? '#C8922A' : '';
    });
  }

  function next() { idx = (idx + 1) % arts.length; showSlide(idx); }

  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(next, 7000);
  }

  // Dot click handlers
  document.querySelectorAll('.hero-dot').forEach(function(d, di) {
    d.addEventListener('click', function() {
      idx = di; showSlide(idx);
      startTimer();
    });
  });

  // List item click = jump to slide
  document.querySelectorAll('.news-list-item').forEach(function(item, li) {
    item.addEventListener('mouseenter', function() {
      if (li < arts.length) { idx = li; showSlide(idx); if(timer) clearInterval(timer); }
    });
    item.addEventListener('mouseleave', function() { startTimer(); });
  });

  startTimer();
  showSlide(0);
})();
      `}} />
    </>
  )
}
