'use client'
import { useState, useEffect, useCallback } from 'react'
import vercelConfig from '@/vercel.json'

// Complete DownRange page-to-cron dependency map
// Each entry: page URL, what data it shows, which crons feed it, revalidation
const SITE_MAP = [
  {
    section: 'Content',
    color: '#3b82f6',
    pages: [
      {
        url: '/news',
        title: 'News Feed',
        desc: 'Latest firearms & 2A news articles',
        revalidate: 60,
        crons: ['news (*/15min)', 'backfill-articles (hourly)', 'fetch-article-images (*/30min)', 'quality-rewrite (hourly)', 'image-fix (hourly)'],
        sanityType: 'newsArticle',
        dataSource: 'AmmoLand RSS, NRA, GOA WP API, PRNewswire',
      },
      {
        url: '/releases',
        title: 'Gun Releases',
        desc: 'New firearm manufacturer announcements',
        revalidate: 3600,
        crons: ['releases (every hour)', 'cron/releases (noon daily)', 'fetch-article-images (*/30min)'],
        sanityType: 'firearmRelease',
        dataSource: 'PRNewswire, manufacturer feeds, HTML scrapers',
      },
      {
        url: '/blog',
        title: 'Blog',
        desc: 'Editorial and opinion pieces',
        revalidate: 1800,
        crons: ['quality-rewrite (hourly)', 'image-fix (hourly)'],
        sanityType: 'blogPost',
        dataSource: 'Manual + AI rewrite',
      },
      {
        url: '/reviews',
        title: 'Reviews',
        desc: 'Gear and gun reviews',
        revalidate: 3600,
        crons: ['image-fix (hourly)'],
        sanityType: 'review',
        dataSource: 'Manual',
      },
      {
        url: '/video',
        title: 'Video',
        desc: 'YouTube channel feed',
        revalidate: 14400,
        crons: ['video (every 4h)'],
        sanityType: 'video',
        dataSource: 'YouTube RSS (TTAG, MrGunsGear, 9-Hole, Garand Thumb, etc.)',
      },
      {
        url: '/deals',
        title: 'Deals',
        desc: 'Live ammo and gear deals',
        revalidate: 1800,
        crons: ['gun-deals (*/30min)', 'reddit-deals (hourly)', 'web-deals (every 12h)', 'amazon-deals (every 6h)'],
        sanityType: 'gunDeal',
        dataSource: 'gun.deals RSS, r/gundeals RSS, Amazon PA/affiliate feeds',
      },
    ]
  },
  {
    section: 'Laws & Policy',
    color: '#60a5fa',
    pages: [
      {
        url: '/laws',
        title: 'Laws & Legislation',
        desc: 'Federal and state gun bills, ATF rules, SCOTUS',
        revalidate: 120,
        crons: ['laws (every 2h)', 'goa (every 2h)'],
        sanityType: 'legislation',
        dataSource: 'Congress.gov API, ATF RSS, LegiScan, GOA WordPress API, SCOTUSblog',
      },
      {
        url: '/state-hub',
        title: 'State Hub',
        desc: '50-state firearms law profiles',
        revalidate: 1800,
        crons: ['state (Sun 8am)', 'cron/ccw-update (Sun 5am)'],
        sanityType: 'stateProfile',
        dataSource: 'LegiScan API + AI law enrichment',
      },
      {
        url: '/ccw',
        title: 'CCW Reciprocity Map',
        desc: 'Interactive carry permit reciprocity map',
        revalidate: 604800,
        crons: ['cron/ccw-update (Sun 5am)'],
        sanityType: 'stateProfile',
        dataSource: 'AI-rewritten from ATF + AG sources',
      },
    ]
  },
  {
    section: 'Market & Prices',
    color: '#C8922A',
    pages: [
      {
        url: '/ammo/9mm',
        title: 'Ammo Guides',
        desc: 'Per-caliber ammo reference guide (static)',
        revalidate: 1800,
        crons: [],
        sanityType: '—',
        dataSource: 'Static editorial content',
      },
      {
        url: '/carry-insurance',
        title: 'CCW Insurance',
        desc: 'USCCA vs CCW Safe comparison',
        revalidate: 604800,
        crons: ['cron/carry-insurance (Mon 6am UTC)'],
        sanityType: 'static + AI scraped',
        dataSource: 'Official plan websites',
      },
    ]
  },
  {
    section: 'Intelligence',
    color: '#a78bfa',
    pages: [
      {
        url: '/admin → Intelligence Briefings',
        title: 'Daily Briefings',
        desc: 'AI competitor analysis, content gaps, recommendations',
        revalidate: 86400,
        crons: ['intelligence (1am UTC daily)'],
        sanityType: 'dailyBriefing',
        dataSource: 'Anthropic Claude Sonnet + web_search tool',
      },
    ]
  },
  {
    section: 'Tools & Utilities',
    color: '#22c55e',
    pages: [
      {
        url: '/nfa-tracker',
        title: 'NFA Tracker',
        desc: 'Form 4 suppressor/SBR wait times',
        revalidate: 86400,
        crons: ['nfa-wait-times (6am daily)'],
        sanityType: 'nfaWaitTime',
        dataSource: 'NFATracker.com scrape',
      },
      {
        url: '/compare/:guns',
        title: 'Gun Compare',
        desc: 'Head-to-head AI gun comparison',
        revalidate: 3600,
        crons: [],
        sanityType: 'none (AI on-demand)',
        dataSource: 'AI on-demand query',
      },
      {
        url: '/ffl-finder',
        title: 'FFL Finder',
        desc: 'Licensed dealer locator',
        revalidate: 86400,
        crons: [],
        sanityType: 'static (ATF data)',
        dataSource: 'ATF FFL list (monthly)',
      },
      {
        url: '/ranges',
        title: 'Range Finder',
        desc: 'Shooting ranges near you',
        revalidate: 86400,
        crons: [],
        sanityType: 'stateProfile.ranges',
        dataSource: 'Manual DB',
      },
    ]
  },
  {
    section: 'System / Health',
    color: '#6b7280',
    pages: [
      {
        url: '/api/site-health',
        title: 'Site Health',
        desc: 'Critical page uptime and response checks',
        revalidate: null,
        crons: ['site-health (8am, 2pm, 8pm UTC)'],
        sanityType: 'none',
        dataSource: 'Internal self-ping',
      },
      {
        url: '/admin',
        title: 'Admin Panel',
        desc: '7-section admin dashboard',
        revalidate: null,
        crons: ['cron-health (*/30min)'],
        sanityType: 'all',
        dataSource: 'Sanity CMS',
      },
    ]
  },
]

// Label + color metadata only. Schedules are NEVER hardcoded here — they are read
// straight from vercel.json (the single source of truth) so this panel cannot drift.
const CRON_META = {
  '/api/agent?feed=news':                 { label:'News',                color:'#3b82f6' },
  '/api/agent?feed=laws':                 { label:'Laws',                color:'#60a5fa' },
  '/api/agent?feed=goa':                  { label:'GOA',                 color:'#60a5fa' },
  '/api/agent?feed=video':                { label:'Video',               color:'#ef4444' },
  '/api/agent?feed=state':                { label:'State (weekly)',      color:'#22c55e' },
  '/api/agent?feed=outdoors':             { label:'Outdoors',            color:'#22c55e' },
  '/api/agent?feed=releases&phase=scrape':{ label:'Releases (scrape)',   color:'#C8922A' },
  '/api/cron/releases-process':           { label:'Releases (process)',  color:'#C8922A' },
  '/api/cron/weekly-gun-releases':        { label:'Weekly Releases',     color:'#C8922A' },
  '/api/cron/gun-deals':                  { label:'Gun Deals',           color:'#C8922A' },
  '/api/cron/reddit-deals':               { label:'Reddit Deals',        color:'#C8922A' },
  '/api/cron/web-deals':                  { label:'Web Deals',           color:'#C8922A' },
  '/api/cron/amazon-deals':               { label:'Amazon Deals',        color:'#C8922A' },
  '/api/cron/amazon-brands':              { label:'Amazon Brands',       color:'#C8922A' },
  '/api/cron/giveaways':                  { label:'Giveaways',           color:'#C8922A' },
  '/api/cron/blog-writer':                { label:'Blog Writer',         color:'#a78bfa' },
  '/api/cron/quality-rewrite':            { label:'Quality Rewrite',     color:'#a78bfa' },
  '/api/cron/copyright-review':           { label:'Copyright Review',    color:'#a78bfa' },
  '/api/cron/enrich-state-pages':         { label:'Enrich State Pages',  color:'#a78bfa' },
  '/api/cron/write-canada-articles':      { label:'Canada Writer',       color:'#a78bfa' },
  '/api/cron/write-brazil-articles':      { label:'Brazil Writer',       color:'#a78bfa' },
  '/api/intelligence':                    { label:'Intelligence',        color:'#a78bfa' },
  '/api/cron/nra-law-sync':               { label:'NRA Law Sync',        color:'#60a5fa' },
  '/api/cron/nra-law-sync-enhanced':      { label:'NRA Law Sync (enh.)', color:'#60a5fa' },
  '/api/cron/carry-insurance':            { label:'Insurance Check',     color:'#60a5fa' },
  '/api/cron/bible-update':               { label:'Bible Update',        color:'#60a5fa' },
  '/api/nfa-wait-times':                  { label:'NFA Wait Times',      color:'#6b7280' },
  '/api/admin/fetch-article-images':      { label:'Fetch OG Images',     color:'#6b7280' },
  '/api/admin/fix-images?batch=500&force=false&cron=1': { label:'Batch Fix Images', color:'#6b7280' },
  '/api/cron/image-fix':                  { label:'Image Fix',           color:'#6b7280' },
  '/api/cron/fix-placeholder-images':     { label:'Fix Placeholders',    color:'#6b7280' },
  '/api/cron/fix-slugs':                  { label:'Fix Slugs',           color:'#6b7280' },
  '/api/cron/sitemap':                    { label:'Sitemap',             color:'#6b7280' },
  '/api/cron/sitemap-health':             { label:'Sitemap Health',      color:'#22c55e' },
  '/api/admin/cron-health':               { label:'Cron Health',         color:'#22c55e' },
  '/api/site-health':                     { label:'Site Health',         color:'#22c55e' },
  '/api/admin/backup':                    { label:'Backup',              color:'#6b7280' },
  '/api/newsletter':                      { label:'Newsletter (build)',  color:'#f59e0b' },
  '/api/newsletter/send':                 { label:'Newsletter (send)',   color:'#f59e0b' },
  '/api/outreach/queue/digest':           { label:'Outreach Digest',     color:'#f59e0b' },
  '/api/social/cron/bluesky':             { label:'Social: Bluesky',     color:'#f59e0b' },
  '/api/social/cron/twitter':             { label:'Social: Twitter',     color:'#f59e0b' },
  '/api/social/cron/facebook':            { label:'Social: Facebook',    color:'#f59e0b' },
  '/api/social/cron/threads':             { label:'Social: Threads',     color:'#f59e0b' },
  '/api/social/cron/reddit':              { label:'Social: Reddit',      color:'#f59e0b' },
  '/api/social/analytics?refresh=1':      { label:'Social Analytics',    color:'#f59e0b' },
}

function labelFromPath(path) {
  const q = path.includes('feed=') ? path.split('feed=')[1].split('&')[0] : path.split('?')[0].split('/').pop()
  return q.replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
}

// Derived from vercel.json at build time — always in sync with what actually runs.
const ALL_CRONS = (vercelConfig.crons || []).map(c => ({
  path: c.path,
  schedule: c.schedule,
  label: (CRON_META[c.path] || {}).label || labelFromPath(c.path),
  color: (CRON_META[c.path] || {}).color || '#6b7280',
}))

function fmtRevalidate(s) {
  if (!s) return '—'
  if (s < 120)    return s + 's'
  if (s < 3600)   return Math.round(s/60) + 'min'
  if (s < 86400)  return Math.round(s/3600) + 'h'
  return Math.round(s/86400) + 'd'
}

export default function SiteMapPanel({ adminKey }) {
  const [cronStatus, setCronStatus]   = useState({})
  const [loading, setLoading]         = useState(true)
  const [expanded, setExpanded]       = useState(null)
  const [viewMode, setViewMode]       = useState('pages') // pages | crons
  const [filterSection, setFilter]    = useState('all')

  const mono   = "'IBM Plex Mono',monospace"
  const bebas  = "'Bebas Neue',cursive"
  const barlow = "'Barlow Condensed',sans-serif"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch cron status from cron dashboard API
      const res = await fetch('/api/admin/cron-status', {
        headers: { 'x-admin-key': adminKey }
      })
      const d = await res.json()
      // Build a map of cronPath → lastRun status
      const statusMap = {}
      for (const job of (d.jobs || [])) {
        statusMap[job.path] = job
      }
      setCronStatus(statusMap)
    } catch { /* non-critical */ }
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  function getCronHealth(cronPaths) {
    // Check if any of the named crons have recent failures
    let lastRun = null, lastStatus = 'never', recentFail = false
    for (const label of cronPaths) {
      // Match by label partial match
      for (const [path, job] of Object.entries(cronStatus)) {
        if (path.includes(label.split(' ')[0]) || label.includes(path.split('?')[1] || path.split('/').pop())) {
          if (!lastRun || new Date(job.lastRun) > new Date(lastRun)) {
            lastRun = job.lastRun
            lastStatus = job.lastStatus
          }
          if (job.lastStatus === 'failed') recentFail = true
        }
      }
    }
    return { lastRun, lastStatus, recentFail }
  }

  function StatusDot({ status }) {
    const colors = { success:'#22c55e', failed:'#ef4444', running:'#3b82f6', never:'#4b5563', warning:'#f59e0b' }
    const color = colors[status] || colors.never
    return (
      <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background:color,
        boxShadow: status === 'success' ? '0 0 4px #22c55e44' : status === 'failed' ? '0 0 4px #ef444444' : 'none' }} />
    )
  }

  const allSections = ['all', ...SITE_MAP.map(s => s.section)]
  const filtered = SITE_MAP.filter(s => filterSection === 'all' || s.section === filterSection)
  const allPages = SITE_MAP.flatMap(s => s.pages)
  const totalCrons = ALL_CRONS.length

  return (
    <div style={{ fontFamily:mono }}>
      <div className="panel-title">🗺️ Site Map & Data Flow</div>
      <div className="panel-sub">Every page, its cron dependencies, revalidation window, and last-run health. Your complete infrastructure at a glance.</div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
        {[
          { n: allPages.length, label:'PAGES TRACKED', color:'#C8922A' },
          { n: totalCrons,      label:'ACTIVE CRONS',  color:'#22c55e' },
          { n: SITE_MAP.length, label:'SECTIONS',      color:'#60a5fa' },
          { n: allPages.filter(p => p.crons.length > 0).length, label:'CRON-DEPENDENT', color:'#a78bfa' },
        ].map(s => (
          <div key={s.label} style={{ padding:'14px 16px', background:'var(--bg2)', border:'1px solid var(--border)', textAlign:'center' }}>
            <div style={{ fontFamily:bebas, fontSize:'2rem', color:s.color, lineHeight:1 }}>{s.n}</div>
            <div style={{ fontFamily:mono, fontSize:8, color:'#6b7280', letterSpacing:'.08em', marginTop:3 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* View toggle + filter */}
      <div style={{ display:'flex', gap:8, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        {['pages','crons'].map(m => (
          <button key={m} onClick={()=>setViewMode(m)}
            style={{ fontFamily:barlow, fontSize:12, fontWeight:700, letterSpacing:'.06em',
              padding:'6px 14px', border:`1px solid ${viewMode===m?'#C8922A':'var(--border)'}`,
              background: viewMode===m?'rgba(200,146,42,.1)':'transparent',
              color: viewMode===m?'#C8922A':'#6b7280', cursor:'pointer', textTransform:'uppercase' }}>
            {m === 'pages' ? '📄 Pages View' : '⏱ Crons View'}
          </button>
        ))}
        {viewMode === 'pages' && (
          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginLeft:'auto' }}>
            {allSections.map(s => (
              <button key={s} onClick={()=>setFilter(s)}
                style={{ fontFamily:mono, fontSize:9, padding:'3px 8px',
                  border:`1px solid ${filterSection===s?'#C8922A':'var(--border)'}`,
                  background: filterSection===s?'rgba(200,146,42,.1)':'transparent',
                  color: filterSection===s?'#C8922A':'#6b7280', cursor:'pointer' }}>
                {s}
              </button>
            ))}
          </div>
        )}
        <button onClick={load} style={{ fontFamily:mono, fontSize:9, padding:'4px 10px', border:'1px solid var(--border)', background:'transparent', color:'#6b7280', cursor:'pointer' }}>
          ↻ Refresh
        </button>
      </div>

      {/* ── PAGES VIEW ── */}
      {viewMode === 'pages' && filtered.map(section => (
        <div key={section.section} style={{ marginBottom:24 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10, paddingBottom:6, borderBottom:`1px solid ${section.color}30` }}>
            <div style={{ width:3, height:16, background:section.color, flexShrink:0 }} />
            <span style={{ fontFamily:barlow, fontSize:13, fontWeight:700, color:section.color, letterSpacing:'.06em' }}>
              {section.section.toUpperCase()}
            </span>
            <span style={{ fontFamily:mono, fontSize:9, color:'#4b5563' }}>({section.pages.length} pages)</span>
          </div>

          {section.pages.map(page => {
            const health = getCronHealth(page.crons)
            const isOpen = expanded === page.url

            return (
              <div key={page.url}
                onClick={() => setExpanded(isOpen ? null : page.url)}
                style={{ marginBottom:4, background: isOpen ? 'rgba(200,146,42,.04)' : 'var(--bg2)',
                  border:`1px solid ${isOpen ? 'rgba(200,146,42,.3)' : 'var(--border)'}`,
                  cursor:'pointer', transition:'all .15s' }}>

                {/* Row */}
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px' }}>
                  <StatusDot status={page.crons.length === 0 ? 'never' : health.lastStatus || 'never'} />

                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                      <span style={{ fontFamily:barlow, fontSize:13, fontWeight:600, color:'var(--text)' }}>
                        {page.title}
                      </span>
                      <span style={{ fontFamily:mono, fontSize:9, color:section.color }}>
                        {page.url}
                      </span>
                    </div>
                    <div style={{ fontFamily:mono, fontSize:9, color:'#6b7280', marginTop:1 }}>{page.desc}</div>
                  </div>

                  <div style={{ flexShrink:0, display:'flex', gap:8, alignItems:'center' }}>
                    {/* Revalidate */}
                    <span style={{ fontFamily:mono, fontSize:9, padding:'2px 6px', background:'rgba(100,116,139,.1)', color:'#64748b' }}>
                      ⏱ {fmtRevalidate(page.revalidate)}
                    </span>

                    {/* Cron count */}
                    <span style={{ fontFamily:mono, fontSize:9, padding:'2px 6px',
                      background: page.crons.length > 0 ? 'rgba(34,197,94,.1)' : 'rgba(75,85,99,.1)',
                      color: page.crons.length > 0 ? '#22c55e' : '#4b5563' }}>
                      {page.crons.length > 0 ? page.crons.length + ' cron' + (page.crons.length > 1 ? 's' : '') : 'static'}
                    </span>

                    <span style={{ fontFamily:mono, fontSize:10, color:'#4b5563' }}>
                      {isOpen ? '▲' : '▼'}
                    </span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isOpen && (
                  <div style={{ padding:'12px 14px 14px', borderTop:'1px solid rgba(200,146,42,.15)',
                    display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
                    <div>
                      <div style={{ fontFamily:mono, fontSize:9, color:'#C8922A', letterSpacing:'.08em', marginBottom:6 }}>CRON DEPENDENCIES</div>
                      {page.crons.length === 0
                        ? <div style={{ fontFamily:mono, fontSize:10, color:'#4b5563' }}>No cron dependencies (static/on-demand)</div>
                        : page.crons.map(c => (
                          <div key={c} style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                            <span style={{ fontSize:10 }}>⏰</span>
                            <span style={{ fontFamily:mono, fontSize:10, color:'#9ca3af' }}>{c}</span>
                          </div>
                        ))
                      }
                    </div>
                    <div>
                      <div style={{ fontFamily:mono, fontSize:9, color:'#C8922A', letterSpacing:'.08em', marginBottom:6 }}>DATA SOURCE</div>
                      <div style={{ fontFamily:mono, fontSize:10, color:'#9ca3af', lineHeight:1.6 }}>{page.dataSource}</div>
                      <div style={{ fontFamily:mono, fontSize:9, color:'#4b5563', marginTop:8 }}>
                        Sanity type: <span style={{color:'#6b7280'}}>{page.sanityType}</span>
                      </div>
                      {page.revalidate && (
                        <div style={{ fontFamily:mono, fontSize:9, color:'#4b5563', marginTop:4 }}>
                          Next.js revalidate: <span style={{color:'#6b7280'}}>{fmtRevalidate(page.revalidate)}</span>
                        </div>
                      )}
                    </div>
                    <div style={{ gridColumn:'1/-1' }}>
                      <a href={page.url.startsWith('/admin') ? '/admin' : page.url}
                        target="_blank" rel="noreferrer"
                        onClick={e => e.stopPropagation()}
                        style={{ fontFamily:mono, fontSize:10, color:'#C8922A', textDecoration:'none', border:'1px solid rgba(200,146,42,.3)', padding:'4px 10px', display:'inline-block' }}>
                        View Page ↗
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      ))}

      {/* ── CRONS VIEW ── */}
      {viewMode === 'crons' && (
        <div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:mono, fontSize:11 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid var(--border)' }}>
                  {['Status','Cron Job','Schedule','Last Run','Pages Fed'].map(h => (
                    <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#C8922A', fontSize:9, letterSpacing:'.08em', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_CRONS.map((c, i) => {
                  const job = Object.values(cronStatus).find(j => j.path === c.path || j.name === c.label)
                  const status = job?.lastStatus || 'never'
                  // Find pages that depend on this cron
                  const deps = allPages.filter(p => p.crons.some(cr => cr.includes(c.label.split(' ')[0].toLowerCase()) || cr.includes(c.path.split('/').pop()))).map(p => p.title)

                  return (
                    <tr key={c.path + c.schedule} style={{ borderBottom:'1px solid rgba(30,41,59,.4)', background:i%2===0?'transparent':'rgba(255,255,255,.01)' }}>
                      <td style={{ padding:'8px 12px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                          <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%',
                            background: status==='success'?'#22c55e':status==='failed'?'#ef4444':'#4b5563' }} />
                          <span style={{ fontFamily:mono, fontSize:9, color: status==='success'?'#22c55e':status==='failed'?'#ef4444':'#4b5563' }}>
                            {status.toUpperCase()}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <div style={{ fontFamily:barlow, fontSize:12, fontWeight:600, color: c.color }}>{c.label}</div>
                        <div style={{ fontFamily:mono, fontSize:8, color:'#4b5563', marginTop:1 }}>{c.path}</div>
                      </td>
                      <td style={{ padding:'8px 12px', color:'#9ca3af', fontSize:10 }}>{c.schedule}</td>
                      <td style={{ padding:'8px 12px', color:'#6b7280', fontSize:9 }}>
                        {job?.lastRun ? new Date(job.lastRun).toLocaleString('en-US', {month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}) : '—'}
                      </td>
                      <td style={{ padding:'8px 12px' }}>
                        <div style={{ display:'flex', gap:3, flexWrap:'wrap' }}>
                          {deps.slice(0,3).map(d => (
                            <span key={d} style={{ fontFamily:mono, fontSize:8, padding:'1px 5px', background:'rgba(100,116,139,.1)', color:'#64748b' }}>{d}</span>
                          ))}
                          {deps.length > 3 && <span style={{ fontFamily:mono, fontSize:8, color:'#4b5563' }}>+{deps.length-3}</span>}
                          {deps.length === 0 && <span style={{ fontFamily:mono, fontSize:8, color:'#374151' }}>—</span>}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
