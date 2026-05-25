'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { label: 'Home', href: '/', exact: true },
  { label: 'News', href: '/news' },
  { label: 'Breaking', href: '/news?cat=breaking', hot: true },
  { label: 'Laws', href: '/laws' },
  { label: 'Reviews', href: '/reviews' },
  { label: 'New Releases', href: '/releases' },
  { label: 'State Hub', href: '/state-hub' },
  { label: 'Market Watch', href: '/market' },
  { label: 'Video', href: '/video' },
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
      <div className="container">
        {/* Masthead top */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', padding: '20px 0 16px' }}>
          <div>
            <Link href="/" style={{
              fontFamily: "'Bebas Neue', cursive", fontSize: '72px',
              lineHeight: 0.85, color: '#C8922A', letterSpacing: '0.02em', display: 'block'
            }}>DOWNRANGE</Link>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280', letterSpacing: '0.18em', marginTop: '6px' }}>
              AMERICA'S FIREARMS INTELLIGENCE HUB · EST. 2026
            </div>
          </div>
          <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
            <span style={{ background: '#C8922A', color: '#09090B', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', padding: '3px 10px' }}>
              DAILY EDITION
            </span>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280' }}>{dateStr}</div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#C8922A' }}>📍 DOWNRANGECO.COM</div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ borderTop: '1px solid #1F2428', display: 'flex', alignItems: 'center' }}>
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
          <div style={{ padding: '0 16px', display: 'flex', alignItems: 'center', gap: '8px', borderLeft: '1px solid #1F2428' }}>
            <span style={{ color: '#6B7280', fontSize: '14px' }}>⌕</span>
            <Link href="/search" style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#6B7280' }}>Search</Link>
          </div>
        </nav>
      </div>
    </header>
  )
}
