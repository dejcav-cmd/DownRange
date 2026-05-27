'use client'
import { useState, useEffect } from 'react'

const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-5',         label: 'Claude Sonnet 4.6 — recommended' },
  { id: 'claude-opus-4-5',           label: 'Claude Opus 4.6 — highest quality' },
  { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5 — fastest, cheapest' },
]

const OPENAI_MODELS = [
  { id: 'gpt-4o',      label: 'GPT-4o — recommended' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini — fast, cheaper' },
  { id: 'o1-mini',     label: 'o1-mini — reasoning tasks' },
]

const GLM_MODELS = [
  { id: 'glm-4.7',     label: 'GLM-4.7 — flagship (Dec 2025), best overall' },
  { id: 'glm-4.5',     label: 'GLM-4.5 — strong reasoning + coding' },
  { id: 'glm-4.5-air', label: 'GLM-4.5 Air — fast, lightweight' },
  { id: 'glm-4.6',     label: 'GLM-4.6 — balanced' },
]

const PROVIDERS = [
  {
    key:  'anthropic',
    icon: '🟠',
    name: 'Anthropic Claude',
    sub:  'Uses ANTHROPIC_API_KEY in Vercel',
    def:  'claude-sonnet-4-5',
    note: null,
  },
  {
    key:  'openai',
    icon: '🟢',
    name: 'OpenAI GPT',
    sub:  'Requires OPENAI_API_KEY',
    def:  'gpt-4o',
    note: 'API key required — ChatGPT Plus subscription does not work for API calls.',
    link: { text: 'Get key at platform.openai.com', url: 'https://platform.openai.com/api-keys' },
  },
  {
    key:  'glm',
    icon: '🔵',
    name: 'Z.ai GLM',
    sub:  'Requires GLM_API_KEY (Z.ai / ZhipuAI)',
    def:  'glm-4.7',
    note: 'OpenAI-compatible API. Get your key at bigmodel.cn (China) or z.ai (international). Set GLM_API_KEY in Vercel env vars.',
    link: { text: 'Get key at bigmodel.cn', url: 'https://open.bigmodel.cn' },
    link2: { text: 'or z.ai', url: 'https://z.ai' },
  },
]

const MODELS_BY_PROVIDER = {
  anthropic: ANTHROPIC_MODELS,
  openai:    OPENAI_MODELS,
  glm:       GLM_MODELS,
}

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
  const [glmKey,     setGlmKey]     = useState('')
  const [saved,      setSaved]      = useState(false)
  const [testing,    setTesting]    = useState(false)
  const [testResult, setTestResult] = useState('')

  useEffect(() => {
    setProvider(localStorage.getItem('dr_ai_provider') || 'anthropic')
    setModel(localStorage.getItem('dr_ai_model')       || 'claude-sonnet-4-5')
    setOaiKey(localStorage.getItem('dr_openai_key')    || '')
    setGlmKey(localStorage.getItem('dr_glm_key')       || '')
  }, [])

  function save() {
    localStorage.setItem('dr_ai_provider', provider)
    localStorage.setItem('dr_ai_model',    model)
    if (oaiKey) localStorage.setItem('dr_openai_key', oaiKey)
    if (glmKey) localStorage.setItem('dr_glm_key',    glmKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  async function testConnection() {
    setTesting(true); setTestResult('')
    try {
      const res = await fetch('/api/admin/ai-test', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey || '', 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, openaiKey: oaiKey, glmKey }),
      })
      const d = await res.json()
      setTestResult(d.ok ? '✅ Connected — ' + d.response : '❌ ' + d.error)
    } catch (e) { setTestResult('❌ ' + e.message) }
    setTesting(false)
  }

  const pConf   = PROVIDERS.find(p => p.key === provider)
  const models  = MODELS_BY_PROVIDER[provider] || ANTHROPIC_MODELS

  return (
    <div style={{ marginBottom: 28 }}>
      <style>{S}</style>

      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', letterSpacing:'.05em', marginBottom:4 }}>
        🤖 AI Writing Provider
      </div>
      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginBottom:18, lineHeight:1.7 }}>
        Controls which AI writes articles — backfill, news feed, intelligence briefings, outreach drafts.
      </p>

      {/* Provider selector — 3-column grid */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:10, marginBottom:16 }}>
        {PROVIDERS.map(p => (
          <button key={p.key} className={'aip-prov' + (provider===p.key?' on':'')}
            onClick={()=>{ setProvider(p.key); setModel(p.def) }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:15, fontWeight:700,
              color:provider===p.key?'var(--gold)':'var(--text)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:3 }}>
              {p.icon} {p.name}
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563' }}>{p.sub}</div>
          </button>
        ))}
      </div>

      {/* Model selector */}
      <div style={{ marginBottom:16 }}>
        <span className="aip-lbl">Model</span>
        <select className="aip-sel" value={model} onChange={e=>setModel(e.target.value)}>
          {models.map(m=><option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {/* OpenAI key */}
      {provider === 'openai' && (
        <div style={{ marginBottom:16 }}>
          <span className="aip-lbl">OpenAI API Key</span>
          <input className="aip-inp" type="password" value={oaiKey}
            onChange={e=>setOaiKey(e.target.value)} placeholder="sk-proj-..." />
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#475569', marginTop:8,
            lineHeight:1.8, padding:'10px 14px', background:'rgba(0,0,0,.3)', border:'1px solid var(--border)' }}>
            <strong style={{ color:'#f59e0b' }}>⚠ No OAuth.</strong> ChatGPT Plus subscriptions don't work for API calls — you need a separate API key.{' '}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noreferrer"
              style={{ color:'var(--gold)' }}>platform.openai.com/api-keys</a>
          </div>
        </div>
      )}

      {/* GLM key */}
      {provider === 'glm' && (
        <div style={{ marginBottom:16 }}>
          <span className="aip-lbl">GLM API Key (Z.ai / ZhipuAI)</span>
          <input className="aip-inp" type="password" value={glmKey}
            onChange={e=>setGlmKey(e.target.value)} placeholder="Paste your Z.ai API key..." />
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#475569', marginTop:8,
            lineHeight:1.9, padding:'10px 14px', background:'rgba(0,0,0,.3)', border:'1px solid var(--border)' }}>
            <strong style={{ color:'#3b82f6' }}>Z.ai / ZhipuAI (formerly ZhipuAI, now rebranded as Z.ai)</strong><br/>
            Get your API key at{' '}
            <a href="https://open.bigmodel.cn" target="_blank" rel="noreferrer" style={{ color:'var(--gold)' }}>bigmodel.cn</a>
            {' '}or{' '}
            <a href="https://z.ai" target="_blank" rel="noreferrer" style={{ color:'var(--gold)' }}>z.ai</a>
            {' '}→ Sign up → API Keys → Create.<br/>
            <br/>
            <strong style={{ color:'#f59e0b' }}>Recommended:</strong> Also add <code style={{ color:'var(--gold)', background:'rgba(200,146,42,.1)', padding:'1px 5px' }}>GLM_API_KEY</code> to{' '}
            <a href="https://vercel.com" target="_blank" rel="noreferrer" style={{ color:'var(--gold)' }}>Vercel env vars</a>{' '}
            so server-side cron jobs (backfill, intelligence, article rewriting) can use GLM automatically.<br/>
            <br/>
            <strong style={{ color:'#64748b' }}>Available models:</strong> GLM-4.7 (flagship), GLM-4.5, GLM-4.5 Air (fast/cheap), GLM-4.6<br/>
            <strong style={{ color:'#64748b' }}>Pricing:</strong> ~¥0.05/1K tokens (GLM-4.5 Air) — significantly cheaper than GPT-4o or Claude Sonnet.
          </div>
        </div>
      )}

      {/* Save + test */}
      <div style={{ display:'flex', gap:10, alignItems:'center', flexWrap:'wrap', marginTop:6 }}>
        <button className="aip-save" onClick={save}>
          {saved ? '✅ Saved' : 'Save Settings'}
        </button>
        <button className="aip-test" onClick={testConnection} disabled={testing}>
          {testing ? 'Testing...' : '🔬 Test Connection'}
        </button>
        {saved && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#22c55e' }}>
            Provider set to {provider} / {model}
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
        Server-side cron jobs use{' '}
        <code style={{ color:'var(--gold)' }}>ANTHROPIC_API_KEY</code> by default.
        To use GLM for crons, add <code style={{ color:'#3b82f6' }}>GLM_API_KEY</code> to Vercel and it will be preferred automatically.
      </div>
    </div>
  )
}
