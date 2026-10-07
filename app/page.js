import { preload } from 'react-dom'
import Masthead from '../components/layout/Masthead'
import Footer from '../components/layout/Footer'
import NewsletterSignup from '../components/sections/NewsletterSignup'
import HomeStyles from '../components/home/HomeStyles'
import HomeHero from '../components/home/HomeHero'
import { NewsSection, DealsSection, PressSection } from '../components/home/HomeSections'
import Link from 'next/link'
import { fetchArticles, client } from '../sanity/lib/client'
import { getPressPage } from '../lib/pressData'

export const revalidate = 120

export const metadata = {
  title: 'DownRange — Gun & Ammo Deals, News and Press Releases',
  description: 'Latest firearms news, the newest gun and ammo deals, and manufacturer press releases, checked against your state. Free weekly briefing.',
  alternates: { canonical: 'https://www.downrangeco.com' },
}

// gun.deals images are hotlink-blocked, so route them through our proxy
function proxyImg(url) {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host === 'gun.deals') return '/api/img-proxy?url=' + encodeURIComponent(url)
  } catch { /* ignore */ }
  return url
}

const cleanDealTitle = (t = '') => t.replace(/^\[(handgun|rifle|shotgun|ammo|optic|nfa|accessories|gear|deals?|other)\]\s*/i, '').trim()

// Rule: every card has a real image. Items without one are skipped, never given a placeholder.
async function loadNews() {
  const rows = await fetchArticles(40)
  return (rows || [])
    .filter(a => a.slug?.current)
    .filter(a => !((a.source || '').toLowerCase().includes('ammoland') || a.category === 'deals'))
    .map(a => ({
      _id: a._id, title: a.title, slug: a.slug.current, category: a.category, source: a.source,
      summary: a.summary || a.excerpt || '', publishedAt: a.publishedAt,
      image: a.heroImage?.asset?.url || (a.imageUrl && a.imageUrl.includes('cdn.sanity.io') ? a.imageUrl : null),
    }))
    .filter(a => a.image)
    .slice(0, 8)
}

// Latest 10 deals, newest first
async function loadDeals() {
  const rows = await client.fetch(
    `*[_type=="gunDeal" && approved==true && defined(imageUrl) && imageUrl match "*cdn.sanity.io*" && defined(externalUrl)] | order(publishedAt desc)[0..9]{
      _id, title, price, imageUrl, externalUrl, source, store, summary, publishedAt
    }`, {}, { next: { revalidate: 120 } })
  return (rows || []).map(d => ({
    _id: d._id, title: cleanDealTitle(d.title), price: d.price || null, image: proxyImg(d.imageUrl),
    url: d.externalUrl, source: d.source, store: d.store, summary: d.summary || '', publishedAt: d.publishedAt,
  })).filter(d => d.title)
}

// Live counts for the hero. Any failure just hides that chip.
async function loadStats() {
  const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString()
  try {
    const r = await client.fetch(
      `{"newsToday": count(*[_type=="newsArticle" && approved==true && defined(slug.current) && category!="deals" && publishedAt>=$since]),
        "dealsToday": count(*[_type=="gunDeal" && approved==true && publishedAt>=$since]),
        "press": count(*[_type=="pressRelease" && approved==true && defined(slug.current) && (defined(heroImage.asset) || imageUrl match "https://cdn.sanity.io/*")])}`,
      { since }, { next: { revalidate: 300 } })
    return { newsToday: r.newsToday || null, dealsToday: r.dealsToday || null, press: r.press || null }
  } catch { return {} }
}

async function loadPress() {
  const { items } = await getPressPage({ page: 1 })
  return (items || []).filter(p => p.image).slice(0, 8)
}

const TOOLS = [
  { ic:'⏱️', t:'NFA Wait Times', d:'Live suppressor & SBR approval tracker', h:'/nfa-tracker' },
  { ic:'🎯', t:'Ballistics Calc', d:'Drop, drift & energy · 38 loads',       h:'/ballistics' },
  { ic:'🔫', t:'New Releases',    d:'Just-dropped firearms & gear',          h:'/releases' },
  { ic:'📍', t:'FFL Finder',      d:'Nearest transfer dealer near you',      h:'/ffl-finder' },
  { ic:'🎁', t:'Giveaways',       d:'Live gun & gear giveaways to enter',    h:'/giveaways' },
]

export default async function HomePage() {
  preload('/img/home-hero.jpg', { as: 'image', fetchPriority: 'high' })
  const [news, deals, press, stats] = await Promise.allSettled([loadNews(), loadDeals(), loadPress(), loadStats()])
    .then(r => r.map((p, i) => (p.status === 'fulfilled' ? p.value : (i === 3 ? {} : []))))

  return (
    <>
      <Masthead />
      <HomeStyles />
      <HomeHero stats={stats} />

      <NewsSection items={news} />
      <DealsSection items={deals} />
      <PressSection items={press} />

      <section style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="hr-state">
            <span>Gun laws differ by state. Check yours before you buy or carry.</span>
            <Link href="/laws/my-state">CHECK MY STATE →</Link>
          </div>
        </div>
      </section>

      {/* SECONDARY — quiet tools row */}
      <section style={{ padding:'28px 0', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="home-tools" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(180px,1fr))', gap:12 }}>
            {TOOLS.map(t => (
              <Link key={t.t} href={t.h} className="tool-sq" style={{ background:'var(--bg)', border:'1px solid var(--border)', padding:'18px 16px', textDecoration:'none', display:'block' }}>
                <div style={{ fontSize:19, marginBottom:8 }}>{t.ic}</div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:16, letterSpacing:'0.03em', color:'#F0EDE6', marginBottom:3 }}>{t.t}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9.5, color:'#6B7280', lineHeight:1.5 }}>{t.d}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER — honest */}
      <section style={{ padding:'52px 0', background:'var(--bg)', borderBottom:'1px solid var(--border)', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', fontFamily:"'Bebas Neue',cursive", fontSize:'20vw', color:'rgba(200,146,42,0.03)', top:'50%', left:'50%', transform:'translate(-50%,-50%)', whiteSpace:'nowrap', pointerEvents:'none' }}>DOWNRANGE</div>
        <div className="container" style={{ position:'relative' }}>
          <div className="newsletter-split" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:56, alignItems:'center' }}>
            <div>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.4rem,5vw,3.6rem)', color:'var(--foreground)', lineHeight:0.95, letterSpacing:'0.02em', marginBottom:14 }}>
                Your state, <span style={{ color:'#C8922A' }}>in your inbox</span>
              </h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#9CA3AF', lineHeight:1.7, marginBottom:22 }}>
                One weekly briefing: the best deals you can actually buy where you live, new releases, and the law changes that hit your state. Free, no spam.
              </p>
              <NewsletterSignup variant="compact" />
            </div>
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10, marginBottom:16 }}>
                {[['50','State Guides'],['Weekly','Deal Drop'],['Free','No Spam']].map(([n, l]) => (
                  <div key={l} style={{ textAlign:'center', padding:'18px 10px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.1rem', color:'#C8922A', lineHeight:1 }}>{n}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#6B7280', letterSpacing:'0.1em', textTransform:'uppercase', marginTop:3 }}>{l}</div>
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                {[['𝕏 Twitter','#'],['▶ YouTube','#'],['📡 Rumble','#'],['✈ Telegram','#']].map(([l, h]) => (
                  <a key={l} href={h} style={{ background:'var(--bg2)', border:'1px solid var(--border)', color:'#6B7280', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'7px 12px', textDecoration:'none' }}>{l}</a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />

      <style>{`
        .tool-sq { transition: border-color .15s, transform .15s; }
        .tool-sq:hover { border-color:#C8922A !important; transform:translateY(-2px); }
        @media(max-width:760px){ .home-tools{ grid-template-columns:repeat(2,1fr) !important; } .newsletter-split{ grid-template-columns:1fr !important; } }
      `}</style>
    </>
  )
}
