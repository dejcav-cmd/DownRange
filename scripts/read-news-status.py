#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, time, hashlib, re

TOKEN   = os.environ.get("SANITY_TOKEN","")
GH_PAT  = os.environ.get("GH_PAT","")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def slugify(t):
    return re.sub(r'-+','-', re.sub(r'[^a-z0-9]+','-',t.lower())).strip('-')[:90]

def mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

RELEASES = [
  {
    "title": "Staccato HD C4X: The 2011 Built for Carry, Not Just Competition",
    "brand": "Staccato",
    "model": "HD C4X",
    "category": "pistol",
    "msrp": "$3,499",
    "caliber": "9mm Luger",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/pistol.jpg",
    "summary": "Staccato's HD C4X brings the 2011 platform fully into the duty and carry market with a 4-inch compensated barrel, Glock-pattern magazines, and the new HD HOST optic-mounting system.",
    "body": """<p>The 2011 has always been the shooter's pistol — the one people reach for when they've outgrown striker-fired guns and want something that genuinely rewards skill. Staccato has spent the last few years moving that platform from the competition circuit toward everyday carry, and the HD C4X is the most complete expression of that effort yet.</p>

<h2>What's New Here</h2>
<p>The C4X runs a 4-inch barrel with an integral single-port compensator. That compensator isn't a gimmick — it's machined into the barrel itself, not a separate piece that can loosen or shift. Muzzle flip is noticeably reduced compared to the standard Staccato P, and follow-up shots settle faster than you'd expect from a pistol this compact. The steel-framed grip module keeps weight at a controllable 34 ounces unloaded, which is substantial but earns its keep in recoil management.</p>

<p>Magazine compatibility is the sleeper upgrade here. Staccato moved to Glock-pattern magazines with the HD line in 2025, and the C4X carries that forward. That means 15+1 capacity with flush-fit mags, wider aftermarket support, and no hunting for proprietary magazines if you're running this as a duty gun. Ambidextrous controls are standard — safety, slide stop, and mag release all work left or right-handed without modification.</p>

<h2>The HD HOST System</h2>
<p>Optic mounting on the C4X uses Staccato's new HD HOST system, which replaces the old footprint-specific plates with a locking mechanism that holds the optic in a machined channel. The optic sits lower and doesn't move. That sounds like a marketing claim until you put 500 rounds through it and the zero hasn't shifted. If you run a Trijicon RMR, Holosun 509T, or Aimpoint ACRO, this is the mounting system you've been waiting for on a carry-class 2011.</p>

<h2>Real Talk on Price and Use Case</h2>
<p>At $3,499, the C4X costs more than most people spend on their entire carry setup. That's a real number and it matters. What you get for it is a pistol that runs — reliably, accurately, and fast — right out of the box. Staccato's factory triggers are good enough that most buyers won't touch them. The barrel-to-slide fit is tight enough to matter for accuracy without being so tight it chokes on anything short of match-grade ammo. If this is your duty gun or your dedicated home defense firearm and the budget allows, the C4X is difficult to argue against.</p>

<h2>Specs</h2>
<p>Caliber: 9mm Luger | Capacity: 15+1 | Barrel: 4 inches with integral compensator | Overall Length: 7.3 inches | Weight: 34 oz. | Frame: Steel | MSRP: $3,499</p>

<p><strong>Bottom Line:</strong> The C4X is the carry 2011 that doesn't ask you to choose between duty reliability and competition-level performance. Available starting February 2026.</p>"""
  },
  {
    "title": "FN 309 MRD: A Hammer-Fired Carry Gun That Actually Makes Sense at $549",
    "brand": "FN America",
    "model": "309 MRD",
    "category": "pistol",
    "msrp": "$549",
    "caliber": "9mm Luger",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/pistol.jpg",
    "summary": "FN's 309 MRD brings an internal hammer-fired single-action system with a consistent 5-pound trigger, optic-ready slide, and mid-size 9mm capacity to the accessible end of the market.",
    "body": """<p>FN doesn't usually play in the sub-$600 carry pistol segment. The 509 line lives in the $700–800 range and the 509 Tactical pushes past $1,000 with the suppressor-height sights. So when FN announced the 309 MRD at $549, it got attention — and the specs back up the price point being a feature rather than a compromise.</p>

<h2>Hammer-Fired in a Striker World</h2>
<p>Most of the competition at this price point is striker-fired. The 309 MRD uses an internal hammer-fired, single-action-only system — the kind that delivers a consistent trigger pull without the pre-travel variation you can feel in budget striker guns. The trigger breaks at about 5 pounds, predictably, every time. That consistency is something you either care about a great deal or not at all, but for new shooters building trigger discipline, it's worth more than a spec sheet number.</p>

<p>The 3.8-inch barrel comes with a recessed target crown, which is more attention to detail than FN's competitors put into pistols at twice this price. The slide is optic-ready with a cover plate that uses the SHIELD RMSc footprint — compatible with Holosun EPS Carry, Trijicon RMSc, and similar compact dots.</p>

<h2>Capacity and Controls</h2>
<p>The 309 ships with flush-fit and extended magazines, both in 9mm. The capacity numbers haven't been finalized in all regional configurations as of press time, but FN confirmed improved capacity over the Reflex pistol that it effectively replaces in the lineup. Controls are standard FN ergonomics — the 309 uses a thumb safety, which will be a dealbreaker for some and a feature for others. The ambidextrous mag release works cleanly.</p>

<h2>Who It's For</h2>
<p>If you want an FN with a more traditional trigger feel, don't want to spend $800+ on a 509, and need optic capability out of the box — the 309 MRD hits that gap cleanly. It's a smart entry from a manufacturer that knows how to build service pistols and has now decided to price one for the civilian market.</p>

<h2>Specs</h2>
<p>Caliber: 9mm Luger | Barrel: 3.8 inches | Action: Internal hammer-fired, single-action | Optic footprint: SHIELD RMSc | MSRP: $549</p>

<p><strong>Bottom Line:</strong> FN figured out how to make a hammer-fired carry pistol that doesn't feel like a budget gun. For under $600, that's a real accomplishment.</p>"""
  },
  {
    "title": "Taurus TX9: Modular Chassis, Three Frame Sizes, One Serialized Part",
    "brand": "Taurus",
    "model": "TX9",
    "category": "pistol",
    "msrp": "$499",
    "caliber": "9mm Luger",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/pistol.jpg",
    "summary": "The TX9 brings Taurus's Modular System to a striker-fired 9mm, letting owners swap between full-size, compact, and sub-compact frames on a single serialized chassis — all under $500.",
    "body": """<p>The serialized chassis model — popularized by SIG's P320 and now standard across a dozen manufacturers — finally lands in the Taurus TX line at a price that makes genuine sense. The TX9 runs a central serialized chassis that drops into full-size, compact, or sub-compact grip modules. You buy one gun. You buy frames. The ATF paperwork stays on the chassis.</p>

<h2>What the Modular System Actually Means</h2>
<p>This isn't a gimmick for people who can't make up their mind. It's a practical advantage. You run the full-size frame on the range for training and the sub-compact at the waistband for daily carry. The trigger, the controls, and the manual of arms stay identical. That consistency matters — your hands don't have to learn two different guns. Taurus has been refining this approach and the TX9's modular execution is cleaner than what they shipped in the first-generation G3 variants.</p>

<p>The T.O.R.O. optic-mounting system handles a long list of dot footprints, including Shield RMSc, Trijicon RMR, Holosun 507K, and others. Taurus has made this work reliably on the GX4 line and the same system carries over here. The iron sights are actually usable — a higher standard than most people give Taurus credit for in 2026.</p>

<h2>Trigger and Reliability</h2>
<p>Taurus triggers in the current TX generation are a different animal from what the brand shipped five years ago. The TX9 breaks around 5.5 pounds with a short, defined reset. It won't replace a $200 aftermarket trigger drop-in, but for factory production, it's competitive with what Glock ships standard. Reliability on the TX line has been strong in independent testing — the platform feeds hollow points reliably across a range of loads without the finickiness that plagued earlier Taurus striker guns.</p>

<h2>Specs</h2>
<p>Caliber: 9mm Luger | Action: Striker-fired | System: Taurus Modular Chassis | Optics: T.O.R.O. system | MSRP: $499</p>

<p><strong>Bottom Line:</strong> The TX9 makes modular pistol ownership accessible under $500. Taurus has earned some credibility here — this is a serious gun at an unserious price.</p>"""
  },
  {
    "title": "S&W M&P M2.0 Competitor HD: Full-Size Steel, Built to Run Fast",
    "brand": "Smith & Wesson",
    "model": "M&P M2.0 Competitor HD",
    "category": "pistol",
    "msrp": "$1,299",
    "caliber": "9mm Luger",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/pistol.jpg",
    "summary": "Smith & Wesson's Performance Center brings 34.5 ounces of stainless steel, aggressive texturing, and a competition-tuned trigger to a full-size M2.0 built around shooting fast and staying on target.",
    "body": """<p>The M2.0 platform has been S&W's workhorse since 2017, and Performance Center has been pushing it in interesting directions ever since. The Competitor HD is the most aggressive iteration yet — a full-size, stainless-framed competition pistol that makes no concessions to concealability and doesn't pretend otherwise.</p>

<h2>Steel Frame, Heavy and Honest</h2>
<p>At 34.5 ounces unloaded with the magazine well attached, the Competitor HD is heavy for a 9mm. That weight is the point. Recoil is absorbed by mass, and the front sight returns to the same place after every shot with the kind of consistency that lighter polymer-framed pistols can't match without a compensator. The stainless slide runs on a stainless frame, and the fit is tight enough to feel deliberate without running stiff.</p>

<p>The frame texturing is aggressive on all four sides — stippling-style panels on the sides and a grippy front panel. Your hand isn't moving during a fast string. The ergonomics push the shooter's hand high up into the grip, which keeps the bore axis lower and helps with muzzle control. The beavertail is prominent and functional.</p>

<h2>Trigger and Controls</h2>
<p>Performance Center tuned the trigger — crisp, light, with a reset short enough to run at competition cadences. The flat-faced trigger shoe keeps finger placement consistent. The mag well is flared for fast reloads. The optics cut accommodates a wide range of dots via an included plate system.</p>

<h2>Where It Fits</h2>
<p>This is a competition pistol that also earns its keep as a home defense gun for shooters who train seriously. It's not a carry gun. It's not supposed to be. If you shoot Production, Limited, or Open in USPSA/IDPA, the Competitor HD gives you a factory option that doesn't need a trigger job to be competitive.</p>

<h2>Specs</h2>
<p>Caliber: 9mm | Capacity: 17+1 | Barrel: 5 inches | Weight: 34.5 oz. | Frame: Stainless steel | MSRP: $1,299</p>

<p><strong>Bottom Line:</strong> Heavy, accurate, and fast. The Competitor HD is what happens when Smith & Wesson's Performance Center builds a gun specifically to win.</p>"""
  },
  {
    "title": "S&W Spec Series R Model 686 Plus: America's Best Revolver Gets an Aimpoint",
    "brand": "Smith & Wesson",
    "model": "Spec Series R Model 686 Plus",
    "category": "pistol",
    "msrp": "$1,999",
    "caliber": ".357 Magnum",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/pistol.jpg",
    "summary": "The first revolver in S&W's Spec Series line, the 686 Plus Spec Series R ships factory-mounted with an Aimpoint ACRO P-2, PowerPort barrel, and seven-round capacity in .357 Magnum.",
    "body": """<p>Smith & Wesson's 686 has been the benchmark for serious double-action revolvers for four decades. The L-frame platform is stiff enough to handle full-power .357 loads without beating itself apart, holds more rounds than J-frames, and points well enough that experienced revolver shooters call it one of the most naturally aimed handguns in the American market. The Spec Series R version takes all of that and adds factory features that would have required aftermarket work and multiple vendor relationships even five years ago.</p>

<h2>The Aimpoint ACRO P-2</h2>
<p>S&W ships this revolver with the Aimpoint ACRO P-2 already mounted and zeroed. That's not a cheap dot — the ACRO P-2 retails around $700 on its own. The ACRO runs on a single CR2032 battery rated for 50,000 hours of use. It's sealed, submersible, and built to a military standard. On a revolver that might serve as a nightstand gun, trail gun, or competition wheel gun, that kind of optic durability makes sense. The mount sits low enough that the dot acquisition feels natural for anyone familiar with traditional revolver sighting.</p>

<h2>PowerPort and Seven Rounds</h2>
<p>The barrel uses S&W's PowerPort porting system — two ports cut into the topstrap of the barrel that redirect gas upward and reduce muzzle rise under full .357 loads. Paired with the Aimpoint, follow-up shots come faster than any unported 686 in standard configuration. The Plus designation means seven rounds in the cylinder, not six. That extra round has mattered in revolver competitions and it matters in any scenario where you're not reloading immediately.</p>

<h2>Checkered Grips and Classic Aesthetics</h2>
<p>The checkered wood grips are period-correct and comfortable. This isn't a gun that tries to look tactical — it's a revolver, and S&W let it be one. The finish is matte stainless, durable, and honest.</p>

<h2>Specs</h2>
<p>Caliber: .357 Magnum / .38 SPL | Capacity: 7 rounds | Barrel: 2.5 inches | Frame: L-Frame stainless | Optic: Aimpoint ACRO P-2 (factory installed) | MSRP: $1,999</p>

<p><strong>Bottom Line:</strong> The 686 Plus was already one of the best revolvers available. The Spec Series R makes it the most complete factory revolver S&W has shipped in a generation.</p>"""
  },
  {
    "title": "HK CC9: The First Truly American-Made HK, Built for Deep Concealment",
    "brand": "Heckler & Koch",
    "model": "CC9",
    "category": "pistol",
    "msrp": "$849",
    "caliber": "9mm Luger",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/pistol.jpg",
    "summary": "HK's CC9 is a micro-compact 9mm engineered by HK's US subsidiary for deep concealment — and it's the first HK pistol manufactured entirely in America.",
    "body": """<p>HK has been selling pistols in the American market for decades, but manufacturing them here is a different thing. The CC9 is the result of HK's US subsidiary standing up domestic production specifically to build a micro-compact that meets American carry demands — thin profile, reliable feeding, and enough capacity to be taken seriously.</p>

<h2>American Production, German Standards</h2>
<p>The manufacturing distinction matters more than branding. Domestic production means HK can iterate faster on US market feedback, tighten lead times, and avoid import complications that have affected HK product availability in recent years. The CC9 uses HK's proprietary manufacturing processes — cold hammer-forged barrel, controlled tolerances — executed in a US facility. The result doesn't feel like a step down from German-made HKs; it feels like HK applied serious engineering resources to a segment they hadn't owned before.</p>

<h2>Dimensions and Carry Profile</h2>
<p>The CC9 is built narrow. The slide is tight, the grip is short, and the overall package disappears under a T-shirt in a way that larger HK pistols don't. The trigger uses a familiar HK double-action/single-action setup — a longer DA pull for the first shot, a crisp SA for follow-ups. That manual of arms requires deliberate training but rewards it with a distinct safety margin in retention situations.</p>

<h2>What It Competes Against</h2>
<p>The CC9 sits against the Sig P365, Springfield Hellcat, and Ruger MAX-9 in the deep concealment micro-compact segment. HK's advantage is the brand's reputation for reliability under adverse conditions and the DA/SA trigger system for buyers who prefer it. At $849 it's priced above the Sig but below a factory-custom Hellcat Pro.</p>

<h2>Specs</h2>
<p>Caliber: 9mm Luger | Action: DA/SA | Profile: Micro-compact | Made in: USA | MSRP: $849</p>

<p><strong>Bottom Line:</strong> HK finally built a pocket-carry 9mm in America. The CC9 is the deep concealment option for buyers who want European engineering without the import timeline.</p>"""
  },
  {
    "title": "Taurus RPC PDW: Roller-Delayed 9mm at a Price Point That Changes the Conversation",
    "brand": "Taurus",
    "model": "RPC PDW",
    "category": "pistol",
    "msrp": "$699",
    "caliber": "9mm Luger",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/pistol.jpg",
    "summary": "Debuting at NRAAM 2026, the Taurus RPC PDW brings roller-delayed blowback to the 9mm PCC market — a mechanical advantage over direct blowback competitors — with a 4.5-inch threaded barrel and 32-round capacity under $700.",
    "body": """<p>The 9mm pistol caliber carbine space has been loud and direct-blowback-dominant for years. The Kel-Tec Sub-2000, CMMG Banshee, and CZ Scorpion all use blowback operation because it's simple, reliable, and cheap to manufacture. What it isn't is flat-shooting. Roller-delayed blowback slows the bolt cycle by using rollers that must cam out of engagement before the case can extract — it produces a measurably softer recoil impulse and a flatter muzzle rise.</p>

<h2>Roller Delay at This Price</h2>
<p>The Springfield Kuna is essentially the only other roller-delayed 9mm PCC in the US civilian market at a comparable price point. Taurus building one at $699 — debuting at NRAAM 2026 — is a legitimate development in the segment. The roller system means higher manufacturing cost and tighter tolerances, which is part of why it hasn't been widely adopted by budget brands. Taurus making it work at this price is either a genuine manufacturing efficiency or a loss-leader to establish market position. Either way, buyers benefit.</p>

<h2>Features and Configuration</h2>
<p>The RPC runs a 4.5-inch threaded barrel, ready for a suppressor or muzzle device from the factory. Capacity is 32 rounds. Controls are fully ambidextrous — safety, charging handle, and magazine release all work either side. The folding brace or stock configuration makes the package genuinely compact when collapsed. At under 12 inches folded, it fits in a backpack or a truck bag without drama.</p>

<h2>Who Buys This</h2>
<p>Buyers who want a home-defense or truck gun in 9mm with higher capacity than a pistol, roller-delayed reliability, and suppressor readiness — all without spending $1,200–1,500 on a Brügger & Thomet or B&T equivalent. That's a wide market and Taurus is targeting it intelligently.</p>

<h2>Specs</h2>
<p>Caliber: 9mm | Barrel: 4.5 inches threaded | Capacity: 32 rounds | Operation: Roller-delayed blowback | Controls: Fully ambidextrous | MSRP: $699</p>

<p><strong>Bottom Line:</strong> Roller-delayed at $699. Taurus found a gap in the PDW market and built something that fills it honestly.</p>"""
  },
  {
    "title": "Ruger Harrier: A Clean-Sheet AR-15 Built in Kentucky, Priced to Win at $699",
    "brand": "Ruger",
    "model": "Harrier",
    "category": "rifle",
    "msrp": "$699",
    "caliber": "5.56 NATO",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/rifle.jpg",
    "summary": "Ruger's Harrier is a ground-up redesign of the AR-15 platform built at the former Anderson Manufacturing facility in Kentucky, offering free-float handguard, mid-length gas system, and receiver tensioning at $699.",
    "body": """<p>Ruger didn't update an existing AR when they built the Harrier — they redesigned the platform from scratch at a facility in Hebron, Kentucky. The result is an AR-15 that ships with features competitors charge $900+ to include: free-float rail, mid-length gas system, receiver tensioning, and a polished trigger, all at $699.</p>

<h2>Receiver Tensioning</h2>
<p>The party piece on the Harrier is Ruger's receiver tensioning system — a set screw that tightens the upper and lower receivers together, eliminating the wobble that plagues mil-spec AR-15s and that shooters have been buying aftermarket fit kits to fix for twenty years. On a $699 rifle, this is genuinely unusual. It tightens the overall feel of the platform, reduces mechanical noise, and contributes to accuracy by giving the barrel a more consistent harmonics baseline.</p>

<h2>Gas System and Barrel</h2>
<p>Mid-length gas system on a 16-inch barrel is the right call. Carbine gas length runs hotter and cycles faster than necessary, wearing parts and increasing felt recoil. Mid-length slows the bolt carrier velocity just enough to soften the cycle without compromising reliability. Ruger's cold hammer-forged barrel with a 1:8 twist handles everything from 55-grain to 77-grain projectiles without complaint.</p>

<h2>The Competitive Picture</h2>
<p>The Springfield Saint, IWI Zion-15, and BCM Standard are the primary competitors at this price point. The Harrier undercuts the BCM on price while matching it on gas system and barrel quality. What Ruger brings is domestic manufacturing, a nationwide dealer network, and their factory warranty support — which matters when something goes wrong three years from now.</p>

<h2>Specs</h2>
<p>Caliber: 5.56 NATO / .223 Rem | Barrel: 16 inches, cold hammer-forged | Gas system: Mid-length | Handguard: Free-float M-LOK | Trigger: Polished, single-stage | MSRP: $699</p>

<p><strong>Bottom Line:</strong> The Harrier is what a $699 AR-15 should have been for the last decade. Ruger finally built it.</p>"""
  },
  {
    "title": "FN Next Gen SCAR: Fixing Everything the Original Got Wrong",
    "brand": "FN America",
    "model": "Next Gen SCAR",
    "category": "rifle",
    "msrp": "$3,999 (SCAR 17S in 6.5CM)",
    "caliber": "5.56 NATO / 7.62 NATO / 6.5 Creedmoor / .300 BLK",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/rifle.jpg",
    "summary": "FN's complete overhaul of the SCAR operating system addresses the platform's known flaws — harmonics, recoil, and suppressor compatibility — while expanding the lineup into 6.5 Creedmoor and .300 Blackout.",
    "body": """<p>The SCAR has been a great rifle with real problems since FN first brought it to the commercial market. The reciprocating charging handle catches on gear. The recoil impulse is sharp. Running a suppressor causes excess gas to vent in the wrong direction. Serious SCAR users have known this for years and worked around it. FN's Next Gen update fixes all three issues in a way that suggests the engineers finally had the budget and the mandate to do the job right.</p>

<h2>Harmonic and Recoil Changes</h2>
<p>The Next Gen SCAR incorporates an updated bolt carrier group and buffer system tuned to produce a smoother recoil impulse. The original SCAR's short-stroke gas piston design produced a snappy, two-part recoil that threw some shooters. The revised system smooths that into a more linear push. It's not night-and-day, but on a $4,000 precision rifle used for long-range work, the reduction in disturbance during the firing cycle matters.</p>

<h2>Suppressor Optimization</h2>
<p>FN built 360-degree heat shields and tunable gas regulation into the Next Gen specifically for suppressor use. The gas block is adjustable — you dial it back when running a suppressor to reduce bolt velocity and keep excess gas from venting into your face. This is the feature suppressed SCAR owners have wanted since 2013. It's here now, and it works.</p>

<h2>Caliber Expansion</h2>
<p>The SCAR 20S in 6.5 Creedmoor is the most interesting addition. The SCAR platform's inherent accuracy and flat shooting characteristics pair well with a caliber built for long-range precision. FN is targeting the precision rifle community with a platform that runs suppressed, accurate, and durable. MSRP on the 17S in 6.5CM is $3,999.</p>

<h2>Specs</h2>
<p>Calibers: 5.56 NATO, .300 BLK, 7.62x51 NATO, 6.5 Creedmoor | Operation: Short-stroke gas piston | Gas block: Adjustable | Suppressor: 360° heat shield, tunable regulation | MSRP from $3,999</p>

<p><strong>Bottom Line:</strong> FN finally fixed the SCAR. If you passed on the original because of the recoil and suppressor issues, the Next Gen deserves another look.</p>"""
  },
  {
    "title": "Maxim Defense SDX RFLX: An Integrally Suppressed SBR That Ships Under 34 Inches",
    "brand": "Maxim Defense",
    "model": "SDX RFLX",
    "category": "rifle",
    "msrp": "$2,700+",
    "caliber": ".300 BLK",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/rifle.jpg",
    "summary": "The SDX RFLX Series combines Maxim Defense's SDX508 platform with an over-the-barrel M-Kore reflex suppressor, delivering 129 dB sound reduction in a .300 BLK package that deploys in under 4 seconds.",
    "body": """<p>Integrally suppressed rifles are gaining traction now that the NFA tax stamp wait time dropped to near-zero with the new $0 stamp policy. Maxim Defense is one of the manufacturers moving fast on this opportunity. The SDX RFLX isn't a rifle with a suppressor bolted on — it's a purpose-designed integrally suppressed system where the can is part of the platform from the ground up.</p>

<h2>The M-Kore Reflex Design</h2>
<p>The suppressor wraps over the barrel rather than threading onto the muzzle. This approach, called a reflex or over-barrel design, allows the suppressor to be significantly shorter while achieving comparable or better sound reduction than a traditional end-cap design. The M-Kore delivers 129 dB — below the threshold considered safe for hearing without protection in most assessments. For a .300 BLK rifle, that's genuinely quiet on subsonic loads and very manageable on supersonic.</p>

<h2>Platform and Deployment</h2>
<p>The SDX RFLX runs on Maxim Defense's SDX508 lower, which uses the company's CQB stock system. When fully collapsed, the overall package is small enough to fit in a standard rifle bag. The "deploys in under 4 seconds" specification refers to unfolding the barrel assembly and locking it into the receiver — relevant for vehicle storage or situations where you need a ready rifle from a compact package. Available as an SBR with a Maxim Gen:7 CQB stock or as a pistol configuration with a brace option.</p>

<h2>The .300 BLK Advantage</h2>
<p>.300 Blackout is the purpose-built suppressed caliber. Subsonic loads suppress to hearing-safe levels reliably, supersonic loads hit hard at close to medium range, and the platform feeds from standard AR magazines. Maxim chose the right caliber for what this rifle is designed to do.</p>

<h2>Specs</h2>
<p>Caliber: .300 BLK | Barrel: 8.5 inches | Suppressor: M-Kore reflex over-barrel | Suppressed dB: 129 | Finish: Black or Arid Brown | MSRP: Starts at $2,700</p>

<p><strong>Bottom Line:</strong> An integrally suppressed .300 BLK that packs small and deploys fast. With the $0 NFA stamp, this is the year to buy a real can — and the RFLX is a reason to buy the whole system.</p>"""
  },
  {
    "title": "SilencerCo Spectre 9: 3.9 Ounces of Titanium That Runs Full-Auto",
    "brand": "SilencerCo",
    "model": "Spectre 9",
    "category": "pistol",
    "msrp": "$880",
    "caliber": "9mm / .300 BLK (subsonic)",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/suppressor.jpg",
    "summary": "SilencerCo's new Spectre 9 is an all-titanium 9mm suppressor weighing just 3.9 ounces and measuring 4.76 inches — full-auto rated for supersonic 9mm and subsonic .300 BLK, using the Alpha mounting system.",
    "body": """<p>The suppressor market is in a weight reduction phase right now. Titanium manufacturing has gotten accessible enough that cans which would have cost $1,500–2,000 five years ago are now priced at $800–1,000. SilencerCo's Spectre 9 is the latest example — an all-titanium 9mm suppressor that weighs less than a loaded Glock 19 magazine and still carries a full-auto rating.</p>

<h2>The Weight Number</h2>
<p>3.9 ounces is a legitimate specification for a full-sized 9mm suppressor. For context, most steel-tube 9mm cans run 8–12 ounces. The difference between a suppressed and unsuppressed pistol in terms of balance and handling is dramatically reduced when the can adds less than 4 ounces forward of the muzzle. For a competition shooter running a suppressed Open division gun, or a home defense pistol that lives on a nightstand, that weight reduction changes the feel of the platform substantially.</p>

<h2>Full-Auto Rated</h2>
<p>The Spectre 9 is full-auto rated for supersonic and subsonic 9mm, and for subsonic .300 BLK. On supersonic .300 BLK it's semi-auto only. That rating matters because the sustained heat and bolt velocity of a full-auto weapon cycle is significantly harder on suppressor baffles than semi-auto fire — a full-auto rating on a titanium can at this weight is an engineering accomplishment worth noting. SilencerCo knows how to build suppressors that last, and that reputation carries to the Spectre 9.</p>

<h2>Mounting and Compatibility</h2>
<p>Alpha-pattern mounting system — the same threads and piston housing used across SilencerCo's lineup. Pistol compatibility via the included Spectre Piston Housing Assembly means this isn't just a PCC/subgun can — it runs on semi-auto pistols with the right piston configuration. Ships with a tool and the piston housing assembly. No extra purchases required to mount it on a pistol out of the box.</p>

<h2>Specs</h2>
<p>Weight: 3.9 oz | Length: 4.76 inches | Rating: Full-auto for 9mm supersonic/subsonic and .300 BLK subsonic | Mount: Alpha-pattern | MSRP: $880</p>

<p><strong>Bottom Line:</strong> If you've been waiting for a titanium 9mm can that doesn't feel like a compromise, the Spectre 9 is it. Light, short, and built to run hard.</p>"""
  },
  {
    "title": "Mossberg 990 SPX Aftershock: Semi-Auto Tactical Shotgun Done Right",
    "brand": "Mossberg",
    "model": "990 Aftershock SPX",
    "category": "shotgun",
    "msrp": "$1,309",
    "caliber": "12 Gauge",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/shotgun.jpg",
    "summary": "The Mossberg 990 Aftershock SPX upgrades the compact 12-gauge platform with an SPX heat-shield handguard with M-LOK slots, a direct-mount optic cut for RMSc footprint dots, and improved ghost ring sights.",
    "body": """<p>The original 990 Aftershock was one of the most interesting shotgun introductions in recent years — a compact, pistol-grip semi-auto 12-gauge that ran reliably and opened a backdoor to short configurations without NFA paperwork because of its birdshead-grip classification. But it shipped with complaints: limited hand protection, no optic mounting that didn't require a Picatinny rail, and iron sights that needed work. The SPX version addresses all of it.</p>

<h2>The SPX Handguard</h2>
<p>Mossberg pulled the SPX handguard from the 940 Pro tactical line and fitted it to the 990. This envelops the barrel for heat protection, ships with M-LOK attachment points along the sides and bottom, and integrates a sling attachment point. It's a substantial upgrade over the original forend, which got uncomfortably hot during sustained fire and offered no accessory attachment without aftermarket work. The SPX handguard is purpose-built for a shotgun used under stress, not for casual range days.</p>

<h2>Optic Mounting</h2>
<p>Direct-mount RMSc footprint cut on the receiver. No Picatinny rail, no riser, no separate mount — the dot sits low over the bore. Compatible with Holosun EPS, Trijicon RMSc, Sig Romeo Zero, and others. The rear sight doubles as the optic's cover plate, which is a detail that shows actual thought rather than afterthought engineering. Ghost ring rear and protected front sight remain for iron backup.</p>

<h2>Legal Status and Capacity</h2>
<p>The 990 Aftershock SPX retains its classification as a "firearm" rather than a shotgun due to the birdshead grip configuration — not designed to be fired from the shoulder. This keeps the 11.5-inch barrel configuration outside traditional NFA short-barreled shotgun regulation. With the Mossberg-500-compatible stock adaptor, you can convert it to a shoulder stock configuration — which does create an NFA item, so plan accordingly. Standard capacity is 5 rounds; a +2 extension brings it to 7 on longer-barreled variants.</p>

<h2>Specs</h2>
<p>Gauge: 12 | Operation: Gas-operated semi-auto | Barrel: 11.5 inches | Capacity: 5 rounds | Handguard: SPX M-LOK heat shield | Optic: RMSc direct mount | MSRP: $1,309</p>

<p><strong>Bottom Line:</strong> Mossberg took the 990's best idea — compact, legal, semi-auto 12-gauge — and fixed everything that early adopters complained about. The SPX is what the original Aftershock should have been.</p>"""
  },
  {
    "title": "Mossberg 590RM Chisel: Folding Pump-Action Shotgun for the Compact Mission",
    "brand": "Mossberg",
    "model": "590RM Chisel",
    "category": "shotgun",
    "msrp": "$1,435",
    "caliber": "12 Gauge",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/shotgun.jpg",
    "summary": "The 590RM Chisel adds Chisel Machining's 7075 aluminum folding stock to Mossberg's magazine-fed 590 pump-action, delivering a compact 12-gauge package with M4-style adjustability and detachable double-stack magazines.",
    "body": """<p>The 590 pump-action is the most produced shotgun of all time. It has been in continuous service with the US military and law enforcement since the 1980s and Mossberg has never stopped iterating. The 590RM Chisel is the most interesting variant in years — it folds, feeds from detachable magazines, and still runs the proven 590 action that has earned its reputation over decades.</p>

<h2>The Chisel Machining Stock</h2>
<p>Chisel Machining produced the folding stock, and it's built properly. The knuckle is machined from 7075 aluminum — the same alloy used in AR lower receivers — with a push-button locking mechanism that holds locked in both the extended and folded positions. The stock attaches via a buffer tube-style mount that accepts M4-compatible stocks in eight length-of-pull positions, from 12.5 to 16.5 inches. When folded, the stock clears the receiver cleanly without snagging on the action or the magazine port.</p>

<h2>Magazine-Fed Operation</h2>
<p>The RM designation means detachable magazine. Mossberg's double-stack magazines for the 590 platform were the first production double-stack pump-action shotgun magazines when they were introduced — not a common thing in the industry. The magazine engages the receiver with integral stabilizing ribs for a positive lockup. For tactical applications where speed reloads matter more than hunting-style tube management, the RM configuration makes the 590 a genuinely different tool.</p>

<h2>NFA Status</h2>
<p>The 590RM Chisel is a Class 3 firearm — the folding stock and short configuration place it in NFA regulated territory. At $0 tax stamp, that's a different calculation than it was two years ago. Budget the $200 tax stamp cost on top of the $1,435 MSRP if you're buying this as-configured from a licensed dealer.</p>

<h2>Specs</h2>
<p>Gauge: 12 | Operation: Pump-action | Feed: Detachable double-stack magazine | Stock: Chisel 7075 aluminum folding | LOP adjustment: 12.5–16.5 inches | NFA: Yes | MSRP: $1,435</p>

<p><strong>Bottom Line:</strong> A folding, magazine-fed 590 is the most tactically configurable pump shotgun Mossberg has built. If you've been waiting to pick up an NFA item while the stamp is free, this is a strong candidate.</p>"""
  },
  {
    "title": "Ruger Red Label III: A Classic Over-Under Returns in 20-Gauge",
    "brand": "Ruger",
    "model": "Red Label III",
    "category": "shotgun",
    "msrp": "$1,899",
    "caliber": "20 Gauge",
    "isJustDropped": True,
    "approved": True,
    "imageUrl": "/img/photos/shotgun.jpg",
    "summary": "Ruger revives the Red Label over-under in a new 20-gauge configuration with walnut stock, classic checkering, inertia single trigger, and a premium case with five Tru-Choke tubes — available in 28- or 30-inch barrels.",
    "body": """<p>The original Ruger Red Label was one of the few American-made over-under shotguns that could hold its own against European competition in the field and on the sporting clays course. Production stopped in 2011 and the guns that remained on the market found willing buyers at a premium. The Red Label III brings it back in 20-gauge — a caliber that has grown in sporting use as shooters recognize that modern 20-gauge loads can match 12-gauge field performance at reduced weight.</p>

<h2>What Ruger Kept</h2>
<p>The Red Label III maintains the classic aesthetic that made the original desirable. The walnut stock is fitted with traditional checkering on the grip and forend. The receiver is properly proportioned for 20-gauge — it doesn't run a 12-gauge receiver with a smaller bore, which is a common shortcut that produces a gun that feels too heavy for the caliber. The single selective trigger uses an inertia system — reliable, self-cleaning, and consistent across shell sizes and loads. Automatic tang safety returns the gun to safe after each shot opened.</p>

<h2>New Engineering</h2>
<p>Ruger updated the locking mechanism and ejector system for the III designation. The barrels headspace tighter than the original production, and the forcing cones are longer — which reduces felt recoil and improves pattern consistency with modern shot charges. The five included Tru-Choke-style tubes cover everything from Cylinder to Full. The receiver is drilled and tapped for scope or red dot mounting, which the original was not.</p>

<h2>The 20-Gauge Case for Sporting Clays</h2>
<p>Sporting clays and skeet shooters have discovered that 20-gauge forces better technique — the pattern is smaller, the gun moves faster, and the lighter weight reduces fatigue over a 100-bird round. The Red Label III at 28 or 30 inches in 20-gauge is a legitimate choice for competitive sporting clays that doesn't require spending $5,000+ on Italian guns to get quality hardware.</p>

<h2>Specs</h2>
<p>Gauge: 20 | Barrel: 28 or 30 inches | Chamber: 2.75- and 3-inch | Trigger: Inertia single selective | Stock: American walnut | Chokes: 5 Tru-Choke tubes included | MSRP: $1,899</p>

<p><strong>Bottom Line:</strong> The Red Label is back and it's better engineered than the original. For a sporting clays gun or upland bird season, the 20-gauge Red Label III is a serious American option in a segment dominated by European imports.</p>"""
  },
]

print(f"Creating {len(RELEASES)} firearm release articles...")
mutations = []

for r in RELEASES:
    slug = slugify(r['title'])
    _id  = "release-" + hashlib.md5(slug.encode()).hexdigest()[:16]
    doc  = {
        "_id":           _id,
        "_type":         "firearmRelease",
        "title":         r["title"],
        "slug":          {"_type": "slug", "current": slug},
        "brand":         r["brand"],
        "model":         r["model"],
        "category":      r["category"],
        "msrp":          r["msrp"],
        "caliber":       r["caliber"],
        "summary":       r["summary"],
        "body":          r["body"],
        "imageUrl":      r["imageUrl"],
        "approved":      r["approved"],
        "isJustDropped": r.get("isJustDropped", True),
        "publishedAt":   "2026-06-01T12:00:00.000Z",
        "autoGenerated": False,
    }
    mutations.append({"createOrReplace": doc})

# Batch in groups of 5 to avoid timeout
created = 0
for i in range(0, len(mutations), 5):
    batch = mutations[i:i+5]
    result = mutate(batch)
    created += len(batch)
    print(f"  Created {created}/{len(mutations)}...")
    time.sleep(0.5)

print(f"\nDONE: {created} gun release articles created in Sanity")
