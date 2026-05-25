import Masthead from '../../../components/layout/Masthead'
import BreakingTicker from '../../../components/layout/BreakingTicker'
import Footer from '../../../components/layout/Footer'
import { fetchReleases, fetchBreakingAlerts } from '../../../sanity/lib/client'

export const metadata = { title: 'New Releases — DownRange', description: 'Latest new firearm model announcements, releases, and product launches.' }
export const revalidate = 3600

function ReleaseCard({ release }) {
  return (
    <a href={release.specUrl || '#'} target="_blank" rel="noreferrer"
      style={{ display: 'block', textDecoration: 'none' }}>
      <div className="card" style={{ width: '220px', flexShrink: 0 }}>
        <div style={{ width: '100%', height: '140px', background: '#16191F', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '40px', position: 'relative' }}>
          {release.productImage?.asset?.url ? (
            <img src={release.productImage.asset.url} alt={`${release.brand} ${release.model}`} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
          ) : '🔫'}
          {release.isNew && (
            <div style={{ position: 'absolute', top: '10px', left: '10px', background: '#B91C1C', color: '#fff', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '10px', fontWeight: 700, letterSpacing: '0.15em', padding: '2px 8px' }}>NEW</div>
          )}
        </div>
        <div style={{ padding: '14px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#C8922A', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>{release.brand}</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '22px', color: '#F0EDE6', letterSpacing: '0.03em', lineHeight: 1, marginBottom: '8px' }}>{release.model}</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
            {release.caliber && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', padding: '2px 7px', background: '#1C2028', border: '1px solid #2A2F38', color: '#6B7280' }}>{release.caliber}</span>}
            {release.actionType && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', padding: '2px 7px', background: '#1C2028', border: '1px solid #2A2F38', color: '#6B7280' }}>{release.actionType}</span>}
            {release.category && <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', padding: '2px 7px', background: '#1C2028', border: '1px solid #2A2F38', color: '#6B7280' }}>{release.category}</span>}
          </div>
          {release.msrp && (
            <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '20px', color: '#C8922A', letterSpacing: '0.05em' }}>
              ${release.msrp.toLocaleString()}
            </div>
          )}
        </div>
      </div>
    </a>
  )
}

export default async function ReleasesPage() {
  const [releases, alerts] = await Promise.all([
    fetchReleases(40).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const brands = [...new Set(releases.map(r => r.brand))].filter(Boolean)
  const newOnly = releases.filter(r => r.isNew)
  const recent = releases.filter(r => !r.isNew)

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="RELEASES">
        <div className="container">
          <h1 className="page-hero-title">New Releases</h1>
          <p className="page-hero-sub">Latest firearm announcements · {releases.length} models tracked · Updated hourly</p>
        </div>
      </div>

      <div style={{ padding: '32px 0' }}>
        <div className="container">

          {/* Just Dropped */}
          {newOnly.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <div className="section-header">
                <h2 className="section-title">Just Dropped</h2>
                <div className="live-badge"><span className="pulse-dot" />New This Week</div>
                <div className="section-rule" />
              </div>
              <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                {newOnly.map(r => <ReleaseCard key={r._id} release={r} />)}
              </div>
            </div>
          )}

          {/* By brand */}
          {brands.slice(0, 6).map(brand => {
            const brandReleases = releases.filter(r => r.brand === brand)
            return (
              <div key={brand} style={{ marginBottom: '40px' }}>
                <div className="section-header">
                  <h2 className="section-title">{brand}</h2>
                  <div className="section-rule" />
                  <div className="section-badge">{brandReleases.length} Models</div>
                </div>
                <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
                  {brandReleases.map(r => <ReleaseCard key={r._id} release={r} />)}
                </div>
              </div>
            )
          })}

          {releases.length === 0 && (
            <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280', fontFamily: "'IBM Plex Mono', monospace" }}>
              Release data loading. Agent populates hourly.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
