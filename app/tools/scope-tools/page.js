import ToolShell from '../../../components/tools/ToolShell'
import ScopeTools from './ScopeTools'

export const metadata = {
  title: 'Scope and Mil Tools: MOA, MRAD, Slope, Range',
  description: 'Free scope tools: convert MOA, MRAD and inches at any range, estimate distance from mils or MOA, correct for slope angle, and work out how many turret clicks to dial.',
  alternates: { canonical: 'https://www.downrangeco.com/tools/scope-tools' },
}

export default function Page() {
  return (
    <ToolShell path="/tools/scope-tools" name="Scope and Mil Tools" headline="Scope &" accent="mil tools" intro="The field math behind a good shot, done for you. Convert angles, range a target from your reticle, and correct for slope." description="Free MOA, MRAD, range estimation, slope angle and turret click calculators.">
      <ScopeTools />
    </ToolShell>
  )
}
