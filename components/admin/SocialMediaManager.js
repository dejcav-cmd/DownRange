'use client'
import { useState, useEffect, useCallback } from 'react'

// ── Platform definitions — free/low-cost stack ────────────────────────────────
const PLATFORMS = {
  bluesky:  { label:'Bluesky',   icon:'🦋', color:'#0085FF', cost:'FREE',  costNote:'Direct AT Protocol. No API fees ever.', envKeys:['BLUESKY_HANDLE','BLUESKY_APP_PASSWORD'],     setupUrl:'https://bsky.app', setupSteps:['Create @downrangeco.bsky.social account','Settings → Privacy and Security → App Passwords → Add App Password','Name it "DownRange" and copy the password','Add BLUESKY_HANDLE (e.g. downrangeco.bsky.social) to Vercel','Add BLUESKY_APP_PASSWORD to Vercel → redeploy'] },
  threads:  { label:'Threads',   icon:'@',  color:'#111111', cost:'FREE',  costNote:'Meta Graph API. One-time App Review, then free forever.', envKeys:['THREADS_ACCESS_TOKEN','THREADS_USER_ID'],       setupUrl:'https://developers.facebook.com/docs/threads', setupSteps:['Create @downrangeco Threads account','Go to developers.facebook.com → Create App → Consumer type','Add "Threads API" product','Submit App Review (usually 1-3 days)','Generate User Access Token → add THREADS_ACCESS_TOKEN to Vercel','Add THREADS_USER_ID to Vercel → redeploy'] },
  facebook: { label:'Facebook',  icon:'f',  color:'#1877F2', cost:'FREE',  costNote:'Meta Graph API. Create a Page and generate a Page Access Token.', envKeys:['FACEBOOK_PAGE_ACCESS_TOKEN','FACEBOOK_PAGE_ID'], setupUrl:'https://developers.facebook.com', setupSteps:['Create DownRange Co. Facebook Page','Go to developers.facebook.com → Graph API Explorer','Select your app, select page, generate Page Access Token','Copy Page ID from Page About section','Add FACEBOOK_PAGE_ACCESS_TOKEN to Vercel','Add FACEBOOK_PAGE_ID to Vercel → redeploy'] },
  twitter:  { label:'X/Twitter', icon:'𝕏',  color:'#6b7280', cost:'PENDING', costNote:'Requires a Buffer Developer App. Free to create but needs setup first.', envKeys:['BUFFER_ACCESS_TOKEN','BUFFER_TWITTER_PROFILE_ID'], setupUrl:'https://buffer.com/developers/apps/create', setupSteps:[
    '1. Go to buffer.com/developers/apps/create and create an app',
    '2. Fill in any name (e.g. "DownRange") and callback URL (https://downrangeco.com)',
    '3. After creating, Buffer shows your Access Token on the app page — copy it',
    '4. Open in browser: https://api.bufferapp.com/1/profiles.json?access_token=YOUR_TOKEN',
    '5. Find the "id" field for your X/Twitter profile in that JSON',
    '6. Add BUFFER_ACCESS_TOKEN to Vercel env vars',
    '7. Add BUFFER_TWITTER_PROFILE_ID to Vercel env vars → redeploy',
    'Note: Buffer free tier allows 10 queued posts per channel. They absorb the $0.20/tweet X API cost.',
  ] },
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
  const min  = Math.floor(diff/60000)
  if (min < 2)  return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min/60)
  if (hr < 24)  return `${hr}h ago`
  return `${Math.floor(hr/24)}d ago`
}

// ── Sub-components ────────────────────────────────────────────────────────────
function CostBadge({ cost, small }) {
  const c = cost === 'FREE' ? '#34d399' : cost === 'PENDING' ? '#f59e0b' : cost === '~$0/mo' ? '#c8922a' : '#6b7280'
  return <span style={{ background: c+'22', color: c, border:`1px solid ${c}44`, padding: small ? '1px 6px' : '3px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize: small ? '9px' : '11px', fontWeight:700, letterSpacing:'0.08em' }}>{cost}</span>
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background:'#111318', border:'1px solid #1f2428', padding:'14px 16px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', color: color||'#e5e5e5', lineHeight:1 }}>{value ?? '—'}</div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', letterSpacing:'0.1em', marginTop:4 }}>{label}</div>
    </div>
  )
}

function PlatformStatusRow({ pid, configured, isActive }) {
  const p = PLATFORMS[pid]
  if (!p) return null
  return (
    <div style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background: configured ? (isActive ? '#0a0f08' : '#0d1117') : '#0d1117', border:`1px solid ${configured && isActive ? p.color+'40' : '#1f2428'}` }}>
      <span style={{ fontSize:'20px', width:28, textAlign:'center' }}>{p.icon}</span>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color: configured ? '#e5e5e5' : '#4b5563', letterSpacing:'0.05em' }}>{p.label}</div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', marginTop:2 }}>{p.costNote}</div>
      </div>
      <CostBadge cost={p.cost} small />
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color: configured ? (isActive ? '#34d399' : '#9ca3af') : '#ef4444' }}>
        {configured ? (isActive ? '● ACTIVE' : '○ READY') : '✗ NEEDS SETUP'}
      </div>
    </div>
  )
}

function PostCard({ post, onDelete }) {
  const [open, setOpen] = useState(false)
  const p  = PLATFORMS[post.platform] || { label: post.platform, icon:'?', color:'#6b7280' }
  const st = STATUS_STYLE[post.status] || STATUS_STYLE.draft
  return (
    <div style={{ background:'#111318', border:'1px solid #1f2428', marginBottom:3 }}>
      <div onClick={() => setOpen(x => !x)} style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 14px', cursor:'pointer', userSelect:'none' }}>
        <span style={{ background: p.color+'22', color: p.color, border:`1px solid ${p.color}33`, padding:'2px 7px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', fontWeight:700, flexShrink:0 }}>
          {p.icon} {p.label.toUpperCase()}
        </span>
        <span style={{ background: st.bg, color: st.color, padding:'2px 7px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', fontWeight:700, letterSpacing:'0.08em', flexShrink:0 }}>
          {st.label}
        </span>
        <span style={{ flex:1, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12px', color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {post.articleTitle || post.content?.slice(0,80)}
        </span>
        {post.hasImage && <span style={{ color:'#60a5fa', fontSize:'11px', flexShrink:0 }} title="Posted with image">🖼</span>}
        {post.urgencyScore >= 8 && <span style={{ color:'#ef4444', fontSize:'11px', flexShrink:0 }}>⚡{post.urgencyScore}</span>}
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151', flexShrink:0 }}>{timeAgo(post.postedAt || post.scheduledAt)}</span>
        <span style={{ color:'#374151', fontSize:'10px' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ borderTop:'1px solid #1f2428', padding:'12px 14px', background:'#0d1117' }}>
          <pre style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#9ca3af', lineHeight:1.7, whiteSpace:'pre-wrap', background:'#111318', padding:'10px 12px', border:'1px solid #1f2428', marginBottom:10, overflow:'auto' }}>
            {post.content}
          </pre>
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            {post.postUrl && (
              <a href={post.postUrl} target="_blank" rel="noreferrer" style={{ display:'inline-flex', alignItems:'center', gap:5, background:'#c8922a', color:'#000', padding:'5px 14px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.08em', textDecoration:'none' }}>
                VIEW LIVE POST ↗
              </a>
            )}
            {post.articleSlug && (
              <a href={`/news/${post.articleSlug}`} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#60a5fa', textDecoration:'none' }}>
                Source article ↗
              </a>
            )}
            {post.error && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#ef4444', flex:1 }}>
                ✗ {post.error}
              </span>
            )}
            {post.note && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6b7280' }}>{post.note}</span>
            )}
            <button onClick={() => onDelete(post._id)} style={{ marginLeft:'auto', background:'none', border:'1px solid #1f2428', color:'#374151', padding:'3px 8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', cursor:'pointer', letterSpacing:'0.06em' }}>
              DELETE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function PostComposer({ adminKey, onPosted, activePlatforms }) {
  const [selected, setSelected] = useState(activePlatforms?.length ? [activePlatforms[0]] : ['bluesky'])
  const [dryRun,   setDryRun]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)

  function toggle(pid) { setSelected(p => p.includes(pid) ? p.filter(x => x !== pid) : [...p, pid]) }

  async function fire() {
    setLoading(true); setResult(null)
    try {
      const res  = await fetch('/api/social/post', { method:'POST', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body: JSON.stringify({ platforms: selected, dryRun }) })
      const data = await res.json()
      setResult(data)
      if (data.posted > 0) onPosted?.()
    } catch (e) { setResult({ ok:false, error:e.message }) }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:'#111318', border:'1px solid #c8922a30', padding:'18px 22px' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'15px', fontWeight:700, letterSpacing:'0.1em', color:'#c8922a', marginBottom:10 }}>
          SELECT PLATFORMS
        </div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8 }}>
          {Object.entries(PLATFORMS).map(([pid, p]) => (
            <button key={pid} onClick={() => toggle(pid)}
              style={{ display:'flex', alignItems:'center', gap:7, background: selected.includes(pid) ? p.color+'18' : 'transparent', border:`1px solid ${selected.includes(pid) ? p.color : '#1f2428'}`, color: selected.includes(pid) ? p.color : '#6b7280', padding:'7px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', cursor:'pointer', transition:'all 0.15s' }}>
              <span style={{ fontSize:'15px' }}>{p.icon}</span>
              {p.label}
              <CostBadge cost={p.cost} small />
            </button>
          ))}
        </div>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:16 }}>
        <label style={{ display:'flex', alignItems:'center', gap:8, cursor:'pointer' }}>
          <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} style={{ accentColor:'#c8922a' }} />
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6b7280' }}>Dry run — generate copy only, no actual posting</span>
        </label>
        <button onClick={fire} disabled={loading || !selected.length}
          style={{ background: loading ? '#5a3d10' : '#c8922a', color:'#000', border:'none', padding:'10px 28px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, letterSpacing:'0.1em', cursor: loading ? 'not-allowed' : 'pointer' }}>
          {loading ? 'GENERATING...' : dryRun ? '👁 PREVIEW COPY' : '🚀 POST NOW'}
        </button>
      </div>

      {result && (
        <div style={{ padding:'12px 16px', background: result.ok ? '#0a1f0f' : '#1a0505', border:`1px solid ${result.ok ? '#34d39930' : '#ef444430'}`, fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
          <div style={{ color: result.ok ? '#34d399' : '#ef4444', fontWeight:700, marginBottom:6 }}>
            {result.ok
              ? result.message
                ? `ℹ ${result.message}`
                : `✓ ${dryRun ? 'Previewed' : 'Posted'}: ${dryRun ? result.total : result.posted} items`
              : `✗ ${result.error}`
            }
          </div>
          {result.results?.map((r,i) => {
            const pp = PLATFORMS[r.platform]
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'4px 0', borderTop:'1px solid #1f2428', color: r.status === 'posted' || r.status === 'draft' ? '#34d399' : '#ef4444' }}>
                <span>{pp?.icon} {r.platform}</span>
                <span style={{ color:'#4b5563' }}>·</span>
                <span style={{ color:'#9ca3af', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{r.title?.slice(0,50)}</span>
                <span style={{ color: r.status === 'posted' ? '#34d399' : r.status === 'draft' ? '#9ca3af' : '#ef4444', fontWeight:700 }}>{r.status.toUpperCase()}</span>
                {r.postUrl && <a href={r.postUrl} target="_blank" rel="noreferrer" style={{ color:'#60a5fa', textDecoration:'none' }}>↗</a>}
                {r.error && <span style={{ color:'#ef4444', fontSize:'10px' }}>{r.error.slice(0,60)}</span>}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function SetupGuide() {
  const [open, setOpen] = useState(null)
  return (
    <div>
      <div style={{ background:'#0a1a08', border:'1px solid #34d39930', padding:'14px 18px', marginBottom:20 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'#34d399', letterSpacing:'0.1em', marginBottom:6 }}>
          💡 PLATFORM STATUS
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6b7280', lineHeight:1.9 }}>
          <span style={{color:'#0085FF'}}>🦋 Bluesky</span> → Free. Direct AT Protocol. Configure first — already have account.<br/>
          <span style={{color:'#9ca3af'}}>𝕏 X/Twitter</span> → <span style={{color:'#f59e0b'}}>PENDING</span> — go to <a href="https://buffer.com/developers/apps/create" target="_blank" rel="noreferrer" style={{color:'#c8922a'}}>buffer.com/developers/apps/create</a> to create a free Buffer app first.<br/>
          <span style={{color:'#6b7280'}}>f Facebook</span> → Free, Meta Graph API. Set up when ready.<br/>
          <span style={{color:'#6b7280'}}>@ Threads</span> → Free, Meta Graph API. Set up when ready.
        </div>
      </div>
      {Object.entries(PLATFORMS).map(([pid, p]) => (
        <div key={pid} style={{ marginBottom:8 }}>
          <div
            onClick={() => setOpen(open === pid ? null : pid)}
            style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', background:'#111318', border:`1px solid ${open === pid ? p.color+'40' : '#1f2428'}`, cursor:'pointer' }}
          >
            <span style={{ fontSize:'18px' }}>{p.icon}</span>
            <div style={{ flex:1 }}>
              <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color: open === pid ? p.color : '#e5e5e5', letterSpacing:'0.06em' }}>{p.label}</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', marginLeft:10 }}>{p.costNote}</span>
            </div>
            <CostBadge cost={p.cost} small />
            <a href={p.setupUrl} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#c8922a', textDecoration:'none' }}>portal ↗</a>
            <span style={{ color:'#4b5563', fontSize:'11px' }}>{open === pid ? '▲' : '▼'}</span>
          </div>
          {open === pid && (
            <div style={{ background:'#0d1117', border:`1px solid ${p.color}20`, borderTop:'none', padding:'16px 18px' }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#9ca3af', marginBottom:12 }}>Step-by-step setup:</div>
              {p.setupSteps.map((step, i) => (
                <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
                  <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'14px', color: p.color, flexShrink:0, width:18, textAlign:'right' }}>{i+1}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#9ca3af', lineHeight:1.6 }}>{step}</span>
                </div>
              ))}
              <div style={{ marginTop:14, background:'#111318', padding:'10px 14px', borderLeft:`3px solid ${p.color}` }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', letterSpacing:'0.08em', marginBottom:4 }}>VERCEL ENV VARS NEEDED:</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                  {p.envKeys.map(k => (
                    <code key={k} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#c8922a', background:'#09090b', padding:'2px 8px', border:'1px solid #1f2428' }}>{k}</code>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ScheduleConfig({ adminKey, config, configured, onSaved }) {
  const [form, setForm] = useState({
    enabled:         config?.enabled || false,
    postsPerDay:     config?.postsPerDay || 2,
    postTimes:       (config?.postTimes || [13,23]).join(', '),
    minUrgencyScore: config?.minUrgencyScore || 6,
    platforms:       config?.platforms || ['bluesky'],
  })
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  function toggle(pid) { setForm(f => ({ ...f, platforms: f.platforms.includes(pid) ? f.platforms.filter(p => p !== pid) : [...f.platforms, pid] })) }

  async function save() {
    setSaving(true)
    try {
      const res  = await fetch('/api/social/config', { method:'POST', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body: JSON.stringify({ ...form, postTimes: form.postTimes.split(',').map(t => parseInt(t.trim())).filter(Boolean) }) })
      const data = await res.json()
      setMsg(data.ok ? '✓ Saved' : `✗ ${data.error}`)
      onSaved?.()
    } catch (e) { setMsg(`✗ ${e.message}`) }
    setSaving(false); setTimeout(() => setMsg(''), 3000)
  }

  return (
    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:24 }}>
      <div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'#c8922a', letterSpacing:'0.1em', marginBottom:14 }}>AUTO-POST SCHEDULE</div>

        <div style={{ marginBottom:16 }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280', marginBottom:6 }}>MASTER SWITCH</div>
          <div onClick={() => setForm(f => ({...f, enabled:!f.enabled}))} style={{ display:'inline-flex', alignItems:'center', gap:10, cursor:'pointer' }}>
            <div style={{ width:44, height:24, borderRadius:12, background: form.enabled ? '#c8922a' : '#1f2428', position:'relative', transition:'background 0.2s' }}>
              <div style={{ position:'absolute', top:3, left: form.enabled ? '23px' : '3px', width:18, height:18, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
            </div>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color: form.enabled ? '#c8922a' : '#4b5563' }}>
              {form.enabled ? 'AUTO-POSTING ENABLED' : 'AUTO-POSTING DISABLED'}
            </span>
          </div>
        </div>

        {[
          { key:'postsPerDay', label:'POSTS PER DAY (per platform)', type:'number' },
          { key:'postTimes',   label:'POST TIMES UTC (comma-sep, e.g. 13, 23)', type:'text', hint:'13 UTC = 9am ET · 23 UTC = 7pm ET' },
          { key:'minUrgencyScore', label:'MIN URGENCY TO POST (1-10)', type:'number' },
        ].map(f => (
          <div key={f.key} style={{ marginBottom:14 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280', marginBottom:5 }}>{f.label}</div>
            <input type={f.type} value={form[f.key]}
              onChange={e => setForm(p => ({...p, [f.key]: f.type==='number' ? Number(e.target.value) : e.target.value}))}
              style={{ background:'#09090b', border:'1px solid #1f2428', color:'#e5e5e5', padding:'7px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', width:'100%', outline:'none', boxSizing:'border-box' }} />
            {f.hint && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151', marginTop:3 }}>{f.hint}</div>}
          </div>
        ))}
      </div>

      <div>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'#c8922a', letterSpacing:'0.1em', marginBottom:14 }}>ACTIVE PLATFORMS</div>
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {Object.entries(PLATFORMS).map(([pid, p]) => (
            <div key={pid} onClick={() => toggle(pid)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', background: form.platforms.includes(pid) ? p.color+'10' : '#0d1117', border:`1px solid ${form.platforms.includes(pid) ? p.color+'50' : '#1f2428'}`, cursor:'pointer' }}>
              <span style={{ fontSize:'16px' }}>{p.icon}</span>
              <span style={{ flex:1, fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, color: form.platforms.includes(pid) ? p.color : '#4b5563', letterSpacing:'0.06em' }}>{p.label}</span>
              <CostBadge cost={p.cost} small />
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color: configured[pid] ? '#34d399' : '#4b5563' }}>{configured[pid] ? '✓ READY' : '✗ NEEDS KEYS'}</span>
              <div style={{ width:14, height:14, borderRadius:'50%', background: form.platforms.includes(pid) ? p.color : 'transparent', border:`2px solid ${form.platforms.includes(pid) ? p.color : '#374151'}` }} />
            </div>
          ))}
        </div>
      </div>

      <div style={{ gridColumn:'1/-1', display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={save} disabled={saving}
          style={{ background:'#c8922a', color:'#000', border:'none', padding:'10px 24px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', cursor: saving ? 'not-allowed' : 'pointer' }}>
          {saving ? 'SAVING...' : 'SAVE CONFIG'}
        </button>
        {msg && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color: msg.startsWith('✓') ? '#34d399' : '#ef4444' }}>{msg}</span>}
      </div>
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
  const [filterPlatform, setFP]     = useState('')
  const [filterStatus,   setFS]     = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [logRes, cfgRes] = await Promise.all([
        fetch(`/api/social/log?limit=200${filterPlatform?`&platform=${filterPlatform}`:''}${filterStatus?`&status=${filterStatus}`:''}`, { headers:{'x-admin-key':adminKey} }),
        fetch('/api/social/config', { headers:{'x-admin-key':adminKey} }),
      ])
      const logD = await logRes.json(); const cfgD = await cfgRes.json()
      if (logD.ok) { setPosts(logD.posts||[]); setStats(logD.stats||{}) }
      if (cfgD.ok) { setConfig(cfgD.config||{}); setConfigured(cfgD.configured||{}) }
    } catch {}
    setLoading(false)
  }, [adminKey, filterPlatform, filterStatus])

  useEffect(() => { load() }, [load])

  async function deletePost(id) {
    await fetch('/api/social/log', { method:'DELETE', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body:JSON.stringify({id}) })
    setPosts(p => p.filter(x => x._id !== id))
  }

  const TABS = [
    { id:'dashboard', label:'📊 Dashboard' },
    { id:'compose',   label:'⚡ Post Now' },
    { id:'log',       label:'📋 Log' },
    { id:'schedule',  label:'⏱ Schedule' },
    { id:'setup',     label:'🔧 Setup Guide' },
  ]

  const configuredCount = Object.values(configured).filter(Boolean).length
  const activePlatforms = config.platforms || []

  return (
    <div>
      <style>{`
        .soc-tab{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.05em;border:none;background:none;color:#4b5563;border-bottom:2px solid transparent;transition:all 0.15s;}
        .soc-tab:hover{color:#e5e5e5;}
        .soc-tab.active{color:#c8922a;border-bottom-color:#c8922a;}
      `}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:18 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:'#e5e5e5', letterSpacing:'0.05em', lineHeight:1.1 }}>SOCIAL MEDIA COMMAND</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', marginTop:3 }}>
            {configuredCount}/{Object.keys(PLATFORMS).length} platforms configured · {config.enabled ? <span style={{color:'#34d399'}}>AUTO-POSTING ON</span> : <span style={{color:'#4b5563'}}>auto-posting off</span>}
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <div style={{ background:'#0a1a08', border:'1px solid #34d39930', padding:'5px 14px' }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#34d399', fontWeight:700 }}>$0/month</span>
          </div>
          <button onClick={load} style={{ background:'none', border:'1px solid #1f2428', color:'#4b5563', padding:'5px 10px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', letterSpacing:'0.05em' }}>↻ REFRESH</button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ borderBottom:'1px solid #1f2428', marginBottom:20 }}>
        {TABS.map(t => <button key={t.id} className={`soc-tab${tab===t.id?' active':''}`} onClick={() => setTab(t.id)}>{t.label}</button>)}
      </div>

      {/* ── DASHBOARD ── */}
      {tab === 'dashboard' && (
        <div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:8, marginBottom:20 }}>
            <StatCard label="TOTAL" value={stats.total} />
            <StatCard label="POSTED" value={stats.posted} color="#34d399" />
            <StatCard label="FAILED" value={stats.failed} color="#ef4444" />
            <StatCard label="DRAFTS" value={stats.drafts} color="#9ca3af" />
            <StatCard label="TODAY" value={stats.today} color="#c8922a" />
            <StatCard label="THIS WEEK" value={stats.thisWeek} color="#60a5fa" />
          </div>

          <div style={{ marginBottom:20 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', marginBottom:10 }}>PLATFORM STATUS</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6 }}>
              {Object.keys(PLATFORMS).map(pid => <PlatformStatusRow key={pid} pid={pid} configured={configured[pid]} isActive={activePlatforms.includes(pid)} />)}
            </div>
          </div>

          {posts.length > 0 && (
            <div>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', marginBottom:10 }}>RECENT POSTS</div>
              {posts.slice(0,8).map(p => <PostCard key={p._id} post={p} onDelete={deletePost} />)}
              {posts.length > 8 && <button onClick={() => setTab('log')} style={{ width:'100%', background:'none', border:'1px solid #1f2428', color:'#4b5563', padding:'8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', cursor:'pointer', marginTop:4 }}>VIEW ALL {posts.length} IN LOG →</button>}
            </div>
          )}
          {posts.length === 0 && !loading && (
            <div style={{ textAlign:'center', padding:'40px', border:'1px solid #1f2428', color:'#374151', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }}>
              No posts yet. Go to <strong style={{color:'#c8922a'}}>Setup Guide</strong> to connect platforms, then <strong style={{color:'#c8922a'}}>Post Now</strong> to fire your first posts.
            </div>
          )}
        </div>
      )}

      {/* ── COMPOSE ── */}
      {tab === 'compose' && (
        <div>
          <div style={{ marginBottom:16, padding:'12px 16px', background:'#111318', border:'1px solid #1f2428' }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6b7280', lineHeight:1.8 }}>
              Picks your top unposted articles by urgency score · AI writes platform-specific copy (different tone per platform) · Appends article URL + 2A hashtags · Logs everything with live post links
            </div>
          </div>
          <PostComposer adminKey={adminKey} onPosted={load} activePlatforms={activePlatforms.filter(p => configured[p])} />
        </div>
      )}

      {/* ── LOG ── */}
      {tab === 'log' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
            <select value={filterPlatform} onChange={e => setFP(e.target.value)}
              style={{ background:'#09090b', border:'1px solid #1f2428', color:'#9ca3af', padding:'6px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}>
              <option value="">All platforms</option>
              {Object.entries(PLATFORMS).map(([pid,p]) => <option key={pid} value={pid}>{p.icon} {p.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFS(e.target.value)}
              style={{ background:'#09090b', border:'1px solid #1f2428', color:'#9ca3af', padding:'6px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}>
              <option value="">All statuses</option>
              {Object.keys(STATUS_STYLE).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151' }}>{posts.length} entries</span>
          </div>
          {posts.map(p => <PostCard key={p._id} post={p} onDelete={deletePost} />)}
          {posts.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:'#374151', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>No posts match filters.</div>}
        </div>
      )}

      {/* ── SCHEDULE ── */}
      {tab === 'schedule' && <ScheduleConfig adminKey={adminKey} config={config} configured={configured} onSaved={load} />}

      {/* ── SETUP GUIDE ── */}
      {tab === 'setup' && <SetupGuide />}
    </div>
  )
}
