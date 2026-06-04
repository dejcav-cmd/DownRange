'use client'
import { useState, useEffect, useCallback } from 'react'

// ── Optimal posting times (ET) pre-configured based on 2A audience research ──
const OPTIMAL_TIMES = {
  bluesky:  { times:[13,17,23], postsPerRun:1, label:'8am · 12pm · 6pm ET', rationale:'2A Bluesky community peaks mid-morning and early evening. Avoid late night.' },
  twitter:  { times:[13,18,2],  postsPerRun:1, label:'8am · 1pm · 9pm ET',  rationale:'X engagement peaks pre-work, lunch, and prime time. 9pm ET catches West Coast evening.' },
  facebook: { times:[14,20,0],  postsPerRun:1, label:'9am · 3pm · 7pm ET',  rationale:'Facebook 2A groups are most active mid-morning and early evening.' },
  threads:  { times:[14,19,1],  postsPerRun:1, label:'9am · 2pm · 8pm ET',  rationale:'Threads mirrors Instagram patterns. Lunch and evening drive the most replies.' },
  reddit:   { times:[12,18,22], postsPerRun:1, label:'7am · 12pm · 5pm ET', rationale:'r/CCW and r/guns peak before work, at lunch, and right after work.' },
}

const PLATFORMS = {
  bluesky:  { label:'Bluesky',   icon:'🦋', color:'#0085FF', cost:'FREE',   costNote:'Direct AT Protocol. No fees.' },
  twitter:  { label:'X/Twitter', icon:'𝕏',  color:'#e5e5e5', cost:'$18/mo', costNote:'$0.20/URL post via Zernio. ~$18/mo at 3/day.' },
  facebook: { label:'Facebook',  icon:'f',  color:'#1877F2', cost:'FREE',   costNote:'Meta Graph API. Free.' },
  threads:  { label:'Threads',   icon:'@',  color:'#111111', cost:'FREE',   costNote:'Meta Graph API. Free.' },
  reddit:   { label:'Reddit',    icon:'🔴', color:'#FF4500', cost:'FREE',   costNote:'Reddit API. Free for posting.' },
}

const STATUS_STYLE = {
  posted:    { bg:'#052e16', color:'#34d399', label:'POSTED' },
  failed:    { bg:'#2a0000', color:'#ef4444', label:'FAILED' },
  draft:     { bg:'#111318', color:'#9ca3af', label:'DRAFT' },
  scheduled: { bg:'#0c1a2e', color:'#60a5fa', label:'QUEUED' },
}

function timeAgo(d) {
  if (!d) return ''
  const diff = Date.now() - new Date(d).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 2)  return 'just now'
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min / 60)
  if (hr < 24)  return `${hr}h ago`
  return `${Math.floor(hr/24)}d ago`
}

function CostBadge({ cost, small }) {
  const c = cost === 'FREE' ? '#34d399' : cost?.startsWith('$') ? '#ef4444' : '#6b7280'
  return <span style={{ background:c+'22', color:c, border:`1px solid ${c}44`, padding: small?'1px 6px':'3px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize: small?'9px':'10px', fontWeight:700, letterSpacing:'0.08em' }}>{cost}</span>
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ background:'#111318', border:'1px solid #1f2428', padding:'14px 16px', textAlign:'center' }}>
      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2rem', color:color||'#e5e5e5', lineHeight:1 }}>{value??'—'}</div>
      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', letterSpacing:'0.1em', marginTop:4 }}>{label}</div>
    </div>
  )
}

function PostCard({ post, onDelete }) {
  const [open, setOpen] = useState(false)
  const p  = PLATFORMS[post.platform] || { label:post.platform, icon:'?', color:'#6b7280' }
  const st = STATUS_STYLE[post.status] || STATUS_STYLE.draft
  return (
    <div style={{ background:'#111318', border:`1px solid ${post.status==='failed'?'#ef444430':'#1f2428'}`, marginBottom:4 }}>
      <div onClick={() => setOpen(x=>!x)} style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 14px', cursor:'pointer', userSelect:'none' }}>
        <span style={{ background:p.color+'22', color:p.color, border:`1px solid ${p.color}33`, padding:'2px 8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', fontWeight:700, flexShrink:0 }}>{p.icon} {p.label.toUpperCase()}</span>
        <span style={{ background:st.bg, color:st.color, padding:'2px 8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', fontWeight:700, flexShrink:0 }}>{st.label}</span>
        {post.hasImage && <span title="Includes image" style={{ fontSize:'11px', flexShrink:0 }}>🖼</span>}
        <span style={{ flex:1, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12px', color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {post.articleTitle||post.content?.slice(0,80)}
        </span>
        {post.status === 'failed' && post.error && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#ef4444', flexShrink:0, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            ✗ {post.error.slice(0,40)}…
          </span>
        )}
        {post.urgencyScore>=8 && <span style={{ color:'#ef4444', fontSize:'10px', flexShrink:0 }}>⚡{post.urgencyScore}</span>}
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151', flexShrink:0 }}>{timeAgo(post.postedAt||post.scheduledAt)}</span>
        <span style={{ color:'#374151', fontSize:'10px', flexShrink:0 }}>{open?'▲':'▼'}</span>
      </div>
      {open && (
        <div style={{ borderTop:'1px solid #1f2428', padding:'14px 16px', background:'#0a0d12' }}>
          {/* Error — full message in prominent red box */}
          {post.error && (
            <div style={{ background:'#1a0505', border:'1px solid #ef444440', padding:'12px 14px', marginBottom:12, borderLeft:'3px solid #ef4444' }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#ef4444', fontWeight:700, letterSpacing:'0.06em', marginBottom:4 }}>✗ ERROR</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#fca5a5', lineHeight:1.7, wordBreak:'break-all' }}>{post.error}</div>
            </div>
          )}
          {/* Image preview */}
          {post.mediaUrl && (
            <img src={post.mediaUrl} alt="" style={{ width:'100%', maxHeight:160, objectFit:'cover', marginBottom:10, border:'1px solid #1f2428' }} />
          )}
          {/* Post copy */}
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', letterSpacing:'0.08em', marginBottom:4 }}>POST COPY</div>
          <pre style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#d1d5db', lineHeight:1.7, whiteSpace:'pre-wrap', background:'#111318', padding:'10px 12px', border:'1px solid #1f2428', marginBottom:12, overflow:'auto', maxHeight:160 }}>{post.content}</pre>
          {/* Meta */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginBottom:12 }}>
            {[
              ['Platform', post.platform],
              ['Status',   post.status],
              ['Category', post.category||'—'],
              ['Urgency',  post.urgencyScore ? `${post.urgencyScore}/10` : '—'],
              ['Has Image',post.hasImage ? 'Yes' : 'No'],
              ['Scheduled',post.scheduledAt ? new Date(post.scheduledAt).toLocaleTimeString() : '—'],
            ].map(([k,v]) => (
              <div key={k} style={{ background:'#111318', padding:'6px 10px', border:'1px solid #1f2428' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', letterSpacing:'0.08em' }}>{k}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#9ca3af', marginTop:2 }}>{v}</div>
              </div>
            ))}
          </div>
          {/* Actions */}
          <div style={{ display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
            {post.postUrl && (
              <a href={post.postUrl} target="_blank" rel="noreferrer"
                style={{ background:'#c8922a', color:'#000', padding:'6px 16px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.08em', textDecoration:'none' }}>
                VIEW LIVE POST ↗
              </a>
            )}
            {post.articleSlug && (
              <a href={`/news/${post.articleSlug}`} target="_blank" rel="noreferrer"
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#60a5fa', textDecoration:'none' }}>
                Source article ↗
              </a>
            )}
            <button onClick={() => onDelete(post._id)}
              style={{ marginLeft:'auto', background:'#1a0505', border:'1px solid #ef444430', color:'#ef4444', padding:'4px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', cursor:'pointer', letterSpacing:'0.06em' }}>
              DELETE
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Per-Platform Schedule Card ────────────────────────────────────────────────
function PlatformScheduleCard({ pid, platformConfig, configured, onUpdate }) {
  const p      = PLATFORMS[pid]
  const opt    = OPTIMAL_TIMES[pid]
  const cfg    = platformConfig || { enabled: false, postsPerRun: opt.postsPerRun, times: opt.times }
  const [enabled, setEnabled]         = useState(cfg.enabled ?? false)
  const [postsPerRun, setPostsPerRun] = useState(cfg.postsPerRun ?? 1)
  const [times, setTimes]             = useState((cfg.times || opt.times).join(', '))
  const [saving, setSaving]           = useState(false)

  async function save() {
    setSaving(true)
    await onUpdate(pid, { enabled, postsPerRun, times: times.split(',').map(t => parseInt(t.trim())).filter(n => !isNaN(n)) })
    setSaving(false)
  }

  return (
    <div style={{ background:'#111318', border:`1px solid ${enabled && configured ? p.color+'40' : '#1f2428'}`, padding:'16px 20px' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14 }}>
        <span style={{ fontSize:'20px' }}>{p.icon}</span>
        <div style={{ flex:1 }}>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'15px', fontWeight:700, color: enabled && configured ? p.color : '#9ca3af', letterSpacing:'0.06em' }}>{p.label}</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', marginTop:2 }}>{p.costNote}</div>
        </div>
        <CostBadge cost={p.cost} small />
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color: configured ? '#34d399' : '#ef4444' }}>{configured ? '✓ READY' : '✗ NEEDS KEYS'}</div>
        {/* Toggle */}
        <div onClick={() => configured && setEnabled(e=>!e)} style={{ width:40, height:22, borderRadius:11, background: enabled && configured ? p.color : '#1f2428', position:'relative', cursor: configured ? 'pointer' : 'not-allowed', transition:'background 0.2s', flexShrink:0 }}>
          <div style={{ position:'absolute', top:3, left: enabled && configured ? '21px' : '3px', width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
        </div>
      </div>

      {/* Optimal times note */}
      <div style={{ background:'#0a0f08', border:'1px solid #34d39920', padding:'8px 12px', marginBottom:12 }}>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34d399', fontWeight:700, marginBottom:3 }}>✦ OPTIMAL TIMES</div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280' }}>{opt.label}</div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#374151', marginTop:2 }}>{opt.rationale}</div>
      </div>

      {/* Config fields */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:12 }}>
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', marginBottom:4 }}>POST TIMES (UTC HOURS)</div>
          <input value={times} onChange={e => setTimes(e.target.value)}
            placeholder={opt.times.join(', ')}
            style={{ width:'100%', background:'#09090b', border:'1px solid #1f2428', color:'#e5e5e5', padding:'6px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', outline:'none', boxSizing:'border-box' }} />
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#374151', marginTop:2 }}>comma-separated UTC hours (e.g. 13, 17, 23)</div>
        </div>
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', marginBottom:4 }}>POSTS PER RUN</div>
          <input type="number" min="1" max="5" value={postsPerRun} onChange={e => setPostsPerRun(Number(e.target.value))}
            style={{ width:'100%', background:'#09090b', border:'1px solid #1f2428', color:'#e5e5e5', padding:'6px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', outline:'none', boxSizing:'border-box' }} />
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#374151', marginTop:2 }}>articles per scheduled run</div>
        </div>
      </div>

      <button onClick={save} disabled={saving}
        style={{ background:'#c8922a', color:'#000', border:'none', padding:'7px 18px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.08em', cursor: saving?'not-allowed':'pointer' }}>
        {saving ? 'SAVING...' : 'SAVE'}
      </button>
    </div>
  )
}

// ── Manual Fire Panel ─────────────────────────────────────────────────────────
function FirePanel({ adminKey, configured, onPosted }) {
  const [selected, setSelected] = useState(Object.keys(configured).filter(p => configured[p]))
  const [count,    setCount]    = useState(2)
  const [dryRun,   setDryRun]   = useState(false)
  const [loading,  setLoading]  = useState(false)
  const [result,   setResult]   = useState(null)

  function toggle(pid) { setSelected(p => p.includes(pid) ? p.filter(x=>x!==pid) : [...p, pid]) }

  async function fire() {
    setLoading(true); setResult(null)
    try {
      const res  = await fetch('/api/social/post', { method:'POST', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body: JSON.stringify({ platforms:selected, count, dryRun }) })
      const data = await res.json()
      setResult(data)
      if (data.posted > 0) onPosted?.()
    } catch(e) { setResult({ ok:false, error:e.message }) }
    setLoading(false)
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <div style={{ background:'#111318', border:'1px solid #c8922a30', padding:'18px 20px' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'#c8922a', letterSpacing:'0.1em', marginBottom:12 }}>SELECT PLATFORMS</div>
        <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginBottom:14 }}>
          {Object.entries(PLATFORMS).map(([pid,p]) => (
            <button key={pid} onClick={() => toggle(pid)}
              style={{ display:'flex', alignItems:'center', gap:6, background: selected.includes(pid) ? p.color+'18' : 'transparent', border:`1px solid ${selected.includes(pid) ? p.color : '#1f2428'}`, color: selected.includes(pid) ? p.color : '#4b5563', padding:'6px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}>
              <span>{p.icon}</span> {p.label} <CostBadge cost={p.cost} small />
              {!configured[pid] && <span style={{color:'#4b5563',fontSize:'9px'}}>NO KEYS</span>}
            </button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', marginBottom:4 }}>ARTICLES PER PLATFORM</div>
            <input type="number" min="1" max="5" value={count} onChange={e => setCount(Number(e.target.value))}
              style={{ width:60, background:'#09090b', border:'1px solid #1f2428', color:'#e5e5e5', padding:'6px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', outline:'none' }} />
          </div>
          <label style={{ display:'flex', alignItems:'center', gap:6, cursor:'pointer', marginTop:14 }}>
            <input type="checkbox" checked={dryRun} onChange={e => setDryRun(e.target.checked)} style={{ accentColor:'#c8922a' }} />
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280' }}>Dry run — preview only</span>
          </label>
          <button onClick={fire} disabled={loading || !selected.length}
            style={{ background: loading?'#5a3d10':'#c8922a', color:'#000', border:'none', padding:'10px 24px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', cursor: loading?'not-allowed':'pointer', marginTop:14 }}>
            {loading ? 'POSTING...' : dryRun ? '👁 PREVIEW' : '🚀 POST NOW'}
          </button>
        </div>
      </div>

      {result && (
        <div style={{ padding:'12px 14px', background: result.ok ? '#0a1f0f' : '#1a0505', border:`1px solid ${result.ok ? '#34d39930' : '#ef444430'}`, fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
          <div style={{ color: result.ok ? '#34d399' : '#ef4444', fontWeight:700, marginBottom:6 }}>
            {result.ok ? (result.message || `✓ ${dryRun?'Previewed':'Posted'}: ${dryRun?result.total:result.posted} items`) : `✗ ${result.error}`}
          </div>
          {result.results?.map((r,i) => {
            const pp = PLATFORMS[r.platform]
            return (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0', borderTop:'1px solid #1f2428', color: r.status==='posted'||r.status==='draft' ? '#34d399' : '#ef4444' }}>
                <span style={{flexShrink:0}}>{pp?.icon} {r.platform}</span>
                <span style={{color:'#4b5563'}}>·</span>
                <span style={{color:'#9ca3af',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.title?.slice(0,55)}</span>
                {r.hasImage && <span>🖼</span>}
                <span style={{fontWeight:700,flexShrink:0}}>{r.status?.toUpperCase()}</span>
                {r.postUrl && <a href={r.postUrl} target="_blank" rel="noreferrer" style={{color:'#60a5fa',textDecoration:'none',flexShrink:0}}>↗</a>}
                {r.error && <span style={{color:'#f87171',fontSize:'10px'}}>{r.error.slice(0,50)}</span>}
              </div>
            )
          })}
        </div>
      )}

      <div style={{ padding:'12px 16px', background:'#111318', border:'1px solid #1f2428', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', lineHeight:1.9 }}>
        ✦ Posts from: <strong style={{color:'#9ca3af'}}>latest news articles + published blog posts</strong><br/>
        ✦ Images: <strong style={{color:'#9ca3af'}}>always included</strong> (article image or category fallback)<br/>
        ✦ Copy: <strong style={{color:'#9ca3af'}}>AI-generated, platform-optimized</strong> (different tone per platform)<br/>
        ✦ De-dupe: <strong style={{color:'#9ca3af'}}>articles already posted today are skipped automatically</strong>
      </div>
    </div>
  )
}

// ── Setup Guide ───────────────────────────────────────────────────────────────
const SETUP = {
  bluesky:  { steps:['Create account at bsky.app','Settings → Privacy & Security → App Passwords → Add','Name it "DownRange" and copy the password','Add BLUESKY_HANDLE (e.g. downrangeco.bsky.social) to Vercel','Add BLUESKY_APP_PASSWORD to Vercel → redeploy'], url:'https://bsky.app' },
  twitter:  { lookupAccountId: true, steps:['Sign up at zernio.com (no card required to sign up)','Connect X/Twitter account via OAuth flow in Zernio dashboard','Billing tab → add card + set monthly spend cap ($25 suggested)','Dashboard → API Keys → copy your API key → add as ZERNIO_API_KEY in Vercel','IMPORTANT: the Account ID is NOT your @handle — use the lookup button below','Add ZERNIO_TWITTER_ACCOUNT_ID (starts with acc_) to Vercel → redeploy','Cost: $0.20/URL post — ~$18/mo at 3 posts/day'], url:'https://zernio.com' },
  facebook: { steps:['Create DownRange Facebook Page','developers.facebook.com → Create App → Consumer type','Graph API Explorer → select page → generate Page Access Token','Copy Page ID from Page About section','Add FACEBOOK_PAGE_ACCESS_TOKEN + FACEBOOK_PAGE_ID to Vercel → redeploy'], url:'https://developers.facebook.com' },
  threads:  { steps:['Create @downrangeco Threads account','Same Meta developer app as Facebook','Add Threads API product → submit App Review (1-3 days)','Generate User Access Token','Add THREADS_ACCESS_TOKEN + THREADS_USER_ID to Vercel → redeploy'], url:'https://developers.facebook.com/docs/threads' },
  reddit:   { steps:['Create u/DownRangeCo Reddit account (account must be a few days old)','reddit.com/prefs/apps → Create App → choose "script"','Name: DownRange, redirect: http://localhost:8080','Copy client_id (under app name) and secret','Add REDDIT_CLIENT_ID, REDDIT_CLIENT_SECRET, REDDIT_USERNAME, REDDIT_PASSWORD to Vercel'], url:'https://www.reddit.com/prefs/apps' },
}

function SetupGuide({ adminKey }) {
  const [open,     setOpen]     = useState(null)
  const [accounts, setAccounts] = useState(null)
  const [lookingUp,setLookingUp]= useState(false)

  async function lookupZernioAccounts() {
    setLookingUp(true)
    try {
      const res  = await fetch('/api/social/zernio-accounts', { headers: { 'x-admin-key': adminKey } })
      const data = await res.json()
      setAccounts(data)
    } catch(e) { setAccounts({ ok: false, error: e.message }) }
    setLookingUp(false)
  }

  return (
    <div>
      <div style={{ background:'#0a1a08', border:'1px solid #34d39930', padding:'14px 18px', marginBottom:16 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, color:'#34d399', letterSpacing:'0.1em', marginBottom:6 }}>PLATFORM COSTS AT A GLANCE</div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280', lineHeight:2 }}>
          🦋 Bluesky → FREE · @ Threads → FREE · f Facebook → FREE · 🔴 Reddit → FREE<br/>
          𝕏 X/Twitter → $0.20/URL post via Zernio (~$18/mo at 3/day). Optional.
        </div>
      </div>
      {Object.entries(SETUP).map(([pid, s]) => {
        const p = PLATFORMS[pid]
        return (
          <div key={pid} style={{ marginBottom:6 }}>
            <div onClick={() => setOpen(open===pid ? null : pid)}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', background:'#111318', border:`1px solid ${open===pid ? p.color+'40' : '#1f2428'}`, cursor:'pointer' }}>
              <span style={{fontSize:'16px'}}>{p.icon}</span>
              <span style={{flex:1,fontFamily:"'Barlow Condensed',sans-serif",fontSize:'14px',fontWeight:700,color: open===pid ? p.color : '#9ca3af',letterSpacing:'0.06em'}}>{p.label}</span>
              <CostBadge cost={p.cost} small />
              <a href={s.url} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:'10px',color:'#c8922a',textDecoration:'none'}}>portal ↗</a>
              <span style={{color:'#374151',fontSize:'10px'}}>{open===pid?'▲':'▼'}</span>
            </div>
            {open===pid && (
              <div style={{ background:'#0d1117', border:`1px solid ${p.color}20`, borderTop:'none', padding:'14px 16px' }}>
                {s.steps.map((step,i) => (
                  <div key={i} style={{ display:'flex', gap:10, marginBottom:8 }}>
                    <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'14px', color:p.color, flexShrink:0, width:18, textAlign:'right' }}>{i+1}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#9ca3af', lineHeight:1.6 }}>{step}</span>
                  </div>
                ))}
                {s.lookupAccountId && (
                  <div style={{ marginTop:14, borderTop:'1px solid #1f2428', paddingTop:14 }}>
                    <button onClick={lookupZernioAccounts} disabled={lookingUp}
                      style={{ background:'#c8922a', color:'#000', border:'none', padding:'8px 18px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.08em', cursor:lookingUp?'not-allowed':'pointer' }}>
                      {lookingUp ? 'LOOKING UP...' : '🔍 LOOK UP MY ZERNIO ACCOUNT ID'}
                    </button>
                    {accounts && (
                      <div style={{ marginTop:10, background:'#09090b', border:'1px solid #1f2428', padding:'10px 14px' }}>
                        {accounts.ok ? (
                          <>
                            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#34d399', marginBottom:8 }}>✓ Found {accounts.accounts?.length} connected accounts:</div>
                            {(accounts.accounts||[]).map(a => (
                              <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', borderBottom:'1px solid #1f2428' }}>
                                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#9ca3af', flex:1 }}>{a.platform} · {a.name}</span>
                                <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#c8922a', background:'#111318', padding:'2px 8px', border:'1px solid #1f2428', cursor:'pointer', userSelect:'all' }} title="Click to select and copy">{a.id}</code>
                              </div>
                            ))}
                            {accounts.accounts?.length === 0 && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#ef4444' }}>No accounts found. Make sure you connected your X account in Zernio first.</div>}
                            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280', marginTop:8 }}>Copy the acc_... ID for your X account → paste it into ZERNIO_TWITTER_ACCOUNT_ID in Vercel</div>
                          </>
                        ) : (
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#ef4444' }}>✗ {accounts.error}</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}



// ── Analytics Dashboard ───────────────────────────────────────────────────────
const PLATFORM_COLORS = { twitter:'#e5e5e5', bluesky:'#0085FF', facebook:'#1877F2', threads:'#aaaaaa', reddit:'#FF4500' }

function MetricBar({ label, value, max, color }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div style={{ marginBottom:8 }}>
      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280' }}>{label}</span>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#e5e5e5', fontWeight:700 }}>{value?.toLocaleString()}</span>
      </div>
      <div style={{ background:'#1f2428', height:4, borderRadius:2 }}>
        <div style={{ background:color||'#c8922a', height:4, borderRadius:2, width:`${pct}%`, transition:'width 0.4s' }} />
      </div>
    </div>
  )
}

function AnalyticsDashboard({ adminKey }) {
  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [msg,        setMsg]        = useState('')

  async function load() {
    setLoading(true)
    try {
      const res  = await fetch('/api/social/analytics', { headers: { 'x-admin-key': adminKey } })
      const json = await res.json()
      setData(json)
    } catch {}
    setLoading(false)
  }

  async function refresh() {
    setRefreshing(true); setMsg('')
    try {
      const res  = await fetch('/api/social/analytics?refresh=1', { headers: { 'x-admin-key': adminKey } })
      const json = await res.json()
      setMsg(json.ok ? `✓ Refreshed — updated ${json.updated} of ${json.refreshed} posts` : `✗ ${json.error}`)
      await load()
    } catch(e) { setMsg(`✗ ${e.message}`) }
    setRefreshing(false)
  }

  useEffect(() => { load() }, [])

  if (loading) return <div style={{ padding:'40px', textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4b5563' }}>Loading analytics...</div>

  const posts  = data?.posts  || []
  const totals = data?.totals || {}
  const maxImpressions = Math.max(...posts.map(p => p.impressions || 0), 1)
  const maxLikes       = Math.max(...posts.map(p => p.likes       || 0), 1)

  // Group by platform
  const byPlatform = posts.reduce((acc, p) => {
    if (!acc[p.platform]) acc[p.platform] = { posts:0, impressions:0, likes:0, reposts:0, replies:0, clicks:0 }
    acc[p.platform].posts++
    acc[p.platform].impressions += p.impressions || 0
    acc[p.platform].likes       += p.likes       || 0
    acc[p.platform].reposts     += p.reposts     || 0
    acc[p.platform].replies     += p.replies     || 0
    acc[p.platform].clicks      += p.clicks      || 0
    return acc
  }, {})

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563' }}>
          Last 30 days · auto-refreshes every 2 hours · {posts.length} posts tracked
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          {msg && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:msg.startsWith('✓')?'#34d399':'#ef4444' }}>{msg}</span>}
          <button onClick={refresh} disabled={refreshing}
            style={{ background:'#c8922a', color:'#000', border:'none', padding:'6px 16px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'12px', fontWeight:700, letterSpacing:'0.08em', cursor:refreshing?'not-allowed':'pointer' }}>
            {refreshing ? 'FETCHING...' : '↻ REFRESH NOW'}
          </button>
        </div>
      </div>

      {/* Totals */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8, marginBottom:20 }}>
        {[
          ['IMPRESSIONS', totals.impressions, '#60a5fa'],
          ['LIKES',       totals.likes,       '#f472b6'],
          ['REPOSTS',     totals.reposts,     '#34d399'],
          ['REPLIES',     totals.replies,     '#a78bfa'],
          ['CLICKS',      totals.clicks,      '#c8922a'],
        ].map(([label, val, color]) => (
          <div key={label} style={{ background:'#111318', border:'1px solid #1f2428', padding:'14px 12px', textAlign:'center' }}>
            <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color, lineHeight:1 }}>{(val||0).toLocaleString()}</div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4b5563', letterSpacing:'0.1em', marginTop:3 }}>{label}</div>
          </div>
        ))}
      </div>

      {/* Per-platform breakdown */}
      {Object.keys(byPlatform).length > 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:10, marginBottom:20 }}>
          {Object.entries(byPlatform).map(([pid, metrics]) => {
            const color = PLATFORM_COLORS[pid] || '#6b7280'
            const icon  = {twitter:'𝕏',bluesky:'🦋',facebook:'f',threads:'@',reddit:'🔴'}[pid] || '?'
            return (
              <div key={pid} style={{ background:'#111318', border:`1px solid ${color}30`, padding:'14px 16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
                  <span style={{ fontSize:'16px' }}>{icon}</span>
                  <span style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color, letterSpacing:'0.06em' }}>{pid.toUpperCase()}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', marginLeft:'auto' }}>{metrics.posts} posts</span>
                </div>
                <MetricBar label="Impressions" value={metrics.impressions} max={Math.max(...Object.values(byPlatform).map(m=>m.impressions),1)} color={color} />
                <MetricBar label="Likes"       value={metrics.likes}       max={Math.max(...Object.values(byPlatform).map(m=>m.likes),1)}       color={color} />
                <MetricBar label="Reposts"     value={metrics.reposts}     max={Math.max(...Object.values(byPlatform).map(m=>m.reposts),1)}     color={color} />
                {metrics.clicks > 0 && <MetricBar label="Clicks" value={metrics.clicks} max={Math.max(...Object.values(byPlatform).map(m=>m.clicks),1)} color={color} />}
              </div>
            )
          })}
        </div>
      )}

      {/* Top posts by engagement */}
      {posts.length > 0 && (
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', color:'#6b7280', marginBottom:10 }}>TOP POSTS BY IMPRESSIONS</div>
          {[...posts].sort((a,b)=>(b.impressions||0)-(a.impressions||0)).slice(0,10).map((p,i) => {
            const color = PLATFORM_COLORS[p.platform] || '#6b7280'
            const icon  = {twitter:'𝕏',bluesky:'🦋',facebook:'f',threads:'@',reddit:'🔴'}[p.platform] || '?'
            return (
              <div key={p._id} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 12px', background:'#111318', border:'1px solid #1f2428', marginBottom:3 }}>
                <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'14px', color:'#374151', flexShrink:0, width:20 }}>{i+1}</span>
                <span style={{ fontSize:'13px', flexShrink:0 }}>{icon}</span>
                <span style={{ flex:1, fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'12px', color:'#9ca3af', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {p.articleTitle}
                </span>
                <div style={{ display:'flex', gap:12, flexShrink:0 }}>
                  {p.impressions > 0 && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#60a5fa' }}>{p.impressions?.toLocaleString()} imp</span>}
                  {p.likes > 0       && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#f472b6' }}>♥ {p.likes}</span>}
                  {p.reposts > 0     && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#34d399' }}>↺ {p.reposts}</span>}
                  {p.replies > 0     && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#a78bfa' }}>💬 {p.replies}</span>}
                </div>
                {p.postUrl && (
                  <a href={p.postUrl} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#c8922a', textDecoration:'none', flexShrink:0 }}>↗</a>
                )}
              </div>
            )
          })}
        </div>
      )}

      {posts.length === 0 && (
        <div style={{ textAlign:'center', padding:'40px', border:'1px solid #1f2428', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151' }}>
          No analytics yet. Post some content first, then click ↻ Refresh Now to fetch metrics.
        </div>
      )}
    </div>
  )
}

// ── Social Profile Links Config ───────────────────────────────────────────────
const SOCIAL_LINK_FIELDS = [
  { key:'bluesky',  label:'🦋 Bluesky',   placeholder:'https://bsky.app/profile/downrangeco.bsky.social' },
  { key:'twitter',  label:'𝕏 X/Twitter',  placeholder:'https://x.com/DownRangeCo' },
  { key:'facebook', label:'f Facebook',   placeholder:'https://www.facebook.com/downrangeco' },
  { key:'threads',  label:'@ Threads',    placeholder:'https://www.threads.net/@downrangeco' },
  { key:'reddit',   label:'🔴 Reddit',    placeholder:'https://www.reddit.com/user/DownRangeCo' },
  { key:'youtube',  label:'▶ YouTube',   placeholder:'https://www.youtube.com/@DownRangeCo' },
]

function SocialLinksConfig({ adminKey, config, onSaved }) {
  const existing = config?.socialLinks || {}
  const [links, setLinks] = useState(existing)
  const [saving, setSaving] = useState(false)
  const [msg,    setMsg]    = useState('')

  async function save() {
    setSaving(true)
    try {
      const res  = await fetch('/api/social/config', {
        method:'POST', headers:{'Content-Type':'application/json','x-admin-key':adminKey},
        body: JSON.stringify({ ...config, socialLinks: links }),
      })
      const data = await res.json()
      setMsg(data.ok ? "✓ Saved — icons update on next page load" : "✗ " + (data.error||"Save failed"))
      onSaved?.()
    } catch(e) { setMsg("✗ " + e.message) }
    setSaving(false); setTimeout(()=>setMsg(''),4000)
  }

  return (
    <div>
      <div style={{ background:'#0a1a08', border:'1px solid #34d39930', padding:'14px 18px', marginBottom:20 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'#34d399', letterSpacing:'0.1em', marginBottom:6 }}>
          SOCIAL MEDIA PROFILE LINKS
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6b7280', lineHeight:1.8 }}>
          Icons appear automatically in the website header and footer for any platform with a URL entered.<br/>
          Leave blank to hide that platform's icon.
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
        {SOCIAL_LINK_FIELDS.map(f => (
          <div key={f.key}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280', marginBottom:5 }}>{f.label}</div>
            <input value={links[f.key]||''} onChange={e => setLinks(l => ({...l,[f.key]:e.target.value}))}
              placeholder={f.placeholder}
              style={{ width:'100%', background:'#09090b', border:'1px solid #1f2428', color:'#e5e5e5', padding:'8px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', outline:'none', boxSizing:'border-box' }} />
          </div>
        ))}
      </div>
      <div style={{ display:'flex', alignItems:'center', gap:14 }}>
        <button onClick={save} disabled={saving}
          style={{ background:'#c8922a', color:'#000', border:'none', padding:'10px 24px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', cursor:saving?'not-allowed':'pointer' }}>
          {saving ? 'SAVING...' : 'SAVE LINKS'}
        </button>
        {msg && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:msg.startsWith('✓')?'#34d399':'#ef4444' }}>{msg}</span>}
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function SocialMediaManager({ adminKey }) {
  const [tab,        setTab]        = useState('schedule')
  const [posts,      setPosts]      = useState([])
  const [stats,      setStats]      = useState({})
  const [config,     setConfig]     = useState({})
  const [configured, setConfigured] = useState({})
  const [loading,    setLoading]    = useState(true)
  const [filterPlatform, setFP]     = useState('')
  const [filterStatus,   setFS]     = useState('')
  const [savingMsg,  setSavingMsg]  = useState('')

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

  async function updatePlatformConfig(pid, update) {
    const next = { ...config, platforms_config: { ...(config.platforms_config||{}), [pid]: update } }
    const res  = await fetch('/api/social/config', { method:'POST', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body: JSON.stringify(next) })
    const data = await res.json()
    if (data.ok) { setConfig(next); setSavingMsg(`✓ ${PLATFORMS[pid].label} saved`); setTimeout(()=>setSavingMsg(''),2000) }
  }

  async function deletePost(id) {
    await fetch('/api/social/log', { method:'DELETE', headers:{'Content-Type':'application/json','x-admin-key':adminKey}, body:JSON.stringify({id}) })
    setPosts(p => p.filter(x=>x._id!==id))
  }

  const TABS = [
    { id:'schedule',  label:'⏱ Schedule' },
    { id:'compose',   label:'⚡ Post Now' },
    { id:'log',       label:'📋 Log' },
    { id:'analytics', label:'📊 Analytics' },
    { id:'links',     label:'🔗 Profile Links' },
    { id:'setup',     label:'🔧 Setup' },
  ]

  const configuredCount = Object.values(configured).filter(Boolean).length

  return (
    <div>
      <style>{`.soc-tab{display:inline-flex;align-items:center;gap:5px;padding:7px 14px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:0.05em;border:none;background:none;color:#4b5563;border-bottom:2px solid transparent;transition:all 0.15s;}.soc-tab:hover{color:#e5e5e5;}.soc-tab.active{color:#c8922a;border-bottom-color:#c8922a;}`}</style>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:16 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.8rem', color:'#e5e5e5', letterSpacing:'0.05em', lineHeight:1.1 }}>SOCIAL MEDIA COMMAND</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4b5563', marginTop:3 }}>
            {configuredCount}/{Object.keys(PLATFORMS).length} platforms configured · Posts include images · News + Blog sources
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          {savingMsg && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#34d399' }}>{savingMsg}</span>}
          <button onClick={load} style={{ background:'none', border:'1px solid #1f2428', color:'#4b5563', padding:'5px 10px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px' }}>↻ REFRESH</button>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:6, marginBottom:16 }}>
        <StatCard label="TOTAL" value={stats.total} />
        <StatCard label="POSTED" value={stats.posted} color="#34d399" />
        <StatCard label="FAILED" value={stats.failed} color="#ef4444" />
        <StatCard label="DRAFTS" value={stats.drafts} color="#9ca3af" />
        <StatCard label="TODAY" value={stats.today} color="#c8922a" />
        <StatCard label="THIS WEEK" value={stats.thisWeek} color="#60a5fa" />
      </div>

      {/* Tabs */}
      <div style={{ borderBottom:'1px solid #1f2428', marginBottom:20 }}>
        {TABS.map(t => <button key={t.id} className={`soc-tab${tab===t.id?' active':''}`} onClick={()=>setTab(t.id)}>{t.label}</button>)}
      </div>

      {/* ── SCHEDULE ── */}
      {tab === 'schedule' && (
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6b7280', marginBottom:14, lineHeight:1.8 }}>
            Optimal times are pre-configured based on 2A audience engagement patterns. Adjust per platform as needed. All times in UTC.
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {Object.keys(PLATFORMS).map(pid => (
              <PlatformScheduleCard
                key={pid} pid={pid}
                platformConfig={config?.platforms_config?.[pid]}
                configured={configured[pid]}
                onUpdate={updatePlatformConfig}
              />
            ))}
          </div>
        </div>
      )}

      {/* ── POST NOW ── */}
      {tab === 'compose' && <FirePanel adminKey={adminKey} configured={configured} onPosted={load} />}

      {/* ── LOG ── */}
      {tab === 'log' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
            <select value={filterPlatform} onChange={e=>setFP(e.target.value)} style={{ background:'#09090b', border:'1px solid #1f2428', color:'#9ca3af', padding:'6px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
              <option value="">All platforms</option>
              {Object.entries(PLATFORMS).map(([pid,p]) => <option key={pid} value={pid}>{p.icon} {p.label}</option>)}
            </select>
            <select value={filterStatus} onChange={e=>setFS(e.target.value)} style={{ background:'#09090b', border:'1px solid #1f2428', color:'#9ca3af', padding:'6px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
              <option value="">All statuses</option>
              {Object.keys(STATUS_STYLE).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151' }}>{posts.length} entries</span>
          </div>
          {posts.map(p => <PostCard key={p._id} post={p} onDelete={deletePost} />)}
          {posts.length === 0 && <div style={{ textAlign:'center', padding:'40px', color:'#374151', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>No posts yet.</div>}
        </div>
      )}

      {/* ── ANALYTICS ── */}
      {tab === 'analytics' && <AnalyticsDashboard adminKey={adminKey} />}

      {/* ── PROFILE LINKS ── */}
      {tab === 'links' && (
        <SocialLinksConfig adminKey={adminKey} config={config} onSaved={load} />
      )}

      {/* ── SETUP ── */}
      {tab === 'setup' && <SetupGuide adminKey={adminKey} />}
    </div>
  )
}
