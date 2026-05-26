'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/',       icon: '◉', label: 'Home'   },
  { href: '/news',   icon: '📰', label: 'News'   },
  { href: '/laws',   icon: '⚖', label: 'Laws'   },
  { href: '/deals',  icon: '🔥', label: 'Deals'  },
  { href: '/market', icon: '📊', label: 'Market' },
  { href: '/learn',  icon: '📚', label: 'Learn' },
]

export default function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav style={{
      display: 'none',
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45,
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }} className="mobile-tab-bar">
      <style>{`
        @media (max-width: 900px) { .mobile-tab-bar { display: flex !important; } }
        .mobile-tab-bar a { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 8px 4px 6px; text-decoration: none; gap: 2px; min-height: 52px; }
        .mobile-tab-bar .tab-icon { font-size: 18px; line-height: 1; }
        .mobile-tab-bar .tab-label { font-family: 'IBM Plex Mono', monospace; font-size: 9px; letter-spacing: 0.05em; }
      `}</style>
      {TABS.map(tab => {
        const active = tab.href === '/' ? pathname === '/' : pathname.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href}
            style={{ color: active ? 'var(--gold)' : 'var(--text-dim)' }}>
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
