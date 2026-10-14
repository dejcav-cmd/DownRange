import Link from 'next/link'
import { STATES, TOPICS, TOPIC_IMPACT, GLOSSARY, circuitLabel } from '../../lib/legalRadar/constants'

export const fmt = (d) => d ? new Date(d + 'T12:00:00Z').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' }) : ''

export function Badge({ item }) {
  const cls = item.status === 'decided' ? 'ok' : item.status === 'denied' ? 'no' : item.stage === 'granted' ? 'g' : ''
  return <span className={`cx-badge ${cls}`}>{item.stageLabel || item.stage}</span>
}

export function Row({ item, showDate = 'lastDate' }) {
  const meta = [item.docket, item.circuit && circuitLabel(item.circuit), (item.states || []).map(s => STATES[s]).join(', '), TOPICS[item.topic]].filter(Boolean).join('  ·  ')
  const d = showDate === 'next' ? item.nextDate : item.lastDate
  return (
    <div className="cx-row">
      <div className="cx-date">{fmt(d)}</div>
      <div>
        <h3 className="cx-title"><Link href={`/laws/cases/${item.slug}`}>{item.title}</Link></h3>
        {item.summary ? <p className="cx-sum">{item.summary}</p> : null}
        <div className="cx-meta">{meta}{item.needsReview ? '  ·  Unverified' : ''}</div>
      </div>
      <Badge item={item} />
    </div>
  )
}

export function Impact({ item }) {
  const text = item.impact || TOPIC_IMPACT[item.topic] || TOPIC_IMPACT.other
  return (
    <div className="cx-impact">
      <b>Why it matters</b>
      <p>{text}</p>
    </div>
  )
}

export const Paras = ({ text }) => String(text || '').split(/\n\s*\n/).filter(Boolean).map((t, i) => <p key={i} style={{ marginBottom: 12 }}>{t}</p>)

export function Glossary({ keys }) {
  const rows = (keys || []).map(k => GLOSSARY[k]).filter(Boolean)
  if (!rows.length) return null
  return (
    <div className="cx-block"><h2>Key terms</h2>
      <dl className="cx-terms">{rows.map(([t, d]) => <div key={t}><dt>{t}</dt><dd>{d}</dd></div>)}</dl>
    </div>
  )
}

export function Section({ title, href, linkText, children }) {
  return (
    <section>
      <div className="cx-h"><h2>{title}</h2>{href ? <Link href={href}>{linkText || 'View all'} →</Link> : null}</div>
      {children}
    </section>
  )
}

export const Empty = ({ children }) => <div className="cx-empty">{children}</div>

export function Stats({ s }) {
  return (
    <div className="cx-stats">
      {[[s.scotusActive, 'Active at SCOTUS'], [s.granted, 'Granted, awaiting ruling'], [s.decided, 'Decided'], [s.doj, 'DOJ actions']].map(([n, l]) =>
        <div className="cx-stat" key={l}><b>{n}</b><span>{l}</span></div>)}
    </div>
  )
}

export function Timeline({ item, today }) {
  const ev = [...(item.events || [])].sort((a, b) => a.date.localeCompare(b.date))
  const nextIdx = ev.findIndex(e => e.date >= today)
  return (
    <div className="cx-tl">
      {ev.map((e, i) => (
        <div key={i} className={`cx-tl-i ${e.date < today ? 'done' : i === nextIdx ? 'next' : ''}`}>
          <div className="cx-date">{fmt(e.date)}</div>
          <div className="cx-sum">{e.label}</div>
        </div>
      ))}
    </div>
  )
}
