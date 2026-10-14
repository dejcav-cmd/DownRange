import Link from 'next/link'
import CasesShell from '../../../../components/cases/CasesShell'
import { pageMeta, crumbs, faq } from '../../../../lib/legalRadar/seo'
import { GLOSSARY } from '../../../../lib/legalRadar/constants'

export const revalidate = 86400
export const metadata = pageMeta({
  title: 'How Courts Decide Second Amendment Cases: A Plain-English Guide',
  description: 'Heller, Bruen and Rahimi explained without legalese, plus how a case gets to the Supreme Court and what the terms mean.',
  path: '/laws/cases/how-courts-decide',
})

const STEPS = [
  ['Someone sues', 'A gun owner or group challenges a law in federal district court.'],
  ['The trial court rules', 'The judge decides whether the law violates the Second Amendment, sometimes blocking it while the case goes on.'],
  ['The circuit court hears the appeal', 'A three-judge panel reviews it. Losing parties can ask for the whole circuit to rehear it (en banc).'],
  ['A petition goes to the Supreme Court', 'The losing side asks the justices to take the case. It is called a petition for certiorari.'],
  ['Conference', 'The justices vote privately. Four votes are enough to take a case. A petition can be granted, denied, held for another case, or relisted.'],
  ['Briefs and argument', 'If granted, both sides file written briefs and argue for about an hour. Outside groups file friend-of-the-court briefs.'],
  ['The opinion', 'The Court issues its decision, almost always by the end of June. It then controls every court in the country.'],
]

export default function Page() {
  return (
    <CasesShell active="/laws/cases/how-courts-decide" eyebrow="Guide"
      jsonLd={[crumbs([['Home', '/'], ['2A Cases Radar', '/laws/cases'], ['How courts decide', '/laws/cases/how-courts-decide']]), faq(['heller', 'bruen', 'rahimi', 'cert', 'circuit', 'split', 'enbanc'].map(k => [`What is ${GLOSSARY[k][0].replace(/\s*\(.*\)/, '')}?`, GLOSSARY[k][1]]))]}
      title={<>How courts decide <span>2A cases</span></>}
      sub="Three Supreme Court rulings and one test explain almost every case on this radar.">
      <div className="cx-block"><h2>The three rulings that matter</h2>
        <dl className="cx-terms">
          {['heller', 'bruen', 'rahimi'].map(k => <div key={k}><dt>{GLOSSARY[k][0]}</dt><dd>{GLOSSARY[k][1]}</dd></div>)}
        </dl>
      </div>

      <div className="cx-plain">
        <h2>The test, in plain English</h2>
        <div className="tag">What judges ask after Bruen</div>
        <p style={{ marginBottom: 12 }}><b>1. Does the Second Amendment cover what you were doing?</b> Carrying a handgun, owning a rifle and buying a magazine are the sort of conduct the text covers. If not, the law is fine.</p>
        <p style={{ marginBottom: 12 }}><b>2. If it does, can the government show the law fits our history?</b> The government has to point to older laws that are a fair match for the modern one in why they were passed and how much they burden the right. A close match is not required, but a loose one is not enough either.</p>
        <p><b>3. Cost and benefit does not count.</b> Before Bruen, courts weighed a law's public-safety benefit against its burden. The Court threw that out. A law that seems sensible can still fail if history does not support it.</p>
      </div>

      <div className="cx-block"><h2>How a case reaches the Supreme Court</h2>
        <div className="cx-tl">
          {STEPS.map(([t, d]) => <div key={t} className="cx-tl-i done"><div className="cx-title" style={{ fontSize: 18 }}>{t}</div><div className="cx-sum">{d}</div></div>)}
        </div>
      </div>

      <div className="cx-block"><h2>Terms you will see on this site</h2>
        <dl className="cx-terms">
          {['cert', 'conference', 'relist', 'hold', 'circuit', 'split', 'enbanc', 'facial', 'injunction', 'common_use'].map(k => <div key={k}><dt>{GLOSSARY[k][0]}</dt><dd>{GLOSSARY[k][1]}</dd></div>)}
        </dl>
      </div>

      <p className="cx-sum">Ready to see the cases? Start with the <Link href="/laws/cases/supreme-court" style={{ color: 'var(--gold)' }}>Supreme Court docket</Link> or find <Link href="/laws/cases" style={{ color: 'var(--gold)' }}>your state</Link>. This guide is general information, not legal advice.</p>
    </CasesShell>
  )
}
