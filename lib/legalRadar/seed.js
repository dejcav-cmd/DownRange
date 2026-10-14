// Curated baseline. Pages always render this when Sanity is empty (rule 13), and the
// cron `mode=seed` writes it with createIfNotExists so live data is never overwritten.
// Only facts confirmed against court dockets / DOJ releases belong here; anything
// unconfirmed is marked needsReview.
import { slugify, circuitOfState, classifyTopic } from './constants'
import { ENRICH } from './enrich'

const SC = 'https://www.supremecourt.gov/search.aspx?filename=/docket/docketfiles/html/public/'
const scUrl = (d) => `${SC}${d}.html`

function mk(o) {
  const slug = o.slug || slugify(o.title)
  const states = o.states || []
  return {
    _id: `lc-${slug}`, _type: 'legalCase', kind: 'case', court: 'scotus', status: 'active',
    states, circuit: o.circuit || (states[0] ? circuitOfState(states[0]) : null),
    topic: o.topic || classifyTopic(o.title + ' ' + (o.summary || '')),
    source: 'seed', slug, ...o,
  }
}
const scotus = (title, docket, o) => mk({ title, docket, url: scUrl(docket), ...o })

const RAW = [
  scotus('Viramontes v. Cook County', '25-238', {
    states: ['IL'], circuit: '7', topic: 'assault-weapons', stage: 'granted', stageLabel: 'Granted, argument Dec 2',
    nextDate: '2026-12-02', nextLabel: 'Oral argument', lastDate: '2026-06-30',
    summary: 'Cert granted Jun 30, 2026. Challenge to the Cook County assault weapons ordinance. Decision is typically issued by the end of June 2027.',
    events: [{ date: '2026-06-30', label: 'Certiorari granted' }, { date: '2026-12-02', label: 'Oral argument' }, { date: '2027-06-30', label: 'Decision expected by end of term' }],
  }),
  scotus('Grant v. Higgins', '25-566', {
    states: ['CT'], circuit: '2', topic: 'assault-weapons', stage: 'granted', stageLabel: 'Granted, argument Dec 2', nextDate: '2026-12-02', nextLabel: 'Oral argument', lastDate: '2026-06-30',
    summary: 'Cert granted Jun 30, 2026. Challenge to Connecticut\'s ban on AR-15-style rifles, from the Second Circuit. Argued together with Viramontes in one hour on Dec 2, 2026.',
    events: [{ date: '2026-06-30', label: 'Certiorari granted' }, { date: '2026-12-02', label: 'Oral argument (with Viramontes)' }],
  }),
  scotus('Beckwith v. Frey', '26-258', {
    states: ['ME'], circuit: '1', topic: 'waiting-period', stage: 'petition', stageLabel: 'Conference Oct 16',
    nextDate: '2026-10-16', nextLabel: 'Conference',
    summary: 'Petition from the First Circuit on Maine\'s waiting period law, set for the Oct 16 conference.',
    events: [{ date: '2026-10-16', label: 'Conference' }],
  }),
  scotus('Landrum v. United States', '25-7530', {
    circuit: '5', states: ['TX'], topic: 'prohibited', stage: 'petition', stageLabel: 'Conference Oct 16',
    nextDate: '2026-10-16', nextLabel: 'Conference', summary: 'Fifth Circuit petition, set for the Oct 16 conference.',
    events: [{ date: '2026-10-16', label: 'Conference' }],
  }),
  scotus('Duncan v. Bonta', '25-198', {
    states: ['CA'], circuit: '9', topic: 'magazines', stage: 'petition', stageLabel: 'Awaiting order',
    nextLabel: 'Order after Sep 28 conference', needsReview: true,
    summary: 'California\'s magazine limit. Distributed for the Sep 28 conference; no order confirmed yet.',
    events: [{ date: '2026-09-28', label: 'Distributed for conference' }],
  }),
  scotus("Gator's Custom Guns v. Washington", '25-153', {
    states: ['WA'], circuit: null, topic: 'magazines', stage: 'petition', stageLabel: 'Awaiting order',
    nextLabel: 'Order after Sep 28 conference', needsReview: true,
    summary: 'Washington magazine limit. Distributed for the Sep 28 conference; no order confirmed yet.',
    events: [{ date: '2026-09-28', label: 'Distributed for conference' }],
  }),
  scotus('NAGR v. Lamont', '25-421', {
    states: ['CT'], circuit: '2', topic: 'assault-weapons', stage: 'petition', stageLabel: 'Awaiting order',
    nextLabel: 'Order after Sep 28 conference', needsReview: true,
    summary: 'Connecticut assault weapons challenge. Distributed for the Sep 28 conference; no order confirmed yet.',
    events: [{ date: '2026-09-28', label: 'Distributed for conference' }],
  }),
  scotus('Novotny v. Moore', '25-1324', {
    states: ['MD'], circuit: '4', stage: 'petition', stageLabel: 'Conference Oct 9, order pending',
    nextLabel: 'Order after Oct 9 conference', needsReview: true,
    summary: 'Fourth Circuit petition. Conference was Oct 9; no order confirmed yet.',
    events: [{ date: '2026-10-09', label: 'Conference' }],
  }),
  scotus('Christian v. James', '26-374', { states: ['NY'], circuit: '2', stage: 'petition', stageLabel: 'Petition pending', needsReview: true, summary: 'Second Circuit petition from New York. Pending.' }),
  scotus('Calce v. City of New York', '26-46', { states: ['NY'], circuit: '2', stage: 'petition', stageLabel: 'Petition pending', needsReview: true, summary: 'Petition from New York City. Pending.' }),
  scotus('Bynes v. Florida', '25-7465', { states: ['FL'], circuit: '11', stage: 'petition', stageLabel: 'Petition pending', needsReview: true, summary: 'Petition from Florida. Pending.' }),
  scotus('Colie v. Virginia', '26-321', { states: ['VA'], circuit: '4', stage: 'petition', stageLabel: 'Petition pending', needsReview: true, summary: 'Petition from Virginia. Pending.' }),
  scotus('Salas-Martinez v. Texas', '26-5146', {
    states: ['TX'], circuit: '5', status: 'denied', stage: 'denied', stageLabel: 'Cert denied Oct 5', outcome: 'Cert denied', lastDate: '2026-10-05',
    summary: 'Petition denied in the Oct 5 order list.', events: [{ date: '2026-10-05', label: 'Certiorari denied' }],
  }),
  scotus('United States v. Hemani', '24-1234', {
    topic: 'prohibited', status: 'decided', stage: 'decided', stageLabel: 'Decided Jun 18, 2026, 9-0', outcome: '9-0 for Hemani, Justice Gorsuch', lastDate: '2026-06-18',
    summary: 'Challenge to the federal prohibition on firearm possession by unlawful drug users (18 U.S.C. 922(g)(3)). Decided 9-0 for the defendant, opinion by Justice Gorsuch.',
    events: [{ date: '2026-06-18', label: 'Decided 9-0' }],
  }),
  scotus('Wolford v. Lopez', '24-1046', {
    states: ['HI'], circuit: '9', topic: 'sensitive-places', status: 'decided', stage: 'decided', stageLabel: 'Decided Jun 25, 2026, 6-3', outcome: '6-3, Hawaii law struck down, Justice Alito', lastDate: '2026-06-25',
    summary: 'Hawaii\'s default rule on carry onto private property open to the public. Decided 6-3 striking down the provision, opinion by Justice Alito.',
    events: [{ date: '2026-06-25', label: 'Decided 6-3' }],
  }),
  // DOJ actions
  mk({ kind: 'doj', court: 'district', title: 'DOJ v. District of Columbia (registration)', states: ['DC'], circuit: 'DC', topic: 'registration', stage: 'filed', stageLabel: 'Suit filed Dec 22, 2025',
    lastDate: '2025-12-22', summary: 'Justice Department sued D.C. over its firearm registration ban.', events: [{ date: '2025-12-22', label: 'Complaint filed' }] }),
  mk({ kind: 'doj', court: 'district', title: 'DOJ v. Denver', states: ['CO'], circuit: '10', stage: 'filed', stageLabel: 'Suit filed May 5, 2026',
    lastDate: '2026-05-05', summary: 'Justice Department sued the city of Denver over its firearm restrictions.', events: [{ date: '2026-05-05', label: 'Complaint filed' }] }),
  mk({ kind: 'doj', court: 'district', title: 'DOJ v. Colorado (15-round magazine limit)', states: ['CO'], circuit: '10', topic: 'magazines', stage: 'filed', stageLabel: 'Suit filed May 2026',
    lastDate: '2026-05-01', summary: 'Justice Department sued Colorado over its 15-round magazine limit.', events: [{ date: '2026-05-01', label: 'Complaint filed (May 2026)' }] }),
  mk({ kind: 'doj', court: 'agency', title: 'DOJ warning letter to Minnesota', states: ['MN'], circuit: '8', stage: 'pending', stageLabel: 'Response was due Sep 23',
    lastDate: '2026-09-17', needsReview: true, nextLabel: 'Whether a complaint was filed is unconfirmed',
    summary: 'DOJ sent Minnesota a warning letter on Sep 17, 2026 with a Sep 23 response deadline. No complaint confirmed.',
    events: [{ date: '2026-09-17', label: 'Warning letter sent' }, { date: '2026-09-23', label: 'Response deadline' }] }),
  // Federal rules
  mk({ kind: 'rule', court: 'agency', title: 'NFA tax set to $0 for suppressors, SBRs, SBSs, AOWs', topic: 'nfa', status: 'decided', stage: 'decided', stageLabel: 'Effective Jan 1, 2026', lastDate: '2026-01-01',
    summary: 'H.R. 1 eliminated the $200 NFA tax on those items. Registration, Form 4 and ATF wait times still apply. Machine guns and destructive devices still carry the $200 stamp.', events: [{ date: '2026-01-01', label: 'Effective' }] }),
  mk({ kind: 'rule', court: 'agency', title: 'Pistol brace rule rescinded', topic: 'nfa', status: 'decided', stage: 'decided', stageLabel: 'Rescinded 2025', lastDate: '2025-06-01',
    summary: 'ATF rescinded the 2023 rule that reclassified brace-equipped pistols as short-barreled rifles.' }),
  mk({ kind: 'rule', court: 'agency', title: 'Forced reset triggers: DOJ settlement', topic: 'nfa', status: 'decided', stage: 'decided', stageLabel: 'Settled 2025', lastDate: '2025-03-15',
    summary: 'DOJ settled Rare Breed Triggers v. Garland, restoring federal legality for forced reset triggers. State laws vary.' }),
]

export const SEED = RAW.map(i => ({ ...i, ...(ENRICH[i.slug] || {}) }))
