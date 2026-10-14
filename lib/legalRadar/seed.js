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
    summary: 'Cert granted Jun 30, 2026. Challenge to the Cook County assault weapons ordinance. Argument is set for Dec 2, 2026; a decision usually comes by the end of the term.',
    events: [{ date: '2026-06-30', label: 'Certiorari granted' }, { date: '2026-12-02', label: 'Oral argument' }, { date: '2027-06-30', label: 'Decision usually by end of term' }],
  }),
  scotus('Grant v. Higgins', '25-566', {
    states: ['CT'], circuit: '2', topic: 'assault-weapons', stage: 'granted', stageLabel: 'Granted, argument Dec 2', nextDate: '2026-12-02', nextLabel: 'Oral argument', lastDate: '2026-06-30',
    summary: 'Cert granted Jun 30, 2026. Challenge to Connecticut\'s ban on AR-15-style rifles, from the Second Circuit. Will be argued together with Viramontes in one hour on Dec 2, 2026.',
    events: [{ date: '2026-06-30', label: 'Certiorari granted' }, { date: '2026-12-02', label: 'Oral argument (with Viramontes)' }],
  }),
  scotus('Beckwith v. Frey', '26-258', {
    states: ['ME'], circuit: '1', topic: 'waiting-period', stage: 'petition', stageLabel: 'Conference Oct 16',
    nextDate: '2026-10-16', nextLabel: 'Conference',
    summary: 'Petition from the First Circuit on Maine\'s 72-hour waiting period for firearm purchases. Maine waived its response on Sep 24. Set for the Oct 16 conference.',
    events: [{ date: '2026-10-16', label: 'Conference' }],
  }),
  scotus('Landrum v. United States', '25-7530', {
    circuit: '5', states: ['MS'], topic: 'prohibited', stage: 'petition', stageLabel: 'Conference Oct 16',
    nextDate: '2026-10-16', nextLabel: 'Conference',
    summary: 'Fifth Circuit petition challenging the federal felon-in-possession law, 18 U.S.C. 922(g)(1), from the Southern District of Mississippi. The Fifth Circuit affirmed on Mar 5, 2026. The Solicitor General filed a response on Sep 14. Set for the Oct 16 conference.',
    events: [{ date: '2026-10-16', label: 'Conference' }],
  }),
  scotus('Duncan v. Bonta', '25-198', {
    states: ['CA'], circuit: '9', topic: 'magazines', stage: 'petition', stageLabel: 'Pending, no order',
    nextLabel: 'No order; last distributed for the Jun 29 conference',
    summary: 'California\'s limit on magazines holding more than 10 rounds. The petition, filed Aug 15, 2025, was last distributed for the Jun 29, 2026 conference. The docket shows no later conference, hold or order. Supplemental briefs were filed through Aug 2026, after the Third Circuit struck New Jersey\'s magazine ban en banc on Jul 17, 2026.',
    events: [{ date: '2026-06-29', label: 'Last distributed for conference' }],
  }),
  scotus("Gator's Custom Guns v. Washington", '25-153', {
    states: ['WA'], circuit: null, topic: 'magazines', stage: 'petition', stageLabel: 'Pending, no order',
    nextLabel: 'No order; last distributed for the Jun 29 conference',
    summary: 'Washington\'s ban on manufacturing, importing, distributing and selling magazines over 10 rounds, upheld by the Washington Supreme Court on May 8, 2025. The petition was last distributed for the Jun 29, 2026 conference; the docket shows no later conference or order.',
    events: [{ date: '2026-06-29', label: 'Last distributed for conference' }],
  }),
  scotus('NAGR v. Lamont', '25-421', {
    states: ['CT'], circuit: '2', topic: 'assault-weapons', stage: 'petition', stageLabel: 'Pending, no order',
    nextLabel: 'No order; last distributed for the Jun 29 conference',
    summary: 'Challenge to Connecticut\'s assault weapons law and its limit on magazines over 10 rounds, from a Second Circuit decision of Aug 22, 2025 affirming denial of a preliminary injunction. Last distributed for the Jun 29, 2026 conference; the docket shows no later conference or order.',
    events: [{ date: '2026-06-29', label: 'Last distributed for conference' }],
  }),
  scotus('Novotny v. Moore', '25-1324', {
    states: ['MD'], circuit: '4', topic: 'sensitive-places', stage: 'petition', stageLabel: 'Conference Oct 16',
    nextDate: '2026-10-16', nextLabel: 'Conference',
    summary: 'Fourth Circuit petition challenging Maryland\'s restrictions on carrying in many public places. The Fourth Circuit ruled Jan 20, 2026. The Sep 28 and Oct 9 conferences were rescheduled; the petition is now set for the Oct 16 conference.',
    events: [{ date: '2026-10-16', label: 'Conference' }],
  }),
  scotus('Christian v. James', '26-374', { states: ['NY'], circuit: '2', topic: 'sensitive-places', stage: 'petition', stageLabel: 'Petition pending', summary: 'Petition challenging New York\'s ban on carrying firearms in public parks (Second Circuit, decided May 18, 2026). Filed Sep 16. New York\'s response is due Dec 3, so no conference is scheduled.' }),
  scotus('Calce v. City of New York', '26-46', { states: ['NY'], circuit: '2', stage: 'petition', stageLabel: 'Response requested', summary: 'Petition challenging New York City\'s ban on stun guns and other electronic arms (Second Circuit, Apr 13, 2026). The Court requested a response on Sep 8; it is due Nov 23. No conference is scheduled.' }),
  scotus('Bynes v. Florida', '25-7465', { states: ['FL'], circuit: null, topic: 'prohibited', stage: 'petition', stageLabel: 'Petition pending', summary: 'Florida state-court petition challenging the lifetime firearm and ammunition ban for convicted felons (Fourth DCA, Jan 8, 2026). Distributed for the Sep 28 conference; no order has issued.' }),
  scotus('Colie v. Virginia', '26-321', { states: ['VA'], circuit: null, stage: 'petition', stageLabel: 'Petition pending', needsReview: true, summary: 'Virginia state-court petition. The question is reported as a due-process self-defense jury issue, not a challenge to a gun law. Pending; the response was due Oct 13.' }),
  scotus('Salas-Martinez v. Texas', '26-5146', {
    states: ['TX'], circuit: null, topic: 'age', status: 'denied', stage: 'denied', stageLabel: 'Cert denied Oct 5', outcome: 'Cert denied', lastDate: '2026-10-05',
    summary: 'Petition asking whether Bruen invalidated Texas Penal Code 46.02 as applied to 18-to-20-year-olds, arising from a murder conviction with a self-defense instruction. Denied Oct 5, 2026.', events: [{ date: '2026-10-05', label: 'Certiorari denied' }],
  }),
  scotus('United States v. Hemani', '24-1234', {
    topic: 'prohibited', status: 'decided', stage: 'decided', stageLabel: 'Decided Jun 18, 2026, 9-0', outcome: 'Judgment unanimous (9-0) for Hemani; Justice Gorsuch wrote for a seven-justice majority', lastDate: '2026-06-18',
    summary: 'Challenge to the federal prohibition on firearm possession by unlawful drug users (18 U.S.C. 922(g)(3)). All nine justices agreed Hemani should win; Justice Gorsuch wrote the opinion for seven.',
    events: [{ date: '2026-06-18', label: 'Decided 9-0' }],
  }),
  scotus('Wolford v. Lopez', '24-1046', {
    states: ['HI'], circuit: '9', topic: 'sensitive-places', status: 'decided', stage: 'decided', stageLabel: 'Decided Jun 25, 2026, 6-3', outcome: '6-3, Hawaii law struck down, Justice Alito', lastDate: '2026-06-25',
    summary: 'Hawaii\'s default rule on carry onto private property open to the public. Decided 6-3 striking down the provision, opinion by Justice Alito.',
    events: [{ date: '2026-06-25', label: 'Decided 6-3' }],
  }),
  // DOJ actions
  mk({ kind: 'doj', court: 'district', slug: 'doj-v-district-of-columbia-registration', title: 'DOJ v. District of Columbia (semi-automatic registration)', states: ['DC'], circuit: 'DC', topic: 'assault-weapons', stage: 'filed', stageLabel: 'Suit filed Dec 22, 2025; D.C. moved to dismiss Jun 25, 2026',
    lastDate: '2026-06-25', summary: 'The Justice Department sued D.C. in federal court in Washington, saying the District refuses to register AR-15-style rifles and other semi-automatic firearms and arrests or fines people for possessing them unregistered. DOJ says that violates the Second Amendment. An amended complaint also challenges D.C.\'s silencer ban. D.C. has asked the court to dismiss the case.', events: [{ date: '2025-12-22', label: 'Complaint filed' }, { date: '2026-06-25', label: 'D.C. moved to dismiss' }] }),
  mk({ kind: 'doj', court: 'district', title: 'DOJ v. Denver', states: ['CO'], circuit: '10', stage: 'filed', stageLabel: 'Suit filed May 5, 2026',
    topic: 'assault-weapons', lastDate: '2026-05-05', summary: 'The Justice Department sued the city of Denver in federal court in Colorado over its 1989 assault weapons ban, which covers AR-15-style rifles and other firearms. DOJ asks the court to stop Denver from enforcing it. Denver has moved to dismiss.', events: [{ date: '2026-05-05', label: 'Complaint filed' }] }),
  mk({ kind: 'doj', court: 'district', title: 'DOJ v. Colorado (15-round magazine limit)', states: ['CO'], circuit: '10', topic: 'magazines', stage: 'filed', stageLabel: 'Suit filed May 6, 2026',
    lastDate: '2026-05-06', summary: 'The Justice Department sued the State of Colorado in federal court in Colorado over its ban on magazines holding more than 15 rounds. DOJ says the magazines are in common use and protected by the Second Amendment.', events: [{ date: '2026-05-06', label: 'Complaint filed' }] }),
  mk({ kind: 'doj', court: 'district', slug: 'doj-warning-letter-to-minnesota', title: 'DOJ v. Minnesota (permit-to-purchase and waiting period)', states: ['MN'], circuit: '8', topic: 'waiting-period', stage: 'filed', stageLabel: 'Suit filed Sep 24, 2026',
    lastDate: '2026-09-24',
    summary: 'DOJ sent a warning letter on Sep 17, 2026 and sued on Sep 24 in the U.S. District Court for the District of Minnesota. The defendants are the State of Minnesota, Minneapolis and St. Paul. DOJ says the permit-to-purchase requirement and the 30-day transfer waiting period for handguns and semi-automatic military-style rifles violate the Second Amendment. It asks for a declaratory judgment and a permanent injunction.',
    events: [{ date: '2026-09-17', label: 'Warning letter sent' }, { date: '2026-09-23', label: 'Response deadline' }, { date: '2026-09-24', label: 'Complaint filed' }] }),
  // Federal rules
  mk({ kind: 'rule', court: 'agency', slug: 'nfa-tax-set-to-0-for-suppressors-sbrs-sbss-aows', title: 'NFA making and transfer tax set to $0 for suppressors, short-barreled rifles and shotguns, and AOWs', topic: 'nfa', status: 'decided', stage: 'decided', stageLabel: 'Effective Jan 1, 2026', lastDate: '2026-01-01',
    summary: 'A law passed in 2025 (H.R. 1, P.L. 119-21) cut the federal making and transfer tax on suppressors, short-barreled rifles, short-barreled shotguns and "any other weapons" to $0 for items made or transferred starting Jan 1, 2026. These items are still regulated under the National Firearms Act. Buyers must still register the item and get ATF approval first, and possessing an unregistered one is still a federal crime. Machine guns and destructive devices still carry the $200 tax. Some states ban these items outright. Lawsuits challenging the registration requirement are pending.', events: [{ date: '2026-01-01', label: 'Effective' }] }),
  mk({ kind: 'rule', court: 'agency', slug: 'pistol-brace-rule-rescinded', title: 'Pistol brace rule vacated; formal repeal proposed', topic: 'nfa', status: 'decided', stage: 'decided', stageLabel: 'Vacated June 2024; repeal proposed May 2026', lastDate: '2026-05-06',
    summary: 'A federal court in Texas vacated ATF\'s 2023 pistol brace rule on June 13, 2024. The Justice Department dropped its appeal on July 17, 2025. On May 6, 2026, ATF proposed deleting the rule\'s text from the regulations. The proposal was not final as of Oct 14, 2026. A braced pistol can still count as a short-barreled rifle if it otherwise meets the statutory definition, and state laws still apply.',
    events: [{ date: '2024-06-13', label: 'Rule vacated by N.D. Tex.' }, { date: '2025-07-17', label: 'DOJ dropped its appeal' }, { date: '2026-05-06', label: 'ATF proposed removing the rule text' }] }),
  mk({ kind: 'rule', court: 'agency', slug: 'forced-reset-triggers-doj-settlement', title: 'Forced reset triggers: DOJ settlement', topic: 'nfa', status: 'decided', stage: 'decided', stageLabel: 'Settled May 2025', lastDate: '2025-05-16',
    summary: 'On May 16, 2025, DOJ announced settlements of several lawsuits over forced reset triggers, including the Rare Breed Triggers cases. Under the deal, the government stopped treating the covered triggers as machine guns, and Rare Breed agreed not to develop or design them for use in any pistol. The settlement does not cover other manufacturers\' triggers or state laws, and several states restrict them.', events: [{ date: '2025-05-16', label: 'Settlement announced' }] }),
]

export const SEED = RAW.map(i => ({ ...i, ...(ENRICH[i.slug] || {}) }))
