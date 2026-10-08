'use client'

import { useState, useMemo } from 'react'
import PageHero from '../../components/home/PageHero'

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

function endLabel(endDate) {
  const days = getDaysLeft(endDate)
  if (days === null) return { text: 'Ongoing', sub: '', tone: 'n', sortKey: 99999 }
  if (days < 0) return { text: 'Ended', sub: '', tone: 'n', sortKey: 100000 }
  const date = new Date(endDate + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  const left = days === 0 ? 'Ends today' : days === 1 ? '1 day left' : `${days} days left`
  return { text: date, sub: left, tone: days <= 3 ? 'r' : days <= 7 ? 'y' : 'n', sortKey: days }
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GiveawaysClient({ giveaways, isSeed, lastUpdated }) {
  const [activeCat, setActiveCat] = useState('all')
  const [q, setQ]                 = useState('')
  const [soon, setSoon]           = useState(false)
  const [onlyFeatured, setOnlyFeatured] = useState(false)
  const [sort, setSort]           = useState({ k: 'featured', dir: -1 })

  const clean = useMemo(() =>
    giveaways
      .filter(g => !isJunk(g))
      .map(g => ({ ...g, title: cleanTitle(g.title), value: g.value || g.prizeValue || 0 })),
  [giveaways])

  const cats = useMemo(() => ['all', ...[...new Set(clean.map(g => g.category).filter(Boolean))].sort()], [clean])

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase()
    let list = clean.filter(g =>
      (activeCat === 'all' || g.category === activeCat) &&
      (!needle || g.title.toLowerCase().includes(needle) || (g.sponsor || '').toLowerCase().includes(needle)) &&
      (!soon || (getDaysLeft(g.endDate) !== null && getDaysLeft(g.endDate) >= 0 && getDaysLeft(g.endDate) <= 7)) &&
      (!onlyFeatured || g.featured)
    )
    const val = g => sort.k === 'title' ? g.title.toLowerCase() : sort.k === 'category' ? (g.category || '') : sort.k === 'value' ? (g.value || 0) : sort.k === 'ends' ? endLabel(g.endDate).sortKey : (g.featured ? 1 : 0) * 1e9 + (g.value || 0)
    return [...list].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * sort.dir })
  }, [clean, activeCat, q, soon, onlyFeatured, sort])

  const totalValue   = useMemo(() => clean.reduce((s, g) => s + (g.value || 0), 0), [clean])
  const featuredCount = useMemo(() => clean.filter(g => g.featured).length, [clean])
  const expiringSoon = useMemo(() => clean.filter(g => { const d = getDaysLeft(g.endDate); return d !== null && d >= 0 && d <= 7 }).length, [clean])

  const sortBy = k => setSort(s => s.k === k ? { k, dir: -s.dir } : { k, dir: k === 'title' || k === 'category' || k === 'ends' ? 1 : -1 })
  const arrow = k => sort.k === k ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''
  const reset = () => { setActiveCat('all'); setQ(''); setSoon(false); setOnlyFeatured(false) }
  const filtered = activeCat !== 'all' || q || soon || onlyFeatured

  return (
    <main style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <style>{`
        .gw-bar{background:var(--bg);border-bottom:1px solid var(--border);padding:16px 0}
        .gw-search{width:100%;max-width:340px;background:var(--bg2);border:1px solid var(--border-mid);color:var(--text);font:400 14px 'IBM Plex Mono',monospace;padding:11px 14px;border-radius:4px;outline:none}
        .gw-search:focus{border-color:var(--gold)}
        .gw-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
        .gw-chip{font:600 12px 'IBM Plex Mono',monospace;color:var(--text-muted);background:var(--bg2);border:1px solid var(--border-mid);border-radius:999px;padding:7px 13px;cursor:pointer;min-height:34px;text-transform:capitalize}
        .gw-chip:hover{border-color:var(--gold-dim);color:var(--text)}
        .gw-chip[aria-pressed="true"]{background:var(--gold);border-color:var(--gold);color:#09090B}
        .gw-sep{width:1px;background:var(--border-mid);margin:0 4px}
        .gw-count{font:400 11px 'IBM Plex Mono',monospace;color:var(--text-dim);margin:18px 0 10px;letter-spacing:.06em}
        .gw-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:6px}
        .gw-table{width:100%;border-collapse:collapse;font:400 13px 'IBM Plex Mono',monospace;min-width:760px}
        .gw-table th{background:var(--bg3);color:var(--gold);font:700 10.5px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;text-align:left;padding:13px 14px;border-bottom:2px solid var(--gold);cursor:pointer;white-space:nowrap;user-select:none}
        .gw-table th.nosort{cursor:default}
        .gw-table td{padding:12px 14px;border-bottom:1px solid var(--border);vertical-align:middle}
        .gw-table tbody tr:nth-child(even){background:rgba(255,255,255,.015)}
        .gw-table tbody tr:hover{background:rgba(200,146,42,.07)}
        .gw-title{font:700 17px/1.25 'Barlow Condensed',sans-serif;letter-spacing:.02em;color:var(--text)}
        .gw-by{font:400 11px 'IBM Plex Mono',monospace;color:var(--text-dim);text-transform:uppercase;letter-spacing:.06em;margin-top:3px}
        .gw-star{color:var(--gold);margin-right:6px}
        .gw-pill{display:inline-block;font:700 11px 'IBM Plex Mono',monospace;padding:3px 9px;border-radius:3px;border:1px solid currentColor;text-transform:uppercase;letter-spacing:.06em;white-space:nowrap}
        .gw-val{font-family:'Bebas Neue',cursive;font-size:24px;letter-spacing:.04em;line-height:1}
        .gw-end b{display:block;font-weight:600;color:var(--text)}
        .gw-end small{font-size:11px}
        .gw-t-r{color:#F87171}.gw-t-y{color:#FBBF24}.gw-t-n{color:var(--text-dim)}
        .gw-btn{display:inline-block;font:700 15px 'Barlow Condensed',sans-serif;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;color:#09090B;background:var(--gold);padding:9px 16px;border-radius:3px;white-space:nowrap;min-height:40px;box-sizing:border-box}
        .gw-btn:hover{background:var(--gold-light)}
        .gw-cards{display:none}
        .gw-card{background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:14px}
        .gw-card+.gw-card{margin-top:10px}
        .gw-card-m{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;margin:10px 0 12px}
        @media(max-width:760px){.gw-wrap{display:none}.gw-cards{display:block}.gw-search{max-width:none}}
      `}</style>

      <PageHero
        eyebrow={isSeed ? 'Giveaways · Sample listings' : 'Giveaways'}
        title={<>Gun <span>giveaways.</span></>}
        sub="Free firearms, ammo & gear from the top names in the industry. Verified sources only. No spam. No sketchy links.">
        <ul className="hh-chips">
          <li><b>{clean.length}</b><span>active</span></li>
          <li><b>{featuredCount}</b><span>featured</span></li>
          <li><b>{expiringSoon}</b><span>expiring soon</span></li>
          <li><b>{'$' + Math.round(totalValue / 1000) + 'K+'}</b><span>total value</span></li>
        </ul>
        {lastUpdated ? <div className="hh-eyebrow" style={{ marginTop: 14, marginBottom: 0 }}>Last updated · {lastUpdated}</div> : null}
      </PageHero>

      <div className="gw-bar">
        <div className="container">
          <input className="gw-search" type="search" placeholder="Search giveaways or sponsors…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search giveaways" />
          <div className="gw-chips" role="group" aria-label="Filter giveaways">
            {cats.map(cat => (
              <button key={cat} type="button" className="gw-chip" aria-pressed={activeCat === cat} onClick={() => setActiveCat(cat)}>
                {cat === 'all' ? `All (${clean.length})` : `${CAT_LABEL[cat] || cat} (${clean.filter(g => g.category === cat).length})`}
              </button>
            ))}
            <span className="gw-sep" aria-hidden />
            <button type="button" className="gw-chip" aria-pressed={soon} onClick={() => setSoon(v => !v)}>Ending within 7 days</button>
            <button type="button" className="gw-chip" aria-pressed={onlyFeatured} onClick={() => setOnlyFeatured(v => !v)}>Featured only</button>
            {filtered && <button type="button" className="gw-chip" onClick={reset}>Clear</button>}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        <div className="gw-count">{rows.length} OF {clean.length} GIVEAWAYS</div>

        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 24px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, color: 'var(--text-dim)', letterSpacing: '.1em' }}>
            NO GIVEAWAYS MATCH THOSE FILTERS
          </div>
        ) : (
          <>
            <div className="gw-wrap">
              <table className="gw-table">
                <thead>
                  <tr>
                    <th onClick={() => sortBy('title')}>Giveaway{arrow('title')}</th>
                    <th onClick={() => sortBy('category')}>Category{arrow('category')}</th>
                    <th onClick={() => sortBy('value')}>Prize value{arrow('value')}</th>
                    <th onClick={() => sortBy('ends')}>Ends{arrow('ends')}</th>
                    <th className="nosort" aria-label="Enter" />
                  </tr>
                </thead>
                <tbody>
                  {rows.map(g => {
                    const cat = g.category || 'accessories'
                    const color = CAT_COLOR[cat] || '#9CA3AF'
                    const e = endLabel(g.endDate)
                    const v = g.value || 0
                    return (
                      <tr key={g._id}>
                        <td>
                          <div className="gw-title">{g.featured && <span className="gw-star" title="Featured">★</span>}{g.title}</div>
                          <div className="gw-by">{g.sponsor || 'Various'}</div>
                        </td>
                        <td><span className="gw-pill" style={{ color }}>{CAT_LABEL[cat] || cat}</span></td>
                        <td>{v > 0 ? <span className="gw-val" style={{ color: v >= 5000 ? '#22C55E' : v >= 1000 ? 'var(--gold)' : 'var(--text-muted)' }}>${v.toLocaleString()}</span> : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>FREE ENTRY</span>}</td>
                        <td className="gw-end"><b>{e.text}</b>{e.sub && <small className={`gw-t-${e.tone}`}>{e.sub}</small>}</td>
                        <td style={{ textAlign: 'right' }}><a className="gw-btn" href={g.entryUrl} target="_blank" rel="noopener noreferrer">Enter ↗</a></td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div className="gw-cards">
              {rows.map(g => {
                const cat = g.category || 'accessories'
                const color = CAT_COLOR[cat] || '#9CA3AF'
                const e = endLabel(g.endDate)
                const v = g.value || 0
                return (
                  <div key={g._id} className="gw-card">
                    <div className="gw-title">{g.featured && <span className="gw-star">★</span>}{g.title}</div>
                    <div className="gw-by">{g.sponsor || 'Various'}</div>
                    <div className="gw-card-m">
                      <span className="gw-pill" style={{ color }}>{CAT_LABEL[cat] || cat}</span>
                      {v > 0 ? <span className="gw-val" style={{ color: v >= 5000 ? '#22C55E' : v >= 1000 ? 'var(--gold)' : 'var(--text-muted)' }}>${v.toLocaleString()}</span> : <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>FREE ENTRY</span>}
                      <span className={`gw-end gw-t-${e.tone}`} style={{ fontSize: 12 }}>{e.sub || e.text}</span>
                    </div>
                    <a className="gw-btn" href={g.entryUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center' }}>Enter giveaway ↗</a>
                  </div>
                )
              })}
            </div>
          </>
        )}

        <p style={{ marginTop: 40, padding: '14px 18px', background: 'rgba(255,255,255,.02)', border: '1px solid var(--border)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.8 }}>
          DownRange does not operate these giveaways. All entries go directly to the sponsor.
          Read each giveaway&apos;s official rules before entering. Some links may be affiliate links.
        </p>
      </div>
    </main>
  )
}
