import Link from 'next/link'
import { notFound } from 'next/navigation'
import CasesShell from '../../../../components/cases/CasesShell'
import { Badge, Impact, Row, Timeline, Section, Paras, Glossary, fmt } from '../../../../components/cases/parts'
import { fetchRadarItems } from '../../../../sanity/lib/legalCases'
import { SEED } from '../../../../lib/legalRadar/seed'
import { STATES, TOPICS, TOPIC_PLAIN, circuitLabel } from '../../../../lib/legalRadar/constants'

export const revalidate = 900
export function generateStaticParams() { return SEED.map(s => ({ slug: s.slug })) }

async function load(slug) {
  const items = await fetchRadarItems()
  return { items, item: items.find(i => i.slug === slug) }
}

export async function generateMetadata({ params }) {
  const { item } = await load(params.slug)
  if (!item) return {}
  return {
    title: `${item.title}: Status and Impact`,
    description: (item.impact || item.summary || '').slice(0, 155),
    alternates: { canonical: `https://www.downrangeco.com/laws/cases/${item.slug}` },
  }
}

const KIND = { case: 'Case', doj: 'DOJ action', rule: 'Federal rule', bill: 'Bill' }

export default async function Page({ params }) {
  const { items, item } = await load(params.slug)
  if (!item) notFound()
  const today = new Date().toISOString().slice(0, 10)
  const plain = TOPIC_PLAIN[item.topic] || TOPIC_PLAIN.other
  const related = items.filter(i => i._id !== item._id && i.topic === item.topic).slice(0, 4)
  return (
    <CasesShell active="" eyebrow={KIND[item.kind] || 'Case'}
      title={<>{item.title}</>}
      sub={item.docket ? `Docket ${item.docket}` : 'Second Amendment legal radar'}>
      <p style={{ marginBottom: 20 }}><Badge item={item} /> <span className="cx-meta">
        {[item.circuit && circuitLabel(item.circuit), TOPICS[item.topic], item.lastDate && `Updated ${fmt(item.lastDate)}`].filter(Boolean).join('  ·  ')}
        {item.needsReview ? '  ·  Unverified' : ''}
      </span></p>

      {item.summary ? <div className="cx-block"><h2>Where it stands</h2><p>{item.summary}</p></div> : null}
      {item.question ? <div className="cx-block"><h2>The legal question</h2><p>{item.question}</p></div> : null}
      {item.ruling ? <div className="cx-block"><h2>The ruling</h2><p>{item.ruling}</p></div> : null}

      <div className="cx-block"><h2>In legal terms</h2>
        <div className="cx-prose"><Paras text={item.legal || `${plain[0]}\n\n${plain[1]}`} /></div>
      </div>

      <div className="cx-plain">
        <h2>What this means, in plain English</h2>
        <div className="tag">No law degree needed</div>
        <Paras text={item.plain || `${plain[0]}\n\n${plain[1]}`} />
      </div>

      <Impact item={item} />

      {item.ifWin || item.ifLose ? (
        <div className="cx-two" style={{ marginTop: 20 }}>
          {item.ifWin ? <div className="w"><b>If the challengers win</b><p>{item.ifWin}</p></div> : null}
          {item.ifLose ? <div className="l"><b>If the challengers lose</b><p>{item.ifLose}</p></div> : null}
        </div>
      ) : null}
      {item.watch ? <p className="cx-watch">What to watch: {item.watch}</p> : null}

      {(item.events || []).length ? <div className="cx-block" style={{ marginTop: 28 }}><h2>Timeline</h2><Timeline item={item} today={today} /></div> : null}

      <Glossary keys={item.terms && item.terms.length ? item.terms : plain[2]} />

      {(item.states || []).length ? (
        <div className="cx-block"><h2>States affected</h2>
          <div className="cx-chips">{item.states.map(s => <Link key={s} href={`/laws/cases/states/${s}`}>{STATES[s]}</Link>)}</div>
        </div>
      ) : null}

      {item.url ? <p className="cx-meta"><a href={item.url} target="_blank" rel="noopener noreferrer">Official source →</a></p> : null}

      {related.length ? <Section title="Related">{related.map(i => <Row key={i._id} item={i} />)}</Section> : null}
    </CasesShell>
  )
}
