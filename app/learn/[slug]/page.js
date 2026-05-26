import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import Link from 'next/link'

const AUTHOR = { name: 'DJ Cavalcanti', title: 'DownRange Founder', bio: 'DJ Cavalcanti is the founder of DownRange, America\'s Firearms Intelligence Hub. A lifelong 2A advocate and Washington State resident, he built DownRange to give every American gun owner access to the legal intelligence and practical knowledge they need.' }

const ARTICLES = {
  'buying-your-first-gun': {
    title: 'Buying Your First Gun: The Complete Beginner\'s Guide',
    subtitle: 'Everything you need to know before walking into a gun store — from caliber selection to the background check process.',
    category: 'Getting Started', readTime: '12 min read', date: 'May 15, 2026',
    tags: ['First Gun', 'Handgun', 'Budget', '9mm'],
    intro: 'Most first-time gun buyers make the same mistake: they walk into a gun store with no plan and let a salesperson decide for them. That\'s not necessarily bad — good salespeople at good stores provide real guidance. But you\'ll make a much better decision if you walk in knowing what you want and why.',
    sections: [
      { h: 'Step 1: Know Your Purpose', body: 'The most important question isn\'t "which gun should I buy?" — it\'s "what do I need this gun for?" Your answer shapes everything else.\n\nThe four main purposes are: home defense, concealed carry (EDC), range shooting/sport, and hunting. Many people want a gun that does two or three of these things. That\'s fine, but understand the tradeoffs.\n\nA compact 9mm pistol like the Glock 19 can handle home defense, concealed carry, and range shooting competently. A 12-gauge shotgun excels at home defense but is not concealable. A .22 LR is ideal for learning but isn\'t the best for serious defense. Be honest about your primary use case.' },
      { h: 'Step 2: Set a Realistic Budget', body: 'Budget honestly. The gun is not the only cost.\n\nFor a basic but quality setup:\n• Handgun: $400–$700 (Glock 19, SIG P365, S&W M&P)\n• Holster (if carrying): $50–$120\n• Safe or lockbox: $50–$300\n• Ammunition (first range session): $30–$60\n• Eye and ear protection: $30–$80\n• Training course: $100–$300\n\nTotal realistic budget: $700–$1,500 to do it right. Anyone who tells you a $200 handgun is fine for serious defensive use is giving you bad advice. Quality matters when your life may depend on it.' },
      { h: 'Step 3: Choose the Right Caliber', body: '9mm Luger is the right choice for most beginners. Period.\n\nWhy? It has manageable recoil, excellent terminal ballistics from modern hollow point ammunition, affordable training ammunition (currently around 18¢/round), and it\'s the most common service pistol caliber in the world — meaning every major manufacturer makes quality 9mm pistols.\n\nFor 2026, avoid .40 S&W (higher recoil, limited advantage over 9mm, being phased out of most agencies). The .45 ACP is a fine cartridge but the recoil and lower magazine capacity make it harder for beginners to shoot well. .380 ACP is acceptable for ultra-compact carry guns but is marginal for defensive use.\n\nFor a first rifle: .22 LR is the best learning platform. For a serious defensive rifle: 5.56 NATO / .223 Remington.' },
      { h: 'Step 4: Handle Before You Buy', body: 'Never buy a firearm you haven\'t handled — ideally one you haven\'t shot. Here\'s how:\n\n1. Visit a range that rents firearms. Most do. You can try 3-4 different guns for $20-$40 total in rental fees plus ammo.\n\n2. Visit a gun store and ask to handle several options. Good stores expect this and won\'t pressure you.\n\n3. Look for a beginner\'s shooting event or course. These often include access to a variety of firearms.\n\nWhat to check when handling: Does it fit your hand? Can you comfortably reach the trigger without shifting your grip? Can you operate the controls (slide, safety if present, magazine release) with your shooting hand? Can you see the sights clearly?' },
      { h: 'Step 5: The Background Check Process', body: 'When you buy from a Federal Firearms Licensee (FFL) dealer, you\'ll fill out ATF Form 4473 and undergo a NICS (National Instant Criminal Background Check System) check.\n\nThe process:\n1. Fill out Form 4473 — this asks about citizenship, criminal history, mental health adjudications, drug use, and other disqualifying factors. Answer honestly. Lying on this form is a federal felony.\n2. The dealer calls NICS (or submits electronically) and receives one of three responses: Proceed, Delayed (1-3 business day hold for further review), or Denied.\n3. If Proceed: take your gun home that day (subject to any state waiting period).\n4. If Delayed: you wait up to 3 business days. If NICS doesn\'t respond, the dealer may legally transfer the firearm after 3 days (though many wait longer).\n5. If Denied: you have the right to appeal through the FBI.\n\nSome states add additional requirements: waiting periods (Washington: 10 days, California: 10 days, Florida: 3 days), safety training certificates, or state-level permits.' },
      { h: 'Top Recommended Starter Pistols (2026)', body: '**Under $500:**\n• Glock 17 Gen5 / Glock 19 Gen5 — The industry benchmark. Proven across 40 years. Enormous aftermarket.\n• S&W M&P 9 M2.0 — American-made, improved trigger over previous M&P, aggressive grip texture.\n• Taurus G3 — Budget option that works. Not as refined as Glock/SIG, but reliable enough.\n\n**$500–$700:**\n• SIG Sauer P320 / P365XL — Modular design, best factory trigger in class. Military M17 selection.\n• Springfield Armory Hellcat Pro — Excellent carry gun, 15+1 capacity, optics-ready.\n\n**Avoid:** Off-brand "polymer pistols" under $250. There are some that work, but this is not the category to experiment in.' },
    ],
    keyTakeaways: ['Define your purpose before you shop — home defense, carry, sport, or all three', 'Budget $700–$1,500 for a complete, responsible first setup', '9mm is the right caliber for 99% of beginners', 'Handle (ideally shoot) any gun before you buy it', 'NICS background checks are mandatory for all FFL purchases — answer Form 4473 honestly'],
    relatedLinks: [
      { label: 'How to Get Your CCW License', href: '/learn/how-to-get-ccw-license' },
      { label: 'The Four Rules of Firearms Safety', href: '/learn/firearms-safety-four-rules' },
      { label: 'Safe Storage 101', href: '/learn/safe-storage-guide-beginners' },
      { label: 'Gun Encyclopedia', href: '/guns' },
    ],
  },
  'how-to-get-ccw-license': {
    title: 'How to Get Your CCW License (State-by-State Guide)',
    subtitle: 'Concealed carry permits explained: requirements, costs, training, and exactly what to expect in your state.',
    category: 'CCW & Carry', readTime: '15 min read', date: 'May 18, 2026',
    tags: ['CCW', 'Carry Permit', 'Legal', 'Training'],
    intro: 'A Concealed Carry Weapon (CCW) license — also called a Concealed Handgun Permit (CHP), Carry of Concealed Deadly Weapon (CCDW), or License to Carry (LTC) depending on your state — allows you to legally carry a concealed firearm in public. As of 2026, 29 states are constitutional carry states, meaning no permit is required to carry concealed. But even in those states, a permit has significant advantages.',
    sections: [
      { h: 'Why Get a Permit Even in Constitutional Carry States', body: 'If your state allows constitutional (permitless) carry, you might wonder why you\'d bother getting a permit. Here\'s why:\n\n1. **Reciprocity**: A permit from your home state is recognized in many other states. Without a permit, you may not be able to carry legally when traveling.\n\n2. **FFL background check skip**: Many states allow permit holders to skip the NICS check when buying from a dealer.\n\n3. **Legal clarity**: In some situations, having a permit provides clear legal standing.\n\n4. **Training proof**: The permit process forces training that makes you a safer, more legally informed carrier.' },
      { h: 'The General CCW Application Process', body: 'While every state differs, the typical process looks like this:\n\n**1. Meet basic eligibility requirements:**\n• Be 21+ (some states allow 18+ with military service)\n• Be a legal US citizen or permanent resident\n• Have no felony convictions\n• Have no domestic violence convictions or restraining orders\n• Have no involuntary mental health commitments\n• Not be an unlawful user of controlled substances\n\n**2. Complete required training:**\nMost states require 4–16 hours of classroom and/or live-fire training from a state-certified instructor. Topics typically include: safe handling, storage, state use-of-force law, and basic marksmanship.\n\n**3. Submit your application:**\nTo your local sheriff\'s office, state police, or a designated state agency. Includes: completed application form, training certificate, two forms of ID, passport photos (some states), fingerprints (some states), and payment.\n\n**4. Background check:**\nThe issuing authority runs a more comprehensive background check than a standard NICS check.\n\n**5. Receive your permit:**\nTimelines range from 2 weeks (Arizona) to 6+ months (California urban areas). Most shall-issue states process in 30–90 days.' },
      { h: 'Shall-Issue vs. May-Issue States', body: '**Shall-Issue:** The state must issue a permit to anyone who meets the statutory criteria. This includes: AL, AK, AZ, AR, CO, FL, GA, ID, IN, IA, KS, KY, LA, ME, MI, MN, MS, MO, MT, NE, NV, NH, NM, NC, ND, OH, OK, OR, PA, SC, SD, TN, TX, UT, VT, VA, WA, WV, WI, WY — and the 29 constitutional carry states.\n\n**May-Issue (post-Bruen effectively shall-issue in most cases):** After NYSRPA v. Bruen (2022), states can no longer require "good cause" for a permit. CA, NY, NJ, MD, HI, CT, DE, MA, RI have attempted workarounds with varying success in courts.\n\n**De Facto Denial States:** Hawaii and some California jurisdictions remain effectively impossible to obtain permits despite court decisions.' },
      { h: 'What CCW Training Covers (And What It Should)', body: 'Required training typically covers:\n• The four rules of firearm safety\n• Safe handling, loading, and unloading\n• Legal use of force — when can you draw? When can you fire?\n• State-specific laws (no-carry zones, duty to inform, castle doctrine vs. stand your ground)\n• Basic marksmanship fundamentals\n• Basic cleaning and maintenance\n\n**What most state-required training doesn\'t cover:**\n• Drawing from a holster (many ranges prohibit this)\n• Low-light shooting\n• Shooting under stress\n• Force-on-force scenarios\n\nA state CCW class teaches you the minimum legal knowledge. It does not make you a skilled defensive shooter. After getting your permit, invest in quality training from a reputable instructor.' },
      { h: 'CCW Costs by State (Approximate)', body: '• **Free states**: AK, AZ, AR, ID, IA, KS, KY, ME, MS, MO, MT, NH, ND, OK, SD, VT, WV, WY (no permit required for residents)\n• **Low cost ($10–$50)**: GA, IN, NC, OH, TX, TN, UT\n• **Moderate ($50–$150)**: CO, FL, MI, MN, NV, OR, PA, SC, WA\n• **High ($150–$500+)**: CA, CT, HI, MD, MA, NJ, NY, RI\n\nNote: Training course costs ($75–$300) are separate from application fees.' },
    ],
    keyTakeaways: ['29 states are constitutional carry — but a permit still has major advantages for reciprocity', 'Meeting eligibility requirements is mandatory — lying on your application is a felony', 'State-required training is the minimum — invest in additional training', 'CCW reciprocity means your permit works in other states — check before you travel', 'After Bruen (2022), most states must issue permits on an objective criteria basis'],
    relatedLinks: [
      { label: 'CCW Reciprocity Map', href: '/laws?tab=reciprocity' },
      { label: 'State Laws by State', href: '/state-hub' },
      { label: 'How to Choose a Holster', href: '/learn/choosing-holster-beginners' },
      { label: 'CCW Insurance Comparison', href: '/carry-insurance' },
    ],
  },
  'firearms-safety-four-rules': {
    title: 'The Four Rules of Firearms Safety (And Why They Save Lives)',
    subtitle: 'These four rules are not suggestions. Every accident with a firearm traces back to violating at least one of them.',
    category: 'Safety', readTime: '8 min read', date: 'May 20, 2026',
    tags: ['Safety', 'Fundamentals', 'Four Rules', 'Beginner'],
    intro: 'Colonel Jeff Cooper, founder of Gunsite Academy and one of the most influential firearms trainers of the 20th century, codified the Four Rules of Firearms Safety. They are not guidelines. They are not suggestions. They are the framework that prevents negligent discharges from becoming tragedies. Every single firearms accident can be traced to a violation of at least one of these rules.',
    sections: [
      { h: 'Rule 1: Treat All Guns as if They Are Loaded', body: 'This is the first and most important rule because it is the mental foundation for all the others.\n\nThis rule does not mean "check if your gun is loaded and then treat it as unloaded." It means treat every firearm, every single time, as if it has a round in the chamber — regardless of whether you just checked it, regardless of whether you "know" it\'s empty.\n\n**Why this matters:** The vast majority of negligent discharges happen when someone has "verified" their gun is unloaded. They put it down, pick it up later, and squeeze the trigger thinking nothing will happen. Something does happen.\n\nEvery time you handle a firearm, your brain should default to: this gun is loaded. This habit eliminates an entire category of accidents.' },
      { h: 'Rule 2: Never Point the Muzzle at Anything You\'re Not Willing to Destroy', body: 'The direction the muzzle points is the direction a bullet will travel if the gun fires. Therefore, the muzzle should only ever be pointed at:\n• Your target (at the range, ready to fire)\n• A safe backstop (ground, berm, clearing barrel)\n• Downrange\n\nThe muzzle should never be pointed at:\n• People (including yourself)\n• Property you value\n• Pets\n• Anything you don\'t want a bullet to hit\n\n**The practical implication:** This rule governs how you carry a firearm, how you hand it to someone, how you set it down, and how you store it. Muzzle discipline is something that experienced shooters can spot immediately — good muzzle discipline marks a responsible gun owner.\n\n"Muzzling" someone — sweeping them with your muzzle even briefly — is a serious safety violation that will get you removed from any professional shooting course.' },
      { h: 'Rule 3: Keep Your Finger Off the Trigger Until Your Sights Are On Target and You Have Decided to Shoot', body: 'Your finger does not enter the trigger guard until:\n1. Your sights are on the target\n2. You have consciously decided to fire\n\nAt all other times, your trigger finger lies straight along the frame above the trigger guard. This is called "trigger discipline" or "register" — your finger is registered along the frame.\n\n**Why this is hard:** Modern pistol triggers are light — often 4–6 pounds of pull. Under stress, your grip tightens. Without discipline, a tightening grip can pull a trigger. This is called a sympathetic squeeze and it\'s responsible for many law enforcement accidental discharges.\n\n**Practice:** Every time you pick up a firearm, immediately establish trigger discipline. Your finger should automatically go to register. This becomes muscle memory with practice.' },
      { h: 'Rule 4: Know Your Target and What Is Beyond It', body: 'A bullet does not stop at your target. A bullet that misses your target continues until it hits something. A bullet that passes through your target continues until it hits something.\n\nThis rule has two components:\n\n**Know your target:** Positively identify what you are about to shoot. This is critically important in home defense scenarios — you must identify the threat before you fire. Shooting an unidentified shape in a dark hallway has killed family members.\n\n**Know what\'s beyond:** What is behind your target? What is in that direction for the next half mile? Even inside a home, a 9mm FMJ round can penetrate multiple walls and injure someone in another room.\n\nThis is why defensive ammunition selection matters — modern hollow point bullets expand on impact, reducing penetration. It\'s why backstop selection at a range matters — you need a safe direction to fire in.' },
      { h: 'The Safety Math', body: 'The reason these four rules are so powerful is their redundancy.\n\nRules 2 and 3 together mean: even if you have a negligent discharge (rules 1 violated), no one gets hurt because the muzzle isn\'t pointed at anyone (rule 2) and your sights are on a safe target (rule 4).\n\nRule 1 means: even if you somehow break rules 2-4, you approach every firearm knowing it might fire.\n\nFor an accident to injure someone, a shooter must violate multiple rules simultaneously. Follow all four and the system is extremely robust. This is why professionals don\'t have accidents — not because they\'re more careful, but because four-rule compliance is so ingrained they don\'t have to think about it.' },
    ],
    keyTakeaways: ['Treat all guns as loaded — always, without exception', 'Never point the muzzle at anything you\'re not willing to destroy', 'Trigger finger off the trigger until sights are on target and decision to fire is made', 'Know your target and what is beyond it — bullets don\'t stop at targets', 'Accidents require violating multiple rules — four-rule compliance creates a robust safety system'],
    relatedLinks: [
      { label: 'Buying Your First Gun', href: '/learn/buying-your-first-gun' },
      { label: 'Safe Storage 101', href: '/learn/safe-storage-guide-beginners' },
      { label: 'Your First Range Visit', href: '/learn/shooting-range-first-visit' },
      { label: 'Training & Drills', href: '/training' },
    ],
  },
}

// Generate remaining articles dynamically using Claude API
async function generateArticle(slug) {
  const titles = {
    'home-defense-basics': 'Home Defense Basics: What You Actually Need',
    'safe-storage-guide-beginners': 'Safe Storage 101: Keeping Your Guns Secure and Accessible',
    'ammo-guide-beginners': 'Ammunition Explained: What to Buy and Why',
    'shooting-range-first-visit': 'Your First Time at a Shooting Range: What to Expect',
    'cleaning-maintaining-your-gun': 'How to Clean and Maintain Your Firearm',
    'understanding-gun-laws': 'Understanding Gun Laws: A Beginner\'s Legal Overview',
    'choosing-holster-beginners': 'How to Choose a Holster for Concealed Carry',
    'dry-fire-training-beginners': 'Dry Fire Training: How to Get Better Without Spending on Ammo',
    'what-is-nfa': 'What Is the NFA? Suppressors, SBRs, and Machine Guns Explained',
  }
  const title = titles[slug]
  if (!title) return null

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', 'x-api-key':process.env.ANTHROPIC_API_KEY, 'anthropic-version':'2023-06-01' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role:'user', content:`Write a detailed, practical, beginner-friendly firearms guide article titled "${title}". 

Format as JSON only:
{
  "title": "${title}",
  "subtitle": "one sentence subtitle",
  "category": "one of: Getting Started, CCW & Carry, Safety, Home Defense, Safe Storage, Ammunition, Maintenance, Legal, Training",
  "readTime": "X min read",
  "date": "May 2026",
  "tags": ["tag1","tag2","tag3"],
  "intro": "2 paragraph intro (combined into one string with \\n\\n)",
  "sections": [
    {"h": "section heading", "body": "3-4 paragraph section body with practical advice. Use \\n\\n between paragraphs."}
  ],
  "keyTakeaways": ["5 bullet point takeaways"],
  "relatedLinks": []
}

Write 4-5 sections. Be direct, practical, authoritative. This is for an American audience who owns or wants to own firearms. Don't lecture about whether they should own guns. Treat them as adults making responsible choices.` }]
      })
    })
    const d = await res.json()
    const text = d.content?.[0]?.text || '{}'
    return JSON.parse(text.replace(/```json|```/g,'').trim())
  } catch { return null }
}

export async function generateStaticParams() {
  return Object.keys(ARTICLES).map(s => ({ slug: s }))
}

export async function generateMetadata({ params }) {
  const a = ARTICLES[params.slug]
  if (!a) return { title: 'Article — DownRange Learning Center' }
  return {
    title: `${a.title} — DownRange`,
    description: a.subtitle,
    openGraph: { title: a.title, description: a.subtitle }
  }
}

export default async function ArticlePage({ params }) {
  let article = ARTICLES[params.slug]

  // For articles not in static data, generate with Claude
  if (!article) {
    article = await generateArticle(params.slug)
    if (!article) notFound()
  }

  const otherLinks = Object.entries(ARTICLES)
    .filter(([s]) => s !== params.slug)
    .slice(0, 4)
    .map(([s, a]) => ({ href: `/learn/${s}`, label: a.title }))

  return (
    <>
      <Masthead />
      <div className="dr-page" style={{ paddingTop:0 }}>

        {/* Article hero */}
        <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'40px 0 28px', position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 80%, rgba(200,146,42,0.05), transparent 60%)', pointerEvents:'none' }} />
          <div className="container" style={{ maxWidth:800, position:'relative' }}>
            <div className="dr-breadcrumb" style={{ marginBottom:'12px' }}>
              <Link href="/" style={{ color:'var(--text-dim)', textDecoration:'none' }}>Home</Link>
              <span className="dr-breadcrumb-sep">›</span>
              <Link href="/learn" style={{ color:'var(--text-dim)', textDecoration:'none' }}>Learning Center</Link>
              <span className="dr-breadcrumb-sep">›</span>
              <span className="dr-breadcrumb-cur">{article.category}</span>
            </div>
            <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
              <span className="dr-badge dr-badge-gold">{article.category}</span>
              <span className="dr-badge dr-badge-dim">{article.readTime}</span>
              <span className="dr-badge dr-badge-dim">{article.date}</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2rem,5vw,3rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:1.1, marginBottom:'10px' }}>{article.title}</h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7, marginBottom:'20px' }}>{article.subtitle}</p>
            {/* Author */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', padding:'12px 16px', background:'var(--bg3)', border:'1px solid var(--border)', borderLeft:'3px solid var(--gold)', width:'fit-content' }}>
              <span style={{ fontSize:'24px' }}>🎯</span>
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:700, color:'var(--text)' }}>{AUTHOR.name}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)' }}>{AUTHOR.title} · {article.date}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="container" style={{ maxWidth:800 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 220px', gap:'40px', paddingTop:'32px' }}>

            {/* Article body */}
            <article>
              {/* Intro */}
              {article.intro && (
                <div style={{ borderLeft:'3px solid var(--gold)', paddingLeft:'20px', marginBottom:'32px' }}>
                  {article.intro.split('\n\n').map((p, i) => (
                    <p key={i} style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.8, marginBottom: i < article.intro.split('\n\n').length-1 ? '16px' : 0 }}>{p}</p>
                  ))}
                </div>
              )}

              {/* Sections */}
              {article.sections?.map((s, i) => (
                <div key={i} style={{ marginBottom:'32px' }}>
                  <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:'var(--gold)', letterSpacing:'0.04em', marginBottom:'12px', lineHeight:1 }}>{s.h}</h2>
                  {s.body.split('\n\n').map((p, pi) => (
                    <p key={pi} style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'15px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'14px' }} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text)">$1</strong>').replace(/\n/g, '<br>') }} />
                  ))}
                  {i < (article.sections?.length || 0) - 1 && <div style={{ height:'1px', background:'var(--border)', margin:'24px 0 0' }} />}
                </div>
              ))}

              {/* Key takeaways */}
              {article.keyTakeaways?.length > 0 && (
                <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderTop:'3px solid var(--gold)', padding:'20px 24px', marginTop:'32px', marginBottom:'32px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)', letterSpacing:'0.15em', fontWeight:700, marginBottom:'14px' }}>KEY TAKEAWAYS</div>
                  {article.keyTakeaways.map((t, i) => (
                    <div key={i} style={{ display:'flex', gap:'10px', marginBottom:'8px', alignItems:'flex-start' }}>
                      <span style={{ color:'var(--gold)', flexShrink:0, fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', marginTop:'2px' }}>✓</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'var(--text-muted)', lineHeight:1.6 }}>{t}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Author bio */}
              <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', padding:'20px', marginBottom:'24px' }}>
                <div style={{ display:'flex', gap:'14px', alignItems:'flex-start' }}>
                  <span style={{ fontSize:'32px', flexShrink:0 }}>🎯</span>
                  <div>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.1rem', color:'var(--text)', letterSpacing:'0.05em', marginBottom:'4px' }}>{AUTHOR.name}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)', marginBottom:'8px' }}>{AUTHOR.title}</div>
                    <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13px', color:'var(--text-dim)', lineHeight:1.7 }}>{AUTHOR.bio}</p>
                  </div>
                </div>
              </div>
            </article>

            {/* Sidebar */}
            <aside style={{ position:'sticky', top:'70px', alignSelf:'flex-start' }}>
              {/* Tags */}
              {article.tags?.length > 0 && (
                <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'16px', marginBottom:'12px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.12em', marginBottom:'10px' }}>TOPICS</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                    {article.tags.map(t => <span key={t} className="dr-pill">{t}</span>)}
                  </div>
                </div>
              )}

              {/* Related articles */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'16px', marginBottom:'12px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', letterSpacing:'0.12em', marginBottom:'12px' }}>RELATED READING</div>
                {(article.relatedLinks?.length > 0 ? article.relatedLinks : otherLinks).map(l => (
                  <Link key={l.href} href={l.href}
                    style={{ display:'block', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-muted)', textDecoration:'none', padding:'7px 0', borderBottom:'1px solid var(--border)', lineHeight:1.4 }}>
                    → {l.label}
                  </Link>
                ))}
              </div>

              {/* Back to Learning Center */}
              <Link href="/learn" className="dr-btn-outline" style={{ display:'block', textAlign:'center', fontSize:'11px' }}>
                ← All Articles
              </Link>
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
