'use client'
import { useState, useEffect, useCallback } from 'react'
import { CLAUDE_MODELS, OPENAI_MODELS, USE_CASES, labelFor } from '../../lib/aiModels'

const MONO = "'IBM Plex Mono',monospace"
const COND = "'Barlow Condensed',sans-serif"

const PROVIDERS = {
  anthropic: { name: 'Anthropic', color: '#f97316', models: CLAUDE_MODELS },
  openai:    { name: 'OpenAI',    color: '#22c55e', models: OPENAI_MODELS },
}

const PRESETS = [
  ['Cheapest',  [{ provider: 'anthropic', model: 'claude-haiku-5-5' }]],
  ['Balanced',  [{ provider: 'anthropic', model: 'claude-haiku-5-5' }, { provider: 'anthropic', model: 'claude-sonnet-5-5' }]],
  ['Quality',   [{ provider: 'anthropic', model: 'claude-sonnet-5-5' }, { provider: 'anthropic', model: 'claude-haiku-5-5' }]],
  ['Max',       [{ provider: 'anthropic', model: 'claude-opus-5-5' }, { provider: 'anthropic', model: 'claude-sonnet-5-5' }, { provider: 'anthropic', model: 'claude-haiku-5-5' }]],
]

const HEALTH = {
  ok:       { label: 'OK',                  color: '#22c55e' },
  retired:  { label: 'RETIRED ID (auto-mapped)', color: '#f59e0b' },
  unknown:  { label: 'UNKNOWN MODEL',       color: '#ef4444' },
  invalid:  { label: 'NOT IN ANTHROPIC LIST', color: '#ef4444' },
  nokey:    { label: 'NO API KEY',          color: '#ef4444' },
  disabled: { label: 'GLM DISABLED',        color: '#6b7280' },
}

const S = `
.am-card{background:var(--bg2);border:1px solid var(--border);padding:14px 18px;margin-bottom:14px}
.am-h{font-family:${COND};font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--text);margin-bottom:10px}
.am-sel{background:var(--bg3);border:1px solid var(--border);color:var(--text);font-family:${MONO};font-size:11px;padding:7px 8px;outline:none}
.am-sel:focus{border-color:var(--gold)}
.am-btn{background:var(--gold);color:#000;border:none;font-family:${COND};font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:9px 18px;cursor:pointer}
.am-btn:disabled{opacity:.4;cursor:not-allowed}
.am-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:${MONO};font-size:10px;padding:6px 11px;cursor:pointer}
.am-ghost:hover{border-color:var(--gold);color:var(--gold)}
.am-row{display:grid;grid-template-columns:150px 1fr auto;gap:12px;align-items:center;padding:10px 12px;border:1px solid var(--border);background:var(--bg3);margin-bottom:6px;cursor:pointer}
.am-row.on{border-color:var(--gold);background:rgba(200,146,42,.06)}
.am-pill{display:inline-block;font-family:${MONO};font-size:10px;padding:2px 7px;border:1px solid var(--border);margin:2px 4px 2px 0;color:var(--text)}
.am-pill.p{border-color:var(--gold);color:var(--gold)}
.am-tag{font-family:${MONO};font-size:9px;font-weight:700;letter-spacing:.05em;padding:2px 6px}
@media(max-width:760px){.am-row{grid-template-columns:1fr}}
`

export default function AIProviderSettings({ adminKey }) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [activeUC, setActiveUC] = useState('news')
  const [draft, setDraft] = useState({})            // useCase -> edited slots
  const [msg, setMsg] = useState('')
  const [pushing, setPushing] = useState(false)
  const [pushRes, setPushRes] = useState(null)
  const [testLog, setTestLog] = useState([])
  const [testing, setTesting] = useState(false)

  const H = { 'x-admin-key': adminKey }
  const flash = (m) => { setMsg(m); setTimeout(() => setMsg(''), 6000) }

  const load = useCallback(async (live = false) => {
    live ? setVerifying(true) : setLoading(true)
    try {
      const r = await fetch('/api/admin/ai-status' + (live ? '?live=1' : ''), { headers: H })
      const d = await r.json()
      if (d.ok) setData(d); else flash('❌ ' + (d.error || 'Failed to load'))
    } catch (e) { flash('❌ ' + e.message) }
    setLoading(false); setVerifying(false)
  }, [adminKey])

  useEffect(() => { load(false) }, [load])

  const routing = data?.routing || []
  const current = routing.find(r => r.useCase === activeUC)
  const uc = USE_CASES.find(u => u.key === activeUC)
  // edited chain, else what the server really uses (retired IDs shown as their replacement)
  const chain = draft[activeUC] || (current?.slots || []).filter(s => s.provider !== 'glm').map(s => ({ provider: s.provider, model: s.effective || s.model }))
  const setChain = (fn) => setDraft(p => ({ ...p, [activeUC]: fn(chain) }))
  const dirty = !!draft[activeUC]
  const chainStr = (c) => c.map(s => s.provider + ':' + s.model).join(',')

  async function push(vars, label) {
    setPushing(true); setPushRes(null)
    try {
      const r = await fetch('/api/admin/set-env', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ vars }) })
      const d = await r.json()
      setPushRes(d)
      if (d.ok) flash('✅ ' + label + ' pushed to Vercel. Redeploy to activate.')
      else if (d.manual) flash('⚠ VERCEL_TOKEN not set. Copy the values below into Vercel by hand.')
      else flash('❌ ' + (d.error || d.message || 'Push failed'))
    } catch (e) { flash('❌ ' + e.message) }
    setPushing(false)
  }

  const saveChain = async () => {
    if (!uc?.env) return flash('⚠ This task has no env var. It follows the built-in default.')
    if (!chain.length) return flash('⚠ Chain is empty')
    await push({ [uc.env]: chainStr(chain) }, uc.label)
    setDraft(p => { const n = { ...p }; delete n[activeUC]; return n })
  }
  const fixAll = () => push(Object.fromEntries((data.fixes || []).map(f => [f.env, f.to])), 'Corrected model IDs')

  async function testChain() {
    setTesting(true); setTestLog([])
    const logs = []
    for (const s of chain) {
      logs.push({ ...s, status: 'testing' }); setTestLog([...logs])
      try {
        const r = await fetch('/api/admin/ai-test', { method: 'POST', headers: { ...H, 'Content-Type': 'application/json' }, body: JSON.stringify({ provider: s.provider, model: s.model }) })
        const d = await r.json()
        logs[logs.length - 1] = d.ok ? { ...s, status: 'ok', note: d.response } : { ...s, status: 'fail', note: d.error }
      } catch (e) { logs[logs.length - 1] = { ...s, status: 'fail', note: e.message } }
      setTestLog([...logs])
    }
    setTesting(false)
  }

  const needFix = (data?.fixes || []).length
  const newModels = (data?.liveModels || []).filter(m => !(data.catalog || []).some(c => c.id === m.id) && /^claude-/.test(m.id) && !/-\d{8}$/.test(m.id))
  const keyCard = (p, label, color) => {
    const has = data?.keys?.[p], t = data?.tests?.[p]
    const state = !has ? ['NOT SET', '#6b7280'] : !t ? ['KEY PRESENT', '#9ca3af'] : t.ok ? ['LIVE', '#22c55e'] : ['ERROR', '#ef4444']
    return (
      <div style={{ padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--bg3)' }}>
        <div style={{ fontFamily: MONO, fontSize: 9, color, letterSpacing: '.08em', marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: state[1] }}>{state[0]}</div>
        {t?.ok && <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', marginTop: 2 }}>{t.model} · {t.ms}ms</div>}
        {t?.error && <div style={{ fontFamily: MONO, fontSize: 9, color: '#f87171', marginTop: 2, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{t.error}</div>}
      </div>
    )
  }

  return (
    <div>
      <style>{S}</style>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
        <div>
          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.7rem', color: 'var(--gold)', letterSpacing: '.05em', lineHeight: 1 }}>🤖 AI Models</div>
          <div style={{ fontFamily: MONO, fontSize: 11, color: '#64748b', marginTop: 4 }}>What the server really uses for each task, checked against Anthropic&apos;s live model list.</div>
        </div>
        <button className="am-btn" disabled={verifying || loading} onClick={() => load(true)}>{verifying ? '⏳ Verifying…' : '🔍 Verify with providers'}</button>
      </div>

      {msg && <div className="am-card" style={{ fontFamily: MONO, fontSize: 11, color: msg.startsWith('✅') ? '#22c55e' : msg.startsWith('⚠') ? '#f59e0b' : '#f87171' }}>{msg}</div>}
      {loading && <div className="am-card" style={{ fontFamily: MONO, fontSize: 11, color: '#6b7280' }}>Loading…</div>}

      {data && (
        <>
          {/* Providers */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 8, marginBottom: 14 }}>
            {keyCard('anthropic', 'ANTHROPIC', '#f97316')}
            {keyCard('openai', 'OPENAI', '#22c55e')}
            <div style={{ padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#3b82f6', letterSpacing: '.08em', marginBottom: 4 }}>Z.AI GLM</div>
              <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: '#6b7280' }}>OFF SITE-WIDE</div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', marginTop: 2 }}>Haiku 5.5 is cheaper and better</div>
            </div>
            <div style={{ padding: '10px 12px', border: '1px solid var(--border)', background: 'var(--bg3)' }}>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#9ca3af', letterSpacing: '.08em', marginBottom: 4 }}>VERCEL PUSH</div>
              <div style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: data.keys.vercel ? '#22c55e' : '#f59e0b' }}>{data.keys.vercel ? 'ENABLED' : 'NEEDS VERCEL_TOKEN'}</div>
            </div>
          </div>

          {/* Fix banner */}
          {needFix > 0 && (
            <div className="am-card" style={{ borderLeft: '3px solid #f59e0b' }}>
              <div className="am-h" style={{ color: '#f59e0b' }}>{needFix} setting{needFix > 1 ? 's' : ''} use retired or unavailable models</div>
              <div style={{ fontFamily: MONO, fontSize: 10, color: '#9ca3af', marginBottom: 10, lineHeight: 1.7 }}>
                These still run: the server maps old IDs to the current model on every call. Updating them removes the warning and keeps the settings honest.
              </div>
              {data.fixes.map(f => (
                <div key={f.env} style={{ fontFamily: MONO, fontSize: 10, marginBottom: 6, wordBreak: 'break-all' }}>
                  <span style={{ color: 'var(--gold)' }}>{f.env}</span>{' '}
                  <span style={{ color: '#f87171', textDecoration: 'line-through' }}>{f.from}</span>{' → '}
                  <span style={{ color: '#22c55e' }}>{f.to}</span>
                </div>
              ))}
              <button className="am-btn" style={{ marginTop: 8 }} disabled={pushing} onClick={fixAll}>{pushing ? 'Pushing…' : 'Fix all in Vercel'}</button>
            </div>
          )}

          {/* New models */}
          {newModels.length > 0 && (
            <div className="am-card" style={{ borderLeft: '3px solid #22c55e' }}>
              <div className="am-h" style={{ color: '#22c55e' }}>New Anthropic models available</div>
              {newModels.map(m => <div key={m.id} style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text)' }}>{m.name || m.id} <span style={{ color: '#6b7280' }}>({m.id})</span></div>)}
              <div style={{ fontFamily: MONO, fontSize: 10, color: '#6b7280', marginTop: 6 }}>Add them to lib/aiModels.js to make them selectable here.</div>
            </div>
          )}
          {data.liveModelsError && <div className="am-card" style={{ fontFamily: MONO, fontSize: 10, color: '#f87171' }}>Could not read Anthropic&apos;s model list: {data.liveModelsError}</div>}

          {/* Routing table */}
          <div className="am-card">
            <div className="am-h">What runs each task {data.liveModels ? <span style={{ color: '#22c55e', fontFamily: MONO, fontSize: 9, marginLeft: 8 }}>VERIFIED {new Date(data.checkedAt).toLocaleTimeString()}</span> : <span style={{ color: '#6b7280', fontFamily: MONO, fontSize: 9, marginLeft: 8 }}>NOT VERIFIED YET</span>}</div>
            {routing.map(r => {
              const bad = r.slots.filter(s => s.health !== 'ok')
              return (
                <div key={r.useCase} className={'am-row' + (activeUC === r.useCase ? ' on' : '')} onClick={() => setActiveUC(r.useCase)}>
                  <div>
                    <div style={{ fontFamily: COND, fontSize: 14, fontWeight: 700, color: 'var(--text)', textTransform: 'uppercase' }}>{r.label}</div>
                    <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280' }}>{r.desc}</div>
                  </div>
                  <div>
                    {r.slots.filter(s => s.provider !== 'glm').map((s, i) => (
                      <span key={i} className={'am-pill' + (i === 0 ? ' p' : '')}>{i === 0 ? '▶ ' : '↳ '}{labelFor(s.effective || s.model)}</span>
                    ))}
                    {bad.map((s, i) => <span key={'b' + i} className="am-tag" style={{ color: HEALTH[s.health]?.color, border: `1px solid ${HEALTH[s.health]?.color}55`, marginLeft: 4 }}>{HEALTH[s.health]?.label}{s.health === 'retired' ? ` ${s.model}` : ''}</span>)}
                  </div>
                  <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280' }}>{r.source}</div>
                </div>
              )
            })}
          </div>

          {/* Editor */}
          <div className="am-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
              <div>
                <div className="am-h" style={{ marginBottom: 2 }}>Edit: {uc?.label}</div>
                <div style={{ fontFamily: MONO, fontSize: 10, color: '#6b7280' }}>{uc?.desc} · <span style={{ color: 'var(--gold)' }}>{uc?.env || 'built-in default (lib/aiClient.js)'}</span></div>
              </div>
              <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                {PRESETS.map(([l, c]) => <button key={l} className="am-ghost" onClick={() => setChain(() => c)}>{l}</button>)}
              </div>
            </div>

            {chain.map((slot, idx) => {
              const pv = PROVIDERS[slot.provider] || PROVIDERS.anthropic
              const inList = pv.models.some(m => m.id === slot.model)
              return (
                <div key={idx}>
                  {idx > 0 && <div style={{ textAlign: 'center', fontFamily: MONO, fontSize: 9, color: '#4b5563', padding: '3px 0' }}>↓ IF ABOVE FAILS</div>}
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '8px 10px', background: 'var(--bg3)', border: `1px solid ${idx === 0 ? 'var(--gold)' : 'var(--border)'}`, flexWrap: 'wrap' }}>
                    <select className="am-sel" value={slot.provider} onChange={e => { const p = e.target.value; setChain(c => c.map((s, i) => i === idx ? { provider: p, model: PROVIDERS[p].models[0].id } : s)) }}>
                      {Object.entries(PROVIDERS).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
                    </select>
                    <select className="am-sel" style={{ flex: 1, minWidth: 160 }} value={slot.model} onChange={e => setChain(c => c.map((s, i) => i === idx ? { ...s, model: e.target.value } : s))}>
                      {!inList && <option value={slot.model}>{slot.model} (not in catalog)</option>}
                      {pv.models.map(m => <option key={m.id} value={m.id}>{m.label} · {m.cost} · {m.note || m.tier}</option>)}
                    </select>
                    {idx === 0 && <span className="am-tag" style={{ background: 'rgba(200,146,42,.15)', color: 'var(--gold)' }}>PRIMARY</span>}
                    <button className="am-ghost" disabled={idx === 0} onClick={() => setChain(c => { const n = [...c]; [n[idx - 1], n[idx]] = [n[idx], n[idx - 1]]; return n })}>↑</button>
                    <button className="am-ghost" onClick={() => setChain(c => c.filter((_, i) => i !== idx))}>✕</button>
                  </div>
                </div>
              )
            })}
            <button className="am-ghost" style={{ marginTop: 8 }} onClick={() => setChain(c => [...c, { provider: 'anthropic', model: 'claude-sonnet-5-5' }])}>+ Add fallback</button>
            {chain.length > 0 && uc?.env && <div style={{ marginTop: 10, fontFamily: MONO, fontSize: 10, color: '#6b7280', wordBreak: 'break-all' }}><span style={{ color: 'var(--gold)' }}>{uc.env}</span> = {chainStr(chain)}</div>}

            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <button className="am-ghost" disabled={testing || !chain.length} onClick={testChain}>{testing ? '⏳ Testing…' : '🔬 Test chain'}</button>
              <button className="am-btn" disabled={pushing || !dirty || !uc?.env} onClick={saveChain}>{pushing ? 'Pushing…' : !uc?.env ? 'Built-in default' : dirty ? 'Push to Vercel' : 'No changes'}</button>
              {dirty && <button className="am-ghost" onClick={() => setDraft(p => { const n = { ...p }; delete n[activeUC]; return n })}>Discard</button>}
            </div>
            {testLog.map((l, i) => (
              <div key={i} style={{ fontFamily: MONO, fontSize: 10, marginTop: 6, color: l.status === 'ok' ? '#22c55e' : l.status === 'fail' ? '#f87171' : '#9ca3af', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {l.status === 'ok' ? '✅' : l.status === 'fail' ? '❌' : '⏳'} {l.provider}/{l.model} {l.note ? '· ' + l.note : ''}
              </div>
            ))}
          </div>

          {pushRes && (
            <div className="am-card" style={{ fontFamily: MONO, fontSize: 10 }}>
              <div style={{ fontWeight: 700, color: pushRes.ok ? '#22c55e' : pushRes.manual ? '#f59e0b' : '#f87171', marginBottom: 6 }}>{pushRes.ok ? 'Pushed' : pushRes.manual ? 'Manual step needed' : 'Push failed'}</div>
              {pushRes.message && <div style={{ color: '#9ca3af', marginBottom: 6 }}>{pushRes.message}</div>}
              {pushRes.envLines && <pre style={{ margin: 0, padding: 10, background: 'rgba(0,0,0,.35)', color: 'var(--gold)', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>{pushRes.envLines}</pre>}
              {(pushRes.results || []).map((r, i) => <div key={i} style={{ color: r.ok ? '#22c55e' : '#f87171' }}>{r.ok ? '✅' : '❌'} {r.name} {r.error || ''}</div>)}
            </div>
          )}

          {/* Live model list */}
          {data.liveModels && (
            <div className="am-card">
              <div className="am-h">Models your Anthropic key can call</div>
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {data.liveModels.map(m => <span key={m.id} className="am-pill" style={{ borderColor: (data.catalog || []).some(c => c.id === m.id) ? 'var(--gold)' : 'var(--border)' }}>{m.id}</span>)}
              </div>
              <div style={{ fontFamily: MONO, fontSize: 9, color: '#6b7280', marginTop: 6 }}>Gold = selectable above.</div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
