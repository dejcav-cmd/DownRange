'use client'
import DottedSurface from '../ui/DottedSurface'
import ThemeToggle from '../ui/ThemeToggle'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// ── NAV STRUCTURE WITH DROPDOWNS ─────────────────────────────────────────────
const NAV = [
  {
    label: 'News',
    href: '/news',
    children: [
      { label: 'Latest News', href: '/news', desc: 'All stories, updated every 15 min' },
      { label: '⚡ Breaking Alerts', href: '/news?cat=breaking', desc: 'Urgency 8+ stories' },
      { label: '⚖ Law & Courts', href: '/news?cat=law', desc: 'Legislation and court rulings' },
      { label: '◈ Industry', href: '/news?cat=industry', desc: 'Manufacturers, products, market' },
      { label: '🗺 State News', href: '/state-news', desc: 'News by state, all 50' },
      { label: '▶ Video', href: '/video', desc: 'Top 2A YouTube channels' },
      { label: '🔥 Live Deals', href: '/deals', desc: 'r/gundeals + retailers' },
    ]
  },
  {
    label: 'Laws',
    href: '/laws',
    children: [
      { label: '🏛 Federal Bills', href: '/laws?tab=federal', desc: 'Congress.gov tracked bills' },
      { label: '🗺 State Laws', href: '/laws?tab=state', desc: 'All 50 states covered' },
      { label: '📋 ATF Rules', href: '/laws?tab=atf', desc: '2026 reform package + history' },
      { label: '⚖ SCOTUS Cases', href: '/laws?tab=scotus', desc: 'Active and landmark decisions' },
      { label: '🤖 AI Law Assistant', href: '/laws?tab=assistant', desc: 'Ask any firearms law question' },
      { label: '🗺 CCW Reciprocity', href: '/laws?tab=reciprocity', desc: 'Where your permit is honored' },
      { label: '🗺 State Hub Map', href: '/state-hub', desc: 'Interactive 50-state freedom map' },
    ]
  },
  {
    label: 'Reviews',
    href: '/reviews',
    children: [
      { label: '★ All Reviews', href: '/reviews', desc: 'Field-tested, expert scored' },
      { label: '🔫 Pistols', href: '/reviews?cat=pistol', desc: 'Handguns and subcompacts' },
      { label: '◈ Rifles', href: '/reviews?cat=rifle', desc: 'ARs, AKs, bolt guns' },
      { label: '◈ Shotguns', href: '/reviews?cat=shotgun', desc: 'Defense and hunting' },
      { label: '◉ Optics', href: '/reviews?cat=optic', desc: 'Scopes, red dots, LPVOs' },
      { label: '◈ Suppressors', href: '/reviews?cat=suppressor', desc: 'NFA items reviewed' },
      { label: '◈ Accessories', href: '/reviews?cat=accessory', desc: 'Holsters, lights, mags' },
    ]
  },
  {
    label: 'Guns',
    href: '/guns',
    children: [
      { label: '📖 Encyclopedia', href: '/guns', desc: 'Specs, history, variants' },
      { label: '🆕 New Releases', href: '/releases', desc: 'Latest firearms launches' },
      { label: '⚖ Compare Guns', href: '/compare/glock-19-vs-sig-p320', desc: 'Head-to-head with AI verdict' },
      { label: '$ Value Estimator', href: '/value-estimator', desc: 'What is your gun worth?' },
      { label: '🔫 Holster Finder', href: '/holsters/glock-19', desc: 'IWB/OWB/AIWB by model' },
      { label: '⚙ NFA Tracker', href: '/nfa-tracker', desc: 'Form 4 wait time estimator' },
    ]
  },
  {
    label: 'Market',
    href: '/market',
    children: [
      { label: '📊 Market Watch', href: '/market', desc: 'Daily ammo price analysis' },
      { label: '🔥 Live Deals', href: '/deals', desc: 'Best prices right now' },
      { label: '💊 Ammo Guide', href: '/ammo/9mm', desc: '9mm, 5.56, .308 and more' },
      { label: '◎ Range Finder', href: '/ranges', desc: 'Shooting ranges near you' },
      { label: '🔍 FFL Finder', href: '/ffl-finder', desc: 'Licensed dealers near you' },
      { label: '🛡 CCW Insurance', href: '/carry-insurance', desc: 'USCCA vs CCW Safe vs others' },
    ]
  },
  {
    label: 'Outdoors',
    href: '/hunting',
    children: [
      { label: '🦌 Hunting Hub', href: '/hunting', desc: 'Season dates, cartridges, rifles' },
      { label: '🎯 Precision Shooting', href: '/precision', desc: 'PRS, long range, ballistics' },
      { label: '▲ Training & Drills', href: '/training', desc: '30-day dry fire program' },
      { label: '🔒 Safe Storage', href: '/safe-storage', desc: 'Biometric and vault reviews' },
      { label: '◎ Ranges Near Me', href: '/ranges', desc: 'Find a range to shoot' },
      { label: '🎒 Preparedness', href: '/preparedness', desc: 'Home defense, grid-down, go-bag' },
    ]
  },
  {
    label: 'International',
    href: '/canada',
    children: [
      { label: '🇨🇦 Canada', href: '/canada', desc: 'PAL, C-21, province laws' },
    ]
  },
]

export default function Masthead() {
  const pathname = usePathname()
  const [dateStr, setDateStr] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDropdown, setOpenDropdown] = useState(null)
  const navRef = useRef(null)
  const closeTimer = useRef(null)

  useEffect(() => {
    const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
    const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
    const d = new Date()
    setDateStr(`${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`)
  }, [])

  function openDrop(label) {
    clearTimeout(closeTimer.current)
    setOpenDropdown(label)
  }

  function closeDrop() {
    closeTimer.current = setTimeout(() => setOpenDropdown(null), 120)
  }

  function isActive(item) {
    if (item.href === '/') return pathname === '/'
    return pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
  }

  return (
    <header style={{ background:'#111318', borderBottom:'1px solid var(--border)', position:'sticky', top:0, zIndex:50, overflow:'visible' }}>
      <DottedSurface style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} />

      <style>{`
        .nav-drop { display:none; position:absolute; top:100%; left:0; background:#0D1117; border:1px solid #1F2428; border-top:2px solid #C8922A; padding:8px; min-width:260px; z-index:100; box-shadow:0 8px 32px rgba(0,0,0,0.8); }
        .nav-drop.visible { display:block; }
        .nav-drop-item { display:block; padding:8px 12px; text-decoration:none; border-radius:3px; transition:background 0.12s; }
        .nav-drop-item:hover { background:#1F2428; }
        .nav-top-item { transition: color 0.15s; }
        .nav-top-item:hover { color: #FFFFFF !important; }
        .nav-top-item:hover .nav-arrow { color: #C8922A !important; }
        .nav-drop-label { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; color:#F0EDE6; letter-spacing:0.05em; display:block; }
        .nav-drop-desc { font-family:monospace; font-size:10px; color:#4B5563; display:block; margin-top:1px; }
        .nav-item-wrap { position:relative; }
        @media(max-width:900px) { .nav-desktop{display:none!important} .nav-mobile{display:flex!important} .masthead-right{display:none!important} }
        @media(min-width:901px) { .nav-mobile{display:none!important} .nav-mobile-menu{display:none!important} }
        .nav-mobile-menu.open{display:flex!important}
      `}</style>

      <div className="container" style={{ position:'relative', zIndex:1 }}>
        {/* Logo row */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'18px 0 14px' }}>
          <div style={{ position:'relative', zIndex:1 }}>
            <Link href="/" style={{ display:'block', lineHeight:1 }} aria-label="DownRange — Home">
              <svg width="460" height="80" viewBox="0 0 520 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
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
                  <line x1="20" y1="-12" x2="20" y2="12" stroke="#C8922A" strokeWidth="0.5" opacity="0.4"/>
                  <line x1="52" y1="-12" x2="52" y2="12" stroke="#C8922A" strokeWidth="0.5" opacity="0.4"/>
                </g>
                <g transform="translate(84,12)">
                  <text x="0" y="46" fontFamily="Georgia, serif" fontSize="46" fontWeight="900" fill="#C8922A" letterSpacing="4">DOWNRANGE</text>
                  <text x="2" y="64" fontFamily="monospace" fontSize="11" fill="#6B7280" letterSpacing="8">INTELLIGENCE HUB</text>
                  <line x1="0" y1="72" x2="420" y2="72" stroke="#C8922A" strokeWidth="0.75" opacity="0.5"/>
                </g>
              </svg>
            </Link>
          </div>

          <div className="masthead-right" style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'4px', position:'relative', zIndex:1 }}>
            <span style={{ background:'#C8922A', color:'#09090B', fontFamily:"'Barlow Condensed', sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', padding:'3px 10px' }}>
              DAILY EDITION
            </span>
            <div style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:'11px', color:'#6B7280' }}>{dateStr}</div>
            <div style={{ fontFamily:"'IBM Plex Mono', monospace", fontSize:'11px', color:'#C8922A' }}>📍 DOWNRANGECO.COM</div>
          </div>
        </div>

        {/* Desktop nav with dropdowns */}
        <nav className="nav-desktop" ref={navRef} style={{ borderTop:'1px solid var(--border)', display:'flex', alignItems:'stretch', position:'relative' }}>
          <ul style={{ display:'flex', listStyle:'none', flex:1, margin:0, padding:0 }}>
            {NAV.map(item => {
              const active = isActive(item)
              const isOpen = openDropdown === item.label
              return (
                <li key={item.label} className="nav-item-wrap"
                  onMouseEnter={() => openDrop(item.label)}
                  onMouseLeave={closeDrop}>
                  <Link href={item.href}
                    className="nav-top-item"
                    style={{
                      display:'flex', alignItems:'center', gap:'4px',
                      fontFamily:"'Barlow Condensed', sans-serif",
                      fontSize:'13px', fontWeight:700, letterSpacing:'0.1em',
                      textTransform:'uppercase', padding:'13px 14px',
                      color: active ? '#F0EDE6' : '#9CA3AF',
                      borderBottom: active ? '2px solid #C8922A' : '2px solid transparent',
                      transition:'color 0.15s, border-color 0.15s',
                      whiteSpace:'nowrap', textDecoration:'none',
                    }}>
                    {item.label}
                    {item.children && (
                      <span className="nav-arrow" style={{ fontSize:'8px', color: active ? '#C8922A' : '#4B5563', marginTop:'1px' }}>▼</span>
                    )}
                  </Link>

                  {/* Dropdown */}
                  {item.children && (
                    <div className={`nav-drop${isOpen ? ' visible' : ''}`}
                      onMouseEnter={() => openDrop(item.label)}
                      onMouseLeave={closeDrop}>
                      {item.children.map(child => (
                        <Link key={child.href} href={child.href} className="nav-drop-item">
                          <span className="nav-drop-label">{child.label}</span>
                          {child.desc && <span className="nav-drop-desc">{child.desc}</span>}
                        </Link>
                      ))}
                    </div>
                  )}
                </li>
              )
            })}
          </ul>

          {/* Search + theme */}
          <div style={{ padding:'0 14px', display:'flex', alignItems:'center', gap:'10px', borderLeft:'1px solid var(--border)' }}>
            <Link href="/search" style={{ display:'flex', alignItems:'center', gap:'5px', fontFamily:"'IBM Plex Mono', monospace", fontSize:'12px', color:'#6B7280', textDecoration:'none' }}>
              <span style={{ fontSize:'15px' }}>⌕</span>
            </Link>
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile nav */}
        <div className="nav-mobile" style={{ display:'none', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderTop:'1px solid var(--border)' }}>
          <svg width="120" height="30" viewBox="0 0 340 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <g transform="translate(8,45)">
              <circle cx="36" cy="0" r="32" fill="none" stroke="#C8922A" strokeWidth="2"/>
              <circle cx="36" cy="0" r="22" fill="none" stroke="#C8922A" strokeWidth="0.75"/>
              <circle cx="36" cy="0" r="4" fill="#C8922A"/>
              <line x1="36" y1="-32" x2="36" y2="-24" stroke="#C8922A" strokeWidth="2"/>
              <line x1="36" y1="24" x2="36" y2="32" stroke="#C8922A" strokeWidth="2"/>
              <line x1="4" y1="0" x2="14" y2="0" stroke="#C8922A" strokeWidth="2"/>
              <line x1="58" y1="0" x2="68" y2="0" stroke="#C8922A" strokeWidth="2"/>
            </g>
            <text x="84" y="52" fontFamily="Georgia, serif" fontSize="46" fontWeight="900" fill="#C8922A" letterSpacing="4">DOWNRANGE</text>
          </svg>
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <Link href="/search" style={{ color:'#6B7280', textDecoration:'none', fontSize:'18px' }}>⌕</Link>
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background:'none', border:'1px solid var(--border)', color:'#9CA3AF', padding:'6px 12px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
              {menuOpen ? '✕' : '☰ MENU'}
            </button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}
          style={{ display:'none', flexDirection:'column', borderTop:'1px solid var(--border)', paddingBottom:'12px', maxHeight:'70vh', overflowY:'auto' }}>
          {NAV.map(item => (
            <div key={item.label}>
              <a href={item.href} onClick={() => setMenuOpen(false)}
                style={{ display:'block', fontFamily:"'Barlow Condensed', sans-serif", fontWeight:700, fontSize:'15px', padding:'12px 0', color:'#C8922A', borderBottom:'1px solid var(--border)', letterSpacing:'0.1em', textDecoration:'none', textTransform:'uppercase' }}>
                {item.label}
              </a>
              {item.children?.map(child => (
                <a key={child.href} href={child.href} onClick={() => setMenuOpen(false)}
                  style={{ display:'block', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', padding:'8px 0 8px 16px', color:'#9CA3AF', textDecoration:'none' }}>
                  {child.label}
                </a>
              ))}
            </div>
          ))}
        </div>
      </div>
    </header>
  )
}
