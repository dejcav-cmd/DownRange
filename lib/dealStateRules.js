/**
 * lib/dealStateRules.js — state legality engine for the Deals page.
 *
 * Every alert carries the ACTUAL legal reason, never a generic "banned":
 *   awb         → listed semi-auto firearm banned under the state's assault weapons law
 *   awb_verify  → semi-auto firearm not on a known list; may fall under the AWB (amber)
 *   mag_banned  → a standalone magazine over the state's capacity limit
 *   mag_included→ a firearm sold WITH a magazine over the limit (the gun itself is not
 *                 what the capacity law targets; the bundled magazine is)
 *   suppressor_banned → state prohibits civilian suppressor possession
 *
 * Priority for a firearm: the assault-weapons ban is the primary reason. A bundled
 * high-capacity magazine is reported as a separate, clearly worded secondary reason
 * and is never allowed to replace the AWB reason.
 */
import { isAWBWeapon } from '@/lib/gunCompliance'

// Fallback rules (merged with /api/state-rules). magLimit* null = no state limit.
// DC: Benson v. United States (Mar 2026) struck down DC's ban — not enforced.
// VA: SB 749 blocked by twin injunctions Jun 2026 — not in effect.
export const DEAL_STATE_RULES = {
  CA:{ name:'California',    magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'Cal. Penal Code §30515', magLaw:'Cal. Penal Code §32310' },
  CT:{ name:'Connecticut',   magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'Conn. Gen. Stat. §53-202c' },
  HI:{ name:'Hawaii',        magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'Haw. Rev. Stat. §134-8' },
  MA:{ name:'Massachusetts', magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'M.G.L. c.140 §131M' },
  MD:{ name:'Maryland',      magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'Md. Code, Crim. Law §4-303' },
  NJ:{ name:'New Jersey',    magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'N.J.S.A. 2C:39-5(f)' },
  NY:{ name:'New York',      magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'NY Penal Law §265.02(7)' },
  OR:{ name:'Oregon',        magLimitHandgun:10, magLimitLonggun:10, awb:false, noSuppressor:false, magLaw:'Measure 114' },
  RI:{ name:'Rhode Island',  magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'RI Assault Weapons Ban Act (eff. Jul 1 2026)' },
  WA:{ name:'Washington',    magLimitHandgun:10, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'RCW 9.41.390 (HB 1240)', magLaw:'RCW 9.41.370' },
  IL:{ name:'Illinois',      magLimitHandgun:15, magLimitLonggun:10, awb:true,  noSuppressor:true,  awbLaw:'720 ILCS 5/24-1.9 (PICA)', magLaw:'720 ILCS 5/24-1.10 (PICA)' },
  VT:{ name:'Vermont',       magLimitHandgun:15, magLimitLonggun:10, awb:false, noSuppressor:false, magLaw:'Act 94' },
  CO:{ name:'Colorado',      magLimitHandgun:15, magLimitLonggun:15, awb:false, noSuppressor:false, magLaw:'C.R.S. §18-12-302' },
  DE:{ name:'Delaware',      magLimitHandgun:17, magLimitLonggun:17, awb:false, noSuppressor:false, magLaw:'11 Del. C. §1469' },
}

// Merge the live rules (Sanity + seed, admin-editable) over the fallback table.
// Local table keeps the handgun/long-gun split; live data decides awb + suppressor flags.
export function mergeStateRules(live) {
  const out = {}
  const codes = new Set([...Object.keys(DEAL_STATE_RULES), ...Object.keys(live || {})])
  for (const code of codes) {
    const base = DEAL_STATE_RULES[code] || {}
    const lv = (live && live[code]) || {}
    const hasSplit = base.magLimitHandgun !== undefined || base.magLimitLonggun !== undefined
    out[code] = {
      ...base,
      name: base.name || lv.name || code,
      awb: lv.awb !== undefined ? !!lv.awb : !!base.awb,
      noSuppressor: lv.noSuppressor !== undefined ? !!lv.noSuppressor : !!base.noSuppressor,
      magLimitHandgun: hasSplit ? base.magLimitHandgun ?? null : (lv.magLimit ?? null),
      magLimitLonggun: hasSplit ? base.magLimitLonggun ?? null : (lv.magLimit ?? null),
    }
    const r = out[code]
    if (!r.awb && !r.noSuppressor && !r.magLimitHandgun && !r.magLimitLonggun) delete out[code]
  }
  return out
}

// ── Deal classification ─────────────────────────────────────────────────────
const LONG_GUN = /\brifle\b|\bshotgun\b|\bcarbine\b|ar-?15|ar-?10|\bak-?\d*|\bsbr\b|lever.?action|bolt.?action|pump.?action|\bpcc\b/i
const SEMI_AUTO = /semi[.\s-]?auto(?:matic)?/i
const NOT_A_FIREARM = /\b(magazine|mag|mags|pmag|ammo|ammunition|optic|scope|red dot|holster|sling|case|safe|suppressor|silencer|barrel|handguard|stock|trigger|upper|lower|kit|part|parts|cleaning|light|laser|bipod|grip|rail|brace)\b/i

export function classifyDeal(title = '') {
  const t = title || ''
  if (/suppressor|silencer/i.test(t)) return 'suppressor'
  // A gun noun (or "w/ / includes") means the listing is a firearm that may ship with a mag.
  const gunNoun = /\b(rifle|carbine|pistol|handgun|shotgun|revolver|combo|package|bundle|glock)\b|\b(w\/|with|includes?)\b/i.test(t)
  const magWord = /\b(magazines?|mags?|pmags?)\b/i.test(t)
  if (magWord && !gunNoun) return 'magazine'
  if (NOT_A_FIREARM.test(t) && !gunNoun && !isAWBWeapon(t)) return 'other'
  return 'firearm'
}

function ordinalLimit(rules, isLongGun) {
  return isLongGun
    ? (rules.magLimitLonggun ?? rules.magLimit ?? null)
    : (rules.magLimitHandgun ?? rules.magLimit ?? null)
}

const RED = { color:'#EF4444', bg:'rgba(239,68,68,0.13)' }
const AMBER = { color:'#F59E0B', bg:'rgba(245,158,11,0.12)' }

export function getDealStateAlerts(deal, stateCode, rulesMap) {
  if (!stateCode) return []
  const rules = rulesMap && rulesMap[stateCode]
  if (!rules) return []
  const title = deal.title || ''
  const kind = classifyDeal(title)
  const isLongGun = LONG_GUN.test(title)
  const cap = deal.detectedCapacity || null
  const limit = ordinalLimit(rules, isLongGun)
  const alerts = []
  const nm = rules.name || stateCode

  if (kind === 'suppressor') {
    if (rules.noSuppressor) {
      alerts.push({ type:'suppressor_banned', ...RED,
        label:`🚫 SUPPRESSORS PROHIBITED IN ${stateCode}`,
        detail:`${nm} prohibits civilian possession of suppressors under state law.` })
    }
    return alerts
  }

  if (kind === 'magazine') {
    if (limit && cap && cap > limit) {
      alerts.push({ type:'mag_banned', ...RED,
        label:`🚫 ${cap}-RD MAGAZINE OVER ${stateCode} ${limit}-RD LIMIT`,
        detail:`${nm} prohibits magazines holding more than ${limit} rounds${rules.magLaw ? ` (${rules.magLaw})` : ''}.` })
    }
    return alerts
  }

  if (kind !== 'firearm') return alerts

  // 1) Assault weapons law — the PRIMARY reason for a listed semi-auto firearm.
  let awbHit = false
  if (rules.awb && isAWBWeapon(title)) {
    awbHit = true
    alerts.push({ type:'awb', ...RED,
      label:`🚫 ASSAULT WEAPON — BANNED IN ${stateCode}`,
      detail:`${nm} bans this semi-automatic firearm under its assault weapons law${rules.awbLaw ? ` (${rules.awbLaw})` : ''}. Not legal to purchase or receive here, regardless of magazine.` })
  } else if (rules.awb && SEMI_AUTO.test(title) && (LONG_GUN.test(title) || /pistol/i.test(title)) &&
             !/bolt|lever|pump|single.?shot|break.?action|revolver/i.test(title)) {
    // Semi-auto, but not a recognised AWB model: don't claim a ban we can't prove.
    alerts.push({ type:'awb_verify', ...AMBER,
      label:`⚠ SEMI-AUTO — VERIFY AGAINST ${stateCode} ASSAULT WEAPON LIST`,
      detail:`${nm} regulates semi-automatic firearms by model and features${rules.awbLaw ? ` (${rules.awbLaw})` : ''}. This model was not matched to the banned list; confirm it is compliant before buying.` })
  }

  // 2) Bundled magazine over the limit — separate, clearly secondary reason.
  if (limit && cap && cap > limit) {
    alerts.push({ type:'mag_included', ...(awbHit ? AMBER : RED),
      label: awbHit
        ? `⚠ ALSO INCLUDES ${cap}-RD MAG (${stateCode} LIMIT ${limit})`
        : `🚫 INCLUDES ${cap}-RD MAG — OVER ${stateCode} ${limit}-RD LIMIT`,
      detail:`${nm} prohibits magazines holding more than ${limit} rounds${rules.magLaw ? ` (${rules.magLaw})` : ''}. The firearm itself is not restricted by this rule; the included ${cap}-round magazine is.` })
  }

  return alerts
}

// Plain-language summary for the state selector (one reason per phrase).
export function describeStateRules(r) {
  if (!r) return ''
  const parts = []
  if (r.awb) parts.push('Assault weapons banned')
  const h = r.magLimitHandgun ?? r.magLimit ?? null
  const l = r.magLimitLonggun ?? r.magLimit ?? null
  if (h && l) parts.push(h === l ? `Mags over ${h} rds banned` : `Mags over ${h} rds (handgun) / ${l} rds (long gun) banned`)
  else if (h) parts.push(`Handgun mags over ${h} rds banned`)
  else if (l) parts.push(`Long-gun mags over ${l} rds banned`)
  if (r.noSuppressor) parts.push('Suppressors prohibited')
  return parts.join(' · ')
}
