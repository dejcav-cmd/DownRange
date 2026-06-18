'use client'
import { useState } from 'react'

const mono = "'IBM Plex Mono', monospace"
const cond = "'Barlow Condensed', sans-serif"

const OPERATIONS = [
  {
    group: '🔫 GUN RELEASES',
    ops: [
      {
        id: 'backfill-releases',
        label: 'Backfill Releases (60 days)',
        desc: 'Crawls all 41 manufacturer sources and pulls real gun releases. Takes 3-5 min. Run after nuking.',
        endpoint: '/api/admin/backfill-releases',
        method: 'GET',
        color: '#c8922a',
        danger: false,
        timeout: 290000,
      },
      {
        id: 'nuke-releases',
        label: '☠ Nuke All Releases',
        desc: 'Deletes EVERY firearmRelease document from Sanity. Irreversible. Run before a clean backfill.',
        endpoint: '/api/admin/nuke-releases',
        method: 'POST',
        color: '#ef4444',
        danger: true,
        timeout: 60000,
      },
      {
        id: 'patch-release-images',
        label: 'Patch Release Images',
        desc: 'Fetches real OG images from each release\'s source URL and updates Sanity.',
        endpoint: '/api/admin/patch-releases-images',
        method: 'POST',
        color: '#60a5fa',
        danger: false,
        timeout: 290000,
      },
    ],
  },
  {
    group: '📰 NEWS & CONTENT',
    ops: [
      {
        id: 'run-news',
        label: 'Pull News Now',
        desc: 'Triggers the news agent feed immediately.',
        endpoint: '/api/agent?feed=news',
        method: 'GET',
        color: '#c8922a',
        danger: false,
        timeout: 290000,
      },
      {
        id: 'run-releases-feed',
        label: 'Run Releases Feed',
        desc: 'Triggers the weekly-gun-releases cron manually.',
        endpoint: '/api/cron/weekly-gun-releases',
        method: 'GET',
        color: '#c8922a',
        danger: false,
        timeout: 290000,
      },
      {
        id: 'run-goa',
        label: 'Pull GOA Feed',
        desc: 'Pulls Gun Owners of America news.',
        endpoint: '/api/agent?feed=goa',
        method: 'GET',
        color: '#c8922a',
        danger: false,
        timeout: 120000,
      },
      {
        id: 'run-blog',
        label: 'Write Blog Posts',
        desc: 'Triggers AI blog writer — generates 3 draft articles.',
        endpoint: '/api/cron/blog-writer',
        method: 'GET',
        color: '#a78bfa',
        danger: false,
        timeout: 290000,
      },
    ],
  },
  {
    group: '⚙️ SYSTEM',
    ops: [
      {
        id: 'run-nfa',
        label: 'Update NFA Wait Times',
        desc: 'Scrapes ATF + SilencerShop for current NFA processing times.',
        endpoint: '/api/nfa-wait-times',
        method: 'GET',
        color: '#34d399',
        danger: false,
        timeout: 60000,
      },
      {
        id: 'run-gun-deals',
        label: 'Pull Gun Deals',
        desc: 'Pulls latest deals from gun.deals RSS.',
        endpoint: '/api/cron/gun-deals',
        method: 'GET',
        color: '#34d399',
        danger: false,
        timeout: 120000,
      },
      {
        id: 'run-ccw',
        label: 'Update CCW Data',
        desc: 'Updates carry laws for all 50 states.',
        endpoint: '/api/cron/ccw-update',
        method: 'GET',
        color: '#34d399',
        danger: false,
        timeout: 290000,
      },
      {
        id: 'run-canada',
        label: 'Write Canada Articles',
        desc: 'Triggers Canada article writer.',
        endpoint: '/api/cron/write-canada-articles',
        method: 'GET',
        color: '#60a5fa',
        danger: false,
        timeout: 290000,
      },
    ],
  },
]

function OpButton({ op, adminKey }) {
  const [status, setStatus]   = useState('idle') // idle | running | done | error
  const [result, setResult]   = useState(null)
  const [confirm, setConfirm] = useState(false)

  async function run() {
    if (op.danger && !confirm) { setConfirm(true); return }
    setConfirm(false)
    setStatus('running')
    setResult(null)
    const start = Date.now()
    try {
      const res = await fetch(op.endpoint, {
        method: op.method,
        headers: { 'x-admin-key': adminKey, 'authorization': `Bearer ${adminKey}`, 'x-vercel-cron': '1' },
        signal: AbortSignal.timeout(op.timeout),
      })
      const text = await res.text()
      const ms   = Date.now() - start
      let parsed = null
      try { parsed = JSON.parse(text) } catch {}

      const summary = parsed
        ? [
            parsed.created   != null && `created: ${parsed.created}`,
            parsed.done      != null && `done: ${parsed.done}`,
            parsed.skipped   != null && `skipped: ${parsed.skipped}`,
            parsed.failed    != null && `failed: ${parsed.failed}`,
            parsed.saved?.length && `saved: ${parsed.saved.slice(0,5).join(', ')}`,
            parsed.message   && parsed.message.slice(0, 200),
            parsed.error     && `ERROR: ${parsed.error}`,
          ].filter(Boolean).join(' · ')
        : text.slice(0, 300)

      setStatus(res.ok ? 'done' : 'error')
      setResult({ summary: summary || `HTTP ${res.status}`, ms })
    } catch (e) {
      const ms = Date.now() - start
      const timedOut = e.name === 'AbortError'
      setStatus(timedOut ? 'done' : 'error')
      setResult({
        summary: timedOut
          ? `Job running — took ${Math.round(ms/60000)}m. Refresh cron dashboard for results.`
          : `Error: ${e.message}`,
        ms,
      })
    }
  }

  const borderColor = status === 'done' ? '#22c55e' : status === 'error' ? '#ef4444' : status === 'running' ? op.color : '#1e1e1e'

  return (
    <div style={{ background: '#0f0f0f', border: `1px solid ${borderColor}`, padding: 20, transition: 'border-color .3s' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: cond, fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{op.label}</div>
          <div style={{ fontFamily: mono, fontSize: 10, color: '#666', lineHeight: 1.7 }}>{op.desc}</div>
        </div>

        <div style={{ flexShrink: 0 }}>
          {confirm ? (
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={run} style={{ background: '#ef4444', color: '#fff', border: 'none', padding: '8px 16px', fontFamily: mono, fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '.05em' }}>
                CONFIRM ✓
              </button>
              <button onClick={() => setConfirm(false)} style={{ background: '#1e1e1e', color: '#888', border: '1px solid #333', padding: '8px 16px', fontFamily: mono, fontSize: 11, cursor: 'pointer' }}>
                CANCEL
              </button>
            </div>
          ) : (
            <button
              onClick={run}
              disabled={status === 'running'}
              style={{
                background: status === 'running' ? '#1a1a1a' : op.danger ? '#2a0a0a' : '#111',
                color: status === 'running' ? '#555' : op.color,
                border: `1px solid ${op.color}33`,
                padding: '8px 20px',
                fontFamily: mono,
                fontSize: 11,
                fontWeight: 700,
                cursor: status === 'running' ? 'not-allowed' : 'pointer',
                letterSpacing: '.08em',
                transition: 'all .2s',
                whiteSpace: 'nowrap',
              }}
            >
              {status === 'running' ? '⏳ RUNNING...' : '▶ RUN'}
            </button>
          )}
        </div>
      </div>

      {result && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          background: status === 'done' ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.06)',
          border: `1px solid ${status === 'done' ? 'rgba(34,197,94,.2)' : 'rgba(239,68,68,.2)'}`,
          fontFamily: mono,
          fontSize: 10,
          color: status === 'done' ? '#4ade80' : '#f87171',
          lineHeight: 1.8,
        }}>
          {status === 'done' ? '✓' : '✗'} {result.summary}
          <span style={{ color: '#444', marginLeft: 12 }}>{Math.round(result.ms/1000)}s</span>
        </div>
      )}
    </div>
  )
}

export default function OperationsPanel({ adminKey, setMsg }) {
  return (
    <div style={{ padding: '0 0 60px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ fontFamily: mono, fontSize: 10, color: '#c8922a', letterSpacing: '.2em', marginBottom: 8 }}>
          ⚡ SYSTEM OPERATIONS
        </div>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: '2rem', color: '#fff', margin: 0, letterSpacing: '.03em' }}>
          Operations Center
        </h2>
        <p style={{ fontFamily: mono, fontSize: 11, color: '#666', marginTop: 8, lineHeight: 1.8 }}>
          Manual triggers for all major data pipelines. Results appear inline after each run.
          Red operations require confirmation.
        </p>
      </div>

      {/* Operation groups */}
      {OPERATIONS.map(group => (
        <div key={group.group} style={{ marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <h3 style={{ fontFamily: cond, fontSize: 13, fontWeight: 700, color: '#c8922a', letterSpacing: '.1em', margin: 0, textTransform: 'uppercase' }}>
              {group.group}
            </h3>
            <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 10 }}>
            {group.ops.map(op => (
              <OpButton key={op.id} op={op} adminKey={adminKey} />
            ))}
          </div>
        </div>
      ))}

      {/* Backfill tip */}
      <div style={{ background: '#0a0a0a', border: '1px solid #c8922a33', padding: '20px 24px', fontFamily: mono, fontSize: 11, color: '#666', lineHeight: 1.9 }}>
        <strong style={{ color: '#c8922a', letterSpacing: '.05em' }}>RELEASES WORKFLOW:</strong>
        {' '}To reset and repopulate: run <strong style={{ color: '#fff' }}>☠ Nuke All Releases</strong> first,
        wait for it to finish, then run <strong style={{ color: '#fff' }}>Backfill Releases</strong>.
        The backfill takes 3-5 min and pulls up to 60 real gun releases from 41 manufacturer sources.
      </div>
    </div>
  )
}
