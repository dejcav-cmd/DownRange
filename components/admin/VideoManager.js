'use client'
import { useState, useEffect } from 'react'

const S = `
.vm-wrap{font-family:'IBM Plex Mono',monospace}
.vm-card{background:var(--bg2);border:1px solid var(--border);padding:14px 16px;display:flex;gap:12px;align-items:flex-start;transition:border-color .15s}
.vm-card:hover{border-color:var(--gold)}
.vm-thumb{width:120px;height:68px;flex-shrink:0;object-fit:cover;background:#111}
.vm-input{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 12px;width:100%;outline:none}
.vm-input:focus{border-color:var(--gold)}
.vm-sel{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:8px 10px;outline:none}
.vm-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:10px 20px;cursor:pointer;transition:opacity .15s}
.vm-btn:hover{opacity:.85}
.vm-btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:7px 12px;cursor:pointer;transition:all .15s}
.vm-btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.vm-btn-del{background:none;border:1px solid rgba(239,68,68,.3);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s}
.vm-btn-del:hover{background:rgba(239,68,68,.1)}
.vm-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;display:block}
.vm-tag{display:inline-block;font-size:9px;padding:2px 7px;border-radius:2px;font-weight:700;letter-spacing:.06em;text-transform:uppercase}
`

const CATS = ['review','training','news','build','interview','opinion']
const CAT_C = {review:'#C8922A',training:'#22C55E',news:'#3B82F6',build:'#A855F7',interview:'#F97316',opinion:'#64748b'}

// Default seed videos — same as page.js
const DEFAULT_VIDEOS = [
  { id:'v1',  videoId:'IdCJNilFjVM', title:'How a Neutral Country Built One of the Best Combat Rifles Ever', channelName:'Garand Thumb',          category:'review',    duration:'28:14' },
  { id:'v2',  videoId:'GYifZbidKw0', title:'Garand Thumb Roasts Our Guns',                                   channelName:'Garand Thumb',          category:'review',    duration:'18:42' },
  { id:'v3',  videoId:'XtpGpnWkSgU', title:'The Best Handgun For You',                                        channelName:'Garand Thumb',          category:'review',    duration:'22:08' },
  { id:'v4',  videoId:'4qLAOsm5vuE', title:"Garand Thumb's Favorite Guns — Inside the Armory",               channelName:'Classic Firearms',      category:'review',    duration:'31:17' },
  { id:'v5',  videoId:'YEW4U9DUtrw', title:"Garand Thumb's Coolest Guns (Top Five)",                         channelName:'Classic Firearms',      category:'review',    duration:'15:52' },
  { id:'v6',  videoId:'EtkwiXgnsaE', title:'2024 Guide to Your First AR-15',                                 channelName:'Garand Thumb',          category:'review',    duration:'28:14' },
  { id:'v7',  videoId:'BT5Ai-rJwjI', title:'AR-15 Lower Pistol Build (Aero Precision)',                      channelName:'Garand Thumb',          category:'build',     duration:'18:23' },
  { id:'v8',  videoId:'GcnA9KpKcXo', title:'Concealed Pro Makes It Look Easy',                               channelName:'Active Self Protection', category:'training', duration:'4:12'  },
  { id:'v9',  videoId:'HFOmW3EN0EM', title:'My Every Day Carry (EDC)',                                        channelName:'Active Self Protection', category:'training', duration:'12:44' },
  { id:'v10', videoId:'RcSDVC42DTg', title:'Perfectly Timed Counter-Ambush',                                 channelName:'Active Self Protection', category:'training', duration:'3:58'  },
  { id:'v11', videoId:'FfVNca7nGXk', title:'How To Start With Concealed Carry',                              channelName:'Paul Harrell',           category:'training', duration:'19:33' },
  { id:'v12', videoId:'tPStQ6UgSNI', title:'Best All Around AR-15 Build',                                    channelName:'Military Arms Channel',  category:'build',    duration:'24:08' },
  { id:'v13', videoId:'ANdUqpCW2SM', title:'The Legendary Paul Harrell',                                     channelName:'Garand Thumb',           category:'interview',duration:'22:41' },
  { id:'v14', videoId:'polxptTGKMk', title:'Travis Haley and Garand Thumb — Carbine Setups',                 channelName:'Garand Thumb',           category:'review',   duration:'26:17' },
]

function thumb(id) { return `https://i.ytimg.com/vi/${id}/mqdefault.jpg` }

export default function VideoManager({ adminKey }) {
  const [videos,   setVideos]   = useState([])
  const [newId,    setNewId]    = useState('')
  const [newTitle, setNewTitle] = useState('')
  const [newCh,    setNewCh]    = useState('')
  const [newCat,   setNewCat]   = useState('review')
  const [newDur,   setNewDur]   = useState('')
  const [preview,  setPreview]  = useState(null)
  const [saving,   setSaving]   = useState(false)
  const [msg,      setMsg]      = useState('')
  const [search,   setSearch]   = useState('')

  // Load from localStorage (persists admin edits)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('dr_video_list')
      setVideos(stored ? JSON.parse(stored) : DEFAULT_VIDEOS)
    } catch { setVideos(DEFAULT_VIDEOS) }
  }, [])

  function save(list) {
    setVideos(list)
    localStorage.setItem('dr_video_list', JSON.stringify(list))
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 3000) }

  async function previewVideo() {
    if (!newId || newId.length !== 11) { flash('❌ YouTube video IDs are exactly 11 characters'); return }
    setPreview(null)
    // Fetch title from oEmbed
    try {
      const res = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${newId}`)
      const d = await res.json()
      if (d.title) {
        setNewTitle(d.title)
        setNewCh(d.author_name || '')
        setPreview({ videoId: newId, title: d.title, channelName: d.author_name })
        flash('✅ Video found: ' + d.title.slice(0,50))
      } else {
        flash('⚠ Could not fetch title — fill in manually and add')
        setPreview({ videoId: newId, title: newTitle || '(fill in title)', channelName: newCh })
      }
    } catch {
      flash('⚠ Could not verify — add manually')
      setPreview({ videoId: newId, title: newTitle || '(fill in title)', channelName: newCh })
    }
  }

  function addVideo() {
    if (!newId || newId.length !== 11) { flash('❌ YouTube video ID must be exactly 11 characters'); return }
    if (!newTitle.trim()) { flash('❌ Title is required'); return }
    if (videos.find(v => v.videoId === newId)) { flash('❌ Video already in list'); return }
    const v = {
      id:          'v' + Date.now(),
      videoId:     newId.trim(),
      title:       newTitle.trim(),
      channelName: newCh.trim() || 'Unknown',
      category:    newCat,
      duration:    newDur.trim() || '',
    }
    const updated = [v, ...videos]
    save(updated)
    setNewId(''); setNewTitle(''); setNewCh(''); setNewDur(''); setPreview(null)
    flash('✅ Added: ' + v.title.slice(0,40))
  }

  function removeVideo(id) {
    if (!confirm('Remove this video from the portal?')) return
    save(videos.filter(v => v.id !== id))
    flash('Removed')
  }

  function moveUp(idx) {
    if (idx === 0) return
    const list = [...videos]
    ;[list[idx-1], list[idx]] = [list[idx], list[idx-1]]
    save(list)
  }

  function moveDown(idx) {
    if (idx === videos.length - 1) return
    const list = [...videos]
    ;[list[idx], list[idx+1]] = [list[idx+1], list[idx]]
    save(list)
  }

  async function pushToPortal() {
    setSaving(true)
    try {
      const res = await fetch('/api/admin/save-videos', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ videos }),
      })
      const d = await res.json()
      flash(d.ok ? '✅ Saved to portal — changes live in ~60 seconds' : '❌ ' + d.error)
    } catch (e) { flash('❌ ' + e.message) }
    setSaving(false)
  }

  const filtered = search
    ? videos.filter(v => v.title.toLowerCase().includes(search.toLowerCase()) || v.channelName.toLowerCase().includes(search.toLowerCase()))
    : videos

  return (
    <div className="vm-wrap">
      <style>{S}</style>

      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--gold)', letterSpacing:'.06em', marginBottom:4 }}>
        ▶ Video Manager
      </div>
      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginBottom:24, lineHeight:1.7 }}>
        Add or remove videos shown in the portal. Changes save to your browser and push to the portal. Order = display order on the video page.
      </p>

      {/* ── ADD NEW VIDEO ── */}
      <div style={{ background:'rgba(200,146,42,.06)', border:'1px solid rgba(200,146,42,.25)', padding:'20px 24px', marginBottom:24 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700, color:'var(--gold)', letterSpacing:'.06em', textTransform:'uppercase', marginBottom:16 }}>
          + Add New Video
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:12 }}>
          <div>
            <span className="vm-lbl">YouTube Video ID (11 chars)</span>
            <div style={{ display:'flex', gap:8 }}>
              <input className="vm-input" value={newId} onChange={e=>setNewId(e.target.value.trim())}
                placeholder="e.g. dQw4w9WgXcQ" maxLength={11}
                onKeyDown={e => e.key === 'Enter' && previewVideo()} />
              <button className="vm-btn-ghost" onClick={previewVideo} style={{ whiteSpace:'nowrap', flexShrink:0 }}>
                🔍 Verify
              </button>
            </div>
            <div style={{ fontSize:9, color:'#475569', marginTop:4 }}>
              From youtube.com/watch?v=<strong style={{ color:'var(--gold)' }}>THIS_PART</strong>
            </div>
          </div>

          <div>
            {preview && (
              <div style={{ display:'flex', gap:10, alignItems:'center', height:'100%' }}>
                <img src={thumb(preview.videoId)} alt="" style={{ width:80, height:45, objectFit:'cover', flexShrink:0 }} />
                <div style={{ fontSize:10, color:'#22c55e', lineHeight:1.5 }}>
                  ✅ {preview.title?.slice(0,50)}<br/>
                  <span style={{ color:'#64748b' }}>{preview.channelName}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 160px 120px', gap:12, marginBottom:16 }}>
          <div>
            <span className="vm-lbl">Title</span>
            <input className="vm-input" value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Video title" />
          </div>
          <div>
            <span className="vm-lbl">Channel Name</span>
            <input className="vm-input" value={newCh} onChange={e=>setNewCh(e.target.value)} placeholder="e.g. Garand Thumb" />
          </div>
          <div>
            <span className="vm-lbl">Category</span>
            <select className="vm-sel" value={newCat} onChange={e=>setNewCat(e.target.value)} style={{ width:'100%' }}>
              {CATS.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <span className="vm-lbl">Duration</span>
            <input className="vm-input" value={newDur} onChange={e=>setNewDur(e.target.value)} placeholder="e.g. 18:42" />
          </div>
        </div>

        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <button className="vm-btn" onClick={addVideo}>Add to Portal</button>
          {msg && <span style={{ fontSize:11, color: msg.startsWith('✅') ? '#22c55e' : msg.startsWith('❌') ? '#ef4444' : '#f59e0b' }}>{msg}</span>}
        </div>
      </div>

      {/* ── VIDEO LIST ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12, flexWrap:'wrap', gap:10 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700, color:'var(--text)', letterSpacing:'.04em', textTransform:'uppercase' }}>
          {videos.length} Videos in Portal
        </div>
        <div style={{ display:'flex', gap:8, alignItems:'center' }}>
          <input className="vm-input" value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="Search..." style={{ width:180 }} />
          <button className="vm-btn" onClick={pushToPortal} disabled={saving} style={{ background: saving ? '#4b5563' : undefined }}>
            {saving ? 'Saving...' : '🚀 Push to Portal'}
          </button>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
        {filtered.map((v, idx) => (
          <div key={v.id} className="vm-card">
            <img src={thumb(v.videoId)} alt="" className="vm-thumb"
              onError={e => { e.target.style.background='#222'; e.target.style.display='none' }} />
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ display:'flex', gap:8, alignItems:'flex-start', marginBottom:4 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', lineHeight:1.2, flex:1 }}>
                  {v.title}
                </div>
                <span className="vm-tag" style={{ background: CAT_C[v.category]+'22', color: CAT_C[v.category] || '#9ca3af', flexShrink:0 }}>
                  {v.category}
                </span>
              </div>
              <div style={{ fontSize:9, color:'#64748b', marginBottom:6 }}>
                <strong style={{ color:'#C8922A' }}>{v.channelName}</strong>
                {v.duration ? ' · ' + v.duration : ''}
                {' · ID: '}
                <a href={'https://youtube.com/watch?v='+v.videoId} target="_blank" rel="noreferrer"
                  style={{ color:'#3b82f6', textDecoration:'none' }}>{v.videoId}</a>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4, flexShrink:0 }}>
              <div style={{ display:'flex', gap:4 }}>
                <button className="vm-btn-ghost" onClick={() => moveUp(idx)} disabled={idx===0} style={{ padding:'4px 8px', fontSize:11 }}>↑</button>
                <button className="vm-btn-ghost" onClick={() => moveDown(idx)} disabled={idx===videos.length-1} style={{ padding:'4px 8px', fontSize:11 }}>↓</button>
              </div>
              <button className="vm-btn-del" onClick={() => removeVideo(v.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{ padding:'40px', textAlign:'center', color:'#4B5563', fontSize:12 }}>
          {search ? 'No videos match your search.' : 'No videos yet. Add one above.'}
        </div>
      )}

      <div style={{ marginTop:16, padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--border)', fontSize:10, color:'#374151', lineHeight:1.8 }}>
        ⚠ Changes save to your browser localStorage immediately. Click <strong style={{color:'var(--gold)'}}>Push to Portal</strong> to update what visitors see on the video page.
        The portal reads from Sanity — pushing saves the list to Sanity so it persists across devices.
      </div>
    </div>
  )
}
