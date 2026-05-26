'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_CHANNELS = [
  { id: 'UC5Gwxl2DmAZkdiuoWsLcRhg', name: 'Garand Thumb',        enabled: true },
  { id: 'UCIRgR4iANHI2taJdz8hjwLw', name: 'Paul Harrell',         enabled: true },
  { id: 'UCwIHnIpEIbyzmL9cB2l5Elw', name: 'Military Arms Channel', enabled: true },
  { id: 'UCz8b2iV8CJxBNs3fP4jjRMg', name: 'Iraqveteran8888',      enabled: true },
  { id: 'UCDpNK2b8NlJSfMl_k4p_fJg', name: 'InRange TV',           enabled: true },
  { id: 'UC_GOthrJTq5EFrPNsHhJJBQ', name: 'Forgotten Weapons',    enabled: true },
]

const FEEDS = [
  { key: 'news',     label: 'News Feed',      schedule: 'Every 15 min', icon: '📰' },
  { key: 'laws',     label: 'Laws Feed',      schedule: 'Every 2 hrs',  icon: '⚖' },
  { key: 'releases', label: 'Releases Feed',  schedule: 'Every 1 hr',   icon: '🔫' },
  { key: 'market',   label: 'Market Feed',    schedule: 'Every 30 min', icon: '📊' },
  { key: 'video',    label: 'Video Feed',     schedule: 'Every 4 hrs',  icon: '▶' },
  { key: 'state',    label: 'State Feed',     schedule: 'Daily 8am',    icon: '🗺' },
]

const API_KEYS = [
  { key: 'ANTHROPIC_API_KEY',          label: 'Claude AI (Law Assistant + Rewriter)', required: true,  hint: 'console.anthropic.com' },
  { key: 'SANITY_API_TOKEN',           label: 'Sanity CMS Write Token',               required: true,  hint: 'sanity.io/manage → API → Tokens' },
  { key: 'RESEND_API_KEY',             label: 'Resend Email',                         required: true,  hint: 'resend.com → API Keys' },
  { key: 'CRON_SECRET',                label: 'Cron Secret',                          required: true,  hint: 'Random string — already set' },
  { key: 'YOUTUBE_API_KEY',            label: 'YouTube Data API',                     required: false, hint: 'Google Cloud Console' },
  { key: 'ALGOLIA_ADMIN_KEY',          label: 'Algolia Search',                       required: false, hint: 'algolia.com → Settings' },
  { key: 'GOOGLE_PLACES_API_KEY',      label: 'Google Places (Range Finder)',         required: false, hint: 'console.cloud.google.com' },
  { key: 'DISCORD_WEBHOOK_URL',        label: 'Discord #agent-status',                required: false, hint: 'Discord channel webhooks' },
  { key: 'DISCORD_ERRORS_WEBHOOK',     label: 'Discord #errors',                      required: false, hint: 'Discord channel webhooks' },
  { key: 'DISCORD_BREAKING_WEBHOOK',   label: 'Discord #breaking-alerts',             required: false, hint: 'Discord channel webhooks' },
  { key: 'NEWSAPI_KEY',                label: 'NewsAPI ($449/mo)',                    required: false, hint: 'newsapi.org' },
  { key: 'GNEWS_KEY',                  label: 'GNews ($9/mo)',                        required: false, hint: 'gnews.io' },
  { key: 'LEGISCAN_KEY',               label: 'LegiScan ($50/mo)',                    required: false, hint: 'legiscan.com' },
]

const S = {
  dark:   { bg: '#0A0B0C', bg2: '#111318', bg3: '#16191F', border: '#1F2428', text: '#F5F5F3', muted: '#6B7280', gold: '#C8922A', red: '#EF4444', green: '#34D399' },
}

export default function AdminPage() {
  const [secret, setSecret]             = useState('')
  const [authed, setAuthed]             = useState(false)
  const [activeTab, setActiveTab]       = useState('feeds')
  const [feedResults, setFeedResults]   = useState({})
  const [loadingFeed, setLoadingFeed]   = useState(null)
  const [apiStatus, setApiStatus]       = useState({})
  const [siteOk, setSiteOk]             = useState(null)
  const [channels, setChannels]         = useState(DEFAULT_CHANNELS)
  const [newChId, setNewChId]           = useState('')
  const [newChName, setNewChName]       = useState('')
  const [urgency, setUrgency]           = useState(8)
  const [rssFeeds, setRssFeeds]         = useState([
    'https://www.thefirearmblog.com/blog/feed/',
    'https://www.ammoland.com/feed/',
    'https://www.thetruthaboutguns.com/feed/',
    'https://www.nraila.org/rss/',
    'https://www.guns.com/feed',
  ])
  const [newRss, setNewRss]             = useState('')
  const [saved, setSaved]               = useState(false)

  function login(e) {
    e.preventDefault()
    sessionStorage.setItem('dr_admin', secret)
    setAuthed(true)
  }

  useEffect(() => {
    const s = sessionStorage.getItem('dr_admin')
    if (s) { setSecret(s); setAuthed(true) }
  }, [])

  useEffect(() => {
    if (!authed) return
    checkStatus()
    checkSite()
    const saved = localStorage.getItem('dr_channels')
    if (saved) try { setChannels(JSON.parse(saved)) } catch {}
    const savedRss = localStorage.getItem('dr_rss_feeds')
    if (savedRss) try { setRssFeeds(JSON.parse(savedRss)) } catch {}
    const savedUrgency = localStorage.getItem('dr_urgency')
    if (savedUrgency) setUrgency(Number(savedUrgency))
  }, [authed])

  async function checkStatus() {
    const res = await fetch('/api/admin/status', { headers: { Authorization: `Bearer ${secret}` } }).catch(() => null)
    if (res?.ok) { const d = await res.json(); setApiStatus(d.keys || {}) }
  }

  async function checkSite() {
    const start = Date.now()
    try { await fetch('/'); setSiteOk({ ok: true, ms: Date.now() - start }) }
    catch { setSiteOk({ ok: false, ms: 0 }) }
    setSiteOk({ ok: true, ms: Date.now() - start })
  }

  async function runFeed(key) {
    setLoadingFeed(key)
    try {
      const r = await fetch(`/api/agent?feed=${key}`, { headers: { Authorization: `Bearer ${secret}` } })
      const d = await r.json()
      setFeedResults(p => ({ ...p, [key]: d }))
    } catch (e) {
      setFeedResults(p => ({ ...p, [key]: { error: e.message } }))
    }
    setLoadingFeed(null)
  }

  async function runAlgolia() {
    setLoadingFeed('algolia')
    const r = await fetch('/api/algolia-sync', { headers: { Authorization: `Bearer ${secret}` } }).catch(() => null)
    const d = await r?.json().catch(() => ({}))
    setFeedResults(p => ({ ...p, algolia: d }))
    setLoadingFeed(null)
  }

  function saveChannels() {
    localStorage.setItem('dr_channels', JSON.stringify(channels))
    localStorage.setItem('dr_urgency', String(urgency))
    localStorage.setItem('dr_rss_feeds', JSON.stringify(rssFeeds))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function addChannel() {
    if (!newChId.trim() || !newChName.trim()) return
    setChannels(p => [...p, { id: newChId.trim(), name: newChName.trim(), enabled: true }])
    setNewChId(''); setNewChName('')
  }

  function removeChannel(id) { setChannels(p => p.filter(c => c.id !== id)) }
  function toggleChannel(id) { setChannels(p => p.map(c => c.id === id ? { ...c, enabled: !c.enabled } : c)) }

  function addRss() {
    if (!newRss.trim()) return
    setRssFeeds(p => [...p, newRss.trim()])
    setNewRss('')
  }

  const C = S.dark
  const btn = (label, onClick, loading, variant='gold') => (
    <button onClick={onClick} disabled={loading}
      style={{ background: loading ? C.bg3 : variant==='gold' ? C.gold : 'transparent', color: loading ? C.muted : variant==='gold' ? '#000' : C.gold, border: `1px solid ${variant==='gold' ? C.gold : '#1F2428'}`, padding: '8px 16px', fontFamily: 'monospace', fontWeight: 700, fontSize: '11px', cursor: 'pointer', whiteSpace: 'nowrap', opacity: loading ? 0.6 : 1 }}>
      {loading ? 'RUNNING...' : label}
    </button>
  )

  if (!authed) return (
    <div style={{ background: C.bg, minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '40px', width: 360 }}>
        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: C.gold, marginBottom: 8, letterSpacing: '0.05em' }}>DOWNRANGE ADMIN</div>
        <p style={{ fontFamily: 'monospace', fontSize: '12px', color: C.muted, marginBottom: 24 }}>Enter CRON_SECRET to access dashboard</p>
        <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input type="password" value={secret} onChange={e => setSecret(e.target.value)} placeholder="CRON_SECRET value..."
            style={{ background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: '12px', fontFamily: 'monospace', fontSize: 13 }} />
          <button type="submit" style={{ background: C.gold, color: '#000', border: 'none', padding: 12, fontFamily: 'monospace', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            ACCESS →
          </button>
        </form>
      </div>
    </div>
  )

  const tabs = [
    { key: 'feeds',    label: '⚡ Feeds' },
    { key: 'channels', label: '▶ Video Channels' },
    { key: 'rss',      label: '📰 RSS Sources' },
    { key: 'keys',     label: '🔑 API Keys' },
    { key: 'settings', label: '⚙ Settings' },
  ]

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      {/* Top bar */}
      <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '16px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: C.gold, letterSpacing: '0.05em' }}>DOWNRANGE ADMIN</span>
          {siteOk && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: siteOk.ok ? C.green : C.red, display: 'inline-block' }} />
              <span style={{ fontFamily: 'monospace', fontSize: '11px', color: siteOk.ok ? C.green : C.red }}>SITE {siteOk.ok ? 'ONLINE' : 'DOWN'}</span>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/" style={{ fontFamily: 'monospace', fontSize: '11px', color: C.muted, textDecoration: 'none' }}>← BACK TO SITE</Link>
          <button onClick={() => { sessionStorage.removeItem('dr_admin'); setAuthed(false) }}
            style={{ background: 'none', border: `1px solid ${C.border}`, color: C.muted, padding: '6px 12px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>
            LOGOUT
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background: C.bg2, borderBottom: `1px solid ${C.border}`, padding: '0 32px', display: 'flex', gap: 0 }}>
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            style={{ background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === t.key ? C.gold : 'transparent'}`, color: activeTab === t.key ? C.gold : C.muted, padding: '14px 20px', fontFamily: 'monospace', fontSize: '12px', cursor: 'pointer', transition: 'color 0.15s', letterSpacing: '0.05em' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: '32px', maxWidth: 1100, margin: '0 auto' }}>

        {/* ── FEEDS TAB ── */}
        {activeTab === 'feeds' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: C.gold, letterSpacing: '0.15em', marginBottom: 16 }}>FEED CONTROLS</div>
              {FEEDS.map(f => (
                <div key={f.key} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '13px', color: C.text, fontWeight: 600 }}>{f.icon} {f.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: C.muted, marginTop: 2 }}>{f.schedule}</div>
                    {feedResults[f.key] && (
                      <div style={{ fontFamily: 'monospace', fontSize: '10px', marginTop: 4, color: feedResults[f.key].error ? C.red : C.green }}>
                        {feedResults[f.key].error ? `✗ ${feedResults[f.key].error}` : `✓ ${feedResults[f.key].result?.done ?? 0} published`}
                      </div>
                    )}
                  </div>
                  {btn('RUN NOW →', () => runFeed(f.key), loadingFeed === f.key)}
                </div>
              ))}
              <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: C.text, fontWeight: 600 }}>🔍 Algolia Full Reindex</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: C.muted, marginTop: 2 }}>Rebuild all search indices</div>
                  {feedResults.algolia && <div style={{ fontFamily: 'monospace', fontSize: '10px', marginTop: 4, color: C.green }}>✓ Reindexed</div>}
                </div>
                {btn('REINDEX →', runAlgolia, loadingFeed === 'algolia', 'outline')}
              </div>
            </div>
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: C.gold, letterSpacing: '0.15em', marginBottom: 16 }}>QUICK LINKS</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {['/news','/laws','/market','/deals','/ranges','/guns','/reviews','/studio'].map(l => (
                  <Link key={l} href={l} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '10px 14px', fontFamily: 'monospace', fontSize: '11px', color: C.muted, textDecoration: 'none', display: 'block' }}>
                    {l.toUpperCase()} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── VIDEO CHANNELS TAB ── */}
        {activeTab === 'channels' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: C.gold, letterSpacing: '0.15em', marginBottom: 16 }}>YOUTUBE CHANNELS</div>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', color: C.muted, marginBottom: 24, lineHeight: 1.7 }}>
              These channels are pulled by the video feed agent every 4 hours. Requires YOUTUBE_API_KEY in Vercel env vars. Toggle channels on/off or add new ones. Changes saved to browser — to make permanent, update agent/feeds/video.js.
            </p>

            {channels.map(ch => (
              <div key={ch.id} style={{ background: C.bg2, border: `1px solid ${ch.enabled ? C.border : '#1A1A1A'}`, padding: '14px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12, opacity: ch.enabled ? 1 : 0.5 }}>
                <button onClick={() => toggleChannel(ch.id)}
                  style={{ width: 36, height: 20, borderRadius: 10, background: ch.enabled ? C.gold : C.bg3, border: 'none', cursor: 'pointer', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, left: ch.enabled ? 18 : 3, width: 14, height: 14, borderRadius: '50%', background: ch.enabled ? '#000' : C.muted, transition: 'left 0.2s' }} />
                </button>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '13px', color: C.text, fontWeight: 600 }}>{ch.name}</div>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: C.muted }}>ID: {ch.id}</div>
                </div>
                <a href={`https://youtube.com/channel/${ch.id}`} target="_blank" rel="noreferrer"
                  style={{ fontFamily: 'monospace', fontSize: '10px', color: '#60A5FA', textDecoration: 'none' }}>YT →</a>
                <button onClick={() => removeChannel(ch.id)}
                  style={{ background: 'none', border: 'none', color: C.red, fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer', padding: '4px 8px' }}>✕</button>
              </div>
            ))}

            <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '16px', marginTop: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: C.muted, marginBottom: 12 }}>ADD CHANNEL</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                <input value={newChId} onChange={e => setNewChId(e.target.value)} placeholder="YouTube Channel ID (UCxxxxxxx)"
                  style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', fontFamily: 'monospace', fontSize: '12px' }} />
                <input value={newChName} onChange={e => setNewChName(e.target.value)} placeholder="Channel name"
                  style={{ width: 180, background: C.bg, border: `1px solid ${C.border}`, color: C.text, padding: '8px 10px', fontFamily: 'monospace', fontSize: '12px' }} />
              </div>
              <p style={{ fontFamily: 'monospace', fontSize: '10px', color: C.muted, marginBottom: 10 }}>
                Find Channel ID: go to the YouTube channel → View Page Source → search "channelId"
              </p>
              <button onClick={addChannel} style={{ background: C.gold, color: '#000', border: 'none', padding: '8px 20px', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                ADD CHANNEL
              </button>
            </div>

            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button onClick={saveChannels} style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 24px', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                {saved ? '✓ SAVED' : 'SAVE CHANGES'}
              </button>
              {btn('RUN VIDEO FEED NOW →', () => runFeed('video'), loadingFeed === 'video')}
            </div>
          </div>
        )}

        {/* ── RSS SOURCES TAB ── */}
        {activeTab === 'rss' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: C.gold, letterSpacing: '0.15em', marginBottom: 16 }}>NEWS RSS FEEDS</div>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', color: C.muted, marginBottom: 24, lineHeight: 1.7 }}>
              These RSS feeds are pulled by the news agent every 15 minutes. No API key required. Changes saved to browser — to make permanent, update agent/feeds/news.js RSS_FEEDS array.
            </p>
            {rssFeeds.map((url, i) => (
              <div key={i} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '12px', color: C.text, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
                <a href={url} target="_blank" rel="noreferrer" style={{ fontFamily: 'monospace', fontSize: '10px', color: '#60A5FA', textDecoration: 'none', flexShrink: 0 }}>TEST →</a>
                <button onClick={() => setRssFeeds(p => p.filter((_, j) => j !== i))}
                  style={{ background: 'none', border: 'none', color: C.red, cursor: 'pointer', fontFamily: 'monospace', fontSize: '11px', flexShrink: 0 }}>✕</button>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <input value={newRss} onChange={e => setNewRss(e.target.value)} placeholder="https://example.com/feed.xml"
                style={{ flex: 1, background: C.bg2, border: `1px solid ${C.border}`, color: C.text, padding: '10px 12px', fontFamily: 'monospace', fontSize: '12px' }} />
              <button onClick={addRss} style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 20px', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>ADD</button>
            </div>
            <div style={{ marginTop: 16, display: 'flex', gap: 12 }}>
              <button onClick={saveChannels} style={{ background: C.gold, color: '#000', border: 'none', padding: '10px 24px', fontFamily: 'monospace', fontWeight: 700, fontSize: '12px', cursor: 'pointer' }}>
                {saved ? '✓ SAVED' : 'SAVE CHANGES'}
              </button>
              {btn('RUN NEWS FEED NOW →', () => runFeed('news'), loadingFeed === 'news')}
            </div>
          </div>
        )}

        {/* ── API KEYS TAB ── */}
        {activeTab === 'keys' && (
          <div style={{ maxWidth: 700 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: C.gold, letterSpacing: '0.15em', marginBottom: 8 }}>API KEY STATUS</div>
            <p style={{ fontFamily: 'monospace', fontSize: '12px', color: C.muted, marginBottom: 20, lineHeight: 1.7 }}>
              All keys must be set in Vercel → Settings → Environment Variables. Status is read from your live server.
            </p>
            {API_KEYS.map(k => {
              const ok = apiStatus[k.key]
              return (
                <div key={k.key} style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '12px 16px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: 'monospace', fontSize: '12px', color: C.text, fontWeight: 600 }}>{k.label}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '10px', color: C.muted, marginTop: 2 }}>{k.hint}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    {k.required && <span style={{ fontFamily: 'monospace', fontSize: '9px', color: C.red, background: '#1A0000', padding: '2px 6px' }}>REQUIRED</span>}
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: ok === null ? '#374151' : ok ? C.green : C.red, display: 'inline-block' }} />
                    <span style={{ fontFamily: 'monospace', fontSize: '10px', color: ok === null ? '#374151' : ok ? C.green : C.red, minWidth: 50 }}>
                      {ok === null ? '—' : ok ? 'SET ✓' : 'MISSING ✗'}
                    </span>
                  </div>
                </div>
              )
            })}
            <button onClick={checkStatus} style={{ marginTop: 12, background: 'none', border: `1px solid ${C.border}`, color: C.muted, padding: '10px 20px', fontFamily: 'monospace', fontSize: '11px', cursor: 'pointer' }}>
              REFRESH STATUS
            </button>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeTab === 'settings' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: C.gold, letterSpacing: '0.15em', marginBottom: 24 }}>SITE SETTINGS</div>

            <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: C.text, marginBottom: 12, fontWeight: 600 }}>Breaking Alert Urgency Threshold</div>
              <p style={{ fontFamily: 'monospace', fontSize: '11px', color: C.muted, marginBottom: 14, lineHeight: 1.6 }}>
                Articles with urgency score ≥ this value will trigger a Breaking Alert banner and Discord ping to #breaking-alerts.
              </p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <input type="range" min="5" max="10" value={urgency} onChange={e => setUrgency(Number(e.target.value))} style={{ flex: 1 }} />
                <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: C.red, minWidth: 32 }}>{urgency}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '10px', color: C.muted }}>/ 10</span>
              </div>
              <div style={{ fontFamily: 'monospace', fontSize: '10px', color: C.muted, marginTop: 8 }}>
                {urgency <= 7 ? '⚠ Low threshold — many articles will trigger breaking alerts' : urgency === 8 ? '✓ Recommended: SCOTUS, ATF rules, major legislation' : '◈ High threshold — only the most critical stories alert'}
              </div>
            </div>

            <div style={{ background: C.bg2, border: `1px solid ${C.border}`, padding: '20px', marginBottom: 16 }}>
              <div style={{ fontFamily: 'monospace', fontSize: '12px', color: C.text, marginBottom: 12, fontWeight: 600 }}>Site Information</div>
              {[
                ['Site URL', 'https://downrangeco.com'],
                ['GitHub', 'github.com/dejcav-cmd/DownRange'],
                ['Sanity Project', 'vbnsqnkg'],
                ['Hosting', 'Vercel Pro'],
                ['CMS', 'Sanity v3'],
                ['Framework', 'Next.js 14.2.29'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: C.muted }}>{k}</span>
                  <span style={{ fontFamily: 'monospace', fontSize: '11px', color: C.text }}>{v}</span>
                </div>
              ))}
            </div>

            <button onClick={saveChannels} style={{ background: C.gold, color: '#000', border: 'none', padding: '12px 28px', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}>
              {saved ? '✓ ALL SETTINGS SAVED' : 'SAVE ALL SETTINGS'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
