'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/',       icon: '◉',  label: 'Home'   },
  { href: '/news',   icon: '📰', label: 'News'   },
  { href: '/search', icon: '⌕',  label: 'Search' },
  { href: '/learn',  icon: '📚', label: 'Learn'  },
]

export default function MobileTabBar() {
  const pathname = usePathname()

  return (
    <nav className="mobile-tab-bar" style={{
      display: 'none',
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 45,
      background: 'rgba(9,9,11,0.97)',
      borderTop: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
    }}>
      <style>{`
        @media (max-width: 900px) {
          .mobile-tab-bar { display: flex !important; }
        }
        .mobile-tab-bar a {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 8px 4px 6px;
          text-decoration: none;
          gap: 3px;
          min-height: 56px;
          position: relative;
          -webkit-tap-highlight-color: transparent;
          touch-action: manipulation;
          transition: color 0.15s;
        }
        .mobile-tab-bar a.active::before {
          content: '';
          position: absolute;
          top: 0; left: 20%; right: 20%;
          height: 2px;
          background: var(--gold);
          border-radius: 0 0 2px 2px;
        }
        .mobile-tab-bar .tab-icon {
          font-size: 19px;
          line-height: 1;
        }
        .mobile-tab-bar .tab-label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.04em;
          font-weight: 500;
        }
        /* Search icon styling */
        .mobile-tab-bar .search-icon {
          font-size: 22px;
          font-weight: 300;
          line-height: 1;
          font-family: system-ui, sans-serif;
        }
      `}</style>
      {TABS.map(tab => {
        const active = tab.href === '/'
          ? pathname === '/'
          : pathname.startsWith(tab.href)
        return (
          <Link key={tab.href} href={tab.href}
            className={active ? 'active' : ''}
            style={{ color: active ? 'var(--gold)' : '#4B5563' }}>
            {tab.href === '/search'
              ? <span className="search-icon">⌕</span>
              : <span className="tab-icon">{tab.icon}</span>
            }
            <span className="tab-label">{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
