'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const S = {
  mono: "'IBM Plex Mono', monospace",
  sans: "'IBM Plex Sans', sans-serif",
  bebas: "'Bebas Neue', sans-serif",
  cond: "'Barlow Condensed', sans-serif",
}

const STATE_NAMES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',
  CT:'Connecticut',DE:'Delaware',FL:'Florida',GA:'Georgia',HI:'Hawaii',ID:'Idaho',
  IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',
  ME:'Maine',MD:'Maryland',MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',
  MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',
  OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',SD:'South Dakota',
  TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',
  WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}

function Row({ label, value, good }) {
  const color = good === true ? '#34D399' : good === false ? '#EF4444' : '#9CA3AF'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 0', borderBottom: '1px solid #1a1a1a' }}>
      <span style={{ fontFamily: S.mono, fontSize: 11, color: '#6B7280', letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontFamily: S.mono, fontSize: 12, color, fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{value || '—'}</span>
    </div>
  )
}

export default function MyStateClient({ profiles, profileMap, reciprocityMatrix, alerts }) {
  const [abbr, setAbbr] = useState('TX')
  const [detected, setDetected] = useState(null)
  const [view, setView] = useState('laws') // 'laws' | 'reciprocity' | 'states'
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => {
        const code = d.region_code?.toUpperCase()
        if (code && STATE_NAMES[code]) { setDetected(code); setAbbr(code) }
      })
      .catch(() => {})
  }, [])

  const p = profileMap[abbr] || profiles[0]
  if (!p) return null
  const recip = reciprocityMatrix[abbr] || { honorsStates: [], honoredByStates: [] }
  const filtered = profiles.filter(s =>
    s.name?.toLowerCase().includes(search.toLowerCase()) || s.abbr?.toLowerCase().includes(search.toLowerCase())
  )

  const statName = STATE_NAMES[abbr] || p.name || abbr

  return (
    <div>
      {/* HERO */}
      <div style={{ background: '#0d0d10', borderBottom: '1px solid #1a1a1a', padding: '40px 0 0' }}>
        <div className="container">
          {/* Geo banner */}
          {detected && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#111318', border: '1px solid #1F2428', borderLeft: '3px solid #C8922A', padding: '8px 16px', marginBottom: 24, fontSize: 12, fontFamily: S.mono, color: '#e0e0e0' }}>
              📍 Detected: <strong style={{ color: '#C8922A' }}>{STATE_NAMES[detected]}</strong>
              {detected !== abbr && (
                <button onClick={() => setAbbr(detected)} style={{ background: '#C8922A', color: '#09090B', border: 'none', padding: '3px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: S.mono }}>
                  Switch →
                </button>
              )}
            </div>
          )}

          {/* State name + selector */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap', paddingBottom: 32 }}>
            <div>
              <div style={{ fontFamily: S.mono, fontSize: 10, color: '#4B5563', letterSpacing: '0.15em', marginBottom: 8 }}>YOUR STATE</div>
              <h1 style={{ fontFamily: S.bebas, fontSize: 'clamp(2.5rem, 6vw, 4.5rem)', color: '#fff', lineHeight: 0.92, margin: 0, letterSpacing: '0.02em' }}>
                {statName}<br />
                <span style={{ color: '#C8922A' }}>Gun Laws</span>
              </h1>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Switch state..."
                style={{ fontFamily: S.mono, fontSize: 12, background: '#111318', border: '1px solid #2A2F38', color: '#e0e0e0', padding: '8px 12px', width: 160 }}
              />
              {search && (
                <div style={{ position: 'absolute', marginTop: 40, background: '#16191F', border: '1px solid #2A2F38', zIndex: 50, maxHeight: 200, overflowY: 'auto', width: 200 }}>
                  {filtered.slice(0, 8).map(s => (
                    <button key={s.abbr} onClick={() => { setAbbr(s.abbr); setSearch('') }}
                      style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', background: 'transparent', border: 'none', color: '#e0e0e0', fontFamily: S.mono, fontSize: 12, cursor: 'pointer', borderBottom: '1px solid #1a1a1a' }}>
                      {s.abbr} — {s.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* View tabs */}
          <div style={{ display: 'flex', gap: 0, borderTop: '1px solid #1a1a1a' }}>
            {[['laws', 'Laws & Restrictions'], ['reciprocity', 'Reciprocity'], ['states', 'All States']].map(([k, label]) => (
              <button key={k} onClick={() => setView(k)}
                style={{ padding: '12px 20px', border: 'none', background: 'transparent', fontFamily: S.mono, fontSize: 11, letterSpacing: '0.06em', cursor: 'pointer', color: view === k ? '#C8922A' : '#4B5563', borderBottom: `2px solid ${view === k ? '#C8922A' : 'transparent'}`, transition: 'all 150ms' }}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ padding: '40px 0 64px' }}>

        {/* ── LAWS VIEW ── */}
        {view === 'laws' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>

            <div>
              <div style={{ fontFamily: S.mono, fontSize: 10, color: '#C8922A', letterSpacing: '0.15em', marginBottom: 20, paddingBottom: 8, borderBottom: '1px solid #1a1a1a' }}>CARRY LAWS</div>
              <Row label="Constitutional Carry" value={p.constitutionalCarry ? 'YES — No permit needed' : 'NO — Permit required'} good={!!p.constitutionalCarry} />
              <Row label="CCW Permit" value={p.ccwPermit} good={null} />
              <Row label="Open Carry" value={p.openCarry} good={p.openCarry === 'Legal'} />
              <Row label="Waiting Period" value={p.waitPeriod > 0 ? `${p.waitPeriod} days` : 'None'} good={!(p.waitPeriod > 0)} />
              <Row label="Background Check (Private)" value={p.bgcPrivate ? 'Required' : 'Not required'} good={!p.bgcPrivate} />

              <div style={{ fontFamily: S.mono, fontSize: 10, color: '#C8922A', letterSpacing: '0.15em', marginTop: 32, marginBottom: 20, paddingBottom: 8, borderBottom: '1px solid #1a1a1a' }}>RESTRICTIONS</div>
              <Row label="Magazine Limit" value={p.magLimit ? `${p.magLimit} rounds max` : 'None'} good={!p.magLimit} />
              <Row label="Assault Weapon Ban" value={p.awbStatus === 'none' || !p.awbStatus ? 'None' : p.awbStatus} good={p.awbStatus === 'none' || !p.awbStatus} />
              <Row label="Suppressors" value={p.suppressors ? 'Legal (NFA rules apply)' : 'Restricted'} good={!!p.suppressors} />
              <Row label="Red Flag Law" value={p.redFlagLaw ? 'Yes (ERPO)' : 'No'} good={!p.redFlagLaw} />

              {p.summary && (
                <div style={{ marginTop: 32, padding: 20, background: '#111318', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: '#4B5563', letterSpacing: '0.12em', marginBottom: 10 }}>SUMMARY</div>
                  <p style={{ fontFamily: S.sans, fontSize: 14, color: '#9CA3AF', lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>{p.summary}</p>
                </div>
              )}
            </div>

            <div>
              <div style={{ fontFamily: S.mono, fontSize: 10, color: '#C8922A', letterSpacing: '0.15em', marginBottom: 20, paddingBottom: 8, borderBottom: '1px solid #1a1a1a' }}>QUICK STATS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 32 }}>
                {[
                  { label: 'Freedom Rating', value: p.rating || 'N/A', color: p.rating?.startsWith('A') ? '#34D399' : p.rating?.startsWith('B') ? '#60A5FA' : p.rating?.startsWith('C') ? '#FBBF24' : '#EF4444' },
                  { label: 'Const. Carry', value: p.constitutionalCarry ? 'YES' : 'NO', color: p.constitutionalCarry ? '#34D399' : '#EF4444' },
                  { label: 'Mag Limit', value: p.magLimit ? `${p.magLimit}rd` : 'None', color: p.magLimit ? '#EF4444' : '#34D399' },
                  { label: 'AWB', value: p.awbStatus === 'none' || !p.awbStatus ? 'None' : 'Yes', color: p.awbStatus && p.awbStatus !== 'none' ? '#EF4444' : '#34D399' },
                  { label: 'Red Flag', value: p.redFlagLaw ? 'Yes' : 'No', color: p.redFlagLaw ? '#EF4444' : '#34D399' },
                  { label: 'Honors', value: `${recip.honorsStates.length} states`, color: '#60A5FA' },
                ].map(item => (
                  <div key={item.label} style={{ background: '#111318', border: '1px solid #1a1a1a', padding: '16px', textAlign: 'center' }}>
                    <div style={{ fontFamily: S.bebas, fontSize: 26, color: item.color, lineHeight: 1 }}>{item.value}</div>
                    <div style={{ fontFamily: S.mono, fontSize: 9, color: '#4B5563', letterSpacing: '0.1em', marginTop: 4, textTransform: 'uppercase' }}>{item.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent bills for this state */}
              {p.recentBills?.length > 0 && (
                <>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: '#C8922A', letterSpacing: '0.15em', marginBottom: 16, paddingBottom: 8, borderBottom: '1px solid #1a1a1a' }}>ACTIVE IN {abbr}</div>
                  {p.recentBills.slice(0, 3).map((b, i) => (
                    <div key={i} style={{ padding: '12px 0', borderBottom: '1px solid #1a1a1a' }}>
                      <div style={{ fontFamily: S.cond, fontSize: 15, fontWeight: 700, color: '#E5E5E5', marginBottom: 4 }}>{b.title}</div>
                      <div style={{ fontFamily: S.mono, fontSize: 10, color: '#6B7280' }}>{b.status}</div>
                    </div>
                  ))}
                </>
              )}

              {/* NRA Law Summary */}
              {p.nraLawSummary && (
                <div style={{ marginTop: 24, padding: 20, background: '#111318', border: '1px solid #1a1a1a' }}>
                  <div style={{ fontFamily: S.mono, fontSize: 10, color: '#4B5563', letterSpacing: '0.12em', marginBottom: 10 }}>SOURCE: NRA-ILA</div>
                  <p style={{ fontFamily: S.sans, fontSize: 13, color: '#9CA3AF', lineHeight: 1.8, margin: 0, textAlign: 'justify' }}>{p.nraLawSummary}</p>
                </div>
              )}

              <div style={{ marginTop: 24, display: 'flex', gap: 8 }}>
                <Link href={`/laws/${abbr.toLowerCase()}`} style={{ flex: 1, padding: '12px', background: '#C8922A', color: '#09090B', textAlign: 'center', fontFamily: S.mono, fontSize: 11, fontWeight: 700, textDecoration: 'none', letterSpacing: '0.08em' }}>
                  Full {abbr} Profile →
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── RECIPROCITY VIEW ── */}
        {view === 'reciprocity' && (
          <div>
            <div style={{ marginBottom: 32 }}>
              <h2 style={{ fontFamily: S.bebas, fontSize: 32, color: '#fff', margin: '0 0 8px', letterSpacing: '0.04em' }}>
                Where Your {abbr} Permit Is Honored
              </h2>
              <p style={{ fontFamily: S.sans, fontSize: 14, color: '#6B7280', margin: 0 }}>
                {recip.honorsStates.length > 0
                  ? `${abbr} permits are honored in ${recip.honorsStates.length} states. Click any state to see its laws.`
                  : `${abbr} does not have formal reciprocity with other states, or this state uses constitutional carry.`}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: 6 }}>
              {profiles.sort((a, b) => a.name?.localeCompare(b.name)).map(s => {
                const honors = recip.honorsStates.includes(s.abbr)
                return (
                  <button key={s.abbr} onClick={() => { setAbbr(s.abbr); setView('laws') }}
                    style={{ background: honors ? '#0A1F0A' : '#111318', border: `1px solid ${honors ? '#34D39940' : '#1a1a1a'}`, padding: '12px 8px', cursor: 'pointer', textAlign: 'center' }}>
                    <div style={{ fontFamily: S.mono, fontSize: 14, fontWeight: 700, color: honors ? '#34D399' : '#4B5563' }}>{s.abbr}</div>
                    <div style={{ fontFamily: S.mono, fontSize: 9, color: honors ? '#34D39980' : '#2A2F38', marginTop: 3 }}>{honors ? '✓ Honored' : 'No'}</div>
                  </button>
                )
              })}
            </div>
            <div style={{ marginTop: 24, padding: 16, background: '#111318', border: '1px solid #1a1a1a', fontFamily: S.mono, fontSize: 11, color: '#4B5563', lineHeight: 1.7 }}>
              ⚠ Reciprocity can change without notice. Always verify with your destination state before traveling.
            </div>
          </div>
        )}

        {/* ── ALL STATES VIEW ── */}
        {view === 'states' && (
          <div>
            <div style={{ marginBottom: 24, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search states..."
                style={{ fontFamily: S.mono, fontSize: 12, background: '#111318', border: '1px solid #2A2F38', color: '#e0e0e0', padding: '8px 12px', flex: 1, maxWidth: 300 }} />
              <span style={{ fontFamily: S.mono, fontSize: 11, color: '#4B5563' }}>{filtered.length} states</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
              {filtered.map(s => (
                <button key={s.abbr} onClick={() => { setAbbr(s.abbr); setView('laws') }}
                  style={{ background: s.abbr === abbr ? '#16191F' : '#111318', border: `1px solid ${s.abbr === abbr ? '#C8922A40' : '#1a1a1a'}`, padding: '16px', cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontFamily: S.cond, fontSize: 18, fontWeight: 700, color: s.abbr === abbr ? '#C8922A' : '#E5E5E5' }}>{s.name}</div>
                    <div style={{ fontFamily: S.mono, fontSize: 10, color: '#4B5563', marginTop: 4 }}>
                      {s.constitutionalCarry ? '✓ Const. Carry' : '○ Permit req.'} · {s.magLimit ? `${s.magLimit}rd limit` : 'No mag limit'}
                    </div>
                  </div>
                  <div style={{ fontFamily: S.bebas, fontSize: 28, color: s.rating?.startsWith('A') ? '#34D399' : s.rating?.startsWith('B') ? '#60A5FA' : s.rating?.startsWith('C') ? '#FBBF24' : '#EF4444' }}>
                    {s.rating || '?'}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
