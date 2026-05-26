'use client'
import ThemeToggle from '../ui/ThemeToggle'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Home',         href: '/', exact: true },
  { label: 'News',         href: '/news' },
  { label: 'Breaking',     href: '/news?cat=breaking', hot: true },
  { label: 'Laws',         href: '/laws' },
  { label: 'Deals',        href: '/deals', hot: false },
  { label: 'Reviews',      href: '/reviews' },
  { label: 'Releases',     href: '/releases' },
  { label: 'State Hub',    href: '/state-hub' },
  { label: 'Market',       href: '/market' },
  { label: 'Video',        href: '/video' },
  { label: 'Ranges',       href: '/ranges' },
  { label: 'Encyclopedia', href: '/guns' },
]

export default function Masthead() {
  const pathname = usePathname()
  const [dateStr, setDateStr] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const days = ['SUNDAY','MONDAY','TUESDAY','WEDNESDAY','THURSDAY','FRIDAY','SATURDAY']
    const months = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
    const d = new Date()
    setDateStr(`${days[d.getDay()]} · ${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`)
  }, [])

  return (
    <header style={{ background: '#111318', borderBottom: '1px solid #1F2428', position: 'sticky', top: 0, zIndex: 50 }}>
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-mobile { display: flex !important; }
          .masthead-title { font-size: 48px !important; }
          .masthead-right { display: none !important; }
        }
        @media (min-width: 769px) {
          .nav-mobile { display: none !important; }
          .nav-mobile-menu { display: none !important; }
        }
        .nav-mobile-menu.open { display: flex !important; }
      `}</style>
      <div className="container">
        {/* Masthead top */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 0 16px' }}>
          <div>
            <Link href="/" style={{ display: 'block', lineHeight: 1 }} aria-label="DownRange — Home">
              <svg width="320" height="80" viewBox="0 0 340 90" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                {/* Scope reticle */}
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
                {/* Wordmark */}
                <g transform="translate(84,12)">
                  <text x="0" y="46" fontFamily="Georgia, serif" fontSize="46" fontWeight="900" fill="#C8922A" letterSpacing="4">DOWNRANGE</text>
                  <text x="2" y="64" fontFamily="monospace" fontSize="11" fill="#6B7280" letterSpacing="8">INTELLIGENCE HUB</text>
                  <line x1="0" y1="72" x2="252" y2="72" stroke="#C8922A" strokeWidth="0.75" opacity="0.5"/>
                </g>
              </svg>
            </Link>
          </div>
          <div className="masthead-right" style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ background: '#C8922A', color: '#09090B', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', padding: '3px 10px' }}>
              DAILY EDITION
            </span>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280' }}>{dateStr}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#C8922A' }}>📍 DOWNRANGECO.COM</div>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav-desktop" style={{ borderTop: '1px solid #1F2428', display: 'flex', alignItems: 'center' }}>
          <ul style={{ display: 'flex', listStyle: 'none', flex: 1, flexWrap: 'wrap' }}>
            {NAV_ITEMS.map(item => {
              const isActive = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href.split('?')[0] + '/')
              return (
                <li key={item.href}>
                  <Link href={item.href} style={{
                    display: 'block',
                    fontFamily: "'Barlow Condensed', sans-serif",
                    fontSize: '13px', fontWeight: 600, letterSpacing: '0.12em',
                    textTransform: 'uppercase', padding: '14px 16px',
                    color: item.hot ? '#EF4444' : isActive ? '#F0EDE6' : '#9CA3AF',
                    borderBottom: isActive ? '2px solid #C8922A' : '2px solid transparent',
                    transition: 'color 0.2s, border-color 0.2s',
                  }}>
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
          <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #1F2428' }}>
            <Link href="/search" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#6B7280' }}>
              <span style={{ fontSize: '14px' }}>⌕</span> Search
            </Link>
            <ThemeToggle />
          </div>
        </nav>

        {/* Mobile menu */}
        <div className="nav-mobile" style={{ display: 'none', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderTop: '1px solid #1F2428' }}>
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
          <button onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: '1px solid #1F2428', color: '#9CA3AF', padding: '6px 12px', cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px' }}>
            {menuOpen ? '✕ CLOSE' : '☰ MENU'}
          </button>
        </div>
        <div className={`nav-mobile-menu${menuOpen ? ' open' : ''}`}
          style={{ display: 'none', flexDirection: 'column', borderTop: '1px solid #1F2428', paddingBottom: '12px' }}>
          {NAV_ITEMS.map(item => (
            <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              style={{ display: 'block', fontFamily: 'monospace', fontSize: '13px', padding: '12px 0', color: item.hot ? '#EF4444' : '#9CA3AF', borderBottom: '1px solid #1F2428', letterSpacing: '0.08em' }}>
              {item.label}
            </a>
          ))}
        </div>
      </div>
    </header>
  )
}
