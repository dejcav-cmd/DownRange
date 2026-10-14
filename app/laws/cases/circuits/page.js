import Link from 'next/link'
import CasesShell from '../../../../components/cases/CasesShell'
import { Row, Section, Empty } from '../../../../components/cases/parts'
import { pageMeta, crumbs } from '../../../../lib/legalRadar/seo'
import { fetchRadarItems } from '../../../../sanity/lib/legalCases'
import { CIRCUITS, circuitLabel } from '../../../../lib/legalRadar/constants'

export const revalidate = 900
export const metadata = pageMeta({
  title: 'Second Amendment Cases by Federal Circuit',
  description: 'Second Amendment litigation sorted by federal appeals circuit, with the states each circuit covers.',
  path: '/laws/cases/circuits',
})

export default async function Page() {
  const items = (await fetchRadarItems()).filter(i => i.kind !== 'rule' && i.kind !== 'bill')
  return (
    <CasesShell active="/laws/cases/circuits" eyebrow="Circuits"
      jsonLd={[crumbs([['Home', '/'], ['2A Cases Radar', '/laws/cases'], ['Circuits', '/laws/cases/circuits']])]}
      title={<>Cases by <span>circuit</span></>}
      sub="A circuit ruling sets the law for every state it covers. Find yours.">
      {Object.entries(CIRCUITS).map(([c, states]) => {
        const rows = items.filter(i => i.circuit === c)
        return (
          <Section key={c} title={circuitLabel(c)}>
            <p className="cx-meta" style={{ marginTop: -8, marginBottom: 8 }}>
              {states.map((s, k) => <span key={s}>{k ? ', ' : ''}<Link href={`/laws/cases/states/${s}`}>{s}</Link></span>)}
            </p>
            {rows.length ? rows.map(i => <Row key={i._id} item={i} />) : <Empty>No tracked cases in this circuit.</Empty>}
          </Section>
        )
      })}
    </CasesShell>
  )
}
