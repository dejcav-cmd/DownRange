import Masthead from '../../../components/layout/Masthead'
import BreakingTicker from '../../../components/layout/BreakingTicker'
import Footer from '../../../components/layout/Footer'

export const metadata = { title: 'Search — DownRange' }

export default function SearchPage({ searchParams }) {
  const q = searchParams?.q || ''

  return (
    <>
      <BreakingTicker />
      <Masthead />

      <div className="page-hero" data-title="SEARCH">
        <div className="container">
          <h1 className="page-hero-title">Search</h1>
          <p className="page-hero-sub">Search news, laws, reviews, releases, and state guides</p>
        </div>
      </div>

      <div style={{ padding: '48px 0' }}>
        <div className="container-narrow">
          <form method="GET" action="/search" style={{ marginBottom: '40px' }}>
            <div style={{ display: 'flex', gap: '0' }}>
              <input
                name="q"
                defaultValue={q}
                placeholder="Search DownRange..."
                style={{
                  flex: 1, background: '#16191F', border: '1px solid #2A2F38',
                  borderRight: 'none', color: '#F0EDE6',
                  fontFamily: "'IBM Plex Sans', sans-serif", fontSize: '16px',
                  padding: '16px 20px', outline: 'none'
                }}
              />
              <button type="submit" className="btn-gold" style={{ flexShrink: 0 }}>Search →</button>
            </div>
          </form>

          {q && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', color: '#6B7280', marginBottom: '24px' }}>
              Searching for: <span style={{ color: '#C8922A' }}>"{q}"</span>
              <span style={{ marginLeft: '12px' }}>Connect Algolia to enable full-text search</span>
            </div>
          )}

          {!q && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
              {[
                { label: 'Latest Firearms News', href: '/news' },
                { label: 'State Firearms Laws', href: '/state-hub' },
                { label: 'Gun Reviews', href: '/reviews' },
                { label: 'New Releases', href: '/releases' },
                { label: 'Federal Legislation', href: '/laws?level=federal' },
                { label: 'Ammo Price Tracker', href: '/market' },
              ].map(item => (
                <a key={item.href} href={item.href}
                  style={{ padding: '16px 20px', background: '#16191F', border: '1px solid #1F2428', textDecoration: 'none', color: '#9CA3AF', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 600, letterSpacing: '0.08em', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'border-color 0.2s' }}>
                  {item.label}
                  <span style={{ color: '#C8922A' }}>→</span>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
