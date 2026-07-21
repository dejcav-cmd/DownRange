'use client'

import { useState, useMemo } from 'react'

// ── Design tokens ─────────────────────────────────────────────────────────────
const CAT_COLOR = {
  pistol:      '#60A5FA',
  rifle:       '#34D399',
  shotgun:     '#FBBF24',
  ammo:        '#C8922A',
  optics:      '#A78BFA',
  nfa:         '#EF4444',
  gear:        '#9CA3AF',
  accessories: '#C084FC',
}

const CAT_LABEL = {
  pistol:      'Pistol',
  rifle:       'Rifle',
  shotgun:     'Shotgun',
  ammo:        'Ammo',
  optics:      'Optics',
  nfa:         'NFA',
  gear:        'Gear',
  accessories: 'Accessories',
}

const SORT_OPTIONS = [
  { value: 'featured', label: 'Featured First' },
  { value: 'value',    label: 'Highest Value'  },
  { value: 'ending',   label: 'Ending Soon'    },
  { value: 'newest',   label: 'Newest'         },
]

// ── Data cleaning ─────────────────────────────────────────────────────────────
function cleanTitle(t) {
  if (!t) return ''
  return t
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // strip markdown links
    .replace(/\[|\]/g, '')                    // strip orphan brackets
    .replace(/\*/g, '')                       // strip bold markers
    .replace(/\s+/g, ' ')
    .trim()
}

function isJunk(g) {
  const t = cleanTitle(g.title || '').toLowerCase()
  if (!t || t.length < 6) return true
  if (t === 'giveaways' || t === 'various' || t === 'contest' || t === 'sweepstakes') return true
  if (!g.entryUrl) return true
  return false
}

// ── Time helpers ──────────────────────────────────────────────────────────────
function getDaysLeft(endDate) {
  if (!endDate) return null
  const diff = new Date(endDate + 'T23:59:59Z') - Date.now()
  if (diff < 0) return -1
  return Math.ceil(diff / 86400000)
}

function DeadlinePill({ endDate }) {
  const days = getDaysLeft(endDate)
  if (days === null) return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 9, letterSpacing: '.1em', color: '#4B5563',
    }}>ONGOING</span>
  )
  if (days < 0) return null

  const label  = days === 0 ? 'ENDS TODAY' : days === 1 ? '1 DAY LEFT' : days <= 30 ? `${days}D LEFT` : `${Math.ceil(days / 7)}W LEFT`
  const urgent = days <= 3
  const soon   = days <= 7

  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 9, letterSpacing: '.1em', padding: '3px 8px',
      background: urgent ? 'rgba(239,68,68,.12)' : soon ? 'rgba(245,158,11,.1)' : 'rgba(200,146,42,.08)',
      color:      urgent ? '#EF4444' : soon ? '#F59E0B' : '#C8922A',
      border:     `1px solid ${urgent ? 'rgba(239,68,68,.3)' : soon ? 'rgba(245,158,11,.25)' : 'rgba(200,146,42,.2)'}`,
    }}>{label}</span>
  )
}

// ── Giveaway card ─────────────────────────────────────────────────────────────
function GiveawayCard({ g, spotlight }) {
  const cat      = g.category || 'accessories'
  const catColor = CAT_COLOR[cat] || '#9CA3AF'
  const catLabel = CAT_LABEL[cat] || cat.toUpperCase()
  const value    = g.value || 0
  const valueColor = value >= 5000 ? '#22C55E' : value >= 1000 ? '#C8922A' : '#9CA3AF'

  return (
    <a
      href={g.entryUrl}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'flex', flexDirection: 'column',
        background:  spotlight ? 'rgba(200,146,42,.05)' : 'var(--bg2)',
        border:      `1px solid ${spotlight ? 'rgba(200,146,42,.4)' : 'var(--border)'}`,
        padding:     spotlight ? '20px 22px' : '16px 18px',
        textDecoration: 'none',
        position: 'relative',
        transition: 'border-color .15s',
        minHeight: spotlight ? 180 : 'auto',
      }}
    >
      {/* Featured ribbon */}
      {g.featured && (
        <div style={{
          position: 'absolute', top: 0, right: 0,
          background: 'var(--gold)', padding: '3px 10px',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 8, letterSpacing: '.14em', color: '#000', fontWeight: 700,
        }}>⭐ FEATURED</div>
      )}

      {/* Category + deadline row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <span style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9, letterSpacing: '.1em',
          color: catColor,
          border: `1px solid ${catColor}35`,
          padding: '2px 8px',
          textTransform: 'uppercase',
        }}>{catLabel}</span>
        <DeadlinePill endDate={g.endDate} />
      </div>

      {/* Title */}
      <div style={{
        fontFamily: "'Barlow Condensed', sans-serif",
        fontSize: spotlight ? 17 : 15,
        fontWeight: 700,
        color: 'var(--text)',
        lineHeight: 1.3,
        flex: 1,
        marginBottom: 8,
        paddingRight: g.featured ? 70 : 0,
      }}>{g.title}</div>

      {/* Sponsor */}
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: 9, letterSpacing: '.08em',
        color: 'var(--text-dim)',
        textTransform: 'uppercase',
        marginBottom: spotlight ? 16 : 14,
      }}>{g.sponsor || 'Various'}</div>

      {/* Bottom row: value + CTA */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <div>
          {value > 0 ? (
            <span style={{
              fontFamily: "'Bebas Neue', cursive",
              fontSize: spotlight ? '1.25rem' : '1.1rem',
              color: valueColor,
              letterSpacing: '.05em',
            }}>${value.toLocaleString()}</span>
          ) : (
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, color: '#374151', letterSpacing: '.08em',
            }}>FREE ENTRY</span>
          )}
        </div>
        <span style={{
          fontFamily: "'Bebas Neue', cursive",
          fontSize: '.9rem', letterSpacing: '.1em',
          color: '#000', background: 'var(--gold)',
          padding: spotlight ? '6px 16px' : '5px 12px',
          flexShrink: 0,
        }}>ENTER ↗</span>
      </div>
    </a>
  )
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GiveawaysClient({ giveaways, isSeed, lastUpdated }) {
  const [activeCat, setActiveCat] = useState('all')
  const [sort, setSort]           = useState('featured')

  // Clean and dedupe
  const clean = useMemo(() =>
    giveaways
      .filter(g => !isJunk(g))
      .map(g => ({ ...g, title: cleanTitle(g.title), value: g.value || g.prizeValue || 0 })),
  [giveaways])

  // Category pills
  const cats = useMemo(() => {
    const found = [...new Set(clean.map(g => g.category).filter(Boolean))].sort()
    return ['all', ...found]
  }, [clean])

  // Filtered + sorted list
  const sorted = useMemo(() => {
    let list = activeCat === 'all' ? [...clean] : clean.filter(g => g.category === activeCat)
    if (sort === 'featured') list.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || (b.value || 0) - (a.value || 0))
    if (sort === 'value')    list.sort((a, b) => (b.value || 0) - (a.value || 0))
    if (sort === 'ending')   list.sort((a, b) => {
      const da = a.endDate ? getDaysLeft(a.endDate) : 999
      const db = b.endDate ? getDaysLeft(b.endDate) : 999
      return (da ?? 999) - (db ?? 999)
    })
    if (sort === 'newest') list.reverse()
    return list
  }, [clean, activeCat, sort])

  // Stats
  const spotlight    = useMemo(() => clean.filter(g => g.featured).slice(0, 4), [clean])
  const totalValue   = useMemo(() => clean.reduce((s, g) => s + (g.value || 0), 0), [clean])
  const expiringSoon = useMemo(() => clean.filter(g => {
    const d = getDaysLeft(g.endDate)
    return d !== null && d >= 0 && d <= 7
  }).length, [clean])

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

      {/* ── HERO ──────────────────────────────────────────────────────── */}
      <div style={{
        background: 'radial-gradient(ellipse at top, rgba(200,146,42,.11) 0%, transparent 60%)',
        borderBottom: '1px solid var(--border)',
        padding: '44px 24px 36px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 10, letterSpacing: '.2em', color: 'var(--gold)',
            textTransform: 'uppercase', marginBottom: 10,
          }}>
            Updated 3× Daily{isSeed ? ' · Sample Listings' : ''}
          </div>

          <h1 style={{
            fontFamily: "'Bebas Neue', cursive",
            fontSize: 'clamp(3rem,7vw,5.2rem)',
            color: 'var(--text)', letterSpacing: '.04em',
            lineHeight: 1, margin: '0 0 10px',
          }}>
            GUN <span style={{ color: 'var(--gold)' }}>GIVEAWAYS</span>
          </h1>

          <p style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: 15, color: 'var(--text-dim)',
            margin: '0 0 28px', maxWidth: 520, lineHeight: 1.5,
          }}>
            Free firearms, ammo &amp; gear from the top names in the industry —
            verified sources only. No spam. No sketchy links.
          </p>

          {/* Stat tiles */}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {[
              { v: clean.length,          l: 'Active'        },
              { v: spotlight.length,      l: 'Featured'      },
              { v: expiringSoon,          l: 'Expiring Soon' },
              { v: '$' + Math.round(totalValue / 1000) + 'K+', l: 'Total Value' },
            ].map(s => (
              <div key={s.l} style={{
                background: 'rgba(200,146,42,.06)',
                border: '1px solid rgba(200,146,42,.15)',
                padding: '10px 18px',
                minWidth: 80,
              }}>
                <div style={{
                  fontFamily: "'Bebas Neue', cursive",
                  fontSize: '1.6rem', color: 'var(--gold)', lineHeight: 1,
                }}>{s.v}</div>
                <div style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 8, letterSpacing: '.12em',
                  color: '#4B5563', textTransform: 'uppercase', marginTop: 3,
                }}>{s.l}</div>
              </div>
            ))}
          </div>

          {lastUpdated && (
            <div style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, color: '#374151',
              letterSpacing: '.06em', marginTop: 14,
            }}>LAST UPDATED · {lastUpdated}</div>
          )}
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 64px' }}>

        {/* ── FILTER BAR ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 8, flexWrap: 'wrap',
          alignItems: 'center', marginBottom: 32,
          paddingBottom: 18, borderBottom: '1px solid var(--border)',
        }}>
          {cats.map(cat => {
            const active = activeCat === cat
            const color  = cat === 'all' ? 'var(--gold)' : (CAT_COLOR[cat] || '#9CA3AF')
            return (
              <button
                key={cat}
                onClick={() => setActiveCat(cat)}
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 9, letterSpacing: '.12em',
                  textTransform: 'uppercase',
                  padding: '5px 13px',
                  cursor: 'pointer',
                  border:      `1px solid ${active ? color : 'var(--border)'}`,
                  background:  active ? `${color}18` : 'transparent',
                  color:       active ? color : 'var(--text-dim)',
                  transition: 'all .12s',
                }}
              >
                {cat === 'all' ? 'ALL' : (CAT_LABEL[cat] || cat).toUpperCase()}
                {cat !== 'all' && (
                  <span style={{ marginLeft: 5, opacity: .55 }}>
                    {clean.filter(g => g.category === cat).length}
                  </span>
                )}
              </button>
            )
          })}

          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 9, color: '#4B5563', letterSpacing: '.1em',
            }}>SORT</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 9, letterSpacing: '.08em',
                color: 'var(--text)', background: 'var(--bg2)',
                border: '1px solid var(--border)',
                padding: '5px 10px', cursor: 'pointer',
                textTransform: 'uppercase',
              }}
            >
              {SORT_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>

        {/* ── SPOTLIGHT (featured, only when showing all) ──────────────── */}
        {spotlight.length > 0 && activeCat === 'all' && sort === 'featured' && (
          <div style={{ marginBottom: 36 }}>
            <SectionLabel gold>Spotlight Giveaways</SectionLabel>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 12,
            }}>
              {spotlight.map(g => <GiveawayCard key={g._id} g={g} spotlight />)}
            </div>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 32 }} />
          </div>
        )}

        {/* ── ALL GIVEAWAYS ────────────────────────────────────────────── */}
        <div>
          <SectionLabel>
            {activeCat === 'all' ? 'All Giveaways' : (CAT_LABEL[activeCat] || activeCat)}
            <span style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '1rem', color: '#4B5563', marginLeft: 8 }}>
              ({sorted.length})
            </span>
          </SectionLabel>

          {sorted.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '56px 24px',
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11, color: '#374151', letterSpacing: '.1em',
            }}>
              NO ACTIVE GIVEAWAYS IN THIS CATEGORY
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: 10,
            }}>
              {sorted.map(g => <GiveawayCard key={g._id} g={g} />)}
            </div>
          )}
        </div>

        {/* ── DISCLAIMER ───────────────────────────────────────────────── */}
        <div style={{
          marginTop: 48,
          padding: '14px 18px',
          background: 'rgba(255,255,255,.02)',
          border: '1px solid var(--border)',
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 9, color: '#374151',
          lineHeight: 1.9, letterSpacing: '.05em',
        }}>
          DownRange does not operate these giveaways. All entries go directly to the sponsor.
          Read each giveaway&apos;s official rules before entering. Some links may be affiliate links.
        </div>

      </div>
    </main>
  )
}

// ── Tiny helper ───────────────────────────────────────────────────────────────
function SectionLabel({ children, gold }) {
  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: 10, letterSpacing: '.16em',
      textTransform: 'uppercase',
      color: gold ? 'var(--gold)' : 'var(--text-dim)',
      marginBottom: 14,
      display: 'flex', alignItems: 'center', gap: 10,
    }}>
      <span style={{
        display: 'inline-block', width: 16, height: 1,
        background: gold ? 'var(--gold)' : 'var(--border)',
        flexShrink: 0,
      }} />
      {children}
      <span style={{
        display: 'inline-block', flex: 1, height: 1,
        background: gold ? 'rgba(200,146,42,.2)' : 'var(--border)',
      }} />
    </div>
  )
}
