'use client'
/**
 * ComplianceRulesPanel — Admin Compliance Engine Dashboard
 *
 * Three tabs:
 *   1. State Rules — live table of all restricted states (mag/AWB/suppressor)
 *      with inline edits that patch Sanity stateProfile docs
 *   2. Deal Tester — paste any deal title, instantly see compliance across all states
 *   3. Deal Audit — fetch latest deals from Sanity, show which are flagged per state
 */

import { useState, useEffect, useCallback } from 'react'
import { extractCapacity, isAWBWeapon, getCompliance, COMPLIANCE_STYLES } from '@/lib/gunCompliance'

const MONO  = "'IBM Plex Mono',monospace"
const COND  = "'Barlow Condensed',sans-serif"
const BEBAS = "'Bebas Neue',cursive"

// ── Canonical state rules (all 50 states, restricted ones with full data) ────
// Matches PageClient.js STATE_RULES but extended to full 50-state model.
// awbFull = complete assault weapon ban (purchase/possession prohibited)
// awbRestricted = featureless-only or feature-limited restriction
const STATE_PROFILES = [
  { abbr:'AL', name:'Alabama',       mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'AK', name:'Alaska',        mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'AZ', name:'Arizona',       mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'AR', name:'Arkansas',      mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'CA', name:'California',    mag:10,   awbFull:false, awbRestricted:true,  suppLegal:false, carry:false },
  { abbr:'CO', name:'Colorado',      mag:15,   awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'CT', name:'Connecticut',   mag:10,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'DE', name:'Delaware',      mag:17,   awbFull:false, awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'FL', name:'Florida',       mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'GA', name:'Georgia',       mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'HI', name:'Hawaii',        mag:10,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'ID', name:'Idaho',         mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'IL', name:'Illinois',      mag:15,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'IN', name:'Indiana',       mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'IA', name:'Iowa',          mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'KS', name:'Kansas',        mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'KY', name:'Kentucky',      mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'LA', name:'Louisiana',     mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'ME', name:'Maine',         mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'MD', name:'Maryland',      mag:10,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'MA', name:'Massachusetts', mag:10,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'MI', name:'Michigan',      mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'MN', name:'Minnesota',     mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:false },
  { abbr:'MS', name:'Mississippi',   mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'MO', name:'Missouri',      mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'MT', name:'Montana',       mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'NE', name:'Nebraska',      mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:false },
  { abbr:'NV', name:'Nevada',        mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'NH', name:'New Hampshire', mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'NJ', name:'New Jersey',    mag:10,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'NM', name:'New Mexico',    mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'NY', name:'New York',      mag:10,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'NC', name:'North Carolina',mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'ND', name:'North Dakota',  mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'OH', name:'Ohio',          mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'OK', name:'Oklahoma',      mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'OR', name:'Oregon',        mag:10,   awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'PA', name:'Pennsylvania',  mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:false },
  { abbr:'RI', name:'Rhode Island',  mag:10,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:false },
  { abbr:'SC', name:'South Carolina',mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'SD', name:'South Dakota',  mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'TN', name:'Tennessee',     mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'TX', name:'Texas',         mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'UT', name:'Utah',          mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'VT', name:'Vermont',       mag:15,   awbFull:false, awbRestricted:false, suppLegal:true,  carry:false },
  { abbr:'VA', name:'Virginia',      mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:false },
  { abbr:'WA', name:'Washington',    mag:10,   awbFull:true,  awbRestricted:false, suppLegal:false, carry:true  },
  { abbr:'WV', name:'West Virginia', mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
  { abbr:'WI', name:'Wisconsin',     mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:false },
  { abbr:'WY', name:'Wyoming',       mag:null, awbFull:false, awbRestricted:false, suppLegal:true,  carry:true  },
]

const RESTRICTED = STATE_PROFILES.filter(s => s.mag || s.awbFull || s.awbRestricted || !s.suppLegal)

// ── Category options for deal tester ─────────────────────────────────────────
const CATS = ['RIFLE', 'HANDGUN', 'SUPPRESSOR', 'AMMO', 'MAGAZINE', 'GENERAL']

// ── Shared styles ─────────────────────────────────────────────────────────────
const S = {
  card: { background:'#111318', border:'1px solid #1f2937', padding:'18px 20px', marginBottom:12 },
  label: { fontFamily:MONO, fontSize:9.5, letterSpacing:'.1em', textTransform:'uppercase', color:'#6B7280', marginBottom:4 },
  badge: (color, bg) => ({
    fontFamily:MONO, fontSize:9, fontWeight:700, letterSpacing:'.08em',
    padding:'2px 8px', background:bg || color + '18', border:`1px solid ${color}44`,
    color, display:'inline-block', lineHeight:1.6,
  }),
  th: { fontFamily:MONO, fontSize:9, letterSpacing:'.1em', textTransform:'uppercase', color:'#4B5563', padding:'8px 12px', textAlign:'left', borderBottom:'1px solid #1f2937', whiteSpace:'nowrap' },
  td: { fontFamily:MONO, fontSize:11, color:'#D1D5DB', padding:'7px 12px', borderBottom:'1px solid #111827', verticalAlign:'middle' },
  input: { fontFamily:MONO, fontSize:11, background:'#0D0E10', border:'1px solid #374151', color:'#F0EDE6', padding:'5px 8px', width:'60px' },
  pill: (on, onColor) => ({
    display:'inline-block', fontFamily:MONO, fontSize:8.5, fontWeight:700,
    letterSpacing:'.07em', padding:'2px 9px', border:`1px solid ${on ? onColor + '66' : '#374151'}`,
    background: on ? onColor + '18' : 'transparent', color: on ? onColor : '#4B5563',
  }),
}

// ── Tab: State Rules Table ────────────────────────────────────────────────────
function StateRulesTab({ adminKey }) {
  const [saving, setSaving] = useState({})
  const [rules, setRules]   = useState(() => STATE_PROFILES.map(s => ({ ...s })))
  const [filter, setFilter] = useState('restricted') // 'all' | 'restricted'

  const shown = filter === 'all' ? rules : rules.filter(s => s.mag || s.awbFull || s.awbRestricted || !s.suppLegal)

  const update = useCallback((abbr, field, val) => {
    setRules(prev => prev.map(s => s.abbr === abbr ? { ...s, [field]: val } : s))
  }, [])

  const save = useCallback(async (abbr) => {
    const s = rules.find(r => r.abbr === abbr)
    if (!s) return
    setSaving(p => ({ ...p, [abbr]: true }))
    try {
      await fetch('/api/admin/state-rules', {
        method: 'POST',
        headers: { 'content-type':'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ abbr, mag: s.mag, awbFull: s.awbFull, awbRestricted: s.awbRestricted, suppLegal: s.suppLegal }),
      })
    } catch { /* ignore */ }
    setSaving(p => ({ ...p, [abbr]: false }))
  }, [rules, adminKey])

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
        <button
          onClick={() => setFilter('restricted')}
          style={{ fontFamily:MONO, fontSize:10, padding:'6px 14px', border:'1px solid', cursor:'pointer',
            background: filter === 'restricted' ? '#C8922A' : 'transparent',
            color: filter === 'restricted' ? '#000' : '#9CA3AF',
            borderColor: filter === 'restricted' ? '#C8922A' : '#374151',
          }}>Restricted States ({RESTRICTED.length})</button>
        <button
          onClick={() => setFilter('all')}
          style={{ fontFamily:MONO, fontSize:10, padding:'6px 14px', border:'1px solid', cursor:'pointer',
            background: filter === 'all' ? '#C8922A' : 'transparent',
            color: filter === 'all' ? '#000' : '#9CA3AF',
            borderColor: filter === 'all' ? '#C8922A' : '#374151',
          }}>All 50 States</button>
        <span style={{ fontFamily:MONO, fontSize:9, color:'#4B5563', marginLeft:'auto' }}>
          Edits sync to Sanity stateProfile docs · July 2026 data
        </span>
      </div>

      <div style={{ overflowX:'auto' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:700 }}>
          <thead>
            <tr style={{ background:'#0D0E10' }}>
              <th style={S.th}>State</th>
              <th style={S.th}>Mag Limit</th>
              <th style={S.th}>Full AWB</th>
              <th style={S.th}>Restricted AWB</th>
              <th style={S.th}>Suppressors</th>
              <th style={S.th}>Const. Carry</th>
              <th style={{ ...S.th, width:70 }}></th>
            </tr>
          </thead>
          <tbody>
            {shown.map(s => {
              const restricted = s.mag || s.awbFull || s.awbRestricted || !s.suppLegal
              return (
                <tr key={s.abbr} style={{ background: restricted ? 'rgba(239,68,68,.03)' : 'transparent' }}>
                  <td style={S.td}>
                    <span style={{ fontFamily:COND, fontWeight:700, fontSize:14, color: restricted ? '#fca5a5' : '#6B7280', marginRight:8 }}>{s.abbr}</span>
                    <span style={{ color:'#6B7280', fontSize:10 }}>{s.name}</span>
                  </td>
                  <td style={S.td}>
                    <input
                      type="number" min="1" max="100" placeholder="None"
                      value={s.mag ?? ''}
                      onChange={e => update(s.abbr, 'mag', e.target.value ? parseInt(e.target.value) : null)}
                      style={{ ...S.input, width:60, color: s.mag ? '#fca5a5' : '#4B5563' }}
                    />
                    {s.mag && <span style={{ fontFamily:MONO, fontSize:9, color:'#EF4444', marginLeft:5 }}>rds</span>}
                  </td>
                  <td style={S.td}>
                    <button onClick={() => update(s.abbr, 'awbFull', !s.awbFull)}
                      style={{ ...S.pill(s.awbFull, '#EF4444'), cursor:'pointer' }}>
                      {s.awbFull ? 'BANNED' : 'No'}
                    </button>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => update(s.abbr, 'awbRestricted', !s.awbRestricted)}
                      style={{ ...S.pill(s.awbRestricted, '#F59E0B'), cursor:'pointer' }}>
                      {s.awbRestricted ? 'RESTRICTED' : 'No'}
                    </button>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => update(s.abbr, 'suppLegal', !s.suppLegal)}
                      style={{ ...S.pill(s.suppLegal, '#22C55E'), cursor:'pointer' }}>
                      {s.suppLegal ? 'Legal' : 'BANNED'}
                    </button>
                  </td>
                  <td style={S.td}>
                    <span style={S.pill(s.carry, '#22C55E')}>{s.carry ? 'YES' : 'No'}</span>
                  </td>
                  <td style={S.td}>
                    <button
                      onClick={() => save(s.abbr)}
                      disabled={saving[s.abbr]}
                      style={{ fontFamily:MONO, fontSize:9, fontWeight:700, padding:'4px 12px', cursor:'pointer',
                        background: saving[s.abbr] ? '#1f2937' : '#C8922A',
                        color: saving[s.abbr] ? '#6B7280' : '#000',
                        border:'none', letterSpacing:'.06em',
                      }}>
                      {saving[s.abbr] ? '…' : 'SAVE'}
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <p style={{ fontFamily:MONO, fontSize:9, color:'#374151', marginTop:12 }}>
        IL has split limits: 15-rd handgun / 10-rd long gun. VT: 15-rd handgun / 10-rd long gun. Use PageClient.js STATE_RULES for split-limit states. · CA uses feature-based restriction (awbRestricted), not a full ban.
      </p>
    </div>
  )
}

// ── Tab: Deal Tester ──────────────────────────────────────────────────────────
function DealTesterTab() {
  const [title, setTitle]   = useState('')
  const [cat,   setCat]     = useState('RIFLE')
  const [results, setResults] = useState([])

  const EXAMPLES = [
    { label:'Springfield Kuna', title:'Springfield Armory Kuna 5.56 30-rd', cat:'RIFLE' },
    { label:'Glock 48 (15rd)',  title:'Glock 48 9mm 15rd Magazine',          cat:'HANDGUN' },
    { label:'CMMG Banshee',     title:'CMMG Banshee 9mm PCC 30rd',           cat:'RIFLE'  },
    { label:'SilencerCo',       title:'SilencerCo Omega 9 Suppressor',       cat:'SUPPRESSOR' },
    { label:'Ruger 10/22',      title:'Ruger 10/22 Takedown .22LR',          cat:'RIFLE'  },
    { label:'PMAG 30',          title:'Magpul PMAG Gen M3 30-Round 5.56',    cat:'MAGAZINE' },
    { label:'Federal 9mm 500rd',title:'Federal American Eagle 9mm 500 Rounds', cat:'AMMO' },
  ]

  const test = useCallback((t = title, c = cat) => {
    if (!t.trim()) return
    const deal = { cat: c, name: t, detectedCapacity: extractCapacity(t) }
    const rows = STATE_PROFILES.map(s => ({
      ...s,
      verdict: getCompliance(deal, s),
    }))
    setResults(rows)
  }, [title, cat])

  const loadExample = (ex) => {
    setTitle(ex.title)
    setCat(ex.cat)
    setTimeout(() => test(ex.title, ex.cat), 0)
  }

  const banned     = results.filter(r => r.verdict?.type === 'banned')
  const restricted = results.filter(r => r.verdict?.type === 'restricted')
  const ok         = results.filter(r => r.verdict?.type === 'ok')
  const cap        = extractCapacity(title)
  const isAWB      = title ? isAWBWeapon(title) : false

  return (
    <div>
      {/* Controls */}
      <div style={{ display:'flex', gap:10, marginBottom:14, flexWrap:'wrap', alignItems:'flex-end' }}>
        <div style={{ flex:1, minWidth:300 }}>
          <div style={S.label}>Deal Title</div>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && test()}
            placeholder="Paste any deal title here…"
            style={{ fontFamily:MONO, fontSize:12, background:'#0D0E10', border:'1px solid #374151', color:'#F0EDE6', padding:'9px 12px', width:'100%', boxSizing:'border-box' }}
          />
        </div>
        <div>
          <div style={S.label}>Category</div>
          <select value={cat} onChange={e => setCat(e.target.value)}
            style={{ fontFamily:MONO, fontSize:11, background:'#0D0E10', border:'1px solid #374151', color:'#F0EDE6', padding:'9px 10px', cursor:'pointer' }}>
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <button onClick={() => test()}
          style={{ fontFamily:MONO, fontSize:11, fontWeight:700, padding:'9px 22px', background:'#C8922A', color:'#000', border:'none', cursor:'pointer', letterSpacing:'.08em', alignSelf:'flex-end' }}>
          TEST →
        </button>
      </div>

      {/* Quick examples */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:18 }}>
        <span style={{ fontFamily:MONO, fontSize:9, color:'#4B5563', alignSelf:'center', letterSpacing:'.06em' }}>EXAMPLES:</span>
        {EXAMPLES.map(ex => (
          <button key={ex.label} onClick={() => loadExample(ex)}
            style={{ fontFamily:MONO, fontSize:9, padding:'4px 10px', background:'transparent', border:'1px solid #374151', color:'#9CA3AF', cursor:'pointer' }}>
            {ex.label}
          </button>
        ))}
      </div>

      {/* Detection metadata */}
      {title && (
        <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
          <div style={S.card}>
            <div style={S.label}>Detected Capacity</div>
            <div style={{ fontFamily:COND, fontWeight:700, fontSize:22, color: cap ? '#fca5a5' : '#4B5563' }}>{cap ? `${cap} rounds` : 'Not detected'}</div>
          </div>
          <div style={S.card}>
            <div style={S.label}>AWB Platform?</div>
            <div style={{ fontFamily:COND, fontWeight:700, fontSize:22, color: isAWB ? '#fca5a5' : '#22C55E' }}>{isAWB ? '🚫 YES — AWB covered' : '✓ No'}</div>
          </div>
          <div style={S.card}>
            <div style={S.label}>Category</div>
            <div style={{ fontFamily:COND, fontWeight:700, fontSize:22, color:'#C8922A' }}>{cat}</div>
          </div>
        </div>
      )}

      {/* Results summary */}
      {results.length > 0 && (
        <>
          <div style={{ display:'flex', gap:10, marginBottom:14 }}>
            {[
              { label:'BANNED', count: banned.length, color:'#EF4444' },
              { label:'RESTRICTED', count: restricted.length, color:'#F59E0B' },
              { label:'LEGAL', count: ok.length, color:'#22C55E' },
            ].map(({ label, count, color }) => (
              <div key={label} style={{ ...S.card, flex:1, textAlign:'center', borderColor: color + '33' }}>
                <div style={{ fontFamily:BEBAS, fontSize:36, color, lineHeight:1 }}>{count}</div>
                <div style={{ fontFamily:MONO, fontSize:9, color:'#6B7280', letterSpacing:'.1em' }}>{label}</div>
              </div>
            ))}
          </div>

          {/* State-by-state table */}
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ background:'#0D0E10' }}>
                  <th style={S.th}>State</th>
                  <th style={S.th}>Verdict</th>
                  <th style={S.th}>Detail</th>
                </tr>
              </thead>
              <tbody>
                {[...banned, ...restricted, ...ok].map(r => {
                  const cs = COMPLIANCE_STYLES[r.verdict.type]
                  return (
                    <tr key={r.abbr} style={{ background: r.verdict.type !== 'ok' ? cs.bg : 'transparent' }}>
                      <td style={{ ...S.td, fontFamily:COND, fontWeight:700, fontSize:15 }}>
                        <span style={{ color: r.verdict.type === 'ok' ? '#6B7280' : cs.fg }}>{r.abbr}</span>
                        <span style={{ fontFamily:MONO, fontSize:9, color:'#4B5563', marginLeft:8 }}>{r.name}</span>
                      </td>
                      <td style={S.td}>
                        <span style={{ ...S.badge(cs.fg), borderColor: cs.bd, background: cs.bg }}>
                          {cs.ico} {r.verdict.type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ ...S.td, color:'#6B7280', fontSize:10 }}>{r.verdict.label}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ── Tab: Deal Audit ───────────────────────────────────────────────────────────
function DealAuditTab({ adminKey }) {
  const [state, setState]   = useState('WA')
  const [deals, setDeals]   = useState([])
  const [loading, setLoading] = useState(false)
  const [audited, setAudited] = useState([])

  const stateObj = STATE_PROFILES.find(s => s.abbr === state)

  const run = useCallback(async () => {
    setLoading(true)
    setAudited([])
    try {
      const r = await fetch(`/api/deals/list?limit=200`, {
        headers: { 'x-admin-key': adminKey }
      })
      const json = await r.json().catch(() => ({ items: [] }))
      const items = json.items || json.deals || []
      setDeals(items)
      const results = items.map(d => {
        const deal = {
          cat: inferCatSimple(d.title || ''),
          name: d.title || '',
          detectedCapacity: extractCapacity(d.title || ''),
        }
        return { ...d, deal, verdict: getCompliance(deal, stateObj) }
      })
      setAudited(results.sort((a, b) => {
        const order = { banned: 0, restricted: 1, ok: 2 }
        return (order[a.verdict.type] ?? 3) - (order[b.verdict.type] ?? 3)
      }))
    } catch (e) {
      console.error(e)
    }
    setLoading(false)
  }, [state, stateObj, adminKey])

  // Simple category inference (mirrors page.js inferCat)
  function inferCatSimple(t = '') {
    const l = t.toLowerCase()
    if (/suppressor|silencer/.test(l)) return 'SUPPRESSOR'
    if (/\bmagazine\b|\bpmag\b|\bdrum\b/.test(l)) return 'MAGAZINE'
    if (/\bpistol\b|\brevolver\b|\bglock\b|\bp365\b|\bp320\b|\b1911\b/.test(l)) return 'HANDGUN'
    if (/ar-?15|ak-?47|\brifle\b|\bcarbine\b|\bshotgun\b/.test(l)) return 'RIFLE'
    if (/\bammo\b|\bammunition\b|\bfmj\b|\bjhp\b|\b9mm\b|\b5\.56\b/.test(l)) return 'AMMO'
    return 'GENERAL'
  }

  const banned     = audited.filter(d => d.verdict.type === 'banned')
  const restricted = audited.filter(d => d.verdict.type === 'restricted')

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'flex-end', flexWrap:'wrap' }}>
        <div>
          <div style={S.label}>Audit State</div>
          <select value={state} onChange={e => setState(e.target.value)}
            style={{ fontFamily:MONO, fontSize:12, background:'#0D0E10', border:'1px solid #374151', color:'#F0EDE6', padding:'8px 12px', cursor:'pointer' }}>
            {STATE_PROFILES.map(s => <option key={s.abbr} value={s.abbr}>{s.abbr} — {s.name}</option>)}
          </select>
        </div>
        <button onClick={run} disabled={loading}
          style={{ fontFamily:MONO, fontSize:11, fontWeight:700, padding:'9px 22px', background: loading ? '#1f2937' : '#C8922A', color: loading ? '#6B7280' : '#000', border:'none', cursor: loading ? 'default' : 'pointer', letterSpacing:'.08em', alignSelf:'flex-end' }}>
          {loading ? 'AUDITING…' : 'RUN AUDIT →'}
        </button>
        {audited.length > 0 && (
          <div style={{ fontFamily:MONO, fontSize:9, color:'#6B7280', alignSelf:'center', marginLeft:4 }}>
            {audited.length} deals scanned · {banned.length} banned · {restricted.length} restricted in {stateObj?.name || state}
          </div>
        )}
      </div>

      {stateObj && (
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16 }}>
          {stateObj.mag && <span style={S.badge('#EF4444')}>🚫 {stateObj.mag}-RD MAG LIMIT</span>}
          {stateObj.awbFull && <span style={S.badge('#EF4444')}>🚫 FULL AWB BAN</span>}
          {stateObj.awbRestricted && <span style={S.badge('#F59E0B')}>⚠ FEATURELESS REQUIRED</span>}
          {!stateObj.suppLegal && <span style={S.badge('#EF4444')}>🚫 NO SUPPRESSORS</span>}
          {!stateObj.mag && !stateObj.awbFull && !stateObj.awbRestricted && stateObj.suppLegal && (
            <span style={S.badge('#22C55E')}>✓ NO RESTRICTIONS</span>
          )}
        </div>
      )}

      {audited.length > 0 && (
        <div>
          {banned.length > 0 && (
            <>
              <div style={{ fontFamily:MONO, fontSize:10, fontWeight:700, letterSpacing:'.1em', color:'#EF4444', marginBottom:8 }}>
                🚫 BANNED IN {stateObj?.name || state} ({banned.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:16 }}>
                {banned.map((d, i) => (
                  <div key={i} style={{ background:'rgba(239,68,68,.07)', border:'1px solid rgba(239,68,68,.2)', padding:'7px 12px', display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                    <div>
                      <span style={{ fontFamily:COND, fontWeight:700, fontSize:13, color:'#fca5a5' }}>{d.title?.slice(0, 90)}</span>
                      <span style={{ fontFamily:MONO, fontSize:8.5, color:'#6B7280', marginLeft:8 }}>{d.deal.cat}</span>
                      {d.deal.detectedCapacity && <span style={{ fontFamily:MONO, fontSize:8.5, color:'#EF4444', marginLeft:6 }}>{d.deal.detectedCapacity}-rd</span>}
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:9, color:'#fca5a5', flexShrink:0 }}>{d.verdict.label.replace(/🚫 ?/, '')}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {restricted.length > 0 && (
            <>
              <div style={{ fontFamily:MONO, fontSize:10, fontWeight:700, letterSpacing:'.1em', color:'#F59E0B', marginBottom:8 }}>
                ⚠ RESTRICTED IN {stateObj?.name || state} ({restricted.length})
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:2, marginBottom:16 }}>
                {restricted.map((d, i) => (
                  <div key={i} style={{ background:'rgba(245,158,11,.06)', border:'1px solid rgba(245,158,11,.18)', padding:'7px 12px', display:'flex', justifyContent:'space-between', gap:10, alignItems:'center', flexWrap:'wrap' }}>
                    <div>
                      <span style={{ fontFamily:COND, fontWeight:700, fontSize:13, color:'#fbbf68' }}>{d.title?.slice(0, 90)}</span>
                      <span style={{ fontFamily:MONO, fontSize:8.5, color:'#6B7280', marginLeft:8 }}>{d.deal.cat}</span>
                    </div>
                    <div style={{ fontFamily:MONO, fontSize:9, color:'#fbbf68', flexShrink:0 }}>{d.verdict.label.replace(/⚠ ?/, '')}</div>
                  </div>
                ))}
              </div>
            </>
          )}

          {banned.length === 0 && restricted.length === 0 && (
            <div style={{ fontFamily:MONO, fontSize:11, color:'#22C55E', padding:'20px', textAlign:'center', background:'rgba(34,197,94,.05)', border:'1px solid rgba(34,197,94,.15)' }}>
              ✓ All {audited.length} deals are legal in {stateObj?.name || state}
            </div>
          )}
        </div>
      )}

      {!loading && audited.length === 0 && (
        <div style={{ fontFamily:MONO, fontSize:11, color:'#4B5563', padding:'28px', textAlign:'center', border:'1px dashed #1f2937' }}>
          Select a state and run audit to check live deals for compliance issues
        </div>
      )}
    </div>
  )
}

// ── Main Panel ────────────────────────────────────────────────────────────────
export default function ComplianceRulesPanel({ adminKey }) {
  const [tab, setTab] = useState('rules')

  const TABS = [
    { id:'rules',  label:'State Rules',   icon:'🗺' },
    { id:'tester', label:'Deal Tester',   icon:'🔍' },
    { id:'audit',  label:'Deal Audit',    icon:'⚡' },
  ]

  return (
    <div style={{ fontFamily:MONO }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:24, flexWrap:'wrap' }}>
        <div>
          <h2 style={{ fontFamily:BEBAS, fontSize:28, letterSpacing:'.06em', margin:0, color:'#F0EDE6' }}>
            Compliance Engine
          </h2>
          <p style={{ fontFamily:MONO, fontSize:10, color:'#4B5563', marginTop:4, letterSpacing:'.06em' }}>
            50-state gun law rules · AWB &amp; magazine ban detection · Live deal audit
          </p>
        </div>
        <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginLeft:'auto' }}>
          {[
            { label:'WA HB 1240', color:'#EF4444' },
            { label:'RCW 9.41.370', color:'#EF4444' },
            { label:'CA DOJ', color:'#EF4444' },
            { label:'NRA-ILA', color:'#C8922A' },
          ].map(t => (
            <span key={t.label} style={{ fontFamily:MONO, fontSize:8, padding:'2px 7px', border:`1px solid ${t.color}44`, color:t.color, background:t.color+'11', letterSpacing:'.06em' }}>
              {t.label}
            </span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid #1f2937', marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ fontFamily:MONO, fontSize:10, fontWeight:700, padding:'10px 20px', border:'none', cursor:'pointer',
              borderBottom: tab === t.id ? '2px solid #C8922A' : '2px solid transparent',
              background:'transparent', color: tab === t.id ? '#C8922A' : '#4B5563',
              letterSpacing:'.08em', marginBottom:-1,
            }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'rules'  && <StateRulesTab adminKey={adminKey} />}
      {tab === 'tester' && <DealTesterTab />}
      {tab === 'audit'  && <DealAuditTab adminKey={adminKey} />}
    </div>
  )
}
