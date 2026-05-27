'use client'
import { useState, useEffect } from 'react'

const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-5',         label: 'Claude Sonnet 4.6 — recommended' },
  { id: 'claude-opus-4-5',           label: 'Claude Opus 4.6 — highest quality, slower' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — fastest, cheapest' },
]

const OPENAI_MODELS = [
  { id: 'gpt-4o',      label: 'GPT-4o — recommended' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini — fast, cheaper' },
  { id: 'o1-mini',     label: 'o1-mini — reasoning tasks' },
]

const S = `
.aip-card{background:var(--bg2);border:1px solid var(--border);padding:20px 24px;margin-bottom:12px}
.aip-prov{width:100%;padding:14px 18px;border:2px solid var(--border);background:var(--bg3);cursor:pointer;transition:all .15s;text-align:left}
.aip-prov.on{border-color:var(--gold);background:rgba(200,146,42,.07)}
.aip-prov:hover:not(.on){border-color:#374151}
.aip-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;display:block}
.aip-sel,.aip-inp{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;padding:9px 12px;width:100%;outline:none}
.aip-sel:focus,.aip-inp:focus{border-color:var(--gold)}
.aip-save{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;padding:11px 28px;cursor:pointer;min-width:140px;transition:opacity .15s}
.aip-save:hover{opacity:.85}
.aip-test{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:10px 16px;cursor:pointer;transition:all .15s}
.aip-test:hover{border-color:var(--gold);color:var(--gold)}
.aip-test:disabled{opacity:.4;cursor:not-allowed}
`

export default function AIProviderSettings({ adminKey }) {
  const [provider,   setProvider]   = useState('anthropic')
  const [model,      setModel]      = useState('claude-sonnet-4-5')
  const [oaiKey,     setOaiKey]     = useState('')
  const [saved,      setSaved]      = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    setProvider(localStorage.getItem('dr_ai_provider') || 'anthropic')
    setModel(localStorage.getItem('dr_ai_model')    || 'claude-sonnet-4-5')
    setOaiKey(localStorage.getItem('dr_openai_key') || '')
  }, [])

  function save() {
    localStorage.setItem('dr_ai_provider', provider)
    localStorage.setItem('dr_ai_model',    model)
    if (oaiKey) localStorage.setItem('dr_openai_key', oaiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function testConnection() {
    setTesting(true); setTestResult('')
    try {
      const res = await fetch('/api/admin/ai-test', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey || '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, openaiKey: oaiKey }),
      })
      const d = await res.json()
      setTestResult(d.ok ? '✅ Connected — ' + d.response : '❌ ' + d.error)
    } catch (e) { setTestResult('❌ ' + e.message) }
    setTesting(false)
  }

  const models = provider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS

  return (
    <div style={{ marginBottom: 28 }}>
      <style>{S}</style>

      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', letterSpacing:'.05em', marginBottom:4 }}>
        🤖 AI Writing Provider
      </div>
      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginBottom:18, lineHeight:1.7 }}>
        Controls which AI writes articles — backfill, news feed, intelligence briefings, outreach drafts.
      </p>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:16 }}>
        {[
          { key:'anthropic', icon:'🟠', name:'Anthropic Claude', sub:'Uses ANTHROPIC_API_KEY in Vercel' },
          { key:'openai',    icon:'🟢', name:'OpenAI GPT',        sub:'Requires OPENAI_API_KEY' },
        ].map(p => (
          <button key={p.key} className={'aip-prov' + (provider===p.key?' on':'')}
            onClick={()=>{ setProvider(p.key); setModel(p.key==='anthropic'?'claude-sonnet-4-5':'gpt-4o') }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700,
              color:provider===p.key?'var(--gold)':'var(--text)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:3 }}>
              {p.icon} {p.name}
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563' }}>{p.sub}</div>
          </button>
        ))}
      </div>

      <div style={{ marginBottom:16 }}>
        <span className="aip-lbl">Model</span>
        <select className="aip-sel" value={model} onChange={e=>setModel(e.target.value)}>
          {models.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {provider==='openai' && (
        <div style={{ marginBottom:16 }}>
          <span className="aip-lbl">OpenAI API Key</span>
          <input className="aip-inp" type="password" value={oaiKey}
            onChange={e=>setOaiKey(e.target.value)} placeholder="sk-proj-..." />
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#475569', marginTop:8,
            lineHeight:1.8, padding:'10px 14px', background:'rgba(0,0,0,.3)', border:'1px solid var(--border)' }}>
            <strong style={{ color:'#f59e0b' }}>⚠ No OAuth available.</strong> OpenAI doesn't support signing in with a ChatGPT account for server-to-server API calls. A ChatGPT Plus subscription cannot be used here.<br/>
            Get an API key (separate from ChatGPT) at{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
              style={{ color:'var(--gold)' }}>platform.openai.com/api-keys</a>{' '}
            — takes 2 minutes, costs a few cents per article.
          </div>
        </div>
      )}

      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginTop:6 }}>
        <button className="aip-save" onClick={save}>
          {saved ? '✅ Saved' : 'Save Settings'}
        </button>
        <button className="aip-test" onClick={testConnection} disabled={testing}>
          {testing ? 'Testing...' : '🔬 Test Connection'}
        </button>
        {saved && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#22c55e' }}>
            Provider set to {provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} / {model}
          </span>
        )}
      </div>

      {testResult && (
        <div style={{ marginTop:12, fontFamily:"'IBM Plex Mono',monospace", fontSize:11,
          color:testResult.startsWith('✅')?'#22c55e':'#f87171',
          padding:'10px 14px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
          {testResult}
        </div>
      )}

      <div style={{ marginTop:14, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#374151', lineHeight:1.8 }}>
        Server-side cron jobs and backfill always use <code style={{ color:'var(--gold)' }}>ANTHROPIC_API_KEY</code> from Vercel regardless of this setting.
      </div>
    </div>
  )
}
