import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import LawAssistant from '../../components/ui/LawAssistant'
import ReciprocityPlanner from '../../components/ui/ReciprocityPlanner'
import { fetchLegislation, fetchBreakingAlerts, fetchAllStateProfiles } from '../../sanity/lib/client'

export const metadata = { title: 'Laws & Legislation — DownRange', description: 'Federal and state firearms law tracker. Ask our AI law assistant about carry laws, reciprocity, and regulations.' }
export const revalidate = 600

const STATUS_COLORS = {
  'introduced':'#60A5FA','committee':'#FBBF24','passed':'#34D399','failed':'#EF4444','signed':'#34D399','vetoed':'#EF4444'
}

export default async function LawsPage() {
  const [legislation, alerts, stateProfiles] = await Promise.all([
    fetchLegislation(30).catch(()=>[]),
    fetchBreakingAlerts(5).catch(()=>[]),
    fetchAllStateProfiles().catch(()=>[]),
  ])

  const federal = legislation.filter(l => l.level === 'federal')
  const state   = legislation.filter(l => l.level === 'state')

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />
      <div className="page-hero" data-title="LAWS">
        <div className="container">
          <h1 className="page-hero-title">Laws & Legislation</h1>
          <p className="page-hero-sub">Federal and state firearms law tracker · AI law assistant · CCW reciprocity planner</p>
        </div>
      </div>

      <div style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '48px' }}>
            {/* AI Law Assistant */}
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px' }}>AI LAW ASSISTANT</div>
              <LawAssistant />
            </div>
            {/* Reciprocity Planner */}
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px' }}>CCW RECIPROCITY PLANNER</div>
              <ReciprocityPlanner stateProfiles={stateProfiles} />
            </div>
          </div>

          {/* Federal legislation */}
          {federal.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#C8922A', letterSpacing: '0.05em', marginBottom: '20px' }}>FEDERAL LEGISLATION</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {federal.map(bill => (
                  <div key={bill._id} style={{ background: '#111318', border: '1px solid #1F2428', padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto', gap: '16px', alignItems: 'start' }}>
                    <div>
                      <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', fontWeight: 700 }}>{bill.billNumber}</span>
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', background: '#1F2428', color: STATUS_COLORS[bill.status?.toLowerCase()] || '#9CA3AF', padding: '2px 8px', textTransform: 'uppercase' }}>
                          {bill.status}
                        </span>
                        {bill.impact && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#EF4444' }}>{bill.impact}</span>}
                      </div>
                      <h3 style={{ fontSize: '15px', fontWeight: 600, color: '#F0EDE6', marginBottom: '8px', lineHeight: 1.4 }}>{bill.title}</h3>
                      {bill.summary && <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6 }}>{bill.summary}</p>}
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563' }}>
                        {bill.lastActionDate ? new Date(bill.lastActionDate).toLocaleDateString() : ''}
                      </div>
                      {bill.url && <a href={bill.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'monospace', fontSize: '10px', color: '#60A5FA', display: 'block', marginTop: '4px' }}>VIEW →</a>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* State legislation */}
          {state.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#C8922A', letterSpacing: '0.05em', marginBottom: '20px' }}>STATE LEGISLATION</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {state.map(bill => (
                  <div key={bill._id} style={{ background: '#111318', border: '1px solid #1F2428', padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#C8922A' }}>{bill.state}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563' }}>{bill.billNumber}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: STATUS_COLORS[bill.status?.toLowerCase()] || '#9CA3AF', background: '#1F2428', padding: '1px 6px' }}>{bill.status}</span>
                    </div>
                    <p style={{ fontSize: '13px', color: '#D1D5DB', lineHeight: 1.4, fontWeight: 600, marginBottom: '6px' }}>{bill.title}</p>
                    {bill.summary && <p style={{ fontSize: '12px', color: '#6B7280', lineHeight: 1.5 }}>{bill.summary.slice(0, 120)}{bill.summary.length > 120 ? '…' : ''}</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {legislation.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#4B5563', fontFamily: 'monospace', fontSize: '13px' }}>
              Legislation data loads automatically via the laws feed. Check back soon.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
