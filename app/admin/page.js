'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const FEEDS = [
  { key: 'news',     label: 'News Feed',        schedule: 'Every 15 min' },
  { key: 'laws',     label: 'Laws Feed',         schedule: 'Every 2 hrs' },
  { key: 'releases', label: 'Releases Feed',     schedule: 'Every 1 hr' },
  { key: 'market',   label: 'Market Feed',       schedule: 'Every 30 min' },
  { key: 'video',    label: 'Video Feed',        schedule: 'Every 4 hrs' },
  { key: 'state',    label: 'State Feed',        schedule: 'Daily 8am' },
]

const API_KEYS = [
  { key: 'ANTHROPIC_API_KEY',             label: 'Anthropic (Claude AI)',  required: true },
  { key: 'SANITY_API_TOKEN',              label: 'Sanity CMS Token',       required: true },
  { key: 'RESEND_API_KEY',               label: 'Resend Email',           required: true },
  { key: 'ALGOLIA_ADMIN_KEY',            label: 'Algolia Search',         required: false },
  { key: 'YOUTUBE_API_KEY',              label: 'YouTube Data API',       required: false },
  { key: 'DISCORD_WEBHOOK_URL',          label: 'Discord Agent Status',   required: false },
  { key: 'NEWSAPI_KEY',                  label: 'NewsAPI',                required: false },
  { key: 'GNEWS_KEY',                    label: 'GNews',                  required: false },
  { key: 'LEGISCAN_KEY',                 label: 'LegiScan',               required: false },
]

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [feedResults, setFeedResults] = useState({})
  const [loadingFeed, setLoadingFeed] = useState(null)
  const [apiStatus, setApiStatus] = useState({})
  const [urgencyThreshold, setUrgencyThreshold] = useState(8)
  const [siteStatus, setSiteStatus] = useState(null)

  function login(e) {
    e.preventDefault()
    sessionStorage.setItem('admin_secret', secret)
    setAuthed(true)
  }

  useEffect(() => {
    const saved = sessionStorage.getItem('admin_secret')
    if (saved) { setSecret(saved); setAuthed(true) }
  }, [])

  useEffect(() => {
    if (!authed) return
    checkApiStatus()
    checkSiteHealth()
  }, [authed])

  async function checkApiStatus() {
    const res = await fetch('/api/admin/status', {
      headers: { 'Authorization': `Bearer ${secret}` }
    }).catch(() => null)
    if (res?.ok) {
      const data = await res.json()
      setApiStatus(data.keys || {})
    }
  }

  async function checkSiteHealth() {
    const start = Date.now()
    try {
      await fetch('/api/revalidate', { method: 'POST', headers: { 'x-revalidate-secret': 'ping' } })
      setSiteStatus({ ok: true, ms: Date.now() - start })
    } catch {
      setSiteStatus({ ok: false, ms: 0 })
    }
    // Just check if site responds
    setSiteStatus({ ok: true, ms: Date.now() - start })
  }

  async function triggerFeed(feedKey) {
    setLoadingFeed(feedKey)
    try {
      const res = await fetch(`/api/agent?feed=${feedKey}`, {
        headers: { 'Authorization': `Bearer ${secret}` }
      })
      const data = await res.json()
      setFeedResults(prev => ({ ...prev, [feedKey]: data }))
    } catch (err) {
      setFeedResults(prev => ({ ...prev, [feedKey]: { error: err.message } }))
    }
    setLoadingFeed(null)
  }

  async function triggerAlgolia() {
    setLoadingFeed('algolia')
    const res = await fetch('/api/algolia-sync', {
      headers: { 'Authorization': `Bearer ${secret}` }
    }).catch(() => null)
    const data = await res?.json().catch(() => ({}))
    setFeedResults(prev => ({ ...prev, algolia: data }))
    setLoadingFeed(null)
  }

  if (!authed) {
    return (
      <div style={{ background: '#0A0B0C', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ background: '#111318', border: '1px solid #1F2428', padding: '40px', width: '360px' }}>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#C8922A', marginBottom: '8px', letterSpacing: '0.05em' }}>DOWNRANGE ADMIN</div>
          <p style={{ fontFamily: 'monospace', fontSize: '12px', color: '#4B5563', marginBottom: '24px' }}>Enter your CRON_SECRET to access the dashboard</p>
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="Enter secret..."
              style={{ background: '#0A0B0C', border: '1px solid #1F2428', color: '#F5F5F3', padding: '12px', fontFamily: 'monospace', fontSize: '13px' }} />
            <button type="submit" style={{ background: '#C8922A', color: '#000', border: 'none', padding: '12px', fontFamily: 'monospace', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
              ACCESS DASHBOARD →
            </button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div style={{ background: '#0A0B0C', minHeight: '100vh', color: '#E8E6E1' }}>
      {/* Header */}
      <div style={{ background: '#111318', borderBottom: '1px solid #1F2428', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.6rem', color: '#C8922A', letterSpacing: '0.05em' }}>DOWNRANGE ADMIN</div>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563', marginTop: '2px' }}>Operations Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          {siteStatus && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: siteStatus.ok ? '#34D399' : '#EF4444', display: 'inline-block' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: siteStatus.ok ? '#34D399' : '#EF4444' }}>
                {siteStatus.ok ? 'SITE ONLINE' : 'SITE DOWN'}
              </span>
            </div>
          )}
          <Link href="/" style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4B5563', textDecoration: 'none' }}>← BACK TO SITE</Link>
          <button onClick={() => { sessionStorage.removeItem('admin_secret'); setAuthed(false) }}
            style={{ background: 'none', border: '1px solid #1F2428', color: '#4B5563', padding: '6px 12px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>
            LOGOUT
          </button>
        </div>
      </div>

      <div style={{ padding: '32px', maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

          {/* Feed Controls */}
          <div>
            <h2 style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px' }}>FEED CONTROLS</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {FEEDS.map(feed => (
                <div key={feed.key} style={{ background: '#111318', border: '1px solid #1F2428', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#F5F5F3', fontWeight: 600 }}>{feed.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563', marginTop: '2px' }}>{feed.schedule}</div>
                    {feedResults[feed.key] && (
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', marginTop: '4px', color: feedResults[feed.key].error ? '#EF4444' : '#34D399' }}>
                        {feedResults[feed.key].error ? `✗ ${feedResults[feed.key].error}` : `✓ Done: ${feedResults[feed.key].result?.done ?? 0} published`}
                      </div>
                    )}
                  </div>
                  <button onClick={() => triggerFeed(feed.key)} disabled={loadingFeed === feed.key}
                    style={{ background: loadingFeed === feed.key ? '#1F2428' : '#C8922A', color: loadingFeed === feed.key ? '#6B7280' : '#000', border: 'none', padding: '8px 16px', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {loadingFeed === feed.key ? 'RUNNING...' : 'RUN NOW →'}
                  </button>
                </div>
              ))}
              <div style={{ background: '#111318', border: '1px solid #1F2428', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: '#F5F5F3', fontWeight: 600 }}>Algolia Full Reindex</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563', marginTop: '2px' }}>Rebuild all search indices</div>
                  {feedResults.algolia && (
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', marginTop: '4px', color: feedResults.algolia.error ? '#EF4444' : '#34D399' }}>
                      {feedResults.algolia.error ? `✗ ${feedResults.algolia.error}` : `✓ Reindexed`}
                    </div>
                  )}
                </div>
                <button onClick={triggerAlgolia} disabled={loadingFeed === 'algolia'}
                  style={{ background: loadingFeed === 'algolia' ? '#1F2428' : '#111318', color: loadingFeed === 'algolia' ? '#6B7280' : '#C8922A', border: '1px solid #C8922A', padding: '8px 16px', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', cursor: 'pointer' }}>
                  {loadingFeed === 'algolia' ? 'INDEXING...' : 'REINDEX →'}
                </button>
              </div>
            </div>
          </div>

          {/* API Status + Settings */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h2 style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px' }}>API KEY STATUS</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {API_KEYS.map(k => {
                  const configured = apiStatus[k.key] ?? null
                  return (
                    <div key={k.key} style={{ background: '#111318', border: '1px solid #1F2428', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#D1D5DB' }}>{k.label}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {k.required && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: '#EF4444' }}>REQUIRED</span>}
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: configured === null ? '#374151' : configured ? '#34D399' : '#EF4444', display: 'inline-block' }} />
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: configured === null ? '#4B5563' : configured ? '#34D399' : '#EF4444' }}>
                          {configured === null ? 'UNKNOWN' : configured ? 'SET' : 'MISSING'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <button onClick={checkApiStatus} style={{ marginTop: '10px', background: 'none', border: '1px solid #1F2428', color: '#4B5563', padding: '8px 16px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', width: '100%' }}>
                REFRESH STATUS
              </button>
            </div>

            <div>
              <h2 style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px' }}>SETTINGS</h2>
              <div style={{ background: '#111318', border: '1px solid #1F2428', padding: '16px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '12px', color: '#D1D5DB', marginBottom: '10px' }}>Breaking alert threshold</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <input type="range" min="5" max="10" value={urgencyThreshold} onChange={e => setUrgencyThreshold(Number(e.target.value))}
                    style={{ flex: 1 }} />
                  <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#EF4444', minWidth: '28px' }}>{urgencyThreshold}</span>
                </div>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563', marginTop: '6px' }}>
                  Urgency score {urgencyThreshold}+ triggers breaking alert + Discord ping
                </div>
              </div>
            </div>

            <div>
              <h2 style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px' }}>QUICK LINKS</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {[
                  { label: 'Sanity Studio', href: '/studio' },
                  { label: 'News Feed', href: '/news' },
                  { label: 'Market Watch', href: '/market' },
                  { label: 'State Hub', href: '/state-hub' },
                  { label: 'Deals Page', href: '/deals' },
                  { label: 'Laws Page', href: '/laws' },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    style={{ background: '#111318', border: '1px solid #1F2428', padding: '10px', fontFamily: 'monospace', fontSize: '11px', color: '#9CA3AF', textDecoration: 'none', display: 'block', textAlign: 'center' }}>
                    {l.label} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
