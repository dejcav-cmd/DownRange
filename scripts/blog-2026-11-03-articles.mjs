// Blog articles for 2026-11-03: Election Day 2A briefing + five posts built from the top October GSC queries.
// Facts come only from sources listed at the bottom of each article. No hands-on testing is claimed.

const L = (href, text) =>
  `<a href="${href}" style="color:var(--gold);text-decoration:underline;text-underline-offset:3px">${text}</a>`
const X = (href, text) =>
  `<a href="${href}" target="_blank" rel="noopener noreferrer" style="color:var(--gold);text-decoration:underline;text-underline-offset:3px">${text}</a>`
const SIGN = `<p><strong>— DJ Cavalcanti, DownRange Founder</strong></p>`

// ─────────────────────────────────────────────────────────────────────────────
const election = {
  slug: 'election-day-2026-second-amendment-state-by-state',
  title: 'Election Day 2026: What Is on the Ballot for Gun Owners, State by State',
  category: 'ANALYSIS',
  readTime: '10 min read',
  excerpt: 'Polls are open for the 2026 midterms. Here is every gun and hunting measure, Senate race and legislature that touches the Second Amendment, state by state.',
  tags: ['2026 midterms', 'Second Amendment', 'ballot measures', 'state gun laws', 'Election Day', 'NFA'],
  imagePages: [
    'https://en.wikipedia.org/wiki/File:Voters_in_Londonderry_during_the_2022_midterms.jpg',
    'https://en.wikipedia.org/wiki/File:Early_voting_at_New_Orleans_Arena,_October_2020_25.jpg',
  ],
  brand: 'Wikimedia Commons',
  body: `
<p><strong>It is Election Day, November 3, 2026, and no results are in yet.</strong> This is a map of what gun owners have riding on today's ballots, state by state: the measures voters decide directly, the Senate and governor races where firearm policy is a live issue, and the legislatures that will write the next round of laws. I am not telling you who to vote for. I am telling you what your ballot touches.</p>

<p>A note on sourcing. Several of the best summaries come from advocacy groups on both sides, so I attribute their claims and keep the spending numbers tied to the outlet that reported them. Sources are at the bottom.</p>

<h2>The short version, by state</h2>
<ul>
<li><strong>Arkansas:</strong> Issue 2 would put a fundamental right to keep and bear arms into Article 2 of the state constitution.</li>
<li><strong>Massachusetts:</strong> Question 9 asks voters to keep or repeal the state's 2024 firearms law.</li>
<li><strong>Colorado:</strong> a constitutional right to hunt, fish and harvest wildlife is on the ballot.</li>
<li><strong>Idaho:</strong> a non-binding vote on the official state gun.</li>
<li><strong>Michigan:</strong> a U.S. Senate seat, the governor's office and all 148 legislative seats.</li>
<li><strong>Texas:</strong> a U.S. Senate race with heavy NRA spending, plus a closely watched House seat.</li>
<li><strong>Ohio, Iowa, Pennsylvania, Arizona, California, Florida, Virginia, New Jersey:</strong> House and Senate races where outside gun-policy groups have put in six and seven figures.</li>
</ul>

<h2>Measures voters decide directly</h2>
<h3>Arkansas Issue 2</h3>
<p>This is a legislatively referred constitutional amendment. The Second Amendment Foundation's weekly legislative report describes it as extending the state's arms guarantee to lawful hunting, recreation and other lawful purposes, including ammunition, accessories and components, and calling the right "natural, fundamental, and individual." If voters approve it, it takes effect January 1, 2027. State constitutional text like this is what Arkansas courts read first when a future restriction gets challenged, which is why these amendments matter even in states with few restrictions on the books. See where Arkansas stands today on our ${L('/laws/AR', 'Arkansas gun laws page')}.</p>

<h3>Massachusetts Question 9</h3>
<p>Voters decide whether to uphold a 2024 law signed by Gov. Maura Healey (HB 4885). As reported by The Reload, it bans so-called ghost guns, raises the minimum age to own a semi-automatic firearm to 21, and expands who can petition for a red flag order. The Second Amendment Foundation's report adds privately made firearms and serialization, licensing, prohibited weapons and devices, and carry in specified locations. A "yes" vote keeps the law and a "no" vote repeals it. Our ${L('/laws/MA', 'Massachusetts page')} tracks the current rules.</p>

<h3>Colorado and Idaho</h3>
<p>Colorado voters face a citizen-initiated right to hunt and fish. Ballotpedia says it qualified August 20, 2026; The Reload lists it as Amendment 83 and says it would require the state to prefer hunting and fishing over other wildlife preservation and control. Idaho's ballot has a lighter question: pick the official state gun from six options (Winchester Model 1894, Winchester Model 1873, Colt Single Action Army, M1 Garand, Colt M1911 or Remington Model 700). It was created by House Bill 932, signed April 2, 2026, and the result is non-binding because the legislature must vote again to ratify it.</p>

<h2>Senate and governor races</h2>
<h3>Michigan</h3>
<p>Michigan has the most at stake in one place. The U.S. Senate race is Democrat Abdul El-Sayed against Republican Mike Rogers. The governor's race is Democrat Jocelyn Benson against Republican John James. All 148 legislative seats are up, and the NSSF notes Republicans hold the House 58–52 while Democrats hold the Senate 20–18. A four-seat net gain would flip the House; a two-seat gain would flip the Senate.</p>
<p>The NSSF, a firearm industry trade group, points to recommendations from Gov. Whitmer's Gun Violence Prevention Task Force: an "assault weapon" ban, a ban on "large capacity" magazines, a purchase age of 21, waiting periods and state retailer licensing. The NSSF says these are recommendations, not enacted law, and that the task force was reestablished in June 2026. It also reports that James has committed to signing permitless concealed carry, a claim it attributes to the Michigan Coalition for Responsible Gun Owners' PAC. On the other side, Benson is endorsed by Giffords PAC, Everytown and Moms Demand Action. The Reload reports Giffords has spent more than $1 million opposing Rogers and the NRA has spent over $104,000 on mail supporting him.</p>

<h3>Texas</h3>
<p>Republican Ken Paxton faces Democrat James Talarico for the U.S. Senate. Per The Reload, Paxton opposes federal, state and local gun-control measures, while Talarico says he supports the Second Amendment and backs measures to "stop crime before it happens." The Reload reports the NRA has spent $495,380 on TV and radio ads against Talarico, plus more than $252,000 boosting Paxton. In Congressional District 23, "guntuber" Brandon Herrera (R), who backs national concealed carry reciprocity and opposes red flag laws, is in a race The Reload says is tied in the only recent poll, which a Democratic super PAC sponsored. Read the ${L('/laws/TX', 'Texas gun laws page')}.</p>

<h3>Ohio, Iowa and South Carolina</h3>
<p>In Ohio's Senate race between Sherrod Brown (D) and Jon Husted (R), The Reload reports the NRA spent nearly $179,000 on text ads and over $300,000 on mail for Husted. In Iowa, it reports $19,684 from the NRA for Republican Ashley Hinson in her Senate race against Democrat Josh Turek. In South Carolina, Everytown has endorsed Democrat Dr. Annie Andrews in the Senate race.</p>

<h2>Where the outside money is going</h2>
<p>The Reload's October 29 reporting says gun-control groups hold a large spending advantage this cycle and describes the NRA's political operation as sharply diminished. Its House figures:</p>
<ul>
<li><strong>Iowa:</strong> Everytown has spent $2.46 million in District 1, more than $930,000 in District 3 and $450,000 in District 2.</li>
<li><strong>California District 22:</strong> Giffords has spent over $1.8 million.</li>
<li><strong>Arizona District 6:</strong> Everytown, $1.5 million.</li>
<li><strong>Pennsylvania District 8:</strong> Everytown, $1.4 million, and Giffords, more than $860,000.</li>
<li><strong>Michigan District 10:</strong> Everytown, about $2 million, and Giffords about $495,000 for Christina Hines and $472,000 against Michael Bouchard.</li>
<li><strong>Virginia District 2:</strong> Giffords, more than $920,000.</li>
<li><strong>Florida District 13:</strong> Giffords, about $857,000.</li>
<li><strong>New Jersey District 7:</strong> Giffords, more than $378,400.</li>
</ul>
<p>Treat these as snapshots as of that date. Totals change daily.</p>

<h2>The NFA and your state's suppressor and SBR laws</h2>
<p>This is the sleeper issue of the cycle. The federal $200 tax on suppressors, short-barreled rifles, short-barreled shotguns and Any Other Weapons went to $0 on January 1, 2026, under the One Big Beautiful Bill Act signed July 4, 2025. Registration, Form 1 and Form 4 paperwork, fingerprints and background checks still apply, and machine guns and destructive devices are still taxed at $200, according to FastBound's guide.</p>
<p>The Second Amendment Foundation's report says state attorneys general are now sorting out how state laws tied to the federal registration system fit with those changes. It points to Ohio AG Andy Wilson, who asked lawmakers on October 23 to reconcile state restrictions with federal changes; Mississippi AG Lynn Fitch, who says the state's suppressor statute allows voluntary Form 4 submission under current federal guidance but warns a future administration could reverse that; Montana, where legislators are pursuing repeal of restrictions tied to the federal process; and Alaska, where officials want lawmakers to settle the uncertainty. If you own or want a can or an SBR, today's legislative races in those states decide how clean the rules end up. Track wait times on our ${L('/nfa-tracker', 'NFA tracker')}.</p>

<h2>Local rules</h2>
<p>On October 28, Portland, Oregon passed Ordinance 192245 by a 12–0 vote. According to the SAF report, it removes the concealed handgun license affirmative defense in designated city-owned buildings used for official government meetings, under authority from Oregon's SB 243. A designation only takes effect after signage and online notice are posted. It is a good reminder that carry rules change at the city level, not just the state level.</p>

<h2>What happens after the polls close</h2>
<ul>
<li><strong>Arkansas:</strong> if Issue 2 passes, it takes effect January 1, 2027.</li>
<li><strong>Massachusetts:</strong> Question 9 decides whether the 2024 law stands.</li>
<li><strong>Michigan, New Jersey and Ohio:</strong> the SAF report says these legislatures remain in session through December 31, so lame-duck action is possible.</li>
<li><strong>Senate control:</strong> The Reload says Democrats need to gain four seats to take it, several in states Trump won in 2024.</li>
</ul>
<p>Look up your own state's rules on ${L('/laws/my-state', 'My State')}, compare all fifty on ${L('/laws/states', 'All 50 States')}, and follow the court side on our ${L('/laws/cases', '2A Cases Radar')}.</p>

<h2>Sources</h2>
<ul>
<li>${X('https://thereload.com/the-races-gun-owners-should-watch-on-tuesday/', 'The Reload: The Races Gun Owners Should Watch on Tuesday')} (Oct 29–30, 2026)</li>
<li>${X('https://www.thegunmag.com/grassroots-legislative-report-november-2-2026/', 'TheGunMag: Grassroots Legislative Report, November 2, 2026')}</li>
<li>${X('https://www.nssf.org/articles/michigans-2026-elections-put-gun-bans-and-second-amendment-protections-at-stake/', 'NSSF: Michigan\'s 2026 Elections Put Gun Bans and Second Amendment Protections at Stake')} (Oct 26, 2026; industry advocacy)</li>
<li>${X('https://ballotpedia.org/Firearms_policy_ballot_measures', 'Ballotpedia: Firearms policy ballot measures')} and ${X('https://ballotpedia.org/2026_ballot_measures', '2026 ballot measures')}</li>
<li>${X('https://www.fastbound.com/nfa-tax-stamp/', 'FastBound: NFA Tax Stamp (2026 Update)')}</li>
</ul>
${SIGN}
`,
}

// ─────────────────────────────────────────────────────────────────────────────
const mp7 = {
  slug: 'suppressed-mp7-sbr-what-you-can-buy-2026',
  title: 'Suppressed MP7 SBR: What a Civilian Can Actually Buy in 2026',
  category: 'LAW',
  readTime: '7 min read',
  excerpt: 'You cannot buy a new MP7, but a suppressed 4.6x30 SBR is possible. What exists, what it costs, and how NFA paperwork works now that the tax is $0.',
  tags: ['MP7', 'SBR', 'suppressor', '4.6x30', 'NFA', 'UO Arms NT7', 'HK SP7'],
  imagePages: [
    'https://www.downrangeco.com/news/potd-the-civilian-mp7-has-arrived-meet-uo-arms-nt7-sbr-6f3b94',
    'https://www.rifleconfigurator.com/articles/uo-arms-nt7-mp7-clone',
  ],
  brand: 'UO Arms',
  body: `
<p><strong>The short answer:</strong> there is no way for a private citizen to buy a new H&K MP7, but there are now two civilian routes to something shaped like one in 4.6x30mm, and both can be run suppressed. Here is what is real, what is announced and what you should check before you spend money.</p>

<h2>Why you cannot just buy an MP7</h2>
<p>The MP7 is a select-fire 4.6x30mm submachine gun. According to American Gun Trader's 2026 overview, existing MP7s are post-1986 machine guns that cannot be transferred to private citizens, and any transferable one would be speculative and likely run past $50,000. That is why most searches for a "suppressed MP7 SBR" end at the same place: a civilian semi-auto in the same cartridge, registered as an SBR, with a suppressor on top.</p>

<h2>Option one: UO Arms NT7</h2>
<p>As we reported in September, UO Arms started shipping the NT7, a civilian short-barreled rifle in 4.6x30mm modeled on the MP7. Reported details include a package under 16 inches, a roughly 9-inch barrel, a folding stock and a short rail system. It comes either as a bare receiver or as a complete build. Reported pricing starts around $2,200 for the complete package, and reported all-in cost lands between $2,800 and $3,400 once you add an optic, ammunition and paperwork. Ammunition is the real expense: that piece estimated $1.25 to $1.75 per round. Read the original ${L('/news/potd-the-civilian-mp7-has-arrived-meet-uo-arms-nt7-sbr-6f3b94', 'DownRange news report on the NT7')}.</p>
<p>One correction on that report. It cites a $200 tax stamp for the Form 1. That tax went to $0 on January 1, 2026, so the paperwork cost is now the time, not the stamp.</p>

<h2>Option two: HK SP7, announced but not here</h2>
<p>Rifle Configurator reports H&K has announced the SP7, a semi-automatic civilian MP7 in 4.6x30mm with a 7.09-inch barrel and no stock. The article says Germany's federal criminal police office (the BKA) classified it as a semi-automatic short firearm and that it still needs ATF import approval, with no firm US timeline. A dealer listing of $2,500 and a "Q4 2026" tag is described as a placeholder pre-order price, and HK USA has not confirmed pricing. Until HK USA confirms import, treat it as vapor.</p>

<h2>How the NFA part works in 2026</h2>
<ul>
<li><strong>The tax is $0</strong> for suppressors, short-barreled rifles, short-barreled shotguns and Any Other Weapons, effective January 1, 2026 (One Big Beautiful Bill Act, signed July 4, 2025).</li>
<li><strong>Registration is not gone.</strong> You still file an ATF Form 1 to build an SBR or a Form 4 to buy a registered item, with fingerprints, photos and a background check.</li>
<li><strong>An SBR and a can are two separate items</strong>, so a suppressed SBR means two approvals.</li>
</ul>
<p>Source for the tax change: FastBound's NFA guide. Check live approval times on our ${L('/nfa-tracker', 'NFA tracker')} rather than trusting any number in an article, including this one.</p>

<h2>Before you order</h2>
<ul>
<li><strong>State law first.</strong> Some states bar SBRs or suppressors outright. Check your state on ${L('/laws/my-state', 'My State')}.</li>
<li><strong>Match the can to the cartridge.</strong> Confirm the suppressor's rating covers 4.6x30mm and your mounting interface before you file.</li>
<li><strong>Budget for ammo.</strong> At $1.25 or more a round, 4.6x30 is a range-day luxury.</li>
</ul>
<p>My take: the NT7 is the only one of these you can actually order today, and it is a fair answer to a long-running request from gun owners. I would still wait for independent test results on reliability before putting a four-figure build on the Form 1 line.</p>

<h2>Sources</h2>
<ul>
<li>${X('https://americanguntrader.com/blog/mp7-history-specs-legal-status-and-civilian-alternatives-2026', 'American Gun Trader: MP7 history, specs, legal status and civilian alternatives')}</li>
<li>${X('https://www.rifleconfigurator.com/articles/hk-sp7-civilian-mp7', 'Rifle Configurator: HK SP7, the civilian MP7')} (updated Oct 29, 2026)</li>
<li>${X('https://www.fastbound.com/nfa-tax-stamp/', 'FastBound: NFA Tax Stamp (2026 Update)')}</li>
</ul>
${SIGN}
`,
}

// ─────────────────────────────────────────────────────────────────────────────
const ltaw = {
  slug: 'sig-mcx-ltaw-price-specs-release-2026',
  title: 'SIG MCX LTAW: Price, Specs and What We Know About the Release',
  category: 'MARKET',
  readTime: '6 min read',
  excerpt: 'SIG announced the MCX LTAW, a .300 Blackout rebuild of its special-ops Low Visibility Assault Weapon. Expected pricing runs about $2,700 to $3,700.',
  tags: ['SIG Sauer', 'MCX LTAW', '300 Blackout', 'SBR', 'suppressor', 'SIG NEXT 2026'],
  imagePages: [
    'https://soldiersystems.net/2026/09/30/sig-sauer-ltaw/',
    'https://www.pewpewtactical.com/new-product-highlight-sig-sauer-mxc-ltaw/',
  ],
  brand: 'SIG Sauer',
  body: `
<p><strong>The MCX LTAW is SIG's civilian version of its special-operations Low Visibility Assault Weapon, built on the newer MCX LT platform in .300 Blackout.</strong> It was announced at SIG NEXT in New Hampshire in late September 2026. Pricing is still an estimate and release is still unconfirmed. Here is what the early coverage says.</p>

<h2>Specs reported so far</h2>
<ul>
<li><strong>Caliber:</strong> .300 Blackout, with a suppressor-ready gas setup. Soldier Systems says the handguard carries sub- and supersonic gas regulator markings.</li>
<li><strong>Barrel:</strong> 6.75 inches.</li>
<li><strong>Weight:</strong> about 7 pounds.</li>
<li><strong>Length:</strong> about 31 inches per Pew Pew Tactical and 33 inches per Soldier Systems, so confirm against SIG's final spec sheet. Folded, both sources point to roughly 22.3 inches.</li>
<li><strong>Capacity:</strong> 30+1, with one third-generation Magpul magazine in the box, per Pew Pew Tactical.</li>
<li><strong>Controls:</strong> fully ambidextrous, a two-stage match trigger and an angled grip.</li>
<li><strong>Handguard:</strong> SD handguard with an integrated heat shield and M-LOK-compatible rail, with a barricade stop, hand stop, QD sling mount and light mount.</li>
</ul>

<h2>Three configurations</h2>
<p>SIG is showing the LTAW in three forms. Both outlets describe a pistol with a brace and a non-functional "training tube" in place of a suppressor, an SBR with a stock and the same training tube, and a "double-stamp" package that includes a real SIG SQX suppressor and a Romeo4T-Pro red dot, built as an SBR with a can.</p>

<h2>Price and availability</h2>
<p>Pew Pew Tactical, citing SIG representatives at SIG NEXT, reports estimates of about $2,700 for the pistol and SBR, and about $3,700 for the suppressed SBR. These are estimates, not an MSRP. Soldier Systems says orders open by the end of 2026, initially as RSR exclusives for the first year. It also notes that access to some variants may depend on possible future changes to the National Firearms Act.</p>

<h2>What the paperwork looks like</h2>
<p>The pistol configuration is not an NFA item as sold. The SBR and the suppressed package are. The $200 tax stamp is now $0 for suppressors and SBRs (effective January 1, 2026), but you still file Form 1 or Form 4 and wait for approval. Check current waits on our ${L('/nfa-tracker', 'NFA tracker')}, and your state's rules on ${L('/laws/my-state', 'My State')}.</p>

<h2>My read</h2>
<p>A 7-pound, 22-inch folded .300 Blackout built around a can is a serious tool and a niche one. At the expected prices it is a premium purchase compared with an AR pistol you could build, and the real question is whether SIG's integrated suppressor system earns the premium. I would wait for the first independent range reports and a real MSRP before getting excited about a pre-order.</p>

<h2>Sources</h2>
<ul>
<li>${X('https://soldiersystems.net/2026/09/30/sig-sauer-ltaw/', 'Soldier Systems: SIG Sauer LTAW')} (Sept 30, 2026)</li>
<li>${X('https://www.pewpewtactical.com/new-product-highlight-sig-sauer-mxc-ltaw/', 'Pew Pew Tactical: New Product Highlight, SIG Sauer MCX-LTAW')} (Oct 5, 2026)</li>
<li>${X('https://www.fastbound.com/nfa-tax-stamp/', 'FastBound: NFA Tax Stamp (2026 Update)')}</li>
</ul>
${SIGN}
`,
}

// ─────────────────────────────────────────────────────────────────────────────
const poths = {
  slug: 'parish-optics-poths-thermal-scope-specs-price-2026',
  title: 'Parish Optics POTHS Thermal Scope: Specs, Price and Who It Fits',
  category: 'MARKET',
  readTime: '6 min read',
  excerpt: 'The Parish Optics POTHS is a 384x288 thermal hunting scope at $917.76. Specs, what reviewers found, the trade-offs and what to check before you buy.',
  tags: ['Parish Optics', 'POTHS', 'thermal scope', 'hunting optics', 'thermal imaging'],
  imagePages: ['https://potnvg.com/product/nightvisionthermal/poths-parish-optics-hunting-scope/'],
  brand: 'Parish Optics',
  body: `
<p><strong>The POTHS is a thermal hunting scope priced under $1,000.</strong> Parish Optics lists it at $917.76. That puts a 3–9x thermal in range for hunters who have been priced out of the category. We covered the launch in our ${L('/news/thermal-on-a-realistic-budget-the-parish-optics-poths-5e4c65', 'news report on the POTHS')}. This post collects the specs and what the first review found.</p>

<h2>Specs</h2>
<ul>
<li><strong>Sensor:</strong> 384×288, 12µm, uncooled</li>
<li><strong>Refresh rate:</strong> 50 Hz</li>
<li><strong>Magnification:</strong> 3–9x (3x base, digital zoom to 9x) with a 35mm objective</li>
<li><strong>Display:</strong> AMOLED. Parish's spec table says 1024×768, while the description text says 1280×720, so the listing is inconsistent</li>
<li><strong>Power:</strong> one 18650 lithium battery</li>
<li><strong>Weight and size:</strong> 660 g (23.3 oz); 335 × 80 × 35 mm</li>
<li><strong>Weather rating:</strong> IPX7</li>
<li><strong>Warranty:</strong> three years</li>
</ul>

<h2>What the review found</h2>
<p>Shooting News Weekly published a review on October 8, 2026. The reviewer found the 3x-to-9x range more than adequate for scanning and then zooming on a target, and called the image quality "plenty effective" while noting it is not class-leading. The scope identified animals and people, brush and ground detail, a fresh hit on a steel plate, and impacts through a cardboard target. The package includes a spare battery, charger, printed manual and soft case; the scope has two zero profiles, a microSD slot and USB-C. The reviewer valued the spare battery because runtime is short.</p>

<h2>The trade-offs</h2>
<ul>
<li><strong>Resolution:</strong> 384×288 is modest next to higher-priced thermal riflescopes.</li>
<li><strong>Missing specs:</strong> no NETD or battery runtime figure is listed, and the reviewer found no downloadable manual on Parish's website.</li>
<li><strong>Origin:</strong> made in China, per the review.</li>
<li><strong>Learning curve:</strong> the reviewer noted the controls take time to learn.</li>
</ul>

<h2>Check your hunting regulations</h2>
<p>Rules on using thermal optics for hunting vary by state and by species. Check your state wildlife agency's current regulations before you buy, and see our state pages on ${L('/laws/my-state', 'My State')} for firearm rules.</p>

<h2>My read</h2>
<p>The question with any budget thermal is whether it is good enough to do the job you bought it for. For hogs, coyotes and varmint work inside a couple hundred yards, this resolution class is common at this price. If you want to identify game at distance or run it as a long-range scope, spend more. At $917.76 with a spare battery and a three-year warranty, the POTHS is a sound entry point, and I would still read the manual-and-support complaint twice before ordering.</p>

<h2>Sources</h2>
<ul>
<li>${X('https://potnvg.com/product/nightvisionthermal/poths-parish-optics-hunting-scope/', 'Parish Optics: POTHS product page')}</li>
<li>${X('https://www.shootingnewsweekly.com/optics/gear-review-parish-optics-poths-thermal-hunting-scope/', 'Shooting News Weekly: Gear Review, Parish Optics POTHS')} (Oct 8, 2026)</li>
</ul>
${SIGN}
`,
}

// ─────────────────────────────────────────────────────────────────────────────
const extar = {
  slug: 'extar-ep9-mdb-roller-delayed-what-we-know-2026',
  title: 'Extar EP9 MDB: Price, Release Date and What We Actually Know',
  category: 'MARKET',
  readTime: '5 min read',
  excerpt: 'Extar revealed a roller-delayed EP9 MDB in 9mm and an EP45 MDB in .45 ACP. No price or ship date yet. Here is what is confirmed and what is not.',
  tags: ['Extar', 'EP9 MDB', 'EP45 MDB', 'roller-delayed', 'pistol caliber carbine', 'GunCon 2026'],
  imagePages: [
    'https://www.thefirearmblog.com/blog/modern-delayed-blowback-the-new-extar-ep9-mdb-44829253',
    'https://www.rifleconfigurator.com/articles/extar-ep9-mdb-roller-delayed-launch',
    'https://www.usa-gun-shop.com/extar-mdb-roller-delayed-ep9-ep45/',
    'https://gunsgearhq.com/extar-ep9-mdb-ep45-roller-delayed-launch/',
    'https://www.downrangeco.com/news/modern-delayed-blowback-the-new-extar-ep9-mdb-25f5df',
  ],
  brand: 'Extar',
  body: `
<p><strong>Extar has not announced a price or ship date for the EP9 MDB.</strong> That is the honest answer to the most-searched question about it, and it is as of early November 2026. What exists is a July reveal at GunCon 2026 in Niles, Ohio, and a short list of confirmed specs. Our original coverage is here: ${L('/news/modern-delayed-blowback-the-new-extar-ep9-mdb-25f5df', 'Extar introduces the EP9 MDB')}.</p>

<h2>What is confirmed</h2>
<ul>
<li><strong>Two models:</strong> the EP9 MDB in 9x19mm and the EP45 MDB in .45 ACP. "MDB" stands for Modern Delayed Blowback.</li>
<li><strong>Action:</strong> roller-delayed blowback, replacing the direct blowback system on the original EP9 and EP45.</li>
<li><strong>Weight:</strong> 3.75 lb for the EP9 MDB and 4.35 lb for the EP45 MDB, per Guns & Gear HQ.</li>
<li><strong>Magazines:</strong> Glock-pattern magazines and magwells.</li>
<li><strong>Other features:</strong> M-LOK handguards, threaded barrels and AR-style controls.</li>
</ul>

<h2>What is not announced</h2>
<ul>
<li><strong>Price.</strong> The original EP9 sold for $449 to $469 through Extar's web store, and Guns & Gear HQ speculates a price increase is likely without confirming one.</li>
<li><strong>Ship date.</strong> Guns & Gear HQ says Extar has not confirmed one. GunPartPicker's September 24 guide says the same.</li>
<li><strong>Barrel length options.</strong> None published.</li>
<li><strong>Service life.</strong> GunPartPicker points out that roller-delayed guns have wearing parts that blowback guns do not, and that no service life figures exist for these models.</li>
</ul>

<h2>How to buy one when it ships</h2>
<p>Extar sells direct to consumers, and both sources expect pricing and availability to appear first on extarusa.com. Extar's guns are sold as large-format pistols, so the legal configuration you choose matters. Putting a stock on a pistol-configured gun with a short barrel can make it an NFA item, so check your state and the ATF's current guidance on ${L('/laws/my-state', 'My State')} and our ${L('/nfa-tracker', 'NFA tracker')} first.</p>

<h2>My read</h2>
<p>A roller-delayed budget 9mm is a sensible idea, since delayed designs can run smoother and cleaner than straight blowback. The risk is the one GunPartPicker names: a first-generation design with no published wear data. If Extar holds the price near the original EP9 and publishes round-count testing, it is worth watching. Until then it is an announcement.</p>

<h2>Sources</h2>
<ul>
<li>${X('https://gunsgearhq.com/extar-ep9-mdb-ep45-roller-delayed-launch/', 'Guns & Gear HQ: Extar Launches EP9 MDB and EP45 MDB')} (July 2, 2026)</li>
<li>${X('https://gunpartpicker.net/guides/extar-mdb-roller-delayed', 'GunPartPicker: Extar EP9 MDB Roller Delayed, What Is Known')} (Sept 24, 2026)</li>
<li>${X('https://www.thefirearmblog.com/blog/modern-delayed-blowback-the-new-extar-ep9-mdb-44829253', 'The Firearm Blog: Modern Delayed Blowback, the New Extar EP9 MDB')} (July 1, 2026)</li>
</ul>
${SIGN}
`,
}

// ─────────────────────────────────────────────────────────────────────────────
const bolt = {
  slug: '300-blackout-bolt-action-pistol-guide-2026',
  title: '300 Blackout Bolt-Action Pistol: What It Is and What the Q Mini Fix Costs',
  category: 'MARKET',
  readTime: '6 min read',
  excerpt: 'A bolt-action .300 Blackout pistol is a niche suppressor host. We break down how the Q Mini Fix is configured, its $3,600 price and the legal basics.',
  tags: ['300 Blackout', 'bolt action pistol', 'Q Mini Fix', 'suppressor host', 'NFA'],
  imagePages: [
    'https://www.primaryarms.com/q-mini-fix-bolt-action-300-blackout-pistol-w-brace-8in-black',
    'https://rainierarms.com/q-llc-mini-fix-300blk-bolt-action-pistol-w-brace-8',
  ],
  brand: 'Q',
  body: `
<p><strong>A bolt-action .300 Blackout pistol is a small, quiet, slow-firing handgun built around a suppressor.</strong> The best-known example is the Q Mini Fix. People search for it because it solves a narrow problem: a short, light, accurate platform that runs subsonic ammunition without gas-system noise.</p>

<h2>The Q Mini Fix, as listed</h2>
<p>Primary Arms lists the Q Mini Fix bolt-action .300 Blackout pistol at $3,600, in stock at the time of our check. The listed specs:</p>
<ul>
<li><strong>Barrel:</strong> 8-inch stainless, tapered, 1:5 twist, 5/8x24 threaded with a Cherry Bomb muzzle brake</li>
<li><strong>Weight:</strong> 3 lb 14 oz</li>
<li><strong>Action:</strong> short-action bolt with a 45-degree short-throw bolt handle</li>
<li><strong>Magazine:</strong> one 10-round magazine, compatible with AR-15/M4 magazines</li>
<li><strong>Brace:</strong> sold with a stabilizing brace, per the product title</li>
</ul>
<p>The retailer notes it is regulated as a handgun: it ships only to a Federal Firearm License holder, and the buyer's FFL and the invoice must be sent to the seller. The listing is also filed under bolt-action rifles even though the title says pistol, so confirm the classification with your dealer before ordering.</p>

<h2>Why a bolt gun in .300 Blackout</h2>
<ul>
<li><strong>Quiet by design.</strong> With no gas system cycling, a suppressed bolt gun with subsonic ammunition removes most of the mechanical noise that a semi-auto adds.</li>
<li><strong>Short and light.</strong> An 8-inch barrel and under 4 pounds makes a compact package.</li>
<li><strong>Parts you already own.</strong> Taking AR magazines is a practical bonus if you shoot ARs.</li>
</ul>
<p>The trade-offs are plain: single-shot cycling speed, a 1:5 twist that is tuned for heavier subsonic loads, and a price that is more than most complete AR pistols.</p>

<h2>The legal basics</h2>
<ul>
<li><strong>As a pistol,</strong> it is a regular firearm, not an NFA item. Put a stock on a pistol-configured gun with a barrel under 16 inches and you have built an unregistered SBR, which is a federal problem. Keep it a pistol or register it first.</li>
<li><strong>A suppressor</strong> is an NFA item. The tax is $0 since January 1, 2026, but you still file ATF Form 4 and wait for approval (FastBound's 2026 guide). Check live waits on our ${L('/nfa-tracker', 'NFA tracker')}.</li>
<li><strong>State law varies.</strong> Look yours up on ${L('/laws/my-state', 'My State')}.</li>
</ul>

<h2>My read</h2>
<p>At $3,600, this is a boutique purchase for someone who already owns a suppressor and wants a quiet, compact range or varmint gun. If you want the same caliber for general use, a semi-auto .300 Blackout pistol costs a fraction of that. The Mini Fix earns its price only if quiet and compact are the whole point.</p>

<h2>Sources</h2>
<ul>
<li>${X('https://www.primaryarms.com/q-mini-fix-bolt-action-300-blackout-pistol-w-brace-8in-black', 'Primary Arms: Q Mini Fix Bolt Action 300 Blackout Pistol w/ Brace, 8in')}</li>
<li>${X('https://www.fastbound.com/nfa-tax-stamp/', 'FastBound: NFA Tax Stamp (2026 Update)')}</li>
</ul>
${SIGN}
`,
}

// Order matters: the election piece goes last so it is the newest post.
export const ARTICLES = [bolt, extar, poths, ltaw, mp7, election]
