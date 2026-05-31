import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import Link from 'next/link'


const AUTHOR = { name: 'DJ Cavalcanti', title: 'Founder, DownRange' }

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

  'home-defense-basics': {
    title: 'Home Defense Basics: What You Actually Need',
    subtitle: 'A practical guide to protecting your home — the right firearm, a workable plan, the right storage, and what Hollywood gets completely wrong.',
    category: 'Home Defense', readTime: '11 min read', date: 'June 2, 2026',
    heroImage: '/img/photos/pistol.jpg',
    tags: ['Home Defense', 'Shotgun', 'AR-15', 'Plan', 'Beginner'],
    intro: 'Most people buy a gun for home defense, put it in a nightstand drawer, and consider the problem solved. It isn\'t.\n\nA firearm is one component of a home defense system. Without a plan, without the right storage setup, without knowing your house\'s fatal funnels and safe rooms, the gun is as likely to create problems as solve them. This guide gives you the complete picture — from choosing the right platform to building a plan your whole household can execute under stress.',
    sections: [
      { h: 'The Home Defense Firearm: What Actually Works', body: 'Three platforms dominate serious home defense discussions: the 12-gauge shotgun, the pistol-caliber carbine, and the AR-15 in 5.56 or .300 Blackout. Each has genuine advantages.\n\nThe 12-gauge shotgun (Mossberg 590A1, $649; Remington 870, $449) delivers devastating terminal performance at household distances. At 10 yards, a load of 00 buckshot puts 8–9 .33-caliber projectiles on target simultaneously. The Mossberg 590A1 passed US military MIL-SPEC testing — it is essentially indestructible. Downsides: capacity is limited (typically 6–8+1), reloading under stress is slow, and overpenetration through drywall is a real concern with most buckshot loads.\n\nThe AR-15 in 5.56 NATO (.223) surprises most beginners: modern 5.56 hollowpoints actually penetrate fewer interior walls than 9mm or 12-gauge buckshot, because the lightweight bullet destabilizes rapidly on impact. At $700–$1,200 (PSA, Aero Precision, BCM), a budget AR-15 with a 30-round magazine and weapon light is a formidable home defense tool. The downside is length — maneuvering a 16" barrel rifle through a hallway is awkward.\n\nThe pistol is what most people end up with, and that\'s fine. A compact or full-size 9mm (Glock 19, SIG P320, S&W M&P) with a weapon light and 15–17 rounds of quality hollowpoints handles home defense competently. Its real advantage: it\'s the same gun you\'ll practice with regularly, and skill matters more than platform.', image: '/img/photos/rifle.jpg' },
      { h: 'The Weapon Light: Non-Negotiable', body: 'A home defense firearm without a weapon light is incomplete. Full stop.\n\nMost home invasions happen at night or in low-light conditions. You cannot shoot what you cannot identify. Firing at an unidentified shape in a dark hallway has killed family members returning home late, children getting water at 2am, and pets. Before you can justify pulling the trigger, you must positively identify the threat.\n\nFor pistols: the Streamlight TLR-1 HL ($130) and Surefire X300U ($300) are the industry standards. Both deliver 1,000+ lumens. For rifles and shotguns: the Surefire Scout ($280) or Cloud Defensive OWL ($290) mount to the rail and provide hands-free illumination.\n\nThe technique matters too. Don\'t hold the light on continuously as you clear — you become a target. Use short activations to gather information, then move. But always, always, identify before you fire.' },
      { h: 'Your Home Defense Plan', body: 'The gun is the last resort. The plan comes first.\n\nStep one: identify your safe room. This is typically the master bedroom or wherever children sleep. The safe room is where everyone retreats during a home invasion — not where you investigate. Your job is to get your family into the safe room, lock the door, call 911, and wait. The goal is never to clear your house like a SWAT team; it\'s to protect your family until police arrive.\n\nStep two: identify the fatal funnels. Every doorway and hallway is a fatal funnel — the attacker must pass through it, and you control the other side. You do not need to be the aggressor. Position yourself in the safe room behind cover (a solid dresser, a wall corner), call out a warning, and let the intruder make the next decision.\n\nStep three: establish communication. Everyone in the household needs to know the plan. Who calls 911? What\'s the code word? Where do children go? A plan that only exists in your head is not a plan. Practice it twice a year, including a lights-out walkthrough of your house so everyone knows the layout in the dark.\n\nStep four: know your backstop. Every round you fire has a destination. Know what\'s behind every wall in your home. This knowledge shapes where you position yourself — never put your family members in the direction you\'re prepared to shoot.', image: '/img/photos/pistol.jpg' },
      { h: 'Storage: Accessible But Secure', body: 'The classic home defense storage problem: if your gun is locked in a 500-pound gun safe, it\'s useless when you hear glass breaking at 3am. If it\'s loose in a nightstand drawer, it\'s accessible to children, visitors, and thieves.\n\nThe solution is a dedicated bedside quick-access safe. The best options for 2026:\n\n• Hornady RAPiD Safe (biometric + RFID + keypad, $150–$200) — opens in under 2 seconds with any method. The RFID wristband lets you access it in total darkness without fumbling.\n• Fort Knox Handgun Vault (simplex mechanical, $180) — no batteries to die, no electronics to fail. Four-button mechanical code you can operate by feel in the dark.\n• Vaultek VT20i (biometric + Bluetooth, $170) — premium option with phone integration for access logs.\n\nMount the safe to your bed frame or nightstand with the included hardware. An unsecured quick-access safe can be carried out by a thief and opened at leisure. Bolted down, it provides real security.\n\nIf you have children in the home, the bedside safe isn\'t enough. Long guns and secondary handguns go in a full rifle safe (Liberty, American Security, Fort Knox — budget $800–$2,500 for something serious). The bedside gun is the only exception, and only because it\'s in a secured quick-access container.' },
      { h: 'Ammunition Selection for Home Defense', body: 'For home defense, you want hollowpoint ammunition in your defensive caliber. Hollowpoints expand on impact, transferring energy to the target and reducing penetration through walls compared to ball (FMJ) ammunition.\n\nThe proven performers in 2026:\n• 9mm: Federal HST 124gr +P ($30/50 rounds), Speer Gold Dot 124gr ($28/50), Hornady Critical Defense 115gr ($25/25)\n• .40 S&W: Federal HST 180gr, Speer Gold Dot 180gr\n• .45 ACP: Federal HST 230gr +P, Hornady Critical Duty 220gr\n• 12-gauge: Federal FliteControl 00 Buckshot ($2/round) — the pattern control on this load is exceptional, keeping all 8 pellets on a human-sized target to 25 yards\n• 5.56: Federal Fusion 62gr, Hornady TAP 75gr — both fragment reliably and reduce overpenetration concerns\n\nCritically: test your defensive ammunition in your specific firearm. Run at least 50–100 rounds through it to confirm reliable feeding and function before you trust your life to it. Not all guns like all ammo — confirm compatibility before it matters.', image: '/img/photos/pistol.jpg' }
    ],
    keyTakeaways: ['A firearm is one component of a home defense system — the plan matters more than the platform', 'Weapon light is non-negotiable: you cannot shoot what you cannot identify', 'Retreat to a safe room and call 911 — clearing your house is the last resort, not the first instinct', 'Quick-access bedside safe (biometric or mechanical) solves the accessibility vs. security problem', 'Use hollowpoint ammunition tested in your specific firearm — never carry untested defensive ammo'],
  },
  'safe-storage-guide-beginners': {
    title: 'Safe Storage 101: Keeping Your Guns Secure and Accessible',
    subtitle: 'How to prevent theft, accidents, and unauthorized access while keeping your defensive firearm ready when seconds count.',
    category: 'Safe Storage', readTime: '9 min read', date: 'June 5, 2026',
    heroImage: '/img/photos/pistol.jpg',
    tags: ['Safe Storage', 'Gun Safe', 'Biometric', 'Children', 'Theft Prevention'],
    intro: 'Owning a firearm comes with a legal and moral obligation to store it responsibly. In most states, if a child accesses your unsecured firearm and causes harm, you face criminal liability. Even in states without storage laws, the moral weight is obvious.\n\nBut storage isn\'t just about preventing tragedy — it\'s about preventing theft. Guns stolen from homes are the primary source of illegal firearms on the street. Responsible storage keeps your firearms out of criminal hands and protects your family simultaneously. Here\'s how to do it without sacrificing access when you actually need the gun.',
    sections: [
      { h: 'The Two-Tier Storage System', body: 'Every responsible gun owner needs a two-tier storage solution:\n\nTier 1 — Quick-access safe: Your one defensive firearm that must be accessible within seconds. Lives beside your bed. Secured with biometric, RFID, or fast mechanical code. Children cannot access it, but you can in the dark while half-asleep.\n\nTier 2 — Full gun safe: Everything else. Rifles, shotguns, secondary handguns, ammunition, documents. Requires deliberate opening with a combination or key. Located somewhere not obvious to a burglar — not the master bedroom closet (first place checked), ideally in a basement or bolted to a concrete floor.\n\nDon\'t try to solve both problems with one solution. A 500-pound gun safe is terrible for emergency access. A biometric box is terrible for securing a collection. Use both.', image: '/img/photos/pistol.jpg' },
      { h: 'Quick-Access Safes: What to Buy', body: 'For 2026, these are the best quick-access options by category:\n\nBest overall — Hornady RAPiD Safe 2700 ($200): Opens via biometric fingerprint, RFID bracelet, RFID sticker (hide under nightstand), or keypad. Holds a full-size pistol plus two spare magazines. The RFID bracelet on your wrist means you can open it in complete darkness, half-asleep, without looking. Mounts to furniture or wall.\n\nBest mechanical (no batteries) — Fort Knox PB1 Pistol Box ($175): Simplex mechanical code — four buttons you press in sequence. Batteries never die. The code is operable by feel alone. Simplex locks are fast with practice (under 3 seconds). Downside: one code, no access logs.\n\nBest budget — Vaultek Slider ($100): Good biometric at a lower price point. Smaller footprint. Fine for a compact carry gun.\n\nAll quick-access safes should be physically secured — bolt them to the bed frame, nightstand frame, or wall stud. An unsecured quick-access safe can be grabbed by a burglar or curious teenager and opened offline. Two bolts and 10 minutes of installation eliminates this risk.' },
      { h: 'Full Gun Safes: What Size and Grade You Actually Need', body: 'The gun safe industry is full of misleading specifications. \'Fire-rated to 1,200°F for 30 minutes\' sounds impressive but most house fires burn at 1,100°F for under 20 minutes — minimal protection. \'Anti-pry door bolts\' mean nothing if the body of the safe bends with a crowbar.\n\nWhat actually matters: body steel gauge (14-gauge minimum, 10-gauge for serious security), anchor capability (bolts to floor or wall), and relocking devices (secondary locking if main lock is drilled).\n\nRecommendations by budget:\n• Under $400: Stack-On Total Defense (14-gauge, adequate for most homeowners)\n• $400–$800: Liberty Safe Centurion 24 (12-gauge steel, real fire protection, solid reputation)\n• $800–$2,000: American Security BF Series (10-gauge steel, UL Residential Security Container rated, the best under $2K)\n• Over $2,000: Fort Knox Defender, AMSEC U.S. Series (commercial grade, true burglary resistance)\n\nSizing: most buyers underestimate how many firearms they\'ll eventually own. Buy one size larger than you think you need. A safe you outgrow in two years is money wasted.\n\nLocation matters as much as the safe itself. A safe that takes two people and an appliance dolly to move is effectively immovable. Bolt it to a concrete floor in a basement or utility room. Avoid master bedroom closets — it\'s the first place burglars look and the last place police check.', image: '/img/photos/pistol.jpg' },
      { h: 'Children in the Home: Additional Considerations', body: 'If you have children, storage discipline becomes your highest-stakes responsibility. Children are curious. \'Curiosity-resistant\' storage is not a concept — only \'curiosity-proof\' works here.\n\nThe four rules for families:\n1. No loaded firearms outside a secured container, ever — the only exception is the defensive gun currently in use (on your body, or in the bedside quick-access safe)\n2. Educate, don\'t just secure — the Eddie Eagle program from the NRA teaches children to stop, don\'t touch, run away, and tell an adult if they find a gun. Education and mechanical security together are far more effective than either alone\n3. Know where your children\'s friends\' parents store firearms — your child may encounter an unsecured gun at a friend\'s home\n4. Teach children that firearms are tools, not toys — demystification reduces obsession\n\nFor teenagers who\'ve gone through firearms safety training, consider a controlled introduction to shooting under supervision. Teenagers who\'ve fired a gun under proper supervision are less likely to make catastrophically bad decisions if they find one unsupervised.' }
    ],
    keyTakeaways: ['Two-tier system: quick-access bedside safe for your defensive gun, full safe for everything else', 'Bolt your quick-access safe to furniture — an unsecured box can be taken and opened offline', 'Full safes: 14-gauge steel minimum, anchor to floor, avoid master bedroom closet', 'Children in the home require education + mechanical security — both, not either', 'The only \'accessible\' gun is one on your body or in a secured quick-access container'],
  },
  'ammo-guide-beginners': {
    title: 'Ammunition Explained: What to Buy and Why',
    subtitle: 'Calibers, grain weights, hollow points vs FMJ, and how to stop overpaying at the gun counter.',
    category: 'Ammunition', readTime: '10 min read', date: 'June 9, 2026',
    heroImage: '/img/photos/pistol.jpg',
    tags: ['Ammo', '9mm', 'Hollow Point', 'FMJ', 'Caliber Guide'],
    intro: 'Walk into any gun store and you\'ll face an entire wall of ammunition options. Same caliber, dozens of SKUs, prices ranging from 15 cents to $2 per round. The marketing language — \'Critical Defense\', \'Defender\', \'Gold Dot\', \'HST\' — tells you almost nothing useful.\n\nHere\'s the framework that makes it simple: two purposes, two ammo types. Training ammo is cheap, range-friendly full metal jacket (FMJ). Defensive ammo is hollowpoint, reliably expands on impact, and lives in your gun for actual use. The rest is details.',
    sections: [
      { h: 'FMJ vs. Hollowpoint: The Core Distinction', body: 'Full Metal Jacket (FMJ) — also called ball ammunition — has a lead core fully enclosed in a copper or brass jacket. The bullet does not expand on impact. It maintains its shape, penetrates deeply, and exits the target. FMJ is cheap to manufacture ($0.15–$0.35/round for 9mm in 2026), reliable in virtually all firearms, and produces consistent performance. Use it for all training and range sessions.\n\nHollowpoint (HP) ammunition has a cavity in the nose. On impact with soft tissue, hydraulic pressure causes the bullet to expand, mushrooming to 1.5–2x its original diameter. This expansion transfers energy more efficiently to the target, increases the wound channel, and slows the bullet — significantly reducing the risk of overpenetration through walls. Quality hollowpoints cost $0.50–$1.50/round. Keep them loaded in your defensive firearm.\n\nThe reason you don\'t train with hollowpoints is purely economic — running 500 rounds of Federal HST at $1/round for a training session is $500 vs. $75 with FMJ. Your skill development is identical. Train with FMJ, carry hollowpoints.', image: '/img/photos/pistol.jpg' },
      { h: 'What \'Grain\' Means and Why It Matters', body: 'Grain (abbreviated \'gr\') is a unit of weight — 1 grain = 0.0648 grams. For a given caliber, heavier bullets (more grains) travel slower but carry more momentum. Lighter bullets travel faster but have less mass. The tradeoff is terminal performance vs. recoil and trajectory.\n\nFor 9mm Luger, the common weights are:\n• 115 gr — lightest, highest velocity (~1,180 fps), flattest trajectory, least recoil. Good for smaller guns where slide mass is limited.\n• 124 gr — the industry sweet spot. Balanced velocity (~1,100 fps), excellent terminal performance from quality hollowpoints, reliable expansion in most platforms.\n• 147 gr — heaviest subsonic 9mm. Slower (~950 fps), quieter (naturally subsonic), heavier recoil impulse. Preferred for suppressed use and some defensive situations where penetration is prioritized.\n\nFor most new gun owners: buy 124 gr FMJ for training and 124 gr hollowpoint (Federal HST, Speer Gold Dot, or Hornady Critical Duty) for carry. That\'s it. The nuance between 115 and 124 matters far less than practicing regularly.', image: '/img/photos/pistol.jpg' },
      { h: 'Best Defensive Ammo by Caliber (2026)', body: 'These recommendations are based on FBI ballistic testing protocols, law enforcement adoption, and documented real-world terminal performance:\n\n9mm Luger — Federal HST 124gr ($32/50): The benchmark. Consistent mushroom, reliable expansion through common barriers (auto glass, denim, drywall). Used by the FBI and most major metro police departments. Also excellent: Speer Gold Dot 124gr ($30/50), Hornady Critical Duty 135gr.\n\n.40 S&W — Speer Gold Dot 180gr ($36/50): Largely being phased out by agencies moving back to 9mm. If you have a .40, Gold Dot or Federal HST 180gr are your best options.\n\n.45 ACP — Federal HST 230gr Standard Pressure ($38/50): At the caliber\'s natural pressure, HST expands reliably and achieves excellent FBI test results without the increased recoil of +P loads.\n\n.380 ACP — Hornady Critical Defense 90gr ($28/25): The .380 is the most performance-sensitive caliber — bullet design matters enormously. Critical Defense and Speer Gold Dot Short Barrel are the only two options I\'d recommend in this caliber.\n\n5.56/.223 (rifle) — Federal Fusion 62gr ($25/20) or Hornady TAP 75gr ($30/20): Both fragment reliably, achieving excellent terminal performance while actually overpenetrating fewer walls than 9mm or buckshot.' },
      { h: 'Where to Buy Ammo and How to Stop Overpaying', body: 'The gun store counter is the most expensive place to buy ammo. You\'re paying for convenience and immediate availability. During normal supply conditions, use these sources instead:\n\nBulk online retailers — Ammoseek.com aggregates pricing from all major online retailers in real time. For 9mm FMJ (training ammo), you should be paying $0.15–$0.22/round in 2026 bought in 500–1,000 round cases from Lucky Gunner, Ammo.com, SGAmmo, or Sportsman\'s Guide.\n\nBig box stores — Walmart, Cabela\'s, Bass Pro, Academy Sports. Often the best local price, especially on .22 LR and bulk pistol ammo. Prices reset weekly.\n\nGun shows — Inconsistent. Can be excellent deals or 50% over market. Know Ammoseek prices before you go.\n\nStorage: buy in bulk when prices are low. 9mm FMJ has a shelf life measured in decades when stored in a temperature-controlled environment with low humidity. A 1,000-round case costs the same per round as 50-round boxes and removes the logistics of frequent small purchases.\n\nFor defensive ammo specifically: buy two boxes (100 rounds) — run 50 rounds through your specific gun to confirm reliability, keep 50 rounds loaded and in reserve. Replace annually if unused.' }
    ],
    keyTakeaways: ['FMJ for training, hollowpoints for carry — the distinction is simple and the savings are real', '124gr is the 9mm sweet spot for defensive use — Federal HST and Speer Gold Dot are the benchmarks', 'Buy training ammo in bulk online using Ammoseek.com — gun counter prices are a 40-60% premium', 'Always function-test your defensive hollowpoints in your specific firearm before trusting your life to them', 'Properly stored ammunition lasts decades — buying in bulk at low prices is smart financial planning'],
  },
  'shooting-range-first-visit': {
    title: 'Your First Time at a Shooting Range: What to Expect',
    subtitle: 'Range rules, etiquette, what to bring, what not to do, and how to make the most of your first live-fire session.',
    category: 'Getting Started', readTime: '7 min read', date: 'June 12, 2026',
    heroImage: '/img/photos/rifle.jpg',
    tags: ['Range', 'Beginner', 'Safety', 'Etiquette', 'First Time'],
    intro: 'Shooting ranges have specific rules and culture. Violating them ranges from embarrassing to genuinely dangerous. The good news: the rules are simple, consistent across most ranges, and make complete sense once you understand why they exist.\n\nThis guide covers indoor range protocol, which applies to 90% of first visits. Outdoor ranges and gun clubs operate similarly with minor variations. If you\'re going to an outdoor range, read the posted rules when you arrive — they vary more widely.',
    sections: [
      { h: 'What to Bring', body: 'Eye protection (shooting glasses) — mandatory at every range, no exceptions. Standard safety glasses or prescription glasses work; the range may have loaners but they\'re typically scratched and uncomfortable. Buy a pair of Wiley X or Pyramex shooting glasses for $15–$30 before your first visit.\n\nEar protection — also mandatory, always. You have two options: foam earplugs ($1–$5, effective, disposable) or earmuffs ($20–$150). For a first visit, buy a pair of Howard Leight Impact Sport electronic earmuffs ($50–$70). They suppress dangerous noise while amplifying quiet sounds — you can have a conversation normally while wearing them, which makes instruction easier. Your hearing doesn\'t regenerate. Protect it every time.\n\nAmmunition — most ranges allow you to bring your own. Buy from the source list in our ammo guide. Some ranges sell ammo at a premium at the counter; ranges often prohibit steel-case ammo (it damages steel targets) — check the range\'s website before buying bulk steel case.\n\nYour firearm — if you own one, bring it unloaded in a case. All firearms must be cased when entering and leaving the range. Some ranges require a trigger lock as well; call ahead.\n\nID — most ranges require government-issued ID. Some require you to be 21 for handguns (federal standard for retail purchase, many ranges apply it to range use).' },
      { h: 'Range Commands and Ceasefire Protocol', body: 'Understanding range commands is the most important safety knowledge for a first visit:\n\n\'CEASE FIRE\' — the most important phrase on any range. When you hear it from anyone — rangemaster, staff, another shooter — stop shooting immediately, finger off the trigger, point the muzzle downrange. A ceasefire is called when someone needs to go downrange (to check or change targets, retrieve equipment, or handle a safety situation). Never argue about a ceasefire call.\n\n\'RANGE IS HOT\' — firing is permitted. Treat all firearms as loaded.\n\n\'RANGE IS COLD\' — do not fire. This is when you may go downrange. All firearms must be unloaded, actions open, and set on the bench or in their case during a cold range.\n\n\'MAKE SAFE\' — unload your firearm, show the range officer the empty chamber.\n\nAt most indoor ranges, the rangemaster controls the ceasefire on a fixed schedule (every 15–20 minutes). You\'ll hear an announcement, a buzzer, or both. Stop shooting when it\'s called — even if you\'re in the middle of a string — and wait for the \'range is hot\' signal before resuming.', image: '/img/photos/rifle.jpg' },
      { h: 'Etiquette: How Not to Stand Out for the Wrong Reasons', body: 'Experienced shooters will notice your muzzle discipline and trigger discipline immediately. They will not comment (usually) but they will form opinions. Follow these rules and you\'ll be welcomed as someone who knows what they\'re doing:\n\nNever sweep anyone — the muzzle never points at any person, ever. This is a hard rule. When handling your firearm, be conscious of where the muzzle is at all times. If you need to point it at the ceiling or the floor to be safe, do that.\n\nKeep the action open when not shooting — at the bench, firearm unloaded with slide locked back or cylinder open tells everyone around you the gun is safe.\n\nDon\'t touch anyone else\'s firearm without explicit invitation — and ask before picking up firearms for sale or display in the gun store portion of the range.\n\nLimit conversation while shooting — most ranges have a noise level that makes conversation difficult anyway, but the shooting line is not a social area. Save the debrief for the lounge or parking lot.\n\nClean up your brass — pick up your spent casings unless the range explicitly states they collect brass (some do, for resale). Leave your lane cleaner than you found it.' },
      { h: 'What to Work On Your First Session', body: 'Keep it simple. Your first range session has one objective: get comfortable with the fundamentals in a live-fire environment.\n\nStart at 7 yards (21 feet) — this is the standard defensive shooting distance and a reasonable accuracy benchmark for a new shooter. If you\'re shooting a rented firearm, 7 yards exposes real grip and trigger issues without the frustration of trying to be precise at long distance before the basics are solid.\n\nFocus on these in order:\n1. Safe handling — everything covered in the four rules, applied in real time\n2. Grip — high on the backstrap, support hand thumb pointing forward, not crossed behind the slide\n3. Sight alignment — front sight clear, target and rear sight slightly blurry\n4. Trigger press — smooth rearward pressure until the shot breaks, no anticipating the shot\n\nDon\'t try to shoot fast. Speed is a byproduct of consistency, and consistency takes repetition. One hundred rounds of deliberate, focused practice at 7 yards builds more skill than 100 rounds of blasting quickly at any distance. Accuracy first, always.' }
    ],
    keyTakeaways: ['Bring your own eye and ear protection — spend $70 on Howard Leight electronic muffs and keep them', 'CEASE FIRE means stop immediately, every time, no matter what — it\'s the most important range command', 'Muzzle discipline and trigger discipline are what experienced shooters notice about you first', 'Start at 7 yards your first session — master the fundamentals before worrying about distance or speed', 'Leave your lane clean and observe the cold range protocol when going downrange to change targets'],
  },
  'cleaning-maintaining-your-gun': {
    title: 'How to Clean and Maintain Your Firearm',
    subtitle: 'A dirty gun is an unreliable gun. Field strip, clean, and lubricate your pistol in 20 minutes — step by step.',
    category: 'Maintenance', readTime: '10 min read', date: 'June 16, 2026',
    heroImage: '/img/photos/rifle.jpg',
    tags: ['Cleaning', 'Maintenance', 'Field Strip', 'CLP', 'Reliability'],
    intro: 'A firearm is a mechanical device. Like any mechanical device, it requires periodic cleaning and lubrication to function reliably. The good news: cleaning a modern semi-automatic pistol takes about 20 minutes once you\'ve done it a few times and requires $30–$50 in tools you\'ll use indefinitely.\n\nThe rule of thumb: clean your firearm after every range session. At minimum, clean it every 3 months if it\'s stored and not being used. A defensive firearm that sits in a holster or quick-access safe should be cleaned monthly — pocket lint, sweat, and humidity degrade lubricant and invite rust.',
    sections: [
      { h: 'The Cleaning Kit You Actually Need', body: 'You don\'t need a $200 cleaning kit. You need:\n\n• Bore snake or cleaning rod with patches — a Hoppe\'s bore snake ($15) is the fastest way to clean a barrel. For a more thorough cleaning, a sectional cleaning rod ($15–$25) with caliber-specific brushes and patches works better.\n• Brass bore brush (caliber-specific) — scrubs carbon fouling from the barrel rifling\n• Patches and patch holder — soft cotton patches for applying solvent and oil\n• Nylon utility brush or old toothbrush — for scrubbing carbon off the slide rails and frame\n• Gun solvent — Hoppe\'s No. 9 ($8) has been the standard for 100+ years. Ballistol ($10) is excellent and biodegradable. M-Pro 7 ($12) is popular for stubborn carbon.\n• CLP (cleaner-lubricant-protectant) — Slip 2000 EWL ($12), FrogLube ($15), or Sentry Solutions TUF-GLIDE ($12). CLP combines solvent and lubricant in one, simplifying the process.\n• Cleaning mat — protects your work surface and gives you a designated area to lay out parts\n\nTotal startup cost: $40–$60. Everything lasts years.' },
      { h: 'Field Strip: Disassembly for Cleaning', body: 'Field stripping means disassembly to the four major components for routine cleaning — it does not mean complete detail strip (full disassembly, which you don\'t need to do more than once a year if that).\n\nFor a Glock (the most common example):\n1. Ensure the firearm is unloaded — remove the magazine, lock the slide back, visually and physically check the chamber. Do this twice.\n2. Depress the two tabs on the slide stop lever while pulling the trigger (Glock requires a trigger pull to disassemble — confirm chamber is empty first)\n3. Pull the slide slightly rearward, lift the front of the slide up, and pull forward off the frame\n4. Remove the recoil spring assembly by lifting it forward and out\n5. Push the barrel forward and lift it out of the slide\n\nYou now have: frame (with trigger group), slide, barrel, and recoil spring. That\'s it for field strip.\n\nFor SIG P320/P365, S&W M&P, Springfield Hellcat, and most modern striker-fired pistols, the process is similar: remove magazine, clear chamber, lock slide back, depress takedown lever or rotate it 90°, release slide, pull forward and off frame.\n\nAlways consult your owner\'s manual for your specific model — the process is model-specific and takes 2 minutes to learn.', image: '/img/photos/rifle.jpg' },
      { h: 'The Cleaning Process: Step by Step', body: 'With the firearm field stripped:\n\nBarrel — the most important component to clean thoroughly.\n1. Run a solvent-wet patch through the barrel from chamber to muzzle (always clean bore from chamber end when possible)\n2. Follow with the brass bore brush — 10 passes through the bore\n3. Follow with clean dry patches until they come out clean (2–4 patches)\n4. Run a very lightly oiled patch through for protection — barely any oil\n\nSlide — carbon and powder residue accumulate on the interior of the slide, on the breach face, and in the ejector cut.\n1. Spray or apply solvent to the interior of the slide\n2. Scrub with the nylon utility brush — especially the breach face (the circular area where the cartridge headspace)\n3. Wipe clean with patches\n4. Apply a tiny amount of lubricant to the slide rails (the grooves that interface with the frame rails)\n\nFrame — the rails on the frame get the most wear and need lubrication.\n1. Wipe down the frame rails with a clean patch\n2. Apply a small drop of oil or CLP to each rail\n3. Wipe the exterior of the frame\n\nReassemble in reverse order: barrel into slide, recoil spring onto barrel, slide onto frame. Function check: rack the slide several times and dry-fire (safely, using the four rules). A properly lubricated pistol will have a silky, smooth action.' },
      { h: 'Lubrication: How Much Is Enough', body: 'More oil is not better. Over-lubrication attracts dirt, gums up in cold temperatures, and can cause malfunctions. Under-lubrication causes wear and unreliability.\n\nThe rule: a light, even coating where metal meets metal. You should be able to see the oil coating — it shouldn\'t be dripping.\n\nOn a Glock, four lubrication points are specified: two frame rails, the barrel hood, and the connector in the trigger group. That\'s it. Total oil used: 3–4 small drops.\n\nFor your defensive carry firearm, CLP is ideal — it provides a light lubricating film that repels moisture and remains stable across temperature ranges. Avoid heavy grease on carry guns; it can thicken in cold weather and slow the action.\n\nFor competition or range-only firearms that get very high round counts, a purpose-built lubricant like Sentry Solutions TUF-GLIDE or Slip 2000 EWL provides better high-volume performance.\n\nSign that you need more cleaning: your slide feels gritty when cycling. Sign that you used too much oil: visible pooling or oil weeping from the frame. Sign you\'re doing it right: the slide cycles smoothly and silently, action is crisp, no visible excess oil.' }
    ],
    keyTakeaways: ['Clean after every range session — a defensive carry gun should be cleaned monthly minimum', 'Field strip = 4 parts (frame, slide, barrel, recoil spring) — full detail strip is once a year at most', 'Bore brush + solvent + dry patches until clean + light oil coat — this is the barrel process', '4 lubrication points on most pistols — metal on metal, light even coat, no dripping', 'Over-lubrication causes malfunctions — more oil is not better'],
  },
  'understanding-gun-laws': {
    title: 'Understanding Gun Laws: A Beginner\'s Legal Overview',
    subtitle: 'Federal law, state law, and how they interact — what new gun owners need to know to stay legal in 2026.',
    category: 'Legal', readTime: '13 min read', date: 'June 19, 2026',
    heroImage: '/img/photos/law.jpg',
    tags: ['Gun Laws', 'Federal', 'State Laws', 'Legal', 'NFA', '2026'],
    intro: 'US gun law is a patchwork of federal statutes, state laws, and local ordinances that interact in non-obvious ways. The federal framework sets a floor — states can only add restrictions, never remove federal requirements. But the variation between states is enormous: what\'s legal in Arizona may be a felony in New Jersey.\n\nThis guide gives you the legal framework every gun owner needs. It is not legal advice — if you have specific questions about your situation, consult an attorney. But this is the foundational knowledge that keeps you out of accidental legal trouble.',
    sections: [
      { h: 'Federal Law: The Gun Control Act and NFA', body: 'Two federal statutes govern civilian firearms in the United States:\n\nThe Gun Control Act of 1968 (GCA) — establishes the federal framework for firearms commerce. Key provisions: dealers must have an FFL (Federal Firearms License); buyers must be 18+ for rifles and shotguns, 21+ for handguns (from dealers); background checks via NICS are required for all FFL purchases; certain persons are prohibited from possessing firearms (felons, domestic violence convicts, illegal aliens, those adjudicated mentally defective, others).\n\nThe National Firearms Act of 1934 (NFA) — regulates a specific category of firearms: suppressors, short-barreled rifles (SBRs), short-barreled shotguns (SBSs), machine guns, and \'any other weapons\' (AOWs). In January 2026, Congress eliminated the $200 NFA tax stamp requirement, making suppressor and SBR ownership significantly more accessible. The registration, background check, and ATF approval process remains.\n\nThe Firearm Owners Protection Act of 1986 (FOPA) — among other provisions, banned new civilian machine gun registrations after May 19, 1986. Pre-86 registered machine guns remain legal for civilians but are extremely expensive ($20,000–$100,000+) due to supply constraints. FOPA also established the Safe Passage provision — allowing interstate transport of firearms in a federally compliant manner.\n\nPost-Bruen (2022 SCOTUS): The Supreme Court\'s Bruen decision established that firearm regulations must be consistent with historical tradition. This has been used to challenge numerous state restrictions, with ongoing litigation in 2026.' },
      { h: 'Prohibited Persons: Who Cannot Legally Own a Firearm', body: 'Under federal law, you are prohibited from possessing firearms if you:\n\n• Have been convicted of a felony (any crime punishable by imprisonment for more than one year)\n• Have been convicted of domestic violence misdemeanor or are subject to certain domestic violence restraining orders\n• Are a fugitive from justice\n• Are an unlawful user of or addicted to a controlled substance (this includes marijuana in states where it\'s legal — marijuana remains federally Schedule I, and honest Form 4473 completion requires acknowledging this)\n• Have been adjudicated as a mental defective or committed to a mental institution\n• Are an illegal alien\n• Have been dishonorably discharged from the military\n• Have renounced US citizenship\n\nLying on ATF Form 4473 about any of these is a federal felony — 10 years in federal prison. The form is simple and designed to be answered honestly. Don\'t create a problem where none exists.\n\nNote on marijuana: this is the most common area where otherwise law-abiding people create legal exposure. If you use marijuana (recreationally or medically) in any state, you are federally prohibited from possessing firearms. States cannot override federal prohibition status.', image: '/img/photos/law.jpg' },
      { h: 'The State Variation: What Changes State to State', body: 'States can impose requirements beyond federal minimums. The major categories of state variation:\n\nAssault Weapons Bans (AWBs) — California, New York, New Jersey, Maryland, Massachusetts, Connecticut, Hawaii, Illinois, and Washington restrict certain semi-automatic rifles based on cosmetic features (pistol grips, adjustable stocks, flash hiders). The definitions vary by state. What\'s legal in Texas is illegal in California.\n\nMagazine capacity limits — California (10 rounds), New York (10 rounds), Maryland (10 rounds), Colorado (15 rounds), and others restrict magazine capacity. Existing standard-capacity magazines are sometimes grandfathered; sometimes not. Know your state\'s current law — it changes frequently through legislation and court decisions.\n\nWaiting periods — California, Florida, Washington, and others impose waiting periods between purchase and transfer (Washington: 10 business days for all firearms; California: 10 days; Florida: 3 days for handguns). NICS approval does not start your clock — it begins at time of purchase.\n\nPermit-to-purchase — some states require a permit before you can buy a firearm, separate from the carry permit. Illinois (FOID card), Hawaii, New Jersey, Massachusetts, and others.\n\nRed Flag Laws (Extreme Risk Protection Orders) — 22 states allow courts to temporarily remove firearms from individuals deemed a risk to themselves or others, with varying due process protections. Post-Bruen challenges are ongoing in multiple states.' },
      { h: 'Interstate Transport: The Safe Passage Rules', body: 'Traveling with firearms across state lines? The Firearm Owners Protection Act\'s Safe Passage provision (18 U.S.C. § 926A) provides federal protection for interstate transport IF:\n\n• The firearm is legal at the origin and destination\n• The firearm is unloaded\n• The firearm is in a locked container (not the glove compartment or console)\n• Ammunition is stored separately or also in a locked container\n• You are traveling directly — not stopping overnight or for other activities (courts have interpreted \'interstate travel\' narrowly in states like New Jersey and New York)\n\nThe key danger: traveling through anti-gun states with legal firearms. New Jersey, New York, and Maryland have prosecuted travelers claiming Safe Passage. The law exists but exercising it means potential arrest and a long legal battle. The practical advice: know every state\'s law before transporting firearms through it, and avoid overnight stops in restrictive states with your firearms in the vehicle if possible.\n\nFlying with firearms is fully legal under TSA rules: unloaded in a hard-sided locked case, declared at check-in, in checked baggage. Airlines have minor variations — always check the specific airline\'s policy before flying.' }
    ],
    keyTakeaways: ['Federal law sets the floor — states add restrictions, never remove federal requirements', 'Form 4473: answer honestly — lying is a federal felony carrying up to 10 years imprisonment', 'Marijuana use (even where state-legal) is a federal firearms prohibition — this is commonly misunderstood', 'AWBs, magazine limits, waiting periods, and red flag laws vary dramatically by state — know yours', 'FOPA Safe Passage protects interstate transport only if you follow all requirements — restrictive states still arrest travelers'],
  },
  'choosing-holster-beginners': {
    title: 'How to Choose a Holster for Concealed Carry',
    subtitle: 'IWB, OWB, appendix, shoulder — the types of holsters and how to choose the right one for your body, lifestyle, and firearm.',
    category: 'CCW & Carry', readTime: '11 min read', date: 'June 23, 2026',
    heroImage: '/img/photos/pistol.jpg',
    tags: ['Holster', 'IWB', 'AIWB', 'Concealed Carry', 'EDC'],
    intro: 'Buying a carry gun without buying a quality holster is like buying a car without seatbelts. The holster is half the system — it determines how safely you carry, how comfortably you carry, and how quickly you can draw under stress.\n\nNew carriers almost universally make the same mistake: they buy a cheap universal holster from the sporting goods store, carry uncomfortably for a month, and then stop carrying. The solution isn\'t more willpower. It\'s a quality holster fitted to your specific gun in a position that works for your body.',
    sections: [
      { h: 'IWB vs. OWB: The Core Distinction', body: 'Inside the Waistband (IWB) holsters sit between your pants and your body, with only the grip exposed above the belt line. They are the most common carry method for concealed carry because the gun is hidden by a cover garment (untucked shirt, jacket, vest) with minimal printing. IWB holsters require pants that are 1–2 inches larger in the waist than your usual size to accommodate the added bulk.\n\nOutside the Waistband (OWB) holsters attach to the belt outside your pants. They\'re more comfortable, allow faster draw, and are preferred for open carry and range use. For concealed carry, they require a heavier cover garment (jacket or longer shirt) to conceal adequately. In warm climates or professional dress environments, OWB concealed carry is impractical without the right cover garment.\n\nFor daily concealed carry in most environments: IWB is the answer. The slight comfort penalty is worth the superior concealment.' },
      { h: 'Carry Positions: Where to Put It', body: 'The clock positions on your waistband determine where the gun rides and how you draw:\n\n3 o\'clock (strong-side hip) — the traditional position. Gun sits on your dominant side hip. Natural draw motion. Works for most body types. Comfortable for driving. Visible to others when bending over if shirt rides up.\n\n4 o\'clock (behind the hip) — slightly behind your dominant hip. Better concealment on many body types. Less comfortable when seated (the gun pushes into the chair). Common for people who carry a full-size pistol IWB.\n\nAppendix carry (AIWB, 12-1 o\'clock) — gun rides in front of the hip, between your navel and dominant hip. The fastest draw position available. The best concealment while seated. Controversial because the muzzle points at femoral artery and groin during carry — this concern is largely mitigated by using a quality holster with a full trigger guard and safe reholstering practices. AIWB has become the dominant method among serious defensive shooters and instructors.\n\nSmall of back (SOB) — 6 o\'clock position at the spine. Not recommended. If you fall backward, the gun can cause serious spinal injury. Draw is awkward under stress. Avoid.', image: '/img/photos/pistol.jpg' },
      { h: 'Holster Materials: Kydex vs. Leather', body: 'Modern Kydex holsters (thermoformed polymer) have largely displaced leather for daily carry for good reason:\n\nKydex advantages — specific fit to your exact model (not universal), adjustable retention, consistent draw every time, doesn\'t collapse after drawing (you can reholster safely with one hand), weather and sweat resistant, holds its shape permanently. Top brands: Tier 1 Concealed, Tenicor, PHLster, Dark Star Gear, JM Custom Kydex. Price range: $50–$120.\n\nLeather advantages — initially more comfortable against skin, quieter, traditional aesthetics. Quality leather holsters are excellent for OWB carry. Quality horsehide or cowhide IWB holsters from Milt Sparks, Alessi, or Tucker Gun Leather are premium products. Price: $100–$200.\n\nAvoid: cheap nylon/fabric universal holsters ($15–$30 at sporting goods stores). They don\'t fit any gun specifically, can collapse after drawing (blocking reholstering), and provide inconsistent retention. They are responsible for a meaningful percentage of negligent discharges during reholstering.\n\nThe non-negotiables for any holster you carry: full trigger guard coverage (nothing touches the trigger while holstered), adjustable retention, made for your specific model, and secure attachment to your belt.' },
      { h: 'Belt: The Part Everyone Neglects', body: 'A carry gun on a flimsy fashion belt is unstable, uncomfortable, and will sag and print. Your holster is only as stable as the belt it attaches to.\n\nA dedicated carry belt is stiffer than a regular belt — stiff enough that it doesn\'t flex under the weight of the gun. Materials: leather (Aker, Beltman, Hanks) or reinforced nylon/polymer (Kore Essentials, Nexbelt). Width: most IWB holster clips require a 1.5" belt; Safariland and some others use 1.75".\n\nThe Kore Essentials X6 ($70) is the best value carry belt in 2026 — ratchet buckle for infinite adjustment (no holes), reinforced with polymer, two decades of hard use without sagging. The Aker B21 leather belt ($70–$90) is the traditional choice and equally excellent.\n\nBudget another $60–$80 for the belt when you\'re setting up your carry system. A quality holster on a cheap belt is a step backward from a decent holster on a quality belt.' }
    ],
    keyTakeaways: ['Quality holster fitted to your specific gun — universal holsters cause negligent discharges and print badly', 'IWB for concealed carry, OWB for open carry or range — appendix (AIWB) is the fastest and best-concealed position', 'Kydex for daily carry: specific fit, consistent retention, won\'t collapse after draw', 'Full trigger guard coverage is non-negotiable — nothing touches the trigger while holstered', 'Budget $60–$80 for a dedicated carry belt — the holster is only as good as what it\'s attached to'],
  },
  'dry-fire-training-beginners': {
    title: 'Dry Fire Training: Get Better Without Spending on Ammo',
    subtitle: 'Professional shooters spend more time dry firing than live firing. Here\'s how to build real skill at home — safely and free.',
    category: 'Training', readTime: '9 min read', date: 'June 26, 2026',
    heroImage: '/img/photos/rifle.jpg',
    tags: ['Dry Fire', 'Training', 'Free', 'Draw Stroke', 'Fundamentals'],
    intro: 'Ammunition costs money. Range time costs money. Dry fire costs nothing and can be done in your living room.\n\nDry fire practice — practicing your draw, trigger press, sight alignment, and movement with an unloaded firearm — is how professional competitive shooters stay sharp between matches. USPSA Grand Masters, military special operations snipers, and defensive shooting instructors all use dry fire as a primary training tool. The reason: it isolates the fundamentals without the distraction of noise, recoil, and range environment.',
    sections: [
      { h: 'Safety First: How to Set Up a Safe Dry Fire Session', body: 'Dry fire has caused negligent discharges. The risk isn\'t that dry fire is inherently dangerous — it\'s that people get sloppy about whether the gun is actually unloaded.\n\nA safe dry fire protocol:\n1. Remove the magazine\n2. Lock the slide back, visually inspect the chamber — confirm empty\n3. Physically run your finger through the chamber — confirm empty\n4. Close the slide. The gun is now unloaded.\n5. Move all ammunition — every magazine, every loose round — to another room or a closed container. Not on the table nearby. Another room.\n6. Only now begin your dry fire session\n7. When done: before handling or reloading ammunition, put the gun away first\n\nThe cause of dry fire NDs is always the same: someone picks up the gun between dry fire sessions, doesn\'t check whether it was reloaded, and fires it thinking they\'re dry firing.\n\nNote: some firearms (Glock, SIG striker-fired) require a trigger pull to field strip — this means you may need to dry fire the unloaded gun once to strip it. This is fine. The concern is unintentional dry fire of a loaded gun.\n\nFor peace of mind: Snap Caps ($12–$20 for 5-pack) are dummy rounds that allow your firing pin to strike without damage and make the empty chamber visually obvious.' },
      { h: 'The 5 Fundamentals to Practice', body: 'Focus your dry fire sessions on these five skills in rough order of importance:\n\n1. Draw stroke — the complete sequence from concealed carry position to first shot. This is where most real defensive skill is built. Components: grip acquisition on the draw, clearing the holster, establishing two-hand grip, pressing out to target, trigger press as the gun reaches target. A smooth consistent draw is the foundation of defensive shooting.\n\n2. Trigger press — the most important marksmanship fundamental. Press the trigger straight rearward without disturbing the sights. Dry fire makes this visible: if the muzzle moves as the trigger breaks, you\'re anticipating or pushing. 50 deliberate trigger presses per session, watching the sights, builds the neural pathway faster than any other training method.\n\n3. Sight alignment and sight picture — at home targets, confirm your eyes are focused on the front sight (or red dot if equipped), sights are aligned, and the target is visible above/around the front sight. Practice bringing the gun up to the same sight picture every time.\n\n4. Reload — emergency reload (drop empty mag, insert full mag, rack slide) and tactical reload (swap partial mag for full while round in chamber). Dry fire reloads with dummy magazines build the muscle memory you need under stress.\n\n5. Movement — drawing and establishing position behind cover. Even in a small space, practicing stepping offline while drawing builds critical defensive skill.', image: '/img/photos/rifle.jpg' },
      { h: 'A 15-Minute Weekly Dry Fire Program', body: 'Consistency beats duration. 15 minutes three times per week produces more skill development than an hour once a month. Here\'s the program:\n\nWarm-up (3 minutes) — 20 trigger presses from ready position (gun already at eye level), watching the front sight for movement. This re-establishes your baseline and identifies any bad habits from the week.\n\nDraw strokes (5 minutes) — 15 draws from your carry position to first shot press. Time yourself with a par timer app (Shot Timer or PACT Club Timer, free on iOS/Android). Your goal: consistent draw time under 2 seconds from concealed to first shot, with no sight movement at trigger break. Count reps, not time.\n\nReloads (4 minutes) — 10 emergency reloads from slide-lock, 5 tactical reloads. Use dummy magazines (Snap Caps or commercial dummies). Drop the magazine, seat the replacement with authority, rack the slide.\n\nMirrored session (3 minutes) — repeat the first draw set, but watch yourself in a mirror or record on your phone. The feedback is immediate and merciless. You\'ll see grip problems, muzzle dip, and inconsistent presentation that you can\'t feel.\n\nThe progression: run this program for 30 days. You will notice real improvement in your live-fire sessions — faster, more accurate, more consistent.' }
    ],
    keyTakeaways: ['Move all ammunition to another room before dry fire — the protocol eliminates negligent discharge risk', '50 deliberate trigger presses watching the front sight builds fundamentals faster than any range session', '15 minutes three times per week beats one-hour sessions monthly — consistency is the training principle', 'A par timer app is free and transforms dry fire from vague practice into measurable improvement', 'Mirror or phone video feedback during dry fire reveals grip and presentation problems you can\'t feel'],
  },
  'what-is-nfa': {
    title: 'What Is the NFA? Suppressors, SBRs, and Machine Guns Explained',
    subtitle: 'After the NFA tax stamp was eliminated in January 2026, suppressor ownership exploded. Here\'s everything you need to know about NFA items.',
    category: 'Legal', readTime: '12 min read', date: 'June 30, 2026',
    heroImage: '/img/photos/rifle.jpg',
    tags: ['NFA', 'Suppressor', 'SBR', 'ATF', '2026 Reform', 'Tax Stamp'],
    intro: 'The National Firearms Act of 1934 created a regulated category of firearms and accessories that required registration with the federal government and payment of a $200 tax stamp. For 90 years, the process took 6–12 months and cost $200 plus the item price.\n\nIn January 2026, Congress eliminated the $200 NFA tax stamp requirement and streamlined the approval process to 30–60 days. The result: suppressor sales doubled in the first quarter. If you\'ve been curious about suppressors, SBRs, or other NFA items, now is the time to understand how it works.',
    sections: [
      { h: 'What Items Are NFA-Regulated', body: 'The NFA regulates six categories of items:\n\n1. Machine guns — any firearm that fires more than one round per trigger pull. Fully automatic. Civilian ownership requires a pre-1986 registered example (supply-limited, prices range from $20,000 for a MAC-10 to $100,000+ for a select-fire M16). No new machine guns have been authorized for civilian registration since May 19, 1986 (FOPA). This did not change in 2026 — the tax stamp elimination applies to everything except machine guns.\n\n2. Suppressors (silencers) — a device that reduces the report of a firearm. Contrary to Hollywood, suppressors do not make firearms whisper-quiet. They reduce the muzzle blast by 20–35 decibels, typically bringing unsuppressed gunfire (160+ dB) to a still-loud 130–140 dB — roughly the level of a jackhammer. The primary benefits: hearing protection, reduced recoil, and practical noise reduction for hunting and home defense. As of January 2026, the registration and approval process remains but the $200 tax is eliminated.\n\n3. Short-Barreled Rifles (SBRs) — any rifle with a barrel under 16" or overall length under 26". An AR-15 with a 10.5" barrel is an SBR. Popular for home defense (more maneuverable) and competition. Same approval process as suppressors.\n\n4. Short-Barreled Shotguns (SBSs) — shotguns with barrels under 18" or overall length under 26".\n\n5. Destructive Devices (DDs) — grenades, rockets, some large-bore firearms over .50 caliber. Not relevant to most civilians.\n\n6. Any Other Weapons (AOWs) — a catch-all category including pen guns, disguised firearms, pistols with vertical foregrips. $5 tax transfer (never changed), same registration process.' },
      { h: 'The 2026 Suppressor Revolution', body: 'The elimination of the $200 tax stamp effective January 1, 2026 changed the math on suppressor ownership dramatically.\n\nBefore 2026: a budget suppressor (Dead Air Ghost, $400) + $200 tax stamp + 8-month wait = $600 and most of a year. The wait was the real barrier — most suppressor buyers filed their paperwork and then largely forgot about it until the stamp arrived.\n\nAfter 2026: same suppressor, no stamp fee, 30–60 day approval. The process is now comparable to buying a standard firearm — background check, approval, take it home.\n\nThe approval process still requires:\n• ATF Form 4 (transfer) or Form 1 (make your own)\n• NICS background check\n• Photographed and fingerprinted (eForm 4 allows digital submission)\n• Registered in your name (or in a trust or corporation for multiple authorized users)\n• ATF approval — currently 30–60 days on eForm 4\n\nTop suppressors for 2026 after the tax stamp elimination:\n• SilencerCo Omega 9K ($799) — best compact 9mm suppressor, 5.08", rated to .300 BLK\n• Dead Air Sandman-S ($850) — best direct-thread rifle suppressor, titanium baffles\n• SureFire SOCOM762-RC2 ($1,600) — military-grade, best-in-class sound reduction\n• Rugged Obsidian 45 ($600) — versatile pistol suppressor, rated for .45 ACP to 9mm', image: '/img/photos/rifle.jpg' },
      { h: 'SBRs: The Practical Case', body: 'A short-barreled rifle (SBR) is typically an AR-15 or pistol-caliber carbine with a barrel under 16". The practical advantages for home defense and general use:\n\nManeuverability — a 10.5" barrel AR-15 is dramatically easier to handle in home hallways, vehicles, and tight spaces than a standard 16" rifle. The tradeoff is modest velocity loss (roughly 200 fps compared to 16" barrel) which doesn\'t significantly affect terminal performance at defensive distances.\n\nSuppressor host — a short-barreled rifle with a suppressor can be overall shorter than a standard rifle without a suppressor, while adding the hearing protection benefits.\n\nThe SBR process post-2026 is identical to suppressors: eForm 1 or Form 4, background check, ATF approval (30–60 days), and you\'re legal.\n\nImportant caveat: SBRs remain illegal in some states regardless of federal law — California, New York, New Jersey, Connecticut, Maryland, Massachusetts, Hawaii, Rhode Island, Illinois, and others restrict SBRs under state law. Check your state before filing.\n\nAlternatively: AR pistols (pistol-braced ARs with barrels under 16") occupy a legal gray area that has been clarified post-2026. With the pistol brace rule rescinded, AR pistols with braces are now clearly legal without NFA registration in states that allow them.' },
      { h: 'How to Buy Your First Suppressor (Step by Step)', body: 'Step 1 — Choose your suppressor and purchase it from an FFL/SOT dealer (dealers licensed for NFA items). You pay for the suppressor, and it transfers to the dealer\'s inventory under your name.\n\nStep 2 — Complete ATF eForm 4 online at eforms.atf.gov. You\'ll need: your information, the suppressor serial number, photos, and digital fingerprints (most dealers have a fingerprint capture device).\n\nStep 3 — The dealer submits your Form 4 to ATF. You wait. Currently 30–60 days for eForm 4. ATF runs an extended background check and reviews the form.\n\nStep 4 — ATF approves and the tax stamp (now $0) is issued to your dealer. The dealer contacts you. You pick up your suppressor.\n\nStep 5 — Your suppressor is now registered to you. It must stay within your possession or the possession of someone with your explicit (written) authorization. You cannot permanently transfer it to anyone else without another Form 4 and ATF approval.\n\nFor couples or families who want multiple authorized users: file using a gun trust (also called an NFA trust). A trust allows any trustee to possess and use the item. Most attorneys charge $150–$300 for a basic NFA trust; several online services (Silencer Shop, QuietBore) provide trust forms for free.' }
    ],
    keyTakeaways: ['January 2026 eliminated the $200 NFA tax stamp — suppressor and SBR approval is now 30–60 days with no tax', 'Suppressors don\'t make guns whisper-quiet — they reduce report by 20-35 dB, still louder than a jackhammer', 'Machine gun civilian transfers remain banned since 1986 — this did not change in 2026', 'SBRs are illegal in many states regardless of federal law — verify your state before filing', 'Use an NFA trust if multiple family members will use the item — saves future paperwork headaches'],
  },
}



// ── UNIQUE HERO IMAGES PER ARTICLE ──────────────────────────────────────────
const HERO_IMAGES = {
  'buying-your-first-gun': 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1920px-Walther_P99Q.jpg',
  'how-to-get-ccw-license':       '/img/photos/pistol.jpg',
  'firearms-safety-four-rules': 'https://upload.wikimedia.org/wikipedia/commons/e/ed/Control_station_for_an_indoor_firing_range.jpg',
  'home-defense-basics':          '/img/photos/pistol.jpg',
  'safe-storage-guide-beginners': '/img/photos/pistol.jpg',
  'ammo-guide-beginners':         '/img/photos/pistol.jpg',
  'shooting-range-first-visit':   '/img/photos/rifle.jpg',
  'cleaning-maintaining-your-gun':'/img/photos/pistol.jpg',
  'understanding-gun-laws':       '/img/photos/law.jpg',
  'choosing-holster-beginners':   '/img/photos/pistol.jpg',
  'dry-fire-training-beginners':  '/img/photos/rifle.jpg',
  'what-is-nfa':                  '/img/photos/rifle.jpg',
}

export async function generateStaticParams() {
  return Object.keys(ARTICLES).map(s => ({ slug: s }))
}

export async function generateMetadata({ params }) {
  const a = ARTICLES[params.slug]
  if (!a) return { title: 'Article — DownRange Learning Center' }
  const img = HERO_IMAGES[params.slug] || a.heroImage
  return {
    title: `${a.title} — DownRange`,
    description: a.subtitle,
    openGraph: {
      title: a.title,
      description: a.subtitle,
      images: img ? [{ url: img, width: 1400, alt: a.title }] : [],
    }
  }
}

export const revalidate = 1
export default async function ArticlePage({ params }) {
  const DEFAULT_BIO = "DJ Cavalcanti is the founder of DownRange — built to give every American gun owner one place for the news, laws, market data, and practical knowledge they actually need. No algorithms, no paywalls, no corporate backing."
  let authorBio = DEFAULT_BIO
  try {
    const m = await import('../../../lib/authorBio')
    authorBio = await m.fetchAuthorBio() || DEFAULT_BIO
  } catch (e) { authorBio = DEFAULT_BIO }

    const article = ARTICLES[params.slug]
  if (!article) notFound()

  const heroImg = HERO_IMAGES[params.slug] || article.heroImage
  const allSlugs = Object.keys(ARTICLES)
  const currentIdx = allSlugs.indexOf(params.slug)
  const prevSlug = currentIdx > 0 ? allSlugs[currentIdx - 1] : null
  const nextSlug = currentIdx < allSlugs.length - 1 ? allSlugs[currentIdx + 1] : null
  const relatedArticles = Object.entries(ARTICLES)
    .filter(([s]) => s !== params.slug && ARTICLES[s].category === article.category)
    .slice(0, 3)
  const moreArticles = Object.entries(ARTICLES)
    .filter(([s]) => s !== params.slug)
    .slice(0, 6)

  return (
    <>
      <Masthead />

      {/* ── FULL-BLEED HERO IMAGE ── */}
      <div style={{ position:'relative', height:'clamp(300px,50vw,520px)', overflow:'hidden' }}>
        {heroImg && (
          <>
            <img
              src={heroImg}
              alt={article.title}
              style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', objectPosition:'center' }}
            />
            {/* Dark gradient overlay — stronger at bottom for text legibility */}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(9,9,11,0.2) 0%, rgba(9,9,11,0.5) 50%, rgba(9,9,11,0.95) 100%)' }} />
            {/* Subtle gold vignette */}
            <div style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse at 30% 60%, rgba(200,146,42,0.08) 0%, transparent 70%)' }} />
          </>
        )}

        {/* Hero content — positioned at bottom over image */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'32px 0 28px' }}>
          <div className="container" style={{ maxWidth:900 }}>
            {/* Breadcrumb */}
            <div style={{ display:'flex', alignItems:'center', gap:'6px', marginBottom:'14px' }}>
              <Link href="/" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'rgba(240,237,230,0.5)', textDecoration:'none', letterSpacing:'0.08em' }}>HOME</Link>
              <span style={{ color:'rgba(200,146,42,0.6)', fontSize:'10px' }}>›</span>
              <Link href="/learn" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'rgba(240,237,230,0.5)', textDecoration:'none', letterSpacing:'0.08em' }}>LEARNING CENTER</Link>
              <span style={{ color:'rgba(200,146,42,0.6)', fontSize:'10px' }}>›</span>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)', letterSpacing:'0.08em' }}>{article.category.toUpperCase()}</span>
            </div>

            {/* Category + read time pills */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'14px', flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.15em', padding:'3px 12px', textTransform:'uppercase' }}>{article.category}</span>
              <span style={{ background:'rgba(9,9,11,0.6)', color:'rgba(240,237,230,0.7)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'3px 12px', border:'1px solid rgba(255,255,255,0.1)' }}>{article.readTime}</span>
              <span style={{ background:'rgba(9,9,11,0.6)', color:'rgba(240,237,230,0.7)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'3px 12px', border:'1px solid rgba(255,255,255,0.1)' }}>{article.date}</span>
            </div>

            {/* Title */}
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.2rem,5vw,3.8rem)', color:'#F0EDE6', letterSpacing:'0.02em', lineHeight:1.05, marginBottom:'10px', textShadow:'0 2px 20px rgba(0,0,0,0.5)' }}>
              {article.title}
            </h1>

            {/* Subtitle */}
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'clamp(14px,2vw,17px)', color:'rgba(240,237,230,0.75)', lineHeight:1.6, maxWidth:640, textShadow:'0 1px 8px rgba(0,0,0,0.8)' }}>
              {article.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* ── AUTHOR BAR ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'14px 0' }}>
        <div className="container" style={{ maxWidth:900 }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:'12px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
              <img src="/img/dj-avatar.png" alt="DJ Cavalcanti" width="40" height="40" style={{ borderRadius:'50%', border:'2px solid #C8922A', objectFit:'cover', flexShrink:0 }} />
              <div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:700, color:'var(--text)' }}>DJ Cavalcanti</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)' }}>DownRange Founder · {article.date}</div>
              </div>
            </div>
            <div style={{ display:'flex', gap:'6px' }}>
              {article.tags?.slice(0,4).map(t => (
                <span key={t} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', background:'var(--bg3)', border:'1px solid var(--border)', padding:'3px 8px', letterSpacing:'0.06em' }}>{t}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── ARTICLE BODY ── */}
      <div style={{ background:'var(--bg)', paddingBottom:'60px' }}>
        <div className="container" style={{ maxWidth:900 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 260px', gap:'48px', paddingTop:'40px' }}
               className="article-layout">
            <style>{`@media(max-width:768px){.article-layout{grid-template-columns:1fr!important} .article-aside{display:none!important}}`}</style>

            {/* Main content */}
            <article>

              {/* Lead paragraph */}
              {article.intro && (
                <div style={{ marginBottom:'40px' }}>
                  {article.intro.split('\n\n').map((p, i) => (
                    <p key={i} style={{
                      fontFamily:"'IBM Plex Sans',sans-serif",
                      fontSize: i === 0 ? '19px' : '16px',
                      fontWeight: i === 0 ? 400 : 400,
                      color: i === 0 ? 'var(--text)' : 'var(--text-muted)',
                      lineHeight: 1.85,
                      marginBottom:'18px',
                      borderLeft: i === 0 ? '3px solid var(--gold)' : 'none',
                      paddingLeft: i === 0 ? '20px' : '0',
                    }}>{p}</p>
                  ))}
                </div>
              )}

              {/* Sections */}
              {article.sections?.map((section, i) => (
                <div key={i} style={{ marginBottom:'48px' }}>
                  {/* Section image if present */}
                  {section.image && i > 0 && (
                    <div style={{ margin:'0 0 24px', borderRadius:0, overflow:'hidden', border:'1px solid var(--border)' }}>
                      <img
                        src={section.image}
                        alt={section.h}
                        style={{ width:'100%', height:'220px', objectFit:'cover', display:'block', opacity:0.85 }}
                      />
                    </div>
                  )}

                  {/* Section heading with number accent */}
                  <div style={{ display:'flex', alignItems:'flex-start', gap:'14px', marginBottom:'16px' }}>
                    <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.2rem', color:'rgba(200,146,42,0.25)', lineHeight:1, flexShrink:0, minWidth:'32px', textAlign:'right' }}>{String(i+1).padStart(2,'0')}</span>
                    <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.7rem', color:'var(--text)', letterSpacing:'0.03em', lineHeight:1.1, paddingTop:'4px' }}>{section.h}</h2>
                  </div>

                  {/* Section body */}
                  <div style={{ paddingLeft:'46px' }}>
                    {section.body.split('\n\n').map((para, pi) => {
                      // Detect bullet/numbered lists
                      const lines = para.split('\n')
                      const isList = lines.some(l => l.match(/^[•\-\d][\.\s]/))

                      if (isList) {
                        return (
                          <div key={pi} style={{ margin:'0 0 16px', background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'3px solid var(--gold)', padding:'16px 20px' }}>
                            {lines.map((line, li) => {
                              const isBullet = line.match(/^[•\-]/)
                              const isNum = line.match(/^\d+\./)
                              const isHeader = line.match(/^\*\*[^*]+\*\*:/)
                              if (!line.trim()) return null
                              return (
                                <div key={li} style={{ display:'flex', gap:'10px', marginBottom: li < lines.length-1 ? '8px' : 0, alignItems:'flex-start' }}>
                                  {(isBullet || isNum) && (
                                    <span style={{ color:'var(--gold)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', flexShrink:0, paddingTop:'3px', minWidth:'16px' }}>
                                      {isNum ? line.match(/^(\d+)\./)[1] + '.' : '▸'}
                                    </span>
                                  )}
                                  <span
                                    style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'15px', color:'var(--text-muted)', lineHeight:1.7 }}
                                    dangerouslySetInnerHTML={{ __html: line.replace(/^[•\-]\s*/, '').replace(/^\d+\.\s*/, '').replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text)">$1</strong>') }}
                                  />
                                </div>
                              )
                            })}
                          </div>
                        )
                      }

                      return (
                        <p key={pi}
                          style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'15px', color:'var(--text-muted)', lineHeight:1.85, marginBottom:'16px' }}
                          dangerouslySetInnerHTML={{ __html: para.replace(/\*\*([^*]+)\*\*/g, '<strong style="color:var(--text);font-weight:600">$1</strong>').replace(/\n/g, '<br>') }}
                        />
                      )
                    })}
                  </div>

                  {/* Section divider */}
                  {i < (article.sections?.length || 0) - 1 && (
                    <div style={{ height:'1px', background:`linear-gradient(to right, var(--gold), transparent)`, margin:'32px 0 0', opacity:0.3 }} />
                  )}
                </div>
              ))}

              {/* ── KEY TAKEAWAYS ── */}
              {article.keyTakeaways?.length > 0 && (
                <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'28px 32px', margin:'40px 0', position:'relative', overflow:'hidden' }}>
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'3px', background:'linear-gradient(to right, var(--gold), var(--gold-light), transparent)' }} />
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', letterSpacing:'0.1em', marginBottom:'18px' }}>KEY TAKEAWAYS</div>
                  <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                    {article.keyTakeaways.map((t, i) => (
                      <div key={i} style={{ display:'flex', gap:'12px', alignItems:'flex-start' }}>
                        <div style={{ width:24, height:24, background:'var(--gold)', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', marginTop:'1px' }}>
                          <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'12px', color:'#09090B', fontWeight:700 }}>{i+1}</span>
                        </div>
                        <span style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'15px', color:'var(--text-muted)', lineHeight:1.7 }}>{t}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── AUTHOR BIO ── */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'24px', margin:'40px 0', display:'flex', gap:'20px', alignItems:'flex-start' }}>
                <img src="/img/dj-avatar.png" alt="DJ Cavalcanti" width="56" height="56" style={{ borderRadius:'50%', border:'2px solid #C8922A', objectFit:'cover', flexShrink:0 }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.2rem', color:'var(--text)', letterSpacing:'0.05em' }}>DJ Cavalcanti</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)', marginBottom:'10px', letterSpacing:'0.08em' }}>DOWNRANGE FOUNDER</div>
                  <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13px', color:'var(--text-dim)', lineHeight:1.7 }}>
                    {authorBio}
                  </p>
                </div>
              </div>

              {/* ── PREV / NEXT NAVIGATION ── */}
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginTop:'32px' }}>
                {prevSlug && ARTICLES[prevSlug] && (
                  <Link href={`/learn/${prevSlug}`} style={{ textDecoration:'none', display:'block' }}>
                    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'16px', height:'100%', transition:'border-color 0.15s' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', letterSpacing:'0.12em', marginBottom:'6px' }}>← PREVIOUS</div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'var(--text)', lineHeight:1.3 }}>{ARTICLES[prevSlug].title}</div>
                    </div>
                  </Link>
                )}
                {nextSlug && ARTICLES[nextSlug] && (
                  <Link href={`/learn/${nextSlug}`} style={{ textDecoration:'none', display:'block', gridColumn: !prevSlug ? '1/-1' : 'auto' }}>
                    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'16px', height:'100%', textAlign:'right', transition:'border-color 0.15s' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', letterSpacing:'0.12em', marginBottom:'6px' }}>NEXT →</div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'var(--text)', lineHeight:1.3 }}>{ARTICLES[nextSlug].title}</div>
                    </div>
                  </Link>
                )}
              </div>

            </article>

            {/* ── SIDEBAR ── */}
            <aside className="article-aside" style={{ position:'sticky', top:'70px', alignSelf:'flex-start', display:'flex', flexDirection:'column', gap:'16px' }}>

              {/* Progress / TOC */}
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
                <div style={{ padding:'12px 14px', borderBottom:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', letterSpacing:'0.12em' }}>IN THIS ARTICLE</div>
                {article.sections?.map((s, i) => (
                  <div key={i} style={{ display:'flex', gap:'10px', padding:'8px 14px', borderBottom: i < article.sections.length-1 ? '1px solid rgba(31,36,40,0.5)' : 'none', alignItems:'center' }}>
                    <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'0.9rem', color:'rgba(200,146,42,0.4)', minWidth:'20px' }}>{String(i+1).padStart(2,'0')}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', lineHeight:1.4 }}>{s.h}</span>
                  </div>
                ))}
              </div>

              {/* Tags */}
              {article.tags?.length > 0 && (
                <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'14px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', letterSpacing:'0.12em', marginBottom:'10px' }}>TOPICS</div>
                  <div style={{ display:'flex', flexWrap:'wrap', gap:'4px' }}>
                    {article.tags.map(t => <span key={t} className="dr-pill">{t}</span>)}
                  </div>
                </div>
              )}

              {/* Related in same category */}
              {(relatedArticles.length > 0 ? relatedArticles : moreArticles.slice(0,3)).map(([slug, a]) => (
                <Link key={slug} href={`/learn/${slug}`} style={{ textDecoration:'none', display:'block' }}>
                  <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', overflow:'hidden', transition:'border-color 0.15s' }}>
                    <div style={{ height:'80px', overflow:'hidden' }}>
                      <img src={HERO_IMAGES[slug] || a.heroImage || '/img/photos/pistol.jpg'} alt={a.title}
                           style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.75 }} />
                    </div>
                    <div style={{ padding:'10px 12px' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'var(--gold)', letterSpacing:'0.1em', marginBottom:'4px' }}>{a.category.toUpperCase()}</div>
                      <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, color:'var(--text)', lineHeight:1.3 }}>{a.title}</div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Back link */}
              <Link href="/learn" style={{ display:'block', textAlign:'center', padding:'10px', background:'var(--bg2)', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', textDecoration:'none', letterSpacing:'0.08em' }}>
                ← ALL ARTICLES
              </Link>

            </aside>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
