import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = {
  title: 'Outdoors — DownRange',
  description: 'Hunting season dates, cartridge guides, rifle selection, field skills, precision shooting, training, and preparedness for outdoors Americans.',
}

// ── DATA ─────────────────────────────────────────────────────────────────────

const HUNTING_GUIDES = [
  { slug:'whitetail-hunting-guide',     title:'Whitetail Deer Hunting: The Complete System', subtitle:'Scouting, stand placement, scent control, shot placement. Every variable that closes the gap between hunter and deer.', category:'Hunting', readTime:'18 min', img:'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80', featured:true, date:'Sep 2026' },
  { slug:'elk-hunting-guide',           title:'Elk Hunting: Public Land Strategy',           subtitle:'DIY elk without an outfitter. Unit selection, OTC tags, calling during the rut, physical preparation, and meat care.', category:'Hunting', readTime:'22 min', img:'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&q=80', featured:true, date:'Aug 2026' },
  { slug:'turkey-hunting-basics',       title:'Turkey Hunting from Scratch',                 subtitle:'Pre-season scouting, decoy setups, call selection, and the timing edge that fills your tag every spring.', category:'Hunting', readTime:'14 min', img:'https://images.unsplash.com/photo-1448375240586-882707db888b?w=800&q=80', featured:true, date:'Mar 2026' },
  { slug:'cartridge-selection-guide',   title:'Choosing the Right Hunting Cartridge',       subtitle:'From .243 Win for deer to .300 Win Mag for elk — match the cartridge to the animal, the range, and your recoil tolerance.', category:'Ammunition', readTime:'16 min', img:'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=80', date:'Jul 2026' },
  { slug:'field-dressing-deer',         title:'Field Dressing Your Deer: Step-by-Step',     subtitle:'From shot to cooler in under an hour. Proper technique prevents contamination and preserves meat quality.', category:'Skills', readTime:'10 min', img:'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800&q=80', date:'Oct 2026' },
  { slug:'hunting-rifle-selection',     title:'Best Hunting Rifles for Every Budget',        subtitle:'From the $549 Savage 110 to the $1,999 Tikka T3x — the right bolt gun for your game and your budget.', category:'Gear', readTime:'13 min', img:'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80', date:'Aug 2026' },
]

const PRECISION_GUIDES = [
  { slug:'prs-beginners-guide',          title:'PRS Practical Rifle: Getting Started',          subtitle:'Your first PRS match — gear requirements, positional shooting, reading wind, and the mental game.', category:'Precision', readTime:'17 min', img:'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80', featured:true, date:'Jun 2026' },
  { slug:'long-range-ballistics',        title:'Long Range Ballistics Without the Guesswork',   subtitle:'BC, velocity, drop, and wind drift explained. How to build a DOPE card and trust your data at 800 yards.', category:'Precision', readTime:'20 min', img:'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80', featured:true, date:'May 2026' },
  { slug:'6-5-creedmoor-deep-dive',      title:'6.5 Creedmoor: Why It Won',                    subtitle:'The ballistics case for 6.5 CM. BC comparison to .308, recoil numbers, factory ammo performance, and when to choose something else.', category:'Ammunition', readTime:'12 min', img:'https://images.unsplash.com/photo-1574180566232-aaad1b5b8450?w=800&q=80', date:'Apr 2026' },
  { slug:'rifle-scope-guide',            title:'Scope Selection: MRAD vs MOA, Magnification',   subtitle:'First vs second focal plane, turret quality, glass clarity at price tiers, and the scopes worth your money.', category:'Gear', readTime:'15 min', img:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', date:'Mar 2026' },
]

const TRAINING_GUIDES = [
  { slug:'30-day-dry-fire-plan',         title:'30-Day Dry Fire Plan: Zero Ammo Required',     subtitle:'A progressive dry fire curriculum that builds trigger control, sight picture, and presentation in one month flat.', category:'Training', readTime:'11 min', img:'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80', featured:true, date:'Jun 2026' },
  { slug:'first-shooting-lesson',        title:'Teaching Someone to Shoot for the First Time',  subtitle:'Safety briefing, grip, stance, trigger press, and the mental approach that turns a nervous first-timer into a confident shooter.', category:'Training', readTime:'9 min',  img:'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=800&q=80', featured:true, date:'May 2026' },
  { slug:'one-handed-shooting',          title:'One-Handed Shooting Technique',                 subtitle:'Strong hand and support hand shooting. Why you train it, how to build accuracy, and the drills that transfer to real-world retention.', category:'Training', readTime:'8 min',  img:'https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800&q=80', date:'Jul 2026' },
  { slug:'home-defense-drill-plan',      title:'Home Defense: Training for the Real Scenario',  subtitle:'Low light, hallway geometry, door stacking, family communication protocols, and the drills that actually matter at 3 AM.', category:'Training', readTime:'13 min', img:'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80', date:'Aug 2026' },
]

const PREPAREDNESS_GUIDES = [
  { slug:'home-defense-setup',           title:'Home Defense Setup: Every Room, Every Scenario', subtitle:'Room-by-room planning, safe storage accessible under pressure, communication with family, and the equipment list that actually matters.', category:'Home Defense', readTime:'16 min', img:'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80', featured:true, date:'May 2026' },
  { slug:'go-bag-essentials',            title:'The Real Go-Bag: What Actually Matters',          subtitle:'72-hour kit built around actual threats: power outage, evacuation, and shelter-in-place. No fantasy prepper nonsense.', category:'Preparedness', readTime:'14 min', img:'https://images.unsplash.com/photo-1527004013197-933b19a4e2a7?w=800&q=80', date:'Jun 2026' },
  { slug:'firearm-safe-storage-guide',   title:'Gun Safe Selection: What Protects Your Guns',   subtitle:'Fire rating realities, pry resistance, biometric reliability, and the safes that actually pass the test when seconds count.', category:'Storage', readTime:'11 min', img:'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800&q=80', date:'Jul 2026' },
]

const SUB_SECTIONS = [
  { key:'hunting',      label:'🦌 Hunting',      guides: HUNTING_GUIDES,     href:'/hunting',      color:'#22C55E', count: HUNTING_GUIDES.length },
  { key:'precision',    label:'🎯 Precision',    guides: PRECISION_GUIDES,   href:'/precision',    color:'#60A5FA', count: PRECISION_GUIDES.length },
  { key:'training',     label:'▲ Training',      guides: TRAINING_GUIDES,    href:'/training',     color:'#C8922A', count: TRAINING_GUIDES.length },
  { key:'preparedness', label:'🎒 Preparedness', guides: PREPAREDNESS_GUIDES,href:'/preparedness', color:'#EF4444', count: PREPAREDNESS_GUIDES.length },
]

const ALL_GUIDES = [
  ...HUNTING_GUIDES,
  ...PRECISION_GUIDES,
  ...TRAINING_GUIDES,
  ...PREPAREDNESS_GUIDES,
]

const CAT_COLORS = {
  'Hunting':'#22C55E', 'Precision':'#60A5FA', 'Ammunition':'#C8922A', 'Skills':'#F97316',
  'Gear':'#FBBF24', 'Training':'#C8922A', 'Home Defense':'#EF4444', 'Preparedness':'#EF4444', 'Storage':'#8B5CF6',
}

function GuideCard({ guide, featured = false }) {
  // Route guide slugs to parent page with query param (no [slug] sub-routes exist)
  const baseRoute = guide.category === 'Precision' ? 'precision'
    : guide.category === 'Training' ? 'training'
    : (guide.category === 'Home Defense' || guide.category === 'Preparedness' || guide.category === 'Storage') ? 'preparedness'
    : 'hunting'
  const href = `/${baseRoute}?guide=${guide.slug}`
  const dotColor = CAT_COLORS[guide.category] || 'var(--gold)'

  if (featured) {
    return (
      <Link href={href} style={{ textDecoration:'none', display:'block', position:'relative', overflow:'hidden' }}>
        <div style={{ height:'440px', position:'relative', overflow:'hidden' }}>
          <img src={guide.img} alt={guide.title}
            className="learn-card-img"
            style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }} />
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.96) 0%, rgba(9,9,11,0.3) 60%, transparent 100%)' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'24px' }}>
            <span style={{ background:dotColor, color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', padding:'2px 10px', display:'inline-block', marginBottom:'10px' }}>{guide.category.toUpperCase()}</span>
            <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'#F0EDE6', letterSpacing:'0.02em', lineHeight:1.1, marginBottom:'8px' }}>{guide.title}</h3>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'rgba(240,237,230,0.65)', lineHeight:1.5 }}>{guide.subtitle}</p>
            <div style={{ display:'flex', alignItems:'center', gap:'8px', marginTop:'12px' }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.45)' }}>{guide.readTime} read</span>
              <span style={{ color:'var(--gold)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em' }}>READ →</span>
            </div>
          </div>
        </div>
      </Link>
    )
  }

  return (
    <Link href={href} style={{ textDecoration:'none', display:'block', position:'relative', overflow:'hidden' }}>
      <div style={{ height:'260px', position:'relative', overflow:'hidden' }}>
        <img src={guide.img} alt={guide.title}
          className="learn-card-img"
          style={{ width:'100%', height:'100%', objectFit:'cover', transition:'transform 0.4s ease' }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(9,9,11,0.92) 0%, rgba(9,9,11,0.3) 60%, transparent 100%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'16px' }}>
          <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6 }}>
            <span style={{ width:6, height:6, borderRadius:'50%', background:dotColor, flexShrink:0 }} />
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.55)', letterSpacing:'0.1em' }}>{guide.category.toUpperCase()} · {guide.readTime}</span>
          </div>
          <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'16px', fontWeight:700, color:'#F0EDE6', lineHeight:1.25, marginBottom:'4px' }}>{guide.title}</h3>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'rgba(240,237,230,0.5)', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{guide.subtitle}</p>
        </div>
        <div style={{ position:'absolute', top:'10px', right:'10px', background:'rgba(9,9,11,0.7)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'rgba(240,237,230,0.5)', padding:'3px 8px', border:'1px solid rgba(255,255,255,0.08)' }}>{guide.date}</div>
      </div>
    </Link>
  )
}

export default function OutdoorsPage({ searchParams }) {
  const section = searchParams?.section || null
  const currentSection = SUB_SECTIONS.find(s => s.key === section)
  const displayGuides  = currentSection ? currentSection.guides : []
  const featuredGuides = ALL_GUIDES.filter(g => g.featured).slice(0, 3)
  const allGrid        = ALL_GUIDES.filter(g => !g.featured)

  return (
    <>
      <Masthead />

      {/* ── HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>FIELD</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>OUTDOORS</span>
              <span style={{ background:'#001A0A', color:'#22C55E', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 10px', border:'1px solid #22C55E40' }}>{ALL_GUIDES.length} GUIDES</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'14px' }}>
              Hunting, Precision &amp;<br />
              <span style={{ color:'var(--gold)' }}>Field Craft</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7, maxWidth:560 }}>
              Season data, cartridge guides, precision rifle skills, dry-fire training plans, and home defense preparation. Built for serious outdoors Americans.
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY SECTION BAR ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
            <a href="/hunting"
              style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${!section?'var(--gold)':'transparent'}`, color:!section?'var(--gold)':'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
              All ({ALL_GUIDES.length})
            </a>
            {SUB_SECTIONS.map(s => (
              <a key={s.key} href={`/hunting?section=${s.key}`}
                style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${section===s.key?s.color:'transparent'}`, color:section===s.key?s.color:'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                <span style={{ width:6, height:6, borderRadius:'50%', background:s.color, flexShrink:0 }} />
                {s.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">

          <style>{`
            .learn-card-img { transition: transform 0.4s ease; }
            .learn-card-img:hover { transform: scale(1.04); }
          `}</style>

          {/* ── ALL VIEW ── */}
          {!section && (
            <>
              {/* Featured mosaic */}
              <div style={{ marginBottom:52 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
                  <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>Essential Guides</h2>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>START HERE</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:3 }}>
                  <GuideCard guide={featuredGuides[0]} featured />
                  <div style={{ display:'flex', flexDirection:'column', gap:3, gridColumn:'2 / span 2' }}>
                    {featuredGuides.slice(1, 3).map(g => (
                      <div key={g.slug} style={{ flex:1 }}>
                        <GuideCard guide={g} featured />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section preview grids */}
              {SUB_SECTIONS.map(sub => (
                <div key={sub.key} style={{ marginBottom:48 }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:12 }}>
                      <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>{sub.label}</h2>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>{sub.count} GUIDES</span>
                    </div>
                    <a href={`/hunting?section=${sub.key}`} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)', textDecoration:'none', letterSpacing:'0.05em' }}>VIEW ALL →</a>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:3 }}>
                    {sub.guides.slice(0, 4).map(g => <GuideCard key={g.slug} guide={g} />)}
                  </div>
                </div>
              ))}
            </>
          )}

          {/* ── SECTION VIEW ── */}
          {section && currentSection && (
            <>
              <div style={{ marginBottom:32 }}>
                <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
                  <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'0.04em' }}>{currentSection.label}</h2>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.1em' }}>{currentSection.guides.length} GUIDES</span>
                </div>

                {/* Featured first */}
                {currentSection.guides.filter(g => g.featured).length > 0 && (
                  <div style={{ display:'grid', gridTemplateColumns:'2fr 1fr 1fr', gap:3, marginBottom:3 }}>
                    {(() => {
                      const feat = currentSection.guides.filter(g => g.featured)
                      return (
                        <>
                          <GuideCard guide={feat[0]} featured />
                          {feat.length > 1 && (
                            <div style={{ display:'flex', flexDirection:'column', gap:3, gridColumn:'2 / span 2' }}>
                              {feat.slice(1, 3).map(g => (
                                <div key={g.slug} style={{ flex:1 }}>
                                  <GuideCard guide={g} featured />
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                )}

                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:3 }}>
                  {currentSection.guides.filter(g => !g.featured).map(g => <GuideCard key={g.slug} guide={g} />)}
                </div>
              </div>
            </>
          )}

          {/* ── SEASON QUICK-REFERENCE ── */}
          {!section && (
            <div style={{ marginTop:48, background:'var(--bg2)', border:'1px solid var(--border)', padding:'28px 32px' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--text)', letterSpacing:'0.04em' }}>2025–2026 Season Overview</h2>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)' }}>VERIFY WITH YOUR STATE AGENCY</span>
              </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
                  <thead>
                    <tr>
                      {['State','Whitetail','Elk','Turkey','Dove','Notes'].map(h => (
                        <th key={h} style={{ textAlign:'left', padding:'8px 12px', color:'var(--gold)', letterSpacing:'0.08em', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { abbr:'TX', state:'Texas',      whitetail:'Oct 5 – Jan 19',   elk:'N/A',               turkey:'Mar 29–May 11', dove:'Sep 1–Nov 12',  notes:'Year-round hog' },
                      { abbr:'CO', state:'Colorado',   whitetail:'Oct 18 – Nov 3',   elk:'Rifle Oct 18–Nov 3', turkey:'Apr 12–May 25', dove:'Sep 1–Nov 14',  notes:'Draw system premium units' },
                      { abbr:'WA', state:'Washington', whitetail:'Oct 12 – Nov 24',  elk:'Unit dependent',    turkey:'Apr 15–May 31', dove:'Sep 1–Oct 31',   notes:'3-pt restriction many units' },
                      { abbr:'MT', state:'Montana',    whitetail:'Oct 26 – Nov 24',  elk:'Oct 26–Nov 24',     turkey:'May only',      dove:'Sep 1–Nov 9',    notes:'Best elk lower 48' },
                      { abbr:'ID', state:'Idaho',      whitetail:'Oct 10 – Nov 20',  elk:'Aug 30–Nov 20',     turkey:'Apr 15–May 31', dove:'Sep 1–Nov 10',   notes:'OTC elk most zones' },
                      { abbr:'FL', state:'Florida',    whitetail:'Jul 31 – Feb 16',  elk:'N/A',               turkey:'Mar 6–Apr 12',  dove:'Oct 18–Nov 23',  notes:'Archery opens July' },
                    ].map(s => (
                      <tr key={s.abbr} style={{ borderBottom:'1px solid var(--border)' }}>
                        <td style={{ padding:'10px 12px' }}>
                          <Link href={`/state-hub/${s.abbr.toLowerCase()}`} style={{ color:'var(--gold)', textDecoration:'none', fontWeight:700 }}>{s.abbr}</Link>
                        </td>
                        <td style={{ padding:'10px 12px', color:'var(--text-muted)' }}>{s.whitetail}</td>
                        <td style={{ padding:'10px 12px', color:'var(--text-muted)' }}>{s.elk}</td>
                        <td style={{ padding:'10px 12px', color:'var(--text-muted)' }}>{s.turkey}</td>
                        <td style={{ padding:'10px 12px', color:'var(--text-muted)' }}>{s.dove}</td>
                        <td style={{ padding:'10px 12px', color:'#4B5563', fontSize:'10px' }}>{s.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginTop:12 }}>
                ⚠ Always verify exact dates and regulations with your state wildlife agency before hunting.
              </p>
            </div>
          )}

          {/* ── BOTTOM CTA ── */}
          <div style={{ marginTop:48, padding:'32px', background:'var(--bg2)', border:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr auto', gap:24, alignItems:'center' }}>
            <div>
              <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--text)', letterSpacing:'0.04em', marginBottom:6 }}>More field guides coming</h3>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.6 }}>
                Bear hunting, waterfowl, mule deer, pronghorn, and backcountry elk. New content weekly.
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
