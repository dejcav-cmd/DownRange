import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import StateHub from '../../components/sections/StateHub'
import StateMap from '../../components/sections/StateMap'
import { fetchAllStateProfiles, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'State Hub — DownRange', description: 'Firearms laws for all 50 states. Constitutional carry status, CCW, magazine limits, and more.', alternates: { canonical: 'https://www.downrangeco.com/laws/states' } }
export const revalidate = 1800 // 30 min

export default async function StateHubPage({ searchParams }) {
  const [profiles, alerts] = await Promise.all([
    fetchAllStateProfiles().catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  // Build keyed object for client component
  const profileMap = {}
  for (const p of profiles) { profileMap[p.abbr] = p }

  const ccStates = profiles.filter(p => p.ccStatus)
  const redFlagStates = profiles.filter(p => p.redFlagLaw)
  const magLimitStates = profiles.filter(p => p.magLimit)
  const awbStates = profiles.filter(p => p.awbStatus !== 'none')

  return (
    <>
      <Masthead />

      <div className="page-hero" data-title="STATE HUB">
        <div className="container">
          <h1 className="page-hero-title">State Firearms Hub</h1>
          <p className="page-hero-sub">Your state · Your rights · All 50 states tracked and updated daily</p>
        </div>
      </div>

      {/* National stats */}
      <div style={{ background: '#111318', borderBottom: '1px solid var(--border)', padding: '24px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
            {[
              { num: ccStates.length, label: 'Constitutional Carry States', color: '#4ADE80' },
              { num: 50 - ccStates.length, label: 'Permit Required States', color: '#EF4444' },
              { num: redFlagStates.length, label: 'Red Flag Law States', color: '#FCA5A5' },
              { num: magLimitStates.length, label: 'Magazine Limit States', color: '#FCD34D' },
            ].map(stat => (
              <div key={stat.label} style={{ textAlign: 'center', padding: '20px', background: '#16191F', border: '1px solid var(--border)' }}>
                <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '48px', color: stat.color, lineHeight: 1 }}>{stat.num}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '4px' }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive selector */}
      <div style={{ padding: '48px 0', borderBottom: '1px solid var(--border)' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Your State · Your Rights</h2>
            <div className="section-rule" />
            <div className="section-badge">All 50 States</div>
          </div>
          <div style={{ marginBottom:'24px' }}>
          <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:'32px' }}>
            {['Interactive Map','State Grid'].map((t,i) => (
              <a key={t} href={i===0?'/state-hub':'/state-hub?view=grid'}
                style={{ padding:'10px 20px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', textDecoration:'none',
                  color: (!searchParams?.view&&i===0)||searchParams?.view==='grid'&&i===1 ? '#C8922A' : '#4B5563',
                  borderBottom:`2px solid ${(!searchParams?.view&&i===0)||searchParams?.view==='grid'&&i===1 ? '#C8922A' : 'transparent'}` }}>
                {t}
              </a>
            ))}
          </div>
        </div>
        {searchParams?.view === 'grid' ? (
          <StateHub profiles={profileMap} />
        ) : (
          <StateMap profiles={profiles} />
        )}
        </div>
      </div>

      {/* Full state table */}
      <div style={{ padding: '48px 0' }}>
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">All States At A Glance</h2>
            <div className="section-rule" />
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #2A2F38' }}>
                  {['State','Abbr','Const. Carry','Red Flag','Mag Limit','Wait Period','AWB','Reciprocity'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#C8922A', fontWeight: 600, letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {profiles.sort((a,b) => a.name?.localeCompare(b.name)).map((p, i) => (
                  <tr key={p._id} style={{ borderBottom: '1px solid var(--border)', background: i % 2 === 0 ? '#111318' : '#16191F' }}>
                    <td style={{ padding: '8px 12px' }}>
                      <a href={`/state-hub/${p.abbr?.toLowerCase()}`} style={{ color: '#F0EDE6', textDecoration: 'none', fontWeight: 500 }}>{p.name}</a>
                    </td>
                    <td style={{ padding: '8px 12px', color: '#C8922A' }}>{p.abbr}</td>
                    <td style={{ padding: '8px 12px', color: p.ccStatus ? '#4ADE80' : '#EF4444' }}>{p.ccStatus ? 'YES' : 'NO'}</td>
                    <td style={{ padding: '8px 12px', color: p.redFlagLaw ? '#FCA5A5' : '#4ADE80' }}>{p.redFlagLaw ? 'YES' : 'NO'}</td>
                    <td style={{ padding: '8px 12px', color: p.magLimit ? '#FCA5A5' : '#4ADE80' }}>{p.magLimit ? `${p.magLimit}rd` : 'None'}</td>
                    <td style={{ padding: '8px 12px', color: p.waitPeriod > 0 ? '#FCD34D' : '#4ADE80' }}>{p.waitPeriod > 0 ? `${p.waitPeriod}d` : 'None'}</td>
                    <td style={{ padding: '8px 12px', color: p.awbStatus !== 'none' ? '#FCA5A5' : '#4ADE80' }}>{p.awbStatus === 'none' ? 'None' : p.awbStatus?.toUpperCase()}</td>
                    <td style={{ padding: '8px 12px', color: '#9CA3AF' }}>{p.reciprocityStates?.length || 0} states</td>
                  </tr>
                ))}
                {profiles.length === 0 && (
                  <tr><td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#6B7280' }}>State data loading...</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
