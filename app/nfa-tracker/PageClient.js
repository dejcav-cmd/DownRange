'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const WAIT_DATA = [
  { type:'Form 4 (Suppressor)', method:'eForms', avg:47, min:21, max:90,  trend:'down', color:'#34D399' },
  { type:'Form 4 (SBR)', method:'eForms', avg:52,  min:25, max:95,  trend:'down', color:'#60A5FA' },
  { type:'Form 4 (SBS)', method:'eForms', avg:55,  min:28, max:100, trend:'stable', color:'#C084FC' },
  { type:'Form 4 (MG)', method:'eForms', avg:365, min:300, max:500, trend:'up', color:'#EF4444' },
  { type:'Form 4 Paper', method:'Paper mail', avg:240, min:180, max:360, trend:'stable', color:'#FBBF24' },
  { type:'Form 1 (Make SBR)', method:'eForms', avg:22, min:10, max:45, trend:'down', color:'#34D399' },
]

const RECENT_APPROVALS = [
  { item:'Dead Air Nomad-30', form:'Form 4', submitted:'2025-10-15', approved:'2026-04-28', days:195, state:'TX' },
  { item:'SilencerCo Omega 9K', form:'Form 4', submitted:'2025-11-01', approved:'2026-05-18', days:198, state:'FL' },
  { item:'Custom SBR (Form 1)', form:'Form 1', submitted:'2026-02-10', approved:'2026-03-21', days:39, state:'AZ' },
  { item:'Ruger MKIV SBR', form:'Form 1', submitted:'2026-03-05', approved:'2026-04-02', days:28, state:'WA' },
  { item:'Thunderbeast Ultra 9', form:'Form 4', submitted:'2025-10-20', approved:'2026-04-15', days:177, state:'GA' },
  { item:'SureFire SOCOM 300 SPS', form:'Form 4', submitted:'2024-10-11', approved:'2025-05-01', days:202, state:'OH' },
]

export default function NFATracker() {
  const [form, setForm] = useState({ item:'', type:'Form 4 (Suppressor)', method:'eForms', submitted:'' })
  const [estimate, setEstimate] = useState(null)

  function calcEstimate() {
    const w = WAIT_DATA.find(w => w.type === form.type && w.method === form.method) || WAIT_DATA[0]
    const submitted = form.submitted ? new Date(form.submitted) : new Date()
    const minDate = new Date(submitted); minDate.setDate(minDate.getDate() + w.min)
    const avgDate = new Date(submitted); avgDate.setDate(avgDate.getDate() + w.avg)
    const maxDate = new Date(submitted); maxDate.setDate(maxDate.getDate() + w.max)
    const elapsed = Math.floor((Date.now() - submitted) / 86400000)
    const pct = Math.min(100, Math.round((elapsed / w.avg) * 100))
    setEstimate({ ...w, minDate, avgDate, maxDate, elapsed, pct, submitted })
  }

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="NFA">
        <div className="container">
          <h1 className="page-hero-title">NFA Wait Time Tracker</h1>
          <p className="page-hero-sub">Current ATF Form 4 processing times · Community-reported approvals · Estimate your approval date</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container">

          {/* Current wait times grid */}
          <div style={{ marginBottom:'48px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>CURRENT ATF PROCESSING TIMES</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'12px' }}>
              {WAIT_DATA.map(w => (
                <div key={w.type} style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', borderTop:`3px solid ${w.color}` }}>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2.5rem', color:w.color, lineHeight:1 }}>{w.avg}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginBottom:'8px' }}>DAYS AVG</div>
                  <div style={{ fontSize:'13px', fontWeight:600, color:'#F0EDE6', marginBottom:'4px' }}>{w.type}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginBottom:'8px' }}>{w.method}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#374151' }}>Range: {w.min}–{w.max} days</div>
                  <div style={{ display:'flex', alignItems:'center', gap:'4px', marginTop:'6px' }}>
                    <span style={{ fontSize:'10px', color: w.trend==='down'?'#34D399':w.trend==='up'?'#EF4444':'#9CA3AF' }}>
                      {w.trend==='down'?'↓ Improving':w.trend==='up'?'↑ Getting longer':'→ Stable'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151', marginTop:'12px' }}>
              ⚠ Times are community estimates based on r/NFA data and official ATF eForms stats. Actual times vary. Last updated May 2026.
            </div>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px' }}>

            {/* Approval estimator */}
            <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'28px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>MY WAIT ESTIMATOR</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px', marginBottom:'20px' }}>
                <div>
                  <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>ITEM NAME</label>
                  <input value={form.item} onChange={e=>setForm(p=>({...p,item:e.target.value}))} placeholder="e.g. SilencerCo Omega 45K"
                    style={{ width:'100%', background:'#0D1117', border:'1px solid var(--border)', color:'#F5F5F3', padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', boxSizing:'border-box' }} />
                </div>
                <div>
                  <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>FORM TYPE</label>
                  <select value={form.type} onChange={e=>setForm(p=>({...p,type:e.target.value}))}
                    style={{ width:'100%', background:'#0D1117', border:'1px solid var(--border)', color:'#F5F5F3', padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }}>
                    {WAIT_DATA.map(w=><option key={w.type} value={w.type}>{w.type}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>SUBMISSION DATE</label>
                  <input type="date" value={form.submitted} onChange={e=>setForm(p=>({...p,submitted:e.target.value}))}
                    style={{ width:'100%', background:'#0D1117', border:'1px solid var(--border)', color:'#F5F5F3', padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', boxSizing:'border-box' }} />
                </div>
              </div>
              <button onClick={calcEstimate} style={{ width:'100%', background:'#C8922A', color:'#000', border:'none', padding:'12px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
                ESTIMATE MY APPROVAL DATE →
              </button>

              {estimate && (
                <div style={{ marginTop:'20px', padding:'16px', background:'#0D1117', border:'1px solid #C8922A40' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', marginBottom:'12px', letterSpacing:'0.1em' }}>YOUR ESTIMATE</div>
                  <div style={{ marginBottom:'12px' }}>
                    <div style={{ display:'flex', justifyContent:'space-between', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#6B7280', marginBottom:'6px' }}>
                      <span>Progress</span><span>{estimate.elapsed} / {estimate.avg} days ({estimate.pct}%)</span>
                    </div>
                    <div style={{ height:'6px', background:'#1F2428', borderRadius:'3px', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${estimate.pct}%`, background:'#C8922A', transition:'width 0.5s' }} />
                    </div>
                  </div>
                  {[
                    ['Best case', estimate.minDate],
                    ['Average', estimate.avgDate],
                    ['Worst case', estimate.maxDate],
                  ].map(([label,date])=>(
                    <div key={label} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }}>
                      <span style={{ color:'#6B7280' }}>{label}</span>
                      <span style={{ color: label==='Average'?'#C8922A':'#F0EDE6' }}>{date.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recent community approvals */}
            <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'28px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>RECENT COMMUNITY APPROVALS</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {RECENT_APPROVALS.map((r,i)=>(
                  <div key={i} style={{ padding:'12px 14px', background:'#0D1117', border:'1px solid var(--border)', display:'grid', gridTemplateColumns:'1fr auto', gap:'8px', alignItems:'center' }}>
                    <div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:700, color:'#F0EDE6', marginBottom:'3px' }}>{r.item}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>{r.form} · {r.state} · {r.days} days</div>
                    </div>
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.5rem', color:'#34D399', textAlign:'right' }}>{r.days}d</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop:'16px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151' }}>
                Community-reported. Data from r/NFA and r/suppressors.
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
