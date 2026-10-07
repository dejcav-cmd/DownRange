import Link from 'next/link'

// Type-led hero: no stock photos, no placeholder art. Numbers come from live data.
export default function HomeHero({ stats }) {
  const chips = [
    stats.newsToday != null && { n: stats.newsToday, l: 'stories today' },
    stats.dealsToday != null && { n: stats.dealsToday, l: 'new deals today' },
    stats.press != null && { n: stats.press, l: 'maker releases' },
    { n: '50', l: 'state law guides' },
  ].filter(Boolean)
  return (
    <section className="hh" aria-labelledby="hh-title">
      <div className="container hh-in">
        <div className="hh-eyebrow">America&apos;s firearms intelligence hub</div>
        <h1 className="hh-title" id="hh-title">Armed with <span>the facts.</span></h1>
        <p className="hh-sub">Breaking firearms news, the newest gun and ammo deals, and straight-from-the-maker releases. Every law checked against your state.</p>
        <div className="hh-cta">
          <Link href="/news" className="hh-btn hh-btn-main">Read the latest</Link>
          <Link href="/deals" className="hh-btn">Shop new deals</Link>
          <Link href="/second-amendment" className="hh-btn hh-btn-ghost">Why the Second Amendment matters →</Link>
        </div>
        <ul className="hh-chips">
          {chips.map(c => (<li key={c.l}><b>{c.n}</b><span>{c.l}</span></li>))}
        </ul>
      </div>
    </section>
  )
}
