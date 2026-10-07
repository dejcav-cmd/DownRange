'use client'
import { useState } from 'react'

const n = v => (v === '' || Number.isNaN(+v) ? null : +v)
const f = (v, d = 2) => (v == null || !Number.isFinite(v) ? '-' : v.toFixed(d))

function Field({ label, v, set, step = 'any', min }) {
  return (<label className="tl-f"><span>{label}</span><input type="number" inputMode="decimal" value={v} step={step} min={min} onChange={e => set(e.target.value)} /></label>)
}

export default function ScopeTools() {
  // 1. angle <-> inches
  const [rng, setRng] = useState(500)
  const [ang, setAng] = useState(2)
  const [unit, setUnit] = useState('MRAD')
  // 2. range from reticle
  const [size, setSize] = useState(18)
  const [read, setRead] = useState(1.5)
  const [runit, setRunit] = useState('MRAD')
  // 3. slope
  const [srange, setSrange] = useState(600)
  const [sang, setSang] = useState(20)
  // 4. clicks
  const [corr, setCorr] = useState(8.4)
  const [cunit, setCunit] = useState('MOA')
  const [csize, setCsize] = useState(0.25)

  const R = n(rng), A = n(ang)
  const inchesPer = unit === 'MRAD' ? 0.036 : 1.047 / 100 // inches per unit per yard
  const inches = R != null && A != null ? A * R * inchesPer : null
  const other = unit === 'MRAD' ? (A != null ? A * 3.43775 : null) : (A != null ? A / 3.43775 : null)

  const S = n(size), Rd = n(read)
  const rangeYd = S != null && Rd != null && Rd > 0 ? (runit === 'MRAD' ? (S * 27.778) / Rd : (S * 95.5) / Rd) : null

  const SR = n(srange), SA = n(sang)
  const shootTo = SR != null && SA != null ? SR * Math.cos((SA * Math.PI) / 180) : null

  const C = n(corr), CS = n(csize)
  const clicks = C != null && CS ? C / CS : null

  return (
    <div className="tl-grid">
      <section className="tl-card">
        <h2>Angle to inches</h2>
        <div className="tl-r2">
          <Field label="Range (yd)" v={rng} set={setRng} min={1} />
          <label className="tl-f"><span>Unit</span><select value={unit} onChange={e => setUnit(e.target.value)}><option>MRAD</option><option>MOA</option></select></label>
        </div>
        <Field label={`Correction (${unit})`} v={ang} set={setAng} />
        <div className="tl-out">
          <div>Inches at that range <b>{f(inches, 1)}"</b></div>
          <div>Centimeters <b>{inches != null ? f(inches * 2.54, 1) : '-'}</b></div>
          <div>In {unit === 'MRAD' ? 'MOA' : 'MRAD'} <b>{f(other, 2)}</b></div>
        </div>
        <p className="tl-note">1 MRAD is 3.6 inches per 100 yards. 1 MOA is 1.047 inches per 100 yards. 1 MRAD is about 3.438 MOA.</p>
      </section>

      <section className="tl-card">
        <h2>Range from your reticle</h2>
        <div className="tl-r2">
          <Field label="Target size (in)" v={size} set={setSize} min={0.1} />
          <label className="tl-f"><span>Unit</span><select value={runit} onChange={e => setRunit(e.target.value)}><option>MRAD</option><option>MOA</option></select></label>
        </div>
        <Field label={`Size in reticle (${runit})`} v={read} set={setRead} min={0.01} />
        <div className="tl-out"><div>Estimated range <b>{rangeYd ? Math.round(rangeYd) + ' yd' : '-'}</b></div><div>In meters <b>{rangeYd ? Math.round(rangeYd * 0.9144) + ' m' : '-'}</b></div></div>
        <p className="tl-note">Yards = size in inches × 27.78 ÷ mils, or × 95.5 ÷ MOA. A 18 inch plate that fills 1.5 mils is about 333 yards. Accuracy depends on how well you read the reticle.</p>
      </section>

      <section className="tl-card">
        <h2>Slope angle (shoot-to range)</h2>
        <div className="tl-r2">
          <Field label="Line-of-sight range (yd)" v={srange} set={setSrange} min={1} />
          <Field label="Angle up or down (°)" v={sang} set={setSang} />
        </div>
        <div className="tl-out"><div>Use dope for <b>{shootTo ? Math.round(shootTo) + ' yd' : '-'}</b></div><div>Hold under by <b>{shootTo ? Math.round(SR - shootTo) + ' yd' : '-'}</b></div></div>
        <p className="tl-note">Rifleman's rule: shoot to the horizontal distance, range × cosine of the angle. Uphill and downhill shots both hit high if you dial the line-of-sight range. This is a good approximation under about 30 degrees; use the Precision Calculator's slope input for steeper shots.</p>
      </section>

      <section className="tl-card">
        <h2>Turret clicks</h2>
        <div className="tl-r2">
          <label className="tl-f"><span>Unit</span><select value={cunit} onChange={e => { setCunit(e.target.value); setCsize(e.target.value === 'MRAD' ? 0.1 : 0.25) }}><option>MOA</option><option>MRAD</option></select></label>
          <label className="tl-f"><span>Value per click</span><select value={csize} onChange={e => setCsize(+e.target.value)}>{(cunit === 'MRAD' ? [0.05, 0.1] : [0.125, 0.25, 0.5]).map(x => <option key={x}>{x}</option>)}</select></label>
        </div>
        <Field label={`Correction needed (${cunit})`} v={corr} set={setCorr} />
        <div className="tl-out"><div>Clicks to dial <b>{clicks != null ? Math.round(clicks) : '-'}</b></div><div>Exact <b>{f(clicks, 1)}</b></div></div>
        <p className="tl-note">Match the unit to your turret. A true 1/4 MOA click moves the impact about 0.26 inch at 100 yards. Some scopes use a 1/4 inch at 100 yards click instead (about 0.24 MOA), so check your manual.</p>
      </section>
    </div>
  )
}
