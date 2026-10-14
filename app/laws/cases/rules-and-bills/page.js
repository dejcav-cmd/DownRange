import Link from 'next/link'
import CasesShell from '../../../../components/cases/CasesShell'
import { Row, Section, Empty } from '../../../../components/cases/parts'
import { fetchRadarItems, ofKind, sortRecent } from '../../../../sanity/lib/legalCases'

export const revalidate = 900
export const metadata = {
  title: 'Federal Gun Rules and Bills Tracker',
  description: 'ATF and Federal Register actions plus firearm bills moving in Congress.',
  alternates: { canonical: 'https://www.downrangeco.com/laws/cases/rules-and-bills' },
}

export default async function Page() {
  const items = await fetchRadarItems()
  const rules = sortRecent(ofKind(items, 'rule'))
  const bills = sortRecent(ofKind(items, 'bill')).slice(0, 30)
  return (
    <CasesShell active="/laws/cases/rules-and-bills" eyebrow="Rules and bills"
      title={<>Federal rules and <span>bills</span></>}
      sub="What ATF has changed and which firearm bills are moving in the 119th Congress.">
      <Section title="Rules and notices">
        {rules.length ? rules.map(i => <Row key={i._id} item={i} />) : <Empty>No rules tracked yet.</Empty>}
      </Section>
      <Section title="Bills in Congress" href="/laws/federal" linkText="Full federal tracker">
        {bills.length ? bills.map(i => <Row key={i._id} item={i} />) : <Empty>Bills load after the first Monday sweep. See the <Link href="/laws/federal">federal tracker</Link> meanwhile.</Empty>}
      </Section>
    </CasesShell>
  )
}
