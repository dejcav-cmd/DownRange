'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import EnhancedLawPanel from '../../components/EnhancedLawPanel'
import styles from './state-intel.module.css'

const STATE_NAMES = {
  'AL': 'Alabama', 'AK': 'Alaska', 'AZ': 'Arizona', 'AR': 'Arkansas',
  'CA': 'California', 'CO': 'Colorado', 'CT': 'Connecticut', 'DE': 'Delaware',
  'FL': 'Florida', 'GA': 'Georgia', 'HI': 'Hawaii', 'ID': 'Idaho',
  'IL': 'Illinois', 'IN': 'Indiana', 'IA': 'Iowa', 'KS': 'Kansas',
  'KY': 'Kentucky', 'LA': 'Louisiana', 'ME': 'Maine', 'MD': 'Maryland',
  'MA': 'Massachusetts', 'MI': 'Michigan', 'MN': 'Minnesota', 'MS': 'Mississippi',
  'MO': 'Missouri', 'MT': 'Montana', 'NE': 'Nebraska', 'NV': 'Nevada',
  'NH': 'New Hampshire', 'NJ': 'New Jersey', 'NM': 'New Mexico', 'NY': 'New York',
  'NC': 'North Carolina', 'ND': 'North Dakota', 'OH': 'Ohio', 'OK': 'Oklahoma',
  'OR': 'Oregon', 'PA': 'Pennsylvania', 'RI': 'Rhode Island', 'SC': 'South Carolina',
  'SD': 'South Dakota', 'TN': 'Tennessee', 'TX': 'Texas', 'UT': 'Utah',
  'VT': 'Vermont', 'VA': 'Virginia', 'WA': 'Washington', 'WV': 'West Virginia',
  'WI': 'Wisconsin', 'WY': 'Wyoming', 'DC': 'District of Columbia',
}

export default function StateIntelClient({
  profiles,
  profileMap,
  reciprocityMatrix,
  userState,
  alerts,
}) {
  const [selectedState, setSelectedState] = useState(userState || 'WA')
  const [detectedState, setDetectedState] = useState(null)
  const [showMap, setShowMap] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  // Geolocation detection on mount
  useEffect(() => {
    if (!userState && typeof window !== 'undefined') {
      // Try to get user's state from IP geolocation
      fetch('https://ipapi.co/json/')
        .then(r => r.json())
        .then(data => {
          const stateCode = data.region_code?.toUpperCase()
          if (stateCode && STATE_NAMES[stateCode]) {
            setDetectedState(stateCode)
            setSelectedState(stateCode)
          }
        })
        .catch(() => {
          // Fallback: default to WA
          setSelectedState('WA')
        })
    }
  }, [userState])

  const state = profileMap[selectedState]
  if (!state) return <div style={{ color: '#999' }}>State not found</div>

  const reciprocity = reciprocityMatrix[selectedState]
  const filteredStates = profiles.filter(p =>
    p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.abbr?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className={styles.container}>
      {/* Geolocation banner + alerts */}
      <div className={styles.alertBar}>
        {detectedState && detectedState !== selectedState && (
          <div className={styles.geoAlert}>
            📍 <strong>Your state: {STATE_NAMES[detectedState]}</strong>
            <button
              onClick={() => setSelectedState(detectedState)}
              style={{
                background: '#C8922A',
                color: '#09090B',
                border: 'none',
                padding: '4px 12px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: '600',
                cursor: 'pointer',
              }}
            >
              Go to {STATE_NAMES[detectedState]}
            </button>
          </div>
        )}

        {alerts.length > 0 && (
          <div className={styles.lawAlerts}>
            ⚡ <strong>Breaking Law Updates</strong>
            {alerts.slice(0, 2).map(a => (
              <span key={a._id} style={{ fontSize: '12px', color: '#FCA5A5' }}>
                {a.headline}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Search + State selector */}
      <div className={styles.selector}>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Search states..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              background: '#0d0d0f',
              border: '1px solid #1F2428',
              color: '#e0e0e0',
              fontSize: '14px',
              fontFamily: 'IBM Plex Mono',
            }}
          />
        </div>

        {/* Grid of states */}
        <div className={styles.stateGrid}>
          {filteredStates.map(p => (
            <button
              key={p.abbr}
              onClick={() => {
                setSelectedState(p.abbr)
                setSearchQuery('')
              }}
              className={`${styles.stateBtn} ${selectedState === p.abbr ? styles.active : ''}`}
            >
              <div style={{ fontSize: '14px', fontWeight: '700' }}>{p.abbr}</div>
              <div style={{ fontSize: '10px', color: '#808080' }}>{p.name}</div>
            </button>
          ))}
        </div>

        {/* View toggle */}
        <div className={styles.viewToggle}>
          <button
            onClick={() => setShowMap(true)}
            className={showMap ? styles.active : ''}
            style={{ flex: 1 }}
          >
            📊 Overview
          </button>
          <button
            onClick={() => setShowMap(false)}
            className={!showMap ? styles.active : ''}
            style={{ flex: 1 }}
          >
            🗺 Reciprocity Map
          </button>
        </div>
      </div>

      {/* Main content */}
      {showMap ? (
        <div className={styles.overview}>
          {/* Quick stats */}
          <div className={styles.quickStats}>
            <StatCard
              icon="🔫"
              label="Constitutional Carry"
              value={state.constitutionalCarry ? '✅ YES' : '❌ Permit Required'}
              color={state.constitutionalCarry ? '#34D399' : '#EF4444'}
            />
            <StatCard
              icon="📦"
              label="Magazine Limit"
              value={state.magLimit ? `${state.magLimit} rounds` : '✅ None'}
              color={state.magLimit ? '#FCA5A5' : '#34D399'}
            />
            <StatCard
              icon="🚫"
              label="AWB Status"
              value={state.awbStatus !== 'none' ? 'Banned' : 'None'}
              color={state.awbStatus !== 'none' ? '#FCA5A5' : '#34D399'}
            />
            <StatCard
              icon="⏱"
              label="Waiting Period"
              value={state.waitPeriod && state.waitPeriod > 0 ? `${state.waitPeriod} days` : 'None'}
              color={state.waitPeriod && state.waitPeriod > 0 ? '#FCD34D' : '#34D399'}
            />
            <StatCard
              icon="🏛"
              label="Red Flag Law"
              value={state.redFlagLaw ? 'Yes' : 'No'}
              color={state.redFlagLaw ? '#FCA5A5' : '#34D399'}
            />
            <StatCard
              icon="🗣"
              label="Reciprocity Count"
              value={`${reciprocity?.honorsStates?.length || 0} states`}
              color="#60A5FA"
            />
          </div>

          {/* Reciprocity details */}
          <div className={styles.reciprocityDetails}>
            <h3 style={{ fontSize: '16px', color: '#C8922A', marginBottom: '12px' }}>
              🔄 Reciprocity: Where Your {state.abbr} Permit Is Honored
            </h3>
            {reciprocity?.honorsStates?.length > 0 ? (
              <div className={styles.reciprocityList}>
                {reciprocity.honorsStates.map(stateCode => (
                  <button
                    key={stateCode}
                    onClick={() => setSelectedState(stateCode)}
                    style={{
                      background: '#1a1a1a',
                      border: '1px solid #2A2F38',
                      color: '#e0e0e0',
                      padding: '8px 12px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      cursor: 'pointer',
                      transition: 'all 200ms',
                    }}
                    onMouseEnter={e => {
                      e.target.style.background = '#2A2F38'
                      e.target.style.borderColor = '#C8922A'
                    }}
                    onMouseLeave={e => {
                      e.target.style.background = '#1a1a1a'
                      e.target.style.borderColor = '#2A2F38'
                    }}
                  >
                    ✓ {stateCode}
                  </button>
                ))}
              </div>
            ) : (
              <p style={{ color: '#808080', fontSize: '12px' }}>
                {state.abbr} permit not widely recognized. Check individual states for reciprocity.
              </p>
            )}
          </div>

          {/* Enhanced Law Panel */}
          <EnhancedLawPanel
            data={state.nraEnhancedData}
            stateName={state.name}
            stateCode={state.abbr}
          />
        </div>
      ) : (
        <div className={styles.reciprocityMap}>
          <h3 style={{ fontSize: '16px', color: '#C8922A', marginBottom: '16px' }}>
            🗺 Which States Honor {state.abbr} Permits?
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px' }}>
            {profiles.map(otherState => {
              const honorsThis =
                reciprocity?.honorsStates?.includes(otherState.abbr) ||
                reciprocityMatrix[otherState.abbr]?.honorsStates?.includes(selectedState)

              return (
                <button
                  key={otherState.abbr}
                  onClick={() => setSelectedState(otherState.abbr)}
                  style={{
                    background: honorsThis ? '#16191F' : '#0d0d0f',
                    border: `1px solid ${honorsThis ? '#C8922A' : '#2A2F38'}`,
                    color: honorsThis ? '#C8922A' : '#6B7280',
                    padding: '12px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: honorsThis ? '600' : '400',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <div style={{ fontSize: '14px', fontWeight: '700' }}>{otherState.abbr}</div>
                  <div style={{ fontSize: '10px' }}>
                    {honorsThis ? '✅ Honors' : '❌ Does not honor'}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Links to detailed pages */}
      <div className={styles.relatedLinks}>
        <Link href={`/state-hub/${selectedState.toLowerCase()}`}>
          📄 Full {state.name} Law Details
        </Link>
        <Link href="/laws?tab=state">
          📋 All State Legislation
        </Link>
        <Link href="/laws?tab=reciprocity">
          🗺 CCW Reciprocity (Legacy)
        </Link>
      </div>
    </div>
  )
}

function StatCard({ icon, label, value, color }) {
  return (
    <div
      style={{
        background: '#111318',
        border: '1px solid #2A2F38',
        padding: '16px',
        borderRadius: '4px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '20px', marginBottom: '8px' }}>{icon}</div>
      <div style={{ fontSize: '11px', color: '#808080', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{ fontSize: '14px', fontWeight: '600', color }}>{value}</div>
    </div>
  )
}
