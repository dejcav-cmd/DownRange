'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// ── Lazy-loaded panel components ────────────────────────────────────────────
const L = (fn) => dynamic(fn, { ssr:false, loading: () => <PanelLoader /> })

const PullLogDashboard      = L(() => import('./pull-log/page'))
const OutreachPortal        = L(() => import('../../components/admin/OutreachPortal'))
const IntelligenceDashboard = L(() => import('../../components/admin/IntelligenceDashboard'))
const AIProviderSettings    = L(() => import('../../components/admin/AIProviderSettings'))
const VideoManager          = L(() => import('../../components/admin/VideoManager'))
const NewsletterManager     = L(() => import('../../components/admin/NewsletterManager'))
const NewsArticleManager    = L(() => import('../../components/admin/NewsArticleManager'))
const ReleaseManager        = L(() => import('../../components/admin/ReleaseManager'))
const CanadaManager         = L(() => import('../../components/admin/CanadaManager'))
const CompetitionManager    = L(() => import('../../components/admin/CompetitionManager'))
const ReviewManager         = L(() => import('../../components/admin/ReviewManager'))
const BlogManagerFull       = L(() => import('../../components/admin/BlogManager'))
const AICostDashboard       = L(() => import('../../components/admin/AICostDashboard'))
const EnvChecker            = L(() => import('../../components/admin/EnvChecker'))
const CronDashboard         = L(() => import('../../components/admin/CronDashboard'))
const ImageRepository       = L(() => import('../../components/admin/ImageRepository'))

function PanelLoader() {
  return <div style={{padding:60,textAlign:'center',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#4b5563',display:'flex',gap:8,alignItems:'center',justifyContent:'center'}}>
    <span style={{animation:'spin 1s linear infinite',display:'inline-block'}}>◈</span> Loading...
    <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
  </div>
}

// ── Navigation structure: sections → panels ──────────────────────────────────
const NAV = [
  {
    id: 'content', label: 'Content', icon: '📰',
    panels: [
      { id:'news',         label:'News Articles',    icon:'📰', badge:null },
      { id:'releases',     label:'Gun Releases',     icon:'🔫', badge:'new' },
      { id:'blog',         label:'Blog',             icon:'✍',  badge:null },
      { id:'reviews',      label:'Reviews',          icon:'★',  badge:null },
      { id:'canada',       label:'Canada',           icon:'🇨🇦', badge:null },
      { id:'competitions', label:'Competitions',     icon:'🏆', badge:null },
    ]
  },
  {
    id: 'publishing', label: 'Publishing', icon: '📅',
    panels: [
      { id:'schedule',     label:'Schedule',         icon:'📅', badge:null },
      { id:'breaking',     label:'Breaking Alerts',  icon:'🔴', badge:null },
      { id:'newsletter',   label:'Newsletter',       icon:'📧', badge:null },
      { id:'seo',          label:'SEO & Meta',       icon:'🔍', badge:null },
    ]
  },
  {
    id: 'intelligence', label: 'Intelligence', icon: '🧠',
    panels: [
      { id:'intel',        label:'Briefings',        icon:'🧠', badge:null },
      { id:'pulllog',      label:'Pull Log',         icon:'📡', badge:null },
      { id:'deals',        label:'Deals Feed',       icon:'🔥', badge:null },
      { id:'feeds',        label:'Feed Agent',       icon:'⚡', badge:null },
    ]
  },
  {
    id: 'system', label: 'System', icon: '⚙',
    panels: [
      { id:'overview',     label:'Overview',         icon:'◈',  badge:null },
      { id:'crons',        label:'Cron Jobs',        icon:'⏱', badge:null },
      { id:'sysalerts',    label:'Alerts',           icon:'🚨', badge:null },
      { id:'agents',       label:'Content Agents',   icon:'🤖', badge:null },
      { id:'rss',          label:'RSS Sources',      icon:'📡', badge:null },
      { id:'ranges',       label:'Ranges DB',        icon:'◎',  badge:null },
    ]
  },
  {
    id: 'outreach', label: 'Outreach', icon: '📬',
    panels: [
      { id:'outreach',     label:'Campaigns',        icon:'📬', badge:null },
    ]
  },
  {
    id: 'media', label: 'Media', icon: '▶',
    panels: [
      { id:'videos',       label:'Video Manager',    icon:'▶',  badge:null },
      { id:'channels',     label:'Channels',         icon:'📺', badge:null },
      { id:'imglib',       label:'Image Library',     icon:'📸', badge:null },
    ]
  },
  {
    id: 'settings', label: 'Settings', icon: '⚙',
    panels: [
      { id:'ai',           label:'AI Models',        icon:'🤖', badge:null },
      { id:'costs',        label:'Cost Center',      icon:'💰', badge:null },
      { id:'keys',         label:'API Keys',         icon:'🔑', badge:null },
      { id:'identity',     label:'Identity',         icon:'🎨', badge:null },
      { id:'envcheck',     label:'Env Vars',         icon:'🔧', badge:null },
    ]
  },
]

// ── All API keys needed ──────────────────────────────────────────────────────
const API_KEYS = [
  { key:'ANTHROPIC_API_KEY',    label:'Anthropic Claude',          required:true,  url:'https://console.anthropic.com' },
  { key:'SANITY_API_TOKEN',     label:'Sanity CMS Token',          required:true,  url:'https://www.sanity.io/manage' },
  { key:'RESEND_API_KEY',       label:'Resend Email',              required:true,  url:'https://resend.com/api-keys' },
  { key:'CRON_SECRET',          label:'Cron Secret',               required:true,  url:null },
  { key:'GLM_API_KEY',          label:'Z.ai GLM (cost savings)',   required:false, url:'https://open.bigmodel.cn' },
  { key:'YOUTUBE_API_KEY',      label:'YouTube Data API',          required:false, url:'https://console.cloud.google.com' },
  { key:'NEWSAPI_KEY',          label:'NewsAPI.org',               required:false, url:'https://newsapi.org/register' },
  { key:'GNEWS_KEY',            label:'GNews',                     required:false, url:'https://gnews.io/#register' },
  { key:'GOOGLE_PLACES_API_KEY',label:'Google Places',             required:false, url:'https://console.cloud.google.com' },
  { key:'CONGRESS_GOV_KEY',     label:'Congress.gov',              required:false, url:'https://api.congress.gov/sign-up/' },
  { key:'ALGOLIA_ADMIN_KEY',    label:'Algolia Search',            required:false, url:'https://www.algolia.com' },
  { key:'DISCORD_WEBHOOK_URL',  label:'Discord Webhook',           required:false, url:null },
]

const VIDEO_SOURCES = [
  { name:'Military Arms Channel', handle:'@MilitaryArmsChannel', cat:'Reviews & Industry', subs:'~860K' },
  { name:'Lucky Gunner',          handle:'@LuckyGunner',         cat:'Ammo & Testing',    subs:'~600K' },
  { name:'Brownells',             handle:'@Brownells',            cat:'Industry & Gear',   subs:'~260K' },
  { name:'IraqVeteran8888',       handle:'@IraqVeteran8888',      cat:'General Firearms',  subs:'~2.6M' },
  { name:'Hickok45',              handle:'@hickok45',             cat:'Demonstrations',    subs:'~6.6M' },
  { name:'Mr. Guns N Gear',       handle:'@MrGunsNGear',          cat:'Reviews',           subs:'~1.3M' },
  { name:'Garand Thumb',          handle:'@GarandThumb',          cat:'Reviews & Training',subs:'~2.5M' },
  { name:'Paul Harrell',          handle:'@PaulHarrell',          cat:'Demonstrations',    subs:'~1.1M' },
]

// ── Styles ───────────────────────────────────────────────────────────────────
const STYLES = `
  :root { --bg:#09090B; --bg2:#111318; --bg3:#1a1d24; --text:#F0EDE6; --text-dim:#6b7280; --border:#1e293b; --gold:#C8922A; }
  * { box-sizing:border-box; margin:0; padding:0; }
  body { background:var(--bg); color:var(--text); }

  /* ── Layout scaffold ── */
  html, body { height:100%; overflow:hidden; }

  .adm-topbar {
    position:fixed; top:0; left:0; right:0; height:52px; z-index:100;
    background:var(--bg2); border-bottom:1px solid var(--border);
    display:flex; align-items:center; padding:0 20px; gap:12px;
  }
  .adm-logo { font-family:'Bebas Neue',cursive; font-size:1.3rem; color:var(--gold); letter-spacing:.08em; flex-shrink:0; }
  .adm-site-link { font-size:10px; color:#4b5563; text-decoration:none; padding:4px 10px; border:1px solid var(--border); transition:all .15s; white-space:nowrap; }
  .adm-site-link:hover { border-color:var(--gold); color:var(--gold); }
  .adm-status-pill { display:flex; align-items:center; gap:5px; font-size:9px; color:#4b5563; letter-spacing:.08em; text-transform:uppercase; padding:3px 8px; background:rgba(0,0,0,.3); border:1px solid var(--border); white-space:nowrap; }
  .adm-msg { flex:1; font-size:10px; padding:5px 12px; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .adm-msg.ok  { color:#22c55e; background:rgba(34,197,94,.08); }
  .adm-msg.err { color:#f87171; background:rgba(239,68,68,.08); }
  .adm-msg.info{ color:#C8922A; background:rgba(200,146,42,.08); }

  /* Shell sits below the topbar */
  .adm-shell {
    display:flex;
    height:calc(100vh - 52px);
    margin-top:52px;
    overflow:hidden;
    background:var(--bg);
    font-family:'IBM Plex Mono',monospace;
  }

  /* Sidebar — full height of shell */
  .adm-sidebar {
    width:200px; flex-shrink:0;
    background:var(--bg2); border-right:1px solid var(--border);
    display:flex; flex-direction:column;
    overflow-y:auto; overflow-x:hidden;
  }
  .adm-section-btn {
    width:100%; background:none; border:none; border-left:3px solid transparent;
    color:var(--text-dim); font-family:'IBM Plex Mono',monospace; font-size:11px;
    padding:11px 16px; cursor:pointer; text-align:left;
    display:flex; align-items:center; gap:8px;
    transition:all .12s; letter-spacing:.03em;
    white-space:nowrap; overflow:hidden;
  }
  .adm-section-btn:hover { background:rgba(255,255,255,.03); color:var(--text); }
  .adm-section-btn.active { border-left-color:var(--gold); color:var(--gold); background:rgba(200,146,42,.08); }
  .adm-section-btn .adm-count { margin-left:auto; font-size:8px; background:rgba(200,146,42,.2); color:var(--gold); padding:1px 5px; border-radius:2px; flex-shrink:0; }

  /* Main column */
  .adm-main {
    flex:1; min-width:0;
    display:flex; flex-direction:column;
    overflow:hidden;
  }

  /* Sub-tabs — sticky at top of main column, NOT full-page fixed */
  .adm-subtabs {
    flex-shrink:0;
    display:flex; gap:0;
    border-bottom:1px solid var(--border);
    background:var(--bg2);
    overflow-x:auto; overflow-y:hidden;
    scrollbar-width:none;
  }
  .adm-subtabs::-webkit-scrollbar { display:none; }
  .adm-subtab {
    background:none; border:none; border-bottom:2px solid transparent;
    color:var(--text-dim); font-family:'IBM Plex Mono',monospace; font-size:11px;
    padding:10px 16px; cursor:pointer; white-space:nowrap;
    letter-spacing:.03em; transition:all .12s;
    display:flex; align-items:center; gap:5px; flex-shrink:0;
  }
  .adm-subtab:hover { color:var(--text); background:rgba(255,255,255,.02); }
  .adm-subtab.active { border-bottom-color:var(--gold); color:var(--gold); }
  .adm-subtab .badge { background:#ef4444; color:#fff; font-size:7px; padding:1px 4px; border-radius:2px; font-weight:700; }

  /* Scrollable panel area */
  .adm-panel { flex:1; overflow-y:auto; overflow-x:hidden; padding:28px 32px; }

  /* Cards */
  .adm-card { background:var(--bg2); border:1px solid var(--border); padding:20px 24px; }
  .adm-card-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(260px,1fr)); gap:12px; }
  .adm-stat { background:var(--bg2); border:1px solid var(--border); padding:16px 20px; }
  .adm-stat-val { font-family:'Bebas Neue',cursive; font-size:2rem; color:var(--gold); line-height:1; }
  .adm-stat-lbl { font-size:9px; color:#4b5563; letter-spacing:.1em; text-transform:uppercase; margin-top:3px; }

  /* Buttons */
  .btn-primary { background:var(--gold); color:#000; border:none; font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:9px 18px; cursor:pointer; transition:opacity .15s; }
  .btn-primary:hover { opacity:.85; }
  .btn-primary:disabled { opacity:.35; cursor:not-allowed; }
  .btn-outline { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:'IBM Plex Mono',monospace; font-size:10px; padding:6px 12px; cursor:pointer; transition:all .15s; }
  .btn-outline:hover { border-color:var(--gold); color:var(--gold); }
  .btn-danger { background:none; border:1px solid rgba(239,68,68,.4); color:#ef4444; font-family:'IBM Plex Mono',monospace; font-size:10px; padding:6px 12px; cursor:pointer; }
  .btn-danger:hover { background:rgba(239,68,68,.1); }

  /* Section headers */
  .panel-title { font-family:'Bebas Neue',cursive; font-size:1.8rem; color:var(--text); letter-spacing:.04em; margin-bottom:6px; }
  .panel-sub { font-family:'IBM Plex Mono',monospace; font-size:11px; color:#4b5563; line-height:1.7; margin-bottom:24px; }

  /* Table */
  .adm-table { width:100%; border-collapse:collapse; font-family:'IBM Plex Mono',monospace; font-size:11px; }
  .adm-table th { padding:8px 14px; text-align:left; font-size:9px; color:#4b5563; letter-spacing:.1em; text-transform:uppercase; border-bottom:2px solid var(--border); background:rgba(0,0,0,.3); }
  .adm-table td { padding:10px 14px; border-bottom:1px solid var(--border); color:var(--text); vertical-align:middle; }
  .adm-table tr:hover td { background:rgba(200,146,42,.04); }

  /* Lbl */
  .lbl { font-size:9px; color:#64748b; letter-spacing:.1em; text-transform:uppercase; display:block; margin-bottom:4px; }
  .inp { background:var(--bg3); border:1px solid var(--border); color:var(--text); font-family:'IBM Plex Mono',monospace; font-size:11px; padding:8px 10px; width:100%; outline:none; }
  .inp:focus { border-color:var(--gold); }

  /* Health */
  .health-ok { color:#22c55e; } .health-warn { color:#f59e0b; } .health-err { color:#ef4444; }

  scrollbar-width: thin; scrollbar-color: #1e293b transparent;
`

// ── Inline: Overview Dashboard ───────────────────────────────────────────────
function OverviewDashboard({ adminKey, setPanel, setSection }) {
  const [health, setHealth]         = useState(null)
  const [migrateResult, setMigrateResult] = useState(null)
  const [migrating, setMigrating]   = useState(false)
  const [feedRunning, setFeedRunning] = useState(false)
  const [feedResult, setFeedResult]   = useState(null)

  useEffect(() => {
    fetch('/api/admin/cron-health').then(r=>r.json()).then(d=>setHealth(d)).catch(()=>{})
  }, [])

  async function runNewsFeed() {
    setFeedRunning(true); setFeedResult(null)
    try {
      const res = await fetch('/api/admin/cron-status?trigger=true', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: 'news' }),
      })
      const d = await res.json()
      setFeedResult({ ok: d.ok, msg: d.ok ? `✓ News feed ran in ${d.ms}ms` : '✕ ' + (d.error || d.response || 'Failed') })
      fetch('/api/admin/cron-health').then(r=>r.json()).then(d=>setHealth(d)).catch(()=>{})
    } catch(e) { setFeedResult({ ok: false, msg: 'Error: ' + e.message }) }
    setFeedRunning(false)
  }

  async function migrateAmmoland() {
    setMigrating(true); setMigrateResult(null)
    try {
      const preview = await fetch('/api/admin/migrate-ammoland', { headers:{'x-admin-key':adminKey} })
      const pd = await preview.json()
      if (pd.wrongCategory === 0) {
        setMigrateResult({ ok:true, msg:'Nothing to migrate — all AmmoLand articles already in deals ✓' })
        setMigrating(false); return
      }
      const r = await fetch('/api/admin/migrate-ammoland', { method:'POST', headers:{'x-admin-key':adminKey} })
      const d = await r.json()
      setMigrateResult({ ok:d.ok, msg: d.ok ? `✓ Migrated ${d.migrated} AmmoLand articles → deals category` : '✕ ' + (d.errors?.[0] || 'Error') })
    } catch(e) { setMigrateResult({ ok:false, msg:'Error: '+e.message }) }
    setMigrating(false)
  }

  const quickLinks = [
    { label:'View Site',    url:'https://downrangeco.com', icon:'🌐' },
    { label:'View News',    url:'https://downrangeco.com/news', icon:'📰' },
    { label:'Blog',         url:'https://downrangeco.com/blog', icon:'✍' },
    { label:'Sanity Studio',url:'/studio', icon:'📝' },
    { label:'Vercel',       url:'https://vercel.com', icon:'▲' },
  ]

  const contentSections = [
    { label:'News Articles', icon:'📰', url:'/news',        editFn:()=>{ setSection('content'); setPanel('news') } },
    { label:'Gun Releases',  icon:'🔫', url:'/releases',    editFn:()=>{ setSection('content'); setPanel('releases') } },
    { label:'Blog Posts',    icon:'✍',  url:'/blog',        editFn:()=>{ setSection('content'); setPanel('blog') } },
    { label:'Competitions',  icon:'🏆', url:'/competitions',editFn:()=>{ setSection('content'); setPanel('competitions') } },
    { label:'Canada',        icon:'🇨🇦', url:'/canada',      editFn:()=>{ setSection('content'); setPanel('canada') } },
    { label:'Videos',        icon:'▶',  url:'/video',       editFn:()=>{ setSection('media');   setPanel('videos') } },
  ]

  return (
    <div>
      <div className="panel-title">DownRange Command Center</div>
      <div className="panel-sub">Enterprise firearms media management platform</div>

      {/* AmmoLand migration */}
      <div style={{marginBottom:16,padding:'12px 18px',background:'rgba(200,146,42,.05)',border:'1px solid rgba(200,146,42,.2)',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',fontWeight:700}}>AMMOLAND FIX</span>
        <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',flex:1}}>Migrate AmmoLand articles from news → deals category. Run once to fix existing articles.</span>
        <button className="btn-primary" style={{fontSize:10,padding:'5px 14px'}} onClick={migrateAmmoland} disabled={migrating}>
          {migrating ? '⏳ Migrating...' : '▶ Run Migration'}
        </button>
        {migrateResult && (
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:migrateResult.ok?'#22c55e':'#ef4444'}}>{migrateResult.msg}</span>
        )}
      </div>

      {/* Health banner */}
      {health && health.status !== 'ok' && (
        <div style={{marginBottom:20,padding:'12px 18px',background:'rgba(239,68,68,.08)',border:'1px solid rgba(239,68,68,.3)',fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>
          <span style={{color:'#ef4444',fontWeight:700,marginRight:10}}>⚠ SYSTEM DEGRADED</span>
          {(health.issues||[]).map((i,x)=><span key={x} style={{color:'#fca5a5',marginRight:8}}>{typeof i==='object'?i.msg||i.severity||JSON.stringify(i):i}</span>)}
        </div>
      )}

      {/* Quick links */}
      <div style={{display:'flex',gap:8,marginBottom:24,flexWrap:'wrap'}}>
        {quickLinks.map(l=>(
          <a key={l.label} href={l.url} target="_blank" rel="noreferrer"
            style={{display:'flex',alignItems:'center',gap:6,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#6b7280',padding:'6px 12px',border:'1px solid var(--border)',textDecoration:'none',transition:'all .15s'}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#C8922A';e.currentTarget.style.color='#C8922A'}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='#6b7280'}}>
            <span>{l.icon}</span>{l.label} ↗
          </a>
        ))}
      </div>

      {/* Content grid */}
      <div style={{marginBottom:8,fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',letterSpacing:'.05em',textTransform:'uppercase'}}>Content Sections</div>
      <div className="adm-card-grid" style={{marginBottom:32}}>
        {contentSections.map(s=>(
          <div key={s.label} className="adm-card" style={{display:'flex',gap:12,alignItems:'center',transition:'border-color .15s',cursor:'pointer'}}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#C8922A'}
            onMouseLeave={e=>e.currentTarget.style.borderColor='var(--border)'}>
            <span style={{fontSize:24,flexShrink:0}}>{s.icon}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:4}}>{s.label}</div>
              <div style={{display:'flex',gap:8}}>
                <a href={s.url} target="_blank" rel="noreferrer" className="btn-outline" style={{padding:'3px 8px',fontSize:9,textDecoration:'none'}}>View ↗</a>
                <button className="btn-outline" style={{padding:'3px 8px',fontSize:9}} onClick={s.editFn}>Manage →</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* System status */}
      <div style={{marginBottom:8,fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',letterSpacing:'.05em',textTransform:'uppercase'}}>System Status</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))',gap:10}}>
        {[
          {label:'News Feed', status: health?.status==='ok'?'Healthy': health?.issues?.[0]?.msg?.slice(0,40)||'Check required', ok:health?.status==='ok', icon:'📰', action: runNewsFeed, actionLabel: feedRunning?'Running…':'▶ Run Now'},
          {label:'Cron Jobs',     status:'Running',     ok:true,  icon:'⏱'},
          {label:'AI Pipeline',   status:'Active',      ok:true,  icon:'🤖'},
          {label:'Sanity CMS',    status:'Connected',   ok:true,  icon:'📦'},
        ].map(s=>(
          <div key={s.label} className="adm-card" style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
            <span style={{fontSize:18}}>{s.icon}</span>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'var(--text)',marginBottom:2}}>{s.label}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:s.ok?'#22c55e':'#f59e0b'}}>{s.ok?'●':''} {s.status}</div>
              {s.action && <button className="btn-primary" style={{marginTop:6,fontSize:9,padding:'3px 8px'}} onClick={s.action} disabled={feedRunning}>{s.actionLabel}</button>}
            </div>
          </div>
        ))}
      </div>
      {feedResult && (
        <div style={{marginTop:10,padding:'8px 14px',background:feedResult.ok?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)',border:`1px solid ${feedResult.ok?'#22c55e':'#ef4444'}`,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:feedResult.ok?'#22c55e':'#f87171'}}>
          {feedResult.msg}
        </div>
      )}
    </div>
  )
}

// ── Inline: RSS Sources tab ───────────────────────────────────────────────────
function RSSSourcesPanel() {
  const RSS_FEEDS = [
    { name:'The Firearm Blog',      url:'https://www.thefirearmblog.com/blog/feed/',  cat:'industry', active:true },
    { name:'TTAG',                  url:'https://www.thetruthaboutguns.com/feed/',     cat:'news',     active:true },
    { name:'Guns.com News',         url:'https://www.guns.com/feed',                   cat:'industry', active:true },
    { name:'NRA-ILA',               url:'https://www.nraila.org/rss/',                 cat:'law',      active:true },
    { name:'ATF News',              url:'https://www.atf.gov/rss/news_whats-new.xml',  cat:'law',      active:true },
    { name:'SAF',                   url:'https://www.saf.org/feed/',                   cat:'law',      active:true },
    { name:'Bearing Arms',          url:'https://bearingarms.com/feed/',               cat:'news',     active:true },
    { name:'AmmoLand',              url:'https://www.ammoland.com/feed/',              cat:'industry', active:true },
    { name:'TheGunFeed',            url:'https://thegunfeed.com/feed/',                cat:'law',      active:true },
    { name:'TheGunBlog.ca',         url:'https://www.thegunblog.ca/feed/',             cat:'law',      active:true },
    { name:'NFA Canada',            url:'https://www.nfa.ca/feed/',                    cat:'law',      active:true },
    { name:'CSSA',                  url:'https://www.cdnshootingsports.org/feed/',     cat:'law',      active:true },
    { name:'Gun Owners of America', url:'https://www.gunowners.org/feed/',             cat:'law',      active:true },
    { name:'Gun Owners of America', url:'https://www.gunowners.org/feed/',             cat:'law',      active:true },
    { name:'American Rifleman',     url:'https://www.americanrifleman.org/feed/',      cat:'industry', active:true },
    { name:'Concealed Nation',      url:'https://concealednation.org/feed/',           cat:'news',     active:true },
    { name:'r/guns',                url:'https://www.reddit.com/r/guns/.rss',          cat:'community',active:true },
    { name:'r/firearms',            url:'https://www.reddit.com/r/firearms/.rss',      cat:'community',active:true },
  ]
  const cats = [...new Set(RSS_FEEDS.map(f=>f.cat))]
  const [filter, setFilter] = useState('all')
  const visible = filter==='all' ? RSS_FEEDS : RSS_FEEDS.filter(f=>f.cat===filter)

  return (
    <div>
      <div className="panel-title">RSS Sources</div>
      <div className="panel-sub">{RSS_FEEDS.length} active feeds · Pulls every 15 min via news agent</div>
      <div style={{display:'flex',gap:6,marginBottom:16,flexWrap:'wrap'}}>
        {['all',...cats].map(c=>(
          <button key={c} className="btn-outline" onClick={()=>setFilter(c)}
            style={{fontSize:9,padding:'4px 10px',borderColor:filter===c?'var(--gold)':'var(--border)',color:filter===c?'var(--gold)':'var(--text-dim)'}}>
            {c}
          </button>
        ))}
      </div>
      <div className="adm-card" style={{padding:0,overflow:'hidden'}}>
        <table className="adm-table">
          <thead><tr><th>Source</th><th>Category</th><th>Feed URL</th><th>Status</th></tr></thead>
          <tbody>{visible.map(f=>(
            <tr key={f.name}>
              <td style={{fontWeight:700,color:'var(--text)'}}>{f.name}</td>
              <td><span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:'2px 6px',background:'rgba(200,146,42,.1)',color:'#C8922A'}}>{f.cat}</span></td>
              <td><a href={f.url} target="_blank" rel="noreferrer" style={{color:'#4b5563',fontSize:10,textDecoration:'none'}}>{f.url.slice(0,45)}…</a></td>
              <td><span style={{color:'#22c55e',fontSize:10}}>● Active</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ── Inline: Channels panel ────────────────────────────────────────────────────
function ChannelsPanel() {
  return (
    <div>
      <div className="panel-title">YouTube Channels</div>
      <div className="panel-sub">Channels powering the Video section. Synced via YouTube Data API every 4 hours.</div>
      <div className="adm-card" style={{padding:0,overflow:'hidden'}}>
        <table className="adm-table">
          <thead><tr><th>Channel</th><th>Handle</th><th>Category</th><th>Subscribers</th><th>Status</th></tr></thead>
          <tbody>{VIDEO_SOURCES.map(c=>(
            <tr key={c.name}>
              <td style={{fontWeight:700}}>{c.name}</td>
              <td style={{color:'#C8922A'}}>{c.handle}</td>
              <td style={{color:'#6b7280'}}>{c.cat}</td>
              <td style={{color:'var(--text)'}}>{c.subs}</td>
              <td><span style={{color:'#22c55e',fontSize:10}}>● Active</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ── Inline: API Keys panel ────────────────────────────────────────────────────
function APIKeysPanel({ adminKey }) {
  const [envData, setEnvData] = useState(null)
  useEffect(() => {
    if (!adminKey) return
    fetch('/api/admin/ai-status', { headers:{'x-admin-key':adminKey} })
      .then(r=>r.json()).then(d=>{ if(d.ok) setEnvData(d.status) }).catch(()=>{})
  }, [adminKey])

  return (
    <div>
      <div className="panel-title">API Keys</div>
      <div className="panel-sub">Set all keys in Vercel → Project → Settings → Environment Variables. Never commit keys to git.</div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {API_KEYS.map(k=>{
          const isSet = envData ? envData[k.key] : null
          return (
            <div key={k.key} className="adm-card" style={{display:'flex',gap:12,alignItems:'center',padding:'14px 18px'}}>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:2}}>
                  {k.label}
                  {k.required && <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'#ef4444',marginLeft:6,padding:'1px 4px',background:'rgba(239,68,68,.1)'}}>REQUIRED</span>}
                </div>
                <code style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A'}}>{k.key}</code>
              </div>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                {isSet !== null && (
                  <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:isSet?'#22c55e':'#4b5563'}}>
                    {isSet ? '✅ SET' : '— NOT SET'}
                  </span>
                )}
                {k.url && <a href={k.url} target="_blank" rel="noreferrer" className="btn-outline" style={{padding:'4px 10px',fontSize:9,textDecoration:'none'}}>Get Key ↗</a>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Inline: Breaking Alerts panel ────────────────────────────────────────────
function BreakingAlertsPanel({ adminKey }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({headline:'',url:'',urgency:7})
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/breaking-alerts?limit=20')
      const d = await r.json()
      setAlerts(d.alerts || [])
    } catch {}
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  async function addAlert() {
    if (!form.headline) return
    setBusy(true)
    await fetch('/api/admin/breaking-alert', { method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'}, body:JSON.stringify(form) })
    setForm({headline:'',url:'',urgency:7})
    await load()
    setBusy(false)
  }

  async function deleteAlert(id) {
    await fetch('/api/admin/breaking-alert', { method:'DELETE', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'}, body:JSON.stringify({id}) })
    await load()
  }

  return (
    <div>
      <div className="panel-title">Breaking Alerts</div>
      <div className="panel-sub">Alerts appear in the ticker bar at the top of every page. Active until dismissed.</div>
      <div className="adm-card" style={{marginBottom:20}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:12}}>New Alert</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 300px 80px',gap:10,marginBottom:10}}>
          <div><span className="lbl">Headline</span><input className="inp" value={form.headline} onChange={e=>setForm(p=>({...p,headline:e.target.value}))} placeholder="Breaking: ..." /></div>
          <div><span className="lbl">URL (optional)</span><input className="inp" value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))} placeholder="https://..." /></div>
          <div><span className="lbl">Urgency 1-10</span><input className="inp" type="number" min={1} max={10} value={form.urgency} onChange={e=>setForm(p=>({...p,urgency:parseInt(e.target.value)||7}))} /></div>
        </div>
        <button className="btn-primary" onClick={addAlert} disabled={busy||!form.headline}>Publish Alert</button>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:8}}>
        {loading ? <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:12,color:'#4b5563',padding:20,textAlign:'center'}}>Loading...</div>
        : alerts.length === 0 ? <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#4b5563',padding:20,textAlign:'center'}}>No active alerts</div>
        : alerts.map(a=>(
          <div key={a._id} className="adm-card" style={{display:'flex',gap:12,alignItems:'center',padding:'12px 16px'}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,padding:'2px 6px',background:'rgba(239,68,68,.15)',color:'#ef4444',flexShrink:0}}>LIVE</span>
            <div style={{flex:1,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'var(--text)'}}>{a.headline}</div>
            {a.url && <a href={a.url} target="_blank" rel="noreferrer" style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',textDecoration:'none'}}>Link ↗</a>}
            <button onClick={()=>deleteAlert(a._id)} className="btn-danger" style={{padding:'4px 8px',flexShrink:0}}>Remove</button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Inline: SEO panel ─────────────────────────────────────────────────────────
function SEOPanel() {
  const pages = [
    { path:'/', title:'DownRange — America\'s Firearms Intelligence Hub', desc:'Live 2A news, legislation, gear, and market intelligence.', ga:'Active', search:'Indexed' },
    { path:'/news', title:'Firearms News | DownRange', desc:'Live 2A and gun news from 30+ sources.', ga:'Active', search:'Indexed' },
    { path:'/blog', title:'Blog | DownRange', desc:'In-depth firearms analysis.', ga:'Active', search:'Indexed' },
    { path:'/canada', title:'Canadian Firearms Law | DownRange', desc:'PAL, C-21, province ratings.', ga:'Active', search:'Indexed' },
    { path:'/competitions', title:'Shooting Competitions | DownRange', desc:'NRA, USPSA, PRS, IDPA calendar.', ga:'Active', search:'Indexed' },
    { path:'/releases', title:'New Gun Releases | DownRange', desc:'Latest firearm launches.', ga:'Active', search:'Indexed' },
  ]
  return (
    <div>
      <div className="panel-title">SEO & Indexing</div>
      <div className="panel-sub">GA4: G-KDGZX3CLEC · Sitemap: downrangeco.com/sitemap.xml · News sitemap: /news-sitemap.xml</div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <a href="https://search.google.com/search-console" target="_blank" rel="noreferrer" className="btn-outline" style={{textDecoration:'none',fontSize:10}}>Google Search Console ↗</a>
        <a href="https://analytics.google.com" target="_blank" rel="noreferrer" className="btn-outline" style={{textDecoration:'none',fontSize:10}}>Google Analytics ↗</a>
        <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="btn-outline" style={{textDecoration:'none',fontSize:10}}>Sitemap ↗</a>
        <a href="/news-sitemap.xml" target="_blank" rel="noreferrer" className="btn-outline" style={{textDecoration:'none',fontSize:10}}>News Sitemap ↗</a>
      </div>
      <div className="adm-card" style={{padding:0,overflow:'hidden'}}>
        <table className="adm-table">
          <thead><tr><th>Page</th><th>Title</th><th>GA4</th><th>Search</th></tr></thead>
          <tbody>{pages.map(p=>(
            <tr key={p.path}>
              <td><a href={p.path} target="_blank" rel="noreferrer" style={{color:'#C8922A',textDecoration:'none'}}>{p.path}</a></td>
              <td style={{color:'#9ca3af',maxWidth:300,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{p.title}</td>
              <td><span className="health-ok">● {p.ga}</span></td>
              <td><span className="health-ok">● {p.search}</span></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  )
}

// ── Inline: Identity panel ────────────────────────────────────────────────────
function IdentityPanel({ adminKey }) {
  const siteLinks = [
    {label:'Logo',         desc:'SVG logo — edit via public/logo.svg'},
    {label:'Color Scheme', desc:'Gold #C8922A, BG #09090B, Text #F0EDE6 — edit globals.css'},
    {label:'Fonts',        desc:'Bebas Neue, IBM Plex Mono, Barlow Condensed — via next/font'},
    {label:'Favicon',      desc:'public/icon.png, public/favicon.ico'},
    {label:'OG Image',     desc:'public/og-image.jpg — 1200×630 — social share preview'},
  ]
  return (
    <div>
      <div className="panel-title">Site Identity</div>
      <div className="panel-sub">Brand assets, colors, and typography. Edit source files directly.</div>
      <div className="adm-card-grid" style={{marginBottom:24}}>
        {siteLinks.map(s=>(
          <div key={s.label} className="adm-card">
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:4}}>{s.label}</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#6b7280'}}>{s.desc}</div>
          </div>
        ))}
      </div>
      <div className="adm-card">
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:12}}>Brand Colors</div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          {[['#C8922A','Gold — Primary'],['#09090B','Background'],['#111318','Card BG'],['#F0EDE6','Text'],['#6b7280','Text Dim'],['#1e293b','Border']].map(([color,label])=>(
            <div key={color} style={{display:'flex',flexDirection:'column',gap:6,alignItems:'center'}}>
              <div style={{width:48,height:48,background:color,border:'1px solid var(--border)'}} />
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',textAlign:'center'}}>{label}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:color}}>{color}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── Inline: Feeds panel ───────────────────────────────────────────────────────
function FeedsPanel({ adminKey, setMsg }) {
  const [running, setRunning] = useState({})
  const feeds = [
    { key:'news',     label:'News Feed',     icon:'📰', schedule:'Every 15 min', desc:'RSS + NewsAPI + GNews → AI rewrite → Sanity', color:'#22c55e' },
    { key:'laws',     label:'Laws Feed',     icon:'⚖',  schedule:'Every 2 hrs',  desc:'Congress.gov + LegiScan → bill analysis', color:'#3b82f6' },
    { key:'releases', label:'Releases Feed', icon:'🔫', schedule:'Every 1 hr',   desc:'PRNewswire + manufacturer RSS → new gun releases', color:'#C8922A' },
    { key:'market',   label:'Market Feed',   icon:'📊', schedule:'Every 30 min', desc:'Ammo prices + market data → market analysis', color:'#f59e0b' },
    { key:'video',    label:'Video Feed',    icon:'▶',  schedule:'Every 4 hrs',  desc:'YouTube API → channel videos + thumbnails', color:'#ef4444' },
    { key:'state',    label:'State Feed',    icon:'🗺', schedule:'Daily 8am',    desc:'State legislation + profiles → 50-state database', color:'#a855f7' },
    { key:'goa',      label:'GOA Press',     icon:'⚖', schedule:'Every 2 hrs',  desc:'Gun Owners of America press center — no-compromise 2A advocacy', color:'#ef4444' },
  ]

  async function run(key) {
    setRunning(r=>({...r,[key]:true}))
    setMsg(`Running ${key} feed...`)
    try {
      const r = await fetch(`/api/admin/run?feed=${key}`, { method:'POST', headers:{'x-admin-key':adminKey} })
      const d = await r.json()
      if (d.success) {
        const res = d.result || {}
        setMsg(`✅ ${key}: ${res.done ?? res.published ?? '?'} published · ${d.ms}ms`)
      } else setMsg(`❌ ${key}: ${d.error}`)
    } catch(e) { setMsg(`❌ Error: ${e.message}`) }
    setRunning(r=>({...r,[key]:false}))
  }

  return (
    <div>
      <div className="panel-title">AI Feed Agent</div>
      <div className="panel-sub">Automated content ingestion pipelines. Each feed pulls, processes, and publishes to Sanity on schedule.</div>
      <div className="adm-card-grid">
        {feeds.map(f=>(
          <div key={f.key} className="adm-card" style={{borderLeft:`3px solid ${f.color}`}}>
            <div style={{display:'flex',gap:10,alignItems:'flex-start',marginBottom:10}}>
              <span style={{fontSize:20}}>{f.icon}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--text)',marginBottom:2}}>{f.label}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:f.color}}>{f.schedule}</div>
              </div>
            </div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#6b7280',marginBottom:12,lineHeight:1.6}}>{f.desc}</div>
            <button className="btn-primary" onClick={()=>run(f.key)} disabled={running[f.key]}
              style={{width:'100%',fontSize:11,background:running[f.key]?'#374151':f.color}}>
              {running[f.key] ? '⏳ Running...' : '▶ Run Now'}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Inline: Deals panel ───────────────────────────────────────────────────────
function DealsPanel() {
  return (
    <div>
      <div className="panel-title">Deals Feed Config</div>
      <div className="panel-sub">Gun.deals and AmmoLand deals aggregation. Configure sources in the feed agent.</div>
      <div className="adm-card">
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#6b7280',lineHeight:1.9}}>
          Deals are scraped from AmmoLand (locked to deals category) and gun.deals API. Configure the <code style={{color:'#C8922A'}}>GUN_DEALS_API_KEY</code> in Vercel to enable the gun.deals feed. The agent runs every 30 minutes and deduplicates by URL.
        </div>
      </div>
    </div>
  )
}

// ── Inline: Ranges panel ──────────────────────────────────────────────────────
function ContentAgentsPanel({ adminKey, setMsg }) {
  const [running, setRunning] = useState({})
  const [results, setResults] = useState({})

  async function run(key, path, method='POST', params='') {
    setRunning(r => ({...r, [key]: true}))
    setResults(r => ({...r, [key]: null}))
    setMsg('⏳ Running ' + key + '...')
    try {
      const res = await fetch('/api/admin/' + path + params, {
        method,
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }
      })
      const d = await res.json()
      setResults(r => ({...r, [key]: d}))
      if (d.ok !== false) setMsg('✅ ' + key + ' complete')
      else setMsg('❌ ' + (d.error || 'Error'))
    } catch(e) {
      setResults(r => ({...r, [key]: { ok: false, error: e.message }}))
      setMsg('❌ ' + e.message)
    }
    setRunning(r => ({...r, [key]: false}))
  }

  const AGENTS = [
    {
      key: 'fix-images',
      label: '🖼 Fix Article Images',
      desc: 'Scans all news articles and patches missing or broken images. Tries source OG image first, falls back to keyword-matched firearm photo from image library.',
      color: '#3b82f6',
      actions: [
        { label: 'Fix Missing (batch 50)', params: '?batch=50&force=false' },
        { label: 'Force Re-patch All (batch 50)', params: '?batch=50&force=true' },
        { label: 'Large Batch (100)', params: '?batch=100&force=false' },
      ]
    },
    {
      key: 'backfill-articles',
      label: '✍ AI Rewrite / Backfill Articles',
      desc: 'Finds news articles with missing or stub body text and rewrites them using Claude AI. Produces full 900–1100 word articles in DownRange voice.',
      color: '#C8922A',
      actions: [
        { label: 'Backfill 5 Articles', params: '?limit=5' },
        { label: 'Backfill 10 Articles', params: '?limit=10' },
        { label: 'Backfill 25 Articles', params: '?limit=25' },
      ]
    },
    {
      key: 'write-blog-articles',
      label: '📝 Write Blog Articles (AI)',
      desc: 'Generates new blog posts using Claude AI based on recent firearms news. Each post is 600–900 words, opinionated, written in DownRange voice.',
      color: '#22c55e',
      actions: [
        { label: 'Write 3 Blog Posts', params: '' },
      ]
    },
    {
      key: 'write-canada-articles',
      label: '🇨🇦 Write Canada Articles (AI)',
      desc: 'Generates Canadian firearms law analysis articles based on current C-21, PAL, and provincial legislation.',
      color: '#ef4444',
      actions: [
        { label: 'Write Canada Articles', params: '' },
      ]
    },
    {
      key: 'fetch-article-images',
      label: '📷 Fetch OG Images from Sources',
      desc: 'For articles missing images, fetches the og:image from each article source URL and uploads to Sanity CDN. Runs automatically every 30min via cron.',
      color: '#a855f7',
      actions: [
        { label: 'Fetch Now (batch 30)', params: '?limit=30' },
      ]
    },
    {
      key: 'patch-article',
      label: '🔧 Patch All Article Images',
      desc: 'Assigns SVG fallback images to articles based on keyword matching: law/ban/ATF → ⚖ law.svg, pistol/Glock → 🔫 pistol.svg, rifle/AR → rifle.svg, etc.',
      color: '#f59e0b',
      actions: [
        { label: 'Patch All Articles', params: '' },
      ]
    },
  ]

  return (
    <div>
      <div className="panel-title">🤖 Content Agents</div>
      <div className="panel-sub">
        AI-powered content operations. Each agent runs on demand or via cron. Results show below each card after running.
      </div>

      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16}}>
        {AGENTS.map(agent => {
          const res = results[agent.key]
          const busy = running[agent.key]
          return (
            <div key={agent.key} className="adm-card" style={{borderLeft:`3px solid ${agent.color}`, display:'flex', flexDirection:'column', gap:12}}>
              <div>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700, color:'var(--text)', marginBottom:4}}>
                  {agent.label}
                </div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.7}}>
                  {agent.desc}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                {agent.actions.map(action => (
                  <button key={action.label} className="btn-primary"
                    style={{fontSize:11, padding:'6px 14px', background: busy ? '#374151' : agent.color, opacity: busy ? 0.6 : 1}}
                    disabled={busy}
                    onClick={() => run(agent.key, agent.key, 'POST', action.params)}>
                    {busy ? '⏳ Running...' : action.label}
                  </button>
                ))}
              </div>

              {/* Result */}
              {res && (
                <div style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'10px 12px',
                  background: res.ok === false ? 'rgba(239,68,68,.08)' : 'rgba(34,197,94,.08)',
                  border: `1px solid ${res.ok === false ? 'rgba(239,68,68,.3)' : 'rgba(34,197,94,.3)'}`,
                  color: res.ok === false ? '#f87171' : '#4ade80',
                  lineHeight: 1.7
                }}>
                  {res.ok === false ? '❌ ' + (res.error || 'Error') : (
                    <div>
                      ✅ Done
                      {res.patched != null && <span style={{color:'var(--text-dim)'}}> · {res.patched} patched</span>}
                      {res.published != null && <span style={{color:'var(--text-dim)'}}> · {res.published} published</span>}
                      {res.done != null && <span style={{color:'var(--text-dim)'}}> · {res.done} done</span>}
                      {res.written != null && <span style={{color:'var(--text-dim)'}}> · {res.written} written</span>}
                      {res.saved != null && <span style={{color:'var(--text-dim)'}}> · {res.saved} saved</span>}
                      {res.skipped != null && <span style={{color:'#64748b'}}> · {res.skipped} skipped</span>}
                      {res.failed != null && res.failed > 0 && <span style={{color:'#f59e0b'}}> · {res.failed} failed</span>}
                      {res.message && <div style={{color:'var(--text-dim)', marginTop:4}}>{res.message}</div>}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Per-content-type rewrite section */}
      <div style={{marginTop:32}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:16, paddingBottom:8, borderBottom:'1px solid var(--border)'}}>
          Per-Content-Type AI Rewrite
        </div>
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12}}>
          {[
            { key:'reviews-ai',     label:'★ Rewrite Reviews',    route:'reviews-manager',    action:'ai-rewrite', desc:'AI rewrites selected review body with pros/cons from the reviews panel.' },
            { key:'releases-ai',    label:'🔫 Rewrite Releases',   route:'releases-manager',   action:'ai-rewrite', desc:'AI rewrites gun release articles. Use the Gun Releases panel to trigger per-item rewrites.' },
            { key:'blog-ai',        label:'📝 Rewrite Blog Posts',  route:'blog-posts',         action:'ai-write',   desc:'AI rewrites blog post body. Trigger per-post via the Blog panel.' },
          ].map(item => (
            <div key={item.key} className="adm-card" style={{padding:'14px 18px'}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4}}>{item.label}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', lineHeight:1.7, marginBottom:10}}>{item.desc}</div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', padding:'6px 8px', background:'rgba(0,0,0,.3)', border:'1px solid var(--border)'}}>
                Available in: <span style={{color:'var(--gold)'}}>Content → {item.label.split(' ').slice(1).join(' ')} panel → 🤖 AI Write button</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function RangesPanel() {
  return (
    <div>
      <div className="panel-title">Range Database</div>
      <div className="panel-sub">Shooting range finder data. Powered by Google Places API. Requires GOOGLE_PLACES_API_KEY.</div>
      <div style={{display:'flex',gap:8,marginBottom:20}}>
        <a href="/ranges" target="_blank" rel="noreferrer" className="btn-outline" style={{textDecoration:'none',fontSize:10}}>View Range Finder ↗</a>
        <a href="/ffl-finder" target="_blank" rel="noreferrer" className="btn-outline" style={{textDecoration:'none',fontSize:10}}>View FFL Finder ↗</a>
      </div>
      <div className="adm-card">
        <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#6b7280',lineHeight:1.9}}>
          Range and FFL data is pulled live from Google Places API on each request. No database storage required. Set <code style={{color:'#C8922A'}}>GOOGLE_PLACES_API_KEY</code> in Vercel. The key is passed server-side only — never exposed to the client.
        </div>
      </div>
    </div>
  )
}

function PublicationSchedule({ secret, setMsg }) {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/schedule', { headers:{'x-admin-key':secret||''} })
      .then(r=>r.json()).then(d=>{ if(d.ok) setSchedules(d.schedules||[]) }).catch(()=>{})
      .finally(()=>setLoading(false))
  }, [secret])

  if (loading) return <PanelLoader />

  return (
    <div>
      <div className="panel-title">Publication Schedule</div>
      <div className="panel-sub">Scheduled posts and content queue.</div>
      {schedules.length === 0 ? (
        <div className="adm-card" style={{textAlign:'center',padding:40,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#4b5563'}}>No scheduled posts.</div>
      ) : (
        <div className="adm-card" style={{padding:0}}><table className="adm-table">
          <thead><tr><th>Title</th><th>Type</th><th>Scheduled</th><th>Status</th></tr></thead>
          <tbody>{schedules.map((s,i)=>(
            <tr key={i}>
              <td style={{fontWeight:700}}>{s.title}</td>
              <td>{s.type}</td>
              <td>{s.scheduledAt?.slice(0,16)}</td>
              <td><span style={{color:'#f59e0b'}}>○ Pending</span></td>
            </tr>
          ))}</tbody>
        </table></div>
      )}
    </div>
  )
}

// ── Main Admin App ────────────────────────────────────────────────────────────
export default function AdminPage() {
  const [adminKey, setAdminKeyState] = useState('')
  const [section,  setSection]  = useState('system')
  const [panel,    setPanel]    = useState('overview')
  const [msg,      setMsg]      = useState('')
  const [msgType,  setMsgType]  = useState('info')
  const [health,   setHealth]   = useState(null)

  // Load admin key from localStorage
  useEffect(() => {
    const k = localStorage.getItem('dr_admin_key') || ''
    setAdminKeyState(k)
    fetch('/api/admin/cron-health').then(r=>r.json()).then(d=>setHealth(d)).catch(()=>{})
  }, [])

  function setAdminKey(v) { setAdminKeyState(v); localStorage.setItem('dr_admin_key', v) }

  function flash(m, type = 'info') {
    setMsg(m); setMsgType(type)
    if (!m.startsWith('⏳')) setTimeout(() => setMsg(''), 6000)
  }

  // When switching section, default to first panel
  function switchSection(id) {
    setSection(id)
    const sec = NAV.find(s=>s.id===id)
    if (sec?.panels?.length) setPanel(sec.panels[0].id)
  }

  const currentSection = NAV.find(s => s.id === section)
  const isDeployed = typeof window !== 'undefined'

  const msgClass = msg.startsWith('✅') ? 'ok' : msg.startsWith('❌') ? 'err' : 'info'

  return (
    <>
      <style>{STYLES}</style>

      {/* ── TOP BAR ── */}
      <div className="adm-topbar">
        <div className="adm-logo">◈ DR Admin</div>
        <a href="https://downrangeco.com" target="_blank" rel="noreferrer" className="adm-site-link">downrangeco.com ↗</a>
        <a href="https://down-range-indol.vercel.app" target="_blank" rel="noreferrer" className="adm-site-link">Vercel ↗</a>
        {health && health.status !== 'ok' && (
          <div className="adm-status-pill" style={{borderColor:'rgba(239,68,68,.4)',color:'#ef4444'}}>
            ⚠ {health.status?.toUpperCase()}
          </div>
        )}
        {msg && <div className={`adm-msg ${msgClass}`}>{msg} {msg && <button onClick={()=>setMsg('')} style={{background:'none',border:'none',color:'inherit',cursor:'pointer',marginLeft:8,fontSize:12}}>✕</button>}</div>}
        <div style={{marginLeft:'auto',display:'flex',gap:8,alignItems:'center'}}>
          <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563'}}>KEY</span>
          <input type="password" value={adminKey} onChange={e=>setAdminKey(e.target.value)}
            placeholder="Admin key..."
            style={{background:'rgba(0,0,0,.4)',border:'1px solid var(--border)',color:'var(--text)',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:'4px 10px',width:160,outline:'none'}} />
        </div>
      </div>

      <div className="adm-shell">

        {/* ── SIDEBAR ── */}
        <div className="adm-sidebar">
          {NAV.map(s => (
            <button key={s.id}
              className={'adm-section-btn' + (section===s.id?' active':'')}
              onClick={() => switchSection(s.id)}>
              <span style={{fontSize:14}}>{s.icon}</span>
              {s.label}
              <span className="adm-count">{s.panels.length}</span>
            </button>
          ))}
          <div style={{flex:1}} />
          <div style={{padding:'12px 16px',borderTop:'1px solid var(--border)',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#374151',lineHeight:1.8}}>
            <div>DownRange v2.0</div>
            <div style={{color:'#1e293b'}}>Build: Next.js 14 + Sanity</div>
          </div>
        </div>

        {/* ── MAIN ── */}
        <div className="adm-main">

          {/* Sub-tabs */}
          {currentSection && (
            <div className="adm-subtabs">
              {currentSection.panels.map(p => (
                <button key={p.id}
                  className={'adm-subtab' + (panel===p.id?' active':'')}
                  onClick={() => setPanel(p.id)}>
                  <span>{p.icon}</span>
                  {p.label}
                  {p.badge && <span className="badge">{p.badge}</span>}
                </button>
              ))}
            </div>
          )}

          {/* Panel content */}
          <div className="adm-panel">

            {/* ── CONTENT ── */}
            {panel==='news'         && <NewsArticleManager  adminKey={adminKey} />}
            {panel==='releases'     && <ReleaseManager      adminKey={adminKey} />}
            {panel==='blog'         && <BlogManagerFull     adminKey={adminKey} setMsg={flash} />}
            {panel==='canada'       && <CanadaManager       adminKey={adminKey} />}
            {panel==='competitions' && <CompetitionManager  adminKey={adminKey} />}
            {panel==='reviews'      && <ReviewManager       adminKey={adminKey} />}

            {/* ── PUBLISHING ── */}
            {panel==='schedule'   && <PublicationSchedule secret={adminKey} setMsg={flash} />}
            {panel==='breaking'   && <BreakingAlertsPanel adminKey={adminKey} />}
            {panel==='newsletter' && <NewsletterManager   adminKey={adminKey} />}
            {panel==='seo'        && <SEOPanel />}

            {/* ── INTELLIGENCE ── */}
            {panel==='intel'   && <IntelligenceDashboard adminKey={adminKey} />}
            {panel==='pulllog' && <PullLogDashboard />}
            {panel==='deals'   && <DealsPanel />}
            {panel==='feeds'   && <FeedsPanel adminKey={adminKey} setMsg={flash} />}

            {/* ── SYSTEM ── */}
            {panel==='overview'  && <OverviewDashboard adminKey={adminKey} setPanel={setPanel} setSection={setSection} />}
            {panel==='crons'     && <CronDashboard adminKey={adminKey} />}
            {panel==='sysalerts' && (
              <div>
                <div className="panel-title">System Alerts</div>
                <div className="panel-sub">Automated alerts sent via Resend when cron jobs fail 3× in a row.</div>
                <div className="adm-card">
                  <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#6b7280',lineHeight:1.9}}>
                    Alert emails go to <code style={{color:'#C8922A'}}>dejcav@gmail.com</code> · Rate-limited to 1 per job per 2 hours · Triggered on 3 consecutive failures. Configure via <code style={{color:'#C8922A'}}>RESEND_API_KEY</code>.
                  </div>
                </div>
              </div>
            )}
            {panel==='rss'     && <RSSSourcesPanel />}
            {panel==='ranges'  && <RangesPanel />}
            {panel==='agents'  && <ContentAgentsPanel adminKey={adminKey} setMsg={flash} />}

            {/* ── OUTREACH ── */}
            {panel==='outreach' && <OutreachPortal adminKey={adminKey} />}

            {/* ── MEDIA ── */}
            {panel==='videos'   && <VideoManager adminKey={adminKey} />}
            {panel==='channels' && <ChannelsPanel />}
            {panel==='imglib'   && <ImageRepository adminKey={adminKey} />}

            {/* ── SETTINGS ── */}
            {panel==='ai'       && <AIProviderSettings adminKey={adminKey} />}
            {panel==='costs'    && <AICostDashboard    adminKey={adminKey} />}
            {panel==='keys'     && <APIKeysPanel       adminKey={adminKey} />}
            {panel==='identity' && <IdentityPanel      adminKey={adminKey} />}
            {panel==='envcheck' && <EnvChecker         adminKey={adminKey} />}

          </div>
        </div>
      </div>
    </>
  )
}
