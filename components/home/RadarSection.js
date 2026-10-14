import Link from 'next/link'
import { lastActivity, agoLabel, freshness, inLabel } from '../../lib/legalRadar/dates'
import { STATES, circuitLabel } from '../../lib/legalRadar/constants'

// Home page 2A Radar. Text only (no images, no placeholders): it is a status board.
export default function RadarSection({ items }) {
  const cases = (items || []).filter(i => i.kind === 'case' || i.kind === 'doj')
  if (!cases.length) return null
    const recent = cases
    .map(i => ({ ...i, act: lastActivity(i) }))
    .filter(i => i.act)
    .sort((a, b) => b.act.localeCompare(a.act))
    .slice(0, 6)
  const where = (i) => (i.states || []).slice(0, 2).map(s => STATES[s]).join(', ') || (i.circuit ? circuitLabel(i.circuit) : 'Federal')

  return (
    <section className="hx-wrap" aria-labelledby="hx-h">
      <div className="container">
        <div className="hx-head">
          <div>
            <span className="hx-eyebrow">2A Radar</span>
            <h2 id="hx-h" className="hx-title">Second Amendment <span>cases moving now</span></h2>
          </div>
          <Link href="/laws/cases" className="hx-all">Open the radar →</Link>
        </div>
        <div className="hx-grid">
          <ul className="hx-list">
            {recent.map(i => (
              <li key={i._id}>
                <Link href={`/laws/cases/${i.slug}`}>
                  <span className="hx-name">{i.title}</span>
                  <span className="hx-stage">{i.stageLabel || i.stage} · {where(i)}</span>
                  <span className={`hx-ago ${freshness(i.act)}`}>{agoLabel(i.act)}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <style>{`
        .hx-wrap{padding:36px 0;background:var(--bg);border-bottom:1px solid var(--border)}
        .hx-head{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;margin-bottom:18px;flex-wrap:wrap}
        .hx-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--gold)}
        .hx-title{font-family:'Bebas Neue',cursive;font-size:clamp(2rem,4.5vw,3rem);line-height:1;margin:4px 0 0;color:var(--text);letter-spacing:.02em}
        .hx-title span{color:var(--gold)}
        .hx-all{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--gold);text-decoration:none}
        .hx-grid{display:grid;grid-template-columns:1fr;gap:16px}
        .hx-next{display:flex;flex-direction:column;gap:4px;padding:20px;background:var(--bg2);border:1px solid var(--gold-dim);text-decoration:none}
        .hx-k{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:var(--text-dim)}
        .hx-when{font-family:'Bebas Neue',cursive;font-size:44px;line-height:1;color:var(--gold)}
        .hx-ev{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--text)}
        .hx-case{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:20px;color:var(--text);margin-top:8px}
        .hx-meta{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-muted)}
        .hx-list{list-style:none;margin:0;padding:0;border:1px solid var(--border);background:var(--bg2)}
        .hx-list li+li{border-top:1px solid var(--border)}
        .hx-list a{display:grid;grid-template-columns:1fr auto;gap:2px 12px;padding:12px 16px;text-decoration:none;min-height:44px}
        .hx-list a:hover{background:var(--bg3)}
        .hx-name{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:17px;color:var(--text)}
        .hx-stage{grid-column:1;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-muted)}
        .hx-ago{grid-column:2;grid-row:1/3;align-self:center;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--text-dim);white-space:nowrap}
        .hx-ago.fresh{color:var(--green)}.hx-ago.warm{color:var(--gold)}
        @media(max-width:760px){.hx-grid{grid-template-columns:1fr}}
      `}</style>
    </section>
  )
}
