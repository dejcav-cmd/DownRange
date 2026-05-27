'use client'
import { useState, useEffect } from 'react'

const S = `
.ec-group{margin-bottom:20px}
.ec-group-hdr{display:flex;align-items:center;gap:10px;padding:8px 16px;background:var(--bg2);border:1px solid var(--border);cursor:pointer;user-select:none}
.ec-group-hdr:hover{border-color:var(--gold)}
.ec-row{display:grid;grid-template-columns:24px 260px 80px 1fr;gap:12px;padding:10px 16px;border-bottom:1px solid rgba(30,41,59,.4);align-items:start}
.ec-row:hover{background:rgba(200,146,42,.03)}
.ec-key{font-family:'IBM Plex Mono',monospace;font-size:11px;font-weight:700;color:var(--text);word-break:break-all}
.ec-desc{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#64748b;line-height:1.6}
.ec-howto{font-family:'IBM Plex Mono',monospace;font-size:10px;color:#475569;line-height:1.6;padding:4px 8px;background:rgba(0,0,0,.3);border-left:2px solid #475569;margin-top:4px}
.ec-badge{display:inline-flex;align-items:center;gap:4px;font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 8px;text-transform:uppercase;border-radius:2px;white-space:nowrap}
`

const PRIO_C = { critical:'#ef4444', high:'#f97316', medium:'#f59e0b', low:'#6b7280' }

function EnvRow({ v }) {
  const [open, setOpen] = useState(false)
  const statusColor = v.set ? '#22c55e' : v.critical ? '#ef4444' : PRIO_C[v.priority] || '#6b7280'
  const statusIcon  = v.set ? '✓' : '✕'

  return (
    <>
      <div className="ec-row" onClick={() => setOpen(o => !o)} style={{ cursor: 'pointer', background: open ? 'rgba(200,146,42,.04)' : undefined }}>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 13, color: statusColor, fontWeight: 700 }}>{statusIcon}</span>
        <div>
          <div className="ec-key">{v.key}</div>
          {v.set && v.hint && (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#374151', marginTop: 2 }}>{v.hint}</div>
          )}
        </div>
        <div>
          {v.critical && (
            <span className="ec-badge" style={{ background: '#ef444422', color: '#ef4444', border: '1px solid #ef444444' }}>CRITICAL</span>
          )}
          {!v.critical && v.priority && (
            <span className="ec-badge" style={{ background: PRIO_C[v.priority] + '22', color: PRIO_C[v.priority], border: `1px solid ${PRIO_C[v.priority]}44` }}>
              {v.priority}
            </span>
          )}
        </div>
        <div className="ec-desc">
          {v.desc}
          {!v.set && open && (
            <div className="ec-howto">📋 {v.howTo}</div>
          )}
          {v.note && (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#f59e0b', marginTop: 4 }}>⚠ {v.note}</div>
          )}
        </div>
      </div>
    </>
  )
}

export default function EnvChecker({ adminKey }) {
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [openGroups, setOpenGroups] = useState({})

  useEffect(() => {
    if (!adminKey) return
    fetch('/api/admin/env-check', { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json())
      .then(d => {
        setData(d)
        // Auto-expand groups with missing vars
        const auto = {}
        if (d.groups) {
          for (const [g, vars] of Object.entries(d.groups)) {
            if (vars.some(v => !v.set)) auto[g] = true
          }
        }
        setOpenGroups(auto)
      })
      .finally(() => setLoading(false))
  }, [adminKey])

  if (!adminKey) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#64748b' }}>
      Enter Admin Key to check environment variables.
    </div>
  )

  if (loading) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#64748b' }}>
      Checking environment variables...
    </div>
  )

  if (!data?.ok) return (
    <div style={{ padding: 40, textAlign: 'center', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#ef4444' }}>
      Failed to load. Check your Admin Key.
    </div>
  )

  const { summary, groups } = data

  return (
    <div style={{ maxWidth: 1000 }}>
      <style>{S}</style>

      <div style={{ marginBottom: 20 }}>
        <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '2rem', letterSpacing: '.06em', color: 'var(--gold)', margin: 0, lineHeight: 1 }}>
          🔧 Environment Variables
        </h1>
        <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#64748b', margin: '4px 0 0' }}>
          {summary.set}/{summary.total} configured · Click any row to see setup instructions
        </p>
      </div>

      {/* Summary stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 10, marginBottom: 20 }}>
        {[
          ['Set',           summary.set,                        '#22c55e'],
          ['Missing',       summary.missing,                    summary.missing > 0 ? '#ef4444' : '#22c55e'],
          ['Critical ❌',   summary.critMissing.length,         summary.critMissing.length > 0 ? '#ef4444' : '#22c55e'],
          ['High Priority', summary.highMissing.length,         summary.highMissing.length > 0 ? '#f97316' : '#22c55e'],
          ['Medium',        summary.medMissing.length,          '#f59e0b'],
        ].map(([l, v, c]) => (
          <div key={l} style={{ background: 'var(--bg2)', border: `1px solid ${c}33`, padding: '14px 16px', textAlign: 'center' }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '2rem', color: c, lineHeight: 1 }}>{v}</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#64748b', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</div>
          </div>
        ))}
      </div>

      {/* Critical missing alert */}
      {summary.critMissing.length > 0 && (
        <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.3)', marginBottom: 20 }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#ef4444', fontWeight: 700, marginBottom: 6 }}>
            ❌ CRITICAL VARIABLES MISSING — These break core functionality:
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {summary.critMissing.map(k => (
              <span key={k} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, background: 'rgba(239,68,68,.15)', color: '#f87171', padding: '2px 8px', border: '1px solid rgba(239,68,68,.3)' }}>
                {k}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Groups */}
      {Object.entries(groups).map(([group, vars]) => {
        const missing = vars.filter(v => !v.set).length
        const isOpen  = openGroups[group] !== false && (missing > 0 || openGroups[group])
        const groupColor = vars.some(v => v.critical && !v.set) ? '#ef4444'
                         : vars.some(v => v.priority === 'high' && !v.set) ? '#f97316'
                         : vars.some(v => !v.set) ? '#f59e0b'
                         : '#22c55e'

        return (
          <div key={group} className="ec-group">
            <div className="ec-group-hdr" onClick={() => setOpenGroups(p => ({ ...p, [group]: !isOpen }))}>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: groupColor, fontWeight: 700, minWidth: 12 }}>
                {isOpen ? '▼' : '▶'}
              </span>
              <span style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--text)', flex: 1 }}>
                {group}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: groupColor }}>
                {vars.filter(v => v.set).length}/{vars.length} set
                {missing > 0 ? ` · ${missing} missing` : ' ✓'}
              </span>
            </div>

            {isOpen && (
              <div style={{ border: '1px solid var(--border)', borderTop: 'none' }}>
                {vars.map(v => <EnvRow key={v.key} v={v} />)}
              </div>
            )}
          </div>
        )
      })}

      <div style={{ marginTop: 16, padding: '12px 16px', background: 'var(--bg2)', border: '1px solid var(--border)', fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#475569', lineHeight: 1.8 }}>
        Add variables at: <strong style={{ color: '#64748b' }}>Vercel → Project: down-range-indol → Settings → Environment Variables</strong><br />
        After adding any variable: <strong style={{ color: '#64748b' }}>Vercel → Deployments → Redeploy</strong> (or push a commit to auto-deploy)
      </div>
    </div>
  )
}
