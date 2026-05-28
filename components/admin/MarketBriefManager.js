'use client'
import { useState, useEffect, useCallback } from 'react'

const SIGNAL_COLORS = { BUY:'#22c55e', HOLD:'#f59e0b', WATCH:'#60a5fa', SELL:'#ef4444' }
const SIGNAL_BG     = { BUY:'rgba(34,197,94,.12)', HOLD:'rgba(245,158,11,.12)', WATCH:'rgba(96,165,250,.12)', SELL:'rgba(239,68,68,.12)' }

function fmt(d) {
  if (!d) return '—'
  const dt = new Date(d)
  return dt.toLocaleString('en-US', { month:'short', day:'numeric', hour:'2-digit', minute:'2-digit' })
}
function ago(d) {
  if (!d) return 'never'
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 2)    return 'just now'
  if (m < 60)   return m + 'm ago'
  if (m < 1440) return Math.floor(m/60) + 'h ago'
  return Math.floor(m/1440) + 'd ago'
}

export default function MarketBriefManager({ adminKey }) {
  const [briefs, setBriefs]         = useState([])
  const [prices, setPrices]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [running, setRunning]       = useState(false)
  const [msg, setMsg]               = useState('')
  const [expanded, setExpanded]     = useState(null)
  const [editId, setEditId]         = useState(null)
  const [editData, setEditData]     = useState({})

  const mono   = "'IBM Plex Mono',monospace"
  const bebas  = "'Bebas Neue',cursive"
  const barlow = "'Barlow Condensed',sans-serif"

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [rb, rp] = await Promise.all([
        fetch('/api/admin/market-brief-list', { headers: { 'x-admin-key': adminKey } }),
        fetch('/api/admin/ammo-prices', { headers: { 'x-admin-key': adminKey } }),
      ])
      const db = await rb.json().catch(() => ({}))
      const dp = await rp.json().catch(() => ({}))
      setBriefs(db.briefs || [])
      setPrices(dp.prices || [])
    } catch (e) {
      setMsg('⚠ Failed to load: ' + e.message)
    }
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  async function triggerBrief() {
    setRunning(true)
    setMsg('⏳ Generating market brief...')
    try {
      const res = await fetch('/api/cron/market-brief?force=1', {
        headers: { 'x-admin-key': adminKey }
      })
      const d = await res.json()
      if (d.ok) {
        setMsg('✅ Brief generated: ' + d.brief)
        await load()
      } else {
        setMsg('⚠ ' + (d.error || 'Generation failed'))
      }
    } catch (e) {
      setMsg('⚠ ' + e.message)
    }
    setRunning(false)
  }

  async function deleteBrief(id) {
    if (!confirm('Delete this brief?')) return
    try {
      const res = await fetch('/api/admin/market-brief?id=' + id, {
        method: 'DELETE', headers: { 'x-admin-key': adminKey }
      })
      const d = await res.json()
      if (d.ok) { setMsg('✓ Deleted'); load() }
    } catch (e) { setMsg('⚠ ' + e.message) }
  }

  async function saveBrief() {
    if (!editId) return
    try {
      const res = await fetch('/api/admin/market-brief', {
        method: 'PATCH',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editId, data: editData }),
      })
      const d = await res.json()
      if (d.ok) { setMsg('✓ Saved'); setEditId(null); load() }
      else setMsg('⚠ ' + d.error)
    } catch (e) { setMsg('⚠ ' + e.message) }
  }

  const latest = briefs[0]

  return (
    <div style={{ fontFamily:mono }}>
      <div className="panel-title">📊 Market Brief Manager</div>
      <div className="panel-sub">AI-generated ammo market analysis. Runs automatically at 6am + 6pm UTC. Manually trigger anytime.</div>

      {msg && (
        <div style={{ margin:'0 0 16px', padding:'10px 14px', background: msg.startsWith('✅') ? 'rgba(34,197,94,.1)' : msg.startsWith('⚠') ? 'rgba(239,68,68,.08)' : 'rgba(200,146,42,.08)',
          border:`1px solid ${msg.startsWith('✅')?'rgba(34,197,94,.3)':msg.startsWith('⚠')?'rgba(239,68,68,.3)':'rgba(200,146,42,.3)'}`,
          fontFamily:mono, fontSize:11, color: msg.startsWith('✅')?'#22c55e':msg.startsWith('⚠')?'#ef4444':'#C8922A' }}>
          {msg}
        </div>
      )}

      {/* Controls row */}
      <div style={{ display:'flex', gap:10, marginBottom:20, flexWrap:'wrap', alignItems:'center' }}>
        <button onClick={triggerBrief} disabled={running}
          style={{ fontFamily:barlow, fontSize:13, fontWeight:700, letterSpacing:'.06em', background: running ? '#374151' : 'var(--gold)',
            color: running ? '#6b7280' : '#000', border:'none', padding:'10px 20px', cursor: running ? 'not-allowed' : 'pointer' }}>
          {running ? '⏳ GENERATING...' : '⚡ GENERATE NOW'}
        </button>
        <button onClick={load} style={{ fontFamily:mono, fontSize:10, background:'none', border:'1px solid var(--border)', color:'#9ca3af', padding:'8px 14px', cursor:'pointer' }}>
          ↻ Refresh
        </button>
        <span style={{ fontFamily:mono, fontSize:10, color:'#4b5563', marginLeft:'auto' }}>
          Next auto-run: 6am UTC or 6pm UTC · Last: {latest ? ago(latest.publishedAt) : 'never'}
        </span>
      </div>

      {/* Cron schedule display */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:20 }}>
        {[
          { label:'AM BRIEF', time:'06:00 UTC / 02:00 EST', icon:'🌅', desc:'Morning market open signal' },
          { label:'PM BRIEF', time:'18:00 UTC / 14:00 EST', icon:'🌆', desc:'Afternoon closing signal' },
        ].map(s => (
          <div key={s.label} style={{ padding:'14px 16px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4 }}>
              <span style={{ fontSize:16 }}>{s.icon}</span>
              <span style={{ fontFamily:barlow, fontSize:12, fontWeight:700, color:'#C8922A', letterSpacing:'.06em' }}>{s.label}</span>
            </div>
            <div style={{ fontFamily:mono, fontSize:10, color:'#6b7280' }}>{s.time}</div>
            <div style={{ fontFamily:mono, fontSize:9, color:'#4b5563', marginTop:3 }}>{s.desc}</div>
          </div>
        ))}
      </div>

      {/* Latest Brief highlight */}
      {latest && !editId && (
        <div style={{ marginBottom:24, padding:20, background:'var(--bg2)', border:'1px solid rgba(200,146,42,.3)', borderLeft:'3px solid #C8922A' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12, flexWrap:'wrap', marginBottom:12 }}>
            <div>
              <div style={{ fontFamily:mono, fontSize:9, color:'#C8922A', letterSpacing:'.1em', marginBottom:4 }}>
                LATEST BRIEF · {latest.session || 'AM'} · {fmt(latest.publishedAt)}
              </div>
              <div style={{ fontFamily:bebas, fontSize:'1.6rem', color:'var(--text)', letterSpacing:'.04em', lineHeight:1.1 }}>
                {latest.title}
              </div>
            </div>
            {latest.signal && (
              <div style={{ padding:'8px 16px', background:SIGNAL_BG[latest.signal], border:`1px solid ${SIGNAL_COLORS[latest.signal]}40`,
                fontFamily:bebas, fontSize:'1.4rem', color:SIGNAL_COLORS[latest.signal], letterSpacing:'.06em', flexShrink:0 }}>
                {latest.signal}
              </div>
            )}
          </div>
          {latest.summary && (
            <p style={{ fontFamily:mono, fontSize:11, color:'#9ca3af', lineHeight:1.7, margin:'0 0 12px' }}>{latest.summary}</p>
          )}
          {latest.signalReason && (
            <div style={{ fontFamily:mono, fontSize:10, color:'#6b7280', padding:'8px 12px', background:'rgba(0,0,0,.3)', borderLeft:'2px solid #374151' }}>
              {latest.signalReason}
            </div>
          )}
          {latest.bullets?.length > 0 && (
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginTop:12 }}>
              {latest.bullets.map((b,i) => (
                <div key={i} style={{ fontFamily:mono, fontSize:10, color:'#64748b', paddingLeft:14, position:'relative', lineHeight:1.5 }}>
                  <span style={{ position:'absolute', left:0, color:'#C8922A' }}>◈</span> {b}
                </div>
              ))}
            </div>
          )}
          <div style={{ display:'flex', gap:8, marginTop:14 }}>
            <button onClick={()=>{ setEditId(latest._id); setEditData({ title:latest.title, summary:latest.summary, bullets:(latest.bullets||[]).join('\n'), signal:latest.signal, signalReason:latest.signalReason }) }}
              style={{ fontFamily:mono, fontSize:10, padding:'6px 12px', border:'1px solid var(--border)', background:'transparent', color:'#9ca3af', cursor:'pointer' }}>
              ✏ Edit
            </button>
            <button onClick={()=>deleteBrief(latest._id)}
              style={{ fontFamily:mono, fontSize:10, padding:'6px 12px', border:'1px solid rgba(239,68,68,.3)', background:'transparent', color:'#ef4444', cursor:'pointer' }}>
              🗑 Delete
            </button>
          </div>
        </div>
      )}

      {/* Edit form */}
      {editId && (
        <div style={{ marginBottom:24, padding:20, background:'rgba(200,146,42,.04)', border:'1px solid rgba(200,146,42,.3)' }}>
          <div style={{ fontFamily:barlow, fontSize:13, fontWeight:700, color:'#C8922A', marginBottom:14 }}>EDIT BRIEF</div>
          {[
            { label:'Headline', field:'title', rows:1 },
            { label:'Summary', field:'summary', rows:3 },
            { label:'Bullet Points (one per line)', field:'bullets', rows:5 },
            { label:'Signal Reason', field:'signalReason', rows:2 },
          ].map(({ label, field, rows }) => (
            <div key={field} style={{ marginBottom:10 }}>
              <div style={{ fontFamily:mono, fontSize:9, color:'#6b7280', marginBottom:4, letterSpacing:'.06em' }}>{label.toUpperCase()}</div>
              <textarea value={editData[field] || ''} rows={rows}
                onChange={e => setEditData(p => ({...p, [field]: e.target.value}))}
                style={{ width:'100%', background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:mono, fontSize:11, padding:'8px 10px', resize:'vertical', boxSizing:'border-box', outline:'none' }}
              />
            </div>
          ))}
          <div style={{ marginBottom:10 }}>
            <div style={{ fontFamily:mono, fontSize:9, color:'#6b7280', marginBottom:4, letterSpacing:'.06em' }}>SIGNAL</div>
            <select value={editData.signal || ''} onChange={e => setEditData(p => ({...p, signal:e.target.value}))}
              style={{ background:'var(--bg)', border:'1px solid var(--border)', color:'var(--text)', fontFamily:mono, fontSize:11, padding:'6px 10px' }}>
              {['BUY','HOLD','WATCH','SELL'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={saveBrief}
              style={{ fontFamily:barlow, fontSize:12, fontWeight:700, background:'var(--gold)', color:'#000', border:'none', padding:'8px 18px', cursor:'pointer' }}>
              💾 SAVE
            </button>
            <button onClick={()=>setEditId(null)}
              style={{ fontFamily:mono, fontSize:10, background:'none', border:'1px solid var(--border)', color:'#9ca3af', padding:'8px 14px', cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Brief history */}
      <div>
        <div style={{ fontFamily:barlow, fontSize:12, fontWeight:700, color:'#4b5563', letterSpacing:'.08em', marginBottom:10, textTransform:'uppercase' }}>
          Brief History ({briefs.length})
        </div>
        {loading && <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontFamily:mono, fontSize:11 }}>Loading...</div>}
        {!loading && briefs.length === 0 && (
          <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontFamily:mono, fontSize:11, border:'1px solid var(--border)' }}>
            No briefs yet. Click GENERATE NOW to create the first one.
          </div>
        )}
        {briefs.slice(1).map((b, idx) => (
          <div key={b._id} style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', gap:12,
            background: expanded === b._id ? 'rgba(200,146,42,.04)' : 'transparent' }}>
            <div style={{ flexShrink:0 }}>
              {b.signal && (
                <span style={{ fontFamily:mono, fontSize:8, padding:'2px 6px', background:SIGNAL_BG[b.signal], color:SIGNAL_COLORS[b.signal], border:`1px solid ${SIGNAL_COLORS[b.signal]}30` }}>
                  {b.signal}
                </span>
              )}
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontFamily:barlow, fontSize:13, fontWeight:600, color:'var(--text)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{b.title}</div>
              <div style={{ fontFamily:mono, fontSize:9, color:'#4b5563', marginTop:2 }}>
                {b.session || 'AM'} · {fmt(b.publishedAt)} · {b.author || 'AI'}
              </div>
            </div>
            <div style={{ display:'flex', gap:6, flexShrink:0 }}>
              <button onClick={()=>setExpanded(expanded===b._id ? null : b._id)}
                style={{ fontFamily:mono, fontSize:9, padding:'3px 8px', border:'1px solid var(--border)', background:'transparent', color:'#6b7280', cursor:'pointer' }}>
                {expanded===b._id ? '▲' : '▼'}
              </button>
              <button onClick={()=>deleteBrief(b._id)}
                style={{ fontFamily:mono, fontSize:9, padding:'3px 8px', border:'1px solid rgba(239,68,68,.2)', background:'transparent', color:'#ef4444', cursor:'pointer' }}>
                🗑
              </button>
            </div>
            {expanded === b._id && b.summary && (
              <div style={{ gridColumn:'1/-1', padding:'10px 0 0', fontFamily:mono, fontSize:10, color:'#6b7280', lineHeight:1.6, borderTop:'1px solid var(--border)', marginTop:8, width:'100%' }}>
                {b.summary}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Live Ammo Price Table */}
      {prices.length > 0 && (
        <div style={{ marginTop:28 }}>
          <div style={{ fontFamily:barlow, fontSize:12, fontWeight:700, color:'#4b5563', letterSpacing:'.08em', marginBottom:10, textTransform:'uppercase' }}>
            Live Ammo Price Index ({prices.length} calibers)
          </div>
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:mono, fontSize:11 }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {['Caliber','$/rd','Trend','%','Stock','Updated'].map(h => (
                    <th key={h} style={{ padding:'6px 10px', textAlign:'left', color:'#C8922A', fontSize:9, letterSpacing:'.08em', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {prices.map((p,i) => (
                  <tr key={p._id} style={{ borderBottom:'1px solid rgba(30,41,59,.4)', background: i%2===0?'transparent':'rgba(255,255,255,.01)' }}>
                    <td style={{ padding:'6px 10px', fontWeight:600, color:'var(--text)' }}>{p.caliber}</td>
                    <td style={{ padding:'6px 10px', color:'#C8922A', fontWeight:700 }}>
                      {p.pricePerRound ? (p.pricePerRound < 1 ? (p.pricePerRound*100).toFixed(1)+'¢' : '$'+p.pricePerRound.toFixed(3)) : '—'}
                    </td>
                    <td style={{ padding:'6px 10px', fontSize:14 }}>
                      {p.trendDir === 'up' ? '↑' : p.trendDir === 'down' ? '↓' : '→'}
                    </td>
                    <td style={{ padding:'6px 10px', color: p.trendDir==='up'?'#ef4444':p.trendDir==='down'?'#22c55e':'#9ca3af' }}>
                      {p.trendPct ? (p.trendPct>0?'+':'')+p.trendPct.toFixed(1)+'%' : '—'}
                    </td>
                    <td style={{ padding:'6px 10px', color: p.inStock?'#22c55e':'#ef4444' }}>{p.inStock?'Yes':'No'}</td>
                    <td style={{ padding:'6px 10px', color:'#4b5563', fontSize:9 }}>{ago(p.recordedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
