import Masthead from '../components/layout/Masthead'
import Footer from '../components/layout/Footer'
import NewsletterSignup from '../components/sections/NewsletterSignup'
import StateBriefing from '../components/sections/StateBriefing'
import Link from 'next/link'
import { fetchArticles, fetchReleases, fetchAllStateProfiles, client } from '../sanity/lib/client'

export const revalidate = 120

export const metadata = {
  title: 'DownRange — Gun & Ammo Deals Checked Against Your State',
  description: 'The only 2A hub that checks every gun & ammo deal, release, and law against your state. Live deals, NFA wait times, ballistics tools, and state-filtered news. Free weekly briefing.',
  alternates: { canonical: 'https://www.downrangeco.com' },
}

// Suppressors illegal to own for civilians in these states
const BAN_SUPP = new Set(['CA', 'DE', 'HI', 'IL', 'MA', 'NJ', 'NY', 'RI'])

// Fallback if state profiles fail to load
const SEED_STATES = [
  { abbr:'CA', name:'California', grade:'F',  carry:false, mag:10,  awbFull:false, awbRestricted:true,  suppLegal:false, rf:true  },
  { abbr:'FL', name:'Florida',    grade:'B+', carry:true,  mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  rf:true  },
  { abbr:'NY', name:'New York',   grade:'F',  carry:false, mag:10,  awbFull:true,  awbRestricted:false, suppLegal:false, rf:true  },
  { abbr:'TX', name:'Texas',      grade:'A',  carry:true,  mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  rf:false },
]

// Infer the legality-relevant category from a deal title
function inferCat(title = '') {
  const t = title.toLowerCase()
  if (/magazine|pmag|\bmag\b|\bdrum\b/.test(t))                              return 'MAGAZINE'
  if (/suppressor|silencer|\bnfa\b|form ?4/.test(t))                         return 'SUPPRESSOR'
  if (/ar-?15|ak-?47|\brifle\b|carbine|\bsbr\b|upper|lower receiver/.test(t)) return 'RIFLE'
  if (/\bammo\b|9mm|5\.56|\.223|\.308|7\.62|\.45|rounds|\bgr\b fmj/.test(t))  return 'AMMO'
  if (/pistol|handgun|glock|sig ?p|revolver|1911/.test(t))                   return 'HANDGUN'
  return 'GENERAL'
}

function cleanDealTitle(t = '') {
  return t.replace(/^\[(handgun|rifle|shotgun|ammo|optic|nfa|accessories|gear|deals?|other)\]\s*/i, '').trim()
}

// gun.deals images are hotlink-blocked → route through our proxy
function proxyImg(url) {
  if (!url) return null
  try {
    const host = new URL(url).hostname.replace(/^www\./, '')
    if (host === 'gun.deals') return `/api/img-proxy?url=${encodeURIComponent(url)}`
  } catch { /* ignore */ }
  return url
}

async function fetchBriefingDeals() {
  try {
    const rows = await client.fetch(
      `*[_type=="gunDeal" && approved==true] | order(publishedAt desc)[0..15]{
        _id, title, price, imageUrl, externalUrl, source
      }`
    )
    return (rows || []).map(d => ({
      cat:      inferCat(d.title),
      brand:    d.source || 'gun.deals',
      name:     cleanDealTitle(d.title || ''),
      price:    d.price || null,
      url:      d.externalUrl || '/deals',
      imageUrl: proxyImg(d.imageUrl),
    })).filter(d => d.name)
  } catch (e) {
    return []
  }
}

const TOOLS = [
  { ic:'⏱️', t:'NFA Wait Times', d:'Live suppressor & SBR approval tracker', h:'/nfa-tracker' },
  { ic:'🎯', t:'Ballistics Calc', d:'Drop, drift & energy · 38 loads',       h:'/ballistics' },
  { ic:'🔫', t:'New Releases',    d:'Just-dropped firearms & gear',          h:'/releases' },
  { ic:'📍', t:'FFL Finder',      d:'Nearest transfer dealer near you',      h:'/ffl-finder' },
]

export default async function HomePage() {
  const [articles, releases, stateProfiles, briefingDeals] = await Promise.allSettled([
    fetchArticles(24), fetchReleases(6), fetchAllStateProfiles(), fetchBriefingDeals(),
  ]).then(r => r.map(p => (p.status === 'fulfilled' ? p.value : [])))

  const built = (stateProfiles || []).map(p => {
    const awb = (p.awbStatus || '').toLowerCase()
    return {
      abbr: p.abbr, name: p.name, grade: p.rating,
      carry: !!p.constitutionalCarry, mag: p.magLimit || null,
      awbFull: awb === 'full', awbRestricted: awb === 'banned',
      suppLegal: !BAN_SUPP.has(p.abbr), rf: !!p.redFlagLaw,
    }
  }).filter(s => s.abbr && s.name).sort((a, b) => a.name.localeCompare(b.name))
  const states = built.length >= 10 ? built : SEED_STATES

  const news = (articles || []).slice(0, 24).map(a => ({
    _id: a._id, title: a.title, source: a.source, category: a.category,
    slug: a.slug?.current || null, tags: a.tags || [], publishedAt: a.publishedAt || null,
  }))

  return (
    <>
      {/* AvantLink affiliate ownership verification — delete after approval */}
      <div style={{ display:'none' }} dangerouslySetInnerHTML={{ __html:'<script src="https://classic.avantlink.com/affiliate_app_confirm.php?mode=js&application_id=1619841"></script>' }} />
      <Masthead />

      {/* THE PAGE: one state-aware briefing */}
      <StateBriefing states={states} deals={briefingDeals} articles={news} heroImage="/img/photos/military.jpg" />

      {/* SECONDARY — quiet tools row */}
      <section style={{ padding:'28px 0', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
        <div className="container">
          <div className="home-tools" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
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
