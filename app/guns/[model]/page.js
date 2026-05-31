import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import Link from 'next/link'

export const revalidate = 86400

// Comprehensive static gun database — no API call on every render
const GUN_DATA = {
  'glock-17': {
    name:'Glock 17 Gen5', manufacturer:'Glock Ges.m.b.H.', country:'Austria', type:'Pistol',
    caliber:'9mm Luger (9x19mm)', action:'Striker-fired (Safe Action)', capacity:'17+1',
    barrel:'4.49"', weight:'25.17 oz unloaded', length:'8.03"', width:'1.26"', height:'5.47"',
    introduced:1982, msrp:'$549–$649', image:'/img/guns/glock-17.jpg',
    summary:'The Glock 17 is the handgun that redefined what a service pistol could be. Introduced in 1982 after Austria\'s military sought a new sidearm, the G17 shocked the industry with its polymer frame — dismissed at first as a "plastic gun" — that proved dramatically more reliable, lighter, and cheaper to manufacture than its all-steel competitors. Its Safe Action trigger system eliminated external hammers and manual safeties while maintaining three independent safety mechanisms. By the 1990s, it had become the standard-issue sidearm for over 65% of US law enforcement agencies.',
    summary2:'Today the Gen5 variant features the Marksman Barrel for improved accuracy, a flared magwell for faster reloads, ambidextrous slide stops, and the Modular Optic System (MOS) plate for direct red dot mounting. The G17 remains the benchmark against which every service pistol is measured — not because it\'s the flashiest option, but because in 40+ years it has simply never stopped working.',
    variants:['G17 Gen5 MOS (optics ready)','G17L (long slide competition)','G17 Gen5 FS (front serrations)','G17C (compensated, discontinued)','G17 OD (Olive Drab frame)'],
    uses:['Law enforcement duty pistol','Military sidearm','Home defense','Competition (USPSA, IDPA)'],
    pros:['Proven 40-year reliability record','Largest aftermarket ecosystem of any pistol','Gen5 Marksman Barrel delivers sub-2" groups at 25 yards','17+1 capacity standard','Easy to service and modify'],
    cons:['Full-size frame too large for some EDC applications','Factory trigger adequate but not exceptional','Utilitarian aesthetics — no beauty premium'],
    specs:[['Action','Safe Action (striker-fired)'],['Frame','Polymer (glass-filled nylon)'],['Slide','Tenifer-coated steel'],['Trigger Pull','~5.5 lbs'],['Sights','White dot front, notch rear (MOS optic-ready)'],['Grip','Modular backstrap system']],
    url:'https://us.glock.com/en/pistols/g17',
  },
  'glock-19': {
    name:'Glock 19 Gen5', manufacturer:'Glock Ges.m.b.H.', country:'Austria', type:'Pistol',
    caliber:'9mm Luger', action:'Striker-fired (Safe Action)', capacity:'15+1',
    barrel:'4.02"', weight:'23.65 oz', length:'7.36"', width:'1.26"', height:'5.04"',
    introduced:1988, msrp:'$499–$599', image:'/img/guns/glock-19.jpg',
    summary:'The Glock 19 is the most popular pistol in the United States by virtually every metric — police departments, military units, civilian purchases, and competition registrations. Introduced in 1988 as a compact version of the G17, it achieves a near-perfect balance between capacity (15+1), concealability (4" barrel), and shootability that no other pistol has matched in sustained popularity over four decades.',
    summary2:'The Gen5 version receives the same improvements as the G17 Gen5 including the Marksman Barrel, ambidextrous controls, and Glock Rough Texture (GRT) frame. The MOS variant adds direct optic mounting. Among professional firearms instructors, it is by far the most commonly recommended first handgun purchase — its size works for EDC, home defense, competition, and training.',
    variants:['G19 Gen5 MOS','G19X (tan, no rail version)','G19 Gen5 FS','G19 Gen4','G19C (compensated)'],
    uses:['Everyday carry (EDC)','Home defense','Law enforcement backup','Competition'],
    pros:['Best all-around compact pistol','15+1 capacity in concealable package','Enormous holster and accessory ecosystem','Accepts G17 17-round magazines','Proven billions of rounds worldwide'],
    cons:['May be too large for small hands','Factory trigger has mushy reset','Not the slimmest option for deep concealment'],
    specs:[['Action','Safe Action'],['Frame','Polymer'],['Optics','MOS variant available'],['Rail','Picatinny (standard)'],['Sights','White dot / notch']],
    url:'https://us.glock.com/en/pistols/g19',
  },
  'glock-43x': {
    name:'Glock 43X', manufacturer:'Glock Ges.m.b.H.', country:'Austria', type:'Pistol',
    caliber:'9mm Luger', action:'Striker-fired (Safe Action)', capacity:'10+1 (flush) / 15+1 (Shield Arms)',
    barrel:'3.41"', weight:'18.7 oz unloaded', length:'6.5"', width:'1.1"', height:'5.04"',
    introduced:2019, msrp:'$529–$599', image:'/img/photos/pistol.jpg',
    summary:'The Glock 43X answered the most requested feature in Glock\'s history: a single-stack slim pistol with a full-size grip for EDC. Combining the G43\'s slim 1.1" width with the taller G48 frame, the G43X provides a 10-round magazine in a package that disappears on the hip. The MOS variant adds Glock\'s Modular Optic System for direct mounting of micro red dot sights.',
    summary2:'The aftermarket transformed the G43X with Shield Arms S15 magazines, which fit flush and give 15+1 capacity — making it arguably the best EDC pistol dollar-for-dollar. The combination of Glock reliability, slim profile, and 15-round capacity with the Shield Arms upgrade has made it one of the fastest-growing pistol platforms in the US.',
    variants:['G43X MOS (optics ready)','G43X with Shield Arms S15 mags','Standard G43X'],
    uses:['Everyday carry','Appendix IWB carry','Off-duty LEO carry','Compact home defense'],
    pros:['Slim 1.1" width disappears on body','MOS optics platform','Shield Arms gives 15+1 with flush mag','Glock reliability and serviceability','Wide holster selection'],
    cons:['10+1 factory capacity (fix with Shield Arms)','Small grip for large hands','No manual safety'],
    specs:[['Trigger','~6 lbs pull'],['Frame','Polymer with GRT texture'],['Sights','White dot front, notch rear (MOS: optic-ready)'],['Rail','None (slimline series)']],
    url:'https://us.glock.com/en/pistols/g43x',
  },
  'sig-p320': {
    name:'SIG Sauer P320', manufacturer:'SIG Sauer', country:'USA/Germany', type:'Pistol',
    caliber:'9mm / .40 S&W / .357 SIG / .45 ACP', action:'Striker-fired', capacity:'17+1 (9mm full-size)',
    barrel:'4.7" (full-size)', weight:'29.5 oz', length:'8.0"', width:'1.3"', height:'5.5"',
    introduced:2014, msrp:'$679–$799', image:'/img/guns/sig-p320.jpg',
    summary:'The SIG Sauer P320 became one of the most consequential pistol designs of the 21st century when the US Army selected it as the M17 in 2017, ending a 30-year reign by the Beretta M9. The P320\'s revolutionary feature is its serialized Fire Control Unit (FCU) — a removable chassis that is the legal firearm. The frame, slide, and barrel are accessories, allowing the same FCU to be reconfigured from compact to full-size to subcompact.',
    summary2:'The P320-M17 military variant features a manual thumb safety at the Army\'s request. The civilian P320 Spectre Comp, with its integrated compensator and optic-ready slide, represents the pinnacle of the platform\'s development. Despite a high-profile drop-fire incident in 2017 (subsequently addressed via the Voluntary Upgrade Program), the P320 has earned its place as one of the finest striker-fired pistols available.',
    variants:['P320 X5 Legion (competition)','P320 Spectre Comp','P320-M17 (military config)','P320 AXG (aluminum frame)','P320 Compact','P320 Subcompact'],
    uses:['Military sidearm (M17)','Law enforcement','Competition shooting','Defensive carry'],
    pros:['Modular FCU — one serialized part, infinite configs','Best flat trigger of any striker-fired pistol','US military M17 selection','Available in multiple calibers','Excellent out-of-box accuracy'],
    cons:['Heavier than polymer-only competitors','2017 drop-fire incident (resolved, but perception lingered)','Higher price than Glock'],
    specs:[['FCU','Serialized removable chassis'],['Trigger','Flat-faced, crisp 6.5 lb pull'],['Frame','Modular polymer (multiple sizes)'],['Optics','ROMEO1 Pro optic cut standard on many variants']],
    url:'https://www.sigsauer.com/p320.html',
  },
  'sig-p365': {
    name:'SIG Sauer P365 XL', manufacturer:'SIG Sauer', country:'USA', type:'Pistol',
    caliber:'9mm Luger', action:'Striker-fired', capacity:'12+1 (flush) / 15+1 (extended)',
    barrel:'3.7"', weight:'20.7 oz', length:'6.6"', width:'1.1"', height:'4.8"',
    introduced:2019, msrp:'$649–$699', image:'/img/photos/pistol.jpg',
    summary:'The P365 XL is the evolution of SIG\'s micro-compact revolution. The original P365 (2018) broke the rule that micro-compacts had to sacrifice capacity — delivering 10+1 in an impossibly small package. The XL extends the barrel to 3.7" and the grip to accept 12-round flush magazines, improving both accuracy and controllability without significantly increasing size. It is widely considered the best striker-fired trigger available in a carry pistol.',
    summary2:'The P365 XL\'s optic-ready slide (ROMEO Zero Elite cut) and flat trigger have made it the choice of serious concealed carriers who demand performance, not just concealability. Its combination of 12+1 capacity, 1.1" width, and a trigger that rivals custom work has made the P365 platform the fastest-growing pistol line in American history.',
    variants:['P365 XL ROMEO Zero Elite','P365 X-MACRO (17+1, integrated comp)','P365 SAS (no snag)','P365 NRA Edition','P365 Manual Safety'],
    uses:['Everyday carry','Appendix carry','Duty backup','Training'],
    pros:['Best trigger in class by near-universal consensus','12+1 in micro-compact size','ROMEO Zero optic cut standard','Slim 1.1" width','Excellent accuracy for barrel length'],
    cons:['Premium price','Requires quality holster for optic-equipped carry','Smaller grip may challenge large hands'],
    specs:[['Trigger','Flat, ~5 lb pull'],['Optics','ROMEO Zero Elite cut (XL standard)'],['Rail','1913 Picatinny'],['Magazine','Flush 12rd / extended 15rd']],
    url:'https://www.sigsauer.com/p365-xl.html',
  },
  'ar-15': {
    name:'AR-15 (Direct Impingement)', manufacturer:'Multiple (original: ArmaLite)', country:'USA', type:'Rifle',
    caliber:'5.56x45mm NATO / .223 Remington / multiple', action:'Semi-automatic, gas-operated direct impingement',
    capacity:'30+1 (STANAG)', barrel:'16" (civilian standard)', weight:'6.5–8 lbs', length:'34–36" (carbine stock)',
    introduced:1963, msrp:'$599–$2,999+', image:'/img/guns/ar-15.jpg',
    summary:'The AR-15 is the most popular rifle in American history, with an estimated 20+ million in civilian hands as of 2024. Designed by Eugene Stoner at ArmaLite in the late 1950s, it was adopted by the US military as the M16 in 1963. The civilian semi-automatic variant became available to the public and has since been continuously refined into the most modular firearm platform ever created. Every major component — barrel, handguard, stock, trigger, upper receiver, lower receiver — is interchangeable across manufacturers adhering to Mil-Spec tolerances.',
    summary2:'The AR-15\'s dominance comes from its ergonomics (inline recoil reduces muzzle rise), modularity (thousands of accessories), affordability of the 5.56mm cartridge (enabling high-volume training), and the depth of aftermarket support. From $599 Anderson lowers to $3,000+ Daniel Defense rifles, the platform scales across every budget. It is the benchmark for modern sporting rifles and the focal point of most 2A political debate.',
    variants:['M4 Carbine (military, full-auto)','Daniel Defense DDM4','BCM Recce-16','Aero Precision M4E1','Anderson Manufacturing AM-15','CMMG MkGs (.45 ACP variant)','Ruger SR-556 (piston variant)'],
    uses:['Home defense','3-Gun competition','Varmint/predator hunting','Service rifle competition','General-purpose rifle'],
    pros:['Most modular platform in history','Enormous aftermarket — millions of parts available','5.56 ammo is affordable and widely available','Lightweight 6–7 lbs in basic configuration','Low recoil, easy follow-up shots'],
    cons:['Direct impingement runs hotter and dirtier than piston','Proprietary cartridge restricted in some states','Politically targeted — regulatory risk'],
    specs:[['Buffer System','Mil-Spec carbine (other configs available)'],['Gas System','Direct impingement (or piston in some variants)'],['Handguard','M-LOK standard on modern builds'],['Lower','Mil-Spec (accepts all standard AR-15 uppers)']],
    url:'https://www.armalite.com',
  },
  'ak-47': {
    name:'AK-47 / AKM', manufacturer:'Kalashnikov Concern (original)', country:'Russia (multiple licensees)', type:'Rifle',
    caliber:'7.62x39mm', action:'Semi-automatic (civilian), gas-operated long-stroke piston',
    capacity:'30+1', barrel:'16.5"', weight:'8.5 lbs', length:'34.6"',
    introduced:1947, msrp:'$799–$1,800 (WASR to Arsenal)', image:'/img/guns/ak-47.jpg',
    summary:'Designed by Mikhail Kalashnikov in 1946 and adopted by the Soviet Army in 1947, the AK-47 and its successor the AKM are the most widely produced firearms in human history — with an estimated 100 million manufactured across all variants. Its long-stroke gas piston system, loose tolerances, and chrome-lined barrel give it legendary reliability in mud, sand, and extreme temperatures that would compromise direct impingement systems.',
    summary2:'American civilian AKs are typically imported semi-automatic rifles (WASR-10 from Romania, Zastava ZPAP from Serbia) or American-made variants (Arsenal, Ohio Ordnance). The 7.62x39mm cartridge delivers substantially more energy than 5.56mm at short to medium ranges. Sanctions following 2022 have impacted Russian-made AK imports, driving prices upward on remaining inventory.',
    variants:['AKM (modernized AK-47)','WASR-10 (Romanian import)','Zastava ZPAP M70 (Serbian)','Arsenal SLR-107 (Bulgarian)','Galil ACE (Israeli variant)','AK-12 (latest Russian military)'],
    uses:['General-purpose rifle','Hunting (7.62x39 effective for deer)','Home defense','Collection'],
    pros:['Legendary reliability in adverse conditions','7.62x39 hits harder than 5.56 at close range','Simpler piston system stays cleaner longer','Iconic status and design','Strong import market (non-Russian)'],
    cons:['Less modular than AR-15','Heavier than comparable ARs','Less aftermarket in US','Rear-tang safety is awkward for US shooters','7.62x39 more expensive than 5.56'],
    specs:[['Piston','Long-stroke gas piston'],['Barrel','Chrome-lined (most variants)'],['Furniture','Wood or polymer depending on variant'],['Safety','Lever-type (right side, awkward for right-handers)']],
    url:'https://zastavarms.com',
  },
  'remington-870': {
    name:'Remington 870 Express', manufacturer:'Remington Arms', country:'USA', type:'Shotgun',
    caliber:'12 Gauge (also .410, 20 gauge, 16 gauge)', action:'Pump-action', capacity:'4+1 (standard), 7+1 (extended)',
    barrel:'18.5" (home defense)', weight:'7.5 lbs', length:'38.25"',
    introduced:1950, msrp:'$350–$500', image:'/img/guns/remington-870.jpg',
    summary:'The Remington 870 is the best-selling shotgun in American history, with over 12 million produced since its introduction in 1950. Its twin action bars (vs single on Winchester 1300) give it the smoothest pump stroke in the category, earning it a reputation for slickness that has made it the standard against which all pump shotguns are measured. It was the standard US military shotgun (M870 MCS) and continues to serve in law enforcement.',
    summary2:'Note: Remington\'s 2020 bankruptcy and subsequent acquisition by Vista Outdoor affected quality control on post-2020 production. Pre-bankruptcy 870s command higher used prices. The 870 faces stiff competition from the Mossberg 500/590 — which has a more durable aluminum receiver vs the 870\'s steel, and the Mossberg\'s tang safety is more ergonomic for most shooters. New production quality has reportedly improved under Vista ownership.',
    variants:['870 Express (base)','870 Wingmaster (polished)','870 TAC-14 (non-NFA short)','870 Police Magnum','870 Marine Magnum (nickel)','870 DM (detachable magazine)'],
    uses:['Home defense','Waterfowl hunting','Upland bird hunting','3-Gun competition'],
    pros:['Smoothest pump stroke in class','12 million produced — enormous parts availability','Proven 70-year reliability','Versatile — handles all 2.75" and 3" shells'],
    cons:['Post-2020 QC concerns (Vista ownership)','Single extractor vs Mossberg\'s dual','Crossbolt safety (vs superior tang safety on Mossberg)','Receiver can crack under heavy use'],
    specs:[['Action','Dual action bars (smooth pump)'],['Receiver','Steel',''],['Shell Capacity','4+1 standard, 7+1 extended'],['Choke','RemChoke system (interchangeable)']],
    url:'https://www.remington.com/shotguns/pump-action',
  },
  'mossberg-500': {
    name:'Mossberg 500', manufacturer:'O.F. Mossberg & Sons', country:'USA', type:'Shotgun',
    caliber:'12 Gauge / 20 Gauge / .410 Bore', action:'Pump-action', capacity:'5+1 (standard 18.5" barrel)',
    barrel:'18.5" (home defense)', weight:'7.25 lbs', length:'38.5"',
    introduced:1960, msrp:'$349–$499', image:'/img/guns/mossberg-500.jpg',
    summary:'The Mossberg 500 is the only pump shotgun to pass military torture testing and earn a US military contract (the 590A1 variant). Its ambidextrous tang safety — positioned at the top rear of the receiver within thumb reach — is universally considered superior to the crossbolt safety on competing Remington designs. The aluminum receiver, while sometimes criticized as "weaker," is actually less prone to cracking under firing stress than steel when properly designed.',
    summary2:'The 500\'s twin extractors provide more reliable ejection than the 870\'s single extractor, and its modular design allows barrel swaps without tools. The 590A1 variant meets MIL-SPEC requirements for the US military and is the gold standard for defensive shotguns. For home defense on any budget, the Mossberg 500 and 590 are the most recommended platforms.',
    variants:['Mossberg 590A1 (mil-spec)','Mossberg 590S (1.75" mini shells)','Mossberg 500 Cruiser (pistol grip)','Mossberg 590 Shockwave (non-NFA)','Mossberg 500 ATI Scorpion'],
    uses:['Home defense','Tactical/law enforcement','Bird hunting','3-Gun competition'],
    pros:['Tang safety is superior to crossbolt designs','Passes US military MIL-SPEC testing (590A1)','Ambidextrous design','Aluminum receiver resists cracking','Most affordable quality defensive shotgun'],
    cons:['Aluminum receiver perceived as weaker (unfounded concern)','Trigger quality not exceptional','Less smooth pump than 870 (though reliability is equal)'],
    specs:[['Safety','Ambidextrous tang',''],['Extractors','Dual (more reliable ejection)'],['Receiver','Aluminum alloy'],['Choke','Accu-Choke interchangeable']],
    url:'https://www.mossberg.com/series/500/',
  },
  'mossberg-590a1': {
    name:'Mossberg 590A1', manufacturer:'O.F. Mossberg & Sons', country:'United States', type:'Shotgun',
    caliber:'12 Gauge (3" chamber)', action:'Pump-action', capacity:'9+1 (20" barrel)',
    barrel:'20" heavy-wall (0.230" vs standard 0.200")', weight:'7.25 lbs', length:'41"', width:'N/A', height:'N/A',
    introduced:1987, msrp:'$649–$799', image:'/img/guns/mossberg-590a1.jpg',
    summary:'The Mossberg 590A1 is the only pump-action shotgun to pass US military MIL-SPEC testing (MIL-S-3443E), earning contracts with every branch of the US military and law enforcement agencies worldwide. The A1 designation indicates the heavy-wall barrel, metal trigger group, and drilled-and-tapped receiver that separate it from the standard 590. It is, without qualification, the gold standard for defensive and duty shotguns.',
    summary2:'The heavy-wall barrel resists damage from breaching operations and sustained fire that would warp a standard barrel. The aluminum alloy receiver — often criticized by those who have not run the platform hard — is actually less likely to crack under sustained fire than steel because aluminum flexes rather than fracturing. The tang safety is ambidextrous by nature and positioned for thumb activation without breaking grip. For home defense, military applications, or law enforcement, no pump shotgun has a better proven track record.',
    variants:['590A1 with Ghost Ring Sights', '590A1 with Pistol Grip', '590A1 with Adjustable Stock', '590A1 SPX (M-LOK)', '590A1 Retrograde'],
    uses:['Military/Law enforcement duty', 'Home defense', 'Breaching', 'Competition (3-gun)'],
    pros:['Only pump shotgun to pass US military MIL-SPEC', 'Heavy-wall barrel for durability', 'Ambidextrous tang safety', 'Metal trigger group (not plastic)', 'Accepts 2.75" and 3" shells', '9+1 capacity with 20" barrel'],
    cons:['Heavier than standard 500', 'Higher price point than 500', 'Limited aftermarket vs AR-platform', 'Learning curve on tang safety for new shooters'],
    specs:[['Action','Pump-action, dual extractors'],['Feed','Tubular magazine'],['Safety','Ambidextrous tang safety'],['Receiver','Aluminum alloy, drilled & tapped'],['Barrel Wall','Heavy-wall (0.230" thickness)'],['Sights','Bead front (ghost ring optional)'],['Standard','Meets MIL-SPEC MIL-S-3443E']],
    url:'https://www.mossberg.com/series/590a1/',
  },
  'ruger-10-22': {
    name:'Ruger 10/22 Carbine', manufacturer:'Sturm, Ruger & Co.', country:'USA', type:'Rifle',
    caliber:'.22 Long Rifle', action:'Semi-automatic, blowback operated', capacity:'10+1 (factory), 25+ (aftermarket)',
    barrel:'18.5"', weight:'5.0 lbs', length:'37.25"',
    introduced:1964, msrp:'$279–$349', image:'/img/guns/ruger-10-22.jpg',
    summary:'The Ruger 10/22 has been in continuous production since 1964, making it one of the most produced semi-automatic rifles in history. Its rotary magazine design (BX-1) feeds .22 LR with exceptional reliability, avoiding the feeding issues that plague box magazines with the rimmed .22 cartridge. At 5 lbs and virtually no recoil, it is the definitive introduction platform for new shooters.',
    summary2:'The 10/22\'s true secret weapon is its aftermarket ecosystem — arguably the deepest of any firearm in history relative to its price. Volquartsen triggers, Kidd match barrels, Boyds stocks, and a dozen chassis systems transform the platform from a $300 plinker to a legitimate precision rifle. The 10/22 in competition configuration regularly outperforms purpose-built precision .22 rifles costing twice as much.',
    variants:['10/22 Carbine (standard)','10/22 Takedown','10/22 Target (heavy barrel)','10/22 Competition','10/22 Sporter','Charger Pistol (10.5" barrel)'],
    uses:['Training and practice','Small game and squirrel hunting','Competition (.22 rimfire events)','Youth introduction to shooting','Plinking'],
    pros:['Best .22 platform ever made — period','Deepest aftermarket of any rifle','5 lbs weight ideal for new shooters','Rotary magazine feeds .22 reliably','Affordable operation: ~$0.07/round'],
    cons:['Limited to .22 LR (obvious constraint)','Factory trigger mediocre (easy and cheap to upgrade)','10-round factory magazine (higher capacity available)'],
    specs:[['Magazine','BX-1 rotary (10rd) or BX-25 (25rd)'],['Sights','Adjustable rear, blade front'],['Stock','Hardwood or synthetic'],['Rail','Scope rail standard']],
    url:'https://www.ruger.com/products/1022/models.html',
  },
  'smith-wesson-mp9': {
    name:'Smith & Wesson M&P 9 M2.0', manufacturer:'Smith & Wesson', country:'USA', type:'Pistol',
    caliber:'9mm Luger', action:'Striker-fired', capacity:'17+1',
    barrel:'4.25"', weight:'27.2 oz', length:'7.4"', width:'1.3"', height:'5.5"',
    introduced:2005, msrp:'$499–$569', image:'/img/guns/smith-wesson-mp9.jpg',
    summary:'The M&P (Military & Police) 9 M2.0 is Smith & Wesson\'s evolved answer to polymer striker pistols, representing a significant improvement over the original 2005 M&P platform. The M2.0 features an aggressive 18 LPI grip texture, a revised trigger with a tactile and audible reset, four interchangeable palm swell inserts, and a stainless steel chassis for improved accuracy.',
    summary2:'The M&P platform is the duty pistol of choice for agencies that want an American-made alternative to Glock. The Performance Center variants (M&P 9 M2.0 PC) feature ported barrels and slides, enhanced triggers, and OptiLock optic mounts. The Shield Plus (single-stack variant) rounds out the lineup for EDC applications. S&W\'s APRON trigger upgrade transforms the M2.0\'s already-improved trigger into a genuine competition-grade unit.',
    variants:['M&P 9 M2.0 Compact','M&P 9 M2.0 Full-Size','M&P 9 M2.0 Performance Center (ported)','M&P 9 Shield EZ','M&P 9 Shield Plus','M&P 9 M2.0 OR (optic-ready)'],
    uses:['Law enforcement duty pistol','Home defense','Competition','EDC (compact variant)'],
    pros:['Aggressive grip texture','Multiple palm swell inserts for fit','American-made','Improved M2.0 trigger','Good value vs Glock at same price point'],
    cons:['Trigger still not as crisp as P320 or Walther PPQ','Heavier than Glock','Less aftermarket than Glock'],
    specs:[['Trigger','M2.0 revised (~6.5 lbs)'],['Frame','Polymer with steel chassis'],['Grip','Aggressive 18 LPI texture + 4 palm swells'],['Optics','OR variant available']],
    url:'https://www.smith-wesson.com/handguns/m-p-m2-0',
  },
  'cz-p10c': {
    name:'CZ P-10 C', manufacturer:'Česká zbrojovka (CZ)', country:'Czech Republic', type:'Pistol',
    caliber:'9mm Luger', action:'Semi-automatic, striker-fired', capacity:'15+1',
    barrel:'4.02"', weight:'26 oz', length:'7.3"', width:'1.26"', height:'5.4"',
    introduced:2017, msrp:'$499–$549', image:'/img/photos/pistol.jpg',
    summary:"The CZ P-10 C is a Czech-made striker-fired pistol built to challenge the Glock 19 on its own turf. CZ engineers studied what shooters wanted and delivered an ergonomically superior grip angle, a shorter reset trigger, and a bore axis competitive with any polymer gun on the market. Law enforcement agencies across Europe adopted it immediately. American shooters caught on fast once they got their hands on one.",
    summary2:"The P-10 C has earned a reputation for out-of-the-box accuracy that surprises people expecting budget-tier performance from its price point. The trigger is notably better than Glock's standard trigger. CZ machined the frame rails directly into the polymer \u2014 they don't use inserts. The gun ships with two 15-round magazines, night sights on the Optics Ready variant, and an omega trigger system borrowed from CZ's legendary 75 series.",
    variants:["P-10 C (standard)", "P-10 C OR (Optics Ready)", "P-10 C Suppressor Ready", "P-10 F (full-size)", "P-10 S (sub-compact)"],
    uses:["Concealed carry", "Duty/service", "Home defense", "Competition"],
    pros:["Better ergonomics than Glock 19", "Excellent trigger out of box", "Aggressive grip texture", "Competitive price", "Growing aftermarket"],
    cons:["Smaller aftermarket than Glock", "Grip panels not interchangeable", "Less brand recognition for resale"],
    specs:[["Frame", "Polymer with steel rails"], ["Trigger Pull", "~5 lbs"], ["Safety", "Trigger safety"], ["Sights", "Fixed 3-dot (night sights optional)"], ["Rail", "Picatinny MIL-STD-1913"], ["Finish", "Nitride"]],
    url:"https://cz-usa.com/product-category/pistols/p-10-series/",
  },
  'walther-pdp': {
    name:'Walther PDP', manufacturer:'Carl Walther GmbH', country:'Germany', type:'Pistol',
    caliber:'9mm Luger', action:'Semi-automatic, striker-fired', capacity:'18+1 (full)',
    barrel:'4" or 4.5"', weight:'25.4 oz', length:'7.4"', width:'1.3"', height:'5.7"',
    introduced:2021, msrp:'$649–$749', image:'/img/photos/pistol.jpg',
    summary:"The Walther PDP (Performance Duty Pistol) arrived in 2021 as Walther's answer to the question of what a modern duty pistol should be. The answer was Performance Duty Texture \u2014 the grippiest factory texture on any striker-fired pistol, a trigger that ships feeling like a competition gun, and a frame designed from the ground up around optic mounting without adapters.",
    summary2:"The PDP Pro SD (suppressor-ready) variant went straight into service with several European police agencies. The ergonomics are exceptional \u2014 Walther's grip geometry is unique in that the backstrap and palm swell work together to produce a natural point of aim. The factory trigger typically breaks around 5.5 lbs with zero mushiness. Aftermarket support is growing fast, and the performance-per-dollar puts more expensive guns to shame.",
    variants:["PDP Full-Size 4\"", "PDP Full-Size 4.5\"", "PDP Compact 4\"", "PDP F-Series", "PDP Pro SD"],
    uses:["Duty/service", "Concealed carry", "Competition", "Home defense"],
    pros:["Outstanding factory trigger", "Best-in-class grip texture", "Optic-ready without adapter", "Strong German manufacturing quality", "Excellent ergonomics"],
    cons:["Smaller aftermarket than Glock/SIG", "Higher price point", "Heavier than competitors"],
    specs:[["Frame", "Polymer"], ["Trigger", "Performance Duty (~5.5 lbs)"], ["Safety", "Trigger + internal safeties"], ["Sights", "Fiber optic front / adjustable rear"], ["Optic Mount", "Walther optic-ready (direct mount)"]],
    url:"https://www.waltherarms.com/pistols/pdp-series/",
  },
  'springfield-hellcat': {
    name:'Springfield Armory Hellcat', manufacturer:'Springfield Armory', country:'United States', type:'Pistol',
    caliber:'9mm Luger', action:'Semi-automatic, striker-fired', capacity:'11+1 (flush) / 13+1 (extended)',
    barrel:'3"', weight:'17.9 oz', length:'6"', width:'1.01"', height:'4"',
    introduced:2019, msrp:'$499–$599', image:'/img/photos/pistol.jpg',
    summary:"When the Hellcat launched in 2019, Springfield Armory set a world record for magazine capacity in its class: 11+1 in a gun smaller than the SIG P365. The Hellcat became one of the fastest-selling handguns in history. The Hellcat OSP (Optical Sight Pistol) version allowed direct optic mounting at a sub-$600 price point when competitors charged hundreds more for that capability.",
    summary2:"The Hellcat's 3-inch barrel and 1-inch width make it genuinely pocketable while still holding more rounds than most full-size guns from a decade ago. The High Hand Grip allows shooters to choke up significantly, reducing muzzle flip for a subcompact. The adaptive grip texture is aggressive where it needs to be without shredding shirt fabric during carry. Springfield's ADAPTIVE GRIP TEXTURE is a legitimate differentiator.",
    variants:["Hellcat Standard", "Hellcat OSP (Optic Ready)", "Hellcat Pro (3.7\" barrel)", "Hellcat RDP (with comp)"],
    uses:["Concealed carry (primary use case)", "Backup gun", "Off-duty carry"],
    pros:["World record capacity for size", "OSP is optic-ready sub-$600", "Excellent grip texture", "Flat trigger", "Very concealable"],
    cons:["Short sight radius (3\" barrel)", "Aggressive texture wears clothing", "Smaller aftermarket vs P365/Glock"],
    specs:[["Frame", "Polymer"], ["Barrel", "3\" Hammer-Forged Steel"], ["Sights", "Tritium U-Dot (standard)"], ["Optic", "OSP variant: direct mount"], ["Safety", "Trigger safety + striker block"]],
    url:"https://www.springfield-armory.com/hellcat-series/",
  },
  'daniel-defense-ddm4': {
    name:'Daniel Defense DDM4 V7', manufacturer:'Daniel Defense', country:'United States', type:'Rifle',
    caliber:'5.56 NATO / .223 Wylde', action:'Direct impingement, semi-automatic', capacity:'30+1 (STANAG)',
    barrel:'16" (carbine)', weight:'6.26 lbs', length:'32.25"–35.5"', width:'N/A', height:'N/A',
    introduced:2008, msrp:'$1,899–$2,100', image:'/img/photos/rifle.jpg',
    summary:"Daniel Defense built its reputation making barrel assemblies for the US military before civilians could buy a complete DD rifle. Every DDM4 starts with a cold-hammer-forged barrel \u2014 the same process military contractors use \u2014 held to tolerances that most consumer manufacturers don't advertise because they can't match them. The M4A1 profile barrel is optimized for sustained fire, not just range sessions.",
    summary2:"The DDM4 V7 became the benchmark for what a professional-grade AR-15 should feel like: tight upper-to-lower fit, no carrier tilt because the enhanced bolt carrier rides tighter in the upper, and a proprietary muzzle device that outperforms standard A2 flash hiders. DD's mil-spec Cerakote finish resists corrosion better than most competitors. These rifles are used by special operations units that could carry anything \u2014 they choose DD.",
    variants:["DDM4 V7 (standard)", "DDM4 V7 Pro", "DDM4 V7 LW", "DDM4 ISR (integrated suppressor)", "DDM4 PDW"],
    uses:["Home defense", "Competition", "Duty/patrol", "General sporting"],
    pros:["Cold hammer-forged barrel", "Mil-spec quality control", "Excellent accuracy", "Strong resale value", "Used by SOF units"],
    cons:["Premium price", "Heavier than budget ARs", "Long lead times during shortages"],
    specs:[["Barrel", "CHF, M4A1 profile, 1:7 twist"], ["Gas System", "Carbine-length"], ["Handguard", "Daniel Defense MFR 15.0 M-LOK"], ["Trigger", "Standard mil-spec"], ["Finish", "Cerakote Tornado"]],
    url:"https://danieldefense.com/rifles/ar-15/",
  },
  'tikka-t3x': {
    name:'Tikka T3x', manufacturer:'Tikka (SAKO/Beretta group)', country:'Finland', type:'Rifle',
    caliber:'Various (.308 Win, 6.5 Creedmoor, .30-06, etc.)', action:'Bolt-action', capacity:'3+1 (detachable magazine)',
    barrel:'22.4" (standard)', weight:'6.6 lbs', length:'42.5"', width:'N/A', height:'N/A',
    introduced:2016, msrp:'$699–$899', image:'/img/photos/rifle.jpg',
    summary:"The Tikka T3x is what happens when Finnish precision engineering meets a production budget. Tikka \u2014 owned by SAKO, itself owned by Beretta \u2014 builds the T3x on the same machinery that makes SAKO rifles at a fraction of the price. The result is factory accuracy guarantees (sub-MOA with quality ammunition) that boutique rifle builders charge ten times as much to promise.",
    summary2:"The T3x's cold-hammer-forged barrel is the heart of the package. Tikka's barrel-to-receiver fit is exceptionally tight, and the single-stage trigger is adjustable down to 2 lbs without gunsmithing. The synthetic stock is injection-molded with modular inserts for adjustability. Hunters who shoot precision long-range disciplines discovered the T3x through word of mouth \u2014 it's a precision rifle with a hunting rifle price tag.",
    variants:["T3x Lite", "T3x Tactical", "T3x UPR", "T3x Compact Tactical", "T3x CTR"],
    uses:["Hunting", "Long-range precision", "Target shooting"],
    pros:["Sub-MOA factory guarantee", "Excellent value for precision", "Detachable magazine", "Adjustable trigger", "Finnish manufacturing quality"],
    cons:["Limited US aftermarket vs Remington", "Magazines are expensive", "Not ideal for rapid follow-up shots"],
    specs:[["Barrel", "Cold hammer-forged"], ["Trigger", "Single-stage, adjustable 2\u20134 lbs"], ["Stock", "Synthetic modular"], ["Magazine", "Detachable polymer"], ["Action", "Smooth cone breech system"]],
    url:"https://www.tikka.fi/rifles/t3x",
  },
  'remington-700': {
    name:'Remington Model 700', manufacturer:'Remington Arms', country:'United States', type:'Rifle',
    caliber:'Various (.308 Win, .30-06, 6.5 Creedmoor, .223, etc.)', action:'Bolt-action', capacity:'4+1 (internal magazine)',
    barrel:'24" (standard)', weight:'7.5 lbs', length:'43.6"', width:'N/A', height:'N/A',
    introduced:1962, msrp:'$729–$1,099', image:'/img/photos/rifle.jpg',
    summary:"The Remington Model 700 is the most widely issued sniper rifle in US military history. The M24 Sniper Weapon System, the M40 used by the Marine Corps, and dozens of law enforcement precision rifles are all built on the Model 700 action. Over 5 million have been manufactured since 1962, making it the best-selling bolt-action rifle in American history by a wide margin.",
    summary2:"The 700's strength is the aftermarket ecosystem built around it over six decades. Every precision rifle smith in America knows the action. Every major stock manufacturer fits it. Every trigger manufacturer makes a drop-in replacement. The push-feed design is simple and reliable. The two-lug bolt locks up with zero slop. Professional snipers and weekend hunters have trusted the 700 for the same reasons since Lyndon Johnson was president.",
    variants:["700 ADL", "700 BDL", "700 SPS", "700 PCR", "700 5R", "700 AWR", "Custom Shop variants"],
    uses:["Hunting", "Precision/long-range", "Law enforcement sniper", "Military (M24/M40)"],
    pros:["Deepest aftermarket of any bolt-action", "Proven military heritage", "Excellent accuracy", "Wide caliber selection", "Strong resale"],
    cons:["Older design vs newer competitors", "Trigger requires upgrade for precision work", "Internal magazine limits capacity"],
    specs:[["Action", "Push-feed bolt, two lug"], ["Barrel", "Button-rifled"], ["Stock", "Walnut or synthetic"], ["Safety", "Three-position tang safety"], ["Trigger", "X-Mark Pro (adjustable)"]],
    url:"https://www.remington.com/rifles/bolt-action/",
  },
  'benelli-m2': {
    name:'Benelli M2 Field', manufacturer:'Benelli Armi SpA', country:'Italy', type:'Shotgun',
    caliber:'12 Gauge (3" chamber)', action:'Inertia-driven semi-automatic', capacity:'3+1',
    barrel:'26" or 28"', weight:'6.8 lbs', length:'47.5"', width:'N/A', height:'N/A',
    introduced:1993, msrp:'$1,399–$1,699', image:'/img/photos/shotgun.jpg',
    summary:"The Benelli M2 Field is the semi-automatic shotgun that hunters and competitive shooters reach for when they need maximum reliability in minimum weight. Benelli's patented Inertia Driven system uses recoil energy to cycle the action \u2014 there is no gas system to clean, tune, or foul. The M2 runs dirty, runs wet, and runs light loads that would choke gas-operated guns.",
    summary2:"Three-gun competitors discovered the M2 through USPSA and IPSC competition \u2014 it cycles fast, handles abuse, and the bolt release is one of the fastest on any semi-auto shotgun. Waterfowl hunters prize it for reliability in flooded timber and marsh conditions where gas guns fill with debris. The ComforTech stock absorbs recoil significantly better than competing designs, allowing faster target reacquisition.",
    variants:["M2 Field", "M2 3-Gun", "M2 Tactical", "M2 Turkey", "M2 Waterfowl"],
    uses:["Hunting (bird, turkey, waterfowl)", "3-Gun competition", "General sporting"],
    pros:["Inertia system: no gas ports to foul", "Very light for a semi-auto", "ComforTech recoil reduction", "Extremely reliable", "Fast cycle rate"],
    cons:["Requires 3\" loads to cycle reliably", "Higher price than gas guns", "Internal magazine only (field version)", "Limited home defense configuration"],
    specs:[["Action", "Inertia Driven semi-automatic"], ["Chamber", "3\" (2.75\" shells work)"], ["Stock", "ComforTech synthetic"], ["Chokes", "Crio Plus choke system"], ["Finish", "Matte black/synthetic"]],
    url:"https://www.benelliusa.com/m2-field",
  },
  'benelli-supernova': {
    name:'Benelli SuperNova', manufacturer:'Benelli Armi SpA', country:'Italy', type:'Shotgun',
    caliber:'12 Gauge (3.5" chamber)', action:'Pump-action', capacity:'4+1',
    barrel:'18.5" (tactical) / 26" or 28" (field)', weight:'7.9 lbs', length:'40"', width:'N/A', height:'N/A',
    introduced:2006, msrp:'$499–$649', image:'/img/photos/shotgun.jpg',
    summary:"The SuperNova is Benelli applying Italian engineering principles to the American pump shotgun. The rotating bolt \u2014 borrowed from the semi-automatic Nova \u2014 gives the SuperNova a lockup tighter than any standard dual-action-bar pump on the market. The receiver is molded into the stock as a single unit, eliminating the traditional two-piece design entirely.",
    summary2:"The SuperNova Tactical, with its 18.5-inch barrel and pistol grip, is one of the most capable defensive pump shotguns available. The ComforTech recoil reduction system makes 3.5-inch magnum loads manageable \u2014 no other pump shotgun can say that. Law enforcement agencies that train extensively with shotguns appreciate the SuperNova's durability and the tight lockup's effect on pattern consistency.",
    variants:["SuperNova Field", "SuperNova Tactical", "SuperNova ComforTech", "SuperNova Steady Grip"],
    uses:["Home defense", "Hunting (waterfowl, turkey)", "Law enforcement", "General sporting"],
    pros:["3.5\" chamber (most versatile)", "Rotating bolt lockup", "Composite receiver/stock unit", "ComforTech recoil reduction", "Benelli reliability"],
    cons:["Heavier than competitors", "Stock/receiver integration limits customization", "Price premium over Mossberg/Remington"],
    specs:[["Action", "Pump, rotating bolt"], ["Chamber", "3.5\" maximum"], ["Stock", "SteadyGrip or ComforTech synthetic"], ["Safety", "Top-mounted crossbolt"]],
    url:"https://www.benelliusa.com/supernova",
  },
  'silencerco-omega-36m': {
    name:'SilencerCo Omega 36M', manufacturer:'SilencerCo', country:'United States', type:'Suppressor',
    caliber:'.30 cal / multi-caliber (7.62 NATO, .308, .300BLK, 6.5CM, 5.56)', action:'NFA Title II device', capacity:'N/A',
    barrel:'N/A', weight:'13.8 oz', length:'7.62"', width:'1.57" diameter', height:'N/A',
    introduced:2020, msrp:'$899–$999', image:'/img/photos/suppressor.jpg',
    summary:"The SilencerCo Omega 36M is SilencerCo's answer to the single-suppressor question: one can to rule them all. The Omega 36M suppresses everything from .22 LR to .338 Lapua Magnum. It ships with multiple adapters covering the major thread patterns and calibers. SilencerCo's MAAD (Multi-Adapter Attachment Device) system allows tool-free caliber conversion in the field.",
    summary2:"The 36M weighs 13.8 oz \u2014 lighter than a loaded pistol magazine \u2014 yet delivers 34 dB of suppression on .308. The stainless and titanium construction survives sustained fire that destroys aluminum-tube suppressors. SilencerCo's reputation for quality was built on the original Omega; the 36M expands that capability across calibers. The Form 4 process still applies \u2014 expect 12-18 months for transfer approval.",
    variants:["Omega 36M (standard)", "Omega 36M with ASR mount (quick detach)"],
    uses:["Hunting (centerfire rifle)", "Precision/long-range shooting", "Home defense (with short-barreled rifle)", "General sporting"],
    pros:["True multi-caliber (.22\u2013.338 Lapua)", "Lightweight titanium construction", "MAAD system: no tools for caliber change", "Industry-leading suppression levels", "Strong resale value"],
    cons:["NFA: 12\u201318 month transfer wait", "$200 NFA tax stamp required", "Price premium vs single-caliber cans", "MAAD adds length"],
    specs:[["Construction", "Titanium/Stainless Steel"], ["Suppression", "~34 dB (.308 Win)"], ["Mount", "Direct thread + MAAD adapter"], ["Calibers", "5.56, .30 cal, .338 LM, multi"], ["Full Auto Rated", "Yes"]],
    url:"https://www.silencerco.com/products/omega-36m/",
  },
  'silencerco-omega-9k': {
    name:'SilencerCo Omega 9K', manufacturer:'SilencerCo', country:'United States', type:'Suppressor',
    caliber:'9mm (pistol caliber, subgun)', action:'NFA Title II device', capacity:'N/A',
    barrel:'N/A', weight:'7.9 oz', length:'4.64"', width:'1.375" diameter', height:'N/A',
    introduced:2015, msrp:'$649–$749', image:'/img/photos/suppressor.jpg',
    summary:"The SilencerCo Omega 9K was designed for one specific application: making a 9mm pistol or subgun as short and suppressed as physically possible. At 4.64 inches and under 8 ounces, the 9K adds minimal length to a host pistol. The K designation stands for Kurz \u2014 German for short \u2014 reflecting the design philosophy. SWAT teams and special operations units running suppressed MP5s and HK94s drove demand for exactly this product.",
    summary2:"The 9K's monocore baffle design allows disassembly for cleaning \u2014 important for suppressed pistol use because unsuppressed-rated handgun ammunition is wet and carbon-intensive. The triLUG mount (quick-detach) version attaches in a half-turn, making it practical for operators who need to go suppressed or unsuppressed quickly. SilencerCo's customer service has consistently ranked at the top of the industry.",
    variants:["Omega 9K (direct thread)", "Omega 9K with triLUG mount"],
    uses:["Suppressed pistol carry", "Subgun/PCC applications", "Home defense suppressed setup", "Law enforcement/military"],
    pros:["Extremely compact for 9mm", "Under 8 oz", "User-serviceable (take-apart)", "High-quality construction", "triLUG quick-detach available"],
    cons:["NFA paperwork/wait", "Single caliber (9mm only)", "No rifle caliber capability", "Short baffles = more first-round pop"],
    specs:[["Construction", "Titanium/Stainless"], ["Caliber", "9mm (.355 bore)"], ["Mount", "1/2\u00d728 direct thread (standard)"], ["Full Auto Rated", "Yes"], ["Service Life", "Unlimited (titanium/stainless)"]],
    url:"https://www.silencerco.com/products/omega-9k/",
  },
  'dead-air-sandman-s': {
    name:'Dead Air Sandman-S', manufacturer:'Dead Air Armament', country:'United States', type:'Suppressor',
    caliber:'.30 cal (7.62 NATO, .308 Win, .300BLK, .30-06, 6.5CM)', action:'NFA Title II device', capacity:'N/A',
    barrel:'N/A', weight:'17.4 oz', length:'7"', width:'1.5" diameter', height:'N/A',
    introduced:2015, msrp:'$999–$1,099', image:'/img/photos/suppressor.jpg',
    summary:"Dead Air built the Sandman-S around a simple idea: make a .30 caliber rifle suppressor that works as a quick-detach (QD) system from day one, without paying extra for an adapter. The KeyMo mounting system \u2014 Dead Air's proprietary QD design \u2014 ships with every Sandman and is compatible with Dead Air's own muzzle devices. The Sandman-S (Short version) balances suppression performance with overall length.",
    summary2:"The Sandman-S is rated for full-auto fire and has been tested with sustained belt-fed fire \u2014 a standard no aluminum suppressor can pass. The inconel and stainless steel construction adds weight but delivers a service life measured in hundreds of thousands of rounds. The dead-air baffle stack design creates excellent turbulent flow, delivering 30 dB of reduction on .308. Dead Air's KeyMo mount is arguably the most robust QD system on the market.",
    variants:["Sandman-S (short)", "Sandman-L (long)", "Sandman-K (compact)", "Sandman-Ti (titanium)"],
    uses:["Hunting (deer, elk)", "Long-range precision", "DMR/patrol rifle", "Home defense"],
    pros:["KeyMo QD: fastest detach in class", "Full-auto and belt-fed rated", "Industry-leading durability", "Excellent .308 suppression", "Strong US dealer network"],
    cons:["Heavier than titanium competitors", "NFA wait time", "Requires Dead Air muzzle device for QD", "Premium price"],
    specs:[["Construction", "Inconel/Stainless Steel"], ["Caliber", "Up to .30 cal"], ["Mount", "KeyMo QD (proprietary)"], ["Suppression", "~30 dB (.308)"], ["Full Auto Rated", "Yes \u2014 belt-fed tested"]],
    url:"https://www.deadairsilencers.com/product/sandman-s/",
  },
  'cz-p10c': {
    name:'CZ P-10 C', manufacturer:'Česká zbrojovka (CZ)', country:'Czech Republic', type:'Pistol',
    caliber:'9mm Luger', action:'Semi-automatic, striker-fired', capacity:'15+1',
    barrel:'4.02"', weight:'26 oz', length:'7.3"', width:'1.26"', height:'5.4"',
    introduced:2017, msrp:'$499–$549', image:'/img/photos/pistol.jpg',
    summary:"The CZ P-10 C is a Czech-made striker-fired pistol built to challenge the Glock 19 on its own turf. CZ engineers studied what shooters wanted and delivered an ergonomically superior grip angle, a shorter reset trigger, and a bore axis competitive with any polymer gun on the market. Law enforcement agencies across Europe adopted it immediately. American shooters caught on fast once they got their hands on one.",
    summary2:"The P-10 C has earned a reputation for out-of-the-box accuracy that surprises people expecting budget-tier performance from its price point. The trigger is notably better than Glock's standard trigger. CZ machined the frame rails directly into the polymer \u2014 they don't use inserts. The gun ships with two 15-round magazines, night sights on the Optics Ready variant, and an omega trigger system borrowed from CZ's legendary 75 series.",
    variants:["P-10 C (standard)", "P-10 C OR (Optics Ready)", "P-10 C Suppressor Ready", "P-10 F (full-size)", "P-10 S (sub-compact)"],
    uses:["Concealed carry", "Duty/service", "Home defense", "Competition"],
    pros:["Better ergonomics than Glock 19", "Excellent trigger out of box", "Aggressive grip texture", "Competitive price", "Growing aftermarket"],
    cons:["Smaller aftermarket than Glock", "Grip panels not interchangeable", "Less brand recognition for resale"],
    specs:[["Frame", "Polymer with steel rails"], ["Trigger Pull", "~5 lbs"], ["Safety", "Trigger safety"], ["Sights", "Fixed 3-dot (night sights optional)"], ["Rail", "Picatinny MIL-STD-1913"], ["Finish", "Nitride"]],
    url:"https://cz-usa.com/product-category/pistols/p-10-series/",
  },
  'walther-pdp': {
    name:'Walther PDP', manufacturer:'Carl Walther GmbH', country:'Germany', type:'Pistol',
    caliber:'9mm Luger', action:'Semi-automatic, striker-fired', capacity:'18+1 (full)',
    barrel:'4" or 4.5"', weight:'25.4 oz', length:'7.4"', width:'1.3"', height:'5.7"',
    introduced:2021, msrp:'$649–$749', image:'/img/guns/walther-pdp.jpg',
    summary:"The Walther PDP (Performance Duty Pistol) arrived in 2021 as Walther's answer to the question of what a modern duty pistol should be. The answer was Performance Duty Texture \u2014 the grippiest factory texture on any striker-fired pistol, a trigger that ships feeling like a competition gun, and a frame designed from the ground up around optic mounting without adapters.",
    summary2:"The PDP Pro SD (suppressor-ready) variant went straight into service with several European police agencies. The ergonomics are exceptional \u2014 Walther's grip geometry is unique in that the backstrap and palm swell work together to produce a natural point of aim. The factory trigger typically breaks around 5.5 lbs with zero mushiness. Aftermarket support is growing fast, and the performance-per-dollar puts more expensive guns to shame.",
    variants:["PDP Full-Size 4\"", "PDP Full-Size 4.5\"", "PDP Compact 4\"", "PDP F-Series", "PDP Pro SD"],
    uses:["Duty/service", "Concealed carry", "Competition", "Home defense"],
    pros:["Outstanding factory trigger", "Best-in-class grip texture", "Optic-ready without adapter", "Strong German manufacturing quality", "Excellent ergonomics"],
    cons:["Smaller aftermarket than Glock/SIG", "Higher price point", "Heavier than competitors"],
    specs:[["Frame", "Polymer"], ["Trigger", "Performance Duty (~5.5 lbs)"], ["Safety", "Trigger + internal safeties"], ["Sights", "Fiber optic front / adjustable rear"], ["Optic Mount", "Walther optic-ready (direct mount)"]],
    url:"https://www.waltherarms.com/pistols/pdp-series/",
  },
  'springfield-hellcat': {
    name:'Springfield Armory Hellcat', manufacturer:'Springfield Armory', country:'United States', type:'Pistol',
    caliber:'9mm Luger', action:'Semi-automatic, striker-fired', capacity:'11+1 (flush) / 13+1 (extended)',
    barrel:'3"', weight:'17.9 oz', length:'6"', width:'1.01"', height:'4"',
    introduced:2019, msrp:'$499–$599', image:'/img/photos/pistol.jpg',
    summary:"When the Hellcat launched in 2019, Springfield Armory set a world record for magazine capacity in its class: 11+1 in a gun smaller than the SIG P365. The Hellcat became one of the fastest-selling handguns in history. The Hellcat OSP (Optical Sight Pistol) version allowed direct optic mounting at a sub-$600 price point when competitors charged hundreds more for that capability.",
    summary2:"The Hellcat's 3-inch barrel and 1-inch width make it genuinely pocketable while still holding more rounds than most full-size guns from a decade ago. The High Hand Grip allows shooters to choke up significantly, reducing muzzle flip for a subcompact. The adaptive grip texture is aggressive where it needs to be without shredding shirt fabric during carry. Springfield's ADAPTIVE GRIP TEXTURE is a legitimate differentiator.",
    variants:["Hellcat Standard", "Hellcat OSP (Optic Ready)", "Hellcat Pro (3.7\" barrel)", "Hellcat RDP (with comp)"],
    uses:["Concealed carry (primary use case)", "Backup gun", "Off-duty carry"],
    pros:["World record capacity for size", "OSP is optic-ready sub-$600", "Excellent grip texture", "Flat trigger", "Very concealable"],
    cons:["Short sight radius (3\" barrel)", "Aggressive texture wears clothing", "Smaller aftermarket vs P365/Glock"],
    specs:[["Frame", "Polymer"], ["Barrel", "3\" Hammer-Forged Steel"], ["Sights", "Tritium U-Dot (standard)"], ["Optic", "OSP variant: direct mount"], ["Safety", "Trigger safety + striker block"]],
    url:"https://www.springfield-armory.com/hellcat-series/",
  },
  'daniel-defense-ddm4': {
    name:'Daniel Defense DDM4 V7', manufacturer:'Daniel Defense', country:'United States', type:'Rifle',
    caliber:'5.56 NATO / .223 Wylde', action:'Direct impingement, semi-automatic', capacity:'30+1 (STANAG)',
    barrel:'16" (carbine)', weight:'6.26 lbs', length:'32.25"–35.5"', width:'N/A', height:'N/A',
    introduced:2008, msrp:'$1,899–$2,100', image:'/img/photos/rifle.jpg',
    summary:"Daniel Defense built its reputation making barrel assemblies for the US military before civilians could buy a complete DD rifle. Every DDM4 starts with a cold-hammer-forged barrel \u2014 the same process military contractors use \u2014 held to tolerances that most consumer manufacturers don't advertise because they can't match them. The M4A1 profile barrel is optimized for sustained fire, not just range sessions.",
    summary2:"The DDM4 V7 became the benchmark for what a professional-grade AR-15 should feel like: tight upper-to-lower fit, no carrier tilt because the enhanced bolt carrier rides tighter in the upper, and a proprietary muzzle device that outperforms standard A2 flash hiders. DD's mil-spec Cerakote finish resists corrosion better than most competitors. These rifles are used by special operations units that could carry anything \u2014 they choose DD.",
    variants:["DDM4 V7 (standard)", "DDM4 V7 Pro", "DDM4 V7 LW", "DDM4 ISR (integrated suppressor)", "DDM4 PDW"],
    uses:["Home defense", "Competition", "Duty/patrol", "General sporting"],
    pros:["Cold hammer-forged barrel", "Mil-spec quality control", "Excellent accuracy", "Strong resale value", "Used by SOF units"],
    cons:["Premium price", "Heavier than budget ARs", "Long lead times during shortages"],
    specs:[["Barrel", "CHF, M4A1 profile, 1:7 twist"], ["Gas System", "Carbine-length"], ["Handguard", "Daniel Defense MFR 15.0 M-LOK"], ["Trigger", "Standard mil-spec"], ["Finish", "Cerakote Tornado"]],
    url:"https://danieldefense.com/rifles/ar-15/",
  },
  'tikka-t3x': {
    name:'Tikka T3x', manufacturer:'Tikka (SAKO/Beretta group)', country:'Finland', type:'Rifle',
    caliber:'Various (.308 Win, 6.5 Creedmoor, .30-06, etc.)', action:'Bolt-action', capacity:'3+1 (detachable magazine)',
    barrel:'22.4" (standard)', weight:'6.6 lbs', length:'42.5"', width:'N/A', height:'N/A',
    introduced:2016, msrp:'$699–$899', image:'/img/photos/rifle.jpg',
    summary:"The Tikka T3x is what happens when Finnish precision engineering meets a production budget. Tikka \u2014 owned by SAKO, itself owned by Beretta \u2014 builds the T3x on the same machinery that makes SAKO rifles at a fraction of the price. The result is factory accuracy guarantees (sub-MOA with quality ammunition) that boutique rifle builders charge ten times as much to promise.",
    summary2:"The T3x's cold-hammer-forged barrel is the heart of the package. Tikka's barrel-to-receiver fit is exceptionally tight, and the single-stage trigger is adjustable down to 2 lbs without gunsmithing. The synthetic stock is injection-molded with modular inserts for adjustability. Hunters who shoot precision long-range disciplines discovered the T3x through word of mouth \u2014 it's a precision rifle with a hunting rifle price tag.",
    variants:["T3x Lite", "T3x Tactical", "T3x UPR", "T3x Compact Tactical", "T3x CTR"],
    uses:["Hunting", "Long-range precision", "Target shooting"],
    pros:["Sub-MOA factory guarantee", "Excellent value for precision", "Detachable magazine", "Adjustable trigger", "Finnish manufacturing quality"],
    cons:["Limited US aftermarket vs Remington", "Magazines are expensive", "Not ideal for rapid follow-up shots"],
    specs:[["Barrel", "Cold hammer-forged"], ["Trigger", "Single-stage, adjustable 2\u20134 lbs"], ["Stock", "Synthetic modular"], ["Magazine", "Detachable polymer"], ["Action", "Smooth cone breech system"]],
    url:"https://www.tikka.fi/rifles/t3x",
  },
  'remington-700': {
    name:'Remington Model 700', manufacturer:'Remington Arms', country:'United States', type:'Rifle',
    caliber:'Various (.308 Win, .30-06, 6.5 Creedmoor, .223, etc.)', action:'Bolt-action', capacity:'4+1 (internal magazine)',
    barrel:'24" (standard)', weight:'7.5 lbs', length:'43.6"', width:'N/A', height:'N/A',
    introduced:1962, msrp:'$729–$1,099', image:'/img/guns/remington-700.jpg',
    summary:"The Remington Model 700 is the most widely issued sniper rifle in US military history. The M24 Sniper Weapon System, the M40 used by the Marine Corps, and dozens of law enforcement precision rifles are all built on the Model 700 action. Over 5 million have been manufactured since 1962, making it the best-selling bolt-action rifle in American history by a wide margin.",
    summary2:"The 700's strength is the aftermarket ecosystem built around it over six decades. Every precision rifle smith in America knows the action. Every major stock manufacturer fits it. Every trigger manufacturer makes a drop-in replacement. The push-feed design is simple and reliable. The two-lug bolt locks up with zero slop. Professional snipers and weekend hunters have trusted the 700 for the same reasons since Lyndon Johnson was president.",
    variants:["700 ADL", "700 BDL", "700 SPS", "700 PCR", "700 5R", "700 AWR", "Custom Shop variants"],
    uses:["Hunting", "Precision/long-range", "Law enforcement sniper", "Military (M24/M40)"],
    pros:["Deepest aftermarket of any bolt-action", "Proven military heritage", "Excellent accuracy", "Wide caliber selection", "Strong resale"],
    cons:["Older design vs newer competitors", "Trigger requires upgrade for precision work", "Internal magazine limits capacity"],
    specs:[["Action", "Push-feed bolt, two lug"], ["Barrel", "Button-rifled"], ["Stock", "Walnut or synthetic"], ["Safety", "Three-position tang safety"], ["Trigger", "X-Mark Pro (adjustable)"]],
    url:"https://www.remington.com/rifles/bolt-action/",
  },
  'benelli-m2': {
    name:'Benelli M2 Field', manufacturer:'Benelli Armi SpA', country:'Italy', type:'Shotgun',
    caliber:'12 Gauge (3" chamber)', action:'Inertia-driven semi-automatic', capacity:'3+1',
    barrel:'26" or 28"', weight:'6.8 lbs', length:'47.5"', width:'N/A', height:'N/A',
    introduced:1993, msrp:'$1,399–$1,699', image:'/img/guns/benelli-m2.jpg',
    summary:"The Benelli M2 Field is the semi-automatic shotgun that hunters and competitive shooters reach for when they need maximum reliability in minimum weight. Benelli's patented Inertia Driven system uses recoil energy to cycle the action \u2014 there is no gas system to clean, tune, or foul. The M2 runs dirty, runs wet, and runs light loads that would choke gas-operated guns.",
    summary2:"Three-gun competitors discovered the M2 through USPSA and IPSC competition \u2014 it cycles fast, handles abuse, and the bolt release is one of the fastest on any semi-auto shotgun. Waterfowl hunters prize it for reliability in flooded timber and marsh conditions where gas guns fill with debris. The ComforTech stock absorbs recoil significantly better than competing designs, allowing faster target reacquisition.",
    variants:["M2 Field", "M2 3-Gun", "M2 Tactical", "M2 Turkey", "M2 Waterfowl"],
    uses:["Hunting (bird, turkey, waterfowl)", "3-Gun competition", "General sporting"],
    pros:["Inertia system: no gas ports to foul", "Very light for a semi-auto", "ComforTech recoil reduction", "Extremely reliable", "Fast cycle rate"],
    cons:["Requires 3\" loads to cycle reliably", "Higher price than gas guns", "Internal magazine only (field version)", "Limited home defense configuration"],
    specs:[["Action", "Inertia Driven semi-automatic"], ["Chamber", "3\" (2.75\" shells work)"], ["Stock", "ComforTech synthetic"], ["Chokes", "Crio Plus choke system"], ["Finish", "Matte black/synthetic"]],
    url:"https://www.benelliusa.com/m2-field",
  },
  'benelli-supernova': {
    name:'Benelli SuperNova', manufacturer:'Benelli Armi SpA', country:'Italy', type:'Shotgun',
    caliber:'12 Gauge (3.5" chamber)', action:'Pump-action', capacity:'4+1',
    barrel:'18.5" (tactical) / 26" or 28" (field)', weight:'7.9 lbs', length:'40"', width:'N/A', height:'N/A',
    introduced:2006, msrp:'$499–$649', image:'/img/photos/shotgun.jpg',
    summary:"The SuperNova is Benelli applying Italian engineering principles to the American pump shotgun. The rotating bolt \u2014 borrowed from the semi-automatic Nova \u2014 gives the SuperNova a lockup tighter than any standard dual-action-bar pump on the market. The receiver is molded into the stock as a single unit, eliminating the traditional two-piece design entirely.",
    summary2:"The SuperNova Tactical, with its 18.5-inch barrel and pistol grip, is one of the most capable defensive pump shotguns available. The ComforTech recoil reduction system makes 3.5-inch magnum loads manageable \u2014 no other pump shotgun can say that. Law enforcement agencies that train extensively with shotguns appreciate the SuperNova's durability and the tight lockup's effect on pattern consistency.",
    variants:["SuperNova Field", "SuperNova Tactical", "SuperNova ComforTech", "SuperNova Steady Grip"],
    uses:["Home defense", "Hunting (waterfowl, turkey)", "Law enforcement", "General sporting"],
    pros:["3.5\" chamber (most versatile)", "Rotating bolt lockup", "Composite receiver/stock unit", "ComforTech recoil reduction", "Benelli reliability"],
    cons:["Heavier than competitors", "Stock/receiver integration limits customization", "Price premium over Mossberg/Remington"],
    specs:[["Action", "Pump, rotating bolt"], ["Chamber", "3.5\" maximum"], ["Stock", "SteadyGrip or ComforTech synthetic"], ["Safety", "Top-mounted crossbolt"]],
    url:"https://www.benelliusa.com/supernova",
  },
  'silencerco-omega-36m': {
    name:'SilencerCo Omega 36M', manufacturer:'SilencerCo', country:'United States', type:'Suppressor',
    caliber:'.30 cal / multi-caliber (7.62 NATO, .308, .300BLK, 6.5CM, 5.56)', action:'NFA Title II device', capacity:'N/A',
    barrel:'N/A', weight:'13.8 oz', length:'7.62"', width:'1.57" diameter', height:'N/A',
    introduced:2020, msrp:'$899–$999', image:'/img/photos/suppressor.jpg',
    summary:"The SilencerCo Omega 36M is SilencerCo's answer to the single-suppressor question: one can to rule them all. The Omega 36M suppresses everything from .22 LR to .338 Lapua Magnum. It ships with multiple adapters covering the major thread patterns and calibers. SilencerCo's MAAD (Multi-Adapter Attachment Device) system allows tool-free caliber conversion in the field.",
    summary2:"The 36M weighs 13.8 oz \u2014 lighter than a loaded pistol magazine \u2014 yet delivers 34 dB of suppression on .308. The stainless and titanium construction survives sustained fire that destroys aluminum-tube suppressors. SilencerCo's reputation for quality was built on the original Omega; the 36M expands that capability across calibers. The Form 4 process still applies \u2014 expect 12-18 months for transfer approval.",
    variants:["Omega 36M (standard)", "Omega 36M with ASR mount (quick detach)"],
    uses:["Hunting (centerfire rifle)", "Precision/long-range shooting", "Home defense (with short-barreled rifle)", "General sporting"],
    pros:["True multi-caliber (.22\u2013.338 Lapua)", "Lightweight titanium construction", "MAAD system: no tools for caliber change", "Industry-leading suppression levels", "Strong resale value"],
    cons:["NFA: 12\u201318 month transfer wait", "$200 NFA tax stamp required", "Price premium vs single-caliber cans", "MAAD adds length"],
    specs:[["Construction", "Titanium/Stainless Steel"], ["Suppression", "~34 dB (.308 Win)"], ["Mount", "Direct thread + MAAD adapter"], ["Calibers", "5.56, .30 cal, .338 LM, multi"], ["Full Auto Rated", "Yes"]],
    url:"https://www.silencerco.com/products/omega-36m/",
  },
  'silencerco-omega-9k': {
    name:'SilencerCo Omega 9K', manufacturer:'SilencerCo', country:'United States', type:'Suppressor',
    caliber:'9mm (pistol caliber, subgun)', action:'NFA Title II device', capacity:'N/A',
    barrel:'N/A', weight:'7.9 oz', length:'4.64"', width:'1.375" diameter', height:'N/A',
    introduced:2015, msrp:'$649–$749', image:'/img/photos/suppressor.jpg',
    summary:"The SilencerCo Omega 9K was designed for one specific application: making a 9mm pistol or subgun as short and suppressed as physically possible. At 4.64 inches and under 8 ounces, the 9K adds minimal length to a host pistol. The K designation stands for Kurz \u2014 German for short \u2014 reflecting the design philosophy. SWAT teams and special operations units running suppressed MP5s and HK94s drove demand for exactly this product.",
    summary2:"The 9K's monocore baffle design allows disassembly for cleaning \u2014 important for suppressed pistol use because unsuppressed-rated handgun ammunition is wet and carbon-intensive. The triLUG mount (quick-detach) version attaches in a half-turn, making it practical for operators who need to go suppressed or unsuppressed quickly. SilencerCo's customer service has consistently ranked at the top of the industry.",
    variants:["Omega 9K (direct thread)", "Omega 9K with triLUG mount"],
    uses:["Suppressed pistol carry", "Subgun/PCC applications", "Home defense suppressed setup", "Law enforcement/military"],
    pros:["Extremely compact for 9mm", "Under 8 oz", "User-serviceable (take-apart)", "High-quality construction", "triLUG quick-detach available"],
    cons:["NFA paperwork/wait", "Single caliber (9mm only)", "No rifle caliber capability", "Short baffles = more first-round pop"],
    specs:[["Construction", "Titanium/Stainless"], ["Caliber", "9mm (.355 bore)"], ["Mount", "1/2\u00d728 direct thread (standard)"], ["Full Auto Rated", "Yes"], ["Service Life", "Unlimited (titanium/stainless)"]],
    url:"https://www.silencerco.com/products/omega-9k/",
  },
  'dead-air-sandman-s': {
    name:'Dead Air Sandman-S', manufacturer:'Dead Air Armament', country:'United States', type:'Suppressor',
    caliber:'.30 cal (7.62 NATO, .308 Win, .300BLK, .30-06, 6.5CM)', action:'NFA Title II device', capacity:'N/A',
    barrel:'N/A', weight:'17.4 oz', length:'7"', width:'1.5" diameter', height:'N/A',
    introduced:2015, msrp:'$999–$1,099', image:'/img/photos/suppressor.jpg',
    summary:"Dead Air built the Sandman-S around a simple idea: make a .30 caliber rifle suppressor that works as a quick-detach (QD) system from day one, without paying extra for an adapter. The KeyMo mounting system \u2014 Dead Air's proprietary QD design \u2014 ships with every Sandman and is compatible with Dead Air's own muzzle devices. The Sandman-S (Short version) balances suppression performance with overall length.",
    summary2:"The Sandman-S is rated for full-auto fire and has been tested with sustained belt-fed fire \u2014 a standard no aluminum suppressor can pass. The inconel and stainless steel construction adds weight but delivers a service life measured in hundreds of thousands of rounds. The dead-air baffle stack design creates excellent turbulent flow, delivering 30 dB of reduction on .308. Dead Air's KeyMo mount is arguably the most robust QD system on the market.",
    variants:["Sandman-S (short)", "Sandman-L (long)", "Sandman-K (compact)", "Sandman-Ti (titanium)"],
    uses:["Hunting (deer, elk)", "Long-range precision", "DMR/patrol rifle", "Home defense"],
    pros:["KeyMo QD: fastest detach in class", "Full-auto and belt-fed rated", "Industry-leading durability", "Excellent .308 suppression", "Strong US dealer network"],
    cons:["Heavier than titanium competitors", "NFA wait time", "Requires Dead Air muzzle device for QD", "Premium price"],
    specs:[["Construction", "Inconel/Stainless Steel"], ["Caliber", "Up to .30 cal"], ["Mount", "KeyMo QD (proprietary)"], ["Suppression", "~30 dB (.308)"], ["Full Auto Rated", "Yes \u2014 belt-fed tested"]],
    url:"https://www.deadairsilencers.com/product/sandman-s/",
  },
}

export async function generateStaticParams() {
  return Object.keys(GUN_DATA).map(m => ({ model: m }))
}

export async function generateMetadata({ params }) {
  const g = GUN_DATA[params.model]
  if (!g) return { title: 'Firearm Encyclopedia — DownRange' }
  return {
    title: `${g.name} — DownRange Encyclopedia`,
    description: `Complete specs, variants, and review of the ${g.name}. History, pros/cons, buying guide.`,
    openGraph: { title: g.name, description: g.summary?.slice(0, 200), images: g.image ? [{ url: g.image }] : [] }
  }
}

export default async function GunPage({ params }) {
  const g = GUN_DATA[params.model]
  if (!g) notFound()

  const RELATED = Object.entries(GUN_DATA)
    .filter(([k]) => k !== params.model && GUN_DATA[k].type === g.type)
    .slice(0, 4)

  return (
    <>
      <Masthead />
      <div style={{ width:'100%', height:'clamp(280px, 40vw, 460px)', overflow:'hidden', position:'relative' }}>
        <img src={g.image} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.5 }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, #0A0B0C 10%, transparent 70%)' }} />
        <div className="container" style={{ position:'absolute', bottom:'28px', left:'50%', transform:'translateX(-50%)', width:'100%' }}>
          <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', background:'#1A0E00', border:'1px solid #C8922A40', padding:'3px 10px' }}>{g.type?.toUpperCase()}</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', background:'#111318', border:'1px solid var(--border)', padding:'3px 10px' }}>{g.caliber}</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', background:'#111318', border:'1px solid var(--border)', padding:'3px 10px' }}>{g.country}</span>
          </div>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'clamp(2.5rem,7vw,5rem)', color:'#F5F5F3', letterSpacing:'0.02em', lineHeight:1, marginBottom:'6px' }}>{g.name}</h1>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280' }}>{g.manufacturer} · Est. {g.introduced} · MSRP {g.msrp}</div>
        </div>
      </div>

      <div style={{ padding:'40px 0', background:'var(--bg)' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'48px' }}>

            {/* Main content */}
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px', marginBottom:'32px' }}>
                {[['Capacity',g.capacity],['Barrel',g.barrel],['Weight',g.weight],['MSRP',g.msrp]].map(([k,v])=>(
                  <div key={k} style={{ background:'#111318', border:'1px solid var(--border)', padding:'14px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.1rem', color:'#C8922A', lineHeight:1.2 }}>{v}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginTop:'4px' }}>{k.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize:'15px', lineHeight:1.85, color:'#94A3B8', marginBottom:'20px', borderLeft:'3px solid #C8922A', paddingLeft:'16px' }}>{g.summary}</p>
              <p style={{ fontSize:'15px', lineHeight:1.85, color:'#94A3B8', marginBottom:'32px' }}>{g.summary2}</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'32px' }}>
                <div style={{ background:'#001A0A', border:'1px solid #16603440', padding:'18px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34D399', letterSpacing:'0.15em', marginBottom:'12px', fontWeight:700 }}>✓ STRENGTHS</div>
                  {g.pros.map((p,i)=><div key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#86EFAC', marginBottom:'6px', paddingLeft:'8px' }}>{p}</div>)}
                </div>
                <div style={{ background:'#1A0000', border:'1px solid #7F1D1D40', padding:'18px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#EF4444', letterSpacing:'0.15em', marginBottom:'12px', fontWeight:700 }}>✗ WEAKNESSES</div>
                  {g.cons.map((c,i)=><div key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#FCA5A5', marginBottom:'6px', paddingLeft:'8px' }}>{c}</div>)}
                </div>
              </div>

              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'14px' }}>VARIANTS</h2>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'32px' }}>
                {g.variants.map(v=>(
                  <span key={v} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#D1D5DB', background:'#111318', border:'1px solid var(--border)', padding:'5px 12px' }}>{v}</span>
                ))}
              </div>

              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'14px' }}>COMMON USES</h2>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'32px' }}>
                {g.uses.map(u=>(
                  <span key={u} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#34D399', background:'#001A0A', border:'1px solid #16603440', padding:'5px 12px' }}>{u}</span>
                ))}
              </div>

              {g.url && (
                <a href={g.url} target="_blank" rel="noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#C8922A', color:'#000', padding:'12px 24px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'12px', textDecoration:'none', letterSpacing:'0.05em' }}>
                  VIEW MANUFACTURER SPECS ↗
                </a>
              )}
            </div>

            {/* Sidebar */}
            <aside>
              <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', marginBottom:'16px', position:'sticky', top:'80px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'16px', fontWeight:700 }}>SPECIFICATIONS</div>
                {[
                  ['Manufacturer', g.manufacturer],
                  ['Country', g.country],
                  ['Type', g.type],
                  ['Caliber', g.caliber],
                  ['Action', g.action],
                  ['Capacity', g.capacity],
                  ['Barrel Length', g.barrel],
                  ['Overall Length', g.length],
                  ['Width', g.width],
                  ['Height', g.height],
                  ['Weight', g.weight],
                  ['Introduced', g.introduced],
                  ['MSRP', g.msrp],
                  ...(g.specs || []),
                ].filter(([,v])=>v).map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', gap:'8px' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', flexShrink:0 }}>{k}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#D1D5DB', textAlign:'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {/* Related guns */}
          {RELATED.length > 0 && (
            <div style={{ marginTop:'48px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>
                MORE {g.type?.toUpperCase()}S
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
                {RELATED.map(([k,r])=>(
                  <Link key={k} href={`/guns/${k}`} style={{ background:'#111318', border:'1px solid var(--border)', padding:'16px', textDecoration:'none', display:'block' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A', marginBottom:'4px' }}>{r.type} · {r.caliber}</div>
                    <div style={{ fontSize:'14px', fontWeight:600, color:'#F0EDE6', lineHeight:1.3 }}>{r.name}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginTop:'4px' }}>{r.msrp}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
