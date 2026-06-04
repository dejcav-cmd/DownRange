'use client'
import { useState, useEffect, useCallback } from 'react'

const PLATFORMS = {
  twitter:   { label: 'X / Twitter',  icon: '𝕏',  color: '#000000', envKeys: ['TWITTER_API_KEY','TWITTER_ACCESS_TOKEN'], setupUrl: 'https://developer.twitter.com' },
  facebook:  { label: 'Facebook',     icon: '󰈌',  color: '#1877F2', envKeys: ['FACEBOOK_PAGE_ACCESS_TOKEN','FACEBOOK_PAGE_ID'], setupUrl: 'https://developers.facebook.com' },
  threads:   { label: 'Threads',      icon: '@',  color: '#000000', envKeys: ['THREADS_ACCESS_TOKEN','THREADS_USER_ID'], setupUrl: 'https://developers.facebook.com/docs/threads' },
  bluesky:   { label: 'Bluesky',      icon: '🦋', color: '#0085FF', envKeys: ['BLUESKY_HANDLE','BLUESKY_APP_PASSWORD'], setupUrl: 'https://bsky.app' },
  instagram: { label: 'Instagram',    icon: '📸', color: '#E1306C', envKeys: ['INSTAGRAM_ACCESS_TOKEN'], setupUrl: 'https://developers.facebook.com/docs/instagram' },
}

const STATUS_STYLE = {
  posted:    { bg:'#052e16', color:'#34d399', label:'POSTED' },
  failed:    { bg:'#2a0000', color:'#ef4444', label:'FAILED' },
  draft:     { bg:'#111318', color:'#9ca3af', label:'DRAFT' },
  scheduled: { bg:'#0c1a2e', color:'#60a5fa', label:'QUEUED' },
  skipped:   { bg:'#111318', color:'#4b5563', label:'SKIPPED' },
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr / 24)}d ago`
}

function PlatformBadge({ platform, size = 'sm' }) {
  const p = PLATFORMS[platform] || { label: platform, icon: '?', color: '#6b7280' }
  const px = size === 'lg' ? '8px 14px' : '3px 8px'
  const fs = size === 'lg' ? '13px' : '11px'
  return (
    <span style={{ background: p.color + '22', color: p.color, border: `1px solid ${p.color}44`, padding: px, fontFamily:"'IBM Plex Mono',monospace", fontSize: fs, fontWeight: 700, borderRadius: 2, whiteSpace:'nowrap' }}>
      {p.icon} {p.label}
    </span>
  )
}

// ── Overview Stats Row ────────────────────────────────────────────────────────
function StatsRow({ stats }) {
  const items = [
    { label:'Total Posts',  value: stats.total,    color:'#e5e5e5' },
    { label:'Posted',       value: stats.posted,   color:'#34d399' },
    { label:'Failed',       value: stats.failed,   color:'#ef4444' },
    { label:'Drafts',       value: stats.drafts,   color:'#9ca3af' },
    { label:'Today',        value: stats.today,    color:'#c8922a' },
    { label:'This Week',    value: stats.thisWeek, color:'#60a5fa' },
  ]
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:20 }}>
      {items.map(item => (
        <div key={item.label} style={{ background:'#111318', border:'1px solid #1f2428', padding:'14px 16px', textAlign:'center' }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', color: item.color, lineHeight:1 }}>{item.value ?? '—'}</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', letterSpacing:'0.1em', marginTop:4 }}>{item.label}</div>
        </div>
      ))}
    </div>
  )
}

// ── Platform Setup Card ───────────────────────────────────────────────────────
function PlatformCard({ pid, configured, enabled, onToggle }) {
  const p = PLATFORMS[pid]
  return (
    <div style={{ background:'#111318', border: `1px solid ${configured ? (enabled ? p.color + '60' : '#1f2428') : '#1f2428'}`, padding:'16px 20px', display:'flex', alignItems:'center', gap:14 }}>
      <div style={{ width:40, height:40, background: p.color + '22', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0, border:`1px solid ${p.color}33` }}>
        {p.icon}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'15px', fontWeight:700, color:'#e5e5e5', letterSpacing:'0.05em' }}>{p.label}</div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color: configured ? '#34d399' : '#ef4444', marginTop:3 }}>
          {configured ? '✓ API keys configured' : '✗ Needs setup — add API keys to Vercel'}
        </div>
      </div>
      {configured ? (
        <button
          onClick={() => onToggle(pid)}
          style={{ background: enabled ? p.color : 'transparent', border:`1px solid ${enabled ? p.color : '#374151'}`, color: enabled ? '#000' : '#6b7280', padding:'6px 14px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.08em', cursor:'pointer' }}
        >
          {enabled ? '● ACTIVE' : '○ INACTIVE'}
        </button>
      ) : (
        <a href={p.setupUrl} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#c8922a', textDecoration:'none' }}>
          Setup guide ↗
        </a>
      )}
    </div>
  )
}

// ── Post Card ─────────────────────────────────────────────────────────────────
function PostCard({ post, onDelete }) {
  const [expanded, setExpanded] = useState(false)
  const st = STATUS_STYLE[post.status] || STATUS_STYLE.draft

  return (
    <div style={{ background:'#111318', border:'1px solid #1f2428', marginBottom:4 }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', cursor:'pointer' }}
      >
        <PlatformBadge platform={post.platform} />
        <span style={{ background: st.bg, color: st.color, padding:'2px 8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', fontWeight:700, letterSpacing:'0.1em', flexShrink:0 }}>
          {st.label}
        </span>
        <span style={{ flex:1, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13px', color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {post.articleTitle || post.content?.slice(0,80)}
        </span>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', flexShrink:0 }}>
          {timeAgo(post.postedAt || post.scheduledAt)}
        </span>
        {post.urgencyScore && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#c8922a', flexShrink:0 }}>
            ⚡{post.urgencyScore}
          </span>
        )}
        <span style={{ color:'#4b5563', fontSize:'12px' }}>{expanded ? '▲' : '▼'}</span>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop:'1px solid #1f2428', padding:'14px 16px', background:'#0d1117' }}>
          {/* Post content */}
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#9ca3af', lineHeight:1.7, whiteSpace:'pre-wrap', background:'#111318', padding:'12px 14px', border:'1px solid #1f2428', marginBottom:12 }}>
            {post.content}
          </div>

          {/* Meta row */}
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' }}>
            {post.postUrl && (
              <a href={post.postUrl} target="_blank" rel="noreferrer"
                style={{ display:'inline-flex', alignItems:'center', gap:6, background:'#c8922a', color:'#000', padding:'6px 14px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.08em', textDecoration:'none' }}>
                VIEW LIVE POST ↗
              </a>
            )}
            {post.articleSlug && (
              <a href={`/news/${post.articleSlug}`} target="_blank" rel="noreferrer"
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#60a5fa', textDecoration:'none' }}>
                Source article ↗
              </a>
            )}
            {post.error && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#ef4444' }}>
                Error: {post.error}
              </span>
            )}
            {post.metrics?.impressions > 0 && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#9ca3af' }}>
                👁 {post.metrics.impressions} · ❤ {post.metrics.likes} · 🔁 {post.metrics.reposts}
              </span>
            )}
            <button
              onClick={() => onDelete(post._id)}
              style={{ marginLeft:'auto', background:'none', border:'1px solid #1f2428', color:'#4b5563', padding:'4px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', cursor:'pointer' }}
            >
              DELETE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Manual Post Composer ──────────────────────────────────────────────────────
function PostComposer({ adminKey, onPosted }) {
  const [platforms, setPlatforms] = useState(['twitter'])
  const [dryRun,    setDryRun]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [result,    setResult]    = useState(null)

  async function firePost() {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch('/api/social/post', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ platforms, dryRun }),
      })
      const data = await res.json()
      setResult(data)
      if (data.posted > 0) onPosted?.()
    } catch (e) {
      setResult({ ok: false, error: e.message })
    }
    setLoading(false)
  }

  function togglePlatform(pid) {
    setPlatforms(prev => prev.includes(pid) ? prev.filter(p => p !== pid) : [...prev, pid])
  }

  return (
    <div style={{ background:'#111318', border:'1px solid #c8922a40', padding:'20px 24px' }}>
      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'16px', fontWeight:700, letterSpacing:'0.1em', color:'#c8922a', marginBottom:16 }}>
        ⚡ FIRE NOW — POST TOP ARTICLES
      </div>
      <div style={{ fontSize:'13px', color:'#6b7280', marginBottom:16 }}>
        Auto-picks the highest urgency unposted articles and generates platform-optimized copy.
      </div>

      {/* Platform toggles */}
      <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:16 }}>
        {Object.entries(PLATFORMS).map(([pid, p]) => (
          <button
            key={pid}
            onClick={() => togglePlatform(pid)}
            style={{ background: platforms.includes(pid) ? p.color + '22' : 'transparent', border:`1px solid ${platforms.includes(pid) ? p.color : '#374151'}`, color: platforms.includes(pid) ? p.color : '#6b7280', padding:'6px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#9ca3af', cursor:'pointer' }}>
          <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} />
          Dry run (generates copy, no actual posting)
        </label>
        <button
          onClick={firePost}
          disabled={loading || platforms.length === 0}
          style={{ background: loading ? '#8a6320' : '#c8922a', color:'#000', border:'none', padding:'10px 28px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, letterSpacing:'0.1em', cursor: loading ? 'not-allowed' : 'pointer' }}
        >
          {loading ? 'POSTING...' : dryRun ? '👁 DRY RUN' : '🚀 POST NOW'}
        </button>
      </div>

      {result && (
        <div style={{ marginTop:14, padding:'12px 16px', background: result.ok ? '#052e16' : '#2a0000', border:`1px solid ${result.ok ? '#34d39940' : '#ef444440'}`, fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color: result.ok ? '#34d399' : '#ef4444' }}>
          {result.ok
            ? `✓ ${result.dryRun ? 'Generated' : 'Posted'}: ${result.posted || result.total} posts across ${platforms.length} platform(s)`
            : `✗ Error: ${result.error}`
          }
          {result.results?.map((r,i) => (
            <div key={i} style={{ marginTop:6, color: r.status === 'posted' || r.status === 'draft' ? '#34d399' : '#ef4444' }}>
              {PLATFORMS[r.platform]?.icon} {r.platform}: {r.status} — {r.title?.slice(0,50)}
              {r.postUrl && <a href={r.postUrl} target="_blank" rel="noreferrer" style={{ color:'#60a5fa', marginLeft:8 }}>↗ view</a>}
              {r.error && <span style={{ color:'#f87171', marginLeft:8 }}>{r.error}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Config Panel ──────────────────────────────────────────────────────────────
function ConfigPanel({ adminKey, config, configured, onSaved }) {
  const [form, setForm]     = useState({
    enabled:        config?.enabled || false,
    postsPerDay:    config?.postsPerDay || 3,
    postTimes:      (config?.postTimes || [13,18,23]).join(', '),
    minUrgencyScore: config?.minUrgencyScore || 5,
    platforms:      config?.platforms || ['twitter'],
  })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  async function save() {
    setSaving(true)
    try {
      const res = await fetch('/api/social/config', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({
          ...form,
          postTimes: form.postTimes.split(',').map(t => parseInt(t.trim())).filter(Boolean),
        }),
      })
      const data = await res.json()
      setMsg(data.ok ? '✓ Config saved' : `✗ ${data.error}`)
      onSaved?.()
    } catch (e) {
      setMsg(`✗ ${e.message}`)
    }
    setSaving(false)
    setTimeout(() => setMsg(''), 3000)
  }

  function togglePlatform(pid) {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(pid) ? f.platforms.filter(p => p !== pid) : [...f.platforms, pid]
    }))
  }

  const F = {
    label: (text) => (
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280', letterSpacing:'0.1em', marginBottom:5 }}>{text}</div>
    ),
    input: (key, type = 'text') => (
      <input
        type={type}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
        style={{ background:'#09090b', border:'1px solid #1f2428', color:'#e5e5e5', padding:'8px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', width:'100%', outline:'none', boxSizing:'border-box' }}
      />
    ),
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
      <div>
        <div className="panel-title" style={{ marginBottom:16 }}>Auto-Post Schedule</div>

        <div style={{ marginBottom:14 }}>
          {F.label('MASTER SWITCH')}
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <div
              onClick={() => setForm(f => ({ ...f, enabled: !f.enabled }))}
              style={{ width:48, height:26, borderRadius:13, background: form.enabled ? '#c8922a' : '#1f2428', position:'relative', cursor:'pointer', transition:'background 0.2s', flexShrink:0 }}>
              <div style={{ position:'absolute', top:3, left: form.enabled ? '25px' : '3px', width:20, height:20, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
            </div>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color: form.enabled ? '#c8922a' : '#6b7280' }}>
              {form.enabled ? 'AUTO-POSTING ENABLED' : 'AUTO-POSTING DISABLED'}
            </span>
          </label>
        </div>

        <div style={{ marginBottom:14 }}>
          {F.label('POSTS PER DAY (per platform)')}
          {F.input('postsPerDay', 'number')}
        </div>

        <div style={{ marginBottom:14 }}>
          {F.label('POST TIMES (UTC hours, comma-separated)')}
          {F.input('postTimes')}
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', marginTop:4 }}>
            e.g. 13, 18, 23 = 9am ET, 2pm ET, 7pm ET
          </div>
        </div>

        <div style={{ marginBottom:14 }}>
          {F.label('MIN URGENCY SCORE TO AUTO-POST (1-10)')}
          {F.input('minUrgencyScore', 'number')}
        </div>
      </div>

      <div>
        <div className="panel-title" style={{ marginBottom:16 }}>Active Platforms</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:20 }}>
          {Object.entries(PLATFORMS).map(([pid, p]) => (
            <div
              key={pid}
              onClick={() => togglePlatform(pid)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: form.platforms.includes(pid) ? p.color + '11' : '#0d1117', border:`1px solid ${form.platforms.includes(pid) ? p.color + '60' : '#1f2428'}`, cursor:'pointer' }}
            >
              <span style={{ fontSize:'18px' }}>{p.icon}</span>
              <span style={{ flex:1, fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color: form.platforms.includes(pid) ? p.color : '#6b7280' }}>{p.label}</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color: configured[pid] ? '#34d399' : '#4b5563' }}>
                {configured[pid] ? '✓ READY' : '✗ NEEDS KEYS'}
              </span>
              <div style={{ width:16, height:16, borderRadius:'50%', background: form.platforms.includes(pid) ? p.color : 'transparent', border:`2px solid ${form.platforms.includes(pid) ? p.color : '#374151'}` }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:16 }}>
        <button
          onClick={save}
          disabled={saving}
          style={{ background:'#c8922a', color:'#000', border:'none', padding:'10px 28px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, letterSpacing:'0.1em', cursor: saving ? 'not-allowed' : 'pointer' }}
        >
          {saving ? 'SAVING...' : '💾 SAVE CONFIG'}
        </button>
        {msg && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color: msg.startsWith('✓') ? '#34d399' : '#ef4444' }}>{msg}</span>}
      </div>
    </div>
  )
}

// ── API Keys Setup Panel ──────────────────────────────────────────────────────
function ApiKeysPanel() {
  const rows = [
    { platform:'twitter',   keys: [
      { var:'TWITTER_API_KEY',              label:'API Key',              hint:'From Twitter Developer Portal → App → Keys and Tokens' },
      { var:'TWITTER_API_SECRET',           label:'API Key Secret',       hint:'From Twitter Developer Portal → App → Keys and Tokens' },
      { var:'TWITTER_ACCESS_TOKEN',         label:'Access Token',         hint:'From Twitter Developer Portal → App → Keys and Tokens (User Auth)' },
      { var:'TWITTER_ACCESS_TOKEN_SECRET',  label:'Access Token Secret',  hint:'From Twitter Developer Portal → App → Keys and Tokens (User Auth)' },
      { var:'TWITTER_HANDLE',               label:'Handle (no @)',         hint:'e.g. DownRangeCo' },
    ]},
    { platform:'facebook',  keys: [
      { var:'FACEBOOK_PAGE_ACCESS_TOKEN', label:'Page Access Token',   hint:'Meta for Developers → Graph API Explorer → Generate Page Token' },
      { var:'FACEBOOK_PAGE_ID',           label:'Page ID',             hint:'Facebook Page → About → Page ID' },
    ]},
    { platform:'threads',   keys: [
      { var:'THREADS_ACCESS_TOKEN', label:'Access Token',  hint:'Same as Instagram/Meta. Meta for Developers → Threads API' },
      { var:'THREADS_USER_ID',      label:'User ID',       hint:'From Threads API auth response' },
      { var:'THREADS_HANDLE',       label:'Handle (no @)', hint:'e.g. downrangeco' },
    ]},
    { platform:'bluesky',   keys: [
      { var:'BLUESKY_HANDLE',        label:'Handle',           hint:'e.g. downrangeco.bsky.social' },
      { var:'BLUESKY_APP_PASSWORD',  label:'App Password',     hint:'Bluesky Settings → Privacy and Security → App Passwords → Add App Password' },
    ]},
  ]

  return (
    <div>
      <div style={{ background:'#0c1a2e', border:'1px solid #1e3a5f', padding:'14px 18px', marginBottom:20 }}>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#60a5fa', fontWeight:700, marginBottom:6 }}>HOW TO ADD API KEYS</div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6b7280', lineHeight:1.8 }}>
          Go to <strong style={{color:'#9ca3af'}}>Vercel → your project → Settings → Environment Variables</strong> and add each key below. After adding, redeploy for changes to take effect. Never paste secrets in Sanity or this UI.
        </div>
      </div>
      {rows.map(({ platform, keys }) => {
        const p = PLATFORMS[platform]
        return (
          <div key={platform} style={{ marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <span style={{ fontSize:'16px' }}>{p.icon}</span>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'15px', fontWeight:700, color: p.color, letterSpacing:'0.08em' }}>{p.label}</span>
              <a href={p.setupUrl} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#c8922a', marginLeft:'auto' }}>Developer portal ↗</a>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {keys.map(k => (
                <div key={k.var} style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:12, padding:'8px 12px', background:'#0d1117', border:'1px solid #1f2428', alignItems:'start' }}>
                  <div>
                    <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#c8922a', fontWeight:700 }}>{k.var}</code>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', marginTop:2 }}>{k.label}</div>
                  </div>
                  <div style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12px', color:'#6b7280', lineHeight:1.5 }}>{k.hint}</div>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SocialMediaManager({ adminKey }) {
  const [tab,        setTab]        = useState('dashboard')
  const [posts,      setPosts]      = useState([])
  const [stats,      setStats]      = useState({})
  const [config,     setConfig]     = useState({})
  const [configured, setConfigured] = useState({})
  const [loading,    setLoading]    = useState(true)
  const [filterPlatform, setFilterPlatform] = useState('')
  const [filterStatus,   setFilterStatus]   = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logRes, cfgRes] = await Promise.all([
        fetch(`/api/social/log?limit=200${filterPlatform ? `&platform=${filterPlatform}` : ''}${filterStatus ? `&status=${filterStatus}` : ''}`, { headers:{'x-admin-key':adminKey} }),
        fetch('/api/social/config', { headers:{'x-admin-key':adminKey} }),
      ])
      const logData = await logRes.json()
      const cfgData = await cfgRes.json()
      if (logData.ok) { setPosts(logData.posts || []); setStats(logData.stats || {}) }
      if (cfgData.ok) { setConfig(cfgData.config || {}); setConfigured(cfgData.configured || {}) }
    } catch {}
    setLoading(false)
  }, [adminKey, filterPlatform, filterStatus])

  useEffect(() => { load() }, [load])

  async function deletePost(id) {
    await fetch('/api/social/log', { method:'DELETE', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body: JSON.stringify({id}) })
    setPosts(prev => prev.filter(p => p._id !== id))
    setStats(s => ({ ...s, total: s.total - 1 }))
  }

  const TABS = [
    { id:'dashboard', label:'📊 Dashboard' },
    { id:'compose',   label:'⚡ Fire Posts' },
    { id:'log',       label:'📋 Post Log' },
    { id:'config',    label:'⚙ Schedule' },
    { id:'platforms', label:'🔗 Platforms' },
    { id:'keys',      label:'🔑 API Keys' },
  ]

  return (
    <div>
      <style>{`
        .soc-tab { display:inline-flex; align-items:center; gap:6px; padding:8px 16px; cursor:pointer; font-family:'IBM Plex Mono',monospace; font-size:12px; letter-spacing:0.05em; border:none; background:none; color:#6b7280; border-bottom:2px solid transparent; transition:all 0.15s; }
        .soc-tab:hover { color:#e5e5e5; }
        .soc-tab.active { color:#c8922a; border-bottom-color:#c8922a; }
        .panel-title { font-family:'Barlow Condensed',sans-serif; font-size:16px; font-weight:700; letter-spacing:0.1em; color:#c8922a; text-transform:uppercase; }
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', color:'#e5e5e5', letterSpacing:'0.05em' }}>SOCIAL MEDIA COMMAND</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4b5563' }}>
            Auto-post · Multi-platform · AI-generated copy · Full audit log
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <div style={{ width:10, height:10, borderRadius:'50%', background: config.enabled ? '#34d399' : '#4b5563', boxShadow: config.enabled ? '0 0 8px #34d399' : 'none' }} />
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color: config.enabled ? '#34d399' : '#4b5563' }}>
            {config.enabled ? 'AUTO-POSTING ON' : 'AUTO-POSTING OFF'}
          </span>
          <button onClick={load} style={{ background:'none', border:'1px solid #1f2428', color:'#6b7280', padding:'5px 10px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px' }}>
            ↻ REFRESH
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom:'1px solid #1f2428', marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} className={`soc-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && tab === 'dashboard' && (
        <div style={{ textAlign:'center', padding:'40px', color:'#4b5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }}>Loading...</div>
      )}

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && !loading && (
        <div>
          <StatsRow stats={stats} />

          {/* Platform status grid */}
          <div style={{ marginBottom:24 }}>
            <div className="panel-title" style={{ marginBottom:12 }}>Platform Status</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {Object.keys(PLATFORMS).map(pid => (
                <PlatformCard
                  key={pid} pid={pid}
                  configured={configured[pid]}
                  enabled={config.platforms?.includes(pid)}
                  onToggle={(p) => {
                    const next = config.platforms?.includes(p)
                      ? config.platforms.filter(x => x !== p)
                      : [...(config.platforms || []), p]
                    setConfig(c => ({ ...c, platforms: next }))
                  }}
                />
              ))}
            </div>
          </div>

          {/* Recent posts */}
          <div>
            <div className="panel-title" style={{ marginBottom:12 }}>Recent Posts</div>
            {posts.slice(0,10).map(p => <PostCard key={p._id} post={p} onDelete={deletePost} />)}
            {posts.length === 0 && (
              <div style={{ textAlign:'center', padding:'32px', color:'#4b5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', border:'1px solid #1f2428' }}>
                No posts yet. Use the Fire Posts tab to start posting.
              </div>
            )}
            {posts.length > 10 && (
              <button onClick={() => setTab('log')} style={{ width:'100%', background:'none', border:'1px solid #1f2428', color:'#6b7280', padding:'10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer', marginTop:4 }}>
                VIEW ALL {posts.length} POSTS IN LOG →
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── COMPOSE / FIRE ── */}
      {tab === 'compose' && (
        <div>
          <PostComposer adminKey={adminKey} onPosted={load} />
          <div style={{ marginTop:20, padding:'16px 20px', background:'#111318', border:'1px solid #1f2428' }}>
            <div className="panel-title" style={{ marginBottom:10 }}>HOW IT WORKS</div>
            <div style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13px', color:'#6b7280', lineHeight:1.8 }}>
              1. Fetches your top unposted articles ranked by urgency score (highest first)<br/>
              2. AI generates platform-optimized copy for each platform (different tone per platform)<br/>
              3. Appends the article URL + relevant 2A hashtags<br/>
              4. Posts live and logs everything in the Post Log with direct links<br/>
              5. Dry run mode generates the copy but does not post — use it to preview
            </div>
          </div>
        </div>
      )}

      {/* ── POST LOG ── */}
      {tab === 'log' && (
        <div>
          {/* Filters */}
          <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap' }}>
            <select
              value={filterPlatform}
              onChange={e => setFilterPlatform(e.target.value)}
              style={{ background:'#09090b', border:'1px solid #1f2428', color:'#9ca3af', padding:'7px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}
            >
              <option value="">All platforms</option>
              {Object.entries(PLATFORMS).map(([pid, p]) => <option key={pid} value={pid}>{p.icon} {p.label}</option>)}
            </select>
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              style={{ background:'#09090b', border:'1px solid #1f2428', color:'#9ca3af', padding:'7px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}
            >
              <option value="">All statuses</option>
              {Object.keys(STATUS_STYLE).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4b5563', padding:'7px 0' }}>
              {posts.length} entries
            </span>
          </div>

          {posts.map(p => <PostCard key={p._id} post={p} onDelete={deletePost} />)}
          {posts.length === 0 && (
            <div style={{ textAlign:'center', padding:'48px', color:'#4b5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }}>
              No posts match the current filters.
            </div>
          )}
        </div>
      )}

      {/* ── SCHEDULE CONFIG ── */}
      {tab === 'config' && (
        <ConfigPanel adminKey={adminKey} config={config} configured={configured} onSaved={load} />
      )}

      {/* ── PLATFORM STATUS ── */}
      {tab === 'platforms' && (
        <div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {Object.keys(PLATFORMS).map(pid => (
              <PlatformCard
                key={pid} pid={pid}
                configured={configured[pid]}
                enabled={config.platforms?.includes(pid)}
                onToggle={() => {}}
              />
            ))}
          </div>
          <div style={{ marginTop:20, padding:'14px 18px', background:'#0c1a2e', border:'1px solid #1e3a5f' }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#60a5fa', marginBottom:6 }}>
              ADDING A NEW PLATFORM
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6b7280', lineHeight:1.8 }}>
              1. Get API credentials from the platform developer portal (link on each card above)<br/>
              2. Add the environment variables to Vercel → Settings → Environment Variables<br/>
              3. Redeploy — the platform card will show ✓ READY and you can activate it in Schedule settings
            </div>
          </div>
        </div>
      )}

      {/* ── API KEYS GUIDE ── */}
      {tab === 'keys' && <ApiKeysPanel />}
    </div>
  )
}
