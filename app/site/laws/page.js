import Masthead from '../../../components/layout/Masthead'
import BreakingTicker from '../../../components/layout/BreakingTicker'
import Footer from '../../../components/layout/Footer'
import { fetchLegislation, fetchBreakingAlerts } from '../../../sanity/lib/client'

export const metadata = { title: 'Laws & Legislation — DownRange' }
export const revalidate = 3600

const STATUS_CONFIG = {
  passed: { label: 'PASSED', cls: 'status-passed' },
  failed: { label: 'FAILED', cls: 'status-failed' },
  pending: { label: 'PENDING', cls: 'status-pending' },
  challenged: { label: 'CHALLENGED', cls: 'status-challenged' },
  advancing: { label: 'ADVANCING', cls: 'status-advancing' },
  signed: { label: 'SIGNED', cls: 'status-passed' },
  vetoed: { label: 'VETOED', cls: 'status-failed' },
}

function LegislationCard({ bill }) {
  const sc = STATUS_CONFIG[bill.status] || STATUS_CONFIG.pending
  const isUrgent = bill.urgent || bill.status === 'challenged'

  return (
    <a href={bill.url || '#'} target="_blank" rel="noreferrer"
      style={{
        display: 'block', textDecoration: 'none',
        background: '#111318', border: `1px solid ${isUrgent ? '#B91C1C' : '#1F2428'}`,
        borderLeft: isUrgent ? '3px solid #B91C1C' : '3px solid transparent',
        padding: '16px', transition: 'border-color 0.2s',
      }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: bill.level === 'federal' ? '#60A5FA' : '#34D399', letterSpacing: '0.08em', border: `1px solid ${bill.level === 'federal' ? '#1e3a5f' : '#14532d'}`, padding: '2px 6px' }}>
            {bill.level === 'federal' ? 'FEDERAL' : bill.state}
          </span>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280' }}>{bill.billNumber}</span>
        </div>
        <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
      </div>
      <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '16px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.3, marginBottom: '6px' }}>
        {bill.title}
      </div>
      {bill.summary && (
        <div style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>
          {bill.summary.slice(0, 150)}{bill.summary.length > 150 ? '...' : ''}
        </div>
      )}
      {bill.lastActionDate && (
        <div style={{ marginTop: '8px', fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280' }}>
          Last action: {new Date(bill.lastActionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </div>
      )}
    </a>
  )
}

export default async function LawsPage({ searchParams }) {
  const level = searchParams?.level || null
  const [bills, alerts] = await Promise.all([
    fetchLegislation(40, level).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const federal = bills.filter(b => b.level === 'federal')
  const state = bills.filter(b => b.level === 'state')
  const challenged = bills.filter(b => b.status === 'challenged')
  const urgent = [...challenged, ...bills.filter(b => b.urgent)].slice(0, 5)

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="LAWS">
        <div className="container">
          <h1 className="page-hero-title">Laws & Legislation</h1>
          <p className="page-hero-sub">Federal and state firearms legislation · Updated every 2 hours · All 50 states tracked</p>
        </div>
      </div>

      <div style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="filter-tabs">
            <a href="/laws" className={`filter-tab ${!level ? 'active' : ''}`}>All</a>
            <a href="/laws?level=federal" className={`filter-tab ${level === 'federal' ? 'active' : ''}`}>Federal</a>
            <a href="/laws?level=state" className={`filter-tab ${level === 'state' ? 'active' : ''}`}>State</a>
          </div>

          <div className="sidebar-layout">
            <div>
              {/* Urgent / Challenged */}
              {urgent.length > 0 && (
                <div style={{ marginBottom: '32px' }}>
                  <div className="section-header">
                    <h2 className="section-title">Urgent / Challenged</h2>
                    <div className="live-badge"><span className="pulse-dot" />Active Legal Challenges</div>
                    <div className="section-rule" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {urgent.map(b => <LegislationCard key={b._id} bill={b} />)}
                  </div>
                </div>
              )}

              {/* Federal */}
              {(!level || level === 'federal') && (
                <div style={{ marginBottom: '32px' }}>
                  <div className="section-header">
                    <h2 className="section-title">Federal Legislation</h2>
                    <div className="section-rule" />
                    <div className="section-badge">{federal.length} Bills</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {federal.map(b => <LegislationCard key={b._id} bill={b} />)}
                  </div>
                </div>
              )}

              {/* State */}
              {(!level || level === 'state') && (
                <div>
                  <div className="section-header">
                    <h2 className="section-title">State Legislation</h2>
                    <div className="section-rule" />
                    <div className="section-badge">{state.length} Bills</div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                    {state.map(b => <LegislationCard key={b._id} bill={b} />)}
                  </div>
                </div>
              )}

              {bills.length === 0 && (
                <div style={{ padding: '60px', textAlign: 'center', color: '#6B7280', fontFamily: "'IBM Plex Mono', monospace" }}>
                  Legislative data loading. Agent populates every 2 hours.
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="sidebar">
              <div>
                <div className="widget-title"><div className="widget-accent" />Status Guide</div>
                {Object.entries(STATUS_CONFIG).slice(0, 6).map(([key, sc]) => (
                  <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 0', borderBottom: '1px solid #1F2428' }}>
                    <span className={`status-badge ${sc.cls}`}>{sc.label}</span>
                    <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                      {key === 'pending' ? 'In committee or introduced' :
                       key === 'advancing' ? 'Passed one chamber' :
                       key === 'passed' ? 'Signed into law' :
                       key === 'failed' ? 'Did not pass' :
                       key === 'challenged' ? 'Under legal challenge' :
                       key === 'signed' ? 'Presidential signature' : key}
                    </span>
                  </div>
                ))}
              </div>
              <div>
                <div className="widget-title"><div className="widget-accent" />Quick Access</div>
                {[
                  ['State Hub — All 50 States', '/state-hub'],
                  ['ATF Rules Database', '/laws?cat=atf'],
                  ['SCOTUS Tracker', '/laws?cat=scotus'],
                  ['Recent Signed Bills', '/laws?status=passed'],
                ].map(([label, href]) => (
                  <a key={href} href={href}
                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: '#16191F', border: '1px solid #1F2428', marginBottom: '6px', textDecoration: 'none', color: '#9CA3AF', fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 600, letterSpacing: '0.08em' }}>
                    {label} <span style={{ color: '#C8922A' }}>→</span>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
