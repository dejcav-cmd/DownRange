import { sortUpcoming } from '../../sanity/lib/legalCases'
import { lastActivity, agoLabel, inLabel } from '../../lib/legalRadar/dates'
import { STATES, circuitLabel } from '../../lib/legalRadar/constants'
import { Card, Section } from './HomeSections'

// Home 2A Radar: same card rail as Press Releases and Blog Articles.
// Photo is the site's own /laws hero (a case can carry its own `image` later); no SVG, no placeholder art.
const HERO = '/img/laws-hero.jpg'
const POS = ['12% 55%', '30% 50%', '58% 55%', '72% 45%', '88% 50%', '45% 30%']
const KIND = { case: 'Supreme Court', doj: 'DOJ', rule: 'Federal rule', bill: 'Bill' }

export default function RadarSection({ items }) {
  const all = (items || []).filter(i => i.kind === 'case' || i.kind === 'doj')
  if (!all.length) return null
  const next = sortUpcoming(all)[0]
  const recent = all
    .map(i => ({ ...i, act: lastActivity(i) }))
    .filter(i => i.act)
    .sort((a, b) => b.act.localeCompare(a.act))
    .slice(0, 10)
  if (next && !recent.some(i => i._id === next._id)) recent.splice(9, 1, { ...next, act: lastActivity(next) })
  const where = (i) => (i.states || []).slice(0, 2).map(s => STATES[s]).join(', ') || (i.circuit ? circuitLabel(i.circuit) : 'Federal')

  return (
    <Section id="hr-radar" title="2A" accent="Radar" sub="Second Amendment cases moving now, with days since each last update" allHref="/laws/cases" allLabel="Open the radar">
      {recent.map((i, n) => (
        <Card key={i._id} href={'/laws/cases/' + i.slug} img={i.image || HERO} pos={POS[n % POS.length]} alt=""
          tag={KIND[i.kind] || 'Case'} title={i.title}
          summary={(i.stageLabel || i.stage || '') + ' · ' + where(i)}
          left={agoLabel(i.act)} right={i.nextDate && i.nextDate >= new Date().toISOString().slice(0, 10) ? 'Next ' + inLabel(i.nextDate) : ''} />
      ))}
    </Section>
  )
}
