// Point-mass external ballistics engine (3-DOF) with G1/G7 drag, standard atmosphere, wind, slope and zeroing.
import { G1, G7 } from './drag'

const TABLES = { G1, G7 }
const G = 32.174 // ft/s^2

function cdAt(table, mach) {
  const t = TABLES[table]
  if (mach <= t[0][0]) return t[0][1]
  let lo = 0, hi = t.length - 1
  if (mach >= t[hi][0]) return t[hi][1]
  while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (t[mid][0] <= mach) lo = mid; else hi = mid }
  const f = (mach - t[lo][0]) / (t[hi][0] - t[lo][0])
  return t[lo][1] + f * (t[hi][1] - t[lo][1])
}

// Air density (slug/ft^3) and speed of sound (ft/s). Dry-air model with a humidity correction.
export function atmosphere({ tempF = 59, pressureInHg = 29.92, humidity = 0 }) {
  const tR = tempF + 459.67
  const tC = (tempF - 32) / 1.8
  // saturation vapor pressure (Magnus), in inHg
  const es = 6.1078 * Math.pow(10, (7.5 * tC) / (tC + 237.3)) * 0.02953
  const pv = Math.max(0, Math.min(1, humidity / 100)) * es
  const pd = pressureInHg - pv
  const rho = 0.002377 * ((pd + 0.622 * pv) / 29.92) * (518.67 / tR)
  const sound = 49.0223 * Math.sqrt(tR)
  return { rho, sound }
}

// Altitude (ft) to station pressure (inHg), ISA.
export function pressureFromAltitude(ft) { return 29.92 * Math.pow(1 - 6.8755856e-6 * ft, 5.2558797) }

function fly(p, boreAngle, maxRangeFt, onStep) {
  const { rho, sound } = p.atm
  const k = (0.5 * rho * 0.7853981634 * (G / 144)) / p.bc // retardation = k * v^2 * Cd(M)
  const slope = (p.slopeDeg || 0) * Math.PI / 180
  const gx = -G * Math.sin(slope), gy = -G * Math.cos(slope)
  const sh = p.sightHeightIn / 12
  // wind: speed (mph) and clock angle (12 = from the front/headwind, 3 = from the right)
  const wMps = (p.windMph || 0) * 1.46667
  const wa = (p.windClock ?? 3) * 30 * Math.PI / 180
  const wx = -wMps * Math.cos(wa)   // + downrange (tailwind)
  const wz = -wMps * Math.sin(wa)   // + right  (wind from the right pushes left)
  let x = 0, y = -sh, z = 0
  let vx = p.mv * Math.cos(boreAngle), vy = p.mv * Math.sin(boreAngle), vz = 0
  let t = 0
  const dt = 0.001
  while (x < maxRangeFt && t < 12) {
    const rx = vx - wx, ry = vy, rz = vz - wz
    const vr = Math.sqrt(rx * rx + ry * ry + rz * rz)
    const cd = cdAt(p.model, vr / sound)
    const a = k * vr * cd // per unit velocity => accel = -a * v_rel
    const ax = -a * rx + gx, ay = -a * ry + gy, az = -a * rz
    // velocity-Verlet style step
    const nx = x + vx * dt + 0.5 * ax * dt * dt
    const ny = y + vy * dt + 0.5 * ay * dt * dt
    const nz = z + vz * dt + 0.5 * az * dt * dt
    const nvx = vx + ax * dt, nvy = vy + ay * dt, nvz = vz + az * dt
    if (onStep) onStep(x, y, z, vx, vy, vz, t, nx, ny, nz, nvx, nvy, nvz, dt)
    x = nx; y = ny; z = nz; vx = nvx; vy = nvy; vz = nvz; t += dt
    if (Math.sqrt(vx * vx + vy * vy + vz * vz) < 200) break
  }
}

// Solve the bore angle that puts the bullet on the line of sight at zeroRange (yd), no wind.
function solveZero(p) {
  const zFt = p.zeroYd * 3
  const noWind = { ...p, windMph: 0 }
  const losY = zFt * 0 // line of sight is the x axis in the slope-rotated frame
  let lo = -0.02, hi = 0.08
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    let yAt = null
    fly(noWind, mid, zFt + 5, (x, y, z, vx, vy, vz, t, nx, ny) => {
      if (yAt === null && nx >= zFt) { const f = (zFt - x) / (nx - x); yAt = y + f * (ny - y) }
    })
    if (yAt === null) { hi = mid; continue }
    if (yAt > losY) hi = mid; else lo = mid
  }
  return (lo + hi) / 2
}

// Main entry. Returns rows at each step (yards) plus summary info.
export function solve(input) {
  const p = {
    model: 'G7', bc: 0.3, mv: 2700, weight: 140, sightHeightIn: 1.75, zeroYd: 100, windMph: 0, windClock: 3,
    slopeDeg: 0, tempF: 59, pressureInHg: 29.92, humidity: 50, maxYd: 1000, stepYd: 50, ...input,
  }
  p.atm = atmosphere(p)
  const bore = solveZero(p)
  const maxFt = p.maxYd * 3
  const rows = []
  const stepFt = p.stepYd * 3
  let nextFt = 0
  let drag0 = null
  fly(p, bore, maxFt + 6, (x, y, z, vx, vy, vz, t, nx, ny, nz, nvx, nvy, nvz) => {
    while (nextFt <= maxFt && nx >= nextFt) {
      const f = nx === x ? 0 : (nextFt - x) / (nx - x)
      const yy = y + f * (ny - y), zz = z + f * (nz - z), tt = t + f * (t + 0.001 - t)
      const v = Math.sqrt((vx + f * (nvx - vx)) ** 2 + (vy + f * (nvy - vy)) ** 2 + (vz + f * (nvz - vz)) ** 2)
      // drop in inches relative to line of sight (x axis in this frame); drift in inches
      const rangeYd = nextFt / 3
      const dropIn = yy * 12
      const driftIn = zz * 12
      const moaPerIn = rangeYd > 0 ? 100 / (1.047 * rangeYd) : 0 // 1 MOA = 1.047 in per 100 yd
      const mradPerIn = rangeYd > 0 ? 1 / (0.036 * rangeYd) : 0  // 1 mrad = 0.036 in per yd
      rows.push({
        yd: rangeYd, v, mach: v / p.atm.sound, t: tt,
        energy: (p.weight * v * v) / 450240,
        dropIn, driftIn,
        dropMoa: -dropIn * moaPerIn, driftMoa: driftIn * moaPerIn,
        dropMrad: -dropIn * mradPerIn, driftMrad: driftIn * mradPerIn,
      })
      nextFt += stepFt
    }
  })
  const trans = rows.find(r => r.mach < 1.2)
  const sub = rows.find(r => r.mach < 1.0)
  return { rows, bore, zeroYd: p.zeroYd, sound: p.atm.sound, rho: p.atm.rho, transonicYd: trans ? trans.yd : null, subsonicYd: sub ? sub.yd : null }
}
