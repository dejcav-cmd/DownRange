/**
 * lib/gunCompliance.js — DownRange Shared Compliance Engine
 *
 * Single source of truth for state firearms restriction logic.
 * Pure JS — works in both client ('use client') and server components.
 *
 * State object shape (from page.js / StateBriefing):
 *   { abbr, name, mag, awbFull, awbRestricted, suppLegal, carry, rf }
 *
 * Deal object shape expected by getCompliance():
 *   { cat, name, detectedCapacity? }
 *   cat: 'RIFLE' | 'HANDGUN' | 'SUPPRESSOR' | 'AMMO' | 'MAGAZINE' | 'GENERAL'
 *
 * Sources: WA HB 1240 (2023 AWB), RCW 9.41.370 (mag limit),
 *   NRA-ILA, Giffords, state statutes — verified July 2026.
 */

// ── CAPACITY EXTRACTION ───────────────────────────────────────────────────────
// Handles: "15rd", "15-rd", "15 rd", "15rnd", "15+1", "30-round", "30 rounds"
export function extractCapacity(title = '') {
  if (!title) return null
  // "15+1" capacity notation (most specific — the 15 is mag, +1 is chamber)
  const plusOne = title.match(/\b(\d{1,3})\+1\b/)
  if (plusOne) {
    const cap = parseInt(plusOne[1], 10)
    if (cap >= 5 && cap <= 200) return cap
  }
  // "Xrd", "X-rd", "X rd", "Xrnd", "X rounds", "X-round"
  const m = title.match(/\b(\d{1,3})[\s-]?(?:rds?|rnds?|rounds?)\b/i)
  if (m) {
    const cap = parseInt(m[1], 10)
    if (cap >= 5 && cap <= 200) return cap
  }
  return null
}

// ── AWB PLATFORM DETECTION ────────────────────────────────────────────────────
// Returns true if the title describes a firearm covered by typical state AWBs.
// AWBs target semi-automatic, military-style firearms. Traditional bolt-action,
// lever-action, pump-action, and single-shot rifles are NOT covered.
//
// Includes WA HB 1240 (2023), CA, NY, CT, MD, NJ, MA, HI, CO, IL, OR, RI AWBs.
export function isAWBWeapon(title = '') {
  const t = (title || '').toLowerCase()

  // ── Exempt traditional action types ─────────────────────────────────────────
  if (/bolt[.\s-]?action|lever[.\s-]?action|pump[.\s-]?action|single[.\s-]?shot|muzzleload|double[.\s-]?barrel|over[.\s-]?under/i.test(t)) return false

  // ── Not a firearm ────────────────────────────────────────────────────────────
  if (/suppressor|silencer|\bscope\b|\boptic\b|red dot|\bammo\b|ammunition|\bfmj\b|\bjhp\b|\bholster\b|\bsling\b/i.test(t)) return false

  // ── Named platforms explicitly covered by state AWBs ─────────────────────────
  // AR/AK variants
  if (/ar-?15|ar15|ak-?47|ak47|ak-?74|ak74|\bm4\b|\bm16\b|\bdraco\b|micro\s*draco|mini\s*draco/i.test(t)) return true
  // Springfield Armory assault-style
  if (/\bkuna\b|\bsaint\s*victor\b|\bsaint\s*ar\b|\bhellion\b/i.test(t)) return true
  // PCCs and pistol-caliber carbines (also covered under WA HB 1240 pistol provision)
  if (/\bpcc\b|pistol[.\s-]?caliber[.\s-]?carbine|banshee|cmmg\s*banshee/i.test(t)) return true
  // Submachine gun style (MP5, Scorpion, etc.)
  if (/\bmp5\b|\bsp5\b|\bsp89\b|cz\s*scorpion|scorpion\s*evo|foxtrot\s*mike|fm-?9|angstadt/i.test(t)) return true
  if (/mac-?10|mac-?11|\buzi\b|micro\s*uzi|kel[.\s-]?tec\s*sub|cz\s*evo/i.test(t)) return true
  // Bullpup rifles
  if (/tavor|\bx95\b|galil\s*ace|\biwi\b|\brdp\b|\brdb\b|fn\s*scar|bren\s*2|vz[.\s-]?58/i.test(t)) return true
  // Semi-auto shotguns (covered by many AWBs)
  if (/fostech|aa-?12|origin[.\s-]?12|\bksg\b|kel[.\s-]?tec\s*ksg|benelli\s*m4|saiga\s*12|vepr\s*12/i.test(t)) return true
  // Other named platforms
  if (/sig\s*mcx|sig\s*spear|freedom\s*ordnance|grand\s*power|stribog|\bzpap\b|\bsaiga\b|\bvepr\b/i.test(t)) return true

  // ── MSR calibers WITH semi-auto feature signal ───────────────────────────────
  // Calibers alone don't make a weapon an AW — but combined with feature terms they do
  if (/5\.56[\s×x]?45|\.223\s*rem(?:ington)?|300\s*(?:blk|aac|blackout)|7\.62[\s×x]?39|6\.5\s*grendel|224\s*valkyrie/i.test(t)) {
    if (/semi[.\s-]?auto|pistol\s*grip|collapsible|folding|detachable|30[.\s-]?rd|20[.\s-]?rd|25[.\s-]?rd|lower\s*receiver/i.test(t)) return true
  }

  return false
}

// ── COMPLIANCE VERDICT ────────────────────────────────────────────────────────
// Returns a typed alert for a deal in a given state.
//
// Return shape: { type: 'banned'|'restricted'|'ok', label, detail }
//   banned     → red — legally prohibited, do not purchase/ship here
//   restricted → amber — legal but requires special steps / verify first
//   ok         → green / no badge — legal, ships normally
export function getCompliance(deal, stateObj) {
  if (!stateObj) return { type: 'ok', label: 'Legal', detail: '' }

  const s   = stateObj
  const cat = deal.cat || 'GENERAL'
  const name = deal.name || deal.title || ''
  const cap  = deal.detectedCapacity || extractCapacity(name)
  const isFirearm = ['RIFLE', 'HANDGUN', 'SUPPRESSOR'].includes(cat)
  const isGun     = ['RIFLE', 'HANDGUN'].includes(cat)

  // ── 1. Magazine capacity ban (highest priority — applies to ALL firearm/mag items) ──
  if (s.mag && cap && cap > s.mag && (isFirearm || cat === 'MAGAZINE')) {
    return {
      type:   'banned',
      label:  `🚫 BANNED — ${cap}-rd mag over ${s.name}'s ${s.mag}-rd limit`,
      detail: `${s.name} bans detachable magazines over ${s.mag} rounds (RCW 9.41.370 / state law). This ${cap}-rd item is prohibited.`,
    }
  }

  // ── 2. Suppressor ban ────────────────────────────────────────────────────────
  if (cat === 'SUPPRESSOR' && !s.suppLegal) {
    return {
      type:   'banned',
      label:  `🚫 BANNED — suppressors illegal in ${s.name}`,
      detail: `${s.name} prohibits civilian suppressor ownership.`,
    }
  }

  // ── 3. Full AWB — named assault weapons (rifles + MSR pistols) ───────────────
  if (s.awbFull && isGun && isAWBWeapon(name)) {
    const catLabel = cat === 'RIFLE' ? 'rifle' : 'pistol/PCC'
    return {
      type:   'banned',
      label:  `🚫 BANNED — assault weapon in ${s.name}`,
      detail: `${s.name} bans this semi-auto ${catLabel} under its assault weapons law (HB 1240 / state AWB). Not legal to purchase or receive.`,
    }
  }

  // ── 4. Full AWB — generic rifles not yet matched by name ────────────────────
  if (s.awbFull && cat === 'RIFLE') {
    return {
      type:   'restricted',
      label:  `⚠ ${s.name} AWB — verify configuration`,
      detail: `${s.name} bans semi-automatic rifles with military features. Featureless-only builds may be legal. Verify before purchase.`,
    }
  }

  // ── 5. Restricted AWB (featureless-required states) ────────────────────────
  if (s.awbRestricted && cat === 'RIFLE') {
    return {
      type:   'restricted',
      label:  `⚠ ${s.name}: featureless build required`,
      detail: `${s.name} restricts semi-auto rifles with "assault weapon" features. Featureless-only variants may be legal.`,
    }
  }

  // ── 6. Standalone magazine items ─────────────────────────────────────────────
  if (cat === 'MAGAZINE') {
    if (s.mag) {
      if (cap && cap <= s.mag) return { type: 'ok', label: `Legal — under ${s.name}'s ${s.mag}-rd limit`, detail: '' }
      if (!cap) return { type: 'restricted', label: `⚠ ${s.name}: verify capacity ≤ ${s.mag} rds`, detail: `${s.name} limits magazines to ${s.mag} rounds.` }
    }
    return { type: 'ok', label: `Legal in ${s.name}`, detail: '' }
  }

  // ── 7. State-specific handgun requirements ───────────────────────────────────
  if (cat === 'HANDGUN') {
    if (s.abbr === 'CA') return { type: 'restricted', label: `⚠ CA: verify approved roster`, detail: 'CA requires handguns be on the DOJ-approved roster (semi-auto only). Revolvers and pre-roster models may transfer via PPT.' }
    if (s.abbr === 'NY') return { type: 'restricted', label: `⚠ NY: county pistol permit required`, detail: 'NY requires a county-issued pistol permit before purchasing a handgun.' }
    if (s.abbr === 'MA') return { type: 'restricted', label: `⚠ MA: must be on AG approved list`, detail: "MA requires handguns on the AG's approved firearm roster." }
    if (s.abbr === 'IL') return { type: 'restricted', label: `⚠ IL: FOID card required`, detail: 'IL requires a Firearm Owner Identification (FOID) card to purchase any firearm.' }
    if (s.abbr === 'HI') return { type: 'restricted', label: `⚠ HI: permit required + 14-day wait`, detail: 'HI requires a permit to purchase and a 14-day waiting period for all firearms.' }
    if (s.abbr === 'NJ') return { type: 'restricted', label: `⚠ NJ: purchase ID required`, detail: 'NJ requires a Firearms Purchaser Identification Card (FPIC) for handgun purchases.' }
    if (s.abbr === 'MD') return { type: 'restricted', label: `⚠ MD: HQL required for regulated firearms`, detail: 'MD requires a Handgun Qualification License (HQL) to purchase regulated firearms.' }
    if (s.abbr === 'WA' && s.awbFull) return { type: 'restricted', label: `⚠ WA: semi-auto pistol — verify standard-capacity`, detail: 'WA bans magazines >10 rounds and certain semi-auto pistol configurations. Verify this model uses standard 10-rd mags.' }
  }

  // ── 8. Ammo state restrictions ───────────────────────────────────────────────
  if (cat === 'AMMO') {
    if (s.abbr === 'CA') return { type: 'restricted', label: `⚠ CA: background check at purchase`, detail: 'CA requires a background check for all ammunition purchases. No direct online ship to consumer.' }
    if (s.abbr === 'NY') return { type: 'restricted', label: `⚠ NY: FFL transfer only`, detail: "NY bans direct-to-consumer ammo shipping. Must ship to licensed dealer." }
    if (s.abbr === 'IL') return { type: 'restricted', label: `⚠ IL: FOID required`, detail: 'IL requires a FOID card to purchase ammunition.' }
    if (s.abbr === 'NJ') return { type: 'restricted', label: `⚠ NJ: hollow-point restrictions`, detail: 'NJ prohibits civilian carry of hollow-point ammo with limited exceptions.' }
  }

  return { type: 'ok', label: `Legal in ${s.name}`, detail: '' }
}

// ── VERDICT STYLE HELPERS ─────────────────────────────────────────────────────
export const COMPLIANCE_STYLES = {
  banned:     { bg:'rgba(239,68,68,.09)',  bd:'rgba(239,68,68,.30)',  fg:'#fca5a5', ico:'✗' },
  restricted: { bg:'rgba(245,158,11,.09)', bd:'rgba(245,158,11,.25)', fg:'#fbbf68', ico:'⚠' },
  ok:         { bg:'rgba(34,197,94,.08)',  bd:'rgba(34,197,94,.20)',  fg:'#6ee7a3', ico:'✓' },
}
