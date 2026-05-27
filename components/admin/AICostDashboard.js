'use client'
import { useState, useEffect } from 'react'

const TIER_META = {
  nano:  { color:'#22c55e', label:'GLM-4.5 Air',      useCase:'News rewrites, backfill', costPer1M:'$0.14' },
  cheap: { color:'#3b82f6', label:'GLM-4.7',           useCase:'Laws, summaries',         costPer1M:'$0.28' },
  mid:   { color:'#f59e0b', label:'Claude Haiku 4.5',  useCase:'Releases, outreach',      costPer1M:'$4.00' },
  smart: { color:'#C8922A', label:'Claude Sonnet 4.6', useCase:'Intel, blog, releases',   costPer1M:'$15.00'},
}

const SONNET_RATE = 0.009 // $/1k tokens combined estimate

const S = `
.acd-card{background:var(--bg2);border:1px solid var(--border);padding:16px 20px}
.acd-num{fontFamily:"'Bebas Neue',cursive"}
.acd-bar{height:8px;background:rgba(255,255,255,.05);border-radius:4px;overflow:hidden}
.acd-bar-fill{height:100%;border-radius:4px;transition:width .4s ease}
.acd-lbl{font-family:'IBM Plex Mono',monospace;font-size:9px;color:#64748b;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;display:block}
`

export default function AICostDashboard({ adminKey }) {
  const [data,      setData]      = useState(null)
  const [loading,   setLoading]   = useState(true)
  const [refreshAt, setRefreshAt] = useState(null)

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ai-costs', { headers: { 'x-admin-key': adminKey } })
      const d = await res.json()
      if (d.ok) { setData(d); setRefreshAt(new Date()) }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { load() }, [adminKey])

  const todayByModel = data?.live?.today || {}
  const totalToday = data?.live?.todayUsd || 0
  const totalCalls = data?.live?.todayCalls || 0

  const modelRows = Object.entries(todayByModel).sort((a, b) => b[1].usd - a[1].usd)
  const maxUsd = Math.max(...modelRows.map(([, v]) => v.usd), 0.001)

  // Estimated savings vs all-Sonnet
  const sonnetEstimate = totalCalls * SONNET_RATE
  const saved = Math.max(0, sonnetEstimate - totalToday)

  return (
    <div>
      <style>{S}</style>

      <div style={{ display:'flex', alignItems:'flex-end', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:10 }}>
        <div>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', letterSpacing:'.06em', lineHeight:1 }}>
            💰 AI Cost Center
          </div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', marginTop:3 }}>
            Live token spend · Tiered routing · Cost vs Sonnet-only baseline
          </div>
        </div>
        <button onClick={load} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-dim)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, padding:'6px 12px', cursor:'pointer' }}>
          ↺ Refresh {refreshAt ? `(${refreshAt.toLocaleTimeString()})` : ''}
        </button>
      </div>

      {loading && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#4b5563', padding:32, textAlign:'center' }}>Loading cost data...</div>}

      {data && (
        <>
          {/* ── TOP STATS ── */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginBottom:20 }}>
            {[
              { label:'Spent Today',       value: '$' + totalToday.toFixed(4),  color:'#C8922A', sub: totalCalls + ' calls' },
              { label:'Est. Monthly',      value: '$' + (totalToday * 30).toFixed(2), color:'var(--text)', sub: 'at current rate' },
              { label:'Saved vs Sonnet',   value: '$' + saved.toFixed(2),        color:'#22c55e', sub: 'today vs all-Sonnet' },
              { label:'Monthly Savings',   value: '$' + (saved * 30).toFixed(0), color:'#22c55e', sub: 'projected' },
            ].map(s => (
              <div key={s.label} className="acd-card">
                <span className="acd-lbl">{s.label}</span>
                <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:s.color, letterSpacing:'.04em', lineHeight:1 }}>{s.value}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', marginTop:4 }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── TIER GUIDE ── */}
          <div style={{ marginBottom:16, padding:'14px 18px', background:'var(--bg2)', border:'1px solid var(--border)' }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:12 }}>
              Cost Tier Routing
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
              {Object.entries(TIER_META).map(([tier, meta]) => (
                <div key={tier} style={{ padding:'10px 12px', background:'rgba(0,0,0,.2)', borderLeft:`3px solid ${meta.color}` }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color:meta.color, letterSpacing:'.08em', textTransform:'uppercase', marginBottom:3 }}>
                    {tier.toUpperCase()}
                  </div>
                  <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text)', marginBottom:2 }}>{meta.label}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563', marginBottom:4 }}>{meta.useCase}</div>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:meta.color }}>{meta.costPer1M}<span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#374151' }}>/M tokens</span></div>
                </div>
              ))}
            </div>
          </div>

          {/* ── SPEND BY MODEL ── */}
          <div className="acd-card" style={{ marginBottom:16 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:14 }}>
              Today's Spend by Model
            </div>
            {modelRows.length === 0 ? (
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#374151', padding:'16px 0' }}>
                No AI calls recorded yet today. Data appears after the first cron run.
              </div>
            ) : modelRows.map(([model, v]) => (
              <div key={model} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'var(--text)' }}>{model}</span>
                  <div style={{ display:'flex', gap:12 }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280' }}>{v.calls} calls · {((v.inTok||0)+(v.outTok||0)).toLocaleString()} tok</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:'#C8922A' }}>${(v.usd||0).toFixed(5)}</span>
                  </div>
                </div>
                <div className="acd-bar">
                  <div className="acd-bar-fill" style={{ width: (v.usd / maxUsd * 100) + '%', background:'linear-gradient(90deg,#C8922A,#f59e0b)' }} />
                </div>
              </div>
            ))}
          </div>

          {/* ── OAUTH NOTE ── */}
          <div style={{ padding:'14px 18px', background:'rgba(59,130,246,.06)', border:'1px solid rgba(59,130,246,.25)', marginBottom:16 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'#3b82f6', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:8 }}>
              🔐 On OAuth / Free Tier Access
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#6b7280', lineHeight:1.9 }}>
              <strong style={{ color:'var(--text)' }}>Anthropic, OpenAI, and GLM all require API keys — none support OAuth.</strong>
              {' '}Your ChatGPT Plus subscription, Claude Pro account, or Z.ai account cannot be used for server-side API calls.
              These are separate billing systems. The API is consumption-based; your subscription is for the chat UI only.
              <br /><br />
              <strong style={{ color:'#22c55e' }}>The real solution is tiered routing.</strong>{' '}
              GLM-4.5 Air at $0.14/M tokens is 99% cheaper than Claude Sonnet at $15/M output.
              For bulk news rewrites where speed and coverage matter more than prose quality,
              GLM is perfectly adequate. Reserve Sonnet for intelligence briefings and public-facing long-form content.
            </div>
          </div>

          {/* ── SAVINGS CALCULATOR ── */}
          <div className="acd-card">
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--text)', letterSpacing:'.05em', textTransform:'uppercase', marginBottom:12 }}>
              Monthly Cost Comparison
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--border)' }}>
                    {['Strategy','News/day','Backfill/day','Total/day','Total/month'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#64748b', fontSize:9, letterSpacing:'.08em', textTransform:'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { strategy:'All Sonnet (was)',     news:'$33.12', bf:'$3.24', day:'$37+',  month:'$1,117', color:'#ef4444' },
                    { strategy:'All Haiku',             news:'$8.83',  bf:'$0.86', day:'$10',   month:'$300',   color:'#f59e0b' },
                    { strategy:'GLM Air for bulk',      news:'$0.47',  bf:'$0.05', day:'$1',    month:'$30',    color:'#22c55e' },
                    { strategy:'Tiered (current)',      news:'$0.47',  bf:'$0.12', day:'$1.50', month:'$45',    color:'#C8922A' },
                  ].map((row, i) => (
                    <tr key={i} style={{ borderBottom:'1px solid var(--border)', background: i === 3 ? 'rgba(200,146,42,.06)' : 'transparent' }}>
                      <td style={{ padding:'10px 12px', color:row.color, fontWeight: i===3?700:400 }}>{row.strategy}</td>
                      <td style={{ padding:'10px 12px', color:'#9ca3af' }}>{row.news}</td>
                      <td style={{ padding:'10px 12px', color:'#9ca3af' }}>{row.bf}</td>
                      <td style={{ padding:'10px 12px', color:'var(--text)', fontWeight:700 }}>{row.day}</td>
                      <td style={{ padding:'10px 12px', color:row.color, fontWeight:700 }}>{row.month}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
