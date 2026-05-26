'use client'
import DottedSurface from '../ui/DottedSurface'
import ThemeToggle from '../ui/ThemeToggle'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Home', href: '/', icon: '◉', exact: true },
  {
    label: 'News', href: '/news',
    children: [
      { label: 'Latest News',      href: '/news',              desc: 'All stories, every 15 min' },
      { label: '⚡ Breaking',      href: '/news?cat=breaking', desc: 'Urgency 8+ alerts' },
      { label: '⚖ Law & Courts',  href: '/news?cat=law',      desc: 'Legislation & rulings' },
      { label: '◈ Industry',       href: '/news?cat=industry', desc: 'Manufacturers & market' },
      { label: '🗺 State News',    href: '/state-news',        desc: '50-state news feeds' },
      { label: '▶ Video',          href: '/video',             desc: 'Top 2A channels' },
      { label: '🔥 Live Deals',    href: '/deals',             desc: 'r/gundeals + retailers' },
    ]
  },
  {
    label: 'Laws', href: '/laws',
    children: [
      { label: '🏛 Federal Bills', href: '/laws?tab=federal',     desc: 'Congress tracked bills' },
      { label: '🗺 State Laws',    href: '/laws?tab=state',       desc: 'All 50 states' },
      { label: '📋 ATF Rules',     href: '/laws?tab=atf',         desc: '2026 reform package' },
      { label: '⚖ SCOTUS Cases',  href: '/laws?tab=scotus',      desc: 'Active decisions' },
      { label: '🤖 AI Assistant',  href: '/laws?tab=assistant',   desc: 'Ask any law question' },
      { label: '🗺 CCW Reciprocity',href: '/laws?tab=reciprocity',desc: 'Where your permit works' },
      { label: '🗺 State Hub Map', href: '/state-hub',            desc: 'Interactive 50-state map' },
    ]
  },
  {
    label: 'Reviews', href: '/reviews',
    children: [
      { label: '★ All Reviews',   href: '/reviews',              desc: 'Field-tested, documented' },
      { label: '🔫 Pistols',      href: '/reviews?cat=pistol',   desc: 'Handguns & subcompacts' },
      { label: '◈ Rifles',        href: '/reviews?cat=rifle',    desc: 'ARs, AKs, bolt guns' },
      { label: '◈ Shotguns',      href: '/reviews?cat=shotgun',  desc: 'Defense & hunting' },
      { label: '◉ Optics',        href: '/reviews?cat=optic',    desc: 'Scopes & red dots' },
      { label: '◈ Suppressors',   href: '/reviews?cat=suppressor',desc: 'NFA items reviewed' },
    ]
  },
  {
    label: 'Guns', href: '/guns',
    children: [
      { label: '📖 Encyclopedia', href: '/guns',                          desc: 'Specs, history, variants' },
      { label: '🆕 Releases',     href: '/releases',                      desc: 'Latest launches' },
      { label: '⚖ Compare',       href: '/compare/glock-19-vs-sig-p320', desc: 'Head-to-head with AI' },
      { label: '$ Value Est.',     href: '/value-estimator',              desc: 'What is your gun worth?' },
      { label: '🔫 Holsters',     href: '/holsters/glock-19',            desc: 'IWB/OWB by model' },
      { label: '⚙ NFA Tracker',   href: '/nfa-tracker',                  desc: 'Form 4 wait times' },
    ]
  },
  {
    label: 'Market', href: '/market',
    children: [
      { label: '📊 Market Watch', href: '/market',          desc: 'Daily ammo analysis' },
      { label: '🔥 Deals',        href: '/deals',           desc: 'Best prices live' },
      { label: '💊 Ammo Guide',   href: '/ammo/9mm',        desc: '9mm, 5.56, .308 & more' },
      { label: '◎ Ranges',        href: '/ranges',          desc: 'Ranges near you' },
      { label: '🔍 FFL Finder',   href: '/ffl-finder',      desc: 'Licensed dealers' },
      { label: '🛡 CCW Insurance', href: '/carry-insurance', desc: 'USCCA vs CCW Safe' },
    ]
  },
  {
    label: 'Outdoors', href: '/hunting',
    children: [
      { label: '🦌 Hunting',       href: '/hunting',       desc: 'Season dates & cartridges' },
      { label: '🎯 Precision',     href: '/precision',     desc: 'PRS, long range, ballistics' },
      { label: '▲ Training',       href: '/training',      desc: '30-day dry fire plan' },
      { label: '🔒 Safe Storage',  href: '/safe-storage',  desc: 'Biometric & vault reviews' },
      { label: '◎ Ranges',         href: '/ranges',        desc: 'Find a range' },
      { label: '🎒 Preparedness',  href: '/preparedness',  desc: 'Home defense & go-bag' },
    ]
  },
  {
    label: '🇨🇦 International', href: '/canada',
    children: [
      { label: '🇨🇦 Canada', href: '/canada', desc: 'PAL, C-21, province laws' },
    ]
  },
]

export default function Masthead() {
  const pathname = usePathname()
  const [dateStr, setDateStr] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
    const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
    const d = new Date()
    setDateStr(`${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`)
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMenuOpen(false); setMobileExpanded(null) }, [pathname])

  function openDropdown(label) {
    clearTimeout(closeTimer.current)
    setOpenDrop(label)
  }
  function closeDropdown() {
    closeTimer.current = setTimeout(() => setOpenDrop(null), 140)
  }

  function isActive(item) {
    if (item.exact) return pathname === item.href
    return pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
  }

  return (
    <header style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:50, overflow:'visible' }}>
      <DottedSurface style={{ position:'absolute', inset:0, width:'100%', height:'100%', pointerEvents:'none' }} />

      <style>{`
        /* Dropdown */
        .nav-drop { display:none; position:absolute; top:calc(100% + 1px); left:0; background:#0A0B0C; border:1px solid var(--border); border-top:2px solid var(--gold); padding:6px; min-width:240px; z-index:200; box-shadow:0 12px 40px rgba(0,0,0,0.9); }
        .nav-drop.open { display:block; }
        .nav-drop-item { display:block; padding:8px 12px; text-decoration:none; transition:background 0.1s; }
        .nav-drop-item:hover { background:var(--bg3); }
        .ndi-label { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:var(--text); letter-spacing:0.04em; display:block; }
        .ndi-desc { font-family:'IBM Plex Mono',monospace; font-size:9px; color:var(--text-dim); display:block; margin-top:1px; }
        /* Nav item */
        .nav-item-wrap { position:relative; }
        .nav-top-link { display:flex; align-items:center; gap:4px; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:13px 13px; white-space:nowrap; text-decoration:none; border-bottom:2px solid transparent; transition:color 0.15s, border-color 0.15s; }
        .nav-top-link:hover { color:#fff !important; }
        .nav-top-link.active { border-bottom-color:var(--gold) !important; color:var(--text) !important; }
        /* Responsive */
        @media(max-width:900px) { .nav-desktop{display:none!important} .nav-mob-bar{display:flex!important} .masthead-dateline{display:none!important} }
        @media(min-width:901px) { .nav-mob-bar{display:none!important} .nav-mob-sheet{display:none!important} }
        .nav-mob-sheet.open { display:flex!important; }
        /* Mobile sheet */
        .mob-section-btn { width:100%; display:flex; align-items:center; justify-content:space-between; padding:13px 16px; background:none; border:none; border-bottom:1px solid var(--border); cursor:pointer; text-align:left; }
        .mob-section-btn .mob-label { font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); }
        .mob-section-btn .mob-arrow { font-size:10px; color:var(--text-dim); transition:transform 0.2s; }
        .mob-section-btn.expanded .mob-arrow { transform:rotate(180deg); }
        .mob-child { display:block; padding:9px 16px 9px 28px; font-family:'IBM Plex Mono',monospace; font-size:12px; color:var(--text-muted); text-decoration:none; border-bottom:1px solid rgba(31,36,40,0.5); }
        .mob-child:hover { color:var(--gold); background:var(--bg3); }
        /* Bottom safe area */
        .mob-safe-bottom { height:env(safe-area-inset-bottom, 0px); }
      `}</style>

      <div className="container" style={{ position:'relative', zIndex:1 }}>
        {/* ── Logo row ── */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'16px 0 12px' }}>
          <Link href="/" style={{ display:'block', lineHeight:1, textDecoration:'none' }} aria-label="DownRange Home">
            <svg width="320" height="56" viewBox="0 0 520 90" xmlns="http://www.w3.org/2000/svg">
              <g transform="translate(8,45)">
                <circle cx="36" cy="0" r="32" fill="none" stroke="#C8922A" strokeWidth="2"/>
                <circle cx="36" cy="0" r="22" fill="none" stroke="#C8922A" strokeWidth="0.75"/>
                <circle cx="36" cy="0" r="4" fill="#C8922A"/>
                <line x1="36" y1="-32" x2="36" y2="-24" stroke="#C8922A" strokeWidth="2"/>
                <line x1="36" y1="24" x2="36" y2="32" stroke="#C8922A" strokeWidth="2"/>
                <line x1="4" y1="0" x2="14" y2="0" stroke="#C8922A" strokeWidth="2"/>
                <line x1="58" y1="0" x2="68" y2="0" stroke="#C8922A" strokeWidth="2"/>
                <line x1="36" y1="-22" x2="36" y2="-10" stroke="#C8922A" strokeWidth="0.75"/>
                <line x1="36" y1="10" x2="36" y2="22" stroke="#C8922A" strokeWidth="0.75"/>
                <line x1="14" y1="0" x2="26" y2="0" stroke="#C8922A" strokeWidth="0.75"/>
                <line x1="46" y1="0" x2="58" y2="0" stroke="#C8922A" strokeWidth="0.75"/>
              </g>
              <g transform="translate(84,12)">
                <text x="0" y="46" fontFamily="Georgia, serif" fontSize="46" fontWeight="900" fill="#C8922A" letterSpacing="4">DOWNRANGE</text>
                <text x="2" y="64" fontFamily="monospace" fontSize="11" fill="#6B7280" letterSpacing="8">INTELLIGENCE HUB</text>
                <line x1="0" y1="72" x2="420" y2="72" stroke="#C8922A" strokeWidth="0.75" opacity="0.4"/>
              </g>
            </svg>
          </Link>

          <div className="masthead-dateline" style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'3px' }}>
            <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', padding:'3px 10px' }}>DAILY EDITION</span>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)' }}>{dateStr}</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--gold)' }}>📍 DOWNRANGECO.COM</div>
          </div>
        </div>

        {/* ── Desktop nav ── */}
        <nav className="nav-desktop" style={{ borderTop:'1px solid var(--border)', display:'flex', alignItems:'stretch' }}>
          <ul style={{ display:'flex', listStyle:'none', flex:1, margin:0, padding:0 }}>
            {NAV.map(item => {
              const active = isActive(item)
              const hasChildren = item.children?.length > 0
              const isOpen = openDrop === item.label
              return (
                <li key={item.label} className="nav-item-wrap"
                  onMouseEnter={() => hasChildren && openDropdown(item.label)}
                  onMouseLeave={closeDropdown}>
                  <Link href={item.href}
                    className={`nav-top-link${active ? ' active' : ''}`}
                    style={{ color: active ? 'var(--text)' : 'var(--text-muted)' }}>
                    {item.label}
                    {hasChildren && <span style={{ fontSize:'8px', color: active ? 'var(--gold)' : 'var(--text-dim)', marginTop:'1px' }}>▼</span>}
                  </Link>
                  {hasChildren && (
                    <div className={`nav-drop${isOpen ? ' open' : ''}`}
                      onMouseEnter={() => openDropdown(item.label)}
                      onMouseLeave={closeDropdown}>
                      {item.children.map(child => (
                        <Link key={child.href} href={child.href} className="nav-drop-item">
                          <span className="ndi-label">{child.label}</span>
                          {child.desc && <span className="ndi-desc">{child.desc}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
          <div style={{ padding:'0 12px', display:'flex', alignItems:'center', gap:'10px', borderLeft:'1px solid var(--border)' }}>
            <Link href="/search" style={{ color:'var(--text-dim)', textDecoration:'none', fontSize:'16px' }} title="Search">⌕</Link>
            <ThemeToggle />
          </div>
        </nav>

        {/* ── Mobile bar ── */}
        <div className="nav-mob-bar" style={{ display:'none', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderTop:'1px solid var(--border)' }}>
          <Link href="/" style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--gold)', letterSpacing:'0.05em', textDecoration:'none', lineHeight:1 }}>DOWNRANGE</Link>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <Link href="/search" style={{ color:'var(--text-dim)', textDecoration:'none', fontSize:'18px', padding:'4px 8px' }}>⌕</Link>
            <ThemeToggle />
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', padding:'7px 14px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', letterSpacing:'0.05em' }}>
              {menuOpen ? '✕ CLOSE' : '☰ MENU'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile sheet (full-screen drawer) ── */}
      <div className={`nav-mob-sheet${menuOpen ? ' open' : ''}`}
        style={{ display:'none', flexDirection:'column', background:'var(--bg)', borderTop:'2px solid var(--gold)', maxHeight:'85vh', overflowY:'auto', position:'fixed', top:'auto', left:0, right:0, zIndex:49, boxShadow:'0 20px 60px rgba(0,0,0,0.9)' }}>

        {/* Home row */}
        <Link href="/" onClick={() => setMenuOpen(false)} className="mob-child"
          style={{ padding:'14px 16px', fontSize:'14px', fontWeight:700, color:'var(--gold)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
          ◉ Home
        </Link>

        {NAV.slice(1).map(item => {
          const exp = mobileExpanded === item.label
          return (
            <div key={item.label}>
              <button className={`mob-section-btn${exp ? ' expanded' : ''}`}
                onClick={() => setMobileExpanded(exp ? null : item.label)}>
                <span className="mob-label">{item.label}</span>
                <span className="mob-arrow">▼</span>
              </button>
              {exp && (
                <div style={{ background:'var(--bg2)' }}>
                  {/* Section root link */}
                  <Link href={item.href} onClick={() => setMenuOpen(false)} className="mob-child"
                    style={{ color:'var(--text)', fontWeight:700, paddingLeft:'16px' }}>
                    View All {item.label} →
                  </Link>
                  {item.children?.map(child => (
                    <Link key={child.href} href={child.href} onClick={() => setMenuOpen(false)} className="mob-child">
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )
        })}

        {/* Bottom links */}
        <div style={{ display:'flex', gap:'0', borderTop:'1px solid var(--border)', marginTop:'4px' }}>
          {[['About','/about'],['Contact','/contact'],['Press','/press']].map(([l,h])=>(
            <Link key={h} href={h} onClick={()=>setMenuOpen(false)}
              style={{ flex:1, textAlign:'center', padding:'12px 0', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', textDecoration:'none', borderRight:'1px solid var(--border)', letterSpacing:'0.05em' }}>
              {l}
            </Link>
          ))}
        </div>
        <div className="mob-safe-bottom" />
      </div>
    </header>
  )
}
