'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const TABS = [
  { key:'dashboard', label:'Dashboard',      icon:'◈' },
  { key:'feeds',     label:'AI Agent',       icon:'⚡' },
  { key:'content',   label:'Content',        icon:'📰' },
  { key:'alerts',    label:'Breaking Alerts',icon:'🔴' },
  { key:'channels',  label:'Video',          icon:'▶' },
  { key:'rss',       label:'RSS Sources',    icon:'📡' },
  { key:'deals',     label:'Deals Config',   icon:'🔥' },
  { key:'ranges',    label:'Range Database', icon:'◎' },
  { key:'newsletter',label:'Newsletter',     icon:'📧' },
  { key:'seo',       label:'SEO & Meta',     icon:'🔍' },
  { key:'identity',  label:'Site Identity',  icon:'🎨' },
  { key:'openclaw',  label:'OpenClaw Agent', icon:'🤖' },
  { key:'keys',      label:'API Keys',       icon:'🔑' },
  { key:'blog',      label:'Blog Manager',    icon:'📝' },
  { key:'schedule',  label:'Pub. Schedule',   icon:'📅' },
  { key:'settings',  label:'Settings',        icon:'⚙' },
]

const FEEDS = [
  { key:'news',    label:'News Feed',     schedule:'Every 15 min', icon:'📰', status:'active' },
  { key:'laws',    label:'Laws Feed',     schedule:'Every 2 hrs',  icon:'⚖', status:'active' },
  { key:'releases',label:'Releases Feed', schedule:'Every 1 hr',   icon:'🔫', status:'active' },
  { key:'market',  label:'Market Feed',   schedule:'Every 30 min', icon:'📊', status:'active' },
  { key:'video',   label:'Video Feed',    schedule:'Every 4 hrs',  icon:'▶', status:'active' },
  { key:'state',   label:'State Feed',    schedule:'Daily 8am',    icon:'🗺', status:'active' },
]

const RSS_FEEDS = [
  { name:'The Firearm Blog',  url:'https://www.thefirearmblog.com/blog/feed/', cat:'industry', active:true },
  { name:'TTAG',              url:'https://www.thetruthaboutguns.com/feed/',   cat:'news',     active:true },
  { name:'NRA-ILA',           url:'https://www.nraila.org/rss/',               cat:'law',      active:true },
  { name:'SAF',               url:'https://www.saf.org/feed/',                  cat:'law',      active:true },
  { name:'GOA',               url:'https://gunowners.org/feed/',                cat:'law',      active:true },
  { name:'Concealed Nation',  url:'https://concealednation.org/feed/',          cat:'news',     active:true },
  { name:'Duke Firearms Law', url:'https://firearmslaw.duke.edu/feed/',         cat:'law',      active:true },
  { name:'ATF News',          url:'https://www.atf.gov/rss/news_whats-new.xml', cat:'law',      active:true },
  { name:'AmmoLand',          url:'https://www.ammoland.com/feed/',             cat:'deals',    active:true },
  { name:'Firearms News',     url:'https://www.firearmsnews.com/feed/',         cat:'industry', active:true },
]

const API_KEYS_CONFIG = [
  { group:'Required', keys:[
    { key:'ANTHROPIC_API_KEY',    label:'Claude AI',              hint:'console.anthropic.com',     required:true },
    { key:'SANITY_API_TOKEN',     label:'Sanity CMS Token',       hint:'sanity.io/manage',           required:true },
    { key:'RESEND_API_KEY',       label:'Resend Email API',       hint:'resend.com/api-keys',        required:true },
    { key:'CRON_SECRET',          label:'Cron Job Secret',        hint:'Random secure string',       required:true },
  ]},
  { group:'Integrations', keys:[
    { key:'YOUTUBE_API_KEY',      label:'YouTube Data API',       hint:'Google Cloud Console',       required:false },
    { key:'GOOGLE_PLACES_API_KEY',label:'Google Places (Ranges)', hint:'console.cloud.google.com',   required:false },
    { key:'ALGOLIA_ADMIN_KEY',    label:'Algolia Search',         hint:'algolia.com',                required:false },
    { key:'CONGRESS_GOV_KEY',     label:'Congress.gov API',       hint:'api.congress.gov',           required:false },
    { key:'LEGISCAN_KEY',         label:'LegiScan State Bills',   hint:'legiscan.com',               required:false },
    { key:'NEWSAPI_KEY',          label:'NewsAPI',                hint:'newsapi.org',                required:false },
  ]},
  { group:'Notifications', keys:[
    { key:'DISCORD_WEBHOOK_URL',      label:'Discord #agent-status',  hint:'Discord server settings',    required:false },
    { key:'DISCORD_ERRORS_WEBHOOK',   label:'Discord #errors',        hint:'Discord server settings',    required:false },
    { key:'DISCORD_BREAKING_WEBHOOK', label:'Discord #breaking',      hint:'Discord server settings',    required:false },
  ]},
]

const QUICK_LINKS = [
  { label:'Sanity Studio',   url:'/studio',                   icon:'📝', desc:'Edit content directly' },
  { label:'Laws Page',       url:'/laws',                     icon:'⚖', desc:'Federal & state bills' },
  { label:'Market Watch',    url:'/market',                   icon:'📊', desc:'Ammo price index' },
  { label:'State Hub',       url:'/state-hub',                icon:'🗺', desc:'50-state map' },
  { label:'Ranges',          url:'/ranges',                   icon:'◎', desc:'Range finder' },
  { label:'Deals',           url:'/deals',                    icon:'🔥', desc:'Live deal feed' },
  { label:'Reviews',         url:'/reviews',                  icon:'★', desc:'Gear reviews' },
]

const SITE_STATS = [
  { num:'50', label:'States', sub:'Full legal database' },
  { num:'15', label:'News Sources', sub:'RSS + API feeds' },
  { num:'86', label:'Ranges', sub:'National database' },
  { num:'15m', label:'Refresh', sub:'News update cycle' },
]

export default function AdminPage() {
  const [tab, setTab]       = useState('dashboard')
  const [secret, setSecret] = useState('')
  const [msg, setMsg]       = useState('')
  const [running, setRunning] = useState({})

  async function runFeed(key) {
    if (!secret) { setMsg('Enter CRON_SECRET first'); return }
    setRunning(r => ({...r, [key]:true}))
    try {
      const res = await fetch(`/api/agent?feed=${key}`, { headers:{ Authorization:`Bearer ${secret}` } })
      const d = await res.json()
      setMsg(`${key} feed: ${d.processed || d.message || JSON.stringify(d)}`)
    } catch(e) { setMsg(`Error: ${e.message}`) }
    setRunning(r => ({...r, [key]:false}))
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      {/* Admin header */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'14px 0', position:'sticky', top:0, zIndex:50 }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <Link href="/" style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.05em', textDecoration:'none' }}>DOWNRANGE</Link>
            <span className="dr-badge dr-badge-dim">ADMIN CONSOLE</span>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <input value={secret} onChange={e=>setSecret(e.target.value)} type="password" placeholder="CRON_SECRET for agent triggers"
              style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'6px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', width:'240px' }} />
            <Link href="/" className="dr-btn-outline" style={{ padding:'6px 14px', fontSize:'11px' }}>← Site</Link>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <div style={{ width:200, background:'var(--bg2)', borderRight:'1px solid var(--border)', flexShrink:0, position:'sticky', top:'57px', height:'calc(100vh - 57px)', overflowY:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'11px 16px', background:tab===t.key?'var(--bg3)':'none', border:'none', borderLeft:`3px solid ${tab===t.key?'var(--gold)':'transparent'}`, color:tab===t.key?'var(--gold)':'var(--text-dim)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer', textAlign:'left', letterSpacing:'0.03em', transition:'all 0.12s' }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex:1, padding:'32px', overflowY:'auto', maxHeight:'calc(100vh - 57px)' }}>

          {/* Status message */}
          {msg && (
            <div className="dr-alert-info" style={{ marginBottom:'20px', display:'flex', justifyContent:'space-between' }}>
              <span>{msg}</span>
              <button onClick={()=>setMsg('')} style={{ background:'none', border:'none', color:'var(--gold)', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px' }}>✕</button>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {tab==='dashboard' && (
            <div>
              <h1 className="dr-section-title">Site Dashboard</h1>
              <p className="dr-section-sub">DownRange Control Center — Configure everything from here</p>

              {/* Stats */}
              <div className="dr-grid-4" style={{ marginBottom:'28px' }}>
                {SITE_STATS.map(s => (
                  <div key={s.num} className="dr-stat">
                    <div className="dr-stat-num">{s.num}</div>
                    <div className="dr-stat-label">{s.label}</div>
                    <div className="dr-stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <h2 className="dr-section-title" style={{ marginBottom:'12px' }}>Quick Access</h2>
              <div className="dr-grid-4" style={{ marginBottom:'28px' }}>
                {QUICK_LINKS.map(l => (
                  <a key={l.label} href={l.url} className="dr-card" style={{ textDecoration:'none', textAlign:'center', padding:'16px' }}>
                    <div style={{ fontSize:'22px', marginBottom:'6px' }}>{l.icon}</div>
                    <div className="dr-card-title" style={{ fontSize:'0.9rem' }}>{l.label}</div>
                    <div className="dr-card-body" style={{ fontSize:'10px' }}>{l.desc}</div>
                  </a>
                ))}
              </div>

              {/* Feed status */}
              <h2 className="dr-section-title" style={{ marginBottom:'12px' }}>Agent Feed Status</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {FEEDS.map(f => (
                  <div key={f.key} className="dr-card" style={{ display:'grid', gridTemplateColumns:'32px 1fr 120px 100px auto', gap:12, alignItems:'center', padding:'12px 16px' }}>
                    <span style={{ fontSize:'16px' }}>{f.icon}</span>
                    <div>
                      <div className="t-label-md" style={{ color:'var(--text)', fontWeight:700 }}>{f.label}</div>
                      <div className="t-label-xs">{f.schedule}</div>
                    </div>
                    <span className="dr-badge dr-badge-green">● {f.status}</span>
                    <div className="t-label-xs">Vercel Cron</div>
                    <button onClick={()=>runFeed(f.key)} disabled={running[f.key]}
                      className="dr-btn-outline" style={{ padding:'5px 12px', fontSize:'10px', opacity:running[f.key]?0.5:1 }}>
                      {running[f.key]?'RUNNING...':'RUN NOW'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI AGENT ── */}
          {tab==='feeds' && (
            <div>
              <h1 className="dr-section-title">AI Agent Control</h1>
              <p className="dr-section-sub">Trigger feeds manually or view schedule</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'28px' }}>
                {FEEDS.map(f => (
                  <div key={f.key} className="dr-card" style={{ display:'grid', gridTemplateColumns:'40px 1fr 150px 1fr auto', gap:16, alignItems:'center' }}>
                    <span style={{ fontSize:'20px' }}>{f.icon}</span>
                    <div>
                      <div className="dr-card-title" style={{ fontSize:'1rem' }}>{f.label}</div>
                      <div className="dr-card-meta" style={{ marginBottom:0 }}>Schedule: {f.schedule}</div>
                    </div>
                    <span className="dr-badge dr-badge-green" style={{ justifyContent:'center' }}>● ACTIVE</span>
                    <div className="t-label-sm">Runs automatically via Vercel Cron. API key required.</div>
                    <button onClick={()=>runFeed(f.key)} disabled={running[f.key]} className="dr-btn-primary" style={{ padding:'8px 16px', fontSize:'11px', opacity:running[f.key]?0.5:1 }}>
                      {running[f.key]?'⚡ RUNNING...':'▶ RUN NOW'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="dr-alert-info">
                <strong style={{ color:'var(--gold)' }}>How to trigger manually:</strong> Enter your CRON_SECRET in the header field, then click RUN NOW. All feeds run automatically via vercel.json cron configuration — manual triggers are for debugging only.
              </div>
            </div>
          )}

          {/* ── RSS SOURCES ── */}
          {tab==='rss' && (
            <div>
              <h1 className="dr-section-title">RSS Sources</h1>
              <p className="dr-section-sub">These feeds are parsed by the AI agent every cycle. Category controls where articles appear.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {RSS_FEEDS.map(f => (
                  <div key={f.name} className="dr-card" style={{ display:'grid', gridTemplateColumns:'180px 1fr 80px 60px', gap:12, alignItems:'center' }}>
                    <div className="dr-card-title" style={{ fontSize:'0.9rem' }}>{f.name}</div>
                    <div className="t-label-sm" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', opacity:0.6 }}>{f.url}</div>
                    <span className={`dr-badge ${f.cat==='law'?'dr-badge-blue':f.cat==='deals'?'dr-badge-gold':'dr-badge-dim'}`}>{f.cat}</span>
                    <span className={`dr-badge ${f.active?'dr-badge-green':'dr-badge-red'}`}>{f.active?'ON':'OFF'}</span>
                  </div>
                ))}
              </div>
              <div className="dr-alert-info" style={{ marginTop:'16px' }}>
                To add/remove feeds, edit <code style={{ color:'var(--gold)' }}>agent/feeds/news.js</code> RSS_FEEDS array and redeploy. AmmoLand is locked to <code style={{ color:'var(--gold)' }}>cat: 'deals'</code> and will never appear in news.
              </div>
            </div>
          )}

          {/* ── OPENCLAW ── */}
          {tab==='openclaw' && (
            <div>
              <h1 className="dr-section-title">OpenClaw Agent</h1>
              <p className="dr-section-sub">Your local Ollama/Hermes 3 Mac Mini agent — setup and configuration</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
                {[
                  { title:'Market Analysis', schedule:'Daily 6:00 AM', status:'Manual setup', endpoint:'/api/market-analysis', desc:'Posts daily ammo price analysis to Market Watch page' },
                  { title:'News Enrichment', schedule:'On demand', status:'Available', endpoint:'/api/agent?feed=news', desc:'Run news feed enrichment locally using Hermes 3' },
                ].map(c => (
                  <div key={c.title} className="dr-card dr-card-accent">
                    <div className="dr-card-meta">{c.schedule}</div>
                    <div className="dr-card-title">{c.title}</div>
                    <div className="dr-badge dr-badge-gold" style={{ margin:'6px 0 8px' }}>{c.status}</div>
                    <p className="dr-card-body">{c.desc}</p>
                    <div className="dr-spec-row" style={{ marginTop:'8px' }}>
                      <span className="dr-spec-key">Endpoint</span>
                      <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)' }}>{c.endpoint}</code>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="dr-section-title" style={{ fontSize:'1.4rem', marginBottom:'12px' }}>Mac Mini Setup</h2>
              {[
                { step:'1', title:'Install Ollama', cmd:'curl -fsSL https://ollama.com/install.sh | sh' },
                { step:'2', title:'Pull Hermes 3 model', cmd:'ollama pull hermes3' },
                { step:'3', title:'Clone agent script', cmd:'# See docs/openclaw-market-analysis.md' },
                { step:'4', title:'Add to crontab', cmd:'0 6 * * * /usr/local/bin/node /path/to/market-analysis.js' },
              ].map(s => (
                <div key={s.step} className="dr-card" style={{ display:'grid', gridTemplateColumns:'32px 1fr', gap:'12px', marginBottom:'8px' }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.5rem', color:'var(--gold)', textAlign:'center' }}>{s.step}</div>
                  <div>
                    <div className="dr-infoblock-title">{s.title}</div>
                    <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--green)', background:'var(--bg)', padding:'4px 8px', display:'block', marginTop:'4px' }}>{s.cmd}</code>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:'12px' }}>
                <a href="/docs/openclaw-market-analysis.md" target="_blank" className="dr-btn-outline" style={{ fontSize:'11px' }}>
                  View Full Setup Guide ↗
                </a>
              </div>
            </div>
          )}

          {/* ── API KEYS ── */}
          {tab==='keys' && (
            <div>
              <h1 className="dr-section-title">API Keys</h1>
              <p className="dr-section-sub">All secrets are stored in Vercel Environment Variables — never in code</p>
              <div className="dr-alert-warn" style={{ marginBottom:'20px' }}>
                🔒 API keys are managed in your Vercel dashboard → Settings → Environment Variables. They are never stored client-side. Use the links below to obtain each key.
              </div>
              {API_KEYS_CONFIG.map(group => (
                <div key={group.group} style={{ marginBottom:'24px' }}>
                  <h2 className="dr-section-title" style={{ fontSize:'1.3rem', marginBottom:'10px' }}>{group.group}</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {group.keys.map(k => (
                      <div key={k.key} className="dr-card" style={{ display:'grid', gridTemplateColumns:'220px 1fr 120px', gap:12, alignItems:'center' }}>
                        <div>
                          <div className="dr-card-title" style={{ fontSize:'0.9rem' }}>{k.label}</div>
                          <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)' }}>{k.key}</code>
                        </div>
                        <div className="t-label-sm">{k.hint}</div>
                        <span className={`dr-badge ${k.required?'dr-badge-red':'dr-badge-dim'}`}>{k.required?'REQUIRED':'OPTIONAL'}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="dr-btn-primary">
                Open Vercel Dashboard ↗
              </a>
            </div>
          )}

          {/* ── SEO ── */}
          {tab==='seo' && (
            <div>
              <h1 className="dr-section-title">SEO & Metadata</h1>
              <p className="dr-section-sub">Current SEO configuration overview</p>
              <div className="dr-grid-2" style={{ marginBottom:'24px' }}>
                {[
                  { label:'Site Name', val:'DownRange — America\'s Firearms Intelligence Hub' },
                  { label:'Base URL', val:'https://downrangeco.com' },
                  { label:'Twitter Card', val:'summary_large_image' },
                  { label:'OG Type', val:'website' },
                  { label:'Sitemap', val:'/sitemap.xml (auto-generated)' },
                  { label:'Robots.txt', val:'/robots.txt (allows all)' },
                ].map(s => (
                  <div key={s.label} className="dr-spec-row">
                    <span className="dr-spec-key">{s.label}</span>
                    <span className="dr-spec-val" style={{ fontSize:'11px' }}>{s.val}</span>
                  </div>
                ))}
              </div>
              <div className="dr-alert-info">
                SEO metadata is defined per-page via Next.js <code style={{ color:'var(--gold)' }}>export const metadata</code>. Global defaults are in <code style={{ color:'var(--gold)' }}>app/layout.js</code>.
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab==='settings' && (
            <div>
              <h1 className="dr-section-title">Site Settings</h1>
              <p className="dr-section-sub">Runtime configuration overview</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[
                  { label:'News Revalidation',  val:'300 seconds (5 min)',    desc:'How often Next.js refreshes news pages' },
                  { label:'State Hub Cache',     val:'1800 seconds (30 min)', desc:'State law data refresh interval' },
                  { label:'Market Data Cache',   val:'1800 seconds (30 min)', desc:'Ammo price data refresh' },
                  { label:'Deals Page',          val:'Client-side (no cache)', desc:'Browser fetches Reddit on every load' },
                  { label:'Range Finder',        val:'No cache (dynamic)',     desc:'Always fetches fresh from all sources' },
                  { label:'Laws Page',           val:'3600 seconds (1 hr)',    desc:'Federal/state bill data refresh' },
                  { label:'Theme Toggle',        val:'Dark/Light (CSS vars)',  desc:'User preference stored in localStorage' },
                ].map(s => (
                  <div key={s.label} className="dr-card" style={{ display:'grid', gridTemplateColumns:'200px 200px 1fr', gap:16, alignItems:'center' }}>
                    <div className="dr-infoblock-title" style={{ margin:0 }}>{s.label}</div>
                    <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--gold)' }}>{s.val}</code>
                    <div className="t-label-sm">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BLOG MANAGER ── */}
          {tab==='blog' && (
            <div>
              <h1 className="dr-section-title">Blog Manager</h1>
              <p className="dr-section-sub">Manage Learning Center articles — beginner guides authored by DJ Cavalcanti</p>

              <div className="dr-grid-2" style={{ marginBottom:'24px' }}>
                <div className="dr-stat"><div className="dr-stat-num">12</div><div className="dr-stat-label">Published Articles</div><div className="dr-stat-sub">Learning Center</div></div>
                <div className="dr-stat"><div className="dr-stat-num">4</div><div className="dr-stat-label">In Queue</div><div className="dr-stat-sub">Ready to publish</div></div>
              </div>

              <h2 className="dr-section-title" style={{ fontSize:'1.3rem', marginBottom:'12px' }}>Published Articles</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'6px', marginBottom:'24px' }}>
                {[
                  { title:'Buying Your First Gun: The Complete Beginners Guide', cat:'Getting Started', date:'May 15', views:'—', slug:'buying-your-first-gun' },
                  { title:'How to Get Your CCW License (State-by-State Guide)', cat:'CCW & Carry', date:'May 18', views:'—', slug:'how-to-get-ccw-license' },
                  { title:'The Four Rules of Firearms Safety', cat:'Safety', date:'May 20', views:'—', slug:'firearms-safety-four-rules' },
                ].map(a => (
                  <div key={a.slug} className="dr-card" style={{ display:'grid', gridTemplateColumns:'1fr 120px 80px auto', gap:12, alignItems:'center', padding:'12px 16px' }}>
                    <div>
                      <div className="dr-card-title" style={{ fontSize:'0.9rem' }}>{a.title}</div>
                      <div className="dr-card-meta" style={{ marginBottom:0 }}>{a.cat}</div>
                    </div>
                    <div className="t-label-sm">{a.date} 2026</div>
                    <span className="dr-badge dr-badge-green">LIVE</span>
                    <a href={`/learn/${a.slug}`} target="_blank" className="dr-btn-outline" style={{ padding:'5px 10px', fontSize:'10px' }}>VIEW ↗</a>
                  </div>
                ))}
              </div>

              <h2 className="dr-section-title" style={{ fontSize:'1.3rem', marginBottom:'12px' }}>OpenClaw — Publish New Article</h2>
              <div className="dr-alert-info" style={{ marginBottom:'16px' }}>
                Use the prompt templates in <code style={{ color:'var(--gold)' }}>docs/openclaw-blog-prompts.md</code> to generate articles with your Hermes 3 agent, then POST to the publish endpoint below.
              </div>
              <div className="dr-card dr-card-accent" style={{ marginBottom:'16px' }}>
                <div className="dr-card-meta">PUBLISH ENDPOINT</div>
                <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'var(--green)', display:'block', padding:'8px 0' }}>
                  POST https://downrangeco.com/api/blog-publish
                </code>
                <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', display:'block' }}>
                  Authorization: Bearer {CRON_SECRET}
                </code>
              </div>
              <a href="/docs/openclaw-blog-prompts.md" target="_blank" className="dr-btn-primary" style={{ marginRight:'10px' }}>View Prompt Templates ↗</a>
              <a href="/learn" target="_blank" className="dr-btn-outline">View Learning Center ↗</a>
            </div>
          )}

          {/* ── PUBLICATION SCHEDULE ── */}
          {tab==='schedule' && (
            <div>
              <h1 className="dr-section-title">Publication Schedule</h1>
              <p className="dr-section-sub">Editorial calendar — plan and track blog content</p>

              <div className="dr-table" style={{ marginBottom:'24px' }}>
                <div className="dr-table-head" style={{ gridTemplateColumns:'100px 1fr 150px 100px 80px' }}>
                  {['Pub Date','Title','Category','Author','Status'].map(h=><span key={h}>{h}</span>)}
                </div>
                {[
                  { date:'May 15', title:'Buying Your First Gun', cat:'Getting Started', author:'DJ Cavalcanti', status:'live' },
                  { date:'May 18', title:'How to Get Your CCW License', cat:'CCW & Carry', author:'DJ Cavalcanti', status:'live' },
                  { date:'May 20', title:'The Four Rules of Firearms Safety', cat:'Safety', author:'DJ Cavalcanti', status:'live' },
                  { date:'Jun 1', title:'9mm vs .45 ACP — Which Should You Choose?', cat:'Ammunition', author:'DJ Cavalcanti', status:'queue' },
                  { date:'Jun 5', title:'Red Dot vs Iron Sights for Beginners', cat:'Getting Started', author:'DJ Cavalcanti', status:'queue' },
                  { date:'Jun 10', title:'Safe Storage With Kids in the Home', cat:'Safe Storage', author:'DJ Cavalcanti', status:'planned' },
                  { date:'Jun 15', title:'Constitutional Carry Explained (2026)', cat:'Legal', author:'DJ Cavalcanti', status:'planned' },
                  { date:'Jun 22', title:'Hollow Point vs FMJ: Which Ammo for Defense?', cat:'Ammunition', author:'DJ Cavalcanti', status:'planned' },
                  { date:'Jul 1', title:'Women and Firearms: Fit and Ergonomics', cat:'Getting Started', author:'DJ Cavalcanti', status:'planned' },
                  { date:'Jul 8', title:'Apartment Home Defense: Penetration Concerns', cat:'Home Defense', author:'DJ Cavalcanti', status:'planned' },
                ].map((a, i) => (
                  <div key={i} className="dr-table-row" style={{ gridTemplateColumns:'100px 1fr 150px 100px 80px' }}>
                    <span className="t-label-sm">{a.date} 2026</span>
                    <span className="t-label-md" style={{ color:'var(--text)' }}>{a.title}</span>
                    <span className="t-label-sm">{a.cat}</span>
                    <span className="t-label-sm">{a.author}</span>
                    <span className={`dr-badge ${a.status==='live'?'dr-badge-green':a.status==='queue'?'dr-badge-gold':'dr-badge-dim'}`}>
                      {a.status==='live'?'LIVE':a.status==='queue'?'QUEUE':'PLANNED'}
                    </span>
                  </div>
                ))}
              </div>

              <div className="dr-alert-info">
                📅 Publishing frequency: 2 articles per week · All articles authored by DJ Cavalcanti · Use OpenClaw prompts at <code style={{ color:'var(--gold)' }}>docs/openclaw-blog-prompts.md</code> to generate content with Hermes 3.
              </div>
            </div>
          )}

          {/* Placeholder for remaining tabs */}
          {['content','alerts','channels','deals','ranges','newsletter','identity'].includes(tab) && (
            <div>
              <h1 className="dr-section-title">{TABS.find(t=>t.key===tab)?.label}</h1>
              <p className="dr-section-sub">Use Sanity Studio for content editing</p>
              <div className="dr-grid-2" style={{ marginBottom:'20px' }}>
                <a href="/studio" target="_blank" className="dr-card" style={{ textDecoration:'none', textAlign:'center', padding:'24px' }}>
                  <div style={{ fontSize:'32px', marginBottom:'8px' }}>📝</div>
                  <div className="dr-card-title">Open Sanity Studio</div>
                  <p className="dr-card-body">Create, edit, and publish all content types including news, reviews, alerts, and state profiles.</p>
                </a>
                <a href="https://sanity.io/manage" target="_blank" rel="noreferrer" className="dr-card" style={{ textDecoration:'none', textAlign:'center', padding:'24px' }}>
                  <div style={{ fontSize:'32px', marginBottom:'8px' }}>⚙</div>
                  <div className="dr-card-title">Sanity Dashboard</div>
                  <p className="dr-card-body">Manage datasets, tokens, CORS settings, and content API access for project vbnsqnkg.</p>
                </a>
              </div>
              {tab==='alerts' && <div className="dr-alert-info">Breaking alerts are auto-created by the AI agent when urgency score ≥ 8/10. Create manually in Sanity Studio → Breaking Alert.</div>}
              {tab==='newsletter' && <div className="dr-alert-info">Newsletter managed via Resend dashboard. Audience ID configured in RESEND_AUDIENCE_ID env var.</div>}
              {tab==='deals' && <div className="dr-alert-info">Deals are sourced from r/gundeals JSON API, gun.deals RSS, AmmoLand RSS, and Mr. Guns N Gear Squarespace API. Configuration in <code style={{ color:'var(--gold)' }}>app/api/deals/route.js</code>.</div>}
              {tab==='ranges' && <div className="dr-alert-info">Range database has 86 entries. To add ranges, edit <code style={{ color:'var(--gold)' }}>app/api/ranges/route.js</code> RANGES array. Google Places API key enables live search.</div>}
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
