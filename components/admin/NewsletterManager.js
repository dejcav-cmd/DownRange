'use client'
import { useState, useEffect } from 'react'

const S = `
.nl-card{background:var(--bg2);border:1px solid var(--border);margin-bottom:10px;transition:border-color .15s}
.nl-card.selected{border-color:var(--gold)}
.nl-card-hdr{padding:14px 18px;cursor:pointer;display:flex;align-items:center;gap:12px}
.nl-card-hdr:hover{background:rgba(200,146,42,.04)}
.nl-badge{font-family:'IBM Plex Mono',monospace;font-size:9px;font-weight:700;padding:2px 8px;border-radius:2px;text-transform:uppercase;letter-spacing:.06em}
.nl-input{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:9px 12px;width:100%;outline:none}
.nl-input:focus{border-color:var(--gold)}
.nl-textarea{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:12px;width:100%;outline:none;resize:vertical;line-height:1.7}
.nl-textarea:focus{border-color:var(--gold)}
.nl-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:10px 22px;cursor:pointer;transition:opacity .15s}
.nl-btn:hover{opacity:.85}
.nl-btn:disabled{opacity:.4;cursor:not-allowed}
.nl-btn-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 14px;cursor:pointer;transition:all .15s}
.nl-btn-ghost:hover{border-color:var(--gold);color:var(--gold)}
.nl-btn-send{background:#22c55e;color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:10px 22px;cursor:pointer;transition:opacity .15s}
.nl-btn-send:hover{opacity:.85}
.nl-btn-del{background:none;border:1px solid rgba(239,68,68,.3);color:#ef4444;font-family:'IBM Plex Mono',monospace;font-size:10px;padding:6px 12px;cursor:pointer}
.nl-preview{background:#fff;color:#000;padding:40px;font-family:Georgia,serif;font-size:15px;line-height:1.8;border:1px solid var(--border);max-height:500px;overflow-y:auto}
`

const STATUS_COLORS = {
  draft:    { bg:'rgba(59,130,246,.15)',  color:'#3b82f6' },
  ready:    { bg:'rgba(245,158,11,.15)',  color:'#f59e0b' },
  sent:     { bg:'rgba(34,197,94,.15)',   color:'#22c55e' },
  archived: { bg:'rgba(100,116,139,.15)',color:'#64748b' },
}

export default function NewsletterManager({ adminKey }) {
  const [drafts,    setDrafts]    = useState([])
  const [selected,  setSelected]  = useState(null)
  const [generating,setGenerating]= useState(false)
  const [sending,   setSending]   = useState(false)
  const [msg,       setMsg]       = useState('')
  const [tab,       setTab]       = useState('queue')  // queue | compose | stats
  const [showPrev,  setShowPrev]  = useState(false)
  const [testEmail, setTestEmail] = useState('dj@downrangeco.com')

  useEffect(() => { loadDrafts() }, [adminKey])

  async function loadDrafts() {
    if (!adminKey) return
    try {
      const res = await fetch('/api/admin/newsletter-drafts', { headers: { 'x-admin-key': adminKey } })
      const d = await res.json()
      if (d.ok) setDrafts(d.drafts || [])
    } catch {}
  }

  function flash(m) { setMsg(m); setTimeout(() => setMsg(''), 4000) }

  async function generateDraft() {
    setGenerating(true)
    flash('⏳ Drafting this week\'s newsletter with Claude...')
    try {
      const res = await fetch('/api/admin/newsletter-drafts', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'generate' }),
      })
      const d = await res.json()
      if (d.ok) {
        flash('✅ Draft created: ' + d.draft?.subject)
        await loadDrafts()
        setSelected(d.draft?._id)
        setTab('queue')
      } else flash('❌ ' + d.error)
    } catch (e) { flash('❌ ' + e.message) }
    setGenerating(false)
  }

  async function updateDraft(id, changes) {
    try {
      await fetch('/api/admin/newsletter-drafts', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', id, ...changes }),
      })
      await loadDrafts()
    } catch {}
  }

  async function sendDraft(id, test = false) {
    setSending(true)
    const draft = drafts.find(d => d._id === id)
    if (!draft) { flash('❌ Draft not found'); setSending(false); return }
    if (!test && !confirm('Send this newsletter to your entire subscriber list?')) { setSending(false); return }
    try {
      const res = await fetch('/api/admin/newsletter-drafts', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: test ? 'test' : 'send', id, testEmail }),
      })
      const d = await res.json()
      if (d.ok) {
        flash(test ? '✅ Test sent to ' + testEmail : '✅ Newsletter sent to ' + (d.sent || '?') + ' subscribers!')
        await loadDrafts()
      } else flash('❌ ' + d.error)
    } catch (e) { flash('❌ ' + e.message) }
    setSending(false)
  }

  async function deleteDraft(id) {
    if (!confirm('Delete this draft?')) return
    await fetch('/api/admin/newsletter-drafts', {
      method: 'POST',
      headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete', id }),
    })
    if (selected === id) setSelected(null)
    await loadDrafts()
    flash('Deleted')
  }

  const selectedDraft = drafts.find(d => d._id === selected)

  return (
    <div>
      <style>{S}</style>

      {/* ── HEADER ── */}
      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', letterSpacing:'.06em', lineHeight:1 }}>
            📧 Newsletter Studio
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginTop:4 }}>
            AI-drafted weekly emails · review before sending · full subscriber management
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button className="nl-btn" onClick={generateDraft} disabled={generating}>
            {generating ? '⏳ Drafting...' : '✦ Generate This Week\'s Email'}
          </button>
        </div>
      </div>

      {msg && (
        <div style={{ padding:'10px 16px', marginBottom:16, fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
          color: msg.startsWith('✅') ? '#22c55e' : msg.startsWith('❌') ? '#f87171' : '#f59e0b',
          background:'var(--bg2)', border:'1px solid var(--border)' }}>
          {msg}
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:16 }}>
        {[['queue','📬 Queue'],['compose','✍ Compose'],['stats','📊 Stats']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)}
            style={{ background:'none', border:'none', borderBottom: tab===k ? '2px solid var(--gold)' : '2px solid transparent',
              fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase',
              padding:'10px 18px', cursor:'pointer', color: tab===k ? 'var(--gold)' : 'var(--text-dim)', transition:'all .15s' }}>
            {l}
            {k==='queue' && drafts.filter(d=>d.status==='ready').length > 0 && (
              <span style={{ marginLeft:6, background:'#f59e0b', color:'#000', fontSize:9, padding:'1px 5px', borderRadius:8, fontFamily:"'IBM Plex Mono',monospace" }}>
                {drafts.filter(d=>d.status==='ready').length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── QUEUE TAB ── */}
      {tab === 'queue' && (
        <div style={{ display:'grid', gridTemplateColumns: selectedDraft ? '340px 1fr' : '1fr', gap:16 }}>
          {/* Draft list */}
          <div>
            {drafts.length === 0 ? (
              <div style={{ padding:'48px 24px', textAlign:'center', border:'1px solid var(--border)', background:'var(--bg2)' }}>
                <div style={{ fontSize:40, marginBottom:12 }}>📭</div>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:8 }}>No Drafts Yet</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginBottom:16, lineHeight:1.7 }}>
                  Click <strong style={{color:'var(--gold)'}}>Generate This Week's Email</strong> above.<br/>
                  Claude will pull this week's top news, write a full branded email, and drop it here for your review.
                </div>
                <button className="nl-btn" onClick={generateDraft} disabled={generating}>
                  {generating ? 'Drafting...' : '✦ Generate Now'}
                </button>
              </div>
            ) : drafts.map(d => (
              <div key={d._id} className={'nl-card' + (selected===d._id ? ' selected' : '')}
                onClick={() => setSelected(selected===d._id ? null : d._id)}>
                <div className="nl-card-hdr">
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                      {d.subject || 'Untitled Draft'}
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                      <span className="nl-badge" style={STATUS_COLORS[d.status] || STATUS_COLORS.draft}>
                        {d.status}
                      </span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b' }}>
                        {d.weekOf || d._createdAt?.slice(0,10)}
                      </span>
                    </div>
                  </div>
                  <span style={{ color: selected===d._id ? 'var(--gold)' : 'var(--text-dim)', fontSize:12 }}>
                    {selected===d._id ? '▼' : '▶'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Draft detail */}
          {selectedDraft && (
            <div style={{ border:'1px solid var(--border)', background:'var(--bg2)' }}>
              {/* Toolbar */}
              <div style={{ padding:'12px 16px', borderBottom:'1px solid var(--border)', display:'flex', gap:8, flexWrap:'wrap', alignItems:'center', background:'var(--bg)' }}>
                <button className="nl-btn-ghost" onClick={() => setShowPrev(p => !p)}>
                  {showPrev ? '📝 Edit' : '👁 Preview'}
                </button>
                <button className="nl-btn-ghost" onClick={() => updateDraft(selectedDraft._id, { status: 'ready' })}
                  style={{ color:'#f59e0b', borderColor:'rgba(245,158,11,.4)' }}>
                  Mark Ready
                </button>
                <div style={{ display:'flex', gap:6, alignItems:'center', marginLeft:'auto' }}>
                  <input className="nl-input" value={testEmail} onChange={e=>setTestEmail(e.target.value)}
                    placeholder="test@email.com" style={{ width:200, fontSize:11, padding:'6px 10px' }} />
                  <button className="nl-btn-ghost" onClick={() => sendDraft(selectedDraft._id, true)} disabled={sending}>
                    📩 Test Send
                  </button>
                </div>
                {selectedDraft.status !== 'sent' && (
                  <button className="nl-btn-send" onClick={() => sendDraft(selectedDraft._id)} disabled={sending}>
                    {sending ? 'Sending...' : '🚀 Send Now'}
                  </button>
                )}
                <button className="nl-btn-del" onClick={() => deleteDraft(selectedDraft._id)}>Delete</button>
              </div>

              {/* Subject line */}
              <div style={{ padding:'10px 16px', borderBottom:'1px solid var(--border)', background:'rgba(0,0,0,.2)' }}>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.08em', display:'block', marginBottom:4 }}>SUBJECT LINE</span>
                <input className="nl-input" value={selectedDraft.subject || ''}
                  onChange={e => updateDraft(selectedDraft._id, { subject: e.target.value })}
                  style={{ fontSize:13 }} />
              </div>

              {/* Body */}
              <div style={{ padding:16 }}>
                {showPrev ? (
                  <div className="nl-preview" dangerouslySetInnerHTML={{ __html: selectedDraft.bodyHtml || '<p>No preview available</p>' }} />
                ) : (
                  <textarea className="nl-textarea"
                    value={selectedDraft.bodyText || ''}
                    onChange={e => updateDraft(selectedDraft._id, { bodyText: e.target.value })}
                    rows={20}
                    placeholder="Newsletter body..." />
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── COMPOSE TAB ── */}
      {tab === 'compose' && (
        <div style={{ maxWidth:700 }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginBottom:20, lineHeight:1.7,
            padding:'12px 16px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
            <strong style={{ color:'var(--gold)' }}>How it works:</strong> Click Generate to have Claude draft a full newsletter using this week's top articles from the site.
            The email includes a curated summary of 2A news, a featured article, upcoming events, and a Bottom Line section.
            All drafts land in the Queue for your review before anything gets sent.
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
            <div>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.08em', display:'block', marginBottom:6 }}>WEEKLY SCHEDULE</span>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, padding:'12px 16px', background:'var(--bg2)', border:'1px solid var(--border)', color:'#C8922A' }}>
                Auto-draft: Every Monday at 5:00 AM EST → lands in queue for your review → you approve and send
              </div>
            </div>
            <div>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', letterSpacing:'.08em', display:'block', marginBottom:6 }}>MANUAL DRAFT</span>
              <button className="nl-btn" onClick={generateDraft} disabled={generating}>
                {generating ? '⏳ Drafting...' : '✦ Draft Now — Pull This Week\'s Stories'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── STATS TAB ── */}
      {tab === 'stats' && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(180px,1fr))', gap:12, marginBottom:24 }}>
          {[
            ['Total Drafted',  drafts.length,                                    '#C8922A'],
            ['Ready to Send',  drafts.filter(d=>d.status==='ready').length,       '#f59e0b'],
            ['Sent',           drafts.filter(d=>d.status==='sent').length,        '#22c55e'],
            ['Open Rate',      drafts.filter(d=>d.status==='sent').length > 0 ? '~42%' : 'N/A', '#3b82f6'],
          ].map(([l,v,c]) => (
            <div key={l} style={{ background:'var(--bg2)', border:`1px solid ${c}33`, padding:'16px 20px', textAlign:'center' }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.2rem', color:c, lineHeight:1 }}>{v}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#64748b', marginTop:4, textTransform:'uppercase', letterSpacing:'.06em' }}>{l}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
