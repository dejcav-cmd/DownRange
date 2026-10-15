// Single source of truth for the top navigation. Masthead renders it and Admin > Nav Visibility lists it,
// so the two can never drift apart.
export const navKey = (l) => String(l || '').replace(/^[^A-Za-z0-9]+/, '').trim().toLowerCase()

export const NAV = [
  { label: '🏠 Home', href: '/', exact: true },
  {
    label: '📰 News', href: '/news',
    children: [
      { label: '📰 Latest News',                   href: '/news',                          desc: 'Breaking stories and daily coverage' },
      { label: '🏭 Manufacturer Press Releases',   href: '/news/manufacturer-press-releases', desc: 'New announcements straight from the makers' },
    ]
  },
  { label: '💰 Deals', href: '/deals' },
  {
    label: '📜 Laws', href: '/laws',
    children: [
      { label: '🗺️ My State',          href: '/laws/my-state', desc: 'Your state\'s carry laws, restrictions & reciprocity' },
      { label: '⚖️ 2A Cases Radar',    href: '/laws/cases',    desc: 'Supreme Court, circuits, DOJ and state-by-state litigation' },
      { label: '🏛️ Federal & SCOTUS',  href: '/laws/federal',  desc: 'Bills in Congress, ATF rules, active SCOTUS cases' },
      { label: '📋 All 50 States',     href: '/laws/states',   desc: 'Compare gun laws across every state' },
      { label: '🔄 CCW Reciprocity',   href: '/laws/reciprocity', desc: 'Where your permit is honored' },
      { label: '⚖️ NFA Rules',         href: '/laws/federal#nfa',          desc: 'Suppressors, SBRs, machine guns' },
    ]
  },
  {
    label: '⚖️ 2A Radar', href: '/laws/cases',
    children: [
      { label: '📡 Overview',        href: '/laws/cases',                    desc: 'What is moving in 2A litigation right now' },
      { label: '🏛️ Supreme Court',   href: '/laws/cases/supreme-court',      desc: 'Granted cases, conferences and timelines' },
      { label: '🗺️ Circuits',        href: '/laws/cases/circuits',           desc: 'Appeals-court cases by circuit' },
      { label: '🛡️ DOJ Actions',     href: '/laws/cases/doj',                desc: 'Justice Department suits and letters' },
      { label: '📖 How Courts Decide', href: '/laws/cases/how-courts-decide', desc: 'Heller, Bruen and the 2A tests in plain English' },
      { label: '📋 Rules & Bills',   href: '/laws/cases/rules-and-bills',    desc: 'ATF rules and bills in Congress' },
    ]
  },
  {
    label: '🎯 Tools', href: '/tools',
    children: [
      { label: '🎯 Precision Calculator',  href: '/ballistics',            desc: '188 match and hunting bullets, G1/G7, wind, DOPE card' },
      { label: '🔭 Scope & Mil Tools',     href: '/tools/scope-tools',     desc: 'MOA/MRAD, range from mils, slope angle, clicks' },
      { label: '💵 Ammo Cost Calculator',  href: '/tools/ammo-cost',       desc: 'Cost per round, per year, factory vs reloading' },
      { label: '⏱️ NFA Wait Times',        href: '/nfa-tracker',           desc: 'Live Form 4 approval times' },
      { label: '📍 FFL Finder',            href: '/ffl-finder',            desc: 'Transfer dealers near you' },
      { label: '🏟️ Range Finder',          href: '/ranges',                desc: 'Shooting ranges near you' },
      { label: '🛡️ Carry Insurance',       href: '/carry-insurance',       desc: 'Compare concealed carry coverage' },
      { label: '🗺️ My State Laws',         href: '/laws/my-state',         desc: 'Carry, magazine and transport rules for your state' },
      { label: 'All tools →',              href: '/tools',                 desc: 'Every DownRange tool in one place' },
    ]
  },
  { label: '📖 Blog', href: '/blog' },
  { label: '📺 Videos',    href: '/video'     },
  { label: '🏆 Giveaways', href: '/giveaways' },
  { label: '🔩 Ferrum Arms ↗', href: 'https://ferrumarms.com', external: true },
]
