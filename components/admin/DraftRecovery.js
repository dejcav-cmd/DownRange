'use client'
import { useState, useEffect, useCallback } from 'react'

const GOLD  = '#C8922A'
const MONO  = "'IBM Plex Mono',monospace"
const BEBAS = "'Bebas Neue',cursive"
const BARLOW= "'Barlow Condensed',sans-serif"

const STATUS_COLOR = {
  draft:       { bg:'rgba(245,158,11,.12)', text:'#f59e0b', label:'Draft' },
  review:      { bg:'rgba(59,130,246,.12)', text:'#3b82f6', label:'In Review' },
  published:   { bg:'rgba(34,197,94,.12)',  text:'#22c55e', label:'Published' },
  unpublished: { bg:'rgba(107,114,128,.12)',text:'#6b7280', label:'Unpublished' },
  archived:    { bg:'rgba(107,114,128,.12)',text:'#6b7280', label:'Archived' },
  'no-status': { bg:'rgba(239,68,68,.12)',  text:'#ef4444', label:'Unknown' },
}

const TYPE_COLOR = {
  blogPost:       { text:'#a78bfa', label:'Blog Post' },
  newsArticle:    { text: GOLD,     label:'News Article' },
  firearmRelease: { text:'#38bdf8', label:'Release' },
  'sanity-draft': { text:'#fb923c', label:'Sanity Draft' },
}

const CSS = `
.dr-wrap{padding:0;background:#09090B;min-height:100%}
.dr-topbar{padding:14px 24px;border-bottom:1px solid var(--border);display:flex;align-items:center;gap:12px;flex-wrap:wrap;background:#0A0B0C;position:sticky;top:0;z-index:10}
.dr-title{font-family:${BEBAS};font-size:1.3rem;color:${GOLD};letter-spacing:.06em}
.dr-stats{display:flex;gap:12px;padding:16px 24px;border-bottom:1px solid var(--border);flex-wrap:wrap;background:rgba(0,0,0,.3)}
.dr-stat{background:var(--bg2);border:1px solid var(--border);padding:12px 18px;min-width:100px}
.dr-stat-val{font-family:${BEBAS};font-size:1.8rem;line-height:1}
.dr-stat-label{font-family:${MONO};font-size:9px;color:#4b5563;margin-top:2px;text-transform:uppercase;letter-spacing:.06em}
.dr-tabs{display:flex;border-bottom:1px solid var(--border);padding:0 24px;background:#0A0B0C}
.dr-tab{background:none;border:none;border-bottom:2px solid transparent;font-family:${BARLOW};font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:10px 16px;cursor:pointer;color:var(--text-dim);transition:all .12s;white-space:nowrap}
.dr-tab.active{color:${GOLD};border-bottom-color:${GOLD}}
.dr-tab:hover:not(.active){color:var(--text)}
.dr-table{width:100%;border-collapse:collapse}
.dr-table th{font-family:${MONO};font-size:9px;color:#4b5563;letter-spacing:.1em;text-transform:uppercase;padding:10px 16px;border-bottom:1px solid var(--border);text-align:left;background:var(--bg2);position:sticky;top:0;z-index:1;white-space:nowrap}
.dr-table td{padding:10px 16px;border-bottom:1px solid rgba(30,41,59,.4);font-size:12px;vertical-align:middle}
.dr-table tr:hover td{background:rgba(200,146,42,.04)}
.dr-badge{display:inline-block;font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.06em;padding:2px 7px;text-transform:uppercase;border-radius:2px}
.dr-btn{background:${GOLD};color:#000;border:none;font-family:${BARLOW};font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:6px 12px;cursor:pointer;transition:opacity .12s;white-space:nowrap}
.dr-btn:hover{opacity:.85}
.dr-btn:disabled{opacity:.4;cursor:not-allowed}
.dr-btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:${MONO};font-size:10px;padding:5px 10px;cursor:pointer;transition:all .12s}
.dr-btn-ghost:hover{border-color:${GOLD};color:${GOLD}}
.dr-btn-danger{background:rgba(239,68,68,.15);border:1px solid #ef4444;color:#ef4444;font-family:${MONO};font-size:10px;padding:5px 10px;cursor:pointer}
.dr-empty{text-align:center;padding:60px;font-family:${MONO};font-size:12px;color:#374151}
.dr-preview{background:#0A0B0C;border:1px solid var(--border);padding:16px;margin-top:8px;max-height:200px;overflow-y:auto}
.dr-alert{padding:10px 16px;font-family:${MONO};font-size:11px;border-left:3px solid}
.dr-alert.success{background:rgba(34,197,94,.08);border-color:#22c55e;color:#22c55e}
.dr-alert.error{background:rgba(239,68,68,.08);border-color:#ef4444;color:#ef4444}
.dr-alert.info{background:rgba(200,146,42,.08);border-color:${GOLD};color:${GOLD}}
`

export default function DraftRecovery({ adminKey }) {
  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(false)
  const [tab, setTab]         = useState('blog-drafts')
  const [flash, setFlash]     = useState(null)
  const [expanded, setExpanded] = useState(null)
  const [acting, setActing]   = useState(new Set())

  const load = useCallback(async () => {
    setLoading(true)
    setFlash(null)
    try {
      const res = await fetch('/api/admin/drafts', { headers: H })
      const d   = await res.json()
      if (!d.ok) throw new Error(d.error)
      setData(d)
    } catch (e) {
      setFlash({ type: 'error', msg: 'Failed to load: ' + e.message })
    }
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  const act = async (action, id, type) => {
    setActing(prev => new Set([...prev, id]))
    try {
      const res = await fetch('/api/admin/drafts', {
        method: 'POST', headers: H,
        body: JSON.stringify({ action, id, type })
      })
      const d = await res.json()
      if (!d.ok) throw new Error(d.error)
      setFlash({ type: 'success', msg: `✅ ${action === 'publish' ? 'Published' : action === 'delete' ? 'Deleted' : 'Done'}: ${id.slice(0,20)}…` })
      load()
    } catch (e) {
      setFlash({ type: 'error', msg: `❌ ${action} failed: ` + e.message })
    }
    setActing(prev => { const n = new Set(prev); n.delete(id); return n })
  }

  const publishAll = async (items) => {
    setFlash({ type: 'info', msg: `Publishing ${items.length} items…` })
    let done = 0
    for (const item of items) {
      try {
        await fetch('/api/admin/drafts', {
          method: 'POST', headers: H,
          body: JSON.stringify({ action: 'publish', id: item._id })
        })
        done++
      } catch {}
    }
    setFlash({ type: 'success', msg: `✅ Published ${done}/${items.length} items` })
    load()
  }

  const s    = data?.summary || {}
  const tabs = [
    { id:'blog-drafts',  label:'Blog Drafts',      count: data?.blogDrafts?.length || 0,        color: data?.blogDrafts?.length ? '#f59e0b' : '#374151' },
    { id:'blog-all',     label:'All Blog Posts',   count: data?.blogPublished?.length || 0,      color: '#374151' },
    { id:'news-unapproved', label:'Unapproved News', count: data?.unapprovedNews?.length || 0,   color: data?.unapprovedNews?.length > 0 ? '#ef4444' : '#374151' },
    { id:'releases',     label:'Unapproved Releases', count: data?.unapprovedReleases?.length || 0, color: '#374151' },
    { id:'sanity-drafts', label:'Sanity Drafts',   count: data?.sanityDrafts?.length || 0,       color: data?.sanityDrafts?.length ? '#fb923c' : '#374151' },
  ]

  const currentItems = {
    'blog-drafts':    data?.blogDrafts      || [],
    'blog-all':       data?.blogPublished   || [],
    'news-unapproved': data?.unapprovedNews || [],
    'releases':       data?.unapprovedReleases || [],
    'sanity-drafts':  data?.sanityDrafts    || [],
  }[tab] || []

  function renderRow(item, isNews) {
    const status = item.status || (item.approved ? 'published' : 'draft') || 'no-status'
    const sc = STATUS_COLOR[status] || STATUS_COLOR['no-status']
    const tc = TYPE_COLOR[item._type] || TYPE_COLOR['newsArticle']
    const isExpanded = expanded === item._id
    const isActing = acting.has(item._id)
    const wordCount = item.body ? item.body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length : 0
    const isDraft = item._id?.startsWith('drafts.')

    return (
      <>
        <tr key={item._id} style={{ cursor:'pointer' }} onClick={() => setExpanded(isExpanded ? null : item._id)}>
          <td>
            <div style={{ fontFamily:BARLOW, fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2 }}>
              {item.title || '(no title)'}
            </div>
            <div style={{ fontFamily:MONO, fontSize:9, color:'#374151' }}>
              {item._id?.slice(0, 30)}… · {wordCount > 0 ? wordCount + 'w' : 'no body'}
            </div>
          </td>
          <td>
            <span className="dr-badge" style={{ background: tc.text + '22', color: tc.text }}>{tc.label}</span>
          </td>
          <td>
            <span className="dr-badge" style={{ background: sc.bg, color: sc.text }}>{sc.label}</span>
          </td>
          <td style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>
            {item._createdAt ? new Date(item._createdAt).toLocaleDateString() : '—'}
          </td>
          <td style={{ fontFamily:MONO, fontSize:10, color:'#4b5563' }}>
            {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : <span style={{color:'#f59e0b'}}>Unpublished</span>}
          </td>
          <td>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
              {(status === 'draft' || status === 'review' || !item.approved) && (
                <button className="dr-btn" disabled={isActing}
                  onClick={(e) => { e.stopPropagation(); act('publish', item._id) }}>
                  {isActing ? '⏳' : '▶ Publish'}
                </button>
              )}
              {isDraft && (
                <button className="dr-btn" disabled={isActing} style={{ background:'#3b82f6', color:'#fff' }}
                  onClick={(e) => { e.stopPropagation(); act('publish-draft', item._id) }}>
                  {isActing ? '⏳' : '↑ Promote'}
                </button>
              )}
              {item.slug?.current && (
                <a href={`/${item._type === 'blogPost' ? 'blog' : 'news'}/${item.slug?.current || item.slug}`}
                  target="_blank" rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}>
                  <button className="dr-btn-ghost">↗ View</button>
                </a>
              )}
              <button className="dr-btn-danger" disabled={isActing}
                onClick={(e) => { e.stopPropagation(); if(window.confirm('Delete this item?')) act('delete', item._id) }}>
                🗑
              </button>
            </div>
          </td>
        </tr>
        {isExpanded && (
          <tr>
            <td colSpan={6} style={{ padding:'0 16px 16px', background:'rgba(0,0,0,.3)' }}>
              <div className="dr-preview">
                {item.excerpt && <p style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', marginBottom:8 }}><strong>Excerpt:</strong> {item.excerpt}</p>}
                {item.summary && <p style={{ fontFamily:MONO, fontSize:11, color:'#9ca3af', marginBottom:8 }}><strong>Summary:</strong> {item.summary}</p>}
                {item.body ? (
                  <div style={{ fontFamily:MONO, fontSize:10, color:'#6b7280', lineHeight:1.6 }}
                    dangerouslySetInnerHTML={{ __html: item.body?.slice(0, 800) + (item.body?.length > 800 ? '…' : '') }} />
                ) : (
                  <div style={{ fontFamily:MONO, fontSize:11, color:'#374151' }}>No body content</div>
                )}
              </div>
            </td>
          </tr>
        )}
      </>
    )
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="dr-wrap">

        {/* Topbar */}
        <div className="dr-topbar">
          <div className="dr-title">DRAFT RECOVERY</div>
          <div style={{ fontFamily:MONO, fontSize:10, color:'#374151' }}>
            Find and restore disappeared drafts across all content types
          </div>
          <div style={{ flex:1 }} />
          <button className="dr-btn-ghost" onClick={load} disabled={loading}>
            {loading ? '⏳ Scanning…' : '↻ Rescan'}
          </button>
        </div>

        {flash && (
          <div className={`dr-alert ${flash.type}`} style={{ margin:'12px 24px' }}>
            {flash.msg}
          </div>
        )}

        {/* Stats */}
        {data && (
          <div className="dr-stats">
            <div className="dr-stat">
              <div className="dr-stat-val" style={{ color: data.blogDrafts?.length ? '#f59e0b' : '#374151' }}>
                {data.blogDrafts?.length || 0}
              </div>
              <div className="dr-stat-label">Blog Drafts</div>
            </div>
            <div className="dr-stat">
              <div className="dr-stat-val" style={{ color: GOLD }}>{data.blogPublished?.length || 0}</div>
              <div className="dr-stat-label">Blog Published</div>
            </div>
            <div className="dr-stat">
              <div className="dr-stat-val" style={{ color: data.unapprovedNews?.length ? '#ef4444' : '#374151' }}>
                {data.unapprovedNews?.length || 0}
              </div>
              <div className="dr-stat-label">Unapproved News</div>
            </div>
            <div className="dr-stat">
              <div className="dr-stat-val" style={{ color: data.sanityDrafts?.length ? '#fb923c' : '#374151' }}>
                {data.sanityDrafts?.length || 0}
              </div>
              <div className="dr-stat-label">Sanity Drafts</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="dr-tabs">
          {tabs.map(t => (
            <button key={t.id} className={`dr-tab${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
              {t.label}
              {t.count > 0 && (
                <span style={{ marginLeft:6, fontFamily:MONO, fontSize:9, color: tab === t.id ? GOLD : t.color,
                  background: t.color + '22', padding:'1px 5px', borderRadius:2 }}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflow:'auto' }}>
          {loading ? (
            <div className="dr-empty">⏳ Scanning Sanity for all draft content…</div>
          ) : currentItems.length === 0 ? (
            <div className="dr-empty">
              {tab === 'blog-drafts' ? '✅ No blog drafts found — all posts are published.' : 'No items in this category.'}
            </div>
          ) : (
            <>
              {tab === 'blog-drafts' && currentItems.length > 0 && (
                <div style={{ padding:'12px 24px', borderBottom:'1px solid var(--border)', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <div style={{ fontFamily:MONO, fontSize:11, color:'#f59e0b' }}>
                    ⚠ {currentItems.length} blog draft{currentItems.length > 1 ? 's' : ''} found — not visible on the site
                  </div>
                  <button className="dr-btn" onClick={() => publishAll(currentItems)}>
                    ▶ Publish All {currentItems.length} Drafts
                  </button>
                </div>
              )}
              <table className="dr-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Published</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map(item => renderRow(item))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </>
  )
}
