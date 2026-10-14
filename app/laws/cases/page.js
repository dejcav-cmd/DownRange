import Link from 'next/link'
import CasesShell from '../../../components/cases/CasesShell'
import { Row, Section, Stats, Empty } from '../../../components/cases/parts'
import { fetchRadarItems, sortRecent, sortUpcoming, summarize, ofKind } from '../../../sanity/lib/legalCases'
import { pageMeta, crumbs, dataset } from '../../../lib/legalRadar/seo'
import { lastActivity } from '../../../lib/legalRadar/dates'
import { STATE_CODES } from '../../../lib/legalRadar/constants'

export const revalidate = 900
export const metadata = pageMeta({
  title: 'Second Amendment Cases Radar: Supreme Court, Circuits, DOJ and States',
  description: 'National tracker for Second Amendment litigation. Supreme Court timelines, circuit cases, DOJ actions, federal rules and a page for every state.',
  path: '/laws/cases',
})

export default async function Page() {
  const items = await fetchRadarItems()
  const stats = summarize(items)
  const upcoming = sortUpcoming(items).slice(0, 5)
  const recent = sortRecent(items).slice(0, 6)
  const hot = new Set(items.flatMap(i => i.states || []))
  return (
    <CasesShell active="/laws/cases" eyebrow="Legal radar"
      jsonLd={[crumbs([['Home', '/'], ['Laws', '/laws'], ['2A Cases Radar', '/laws/cases']]), dataset({ name: 'Second Amendment cases radar', description: 'Tracked Second Amendment cases, DOJ actions and federal rules with status and timelines.', path: '/laws/cases', modified: items.map(lastActivity).filter(Boolean).sort().pop() })]}
      title={<>2A cases <span>radar</span></>}
      sub="Every Second Amendment case, filing and federal action we track, from the Supreme Court down to your state.">
      <Stats s={stats} />
      <Section title="Coming up next" href="/laws/cases/supreme-court" linkText="Supreme Court timelines">
        {upcoming.length ? upcoming.map(i => <Row key={i._id} item={i} showDate="next" />) : <Empty>No dated events on the calendar right now.</Empty>}
      </Section>
      <Section title="Latest movement">
        {recent.map(i => <Row key={i._id} item={i} />)}
      </Section>
      <Section title="Find your state">
        <div className="cx-tiles">
          {STATE_CODES.map(c => <Link key={c} href={`/laws/cases/states/${c}`} className={`cx-tile ${hot.has(c) ? 'hot' : ''}`}>{c}</Link>)}
        </div>
      </Section>
    </CasesShell>
  )
}
