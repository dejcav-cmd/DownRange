import '../../styles/cases.css'
import Link from 'next/link'
import Masthead from '../layout/Masthead'
import PageHero from '../home/PageHero'
import Footer from '../layout/Footer'
import { STATE_CODES } from '../../lib/legalRadar/constants'

const NAV = [
  ['/laws/cases', 'Overview'],
  ['/laws/cases/supreme-court', 'Supreme Court'],
  ['/laws/cases/circuits', 'Circuits'],
  ['/laws/cases/doj', 'DOJ'],
  ['/laws/cases/rules-and-bills', 'Rules and bills'],
]

// Every portal page renders through this shell, so the hero (same component, image,
// dimensions and CSS as the rest of /laws) and the sub menu never drift apart.
export default function CasesShell({ active, eyebrow, title, sub, children }) {
  return (
    <>
      <Masthead />
      <PageHero img="/img/laws-hero.jpg" imgSm="/img/laws-hero-sm.jpg" pos="58% 55%" posSm="82% 50%"
        eyebrow={eyebrow} title={title} sub={sub} />
      <nav className="cx-nav" aria-label="Cases portal">
        <div className="container cx-nav-in">
          {NAV.map(([href, label]) => <Link key={href} href={href} className={active === href ? 'on' : ''}>{label}</Link>)}
          <details style={{ marginLeft: 'auto' }}>
            <summary>By state</summary>
            <div className="cx-pop">
              {STATE_CODES.map(c => <Link key={c} href={`/laws/cases/states/${c}`}>{c}</Link>)}
            </div>
          </details>
        </div>
      </nav>
      <main className="cx-wrap"><div className="container">{children}
        <p className="cx-foot">Tracked from court dockets, the Federal Register, DOJ releases and Congress.gov, refreshed daily with a full sweep on Mondays. Informational only, not legal advice. Items marked Unverified are awaiting review.</p>
      </div></main>
      <Footer />
    </>
  )
}
