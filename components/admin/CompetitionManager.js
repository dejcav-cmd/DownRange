'use client'
import { useState, useEffect, useCallback } from 'react'
import ImageSearchModal from './ImageSearchModal'
import { useBulkLock, BulkLockBar, LockToggle } from './BulkLockBar'

const ORGS       = ['NRA','USPSA/IPSC','IDPA','PRS','NRL','NSSF','3-Gun Nation','Other']
const DISCS      = ['Practical Pistol','Precision Rifle','3-Gun','Shotgun','Rimfire','Long Range','Steel Challenge','Hunting','Cowboy Action','Other']
const TYPES      = ['Club Match','Area Match','Sectional','Regional','National','World','Online/Virtual']
const LEVELS     = ['Beginner Friendly','All Levels','Intermediate','Advanced','Open']

const S = `
.cm2-input{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;outline:none;width:100%}
.cm2-input:focus{border-color:var(--gold)}
.cm2-ta{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px;outline:none;width:100%;resize:vertical}
.cm2-ta:focus{border-color:var(--gold)}
.cm2-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:8px 16px;cursor:pointer}
.cm2-btn:hover{opacity:.85}
.cm2-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s}
.cm2-ghost:hover{border-color:var(--gold);color:var(--gold)}
.cm2-del{background:none;border:1px solid rgba(239,68,68,.35);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer}
.cm2-lbl{font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
`

const CAT_C = {'NRA':'#ef4444','USPSA/IPSC':'#3b82f6','IDPA':'#22c55e','PRS':'#C8922A','NRL':'#a855f7','NSSF':'#f97316','3-Gun Nation':'#f59e0b','Other':'#6b7280'}

export default function CompetitionManager({ adminKey }) {
  const [items,   setItems]   = useState([])
  const [loading, setLoading] = useState(true)
  const [sel,     setSel]     = useState(null)
  const bulkLock = useBulkLock({ items, setItems, patchFn:(id,fields)=>patch(id,fields) })
  const [busy,    setBusy]    = useState(false)
  const [msg,     setMsg]     = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [search,  setSearch]  = useState('')
  const [form,    setForm]    = useState({})

  const [imgSearch, setImgSearch] = useState(null) // { item } | null

  const H = { 'x-admin-key': adminKey }
  const flash = m => { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      // Fetch all (including unapproved) for admin
      const res = await fetch('/api/competitions/admin', { headers: H })
      const d = await res.json()
      setItems(d.matches || [])
    } catch {}
    setLoading(false)
  }, [adminKey])

  useEffect(() => { load() }, [load])

  const selItem = items.find(i => i._id === sel)

  async function patch(id, fields) {
    const res = await fetch('/api/competitions', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'patch',id,fields}) })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Saved') } else flash('❌ '+d.error)
  }

  async function del(id) {
    if (!confirm('Delete this match?')) return
    setBusy(true)
    const res = await fetch('/api/competitions', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'delete',id}) })
    const d = await res.json()
    if (d.ok) { setSel(null); await load(); flash('🗑 Deleted') } else flash('❌ '+d.error)
    setBusy(false)
  }

  async function create() {
    if (!form.name||!form.startDate) { flash('❌ Name and start date required'); return }
    setBusy(true)
    const res = await fetch('/api/competitions', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'create',...form}) })
    const d = await res.json()
    if (d.ok) { setShowAdd(false); setForm({}); await load(); flash('✅ Match added') } else flash('❌ '+d.error)
    setBusy(false)
  }

  async function seedData() {
    setBusy(true); flash('⏳ Seeding match data...')
    const res = await fetch('/api/competitions', { method:'POST', headers:{...H,'Content-Type':'application/json'}, body:JSON.stringify({action:'seed'}) })
    const d = await res.json()
    if (d.ok) { await load(); flash('✅ Seeded '+d.created+' matches') } else flash('❌ '+(d.error||'Error'))
    setBusy(false)
  }

  const filtered = items.filter(i => !search || (i.name+i.city+i.org+i.discipline).toLowerCase().includes(search.toLowerCase()))
  const selI = items.find(i => i._id === sel)

  function F({ label, field, opts, rows, type='text' }) {
    const v = selI?.[field] || ''
    return (
      <div style={{marginBottom:10}}>
        <span className="cm2-lbl">{label}</span>
        {opts ? <select className="cm2-input" defaultValue={v} onBlur={e=>{if(e.target.value!==v)patch(selI._id,{[field]:e.target.value})}}>
          <option value="">—</option>{opts.map(o=><option key={o}>{o}</option>)}</select>
        : rows ? <textarea className="cm2-ta" rows={rows} defaultValue={v} onBlur={e=>{if(e.target.value!==v)patch(selI._id,{[field]:e.target.value})}} />
        : <input className="cm2-input" type={type} defaultValue={v} onBlur={e=>{if(String(e.target.value)!==String(v))patch(selI._id,{[field]:type==='number'?parseFloat(e.target.value)||null:e.target.value})}} />}
      </div>
    )
  }

  return (
    <div>
      <style>{S}</style>

      <div style={{display:'flex',alignItems:'flex-end',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:10}}>
        <div>
          <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'2rem',color:'var(--gold)',letterSpacing:'.06em',lineHeight:1}}>🏆 Competition Manager</div>
          <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginTop:3}}>{items.length} matches · NRA, USPSA, IDPA, PRS, and more</div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button className="cm2-ghost" onClick={seedData} disabled={busy}>📥 Seed Matches</button>
          <button className="cm2-btn" onClick={()=>setShowAdd(!showAdd)}>+ Add Match</button>
        </div>
      </div>

      {msg && <div style={{padding:'9px 14px',marginBottom:12,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:msg.startsWith('✅')?'#22c55e':msg.startsWith('❌')?'#f87171':'#f59e0b',background:'var(--bg2)',border:'1px solid var(--border)'}}>{msg}</div>}

      {/* Add form */}
      {showAdd && (
        <div style={{background:'rgba(200,146,42,.05)',border:'1px solid rgba(200,146,42,.25)',padding:'16px 20px',marginBottom:16}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:15,fontWeight:700,color:'var(--gold)',letterSpacing:'.06em',textTransform:'uppercase',marginBottom:12}}>New Match</div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div><span className="cm2-lbl">Match Name *</span><input className="cm2-input" value={form.name||''} onChange={e=>setForm(p=>({...p,name:e.target.value}))} /></div>
            <div><span className="cm2-lbl">Organization</span><select className="cm2-input" value={form.org||''} onChange={e=>setForm(p=>({...p,org:e.target.value}))}><option>—</option>{ORGS.map(o=><option key={o}>{o}</option>)}</select></div>
            <div><span className="cm2-lbl">Start Date *</span><input className="cm2-input" type="date" value={form.startDate||''} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))} /></div>
            <div><span className="cm2-lbl">End Date</span><input className="cm2-input" type="date" value={form.endDate||''} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))} /></div>
            <div><span className="cm2-lbl">City</span><input className="cm2-input" value={form.city||''} onChange={e=>setForm(p=>({...p,city:e.target.value}))} /></div>
            <div><span className="cm2-lbl">State</span><input className="cm2-input" value={form.state||''} onChange={e=>setForm(p=>({...p,state:e.target.value}))} placeholder="TX" /></div>
            <div><span className="cm2-lbl">Entry Fee ($)</span><input className="cm2-input" type="number" value={form.entryFee||''} onChange={e=>setForm(p=>({...p,entryFee:e.target.value}))} /></div>
            <div><span className="cm2-lbl">Registration URL</span><input className="cm2-input" value={form.registrationUrl||''} onChange={e=>setForm(p=>({...p,registrationUrl:e.target.value}))} /></div>
          </div>
          <div style={{marginBottom:10}}><span className="cm2-lbl">Description</span><textarea className="cm2-ta" rows={2} value={form.description||''} onChange={e=>setForm(p=>({...p,description:e.target.value}))} /></div>
          <div style={{display:'flex',gap:8}}>
            <button className="cm2-btn" onClick={create} disabled={busy}>Add Match</button>
            <button className="cm2-ghost" onClick={()=>setShowAdd(false)}>Cancel</button>
          </div>
        </div>
      )}

      {/* List + detail */}
      <div style={{display:'grid',gridTemplateColumns:selI?'1fr 400px':'1fr',gap:0,border:'1px solid var(--border)',minHeight:400}}>
        <div style={{overflowY:'auto',maxHeight:'calc(100vh - 350px)'}}>
          <div style={{padding:'8px 12px',borderBottom:'1px solid var(--border)',background:'var(--bg)',display:'flex',gap:8,alignItems:'center'}}>
            <input className="cm2-input" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." style={{width:200}} />
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#4b5563',marginLeft:'auto'}}>{filtered.length} matches</span>
          </div>
          {loading ? <div style={{padding:40,textAlign:'center',color:'#4b5563',fontSize:12}}>Loading...</div>
          : (<>
          <BulkLockBar checkedIds={bulkLock.checkedIds} bulkSaving={bulkLock.bulkSaving} onLock={()=>bulkLock.bulkSetLock(true,flash)} onUnlock={()=>bulkLock.bulkSetLock(false,flash)} onClear={bulkLock.clearChecked} />
          {filtered.map(m => (
            <div key={m._id} onClick={()=>setSel(sel===m._id?null:m._id)}
              style={{display:'flex',gap:10,padding:'10px 12px',borderBottom:'1px solid var(--border)',cursor:'pointer',background:bulkLock.checkedIds.has(m._id)?'rgba(200,146,42,.05)':sel===m._id?'rgba(200,146,42,.08)':'var(--bg2)',borderLeft:sel===m._id?'2px solid var(--gold)':'2px solid transparent',transition:'background .1s'}}>
              <div style={{flexShrink:0,paddingTop:3,paddingRight:2}} onClick={e=>bulkLock.toggleCheck(m._id,e)}><input type="checkbox" checked={bulkLock.checkedIds.has(m._id)} onChange={()=>{}} style={{cursor:'pointer',accentColor:'var(--gold)',width:14,height:14}} /></div>
              <div style={{flexShrink:0,width:36,textAlign:'center',paddingTop:2}}>
                <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.2rem',color:'var(--text)',lineHeight:1}}>{m.startDate?new Date(m.startDate).getDate():'?'}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:8,color:'#4b5563'}}>{m.startDate?new Date(m.startDate).toLocaleDateString('en-US',{month:'short'}):''}</div>
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',marginBottom:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{m.name}</div>
                <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#6b7280',display:'flex',gap:8}}>
                  <span style={{color:CAT_C[m.org]||'#6b7280'}}>{m.org}</span>
                  <span>{m.city}, {m.state}</span>
                  {m.entryFee&&<span style={{color:'#C8922A'}}>${m.entryFee}</span>}
                </div>
              </div>
              <div style={{flexShrink:0,display:'flex',gap:4,alignItems:'center'}}>
                <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,padding:'2px 5px',background:m.approved?'rgba(34,197,94,.15)':'rgba(100,116,139,.15)',color:m.approved?'#22c55e':'#64748b'}}>{m.approved?'live':'draft'}</span>
                <span style={{color:sel===m._id?'var(--gold)':'#374151',fontSize:12}}>›</span>
              </div>
            </div>
          ))}
        </>)}
        </div>

        {selI && (
          <div style={{borderLeft:'1px solid var(--border)',overflowY:'auto',maxHeight:'calc(100vh - 350px)',background:'var(--bg)'}}>
            <div style={{padding:'12px 14px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--bg2)'}}>
              <span style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--gold)',letterSpacing:'.04em',textTransform:'uppercase'}}>Edit Match</span>
              <div style={{display:'flex',gap:6,alignItems:'center',flexWrap:'wrap'}}>
                {selI.websiteUrl && <a href={selI.websiteUrl} target="_blank" rel="noreferrer" style={{padding:'4px 10px',border:'1px solid var(--border)',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',textDecoration:'none'}}>Website ↗</a>}
                {selI.registrationUrl && <a href={selI.registrationUrl} target="_blank" rel="noreferrer" style={{padding:'4px 10px',border:'1px solid rgba(200,146,42,.4)',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#C8922A',textDecoration:'none'}}>Register ↗</a>}
                <button onClick={()=>patch(selI._id,{approved:!selI.approved})} className="cm2-ghost" style={{fontSize:9,color:selI.approved?'#6b7280':'#22c55e'}}>{selI.approved?'Unpublish':'Publish'}</button>
                <button onClick={()=>del(selI._id)} className="cm2-del">🗑</button>
                <button onClick={()=>setSel(null)} style={{background:'none',border:'none',color:'#64748b',cursor:'pointer',fontSize:16}}>✕</button>
              </div>
            </div>
            <div style={{padding:14}}>
              <F label="Match Name" field="name" />
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                <F label="Organization" field="org" opts={ORGS} />
                <F label="Discipline" field="discipline" opts={DISCS} />
                <F label="Match Type" field="matchType" opts={TYPES} />
                <F label="Level" field="level" opts={LEVELS} />
                <F label="Start Date" field="startDate" type="date" />
                <F label="End Date" field="endDate" type="date" />
                <F label="City" field="city" />
                <F label="State" field="state" />
                <F label="Entry Fee ($)" field="entryFee" type="number" />
                <F label="Capacity" field="capacity" type="number" />
              </div>
              <F label="Venue" field="venue" />
              <F label="Registration URL" field="registrationUrl" />
              <F label="Website URL" field="websiteUrl" />
              <F label="Description" field="description" rows={4} />
              <div style={{marginTop:8,display:'flex',gap:8,alignItems:'center'}}>
                <label style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#64748b',display:'flex',gap:6,alignItems:'center',cursor:'pointer'}}>
                  <input type="checkbox" defaultChecked={selI.featured} onChange={e=>patch(selI._id,{featured:e.target.checked})} />
                  Featured match
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

    {/* ── Image Search Modal ── */}
    {imgSearch && (
      <ImageSearchModal
        adminKey={adminKey}
        item={imgSearch}
        onApply={(imageUrl) => {
          // Update the item in local state
          setImgSearch(null)
        }}
        onClose={() => setImgSearch(null)}
      />
    )}
    </div>
  )
}
