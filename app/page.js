import { preload } from 'react-dom'
import Masthead from '../components/layout/Masthead'
import Footer from '../components/layout/Footer'
import SocialIcons from '../components/ui/SocialIcons'
import HomeStyles from '../components/home/HomeStyles'
import HomeHero from '../components/home/HomeHero'
import { NewsSection, DealsSection, PressSection, BlogSection } from '../components/home/HomeSections'
import NewsletterBar from '../components/home/NewsletterBar'
import Link from 'next/link'
import NewsletterSlideUp from '../components/layout/NewsletterSlideUp'
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
    .slice(0, 11)
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

// Latest 10 published blog articles that have a real hosted image
async function loadBlog() {
  const rows = await client.fetch(
    `*[_type=="blogPost" && (status=="published" || published==true) && defined(slug.current) && defined(imageUrl) && imageUrl match "*cdn.sanity.io*"] | order(coalesce(publishedAt,_createdAt) desc)[0..9]{
      _id, title, "slug": slug.current, category, imageUrl, publishedAt, _createdAt, readTime
    }`, {}, { next: { revalidate: 120 } })
  return (rows || []).map(b => ({
    _id: b._id, title: b.title, slug: b.slug, category: b.category ? String(b.category).replace(/-/g, ' ') : 'Blog',
    image: b.imageUrl, publishedAt: b.publishedAt || b._createdAt, readTime: b.readTime,
  })).filter(b => b.title)
}

const TOOLS = [
  { t:'Precision Calculator', h:'/ballistics' },
  { t:'Scope & Mil Tools',    h:'/tools/scope-tools' },
  { t:'Ammo Cost',            h:'/tools/ammo-cost' },
  { t:'NFA Wait Times',       h:'/nfa-tracker' },
  { t:'FFL Finder',           h:'/ffl-finder' },
  { t:'Range Finder',         h:'/ranges' },
]

export default async function HomePage() {
  preload('/img/home-hero.jpg', { as: 'image', fetchPriority: 'high' })
  const [news, deals, press, stats, blog] = await Promise.allSettled([loadNews(), loadDeals(), loadPress(), loadStats(), loadBlog()])
    .then(r => r.map((p, i) => (p.status === 'fulfilled' ? p.value : (i === 3 ? {} : []))))

  return (
    <>
      <Masthead />
      <HomeStyles />
      <HomeHero stats={stats} />

      <NewsSection items={news} />
      <DealsSection items={deals} />
      <PressSection items={press} />
      <BlogSection items={blog} />

      <section style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="hr-state">
            <span>Gun laws differ by state. Check yours before you buy or carry.</span>
            <Link href="/laws/my-state">CHECK MY STATE →</Link>
          </div>
        </div>
      </section>

      {/* Tools: one slim row, links to the Tools menu pages */}
      <section style={{ padding:'18px 0', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="home-tools">
            <Link href="/tools" className="home-tools-h">Shooter tools</Link>
            {TOOLS.map(t => (<Link key={t.t} href={t.h} className="tool-chip">{t.t}</Link>))}
          </div>
        </div>
      </section>

      {/* NEWSLETTER — slim inline bar */}
      <NewsletterBar />

      <Footer />
      <NewsletterSlideUp />

      <style>{`
        .home-tools{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
        .home-tools-h{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold);text-decoration:none;margin-right:6px}
        .tool-chip{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:14px;letter-spacing:.06em;color:var(--text);text-decoration:none;border:1px solid var(--border-mid);background:var(--bg);padding:7px 12px;min-height:36px;display:inline-flex;align-items:center;transition:border-color .15s}
        .tool-chip:hover{border-color:var(--gold)}
      `}</style>
    </>
  )
}
