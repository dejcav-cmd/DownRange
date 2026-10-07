import ToolShell from '../../../components/tools/ToolShell'
import AmmoCost from './AmmoCost'

export const metadata = {
  title: 'Ammo Cost Calculator: Cost per Round, Per Year and Reloading Savings',
  description: 'Free ammo cost calculator. Work out cost per round, cost per range trip and per year, and compare factory ammo with reloading including your break-even point.',
  alternates: { canonical: 'https://www.downrangeco.com/tools/ammo-cost' },
}

export default function Page() {
  return (
    <ToolShell path="/tools/ammo-cost" name="Ammo Cost Calculator" headline="Ammo cost" accent="calculator" intro="Know what every trigger pull costs. Compare factory ammo to reloading and see when the press pays for itself." description="Free calculator for cost per round, annual shooting cost, and reloading versus factory ammo savings.">
      <AmmoCost />
    </ToolShell>
  )
}
