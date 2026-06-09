import { createClient } from '@sanity/client'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export const metadata = {
  title: 'Gun Giveaways 2026 — Free Firearm Giveaways | DownRange',
  description: 'Active gun giveaways from top manufacturers, retailers, and 2A organizations. Win free firearms, ammo, and gear. Updated daily.',
  alternates: { canonical: 'https://downrangeco.com/giveaways' },
  openGraph: {
    title: 'Gun Giveaways 2026 — Win Free Firearms | DownRange',
    description: 'Active gun giveaways updated daily.',
    url: 'https://downrangeco.com/giveaways',
  },
}

export const revalidate = 0
export const dynamic = 'force-dynamic'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: true,
})

const CAT_COLOR = {
  pistol: '#60A5FA', rifle: '#34D399', shotgun: '#FBBF24',
  ammo: '#C8922A', gear: '#9CA3AF', accessories: '#C084FC',
  nfa: '#EF4444', optics: '#34D399',
}

const CAT_ICON = {
  pistol: '🔫', rifle: '🎯', shotgun: '💥', ammo: '🔴',
  optics: '🔭', nfa: '🔇', gear: '⚙️', accessories: '🛒',
}

function daysLeft(endDate) {
  if (!endDate) return null
  // Compare date-only (ignore time) so "ends today" shows correctly
  const end  = new Date(endDate + 'T23:59:59Z')
  const now  = new Date()
  const diff = end - now
  if (diff < 0) return 'ended'
  const days = Math.ceil(diff / 86400000)
  if (days === 0) return 'ends today'
  if (days === 1) return '1 day left'
  if (days <= 7)  return `${days} days left`
  if (days <= 30) return `${days}d left`
  const weeks = Math.ceil(days / 7)
  return `${weeks}w left`
}

export default async function GiveawaysPage() {
  let giveaways = []
  try {
    const [live, lastLog] = await Promise.all([
      sanity.fetch(
        `*[_type == "giveaway" && active == true && (endDate == null || endDate >= $today)] | order(featured desc, _createdAt desc) [0...100] {
          _id, title, sponsor, prize, entryUrl, category, sourceType, endDate, featured, value, prizeValue, imageUrl
        }`,
        { today: new Date().toISOString().split('T')[0] }
      ),
      sanity.fetch(
        `*[_type == "cronRun" && jobId == "giveaways"] | order(_createdAt desc) [0] { _createdAt, ok, added }`
      ).catch(() => null),
    ])
    // Normalize value field — agent saves prizeValue, old data may use value
    giveaways = live.map(g => ({ ...g, value: g.value || g.prizeValue || 0 }))
  } catch (e) { console.error('[giveaways page]', e.message); giveaways = [] }
  let lastUpdated = null
  if (typeof lastLog !== 'undefined' && lastLog?._createdAt) {
    const d = new Date(lastLog._createdAt)
    lastUpdated = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC'
  }

  const featured = giveaways.filter(g => g.featured)
  const regular = giveaways.filter(g => !g.featured)
  const cats = ['all', ...new Set(giveaways.map(g => g.category).filter(Boolean))]

  const totalValue = giveaways.reduce((s, g) => s + (g.value || 0), 0)

  return (
    <>
      <Masthead />

      <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>

        {/* Hero */}
        <div style={{
          background: 'radial-gradient(ellipse at top, rgba(200,146,42,.12) 0%, transparent 65%)',
          borderBottom: '1px solid var(--border)', padding: '48px 24px 32px',
        }}>
          <div style={{ maxWidth: 1200, margin: '0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16, marginBottom: 20 }}>
              <div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: 'var(--gold)', letterSpacing: '.18em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Updated Daily · {giveaways.length} Active Giveaway{giveaways.length !== 1 ? 's' : ''}
                </div>
                {lastUpdated && (
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563', letterSpacing: '.1em', marginBottom: 6 }}>
                    last updated {lastUpdated}
                  </div>
                )}
                <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(2.8rem,6vw,4.5rem)', color: 'var(--text)', lineHeight: 1, margin: 0, letterSpacing: '.04em' }}>
                  GUN <span style={{ color: 'var(--gold)' }}>GIVEAWAYS</span>
                </h1>
                <p style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, color: 'var(--text-dim)', marginTop: 8, maxWidth: 520 }}>
                  Free firearms, ammo, and gear from the top names in the industry. All giveaways verified — no spam, no sketchy sites.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                {[
                  ['🎯', giveaways.length, 'Active'],
                  ['⭐', featured.length, 'Featured'],
                  ['💰', '$' + totalValue.toLocaleString(), 'Total Value'],
                ].map(([icon, val, label]) => (
                  <div key={label} style={{ background: 'rgba(200,146,42,.06)', border: '1px solid rgba(200,146,42,.2)', padding: '12px 20px', textAlign: 'center', minWidth: 80 }}>
                    <div style={{ fontSize: 20 }}>{icon}</div>
                    <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.4rem', color: 'var(--gold)', lineHeight: 1 }}>{val}</div>
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563', letterSpacing: '.1em', textTransform: 'uppercase', marginTop: 2 }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 24px' }}>

          {/* Featured giveaways — top highlight row */}
          {featured.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--gold)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--gold)' }} />
                Featured Giveaways
                <span style={{ display: 'inline-block', flex: 1, height: 1, background: 'rgba(200,146,42,.2)' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(320px,1fr))', gap: 12 }}>
                {featured.map(g => (
                  <a key={g._id} href={g.entryUrl} target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration: 'none', display: 'block', background: 'rgba(200,146,42,.04)', border: '1px solid rgba(200,146,42,.3)', padding: '16px 20px', transition: 'border-color .15s' }}>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <div style={{ fontSize: 28, flexShrink: 0 }}>{CAT_ICON[g.category] || '🎁'}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: CAT_COLOR[g.category] || '#9ca3af', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 4 }}>
                          ⭐ FEATURED · {g.category}
                        </div>
                        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{g.title}</div>
                        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--text-dim)' }}>
                          🏆 {g.prize} {g.value ? `· ~$${g.value}` : ''} {daysLeft(g.endDate) ? `· ${daysLeft(g.endDate)}` : ''}
                        </div>
                      </div>
                      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '0.9rem', color: 'var(--gold)', letterSpacing: '.06em', flexShrink: 0 }}>ENTER ↗</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Main table */}
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--text-dim)', letterSpacing: '.15em', textTransform: 'uppercase', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ display: 'inline-block', width: 20, height: 1, background: 'var(--border)' }} />
            All Active Giveaways
            <span style={{ display: 'inline-block', flex: 1, height: 1, background: 'var(--border)' }} />
          </div>

          <div style={{ border: '1px solid var(--border)', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--gold)', background: 'rgba(200,146,42,.04)' }}>
                  {['', 'Giveaway', 'Prize', 'Sponsor', 'Category', 'Value', 'Ends', 'Enter'].map((h, i) => (
                    <th key={i} style={{
                      fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: 'var(--gold)',
                      letterSpacing: '.12em', textTransform: 'uppercase', padding: '10px 14px',
                      textAlign: i === 0 ? 'center' : 'left', whiteSpace: 'nowrap', fontWeight: 700,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...featured, ...regular].map((g, idx) => {
                  const dl = daysLeft(g.endDate)
                  const urgent = dl && dl !== 'ended' && g.endDate && (new Date(g.endDate + 'T23:59:59Z') - Date.now()) < 4 * 86400000
                  const catColor = CAT_COLOR[g.category] || '#9CA3AF'
                  return (
                    <tr key={g._id} style={{
                      borderBottom: '1px solid rgba(30,41,59,.5)',
                      background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,.01)',
                      transition: 'background .1s',
                    }}>
                      {/* Icon */}
                      <td style={{ padding: '10px 14px', textAlign: 'center', fontSize: 18 }}>
                        {CAT_ICON[g.category] || '🎁'}
                      </td>
                      {/* Title */}
                      <td style={{ padding: '10px 14px', maxWidth: 300 }}>
                        <a href={g.entryUrl} target="_blank" rel="noopener noreferrer"
                          style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--text)', textDecoration: 'none', lineHeight: 1.3, display: 'block' }}>
                          {g.title}
                          {g.featured && <span style={{ marginLeft: 6, fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, color: 'var(--gold)', letterSpacing: '.08em' }}>⭐</span>}
                        </a>
                      </td>
                      {/* Prize */}
                      <td style={{ padding: '10px 14px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#9ca3af', maxWidth: 220, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {g.prize || '—'}
                      </td>
                      {/* Sponsor */}
                      <td style={{ padding: '10px 14px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: 'var(--text-dim)', whiteSpace: 'nowrap' }}>
                        {g.sponsor || '—'}
                      </td>
                      {/* Category */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-block', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9,
                          color: catColor, border: `1px solid ${catColor}33`, padding: '2px 7px',
                          letterSpacing: '.08em', textTransform: 'uppercase', whiteSpace: 'nowrap',
                        }}>{g.category || 'gear'}</span>
                      </td>
                      {/* Value */}
                      <td style={{ padding: '10px 14px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: g.value >= 500 ? '#22c55e' : '#6b7280', whiteSpace: 'nowrap' }}>
                        {g.value ? `$${g.value.toLocaleString()}` : '—'}
                      </td>
                      {/* End date */}
                      <td style={{ padding: '10px 14px', whiteSpace: 'nowrap' }}>
                        {dl ? (
                          <span style={{
                            fontFamily: "'IBM Plex Mono',monospace", fontSize: 9,
                            color: dl === 'ended' ? '#4b5563' : urgent ? '#ef4444' : '#f59e0b',
                            background: dl === 'ended' ? 'transparent' : urgent ? 'rgba(239,68,68,.08)' : 'rgba(245,158,11,.06)',
                            padding: '2px 6px', letterSpacing: '.06em',
                          }}>{dl.toUpperCase()}</span>
                        ) : (
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#374151' }}>ONGOING</span>
                        )}
                      </td>
                      {/* CTA */}
                      <td style={{ padding: '10px 14px' }}>
                        <a href={g.entryUrl} target="_blank" rel="noopener noreferrer"
                          style={{
                            display: 'inline-block', fontFamily: "'Bebas Neue',cursive", fontSize: '0.85rem',
                            letterSpacing: '.08em', color: '#000', background: 'var(--gold)',
                            padding: '5px 12px', textDecoration: 'none', whiteSpace: 'nowrap',
                            transition: 'opacity .12s',
                          }}>ENTER ↗</a>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Disclaimer */}
          <div style={{ marginTop: 24, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#374151', lineHeight: 1.6 }}>
            DownRange does not run these giveaways. All entries go directly to the sponsor. Read each giveaway&apos;s official rules before entering. Some links may be affiliate links.
          </div>

        </div>
      </main>
      <Footer />
    </>
  )
}
