'use client'
import { useState } from 'react'

const n = v => (v === '' || Number.isNaN(+v) ? 0 : +v)
const money = (v, d = 2) => (Number.isFinite(v) ? (v < 0 ? '-$' : '$') + Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }) : '-')

function Field({ label, v, set, step = 'any' }) {
  return (<label className="tl-f"><span>{label}</span><input type="number" inputMode="decimal" value={v} step={step} min="0" onChange={e => set(e.target.value)} /></label>)
}

export default function AmmoCost() {
  // factory
  const [price, setPrice] = useState(28)
  const [box, setBox] = useState(20)
  // usage
  const [perTrip, setPerTrip] = useState(100)
  const [trips, setTrips] = useState(18)
  // reload
  const [bullet, setBullet] = useState(0.33)
  const [powderPrice, setPowderPrice] = useState(40)
  const [powderLb, setPowderLb] = useState(1)
  const [grains, setGrains] = useState(41)
  const [primer, setPrimer] = useState(0.08)
  const [brassCost, setBrassCost] = useState(1.2)
  const [brassUses, setBrassUses] = useState(8)
  const [gear, setGear] = useState(600)

  const factoryRd = n(box) ? n(price) / n(box) : 0
  const powderRd = n(powderLb) ? (n(powderPrice) / (n(powderLb) * 7000)) * n(grains) : 0
  const brassRd = n(brassUses) ? n(brassCost) / n(brassUses) : 0
  const reloadRd = n(bullet) + powderRd + n(primer) + brassRd
  const yearRounds = n(perTrip) * n(trips)
  const factoryYear = factoryRd * yearRounds
  const reloadYear = reloadRd * yearRounds
  const saveRd = factoryRd - reloadRd
  const saveYear = factoryYear - reloadYear
  const breakEvenRounds = saveRd > 0 ? n(gear) / saveRd : null
  const breakEvenMonths = breakEvenRounds && yearRounds ? (breakEvenRounds / yearRounds) * 12 : null

  return (
    <div className="tl-grid">
      <section className="tl-card">
        <h2>Factory ammo</h2>
        <div className="tl-r2"><Field label="Price per box ($)" v={price} set={setPrice} /><Field label="Rounds per box" v={box} set={setBox} step="1" /></div>
        <div className="tl-r2"><Field label="Rounds per range trip" v={perTrip} set={setPerTrip} step="10" /><Field label="Trips per year" v={trips} set={setTrips} step="1" /></div>
        <div className="tl-out">
          <div>Cost per round <b>{money(factoryRd, 3)}</b></div>
          <div>Per range trip <b>{money(factoryRd * n(perTrip), 0)}</b></div>
          <div>Per year ({yearRounds.toLocaleString()} rounds) <b>{money(factoryYear, 0)}</b></div>
        </div>
      </section>

      <section className="tl-card">
        <h2>Reloading</h2>
        <div className="tl-r2"><Field label="Bullet each ($)" v={bullet} set={setBullet} /><Field label="Primer each ($)" v={primer} set={setPrimer} /></div>
        <div className="tl-r2"><Field label="Powder price ($ per jug)" v={powderPrice} set={setPowderPrice} /><Field label="Jug size (lb)" v={powderLb} set={setPowderLb} /></div>
        <div className="tl-r2"><Field label="Powder charge (gr)" v={grains} set={setGrains} step="0.1" /><Field label="Brass each ($)" v={brassCost} set={setBrassCost} /></div>
        <div className="tl-r2"><Field label="Brass reloads (uses)" v={brassUses} set={setBrassUses} step="1" /><Field label="Gear cost ($)" v={gear} set={setGear} step="50" /></div>
        <div className="tl-out">
          <div>Cost per round <b>{money(reloadRd, 3)}</b></div>
          <div>Powder per round <b>{money(powderRd, 3)}</b></div>
          <div>Per year <b>{money(reloadYear, 0)}</b></div>
        </div>
        <p className="tl-note">A pound of powder is 7,000 grains. Gear cost is your press, dies, scale and other one-time equipment; it is left out of the per-round cost and used for break-even below.</p>
      </section>

      <section className="tl-card" style={{ gridColumn: '1 / -1' }}>
        <h2>Factory versus reloading</h2>
        <div className="tl-out">
          <div>Saved per round <b style={{ color: saveRd >= 0 ? 'var(--gold)' : '#EF4444' }}>{money(saveRd, 3)}</b></div>
          <div>Saved per year <b style={{ color: saveYear >= 0 ? 'var(--gold)' : '#EF4444' }}>{money(saveYear, 0)}</b></div>
          <div>Gear pays for itself after <b>{breakEvenRounds ? Math.round(breakEvenRounds).toLocaleString() + ' rounds' : 'never at these prices'}</b></div>
          <div>That is about <b>{breakEvenMonths ? breakEvenMonths.toFixed(1) + ' months' : '-'}</b></div>
        </div>
        <p className="tl-note">Your time is not counted. Reloading also lets you build more accurate loads than most factory ammo, which matters more than the savings for a lot of shooters. Always follow published load data.</p>
      </section>
    </div>
  )
}
