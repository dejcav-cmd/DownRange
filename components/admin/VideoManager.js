'use client'
import { useState, useEffect, useCallback } from 'react'

const S = `
.vm-wrap{font-family:'IBM Plex Mono',monospace}
.vm-card{background:var(--bg2);border:1px solid var(--border);padding:14px 16px;display:flex;gap:12px;align-items:flex-start;transition:border-color .15s}
.vm-card:hover{border-color:rgba(200,146,42,.4)}
.vm-card.hidden-ch{opacity:.45;border-style:dashed}
.vm-thumb{width:120px;height:68px;flex-shrink:0;object-fit:cover;background:#111}
.vm-input{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:7px 10px;outline:none;width:100%}
.vm-input:focus{border-color:var(--gold)}
.vm-sel{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:7px 10px;outline:none;width:100%}
.vm-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer}
.vm-btn:hover{opacity:.85}
.vm-btn:disabled{opacity:.35;cursor:not-allowed}
.vm-btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s}
.vm-btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.vm-btn-del{background:none;border:1px solid rgba(239,68,68,.3);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.vm-btn-del:hover{background:rgba(239,68,68,.1)}
.vm-btn-hide{background:none;border:1px solid rgba(245,158,11,.3);color:#f59e0b;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.vm-btn-hide:hover{background:rgba(245,158,11,.08)}
.vm-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
.vm-tag{display:inline-block;font-size:9px;padding:2px 7px;border-radius:2px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
.vm-tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px 16px;cursor:pointer;white-space:nowrap;letter-spacing:.03em;transition:all .12s}
.vm-tab.active{border-bottom-color:var(--gold);color:var(--gold)}
`

const INITIAL_CHANNELS = [
  { id:'ch1', channelId:'UC5Gwxl2DmAZkdiuoWsLcRhg', name:'Garand Thumb',          category:'Reviews & Tactical',   subs:'~2.5M', active:true },
  { id:'ch2', channelId:'UCIRgR4iANHI2taJdz8hjwLw', name:'Paul Harrell',           category:'Demonstrations',        subs:'~1.1M', active:true },
  { id:'ch3', channelId:'UCwIHnIpEIbyzmL9cB2l5Elw', name:'Military Arms Channel',  category:'Reviews & Industry',    subs:'~860K', active:true },
  { id:'ch4', channelId:'UCz8b2iV8CJxBNs3fP4jjRMg', name:'Iraqveteran8888',        category:'General Firearms',      subs:'~2.6M', active:true },
  { id:'ch5', channelId:'UCDpNK2b8NlJSfMl_k4p_fJg', name:'InRange TV',             category:'Reviews & Historical',  subs:'~300K', active:true },
  { id:'ch6', channelId:'UC_GOthrJTq5EFrPNsHhJJBQ', name:'Forgotten Weapons',      category:'Historical Collector',  subs:'~2.8M', active:true },
  { id:'ch7', channelId:'UC_zQ_9vNGE9ORtO_8b1HUPA', name:'Active Self Protection', category:'Training & Self-Defense',subs:'~2.2M', active:true },
  { id:'ch8', channelId:'UCpAQxclFD9eGCqRoIDNIGsA', name:'Lucky Gunner',           category:'Ammo & Testing',        subs:'~600K', active:true },
  { id:'ch9', channelId:'UCVdMoKcLQ7-4lxjhJXx_E8A', name:'Hickok45',              category:'Demonstrations',        subs:'~6.6M', active:true },
  { id:'ch10',channelId:'UCpUJCA4YcMVMdSolcaWOQOw', name:'Mr. Guns N Gear',        category:'Reviews & EDC',         subs:'~1.3M', active:true },
  { id:'ch11',channelId:'UCftEYpFBf_m8gJEWMXXfqVg', name:'Brownells',             category:'Industry & Parts',      subs:'~260K', active:true },
]

const CATS = ['Reviews & Tactical','Demonstrations','Reviews & Industry','General Firearms','Reviews & Historical','Historical Collector','Training & Self-Defense','Ammo & Testing','Industry & Parts','Reviews & EDC','News & Commentary','Competitions','Other']

const LS_KEY = 'dr_video_channels_cache'

function loadChannelsLocal() {
  try { const r = localStorage.getItem(LS_KEY); return r ? JSON.parse(r) : null } catch { return null }
}
function cacheChannels(chs) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(chs)) } catch {}
}

export default function VideoManager({ adminKey }) {
  const [activeTab, setActiveTab] = useState('channels') // channels | videos
  const [channels,  setChannels]  = useState([])
  const [videos,    setVideos]    = useState([])
  const [loading,   setLoading]   = useState(true)
  const [msg,       setMsg]       = useState('')
  const [search,    setSearch]    = useState('')
  const [cronRunning, setCronRunning] = useState(false)
  const [purging, setPurging]         = useState(false)
  const [cronResult, setCronResult]   = useState(null)

  // Channel form state
  const [addingCh,  setAddingCh]  = useState(false)
  const [newChId,   setNewChId]   = useState('')
  const [newChName, setNewChName] = useState('')
  const [newChCat,  setNewChCat]  = useState('Reviews & Tactical')
  const [newChSubs, setNewChSubs] = useState('')

  // Video form state
  const [newId,     setNewId]     = useState('')
  const [newTitle,  setNewTitle]  = useState('')
  const [newCh,     setNewCh]     = useState('')
  const [newCat,    setNewCat]    = useState('review')
  const [preview,   setPreview]   = useState(null)
  const [verifying, setVerifying] = useState(false)
  const [editingCh,  setEditingCh]  = useState(null) // channel id being edited
  const [editChName, setEditChName] = useState('')
  const [editChCat,  setEditChCat]  = useState('')
  const [editChSubs, setEditChSubs] = useState('')

  const H = { 'x-admin-key': adminKey }
  const flash = (m, dur = 5000) => {
    setMsg(m)
    if (!m.startsWith('⏳')) setTimeout(() => setMsg(''), dur)
  }

  useEffect(() => {
    // Try cache first for fast render, then fetch from Sanity
    const cached = loadChannelsLocal()
    if (cached) setChannels(cached)
    else setChannels(INITIAL_CHANNELS)
    loadChannelsFromSanity()
    loadVideos()
  }, [])

  async function loadChannelsFromSanity() {
    try {
      const res = await fetch('/api/admin/youtube-channels', { headers: H })
      if (res.ok) {
        const d = await res.json()
        if (d.ok && d.channels?.length > 0) {
          setChannels(d.channels)
          cacheChannels(d.channels)
        }
      }
    } catch {}
  }

  async function loadVideos() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/videos-manager', { headers: H })
      if (res.ok) {
        const d = await res.json()
        setVideos(d.videos || [])
      }
    } catch {}
    setLoading(false)
  }

  // ── Channel management ─────────────────────────────────────────────────
  async function addChannel() {
    if (!newChId.trim() || !newChName.trim()) { flash('❌ Channel ID and name required'); return }
    const ch = {
      id: 'ch' + Date.now(),
      channelId: newChId.trim(),
      name: newChName.trim(),
      category: newChCat,
      subs: newChSubs.trim() || '—',
      active: true,
    }
    const updated = [...channels, ch]
    setChannels(updated)
    cacheChannels(updated)
    setNewChId(''); setNewChName(''); setNewChSubs(''); setAddingCh(false)
    flash('⏳ Saving channel to Sanity...')
    try {
      const res = await fetch('/api/admin/youtube-channels', {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', channels: updated }),
      })
      const d = await res.json()
      if (d.ok) flash('✅ Channel added and saved — will be fetched on next cron run (every 4h)')
      else flash('⚠ Channel added locally but Sanity save failed: ' + (d.error||''))
    } catch (e) { flash('⚠ Channel added locally, Sanity save failed: ' + e.message) }
  }

  async function toggleChannel(id) {
    const updated = channels.map(c => c.id === id ? { ...c, active: !c.active } : c)
    setChannels(updated)
    cacheChannels(updated)
    const ch = updated.find(c => c.id === id)
    flash(ch.active ? '✅ ' + ch.name + ' enabled' : '⚠ ' + ch.name + ' paused — no new videos until re-enabled')
    try {
      await fetch('/api/admin/youtube-channels', {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', channels: updated }),
      })
    } catch {}
  }

  async function removeChannel(id) {
    const ch = channels.find(c => c.id === id)
    if (!confirm('Remove ' + (ch?.name || 'channel') + '? This stops future video fetches. Existing Sanity videos remain.')) return
    const updated = channels.filter(c => c.id !== id)
    setChannels(updated)
    cacheChannels(updated)
    flash('🗑 ' + (ch?.name || 'Channel') + ' removed')
    try {
      await fetch('/api/admin/youtube-channels', {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', channels: updated }),
      })
    } catch {}
  }

  async function moveChannel(id, dir) {
    const idx = channels.findIndex(c => c.id === id)
    if (idx < 0) return
    const next = [...channels]
    const swap = dir === 'up' ? idx - 1 : idx + 1
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setChannels(next)
    cacheChannels(next)
    try {
      await fetch('/api/admin/youtube-channels', {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', channels: next }),
      })
    } catch {}
  }

  async function startEditCh(ch) {
    setEditingCh(ch.id)
    setEditChName(ch.name)
    setEditChCat(ch.category)
    setEditChSubs(ch.subs)
  }

  async function saveChannelEdit(id) {
    const updated = channels.map(c => c.id === id
      ? { ...c, name: editChName.trim() || c.name, category: editChCat, subs: editChSubs.trim() || c.subs }
      : c
    )
    setChannels(updated)
    cacheChannels(updated)
    setEditingCh(null)
    flash('✅ Channel updated')
    try {
      await fetch('/api/admin/youtube-channels', {
        method: 'POST', headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', channels: updated }),
      })
    } catch {}
  }

  async function purgeShorts() {
    if (!confirm('Delete all short videos (under 2 min / #shorts tagged) from Sanity? Cannot be undone.')) return
    setPurging(true)
    flash('⏳ Scanning all videos for Shorts...')
    try {
      const res = await fetch('/api/admin/purge-shorts', { method: 'POST', headers: H })
      const d   = await res.json()
      if (d.ok) {
        const names = (d.shorts || []).slice(0,3).map(s => s.title?.slice(0,30)).join(', ')
        flash(`✅ Purged ${d.deleted} Short${d.deleted !== 1 ? 's' : ''} of ${d.checked} checked` + (names ? ' — ' + names : ''))
        if (d.deleted > 0) loadVideos()
      } else {
        flash('❌ Purge failed: ' + (d.error || 'unknown'))
      }
    } catch (e) { flash('❌ ' + e.message) }
    setPurging(false)
  }

  async function runCron() {
    setCronRunning(true)
    setCronResult(null)
    flash('⏳ Running video cron — fetching from all active channels...')
    try {
      const res = await fetch('/api/admin/cron-status?trigger=true', {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobId: 'video' }),
      })
      const d = await res.json()
      if (d.ok) {
        setCronResult({ ok: true, msg: 'Video feed ran — new videos added to Sanity' })
        flash('✅ Video cron complete — check below for new videos')
        await loadVideos()
      } else {
        setCronResult({ ok: false, msg: d.error || 'Failed' })
        flash('❌ Cron error: ' + (d.error || 'Unknown'))
      }
    } catch (e) {
      setCronResult({ ok: false, msg: e.message })
      flash('❌ ' + e.message)
    }
    setCronRunning(false)
  }

  // ── Video management ───────────────────────────────────────────────────
  async function verifyVideo() {
    if (!newId.trim()) { flash('❌ Enter a YouTube video ID'); return }
    setVerifying(true)
    const id = newId.trim().replace('https://www.youtube.com/watch?v=','').replace('https://youtu.be/','').split('&')[0]
    setNewId(id)
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`)
      const d   = await res.json()
      setPreview({ videoId: id, title: d.title, channelName: d.author_name })
      setNewTitle(d.title || '')
      setNewCh(d.author_name || '')
    } catch {
      setPreview({ videoId: id, title: newTitle || '(verify failed — fill manually)', channelName: newCh })
    }
    setVerifying(false)
  }

  async function addVideo() {
    if (!newId.trim() || !newTitle.trim()) { flash('❌ Video ID and title required'); return }
    const video = {
      _type: 'video',
      videoId: newId.trim(),
      title:   newTitle.trim(),
      channelName: newCh.trim() || 'Unknown',
      category:    newCat,
      thumbnail:   'https://i.ytimg.com/vi/' + newId.trim() + '/hqdefault.jpg',
      addedAt:     new Date().toISOString(),
      featured:    false,
      active:      true,
    }
    try {
      const res = await fetch('/api/admin/videos-manager', {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create', video }),
      })
      const d = await res.json()
      if (d.ok) {
        flash('✅ Video added to Sanity')
        setNewId(''); setNewTitle(''); setNewCh(''); setPreview(null)
        await loadVideos()
      } else flash('❌ ' + d.error)
    } catch (e) { flash('❌ ' + e.message) }
  }

  async function deleteVideo(id) {
    if (!confirm('Delete this video from Sanity?')) return
    try {
      const res = await fetch('/api/admin/videos-manager', {
        method: 'POST',
        headers: { ...H, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      })
      const d = await res.json()
      if (d.ok) { flash('🗑 Deleted'); await loadVideos() }
      else flash('❌ ' + d.error)
    } catch (e) { flash('❌ ' + e.message) }
  }

  const filteredVideos = videos.filter(v =>
    !search || (v.title || '').toLowerCase().includes(search.toLowerCase()) ||
    (v.channelName || '').toLowerCase().includes(search.toLowerCase())
  )

  const activeChannels  = channels.filter(c => c.active)
  const hiddenChannels  = channels.filter(c => !c.active)

  return (
    <div className="vm-wrap">
      <style>{S}</style>

      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', letterSpacing:'.06em', lineHeight:1 }}>▶ Video Manager</div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginTop:3 }}>
            {activeChannels.length} active channels · {videos.length} videos in Sanity
            {hiddenChannels.length > 0 && <span style={{ color:'#f59e0b' }}> · {hiddenChannels.length} hidden</span>}
          </div>
        </div>
        <button className="vm-btn" onClick={runCron} disabled={cronRunning} style={{ background: cronRunning ? '#374151' : '#C8922A' }}>
          {cronRunning ? '⏳ Running...' : '▶ Run Video Cron Now'}
        </button>
        <button className="vm-btn" onClick={purgeShorts} disabled={purging}
          style={{ background:'none', border:'1px solid #ef4444', color:'#ef4444', marginLeft:8 }}>
          {purging ? '⏳ Scanning...' : '🗑 Purge Shorts'}
        </button>
      </div>

      {msg && (
        <div style={{ padding:'9px 14px', marginBottom:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
          color: msg.startsWith('✅') ? '#22c55e' : msg.startsWith('❌') ? '#f87171' : msg.startsWith('⏳') ? '#f59e0b' : '#94a3b8',
          background:'var(--bg2)', border:'1px solid var(--border)' }}>
          {msg}
        </div>
      )}

      {cronResult && (
        <div style={{ padding:'8px 14px', marginBottom:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
          color: cronResult.ok ? '#22c55e' : '#f87171', background:'rgba(0,0,0,.3)', border:'1px solid var(--border)' }}>
          {cronResult.ok ? '✅' : '❌'} {cronResult.msg}
        </div>
      )}

      {/* ── Tabs ── */}
      <div style={{ borderBottom:'1px solid var(--border)', marginBottom:20, display:'flex' }}>
        {[['channels','📺 Channels'],['videos','🎬 Videos']].map(([v,l]) => (
          <button key={v} className={'vm-tab' + (activeTab===v?' active':'')} onClick={() => setActiveTab(v)}>{l}</button>
        ))}
      </div>

      {/* ══ CHANNELS TAB ══════════════════════════════════════════════════ */}
      {activeTab === 'channels' && (
        <div>
          {/* Add channel form */}
          <div style={{ marginBottom:20, padding:'16px 20px', background:'rgba(200,146,42,.05)', border:'1px solid rgba(200,146,42,.2)' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: addingCh ? 14 : 0 }}>
              <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--gold)', letterSpacing:'.06em' }}>
                + ADD CHANNEL
              </div>
              <button className="vm-btn-ghost" style={{ fontSize:9 }} onClick={() => setAddingCh(!addingCh)}>
                {addingCh ? '✕ Cancel' : '+ Add Channel'}
              </button>
            </div>
            {addingCh && (
              <div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
                  <div>
                    <span className="vm-lbl">YouTube Channel ID *</span>
                    <input className="vm-input" value={newChId} onChange={e=>setNewChId(e.target.value)}
                      placeholder="UCxxxxxxxxxxxxxxxxxxxxxxxx" />
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', marginTop:3 }}>
                      Get from youtube.com/channel/UC... or channel About page
                    </div>
                  </div>
                  <div>
                    <span className="vm-lbl">Channel Name *</span>
                    <input className="vm-input" value={newChName} onChange={e=>setNewChName(e.target.value)} placeholder="Garand Thumb" />
                  </div>
                  <div>
                    <span className="vm-lbl">Category</span>
                    <select className="vm-sel" value={newChCat} onChange={e=>setNewChCat(e.target.value)}>
                      {CATS.map(c => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <span className="vm-lbl">Subscribers (display only)</span>
                    <input className="vm-input" value={newChSubs} onChange={e=>setNewChSubs(e.target.value)} placeholder="~500K" />
                  </div>
                </div>
                <button className="vm-btn" onClick={addChannel}>Add Channel</button>
              </div>
            )}
          </div>

          {/* Active channels */}
          <div style={{ marginBottom:8, fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text-dim)', letterSpacing:'.06em', textTransform:'uppercase' }}>
            Active Channels ({activeChannels.length}) — pulled every 4 hours
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
            {channels.map((ch, idx) => (
              <div key={ch.id}>
              <div className={'vm-card' + (!ch.active ? ' hidden-ch' : '')} style={{ alignItems:'center' }}>
                <div style={{ width:40, height:40, borderRadius:'50%', background: ch.active ? 'rgba(200,146,42,.15)' : '#1e293b',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0 }}>▶</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color: ch.active ? 'var(--text)' : '#4b5563' }}>
                      {ch.name}
                    </div>
                    {!ch.active && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, padding:'1px 5px', background:'rgba(245,158,11,.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,.3)' }}>HIDDEN</span>}
                  </div>
                  <div style={{ display:'flex', gap:10, marginTop:3, flexWrap:'wrap' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#C8922A' }}>{ch.category}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>{ch.subs}</span>
                    <a href={'https://www.youtube.com/channel/' + ch.channelId} target="_blank" rel="noreferrer"
                      style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', textDecoration:'none' }}>
                      {ch.channelId.slice(0, 16)}… ↗
                    </a>
                  </div>
                </div>
                <div style={{ display:'flex', gap:6, flexShrink:0, alignItems:'center' }}>
                  <button className="vm-btn-ghost" style={{ padding:'3px 8px', fontSize:9 }} onClick={() => moveChannel(ch.id, 'up')} disabled={idx===0}>↑</button>
                  <button className="vm-btn-ghost" style={{ padding:'3px 8px', fontSize:9 }} onClick={() => moveChannel(ch.id, 'down')} disabled={idx===channels.length-1}>↓</button>
                  <button className="vm-btn-ghost" style={{ padding:'3px 8px', fontSize:9 }} onClick={() => startEditCh(ch)}>✎ Edit</button>
                  <button className="vm-btn-hide" onClick={() => toggleChannel(ch.id)}>
                    {ch.active ? '⊘ Hide' : '● Show'}
                  </button>
                  <button className="vm-btn-del" onClick={() => removeChannel(ch.id)}>Remove</button>
                </div>
              </div>
              {/* Inline edit form */}
              {editingCh === ch.id && (
                <div style={{ padding:'12px 16px', background:'rgba(200,146,42,.06)', border:'1px solid rgba(200,146,42,.3)', borderTop:'none' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:8, marginBottom:8 }}>
                    <div>
                      <span className="vm-lbl">Name</span>
                      <input className="vm-input" value={editChName} onChange={e=>setEditChName(e.target.value)} />
                    </div>
                    <div>
                      <span className="vm-lbl">Category</span>
                      <select className="vm-sel" value={editChCat} onChange={e=>setEditChCat(e.target.value)}>
                        {CATS.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <span className="vm-lbl">Subscribers</span>
                      <input className="vm-input" value={editChSubs} onChange={e=>setEditChSubs(e.target.value)} placeholder="~500K" />
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button className="vm-btn" style={{ fontSize:11, padding:'5px 14px' }} onClick={()=>saveChannelEdit(ch.id)}>💾 Save</button>
                    <button className="vm-btn-ghost" style={{ fontSize:10 }} onClick={()=>setEditingCh(null)}>Cancel</button>
                  </div>
                </div>
              )}
              </div>
            ))}
            {channels.length === 0 && (
              <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontSize:12 }}>No channels — add one above.</div>
            )}
          </div>

          {/* Cron info */}
          <div style={{ padding:'12px 16px', background:'var(--bg2)', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563' }}>
            <span style={{ color:'#C8922A', fontWeight:700, marginRight:8 }}>CRON SCHEDULE</span>
            Video feed runs every 4 hours automatically. Fetches 5 latest videos per active channel.
            New channels appear after the next scheduled run. Use "Run Video Cron Now" to fetch immediately.
            <div style={{ marginTop:6, color:'#374151' }}>
              Note: Channel preferences saved to browser localStorage — they sync to the cron agent definition in agent/feeds/video.js.
            </div>
          </div>
        </div>
      )}

      {/* ══ VIDEOS TAB ════════════════════════════════════════════════════ */}
      {activeTab === 'videos' && (
        <div>
          {/* Add video form */}
          <div style={{ marginBottom:20, padding:'16px 20px', background:'rgba(200,146,42,.05)', border:'1px solid rgba(200,146,42,.2)' }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--gold)', letterSpacing:'.06em', marginBottom:14 }}>
              + ADD VIDEO MANUALLY
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <span className="vm-lbl">YouTube Video ID or URL *</span>
                <div style={{ display:'flex', gap:6 }}>
                  <input className="vm-input" value={newId} onChange={e=>setNewId(e.target.value)}
                    placeholder="dQw4w9WgXcQ or full URL" style={{ flex:1 }} />
                  <button className="vm-btn-ghost" onClick={verifyVideo} disabled={verifying} style={{ flexShrink:0 }}>
                    {verifying ? '...' : '⌕ Verify'}
                  </button>
                </div>
              </div>
              <div>
                <span className="vm-lbl">Channel Name</span>
                <input className="vm-input" value={newCh} onChange={e=>setNewCh(e.target.value)} placeholder="Garand Thumb" />
              </div>
              <div>
                <span className="vm-lbl">Title *</span>
                <input className="vm-input" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Video title..." />
              </div>
              <div>
                <span className="vm-lbl">Category</span>
                <select className="vm-sel" value={newCat} onChange={e=>setNewCat(e.target.value)}>
                  {['review','training','news','build','comparison','maintenance','competition','history','ammo'].map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            </div>
            {preview && (
              <div style={{ marginBottom:10, display:'flex', gap:12, alignItems:'center', padding:'10px 14px', background:'rgba(34,197,94,.06)', border:'1px solid rgba(34,197,94,.2)' }}>
                <img src={'https://i.ytimg.com/vi/' + preview.videoId + '/mqdefault.jpg'} alt="" style={{ width:80, height:45, objectFit:'cover' }} />
                <div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)' }}>{preview.title}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A' }}>{preview.channelName}</div>
                </div>
              </div>
            )}
            <button className="vm-btn" onClick={addVideo}>Add to Portal</button>
          </div>

          {/* Search */}
          <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
            <input className="vm-input" value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Search videos or channels..." style={{ maxWidth:280 }} />
            <button className="vm-btn-ghost" onClick={loadVideos}>↺ Refresh</button>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', marginLeft:'auto' }}>
              {filteredVideos.length} videos
            </span>
          </div>

          {loading ? (
            <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontSize:12 }}>Loading videos...</div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
              {filteredVideos.map(v => (
                <div key={v._id || v.videoId} className="vm-card">
                  <img className="vm-thumb"
                    src={v.thumbnail || v.thumbnailUrl || 'https://i.ytimg.com/vi/' + (v.videoId || v.youtubeId) + '/mqdefault.jpg'}
                    alt={v.title} onError={e => { e.target.src = 'https://i.ytimg.com/vi/' + (v.videoId || v.youtubeId) + '/hqdefault.jpg' }} />
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', lineHeight:1.25, marginBottom:4 }}>
                      {v.title}
                    </div>
                    <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A' }}>{v.channelName}</span>
                      {v.category && <span className="vm-tag" style={{ background:'rgba(200,146,42,.1)', color:'#C8922A' }}>{v.category}</span>}
                      {v.publishedAt && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>{v.publishedAt?.slice(0,10)}</span>}
                      <a href={'https://www.youtube.com/watch?v=' + (v.videoId || v.youtubeId)} target="_blank" rel="noreferrer"
                        style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', textDecoration:'none' }}>YT ↗</a>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}>
                    <button className="vm-btn-del" onClick={() => deleteVideo(v._id)}>🗑</button>
                  </div>
                </div>
              ))}
              {filteredVideos.length === 0 && (
                <div style={{ padding:40, textAlign:'center', color:'#4b5563', fontSize:12 }}>
                  No videos found. Run the video cron or add manually above.
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
