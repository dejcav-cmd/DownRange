'use client'
import { useState, useEffect } from 'react'

const ALL_MODELS = {
  anthropic: [
    { id: 'claude-sonnet-4-5',         label: 'Claude Sonnet 4.6',  cost: '$$'   },
    { id: 'claude-opus-4-5',           label: 'Claude Opus 4.6',    cost: '$$$$' },
    { id: 'claude-haiku-4-5-20251001', label: 'Claude Haiku 4.5',   cost: '$'    },
  ],
  openai: [
    { id: 'gpt-4o',      label: 'GPT-4o',       cost: '$$$' },
    { id: 'gpt-4o-mini', label: 'GPT-4o Mini',  cost: '$'   },
    { id: 'o1-mini',     label: 'o1-mini',       cost: '$$'  },
  ],
  glm: [
    { id: 'glm-4.7',     label: 'GLM-4.7',       cost: '$$'  },
    { id: 'glm-4.5',     label: 'GLM-4.5',        cost: '$$'  },
    { id: 'glm-4.5-air', label: 'GLM-4.5 Air',    cost: '$'   },
    { id: 'glm-4.6',     label: 'GLM-4.6',        cost: '$'   },
  ],
}

const PROV_META = {
  anthropic: { icon: '🟠', name: 'Anthropic', color: '#f97316', env: 'ANTHROPIC_API_KEY' },
  openai:    { icon: '🟢', name: 'OpenAI',    color: '#22c55e', env: 'OPENAI_API_KEY'    },
  glm:       { icon: '🔵', name: 'Z.ai GLM',  color: '#3b82f6', env: 'GLM_API_KEY'       },
}

const USE_CASES = [
  { key: 'default',       label: 'Default',              env: 'AI_CHAIN',                desc: 'Fallback for unspecified tasks', tier: 'mid' },
  { key: 'news',          label: 'News Feed ×96/day',    env: 'AI_CHAIN_NEWS',           desc: '🔥 Highest volume — use cheapest model', tier: 'cheap' },
  { key: 'backfill',      label: 'Backfill ×12/day',     env: 'AI_CHAIN_BACKFILL',       desc: 'Hourly article backfill — cheap tier', tier: 'cheap' },
  { key: 'law',           label: 'Laws ×12/day',         env: 'AI_CHAIN_LAW',            desc: 'Bill analysis every 2h — mid tier', tier: 'mid' },
  { key: 'law-assistant', label: '⚖ Law Assistant',     env: 'AI_CHAIN_LAW_ASSISTANT',  desc: 'Live Q&A on /laws page — GLM-4.5 Air by default (cheapest)', tier: 'cheap' },
  { key: 'article',       label: 'Articles',              env: 'AI_CHAIN_ARTICLE',        desc: 'Blog posts, releases — mid tier', tier: 'mid' },
  { key: 'intel',         label: 'Intel ×1/day',          env: 'AI_CHAIN_INTEL',          desc: '✨ Daily briefing — use best model', tier: 'best' },
  { key: 'newsletter',    label: 'Newsletter ×1/day',     env: 'AI_CHAIN_NEWSLETTER',     desc: '✨ Goes to subscribers — use best', tier: 'best' },
  { key: 'outreach',      label: 'Outreach',               env: 'AI_CHAIN_OUTREACH',       desc: 'Email drafts — mid tier', tier: 'mid' },
  { key: 'fast',          label: 'Fast / Bulk',            env: 'AI_CHAIN_FAST',           desc: 'Bulk ops — absolute cheapest', tier: 'cheap' },
]

const PRESETS = {
  glmFirst:    [{ provider:'glm', model:'glm-4.7' },       { provider:'anthropic', model:'claude-sonnet-4-5' }],
  claudeFirst: [{ provider:'anthropic', model:'claude-sonnet-4-5' }, { provider:'glm', model:'glm-4.7' }],
  balanced:    [{ provider:'glm', model:'glm-4.7' },       { provider:'anthropic', model:'claude-sonnet-4-5' }, { provider:'openai', model:'gpt-4o-mini' }],
  quality:     [{ provider:'anthropic', model:'claude-opus-4-5' }, { provider:'glm', model:'glm-4.7' }, { provider:'openai', model:'gpt-4o' }],
  cheap:       [{ provider:'glm', model:'glm-4.5-air' },   { provider:'anthropic', model:'claude-haiku-4-5-20251001' }, { provider:'openai', model:'gpt-4o-mini' }],
}

const S = `
.cp-slot{display:flex;gap:8px;align-items:center;padding:10px 12px;background:var(--bg3);border:1px solid var(--border)}
.cp-slot.primary{border-color:var(--gold);background:rgba(200,146,42,.05)}
.cp-sel{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:6px 8px;outline:none}
.cp-sel:focus{border-color:var(--gold)}
.cp-inp{background:var(--bg2);border:1px solid var(--border);color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:8px 10px;width:100%;outline:none}
.cp-inp:focus{border-color:var(--gold)}
.cp-btn{background:var(--gold);color:#000;border:none;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;padding:9px 18px;cursor:pointer}
.cp-btn:hover{opacity:.85}
.cp-btn:disabled{opacity:.35;cursor:not-allowed}
.cp-ghost{background:none;border:1px solid var(--border);color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:10px;padding:5px 10px;cursor:pointer;transition:all .15s}
.cp-ghost:hover{border-color:var(--gold);color:var(--gold)}
.cp-del{background:none;border:none;color:#4b5563;cursor:pointer;font-size:13px;padding:2px 6px}
.cp-del:hover{color:#ef4444}
.cp-mv{background:none;border:1px solid var(--border);color:#4b5563;cursor:pointer;font-size:9px;padding:3px 6px}
.cp-mv:hover{border-color:var(--gold);color:var(--gold)}
.cp-tab{background:none;border:none;border-bottom:2px solid transparent;color:var(--text-dim);font-family:'IBM Plex Mono',monospace;font-size:11px;padding:9px 14px;cursor:pointer;transition:all .15s;white-space:nowrap}
.cp-tab.on{border-bottom-color:var(--gold);color:var(--gold)}
.cp-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
.cp-tag{font-family:'IBM Plex Mono',monospace;font-size:8px;font-weight:700;padding:2px 5px;border-radius:2px;text-transform:uppercase;letter-spacing:.06em}
.cp-divider{text-align:center;font-family:'IBM Plex Mono',monospace;font-size:9px;color:#374151;padding:3px 0;letter-spacing:.06em}
`

export default function AIProviderSettings({ adminKey }) {
  const [activeUC, setActiveUC] = useState('default')
  const [chains,   setChains]   = useState({
    default:    [{provider:'glm',model:'glm-4.7'},{provider:'anthropic',model:'claude-sonnet-4-5'}],
    news:       [{provider:'glm',model:'glm-4.5-air'},{provider:'anthropic',model:'claude-haiku-4-5-20251001'}],
    backfill:   [{provider:'glm',model:'glm-4.5-air'},{provider:'anthropic',model:'claude-haiku-4-5-20251001'}],
    law:        [{provider:'glm',model:'glm-4.7'},{provider:'anthropic',model:'claude-haiku-4-5-20251001'}],
    article:    [{provider:'glm',model:'glm-4.7'},{provider:'anthropic',model:'claude-sonnet-4-5'}],
    intel:      [{provider:'anthropic',model:'claude-sonnet-4-5'},{provider:'glm',model:'glm-4.7'}],
    newsletter: [{provider:'anthropic',model:'claude-sonnet-4-5'},{provider:'glm',model:'glm-4.7'}],
    outreach:   [{provider:'glm',model:'glm-4.7'},{provider:'anthropic',model:'claude-sonnet-4-5'}],
    fast:       [{provider:'glm',model:'glm-4.5-air'},{provider:'anthropic',model:'claude-haiku-4-5-20251001'}],
  })
  const [keys,     setKeys]     = useState({ openai:'', glm:'' })
  const [saved,    setSaved]    = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [vercelResult, setVercelResult] = useState(null)
  const [srvStatus,   setSrvStatus]   = useState(null)
  const [srvLoading,  setSrvLoading]  = useState(false)
  const [serverStatus, setServerStatus] = useState(null)
  const [statusLoading, setStatusLoading] = useState(false)
  const [testing,  setTesting]  = useState(false)
  const [testLog,  setTestLog]  = useState([])
  const [testRes,  setTestRes]  = useState('')
  const [msg,      setMsg]      = useState('')

  useEffect(() => {
    try {
      const s = localStorage.getItem('dr_ai_chains')
      if (s) setChains(JSON.parse(s))
      setKeys({ openai: localStorage.getItem('dr_openai_key')||'', glm: localStorage.getItem('dr_glm_key')||'' })
    } catch {}
  }, [])

  const flash = m => { setMsg(m); setTimeout(()=>setMsg(''), 4000) }
  const chainStr = c => c.map(s=>s.provider+':'+s.model).join(',')

  function saveLocal() {
    localStorage.setItem('dr_ai_chains', JSON.stringify(chains))
    if (keys.openai) localStorage.setItem('dr_openai_key', keys.openai)
    if (keys.glm)    localStorage.setItem('dr_glm_key',    keys.glm)
    setSaved(true); setTimeout(()=>setSaved(false), 2500)
  }

  async function pushToVercel() {
    setSaving(true); setVercelResult(null)
    const vars = {}
    for (const u of USE_CASES) { if (chains[u.key]?.length > 0) vars[u.env] = chainStr(chains[u.key]) }
    if (keys.openai) vars.OPENAI_API_KEY = keys.openai
    if (keys.glm)    vars.GLM_API_KEY    = keys.glm
    try {
      const res = await fetch('/api/admin/set-env', {
        method:'POST',
        headers:{'x-admin-key':adminKey,'Content-Type':'application/json'},
        body:JSON.stringify({vars})
      })
      const d = await res.json()
      setVercelResult(d)
      if (d.ok) flash('✅ Pushed to Vercel — trigger a redeploy to activate')
      else if (d.manual) flash('⚠ VERCEL_TOKEN not set — see manual instructions below')
      else flash('❌ ' + (d.error || d.message || 'Push failed — see details below'))
    } catch(e) {
      setVercelResult({ ok:false, error: e.message, httpError: true })
      flash('❌ Network error: ' + e.message)
    }
    setSaving(false)
  }

  async function testChain() {
    const chain = chains[activeUC]
    if (!chain.length) { setTestRes('⚠ Chain is empty'); return }
    setTesting(true); setTestLog([]); setTestRes('')
    const logs = []
    for (let i = 0; i < chain.length; i++) {
      const { provider, model } = chain[i]
      logs.push({ status:'testing', provider, model })
      setTestLog([...logs])
      try {
        const res = await fetch('/api/admin/ai-test', { method:'POST', headers:{'x-admin-key':adminKey,'Content-Type':'application/json'}, body:JSON.stringify({provider,model,openaiKey:keys.openai,glmKey:keys.glm}) })
        const d = await res.json()
        if (d.ok) { logs[i]={...logs[i],status:'ok',response:d.response}; setTestLog([...logs]); setTestRes('✅ Working — primary: '+provider+'/'+model); break }
        else       { logs[i]={...logs[i],status:'fail',error:d.error};    setTestLog([...logs]); if(i===chain.length-1) setTestRes('❌ All models failed') }
      } catch(e)   { logs[i]={...logs[i],status:'fail',error:e.message};  setTestLog([...logs]); if(i===chain.length-1) setTestRes('❌ All models failed') }
    }
    setTesting(false)
  }

  async function checkServer() {
    setSrvLoading(true); setSrvStatus(null)
    try {
      const r = await fetch('/api/admin/ai-status', {headers:{'x-admin-key':adminKey}})
      const d = await r.json()
      if (d.ok) setSrvStatus(d)
      else flash('❌ ' + d.error)
    } catch(e) { flash('❌ ' + e.message) }
    setSrvLoading(false)
  }

  function upd(uc, fn) { setChains(p=>({...p,[uc]:fn(p[uc]||[])})) }
  function addSlot(uc) {
    const cur = chains[uc]||[]
    const prov = ['glm','anthropic','openai'].find(p=>!cur.some(s=>s.provider===p))||'anthropic'
    upd(uc, c=>[...c,{provider:prov,model:ALL_MODELS[prov][0].id}])
  }

  const uc = USE_CASES.find(u=>u.key===activeUC)
  const chain = chains[activeUC]||[]

  return (
    <div>
      <style>{S}</style>

      <div style={{fontFamily:"'Bebas Neue',cursive",fontSize:'1.5rem',color:'var(--gold)',letterSpacing:'.05em',marginBottom:4}}>🤖 AI Model Chain</div>
      <p style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#64748b',marginBottom:20,lineHeight:1.8}}>
        Configure an ordered fallback chain. Primary model runs first — if it fails, the next is tried automatically. Set per use case.
      </p>

      {msg && <div style={{padding:'9px 14px',marginBottom:14,fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:msg.startsWith('✅')?'#22c55e':msg.startsWith('❌')?'#f87171':'#f59e0b',background:'var(--bg2)',border:'1px solid var(--border)'}}>{msg}</div>}

      {/* ── SERVER STATUS PANEL ── */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:serverStatus?12:0}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--text)',letterSpacing:'.05em',textTransform:'uppercase'}}>
            🖥 Live Server Status
          </div>
          <button className="cp-ghost" onClick={checkServer} disabled={srvLoading} style={{fontSize:10}}>
            {statusLoading ? '⏳ Checking...' : '🔍 Check Live Keys'}
          </button>
        </div>

        {serverStatus && (
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {/* Key presence */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[
                {label:'Anthropic',key:'ANTHROPIC_API_KEY',color:'#f97316',provider:'anthropic'},
                {label:'Z.ai GLM', key:'GLM_API_KEY',       color:'#3b82f6',provider:'glm'},
                {label:'OpenAI',   key:'OPENAI_API_KEY',    color:'#22c55e',provider:'openai'},
              ].map(p=>{
                const has   = serverStatus.status[p.key]
                const test  = serverStatus.tests[p.provider]
                const state = !has ? 'missing' : test?.ok ? 'live' : 'error'
                return (
                  <div key={p.key} style={{padding:'10px 12px',background:state==='live'?'rgba(34,197,94,.08)':state==='error'?'rgba(239,68,68,.08)':'rgba(0,0,0,.2)',border:`1px solid ${state==='live'?'rgba(34,197,94,.3)':state==='error'?'rgba(239,68,68,.3)':'var(--border)'}`}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:p.color,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:4}}>{p.label}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,color:state==='live'?'#22c55e':state==='error'?'#ef4444':'#4b5563'}}>
                      {state==='live'?'✅ LIVE':state==='error'?'❌ KEY ERROR':'— NOT SET'}
                    </div>
                    {test?.ok && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginTop:2}}>tested: {test.model}</div>}
                    {test?.error && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#f87171',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{test.error}</div>}
                    {!has && <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#374151',marginTop:2}}>Add to Vercel env vars</div>}
                  </div>
                )
              })}
            </div>
            {/* Active routing */}
            <div style={{padding:'10px 12px',background:'rgba(0,0,0,.2)',border:'1px solid var(--border)'}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Active Routing on This Server</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:4}}>
                {Object.entries(serverStatus.routing).map(([uc,model])=>(
                  <div key={uc} style={{display:'flex',gap:6,alignItems:'baseline'}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',minWidth:70}}>{uc}:</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:model.includes('⚠')?'#f59e0b':model==='none'?'#ef4444':'#22c55e',fontWeight:700}}>{model}</span>
                  </div>
                ))}
              </div>
            </div>
            {!serverStatus.status.VERCEL_TOKEN && (
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#f59e0b',padding:'8px 10px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
                ⚠ VERCEL_TOKEN not set — Push to Vercel button will show manual instructions instead of auto-pushing.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LIVE SERVER STATUS ── */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--text)',letterSpacing:'.05em',textTransform:'uppercase'}}>🖥 Live Server Status</div>
          <button className="cp-ghost" onClick={checkServer} disabled={srvLoading} style={{fontSize:10}}>
            {srvLoading ? '⏳ Checking...' : '🔍 Check Live Keys & Routing'}
          </button>
        </div>
        {srvStatus && (
          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[
                {label:'Anthropic', k:'ANTHROPIC_API_KEY', color:'#f97316', prov:'anthropic'},
                {label:'Z.ai GLM',  k:'GLM_API_KEY',       color:'#3b82f6', prov:'glm'},
                {label:'OpenAI',    k:'OPENAI_API_KEY',    color:'#22c55e', prov:'openai'},
              ].map(p=>{
                const has  = srvStatus.status[p.k]
                const test = srvStatus.tests?.[p.prov]
                const st   = !has ? 'none' : test?.ok ? 'ok' : 'err'
                return (
                  <div key={p.k} style={{padding:'10px 12px',background:st==='ok'?'rgba(34,197,94,.07)':st==='err'?'rgba(239,68,68,.07)':'rgba(0,0,0,.2)',border:`1px solid ${st==='ok'?'rgba(34,197,94,.3)':st==='err'?'rgba(239,68,68,.3)':'var(--border)'}`}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:p.color,letterSpacing:'.08em',marginBottom:4}}>{p.label}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,color:st==='ok'?'#22c55e':st==='err'?'#ef4444':'#4b5563'}}>
                      {st==='ok'?'✅ LIVE':st==='err'?'❌ BAD KEY':'— NOT SET'}
                    </div>
                    {test?.ok&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginTop:2}}>tested: {test.model}</div>}
                    {test?.error&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#f87171',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{test.error}</div>}
                    {!has&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#374151',marginTop:2}}>Add {p.k} in Vercel</div>}
                  </div>
                )
              })}
            </div>
            <div style={{padding:'10px 12px',background:'rgba(0,0,0,.2)',border:'1px solid var(--border)'}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Active Routing on This Server</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                {Object.entries(srvStatus.routing||{}).map(([uc,model])=>(
                  <div key={uc} style={{display:'flex',gap:5,alignItems:'baseline'}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',minWidth:68,flexShrink:0}}>{uc}:</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:model==='none'?'#ef4444':model.includes('⚠')?'#f59e0b':'#22c55e'}}>{model}</span>
                  </div>
                ))}
              </div>
            </div>
            {!srvStatus.status.VERCEL_TOKEN&&(
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#f59e0b',padding:'8px 10px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
                ⚠ VERCEL_TOKEN not set — "Push to Vercel" will show manual instructions. Add VERCEL_TOKEN to Vercel env vars to enable auto-push.
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── LIVE SERVER STATUS ── */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
          <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--text)',letterSpacing:'.05em',textTransform:'uppercase'}}>🖥 Live Server Status</div>
          <button className="cp-ghost" onClick={checkServer} disabled={srvLoading} style={{fontSize:10}}>
            {srvLoading ? '⏳ Checking...' : '🔍 Check Live Keys'}
          </button>
        </div>
        {srvStatus && (
          <div style={{marginTop:12,display:'flex',flexDirection:'column',gap:8}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>
              {[
                {label:'Anthropic',k:'ANTHROPIC_API_KEY',color:'#f97316',prov:'anthropic'},
                {label:'Z.ai GLM', k:'GLM_API_KEY',      color:'#3b82f6',prov:'glm'},
                {label:'OpenAI',   k:'OPENAI_API_KEY',   color:'#22c55e',prov:'openai'},
              ].map(p=>{
                const has=srvStatus.status[p.k], test=srvStatus.tests?.[p.prov]
                const st=!has?'none':test?.ok?'ok':'err'
                return (
                  <div key={p.k} style={{padding:'10px 12px',background:st==='ok'?'rgba(34,197,94,.07)':st==='err'?'rgba(239,68,68,.07)':'rgba(0,0,0,.2)',border:`1px solid ${st==='ok'?'rgba(34,197,94,.3)':st==='err'?'rgba(239,68,68,.3)':'var(--border)'}`}}>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:p.color,letterSpacing:'.08em',marginBottom:3}}>{p.label}</div>
                    <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,fontWeight:700,color:st==='ok'?'#22c55e':st==='err'?'#ef4444':'#4b5563'}}>
                      {st==='ok'?'✅ LIVE':st==='err'?'❌ BAD KEY':'— NOT SET'}
                    </div>
                    {test?.ok&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',marginTop:2}}>tested: {test.model}</div>}
                    {test?.error&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#f87171',marginTop:2,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{test.error}</div>}
                    {!has&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#374151',marginTop:2}}>Add {p.k} to Vercel</div>}
                  </div>
                )
              })}
            </div>
            <div style={{padding:'10px 12px',background:'rgba(0,0,0,.2)',border:'1px solid var(--border)'}}>
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#64748b',letterSpacing:'.08em',textTransform:'uppercase',marginBottom:6}}>Active Routing on This Server</div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6}}>
                {Object.entries(srvStatus.routing||{}).map(([uc,model])=>(
                  <div key={uc} style={{display:'flex',gap:5}}>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#4b5563',minWidth:68,flexShrink:0}}>{uc}:</span>
                    <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,fontWeight:700,color:model==='none'?'#ef4444':model.includes('warning')?'#f59e0b':'#22c55e'}}>{model}</span>
                  </div>
                ))}
              </div>
            </div>
            {!srvStatus.status.VERCEL_TOKEN&&<div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#f59e0b',padding:'8px 10px',background:'rgba(245,158,11,.08)',border:'1px solid rgba(245,158,11,.2)'}}>
              ⚠ VERCEL_TOKEN not set — Push button will show manual instructions.
            </div>}
          </div>
        )}
      </div>

    {/* API Keys */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:18}}>
        <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:13,fontWeight:700,color:'var(--text)',letterSpacing:'.05em',textTransform:'uppercase',marginBottom:12}}>🔑 API Keys</div>
        <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:12}}>
          <div>
            <span className="cp-lbl" style={{color:'#f97316'}}>Anthropic</span>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,padding:'8px 10px',background:'rgba(0,0,0,.2)',border:'1px solid var(--border)',color:'#64748b'}}>
              Set <code style={{color:'#f97316'}}>ANTHROPIC_API_KEY</code> in Vercel
            </div>
          </div>
          {[
            {k:'openai',label:'OpenAI',color:'#22c55e',ph:'sk-proj-...',env:'OPENAI_API_KEY',link:'platform.openai.com/api-keys'},
            {k:'glm',   label:'Z.ai GLM',color:'#3b82f6',ph:'GLM API key...',env:'GLM_API_KEY',link:'bigmodel.cn or z.ai'},
          ].map(x=>(
            <div key={x.k}>
              <span className="cp-lbl" style={{color:x.color}}>{x.label}</span>
              <input className="cp-inp" type="password" value={keys[x.k]} onChange={e=>setKeys(p=>({...p,[x.k]:e.target.value}))} placeholder={x.ph} />
              <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#374151',marginTop:3}}>Vercel: <code style={{color:x.color}}>{x.env}</code> · {x.link}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:'flex',borderBottom:'1px solid var(--border)',marginBottom:14,overflowX:'auto'}}>
        {USE_CASES.map(u=>(
          <button key={u.key} className={'cp-tab'+(activeUC===u.key?' on':'')} onClick={()=>setActiveUC(u.key)}>
            <span style={{color: u.tier==='cheap'?'#22c55e':u.tier==='best'?'#C8922A':'var(--text-dim)'}}>{u.label}</span>
            {chains[u.key]?.length>0&&<span style={{marginLeft:4,fontFamily:"'IBM Plex Mono',monospace",fontSize:8,background:'rgba(200,146,42,.15)',color:'var(--gold)',padding:'1px 4px'}}>{chains[u.key].length}</span>}
          </button>
        ))}
      </div>

      {/* Chain editor */}
      <div style={{background:'var(--bg2)',border:'1px solid var(--border)',padding:'14px 18px',marginBottom:14}}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,flexWrap:'wrap',gap:8}}>
          <div>
            <div style={{fontFamily:"'Barlow Condensed',sans-serif",fontSize:14,fontWeight:700,color:'var(--text)',letterSpacing:'.04em',textTransform:'uppercase'}}>{uc?.label} Chain</div>
            <div style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#4b5563'}}>{uc?.desc} · <code style={{color:'var(--gold)'}}>{uc?.env}</code></div>
          </div>
          <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
            <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#374151',alignSelf:'center'}}>Presets:</span>
            {[['glmFirst','GLM First'],['claudeFirst','Claude First'],['balanced','Balanced'],['quality','Max Quality'],['cheap','Cheapest']].map(([k,l])=>(
              <button key={k} className="cp-ghost" style={{fontSize:9,padding:'3px 8px'}} onClick={()=>upd(activeUC,()=>PRESETS[k])}>{l}</button>
            ))}
          </div>
        </div>

        {chain.length===0 ? (
          <div style={{padding:'20px',textAlign:'center',border:'1px dashed var(--border)',fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:'#374151'}}>
            Empty — falls back to <strong style={{color:'var(--gold)'}}>Default</strong> chain
          </div>
        ) : (
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {chain.map((slot,idx)=>{
              const pm = PROV_META[slot.provider]
              const models = ALL_MODELS[slot.provider]||[]
              return (
                <div key={idx}>
                  {idx>0 && <div className="cp-divider">↓ FALLBACK IF ABOVE FAILS</div>}
                  <div className={'cp-slot'+(idx===0?' primary':'')}>
                    {/* Position */}
                    <div style={{width:20,height:20,borderRadius:'50%',background:idx===0?'var(--gold)':'#1e293b',color:idx===0?'#000':'#64748b',display:'flex',alignItems:'center',justifyContent:'center',fontFamily:"'IBM Plex Mono',monospace",fontSize:10,fontWeight:700,flexShrink:0}}>{idx+1}</div>
                    {/* Provider */}
                    <select className="cp-sel" value={slot.provider} onChange={e=>{const p=e.target.value;const m=ALL_MODELS[p]?.[0]?.id||'';upd(activeUC,c=>c.map((s,i)=>i===idx?{provider:p,model:m}:s))}}>
                      {Object.entries(PROV_META).map(([k,v])=><option key={k} value={k}>{v.icon} {v.name}</option>)}
                    </select>
                    {/* Model */}
                    <select className="cp-sel" style={{flex:1}} value={slot.model} onChange={e=>upd(activeUC,c=>c.map((s,i)=>i===idx?{...s,model:e.target.value}:s))}>
                      {models.map(m=><option key={m.id} value={m.id}>{m.label} {m.cost}</option>)}
                    </select>
                    {/* Tags */}
                    {pm&&<span className="cp-tag" style={{background:pm.color+'22',color:pm.color,flexShrink:0}}>{pm.env.replace('_API_KEY','')}</span>}
                    {idx===0&&<span className="cp-tag" style={{background:'rgba(200,146,42,.15)',color:'#C8922A',flexShrink:0}}>PRIMARY</span>}
                    {/* Controls */}
                    <div style={{display:'flex',gap:3,flexShrink:0}}>
                      <button className="cp-mv" onClick={()=>upd(activeUC,c=>{const n=[...c];if(idx>0)[n[idx-1],n[idx]]=[n[idx],n[idx-1]];return n})} disabled={idx===0}>↑</button>
                      <button className="cp-mv" onClick={()=>upd(activeUC,c=>{const n=[...c];if(idx<c.length-1)[n[idx],n[idx+1]]=[n[idx+1],n[idx]];return n})} disabled={idx===chain.length-1}>↓</button>
                      <button className="cp-del" onClick={()=>upd(activeUC,c=>c.filter((_,i)=>i!==idx))}>✕</button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        <button className="cp-ghost" style={{marginTop:10}} onClick={()=>addSlot(activeUC)}>+ Add Fallback Model</button>

        {chain.length>0&&(
          <div style={{marginTop:10,padding:'8px 10px',background:'rgba(0,0,0,.2)',border:'1px solid var(--border)',fontFamily:"'IBM Plex Mono',monospace",fontSize:9,color:'#374151'}}>
            <span style={{color:'var(--gold)'}}>{uc?.env}</span> = <span style={{color:'#6b7280'}}>{chainStr(chain)}</span>
          </div>
        )}
      </div>

      {/* Test chain */}
      <div style={{marginBottom:18,padding:'12px 16px',background:'var(--bg2)',border:'1px solid var(--border)'}}>
        <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:testLog.length?10:0,flexWrap:'wrap'}}>
          <button className="cp-ghost" onClick={testChain} disabled={testing}>{testing?'⏳ Testing...':'🔬 Test Chain'}</button>
          {testRes&&<span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:11,color:testRes.startsWith('✅')?'#22c55e':testRes.startsWith('⚠')?'#f59e0b':'#f87171'}}>{testRes}</span>}
        </div>
        {testLog.map((log,i)=>{
          const pm = PROV_META[log.provider]
          return (
            <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'6px 10px',marginBottom:4,background:log.status==='ok'?'rgba(34,197,94,.06)':log.status==='fail'?'rgba(239,68,68,.06)':'rgba(0,0,0,.15)',border:`1px solid ${log.status==='ok'?'rgba(34,197,94,.2)':log.status==='fail'?'rgba(239,68,68,.2)':'var(--border)'}`}}>
              <span style={{fontSize:12,flexShrink:0}}>{log.status==='testing'?'⏳':log.status==='ok'?'✅':'❌'}</span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:pm?.color||'var(--text)',flexShrink:0}}>{pm?.icon} {log.provider}/{log.model}</span>
              <span style={{fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:log.status==='ok'?'#22c55e':log.status==='fail'?'#f87171':'#4b5563',flex:1,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {log.status==='ok'?log.response:log.status==='fail'?log.error:'connecting...'}
              </span>
            </div>
          )
        })}
      </div>

      {/* Save buttons */}
      <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
        <button className="cp-btn" onClick={saveLocal}>{saved?'✅ Saved':'💾 Save Locally'}</button>
        <button className="cp-btn" style={{background:saving?'#374151':'#1e3a5f',color:'#fff'}} onClick={pushToVercel} disabled={saving}>{saving?'Pushing...':'🚀 Push to Vercel'}</button>
      </div>

      {/* ── VERCEL PUSH RESULT ── */}
      {vercelResult && (
        <div style={{marginTop:14,padding:'12px 16px',background:'var(--bg2)',border:`1px solid ${vercelResult.ok?'rgba(34,197,94,.3)':vercelResult.manual?'rgba(245,158,11,.3)':'rgba(239,68,68,.3)'}`,fontFamily:"'IBM Plex Mono',monospace",fontSize:11}}>
          <div style={{fontWeight:700,color:vercelResult.ok?'#22c55e':vercelResult.manual?'#f59e0b':'#f87171',marginBottom:8}}>
            {vercelResult.ok ? '✅ Pushed successfully' : vercelResult.manual ? '⚠ Manual setup required' : '❌ Push failed'}
          </div>
          <div style={{color:'#6b7280',marginBottom:vercelResult.manual||vercelResult.results?8:0}}>{vercelResult.message}</div>

          {/* Manual env var instructions */}
          {vercelResult.manual && vercelResult.envLines && (
            <div style={{marginTop:8}}>
              <div style={{color:'#f59e0b',marginBottom:6}}>Add these to Vercel → Project → Settings → Environment Variables:</div>
              <div style={{background:'rgba(0,0,0,.4)',padding:'10px 12px',borderLeft:'3px solid #f59e0b',overflowX:'auto'}}>
                {vercelResult.envLines.split('\n').map((line,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',gap:16,marginBottom:3}}>
                    <code style={{color:'#C8922A'}}>{line.split('=')[0]}</code>
                    <code style={{color:'#9ca3af',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:320}}>{line.split('=').slice(1).join('=')}</code>
                  </div>
                ))}
              </div>
              <div style={{marginTop:8,color:'#4b5563',fontSize:10}}>
                To enable auto-push: add <code style={{color:'var(--gold)'}}>VERCEL_TOKEN</code> to Vercel env vars.
                Get a token at <a href="https://vercel.com/account/tokens" target="_blank" rel="noreferrer" style={{color:'var(--gold)'}}>vercel.com/account/tokens</a>.
              </div>
            </div>
          )}

          {/* Per-var results when token is set */}
          {vercelResult.results?.length > 0 && (
            <div style={{marginTop:8,display:'flex',flexDirection:'column',gap:3}}>
              {vercelResult.results.map((r,i) => (
                <div key={i} style={{display:'flex',gap:10,alignItems:'center'}}>
                  <span style={{color:r.ok?'#22c55e':'#f87171',flexShrink:0}}>{r.ok?'✅':'❌'}</span>
                  <code style={{color:'#C8922A',flexShrink:0}}>{r.name}</code>
                  {r.error && <span style={{color:'#f87171',flex:1}}>{r.error}</span>}
                  {r.status && !r.ok && <span style={{color:'#6b7280'}}>HTTP {r.status}</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div style={{marginTop:12,fontFamily:"'IBM Plex Mono',monospace",fontSize:10,color:'#374151',lineHeight:1.9}}>
        <strong style={{color:'var(--gold)'}}>How fallback works:</strong> Slot 1 is always tried first. If it fails (rate limit, quota, API error, timeout), the next slot runs automatically. All failures are logged to the cron dashboard.
        Push to Vercel writes the chain as env vars — redeploy to activate for server-side cron jobs.
      </div>
    </div>
  )
}
