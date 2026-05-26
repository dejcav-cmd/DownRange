'use client'
import { useState } from 'react'

const US_STATES = [
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ',
  'NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT',
  'VA','WA','WV','WI','WY'
]

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',
  MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',
  NH:'New Hampshire',NJ:'New Jersey',NM:'New Mexico',NY:'New York',NC:'North Carolina',
  ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',
  RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',TN:'Tennessee',TX:'Texas',
  UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',
  WI:'Wisconsin',WY:'Wyoming'
}

function StatCard({ profile, abbr }) {
  if (!profile) return (
    <div style={{ padding: '40px', textAlign: 'center', color: '#6B7280', fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px' }}>
      Select a state to view its firearms laws
    </div>
  )

  const stats = [
    { label: 'Permit Required (CCW)', val: profile.ccStatus ? 'NO — CC STATE' : (profile.ccwPermit || 'YES'), danger: !profile.ccStatus, safe: profile.ccStatus },
    { label: 'Red Flag Law', val: profile.redFlagLaw ? 'IN EFFECT' : 'NONE', danger: profile.redFlagLaw, safe: !profile.redFlagLaw },
    { label: 'Magazine Limit', val: profile.magLimit ? `${profile.magLimit} ROUNDS` : 'NO LIMIT', danger: !!profile.magLimit, safe: !profile.magLimit },
    { label: 'Waiting Period', val: profile.waitPeriod ? `${profile.waitPeriod} DAYS` : 'NONE', danger: profile.waitPeriod > 0, safe: !profile.waitPeriod },
    { label: 'AWB / Restrictions', val: profile.awbStatus === 'none' ? 'NO RESTRICTIONS' : profile.awbStatus?.toUpperCase() || 'UNKNOWN', danger: profile.awbStatus !== 'none', safe: profile.awbStatus === 'none' },
    { label: 'Reciprocity States', val: profile.reciprocityStates?.length ? `${profile.reciprocityStates.length} STATES` : 'NONE', danger: false, safe: true },
  ]

  const statusMap = { passed: 'passed', failed: 'failed', pending: 'pending', challenged: 'challenged' }

  return (
    <div style={{ background: '#16191F', border: '1px solid #2A2F38', borderTop: '3px solid #C8922A', padding: '28px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px', paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '42px', color: '#F0EDE6', lineHeight: 1, letterSpacing: '0.04em' }}>
            {profile.name || STATE_NAMES[abbr]}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280' }}>
            {abbr} · {profile.region || 'United States'}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '4px' }}>Constitutional Carry</div>
          <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '28px', letterSpacing: '0.05em', color: profile.ccStatus ? '#4ADE80' : '#EF4444' }}>
            {profile.ccStatus ? 'YES' : 'NO'}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '20px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ background: '#1C2028', padding: '12px 14px' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{s.label}</div>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '15px', fontWeight: 600, color: s.danger ? '#FCA5A5' : s.safe ? '#4ADE80' : '#FCD34D' }}>
              {s.val}
            </div>
          </div>
        ))}
      </div>

      {profile.recentBills?.length > 0 && (
        <div>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#6B7280', marginBottom: '10px' }}>
            Recent Legislation
          </div>
          {profile.recentBills.slice(0, 3).map((bill, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px', padding: '8px 0', borderBottom: '1px solid var(--border)', fontSize: '13px', color: '#9CA3AF' }}>
              <span className={`status-badge status-${bill.status}`}>{bill.status?.toUpperCase()}</span>
              <span>{bill.billNumber} — {bill.title || bill.summary}</span>
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: '20px' }}>
        <a href={`/state-hub/${abbr.toLowerCase()}`} className="btn-outline">
          Full {profile.name || STATE_NAMES[abbr]} Guide →
        </a>
      </div>
    </div>
  )
}

export default function StateHub({ profiles = {} }) {
  const [selectedState, setSelectedState] = useState('WA')

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '48px', alignItems: 'start' }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '6px' }}>
            Select Your State
          </div>
          <select
            value={selectedState}
            onChange={e => setSelectedState(e.target.value)}
            style={{
              width: '100%', background: '#16191F', border: '1px solid #2A2F38',
              color: '#F0EDE6', fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: '16px', fontWeight: 600, letterSpacing: '0.05em',
              padding: '12px 16px', outline: 'none', cursor: 'pointer',
              appearance: 'none', WebkitAppearance: 'none',
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7280' stroke-width='1.5' fill='none'/%3E%3C/svg%3E")`,
              backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center'
            }}
          >
            {US_STATES.map(s => (
              <option key={s} value={s}>{STATE_NAMES[s]} ({s})</option>
            ))}
          </select>
        </div>

        {/* CC Status summary */}
        <div style={{ background: '#16191F', border: '1px solid var(--border)', padding: '16px' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '11px', fontWeight: 700, letterSpacing: '0.15em', color: '#6B7280', textTransform: 'uppercase', marginBottom: '12px' }}>
            Constitutional Carry · National Status
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
            <div style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '28px', color: '#4ADE80' }}>29</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280' }}>CC STATES</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(185,28,28,0.08)', border: '1px solid rgba(185,28,28,0.2)' }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '28px', color: '#EF4444' }}>21</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280' }}>PERMIT REQ</div>
            </div>
            <div style={{ textAlign: 'center', padding: '10px 6px', background: 'rgba(200,146,42,0.08)', border: '1px solid rgba(200,146,42,0.2)' }}>
              <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '28px', color: '#C8922A' }}>3</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280' }}>PENDING</div>
            </div>
          </div>
        </div>

        <a href="/state-hub" className="btn-ghost" style={{ justifyContent: 'center' }}>
          View All 50 States →
        </a>
      </div>

      <StatCard profile={profiles[selectedState]} abbr={selectedState} />
    </div>
  )
}
