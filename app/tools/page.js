import Link from 'next/link'
import ToolShell from '../../components/tools/ToolShell'

const URL_PATH = '/tools'
export const metadata = {
  title: 'Firearms Tools: Ballistics, Scope, Ammo Cost, NFA, FFL and More',
  description: 'Free tools for shooters: a precision ballistics calculator with 188 bullets, scope and mil tools, an ammo cost calculator, NFA wait times, an FFL finder, a range finder and carry insurance comparison.',
  alternates: { canonical: 'https://www.downrangeco.com' + URL_PATH },
}

const TOOLS = [
  ['/ballistics', 'Precision Calculator', 'New', '188 match and hunting bullets from Hornady, Berger, Nosler, Lapua and Warner. G1 and G7 drag, wind, slope and altitude. Print a DOPE card.'],
  ['/tools/scope-tools', 'Scope & Mil Tools', 'New', 'Convert MOA, MRAD and inches. Range a target from mils. Correct for slope angle. Work out turret clicks.'],
  ['/tools/ammo-cost', 'Ammo Cost Calculator', 'New', 'Cost per round, per range trip and per year. Compare factory ammo with reloading and see your break-even.'],
  ['/nfa-tracker', 'NFA Wait Times', '', 'Live approval times for suppressors, SBRs and other NFA items.'],
  ['/ffl-finder', 'FFL Finder', '', 'Find a licensed dealer near you for transfers.'],
  ['/ranges', 'Range Finder', '', 'Find shooting ranges near you.'],
  ['/carry-insurance', 'Carry Insurance', '', 'Compare concealed carry insurance and legal defense plans.'],
  ['/laws/my-state', 'My State Laws', '', 'Carry, magazine and transport rules for your state.'],
  ['/laws/states', 'State Law Map', '', 'Compare gun laws across all 50 states.'],
]

export default function ToolsHub() {
  return (
    <ToolShell path={URL_PATH} name="DownRange Tools" headline="Tools for" accent="shooters" intro="Free calculators and finders built for people who shoot, hunt and carry. No sign-up." description="Free ballistics, scope, ammo cost and firearms tools.">
      <div className="tl-links">
        {TOOLS.map(([h, t, tag, d]) => (
          <Link key={h} href={h} className="tl-link">
            {tag ? <i>{tag}</i> : null}
            <h3>{t}</h3>
            <p>{d}</p>
          </Link>
        ))}
      </div>
    </ToolShell>
  )
}
