'use client'
import { useState, useEffect } from 'react'

const ANTHROPIC_MODELS = [
  { id: 'claude-sonnet-4-5',          label: 'Claude Sonnet 4.6 (Recommended)' },
  { id: 'claude-opus-4-5',            label: 'Claude Opus 4.6 (Highest quality, slower)' },
  { id: 'claude-haiku-4-5-20251001',  label: 'Claude Haiku 4.5 (Fastest, cheapest)' },
]

const OPENAI_MODELS = [
  { id: 'gpt-4o',      label: 'GPT-4o (Recommended)' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini (Fast, cheap)' },
  { id: 'o1',          label: 'o1 (Reasoning model)' },
]

export default function AIProviderSettings({ adminKey }) {
  const [provider,  setProvider]  = useState('anthropic')
  const [model,     setModel]     = useState('claude-sonnet-4-5')
  const [oaiKey,    setOaiKey]    = useState('')
  const [saved,     setSaved]     = useState(false)
  const [testing,   setTesting]   = useState(false)
  const [testResult,setTestResult]= useState('')

  useEffect(() => {
    const p = localStorage.getItem('dr_ai_provider') || 'anthropic'
    const m = localStorage.getItem('dr_ai_model')    || 'claude-sonnet-4-5'
    const k = localStorage.getItem('dr_openai_key')  || ''
    setProvider(p); setModel(m); setOaiKey(k)
  }, [])

  function save() {
    localStorage.setItem('dr_ai_provider', provider)
    localStorage.setItem('dr_ai_model',    model)
    if (oaiKey) localStorage.setItem('dr_openai_key', oaiKey)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function testProvider() {
    setTesting(true); setTestResult('')
    try {
      const res = await fetch('/api/admin/ai-test', {
        method: 'POST',
        headers: { 'x-admin-key': adminKey, 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, model, openaiKey: oaiKey }),
      })
      const d = await res.json()
      setTestResult(d.ok ? '✅ ' + d.response : '❌ ' + d.error)
    } catch(e) { setTestResult('❌ ' + e.message) }
    setTesting(false)
  }

  const models = provider === 'anthropic' ? ANTHROPIC_MODELS : OPENAI_MODELS

  return (
    <div className="dr-card" style={{ marginBottom: 24 }}>
      <div className="dr-card-title" style={{ marginBottom: 6 }}>🤖 AI Writing Provider</div>
      <p className="t-label-sm" style={{ marginBottom: 20, lineHeight: 1.7 }}>
        Controls which AI writes articles — backfill, live news feed, intelligence briefings.
        Anthropic is default. OpenAI requires your own API key (not stored server-side).
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
        {['anthropic','openai'].map(p => (
          <button key={p} onClick={() => { setProvider(p); setModel(p === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4o') }}
            style={{ padding: '14px 20px', border: `2px solid ${provider === p ? 'var(--gold)' : 'var(--border)'}`,
              background: provider === p ? 'rgba(200,146,42,.08)' : 'var(--bg2)',
              cursor: 'pointer', transition: 'all .15s' }}>
            <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700,
              color: provider === p ? 'var(--gold)' : 'var(--text)', letterSpacing: '.06em', textTransform: 'uppercase' }}>
              {p === 'anthropic' ? '🟠 Anthropic' : '🟢 OpenAI'}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#64748b', marginTop: 3 }}>
              {p === 'anthropic' ? 'Uses ANTHROPIC_API_KEY in Vercel' : 'Uses your key below'}
            </div>
          </button>
        ))}
      </div>

      <div style={{ marginBottom: 16 }}>
        <label className="op-label">Model</label>
        <select value={model} onChange={e => setModel(e.target.value)}
          style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
            fontFamily:"'IBM Plex Mono',monospace", fontSize: 12, padding: '8px 12px', width: '100%' }}>
          {models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
        </select>
      </div>

      {provider === 'openai' && (
        <div style={{ marginBottom: 16 }}>
          <label className="op-label">OpenAI API Key</label>
          <input type="password" value={oaiKey} onChange={e => setOaiKey(e.target.value)}
            placeholder="sk-proj-..."
            style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)',
              fontFamily:"'IBM Plex Mono',monospace", fontSize: 12, padding: '8px 12px', width: '100%' }} />
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize: 10, color:'#64748b', marginTop: 4 }}>
            Stored in browser localStorage only. Not sent to our servers. Used client-side when possible.
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <button onClick={save} className="dr-btn-primary" style={{ padding: '8px 20px' }}>
          Save Provider Settings
        </button>
        <button onClick={testProvider} disabled={testing} className="dr-btn-outline" style={{ padding: '8px 16px', fontSize: 12 }}>
          {testing ? 'Testing...' : '🔬 Test Connection'}
        </button>
        {saved && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize: 11, color: '#22c55e' }}>✅ Saved</span>}
      </div>
      {testResult && (
        <div style={{ marginTop: 12, fontFamily:"'IBM Plex Mono',monospace", fontSize: 11,
          color: testResult.startsWith('✅') ? '#22c55e' : '#ef4444',
          padding: '8px 12px', background: 'rgba(0,0,0,.3)', border: '1px solid var(--border)' }}>
          {testResult}
        </div>
      )}

      <div style={{ marginTop: 16, padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)',
        fontFamily:"'IBM Plex Mono',monospace", fontSize: 10, color: '#475569', lineHeight: 1.8 }}>
        <strong style={{ color: '#64748b' }}>Note:</strong> The server-side article writer (backfill, cron jobs) always uses{' '}
        <code style={{ color: 'var(--gold)' }}>ANTHROPIC_API_KEY</code> from Vercel env vars regardless of this setting.{' '}
        This setting controls client-side AI features. To switch the server writer to OpenAI, add{' '}
        <code style={{ color: 'var(--gold)' }}>OPENAI_API_KEY</code> to Vercel and contact support.
      </div>
    </div>
  )
}
