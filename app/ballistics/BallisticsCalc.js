'use client'
import { useState, useMemo } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// G1 Drag Function — Cd vs Mach  (Bryan Litz, Applied Ballistics for LRS)
// ─────────────────────────────────────────────────────────────────────────────
const G1_CD = [
  [0.00,0.2629],[0.05,0.2558],[0.10,0.2487],[0.15,0.2413],
  [0.20,0.2340],[0.25,0.2285],[0.30,0.2232],[0.35,0.2199],
  [0.40,0.2186],[0.45,0.2162],[0.50,0.2138],[0.55,0.2129],
  [0.60,0.2139],[0.65,0.2176],[0.70,0.2261],[0.75,0.2434],
  [0.80,0.2663],[0.825,0.2788],[0.85,0.2985],[0.875,0.3170],
  [0.90,0.3373],[0.925,0.3549],[0.95,0.3710],[0.975,0.3848],
  [1.00,0.3988],[1.025,0.4106],[1.05,0.4190],[1.075,0.4249],
  [1.10,0.4236],[1.125,0.4156],[1.15,0.4006],[1.20,0.3752],
  [1.30,0.3450],[1.40,0.3227],[1.50,0.3084],[1.60,0.2983],
  [1.80,0.2843],[2.00,0.2755],[2.50,0.2578],[3.00,0.2332],
  [3.50,0.2147],[4.00,0.1998],[4.50,0.1877],[5.00,0.1770],
]
function g1Cd(mach) {
  if (mach <= 0) return G1_CD[0][1]
  for (let i = 0; i < G1_CD.length - 1; i++) {
    if (mach <= G1_CD[i+1][0]) {
      const t = (mach - G1_CD[i][0]) / (G1_CD[i+1][0] - G1_CD[i][0])
      return G1_CD[i][1] * (1-t) + G1_CD[i+1][1] * t
    }
  }
  return G1_CD[G1_CD.length-1][1]
}

// ─────────────────────────────────────────────────────────────────────────────
// 38 Caliber Presets
// BC data: Bryan Litz Applied Ballistics, Hornady, Sierra, and manufacturer specs
// ─────────────────────────────────────────────────────────────────────────────
const PRESETS = [
  // Rimfire
  { id:'22lr-40',     name:'.22 LR 40gr LRN',              mv:1080, bc:0.130, wt:40,  cat:'Rimfire'      },
  { id:'17hmr-17',    name:'.17 HMR 17gr V-Max',           mv:2550, bc:0.125, wt:17,  cat:'Rimfire'      },
  { id:'22wmr-40',    name:'.22 WMR 40gr JHP',             mv:1910, bc:0.118, wt:40,  cat:'Rimfire'      },
  // Pistol
  { id:'9mm-124',     name:'9mm 124gr FMJ',                mv:1150, bc:0.145, wt:124, cat:'Pistol'       },
  { id:'9mm-147',     name:'9mm 147gr HST',                mv:990,  bc:0.160, wt:147, cat:'Pistol'       },
  { id:'357sig-125',  name:'.357 SIG 125gr FMJ',           mv:1350, bc:0.172, wt:125, cat:'Pistol'       },
  { id:'40sw-165',    name:'.40 S&W 165gr JHP',            mv:1130, bc:0.185, wt:165, cat:'Pistol'       },
  { id:'10mm-180',    name:'10mm Auto 180gr FMJ',          mv:1275, bc:0.195, wt:180, cat:'Pistol'       },
  { id:'357mag-158',  name:'.357 Mag 158gr JHP',           mv:1235, bc:0.179, wt:158, cat:'Pistol'       },
  { id:'44mag-240',   name:'.44 Mag 240gr JHP',            mv:1180, bc:0.194, wt:240, cat:'Pistol'       },
  { id:'45acp-230',   name:'.45 ACP 230gr FMJ',            mv:830,  bc:0.195, wt:230, cat:'Pistol'       },
  // Intermediate
  { id:'223-55',      name:'.223 Rem 55gr FMJ',            mv:3240, bc:0.243, wt:55,  cat:'Intermediate' },
  { id:'556-77',      name:'5.56 77gr OTM',                mv:2750, bc:0.372, wt:77,  cat:'Intermediate' },
  { id:'762x39',      name:'7.62x39 123gr FMJ',            mv:2350, bc:0.275, wt:123, cat:'Intermediate' },
  { id:'6arc-108',    name:'6mm ARC 108gr ELD-M',          mv:2750, bc:0.536, wt:108, cat:'Intermediate' },
  { id:'300blk-125',  name:'.300 BLK 125gr TAC-TX (sup)', mv:2215, bc:0.320, wt:125, cat:'Intermediate' },
  { id:'300blk-220',  name:'.300 BLK 220gr OTM (sub)',    mv:1010, bc:0.275, wt:220, cat:'Intermediate' },
  // Hunting
  { id:'243-95',      name:'.243 Win 95gr SST',            mv:3025, bc:0.354, wt:95,  cat:'Hunting'      },
  { id:'270-130',     name:'.270 Win 130gr SST',           mv:3060, bc:0.430, wt:130, cat:'Hunting'      },
  { id:'7mm08-140',   name:'7mm-08 Rem 140gr HPBT',       mv:2800, bc:0.475, wt:140, cat:'Hunting'      },
  { id:'3006-165',    name:'.30-06 165gr SST',             mv:2800, bc:0.447, wt:165, cat:'Hunting'      },
  { id:'280ai-162',   name:'.280 AI 162gr ELD-X',         mv:2950, bc:0.631, wt:162, cat:'Hunting'      },
  { id:'3030-150',    name:'.30-30 Win 150gr FP',          mv:2390, bc:0.186, wt:150, cat:'Hunting'      },
  // Precision
  { id:'6cm-108',     name:'6mm CM 108gr ELD-M',           mv:2960, bc:0.536, wt:108, cat:'Precision'    },
  { id:'260-140',     name:'.260 Rem 140gr HPBT',          mv:2750, bc:0.490, wt:140, cat:'Precision'    },
  { id:'65cm-140',    name:'6.5 CM 140gr ELD-M',           mv:2710, bc:0.646, wt:140, cat:'Precision'    },
  { id:'308-168',     name:'.308 Win 168gr HPBT',          mv:2650, bc:0.470, wt:168, cat:'Precision'    },
  { id:'308-175',     name:'.308 Win 175gr Sierra MK',     mv:2600, bc:0.505, wt:175, cat:'Precision'    },
  // PRC Family
  { id:'65prc-143',   name:'6.5 PRC 143gr ELD-X',         mv:2960, bc:0.623, wt:143, cat:'PRC'          },
  { id:'7prc-175',    name:'7mm PRC 175gr ELD-X',         mv:2860, bc:0.689, wt:175, cat:'PRC'          },
  { id:'300prc-225',  name:'.300 PRC 225gr ELD-M',        mv:2810, bc:0.777, wt:225, cat:'PRC'          },
  // Magnum
  { id:'7rm-168',     name:'7mm Rem Mag 168gr HPBT',      mv:2940, bc:0.617, wt:168, cat:'Magnum'       },
  { id:'300wsm-210',  name:'.300 WSM 210gr Berger',       mv:2840, bc:0.730, wt:210, cat:'Magnum'       },
  { id:'300wm-190',   name:'.300 Win Mag 190gr HPBT',     mv:2980, bc:0.533, wt:190, cat:'Magnum'       },
  { id:'338wm-250',   name:'.338 Win Mag 250gr HPBT',     mv:2650, bc:0.645, wt:250, cat:'Magnum'       },
  { id:'338lap-300',  name:'.338 Lapua 300gr HPBT',       mv:2650, bc:0.818, wt:300, cat:'Magnum'       },
  // Specialty
  { id:'86blk-170',   name:'8.6 BLK 170gr OTM (super)',  mv:2550, bc:0.548, wt:170, cat:'Specialty'    },
  { id:'86blk-300',   name:'8.6 BLK 300gr OTM (sub)',    mv:1050, bc:0.485, wt:300, cat:'Specialty'    },
  { id:'300nm-230',   name:'.300 Norma 230gr ELD-M',      mv:2900, bc:0.789, wt:230, cat:'Specialty'    },
  // Custom
  { id:'custom',      name:'Custom Load',                  mv:2700, bc:0.500, wt:150, cat:'Custom'       },
]
const CAT_ORDER = ['Rimfire','Pistol','Intermediate','Hunting','Precision','PRC','Magnum','Specialty','Custom']

// ─────────────────────────────────────────────────────────────────────────────
// Ballistics Engine
// ─────────────────────────────────────────────────────────────────────────────
function computeTrajectory({ mv, bc, wt, altFt, tempF, windMph, zeroYds, scopeIn, maxYds }) {
  const G = 32.174
  const T_R = tempF + 459.67, T0_R = 518.67
  const rho = 0.002377 * Math.pow(Math.max(1 - 6.8756e-6 * altFt, 0.001), 5.2559) * (T0_R / T_R)
  const cFps = 1116.45 * Math.sqrt(T_R / T0_R)
  const BC   = bc * 7000 / (32.174 * 144)
  const STEP = maxYds <= 500 ? 25 : 50
  const recYds = []
  for (let y = 0; y <= maxYds; y += STEP) recYds.push(y)
  let vx = mv, vy = 0, yPos = 0, t = 0, xFt = 0
  const rawData = []
  for (const rYd of recYds) {
    const rFt = rYd * 3
    while (xFt < rFt - 0.001) {
      const dx = Math.min(0.5, rFt - xFt)
      const v  = Math.sqrt(vx*vx + vy*vy)
      if (v < 50) break
      const a_d = g1Cd(v / cFps) * rho * v * v / (2 * BC)
      const dt  = dx / Math.max(vx, 1)
      vx -= a_d * (vx/v) * dt; vy -= (a_d * (vy/v) + G) * dt
      yPos += vy * dt; t += dt; xFt += dx
    }
    const vTot = Math.sqrt(vx*vx + vy*vy)
    const lag  = t - (rYd * 3) / mv
    rawData.push({
      range: rYd, dropBore: yPos * 12, v: Math.round(vTot),
      energy: Math.round(0.5 * (wt/7000) / 32.174 * vTot * vTot),
      tof: t, drift: Math.round(windMph * 1.46667 * lag * 12 * 10) / 10,
      subsonic: vTot < 1100,
    })
  }
  const zeroRec = rawData.find(r => r.range === zeroYds) || rawData[Math.floor(rawData.length/3)]
  const dropAtZ = zeroRec ? zeroRec.dropBore : -5
  return rawData.map(r => {
    const sight = scopeIn + (dropAtZ - scopeIn) * (r.range / (zeroYds || 1))
    const bh    = r.dropBore - sight
    const moa   = r.range > 0 ? -bh / (1.0472 * r.range / 100) : 0
    const mrad  = r.range > 0 ? -bh / (3.6    * r.range / 100) : 0
    return { ...r, bh: Math.round(bh*10)/10, moa: Math.round(moa*10)/10, mrad: Math.round(mrad*100)/100 }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Trajectory Chart — supports 1 or 2 loads
// ─────────────────────────────────────────────────────────────────────────────
function TrajectoryChart({ dataA, dataB, maxYds, zeroYds, labelA, labelB }) {
  if (!dataA || dataA.length < 2) return null
  const W=720, H=230, PAD={t:18,r:20,b:38,l:54}, IW=W-PAD.l-PAD.r, IH=H-PAD.t-PAD.b
  const allBhs = [...dataA.map(d=>d.bh), ...(dataB||[]).map(d=>d.bh)]
  const yMin = Math.min(...allBhs, -5), yMax = Math.max(...allBhs, 2), yRange = yMax-yMin||1
  const scX = r => PAD.l + (r/maxYds)*IW
  const scY = v => PAD.t + IH - ((v-yMin)/yRange)*IH
  const zeroY = scY(0)
  const subX  = (dataA.find(d=>d.subsonic)?.range ?? null) !== null ? scX(dataA.find(d=>d.subsonic).range) : null
  const path  = data => 'M '+data.map(d=>`${scX(d.range).toFixed(1)},${scY(d.bh).toFixed(1)}`).join(' L ')
  const rawStep = yRange/4
  const step = rawStep<1?0.5:rawStep<5?Math.ceil(rawStep):Math.ceil(rawStep/5)*5
  const yTicks=[], xTicks=dataA.filter((_,i)=>i%Math.ceil(dataA.length/8)===0||dataA[i].range===maxYds)
  for(let v=Math.floor(yMin/step)*step;v<=yMax+step;v+=step) yTicks.push(v)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',maxWidth:W,display:'block'}}>
      <rect width={W} height={H} fill="var(--bg2)" rx="6"/>
      {subX&&<rect x={subX} y={PAD.t} width={W-PAD.r-subX} height={IH} fill="rgba(239,68,68,0.05)"/>}
      {yTicks.map(v=>(
        <line key={v} x1={PAD.l} x2={W-PAD.r} y1={scY(v)} y2={scY(v)} stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" opacity="0.5"/>
      ))}
      <line x1={PAD.l} x2={W-PAD.r} y1={zeroY} y2={zeroY} stroke="var(--gold)" strokeWidth="1" strokeDasharray="6,3" opacity="0.7"/>
      <text x={W-PAD.r+4} y={zeroY+4} fill="var(--gold)" fontSize="9" fontFamily="'IBM Plex Mono', monospace">0</text>
      <path d={path(dataA)} fill="none" stroke="var(--gold-light)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round"/>
      {dataB&&<path d={path(dataB)} fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="9,4"/>}
      <circle cx={scX(zeroYds)} cy={scY(0)} r="4" fill="var(--gold)" opacity="0.9"/>
      {subX&&subX<W-80&&<text x={subX+4} y={PAD.t+10} fill="#ef4444" fontSize="9" fontFamily="'IBM Plex Mono', monospace" opacity="0.8">SUBSONIC</text>}
      {dataB&&<>
        <text x={PAD.l+6} y={PAD.t+14} fill="var(--gold-light)" fontSize="9" fontFamily="'IBM Plex Mono', monospace">A: {labelA?.slice(0,28)}</text>
        <text x={PAD.l+6} y={PAD.t+26} fill="#60a5fa" fontSize="9" fontFamily="'IBM Plex Mono', monospace">B: {labelB?.slice(0,28)}</text>
      </>}
      <line x1={PAD.l} x2={W-PAD.r} y1={H-PAD.b} y2={H-PAD.b} stroke="var(--border-mid)" strokeWidth="1"/>
      {xTicks.map(d=>(
        <g key={d.range}>
          <line x1={scX(d.range)} x2={scX(d.range)} y1={H-PAD.b} y2={H-PAD.b+4} stroke="var(--border-mid)" strokeWidth="1"/>
          <text x={scX(d.range)} y={H-PAD.b+14} textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontFamily="'IBM Plex Mono', monospace">{d.range}</text>
        </g>
      ))}
      <text x={W/2} y={H-2} textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontFamily="'IBM Plex Mono', monospace">RANGE (yards)</text>
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H-PAD.b} stroke="var(--border-mid)" strokeWidth="1"/>
      {yTicks.filter(v=>v>=yMin&&v<=yMax).map(v=>(
        <text key={v} x={PAD.l-4} y={scY(v)+4} textAnchor="end" fill="var(--text-dim)" fontSize="9" fontFamily="'IBM Plex Mono', monospace">{v.toFixed(0)}</text>
      ))}
      <text x={12} y={H/2} textAnchor="middle" fill="var(--text-dim)" fontSize="9" fontFamily="'IBM Plex Mono', monospace" transform={`rotate(-90,12,${H/2})`}>INCHES (±LOS)</text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Grouped Selector
// ─────────────────────────────────────────────────────────────────────────────
function LoadSelector({ value, onChange, label, color }) {
  return (
    <div style={{marginBottom:12}}>
      <label style={{display:'flex',alignItems:'center',gap:6,fontSize:11,letterSpacing:'0.08em',fontFamily:"'IBM Plex Mono', monospace",color:'var(--text-muted)',marginBottom:4,textTransform:'uppercase'}}>
        {color&&<span style={{display:'inline-block',width:10,height:10,borderRadius:2,background:color,flexShrink:0}}/>}
        {label}
      </label>
      <select value={value} onChange={e=>onChange(e.target.value)}
        style={{width:'100%',background:'var(--bg3)',border:`1px solid ${color||'var(--border)'}`,color:'var(--text)',borderRadius:4,padding:'7px 10px',fontSize:13,fontFamily:"'IBM Plex Mono', monospace",cursor:'pointer'}}>
        {CAT_ORDER.map(cat=>{
          const opts=PRESETS.filter(p=>p.cat===cat)
          if(!opts.length) return null
          return (
            <optgroup key={cat} label={`── ${cat.toUpperCase()} ──`}>
              {opts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}
            </optgroup>
          )
        })}
      </select>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function BallisticsCalc() {
  const [pA, setPA] = useState('308-168')
  const [mvA, setMvA] = useState(2650); const [bcA, setBcA] = useState(0.470); const [wtA, setWtA] = useState(168)
  const [compareMode, setCompareMode] = useState(false)
  const [pB, setPB] = useState('65cm-140')
  const [mvB, setMvB] = useState(2710); const [bcB, setBcB] = useState(0.646); const [wtB, setWtB] = useState(140)
  const [alt, setAlt] = useState(0); const [temp, setTemp] = useState(59)
  const [wind, setWind] = useState(10); const [zero, setZero] = useState(100)
  const [scopeIn, setScopeIn] = useState(1.5); const [maxYds, setMaxYds] = useState(1000)

  const env = { altFt:alt, tempF:temp, windMph:wind, zeroYds:zero, scopeIn, maxYds }

  function applyPreset(id, setMv, setBc, setWt) {
    const p = PRESETS.find(p=>p.id===id)
    if (p && id!=='custom') { setMv(p.mv); setBc(p.bc); setWt(p.wt) }
  }

  const dataA = useMemo(()=>{ try { return computeTrajectory({mv:mvA,bc:bcA,wt:wtA,...env}) } catch{return[]} }, [mvA,bcA,wtA,alt,temp,wind,zero,scopeIn,maxYds])
  const dataB = useMemo(()=>{ if(!compareMode) return null; try { return computeTrajectory({mv:mvB,bc:bcB,wt:wtB,...env}) } catch{return null} }, [compareMode,mvB,bcB,wtB,alt,temp,wind,zero,scopeIn,maxYds])

  const labelA = PRESETS.find(p=>p.id===pA)?.name || 'Load A'
  const labelB = PRESETS.find(p=>p.id===pB)?.name || 'Load B'

  const inp = {width:'100%',background:'var(--bg3)',border:'1px solid var(--border)',color:'var(--text)',borderRadius:4,padding:'6px 10px',fontSize:13,fontFamily:"'IBM Plex Mono', monospace"}
  const sel = {...inp, cursor:'pointer'}
  const lbl = {display:'block',fontSize:11,letterSpacing:'0.08em',fontFamily:"'IBM Plex Mono', monospace",color:'var(--text-muted)',marginBottom:4,textTransform:'uppercase'}
  const triplet = (vals) => (
    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8,marginBottom:14}}>
      {vals.map(f=>(
        <div key={f.l}>
          <label style={lbl}>{f.l}</label>
          <input style={inp} type="number" value={f.v} min={f.min} max={f.max} step={f.s||1}
            onChange={e=>f.set(e.target.value)}/>
        </div>
      ))}
    </div>
  )

  const stat500A = (dataA.find(d=>d.range===500)||dataA[dataA.length-1])
  const stat500B = dataB && (dataB.find(d=>d.range===500)||dataB[dataB.length-1])

  return (<>
    <style>{`
      .bal-hero{background:var(--bg2);border-bottom:1px solid var(--border);padding:32px 0 28px}
      .bal-hero h1{font-family:'Bebas Neue',sans-serif;font-size:clamp(2.4rem,5vw,3.8rem);letter-spacing:.05em;color:var(--text);margin:0 0 6px}
      .bal-hero p{color:var(--text-muted);font-size:14px;margin:0;max-width:680px}
      .bal-tag{display:inline-block;padding:2px 10px;border-radius:3px;background:rgba(200,146,42,.13);color:var(--gold);font-size:10px;letter-spacing:.1em;margin-bottom:12px;font-family:'IBM Plex Mono',monospace}
      .bal-layout{display:grid;grid-template-columns:290px 1fr;gap:24px;align-items:start;padding:32px 0 48px}
      @media(max-width:860px){.bal-layout{grid-template-columns:1fr}}
      .bal-panel{background:var(--bg2);border:1px solid var(--border);border-radius:8px;padding:20px}
      .bal-panel-title{font-family:'Bebas Neue',sans-serif;font-size:1.05rem;letter-spacing:.08em;color:var(--gold);margin:0 0 14px}
      .bal-group{margin-bottom:12px}
      .bal-compare-toggle{display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 14px;border-radius:6px;border:1px solid var(--border);background:var(--bg3);color:var(--text-muted);cursor:pointer;font-size:11px;font-family:'IBM Plex Mono',monospace;letter-spacing:.06em;transition:all .15s;width:100%;margin-bottom:14px}
      .bal-compare-toggle.active{border-color:#3b82f6;color:#60a5fa;background:rgba(59,130,246,.08)}
      .bal-load-div{display:flex;align-items:center;gap:8px;margin:12px 0}
      .bal-load-div::before,.bal-load-div::after{content:'';flex:1;border-top:1px solid var(--border)}
      .bal-load-lbl{font-size:10px;font-family:'IBM Plex Mono',monospace;color:var(--text-dim);letter-spacing:.08em;white-space:nowrap}
      .bal-compare-note{background:rgba(59,130,246,.07);border:1px solid rgba(59,130,246,.25);border-radius:5px;padding:10px 12px;font-size:11px;font-family:'IBM Plex Mono',monospace;color:#93c5fd;margin-top:8px;line-height:1.5}
      .bal-stat-row{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:16px}
      .bal-stat{background:var(--bg3);border:1px solid var(--border);border-radius:6px;padding:10px 14px;min-width:95px}
      .bal-stat-num{font-family:'Bebas Neue',sans-serif;font-size:1.5rem;color:var(--gold);line-height:1}
      .bal-stat-num.b{color:#60a5fa}
      .bal-stat-lbl{font-size:10px;font-family:'IBM Plex Mono',monospace;color:var(--text-dim);letter-spacing:.07em;text-transform:uppercase;margin-top:2px}
      .bal-chart-wrap{margin-bottom:16px;border:1px solid var(--border);border-radius:6px;overflow:hidden;padding:10px 4px 4px;background:var(--bg2)}
      .bal-chart-leg{display:flex;gap:14px;padding:8px 12px;flex-wrap:wrap}
      .bal-chart-leg-item{display:flex;align-items:center;gap:6px;font-size:10px;font-family:'IBM Plex Mono',monospace;color:var(--text-muted)}
      .bal-chart-leg-sw{width:16px;height:3px;border-radius:1px}
      .bal-tw{overflow-x:auto}
      .bal-t{width:100%;border-collapse:collapse;font-size:11.5px;font-family:'IBM Plex Mono',monospace}
      .bal-t th{background:var(--bg3);color:var(--text-muted);padding:6px 8px;text-align:right;font-weight:600;letter-spacing:.04em;font-size:10px;border-bottom:1px solid var(--border);white-space:nowrap}
      .bal-t th:first-child{text-align:left}
      .bal-t td{padding:5px 8px;text-align:right;border-bottom:1px solid var(--border);color:var(--text);white-space:nowrap}
      .bal-t td:first-child{text-align:left;font-weight:600;color:var(--text-muted)}
      .bal-t tr:last-child td{border-bottom:none}
      .bal-t tr.zr td{background:rgba(200,146,42,.07)}
      .bal-t tr.zr td:first-child{color:var(--gold)}
      .bal-t tr.sub td{color:rgba(239,68,68,.75)}
      .bal-t td.pos{color:#16a34a}
      .bal-t td.neg{color:#ef4444}
      .bal-t td.warn{color:#f59e0b}
      .bal-t td.b{color:#60a5fa}
      .bal-t td.cb{background:rgba(59,130,246,.04)}
      .bal-t td.dp{color:#4ade80;font-size:10px}
      .bal-t td.dn{color:#f87171;font-size:10px}
      .bal-div{border:none;border-top:1px solid var(--border);margin:14px 0}
      .bal-note{background:rgba(200,146,42,.06);border:1px solid rgba(200,146,42,.2);border-radius:6px;padding:12px 14px;font-size:12px;color:var(--text-muted);line-height:1.6}
    `}</style>

    {/* Hero */}
    <div className="bal-hero">
      <div className="container">
        <div className="bal-tag">TOOLS</div>
        <h1>Ballistics Calculator</h1>
        <p>G1 external ballistics engine — 38 caliber presets from .17 HMR to .338 Lapua including the full PRC family. Drop tables, wind drift, MOA/MRAD corrections, and trajectory charts to 1,000 yards. Compare any two loads head-to-head.</p>
      </div>
    </div>

    <div className="dr-page"><div className="container"><div className="bal-layout">

      {/* ── Input Panel ── */}
      <div><div className="bal-panel">

        <button className={'bal-compare-toggle'+(compareMode?' active':'')} onClick={()=>setCompareMode(v=>!v)}>
          {compareMode ? '✕ EXIT COMPARE MODE' : '⚖ COMPARE TWO LOADS'}
        </button>

        {compareMode&&<div className="bal-load-div"><span className="bal-load-lbl">LOAD A — GOLD</span></div>}
        <LoadSelector value={pA} label={compareMode?'Load A':'Cartridge'} color={compareMode?'var(--gold)':null}
          onChange={id=>{setPA(id);applyPreset(id,setMvA,setBcA,setWtA)}}/>
        {triplet([
          {l:'MV (fps)',v:mvA,set:v=>{setPA('custom');setMvA(+v)},min:100,max:5000},
          {l:'G1 BC',  v:bcA,set:v=>{setPA('custom');setBcA(+v)},min:0.05,max:1.2,s:0.001},
          {l:'Wt (gr)',v:wtA,set:v=>{setPA('custom');setWtA(+v)},min:10,max:750},
        ])}

        {compareMode&&<>
          <div className="bal-load-div"><span className="bal-load-lbl">LOAD B — BLUE</span></div>
          <LoadSelector value={pB} label="Load B" color="#3b82f6"
            onChange={id=>{setPB(id);applyPreset(id,setMvB,setBcB,setWtB)}}/>
          {triplet([
            {l:'MV (fps)',v:mvB,set:v=>{setPB('custom');setMvB(+v)},min:100,max:5000},
            {l:'G1 BC',  v:bcB,set:v=>{setPB('custom');setBcB(+v)},min:0.05,max:1.2,s:0.001},
            {l:'Wt (gr)',v:wtB,set:v=>{setPB('custom');setWtB(+v)},min:10,max:750},
          ])}
          <div className="bal-compare-note">Both loads share zero, scope height, and environment. Δ column = B minus A.</div>
        </>}

        <hr className="bal-div"/>
        <div className="bal-panel-title">Environment</div>
        {[
          {l:'Altitude (ft MSL)',v:alt,set:setAlt,min:0,max:15000,s:100},
          {l:'Temperature (°F)', v:temp,set:setTemp,min:-40,max:120},
          {l:'Crosswind (mph, 90°)',v:wind,set:setWind,min:0,max:60},
        ].map(f=>(
          <div key={f.l} className="bal-group">
            <label style={lbl}>{f.l}</label>
            <input style={inp} type="number" value={f.v} min={f.min} max={f.max} step={f.s||1}
              onChange={e=>f.set(+e.target.value)}/>
          </div>
        ))}

        <hr className="bal-div"/>
        <div className="bal-panel-title">Zero & Optic</div>
        <div className="bal-group">
          <label style={lbl}>Zero Distance</label>
          <select style={sel} value={zero} onChange={e=>setZero(+e.target.value)}>
            {[25,50,100,150,200,250,300].map(y=><option key={y} value={y}>{y} yards</option>)}
          </select>
        </div>
        <div className="bal-group">
          <label style={lbl}>Scope Height (in above bore)</label>
          <input style={inp} type="number" value={scopeIn} min={0.5} max={4} step={0.1}
            onChange={e=>setScopeIn(+e.target.value)}/>
        </div>
        <div className="bal-group">
          <label style={lbl}>Max Range</label>
          <select style={sel} value={maxYds} onChange={e=>setMaxYds(+e.target.value)}>
            <option value={500}>500 yards</option>
            <option value={800}>800 yards</option>
            <option value={1000}>1,000 yards</option>
          </select>
        </div>
      </div></div>

      {/* ── Results Panel ── */}
      <div>
        {dataA.length > 0 ? (<>

          {/* Stats */}
          <div className="bal-stat-row">
            {compareMode ? (<>
              {[
                {l:'A — MV',   v:`${mvA} fps`,                             cls:''},
                {l:'B — MV',   v:`${mvB} fps`,                             cls:'b'},
                {l:'A 500yd',  v:`${stat500A?.energy?.toLocaleString() ?? '—'} ft-lb`, cls:''},
                {l:'B 500yd',  v:`${stat500B?.energy?.toLocaleString() ?? '—'} ft-lb`, cls:'b'},
              ].map(s=>(
                <div className="bal-stat" key={s.l}>
                  <div className={`bal-stat-num ${s.cls}`}>{s.v}</div>
                  <div className="bal-stat-lbl">{s.l}</div>
                </div>
              ))}
            </>) : (<>
              {[
                {l:'MV',        v:`${mvA} fps`},
                {l:'G1 BC',     v:bcA.toFixed(3)},
                {l:'Zero',      v:`${zero} yd`},
                {l:'500yd E',   v:`${stat500A?.energy?.toLocaleString() ?? '—'} ft-lb`},
              ].map(s=>(
                <div className="bal-stat" key={s.l}>
                  <div className="bal-stat-num">{s.v}</div>
                  <div className="bal-stat-lbl">{s.l}</div>
                </div>
              ))}
            </>)}
          </div>

          {/* Chart */}
          <div className="bal-chart-wrap">
            <TrajectoryChart dataA={dataA} dataB={dataB} maxYds={maxYds} zeroYds={zero} labelA={labelA} labelB={labelB}/>
            <div className="bal-chart-leg">
              <div className="bal-chart-leg-item">
                <div className="bal-chart-leg-sw" style={{background:'var(--gold-light)'}}/>
                {compareMode ? `A: ${labelA}` : 'Bullet path (±LOS)'}
              </div>
              {dataB&&<div className="bal-chart-leg-item">
                <div className="bal-chart-leg-sw" style={{background:'#60a5fa'}}/>
                B: {labelB}
              </div>}
              {dataA.some(d=>d.subsonic)&&<div className="bal-chart-leg-item">
                <div className="bal-chart-leg-sw" style={{background:'rgba(239,68,68,.4)'}}/>
                Subsonic (&lt;1,100 fps)
              </div>}
            </div>
          </div>

          {/* Table */}
          <div className="bal-tw"><table className="bal-t">
            <thead><tr>
              <th>Range</th>
              <th>{compareMode?'A Vel':'Velocity'}</th>
              {compareMode&&<th className="cb">B Vel</th>}
              <th>{compareMode?'A Energy':'Energy'}</th>
              {compareMode&&<th className="cb">B Energy</th>}
              <th>{compareMode?'A Path':'Bullet Path'}</th>
              {compareMode&&<th className="cb">B Path</th>}
              {compareMode&&<th>Δ Path</th>}
              <th>Wind {wind}mph</th>
              <th>↑MOA</th>
              {compareMode&&<th className="cb">B MOA</th>}
              <th>↑MRAD</th>
              <th>TOF</th>
            </tr></thead>
            <tbody>
              {dataA.map((rA,i)=>{
                const rB = dataB?.[i]
                const isZ = rA.range===zero, isSub=rA.subsonic&&rA.range>0
                const bhC = rA.bh>0.1?'pos':rA.bh<-0.1?'neg':''
                const delta = rB ? rB.bh-rA.bh : null
                return (
                  <tr key={rA.range} className={(isZ?'zr ':'')+(isSub?'sub':'')}>
                    <td>{rA.range} yd{isZ?' ★':''}</td>
                    <td>{rA.v.toLocaleString()} fps</td>
                    {compareMode&&<td className="cb b">{rB?`${rB.v.toLocaleString()} fps`:'—'}</td>}
                    <td>{rA.energy.toLocaleString()}</td>
                    {compareMode&&<td className="cb b">{rB?rB.energy.toLocaleString():'—'}</td>}
                    <td className={bhC}>{rA.range>0?`${rA.bh>0?'+':''}${rA.bh.toFixed(1)}"`:'—'}</td>
                    {compareMode&&<td className="cb b">{rB&&rB.range>0?`${rB.bh>0?'+':''}${rB.bh.toFixed(1)}"`:'—'}</td>}
                    {compareMode&&<td className={delta!==null?(delta>0.2?'dp':delta<-0.2?'dn':''):''}>{delta!==null&&rA.range>0?`${delta>0?'+':''}${delta.toFixed(1)}"`:'—'}</td>}
                    <td className="warn">{rA.range>0?`${rA.drift.toFixed(1)}"`: '—'}</td>
                    <td className={rA.moa>0.5?'neg':''}>{rA.range>0?rA.moa.toFixed(1):'—'}</td>
                    {compareMode&&<td className="cb b">{rB&&rB.range>0?rB.moa.toFixed(1):'—'}</td>}
                    <td>{rA.range>0?rA.mrad.toFixed(2):'—'}</td>
                    <td style={{color:'var(--text-dim)'}}>{rA.range>0?`${rA.tof.toFixed(3)}s`:'—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table></div>

          <hr className="bal-div"/>
          <div className="bal-note">
            <strong style={{color:'var(--gold)',fontFamily:"'IBM Plex Mono', monospace"}}>READING THIS TABLE</strong><br/>
            <strong>Bullet Path</strong> — inches above (+) or below (−) line of sight; zeroed at selected distance.&nbsp;
            <strong>↑MOA / ↑MRAD</strong> — scope correction to hit at that range; positive = dial up.&nbsp;
            <strong>Wind {wind}mph</strong> — full-value 90° crosswind drift; halve for 45°.&nbsp;
            {compareMode&&<><strong>Δ Path</strong> — positive means Load B hits higher than Load A.&nbsp;</>}
            Model: G1 drag function via 0.5ft numerical integration. For VLD/hybrid projectiles use G7 BC × 2.0 as approximate G1.
          </div>

        </>) : (
          <div className="dr-card" style={{textAlign:'center',padding:'48px 24px',color:'var(--text-muted)'}}>
            Enter valid bullet data to compute trajectory.
          </div>
        )}
      </div>

    </div></div></div>
  </>)
}
