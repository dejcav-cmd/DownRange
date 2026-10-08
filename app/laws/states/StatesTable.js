'use client'
import { useMemo, useState } from 'react'
import Link from 'next/link'

const FILTERS = [
  ['cc',   'Constitutional carry', p => p.cc],
  ['permit','Permit required',     p => !p.cc],
  ['nomag','No magazine limit',    p => !p.mag],
  ['noawb','No assault weapon ban',p => !p.awb],
  ['nowait','No waiting period',   p => p.wait === 0],
  ['norf', 'No red flag law',      p => !p.rf],
]
const COLS = [
  ['name','State'],['rating','Rating'],['cc','Carry'],['mag','Magazines'],['awb','AWB'],['wait','Wait'],['rf','Red flag'],['recip','Honors my permit'],
]
const gradeScore = g => { if (!g) return -1; const b = 'ABCDF'.indexOf(g[0]); return (4 - (b < 0 ? 4 : b)) * 3 + (g.endsWith('+') ? 1 : g.endsWith('-') ? -1 : 0) }
const gradeTone = g => !g ? 'n' : g[0] === 'A' ? 'g' : g[0] === 'B' ? 'b' : g[0] === 'C' ? 'y' : 'r'

export default function StatesTable({ rows, verified }) {
  const [q, setQ] = useState('')
  const [active, setActive] = useState([])
  const [sort, setSort] = useState({ k: 'name', dir: 1 })

  const shown = useMemo(() => {
    const preds = FILTERS.filter(f => active.includes(f[0])).map(f => f[2])
    let list = rows.filter(p => (!q || p.name.toLowerCase().includes(q.toLowerCase()) || p.abbr.toLowerCase() === q.toLowerCase()) && preds.every(f => f(p)))
    const { k, dir } = sort
    const val = p => k === 'name' ? p.name : k === 'rating' ? gradeScore(p.rating) : k === 'cc' ? +p.cc : k === 'mag' ? (p.mag || 0) : k === 'awb' ? +p.awb : k === 'wait' ? p.wait : k === 'rf' ? +p.rf : p.recip
    list = [...list].sort((a, b) => { const x = val(a), y = val(b); return (x < y ? -1 : x > y ? 1 : 0) * dir })
    return list
  }, [rows, q, active, sort])

  const toggle = k => setActive(a => a.includes(k) ? a.filter(x => x !== k) : [...a, k])
  const setSortKey = k => setSort(s => s.k === k ? { k, dir: -s.dir } : { k, dir: k === 'name' ? 1 : -1 })
  const arrow = k => sort.k === k ? (sort.dir === 1 ? ' ▲' : ' ▼') : ''

  return (
    <>
      <style>{`
        .st-bar{position:sticky;top:0;z-index:20;background:rgba(9,9,11,.94);backdrop-filter:blur(8px);border-bottom:1px solid var(--border);padding:14px 0}
        .st-search{width:100%;max-width:340px;background:var(--bg2);border:1px solid var(--border-mid);color:var(--text);font:400 14px 'IBM Plex Mono',monospace;padding:11px 14px;border-radius:4px;outline:none}
        .st-search:focus{border-color:var(--gold)}
        .st-chips{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
        .st-chip{font:600 12px 'IBM Plex Mono',monospace;color:var(--text-muted);background:var(--bg2);border:1px solid var(--border-mid);border-radius:999px;padding:7px 13px;cursor:pointer;min-height:34px}
        .st-chip:hover{border-color:var(--gold-dim);color:var(--text)}
        .st-chip[aria-pressed="true"]{background:var(--gold);border-color:var(--gold);color:#09090B}
        .st-count{font:400 11px 'IBM Plex Mono',monospace;color:var(--text-dim);margin:18px 0 10px;letter-spacing:.06em}
        .st-wrap{overflow-x:auto;border:1px solid var(--border);border-radius:6px}
        .st-table{width:100%;border-collapse:collapse;font:400 13px 'IBM Plex Mono',monospace;min-width:820px}
        .st-table th{position:sticky;top:0;background:var(--bg3);color:var(--gold);font:700 10.5px 'IBM Plex Mono',monospace;letter-spacing:.1em;text-transform:uppercase;text-align:left;padding:13px 14px;border-bottom:2px solid var(--gold);cursor:pointer;white-space:nowrap;user-select:none}
        .st-table td{padding:12px 14px;border-bottom:1px solid var(--border)}
        .st-table tbody tr:nth-child(even){background:rgba(255,255,255,.015)}
        .st-table tbody tr:hover{background:rgba(200,146,42,.07)}
        .st-name{font:700 16px 'Barlow Condensed',sans-serif;letter-spacing:.04em;color:var(--text);text-decoration:none;text-transform:uppercase}
        .st-name:hover{color:var(--gold-light)}
        .st-pill{display:inline-block;font:700 11.5px 'IBM Plex Mono',monospace;padding:3px 9px;border-radius:3px;border:1px solid transparent;white-space:nowrap}
        .st-g{color:#34D399;background:rgba(52,211,153,.1);border-color:rgba(52,211,153,.25)}
        .st-b{color:#60A5FA;background:rgba(96,165,250,.1);border-color:rgba(96,165,250,.25)}
        .st-y{color:#FBBF24;background:rgba(251,191,36,.1);border-color:rgba(251,191,36,.25)}
        .st-r{color:#F87171;background:rgba(248,113,113,.1);border-color:rgba(248,113,113,.25)}
        .st-n{color:var(--text-dim);background:transparent;border-color:var(--border-mid)}
        .st-cards{display:none}
        .st-card{display:block;background:var(--bg2);border:1px solid var(--border);border-radius:6px;padding:14px;text-decoration:none;color:inherit}
        .st-card+.st-card{margin-top:10px}
        .st-card-h{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px}
        .st-card-g{display:grid;grid-template-columns:1fr 1fr;gap:8px 12px}
        .st-card-g span{display:block;font:400 10px 'IBM Plex Mono',monospace;color:var(--text-dim);text-transform:uppercase;letter-spacing:.08em;margin-bottom:3px}
        .st-note{font:400 11px/1.7 'IBM Plex Mono',monospace;color:var(--text-dim);margin-top:22px}
        .st-note a{color:var(--gold)}
        @media(max-width:760px){.st-wrap{display:none}.st-cards{display:block}.st-search{max-width:none}}
      `}</style>

      <div className="st-bar">
        <div className="container">
          <input className="st-search" type="search" placeholder="Search a state…" value={q} onChange={e => setQ(e.target.value)} aria-label="Search a state" />
          <div className="st-chips" role="group" aria-label="Filter states">
            {FILTERS.map(([k, label]) => (
              <button key={k} type="button" className="st-chip" aria-pressed={active.includes(k)} onClick={() => toggle(k)}>{label}</button>
            ))}
            {(active.length > 0 || q) && <button type="button" className="st-chip" onClick={() => { setActive([]); setQ('') }}>Clear</button>}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBottom: 64 }}>
        <div className="st-count">{shown.length} OF {rows.length} STATES</div>

        <div className="st-wrap">
          <table className="st-table">
            <thead><tr>{COLS.map(([k, label]) => <th key={k} onClick={() => setSortKey(k)} aria-sort={sort.k === k ? (sort.dir === 1 ? 'ascending' : 'descending') : 'none'}>{label}{arrow(k)}</th>)}</tr></thead>
            <tbody>
              {shown.map(p => (
                <tr key={p.abbr}>
                  <td><Link href={`/laws/${p.abbr.toLowerCase()}`} className="st-name">{p.name}</Link></td>
                  <td><span className={`st-pill st-${gradeTone(p.rating)}`}>{p.rating || '—'}</span></td>
                  <td><span className={`st-pill ${p.cc ? 'st-g' : 'st-n'}`}>{p.cc ? 'Permitless' : 'Permit'}</span></td>
                  <td><span className={`st-pill ${p.mag ? 'st-r' : 'st-g'}`}>{p.mag ? `${p.mag} rounds` : 'No limit'}</span></td>
                  <td><span className={`st-pill ${p.awb ? 'st-r' : 'st-g'}`}>{p.awb ? p.awbLabel : 'None'}</span></td>
                  <td><span className={`st-pill ${p.wait > 0 ? 'st-y' : 'st-g'}`}>{p.wait > 0 ? `${p.wait} day${p.wait > 1 ? 's' : ''}` : 'None'}</span></td>
                  <td><span className={`st-pill ${p.rf ? 'st-r' : 'st-g'}`}>{p.rf ? 'Yes' : 'No'}</span></td>
                  <td style={{ color: 'var(--text-muted)' }}>{p.recip ? `${p.recip} states` : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="st-cards">
          {shown.map(p => (
            <Link key={p.abbr} href={`/laws/${p.abbr.toLowerCase()}`} className="st-card">
              <div className="st-card-h"><span className="st-name" style={{ fontSize: 20 }}>{p.name}</span><span className={`st-pill st-${gradeTone(p.rating)}`}>{p.rating || '—'}</span></div>
              <div className="st-card-g">
                <div><span>Carry</span><b className={`st-pill ${p.cc ? 'st-g' : 'st-n'}`}>{p.cc ? 'Permitless' : 'Permit'}</b></div>
                <div><span>Magazines</span><b className={`st-pill ${p.mag ? 'st-r' : 'st-g'}`}>{p.mag ? `${p.mag} rounds` : 'No limit'}</b></div>
                <div><span>Assault weapon ban</span><b className={`st-pill ${p.awb ? 'st-r' : 'st-g'}`}>{p.awb ? p.awbLabel : 'None'}</b></div>
                <div><span>Waiting period</span><b className={`st-pill ${p.wait > 0 ? 'st-y' : 'st-g'}`}>{p.wait > 0 ? `${p.wait} day${p.wait > 1 ? 's' : ''}` : 'None'}</b></div>
                <div><span>Red flag law</span><b className={`st-pill ${p.rf ? 'st-r' : 'st-g'}`}>{p.rf ? 'Yes' : 'No'}</b></div>
                <div><span>Honors my permit</span><b style={{ font: "400 12px 'IBM Plex Mono',monospace", color: 'var(--text-muted)' }}>{p.recip ? `${p.recip} states` : '—'}</b></div>
              </div>
            </Link>
          ))}
        </div>

        {shown.length === 0 && <p className="st-note" style={{ textAlign: 'center', marginTop: 40 }}>No states match those filters.</p>}

        <p className="st-note">
          Ratings, carry, magazine, assault weapon and red flag data come from state statutes and NRA-ILA summaries. Reciprocity comes from <a href="https://www.handgunlaw.us" rel="noopener">handgunlaw.us</a>{verified ? `, last updated ${verified}` : ''}, and is re-checked monthly. Laws change; confirm with the state before you travel or buy. For your own state, use <Link href="/laws/my-state">My State</Link>. This is information, not legal advice.
        </p>
      </div>
    </>
  )
}
