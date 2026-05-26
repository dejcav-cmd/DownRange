'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const DEFAULT_CHANNELS = [
  { id:'UC5Gwxl2DmAZkdiuoWsLcRhg', name:'Garand Thumb', enabled:true },
  { id:'UCIRgR4iANHI2taJdz8hjwLw', name:'Paul Harrell', enabled:true },
  { id:'UCwIHnIpEIbyzmL9cB2l5Elw', name:'Military Arms Channel', enabled:true },
  { id:'UCz8b2iV8CJxBNs3fP4jjRMg', name:'Iraqveteran8888', enabled:true },
  { id:'UCDpNK2b8NlJSfMl_k4p_fJg', name:'InRange TV', enabled:true },
  { id:'UC_GOthrJTq5EFrPNsHhJJBQ', name:'Forgotten Weapons', enabled:true },
]

const FEEDS = [
  { key:'news', label:'News Feed', schedule:'Every 15 min', icon:'📰' },
  { key:'laws', label:'Laws Feed', schedule:'Every 2 hrs', icon:'⚖' },
  { key:'releases', label:'Releases Feed', schedule:'Every 1 hr', icon:'🔫' },
  { key:'market', label:'Market Feed', schedule:'Every 30 min', icon:'📊' },
  { key:'video', label:'Video Feed', schedule:'Every 4 hrs', icon:'▶' },
  { key:'state', label:'State Feed', schedule:'Daily 8am', icon:'🗺' },
]

const API_KEYS = [
  { key:'ANTHROPIC_API_KEY', label:'Claude AI (Law Assistant)', required:true, hint:'console.anthropic.com' },
  { key:'SANITY_API_TOKEN', label:'Sanity CMS Write Token', required:true, hint:'sanity.io/manage' },
  { key:'RESEND_API_KEY', label:'Resend Email', required:true, hint:'resend.com' },
  { key:'CRON_SECRET', label:'Cron Secret', required:true, hint:'Random string' },
  { key:'YOUTUBE_API_KEY', label:'YouTube Data API', required:false, hint:'Google Cloud Console' },
  { key:'ALGOLIA_ADMIN_KEY', label:'Algolia Search', required:false, hint:'algolia.com' },
  { key:'GOOGLE_PLACES_API_KEY', label:'Google Places (Ranges/FFL)', required:false, hint:'console.cloud.google.com' },
  { key:'CONGRESS_GOV_KEY', label:'Congress.gov API', required:false, hint:'api.congress.gov' },
  { key:'DISCORD_WEBHOOK_URL', label:'Discord #agent-status', required:false, hint:'Discord webhooks' },
  { key:'DISCORD_ERRORS_WEBHOOK', label:'Discord #errors', required:false, hint:'Discord webhooks' },
  { key:'DISCORD_BREAKING_WEBHOOK', label:'Discord #breaking-alerts', required:false, hint:'Discord webhooks' },
  { key:'LEGISCAN_KEY', label:'LegiScan (State Bills)', required:false, hint:'legiscan.com' },
  { key:'NEWSAPI_KEY', label:'NewsAPI', required:false, hint:'newsapi.org' },
]

const C = { bg:'#0A0B0C', bg2:'#111318', bg3:'#16191F', border:'#1F2428', text:'#F5F5F3', muted:'#6B7280', gold:'#C8922A', red:'#EF4444', green:'#34D399', blue:'#60A5FA' }

const TABS = [
  { key:'feeds', label:'⚡ Feeds' },
  { key:'news', label:'📰 News Manager' },
  { key:'breaking', label:'🔴 Breaking Alerts' },
  { key:'channels', label:'▶ Video Channels' },
  { key:'rss', label:'📡 RSS Sources' },
  { key:'newsletter', label:'📧 Newsletter' },
  { key:'identity', label:'🎨 Site Identity' },
  { key:'keys', label:'🔑 API Keys' },
  { key:'settings', label:'⚙ Settings' },
]

export default function AdminPage() {
  const [secret, setSecret] = useState('')
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState('feeds')
  const [feedResults, setFeedResults] = useState({})
  const [loadingFeed, setLoadingFeed] = useState(null)
  const [apiStatus, setApiStatus] = useState({})
  const [channels, setChannels] = useState(DEFAULT_CHANNELS)
  const [newChId, setNewChId] = useState('')
  const [newChName, setNewChName] = useState('')
  const [urgency, setUrgency] = useState(8)
  const [rssFeeds, setRssFeeds] = useState(['https://www.ammoland.com/feed/','https://www.thefirearmblog.com/blog/feed/','https://www.thetruthaboutguns.com/feed/','https://www.nraila.org/rss/','https://www.guns.com/feed'])
  const [newRss, setNewRss] = useState('')
  const [saved, setSaved] = useState(false)
  const [newsArticles, setNewsArticles] = useState([])
  const [loadingNews, setLoadingNews] = useState(false)
  const [catUpdating, setCatUpdating] = useState(null)
  const [siteOk, setSiteOk] = useState(null)
  // Breaking alerts
  const [alerts, setAlerts] = useState([])
  const [newAlert, setNewAlert] = useState({ headline:'', urgencyScore:8, url:'' })
  const [savingAlert, setSavingAlert] = useState(false)
  // Newsletter compose
  const [newsletter, setNewsletter] = useState({ subject:'', body:'' })
  const [sending, setSending] = useState(false)
  const [sendResult, setSendResult] = useState(null)
  // Site identity
  const [identity, setIdentity] = useState({ siteName:'DownRange', tagline:"America's Firearms Intelligence Hub", footerText:'Proudly Independent · Pro-Second Amendment' })
  // Subscriber count
  const [subCount, setSubCount] = useState(null)

  useEffect(() => {
    const s = sessionStorage.getItem('dr_admin')
    if (s) { setSecret(s); setAuthed(true) }
  }, [])

  useEffect(() => {
    if (!authed) return
    checkStatus()
    checkSite()
    const ch = localStorage.getItem('dr_channels')
    if (ch) try { setChannels(JSON.parse(ch)) } catch {}
    const rss = localStorage.getItem('dr_rss_feeds')
    if (rss) try { setRssFeeds(JSON.parse(rss)) } catch {}
    const u = localStorage.getItem('dr_urgency')
    if (u) setUrgency(Number(u))
    const id = localStorage.getItem('dr_identity')
    if (id) try { setIdentity(JSON.parse(id)) } catch {}
  }, [authed])

  function login(e) { e.preventDefault(); sessionStorage.setItem('dr_admin', secret); setAuthed(true) }
  function logout() { sessionStorage.removeItem('dr_admin'); setAuthed(false) }

  async function checkStatus() {
    const res = await fetch('/api/admin/status', { headers:{ Authorization:`Bearer ${secret}` } }).catch(()=>null)
    if (res?.ok) { const d = await res.json(); setApiStatus(d.keys||{}) }
  }

  async function checkSite() {
    const t = Date.now()
    try { await fetch('/'); setSiteOk({ ok:true, ms:Date.now()-t }) } catch { setSiteOk({ ok:false, ms:0 }) }
    setSiteOk({ ok:true, ms:Date.now()-t })
  }

  async function runFeed(key) {
    setLoadingFeed(key)
    try {
      const r = await fetch(`/api/agent?feed=${key}`, { headers:{ Authorization:`Bearer ${secret}` } })
      const d = await r.json()
      setFeedResults(p=>({ ...p, [key]:d }))
    } catch (e) { setFeedResults(p=>({ ...p, [key]:{ error:e.message } })) }
    setLoadingFeed(null)
  }

  async function loadNews() {
    setLoadingNews(true)
    const res = await fetch('/api/admin/categorize', { headers:{ Authorization:`Bearer ${secret}` } }).catch(()=>null)
    if (res?.ok) { const d = await res.json(); setNewsArticles(d.articles||[]) }
    setLoadingNews(false)
  }

  async function updateCategory(id, category) {
    setCatUpdating(id)
    await fetch('/api/admin/categorize', { method:'PATCH', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${secret}` }, body:JSON.stringify({ id, category }) }).catch(()=>null)
    setNewsArticles(p=>p.map(a=>a._id===id?{ ...a, category }:a))
    setCatUpdating(null)
  }

  async function createAlert() {
    if (!newAlert.headline) return
    setSavingAlert(true)
    await fetch('/api/admin/breaking', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${secret}` }, body:JSON.stringify(newAlert) }).catch(()=>null)
    setAlerts(p=>[{ ...newAlert, _id:Date.now() }, ...p])
    setNewAlert({ headline:'', urgencyScore:8, url:'' })
    setSavingAlert(false)
  }

  async function sendNewsletter() {
    if (!newsletter.subject || !newsletter.body) return
    setSending(true)
    const res = await fetch('/api/newsletter/send', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${secret}` }, body:JSON.stringify(newsletter) }).catch(()=>null)
    const d = await res?.json().catch(()=>({}))
    setSendResult(d?.sent ? `✓ Sent to ${d.sent} subscribers` : '✗ Send failed — check Resend API key')
    setSending(false)
  }

  function saveAll() {
    localStorage.setItem('dr_channels', JSON.stringify(channels))
    localStorage.setItem('dr_urgency', String(urgency))
    localStorage.setItem('dr_rss_feeds', JSON.stringify(rssFeeds))
    localStorage.setItem('dr_identity', JSON.stringify(identity))
    fetch('/api/admin/config', { method:'POST', headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${secret}` }, body:JSON.stringify({ rssFeeds:rssFeeds.map(u=>({ url:u, enabled:true })), youtubeChannels:channels, breakingUrgencyThreshold:urgency }) }).catch(()=>null)
    setSaved(true); setTimeout(()=>setSaved(false), 2000)
  }

  const Btn = ({ label, onClick, loading=false, variant='gold', small=false }) => (
    <button onClick={onClick} disabled={loading} style={{ background:loading?C.bg3:variant==='gold'?C.gold:variant==='red'?'#7F1D1D':'transparent', color:loading?C.muted:variant==='gold'?'#000':variant==='red'?C.red:C.gold, border:`1px solid ${variant==='gold'?C.gold:variant==='red'?C.red:'#1F2428'}`, padding:small?'6px 12px':'9px 18px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:small?'10px':'11px', cursor:'pointer', opacity:loading?0.6:1, whiteSpace:'nowrap' }}>
      {loading ? '...' : label}
    </button>
  )

  if (!authed) return (
    <div style={{ background:C.bg, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'40px', width:360 }}>
        <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:C.gold, marginBottom:8, letterSpacing:'0.05em' }}>DOWNRANGE ADMIN</div>
        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.muted, marginBottom:24 }}>Enter CRON_SECRET to access</p>
        <form onSubmit={login} style={{ display:'flex', flexDirection:'column', gap:12 }}>
          <input type="password" value={secret} onChange={e=>setSecret(e.target.value)} placeholder="CRON_SECRET value..."
            style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.text, padding:'12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:13 }} />
          <button type="submit" style={{ background:C.gold, color:'#000', border:'none', padding:12, fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:14, cursor:'pointer' }}>ACCESS →</button>
        </form>
      </div>
    </div>
  )

  return (
    <div style={{ background:C.bg, minHeight:'100vh', color:C.text }}>
      {/* Top bar */}
      <div style={{ background:C.bg2, borderBottom:`1px solid ${C.border}`, padding:'14px 32px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:C.gold, letterSpacing:'0.05em' }}>DOWNRANGE ADMIN</span>
          {siteOk && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:siteOk.ok?C.green:C.red }}>● SITE {siteOk.ok?'ONLINE':'DOWN'} {siteOk.ok?`(${siteOk.ms}ms)`:''}</span>}
        </div>
        <div style={{ display:'flex', gap:12, alignItems:'center' }}>
          <Link href="/" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.muted, textDecoration:'none' }}>← SITE</Link>
          <Link href="/studio" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.muted, textDecoration:'none' }}>SANITY STUDIO →</Link>
          <button onClick={logout} style={{ background:'none', border:`1px solid ${C.border}`, color:C.muted, padding:'5px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}>LOGOUT</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{ background:C.bg2, borderBottom:`1px solid ${C.border}`, padding:'0 32px', display:'flex', gap:0, overflowX:'auto' }}>
        {TABS.map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            style={{ background:'none', border:'none', borderBottom:`2px solid ${tab===t.key?C.gold:'transparent'}`, color:tab===t.key?C.gold:C.muted, padding:'12px 16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer', whiteSpace:'nowrap', letterSpacing:'0.03em' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding:'28px 32px', maxWidth:1100 }}>

        {/* FEEDS */}
        {tab==='feeds' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:32 }}>
            <div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:14 }}>FEED CONTROLS</div>
              {FEEDS.map(f=>(
                <div key={f.key} style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'12px 16px', marginBottom:8, display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.text, fontWeight:600 }}>{f.icon} {f.label}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, marginTop:2 }}>{f.schedule}</div>
                    {feedResults[f.key] && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', marginTop:4, color:feedResults[f.key].error?C.red:C.green }}>
                      {feedResults[f.key].error?`✗ ${feedResults[f.key].error}`:`✓ Done`}
                    </div>}
                  </div>
                  <Btn label="RUN →" onClick={()=>runFeed(f.key)} loading={loadingFeed===f.key} small />
                </div>
              ))}
              <div style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'12px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.text, fontWeight:600 }}>🔍 Algolia Reindex</div>
                <Btn label="REINDEX" onClick={()=>runFeed('algolia')} loading={loadingFeed==='algolia'} variant='outline' small />
              </div>
            </div>
            <div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:14 }}>QUICK LINKS</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {['/news','/laws','/deals','/market','/ranges','/guns','/reviews','/nfa-tracker','/compare/glock-19-vs-sig-p320','/training','/ffl-finder','/studio'].map(l=>(
                  <Link key={l} href={l} style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'8px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, textDecoration:'none', display:'block' }}>
                    {l.slice(1).toUpperCase()||'HOME'} →
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* NEWS MANAGER */}
        {tab==='news' && (
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em' }}>NEWS CATEGORIZATION</div>
              <Btn label={loadingNews?'LOADING...':newsArticles.length>0?`REFRESH (${newsArticles.length})`:'LOAD ARTICLES →'} onClick={loadNews} loading={loadingNews} />
            </div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.muted, marginBottom:20, lineHeight:1.7 }}>View and recategorize the last 50 published articles. Changes save to Sanity immediately.</p>
            {newsArticles.length===0&&!loadingNews&&<div style={{ textAlign:'center', padding:'40px', color:C.muted, fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }}>Click "Load Articles" to start.</div>}
            <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {newsArticles.map(a=>{
                const catColor = { breaking:'#EF4444',news:'#9CA3AF',law:'#60A5FA',industry:'#C8922A',opinion:'#C084FC',training:'#34D399' }[a.category]||'#9CA3AF'
                return (
                  <div key={a._id} style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'10px 14px', display:'grid', gridTemplateColumns:'1fr 180px 60px', gap:10, alignItems:'center' }}>
                    <div>
                      <div style={{ fontSize:'12px', color:C.text, fontWeight:600, lineHeight:1.3, marginBottom:3 }}>{a.title}</div>
                      <div style={{ display:'flex', gap:8, fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted }}>
                        <span>{a.source}</span>
                        <span style={{ color:'#374151' }}>·</span>
                        <span>{a.publishedAt?new Date(a.publishedAt).toLocaleDateString():''}</span>
                        {a.externalUrl&&<a href={a.externalUrl} target="_blank" rel="noreferrer" style={{ color:C.blue, textDecoration:'none' }}>SOURCE ↗</a>}
                      </div>
                    </div>
                    <select value={a.category||'news'} onChange={e=>updateCategory(a._id,e.target.value)} disabled={catUpdating===a._id}
                      style={{ background:C.bg, border:`1px solid ${catColor}60`, color:catColor, padding:'5px 8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}>
                      {['breaking','news','law','industry','opinion','training','review'].map(c=><option key={c} value={c}>{c}</option>)}
                    </select>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:catUpdating===a._id?C.gold:'#374151', textAlign:'center' }}>
                      {catUpdating===a._id?'SAVING':a.urgencyScore||3}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* BREAKING ALERTS */}
        {tab==='breaking' && (
          <div style={{ maxWidth:700 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:16 }}>BREAKING ALERT MANAGER</div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.muted, marginBottom:20, lineHeight:1.7 }}>Create breaking alerts that appear in the red ticker at the top of every page. These are automatically created when the news agent scores an article 8+/10.</p>
            <div style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'20px', marginBottom:20 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, marginBottom:12 }}>CREATE MANUAL ALERT</div>
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <input value={newAlert.headline} onChange={e=>setNewAlert(p=>({...p,headline:e.target.value}))} placeholder="Alert headline..."
                  style={{ background:C.bg, border:`1px solid ${C.border}`, color:C.text, padding:'10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }} />
                <div style={{ display:'flex', gap:10 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:C.muted, display:'block', marginBottom:4 }}>URGENCY (1-10)</label>
                    <input type="number" min="1" max="10" value={newAlert.urgencyScore} onChange={e=>setNewAlert(p=>({...p,urgencyScore:Number(e.target.value)}))}
                      style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, color:C.red, padding:'8px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'14px', fontWeight:700 }} />
                  </div>
                  <div style={{ flex:2 }}>
                    <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:C.muted, display:'block', marginBottom:4 }}>LINK URL (optional)</label>
                    <input value={newAlert.url} onChange={e=>setNewAlert(p=>({...p,url:e.target.value}))} placeholder="https://..."
                      style={{ width:'100%', background:C.bg, border:`1px solid ${C.border}`, color:C.text, padding:'8px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }} />
                  </div>
                </div>
                <Btn label={savingAlert?'CREATING...':'CREATE ALERT →'} onClick={createAlert} loading={savingAlert} />
              </div>
            </div>
            {alerts.length>0 && (
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, marginBottom:10 }}>RECENT ALERTS</div>
                {alerts.map((a,i)=>(
                  <div key={a._id||i} style={{ background:C.bg2, border:`1px solid #7F1D1D`, padding:'10px 14px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.red }}>● {a.headline}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted }}>{a.urgencyScore}/10</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* CHANNELS */}
        {tab==='channels' && (
          <div style={{ maxWidth:700 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:14 }}>YOUTUBE CHANNELS</div>
            {channels.map(ch=>(
              <div key={ch.id} style={{ background:C.bg2, border:`1px solid ${ch.enabled?C.border:'#1A1A1A'}`, padding:'12px 14px', marginBottom:8, display:'flex', alignItems:'center', gap:12, opacity:ch.enabled?1:0.5 }}>
                <button onClick={()=>setChannels(p=>p.map(c=>c.id===ch.id?{...c,enabled:!c.enabled}:c))}
                  style={{ width:34, height:18, borderRadius:9, background:ch.enabled?C.gold:C.bg3, border:'none', cursor:'pointer', position:'relative', flexShrink:0 }}>
                  <div style={{ position:'absolute', top:2, left:ch.enabled?17:2, width:14, height:14, borderRadius:'50%', background:ch.enabled?'#000':C.muted, transition:'left 0.2s' }} />
                </button>
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.text, fontWeight:600 }}>{ch.name}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:C.muted }}>ID: {ch.id}</div>
                </div>
                <button onClick={()=>setChannels(p=>p.filter(c=>c.id!==ch.id))}
                  style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', padding:'3px 6px' }}>✕</button>
              </div>
            ))}
            <div style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'16px', marginTop:12, marginBottom:16 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, marginBottom:10 }}>ADD CHANNEL</div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={newChId} onChange={e=>setNewChId(e.target.value)} placeholder="UCxxxxxxxxxx (Channel ID)"
                  style={{ flex:2, background:C.bg, border:`1px solid ${C.border}`, color:C.text, padding:'8px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }} />
                <input value={newChName} onChange={e=>setNewChName(e.target.value)} placeholder="Name"
                  style={{ flex:1, background:C.bg, border:`1px solid ${C.border}`, color:C.text, padding:'8px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }} />
                <button onClick={()=>{ if(!newChId||!newChName)return; setChannels(p=>[...p,{id:newChId.trim(),name:newChName.trim(),enabled:true}]); setNewChId(''); setNewChName('') }}
                  style={{ background:C.gold, color:'#000', border:'none', padding:'8px 14px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'11px', cursor:'pointer' }}>ADD</button>
              </div>
            </div>
            <Btn label={saved?'✓ SAVED':'SAVE CHANNELS'} onClick={saveAll} />
          </div>
        )}

        {/* RSS */}
        {tab==='rss' && (
          <div style={{ maxWidth:700 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:14 }}>NEWS RSS FEEDS</div>
            {rssFeeds.map((url,i)=>(
              <div key={i} style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'10px 14px', marginBottom:6, display:'flex', alignItems:'center', gap:10 }}>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.text, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{url}</span>
                <a href={url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:C.blue, textDecoration:'none', flexShrink:0 }}>TEST ↗</a>
                <button onClick={()=>setRssFeeds(p=>p.filter((_,j)=>j!==i))} style={{ background:'none', border:'none', color:C.red, cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>✕</button>
              </div>
            ))}
            <div style={{ display:'flex', gap:8, marginTop:12, marginBottom:16 }}>
              <input value={newRss} onChange={e=>setNewRss(e.target.value)} placeholder="https://example.com/feed.xml"
                style={{ flex:1, background:C.bg2, border:`1px solid ${C.border}`, color:C.text, padding:'9px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }} />
              <button onClick={()=>{ if(!newRss)return; setRssFeeds(p=>[...p,newRss.trim()]); setNewRss('') }}
                style={{ background:C.gold, color:'#000', border:'none', padding:'9px 16px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'11px', cursor:'pointer' }}>ADD</button>
            </div>
            <Btn label={saved?'✓ SAVED':'SAVE RSS FEEDS'} onClick={saveAll} />
          </div>
        )}

        {/* NEWSLETTER */}
        {tab==='newsletter' && (
          <div style={{ maxWidth:700 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:14 }}>NEWSLETTER COMPOSE</div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.muted, marginBottom:20, lineHeight:1.7 }}>Compose and send newsletters to all subscribers. Requires RESEND_API_KEY and RESEND_AUDIENCE_ID.</p>
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div>
                <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, display:'block', marginBottom:6 }}>SUBJECT LINE</label>
                <input value={newsletter.subject} onChange={e=>setNewsletter(p=>({...p,subject:e.target.value}))} placeholder="DownRange Weekly Brief — This Week in 2A"
                  style={{ width:'100%', background:C.bg2, border:`1px solid ${C.border}`, color:C.text, padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', boxSizing:'border-box' }} />
              </div>
              <div>
                <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, display:'block', marginBottom:6 }}>BODY (Markdown or plain text)</label>
                <textarea value={newsletter.body} onChange={e=>setNewsletter(p=>({...p,body:e.target.value}))} rows={12} placeholder="Write your newsletter content here..."
                  style={{ width:'100%', background:C.bg2, border:`1px solid ${C.border}`, color:C.text, padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', boxSizing:'border-box', resize:'vertical' }} />
              </div>
              <div style={{ display:'flex', gap:12 }}>
                <Btn label={sending?'SENDING...':'SEND NEWSLETTER →'} onClick={sendNewsletter} loading={sending} />
                <Btn label="PREVIEW" onClick={()=>alert('Preview:\n\n'+newsletter.subject+'\n\n'+newsletter.body)} variant='outline' />
              </div>
              {sendResult && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:sendResult.startsWith('✓')?C.green:C.red, padding:'10px', background:C.bg2, border:`1px solid ${C.border}` }}>{sendResult}</div>}
            </div>
          </div>
        )}

        {/* SITE IDENTITY */}
        {tab==='identity' && (
          <div style={{ maxWidth:600 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:14 }}>SITE IDENTITY</div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.muted, marginBottom:20, lineHeight:1.7 }}>Configure site-wide text and branding. Changes saved to localStorage and Sanity siteConfig.</p>
            {[['Site Name','siteName','DownRange'],['Tagline','tagline',"America's Firearms Intelligence Hub"],['Footer Text','footerText','Proudly Independent · Pro-Second Amendment']].map(([label,key,placeholder])=>(
              <div key={key} style={{ marginBottom:14 }}>
                <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, display:'block', marginBottom:6 }}>{label.toUpperCase()}</label>
                <input value={identity[key]||''} onChange={e=>setIdentity(p=>({...p,[key]:e.target.value}))} placeholder={placeholder}
                  style={{ width:'100%', background:C.bg2, border:`1px solid ${C.border}`, color:C.text, padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', boxSizing:'border-box' }} />
              </div>
            ))}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, display:'block', marginBottom:6 }}>BRAND COLOR (Gold)</label>
              <div style={{ display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:40, height:40, background:'#C8922A', border:`1px solid ${C.border}` }} />
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.muted }}>#C8922A (hardcoded in globals.css — edit CSS var --gold)</span>
              </div>
            </div>
            <div style={{ marginTop:20 }}>
              <Btn label={saved?'✓ SAVED':'SAVE IDENTITY'} onClick={saveAll} />
            </div>
          </div>
        )}

        {/* API KEYS */}
        {tab==='keys' && (
          <div style={{ maxWidth:700 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:8 }}>API KEY STATUS</div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.muted, marginBottom:18, lineHeight:1.7 }}>All keys are set in Vercel → Settings → Environment Variables. Status is read from the live server.</p>
            {API_KEYS.map(k=>{
              const ok = apiStatus[k.key]
              return (
                <div key={k.key} style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'10px 14px', marginBottom:7, display:'flex', alignItems:'center', gap:12 }}>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.text, fontWeight:600 }}>{k.label}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:C.muted, marginTop:2 }}>{k.hint}</div>
                  </div>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
                    {k.required&&<span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:C.red, background:'#1A0000', padding:'2px 6px' }}>REQUIRED</span>}
                    <span style={{ width:7, height:7, borderRadius:'50%', background:ok==null?'#374151':ok?C.green:C.red, display:'inline-block' }} />
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:ok==null?'#374151':ok?C.green:C.red, minWidth:60 }}>{ok==null?'—':ok?'SET ✓':'MISSING ✗'}</span>
                  </div>
                </div>
              )
            })}
            <button onClick={checkStatus} style={{ marginTop:10, background:'none', border:`1px solid ${C.border}`, color:C.muted, padding:'8px 18px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer' }}>REFRESH STATUS</button>
          </div>
        )}

        {/* SETTINGS */}
        {tab==='settings' && (
          <div style={{ maxWidth:600 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.gold, letterSpacing:'0.15em', marginBottom:20 }}>SITE SETTINGS</div>
            <div style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'20px', marginBottom:14 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.text, marginBottom:10, fontWeight:600 }}>Breaking Alert Urgency Threshold</div>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, marginBottom:12, lineHeight:1.6 }}>Articles scored ≥ this value trigger a breaking alert and Discord ping.</p>
              <div style={{ display:'flex', alignItems:'center', gap:14 }}>
                <input type="range" min="5" max="10" value={urgency} onChange={e=>setUrgency(Number(e.target.value))} style={{ flex:1 }} />
                <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:C.red, minWidth:28 }}>{urgency}</span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted }}>/ 10</span>
              </div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:C.muted, marginTop:8 }}>
                {urgency<=7?'⚠ Low — many articles will alert':urgency===8?'✓ Recommended: SCOTUS/ATF/major legislation':'◈ High — only the most critical stories'}
              </div>
            </div>
            <div style={{ background:C.bg2, border:`1px solid ${C.border}`, padding:'20px', marginBottom:14 }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:C.text, marginBottom:14, fontWeight:600 }}>System Information</div>
              {[['URL','downrangeco.com'],['Framework','Next.js 14.2.29'],['CMS','Sanity v3 (vbnsqnkg)'],['Hosting','Vercel Pro'],['Search','Algolia (SUIVKKC7FX)'],['AI','Claude Sonnet 4 (claude-sonnet-4-20250514)']].map(([k,v])=>(
                <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${C.border}` }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.muted }}>{k}</span>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:C.text }}>{v}</span>
                </div>
              ))}
            </div>
            <Btn label={saved?'✓ ALL SETTINGS SAVED':'SAVE ALL SETTINGS'} onClick={saveAll} />
          </div>
        )}

      </div>
    </div>
  )
}
