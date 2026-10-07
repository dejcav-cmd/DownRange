import Link from 'next/link'
import Masthead from '../../components/layout/Masthead'
import PageHero from '../../components/home/PageHero'
import Footer from '../../components/layout/Footer'

export const revalidate = 86400

const URL = 'https://www.downrangeco.com/second-amendment'
export const metadata = {
  title: 'The Second Amendment: Text, History and Why It Matters',
  description: 'The full text of the Second Amendment, how it came to be, the Supreme Court cases that shaped it (Heller, McDonald, Bruen, Rahimi), and what rights and responsibilities it carries today.',
  alternates: { canonical: URL },
  openGraph: {
    title: 'The Second Amendment: Text, History and Why It Matters',
    description: 'The text, the history, the landmark Supreme Court cases, and the responsibility that comes with the right.',
    url: URL, type: 'article',
  },
  twitter: { card: 'summary', title: 'The Second Amendment', description: 'The text, the history, the landmark cases, and the responsibility that comes with the right.' },
}

const TIMELINE = [
  ['1689', 'English Bill of Rights', 'After the Glorious Revolution, Parliament declares that Protestant subjects may have arms for their defence. The founding generation grew up on this idea.'],
  ['1791', 'The Second Amendment is ratified', 'On December 15, 1791 the states ratify the Bill of Rights. The right to keep and bear arms sits second, right after speech, religion and the press.'],
  ['2008', 'District of Columbia v. Heller', 'The Supreme Court holds, 5 to 4, that the Second Amendment protects an individual right to possess a firearm for lawful purposes such as self-defense in the home.'],
  ['2010', 'McDonald v. Chicago', 'The Court holds that the right applies to state and local governments through the Fourteenth Amendment, not just the federal government.'],
  ['2022', 'N.Y. State Rifle & Pistol Assn. v. Bruen', 'The Court holds that the right extends outside the home and that gun laws must fit the nation\'s historical tradition of firearm regulation. This ended the interest-balancing test lower courts had used.'],
  ['2024', 'United States v. Rahimi', 'The Court upholds, 8 to 1, a federal law barring firearm possession by people under a domestic-violence restraining order, and confirms the historical-tradition test.'],
]

const RESPONSIBILITY = [
  ['Know the four rules', 'Treat every firearm as loaded. Never point it at anything you are not willing to destroy. Keep your finger off the trigger until sights are on target. Know your target and what is behind it.', '/learn/firearms-safety-four-rules'],
  ['Know your state', 'Carry, magazine, transport and purchase rules differ from state to state, and they change. Check yours before you buy or travel.', '/laws/my-state'],
  ['Train', 'A right you have never practiced is a right you cannot use well. Dry fire costs nothing. Range time and a good class cost little compared to a mistake.', '/learn/dry-fire-training-beginners'],
  ['Stay informed', 'Bills move, courts rule, agencies change rules. Follow the cases that decide how far the right reaches.', '/laws?tab=scotus'],
]

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'The Second Amendment: Text, History and Why It Matters',
      description: 'The text, history, landmark Supreme Court cases and responsibilities of the Second Amendment.',
      mainEntityOfPage: URL,
      author: { '@type': 'Organization', name: 'DownRange' },
      publisher: { '@id': 'https://www.downrangeco.com/#organization' },
      inLanguage: 'en-US',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.downrangeco.com' },
        { '@type': 'ListItem', position: 2, name: 'Second Amendment', item: URL },
      ],
    },
  ],
}

export default function SecondAmendmentPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Masthead />
      <style>{`
.sa-hero{position:relative;overflow:hidden;text-align:center;padding:64px 16px 56px;background:radial-gradient(900px 380px at 50% -20%,rgba(200,146,42,.2),transparent 65%),var(--bg);border-bottom:1px solid var(--border)}
.sa-eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:14px}
.sa-h1{font-family:'Bebas Neue',cursive;font-weight:400;font-size:clamp(3rem,9vw,6.2rem);line-height:.92;margin:0 0 20px;color:var(--text)}
.sa-h1 span{color:var(--gold)}
.sa-quote{max-width:760px;margin:0 auto;font-family:Georgia,'Times New Roman',serif;font-size:clamp(19px,3.2vw,28px);line-height:1.45;color:var(--text);font-style:italic}
.sa-cite{margin-top:14px;font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.12em;text-transform:uppercase;color:var(--text-dim)}
.sa-wrap{max-width:820px;margin:0 auto;padding:0 16px}
.sa-sec{padding:44px 0 8px}
.sa-h2{font-family:'Bebas Neue',cursive;font-weight:400;font-size:clamp(2rem,5vw,2.8rem);letter-spacing:.03em;color:var(--text);margin:0 0 14px}
.sa-h2 span{color:var(--gold)}
.sa-p{font-size:17px;line-height:1.7;color:var(--text-muted);margin:0 0 16px}
.sa-p b{color:var(--text)}
.sa-pull{margin:26px 0;padding:18px 22px;border-left:3px solid var(--gold);background:var(--bg2);font-family:Georgia,serif;font-size:19px;line-height:1.55;color:var(--text);font-style:italic}
.sa-pull small{display:block;margin-top:8px;font-family:'IBM Plex Mono',monospace;font-style:normal;font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--text-dim)}
.sa-tl{list-style:none;margin:0;padding:0;border-left:2px solid var(--border-mid)}
.sa-tl li{position:relative;padding:0 0 26px 24px}
.sa-tl li::before{content:'';position:absolute;left:-7px;top:6px;width:12px;height:12px;border-radius:50%;background:var(--gold)}
.sa-yr{font-family:'Bebas Neue',cursive;font-size:30px;color:var(--gold);line-height:1}
.sa-t{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:20px;letter-spacing:.03em;color:var(--text);margin:2px 0 4px}
.sa-d{font-size:15.5px;line-height:1.6;color:var(--text-muted);margin:0}
.sa-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:14px}
.sa-card{display:block;padding:20px;background:var(--bg2);border:1px solid var(--border);text-decoration:none;transition:border-color .15s,transform .15s}
.sa-card:hover{border-color:var(--gold);transform:translateY(-2px)}
.sa-card h3{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:21px;color:var(--gold);margin:0 0 8px;letter-spacing:.03em}
.sa-card p{font-size:14.5px;line-height:1.55;color:var(--text-muted);margin:0 0 10px}
.sa-card span{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;color:var(--text-dim)}
.sa-cta{margin:46px 0 30px;padding:30px 22px;text-align:center;background:var(--bg2);border:1px solid var(--border);border-top:2px solid var(--gold)}
.sa-cta h2{font-family:'Bebas Neue',cursive;font-weight:400;font-size:2.2rem;margin:0 0 8px;color:var(--text)}
.sa-cta p{color:var(--text-muted);margin:0 0 18px;font-size:15.5px}
.sa-btns{display:flex;flex-wrap:wrap;gap:10px;justify-content:center}
.sa-btn{font-family:'Barlow Condensed',sans-serif;font-weight:700;font-size:16px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;color:var(--text);border:1px solid var(--border-mid);padding:12px 20px;min-height:44px;display:inline-flex;align-items:center}
.sa-btn:hover{border-color:var(--gold)}
.sa-btn-main{background:var(--gold);border-color:var(--gold);color:#09090B}
.sa-note{font-size:12.5px;line-height:1.6;color:var(--text-dim);padding:6px 0 48px}
@media(max-width:640px){.sa-grid{grid-template-columns:1fr}.sa-hero{padding:44px 16px 38px}.sa-p{font-size:16px}}
`}</style>

      <PageHero
        eyebrow="The Bill of Rights · Amendment II"
        title={<>Shall not <span>be infringed.</span></>}
        sub={<>&ldquo;A well regulated Militia, being necessary to the security of a free State, the right of the people to keep and bear Arms, shall not be infringed.&rdquo; <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'var(--text-dim)', display:'block', marginTop:10 }}>U.S. Constitution · ratified December 15, 1791</span></>} />

      <main className="sa-wrap">
        <section className="sa-sec" aria-labelledby="sa-why">
          <h2 className="sa-h2" id="sa-why">Why it <span>was written</span></h2>
          <p className="sa-p">The people who wrote the Constitution had just fought a war that began when British troops marched to seize colonial arms and powder at Lexington and Concord. They did not treat an armed citizenry as a loophole. They treated it as a <b>safeguard</b>: a free people who can defend themselves are harder to rule without their consent.</p>
          <p className="sa-p">James Madison made the point in Federalist No. 46, writing of &ldquo;the advantage of being armed, which the Americans possess over the people of almost every other nation.&rdquo; The amendment he later helped draft put that idea in the Constitution, where Congress could not quietly take it back.</p>
        </section>

        <section className="sa-sec" aria-labelledby="sa-time">
          <h2 className="sa-h2" id="sa-time">How the right <span>was defined</span></h2>
          <ol className="sa-tl">
            {TIMELINE.map(([y, t, d]) => (
              <li key={y}><div className="sa-yr">{y}</div><div className="sa-t">{t}</div><p className="sa-d">{d}</p></li>
            ))}
          </ol>
          <div className="sa-pull">
            &ldquo;The inherent right of self-defense has been central to the Second Amendment right.&rdquo;
            <small>Justice Scalia, writing for the Court in District of Columbia v. Heller (2008)</small>
          </div>
        </section>

        <section className="sa-sec" aria-labelledby="sa-today">
          <h2 className="sa-h2" id="sa-today">What it means <span>today</span></h2>
          <p className="sa-p">For tens of millions of Americans the Second Amendment is not an abstraction. It is the hunter in the field before sunrise, the competitor at the line, the parent who locks up a rifle and trains with a pistol so their family is safer, and the concealed carrier who hopes never to draw. Courts have said the right is individual, that it reaches the states, and that it goes beyond your front door.</p>
          <p className="sa-p">It is also a right that varies by state, and the fight over its limits is still being decided in courtrooms and legislatures. That is why DownRange tracks the bills, the rulings and the rules as they move.</p>
        </section>

        <section className="sa-sec" aria-labelledby="sa-resp">
          <h2 className="sa-h2" id="sa-resp">A right worth <span>earning every day</span></h2>
          <p className="sa-p">Freedom is kept by the people who use it well. Responsible gun owners are the best argument for the right. Four habits to start with:</p>
          <div className="sa-grid">
            {RESPONSIBILITY.map(([t, d, h]) => (
              <Link key={t} href={h} className="sa-card"><h3>{t}</h3><p>{d}</p><span>Read more →</span></Link>
            ))}
          </div>
        </section>

        <div className="sa-cta">
          <h2>Stay informed. Stay ready.</h2>
          <p>Get the news, the deals and the law changes that matter to you, checked against your state.</p>
          <div className="sa-btns">
            <Link href="/laws/my-state" className="sa-btn sa-btn-main">Check my state</Link>
            <Link href="/news" className="sa-btn">Latest news</Link>
            <Link href="/laws?tab=scotus" className="sa-btn">Supreme Court cases</Link>
          </div>
        </div>
        <p className="sa-note">This page is general information about the Constitution and published court decisions. It is not legal advice. Laws differ by state and change often; confirm current rules with the official source or a licensed attorney.</p>
      </main>
      <Footer />
    </>
  )
}
