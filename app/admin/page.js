'use client'
import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import dynamic from 'next/dynamic'

// ── Lazy-loaded panel components ────────────────────────────────────────────
const L = (fn) => dynamic(fn, { ssr:false, loading: () => <PanelLoader /> })

const PullLogDashboard      = L(() => import('./pull-log/page'))
const OutreachCRM           = L(() => import('../../components/admin/OutreachCRM'))
const DraftRecovery         = L(() => import('../../components/admin/DraftRecovery'))
const IntelligenceDashboard = L(() => import('../../components/admin/IntelligenceDashboard'))
const CopyrightReport      = L(() => import('../../components/admin/CopyrightReport'))
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
const SiteMapPanel          = L(() => import('../../components/admin/SiteMapPanel'))
const MarketBriefManager    = L(() => import('../../components/admin/MarketBriefManager'))

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
      { id:'hub',          label:'Content Hub',      icon:'◈',  badge:null },
      { id:'drafts',       label:'Draft Recovery',   icon:'🔍', badge:null },
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
      { id:'statelaws',    label:'State Laws',       icon:'🗺', badge:null },
      { id:'pulllog',      label:'Pull Log',         icon:'📡', badge:null },
      { id:'deals',        label:'Deals Feed',       icon:'🔥', badge:null },
      { id:'feeds',        label:'Feed Agent',       icon:'⚡', badge:null },
      { id:'marketbrief',  label:'Market Brief',     icon:'📊', badge:'live' },
      { id:'copyright',  label:'Copyright',       icon:'⚖',  badge:null },
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
      { id:'sitemap',      label:'Site Map',          icon:'🗺️', badge:null },
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
      { id:'navvis',       label:'Nav Visibility',   icon:'👁', badge:null },
      { id:'emails',       label:'Email Tests',       icon:'✉', badge:null },
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
  const [health, setHealth
    ]         = useState(null)
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

// ── Inline: Email Test Panel ─────────────────────────────────────────────────
const DEFAULT_MAILBOXES = [
  { from: 'noreply@downrangeco.com',       desc: 'Contact form submissions' },
  { from: 'feedback@downrangeco.com',      desc: 'Feedback modal' },
  { from: 'news@downrangeco.com',          desc: 'Newsletter sends + welcome emails' },
  { from: 'intelligence@downrangeco.com',  desc: 'Daily intelligence briefing digest' },
  { from: 'dj@downrangeco.com',            desc: 'Direct outreach sends + reply-to' },
  { from: 'outreach@downrangeco.com',      desc: 'Outreach queue digest summary' },
]

function EmailTestPanel({ adminKey }) {
  const [mailboxes, setMailboxes] = useState(DEFAULT_MAILBOXES)
  const [results, setResults]     = useState(null)
  const [busy, setBusy]           = useState(false)
  const [msg, setMsg]             = useState('')
  const [newFrom, setNewFrom]     = useState('')
  const [newDesc, setNewDesc]     = useState('')
  const [addErr, setAddErr]       = useState('')

  function addMailbox() {
    setAddErr('')
    const from = newFrom.trim().toLowerCase()
    if (!from || !from.includes('@')) { setAddErr('Enter a valid email address.'); return }
    if (mailboxes.some(m => m.from === from)) { setAddErr('Already in the list.'); return }
    setMailboxes(prev => [...prev, { from, desc: newDesc.trim() || 'Custom' }])
    setNewFrom('')
    setNewDesc('')
  }

  function removeMailbox(from) {
    setMailboxes(prev => prev.filter(m => m.from !== from))
    setResults(prev => prev ? prev.filter(r => r.mailbox !== from) : null)
  }

  function resetToDefaults() {
    setMailboxes(DEFAULT_MAILBOXES)
    setResults(null)
    setMsg('')
  }

  async function sendTests() {
    if (!mailboxes.length) { setMsg('❌ No mailboxes to test.'); return }
    setBusy(true)
    setMsg('Sending test emails...')
    setResults(null)
    try {
      const r = await fetch('/api/admin/test-emails', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mailboxes: mailboxes.map(m => m.from) }),
      })
      const d = await r.json()
      setResults(d.results || [])
      setMsg(d.ok ? `✅ ${d.sent}/${d.total} sent — check your inbox` : `❌ ${d.error}`)
    } catch(e) {
      setMsg(`❌ ${e.message}`)
    }
    setBusy(false)
  }

  const iS = { fontFamily:"'IBM Plex Mono',monospace", fontSize:11, background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', padding:'6px 10px', outline:'none' }

  return (
    <div>
      <div className="panel-title">Email Mailbox Tests</div>
      <div className="panel-sub">Send a test from each from-address to verify Resend + Zoho SPF/DKIM. Add or remove addresses as needed.</div>

      {/* Mailbox list */}
      <div className="adm-card" style={{marginBottom:16}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
          <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--gold)',letterSpacing:'.04em'}}>MAILBOXES ({mailboxes.length})</span>
          <button onClick={resetToDefaults} style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,background:'none',border:'1px solid var(--border)',color:'#6b7280',padding:'3px 8px',cursor:'pointer'}}>Reset to defaults</button>
        </div>
        {mailboxes.length === 0 && (
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#4b5563',padding:'12px 0'}}>No mailboxes. Add one below or reset to defaults.</div>
        )}
        {mailboxes.map(m => (
          <div key={m.from} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 0',borderBottom:'1px solid var(--border)'}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#C8922A',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.from}</span>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#6b7280',flex:1,minWidth:0,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.desc}</span>
            <button onClick={()=>removeMailbox(m.from)} style={{flexShrink:0,background:'none',border:'none',color:'#ef4444',cursor:'pointer',fontFamily:"'IBM Plex Mono',monospace",fontSize:12,padding:'0 4px',lineHeight:1}} title="Remove">×</button>
          </div>
        ))}
      </div>

      {/* Add mailbox */}
      <div className="adm-card" style={{marginBottom:16}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--gold)',letterSpacing:'.04em',marginBottom:10}}>ADD MAILBOX</div>
        <div style={{display:'flex',gap:8,flexWrap:'wrap',alignItems:'flex-start'}}>
          <input value={newFrom} onChange={e=>{setNewFrom(e.target.value);setAddErr('')}}
            onKeyDown={e=>e.key==='Enter'&&addMailbox()}
            placeholder="from@downrangeco.com" style={{...iS,flex:'2 1 180px'}} />
          <input value={newDesc} onChange={e=>setNewDesc(e.target.value)}
            onKeyDown={e=>e.key==='Enter'&&addMailbox()}
            placeholder="Description (optional)" style={{...iS,flex:'3 1 200px'}} />
          <button onClick={addMailbox} style={{flexShrink:0,background:'var(--gold)',color:'#000',border:'none',fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,letterSpacing:'.06em',padding:'6px 16px',cursor:'pointer'}}>+ Add</button>
        </div>
        {addErr && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#ef4444',marginTop:6}}>{addErr}</div>}
      </div>

      {/* Send button */}
      <button onClick={sendTests} disabled={busy || !adminKey || !mailboxes.length}
        style={{background:'var(--gold)',color:'#000',border:'none',fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,letterSpacing:'.06em',padding:'10px 24px',cursor:(busy||!mailboxes.length)?'not-allowed':'pointer',opacity:(busy||!mailboxes.length)?0.6:1,marginBottom:16}}>
        {busy ? '⏳ Sending...' : `✉ Send Test to ${mailboxes.length} Mailbox${mailboxes.length!==1?'es':''}`}
      </button>

      {msg && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,padding:'8px 12px',background:msg.startsWith('✅')?'rgba(34,197,94,.1)':'rgba(239,68,68,.1)',color:msg.startsWith('✅')?'#22c55e':'#ef4444',marginBottom:16}}>{msg}</div>}

      {/* Results */}
      {results && results.length > 0 && (
        <div className="adm-card">
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--gold)',letterSpacing:'.04em',marginBottom:8}}>RESULTS</div>
          {results.map((r,i) => (
            <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 0',borderBottom:'1px solid var(--border)',fontFamily:"'IBM Plex Mono',monospace",fontSize:10}}>
              <span style={{color:r.status==='sent'?'#22c55e':'#ef4444',flexShrink:0}}>{r.status==='sent'?'✓':'✗'}</span>
              <span style={{flex:1,color:'#e5e7eb',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{r.mailbox}</span>
              <span style={{color:r.status==='sent'?'#22c55e':'#ef4444',flexShrink:0}}>{r.status==='sent'?r.id?.slice(0,16)+'...':r.error?.slice(0,40)}</span>
            </div>
          ))}
        </div>
      )}
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
  const [scanData,    setScanData]    = useState(null)
  const [scanning,    setScanning]    = useState(false)
  const [rewriting,   setRewriting]   = useState(false)
  const [rewriteLog,  setRewriteLog]  = useState([])
  const [progress,    setProgress]    = useState(null)   // {done,total,current}
  const [activeTab,   setActiveTab]   = useState('scanner') // scanner | tools
  const [filterType,  setFilterType]  = useState('all')
  const [showPassing, setShowPassing] = useState(false)
  const abortRef = React.useRef(false)

  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  const TYPE_COLOR = {
    newsArticle:    '#3b82f6',
    blogPost:       '#22c55e',
    firearmRelease: '#C8922A',
    canadaContent:  '#ef4444',
  }
  const TYPE_ICON = { newsArticle:'📰', blogPost:'📝', firearmRelease:'🔫', canadaContent:'🍁' }

  async function runScan() {
    setScanning(true); setScanData(null); setRewriteLog([])
    setMsg('⏳ Scanning all content...')
    try {
      const res = await fetch('/api/admin/content-scan', { headers: H })
      const d = await res.json()
      if (!d.ok) { setMsg('❌ Scan failed'); return }
      setScanData(d)
      setMsg(`✅ Scanned ${d.total} items — ${d.needsRewrite} need rewriting`)
    } catch(e) { setMsg('❌ ' + e.message) }
    setScanning(false)
  }

  async function rewriteAll() {
    if (!scanData) return
    const queue = scanData.items.filter(i => i.needsRewrite)
    if (!queue.length) { setMsg('✅ Nothing to rewrite'); return }

    abortRef.current = false
    setRewriting(true)
    setRewriteLog([])
    setProgress({ done: 0, total: queue.length, current: null })
    setMsg(`⏳ Rewriting ${queue.length} items...`)

    // Process in batches of 5 per API call
    const BATCH = 5
    let done = 0
    const typeGroups = {}
    for (const item of queue) {
      if (!typeGroups[item.type]) typeGroups[item.type] = []
      typeGroups[item.type].push(item._id)
    }

    for (const [type, ids] of Object.entries(typeGroups)) {
      if (abortRef.current) break
      for (let i = 0; i < ids.length; i += BATCH) {
        if (abortRef.current) break
        const batch = ids.slice(i, i + BATCH)
        const currentItem = queue.find(q => q._id === batch[0])
        setProgress(p => ({ ...p, current: currentItem?.title || '...' }))

        try {
          const res = await fetch(`/api/admin/backfill-articles?limit=${BATCH}&force=true&types=${type}`, {
            method: 'POST', headers: H
          })
          const d = await res.json()
          done += d.done || 0
          setProgress(p => ({ ...p, done }))
          if (d.results) {
            setRewriteLog(log => [...log, ...d.results.map(r => ({
              ...r, typeColor: TYPE_COLOR[type], typeIcon: TYPE_ICON[type]
            }))])
          }
          // Update scan data to mark rewrites
          setScanData(prev => {
            if (!prev) return prev
            const updatedItems = prev.items.map(item =>
              batch.includes(item._id) && d.results?.find(r => r.id === item._id && r.status === 'done')
                ? { ...item, needsRewrite: false, qualityReviewed: true, score: 95 }
                : item
            )
            return { ...prev, items: updatedItems, needsRewrite: updatedItems.filter(i => i.needsRewrite).length }
          })
        } catch(e) {
          setRewriteLog(log => [...log, { title: `Batch failed (${type})`, status: 'failed', error: e.message }])
        }
      }
    }

    setRewriting(false)
    setProgress(null)
    setMsg(`✅ Rewrite complete — ${done} items updated`)
  }

  async function markReviewed(id, reviewed = true) {
    await fetch('/api/admin/content-scan', {
      method: 'PATCH', headers: H,
      body: JSON.stringify({ id, reviewed })
    })
    setScanData(prev => {
      if (!prev) return prev
      const items = prev.items.map(i => i._id === id ? { ...i, qualityReviewed: reviewed, needsRewrite: reviewed ? false : i.score < 70 } : i)
      return { ...prev, items, reviewed: items.filter(i => i.qualityReviewed).length, needsRewrite: items.filter(i => i.needsRewrite).length }
    })
  }

  const scoreColor = (s) => s >= 80 ? '#22c55e' : s >= 60 ? '#f59e0b' : '#ef4444'
  const displayItems = scanData?.items.filter(i => {
    if (i.qualityReviewed && !showPassing) return false
    if (!showPassing && i.score >= 70 && !i.needsRewrite) return false
    if (filterType !== 'all' && i.type !== filterType) return false
    return true
  }) || []

  // ── OTHER AGENTS (non-scanner) ──────────────────────────────────────────
  const [agentRunning, setAgentRunning] = useState({})
  const [agentResults, setAgentResults] = useState({})

  async function runAgent(key, path, params='') {
    setAgentRunning(r => ({...r, [key]: true}))
    setAgentResults(r => ({...r, [key]: null}))
    try {
      const res = await fetch('/api/admin/' + path + params, { method:'POST', headers:H })
      const d = await res.json()
      setAgentResults(r => ({...r, [key]: d}))
      setMsg(d.ok !== false ? '✅ Done' : '❌ ' + (d.error||'Error'))
    } catch(e) {
      setAgentResults(r => ({...r, [key]: { ok:false, error:e.message }}))
    }
    setAgentRunning(r => ({...r, [key]: false}))
  }

  return (
    <div>
      <div className="panel-title">🤖 Content Agents</div>

      {/* Tab bar */}
      <div style={{display:'flex', gap:4, marginBottom:24, borderBottom:'1px solid var(--border)', paddingBottom:0}}>
        {[['scanner','🎯 Quality Scanner'],['tools','🛠 Other Tools']].map(([id,label])=>(
          <button key={id} onClick={()=>setActiveTab(id)} style={{
            fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700,
            letterSpacing:'.05em', padding:'8px 18px',
            background:'transparent', border:'none', cursor:'pointer',
            color: activeTab===id ? 'var(--gold)' : '#6b7280',
            borderBottom: activeTab===id ? '2px solid var(--gold)' : '2px solid transparent',
            marginBottom:-1,
          }}>{label}</button>
        ))}
      </div>

      {/* ── SCANNER TAB ── */}
      {activeTab === 'scanner' && (
        <div>
          {/* Hero action */}
          <div style={{
            background:'linear-gradient(135deg, rgba(200,146,42,.08) 0%, rgba(200,146,42,.03) 100%)',
            border:'1px solid rgba(200,146,42,.25)',
            padding:'28px 32px', marginBottom:24,
            display:'flex', alignItems:'center', gap:32, flexWrap:'wrap',
          }}>
            <div style={{flex:1, minWidth:260}}>
              <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--gold)', letterSpacing:'.06em', lineHeight:1, marginBottom:8}}>
                Content Quality Scanner
              </div>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.8}}>
                Scans every news article, blog post, gun release, and Canada article.<br/>
                Flags AI phrases, short bodies, weak structure. Rewrites everything that fails.<br/>
                Items marked ✓ Reviewed are skipped on future runs.
              </div>
            </div>
            <div style={{display:'flex', gap:10, flexWrap:'wrap', alignItems:'center'}}>
              {!scanData && (
                <button onClick={runScan} disabled={scanning} style={{
                  fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', letterSpacing:'.08em',
                  padding:'12px 28px', background:'var(--gold)', color:'#000',
                  border:'none', cursor:'pointer', opacity: scanning ? 0.6 : 1,
                }}>
                  {scanning ? '⏳ SCANNING...' : '🔍 SCAN ALL CONTENT'}
                </button>
              )}
              {scanData && !rewriting && (
                <>
                  <button onClick={runScan} disabled={scanning} style={{
                    fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700,
                    padding:'8px 16px', background:'transparent',
                    border:'1px solid var(--border)', color:'var(--text-dim)', cursor:'pointer',
                  }}>↺ Rescan</button>
                  <button onClick={rewriteAll} disabled={!scanData?.needsRewrite} style={{
                    fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', letterSpacing:'.08em',
                    padding:'12px 28px', background: scanData?.needsRewrite ? '#ef4444' : '#374151',
                    color:'#fff', border:'none', cursor: scanData?.needsRewrite ? 'pointer' : 'default',
                  }}>
                    ✍ REWRITE {scanData?.needsRewrite || 0} FAILING
                  </button>
                </>
              )}
              {rewriting && (
                <button onClick={()=>{ abortRef.current=true }} style={{
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700,
                  padding:'8px 16px', background:'rgba(239,68,68,.15)',
                  border:'1px solid rgba(239,68,68,.4)', color:'#f87171', cursor:'pointer',
                }}>⏹ Stop</button>
              )}
            </div>
          </div>

          {/* Progress bar */}
          {rewriting && progress && (
            <div style={{marginBottom:20}}>
              <div style={{
                fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--gold)',
                marginBottom:8, display:'flex', justifyContent:'space-between',
              }}>
                <span>⏳ Rewriting... {progress.done}/{progress.total}</span>
                <span style={{color:'#6b7280', overflow:'hidden', textOverflow:'ellipsis', maxWidth:400}}>
                  {progress.current}
                </span>
              </div>
              <div style={{height:6, background:'#1f2937', overflow:'hidden'}}>
                <div style={{
                  height:'100%', background:'var(--gold)',
                  width: `${Math.round((progress.done/progress.total)*100)}%`,
                  transition:'width .3s ease',
                }}/>
              </div>
            </div>
          )}

          {/* Stats row */}
          {scanData && (
            <div style={{display:'flex', gap:12, marginBottom:20, flexWrap:'wrap'}}>
              {[
                { label:'Total Scanned', value:scanData.total, color:'var(--text)' },
                { label:'Need Rewrite', value:scanData.needsRewrite, color:'#ef4444' },
                { label:'Passing', value:scanData.passing, color:'#22c55e' },
                { label:'Reviewed ✓', value:scanData.reviewed, color:'#C8922A' },
              ].map(s=>(
                <div key={s.label} style={{
                  flex:1, minWidth:120,
                  background:'var(--bg2)', border:'1px solid var(--border)',
                  padding:'12px 16px', textAlign:'center',
                }}>
                  <div style={{fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:s.color, lineHeight:1}}>{s.value}</div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', marginTop:4, letterSpacing:'.06em', textTransform:'uppercase'}}>{s.label}</div>
                </div>
              ))}
              {/* Per-type breakdown */}
              {Object.entries(scanData.summary).map(([type, s])=>(
                <div key={type} style={{
                  flex:1, minWidth:140,
                  background:'var(--bg2)', border:`1px solid ${TYPE_COLOR[type]}44`,
                  padding:'10px 14px',
                }}>
                  <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:TYPE_COLOR[type], marginBottom:6}}>
                    {TYPE_ICON[type]} {s.label}
                  </div>
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.9}}>
                    {s.total} total · <span style={{color:'#ef4444'}}>{s.needsRewrite} failing</span> · <span style={{color:'#22c55e'}}>{s.passing} ok</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Filter bar */}
          {scanData && (
            <div style={{display:'flex', gap:8, marginBottom:16, alignItems:'center', flexWrap:'wrap'}}>
              <span style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280'}}>Filter:</span>
              {['all','newsArticle','blogPost','firearmRelease','canadaContent'].map(t=>(
                <button key={t} onClick={()=>setFilterType(t)} style={{
                  fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'3px 10px',
                  background: filterType===t ? (TYPE_COLOR[t]||'var(--gold)') : 'transparent',
                  color: filterType===t ? '#000' : '#6b7280',
                  border:`1px solid ${filterType===t ? (TYPE_COLOR[t]||'var(--gold)') : 'var(--border)'}`,
                  cursor:'pointer',
                }}>
                  {t==='all' ? `All (${scanData.needsRewrite})` : `${TYPE_ICON[t]} ${t==='newsArticle'?'News':t==='blogPost'?'Blog':t==='firearmRelease'?'Releases':'Canada'}`}
                </button>
              ))}
              <label style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', display:'flex', alignItems:'center', gap:6, marginLeft:'auto', cursor:'pointer'}}>
                <input type="checkbox" checked={showPassing} onChange={e=>setShowPassing(e.target.checked)} />
                Show passing items
              </label>
            </div>
          )}

          {/* Item list */}
          {scanData && displayItems.length > 0 && (
            <div style={{display:'flex', flexDirection:'column', gap:4, maxHeight:520, overflowY:'auto'}}>
              {displayItems.map(item => (
                <div key={item._id} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                  background: item.qualityReviewed ? 'rgba(34,197,94,.04)' : item.score < 40 ? 'rgba(239,68,68,.06)' : 'var(--bg2)',
                  border:`1px solid ${item.qualityReviewed ? 'rgba(34,197,94,.2)' : item.score < 40 ? 'rgba(239,68,68,.2)' : 'var(--border)'}`,
                }}>
                  {/* Score ring */}
                  <div style={{
                    width:36, height:36, flexShrink:0,
                    borderRadius:'50%', border:`2.5px solid ${scoreColor(item.score)}`,
                    display:'flex', alignItems:'center', justifyContent:'center',
                    fontFamily:"'Bebas Neue',cursive", fontSize:14, color:scoreColor(item.score),
                  }}>{item.score}</div>

                  {/* Type badge */}
                  <div style={{
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700,
                    padding:'2px 6px', background:`${TYPE_COLOR[item.type]}22`,
                    color:TYPE_COLOR[item.type], flexShrink:0,
                    border:`1px solid ${TYPE_COLOR[item.type]}44`,
                  }}>{TYPE_ICON[item.type]}</div>

                  {/* Title + issues */}
                  <div style={{flex:1, minWidth:0}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                      {item.title}
                    </div>
                    {item.issues?.length > 0 && (
                      <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#f59e0b', marginTop:2}}>
                        {item.issues.join(' · ')}
                      </div>
                    )}
                  </div>

                  {/* Word count */}
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', flexShrink:0}}>
                    {item.words}w
                  </div>

                  {/* Reviewed badge / button */}
                  {item.qualityReviewed ? (
                    <button onClick={()=>markReviewed(item._id, false)} title="Click to unmark" style={{
                      fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'3px 8px',
                      background:'rgba(34,197,94,.15)', border:'1px solid rgba(34,197,94,.3)',
                      color:'#4ade80', cursor:'pointer', flexShrink:0,
                    }}>✓ REVIEWED</button>
                  ) : (
                    <button onClick={()=>markReviewed(item._id, true)} title="Mark as reviewed — skip on future scans" style={{
                      fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'3px 8px',
                      background:'transparent', border:'1px solid var(--border)',
                      color:'#6b7280', cursor:'pointer', flexShrink:0,
                    }}>Skip</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {scanData && displayItems.length === 0 && (
            <div style={{padding:40, textAlign:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#22c55e'}}>
              ✅ All scanned content is passing quality standards.
            </div>
          )}

          {/* Rewrite log */}
          {rewriteLog.length > 0 && (
            <div style={{marginTop:20}}>
              <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'var(--text-dim)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:8}}>
                Rewrite Log ({rewriteLog.length})
              </div>
              <div style={{maxHeight:200, overflowY:'auto', display:'flex', flexDirection:'column', gap:3}}>
                {rewriteLog.map((r,i)=>(
                  <div key={i} style={{
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'5px 10px',
                    background: r.status==='done' ? 'rgba(34,197,94,.06)' : 'rgba(239,68,68,.06)',
                    color: r.status==='done' ? '#4ade80' : '#f87171',
                    display:'flex', gap:12, alignItems:'center',
                  }}>
                    <span>{r.status==='done' ? '✓' : '✗'}</span>
                    <span style={{color: r.typeColor || 'var(--text-dim)'}}>{r.typeIcon}</span>
                    <span style={{flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{r.title}</span>
                    {r.words && <span style={{color:'#4b5563'}}>{r.words}w</span>}
                    {r.error && <span style={{color:'#f59e0b', fontSize:9}}>{r.error.slice(0,50)}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TOOLS TAB ── */}
      {activeTab === 'tools' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(320px,1fr))', gap:16}}>
          {[
            { key:'fix-images',          label:'🖼 Fix Article Images',        color:'#3b82f6',  path:'fix-images',           actions:[{label:'Fix Missing (50)',params:'?batch=50&force=false'},{label:'Force All (50)',params:'?batch=50&force=true'}] },
            { key:'write-blog-articles', label:'📝 Generate Blog Posts',        color:'#22c55e',  path:'write-blog-articles',  actions:[{label:'Write 3 Posts',params:''}] },
            { key:'write-canada-articles',label:'🍁 Write Canada Articles',     color:'#ef4444',  path:'write-canada-articles',actions:[{label:'Write Articles',params:''}] },
            { key:'fetch-article-images',label:'📷 Fetch OG Images',            color:'#a855f7',  path:'fetch-article-images', actions:[{label:'Fetch Now (30)',params:'?limit=30'}] },
            { key:'patch-article',       label:'🔧 Patch SVG Fallbacks',        color:'#f59e0b',  path:'patch-article',        actions:[{label:'Patch All',params:''}] },
            { key:'seed-image-repo',     label:'🗃 Seed Image Repository',      color:'#64748b',  path:'seed-image-repo',      actions:[{label:'Seed Images',params:''}] },
            { key:'seed-all-content',    label:'🌱 Seed All Content Panels',    color:'#22c55e',  path:'seed-all-content',     actions:[
              {label:'Seed Everything (blog+reviews+canada+competitions+releases)', params:''},
              {label:'Blog only', params:'?types=blog'},
              {label:'Reviews only', params:'?types=reviews'},
              {label:'Canada only', params:'?types=canada'},
              {label:'Competitions only', params:'?types=competitions'},
              {label:'Gun Releases only', params:'?types=releases'},
            ]},
          ].map(agent => {
            const res  = agentResults[agent.key]
            const busy = agentRunning[agent.key]
            return (
              <div key={agent.key} className="adm-card" style={{borderLeft:`3px solid ${agent.color}`, display:'flex', flexDirection:'column', gap:10}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'var(--text)'}}>{agent.label}</div>
                <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
                  {agent.actions.map(a=>(
                    <button key={a.label} disabled={busy} onClick={()=>runAgent(agent.key, agent.path, a.params)} style={{
                      fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'.04em',
                      padding:'6px 14px', background: busy ? '#374151' : agent.color, color:busy?'#6b7280':'#000',
                      border:'none', cursor: busy?'default':'pointer', opacity: busy?0.6:1,
                    }}>{busy ? '⏳ Running...' : a.label}</button>
                  ))}
                </div>
                {res && (
                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: res.ok===false ? '#f87171':'#4ade80', padding:'6px 10px', background:'rgba(0,0,0,.3)', border:'1px solid var(--border)'}}>
                    {res.ok===false ? '✗ '+(res.error||'Error') : '✓ '+(res.message||'Complete')+(res.done!=null?' · '+res.done+' done':'')+(res.patched!=null?' · '+res.patched+' patched':'')+(res.seeded!=null?' · '+res.seeded+' seeded':'')}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
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
function NavVisibilityPanel({ adminKey, setMsg }) {
  // Labels must exactly match the label property in components/layout/Masthead.js NAV array
  const NAV_ITEMS = [
    { label:'Home',                   desc:'Homepage link',            always:true },
    { label:'News',                   desc:'News feed & articles' },
    { label:'Laws',                   desc:'Federal & state gun laws' },
    { label:'Reviews',                desc:'Gear & gun reviews' },
    { label:'Guns',                   desc:'Encyclopedia, releases, compare' },
    { label:'Market',                 desc:'Deals, ammo guide, ranges' },
    { label:'Outdoors',               desc:'Hunting, competitions, training' },
    { label:'Learn',                  desc:'Guides & education' },
    { label:'🇨🇦 International', desc:'Canada / international firearms law' },
    { label:'Blog',                   desc:'Blog posts & editorial' },
    { label:'Video',                  desc:'Video content & channels' },
  ]

  const [hidden, setHidden] = useState(() => {
    try { return JSON.parse(localStorage.getItem('dr_hidden_nav') || '[]') } catch { return [] }
  })
  const [saved, setSaved] = useState(false)

  function toggle(label) {
    setHidden(prev => prev.includes(label) ? prev.filter(l => l !== label) : [...prev, label])
    setSaved(false)
  }

  function save() {
    localStorage.setItem('dr_hidden_nav', JSON.stringify(hidden))
    window.dispatchEvent(new Event('dr_nav_updated'))
    setSaved(true)
    setMsg('✅ Nav visibility saved — changes apply site-wide instantly')
    setTimeout(() => setSaved(false), 3000)
  }

  function reset() {
    setHidden([])
    localStorage.setItem('dr_hidden_nav', '[]')
    window.dispatchEvent(new Event('dr_nav_updated'))
    setMsg('✅ All nav items restored')
    setSaved(true)
  }

  const visible = NAV_ITEMS.filter(i => !hidden.includes(i.label))
  const hiddenItems = NAV_ITEMS.filter(i => hidden.includes(i.label))

  return (
    <div>
      <div className="panel-title">👁 Nav Visibility</div>
      <div className="panel-sub">Show or hide top navigation tabs. Changes apply immediately without a deploy. Home is always visible.</div>

      <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:24, marginTop:20}}>
        {/* Left: toggle list */}
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'var(--text-dim)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:12}}>
            All Navigation Items
          </div>
          <div style={{display:'flex', flexDirection:'column', gap:8}}>
            {NAV_ITEMS.map(item => {
              const isHidden = hidden.includes(item.label)
              const isAlways = item.always
              return (
                <div key={item.label} style={{
                  display:'flex', alignItems:'center', gap:12, padding:'10px 14px',
                  background: isHidden ? 'rgba(239,68,68,.06)' : 'rgba(34,197,94,.06)',
                  border:`1px solid ${isHidden ? 'rgba(239,68,68,.2)' : 'rgba(34,197,94,.2)'}`,
                  opacity: isAlways ? 0.5 : 1,
                }}>
                  {/* Toggle switch */}
                  <div
                    onClick={() => !isAlways && toggle(item.label)}
                    style={{
                      width:40, height:22, borderRadius:11, flexShrink:0,
                      background: isHidden ? '#374151' : '#16a34a',
                      position:'relative', cursor: isAlways ? 'default' : 'pointer',
                      transition:'background .2s',
                    }}>
                    <div style={{
                      position:'absolute', top:3,
                      left: isHidden ? 3 : 21,
                      width:16, height:16, borderRadius:'50%',
                      background:'#fff', transition:'left .2s',
                    }}/>
                  </div>

                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color: isHidden ? '#6b7280' : 'var(--text)'}}>
                      {item.label} {isAlways && <span style={{fontSize:10, color:'#4b5563'}}>(always on)</span>}
                    </div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563'}}>{item.desc}</div>
                  </div>

                  <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: isHidden ? '#ef4444' : '#22c55e', flexShrink:0}}>
                    {isHidden ? 'HIDDEN' : 'VISIBLE'}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right: live preview */}
        <div>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'var(--text-dim)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:12}}>
            Nav Preview
          </div>
          <div style={{background:'var(--bg2)', border:'1px solid var(--border)', padding:'12px 0', marginBottom:20}}>
            <div style={{display:'flex', gap:0, overflowX:'auto', padding:'0 8px'}}>
              {visible.map(item => (
                <div key={item.label} style={{
                  fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700,
                  letterSpacing:'.08em', textTransform:'uppercase', padding:'8px 12px',
                  color:'var(--text)', borderBottom:'2px solid transparent', whiteSpace:'nowrap',
                }}>{item.label}</div>
              ))}
            </div>
          </div>

          {hiddenItems.length > 0 && (
            <div style={{marginBottom:20}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#ef4444', marginBottom:8}}>
                {hiddenItems.length} item{hiddenItems.length > 1 ? 's' : ''} hidden from nav:
              </div>
              <div style={{display:'flex', gap:6, flexWrap:'wrap'}}>
                {hiddenItems.map(item => (
                  <div key={item.label} style={{
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'3px 8px',
                    background:'rgba(239,68,68,.1)', border:'1px solid rgba(239,68,68,.3)',
                    color:'#f87171',
                  }}>{item.label}</div>
                ))}
              </div>
            </div>
          )}

          <div style={{display:'flex', gap:10}}>
            <button onClick={save} style={{
              fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', letterSpacing:'.08em',
              padding:'10px 24px', background: saved ? '#16a34a' : 'var(--gold)', color:'#000',
              border:'none', cursor:'pointer', flex:1,
            }}>{saved ? '✓ SAVED' : 'SAVE CHANGES'}</button>
            <button onClick={reset} style={{
              fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700,
              padding:'10px 16px', background:'transparent',
              border:'1px solid var(--border)', color:'var(--text-dim)', cursor:'pointer',
            }}>Reset All</button>
          </div>

          <div style={{fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', marginTop:12, lineHeight:1.8}}>
            Changes are stored in the browser and applied instantly via localStorage. No deploy needed. All visitors on this device see the updated nav.
          </div>
        </div>
      </div>
    </div>
  )
}

function ContentHub({ adminKey, setPanel, setSection }) {
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  // Live counts per section
  const [counts,   setCounts]   = useState(null)
  const [seeding,  setSeeding]  = useState({})
  const [results,  setResults]  = useState({})
  const [aiRunning,setAiRunning]= useState({})
  const [aiResults,setAiResults]= useState({})
  const [locking,  setLocking]  = useState({})
  const [lockRes,  setLockRes]  = useState({})

  async function lockAll(type, lock = true) {
    setLocking(l => ({...l, [type]: lock ? 'locking' : 'unlocking'}))
    setLockRes(r => ({...r, [type]: null}))
    try {
      const res = await fetch('/api/admin/lock-all', {
        method: 'POST', headers: H,
        body: JSON.stringify({ type, lock })
      })
      const d = await res.json()
      setLockRes(r => ({...r, [type]: d}))
    } catch(e) {
      setLockRes(r => ({...r, [type]: { ok: false, error: e.message }}))
    }
    setLocking(l => ({...l, [type]: false}))
  }

  useEffect(() => {
    fetchCounts()
  }, [])

  async function fetchCounts() {
    try {
      const res = await fetch('/api/admin/content-scan', { headers: H })
      const d   = await res.json()
      if (d.ok) setCounts(d.summary)
    } catch {}
  }

  async function seed(type) {
    setSeeding(s => ({...s, [type]: true}))
    setResults(r => ({...r, [type]: null}))
    try {
      const res = await fetch('/api/admin/seed-all-content', {
        method: 'POST', headers: H,
        body: JSON.stringify({ types: type })
      })
      const d = await res.json()
      setResults(r => ({...r, [type]: d}))
      await fetchCounts()
    } catch (e) {
      setResults(r => ({...r, [type]: { ok: false, message: e.message }}))
    }
    setSeeding(s => ({...s, [type]: false}))
  }

  async function seedAll() {
    setSeeding(s => ({...s, all: true}))
    setResults(r => ({...r, all: null}))
    try {
      const res = await fetch('/api/admin/seed-all-content', {
        method: 'POST', headers: H, body: JSON.stringify({})
      })
      const d = await res.json()
      setResults(r => ({...r, all: d}))
      await fetchCounts()
    } catch (e) {
      setResults(r => ({...r, all: { ok: false, message: e.message }}))
    }
    setSeeding(s => ({...s, all: false}))
  }

  async function runAI(key, path, params = '') {
    setAiRunning(a => ({...a, [key]: true}))
    setAiResults(a => ({...a, [key]: null}))
    try {
      const res = await fetch(`/api/admin/${path}${params}`, { method: 'POST', headers: H })
      const d   = await res.json()
      setAiResults(a => ({...a, [key]: d}))
      await fetchCounts()
    } catch (e) {
      setAiResults(a => ({...a, [key]: { ok: false, error: e.message }}))
    }
    setAiRunning(a => ({...a, [key]: false}))
  }

  const SECTIONS = [
    {
      key:      'newsArticle',
      id:       'news',
      label:    'News Articles',
      icon:     '📰',
      color:    '#3b82f6',
      desc:     'Live RSS feed · AI rewritten · Updates every 15 min',
      seedType: null,   // fed by cron, not seeded
      aiAction: { label: 'Backfill Missing', path: 'backfill-articles', params: '?limit=10&types=newsArticle' },
      liveIndicator: true,
    },
    {
      key:      'firearmRelease',
      id:       'releases',
      label:    'Gun Releases',
      icon:     '🔫',
      color:    '#C8922A',
      desc:     'New product announcements · Manufacturer RSS',
      seedType: 'releases',
      aiAction: { label: 'AI Write Articles', path: 'backfill-articles', params: '?limit=5&types=firearmRelease' },
      seedAction: { label: 'Seed Releases', path: 'seed-releases' },
    },
    {
      key:      'blogPost',
      id:       'blog',
      label:    'Blog Posts',
      icon:     '✍',
      color:    '#22c55e',
      desc:     'Opinion · Analysis · Guides · First-person DJ voice',
      seedType: 'blog',
      aiAction: { label: 'Generate Posts', path: 'write-blog-articles' },
    },
    {
      key:      'review',
      id:       'reviews',
      label:    'Reviews',
      icon:     '★',
      color:    '#f59e0b',
      desc:     'Gear · Guns · Field-tested · Scored 0–10',
      seedType: 'reviews',
      aiAction: null,
    },
    {
      key:      'canadaContent',
      id:       'canada',
      label:    'Canada',
      icon:     '🍁',
      color:    '#ef4444',
      desc:     'C-21 · PAL · Provincial law · Restricted/prohibited',
      seedType: 'canada',
      aiAction: { label: 'AI Write Articles', path: 'write-canada-articles' },
    },
    {
      key:      'competition',
      id:       'competitions',
      label:    'Competitions',
      icon:     '🏆',
      color:    '#a855f7',
      desc:     'USPSA · IDPA · Steel Challenge · NRA · 3-Gun',
      seedType: 'competitions',
      aiAction: null,
    },
  ]

  const totalItems   = counts ? Object.values(counts).reduce((s, c) => s + (c.total || 0), 0) : null
  const totalFailing = counts ? Object.values(counts).reduce((s, c) => s + (c.needsRewrite || 0), 0) : null

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ marginBottom: 28 }}>
        <div className="panel-title">◈ Content Hub</div>
        <div className="panel-sub">Manage, seed, and monitor every content section from one place.</div>
      </div>

      {/* ── Summary bar ── */}
      {counts && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
          {[
            { label: 'Total Items',    val: totalItems,   color: 'var(--text)' },
            { label: 'Need Rewrite',   val: totalFailing, color: totalFailing > 0 ? '#f59e0b' : '#22c55e' },
            { label: 'Quality Passed', val: counts ? Object.values(counts).reduce((s,c) => s + (c.passing||0), 0) : 0, color: '#22c55e' },
            { label: 'Reviewed ✓',    val: counts ? Object.values(counts).reduce((s,c) => s + (c.reviewed||0), 0) : 0, color: '#C8922A' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'10px 20px', textAlign:'center', flex:1, minWidth:110 }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:s.color, lineHeight:1 }}>{s.val ?? '—'}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', marginTop:3, letterSpacing:'.08em', textTransform:'uppercase' }}>{s.label}</div>
            </div>
          ))}
          <div style={{ display:'flex', alignItems:'center', gap:8, marginLeft:'auto' }}>
            <button onClick={fetchCounts} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'6px 12px', background:'transparent', border:'1px solid var(--border)', color:'#6b7280', cursor:'pointer' }}>
              ↺ Refresh
            </button>
          </div>
        </div>
      )}

      {/* ── Seed All banner ── */}
      <div style={{ marginBottom: 28, padding: '20px 24px', background: 'linear-gradient(135deg, rgba(34,197,94,.07) 0%, rgba(34,197,94,.03) 100%)', border: '1px solid rgba(34,197,94,.2)', display:'flex', alignItems:'center', gap:20, flexWrap:'wrap' }}>
        <div style={{ flex:1, minWidth:240 }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'#22c55e', letterSpacing:'.06em', marginBottom:4 }}>🌱 SEED ALL CONTENT</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:1.8 }}>
            Populates every empty section with curated starter content — blog posts, reviews, Canada articles, competitions, gun releases.
          </div>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button onClick={seedAll} disabled={seeding.all} style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', letterSpacing:'.08em', padding:'10px 28px', background:seeding.all?'#374151':'#22c55e', color:seeding.all?'#6b7280':'#000', border:'none', cursor:seeding.all?'default':'pointer' }}>
            {seeding.all ? '⏳ SEEDING...' : '▶ SEED EVERYTHING'}
          </button>
          <button disabled={seeding.fixImages} onClick={async ()=>{
            setSeeding(s=>({...s,fixImages:true})); setResults(r=>({...r,fixImages:null}))
            try {
              const res = await fetch('/api/admin/fix-images?batch=100&force=true', { method:'POST', headers:H })
              const d = await res.json()
              setResults(r=>({...r,fixImages:d}))
              await fetchCounts()
            } catch(e){ setResults(r=>({...r,fixImages:{ok:false,message:e.message}})) }
            setSeeding(s=>({...s,fixImages:false}))
          }} style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', letterSpacing:'.08em', padding:'10px 28px', background:seeding.fixImages?'#374151':'#3b82f6', color:'#fff', border:'none', cursor:seeding.fixImages?'default':'pointer' }}>
            {seeding.fixImages ? '⏳ FIXING...' : '🖼 FIX ALL SVG IMAGES'}
          </button>
          
          <button disabled={seeding.stripFooter} onClick={async ()=>{
            setSeeding(s=>({...s,stripFooter:true})); setResults(r=>({...r,stripFooter:null}))
            try {
              const res = await fetch('/api/admin/strip-source-footer', { method:'POST', headers:H })
              const d = await res.json()
              setResults(r=>({...r,stripFooter:d}))
            } catch(e){ setResults(r=>({...r,stripFooter:{ok:false,error:e.message}})) }
            setSeeding(s=>({...s,stripFooter:false}))
          }} style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', letterSpacing:'.08em', padding:'10px 28px', background:seeding.stripFooter?'#374151':'#b45309', color:'#fff', border:'none', cursor:seeding.stripFooter?'default':'pointer' }}>
            {seeding.stripFooter ? '⏳ STRIPPING...' : '🧹 STRIP SOURCE FOOTER'}
          </button>

          <button onClick={()=>{setSection('system');setPanel('agents')}} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, padding:'10px 14px', background:'transparent', border:'1px solid rgba(34,197,94,.25)', color:'#22c55e', cursor:'pointer' }}>
            🤖 AI Agents →
          </button>
        </div>
        {(results.all || results.fixImages || results.stripFooter) && (
          <div style={{ width:'100%', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, paddingTop:8, borderTop:'1px solid rgba(34,197,94,.15)' }}>
            {results.all && <div style={{color:results.all.ok?'#4ade80':'#f87171'}}>{results.all.ok ? `✅ ${results.all.message}` : `❌ ${results.all.message||'Error'}`}</div>}
            {results.fixImages && <div style={{color:results.fixImages.ok?'#60a5fa':'#f87171',marginTop:results.all?4:0}}>{results.fixImages.ok ? `🖼 ${results.fixImages.message}` : `❌ ${results.fixImages.message||'Error'}`}</div>}
            {results.stripFooter && <div style={{color:results.stripFooter.ok?'#4ade80':'#f87171',marginTop:4}}>{results.stripFooter.ok ? `🧹 Stripped: ${results.stripFooter.patched} articles | Clean: ${results.stripFooter.skipped} | Total: ${results.stripFooter.total}` : `❌ ${results.stripFooter.error||'Error'}`}</div>}
          </div>
        )}
      </div>

      {/* ── Section cards ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(340px,1fr))', gap:16 }}>
        {SECTIONS.map(section => {
          const cnt    = counts?.[section.key]
          const isBusy = seeding[section.seedType] || aiRunning[section.key]
          const sResult= results[section.seedType]
          const aResult= aiResults[section.key]

          return (
            <div key={section.key} style={{ background:'var(--bg2)', border:`1px solid var(--border)`, borderTop:`3px solid ${section.color}`, padding:20, display:'flex', flexDirection:'column', gap:14 }}>

              {/* Card header */}
              <div style={{ display:'flex', alignItems:'flex-start', gap:10 }}>
                <span style={{ fontSize:22, lineHeight:1 }}>{section.icon}</span>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:17, fontWeight:700, color:'var(--text)', letterSpacing:'.04em', lineHeight:1, display:'flex', alignItems:'center', gap:8 }}>
                    {section.label}
                    {section.liveIndicator && (
                      <span style={{ fontSize:9, color:'#22c55e', fontFamily:"'IBM Plex Mono',monospace", display:'flex', alignItems:'center', gap:3 }}>
                        <span style={{ width:6, height:6, borderRadius:'50%', background:'#22c55e', display:'inline-block', animation:'pulse-dot 2s ease-in-out infinite' }}/>
                        LIVE
                      </span>
                    )}
                  </div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', marginTop:3, lineHeight:1.6 }}>{section.desc}</div>
                </div>
                {/* Count pill */}
                {cnt && (
                  <div style={{ textAlign:'right', flexShrink:0 }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:section.color, lineHeight:1 }}>{cnt.total ?? '—'}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#6b7280', letterSpacing:'.06em' }}>ITEMS</div>
                  </div>
                )}
              </div>

              {/* Quality bar */}
              {cnt && cnt.total > 0 && (
                <div>
                  <div style={{ display:'flex', justifyContent:'space-between', fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', marginBottom:4 }}>
                    <span>Quality</span>
                    <span style={{ color: cnt.needsRewrite > 0 ? '#f59e0b' : '#22c55e' }}>
                      {cnt.passing}/{cnt.total} passing · {cnt.needsRewrite} need rewrite
                    </span>
                  </div>
                  <div style={{ height:4, background:'#1f2937', overflow:'hidden' }}>
                    <div style={{ height:'100%', width:`${Math.round(((cnt.passing||0)/cnt.total)*100)}%`, background: cnt.needsRewrite > 0 ? '#f59e0b' : '#22c55e', transition:'width .4s' }}/>
                  </div>
                </div>
              )}

              {/* Empty state alert */}
              {cnt && cnt.total === 0 && (
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#f59e0b', padding:'6px 10px', background:'rgba(245,158,11,.08)', border:'1px solid rgba(245,158,11,.2)' }}>
                  ⚠ Empty — use the buttons below to populate
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginTop:'auto' }}>
                {/* Navigate button */}
                <button onClick={() => { setSection('content'); setPanel(section.id) }} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'.05em', padding:'6px 14px', background:section.color, color: section.color === '#C8922A' || section.color === '#f59e0b' ? '#000' : '#fff', border:'none', cursor:'pointer' }}>
                  ✏ Manage
                </button>

                {/* Seed button */}
                {section.seedType && (
                  <button onClick={() => seed(section.seedType)} disabled={isBusy} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'.05em', padding:'6px 14px', background:'transparent', border:`1px solid ${section.color}66`, color:section.color, cursor:isBusy?'default':'pointer', opacity:isBusy?.5:1 }}>
                    {seeding[section.seedType] ? '⏳ Seeding...' : '🌱 Seed'}
                  </button>
                )}

                {/* AI action */}
                {section.aiAction && (
                  <button onClick={() => runAI(section.key, section.aiAction.path, section.aiAction.params||'')} disabled={isBusy} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, letterSpacing:'.05em', padding:'6px 14px', background:'transparent', border:'1px solid rgba(168,139,250,.4)', color:'#a78bfa', cursor:isBusy?'default':'pointer', opacity:isBusy?.5:1 }}>
                    {aiRunning[section.key] ? '⏳ Running...' : `🤖 ${section.aiAction.label}`}
                  </button>
                )}

                {/* Lock All / Unlock All */}
                <button
                  onClick={() => lockAll(section.key, true)}
                  disabled={!!locking[section.key]}
                  title="Lock all — prevents AI, cron, and image agents from modifying these items"
                  style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:700,letterSpacing:'.04em',padding:'5px 10px',border:'1px solid #C8922A',background:'transparent',color:'#C8922A',cursor:'pointer',opacity:locking[section.key]?0.5:1,flexShrink:0}}>
                  {locking[section.key]==='locking' ? '⏳' : '🔒'} Lock All
                </button>
                <button
                  onClick={() => lockAll(section.key, false)}
                  disabled={!!locking[section.key]}
                  title="Unlock all — re-enables AI rewrites and image updates"
                  style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:12,fontWeight:700,letterSpacing:'.04em',padding:'5px 10px',border:'1px solid var(--border)',background:'transparent',color:'#6b7280',cursor:'pointer',opacity:locking[section.key]?0.5:1,flexShrink:0}}>
                  {locking[section.key]==='unlocking' ? '⏳' : '🔓'} Unlock All
                </button>
              </div>

              {lockRes[section.key] && (
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,marginTop:4,padding:'4px 8px',color:lockRes[section.key].ok?'#C8922A':'#ef4444',background:lockRes[section.key].ok?'rgba(200,146,42,.08)':'rgba(239,68,68,.08)'}}>
                  {lockRes[section.key].ok
                    ? `${lockRes[section.key].lock?'🔒':'🔓'} ${lockRes[section.key].updated} items ${lockRes[section.key].lock?'locked':'unlocked'}`
                    : `❌ ${lockRes[section.key].error}`}
                </div>
              )}

              {/* Result feedback */}
              {(sResult || aResult) && (() => {
                const r = sResult || aResult
                return (
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:r.ok?'#4ade80':'#f87171', padding:'6px 10px', background:r.ok?'rgba(34,197,94,.06)':'rgba(239,68,68,.06)', border:`1px solid ${r.ok?'rgba(34,197,94,.2)':'rgba(239,68,68,.2)'}` }}>
                    {r.ok ? `✅ ${r.message||'Done'}${r.done!=null?` · ${r.done} items`:''}${r.created!=null?` · ${r.created} created`:''}` : `❌ ${r.message||r.error||'Error'}`}
                  </div>
                )
              })()}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StateLawsPanel({ adminKey }) {
  const [states, setStates]   = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [sortBy, setSortBy]   = useState('name')
  const [running, setRunning] = useState(false)
  const [runResult, setRunResult] = useState(null)
  const H = { 'x-admin-key': adminKey }

  useEffect(() => {
    fetch('/api/admin/state-profiles', { headers: H })
      .then(r => r.json())
      .then(d => { if (d.ok) setStates(d.states || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [adminKey])

  async function runFeed() {
    setRunning(true); setRunResult(null)
    try {
      const res = await fetch('/api/admin/cron-status?trigger=true', {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: 'state' })
      })
      const d = await res.json()
      setRunResult(d)
    } catch (e) { setRunResult({ ok: false, error: e.message }) }
    setRunning(false)
  }

  const RATING_C = { 'A': '#22c55e', 'B': '#84cc16', 'C': '#f59e0b', 'D': '#f97316', 'F': '#ef4444' }

  const filtered = states
    .filter(s => !search || s.name?.toLowerCase().includes(search.toLowerCase()) || s.abbr?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'name')   return (a.name||'').localeCompare(b.name||'')
      if (sortBy === 'rating') return (a.rating||'F').localeCompare(b.rating||'F')
      if (sortBy === 'carry')  return (b.constitutionalCarry ? 1 : 0) - (a.constitutionalCarry ? 1 : 0)
      return 0
    })

  const constitutionalCarry = states.filter(s => s.constitutionalCarry).length
  const redFlag = states.filter(s => s.redFlagLaw).length

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12, marginBottom:20 }}>
        <div>
          <div className="panel-title">🗺 State Laws</div>
          <div className="panel-sub">50-state firearms law database · Updated weekly every Sunday 8am UTC</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="adm-btn" onClick={runFeed} disabled={running} style={{ fontSize:11 }}>
            {running ? '⏳ Updating...' : '↺ Run State Feed Now'}
          </button>
          <a href="/laws?tab=reciprocity" target="_blank" style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, padding:'6px 14px', background:'transparent', border:'1px solid var(--border)', color:'var(--text-dim)', textDecoration:'none', display:'flex', alignItems:'center' }}>
            🗺 CCW Planner ↗
          </a>
        </div>
      </div>

      {runResult && (
        <div style={{ marginBottom:16, padding:'8px 14px', background:runResult.ok?'rgba(34,197,94,.08)':'rgba(239,68,68,.08)', border:`1px solid ${runResult.ok?'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`, fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:runResult.ok?'#4ade80':'#f87171' }}>
          {runResult.ok ? `✅ Feed triggered (${runResult.ms}ms)` : `❌ ${runResult.error}`}
        </div>
      )}

      {/* Summary stats */}
      {states.length > 0 && (
        <div style={{ display:'flex', gap:12, marginBottom:20, flexWrap:'wrap' }}>
          {[
            { label:'States tracked',       val: states.length,         color:'var(--text)' },
            { label:'Constitutional Carry', val: constitutionalCarry,   color:'#22c55e' },
            { label:'Red Flag Laws',        val: redFlag,               color:'#ef4444' },
            { label:'Last Updated',         val: 'Weekly',              color:'#C8922A' },
          ].map(s => (
            <div key={s.label} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'10px 18px', textAlign:'center', flex:1, minWidth:100 }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:s.color, lineHeight:1 }}>{s.val}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', marginTop:3, letterSpacing:'.06em', textTransform:'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search state..." 
          style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'6px 12px', background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', flex:1, minWidth:160 }} />
        {[['name','A-Z'],['rating','Rating'],['carry','Carry']].map(([k,l]) => (
          <button key={k} onClick={() => setSortBy(k)} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'5px 10px', background:sortBy===k?'var(--gold)':'transparent', color:sortBy===k?'#000':'#6b7280', border:`1px solid ${sortBy===k?'var(--gold)':'var(--border)'}`, cursor:'pointer' }}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>Loading state profiles...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
          {states.length === 0 ? 'No state profiles loaded. Run the State Feed to populate.' : 'No states match your search.'}
        </div>
      ) : (
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:11 }}>
            <thead>
              <tr style={{ borderBottom:'2px solid var(--border)' }}>
                {['State','Rating','Const. Carry','CCW Permit','Red Flag','Mag Limit','AWB','Suppressors','Open Carry'].map(h => (
                  <th key={h} style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', color:'#4b5563', padding:'8px 10px', textAlign:'left', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.abbr || s.name} style={{ borderBottom:'1px solid rgba(30,41,59,.4)' }}>
                  <td style={{ padding:'8px 10px', fontFamily:"'Barlow Condensed',sans-serif", fontWeight:700, fontSize:13, color:'var(--text)', whiteSpace:'nowrap' }}>
                    <span style={{ color:'#4b5563', fontSize:10, marginRight:6 }}>{s.abbr}</span>{s.name}
                  </td>
                  <td style={{ padding:'8px 10px' }}>
                    {s.rating ? <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:16, color:RATING_C[s.rating]||'#6b7280' }}>{s.rating}</span> : <span style={{ color:'#374151' }}>—</span>}
                  </td>
                  {[
                    s.constitutionalCarry,
                    s.ccwPermit,
                    s.redFlagLaw,
                  ].map((v, i) => (
                    <td key={i} style={{ padding:'8px 10px' }}>
                      <span style={{ color: v ? '#22c55e' : '#ef4444', fontFamily:"'IBM Plex Mono',monospace", fontSize:10 }}>{v ? '✓ YES' : '✗ NO'}</span>
                    </td>
                  ))}
                  <td style={{ padding:'8px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: s.magLimit ? '#f59e0b' : '#4b5563' }}>{s.magLimit || 'None'}</td>
                  <td style={{ padding:'8px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color: s.awbStatus && s.awbStatus !== 'no' ? '#ef4444' : '#4b5563' }}>{s.awbStatus || 'None'}</td>
                  <td style={{ padding:'8px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280' }}>{s.suppressors || '—'}</td>
                  <td style={{ padding:'8px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280' }}>{s.openCarry || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

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
            {panel==='hub'          && <ContentHub         adminKey={adminKey} setPanel={setPanel} setSection={setSection} />}
            {panel==='drafts'       && <DraftRecovery      adminKey={adminKey} />}
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
            {panel==='intel'     && <IntelligenceDashboard adminKey={adminKey} />}
              {panel==='copyright' && <CopyrightReport adminKey={adminKey} />}
            {panel==='statelaws' && <StateLawsPanel adminKey={adminKey} setPanel={setPanel} setSection={setSection} />}
            {panel==='pulllog'   && <PullLogDashboard />}
            {panel==='deals'   && <DealsPanel />}
            {panel==='feeds'        && <FeedsPanel adminKey={adminKey} setMsg={flash} />}
            {panel==='marketbrief' && <MarketBriefManager adminKey={adminKey} />}

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
            {panel==='sitemap' && <SiteMapPanel adminKey={adminKey} />}
            {panel==='ranges'  && <RangesPanel />}
            {panel==='agents'  && <ContentAgentsPanel adminKey={adminKey} setMsg={flash} />}

            {/* ── OUTREACH ── */}
            {panel==='outreach' && <OutreachCRM adminKey={adminKey} />}

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
            {panel==='navvis'   && <NavVisibilityPanel adminKey={adminKey} setMsg={flash} />}
            {panel==='emails'   && <EmailTestPanel     adminKey={adminKey} />}

          </div>
        </div>
      </div>
    </>
  )
}
