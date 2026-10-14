import Link from 'next/link'
import { notFound } from 'next/navigation'
import CasesShell from '../../../../../components/cases/CasesShell'
import { Row, Section, Empty } from '../../../../../components/cases/parts'
import { fetchRadarItems, forState, sortRecent } from '../../../../../sanity/lib/legalCases'
import { pageMeta, crumbs } from '../../../../../lib/legalRadar/seo'
import { STATES, STATE_CODES, circuitOfState, circuitLabel } from '../../../../../lib/legalRadar/constants'

export const revalidate = 900
export function generateStaticParams() { return STATE_CODES.map(state => ({ state })) }
export function generateMetadata({ params }) {
  const code = params.state.toUpperCase(), name = STATES[code]
  if (!name) return {}
  return pageMeta({
    title: `${name} Second Amendment Cases and Litigation`,
    description: `Pending Second Amendment cases, DOJ actions and circuit rulings that affect gun owners in ${name}.`,
    path: `/laws/cases/states/${code}`,
  })
}

export default async function Page({ params }) {
  const code = params.state.toUpperCase(), name = STATES[code]
  if (!name) notFound()
  const circuit = circuitOfState(code)
  const items = await fetchRadarItems()
  const here = sortRecent(forState(items, code))
  const circ = sortRecent(items.filter(i => i.circuit === circuit && !(i.states || []).includes(code) && i.kind === 'case')).slice(0, 5)
  const scotus = items.filter(i => i.court === 'scotus' && i.stage === 'granted' && !(i.states || []).includes(code))
  return (
    <CasesShell active="" jsonLd={[crumbs([['Home', '/'], ['2A Cases Radar', '/laws/cases'], [name, `/laws/cases/states/${code}`]])]} eyebrow={circuit ? circuitLabel(circuit) : 'State'}
      title={<>{name} <span>cases</span></>}
      sub={`Second Amendment litigation touching ${name}, plus rulings from its circuit that apply there.`}>
      <Section title={`Cases and actions in ${name}`}>
        {here.length ? here.map(i => <Row key={i._id} item={i} />) : <Empty>No tracked cases name {name} yet. Rulings from {circuit ? circuitLabel(circuit) : 'its circuit'} below still apply. See the <Link href={`/laws/${code}`}>{name} gun law page</Link>.</Empty>}
      </Section>
      {circ.length ? <Section title={`Elsewhere in the ${circuitLabel(circuit)}`}>{circ.map(i => <Row key={i._id} item={i} />)}</Section> : null}
      {scotus.length ? <Section title="Supreme Court cases that could reach you" href="/laws/cases/supreme-court">{scotus.map(i => <Row key={i._id} item={i} showDate="next" />)}</Section> : null}
    </CasesShell>
  )
}
