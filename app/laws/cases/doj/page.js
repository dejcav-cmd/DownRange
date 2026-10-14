import CasesShell from '../../../../components/cases/CasesShell'
import { Row, Section, Empty } from '../../../../components/cases/parts'
import { fetchRadarItems, ofKind, sortRecent } from '../../../../sanity/lib/legalCases'

export const revalidate = 900
export const metadata = {
  title: 'DOJ Second Amendment Actions: Lawsuits and Investigations',
  description: 'Justice Department lawsuits, warning letters and investigations tied to state and local gun laws.',
  alternates: { canonical: 'https://www.downrangeco.com/laws/cases/doj' },
}

export default async function Page() {
  const rows = sortRecent(ofKind(await fetchRadarItems(), 'doj'))
  return (
    <CasesShell active="/laws/cases/doj" eyebrow="Department of Justice"
      title={<>DOJ <span>actions</span></>}
      sub="Suits and letters from the Justice Department aimed at state and local gun restrictions.">
      <Section title="Actions">
        {rows.length ? rows.map(i => <Row key={i._id} item={i} />) : <Empty>No DOJ actions tracked yet.</Empty>}
      </Section>
    </CasesShell>
  )
}
