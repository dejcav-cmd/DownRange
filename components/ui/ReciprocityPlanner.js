'use client'
import { useState } from 'react'

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY']
const STATE_NAMES = { AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming' }

export default function ReciprocityPlanner({ stateProfiles = [] }) {
  const [homeState, setHomeState] = useState('')
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  function check() {
    if (!homeState) return
    setLoading(true)
    setTimeout(() => {
      const profile = stateProfiles.find(s => s.abbr === homeState)
      const honored = profile?.reciprocityStates || []
      const constitutionalStates = stateProfiles.filter(s => s.constitutionalCarry).map(s => s.abbr)
      setResult({ homeState, honored, constitutionalStates, profile })
      setLoading(false)
    }, 300)
  }

  const allHonored = result ? [...new Set([...result.honored, ...result.constitutionalStates])].filter(s => s !== homeState).sort() : []
  const notHonored = US_STATES.filter(s => s !== homeState && !allHonored.includes(s))

  return (
    <div style={{ background: '#0D1117', border: '1px solid var(--border)', padding: '28px' }}>
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: '#C8922A', letterSpacing: '0.05em', marginBottom: '8px' }}>
          CCW RECIPROCITY PLANNER
        </div>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: '#4B5563' }}>
          Select your home state to see where your permit is honored
        </p>
      </div>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select value={homeState} onChange={e => setHomeState(e.target.value)}
          style={{ flex: 1, minWidth: '180px', background: '#111318', border: '1px solid var(--border)', color: homeState ? '#F5F5F3' : '#4B5563', padding: '10px 14px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '13px' }}>
          <option value="">Select your home state...</option>
          {US_STATES.map(s => <option key={s} value={s}>{STATE_NAMES[s]} ({s})</option>)}
        </select>
        <button onClick={check} disabled={!homeState || loading}
          style={{ background: '#C8922A', color: '#000', border: 'none', padding: '10px 24px', fontFamily: "'IBM Plex Mono',monospace", fontWeight: 700, fontSize: '13px', cursor: 'pointer', opacity: !homeState ? 0.5 : 1 }}>
          {loading ? 'CHECKING...' : 'CHECK →'}
        </button>
      </div>

      {result && (
        <div>
          {result.profile?.constitutionalCarry && (
            <div style={{ padding: '10px 16px', background: '#001A0A', border: '1px solid #166534', marginBottom: '20px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '12px', color: '#34D399' }}>
              ✓ {STATE_NAMES[homeState]} is a CONSTITUTIONAL CARRY state — no permit required to carry in this state.
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#34D399', letterSpacing: '0.12em', marginBottom: '12px', fontWeight: 700 }}>
                ✓ HONORED IN {allHonored.length} STATES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {allHonored.map(s => (
                  <a key={s} href={`/state-hub/${s.toLowerCase()}`}
                    style={{ background: '#001A0A', border: '1px solid #166534', color: '#34D399', padding: '4px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', textDecoration: 'none' }}>
                    {s}
                  </a>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#EF4444', letterSpacing: '0.12em', marginBottom: '12px', fontWeight: 700 }}>
                ✗ NOT HONORED IN {notHonored.length} STATES
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {notHonored.map(s => (
                  <a key={s} href={`/state-hub/${s.toLowerCase()}`}
                    style={{ background: '#1A0000', border: '1px solid #7F1D1D', color: '#EF4444', padding: '4px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', textDecoration: 'none' }}>
                    {s}
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginTop: '16px', fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#374151', borderTop: '1px solid var(--border)', paddingTop: '12px' }}>
            ⚠ Always verify reciprocity before traveling — laws change. Click any state for full law details.
          </div>
        </div>
      )}
    </div>
  )
}
