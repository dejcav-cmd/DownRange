import Masthead    from '../../components/layout/Masthead'
import Footer      from '../../components/layout/Footer'
import Link        from 'next/link'
import { fetchBreakingAlerts, fetchBlogPostsPaginated } from '../../sanity/lib/client'

export const metadata = {
  title: 'The Range Report — DownRange Blog',
  description: 'Expert analysis, industry commentary, and field intelligence from DJ Cavalcanti and the DownRange editorial team.',
  alternates: { canonical: 'https://www.downrangeco.com/blog' },
}
export const revalidate = 300

export const BLOG_POSTS = [
  {
    slug:        'suppressor-revolution-2026',
    title:       'The Suppressor Revolution Is Here — and Most Gun Owners Are Missing It',
    subtitle:    'The $200 NFA tax is gone. Here is exactly what that means for your next purchase, your range routine, and the industry at large.',
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    date:        'May 20, 2026',
    readTime:    '11 min read',
    category:    'OPINION',
    catColor:    '#a855f7',
    featured:    true,
    img:         '/img/photos/suppressor.jpg',
    excerpt:     'When the One Big Beautiful Bill eliminated the $200 NFA tax on suppressors, SBRs, and SBSs, it removed the single biggest barrier to widespread suppressor ownership. Six months in, the numbers are staggering — and the industry is only beginning to catch up.',
    tags:        ['NFA', 'Suppressors', 'One Big Beautiful Bill', 'Industry'],
    body: `
<h2>The Tax Is Gone. Now What?</h2>
<p>For most of my adult life, the $200 NFA tax stamp was the great equalizer of suppressor ownership. It wasn't that suppressors were unaffordable — a quality Omega 9K runs $799, the same price as a decent optic. It was that the $200 tax added a psychological barrier, a bureaucratic insult, a federal fee that said <em>we don't really trust you with this</em>. And then, on January 1, 2026, it was gone.</p>

<p>I remember refreshing the NSSF press release three times that morning. The <strong>One Big Beautiful Bill</strong> had passed the previous summer, and I had written the analysis piece, covered the Senate debates, documented every advocacy group's position. But seeing the implementation date arrive still hit differently. I picked up my phone and called three dealers I trust: Tennessee Arms, Silencer Shop, and my local FFL in Washington. All three said the same thing: their suppressor inquiry volume had doubled overnight and their inventory was already thinning.</p>

<h2>What the Numbers Show Six Months In</h2>
<p>Let me give you the actual data, because the anecdotes are everywhere but the numbers tell a cleaner story. NICS background check volume for NFA items — silencers specifically — jumped 340% in January 2026 compared to January 2025. That is not a typo. In the previous five years, suppressor Form 4 submissions averaged roughly 850,000 per year. Industry insiders I speak with are projecting 3.1 to 3.4 million for 2026 if the current pace holds.</p>

<p>What is driving this beyond the obvious price relief? Three compounding factors. First, the ATF's e-File system has reduced Form 4 processing from the infamous 12-to-18 month wait to an average of <strong>47 days</strong> as of April 2026. Second, suppressor technology has improved dramatically — the SilencerCo Omega 36M, the Dead Air Sandman, the Rugged Radiant have all gotten lighter, shorter, and more durable in the past two years. Third, and most importantly: mainstream gun owners are finally having the conversation honestly. A suppressor is not a movie prop. It takes a .308 shot from hearing-damaging to hearing-safe-with-ears. That is a health product as much as it is a firearm accessory.</p>

<h2>The States Nobody Is Talking About</h2>
<p>Here is what the national coverage keeps missing. Nine states still ban civilian suppressor ownership: California, Delaware, Hawaii, Illinois, Massachusetts, New Jersey, New York, Rhode Island, and Washington D.C. Those are some of the most populous states in the country. Residents in those states cannot benefit from this reform regardless of what Congress does. This is the gun rights divide at its starkest: if you live in Texas, you can walk into a dealer today and take home a suppressor within 30 days, tax-free. If you live in California, that is still a felony.</p>

<p>The political implication matters enormously for 2A advocates. The next battleground is not federal — it is state-level litigation. The <strong>Firearms Policy Coalition</strong> has already filed pre-enforcement challenges in Illinois and New Jersey, arguing that state suppressor bans are unconstitutional under the <em>Bruen</em> text-and-history standard. I expect at least one of those cases to produce a circuit-level ruling within 18 months. Watch the Seventh Circuit specifically — Illinois is where this fight will be fought hardest.</p>

<h2>What to Actually Buy Right Now</h2>
<p>If you have been on the fence about a suppressor, the calculus is now straightforward. The acquisition cost is the suppressor itself, the tax stamp fee ($0), and a wait that is now measured in weeks not years. My recommendations depend on your primary use case:</p>

<ul>
<li><strong>Pistol EDC + home defense:</strong> SilencerCo Omega 9K ($799). Most compact pistol suppressor on the market without sacrificing meaningful performance. Runs every 9mm load, hosts on .300 Blackout subsonic. At 5.08 inches it fits most holsters.</li>
<li><strong>Multi-caliber rifle:</strong> SilencerCo Omega 36M ($999). Configures short or standard, titanium and Inconel construction, handles everything from .22 LR to .300 Win Mag with the right adapter.</li>
<li><strong>Dedicated .308 precision:</strong> Dead Air Sandman-S ($899). Full-auto rated, direct thread and QD, built for sustained fire. The benchmark for .308 performance under $1,000.</li>
</ul>

<p>Buy direct from a dealer using Silencer Shop's kiosk system — it handles the Form 4 paperwork electronically and has the fastest approval times in the industry based on current data.</p>

<h2>The Industry Is Not Ready For What Comes Next</h2>
<p>Here is my broader take, and I say this as someone who has covered this industry for years: manufacturers and retailers are not prepared for the volume that is coming. Current production capacity was built around the old demand curve — roughly 850,000 units annually. At 3 million-plus per year, that pipeline does not exist yet. Expect significant delivery delays on new-production suppressors by Q3 2026 as backorders pile up. If you are serious about buying, do it now while inventory is still reasonably available.</p>

<p>The companies that move fastest on production scale — SilencerCo, Rugged, Dead Air, Sig Sauer Suppressors — will define the next decade of the NFA accessory market. The ones that move slow will watch their market share evaporate to whoever has the units on the shelf.</p>

<p><strong>DownRange Bottom Line:</strong> The suppressor tax elimination is the most significant positive change in NFA regulations in 50 years. If you are a responsible gun owner who values hearing health, home defense effectiveness, or simply better range experience, the barriers are gone. Buy one. The wait is short, the cost is reasonable, and the benefit is real.</p>
    `,
  },
  {
    slug:        'micro-compact-pistol-market-2026',
    title:       'Why the Micro-Compact 9mm Is the Most Important Category in Firearms Right Now',
    subtitle:    'The P365 wave is not slowing down. Here is the definitive breakdown of the micro-compact market, who is winning, and what to actually buy.',
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    date:        'May 14, 2026',
    readTime:    '13 min read',
    category:    'ANALYSIS',
    catColor:    '#C8922A',
    featured:    false,
    img:         'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1400&h=900&fit=crop',
    excerpt:     'The Sig P365 changed everything when it launched in 2018. Eight years later, every major manufacturer has a micro-compact answer, the technology has matured, and the market is more competitive than any category in firearms history.',
    tags:        ['Pistols', 'EDC', 'Micro-Compact', 'Market Analysis'],
    body: `
<h2>Eight Years After the P365 Changed Everything</h2>
<p>In 2018, Sig Sauer launched the P365 and broke a rule that had governed the concealed carry market for two decades: you could not have a flush 10-round magazine in a package narrower than an inch. The P365 did it at 1.0 inches wide with a 10+1 flush capacity that exceeded what most full-size service pistols offered just fifteen years prior. Instructors called it the most significant carry gun since the Glock 26. They were right, but they underestimated the ripple effect.</p>

<p>Today, in 2026, micro-compact 9mm pistols are not just the fastest-growing category in firearms — they are the dominant conversation in gun shops, instructor circles, online communities, and manufacturer boardrooms simultaneously. Understanding why, and understanding which guns are actually worth your money, requires more than reading spec sheets. It requires understanding what the market is actually rewarding.</p>

<h2>The Data Behind the Dominance</h2>
<p>According to Shooting Industry data from January 2026, handguns outpaced long guns at dealer counters nationwide for the 14th consecutive quarter. More specifically, micro-compact and subcompact 9mm pistols represented <strong>38% of all handgun sales</strong> at reporting retailers. That number was 21% in 2020. The shift is structural, not cyclical. First-time gun buyers — who represent a significant portion of purchases since 2020 — overwhelmingly select compact carry pistols over full-size handguns. Defensive use cases dominate purchase intent surveys. And optics-ready micro-compacts have expanded the market upward in price: buyers who might have spent $450 on a basic carry gun are now spending $650-$800 on an optics-cut version and adding a red dot.</p>

<p>This has created a market dynamic where manufacturers are competing on a very narrow set of criteria: <strong>width, capacity, trigger quality, optics readiness, and aftermarket support</strong>. Every major manufacturer now has at least one serious competitor in this space.</p>

<h2>The Current Competitive Field, Ranked Honestly</h2>
<p>I have put rounds through all of the major platforms. Here is my honest assessment of where the market stands in mid-2026:</p>

<ul>
<li><strong>Sig P365 XL / X-Macro:</strong> Still the benchmark. The X-Macro's 17-round flush capacity redefined what micro-compact means. Factory trigger is genuinely excellent. ROMVX optic cut standard. If I was carrying one gun forever, this is the starting conversation.</li>
<li><strong>Glock 43X MOS:</strong> The reliability argument ends discussions. Zero malfunctions in documented 5,000+ round tests. MOS system is universal. The Shield Arms S15 magazine gives you 15+1 in a 1.1-inch wide package. The trigger is the only legitimate complaint.</li>
<li><strong>Springfield Armory Hellcat Pro:</strong> Best-in-class capacity (15+1 flush) for its footprint. Flat-faced trigger. Optic cut standard. Springfield has quietly built one of the strongest micro-compact lineups in the industry and gets less credit than it deserves.</li>
<li><strong>Walther PDP Compact:</strong> Best trigger in the striker-fired class at any price. German engineering shows. If trigger feel is your priority, nothing touches the PDP under $800.</li>
<li><strong>Smith & Wesson M&P Shield Plus:</strong> The value play. $449 MSRP for an optic-cut, 13+1 flush capacity, ergonomics that fit more hand sizes than anything on this list. The best first carry gun for budget-conscious buyers.</li>
</ul>

<h2>The Red Dot Revolution in Carry</h2>
<p>The optics-ready conversation has moved from enthusiast circles to mainstream carry. In 2020, maybe 15% of carry guns in my training classes had a mounted optic. Today that number exceeds 60% in advanced carry courses. The Holosun EPS Carry has become the default recommendation for micro-compact red dots — it is sealed, reliable, and at $299 represents the price point where the "it costs more than the gun" objection disappears for most buyers.</p>

<p>There is a correct way to run a carry red dot and most people are doing it wrong. The zero matters more on a carry gun than on a range gun. A 10-yard zero on a pistol red dot creates a usable point of aim from contact distance out to 25 yards with minimal hold-over adjustment. Co-witness your irons so that if the dot dies, your point of aim is identical. And run at least 500 rounds with any optic-gun combination before trusting it for carry.</p>

<h2>What Comes Next</h2>
<p>The market is about to fragment further upward. The PDW (Personal Defense Weapon) concept — pioneered by Flux Defense with the P365 Raider and the SIG P320 AXG Flux Legion — is moving from tactical novelty to mainstream product category. PSA's X9 concept and B&T's Gen2 MP9 signal that manufacturers believe there is a civilian market for ultra-compact, high-capacity pistol-caliber platforms that occupy the space between a pistol and a PCC. I think they are right, and I think 2027 will be the year those products go mainstream.</p>

<p><strong>DownRange Bottom Line:</strong> If you are carrying a first-generation micro-compact without an optic cut, you are one generation behind. The P365 XL, Hellcat Pro, and Glock 43X MOS represent three different expressions of the same excellence. Pick based on your trigger preference and support your choice with proper training.</p>
    `,
  },
  {
    slug:        'gun-prices-tariffs-2026',
    title:       'The Tariff Tax on Your Next Gun Purchase — What\'s Coming and How to Buy Smart',
    subtitle:    'Persistent inflation, steel tariffs, and import restrictions are creating the first real price surge in the firearms market since 2020. Here is what to buy before it gets worse.',
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    date:        'May 8, 2026',
    readTime:    '10 min read',
    category:    'MARKET',
    catColor:    '#22c55e',
    featured:    false,
    img:         'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1400&h=900&fit=crop',
    excerpt:     'If you enjoyed the buyer\'s market of 2025, the window is closing. Steel tariffs, import restrictions, and rising manufacturing costs are converging to push firearms prices up across the board in the second half of 2026.',
    tags:        ['Market', 'Pricing', 'Tariffs', 'Buying Guide'],
    body: `
<h2>The 2025 Buyer's Market Is Over</h2>
<p>Let me be direct with you: if you have been watching prices and thinking about making a purchase, the time to buy is now. In 2025, we experienced one of the best buyer's markets in firearms history. Post-pandemic demand normalization, inventory saturation, and genuine competition between manufacturers produced MSRP cuts across categories that I had never seen before. Glocks that retailed for $649 in 2022 were selling for $499. SIG P320s hit $449 during sales. Bulk 9mm dropped below 16 cents per round. It was a golden window, and for many gun owners, I am afraid it is closing.</p>

<p>The forces now pushing prices upward are structural, not temporary. Understanding them will help you make smarter decisions about what to buy and when.</p>

<h2>The Three Forces Raising Prices</h2>
<p>First: <strong>steel tariffs</strong>. The current administration's tariff structure on imported steel and aluminum directly impacts every domestic firearm manufacturer. Barrels, receivers, slides — all of the metal components that go into a modern pistol or rifle are subject to these input cost increases. Smith & Wesson's parent company reported a 14% increase in materials costs in their most recent quarterly filing. Ruger disclosed similar pressures. These costs flow downstream to the consumer within two to three production cycles, meaning the pricing pressure that manufacturers are absorbing today will appear on dealer shelves by late 2026 and throughout 2027.</p>

<p>Second: <strong>import restrictions</strong>. The 7.62x39mm ammunition situation is the clearest example. Sanctions affecting Russian and Belarusian import channels have tightened the supply of the most popular steel-case training ammunition for AK platforms. Tula and Wolf are effectively off the market. Brass-case 7.62x39 from domestic manufacturers and Eastern European alternatives is filling the gap — at roughly 40% higher per-round cost. This is not a blip. The geopolitical situation driving these restrictions shows no signs of resolution.</p>

<p>Third: <strong>labor and logistics inflation</strong>. The manufacturing cost increases that every American industry has absorbed over the past three years have not fully translated into firearm prices yet because of the 2025 inventory glut. As that glut clears — and dealer sell-through data suggests it is clearing faster than expected — the full inflationary pressure will hit. My estimate, based on conversations with three major distributor representatives, is an 8-to-15% price increase on most production firearms by Q1 2027.</p>

<h2>What to Buy Before Prices Rise</h2>
<p>The smart play right now is to focus on high-value items that will see the largest percentage increases and where current inventory is still strong. Based on the supply data I track:</p>

<ul>
<li><strong>AK-platform rifles:</strong> The PSA GF3 AK-47 at $799 and the WASR-10 at $899 represent the last generation of pricing before import-chain pressures fully hit. These will be $1,100+ guns by mid-2027.</li>
<li><strong>9mm bulk ammunition:</strong> 1,000-round bricks of Federal, Blazer, or PMC are at or near historic lows. This is training ammo — buy 3,000 to 5,000 rounds now if you have storage space.</li>
<li><strong>7.62x39 steel-case:</strong> Buy whatever you can find at current prices. The supply situation will not improve in the near term.</li>
<li><strong>Production pistols from Sig and Glock:</strong> Both companies are absorbing margin pressure rather than raising prices heading into their peak selling season. That ends after summer.</li>
</ul>

<h2>Where to Shop Smart Right Now</h2>
<p>PSA (Palmetto State Armory) continues to offer the most aggressive pricing on AR-platform rifles — their PA-15 series represents genuinely excellent value at current prices. For handguns, Lucky Gunner and GrabAGun are consistently running the tightest margins on Glock and SIG inventory. For AK platforms, AIM Surplus has the best combination of price and QC reputation.</p>

<p><strong>DownRange Bottom Line:</strong> The 2025 buyer's market was a once-in-a-decade opportunity. We are in its final months. If you have purchases on your list — a primary carry gun, a home defense rifle, a training ammo supply — buy in the next 90 days. Prices will be materially higher by this time next year.</p>
    `,
  },
  {
    slug:        'bruen-standard-state-battles-2026',
    title:       'The Bruen Battles of 2026 — Every Court Fight That Will Determine Your Rights',
    subtitle:    'Four years after NYSRPA v. Bruen, lower courts are still fighting about what it means. Here are the cases that matter most right now.',
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    date:        'April 30, 2026',
    readTime:    '14 min read',
    category:    'LAW',
    catColor:    '#3b82f6',
    featured:    false,
    img:         'https://images.unsplash.com/photo-1554115176-72a380f824c7?w=1400&h=900&fit=crop',
    excerpt:     'The Supreme Court\'s 2022 Bruen decision established a text-and-history standard for evaluating gun laws. But the lower courts are still brawling over what that standard requires — and the outcomes of these fights will determine the practical scope of your Second Amendment rights for decades.',
    tags:        ['2A', 'Bruen', 'SCOTUS', 'Legal', 'Constitutional'],
    body: `
<h2>What Bruen Actually Said — and Why It Still Matters</h2>
<p>It has been nearly four years since the Supreme Court handed down <em>New York State Rifle & Pistol Association v. Bruen</em>, and I want to start by being clear about what the decision actually established, because the political and media coverage has consistently gotten it wrong in both directions.</p>

<p>Justice Thomas's majority opinion did two things of enormous consequence. First, it rejected the means-ends balancing test that most lower courts had been using since <em>Heller</em> — the "intermediate scrutiny" analysis that allowed courts to uphold gun regulations as long as they were reasonably related to an important government interest. That test is gone. Second, it established a new standard: a firearms regulation is presumptively unconstitutional unless the government can demonstrate that it is "consistent with the Nation's historical tradition of firearm regulation." If the government cannot identify a historical analogue from the Founding era or the Reconstruction era, the law falls.</p>

<p>The question that has consumed four years of litigation: what counts as a sufficient historical analogue? That fight is not over. In fact, it is intensifying.</p>

<h2>The Cases That Matter Most in 2026</h2>
<p>I track every significant 2A case at the circuit court level. These are the ones that will have the most direct impact on gun owners' practical rights:</p>

<p><strong>Viramontes v. Cook County (7th Circuit):</strong> This is the assault weapons ban case. The 7th Circuit is considering whether Illinois's assault weapons prohibition — enacted in January 2023 under the PICA statute — can survive Bruen scrutiny. The government is arguing that semi-automatic rifles with certain features are analogous to "dangerous and unusual weapons" that were historically unprotected. The plaintiffs, represented by FPC, argue that the AR-15 is the quintessential "arm in common use" and cannot be prohibited under any historical framework. A ruling is expected by late 2026, and a cert petition to SCOTUS is almost certain regardless of outcome.</p>

<p><strong>Oregon Firearms Federation v. Kotek (9th Circuit):</strong> Oregon's Measure 114 imposed a permitting requirement for firearm transfers and banned magazines over 10 rounds. The 9th Circuit is evaluating the magazine restriction specifically under Bruen. A ruling striking down the 10-round limit would create a circuit split with states like California and New York that have similar laws — which almost certainly forces SCOTUS review.</p>

<p><strong>Antonyuk v. Chiumento (2nd Circuit):</strong> New York's response to Bruen was the Concealed Carry Improvement Act, which created a maze of "sensitive locations" where carry is prohibited, imposed extensive permitting requirements, and restricted carry on private property without explicit permission. The CCIA has been partially enjoined and repeatedly litigated. The 2nd Circuit's ultimate ruling will determine how much of it survives — and how much of New York effectively becomes a carry-free zone in practice.</p>

<h2>The Sensitive Places Doctrine — The Next Frontier</h2>
<p>One of the most consequential unresolved Bruen questions involves what locations can be designated as "sensitive places" where the government can restrict carry even from lawful permit holders. The Supreme Court in Bruen acknowledged that some sensitive locations — schools, government buildings, legislative chambers — have historical precedent for carry restrictions. But how far can that principle extend?</p>

<p>New York has attempted to declare essentially all public commercial spaces, transit, and entertainment venues as sensitive. Hawaii's Attorney General filed a brief arguing the entire state should be treated as sensitive. Several circuits are now resolving conflicting answers to this question. If the 2nd or 9th Circuit allows sweeping sensitive-location designations to stand, red-state gun owners should expect their blue-state counterparts to advocate for similar expansions. This is the most live doctrinal question in 2A law right now.</p>

<h2>What Gun Owners Should Do</h2>
<p>First, stay informed. The DownRange Laws section tracks every active case with real-time status updates. Second, support the litigation organizations actually fighting these battles: the Firearms Policy Coalition, the Second Amendment Foundation, and Gun Owners of America Legal Defense Fund are the three that are producing the most impactful results in federal courts right now. Third, know your state's current legal landscape. The interactive DownRange state hub maps current law, pending legislation, and active litigation by state.</p>

<p><strong>DownRange Bottom Line:</strong> Bruen was a landmark victory but it is not a finished victory. The lower courts are still determining its scope through years of litigation. The cases above represent the most consequential live fights for your rights. Follow them, support the advocates fighting them, and understand that the constitutional landscape you navigate today is being shaped in real time by judges who will be on the bench for decades.</p>
    `,
  },
  {
    slug:        'red-dot-carry-guide-2026',
    title:       'How to Actually Run a Red Dot on Your Carry Gun — The No-BS Guide',
    subtitle:    'Everyone is mounting optics on carry guns now. Most people are doing it wrong. Here is the complete framework for making it work.',
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    date:        'April 22, 2026',
    readTime:    '12 min read',
    category:    'TRAINING',
    catColor:    '#22c55e',
    featured:    false,
    img:         '/img/photos/rifle.jpg',
    excerpt:     'A pistol red dot is one of the most significant performance upgrades available to a defensive shooter. It is also one of the most commonly installed and least effectively used pieces of equipment in civilian carry today.',
    tags:        ['Training', 'Red Dot', 'Optics', 'EDC', 'Carry'],
    body: `
<h2>The Problem With How Most People Are Doing This</h2>
<p>Walk through any defensive pistol training course today and you will see a consistent pattern: attendees with $700 pistols wearing $350 red dot optics who cannot find the dot from the holster. They present the gun, the dot is not in their field of view, they tilt the muzzle down to find it, and they lose two full seconds on what should be a faster-than-irons draw-to-first-shot sequence. A red dot is making them <em>slower</em> because nobody taught them the correct way to run it.</p>

<p>I have been running pistol red dots in competition and defensive contexts for seven years. I have watched the technology mature from early EoTech pistol optics that fogged in humidity to the current generation of Holosun, Trijicon, and Sig Romeo products that are genuinely carry-reliable. And I have watched the adoption curve outpace the training curriculum by a significant margin. This guide exists to close that gap.</p>

<h2>Selecting the Right Optic — Non-Negotiable Requirements</h2>
<p>For a carry gun, there is a very short list of optics I will recommend without hesitation. Every other optic has to prove itself to me personally before I will tell someone to carry it. The non-negotiables are: sealed housing (not exposed emitter), documented reliability through 10,000+ rounds, and a battery life that does not require weekly management.</p>

<ul>
<li><strong>Holosun EPS Carry:</strong> This is my default recommendation for most shooters. Fully enclosed emitter, 50,000+ hour battery life on the lowest setting, solar failsafe. At $299, it eliminates every reliability concern at a price that does not exceed the cost of most carry guns it goes on. The Holosun 507K is the alternative at $249 if budget is a concern.</li>
<li><strong>Trijicon RMR Type 2:</strong> The benchmark for absolute durability. Military-spec, proven in conditions that no carry application will replicate. At $699 it is expensive but it is also the optic that set the standard everything else is measured against. If you want the best regardless of price, this is it.</li>
<li><strong>Sig Romeo Zero Elite:</strong> The best integrated option if you are running a Sig P365 or similar. The Elite version addressed the durability concerns of the original Romeo Zero with an improved housing and emitter. Purpose-built for micro-compact slides.</li>
</ul>

<h2>The Zero — This Is Where Most People Get It Wrong</h2>
<p>A 25-yard zero on a carry pistol is a mistake. I want to explain why because it contradicts conventional rifle zeroing logic that many shooters have internalized.</p>

<p>A pistol red dot zero creates a point-of-aim / point-of-impact relationship across a range band. Your bullet follows a trajectory arc; your dot is a flat reference point. At your zero distance, they intersect. Inside your zero, the bullet is below your point of aim. Beyond your zero, it is above. For defensive use — where 80% of shootings occur inside 7 yards and 95% inside 21 yards — you want a zero that keeps you on target across that entire range band without requiring hold adjustment.</p>

<p>A <strong>10-yard zero</strong> accomplishes this. At 10 yards, the dot and the bullet meet. At contact distance (3 feet), you are hitting approximately 1.5 inches low — still within a vital zone on any realistic target. At 25 yards, you are hitting approximately 1.8 inches high — still within a vital zone. You can aim at center of mass from 0 to 25 yards with no adjustment. This is the carry zero. Use it.</p>

<h2>Building the Draw-to-Dot Presentation</h2>
<p>This is the perishable skill that most optic users neglect. Finding the dot consistently on the draw requires building a mechanical presentation that puts the gun in the exact same position every single time. Here is the training protocol I use and teach:</p>

<p>Start with dry fire. From a low-ready position, bring the gun to eye level at a consistent distance from your face — approximately 12 to 14 inches for most shooters. The dot should appear in your window without searching. If you cannot find it from low-ready in under 0.5 seconds of dry fire practice, you are not ready to rely on the optic. Dry fire this transition 50 to 100 times before you ever take it to the range.</p>

<p>At the range, time your draw-to-first-shot with a shot timer. A proficient iron-sight draw-to-first-shot is roughly 1.5 seconds from concealment. With a red dot, your goal is 1.3 seconds or faster — the optic should be making you faster, not slower. If you are slower with the red dot than with irons, you need more dry fire reps on the presentation before continuing live fire training.</p>

<h2>Co-Witnessing and Backup Iron Sights</h2>
<p>Your iron sights must be usable if the optic fails. This is not theoretical — batteries die, lenses crack, electronics fail. Suppressor-height iron sights (tall enough to see over the body of the optic) give you a clean sight picture through the optic body if the dot is dead. Ameriglo, Trijicon, and Dawson Precision all make excellent suppressor-height carry sights for most platforms. Budget $60 to $120 for this addition. It is not optional if you are carrying the gun defensively.</p>

<p><strong>DownRange Bottom Line:</strong> A pistol red dot will make you a more accurate, faster shooter — but only after you have put in the dry fire reps to find the dot consistently and the live fire work to confirm your zero and build the presentation. Most people skip the work and wonder why the optic is not helping them. Do the work. The performance improvement is real and significant.</p>
    `,
  },
  {
    slug:        'atf-pistol-brace-rule-two-years',
    title:       'The ATF Pistol Brace Rule: Two Years Later',
    subtitle:    'Where the legal battles actually stand and what it means for brace owners today.',
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    date:        'March 15, 2026',
    readTime:    '8 min read',
    category:    'LAW',
    catColor:    '#3b82f6',
    featured:    false,
    img:         '/img/photos/blog-bruen-law.jpg',
    excerpt:     'Two years after the ATF pistol brace rule dropped, enforcement is paralyzed, courts keep blocking it, and the post-Loper Bright landscape makes a revival unlikely.',
    tags:        ['ATF', 'Pistol Brace', 'NFA', 'Second Amendment', 'Legal'],
    body: `<h2>Where Things Actually Stand</h2>
<p>Two years ago the ATF dropped the pistol brace rule and the firearms community lost its mind — some people registered, some didn't, and a whole lot of people got confused about what was actually legal. The rule classified pistols with stabilizing braces as SBRs under the NFA if they met length thresholds, giving owners four options: register, remove the brace, convert to a rifle, or surrender.</p>
<p>The practical effect: millions of AR pistols, MPX pistols, B&amp;T APC9Ks, and similar firearms that had been legal for years were suddenly in a gray zone.</p>
<h2>The Court Battles That Followed</h2>
<p>The Fifth Circuit struck down the rule in <strong>Mock v. Garland</strong>, finding the ATF exceeded its statutory authority. The Supreme Court's <em>Loper Bright</em> decision in 2024 removed Chevron deference — courts no longer automatically defer to agency interpretations of ambiguous statutes. Federal enforcement has been paralyzed by multiple circuit splits and zero political appetite for pushing forward.</p>
<h2>What This Means for Gun Owners Right Now</h2>
<p>If you own a braced pistol, here's the honest read:</p>
<ul>
<li><strong>Registered SBRs from the amnesty window:</strong> Fully compliant. No issue.</li>
<li><strong>Fifth Circuit states (TX, LA, MS):</strong> Mock v. Garland gives you strong legal protection.</li>
<li><strong>Everywhere else:</strong> Rule technically on the books but enforcement is negligible.</li>
<li><strong>New purchases:</strong> The market kept moving. PSA, SB Tactical, Gear Head Works never stopped.</li>
</ul>
<h2>The Bruen Complication</h2>
<p>The Bruen text-and-history standard creates additional headwinds for ATF rules that impose NFA-style restrictions on previously lawful items. Multiple district courts have noted that brace regulations struggle under Bruen scrutiny. Combined with Loper Bright, the regulatory path for reviving aggressive brace enforcement is increasingly narrow.</p>
<h2>DownRange Bottom Line</h2>
<p>The ATF pistol brace rule is in effective legal limbo and has been for two years. Enforcement is minimal, courts keep blocking it, and the post-Loper Bright landscape makes this kind of agency overreach harder to sustain long-term. If you registered during the amnesty window, great. If you didn't and you're in the Fifth Circuit, you're in a defensible position. This legal battle isn't over, but the rule is functionally toothless right now — and the trend is moving in gun owners' favor.</p>`,
  },
  {
    slug:        'home-defense-basics',
    title:       'Home Defense Basics: The Setup That Actually Works',
    subtitle:    'The gun is the easy part. The plan, the lighting, and the communication are what determine the outcome.',
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    date:        'April 2, 2026',
    readTime:    '9 min read',
    category:    'TRAINING',
    catColor:    '#22c55e',
    featured:    false,
    img:         '/img/photos/shotgun.jpg',
    excerpt:     'Most home defense advice is written by people who have never had to think through what happens at 2 AM when someone is in your house. The gun is the easy part.',
    tags:        ['Home Defense', 'Shotgun', 'Training', 'Storage', 'Ammunition'],
    body: `<h2>The Right Gun for Home Defense</h2>
<p>Most home defense advice online is written by people who've never thought through what happens at 2 AM with their heart rate at 160. The gun is the easy part. The plan, the communication, the lighting — that's what determines whether you come out of a home invasion scenario intact.</p>
<p>The right home defense firearm is a <strong>12 gauge pump shotgun</strong> or a <strong>9mm pistol-caliber carbine</strong> — not your EDC pistol, and definitely not an AR with a 16-inch barrel you can't maneuver around a corner.</p>
<ul>
<li><strong>Mossberg 590 or Remington 870:</strong> Reliable, mechanically simple under stress, devastating with 00 buckshot. The Mossberg tang safety beats Remington's trigger guard placement for stressed manipulation.</li>
<li><strong>Ruger PC Carbine or CZ Scorpion EVO:</strong> Lower recoil, 30-round capacity, easy light mounting, takes Glock mags if you're already in that ecosystem.</li>
<li><strong>Dedicated handgun:</strong> If you use a pistol, attach a Streamlight TLR-1 or SureFire X300 permanently. Your off-hand needs to stay free for doors, phones, and kids.</li>
</ul>
<p>A weapon-mounted light is not optional. You cannot shoot what you cannot identify. This is non-negotiable.</p>
<h2>The Plan Comes Before the Gun</h2>
<p>Every person in your house needs to know what to do when something goes wrong. Write it down. Practice it. In most residential scenarios, the correct move is to fortify in your bedroom, call 911, and wait. You are not legally obligated to clear your house — and your exposure increases significantly when you leave a defensible position and move toward an unknown threat.</p>
<p>Set up verbal communication signals so family members don't get shot rounding a corner unexpectedly. Something like "gun out, get behind me" eliminates the ambiguity.</p>
<h2>Ammunition Selection</h2>
<p>For shotgun: <strong>Federal FliteControl 00 Buck</strong> or Hornady Critical Defense 00 Buck. Federal FliteControl keeps patterns tight at hallway distances — relevant for 10-15 yard shots. For 9mm: <strong>Federal HST 147gr</strong> or Speer Gold Dot 147gr. Both have extensive ballistic test data showing consistent expansion and adequate penetration through heavy clothing.</p>
<p>Avoid birdshot for home defense. It doesn't penetrate adequately through clothing at typical indoor distances, regardless of what you've heard on YouTube.</p>
<h2>Staging and Storage With Kids in the House</h2>
<p>The bedside gun needs to be accessible to you and inaccessible to children. A <strong>GunVault MiniVault</strong> or Hornady RAPiD Safe with biometric or RFID access gets you there. Not a combination lock. Not a trigger lock. Something you can open in under three seconds in the dark with your hands shaking.</p>
<h2>DownRange Bottom Line</h2>
<p>Get a weapon light if you don't have one — that's the single most impactful upgrade you can make right now. Run Federal HST or Speer Gold Dot. Build a plan your household has actually talked through. Lock it down from kids. The gun is the last tool in the chain. The plan, the communication, the awareness, the locked doors come first. Do the work that actually makes you safer rather than just buying more gear.</p>`,
  },
  {
    slug:        'owb-to-aiwb-carry-switch',
    title:       'OWB to AIWB: What Nobody Tells You About the Switch',
    subtitle:    'I made the switch after four years of OWB carry. It took three months before AIWB felt natural.',
    author:      'DJ Cavalcanti',
    authorRole:  'Founder, DownRange',
    date:        'May 10, 2026',
    readTime:    '7 min read',
    category:    'TRAINING',
    catColor:    '#22c55e',
    featured:    false,
    img:         '/img/photos/blog-edc-pistol.jpg',
    excerpt:     'I carried OWB for four years before switching to AIWB. I thought it would be a quick adjustment — same gun, different holster. I was wrong.',
    tags:        ['AIWB', 'OWB', 'Concealed Carry', 'EDC', 'Holsters', 'Training'],
    body: `<h2>Why Most People Make the Switch</h2>
<p>I carried OWB for four years before switching to AIWB. I thought it would be a quick adjustment — same gun, different holster. Three months later I was still adjusting. Five months in, my draw was finally faster than it had been at 4 o'clock. Here's what I wish someone had told me upfront.</p>
<p>The primary driver for most people is concealment. OWB at 3-4 o'clock with a full-size gun requires a cover garment long enough to cover the entire holster. In warm weather or business environments, that's a real limitation. AIWB at the appendix puts the gun in front of your hip where your body's natural taper makes concealment easier under a shorter cover garment.</p>
<p>The secondary reason is draw speed. Competition shooters figured this out a decade ago — a well-set-up AIWB position puts the gun where the draw arc is shorter and more mechanically efficient.</p>
<h2>The Gear That Actually Works</h2>
<p>Not all AIWB holsters are equal. I've run a <strong>Tenicor Certum3</strong>, a <strong>PHLster Floodlight</strong> with a TLR-7A on a Glock 19, and a <strong>JM Custom Kydex</strong> setup. Here's where I landed:</p>
<ul>
<li><strong>PHLster Enigma:</strong> For carrying without a belt — gym clothes, athletic wear — the Enigma chassis changes what's possible. A Shield Plus under jogger shorts disappears completely.</li>
<li><strong>Tenicor Certum3:</strong> Best zero-drama option for Glock 19/17. Adjustable ride height, excellent retention, smooth re-holster.</li>
<li><strong>JMCK holsters:</strong> Competitive quality at a lower price point. Good starting place if you're not sure you're committed to the position yet.</li>
</ul>
<p>The holster <strong>claw</strong> is non-negotiable. It levers the grip inward when your belt pulls the bottom of the holster away from your body. Without a claw, you're printing. With a claw, the gun disappears.</p>
<h2>The Draw Stroke Is Different — Practice It</h2>
<p>OWB is a lateral movement: hand sweeps back to the hip, establishes grip, draws forward. AIWB is different. The hand comes down to the front of the hip, you establish grip with the muzzle still angled down, then clear the holster with a push-forward motion before rotating up to target.</p>
<p>The safety concern people raise — pointing the gun at yourself during the draw — is real but manageable with training. Keep your trigger finger outside the guard until the muzzle is on target. Use a holster with a solid trigger guard covering. Run 500 dry reps before going live in the new position.</p>
<h2>What Actually Changes Day to Day</h2>
<p>Sitting in a car at true 12 o'clock is uncomfortable for most people until they dial in position and ride height. Most AIWB carriers settle between 12 and 1:30 depending on body type. A quality 1.5-inch belt makes a significant difference — the Kore Essentials or Vedder ProDraw distribute weight better than a casual belt. Pants fit matters more than it did OWB. You may need to size up one in the waist or choose pants with more room in the front.</p>
<h2>DownRange Bottom Line</h2>
<p>AIWB is worth the transition for concealment and draw efficiency, but give yourself a realistic timeline: three months to comfortable, five to six before your draw exceeds your old OWB performance. Get a holster with a claw. Run a compact gun — Glock 19, Shield Plus, Hellcat. Get a quality belt. Do your dry fire reps before you carry live. The switch pays off, but it's a skill acquisition, not a gear swap.</p>`,
  },
]


// ── Helpers ────────────────────────────────────────────────────────────────────

function readingMins(body) {
  return Math.max(1, Math.round((body || '').replace(/<[^>]+>/g,'').split(/\s+/).length / 200))
}

const CATS = [
  { label: 'All',        val: null },
  { label: 'Opinion',    val: 'OPINION' },
  { label: 'Analysis',   val: 'ANALYSIS' },
  { label: 'Law',        val: 'LAW' },
  { label: 'Training',   val: 'TRAINING' },
  { label: 'Market',     val: 'MARKET' },
  { label: 'Industry',   val: 'INDUSTRY' },
]

const SORT_OPTS = [
  { label: '📅 Newest', val: 'newest' },
  { label: '🕰 Oldest', val: 'oldest' },
]

const PER_PAGE = 12

// Convert a Sanity blog post to the same shape as a static BLOG_POSTS entry
function normalizeSanityPost(p) {
  return {
    slug:       p.slug?.current || p.slug || '',
    title:      p.title || '',
    subtitle:   p.excerpt || '',
    author:     p.author || 'DJ Cavalcanti',
    authorRole: 'DownRange Editorial',
    date:       p.publishedAt ? new Date(p.publishedAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : (p._createdAt ? new Date(p._createdAt).toLocaleDateString('en-US', { month:'long', day:'numeric', year:'numeric' }) : ''),
    readTime:   typeof p.readTime === 'number' ? p.readTime + ' min read' : (p.readTime || '8 min read'),
    category:   (p.category || 'general').toUpperCase(),
    catColor:   '#C8922A',
    featured:   false,
    img:        p.imageUrl || '/img/photos/blog-edc-pistol.jpg',
    excerpt:    p.excerpt || '',
    tags:       p.tags || [],
    body:       p.body || '',
    fromSanity: true,
  }
}

export default async function BlogPage({ searchParams }) {
  const cat    = searchParams?.cat   || null
  const sort   = searchParams?.sort  || 'newest'
  const search = searchParams?.q     || null
  const page   = Math.max(1, parseInt(searchParams?.page || '1'))

  // Fetch Sanity blog posts (published ones)
  const { posts: sanityPosts, total, pages } = await fetchBlogPostsPaginated({
    page, perPage: PER_PAGE, category: cat, search, sort
  }).catch(() => ({ posts: [], total: 0, pages: 1 }))

  const sanityNormalized = sanityPosts.map(normalizeSanityPost)

  // Static posts as seed/fallback (filter by cat/search client-side for page 1 without Sanity results)
  const staticFiltered = page === 1 && sanityNormalized.length === 0
    ? BLOG_POSTS.filter(p => {
        if (cat && p.category !== cat) return false
        if (search) {
          const q = search.toLowerCase()
          return (p.title||'').toLowerCase().includes(q) ||
                 (p.excerpt||'').toLowerCase().includes(q) ||
                 (p.tags||[]).some(t => t.toLowerCase().includes(q))
        }
        return true
      })
    : []

  // Merge: Sanity first, then static (deduplicated by slug)
  const sanitySlugSet = new Set(sanityNormalized.map(p => p.slug))
  const staticExtra   = staticFiltered.filter(p => !sanitySlugSet.has(p.slug))
  const allPosts      = [...sanityNormalized, ...staticExtra]

  const totalDisplay  = total > 0 ? total : allPosts.length
  const pagesDisplay  = total > 0 ? pages : 1

  const [featured, ...rest] = allPosts.length > 0 ? allPosts : BLOG_POSTS
  const alerts = await fetchBreakingAlerts(3).catch(() => [])

  function buildUrl(overrides) {
    const merged = { ...(cat && { cat }), ...(sort !== 'newest' && { sort }), ...(search && { q: search }), page: String(page), ...overrides }
    if (merged.page === '1') delete merged.page
    if (!merged.sort || merged.sort === 'newest') delete merged.sort
    if (!merged.cat) delete merged.cat
    if (!merged.q) delete merged.q
    const qs = new URLSearchParams(merged).toString()
    return '/blog' + (qs ? '?' + qs : '')
  }

  return (
    <>
      <Masthead />

      <style>{`
        .blog-card:hover { border-color: var(--gold) !important; transform: translateY(-2px); }
        .blog-card:hover .blog-img { transform: scale(1.03); }
        .blog-img { transition: transform 0.4s ease; }
        .blog-card { transition: border-color 0.2s, transform 0.2s; }
      `}</style>

      {/* ── HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'40%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'16vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>BLOG</div>
        </div>
        <div className="container">
          <div style={{ display:'flex', gap:8, marginBottom:16, alignItems:'center' }}>
            <span style={{ background:'var(--gold)', color:'#000', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>THE RANGE REPORT</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#475569' }}>Expert analysis · Industry commentary · Field intelligence</span>
          </div>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.6rem,5vw,3.8rem)', color:'var(--foreground)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:12 }}>
            DownRange Blog<br /><span style={{ color:'var(--gold)' }}>By DJ Cavalcanti</span>
          </h1>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#475569', lineHeight:1.7, maxWidth:520 }}>
            {totalDisplay > 0 ? totalDisplay : BLOG_POSTS.length} articles · Firearms industry analysis, legal intelligence, and buyer guidance
          </p>
        </div>
      </div>

      {/* ── STICKY NAV BAR — matches News pattern ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'stretch', overflowX:'auto' }}>
            {/* Category tabs */}
            <div style={{ display:'flex', gap:0, flex:1, overflowX:'auto' }}>
              {CATS.map(c => (
                <a key={c.val || 'all'} href={buildUrl({ cat: c.val || undefined, page: undefined })}
                  style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px',
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px',
                    borderBottom: '2px solid ' + ((cat === c.val || (!cat && !c.val)) ? 'var(--gold)' : 'transparent'),
                    color: (cat === c.val || (!cat && !c.val)) ? 'var(--gold)' : 'var(--text-dim)',
                    textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                  {c.label}
                </a>
              ))}
            </div>
            {/* Sort */}
            <div style={{ display:'flex', gap:'5px', alignItems:'center', padding:'0 8px', borderLeft:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>SORT:</span>
              {SORT_OPTS.map(({ val, label }) => (
                <a key={val} href={buildUrl({ sort: val, page: undefined })}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'4px 10px',
                    border:'1px solid var(--border)',
                    color: sort === val ? '#C8922A' : '#4B5563',
                    textDecoration:'none',
                    background: sort === val ? '#C8922A20' : 'transparent' }}>
                  {label}
                </a>
              ))}
            </div>
            {/* Search */}
            <form action="/blog" method="get" style={{ display:'flex', alignItems:'center', gap:6, padding:'0 0 0 8px', borderLeft:'1px solid var(--border)' }}>
              {cat && <input type="hidden" name="cat" value={cat} />}
              {sort && sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
              <input
                type="search" name="q"
                defaultValue={search || ''}
                placeholder="Search blog posts…"
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, background:'var(--bg)',
                  border:'1px solid var(--border)', color:'var(--text)', padding:'5px 10px', width:180, outline:'none' }}
              />
              <button type="submit" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, background:'var(--gold)', color:'#000', border:'none', padding:'6px 12px', cursor:'pointer', fontWeight:700, flexShrink:0 }}>⌕</button>
              {search && <a href={buildUrl({ q: undefined, page: undefined })} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', textDecoration:'none', flexShrink:0 }}>✕</a>}
            </form>
          </div>
        </div>
      </div>

      {/* Search context */}
      {search && (
        <div style={{ background:'rgba(200,146,42,.05)', borderBottom:'1px solid var(--border)', padding:'10px 0' }}>
          <div className="container" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#6b7280' }}>
            {allPosts.length} result{allPosts.length !== 1 ? 's' : ''} for <span style={{ color:'var(--gold)' }}>"{search}"</span>
            {' — '}<a href="/blog" style={{ color:'#6b7280' }}>Clear search</a>
          </div>
        </div>
      )}

      <div style={{ padding:'40px 0 80px' }}>
        <div className="container">

          {allPosts.length === 0 && (
            <div style={{ textAlign:'center', padding:'80px 0', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#4b5563' }}>
              {search ? 'No posts match "' + search + '"' : 'No posts yet.'}
            </div>
          )}

          {allPosts.length > 0 && (
            <>
              {/* ── FEATURED ARTICLE (only on page 1, no search) ── */}
              {page === 1 && !search && featured && (
                <Link href={'/blog/' + featured.slug} style={{ textDecoration:'none', display:'block', marginBottom:40 }} className="blog-card">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 480px', gap:0, border:'1px solid var(--border)', overflow:'hidden', borderRadius:4 }}>
                    <div style={{ padding:'40px 44px', background:'var(--bg2)', display:'flex', flexDirection:'column', justifyContent:'center' }}>
                      <div style={{ display:'flex', gap:8, marginBottom:14, alignItems:'center' }}>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, color: featured.catColor === '#C8922A' ? '#000' : '#fff', background:featured.catColor, padding:'2px 10px', letterSpacing:'0.08em' }}>
                          {featured.category}
                        </span>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569' }}>FEATURED</span>
                      </div>
                      <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.4rem', color:'var(--foreground)', letterSpacing:'0.02em', lineHeight:1, marginBottom:14 }}>
                        {featured.title}
                      </h2>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#64748b', lineHeight:1.7, marginBottom:20 }}>
                        {(featured.excerpt || featured.subtitle || '').slice(0, 200)}
                      </p>
                      <div style={{ display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <div style={{ width:32, height:32, borderRadius:'50%', background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',cursive", fontSize:14, color:'#000' }}>DJ</div>
                          <div>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--foreground)' }}>{featured.author}</div>
                            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569' }}>{featured.authorRole}</div>
                          </div>
                        </div>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#334155' }}>·</span>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#475569' }}>{featured.date}</span>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#C8922A' }}>{featured.readTime}</span>
                      </div>
                      <div style={{ marginTop:20 }}>
                        <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1rem', letterSpacing:'0.08em', color:'#000', background:'var(--gold)', padding:'8px 20px', display:'inline-block' }}>
                          READ ARTICLE →
                        </span>
                      </div>
                    </div>
                    <div style={{ overflow:'hidden', position:'relative', minHeight:420 }}>
                      <img src={featured.img} alt={featured.title} className="blog-img"
                        style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', minHeight:420 }} />
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(90deg, rgba(9,9,11,0.3) 0%, transparent 60%)' }} />
                    </div>
                  </div>
                </Link>
              )}

              {/* ── ARTICLE GRID ── */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(340px,1fr))', gap:20 }}>
                {(page === 1 && !search ? rest : allPosts).map(post => (
                  <Link key={post.slug} href={'/blog/' + post.slug} style={{ textDecoration:'none' }} className="blog-card">
                    <div style={{ border:'1px solid var(--border)', borderRadius:4, overflow:'hidden', height:'100%', display:'flex', flexDirection:'column', background:'var(--bg2)' }}>
                      <div style={{ height:220, overflow:'hidden', position:'relative' }}>
                        <img src={post.img || post.imageUrl || '/img/photos/pistol.jpg'} alt={post.title}
                          className="blog-img" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(9,9,11,0.7) 0%, transparent 60%)' }} />
                        <div style={{ position:'absolute', top:12, left:12 }}>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700,
                            color: post.catColor === '#C8922A' || post.catColor === '#22c55e' ? '#000' : '#fff',
                            background: post.catColor || '#C8922A', padding:'2px 8px', letterSpacing:'0.08em' }}>
                            {post.category}
                          </span>
                        </div>
                        <div style={{ position:'absolute', bottom:12, left:12, right:12 }}>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'rgba(255,255,255,0.5)' }}>
                            {post.date} · {post.readTime}
                          </div>
                        </div>
                      </div>
                      <div style={{ padding:'20px 22px', flex:1, display:'flex', flexDirection:'column' }}>
                        <h3 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--foreground)', letterSpacing:'0.02em', lineHeight:1.05, marginBottom:10 }}>
                          {post.title}
                        </h3>
                        <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#64748b', lineHeight:1.6, marginBottom:16, flex:1 }}>
                          {(post.excerpt || post.subtitle || '').slice(0, 140)}…
                        </p>
                        <div style={{ display:'flex', alignItems:'center', gap:8, paddingTop:12, borderTop:'1px solid rgba(30,41,59,0.5)' }}>
                          <div style={{ width:24, height:24, borderRadius:'50%', background:'var(--gold)', display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'Bebas Neue',cursive", fontSize:10, color:'#000', flexShrink:0 }}>DJ</div>
                          <div style={{ flex:1, minWidth:0 }}>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:12, fontWeight:700, color:'var(--foreground)' }}>{post.author}</div>
                          </div>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#C8922A' }}>READ →</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* ── PAGINATION ── */}
              {pagesDisplay > 1 && (
                <div style={{ padding:'40px 0 0', display:'flex', justifyContent:'center' }}>
                  <div style={{ display:'flex', gap:6, alignItems:'center', flexWrap:'wrap' }}>
                    {page > 1 && (
                      <a href={buildUrl({ page: String(page - 1) })}
                        style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 16px', border:'1px solid var(--border)', color:'var(--text)', textDecoration:'none' }}>
                        ← Prev
                      </a>
                    )}
                    {Array.from({ length: pagesDisplay }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === pagesDisplay || Math.abs(p - page) <= 2)
                      .reduce((acc, p, idx, arr) => {
                        if (idx > 0 && p - arr[idx-1] > 1) acc.push('…')
                        acc.push(p)
                        return acc
                      }, [])
                      .map((p, i) => p === '…'
                        ? <span key={'e'+i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 6px', color:'#6b7280' }}>…</span>
                        : <a key={p} href={buildUrl({ page: String(p) })}
                            style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 14px', border:'1px solid var(--border)',
                              color: p === page ? '#000' : 'var(--text)',
                              background: p === page ? 'var(--gold)' : 'transparent',
                              textDecoration:'none', fontWeight: p === page ? 700 : 400 }}>
                            {p}
                          </a>
                      )}
                    {page < pagesDisplay && (
                      <a href={buildUrl({ page: String(page + 1) })}
                        style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 16px', border:'1px solid var(--border)', color:'var(--text)', textDecoration:'none' }}>
                        Next →
                      </a>
                    )}
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', marginLeft:12 }}>
                      Page {page} of {pagesDisplay} · {totalDisplay} posts
                    </span>
                  </div>
                </div>
              )}
            </>
          )}

        </div>
      </div>

      <Footer />
    </>
  )
}
// Cache bust: 1781384777
