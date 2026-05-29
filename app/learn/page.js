import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'Firearms Learning Center — DownRange',
  description: 'Guides on buying your first gun, getting a carry permit, safe storage, and understanding gun laws. Written for new gun owners, not gun writers.',
}

const ARTICLES = [
  { slug:'buying-your-first-gun',       title:"Buying Your First Gun: The Complete Beginner's Guide",     subtitle:'Everything you need to know before walking into a gun store.',                       category:'Getting Started', readTime:'12 min', date:'May 15', img:'/img/photos/pistol.jpg', featured:true },
  { slug:'how-to-get-ccw-license',      title:'How to Get Your CCW License (State-by-State Guide)',        subtitle:'Concealed carry permits explained: requirements, costs, and training.',              category:'CCW & Carry',     readTime:'15 min', date:'May 18', img:'/img/photos/pistol.jpg', featured:true },
  { slug:'firearms-safety-four-rules',  title:'The Four Rules of Firearms Safety (And Why They Save Lives)', subtitle:'These rules are not suggestions. Every accident violates at least one.',           category:'Safety',          readTime:'8 min',  date:'May 20', img:'/img/photos/rifle.jpg', featured:true },
  { slug:'home-defense-basics',         title:'Home Defense Basics: What You Actually Need',               subtitle:'The right firearm, a workable plan, the right storage.',                          category:'Home Defense',    readTime:'11 min', date:'Jun 2',  img:'/img/photos/pistol.jpg' },
  { slug:'safe-storage-guide-beginners',title:'Safe Storage 101: Keeping Your Guns Secure and Accessible', subtitle:'Prevent theft and accidents without sacrificing defensive access.',                 category:'Safe Storage',    readTime:'9 min',  date:'Jun 5',  img:'/img/photos/pistol.jpg' },
  { slug:'ammo-guide-beginners',        title:'Ammunition Explained: What to Buy and Why',                 subtitle:'Calibers, grain weights, hollow points vs FMJ — simplified.',                     category:'Ammunition',      readTime:'10 min', date:'Jun 9',  img:'/img/photos/pistol.jpg' },
  { slug:'shooting-range-first-visit',  title:'Your First Time at a Shooting Range: What to Expect',       subtitle:'Rules, etiquette, and how to make the most of your first session.',                category:'Getting Started',  readTime:'7 min',  date:'Jun 12', img:'/img/photos/rifle.jpg' },
  { slug:'cleaning-maintaining-your-gun',title:'How to Clean and Maintain Your Firearm',                   subtitle:'Field strip, clean, and lubricate your pistol in 20 minutes.',                   category:'Maintenance',     readTime:'10 min', date:'Jun 16', img:'/img/photos/pistol.jpg' },
  { slug:'understanding-gun-laws',      title:'Understanding Gun Laws: A Beginner\'s Legal Overview',       subtitle:'Federal law, state law, and how they interact — what you need to know.',          category:'Legal',           readTime:'13 min', date:'Jun 19', img:'/img/photos/law.jpg' },
  { slug:'choosing-holster-beginners',  title:'How to Choose a Holster for Concealed Carry',               subtitle:'IWB, OWB, appendix — how to choose the right carry method.',                     category:'CCW & Carry',     readTime:'11 min', date:'Jun 23', img:'/img/photos/pistol.jpg' },
  { slug:'dry-fire-training-beginners', title:'Dry Fire Training: Get Better Without Spending on Ammo',    subtitle:'Professional shooters spend more time dry firing than live firing.',               category:'Training',        readTime:'9 min',  date:'Jun 27', img:'/img/photos/rifle.jpg' },
  { slug:'what-is-nfa',                 title:'What Is the NFA? Suppressors, SBRs, and More Explained',    subtitle:'After the 2026 tax stamp elimination, NFA item interest exploded. Here\'s the guide.', category:'Legal',       readTime:'12 min', date:'Jul 1',  img:'/img/photos/rifle.jpg' },
]

const CAT_COLORS = {
  'Getting Started':'#C8922A', 'CCW & Carry':'#3B82F6', 'Safety':'#22C55E',
  'Home Defense':'#EF4444', 'Safe Storage':'#F97316', 'Ammunition':'#FBBF24',
  'Maintenance':'#8B5CF6', 'Legal':'#60A5FA', 'Training':'#34D399',
}
const CATEGORIES = [...new Set(ARTICLES.map(a => a.category))]

export default function LearnPage({ searchParams }) {
  const cat = searchParams?.cat || null
  const filtered = cat ? ARTICLES.filter(a => a.category === cat) : ARTICLES
  const featured = ARTICLES.filter(a => a.featured)
  const grid = cat ? filtered : ARTICLES.filter(a => !a.featured)

  return (
    <>
      <BreakingTicker alerts={alerts || []} />
      M />

      {/* ── HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 25% 60%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>LEARN</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>LEARNING CENTER</span>
              <span className="dr-badge dr-badge-green" style={{ padding:'3px 10px' }}>{ARTICLES.length} ARTICLES</span>
              <span className="dr-badge dr-badge-dim" style={{ padding:'3px 10px' }}>BEGINNER FRIENDLY</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'14px' }}>
              Everything a New Gun Owner<br />
              <span style={{ color:'var(--gold)' }}>Needs to Know</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'17px', color:'var(--text-muted)', lineHeight:1.7, marginBottom:'24px', maxWidth:560 }}>
              You searched for something, ended up here, and want a straight answer. That's what this section is. No preamble, no disclaimers beyond what's legally required, no talking down to you.
            </p>
            <div style={{ display:'flex', alignItems:'center', gap:'14px', padding:'14px 18px', background:'var(--bg3)', border:'1px solid var(--border)', borderLeft:'3px solid var(--gold)', width:'fit-content' }}>
              <div style={{ width:36, height:36, background:'linear-gradient(135deg,var(--gold),#8A6320)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'16px' }}>🎯</div>
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:700, color:'var(--text)' }}>Written by DJ Cavalcanti</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)' }}>Founder, DownRange · Washington State</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── CATEGORY FILTER ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', paddingRight:'8px' }}>
            <a href="/learn" style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${!cat?'var(--gold)':'transparent'}`, color:!cat?'var(--gold)':'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
              All ({ARTICLES.length})
            </a>
            {CATEGORIES.map(c => (
              <a key={c} href={`/learn?cat=${encodeURIComponent(c)}`}
                style={{ display:'inline-flex', alignItems:'center', gap:'6px', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${cat===c?CAT_COLORS[c]||'var(--gold)':'transparent'}`, color:cat===c?(CAT_COLORS[c]||'var(--gold)'):'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:CAT_COLORS[c]||'var(--text-dim)', flexShrink:0 }} />
                {c}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          {/* ── FEATURED 3 (only on all-articles view) ── */}
          {!cat && (
            <div style={{ marginBottom:'48px' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:'12px', marginBottom:'20px' }}>
                <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>Start Here</h2>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>THE ESSENTIALS</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:'3px' }}>
                {/* Large featured left */}
                <Link href={`/learn/${featured[0].slug}`} style={{ textDecoration:'none', display:'block', position:'relative', overflow:'hidden' }}>
                  <div style={{ height:'440px', position:'relative', overflow:'hidden' }}>
                    <img src={featured[0].img} alt={featured[0].title}
                         className='learn-card-img' style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.95) 0%, rgba(9,9,11,0.3) 60%, transparent 100%)' }} />
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'24px' }}>
                      <span style={{ background:CAT_COLORS[featured[0].category]||'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', padding:'2px 10px', display:'inline-block', marginBottom:'10px' }}>{featured[0].category.toUpperCase()}</span>
                      <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'#F0EDE6', letterSpacing:'0.02em', lineHeight:1.1, marginBottom:'8px' }}>{featured[0].title}</h3>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'rgba(240,237,230,0.65)', lineHeight:1.5 }}>{featured[0].subtitle}</p>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'12px' }}>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.45)' }}>{featured[0].readTime} read</span>
                        <span style={{ color:'var(--gold)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em' }}>READ →</span>
                      </div>
                    </div>
                  </div>
                </Link>
                {/* Two stacked on right */}
                <div style={{ display:'flex', flexDirection:'column', gap:'3px', gridColumn:'2 / span 2' }}>
                  {featured.slice(1,3).map(a => (
                    <Link key={a.slug} href={`/learn/${a.slug}`} style={{ textDecoration:'none', display:'block', flex:1, position:'relative', overflow:'hidden' }}>
                      <div style={{ height:'218px', position:'relative', overflow:'hidden' }}>
                        <img src={a.img} alt={a.title}
                             className='learn-card-img' style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }} />
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.2) 60%, transparent 100%)' }} />
                        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px 18px' }}>
                          <span style={{ background:CAT_COLORS[a.category]||'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'9px', fontWeight:700, letterSpacing:'0.15em', padding:'2px 8px', display:'inline-block', marginBottom:'7px' }}>{a.category.toUpperCase()}</span>
                          <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'#F0EDE6', letterSpacing:'0.02em', lineHeight:1.15, marginBottom:'4px' }}>{a.title}</h3>
                          <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.45)' }}>{a.readTime} read</span>
                            <span style={{ color:'var(--gold)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.1em' }}>READ →</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── ARTICLE GRID ── */}
          <div>
            <div style={{ display:'flex', alignItems:'baseline', gap:'12px', marginBottom:'20px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>
                {cat || 'All Articles'}
              </h2>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>{filtered.length} GUIDES</span>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(300px, 1fr))', gap:'2px' }}>
              {(cat ? filtered : grid).map(a => (
                <Link key={a.slug} href={`/learn/${a.slug}`} style={{ textDecoration:'none', display:'block', position:'relative', overflow:'hidden' }}>
                  <div style={{ height:'260px', position:'relative', overflow:'hidden' }}>
                    <img src={a.img} alt={a.title}
                         className='learn-card-img' style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }} />
                    <div className='learn-card-overlay' style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.3) 60%, transparent 100%)', transition:'background 0.3s' }} />
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'6px' }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:CAT_COLORS[a.category]||'var(--gold)', flexShrink:0 }} />
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.55)', letterSpacing:'0.1em' }}>{a.category.toUpperCase()} · {a.readTime}</span>
                      </div>
                      <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'16px', fontWeight:700, color:'#F0EDE6', lineHeight:1.25, marginBottom:'4px' }}>{a.title}</h3>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'rgba(240,237,230,0.5)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.subtitle}</p>
                    </div>
                    {/* Date badge */}
                    <div style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(9,9,11,0.7)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.5)', padding:'3px 8px', border:'1px solid rgba(255,255,255,0.08)' }}>{a.date}</div>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* ── BOTTOM CTA ── */}
          <div style={{ marginTop:'48px', padding:'32px', background:'var(--bg2)', border:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr auto', gap:'24px', alignItems:'center' }}>
            <div>
              <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--text)', letterSpacing:'0.04em', marginBottom:'6px' }}>More guides are on the way</h3>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.6 }}>
                New beginner articles publish weekly. Topics include: red dot vs. iron sights, 9mm vs. 45 ACP, CCW in constitutional carry states, and more.
              </p>
            </div>
            <Link href="/contribute" className="dr-btn-primary" style={{ whiteSpace:'nowrap', flexShrink:0 }}>
              Suggest a Topic →
            </Link>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
