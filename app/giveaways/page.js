import { createClient } from '@sanity/client'
import Link from 'next/link'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'

export const metadata = {
  title: 'Gun Giveaways 2026 — Free Firearm Giveaways | DownRange',
  description: 'Active gun giveaways from top manufacturers, retailers, and 2A organizations. Win free firearms, ammo, and gear. Updated daily.',
  alternates: { canonical: 'https://downrangeco.com/giveaways' },
  openGraph: {
    title: 'Gun Giveaways 2026 — Win Free Firearms | DownRange',
    description: 'Active gun giveaways from top manufacturers, retailers, and 2A organizations. Updated daily.',
    url: 'https://downrangeco.com/giveaways',
  },
}

export const revalidate = 3600

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    true,
})

const CAT_COLOR = {
  pistol:      '#60A5FA', rifle:    '#34D399', shotgun:  '#FBBF24',
  ammo:        '#C8922A', gear:     '#9CA3AF', accessories:'#C084FC',
  nfa:         '#EF4444', optics:   '#34D399',
}

const TYPE_LABEL = {
  manufacturer: '🏭 Manufacturer', retailer: '🛒 Retailer',
  youtuber: '▶ Creator',           organization: '🏛 Organization',
}

const SEED_GIVEAWAYS = [
  { _id:'g1', title:'Win a Glock 19 Gen5 — Monthly Giveaway', sponsor:'Gun Owners of America', prize:'Glock 19 Gen5 9mm Pistol', entryUrl:'https://gunowners.org', category:'pistol', sourceType:'organization', endDate:null, featured:true },
  { _id:'g2', title:'PSA PA-15 Rifle Giveaway', sponsor:'Palmetto State Armory', prize:'PSA PA-15 5.56 NATO Complete Rifle', entryUrl:'https://palmettostatearmory.com', category:'rifle', sourceType:'retailer', endDate:null, featured:false },
  { _id:'g3', title:'SIG Sauer P365 Sweepstakes', sponsor:'SIG Sauer', prize:'SIG Sauer P365 with XRay3 Night Sights', entryUrl:'https://sigsauer.com', category:'pistol', sourceType:'manufacturer', endDate:null, featured:true },
  { _id:'g4', title:'Springfield Armory Hellcat Pro Giveaway', sponsor:'Springfield Armory', prize:'Hellcat Pro OSP 9mm', entryUrl:'https://springfield-armory.com', category:'pistol', sourceType:'manufacturer', endDate:null, featured:false },
  { _id:'g5', title:'1000 Rounds 9mm Ammo Giveaway', sponsor:'Federal Premium', prize:'1000 Rounds Federal American Eagle 9mm', entryUrl:'https://federalpremium.com', category:'ammo', sourceType:'manufacturer', endDate:null, featured:false },
  { _id:'g6', title:'Vortex Strike Eagle Optic Giveaway', sponsor:'Vortex Optics', prize:'Strike Eagle 1-8x24 LPVO', entryUrl:'https://vortexoptics.com', category:'optics', sourceType:'manufacturer', endDate:null, featured:false },
]

function daysLeft(endDate) {
  if (!endDate) return null
  const diff = new Date(endDate) - Date.now()
  if (diff < 0) return 'Ended'
  const days = Math.ceil(diff / 86400000)
  return days === 1 ? '1 day left' : `${days} days left`
}

function GiveawayCard({ g, featured }) {
  const catColor = CAT_COLOR[g.category] || '#9CA3AF'
  const timeLeft = daysLeft(g.endDate)
  const isExpiringSoon = g.endDate && daysLeft(g.endDate) !== 'Ended' &&
    (new Date(g.endDate) - Date.now()) < 3 * 86400000

  return (
    <a href={g.entryUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration:'none', display:'block' }}>
      <div style={{ background:'#111318', border:`1px solid ${featured ? 'var(--gold)' : 'var(--border)'}`,
        transition:'border-color .15s', cursor:'pointer', height:'100%', display:'flex', flexDirection:'column' }}>

        {/* Category bar */}
        <div style={{ height:3, background:catColor }} />

        {/* Thumbnail placeholder */}
        <div style={{ background:'rgba(200,146,42,.05)', borderBottom:'1px solid var(--border)', padding:'24px', display:'flex', alignItems:'center', justifyContent:'center', minHeight:100 }}>
          {g.imageUrl
            ? <img src={g.imageUrl} alt={g.title} style={{ maxHeight:80, maxWidth:'100%', objectFit:'contain' }} />
            : <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.5rem', color: catColor + '44', letterSpacing:'.08em' }}>
                {g.category?.toUpperCase() || 'GIVEAWAY'}
              </div>
          }
        </div>

        <div style={{ padding:'14px 16px', flex:1, display:'flex', flexDirection:'column', gap:8 }}>
          {/* Badges */}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
            {featured && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:'.1em',
                background:'rgba(200,146,42,.15)', color:'var(--gold)', border:'1px solid rgba(200,146,42,.4)', padding:'2px 6px' }}>★ FEATURED</span>
            )}
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase',
              background: catColor + '22', color: catColor, padding:'2px 6px' }}>{g.category}</span>
            {isExpiringSoon && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:'.08em',
                background:'rgba(239,68,68,.15)', color:'#ef4444', border:'1px solid rgba(239,68,68,.4)', padding:'2px 6px' }}>⚡ ENDING SOON</span>
            )}
          </div>

          {/* Title */}
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700, color:'var(--text)', lineHeight:1.25 }}>
            {g.title}
          </div>

          {/* Prize */}
          {g.prize && g.prize !== g.title && (
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--gold)', lineHeight:1.4 }}>
              🏆 {g.prize}
            </div>
          )}

          {/* Sponsor + type */}
          <div style={{ marginTop:'auto', display:'flex', alignItems:'center', justifyContent:'space-between', paddingTop:8, borderTop:'1px solid var(--border)' }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--text-dim)' }}>{g.sponsor}</span>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              {timeLeft && (
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color: timeLeft === 'Ended' ? '#ef4444' : isExpiringSoon ? '#ef4444' : '#6b7280' }}>
                  {timeLeft}
                </span>
              )}
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#374151' }}>
                {TYPE_LABEL[g.sourceType] || ''}
              </span>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ margin:'0 16px 16px', background:'var(--gold)', color:'#000', fontFamily:"'Barlow Condensed',sans-serif",
          fontSize:13, fontWeight:700, letterSpacing:'.08em', padding:'10px', textAlign:'center' }}>
          ENTER GIVEAWAY →
        </div>
      </div>
    </a>
  )
}


export default async function GiveawaysPage({ searchParams }) {
  const cat = searchParams?.cat || null

  let giveaways = []
  try {
    const filter = cat ? `&& category == "${cat}"` : ''
    giveaways = await sanity.fetch(
      `*[_type == "giveaway" && active == true ${filter}] | order(featured desc, addedAt desc) [0...200] {
        _id, title, sponsor, prize, entryUrl, imageUrl, category, sourceType, endDate, featured, addedAt
      }`
    )
  } catch {}

  if (!giveaways.length) giveaways = SEED_GIVEAWAYS.filter(g => !cat || g.category === cat)

  const featured  = giveaways.filter(g => g.featured)
  const regular   = giveaways.filter(g => !g.featured)
  const total     = giveaways.length

  const CATS = [
    { val:null,         label:'All Giveaways' },
    { val:'pistol',     label:'🔫 Pistols'    },
    { val:'rifle',      label:'◈ Rifles'      },
    { val:'shotgun',    label:'◉ Shotguns'    },
    { val:'ammo',       label:'◎ Ammo'        },
    { val:'optics',     label:'◎ Optics'      },
    { val:'nfa',        label:'◈ NFA / Suppressors' },
    { val:'gear',       label:'◈ Gear'        },
    { val:'accessories',label:'◈ Accessories' },
  ]

  return (
    <>
      <Masthead />

      {/* HERO */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.08) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'16vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>WIN</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>GIVEAWAYS</span>
              <span style={{ background:'rgba(34,197,94,.15)', color:'#22c55e', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, padding:'3px 10px', border:'1px solid rgba(34,197,94,.3)' }}>UPDATED DAILY</span>
              <span style={{ background:'var(--border)', color:'#9CA3AF', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, padding:'3px 10px' }}>{total} ACTIVE</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.4rem,5vw,3.8rem)', color:'var(--text)', letterSpacing:'0.04em', lineHeight:1, marginBottom:12 }}>
              GUN GIVEAWAYS<br/>
              <span style={{ color:'var(--gold)' }}>WIN FREE FIREARMS & GEAR</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'var(--text-dim)', lineHeight:1.7, maxWidth:520 }}>
              Active giveaways from manufacturers, retailers, and 2A creators. All entries link directly to the official sponsor. Updated every 24 hours.
            </p>
            <div style={{ marginTop:20, padding:'12px 16px', background:'rgba(200,146,42,.07)', border:'1px solid rgba(200,146,42,.25)', display:'inline-block' }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'var(--gold)' }}>
                🏆 Want to list your giveaway?{' '}
                <Link href="/press" style={{ color:'var(--gold)', textDecoration:'underline' }}>Contact us →</Link>
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* FILTERS */}
      <div style={{ borderBottom:'1px solid var(--border)', background:'var(--bg2)', position:'sticky', top:60, zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:4, overflowX:'auto', padding:'10px 0', scrollbarWidth:'none' }}>
            {CATS.map(c => (
              <Link key={String(c.val)} href={c.val ? `/giveaways?cat=${c.val}` : '/giveaways'}
                style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700,
                  letterSpacing:'.06em', padding:'6px 14px', whiteSpace:'nowrap', textDecoration:'none',
                  background: (!cat && !c.val) || cat === c.val ? 'var(--gold)' : 'transparent',
                  color:      (!cat && !c.val) || cat === c.val ? '#000'       : 'var(--text-dim)',
                  border:     (!cat && !c.val) || cat === c.val ? 'none'       : '1px solid var(--border)',
                  transition: 'all .15s' }}>
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'40px 0 80px', background:'var(--bg)' }}>
        <div className="container">

          {/* FEATURED */}
          {featured.length > 0 && (
            <div style={{ marginBottom:40 }}>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--gold)', letterSpacing:'.05em' }}>★ FEATURED GIVEAWAYS</div>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:12 }}>
                {featured.map(g => <GiveawayCard key={g._id} g={g} featured />)}
              </div>
            </div>
          )}

          {/* ALL */}
          {regular.length > 0 && (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16 }}>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--text)', letterSpacing:'.05em' }}>
                  {cat ? cat.toUpperCase() + ' GIVEAWAYS' : 'ALL GIVEAWAYS'}
                </div>
                <div style={{ flex:1, height:1, background:'var(--border)' }} />
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563' }}>{regular.length} giveaways</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
                {regular.map(g => <GiveawayCard key={g._id} g={g} />)}
              </div>
            </div>
          )}

          {giveaways.length === 0 && (
            <div style={{ textAlign:'center', padding:'80px 0', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#4b5563' }}>
              No active giveaways in this category right now. Check back tomorrow.
            </div>
          )}

          {/* SUBMIT */}
          <div style={{ marginTop:60, padding:'32px', background:'var(--bg2)', border:'1px solid var(--border)', borderTop:'3px solid var(--gold)' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center' }}>
              <div>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:6 }}>Run a Giveaway? List it on DownRange.</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text-dim)', lineHeight:1.6 }}>
                  If you're a manufacturer, retailer, or creator running a firearms giveaway, we'll list it here for free. 
                  Exposure to serious gun owners — no cost, no catch.
                </p>
              </div>
              <Link href="/press" style={{ background:'var(--gold)', color:'#000', fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, letterSpacing:'.08em', padding:'12px 24px', textDecoration:'none', whiteSpace:'nowrap', flexShrink:0 }}>
                SUBMIT GIVEAWAY →
              </Link>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
