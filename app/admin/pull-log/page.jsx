'use client'

/**
 * /app/admin/pull-log/page.jsx
 * DownRange — Data Pull Log Dashboard
 *
 * Design system:
 *   - Colors: background var(--background) | gold var(--gold) #C8922A | border var(--border)
 *   - Fonts:  Bebas Neue (headings) | IBM Plex Mono (code/data) | Barlow Condensed (body)
 *   - Cards:  .dr-card class
 *   - NO hardcoded hex except --gold #C8922A references
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  success: { label: 'SUCCESS',  bg: '#14532d', text: '#4ade80', dot: '#22c55e' },
  partial: { label: 'PARTIAL',  bg: '#713f12', text: '#fbbf24', dot: '#f59e0b' },
  failed:  { label: 'FAILED',   bg: '#7f1d1d', text: '#f87171', dot: '#ef4444' },
  skipped: { label: 'SKIPPED',  bg: '#1e3a5f', text: '#93c5fd', dot: '#3b82f6' },
  pending: { label: 'PENDING',  bg: '#2d1b69', text: '#c4b5fd', dot: '#a78bfa' },
}

const TYPE_ICON = {
  rss:     '📡',
  api:     '⚡',
  unknown: '❓',
}

const CATEGORY_COLOR = {
  news:    '#C8922A',
  deals:   '#22c55e',
  hunting: '#84cc16',
  video:   '#a855f7',
  ranges:  '#06b6d4',
  search:  '#f97316',
  cms:     '#ec4899',
  ai:      '#8b5cf6',
  legal:   '#ef4444',
  unknown: '#6b7280',
}

const REFRESH_INTERVALS = [0, 15000, 30000, 60000]
const REFRESH_LABELS    = ['Off', '15s', '30s', '1m']

// ─── Sub-components ──────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.skipped
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: cfg.bg, color: cfg.text,
      padding: '2px 8px', borderRadius: 4,
      fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, fontWeight: 700,
      letterSpacing: '0.06em',
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: cfg.dot, flexShrink: 0 }} />
      {cfg.label}
    </span>
  )
}

function TypeBadge({ type }) {
  return (
    <span style={{
      fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
      color: type === 'api' ? '#C8922A' : '#94a3b8',
      border: `1px solid ${type === 'api' ? '#C8922A44' : '#334155'}`,
      padding: '1px 6px', borderRadius: 3, letterSpacing: '0.08em',
    }}>
      {TYPE_ICON[type]} {type?.toUpperCase()}
    </span>
  )
}

function CategoryPill({ category }) {
  const color = CATEGORY_COLOR[category] || CATEGORY_COLOR.unknown
  return (
    <span style={{
      display: 'inline-block',
      background: color + '22', color, border: `1px solid ${color}44`,
      padding: '1px 7px', borderRadius: 20,
      fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 600,
      letterSpacing: '0.05em', textTransform: 'uppercase',
    }}>
      {category}
    </span>
  )
}

function StatCard({ label, value, sub, accent, icon }) {
  return (
    <div className="dr-card" style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', right: 16, top: 12,
        fontSize: 28, opacity: 0.15,
      }}>{icon}</div>
      <div style={{
        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11,
        color: 'var(--muted, #94a3b8)', textTransform: 'uppercase', letterSpacing: '0.1em',
        marginBottom: 4,
      }}>{label}</div>
      <div style={{
        fontFamily: 'Bebas Neue, sans-serif', fontSize: 36,
        color: accent || 'var(--foreground)',
        lineHeight: 1,
      }}>{value}</div>
      {sub && (
        <div style={{
          fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
          color: 'var(--muted, #64748b)', marginTop: 4,
        }}>{sub}</div>
      )}
    </div>
  )
}

function MiniBar({ value, max, color = '#C8922A' }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        flex: 1, height: 4, background: 'var(--border, #1e293b)', borderRadius: 2, overflow: 'hidden',
      }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 2, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8', width: 30, textAlign: 'right' }}>
        {pct}%
      </span>
    </div>
  )
}

function LivePulse({ active }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 8, height: 8, borderRadius: '50%',
        background: active ? '#22c55e' : '#334155',
        boxShadow: active ? '0 0 0 2px #22c55e44' : 'none',
        animation: active ? 'pulse 1.5s infinite' : 'none',
        display: 'inline-block',
      }} />
      <style>{`
        @keyframes pulse {
          0%,100% { box-shadow: 0 0 0 2px #22c55e44; }
          50%      { box-shadow: 0 0 0 6px #22c55e22; }
        }
      `}</style>
    </span>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PullLogPage() {
  const [entries, setEntries]         = useState([])
  const [stats, setStats]             = useState(null)
  const [loading, setLoading]         = useState(true)
  const [seeding, setSeeding]         = useState(false)
  const [lastRefresh, setLastRefresh] = useState(null)
  const [refreshIdx, setRefreshIdx]   = useState(1) // default 15s
  const [expandedId, setExpandedId]   = useState(null)
  const [filterStatus, setFilterStatus]   = useState('all')
  const [filterType, setFilterType]       = useState('all')
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterSource, setFilterSource]   = useState('all')
  const [search, setSearch]           = useState('')
  const [sortBy, setSortBy]           = useState('timestamp')
  const [sortDir, setSortDir]         = useState('desc')
  const [page, setPage]               = useState(0)
  const [liveActivity, setLiveActivity] = useState(false)
  const timerRef = useRef(null)
  const PAGE_SIZE = 20

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res  = await fetch('/api/pull-log?limit=500')
      const data = await res.json()
      if (data.ok) {
        setEntries(data.entries || [])
        setStats(data.stats || null)
        setLastRefresh(new Date())
        setLiveActivity(true)
        setTimeout(() => setLiveActivity(false), 1200)
      }
    } catch (err) {
      console.error('Pull log fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Initial + auto-refresh
  useEffect(() => {
    fetchData()
  }, [fetchData])

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current)
    const interval = REFRESH_INTERVALS[refreshIdx]
    if (interval > 0) {
      timerRef.current = setInterval(() => fetchData(true), interval)
    }
    return () => clearInterval(timerRef.current)
  }, [refreshIdx, fetchData])

  // ── Seed ───────────────────────────────────────────────────────────────────

  const seedData = async () => {
    setSeeding(true)
    try {
      await fetch('/api/pull-log', { method: 'POST' })
      await fetchData()
    } catch (e) {
      console.error(e)
    } finally {
      setSeeding(false)
    }
  }

  // ── Filter + sort ──────────────────────────────────────────────────────────

  const filtered = entries
    .filter(e => filterStatus   === 'all' || e.status   === filterStatus)
    .filter(e => filterType     === 'all' || e.type     === filterType)
    .filter(e => filterCategory === 'all' || e.category === filterCategory)
    .filter(e => filterSource   === 'all' || e.source   === filterSource)
    .filter(e => {
      if (!search) return true
      const q = search.toLowerCase()
      return (
        (e.sourceLabel && e.sourceLabel.toLowerCase().includes(q)) ||
        (e.source && e.source.toLowerCase().includes(q)) ||
        (e.category && e.category.toLowerCase().includes(q)) ||
        e.headlines?.some(h => h && typeof h === 'string' && h.toLowerCase().includes(q)) ||
        e.error?.toLowerCase().includes(q)
      )
    })
    .sort((a, b) => {
      let va = a[sortBy], vb = b[sortBy]
      if (sortBy === 'timestamp') { va = new Date(va); vb = new Date(vb) }
      if (sortDir === 'asc') return va > vb ? 1 : -1
      return va < vb ? 1 : -1
    })

  const paginated = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)

  // ── Source health derived data ─────────────────────────────────────────────
  const sourceHealth = stats?.bySource
    ? Object.entries(stats.bySource)
        .map(([id, s]) => ({
          id,
          label: entries.find(e => e.source === id)?.sourceLabel || id,
          ...s,
          successRate: s.total > 0 ? Math.round((s.success / s.total) * 100) : 0,
        }))
        .sort((a, b) => b.total - a.total)
    : []

  const maxItems = Math.max(...sourceHealth.map(s => s.items), 1)

  // ── Unique filter options ──────────────────────────────────────────────────
  const uniqueSources    = [...new Set(entries.map(e => e.source))]
  const uniqueCategories = [...new Set(entries.map(e => e.category))]

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)', padding: '24px 20px' }}>
      <style>{`
        .dr-card { background: var(--card, #0d1117); border: 1px solid var(--border, #1e293b); border-radius: 8px; }
        .log-row:hover { background: rgba(200,146,42,0.04) !important; }
        .sort-btn { background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 10px; padding: 0; margin-left: 4px; }
        .sort-btn.active { color: #C8922A; }
        .filter-select {
          background: var(--card, #0d1117);
          border: 1px solid var(--border, #1e293b);
          color: var(--foreground);
          padding: 6px 10px;
          border-radius: 5px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          cursor: pointer;
          outline: none;
        }
        .filter-select:focus { border-color: #C8922A; }
        .search-input {
          background: var(--card, #0d1117);
          border: 1px solid var(--border, #1e293b);
          color: var(--foreground);
          padding: 6px 12px;
          border-radius: 5px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          outline: none;
          width: 200px;
        }
        .search-input:focus { border-color: #C8922A; }
        .btn-ghost {
          background: none;
          border: 1px solid var(--border, #1e293b);
          color: #94a3b8;
          padding: 6px 12px;
          border-radius: 5px;
          cursor: pointer;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          transition: border-color 0.15s, color 0.15s;
        }
        .btn-ghost:hover { border-color: #C8922A; color: #C8922A; }
        .btn-gold {
          background: #C8922A;
          border: none;
          color: #000;
          padding: 6px 14px;
          border-radius: 5px;
          cursor: pointer;
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          transition: opacity 0.15s;
        }
        .btn-gold:hover { opacity: 0.85; }
        .btn-gold:disabled { opacity: 0.4; cursor: not-allowed; }
        table { border-collapse: collapse; width: 100%; }
        th { 
          text-align: left; padding: 10px 12px;
          font-family: 'IBM Plex Mono', monospace; font-size: 10px; font-weight: 600;
          color: #64748b; letter-spacing: 0.08em; text-transform: uppercase;
          border-bottom: 1px solid var(--border, #1e293b);
          white-space: nowrap;
          position: sticky; top: 0; background: var(--card, #0d1117); z-index: 1;
        }
        td { padding: 10px 12px; border-bottom: 1px solid rgba(30,41,59,0.5); vertical-align: top; }
        .expand-row td { background: rgba(200,146,42,0.04); border-left: 2px solid #C8922A; }
      `}</style>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h1 style={{
              fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, letterSpacing: '0.06em',
              color: 'var(--foreground)', margin: 0, lineHeight: 1,
            }}>
              PULL LOG
            </h1>
            <LivePulse active={liveActivity} />
          </div>
          <p style={{
            fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: '#64748b',
            margin: '4px 0 0', letterSpacing: '0.03em',
          }}>
            Real-time feed ingestion history · RSS + API pull events · {entries.length} entries
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          {/* Auto-refresh toggle */}
          <div style={{ display: 'flex', border: '1px solid var(--border, #1e293b)', borderRadius: 5, overflow: 'hidden' }}>
            {REFRESH_LABELS.map((label, i) => (
              <button key={i} onClick={() => setRefreshIdx(i)} style={{
                padding: '5px 10px',
                background: refreshIdx === i ? '#C8922A' : 'transparent',
                color: refreshIdx === i ? '#000' : '#64748b',
                border: 'none', cursor: 'pointer',
                fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, fontWeight: 700,
                borderRight: i < 3 ? '1px solid var(--border, #1e293b)' : 'none',
              }}>
                {label}
              </button>
            ))}
          </div>
          <button className="btn-ghost" onClick={() => fetchData()}>↻ Refresh</button>
          <button className="btn-gold" onClick={seedData} disabled={seeding}>
            {seeding ? 'Seeding…' : '+ Seed Test Data'}
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
          <StatCard label="Total Pulls"    value={stats.total}                icon="📊" />
          <StatCard label="Last 24h"       value={stats.last24h}              icon="🕐" accent="#C8922A" />
          <StatCard label="Success Rate"   value={`${stats.successRate}%`}    icon="✅" accent={stats.successRate >= 80 ? '#22c55e' : '#f59e0b'} sub={`${stats.last7d} pulls this week`} />
          <StatCard label="Items Ingested" value={stats.totalItems.toLocaleString()} icon="📦" sub={`${stats.totalNew.toLocaleString()} net new`} />
          <StatCard label="Avg Duration"   value={`${stats.avgDuration}ms`}   icon="⏱" accent="#94a3b8" />
          <StatCard label="Recent Errors"  value={stats.recentErrors?.length || 0} icon="🚨" accent={stats.recentErrors?.length ? '#ef4444' : '#22c55e'} />
        </div>
      )}

      {/* ── Two-column: Source health + Recent errors ── */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>

          {/* Source health */}
          <div className="dr-card" style={{ padding: 16 }}>
            <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.06em', margin: '0 0 14px', color: '#C8922A' }}>
              SOURCE HEALTH
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {sourceHealth.slice(0, 8).map(s => (
                <div key={s.id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                    <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'var(--foreground)' }}>
                      {s.label}
                    </span>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#4ade80' }}>{s.success}✓</span>
                      {s.failed > 0 && <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#f87171' }}>{s.failed}✗</span>}
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#94a3b8' }}>{s.successRate}%</span>
                    </div>
                  </div>
                  <MiniBar
                    value={s.items}
                    max={maxItems}
                    color={s.successRate >= 80 ? '#22c55e' : s.successRate >= 50 ? '#f59e0b' : '#ef4444'}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Recent errors */}
          <div className="dr-card" style={{ padding: 16 }}>
            <h3 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 16, letterSpacing: '0.06em', margin: '0 0 14px', color: '#ef4444' }}>
              RECENT FAILURES
            </h3>
            {stats.recentErrors?.length === 0 ? (
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, color: '#4ade80', textAlign: 'center', padding: '20px 0' }}>
                ✅ No recent failures — all feeds healthy
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {stats.recentErrors.map(e => (
                  <div key={e.id} style={{
                    padding: '8px 10px',
                    background: '#7f1d1d22', border: '1px solid #7f1d1d',
                    borderRadius: 5,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#fca5a5' }}>
                        {e.sourceLabel}
                      </span>
                      <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#64748b' }}>
                        {new Date(e.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#f87171' }}>
                      {e.error || 'Unknown error'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Log table ── */}
      <div className="dr-card" style={{ overflow: 'hidden' }}>

        {/* Filters bar */}
        <div style={{
          padding: '12px 16px',
          borderBottom: '1px solid var(--border, #1e293b)',
          display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center',
        }}>
          <input
            className="search-input"
            placeholder="Search sources, headlines…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0) }}
          />

          <select className="filter-select" value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setPage(0) }}>
            <option value="all">All Status</option>
            {Object.keys(STATUS_CONFIG).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>

          <select className="filter-select" value={filterType} onChange={e => { setFilterType(e.target.value); setPage(0) }}>
            <option value="all">All Types</option>
            <option value="rss">RSS</option>
            <option value="api">API</option>
          </select>

          <select className="filter-select" value={filterCategory} onChange={e => { setFilterCategory(e.target.value); setPage(0) }}>
            <option value="all">All Categories</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>

          <select className="filter-select" value={filterSource} onChange={e => { setFilterSource(e.target.value); setPage(0) }}>
            <option value="all">All Sources</option>
            {uniqueSources.map(s => (
              <option key={s} value={s}>{entries.find(e => e.source === s)?.sourceLabel || s}</option>
            ))}
          </select>

          <div style={{ marginLeft: 'auto', fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#64748b' }}>
            {filtered.length} results
            {lastRefresh && ` · updated ${lastRefresh.toLocaleTimeString()}`}
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto', maxHeight: '65vh', overflowY: 'auto' }}>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, color: '#64748b' }}>
              Loading pull log…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
              <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 14, color: '#64748b' }}>
                No pull events match your filters.
                {entries.length === 0 && ' Click "Seed Test Data" to populate some sample history.'}
              </div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th style={{ width: 20 }}></th>
                  <th>
                    TIMESTAMP
                    <button className={`sort-btn ${sortBy === 'timestamp' ? 'active' : ''}`}
                      onClick={() => { setSortBy('timestamp'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>
                      {sortBy === 'timestamp' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                  </th>
                  <th>SOURCE</th>
                  <th>TYPE</th>
                  <th>CATEGORY</th>
                  <th>STATUS</th>
                  <th>
                    ITEMS
                    <button className={`sort-btn ${sortBy === 'itemCount' ? 'active' : ''}`}
                      onClick={() => { setSortBy('itemCount'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>
                      {sortBy === 'itemCount' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                  </th>
                  <th>NEW</th>
                  <th>
                    DURATION
                    <button className={`sort-btn ${sortBy === 'duration' ? 'active' : ''}`}
                      onClick={() => { setSortBy('duration'); setSortDir(d => d === 'asc' ? 'desc' : 'asc') }}>
                      {sortBy === 'duration' ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}
                    </button>
                  </th>
                  <th>TRIGGER</th>
                  <th>HEADLINES / ERROR</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(e => {
                  const isExpanded = expandedId === e.id
                  const ts = new Date(e.timestamp)
                  return (
                    <>
                      <tr
                        key={e.id}
                        className="log-row"
                        style={{ cursor: 'pointer', transition: 'background 0.1s' }}
                        onClick={() => setExpandedId(isExpanded ? null : e.id)}
                      >
                        <td style={{ color: '#C8922A', fontSize: 12 }}>{isExpanded ? '▼' : '▶'}</td>
                        <td>
                          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                            {ts.toLocaleDateString()} {ts.toLocaleTimeString()}
                          </div>
                          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#475569', marginTop: 2 }}>
                            {Math.round((Date.now() - ts.getTime()) / 60000)}m ago
                          </div>
                        </td>
                        <td>
                          <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--foreground)', whiteSpace: 'nowrap' }}>
                            {e.sourceLabel}
                          </div>
                          <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9, color: '#475569' }}>
                            {e.source}
                          </div>
                        </td>
                        <td><TypeBadge type={e.type} /></td>
                        <td><CategoryPill category={e.category} /></td>
                        <td><StatusBadge status={e.status} /></td>
                        <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, textAlign: 'right', color: e.itemCount > 0 ? 'var(--foreground)' : '#475569' }}>
                          {e.itemCount}
                        </td>
                        <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 12, textAlign: 'right', color: e.newItems > 0 ? '#4ade80' : '#475569' }}>
                          +{e.newItems}
                        </td>
                        <td style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: e.duration > 2000 ? '#f59e0b' : '#94a3b8', whiteSpace: 'nowrap' }}>
                          {e.duration}ms
                        </td>
                        <td>
                          {e.meta?.triggeredBy && (
                            <span style={{
                              fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
                              color: e.meta.triggeredBy === 'manual' ? '#C8922A' : '#64748b',
                              textTransform: 'uppercase',
                            }}>
                              {e.meta.triggeredBy === 'cron' ? '⏰' : e.meta.triggeredBy === 'manual' ? '👤' : '🔗'} {e.meta.triggeredBy}
                            </span>
                          )}
                        </td>
                        <td style={{ maxWidth: 280 }}>
                          {e.status === 'failed' ? (
                            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#f87171' }}>
                              ✗ {e.error}
                            </span>
                          ) : e.headlines?.length > 0 ? (
                            <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>
                              {e.headlines[0]}
                              {e.headlines.length > 1 && <span style={{ color: '#475569' }}> +{e.headlines.length - 1} more</span>}
                            </div>
                          ) : (
                            <span style={{ color: '#334155', fontSize: 11 }}>—</span>
                          )}
                        </td>
                      </tr>

                      {/* Expanded detail row */}
                      {isExpanded && (
                        <tr key={`${e.id}-expand`} className="expand-row">
                          <td />
                          <td colSpan={10} style={{ paddingBottom: 16 }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

                              {/* Headlines */}
                              <div>
                                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#C8922A', marginBottom: 6, letterSpacing: '0.08em' }}>
                                  HEADLINES CAPTURED
                                </div>
                                {e.headlines?.length > 0 ? (
                                  <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
                                    {e.headlines.map((h, i) => (
                                      <li key={i} style={{
                                        fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12,
                                        color: 'var(--foreground)', padding: '3px 0',
                                        borderBottom: i < e.headlines.length - 1 ? '1px solid rgba(30,41,59,0.5)' : 'none',
                                      }}>
                                        · {h}
                                      </li>
                                    ))}
                                  </ul>
                                ) : (
                                  <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 11, color: '#334155' }}>
                                    No headlines
                                  </span>
                                )}
                              </div>

                              {/* Metadata */}
                              <div>
                                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#C8922A', marginBottom: 6, letterSpacing: '0.08em' }}>
                                  PULL METADATA
                                </div>
                                {[
                                  ['Feed URL',     e.meta?.url],
                                  ['HTTP Status',  e.meta?.httpStatus],
                                  ['Feed Size',    e.meta?.feedSize],
                                  ['Triggered By', e.meta?.triggeredBy],
                                  ['Duplicates',   e.duplicates],
                                ].map(([k, v]) => v != null && (
                                  <div key={k} style={{ display: 'flex', gap: 8, marginBottom: 3 }}>
                                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#64748b', flexShrink: 0, width: 90 }}>{k}</span>
                                    <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: 'var(--foreground)', wordBreak: 'break-all' }}>{String(v)}</span>
                                  </div>
                                ))}
                              </div>

                              {/* Pull ID + raw */}
                              <div>
                                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#C8922A', marginBottom: 6, letterSpacing: '0.08em' }}>
                                  PULL ID
                                </div>
                                <div style={{
                                  fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
                                  color: '#475569', wordBreak: 'break-all',
                                  background: 'rgba(0,0,0,0.3)', padding: '6px 8px', borderRadius: 4,
                                }}>
                                  {e.id}
                                </div>
                                {e.error && (
                                  <>
                                    <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#ef4444', margin: '10px 0 4px', letterSpacing: '0.08em' }}>
                                      ERROR DETAIL
                                    </div>
                                    <div style={{
                                      fontFamily: 'IBM Plex Mono, monospace', fontSize: 10,
                                      color: '#f87171', background: '#7f1d1d22', padding: '6px 8px', borderRadius: 4,
                                    }}>
                                      {e.error}
                                    </div>
                                  </>
                                )}
                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{
            padding: '10px 16px',
            borderTop: '1px solid var(--border, #1e293b)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#64748b' }}>
              Page {page + 1} of {totalPages} ({filtered.length} total)
            </span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(0)}>«</button>
              <button className="btn-ghost" disabled={page === 0} onClick={() => setPage(p => p - 1)}>‹ Prev</button>
              <button className="btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>Next ›</button>
              <button className="btn-ghost" disabled={page >= totalPages - 1} onClick={() => setPage(totalPages - 1)}>»</button>
            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ marginTop: 16, fontFamily: 'IBM Plex Mono, monospace', fontSize: 10, color: '#334155', textAlign: 'center' }}>
        DownRange Admin · Pull Log · Auto-refresh: {REFRESH_LABELS[refreshIdx]}
        {lastRefresh && ` · Last sync: ${lastRefresh.toLocaleTimeString()}`}
      </div>
    </div>
  )
}
