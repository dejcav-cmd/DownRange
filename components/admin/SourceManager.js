'use client'
import { useState, useEffect, useCallback } from 'react'

const MONO  = "'IBM Plex Mono',monospace"
const GOLD  = 'var(--gold,#C8922A)'
const BARLOW= "'Barlow Condensed',sans-serif"

// ─────────────────────────────────────────────────────────────────────────────
// SOURCE REGISTRY — every data source feeding every page of the portal
// ─────────────────────────────────────────────────────────────────────────────
const SOURCE_REGISTRY = [
  // ── NEWS & ARTICLES ────────────────────────────────────────────────────────
  { id:'newsapi',     page:'News',      section:'Feed',       type:'API',     label:'NewsAPI',           cron:'*/15 * * * *',  url:'https://newsapi.org',                  cat:'news',       desc:'Breaking 2A and firearms news aggregation' },
  { id:'gnews',       page:'News',      section:'Feed',       type:'API',     label:'GNews',             cron:'*/15 * * * *',  url:'https://gnews.io',                     cat:'news',       desc:'Secondary news source for broader coverage' },
  { id:'tfb',         page:'News',      section:'RSS',        type:'RSS',     label:'The Firearm Blog',  cron:'*/15 * * * *',  url:'https://www.thefirearmblog.com/blog/feed/', cat:'industry', desc:'Industry news and product reviews' },
  { id:'ttag',        page:'News',      section:'RSS',        type:'RSS',     label:'TTAG',              cron:'*/15 * * * *',  url:'https://www.thetruthaboutguns.com/feed/',  cat:'news',     desc:'Truth About Guns editorial content' },
  { id:'bearingarms', page:'News',      section:'RSS',        type:'RSS',     label:'Bearing Arms',      cron:'*/15 * * * *',  url:'https://bearingarms.com/feed/',            cat:'news',     desc:'2A news and commentary' },
  { id:'ammoland',    page:'News',      section:'RSS',        type:'RSS',     label:'AmmoLand',          cron:'*/15 * * * *',  url:'https://www.ammoland.com/feed/',           cat:'industry', desc:'Firearms industry trade news' },
  { id:'gunsdotcom',  page:'News',      section:'RSS',        type:'RSS',     label:'Guns.com',          cron:'*/15 * * * *',  url:'https://www.guns.com/feed',                cat:'industry', desc:'Retail and industry news' },
  // ── LEGISLATION & LAW ──────────────────────────────────────────────────────
  { id:'nraila',      page:'Laws',      section:'RSS',        type:'RSS',     label:'NRA-ILA',           cron:'0 */2 * * *',   url:'https://www.nraila.org/rss/',              cat:'law',      desc:'NRA legislative alerts and news' },
  { id:'atf',         page:'Laws',      section:'RSS',        type:'RSS',     label:'ATF News',          cron:'0 */2 * * *',   url:'https://www.atf.gov/rss/news_whats-new.xml',cat:'law',    desc:'Official ATF regulatory updates' },
  { id:'saf',         page:'Laws',      section:'RSS',        type:'RSS',     label:'SAF',               cron:'0 */2 * * *',   url:'https://www.saf.org/feed/',                cat:'law',      desc:'Second Amendment Foundation alerts' },
  { id:'goa',         page:'Laws',      section:'RSS',        type:'RSS',     label:'Gun Owners of America',cron:'0 */2 * * *', url:'https://www.gunowners.org/feed/',         cat:'law',      desc:'GOA legislative and 2A news' },
  { id:'thegunfeed',  page:'Laws',      section:'RSS',        type:'RSS',     label:'TheGunFeed',        cron:'0 */2 * * *',   url:'https://thegunfeed.com/feed/',             cat:'law',      desc:'Gun rights news aggregator' },
  // ── GUN RELEASES ──────────────────────────────────────────────────────────
  { id:'releases_ai', page:'Releases',  section:'AI',         type:'AI',      label:'DownRange AI',      cron:'0 * * * *',     url:'/api/cron/releases',                       cat:'releases', desc:'AI-generated new gun release intelligence' },
  // ── DEALS ─────────────────────────────────────────────────────────────────
  { id:'gundeals',    page:'Deals',     section:'RSS+Scrape', type:'RSS',     label:'gun.deals',         cron:'0 */4 * * *',   url:'https://gun.deals/rss.xml',                cat:'deals',    desc:'Gun deals RSS with OG image scraping per product' },
  { id:'reddit_gd',   page:'Deals',     section:'Live',       type:'Reddit',  label:'r/gundeals',        cron:'live',          url:'https://reddit.com/r/gundeals',            cat:'deals',    desc:'Reddit r/gundeals live hot/new posts' },
  { id:'reddit_ammo', page:'Deals',     section:'Live',       type:'Reddit',  label:'r/ammo',            cron:'live',          url:'https://reddit.com/r/ammo',                cat:'deals',    desc:'Reddit r/ammo live hot posts' },
  // ── MARKET ────────────────────────────────────────────────────────────────
  { id:'ammoprices',  page:'Market',    section:'Scrape',     type:'Scrape',  label:'Ammo Price Tracker',cron:'*/30 * * * *',  url:'/api/cron/ammo-prices',                    cat:'market',   desc:'Live ammo price indexing across major retailers' },
  { id:'market_ai',   page:'Market',    section:'AI',         type:'AI',      label:'Market Analysis AI',cron:'*/30 * * * *',  url:'/api/cron/market',                         cat:'market',   desc:'AI-generated market analysis and commentary' },
  // ── VIDEO ─────────────────────────────────────────────────────────────────
  { id:'youtube',     page:'Videos',    section:'YouTube',    type:'API',     label:'YouTube Data API',  cron:'0 */4 * * *',   url:'https://www.googleapis.com/youtube/v3',    cat:'video',    desc:'Firearms channel video indexing' },
  // ── CANADA ────────────────────────────────────────────────────────────────
  { id:'gunblogca',   page:'Canada',    section:'RSS',        type:'RSS',     label:'TheGunBlog.ca',     cron:'0 */2 * * *',   url:'https://www.thegunblog.ca/feed/',          cat:'canada',   desc:'Canadian firearms news and politics' },
  { id:'nfaca',       page:'Canada',    section:'RSS',        type:'RSS',     label:'NFA Canada',        cron:'0 */2 * * *',   url:'https://www.nfa.ca/feed/',                 cat:'canada',   desc:'National Firearms Association Canada' },
  { id:'cssa',        page:'Canada',    section:'RSS',        type:'RSS',     label:'CSSA',              cron:'0 */2 * * *',   url:'https://www.cdnshootingsports.org/feed/',  cat:'canada',   desc:'Canadian Shooting Sports Association' },
  // ── BRAZIL ────────────────────────────────────────────────────────────────
  { id:'brazil_ai',   page:'Brazil',    section:'AI',         type:'AI',      label:'Brazil AI Feed',    cron:'0 */2 * * *',   url:'/api/cron/brazil',                         cat:'brazil',   desc:'AI-curated Brazilian firearms and legislation news' },
  // ── INTELLIGENCE / NEWSLETTER ─────────────────────────────────────────────
  { id:'intel_ai',    page:'Intel',     section:'AI',         type:'AI',      label:'Intelligence AI',   cron:'0 1 * * *',     url:'/api/cron/intelligence',                   cat:'intel',    desc:'Daily AI intelligence briefing generation' },
  { id:'newsletter',  page:'Newsletter',section:'AI',         type:'AI',      label:'Newsletter AI',     cron:'0 7 * * *',     url:'/api/cron/newsletter',                     cat:'intel',    desc:'Weekly newsletter generation and dispatch' },
  // ── STATE PROFILES ────────────────────────────────────────────────────────
  { id:'states_ai',   page:'States',    section:'AI',         type:'AI',      label:'State Profile AI',  cron:'0 8 * * 0',     url:'/api/cron/state',                          cat:'law',      desc:'Weekly AI update of per-state gun law profiles' },
  // ── COMMUNITY ─────────────────────────────────────────────────────────────
  { id:'rguns',       page:'Community', section:'RSS',        type:'Reddit',  label:'r/guns',            cron:'live',          url:'https://reddit.com/r/guns',                cat:'community',desc:'Reddit r/guns community feed' },
  { id:'rfirearms',   page:'Community', section:'RSS',        type:'Reddit',  label:'r/firearms',        cron:'live',          url:'https://reddit.com/r/firearms',            cat:'community',desc:'Reddit r/firearms community feed' },
]

const TYPE_COLORS = {
  RSS:    { color:'#60A5FA', bg:'rgba(96,165,250,0.12)' },
  API:    { color:'#34D399', bg:'rgba(52,211,153,0.12)' },
  AI:     { color:'#C8922A', bg:'rgba(200,146,42,0.12)' },
  Scrape: { color:'#C084FC', bg:'rgba(192,132,252,0.12)' },
  Reddit: { color:'#F97316', bg:'rgba(249,115,22,0.12)' },
}

const PAGE_ICONS = {
  News:'📰', Laws:'⚖️', Releases:'🔫', Deals:'🔥', Market:'📊',
  Videos:'▶️', Canada:'🇨🇦', Brazil:'🇧🇷', Intel:'🧠',
  Newsletter:'✉️', States:'🗺️', Community:'👥',
}

function cronHuman(cron) {
  if (cron === 'live') return 'Live'
  if (cron === '*/15 * * * *') return 'Every 15m'
  if (cron === '*/30 * * * *') return 'Every 30m'
  if (cron === '0 * * * *')    return 'Hourly'
  if (cron === '0 */2 * * *')  return 'Every 2h'
  if (cron === '0 */4 * * *')  return 'Every 4h'
  if (cron === '0 1 * * *')    return 'Daily 1am'
  if (cron === '0 7 * * *')    return 'Daily 7am'
  if (cron === '0 8 * * 0')    return 'Weekly Sun'
  return cron
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SourceManager({ adminKey }) {
  const [view,       setView]       = useState('grid')   // 'grid' | 'table' | 'page'
  const [filter,     setFilter]     = useState('all')    // page name or 'all'
  const [typeFilter, setTypeFilter] = useState('all')
  const [search,     setSearch]     = useState('')
  const [enabled,    setEnabled]    = useState(() => {
    const init = {}
    SOURCE_REGISTRY.forEach(s => { init[s.id] = true })
    return init
  })
  const [cronStatus, setCronStatus] = useState({})
  const [backfilling,setBackfilling]= useState(false)
  const [backfillMsg,setBackfillMsg]= useState('')
  const [testing,    setTesting]    = useState({})
  const [testResults,setTestResults]= useState({})

  const pages    = ['all', ...new Set(SOURCE_REGISTRY.map(s => s.page))]
  const types    = ['all', ...new Set(SOURCE_REGISTRY.map(s => s.type))]

  const filtered = SOURCE_REGISTRY.filter(s => {
    if (filter     !== 'all' && s.page !== filter)       return false
    if (typeFilter !== 'all' && s.type !== typeFilter)   return false
    if (search && !s.label.toLowerCase().includes(search.toLowerCase())
               && !s.page.toLowerCase().includes(search.toLowerCase())
               && !s.desc.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  // Load cron status
  useEffect(() => {
    if (!adminKey) return
    fetch('/api/admin/cron-status', { headers: { 'x-admin-key': adminKey } })
      .then(r => r.json())
      .then(d => {
        const map = {}
        if (d.jobs) d.jobs.forEach(j => { map[j.path] = j })
        setCronStatus(map)
      })
      .catch(() => {})
  }, [adminKey])

  // Test a source by calling its cron endpoint
  const testSource = useCallback(async (source) => {
    if (!source.url.startsWith('/api/')) return
    setTesting(p => ({ ...p, [source.id]: true }))
    setTestResults(p => ({ ...p, [source.id]: null }))
    try {
      const res = await fetch(source.url, {
        headers: { 'x-admin-key': adminKey },
        signal: AbortSignal.timeout(30000),
      })
      const data = await res.json()
      setTestResults(p => ({ ...p, [source.id]: { ok: res.ok, data } }))
    } catch (e) {
      setTestResults(p => ({ ...p, [source.id]: { ok: false, data: { error: e.message } } }))
    }
    setTesting(p => ({ ...p, [source.id]: false }))
  }, [adminKey])

  // Backfill deal images
  const runBackfill = useCallback(async () => {
    setBackfilling(true)
    setBackfillMsg('')
    try {
      const res = await fetch('/api/admin/deals-image-backfill', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
      })
      const d = await res.json()
      setBackfillMsg(d.ok
        ? `✓ ${d.updated} images updated, ${d.failed} failed (${d.total} processed)`
        : `✗ ${d.error}`)
    } catch (e) {
      setBackfillMsg(`✗ ${e.message}`)
    }
    setBackfilling(false)
  }, [adminKey])

  const toggleSource = (id) => setEnabled(p => ({ ...p, [id]: !p[id] }))

  // Group by page for page view
  const byPage = {}
  SOURCE_REGISTRY.forEach(s => {
    if (!byPage[s.page]) byPage[s.page] = []
    byPage[s.page].push(s)
  })

  const activeCount  = SOURCE_REGISTRY.filter(s => enabled[s.id]).length
  const totalCount   = SOURCE_REGISTRY.length

  return (
    <div>
      {/* ── Header ── */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div className="panel-title">Source Intelligence</div>
          <div className="panel-sub">
            {activeCount}/{totalCount} sources active across {Object.keys(byPage).length} portal sections
          </div>
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
          {/* Deals image backfill */}
          <button
            onClick={runBackfill} disabled={backfilling}
            style={{ fontFamily:MONO, fontSize:10, padding:'7px 14px', background:'rgba(200,146,42,0.1)', border:'1px solid rgba(200,146,42,0.3)', color:GOLD, cursor:'pointer' }}>
            {backfilling ? '⟳ Backfilling…' : '🖼 Backfill Deal Images'}
          </button>
          {/* View toggles */}
          {['grid','table','page'].map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ fontFamily:MONO, fontSize:10, padding:'7px 12px', background: view===v?'rgba(200,146,42,0.15)':'transparent', border:`1px solid ${view===v?GOLD:'var(--border)'}`, color: view===v?GOLD:'var(--text-dim)', cursor:'pointer', textTransform:'capitalize' }}>
              {v === 'grid' ? '⊞ Grid' : v === 'table' ? '≡ Table' : '📰 By Page'}
            </button>
          ))}
        </div>
      </div>

      {/* Backfill result */}
      {backfillMsg && (
        <div style={{ marginBottom:12, fontFamily:MONO, fontSize:11, padding:'8px 12px', background: backfillMsg.startsWith('✓')?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)', border:`1px solid ${backfillMsg.startsWith('✓')?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}`, color: backfillMsg.startsWith('✓')?'#22c55e':'#ef4444' }}>
          {backfillMsg}
        </div>
      )}

      {/* ── Filters ── */}
      <div style={{ display:'flex', gap:6, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search sources…"
          style={{ fontFamily:MONO, fontSize:11, padding:'6px 10px', background:'var(--bg2)', border:'1px solid var(--border)', color:'var(--text)', outline:'none', width:180 }}
        />
        <div style={{ width:1, height:24, background:'var(--border)', margin:'0 4px' }} />
        {pages.map(p => (
          <button key={p} onClick={() => setFilter(p)}
            style={{ fontFamily:MONO, fontSize:9, padding:'4px 10px', background: filter===p?'rgba(200,146,42,0.15)':'transparent', border:`1px solid ${filter===p?GOLD:'var(--border)'}`, color: filter===p?GOLD:'var(--text-dim)', cursor:'pointer' }}>
            {p === 'all' ? 'ALL PAGES' : (PAGE_ICONS[p]||'') + ' ' + p.toUpperCase()}
          </button>
        ))}
        <div style={{ width:1, height:24, background:'var(--border)', margin:'0 4px' }} />
        {types.map(t => {
          const tc = TYPE_COLORS[t]
          return (
            <button key={t} onClick={() => setTypeFilter(t)}
              style={{ fontFamily:MONO, fontSize:9, padding:'4px 10px', background: typeFilter===t?(tc?.bg||'rgba(200,146,42,0.15)'):'transparent', border:`1px solid ${typeFilter===t?(tc?.color||GOLD):'var(--border)'}`, color: typeFilter===t?(tc?.color||GOLD):'var(--text-dim)', cursor:'pointer' }}>
              {t === 'all' ? 'ALL TYPES' : t.toUpperCase()}
            </button>
          )
        })}
      </div>

      {/* ────────────────── GRID VIEW ────────────────── */}
      {view === 'grid' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:10 }}>
          {filtered.map(s => {
            const tc     = TYPE_COLORS[s.type] || TYPE_COLORS.RSS
            const active = enabled[s.id]
            const tr     = testResults[s.id]
            const cronJ  = cronStatus[s.url]
            return (
              <div key={s.id} style={{ background:'var(--bg2)', border:`1px solid ${active?'var(--border)':'rgba(75,85,99,0.3)'}`, padding:16, opacity: active?1:0.5, transition:'all .2s', position:'relative' }}>
                {/* Header row */}
                <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8 }}>
                  <div>
                    <div style={{ fontFamily:BARLOW, fontWeight:700, fontSize:14, color: active?'var(--text)':'#6b7280', letterSpacing:'.03em' }}>
                      {PAGE_ICONS[s.page]||''} {s.label}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:2 }}>
                      {s.page} › {s.section}
                    </div>
                  </div>
                  {/* Toggle */}
                  <button onClick={() => toggleSource(s.id)}
                    title={active?'Disable source':'Enable source'}
                    style={{ width:36, height:20, borderRadius:10, background: active?GOLD:'#374151', border:'none', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                    <span style={{ position:'absolute', top:2, width:16, height:16, borderRadius:'50%', background:'#fff', transition:'left .2s', left: active?18:2 }} />
                  </button>
                </div>
                {/* Type badge + cron */}
                <div style={{ display:'flex', gap:6, marginBottom:8, alignItems:'center' }}>
                  <span style={{ fontFamily:MONO, fontSize:9, padding:'2px 7px', background:tc.bg, color:tc.color, border:`1px solid ${tc.color}44` }}>{s.type}</span>
                  <span style={{ fontFamily:MONO, fontSize:9, color:'#4b5563' }}>
                    {s.cron === 'live' ? '⚡ Live' : `⏱ ${cronHuman(s.cron)}`}
                  </span>
                  {cronJ && (
                    <span style={{ fontFamily:MONO, fontSize:9, color: cronJ.lastStatus==='ok'?'#22c55e':'#ef4444' }}>
                      {cronJ.lastStatus==='ok'?'●':'○'}
                    </span>
                  )}
                </div>
                {/* Description */}
                <div style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', lineHeight:1.5, marginBottom:10 }}>{s.desc}</div>
                {/* URL */}
                <div style={{ fontFamily:MONO, fontSize:9, color:'#374151', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginBottom: s.url.startsWith('/api/')?10:0 }}>
                  {s.url.startsWith('http') ? <a href={s.url} target="_blank" rel="noreferrer" style={{color:'#4b5563',textDecoration:'none'}}>{s.url.replace('https://','')}</a> : s.url}
                </div>
                {/* Test button for internal crons */}
                {s.url.startsWith('/api/') && (
                  <div style={{ marginTop:8 }}>
                    <button onClick={() => testSource(s)} disabled={testing[s.id]}
                      style={{ fontFamily:MONO, fontSize:9, padding:'4px 10px', background:'rgba(200,146,42,0.08)', border:'1px solid rgba(200,146,42,0.25)', color:GOLD, cursor:'pointer' }}>
                      {testing[s.id] ? '⟳ Running…' : '▶ Run Now'}
                    </button>
                    {tr && (
                      <div style={{ marginTop:6, fontFamily:MONO, fontSize:9, padding:'4px 8px', background: tr.ok?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)', color: tr.ok?'#22c55e':'#ef4444', border:`1px solid ${tr.ok?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}` }}>
                        {tr.ok ? `✓ ${JSON.stringify(tr.data).slice(0,80)}` : `✗ ${tr.data?.error || 'Error'}`}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* ────────────────── TABLE VIEW ────────────────── */}
      {view === 'table' && (
        <div className="adm-card" style={{ padding:0, overflow:'hidden' }}>
          <table className="adm-table" style={{ width:'100%' }}>
            <thead>
              <tr>
                <th>Source</th>
                <th>Page</th>
                <th>Section</th>
                <th>Type</th>
                <th>Schedule</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s => {
                const tc     = TYPE_COLORS[s.type] || TYPE_COLORS.RSS
                const active = enabled[s.id]
                const tr     = testResults[s.id]
                return (
                  <tr key={s.id} style={{ opacity: active?1:0.45 }}>
                    <td>
                      <div style={{ fontWeight:700, color:'var(--text)', fontSize:12 }}>{s.label}</div>
                      <div style={{ fontFamily:MONO, fontSize:9, color:'#4b5563', marginTop:2 }}>{s.desc.slice(0,55)}…</div>
                    </td>
                    <td>
                      <span style={{ fontFamily:BARLOW, fontWeight:700, fontSize:12 }}>{PAGE_ICONS[s.page]||''} {s.page}</span>
                    </td>
                    <td style={{ fontFamily:MONO, fontSize:10, color:'#6b7280' }}>{s.section}</td>
                    <td>
                      <span style={{ fontFamily:MONO, fontSize:9, padding:'2px 7px', background:tc.bg, color:tc.color }}>{s.type}</span>
                    </td>
                    <td style={{ fontFamily:MONO, fontSize:10, color:'#9ca3af' }}>
                      {s.cron === 'live' ? '⚡ Live' : cronHuman(s.cron)}
                    </td>
                    <td>
                      <button onClick={() => toggleSource(s.id)}
                        style={{ fontFamily:MONO, fontSize:9, padding:'3px 10px', background: active?'rgba(34,197,94,0.1)':'rgba(239,68,68,0.1)', border:`1px solid ${active?'rgba(34,197,94,.3)':'rgba(239,68,68,.3)'}`, color: active?'#22c55e':'#ef4444', cursor:'pointer' }}>
                        {active ? '● ACTIVE' : '○ OFF'}
                      </button>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                        {s.url.startsWith('/api/') && (
                          <button onClick={() => testSource(s)} disabled={testing[s.id]}
                            style={{ fontFamily:MONO, fontSize:9, padding:'3px 8px', background:'transparent', border:'1px solid var(--border)', color:GOLD, cursor:'pointer' }}>
                            {testing[s.id] ? '⟳' : '▶'}
                          </button>
                        )}
                        {s.url.startsWith('http') && (
                          <a href={s.url} target="_blank" rel="noreferrer"
                            style={{ fontFamily:MONO, fontSize:9, padding:'3px 8px', background:'transparent', border:'1px solid var(--border)', color:'#4b5563', textDecoration:'none' }}>
                            ↗
                          </a>
                        )}
                        {tr && (
                          <span style={{ fontFamily:MONO, fontSize:9, color: tr.ok?'#22c55e':'#ef4444' }}>
                            {tr.ok ? '✓' : '✗'}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ────────────────── PAGE VIEW ────────────────── */}
      {view === 'page' && (
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          {Object.entries(byPage).map(([page, sources]) => {
            const pageSources = sources.filter(s => {
              if (typeFilter !== 'all' && s.type !== typeFilter) return false
              if (search && !s.label.toLowerCase().includes(search.toLowerCase()) && !s.desc.toLowerCase().includes(search.toLowerCase())) return false
              return true
            })
            if (!pageSources.length) return null
            const activeInPage = pageSources.filter(s => enabled[s.id]).length
            return (
              <div key={page} className="adm-card" style={{ padding:0, overflow:'hidden' }}>
                {/* Page header */}
                <div style={{ padding:'12px 16px', background:'rgba(200,146,42,0.06)', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <div style={{ fontFamily:BARLOW, fontWeight:700, fontSize:16, color:'var(--text)', letterSpacing:'.05em' }}>
                    {PAGE_ICONS[page]||''} {page.toUpperCase()}
                  </div>
                  <div style={{ fontFamily:MONO, fontSize:10, color:'#6b7280' }}>
                    {activeInPage}/{pageSources.length} active
                  </div>
                </div>
                {/* Source rows */}
                {pageSources.map((s, i) => {
                  const tc     = TYPE_COLORS[s.type] || TYPE_COLORS.RSS
                  const active = enabled[s.id]
                  const tr     = testResults[s.id]
                  return (
                    <div key={s.id} style={{ padding:'12px 16px', borderBottom: i<pageSources.length-1?'1px solid rgba(75,85,99,0.2)':0, display:'flex', alignItems:'center', gap:12, opacity: active?1:0.45 }}>
                      {/* Toggle */}
                      <button onClick={() => toggleSource(s.id)}
                        style={{ width:32, height:18, borderRadius:9, background: active?GOLD:'#374151', border:'none', cursor:'pointer', position:'relative', transition:'background .2s', flexShrink:0 }}>
                        <span style={{ position:'absolute', top:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left .2s', left: active?16:2 }} />
                      </button>
                      {/* Info */}
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:2 }}>
                          <span style={{ fontFamily:BARLOW, fontWeight:700, fontSize:13, color:'var(--text)' }}>{s.label}</span>
                          <span style={{ fontFamily:MONO, fontSize:9, padding:'1px 6px', background:tc.bg, color:tc.color }}>{s.type}</span>
                          <span style={{ fontFamily:MONO, fontSize:9, color:'#4b5563' }}>{s.section}</span>
                          <span style={{ fontFamily:MONO, fontSize:9, color:'#374151' }}>
                            {s.cron === 'live' ? '⚡ Live' : cronHuman(s.cron)}
                          </span>
                        </div>
                        <div style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>{s.desc}</div>
                      </div>
                      {/* Actions */}
                      <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                        {s.url.startsWith('/api/') && (
                          <button onClick={() => testSource(s)} disabled={testing[s.id]}
                            style={{ fontFamily:MONO, fontSize:9, padding:'4px 10px', background:'rgba(200,146,42,0.08)', border:'1px solid rgba(200,146,42,0.25)', color:GOLD, cursor:'pointer' }}>
                            {testing[s.id] ? '⟳' : '▶ Run'}
                          </button>
                        )}
                        {s.url.startsWith('http') && (
                          <a href={s.url} target="_blank" rel="noreferrer"
                            style={{ fontFamily:MONO, fontSize:9, padding:'4px 10px', background:'transparent', border:'1px solid var(--border)', color:'#4b5563', textDecoration:'none' }}>↗</a>
                        )}
                        {tr && (
                          <span style={{ fontFamily:MONO, fontSize:9, padding:'4px 8px', background: tr.ok?'rgba(34,197,94,0.08)':'rgba(239,68,68,0.08)', color: tr.ok?'#22c55e':'#ef4444', border:`1px solid ${tr.ok?'rgba(34,197,94,0.3)':'rgba(239,68,68,0.3)'}` }}>
                            {tr.ok ? `✓ ${JSON.stringify(tr.data).slice(0,40)}` : `✗ ${tr.data?.error||'err'}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}

      {/* Stats footer */}
      <div style={{ marginTop:20, padding:'12px 16px', background:'var(--bg2)', border:'1px solid var(--border)', display:'flex', gap:24, flexWrap:'wrap' }}>
        {Object.entries(
          SOURCE_REGISTRY.reduce((acc, s) => { acc[s.type] = (acc[s.type]||0)+1; return acc }, {})
        ).map(([type, count]) => {
          const tc = TYPE_COLORS[type] || TYPE_COLORS.RSS
          return (
            <div key={type} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <span style={{ fontFamily:MONO, fontSize:9, padding:'2px 7px', background:tc.bg, color:tc.color }}>{type}</span>
              <span style={{ fontFamily:MONO, fontSize:11, color:'var(--text)' }}>{count}</span>
            </div>
          )
        })}
        <div style={{ marginLeft:'auto', fontFamily:MONO, fontSize:10, color:'#4b5563' }}>
          {SOURCE_REGISTRY.length} total sources · {activeCount} active
        </div>
      </div>
    </div>
  )
}
