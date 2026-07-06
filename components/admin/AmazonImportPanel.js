'use client'
import { useState } from 'react'

const MONO  = "'IBM Plex Mono',monospace"
const GOLD  = 'var(--gold)'
const CATS  = ['accessory','optic','rifle','pistol','shotgun','ammo','suppressor','deal']
const TAG   = 'downrangeco-20'

export default function AmazonImportPanel({ adminKey }) {
  const [input,       setInput]       = useState('')
  const [cat,         setCat]         = useState('accessory')
  const [state,       setState]       = useState('idle')
  const [preview,     setPreview]     = useState(null)
  const [manualTitle, setManualTitle] = useState('')
  const [msg,         setMsg]         = useState('')
  const [history,     setHistory]     = useState([])

  const H = { 'x-admin-key': adminKey, 'Content-Type': 'application/json' }

  // ── Fetch preview ──────────────────────────────────────────────────────────
  async function fetchPreview() {
    if (!input.trim()) return
    setState('previewing')
    setMsg('')
    setPreview(null)
    setManualTitle('')
    try {
      const res  = await fetch('/api/admin/amazon-asin', {
        method: 'POST', headers: H,
        body: JSON.stringify({ input: input.trim(), category: cat, dryRun: true }),
      })
      const data = await res.json()
      // 422 = scrape failed — surface it the same way as a preview
      if (res.status === 422 || data.scrapeFailed) {
        setPreview({ ...data, scrapeFailed: true })
        setState('previewed')
        setMsg('⚠ Amazon blocked the scrape — enter the product title below to continue.')
        return
      }
      if (!res.ok) { setState('error'); setMsg(data.error || 'Failed'); return }
      setPreview(data)
      setState('previewed')
    } catch (e) { setState('error'); setMsg('Network error: ' + e.message) }
  }

  // ── Save deal ──────────────────────────────────────────────────────────────
  async function saveDeal() {
    if (!input.trim()) return
    const needsManual = preview?.scrapeFailed
    if (needsManual && !manualTitle.trim()) {
      setMsg('⚠ Enter the product title above before saving.')
      return
    }
    setState('saving')
    setMsg('')
    try {
      const res  = await fetch('/api/admin/amazon-asin', {
        method: 'POST', headers: H,
        body: JSON.stringify({
          input: input.trim(),
          category: cat,
          ...(needsManual ? { manualTitle: manualTitle.trim() } : {}),
        }),
      })
      const data = await res.json()
      // Scrape blocked — surface the manual title input instead of dead-end error
      if (res.status === 422 || data.scrapeFailed) {
        setPreview({ ...data, scrapeFailed: true })
        setState('previewed')
        setMsg('⚠ Amazon blocked the scrape — enter the product title below then click Add Deal again.')
        return
      }
      if (!res.ok) { setState('error'); setMsg(data.error || 'Save failed'); return }
      setState('done')
      setMsg(`✓ Saved — "${data.title}"`)
      setHistory(h => [{ asin: data.asin, title: data.title, price: data.price, url: data.affiliateUrl }, ...h].slice(0, 5))
      setInput(''); setPreview(null); setManualTitle('')
      setTimeout(() => setState('idle'), 3000)
    } catch (e) { setState('error'); setMsg('Network error: ' + e.message) }
  }

  const busy = state === 'previewing' || state === 'saving'

  // ── Styles ─────────────────────────────────────────────────────────────────
  const card = {
    background: 'var(--bg2)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '16px 18px', marginBottom: 16,
  }
  const label = {
    fontFamily: MONO, fontSize: 10, color: 'var(--text-muted)',
    textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 4, display: 'block',
  }
  const input_s = {
    width: '100%', background: 'var(--bg3)', border: '1px solid var(--border)',
    color: 'var(--text)', fontFamily: MONO, fontSize: 12, padding: '7px 10px',
    borderRadius: 4, boxSizing: 'border-box', outline: 'none',
  }
  const btn = (primary) => ({
    fontFamily: MONO, fontSize: 11, padding: '7px 16px', borderRadius: 4,
    border: 'none', cursor: busy ? 'not-allowed' : 'pointer',
    background:  primary ? GOLD : 'var(--bg4)',
    color:       primary ? '#000' : 'var(--text-muted)',
    opacity:     busy ? .5 : 1, transition: 'opacity .15s',
  })

  return (
    <div style={card}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14 }}>
        <span style={{ fontSize:16 }}>🛒</span>
        <span style={{ fontFamily:MONO, fontSize:11, color: GOLD, letterSpacing:'.06em', textTransform:'uppercase' }}>
          Amazon ASIN Import
        </span>
        <span style={{ fontFamily:MONO, fontSize:10, color:'var(--text-dim)', marginLeft:'auto' }}>
          tag: {TAG}
        </span>
      </div>

      {/* Input row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 140px', gap:10, marginBottom:10 }}>
        <div>
          <span style={label}>ASIN or Amazon URL</span>
          <input
            style={input_s}
            placeholder="B0CXXXXXXXX  or  https://amazon.com/dp/B0CXXXXXXXX"
            value={input}
            onChange={e => { setInput(e.target.value); setState('idle'); setPreview(null); setMsg('') }}
            onKeyDown={e => e.key === 'Enter' && !busy && fetchPreview()}
            disabled={busy}
          />
        </div>
        <div>
          <span style={label}>Category</span>
          <select
            style={{ ...input_s, cursor:'pointer' }}
            value={cat}
            onChange={e => setCat(e.target.value)}
            disabled={busy}
          >
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ display:'flex', gap:8, alignItems:'center' }}>
        <button style={btn(false)} onClick={fetchPreview} disabled={busy || !input.trim()}>
          {state === 'previewing' ? '⏳ Fetching…' : '🔍 Preview'}
        </button>
        <button style={btn(true)} onClick={saveDeal} disabled={busy || !input.trim()}>
          {state === 'saving' ? '⏳ Saving…' : '＋ Add Deal'}
        </button>
        {input && <button style={{ ...btn(false), padding:'7px 10px' }} onClick={() => { setInput(''); setPreview(null); setMsg(''); setState('idle') }}>✕</button>}
      </div>

      {/* Status / error message */}
      {msg && (
        <div style={{
          marginTop: 10, fontFamily: MONO, fontSize: 11, padding: '7px 10px', borderRadius: 4,
          background: state === 'error' ? 'rgba(239,68,68,.09)'  : state === 'done' ? 'rgba(34,197,94,.09)'  : 'var(--bg3)',
          border:     state === 'error' ? '1px solid #ef444433'  : state === 'done' ? '1px solid #22c55e33'  : '1px solid var(--border)',
          color:      state === 'error' ? '#f87171'              : state === 'done' ? '#6ee7a3'              : 'var(--text-muted)',
        }}>
          {msg}
        </div>
      )}

      {/* Preview card */}
      {preview && state === 'previewed' && (
        <div style={{
          marginTop: 12, padding: '10px 12px',
          background: 'var(--bg3)', border: `1px solid ${preview.scrapeFailed ? '#f59e0b44' : 'var(--border-mid)'}`, borderRadius: 4,
        }}>
          <div style={{ display:'flex', gap:12, alignItems:'flex-start' }}>
            {preview.imageUrl && !preview.scrapeFailed && (
              <img src={preview.imageUrl} alt="" style={{ width:64, height:64, objectFit:'cover', borderRadius:3, flexShrink:0 }} />
            )}
            <div style={{ flex:1, minWidth:0 }}>
              {preview.scrapeFailed ? (
                <div style={{ fontFamily:MONO, fontSize:10, color:'#f59e0b', marginBottom:8 }}>
                  ⚠ Amazon blocked product page — enter title manually to save
                </div>
              ) : (
                <div style={{ fontFamily:MONO, fontSize:11, color:'var(--text)', marginBottom:4, lineHeight:1.4 }}>
                  {preview.title}
                </div>
              )}
              <div style={{ display:'flex', gap:12, flexWrap:'wrap' }}>
                {preview.price && <span style={{ fontFamily:MONO, fontSize:11, color: GOLD }}>{preview.price}</span>}
                <span style={{ fontFamily:MONO, fontSize:10, color:'var(--text-dim)' }}>ASIN: {preview.asin}</span>
                <span style={{ fontFamily:MONO, fontSize:10, color:'var(--text-dim)' }}>{preview.category || cat}</span>
              </div>
            </div>
          </div>

          {/* Manual title input shown only when scrape failed */}
          {preview.scrapeFailed && (
            <div style={{ marginTop:10 }}>
              <span style={label}>Product Title <span style={{ color:'#ef4444' }}>*required</span></span>
              <input
                style={{ ...input_s, borderColor: manualTitle.trim() ? 'var(--border)' : '#f59e0b66' }}
                placeholder="e.g. Eberlestock Bando Bag Tactical Fanny Pack"
                value={manualTitle}
                onChange={e => setManualTitle(e.target.value)}
                disabled={busy}
              />
              <div style={{ fontFamily:MONO, fontSize:10, color:'var(--text-dim)', marginTop:4 }}>
                Copy the title from the Amazon product page. The affiliate link is already set.
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recent imports */}
      {history.length > 0 && (
        <div style={{ marginTop:14 }}>
          <span style={label}>Recently imported this session</span>
          {history.map((h, i) => (
            <div key={i} style={{
              display:'flex', alignItems:'center', gap:8,
              padding: '5px 0', borderBottom: i < history.length-1 ? '1px solid var(--border)' : 'none',
            }}>
              <span style={{ fontFamily:MONO, fontSize:10, color:'#22c55e' }}>✓</span>
              <span style={{ fontFamily:MONO, fontSize:10, color:'var(--text-muted)', flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {h.title}
              </span>
              {h.price && <span style={{ fontFamily:MONO, fontSize:10, color: GOLD, flexShrink:0 }}>{h.price}</span>}
              <a href={h.url} target="_blank" rel="noreferrer"
                style={{ fontFamily:MONO, fontSize:10, color:'var(--text-dim)', flexShrink:0, textDecoration:'none' }}>
                ↗
              </a>
            </div>
          ))}
        </div>
      )}

      {/* Tip */}
      <div style={{ marginTop:12, fontFamily:MONO, fontSize:10, color:'var(--text-dim)', lineHeight:1.5 }}>
        Paste any Amazon URL or bare ASIN. Product data is scraped automatically — category defaults to <em>accessory</em>.
        Once PA API credentials are active, the 6-hour cron handles this automatically.
      </div>
    </div>
  )
}
