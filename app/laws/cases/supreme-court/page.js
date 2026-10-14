import CasesShell from '../../../../components/cases/CasesShell'
import { Row, Section, Timeline, Badge, Empty, Impact, fmt } from '../../../../components/cases/parts'
import { fetchRadarItems, sortUpcoming } from '../../../../sanity/lib/legalCases'

export const revalidate = 900
export const metadata = {
  title: 'Supreme Court Second Amendment Cases: Timelines and Conference Dates',
  description: 'Every Second Amendment case at the Supreme Court with argument dates, conferences and decisions.',
  alternates: { canonical: 'https://www.downrangeco.com/laws/cases/supreme-court' },
}

export default async function Page() {
  const all = (await fetchRadarItems()).filter(i => i.kind === 'case' && i.court === 'scotus')
  const today = new Date().toISOString().slice(0, 10)
  const granted = all.filter(i => i.stage === 'granted' || i.stage === 'argued')
  const pending = sortUpcoming(all.filter(i => i.stage === 'petition')).concat(all.filter(i => i.stage === 'petition' && !i.nextDate))
  const done = all.filter(i => i.status !== 'active' || i.stage === 'decided').sort((a, b) => String(b.lastDate).localeCompare(String(a.lastDate)))
  return (
    <CasesShell active="/laws/cases/supreme-court" eyebrow="Supreme Court"
      title={<>Supreme Court <span>docket</span></>}
      sub="Cases the Court has taken, petitions waiting on a conference, and what it has already decided.">
      <Section title="Granted: on the argument calendar">
        {granted.length ? granted.map(i => (
          <div key={i._id} style={{ marginBottom: 28 }}>
            <h3 className="cx-title">{i.title} <Badge item={i} /></h3>
            <p className="cx-sum">{i.summary}</p>
            {i.question ? <p className="cx-sum" style={{ marginTop: 8 }}><b style={{ color: 'var(--text)' }}>The question: </b>{i.question}</p> : null}
            <Impact item={i} />
            <Timeline item={i} today={today} />
          </div>
        )) : <Empty>No cases are currently granted.</Empty>}
      </Section>
      <Section title="Petitions waiting">
        {pending.length ? pending.map(i => <Row key={i._id} item={i} showDate="next" />) : <Empty>No pending petitions tracked.</Empty>}
      </Section>
      <Section title="Decided and denied">
        {done.length ? done.map(i => <Row key={i._id} item={i} />) : <Empty>Nothing decided yet this term.</Empty>}
      </Section>
    </CasesShell>
  )
}
