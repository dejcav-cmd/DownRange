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
// Caliber Presets
// ─────────────────────────────────────────────────────────────────────────────
const PRESETS = [
  { id:'9mm-124',   name:'9mm 124gr FMJ',          mv:1150, bc:0.145, wt:124,  cat:'Pistol'  },
  { id:'45acp-230', name:'.45 ACP 230gr FMJ',       mv:830,  bc:0.195, wt:230,  cat:'Pistol'  },
  { id:'223-55',    name:'.223 Rem 55gr FMJ',        mv:3240, bc:0.243, wt:55,   cat:'Rifle'   },
  { id:'556-77',    name:'5.56 77gr OTM',            mv:2750, bc:0.372, wt:77,   cat:'Rifle'   },
  { id:'762x39',    name:'7.62×39 123gr FMJ',        mv:2350, bc:0.275, wt:123,  cat:'Rifle'   },
  { id:'308-168',   name:'.308 Win 168gr HPBT',      mv:2650, bc:0.470, wt:168,  cat:'Rifle'   },
  { id:'308-175',   name:'.308 Win 175gr Sierra MK', mv:2600, bc:0.505, wt:175,  cat:'Rifle'   },
  { id:'3006-165',  name:'.30-06 165gr SST',         mv:2800, bc:0.447, wt:165,  cat:'Rifle'   },
  { id:'65cm-140',  name:'6.5 CM 140gr ELD-M',       mv:2710, bc:0.646, wt:140,  cat:'Precision'},
  { id:'65prc-143', name:'6.5 PRC 143gr ELD-X',      mv:2960, bc:0.623, wt:143,  cat:'Precision'},
  { id:'300wm-190', name:'.300 Win Mag 190gr HPBT',  mv:2980, bc:0.533, wt:190,  cat:'Precision'},
  { id:'338lap-300',name:'.338 Lapua 300gr HPBT',    mv:2650, bc:0.818, wt:300,  cat:'Precision'},
  { id:'custom',    name:'Custom Load',              mv:2700, bc:0.500, wt:150,  cat:'Custom'  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Ballistics Engine — G1 Numerical Integration
// ─────────────────────────────────────────────────────────────────────────────
function computeTrajectory({ mv, bc, wt, altFt, tempF, windMph, zeroYds, scopeIn, maxYds }) {
  const G = 32.174          // ft/s²
  const DX = 0.5            // foot per step

  // Atmosphere
  const T_R  = tempF + 459.67
  const T0_R = 518.67
  const rho0 = 0.002377     // slug/ft³
  const p_ratio = Math.pow(Math.max(1 - 6.8756e-6 * altFt, 0.001), 5.2559)
  const rho  = rho0 * p_ratio * (T0_R / T_R)
  const cFps = 1116.45 * Math.sqrt(T_R / T0_R)   // speed of sound

  // BC: lb/in² → slug/ft²
  const BC = bc * 7000 / (32.174 * 144)

  // Build record-range list
  const STEP = maxYds <= 500 ? 25 : 50
  const recYds = []
  for (let y = 0; y <= maxYds; y += STEP) recYds.push(y)

  // 2-D integration (downrange + vertical)
  let vx = mv, vy = 0
  let yPos = 0   // inches below bore (negative = below)
  let t = 0
  let xFt = 0

  const rawData = []

  for (const rYd of recYds) {
    const rFt = rYd * 3
    while (xFt < rFt - 0.001) {
      const dx = Math.min(DX, rFt - xFt)
      const v  = Math.sqrt(vx*vx + vy*vy)
      if (v < 50) break

      const mach = v / cFps
      const Cd   = g1Cd(mach)
      const a_d  = Cd * rho * v * v / (2 * BC)   // ft/s²
      const dt   = dx / Math.max(vx, 1)

      vx  -= a_d * (vx/v) * dt
      vy  -= (a_d * (vy/v) + G) * dt
      yPos += vy * dt   // ft
      t    += dt
      xFt  += dx
    }

    const vTot = Math.sqrt(vx*vx + vy*vy)
    const KE   = 0.5 * (wt/7000) / 32.174 * vTot * vTot   // ft-lbs

    // Wind drift via lag rule (accurate for typical ranges)
    const lag     = t - (rYd * 3) / mv          // seconds
    const driftIn = windMph * 1.46667 * lag * 12 // inches (crosswind from right)

    rawData.push({
      range: rYd,
      dropBore: yPos * 12,   // inches below bore (negative)
      v: Math.round(vTot),
      energy: Math.round(KE),
      tof: t,
      drift: Math.round(driftIn * 10) / 10,
      subsonic: vTot < 1100,
    })
  }

  // Sight line: scope is scopeIn above bore at x=0
  // Crosses bullet at zeroYds
  const zeroRec = rawData.find(r => r.range === zeroYds) || rawData[Math.floor(rawData.length/3)]
  const dropAtZ = zeroRec ? zeroRec.dropBore : -5

  return rawData.map(r => {
    // Sight: from +scopeIn at x=0 down to dropAtZ at zeroYds
    const sight   = scopeIn + (dropAtZ - scopeIn) * (r.range / (zeroYds || 1))
    const bh      = r.dropBore - sight          // above sight line = positive
    const moa     = r.range > 0 ? -bh / (1.0472 * r.range / 100) : 0
    const mrad    = r.range > 0 ? -bh / (3.6    * r.range / 100) : 0
    return {
      ...r,
      bh:   Math.round(bh   * 10) / 10,
      moa:  Math.round(moa  * 10) / 10,
      mrad: Math.round(mrad * 100) / 100,
    }
  })
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG Trajectory Chart
// ─────────────────────────────────────────────────────────────────────────────
function TrajectoryChart({ data, maxYds, zeroYds }) {
  if (!data || data.length < 2) return null
  const W = 720, H = 220, PAD = { t:16, r:20, b:36, l:52 }
  const IW = W - PAD.l - PAD.r
  const IH = H - PAD.t - PAD.b

  const bhs = data.map(d => d.bh)
  const yMin = Math.min(...bhs, -5)
  const yMax = Math.max(...bhs, 2)
  const yRange = yMax - yMin || 1

  const scaleX = r => PAD.l + (r / maxYds) * IW
  const scaleY = v => PAD.t + IH - ((v - yMin) / yRange) * IH

  // Zero line Y
  const zeroY = scaleY(0)
  // Subsonic transition X
  const subEntry = data.find(d => d.subsonic)
  const subX = subEntry ? scaleX(subEntry.range) : null

  // Build path
  const pts = data.map(d => `${scaleX(d.range).toFixed(1)},${scaleY(d.bh).toFixed(1)}`).join(' ')
  const pathD = `M ${pts.split(' ').join(' L ')}`

  // X-axis labels
  const xTicks = data.filter((_, i) => i % Math.ceil(data.length/8) === 0 || data[i].range === maxYds)

  // Y-axis labels
  const rawStep = yRange / 4
  const step = rawStep < 1 ? 0.5 : rawStep < 5 ? Math.ceil(rawStep) : Math.ceil(rawStep/5)*5
  const yTicks = []
  for (let v = Math.floor(yMin/step)*step; v <= yMax + step; v += step) yTicks.push(v)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{width:'100%',maxWidth:W,display:'block'}}>
      {/* Background */}
      <rect width={W} height={H} fill="var(--bg2)" rx="6" />

      {/* Subsonic zone */}
      {subX && (
        <rect x={subX} y={PAD.t} width={W-PAD.r-subX} height={IH}
          fill="rgba(239,68,68,0.06)" />
      )}

      {/* Grid */}
      {yTicks.map(v => (
        <line key={v} x1={PAD.l} x2={W-PAD.r} y1={scaleY(v)} y2={scaleY(v)}
          stroke="var(--border)" strokeWidth="1" strokeDasharray="3,3" opacity="0.6" />
      ))}

      {/* Zero line */}
      <line x1={PAD.l} x2={W-PAD.r} y1={zeroY} y2={zeroY}
        stroke="var(--gold)" strokeWidth="1" strokeDasharray="6,3" opacity="0.8" />
      <text x={W-PAD.r+4} y={zeroY+4} fill="var(--gold)" fontSize="9"
        fontFamily="'IBM Plex Mono', monospace">0</text>

      {/* Zero marker */}
      {(() => {
        const zx = scaleX(zeroYds)
        const zy = scaleY(0)
        return <circle cx={zx} cy={zy} r="4" fill="var(--gold)" opacity="0.9" />
      })()}

      {/* Bullet path */}
      <path d={pathD} fill="none" stroke="var(--gold-light)" strokeWidth="2.5"
        strokeLinejoin="round" strokeLinecap="round" />

      {/* Data dots at key ranges */}
      {data.filter((_, i) => i % 4 === 0 || data[i].range === maxYds).map(d => (
        <circle key={d.range} cx={scaleX(d.range)} cy={scaleY(d.bh)} r="2.5"
          fill="var(--gold-light)" opacity="0.7" />
      ))}

      {/* Subsonic label */}
      {subX && subX < W - 80 && (
        <text x={subX+4} y={PAD.t+10} fill="#ef4444" fontSize="9"
          fontFamily="'IBM Plex Mono', monospace" opacity="0.8">SUBSONIC</text>
      )}

      {/* X-axis */}
      <line x1={PAD.l} x2={W-PAD.r} y1={H-PAD.b} y2={H-PAD.b}
        stroke="var(--border-mid)" strokeWidth="1" />
      {xTicks.map(d => (
        <g key={d.range}>
          <line x1={scaleX(d.range)} x2={scaleX(d.range)} y1={H-PAD.b} y2={H-PAD.b+4}
            stroke="var(--border-mid)" strokeWidth="1" />
          <text x={scaleX(d.range)} y={H-PAD.b+14} textAnchor="middle"
            fill="var(--text-dim)" fontSize="9" fontFamily="'IBM Plex Mono', monospace">
            {d.range}
          </text>
        </g>
      ))}
      <text x={W/2} y={H-2} textAnchor="middle" fill="var(--text-dim)" fontSize="9"
        fontFamily="'IBM Plex Mono', monospace">RANGE (yards)</text>

      {/* Y-axis */}
      <line x1={PAD.l} x2={PAD.l} y1={PAD.t} y2={H-PAD.b}
        stroke="var(--border-mid)" strokeWidth="1" />
      {yTicks.filter(v => v >= yMin && v <= yMax).map(v => (
        <text key={v} x={PAD.l-4} y={scaleY(v)+4} textAnchor="end"
          fill="var(--text-dim)" fontSize="9" fontFamily="'IBM Plex Mono', monospace">
          {v.toFixed(0)}
        </text>
      ))}
      <text x={12} y={H/2} textAnchor="middle" fill="var(--text-dim)" fontSize="9"
        fontFamily="'IBM Plex Mono', monospace"
        transform={`rotate(-90,12,${H/2})`}>INCHES (±LOS)</text>
    </svg>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function BallisticsCalc() {
  const [presetId, setPresetId]   = useState('308-168')
  const [mv,  setMv]              = useState(2650)
  const [bc,  setBc]              = useState(0.470)
  const [wt,  setWt]              = useState(168)
  const [alt, setAlt]             = useState(0)
  const [temp,setTemp]            = useState(59)
  const [wind,setWind]            = useState(10)
  const [zero,setZero]            = useState(100)
  const [scopeIn, setScopeIn]     = useState(1.5)
  const [maxYds, setMaxYds]       = useState(1000)
  const [unit,  setUnit]          = useState('imperial')   // imperial | metric

  function applyPreset(id) {
    setPresetId(id)
    const p = PRESETS.find(p => p.id === id)
    if (p && id !== 'custom') { setMv(p.mv); setBc(p.bc); setWt(p.wt) }
  }

  const data = useMemo(() => {
    if (mv < 100 || bc < 0.01 || wt < 1) return []
    try {
      return computeTrajectory({ mv, bc, wt, altFt: alt, tempF: temp,
        windMph: wind, zeroYds: zero, scopeIn, maxYds })
    } catch { return [] }
  }, [mv, bc, wt, alt, temp, wind, zero, scopeIn, maxYds])

  const cats = [...new Set(PRESETS.map(p => p.cat))]

  const labelStyle = {
    display:'block', fontSize:11, letterSpacing:'0.08em',
    fontFamily:"'IBM Plex Mono', monospace", color:'var(--text-muted)',
    marginBottom:4, textTransform:'uppercase',
  }
  const inputStyle = {
    width:'100%', background:'var(--bg3)', border:'1px solid var(--border)',
    color:'var(--text)', borderRadius:4, padding:'6px 10px', fontSize:13,
    fontFamily:"'IBM Plex Mono', monospace",
  }
  const selectStyle = { ...inputStyle }

  return (
    <>
      <style>{`
        .bal-hero { background:var(--bg2); border-bottom:1px solid var(--border); padding:32px 0 28px; }
        .bal-hero h1 { font-family:'Bebas Neue',sans-serif; font-size:clamp(2.4rem,5vw,3.8rem);
          letter-spacing:.05em; color:var(--text); margin:0 0 6px; }
        .bal-hero p  { color:var(--text-muted); font-size:14px; margin:0; max-width:640px; }
        .bal-tag { display:inline-block; padding:2px 10px; border-radius:3px;
          background:rgba(200,146,42,.13); color:var(--gold); font-size:10px;
          fontFamily:"'IBM Plex Mono', monospace"; letter-spacing:.1em; margin-bottom:12px; }
        .bal-layout { display:grid; grid-template-columns:300px 1fr; gap:24px;
          align-items:start; padding:32px 0 48px; }
        @media(max-width:860px) { .bal-layout { grid-template-columns:1fr; } }
        .bal-panel { background:var(--bg2); border:1px solid var(--border); border-radius:8px;
          padding:20px; }
        .bal-panel-title { font-family:'Bebas Neue',sans-serif; font-size:1.1rem;
          letter-spacing:.08em; color:var(--gold); margin:0 0 16px; }
        .bal-group { margin-bottom:14px; }
        .bal-preset-grid { display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:6px; }
        .bal-preset-btn { background:var(--bg3); border:1px solid var(--border);
          color:var(--text-muted); border-radius:4px; padding:6px 8px; font-size:11px;
          cursor:pointer; text-align:left; font-family:"'IBM Plex Mono', monospace";
          transition:all .15s; line-height:1.2; }
        .bal-preset-btn:hover { border-color:var(--border-mid); color:var(--text); }
        .bal-preset-btn.active { border-color:var(--gold); color:var(--gold);
          background:rgba(200,146,42,.08); }
        .bal-results-header { display:flex; align-items:center; justify-content:space-between;
          margin-bottom:16px; flex-wrap:wrap; gap:8px; }
        .bal-stat-row { display:flex; gap:16px; flex-wrap:wrap; margin-bottom:20px; }
        .bal-stat { background:var(--bg3); border:1px solid var(--border); border-radius:6px;
          padding:10px 16px; min-width:110px; }
        .bal-stat-num { font-family:'Bebas Neue',sans-serif; font-size:1.6rem;
          color:var(--gold); line-height:1; }
        .bal-stat-lbl { font-size:10px; fontFamily:"'IBM Plex Mono', monospace";
          color:var(--text-dim); letter-spacing:.08em; text-transform:uppercase; margin-top:2px; }
        .bal-chart-wrap { margin-bottom:20px; border:1px solid var(--border); border-radius:6px;
          overflow:hidden; padding:12px 4px 4px; background:var(--bg2); }
        .bal-chart-legend { display:flex; gap:16px; padding:8px 12px; flex-wrap:wrap; }
        .bal-chart-legend-item { display:flex; align-items:center; gap:6px;
          font-size:10px; fontFamily:"'IBM Plex Mono', monospace"; color:var(--text-muted); }
        .bal-chart-legend-dot { width:10px; height:10px; border-radius:50%; }
        .bal-table-wrap { overflow-x:auto; }
        .bal-table { width:100%; border-collapse:collapse; font-size:12px;
          fontFamily:"'IBM Plex Mono', monospace"; }
        .bal-table th { background:var(--bg3); color:var(--text-muted);
          padding:7px 10px; text-align:right; font-weight:600; letter-spacing:.05em;
          font-size:10px; border-bottom:1px solid var(--border); white-space:nowrap; }
        .bal-table th:first-child { text-align:left; }
        .bal-table td { padding:6px 10px; text-align:right; border-bottom:1px solid var(--border);
          color:var(--text); white-space:nowrap; }
        .bal-table td:first-child { text-align:left; font-weight:600; color:var(--text-muted); }
        .bal-table tr:last-child td { border-bottom:none; }
        .bal-table tr.zero-row td { background:rgba(200,146,42,.07); }
        .bal-table tr.zero-row td:first-child { color:var(--gold); }
        .bal-table tr.subsonic td { color:rgba(239,68,68,.75); }
        .bal-table td.pos { color:#16a34a; }
        .bal-table td.neg { color:#ef4444; }
        .bal-table td.warn { color:#f59e0b; }
        .bal-divider { border:none; border-top:1px solid var(--border); margin:20px 0; }
        .bal-note { background:rgba(200,146,42,.06); border:1px solid rgba(200,146,42,.2);
          border-radius:6px; padding:14px 16px; font-size:12px; color:var(--text-muted);
          line-height:1.6; }
        .bal-tabs { display:flex; gap:4px; }
        .bal-tab { background:var(--bg3); border:1px solid var(--border); color:var(--text-muted);
          border-radius:4px; padding:4px 12px; font-size:11px; cursor:pointer;
          font-family:"'IBM Plex Mono', monospace"; transition:all .15s; }
        .bal-tab.active { background:var(--gold); border-color:var(--gold); color:#000;
          font-weight:700; }
      `}</style>

      {/* Hero */}
      <div className="bal-hero">
        <div className="container">
          <div className="bal-tag">TOOLS</div>
          <h1>Ballistics Calculator</h1>
          <p>G1 external ballistics engine — drop tables, wind drift, and scope adjustments for any cartridge out to 1,000 yards. Data computed via numerical integration of the G1 drag function.</p>
        </div>
      </div>

      <div className="dr-page">
        <div className="container">
          <div className="bal-layout">
            {/* ── Input Panel ── */}
            <div>
              <div className="bal-panel">
                <div className="bal-panel-title">Cartridge</div>

                {cats.map(cat => (
                  <div key={cat} className="bal-group">
                    <label style={labelStyle}>{cat}</label>
                    <div className="bal-preset-grid">
                      {PRESETS.filter(p => p.cat === cat).map(p => (
                        <button key={p.id}
                          className={'bal-preset-btn' + (presetId === p.id ? ' active' : '')}
                          onClick={() => applyPreset(p.id)}>
                          {p.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}

                <hr className="bal-divider" />
                <div className="bal-panel-title">Bullet Data</div>

                <div className="bal-group">
                  <label style={labelStyle}>Muzzle Velocity (fps)</label>
                  <input style={inputStyle} type="number" value={mv} min={200} max={5000}
                    onChange={e => { setPresetId('custom'); setMv(+e.target.value) }} />
                </div>
                <div className="bal-group">
                  <label style={labelStyle}>G1 Ballistic Coefficient</label>
                  <input style={inputStyle} type="number" value={bc} min={0.05} max={1.2} step={0.001}
                    onChange={e => { setPresetId('custom'); setBc(+e.target.value) }} />
                </div>
                <div className="bal-group">
                  <label style={labelStyle}>Bullet Weight (grains)</label>
                  <input style={inputStyle} type="number" value={wt} min={20} max={750}
                    onChange={e => { setPresetId('custom'); setWt(+e.target.value) }} />
                </div>

                <hr className="bal-divider" />
                <div className="bal-panel-title">Environment</div>

                <div className="bal-group">
                  <label style={labelStyle}>Altitude (feet MSL)</label>
                  <input style={inputStyle} type="number" value={alt} min={0} max={15000} step={100}
                    onChange={e => setAlt(+e.target.value)} />
                </div>
                <div className="bal-group">
                  <label style={labelStyle}>Temperature (°F)</label>
                  <input style={inputStyle} type="number" value={temp} min={-40} max={120}
                    onChange={e => setTemp(+e.target.value)} />
                </div>
                <div className="bal-group">
                  <label style={labelStyle}>Crosswind Speed (mph)</label>
                  <input style={inputStyle} type="number" value={wind} min={0} max={60}
                    onChange={e => setWind(+e.target.value)} />
                  <div style={{fontSize:10,color:'var(--text-dim)',marginTop:3,fontFamily:"'IBM Plex Mono', monospace"}}>
                    Full value 90° crosswind. Drift direction depends on wind angle.
                  </div>
                </div>

                <hr className="bal-divider" />
                <div className="bal-panel-title">Zero & Optic</div>

                <div className="bal-group">
                  <label style={labelStyle}>Zero Distance (yards)</label>
                  <select style={selectStyle} value={zero} onChange={e => setZero(+e.target.value)}>
                    {[25,50,100,150,200,250,300].map(y => (
                      <option key={y} value={y}>{y} yards</option>
                    ))}
                  </select>
                </div>
                <div className="bal-group">
                  <label style={labelStyle}>Scope Height (inches above bore)</label>
                  <input style={inputStyle} type="number" value={scopeIn} min={0.5} max={4} step={0.1}
                    onChange={e => setScopeIn(+e.target.value)} />
                </div>
                <div className="bal-group">
                  <label style={labelStyle}>Max Range</label>
                  <select style={selectStyle} value={maxYds} onChange={e => setMaxYds(+e.target.value)}>
                    <option value={500}>500 yards</option>
                    <option value={800}>800 yards</option>
                    <option value={1000}>1,000 yards</option>
                  </select>
                </div>
              </div>
            </div>

            {/* ── Results Panel ── */}
            <div>
              {data.length > 0 ? (
                <>
                  {/* Summary stats */}
                  <div className="bal-stat-row">
                    {[
                      { label:'MV', val:`${mv} fps`, unit:'' },
                      { label:'G1 BC', val:bc.toFixed(3), unit:'' },
                      { label:'Zero', val:`${zero} yd`, unit:'' },
                      { label:'500yd Energy', val:(data.find(d=>d.range===500)||data[data.length-1]).energy.toLocaleString(), unit:'ft-lb' },
                    ].map(s => (
                      <div className="bal-stat" key={s.label}>
                        <div className="bal-stat-num">{s.val}</div>
                        <div className="bal-stat-lbl">{s.label}{s.unit ? ` · ${s.unit}` : ''}</div>
                      </div>
                    ))}
                  </div>

                  {/* Trajectory chart */}
                  <div className="bal-chart-wrap">
                    <TrajectoryChart data={data} maxYds={maxYds} zeroYds={zero} />
                    <div className="bal-chart-legend">
                      <div className="bal-chart-legend-item">
                        <div className="bal-chart-legend-dot" style={{background:'var(--gold-light)'}}/>
                        Bullet path (relative to line of sight)
                      </div>
                      <div className="bal-chart-legend-item">
                        <div className="bal-chart-legend-dot" style={{background:'var(--gold)',borderRadius:0,height:2,width:16}}/>
                        Zero / line of sight
                      </div>
                      {data.some(d => d.subsonic) && (
                        <div className="bal-chart-legend-item">
                          <div className="bal-chart-legend-dot" style={{background:'rgba(239,68,68,.4)'}}/>
                          Subsonic zone (&lt;1,100 fps)
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Data table */}
                  <div className="bal-table-wrap">
                    <table className="bal-table">
                      <thead>
                        <tr>
                          <th>Range</th>
                          <th>Velocity</th>
                          <th>Energy</th>
                          <th>Drop↓</th>
                          <th>Bullet Path</th>
                          <th>Wind {wind}mph</th>
                          <th>↑MOA</th>
                          <th>↑MRAD</th>
                          <th>TOF</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.map(row => {
                          const isZero = row.range === zero
                          const isSub  = row.subsonic && row.range > 0
                          const bhCls  = row.bh > 0.1 ? 'pos' : row.bh < -0.1 ? 'neg' : ''
                          const moaCls = row.moa > 0.5 ? 'neg' : ''
                          return (
                            <tr key={row.range}
                              className={(isZero ? 'zero-row ' : '') + (isSub ? 'subsonic' : '')}>
                              <td>{row.range} yd{isZero ? ' ★' : ''}</td>
                              <td>{row.v.toLocaleString()} fps</td>
                              <td>{row.energy.toLocaleString()} ft-lb</td>
                              <td className="neg">{row.dropBore.toFixed(1)}&quot;</td>
                              <td className={bhCls}>{row.bh > 0 ? '+' : ''}{row.bh.toFixed(1)}&quot;</td>
                              <td className="warn">{row.range > 0 ? `${row.drift.toFixed(1)}"` : '—'}</td>
                              <td className={moaCls}>{row.range > 0 ? `${row.moa.toFixed(1)}` : '—'}</td>
                              <td className={moaCls}>{row.range > 0 ? `${row.mrad.toFixed(2)}` : '—'}</td>
                              <td style={{color:'var(--text-dim)'}}>{row.range > 0 ? `${row.tof.toFixed(3)}s` : '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <hr className="bal-divider" />
                  <div className="bal-note">
                    <strong style={{color:'var(--gold)',fontFamily:"'IBM Plex Mono', monospace"}}>READING THIS TABLE</strong><br/>
                    <strong>Drop ↓</strong> — inches below bore line (absolute, ignoring scope).&nbsp;
                    <strong>Bullet Path</strong> — inches above (+) or below (−) your line of sight; zero at your selected zero range.&nbsp;
                    <strong>↑MOA / ↑MRAD</strong> — scope clicks needed to hit at that range; positive = dial up.&nbsp;
                    <strong>Wind {wind}mph</strong> — lateral drift for a full-value 90° crosswind; halve for 45° wind.&nbsp;
                    Drag model: G1 (standard). For VLD/hybrid projectiles use G7 BC × 2.0 as an approximate G1 conversion.
                  </div>
                </>
              ) : (
                <div className="dr-card" style={{textAlign:'center',padding:'48px 24px',color:'var(--text-muted)'}}>
                  Enter valid bullet data to compute trajectory.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
