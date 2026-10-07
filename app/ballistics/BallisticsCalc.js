'use client'
import { useState, useMemo, useEffect } from 'react'
import { solve, pressureFromAltitude } from '../../lib/ballistics/engine'
import { BULLETS } from '../../lib/ballistics/bullets'

// Quick-start factory loads (published G1 BCs, typical muzzle velocity). Use the bullet library for G7 precision work.
const FACTORY = [
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
]

const MAKERS = [...new Set(BULLETS.map(b => b.maker))].sort()
const CAL_ORDER = ['.224', '6mm', '.243', '.257', '6.5mm', '.270', '7mm', '.30', '.338', '.375', '.416']
const calOf = b => b.caliber
const typicalMv = cal => ({ '.224': 2900, '6mm': 2900, '.243': 2900, '.257': 2900, '6.5mm': 2700, '.270': 2900, '7mm': 2800, '.30': 2650, '.338': 2700, '.375': 2700, '.416': 2600 }[cal] || 2700)
const CLICKS = [
  { id: 'moa-0.25', label: '1/4 MOA clicks', kind: 'MOA', size: 0.25 },
  { id: 'moa-0.5', label: '1/2 MOA clicks', kind: 'MOA', size: 0.5 },
  { id: 'moa-0.125', label: '1/8 MOA clicks', kind: 'MOA', size: 0.125 },
  { id: 'mrad-0.1', label: '0.1 MRAD clicks', kind: 'MRAD', size: 0.1 },
  { id: 'mrad-0.05', label: '0.05 MRAD clicks', kind: 'MRAD', size: 0.05 },
]
const CLOCKS = [[3, '3 o’clock (full value, from right)'], [9, '9 o’clock (full value, from left)'], [2, '2 o’clock'], [4, '4 o’clock'], [8, '8 o’clock'], [10, '10 o’clock'], [12, '12 o’clock (headwind)'], [6, '6 o’clock (tailwind)']]

const DEFAULT = {
  src: 'lib', maker: 'Hornady', caliber: '6.5mm', bulletId: 'hornady-eld-match-6-5mm-140', q: '',
  presetId: '65cm-140', model: 'G7', bc: 0.326, mv: 2710, weight: 140,
  sight: 1.75, zero: 100, maxYd: 1000, stepYd: 50, temp: 59, alt: 0, humidity: 50, wind: 10, clock: 3, slope: 0, click: 'moa-0.25',
  compare: false, b: { bulletId: '', model: 'G7', bc: 0.3, mv: 2700, weight: 140, label: 'Load B' },
}

const fmt = (n, d = 1) => (n == null || Number.isNaN(n) ? '' : n.toFixed(d))
const sgn = (n, d = 1) => (n > 0 ? '+' : '') + fmt(n, d)

function bulletLabel(b) { return `${b.weight} gr ${b.line}` + (b.g7 ? ` · G7 ${b.g7.toFixed(3)}` : '') + (b.g1 ? ` · G1 ${b.g1.toFixed(3)}` : '') }

function pickBullet(id) { return BULLETS.find(b => b.id === id) }

function Chart({ a, b, zero }) {
  if (!a || a.length < 2) return null
  const W = 720, H = 240, P = { t: 14, r: 16, b: 34, l: 52 }
  const iw = W - P.l - P.r, ih = H - P.t - P.b
  const all = [...a.map(r => r.dropIn), ...(b || []).map(r => r.dropIn)]
  const yMax = Math.max(4, ...all), yMin = Math.min(-4, ...all)
  const maxX = a[a.length - 1].yd
  const X = x => P.l + (x / maxX) * iw
  const Y = y => P.t + ((yMax - y) / (yMax - yMin)) * ih
  const line = rows => rows.map((r, i) => (i ? 'L' : 'M') + X(r.yd).toFixed(1) + ' ' + Y(r.dropIn).toFixed(1)).join(' ')
  const ticks = []
  for (let i = 0; i <= 5; i++) ticks.push(yMin + ((yMax - yMin) * i) / 5)
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="pc-chart" role="img" aria-label="Bullet path relative to line of sight">
      {ticks.map((t, i) => (<g key={i}><line x1={P.l} x2={W - P.r} y1={Y(t)} y2={Y(t)} stroke="var(--border)" strokeWidth="1" /><text x={P.l - 6} y={Y(t) + 4} textAnchor="end" fontSize="10" fill="var(--text-dim)" fontFamily="IBM Plex Mono, monospace">{t.toFixed(0)}</text></g>))}
      <line x1={P.l} x2={W - P.r} y1={Y(0)} y2={Y(0)} stroke="var(--border-mid)" strokeWidth="1.5" strokeDasharray="4 4" />
      {b && <path d={line(b)} fill="none" stroke="#3B82F6" strokeWidth="2.2" strokeDasharray="6 4" />}
      <path d={line(a)} fill="none" stroke="var(--gold)" strokeWidth="2.6" />
      {[0, 0.25, 0.5, 0.75, 1].map(f => (<text key={f} x={X(maxX * f)} y={H - 12} textAnchor="middle" fontSize="10" fill="var(--text-dim)" fontFamily="IBM Plex Mono, monospace">{Math.round(maxX * f)}</text>))}
      <text x={P.l} y={H - 1} fontSize="9" fill="var(--text-dim)" fontFamily="IBM Plex Mono, monospace">yards · inches vs line of sight</text>
    </svg>
  )
}

function Num({ label, v, set, min, max, step = 1, hint }) {
  return (
    <label className="pc-f">
      <span>{label}</span>
      <input type="number" inputMode="decimal" value={v} min={min} max={max} step={step} onChange={e => { const n = parseFloat(e.target.value); set(Number.isNaN(n) ? '' : n) }} />
      {hint ? <em>{hint}</em> : null}
    </label>
  )
}

function Pick({ label, v, set, children }) {
  return (<label className="pc-f"><span>{label}</span><select value={v} onChange={e => set(e.target.value)}>{children}</select></label>)
}

export default function PrecisionCalc() {
  const [s, setS] = useState(DEFAULT)
  const [copied, setCopied] = useState(false)
  const up = patch => setS(p => ({ ...p, ...patch }))

  // restore a shared setup from the URL hash
  useEffect(() => {
    try {
      const m = /#s=([^&]+)/.exec(window.location.hash)
      if (m) { const o = JSON.parse(decodeURIComponent(escape(atob(m[1])))); setS(p => ({ ...p, ...o, b: { ...p.b, ...(o.b || {}) } })) }
    } catch { /* ignore a bad link */ }
  }, [])

  const bullets = useMemo(() => {
    const q = s.q.trim().toLowerCase()
    return BULLETS.filter(b => (!s.maker || b.maker === s.maker) && (!s.caliber || calOf(b) === s.caliber) && (!q || (b.line + ' ' + b.weight + ' ' + b.maker).toLowerCase().includes(q)))
  }, [s.maker, s.caliber, s.q])
  const calibers = useMemo(() => CAL_ORDER.filter(c => BULLETS.some(b => b.caliber === c && (!s.maker || b.maker === s.maker))), [s.maker])

  const chooseBullet = (id, target) => {
    const b = pickBullet(id); if (!b) return
    const model = b.g7 ? 'G7' : 'G1'
    const bc = b.g7 || b.g1
    if (target === 'b') up({ b: { ...s.b, bulletId: id, model, bc, weight: b.weight, mv: s.b.mv || typicalMv(b.caliber), label: `${b.weight} gr ${b.line}` } })
    else up({ bulletId: id, model, bc, weight: b.weight, mv: typicalMv(b.caliber) })
  }
  const setModel = (m, target) => {
    const cur = target === 'b' ? s.b : s
    const b = pickBullet(cur.bulletId)
    const bc = b ? (m === 'G7' ? b.g7 : b.g1) : null
    if (target === 'b') up({ b: { ...s.b, model: m, bc: bc || s.b.bc } })
    else up({ model: m, bc: bc || s.bc })
  }
  const choosePreset = id => { const p = FACTORY.find(x => x.id === id); if (p) up({ presetId: id, model: 'G1', bc: p.bc, mv: p.mv, weight: p.wt }) }

  const click = CLICKS.find(c => c.id === s.click) || CLICKS[0]
  const baseIn = useMemo(() => ({
    sightHeightIn: +s.sight || 1.75, zeroYd: Math.max(25, +s.zero || 100), windMph: +s.wind || 0, windClock: +s.clock, slopeDeg: +s.slope || 0,
    tempF: +s.temp, pressureInHg: pressureFromAltitude(+s.alt || 0), humidity: +s.humidity || 0,
    maxYd: Math.min(2500, Math.max(100, +s.maxYd || 1000)), stepYd: +s.stepYd || 50,
  }), [s.sight, s.zero, s.wind, s.clock, s.slope, s.temp, s.alt, s.humidity, s.maxYd, s.stepYd])

  const ok = x => Number.isFinite(+x.bc) && +x.bc > 0.02 && Number.isFinite(+x.mv) && +x.mv > 300 && +x.weight > 0
  const resA = useMemo(() => (ok(s) ? solve({ ...baseIn, model: s.model, bc: +s.bc, mv: +s.mv, weight: +s.weight }) : null), [baseIn, s.model, s.bc, s.mv, s.weight])
  const resB = useMemo(() => (s.compare && ok(s.b) ? solve({ ...baseIn, model: s.b.model, bc: +s.b.bc, mv: +s.b.mv, weight: +s.b.weight }) : null), [baseIn, s.compare, s.b])

  const useMrad = click.kind === 'MRAD'
  const dropAng = r => (useMrad ? r.dropMrad : r.dropMoa)
  const driftAng = r => (useMrad ? r.driftMrad : r.driftMoa)
  const clicks = a => Math.round(a / click.size)

  const share = async () => {
    try {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(s))))
      const url = window.location.origin + window.location.pathname + '#s=' + code
      window.history.replaceState(null, '', url)
      await navigator.clipboard.writeText(url)
      setCopied(true); setTimeout(() => setCopied(false), 2000)
    } catch { /* clipboard blocked */ }
  }

  const last = resA && resA.rows[resA.rows.length - 1]
  const title = s.src === 'lib' ? (pickBullet(s.bulletId) ? `${pickBullet(s.bulletId).maker} ${pickBullet(s.bulletId).weight} gr ${pickBullet(s.bulletId).line}` : 'Custom load') : s.src === 'preset' ? (FACTORY.find(p => p.id === s.presetId)?.name || 'Preset') : `Custom ${s.weight} gr`

  return (
    <div className="pc">
      <style>{CSS}</style>
      <div className="pc-layout">
        <div className="pc-panel">
          <div className="pc-h">Bullet</div>
          <div className="pc-seg" role="tablist">
            {[['lib', 'Bullet library'], ['preset', 'Factory loads'], ['custom', 'Custom BC']].map(([k, l]) => (<button key={k} type="button" role="tab" aria-selected={s.src === k} className={s.src === k ? 'on' : ''} onClick={() => up({ src: k })}>{l}</button>))}
          </div>

          {s.src === 'lib' && (<>
            <Pick label="Maker" v={s.maker} set={v => up({ maker: v, caliber: '' })}><option value="">All makers</option>{MAKERS.map(m => <option key={m}>{m}</option>)}</Pick>
            <Pick label="Caliber" v={s.caliber} set={v => up({ caliber: v })}><option value="">All calibers</option>{calibers.map(c => <option key={c}>{c}</option>)}</Pick>
            <label className="pc-f"><span>Search</span><input type="search" placeholder="e.g. 140, Hybrid, ELD-X" value={s.q} onChange={e => up({ q: e.target.value })} /></label>
            <Pick label={`Bullet (${bullets.length})`} v={s.bulletId} set={v => chooseBullet(v)}>
              <option value="">Choose a bullet</option>
              {bullets.map(b => <option key={b.id} value={b.id}>{(s.maker ? '' : b.maker + ' ')}{bulletLabel(b)}</option>)}
            </Pick>
          </>)}
          {s.src === 'preset' && (
            <Pick label="Factory load (G1 BC)" v={s.presetId} set={choosePreset}>
              {[...new Set(FACTORY.map(p => p.cat))].map(c => (<optgroup key={c} label={c}>{FACTORY.filter(p => p.cat === c).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</optgroup>))}
            </Pick>
          )}
          <div className="pc-row">
            <Pick label="Drag model" v={s.model} set={v => (s.src === 'lib' ? setModel(v) : up({ model: v }))}><option value="G7">G7 (long-range)</option><option value="G1">G1 (flat-base)</option></Pick>
            <Num label="Ballistic coefficient" v={s.bc} set={v => up({ bc: v })} min={0.05} max={1.2} step={0.001} />
          </div>
          <div className="pc-row">
            <Num label="Muzzle velocity (fps)" v={s.mv} set={v => up({ mv: v })} min={500} max={4500} step={5} hint="Use your chronograph" />
            <Num label="Bullet weight (gr)" v={s.weight} set={v => up({ weight: v })} min={10} max={800} step={1} />
          </div>

          <button type="button" className={'pc-cmp' + (s.compare ? ' on' : '')} onClick={() => up({ compare: !s.compare, b: { ...s.b, bulletId: s.b.bulletId || '' } })}>{s.compare ? '− Remove Load B' : '+ Compare a second load'}</button>
          {s.compare && (
            <div className="pc-b">
              <div className="pc-h pc-hb">Load B (blue)</div>
              <Pick label="Bullet" v={s.b.bulletId} set={v => chooseBullet(v, 'b')}><option value="">Pick from library</option>{bullets.map(b => <option key={b.id} value={b.id}>{b.maker} {bulletLabel(b)}</option>)}</Pick>
              <div className="pc-row">
                <Pick label="Model" v={s.b.model} set={v => setModel(v, 'b')}><option>G7</option><option>G1</option></Pick>
                <Num label="BC" v={s.b.bc} set={v => up({ b: { ...s.b, bc: v } })} min={0.05} max={1.2} step={0.001} />
              </div>
              <div className="pc-row">
                <Num label="MV (fps)" v={s.b.mv} set={v => up({ b: { ...s.b, mv: v } })} min={500} max={4500} step={5} />
                <Num label="Weight (gr)" v={s.b.weight} set={v => up({ b: { ...s.b, weight: v } })} min={10} max={800} />
              </div>
              <p className="pc-note">Load B uses the same zero, optic and weather.</p>
            </div>
          )}

          <div className="pc-h">Rifle and optic</div>
          <div className="pc-row">
            <Num label="Sight height (in)" v={s.sight} set={v => up({ sight: v })} min={0.5} max={4} step={0.05} />
            <Num label="Zero (yd)" v={s.zero} set={v => up({ zero: v })} min={25} max={500} step={25} />
          </div>
          <Pick label="Turret" v={s.click} set={v => up({ click: v })}>{CLICKS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}</Pick>
          <div className="pc-row">
            <Num label="Max range (yd)" v={s.maxYd} set={v => up({ maxYd: v })} min={100} max={2500} step={100} />
            <Pick label="Table step" v={s.stepYd} set={v => up({ stepYd: +v })}>{[25, 50, 100].map(n => <option key={n} value={n}>{n} yd</option>)}</Pick>
          </div>

          <div className="pc-h">Conditions</div>
          <div className="pc-row">
            <Num label="Temperature (°F)" v={s.temp} set={v => up({ temp: v })} min={-40} max={130} />
            <Num label="Altitude (ft)" v={s.alt} set={v => up({ alt: v })} min={-500} max={15000} step={100} />
          </div>
          <div className="pc-row">
            <Num label="Humidity (%)" v={s.humidity} set={v => up({ humidity: v })} min={0} max={100} step={5} />
            <Num label="Slope (° up/down)" v={s.slope} set={v => up({ slope: v })} min={-60} max={60} step={1} />
          </div>
          <div className="pc-row">
            <Num label="Wind (mph)" v={s.wind} set={v => up({ wind: v })} min={0} max={60} step={1} />
            <Pick label="Wind from" v={s.clock} set={v => up({ clock: +v })}>{CLOCKS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</Pick>
          </div>
        </div>

        <div className="pc-out">
          {!resA && <div className="pc-empty">Enter a muzzle velocity and BC (or pick a bullet) to see your drop table.</div>}
          {resA && (<>
            <div className="pc-card" id="pc-card">
              <div className="pc-cardhead">
                <div>
                  <div className="pc-eyebrow">DOPE card</div>
                  <h2 className="pc-title">{title}</h2>
                  <div className="pc-sub">{s.model} BC {fmt(+s.bc, 3)} · {s.mv} fps · {s.weight} gr · zero {s.zero} yd · {s.temp}°F, {s.alt} ft · wind {s.wind} mph @ {s.clock}:00</div>
                </div>
                <div className="pc-actions">
                  <button type="button" onClick={share}>{copied ? 'Link copied' : 'Copy share link'}</button>
                  <button type="button" onClick={() => window.print()}>Print DOPE card</button>
                </div>
              </div>

              <div className="pc-stats">
                <div><b>{last ? sgn(last.dropIn, 0) : ''}"</b><span>drop at {last?.yd} yd</span></div>
                <div><b>{last ? fmt(dropAng(last), 1) : ''}</b><span>{click.kind} to dial at {last?.yd} yd</span></div>
                <div><b>{resA.transonicYd ? resA.transonicYd + ' yd' : 'Beyond ' + last?.yd + ' yd'}</b><span>goes transonic (Mach 1.2)</span></div>
                <div><b>{resA.subsonicYd ? resA.subsonicYd + ' yd' : 'Stays supersonic'}</b><span>drops below Mach 1</span></div>
              </div>

              <Chart a={resA.rows} b={resB && resB.rows} zero={s.zero} />

              <div className="pc-tw"><table className="pc-t">
                <thead><tr><th>Yd</th><th>Vel</th><th>Energy</th><th>Drop in</th><th>{click.kind}</th><th>Clicks</th><th>Wind in</th><th>Wind {click.kind}</th><th>Clicks</th><th>TOF</th>{resB && <th className="b">B drop {click.kind}</th>}{resB && <th className="b">Δ</th>}</tr></thead>
                <tbody>{resA.rows.map((r, i) => {
                  const rb = resB && resB.rows[i]
                  const dClicks = clicks(dropAng(r)), wClicks = clicks(driftAng(r))
                  return (
                    <tr key={r.yd} className={r.mach < 1.2 ? 'trans' : ''}>
                      <td>{r.yd}</td><td>{Math.round(r.v)}</td><td>{Math.round(r.energy)}</td>
                      <td>{r.yd === 0 ? '' : sgn(r.dropIn, 1)}</td><td>{r.yd === 0 ? '' : fmt(dropAng(r), 1)}</td><td className="k">{r.yd === 0 ? '' : (dClicks > 0 ? 'Up ' : dClicks < 0 ? 'Dn ' : '') + Math.abs(dClicks)}</td>
                      <td>{r.yd === 0 ? '' : sgn(r.driftIn, 1)}</td><td>{r.yd === 0 ? '' : fmt(Math.abs(driftAng(r)), 1)}</td><td className="k">{r.yd === 0 || !s.wind ? '' : (wClicks > 0 ? 'R ' : wClicks < 0 ? 'L ' : '') + Math.abs(wClicks)}</td>
                      <td>{fmt(r.t, 2)}</td>
                      {resB && <td className="b">{rb && r.yd ? fmt(dropAng(rb), 1) : ''}</td>}{resB && <td className="b">{rb && r.yd ? sgn(dropAng(rb) - dropAng(r), 1) : ''}</td>}
                    </tr>)
                })}</tbody>
              </table></div>
              <p className="pc-note">Clicks show turret adjustment for the hold you would otherwise make. Wind drift: negative inches = to the left (wind from the right). Shaded rows are transonic (below Mach 1.2), where predictions are less reliable. Computed with a point-mass model on standard {s.model} drag and your atmosphere. Spin drift, Coriolis and aerodynamic jump are not included. Confirm your dope at the range.</p>
            </div>
          </>)}
        </div>
      </div>
    </div>
  )
}

const CSS = `
.pc{--pc-in:var(--bg3)}
.pc{max-width:100%;overflow-x:clip}
.pc-layout{display:grid;grid-template-columns:360px minmax(0,1fr);gap:22px;align-items:start}
.pc-panel{background:var(--bg2);border:1px solid var(--border);padding:16px;position:sticky;top:calc(var(--ticker-height,37px) + 70px);max-height:calc(100vh - 110px);overflow:auto}
.pc-h{font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.12em;text-transform:uppercase;font-size:14px;color:var(--gold);margin:16px 0 8px;padding-bottom:6px;border-bottom:1px solid var(--border)}
.pc-h:first-child{margin-top:0}.pc-hb{color:#3B82F6}
.pc-seg{display:flex;gap:0;margin-bottom:12px;border:1px solid var(--border-mid)}
.pc-seg button{flex:1;background:transparent;border:0;color:var(--text-muted);font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.06em;font-size:13px;padding:9px 4px;cursor:pointer;min-height:40px}
.pc-seg button.on{background:var(--gold);color:#09090B}
.pc-f{display:block;margin-bottom:10px;min-width:0}
.pc-f span{display:block;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-muted);margin-bottom:4px}
.pc-f em{display:block;font-style:normal;font-size:10.5px;color:var(--text-dim);margin-top:3px}
.pc-f input,.pc-f select{width:100%;box-sizing:border-box;background:var(--pc-in);border:1px solid var(--border-mid);color:var(--text);padding:9px 10px;font-size:14px;font-family:'IBM Plex Mono',monospace;min-height:42px}
.pc-f input:focus,.pc-f select:focus{outline:2px solid var(--gold);outline-offset:-1px}
.pc-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px}
.pc-panel,.pc-out{min-width:0}
.pc-f select{text-overflow:ellipsis}
.pc-cmp{width:100%;background:transparent;border:1px dashed var(--border-mid);color:var(--text-muted);font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.08em;font-size:14px;padding:10px;cursor:pointer;min-height:42px}
.pc-cmp.on,.pc-cmp:hover{border-color:#3B82F6;color:#3B82F6}
.pc-b{margin-top:8px;padding:10px;border:1px solid rgba(59,130,246,.35);background:rgba(59,130,246,.05)}
.pc-b .pc-h{margin-top:0}
.pc-card{background:var(--bg2);border:1px solid var(--border);border-top:2px solid var(--gold);padding:18px}
.pc-cardhead{display:flex;justify-content:space-between;gap:14px;flex-wrap:wrap;margin-bottom:14px}
.pc-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--gold)}
.pc-title{font-family:'Bebas Neue',cursive;font-weight:400;font-size:clamp(1.7rem,3.4vw,2.4rem);letter-spacing:.03em;margin:2px 0 4px;color:var(--text)}
.pc-sub{font-family:'IBM Plex Mono',monospace;font-size:11px;line-height:1.6;color:var(--text-muted)}
.pc-actions{display:flex;gap:8px;align-items:flex-start;flex-wrap:wrap}
.pc-actions button{background:transparent;border:1px solid var(--border-mid);color:var(--text);font-family:'Barlow Condensed',sans-serif;font-weight:700;letter-spacing:.08em;font-size:13px;text-transform:uppercase;padding:9px 14px;cursor:pointer;min-height:40px}
.pc-actions button:hover{border-color:var(--gold);color:var(--gold)}
.pc-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px}
.pc-stats div{background:var(--bg3);border:1px solid var(--border);padding:12px}
.pc-stats b{display:block;font-family:'Bebas Neue',cursive;font-weight:400;font-size:26px;color:var(--gold);line-height:1.1}
.pc-stats span{font-family:'IBM Plex Mono',monospace;font-size:9.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--text-dim)}
.pc-chart{width:100%;height:auto;display:block;margin:6px 0 14px;background:var(--bg3);border:1px solid var(--border)}
.pc-tw{overflow-x:auto;-webkit-overflow-scrolling:touch}
.pc-t{width:100%;border-collapse:collapse;font-family:'IBM Plex Mono',monospace;font-size:12px;min-width:640px}
.pc-t th{position:sticky;top:0;background:var(--bg3);color:var(--text-muted);font-size:10px;letter-spacing:.06em;text-transform:uppercase;text-align:right;padding:8px 8px;border-bottom:1px solid var(--border-mid);white-space:nowrap}
.pc-t td{text-align:right;padding:7px 8px;border-bottom:1px solid var(--border);color:var(--text)}
.pc-t th:first-child,.pc-t td:first-child{text-align:left;color:var(--gold);font-weight:600}
.pc-t td.k{color:var(--gold-light);font-weight:600}
.pc-t tr.trans td{background:rgba(200,146,42,.07)}
.pc-t .b{color:#60A5FA}
.pc-note{font-size:12px;line-height:1.6;color:var(--text-dim);margin:10px 0 0}
.pc-empty{padding:40px 20px;text-align:center;color:var(--text-muted);border:1px dashed var(--border-mid)}
@media(max-width:900px){.pc-layout{grid-template-columns:minmax(0,1fr)}.pc-panel{position:static;max-height:none}.pc-stats{grid-template-columns:repeat(2,1fr)}}
@media print{
  body *{visibility:hidden}
  #pc-card,#pc-card *{visibility:visible}
  #pc-card{position:absolute;left:0;top:0;width:100%;background:#fff!important;color:#000!important;border:0}
  #pc-card *{color:#000!important;background:transparent!important;border-color:#999!important}
  .pc-actions,.pc-chart{display:none!important}
  .pc-t th{position:static}
}
`
