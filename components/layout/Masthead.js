'use client'
import DottedSurface from '../ui/DottedSurface'
import ThemeToggle from '../ui/ThemeToggle'
import FeedbackModal from '../ui/FeedbackModal'
import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV = [
  { label: 'Home', href: '/', icon: '◉', exact: true },
  { label: 'News', href: '/news' },
  { label: 'Laws', href: '/laws' },
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
      { label: '🏆 Competitions',   href: '/competitions',  desc: 'NRA, USPSA, IDPA, PRS calendar' },
      { label: '🎯 Precision',     href: '/precision',     desc: 'PRS, long range, ballistics' },
      { label: '▲ Training',       href: '/training',      desc: '30-day dry fire plan' },
      { label: '🔒 Safe Storage',  href: '/safe-storage',  desc: 'Biometric & vault reviews' },
      { label: '◎ Ranges',         href: '/ranges',        desc: 'Find a range' },
      { label: '🎒 Preparedness',  href: '/preparedness',  desc: 'Home defense & go-bag' },
    ]
  },
  {
    label: 'Learn', href: '/learn',
    children: [
      { label: '📚 Learning Center',  href: '/learn',                              desc: 'All beginner guides' },
      { label: '🔫 First Gun Guide',  href: '/learn/buying-your-first-gun',        desc: 'How to buy your first firearm' },
      { label: '🪪 CCW License Guide',href: '/learn/how-to-get-ccw-license',       desc: 'State-by-state carry permit guide' },
      { label: '🛡 Safety Rules',      href: '/learn/firearms-safety-four-rules',   desc: 'The four rules that prevent accidents' },
      { label: '🏠 Home Defense',      href: '/learn/home-defense-basics',          desc: 'Practical home protection guide' },
      { label: '🎯 Training at Home',  href: '/learn/dry-fire-training-beginners',  desc: 'Free practice without ammo' },
      { label: '⚖ Gun Laws Explained',href: '/learn/understanding-gun-laws',        desc: 'Federal & state law for beginners' },
    ]
  },
  {
    label: '🇨🇦 International', href: '/canada',
    children: [
      { label: '🇨🇦 Canada', href: '/canada', desc: 'PAL, C-21, province laws' },
    ]
  },
  { label: 'Blog', href: '/blog' },
  { label: 'Video', href: '/video' },
]

import GlobalSearchBar from '../ui/GlobalSearchBar'

export default function Masthead() {
  const pathname = usePathname()
  const [dateStr, setDateStr] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [openDrop, setOpenDrop] = useState(null)
  const [mobileExpanded, setMobileExpanded] = useState(null)
  const [feedbackOpen, setFeedbackOpen] = useState(false)
  const [hiddenNav, setHiddenNav] = useState([])

  useEffect(() => {
    // Load hidden nav items from localStorage (set by admin)
    try {
      const stored = localStorage.getItem('dr_hidden_nav')
      if (stored) setHiddenNav(JSON.parse(stored))
    } catch {}
    // Also listen for changes (admin updates)
    const handler = () => {
      try { setHiddenNav(JSON.parse(localStorage.getItem('dr_hidden_nav') || '[]')) } catch {}
    }
    window.addEventListener('dr_nav_updated', handler)
    return () => window.removeEventListener('dr_nav_updated', handler)
  }, [])
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
        .ndi-label { font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; color:var(--text); letter-spacing:0.04em; display:block; }
        .ndi-desc { font-family:'IBM Plex Mono',monospace; font-size:10px; color:var(--text-dim); display:block; margin-top:1px; }
        /* Nav item */
        .nav-item-wrap { position:relative; }
        .nav-top-link { display:flex; align-items:center; gap:4px; font-family:'Barlow Condensed',sans-serif; font-size:15px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; padding:13px 13px; white-space:nowrap; text-decoration:none; border-bottom:2px solid transparent; transition:color 0.15s, border-color 0.15s; }
        .nav-top-link:hover { color:#fff !important; }
        .nav-top-link.active { border-bottom-color:var(--gold) !important; color:var(--text) !important; }
        /* Responsive */
        @media(max-width:900px) { .nav-desktop{display:none!important} .nav-mob-bar{display:flex!important} .masthead-dateline{display:none!important} .nav-mob-backdrop{display:block!important} }
        @media(min-width:901px) { .nav-mob-bar{display:none!important} .nav-mob-sheet{display:none!important} }
        .nav-mob-sheet.open { display:flex!important; }
        /* Mobile sheet */
        .mob-section-btn { width:100%; display:flex; align-items:center; justify-content:space-between; padding:13px 16px; background:none; border:none; border-bottom:1px solid var(--border); cursor:pointer; text-align:left; }
        .mob-section-btn .mob-label { font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:700; letter-spacing:0.1em; text-transform:uppercase; color:var(--gold); }
        .mob-section-btn .mob-arrow { font-size:10px; color:var(--text-dim); transition:transform 0.2s; }
        .mob-section-btn.expanded .mob-arrow { transform:rotate(180deg); }
        .mob-child { display:flex; align-items:center; min-height:48px; padding:10px 16px 10px 28px; font-family:'IBM Plex Mono',monospace; font-size:13px; color:var(--text-muted); text-decoration:none; border-bottom:1px solid rgba(31,36,40,0.5); -webkit-tap-highlight-color:transparent; }
        .mob-child:hover { color:var(--gold); background:var(--bg3); }
        /* Bottom safe area */
        .mob-safe-bottom { height:env(safe-area-inset-bottom, 0px); }
      `}</style>

      <div className="container" style={{ position:'relative', zIndex:1 }}>
        {/* ── Logo row ── */}
        <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', padding:'8px 0 12px' }}>
          <Link href="/" style={{ display:'block', lineHeight:1, textDecoration:'none' }} aria-label="DownRange Home">
            <img
              src="/img/logo.png"
              alt="DownRange Co."
              width={560}
              height={65}
              style={{ display:'block', height:'auto', maxHeight:162, width:'auto', maxWidth:'100%' }}
            />
          </Link>

          <div className="masthead-dateline" style={{ textAlign:'right', display:'flex', flexDirection:'column', alignItems:'flex-end', gap:'3px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <a href="/rss" style={{ display:'inline-flex', alignItems:'center', gap:4, background:'rgba(200,146,42,.12)', color:'var(--gold)', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'0.12em', padding:'3px 10px', textDecoration:'none', border:'1px solid rgba(200,146,42,.3)' }}>
                📡 RSS
              </a>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'10px', fontWeight:700, letterSpacing:'0.15em', padding:'3px 10px' }}>DAILY EDITION</span>
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)' }}>{dateStr}</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--gold)' }}>📍 DOWNRANGECO.COM</div>
          </div>
        </div>

        {/* ── Desktop nav ── */}
        <nav className="nav-desktop" style={{ borderTop:'1px solid var(--border)', display:'flex', alignItems:'stretch' }}>
          <ul style={{ display:'flex', listStyle:'none', flex:1, margin:0, padding:0 }}>
            {NAV.filter(item => !hiddenNav.includes(item.label)).map(item => {
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
            <button
              onClick={() => setFeedbackOpen(true)}
              style={{ background:'var(--gold)', color:'#09090B', border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', padding:'6px 14px', cursor:'pointer', whiteSpace:'nowrap' }}
              title="Send Feedback">
              Feedback
            </button>
            <Link href="/search" style={{ color:'var(--text-dim)', textDecoration:'none', fontSize:'16px' }} title="Search">⌕</Link>
            <ThemeToggle />
          </div>
        </nav>

        {/* ── Mobile bar ── */}
        <div className="nav-mob-bar" style={{ display:'none', alignItems:'center', justifyContent:'space-between', padding:'12px 0', borderTop:'1px solid var(--border)' }}>
          
          <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
            <button
              onClick={() => setFeedbackOpen(true)}
              style={{ background:'var(--gold)', color:'#09090B', border:'none', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', padding:'6px 10px', cursor:'pointer' }}>
              Feedback
            </button>
            <Link href="/search" style={{ color:'var(--text-dim)', textDecoration:'none', fontSize:'18px', padding:'4px 8px' }}>⌕</Link>
            <ThemeToggle />
            <button onClick={() => setMenuOpen(!menuOpen)}
              style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-muted)', padding:'7px 14px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', letterSpacing:'0.05em' }}>
              {menuOpen ? '✕ CLOSE' : '☰ MENU'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Mobile backdrop ── */}
      {menuOpen && (
        <div onClick={() => setMenuOpen(false)}
          style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:48, display:'none' }}
          className="nav-mob-backdrop" />
      )}

      {/* ── Mobile sheet — bottom drawer with swipe-to-close ── */}
      <div className={`nav-mob-sheet${menuOpen ? ' open' : ''}`}
        style={{ display:'none', flexDirection:'column', background:'var(--bg)', borderTop:'2px solid var(--gold)', maxHeight:'82vh', overflowY:'auto', position:'fixed', bottom:0, left:0, right:0, zIndex:49, boxShadow:'0 -8px 60px rgba(0,0,0,0.95)', borderRadius:'16px 16px 0 0' }}
        onTouchStart={e => { touchStartY.current = e.touches[0].clientY }}
        onTouchEnd={e => { if (e.changedTouches[0].clientY - touchStartY.current > 60) setMenuOpen(false) }}>

        {/* Drag handle */}
        <div style={{ display:'flex', justifyContent:'center', padding:'10px 0 2px', flexShrink:0 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:'rgba(255,255,255,0.15)' }} />
        </div>

        {/* Home row */}
        <Link href="/" onClick={() => setMenuOpen(false)} className="mob-child"
          style={{ padding:'14px 16px', fontSize:'14px', fontWeight:700, color:'var(--gold)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:'8px' }}>
          ◉ Home
        </Link>

        {NAV.slice(1).filter(item => !hiddenNav.includes(item.label)).map(item => {
          const hasChildren = item.children?.length > 0
          const exp = mobileExpanded === item.label
          // Items with no children = direct link, no expand button, no "View All"
          if (!hasChildren) {
            return (
              <Link key={item.label} href={item.href} onClick={() => setMenuOpen(false)} className="mob-child"
                style={{ padding:'14px 16px', fontSize:'14px', fontWeight:700, color:'var(--text)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center' }}>
                {item.label}
              </Link>
            )
          }
          return (
            <div key={item.label}>
              <button className={`mob-section-btn${exp ? ' expanded' : ''}`}
                onClick={() => setMobileExpanded(exp ? null : item.label)}>
                <span className="mob-label">{item.label}</span>
                <span className="mob-arrow">▼</span>
              </button>
              {exp && (
                <div style={{ background:'var(--bg2)' }}>
                  {item.children.map(child => (
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

      {/* ── Feedback Modal ── */}
      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />

    </header>
  )
}
