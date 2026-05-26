import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import LawAssistant from '../../components/ui/LawAssistant'
import ReciprocityPlanner from '../../components/ui/ReciprocityPlanner'
import { fetchLegislation, fetchBreakingAlerts, fetchAllStateProfiles } from '../../sanity/lib/client'

export const metadata = {
  title: 'Laws & Legislation — DownRange',
  description: '2A law tracker: Federal bills, ATF rules, SCOTUS cases, state legislation. AI law assistant.'
}
export const revalidate = 900

// ── STATIC SEED DATA ────────────────────────────────────────────
const SCOTUS_CASES = [
  // ── ACTIVE 2025-26 TERM ──────────────────────────────────────────────
  { id:'hemani', name:'United States v. Hemani', year:2026, outcome:'PENDING', summary:'This case tests whether Congress can disarm someone who habitually uses controlled substances, specifically marijuana and cocaine, under 18 U.S.C. §922(g)(3). The defendant argues the statute is unconstitutionally vague and overbroad. The Trump DOJ supports the conviction, framing it as a public safety measure consistent with historical traditions of disarming dangerous individuals. A ruling here could either narrow or reinforce the federal prohibition on drug-user firearm possession. Decision expected June or July 2026.', significance:'HIGH', status:'Oral arguments 2026', url:'https://www.scotusblog.com/case-files/cases/united-states-v-hemani/' },
  { id:'wolford', name:'Wolford v. Lopez', year:2026, outcome:'PENDING', summary:'Hawaii enacted a law barring concealed carry permit holders from carrying firearms on any private property without the explicit written permission of the owner — effectively flipping the default rule from "permitted unless posted off" to "banned unless permission granted." Challengers argue this is a de facto ban on public carry, directly contradicting the Supreme Court\'s Bruen (2022) ruling that affirmed the right to carry outside the home. Oral arguments were held in January 2026, and a ruling is expected by summer. This case could reshape sensitive-places doctrine across restrictive carry states.', significance:'HIGH', status:'Argued Jan 2026', url:'https://www.scotusblog.com/case-files/cases/wolford-v-lopez/' },
  { id:'viramontes', name:'Viramontes v. Cook County', year:2026, outcome:'PENDING', summary:'This challenge targets the Illinois and Cook County assault weapons ban, which prohibits the possession, sale, and manufacture of semi-automatic rifles with certain features, including pistol grips, telescoping stocks, and detachable magazines. The plaintiffs argue that under the Bruen text-and-history test, modern semi-automatic rifles are commonly owned by law-abiding citizens for lawful purposes and therefore protected by the Second Amendment. The case is currently under conference review, with the Court evaluating whether to grant certiorari. A cert grant would set up the first major SCOTUS ruling on assault weapons bans.', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu' },
  { id:'duncan', name:'Duncan v. Bonta', year:2026, outcome:'PENDING', summary:'California\'s Penal Code §32310 bans the manufacture, import, sale, and possession of magazines capable of holding more than ten rounds. The Duncan case has been litigated in the Ninth Circuit since 2017 and has been relisted for Supreme Court conference more than a dozen times. The core question is whether large-capacity magazines are "arms" protected by the Second Amendment, or whether the historical tradition of regulation at the founding supports such restrictions. A SCOTUS grant here would be the first case to directly address magazine restrictions post-Bruen.', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu' },
  { id:'nagr', name:'National Assn for Gun Rights v. Lamont', year:2026, outcome:'PENDING', summary:'Connecticut\'s assault weapons ban, enacted after the 2012 Sandy Hook shooting, prohibits a broad range of semi-automatic rifles and large-capacity magazines. NAGR\'s challenge argues the ban cannot survive Bruen\'s text-and-history test because semi-automatic rifles are widely owned arms with no historical analog for such a sweeping prohibition at the founding. This case is being considered alongside Viramontes — both represent the Court\'s potential entry point into definitively ruling on the constitutionality of assault weapons bans. The outcome would affect similar laws in California, New York, Maryland, and eight other states.', significance:'HIGH', status:'Under conference', url:'https://firearmslaw.duke.edu' },
  // ── DECIDED 2024 ─────────────────────────────────────────────────────
  { id:'cargill', name:'Garland v. Cargill', year:2024, outcome:'WON', summary:'In a landmark 6-3 ruling, the Supreme Court held that bump stocks do not convert semi-automatic rifles into machine guns under federal law. The ATF\'s 2019 bump stock rule had reclassified the devices as machine gun components, effectively banning them following the 2017 Las Vegas mass shooting. Justice Thomas wrote for the majority, concluding that a semi-automatic weapon fires only one round per trigger function regardless of how quickly the trigger cycles, and the statute\'s definition of "machine gun" requires a single trigger function to fire multiple rounds. This decision stripped the ATF of authority to redefine mechanical devices by regulatory fiat and was widely seen as a significant check on ATF rulemaking overreach.', significance:'HIGH', status:'Decided June 2024', url:'https://www.supremecourt.gov/opinions/23pdf/22-976_1b82.pdf' },
  { id:'rahimi', name:'United States v. Rahimi', year:2024, outcome:'LOST', summary:'In an 8-1 decision, the Court upheld the federal law disarming individuals subject to domestic violence civil protective orders (18 U.S.C. §922(g)(8)). Chief Justice Roberts wrote that when an individual poses a credible threat to the physical safety of an intimate partner or child, a temporary disarmament is consistent with the Nation\'s historical tradition of firearm regulation. The Court reviewed historical surety laws and going-armed laws as analogs. Critically, the ruling was narrow — applying only to civil protective orders involving a credible threat finding — and rejected the government\'s broader arguments. Justice Thomas dissented alone, arguing no historical analog supported the precise disarmament mechanism. Gun rights groups note the ruling is fact-specific and does not endorse sweeping domestic violence disarmament statutes beyond this specific context.', significance:'MED', status:'Decided June 2024', url:'https://www.supremecourt.gov/opinions/23pdf/22-915_9ok0.pdf' },
  { id:'vanderstock', name:'Bondi v. VanDerStok', year:2025, outcome:'LOST', summary:'The Supreme Court ruled 7-2 that the ATF\'s "ghost gun" rule — which required serialization and background checks for 80% lower kits sold with completion jigs — was not facially invalid under the Gun Control Act. The majority held that certain readily-convertible receiver kits can qualify as "firearms" under the GCA because they are "designed to or may readily be converted" to expel a projectile. Justices Gorsuch and Thomas dissented, arguing the statute\'s plain text requires a functional frame or receiver, not a blank. The ruling was narrow: it does not validate every ghost gun regulation, and standalone 80% lowers sold without completion tools may still fall outside the statute\'s reach. State laws on 80% lowers vary significantly and remain in force independently.', significance:'MED', status:'Decided 2025', url:'https://www.supremecourt.gov' },
  // ── LANDMARK PRECEDENTS ──────────────────────────────────────────────
  { id:'bruen', name:'NY State Rifle & Pistol Assn v. Bruen', year:2022, outcome:'WON', summary:'The Bruen decision fundamentally restructured how courts analyze Second Amendment challenges. Writing for a 6-3 majority, Justice Thomas established that firearm regulations must be consistent with the Nation\'s historical tradition of firearm regulation at the time of the founding (1791) and Reconstruction (1868). Courts can no longer apply the two-step means-ends scrutiny test that had allowed many gun laws to survive by serving "important government interests." Instead, the burden shifts to the government to identify a historical analog for any challenged regulation. The case specifically struck down New York\'s "proper cause" requirement for unrestricted carry permits. Every subsequent Second Amendment case — federal and state — is now analyzed under the Bruen text-and-history framework, making it the most operationally significant 2A ruling since Heller.', significance:'HIGH', status:'Decided June 2022', url:'https://www.supremecourt.gov/opinions/21pdf/20-843_7j80.pdf' },
  { id:'mcdonald', name:'McDonald v. City of Chicago', year:2010, outcome:'WON', summary:'Building on Heller, McDonald incorporated the Second Amendment against state and local governments through the Fourteenth Amendment\'s Due Process Clause. Prior to McDonald, the Second Amendment constrained only federal action, allowing cities and states to enact virtually any gun restriction. Justice Alito\'s plurality opinion held the right to keep and bear arms is "fundamental to our scheme of ordered liberty" and "deeply rooted in this Nation\'s history and tradition." The ruling struck down Chicago\'s 28-year handgun ban and the Oak Park, Illinois ban. McDonald established that all 50 states must respect the individual right recognized in Heller, making it the constitutional foundation upon which all subsequent state-level Second Amendment litigation rests.', significance:'HIGH', status:'Decided June 2010', url:'https://supreme.justia.com/cases/federal/us/561/742/' },
  { id:'heller', name:'DC v. Heller', year:2008, outcome:'WON', summary:'The most important Second Amendment ruling in American history. Justice Scalia\'s 5-4 majority opinion settled a two-century debate by holding that the Second Amendment protects an individual right to possess firearms unconnected to service in an organized militia, specifically for traditionally lawful purposes such as self-defense within the home. The decision struck Washington DC\'s longstanding handgun ban and trigger-lock requirement. Heller also acknowledged that the right is not unlimited — establishing that certain regulations remain presumptively lawful, including prohibitions on felons and the mentally ill, laws against carrying in sensitive places, and conditions of commercial sale. Every Second Amendment case today begins with the Heller baseline: the right is individual, fundamental, and tied to self-defense.', significance:'HIGH', status:'Decided June 2008', url:'https://supreme.justia.com/cases/federal/us/554/570/' },
  // ── CERT DENIED ──────────────────────────────────────────────────────
  { id:'gardner', name:'Gardner v. Maryland (AR-15 Ban)', year:2025, outcome:'CERT DENIED', summary:'After an extraordinary 15 relistings for conference — signaling deep internal division among the justices — the Supreme Court denied certiorari in Gardner v. Maryland on June 2, 2025, leaving Maryland\'s assault weapons ban intact for now. The refusal to hear the case means the Fourth Circuit\'s ruling upholding the ban remains binding law in Maryland, Virginia, and West Virginia. Justice Kavanaugh wrote a notable statement accompanying the denial, observing that the Court "should address the AR-15 question soon" given the circuit splits developing across the country. The cert denial is not a ruling on the merits, but it effectively leaves assault weapons ban challengers without a federal forum until the Court takes up Viramontes or NAGR.', significance:'HIGH', status:'Cert Denied Jun 2025', url:'https://scotus2a.com' },
]


const ATF_RULES = [
  { id:'34rules', title:'ATF Historic Regulatory Reform Package — 34 Rules', status:'advancing', date:'2026-04-29', summary:'On April 29, 2026, the Department of Justice and ATF released a package of 34 notices of proposed and final rulemaking — the most significant regulatory reform in ATF history. The package covers four broad areas: (1) FFL dealer operations, including streamlined inspection procedures and clarified compliance timelines; (2) modernized recordkeeping and 4473 digitization; (3) NFA compliance updates aligned with Garland v. Cargill and post-Bruen legal standards; and (4) import/export rule adjustments. The stated goal is to reduce regulatory burden on law-abiding gun owners and dealers while aligning agency rules with current court precedents. Several rules are final; others remain in proposed comment periods. Full text available at ATF.gov.', impact:'HIGH', url:'https://www.atf.gov/news/press-releases/doj-and-atf-announce-regulatory-reforms-to-reduce-burdens-law-abiding-gun-owners-and-businesses' },
  { id:'nfa-tax', title:'NFA Tax Stamp Eliminated — One Big Beautiful Bill Act', status:'passed', date:'2026-01-01', summary:'President Trump signed H.R. 1, the "One Big Beautiful Bill Act," on July 4, 2025, eliminating the $200 NFA tax stamp for suppressors, short-barreled rifles (SBRs), short-barreled shotguns (SBSs), and any other weapons (AOWs). The change took effect January 1, 2026. The elimination applies to new NFA registrations going forward — it does not refund the $200 for items already registered. Critically, all other NFA requirements remain fully in force: Form 4 submissions, CLEO notification, fingerprint cards, photographs, and the wait time for ATF approval are unchanged. Machine guns (registered before May 19, 1986) and destructive devices still require the $200 stamp. State NFA restrictions remain unaffected — suppressors remain prohibited in several states regardless of federal law.', impact:'HIGH', url:'https://www.congress.gov/bill/119th-congress/house-bill/1' },
  { id:'pistol-brace-rescinded', title:'Pistol Brace Rule Rescinded', status:'passed', date:'2025-06-01', summary:'ATF formally rescinded its January 2023 final rule (1140-AA98) that had reclassified pistols equipped with stabilizing braces as short-barreled rifles subject to NFA registration. The original rule had affected an estimated 3 to 40 million brace-equipped firearms and was immediately challenged in multiple federal courts. The Fifth Circuit\'s Britto decision vacated the rule for its members, and the Western District of Texas enjoined enforcement more broadly. ATF\'s June 2025 rescission formally ends the rule nationwide, removing any federal felony risk for existing owners of brace-equipped pistols. Owners do not need to register, modify, or remove their braces. The rescission is part of the broader ATF reform package and reflects the agency\'s acknowledgment that the rule exceeded its statutory authority under Cargill\'s limiting framework.', impact:'HIGH', url:'https://www.atf.gov/rules-and-regulations/atf-launches-new-era-reform' },
  { id:'bump-stock-revised', title:'Bump Stock Definition Revised Post-Cargill', status:'passed', date:'2025-07-01', summary:'Following the Supreme Court\'s 6-3 ruling in Garland v. Cargill (June 2024), ATF formally revised its machine gun classification to exclude bump stocks. The 2019 Trump-era rule that reclassified bump stocks as machine guns had already been struck down by Cargill, but ATF\'s July 2025 regulatory update codifies the post-Cargill status into formal agency guidance. Under the revised definition, a firearm attachment that increases the rate of fire through mechanical feedback against the shooter\'s trigger finger does not constitute a machine gun unless a single function of the trigger fires more than one round. Bump stocks are now legally in the same category as binary triggers and forced reset triggers at the federal level. Individual state laws vary.', impact:'HIGH', url:'https://www.atf.gov' },
  { id:'80pct-vander', title:'Frames & Receivers Rule (Bondi v. VanDerStok)', status:'challenged', date:'2022-08-24', summary:'ATF\'s 2022 final rule on frames and receivers (27 CFR Part 478) expanded the definition of "firearm" to include unfinished frames and receivers that are "partially complete, disassembled, or nonfunctional" if they can be readily converted to expel a projectile. This primarily targeted 80% lower kits sold with completion jigs, which ATF argued functioned as complete firearms in practice. The rule was challenged and the Supreme Court in Bondi v. VanDerStok (2025) held 7-2 the rule was not facially invalid — meaning it can stand on its face, though as-applied challenges remain. Importantly, standalone 80% lowers sold without completion jigs or instructions may still fall outside the rule. Builders should verify their specific kit configuration against current ATF guidance and check state law, as California, New York, and several other states impose independent serialization and registration requirements.', impact:'HIGH', url:'https://www.atf.gov/rules-and-regulations/definition-frame-or-receiver' },
  { id:'engaged-business', title:'"Engaged in the Business" Rule Rescinded', status:'passed', date:'2025-08-01', summary:'ATF rescinded its broad regulatory expansion of the "engaged in the business" definition that had been finalized in April 2024 under the Biden administration. That rule had attempted to define any person who sells a firearm with the intent to profit as a federally licensed dealer, capturing many occasional private sellers and requiring them to obtain FFLs. After challenges in multiple circuits and the change in administration, ATF withdrew the rule in August 2025. The definition reverts to the statutory language codified in the Bipartisan Safer Communities Act (BSCA) of 2022, which requires a finding of "predominant purpose" to profit. Private sellers at gun shows or online who sell from their personal collection on a non-recurring basis are no longer at risk of prosecution under the rescinded framework, though state laws on private sales vary and background check requirements differ by state.', impact:'MED', url:'https://www.atf.gov/rules-and-regulations/atf-launches-new-era-reform' },
  { id:'forced-reset', title:'Forced Reset Triggers — Federally Legal', status:'passed', date:'2025-03-15', summary:'Forced reset triggers (FRTs) mechanically reset the trigger forward after each shot using the bolt carrier group\'s rearward movement, allowing some shooters to fire more rapidly than with a standard trigger. ATF had previously classified certain FRTs as machine guns, leading to raids and criminal prosecutions. In March 2025, the DOJ reached a settlement in ongoing litigation (Rare Breed Triggers v. Garland) restoring federal legality for FRTs. The settlement acknowledged that an FRT requires a separate trigger function for each round fired, removing it from the machine gun definition under Cargill\'s framework. Owners previously subject to enforcement actions were not required to surrender their devices under the settlement. Critical caveat: FRTs remain prohibited under state assault weapons bans in California, New York, New Jersey, and Connecticut, where state-level machine gun definitions may still apply.', impact:'MED', url:'https://www.atf.gov' },
  { id:'dealer-records', title:'Dealer Records Retention Modernization', status:'advancing', date:'2022-08-31', summary:'As part of the April 2026 regulatory reform package, ATF is proposing updated digital recordkeeping standards for Form 4473 (Firearms Transaction Record). The current requirement mandates FFLs retain 4473 forms for 20 years in paper or approved digital format, with forms sent to ATF\'s National Tracing Center upon business closure. The proposed modernization would allow and in some cases require electronic filing systems that meet new ATF cybersecurity and accessibility standards, streamlining compliance for dealers who process high volumes. The proposal also revisits the permanent retention requirement for records from dealers who go out of business, addressing the growing burden on ATF\'s out-of-business records archive which holds over 900 million records. The comment period for this specific rule is open through fall 2026.', impact:'MED', url:'https://www.atf.gov' },
]



// Build exact Congress.gov bill URLs
function billUrl(number, type, congress) {
  const chamberMap = { 'H.R.':'house-bill', 'S.':'senate-bill', 'H.J.Res.':'house-joint-resolution', 'S.J.Res.':'senate-joint-resolution', 'H.Con.Res.':'house-concurrent-resolution' }
  const parts = (type || number || '').split(' ')
  const prefix = parts.length > 1 ? parts[0] : 'H.R.'
  const num = parts.length > 1 ? parts[1] : parts[0]
  const chamber = chamberMap[prefix] || 'house-bill'
  const cong = congress || '118th'
  return `https://www.congress.gov/bill/${cong}-congress/${chamber}/${num}`
}

const SEED_FEDERAL = [
  { _id:'f1', title:'Firearm Safety Act of 2024', billNumber:'H.R. 7910', status:'committee', level:'federal', summary:'Would require universal background checks on all firearm sales and transfers, including private sales between individuals, closing what proponents call the "gun show loophole." The bill mandates that any person transferring a firearm must go through a licensed dealer for a NICS check, with narrow exceptions for family transfers and temporary sporting use. Opponents argue the bill creates a de facto firearm registration system and places undue burden on rural residents far from licensed dealers. The NRA and GOA rate this a top-priority opposition bill. No Republican co-sponsors as of the 118th Congress. Passed committee on party-line votes but has not received a floor vote.', lastActionDate:'2024-09-15', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/house-bill/7910' },
  { _id:'f2', title:'National Concealed Carry Reciprocity Act', billNumber:'H.R. 38', status:'passed', level:'federal', summary:'Requires all states to recognize valid concealed carry permits issued by other states, treating carry permits similarly to driver\'s licenses for interstate recognition. Under the bill, a permit holder from Texas could carry in New York or California using their home state permit, subject to the destination state\'s carry laws regarding locations. Proponents argue it eliminates the patchwork of reciprocity agreements and protects law-abiding citizens traveling between states. Opponents argue it would force restrictive states to honor permits issued under far lower standards. The House passed H.R. 38 with bipartisan support in December 2022 (the SAPA provisions were attached). A companion Senate bill has failed to overcome procedural hurdles due to the 60-vote threshold required to advance.', lastActionDate:'2024-07-20', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/house-bill/38' },
  { _id:'f3', title:'Hearing Protection Act', billNumber:'H.R. 2296', status:'committee', level:'federal', summary:'Would remove suppressors from the National Firearms Act and instead regulate them like ordinary long guns under the GCA — requiring a background check but not the $200 tax stamp, 9-12 month wait, CLEO notification, or NFA registration process. The bill was rendered partially moot by the NFA tax stamp elimination in H.R. 1 (2025), which zeroed out the $200 fee. However, HPA supporters argue that full NFA deregulation is still necessary because the Form 4 approval wait times (currently 60-120 days even after the tax change) impose undue burdens and the registration system treats suppressors like machine guns. The bill has been introduced in every Congress since 2015 and has yet to receive a floor vote despite majority support in some Congresses.', lastActionDate:'2024-06-10', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/house-bill/2296' },
  { _id:'f4', title:'BSCA — Bipartisan Safer Communities Act', billNumber:'S. 2938', status:'passed', level:'federal', summary:'Signed into law on June 25, 2022, the BSCA was the most significant federal gun legislation in nearly 30 years. Key provisions include: enhanced background checks for buyers under 21 (allowing time to contact juvenile records); closure of the "boyfriend loophole" by applying the domestic violence firearms prohibition to dating partners, not just spouses and cohabitants; $750 million for state crisis intervention programs including red flag laws; clarification that repetitive personal-collection sellers are engaged in the business and must obtain FFLs; and $15 billion in mental health and school safety funding over 10 years. The bill passed 65-33 in the Senate and 234-193 in the House. Gun rights groups have challenged the expanded "engaged in the business" provisions, which ATF later partially rescinded.', lastActionDate:'2022-06-25', impact:'HIGH', url:'https://www.congress.gov/bill/117th-congress/senate-bill/2938' },
  { _id:'f5', title:'Equal Access to Justice for Victims of Gun Violence', billNumber:'S. 1223', status:'failed', level:'federal', summary:'Would repeal the Protection of Lawful Commerce in Arms Act (PLCAA), the 2005 federal law that provides firearms manufacturers and dealers with qualified immunity from civil lawsuits when their products are used in crimes. Supporters argue PLCAA unfairly shields an industry from accountability available to every other manufacturer. Opponents — including the NRA, NSSF, and constitutional scholars — argue PLCAA does not bar lawsuits for defective products or negligent sales, only suits for the criminal misuse of a non-defective product by a third party. Removing PLCAA would expose manufacturers to potentially bankrupting litigation regardless of whether they did anything wrong. The bill failed to advance out of committee. Several states (New York, New Jersey, California) have enacted state-level PLCAA workarounds that are currently being litigated.', lastActionDate:'2024-03-12', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/senate-bill/1223' },
  { _id:'f6', title:'Assault Weapons Ban of 2023', billNumber:'H.R. 698', status:'committee', level:'federal', summary:'Would ban the sale, manufacture, transfer, and importation of semi-automatic rifles, pistols, and shotguns with military-style features including pistol grips, folding/telescoping stocks, thumbhole stocks, and the ability to accept detachable magazines. The bill would also ban magazines holding more than 10 rounds. Weapons legally possessed before enactment would be grandfathered but transfers would be prohibited. Challengers argue that post-Bruen, the bill cannot survive text-and-history scrutiny because semi-automatic rifles and standard-capacity magazines are in common use for lawful purposes — the Heller standard. The SCOTUS cases Viramontes v. Cook County and NAGR v. Lamont will likely determine whether any federal assault weapons ban could survive constitutional challenge.', lastActionDate:'2023-11-30', impact:'HIGH', url:'https://www.congress.gov/bill/118th-congress/house-bill/698' },
]

const SEED_STATE = [
  { _id:'s1', title:'Texas Firearms Freedom Act', billNumber:'TX SB 214', status:'passed', state:'TX', level:'state', summary:'Expanded Texas constitutional carry to additional venues and removed remaining licensing requirements for handgun carry. Prior to this bill, Texas had enacted permitless carry in 2021 (HB 1927), allowing law-abiding residents 21 and older to carry a handgun without a License to Carry (LTC). SB 214 extended permitless carry protections and clarified preemption against local ordinances attempting to impose their own carry restrictions. Texas now has one of the most permissive carry frameworks in the country. LTC remains available voluntarily for those seeking reciprocity recognition in other states that do not honor permitless carry. Employers may still prohibit carry on their premises via posted notice under Texas Penal Code §30.07.', lastActionDate:'2024-05-01', impact:'HIGH', url:'https://capitol.texas.gov' },
  { _id:'s2', title:'California Assault Weapon Control Act Update', billNumber:'CA AB 2364', status:'challenged', state:'CA', level:'state', summary:'AB 2364 updated California\'s existing assault weapons ban to close perceived loopholes in the "featureless rifle" and "fixed magazine" compliance configurations that had allowed AR-platform rifles to remain legal with modifications. The bill expanded the definition of prohibited features and tightened the definition of "detachable magazine." It was immediately challenged in federal court by the California Rifle & Pistol Association (CRPA) and the Firearms Policy Coalition, arguing the expanded definitions cannot survive Bruen\'s text-and-history test. The Ninth Circuit has granted a stay pending full briefing. The case sits in a circuit that has historically upheld assault weapons restrictions, but post-Bruen decisions at the district level have frequently found such bans unconstitutional, creating pressure for en banc review.', lastActionDate:'2024-08-15', impact:'HIGH', url:'https://leginfo.legislature.ca.gov' },
  { _id:'s3', title:'Washington Magazine Limit', billNumber:'WA SB 5078', status:'challenged', state:'WA', level:'state', summary:'Washington SB 5078 banned the manufacture, importation, distribution, selling, and offering for sale of ammunition feeding devices capable of accepting more than ten rounds. Signed into law in 2022, the ban affects standard-capacity magazines for popular handguns (Glock 17: 17 rounds, M&P9: 17 rounds) and rifles (AR-15: 30 rounds). It does not ban possession of magazines already owned but prohibits importing new ones. The law is being challenged under Bruen in federal district court, with challengers arguing Washington cannot identify a historical tradition of magazine capacity limits at the founding. A similar ban in California (Duncan v. Bonta) has reached SCOTUS conference multiple times, suggesting the Court may soon weigh in on the broader question.', lastActionDate:'2024-04-22', impact:'HIGH', url:'https://app.leg.wa.gov' },
  { _id:'s4', title:'Florida Permitless Carry Act', billNumber:'FL HB 543', status:'passed', state:'FL', level:'state', summary:'Governor DeSantis signed HB 543 on April 3, 2023, making Florida the 26th state to adopt constitutional carry, allowing law-abiding residents 21 and older (18 for active military) to carry a concealed handgun without first obtaining a Concealed Weapon or Firearm License (CWFL). Florida had previously been one of the last major population states to require a permit. The CWFL remains available for those who want it — particularly for reciprocity purposes in other states that require a permit-holder from the traveler\'s home state. Florida statute still prohibits carry in police stations, polling places, courthouses, schools, universities, bars (while consuming alcohol), professional sporting venues, and any place of nuisance. Open carry remains prohibited in Florida.', lastActionDate:'2023-04-03', impact:'HIGH', url:'https://www.flsenate.gov' },
  { _id:'s5', title:'Illinois PICA — Protect Illinois Communities Act', billNumber:'IL SB 2226', status:'challenged', state:'IL', level:'state', summary:'Signed January 10, 2023, the PICA bans the sale, purchase, and manufacture of assault weapons and large-capacity magazines in Illinois, requiring grandfathered owners to register their weapons with the Illinois State Police by January 1, 2024. The registration deadline passed with compliance estimated at under 10% of existing owners. More than 800 local sheriffs and police chiefs declared they would not enforce the law. Multiple federal and state court challenges were filed simultaneously. The Seventh Circuit initially upheld the law, but the Illinois Supreme Court struck down portions related to registration. The federal challenge is proceeding on Bruen grounds. The case may ultimately split circuit authority with other circuits and force SCOTUS to grant cert on an assault weapons ban case.', lastActionDate:'2024-07-10', impact:'HIGH', url:'https://www.ilga.gov' },
  { _id:'s6', title:'Georgia Constitutional Carry', billNumber:'GA HB 218', status:'passed', state:'GA', level:'state', summary:'Governor Kemp signed HB 218 on April 12, 2022, making Georgia the 25th constitutional carry state. The law allows any Georgia resident who is legally permitted to possess a firearm to carry it concealed without a Weapons Carry License (WCL). Georgia\'s WCL remains available and is recognized in 38+ states through reciprocity. The bill passed the General Assembly after years of advocacy by Georgia Carry and other groups. Notable provisions: persons under 21 may not carry under the permitless carry provision unless they are active or veteran military; carry is still prohibited in government buildings, polling places, houses of worship (unless the governing body allows it), bars, and nuclear power plants. Open carry in Georgia requires a WCL even after this bill.', lastActionDate:'2022-04-12', impact:'MED', url:'https://www.legis.ga.gov' },
]

// ── HELPERS ─────────────────────────────────────────────────────
const STATUS_CONFIG = {
  passed:     { color:'#34D399', bg:'#001A0A', label:'PASSED'     },
  signed:     { color:'#34D399', bg:'#001A0A', label:'SIGNED'     },
  failed:     { color:'#EF4444', bg:'#1A0000', label:'FAILED'     },
  vetoed:     { color:'#EF4444', bg:'#1A0000', label:'VETOED'     },
  challenged: { color:'#FBBF24', bg:'#1A0E00', label:'CHALLENGED' },
  advancing:  { color:'#60A5FA', bg:'#001020', label:'ADVANCING'  },
  committee:  { color:'#9CA3AF', bg:'#111318', label:'COMMITTEE'  },
  pending:    { color:'#9CA3AF', bg:'#111318', label:'PENDING'    },
}
const IMPACT_COLORS = { HIGH:'#EF4444', MED:'#FBBF24', LOW:'#9CA3AF' }

function StatusBadge({ status }) {
  const s = STATUS_CONFIG[status?.toLowerCase()] || STATUS_CONFIG.pending
  return (
    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', fontWeight:700, letterSpacing:'0.12em', color:s.color, background:s.bg, padding:'3px 8px', border:`1px solid ${s.color}40`, whiteSpace:'nowrap' }}>
      {s.label}
    </span>
  )
}

function BillCard({ bill }) {
  const s = STATUS_CONFIG[bill.status?.toLowerCase()] || STATUS_CONFIG.pending
  return (
    <div style={{ background:'#111318', border:`1px solid #1F2428`, borderLeft:`3px solid ${s.color}`, padding:'20px 24px' }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12, marginBottom:8 }}>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', fontWeight:700 }}>{bill.billNumber}</span>
          <StatusBadge status={bill.status} />
          {bill.state && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', background:'#1F2428', padding:'2px 6px' }}>{bill.state}</span>}
          {bill.impact && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:IMPACT_COLORS[bill.impact] || '#9CA3AF' }}>{bill.impact} IMPACT</span>}
        </div>
        {bill.lastActionDate && (
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', flexShrink:0 }}>
            {new Date(bill.lastActionDate).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'})}
          </span>
        )}
      </div>
      <h3 style={{ fontSize:'16px', fontWeight:700, color:'#F0EDE6', lineHeight:1.35, marginBottom:10 }}>{bill.title}</h3>
      {bill.summary && <p style={{ fontSize:'13px', color:'#94A3B8', lineHeight:1.7, marginBottom:12 }}>{bill.summary}</p>}
      {bill.url && <a href={bill.url} target="_blank" rel="noopener noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#60A5FA', textDecoration:'none' }}>VIEW FULL TEXT ↗</a>}
    </div>
  )
}

const TABS = [
  { key:'federal',     label:'🏛 Federal Bills'   },
  { key:'state',       label:'🗺 State Laws'       },
  { key:'atf',         label:'📋 ATF Rules'        },
  { key:'scotus',      label:'⚖ SCOTUS Cases'     },
  { key:'assistant',   label:'🤖 AI Assistant'    },
  { key:'reciprocity', label:'🗺 CCW Reciprocity'  },
]

export default async function LawsPage({ searchParams }) {
  const tab = searchParams?.tab || 'federal'

  const [legislation, alerts, stateProfiles] = await Promise.all([
    fetchLegislation(40).catch(()=>[]),
    fetchBreakingAlerts(5).catch(()=>[]),
    fetchAllStateProfiles().catch(()=>[]),
  ])

  const federal = legislation.filter(l=>l.level==='federal').length > 0
    ? legislation.filter(l=>l.level==='federal')
    : SEED_FEDERAL

  const state = legislation.filter(l=>l.level==='state').length > 0
    ? legislation.filter(l=>l.level==='state')
    : SEED_STATE

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* ── PAGE HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>LAWS</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:680 }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>LAWS & LEGISLATION</span>
              <span style={{ background:'#1F2428', color:'#34D399', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 10px', border:'1px solid #34D39940' }}>LIVE TRACKER</span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'14px' }}>
              Second Amendment<br />
              <span style={{ color:'var(--gold)' }}>Legal Intelligence</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7, maxWidth:540 }}>
              Federal bills in Congress, all 50 state laws, ATF rulemaking, active SCOTUS cases, and an AI-powered law assistant. Updated continuously.
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY TAB BAR (Learn pattern) ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', paddingRight:'8px' }}>
            {TABS.map(t => (
              <a key={t.key} href={`/laws?tab=${t.key}`}
                style={{ display:'inline-flex', alignItems:'center', padding:'12px 18px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', borderBottom:`2px solid ${tab===t.key?'var(--gold)':'transparent'}`, color:tab===t.key?'var(--gold)':'var(--text-dim)', textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                {t.label}
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Breaking law alerts */}
      {alerts.length > 0 && (
        <div style={{ background:'#1A0000', borderBottom:'1px solid #7F1D1D', padding:'12px 0' }}>
          <div className="container">
            <div style={{ display:'flex', gap:16, flexWrap:'wrap' }}>
              {alerts.slice(0,3).map(a => (
                <div key={a._id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:'#EF4444', display:'inline-block' }} />
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#FCA5A5' }}>{a.headline}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding:'40px 0' }}>
        <div className="container">

          {/* ── FEDERAL BILLS ── */}
          {tab === 'federal' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em' }}>FEDERAL FIREARMS LEGISLATION</h2>
                <a href="https://www.congress.gov/search?q=%7B%22source%22%3A%22legislation%22%2C%22search%22%3A%22firearms+second+amendment%22%2C%22congress%22%3A%22119%22%7D" target="_blank" rel="noreferrer"
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#60A5FA', textDecoration:'none' }}>CONGRESS.GOV ↗</a>
              </div>

              <div style={{ display:'flex', gap:8, marginBottom:24, flexWrap:'wrap' }}>
                {['All','Passed','Committee','Challenged','Failed'].map(f => (
                  <a key={f} href={`/laws?tab=federal${f!=='All'?`&status=${f.toLowerCase()}`:''}` }
                    style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'4px 12px', border:'1px solid var(--border)', color:'#6B7280', textDecoration:'none', background: searchParams?.status===f.toLowerCase()||(f==='All'&&!searchParams?.status) ? '#C8922A20' : 'transparent' }}>
                    {f}
                  </a>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {federal
                  .filter(b => !searchParams?.status || b.status?.toLowerCase().includes(searchParams.status))
                  .map(b => <BillCard key={b._id} bill={b} />)}
              </div>

              <div style={{ marginTop:24, padding:'16px', background:'#111318', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
                📡 Data auto-updated via Congress.gov API every 2 hours when CONGRESS_GOV_KEY is configured.
                Source: <a href="https://api.congress.gov" target="_blank" rel="noreferrer" style={{ color:'#60A5FA' }}>api.congress.gov</a>
              </div>
            </div>
          )}

          {/* ── STATE BILLS ── */}
          {tab === 'state' && (
            <div>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20, flexWrap:'wrap', gap:12 }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em' }}>STATE FIREARMS LEGISLATION</h2>
              </div>

              <div style={{ display:'flex', gap:6, marginBottom:24, flexWrap:'wrap' }}>
                {['All',...new Set(state.map(b=>b.state).filter(Boolean))].map(s => (
                  <a key={s} href={`/laws?tab=state${s!=='All'?`&state=${s}`:''}`}
                    style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'4px 10px', border:'1px solid var(--border)', color: searchParams?.state===s||(s==='All'&&!searchParams?.state) ? '#C8922A' : '#6B7280', textDecoration:'none', background: searchParams?.state===s||(s==='All'&&!searchParams?.state) ? '#C8922A20' : 'transparent' }}>
                    {s}
                  </a>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                {state
                  .filter(b => !searchParams?.state || b.state === searchParams.state)
                  .map(b => <BillCard key={b._id} bill={b} />)}
              </div>

              <div style={{ marginTop:24, padding:'16px', background:'#111318', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
                📡 State data auto-updated via LegiScan API (all 50 states) when LEGISCAN_KEY is configured.
                Source: <a href="https://legiscan.com/legiscan" target="_blank" rel="noreferrer" style={{ color:'#60A5FA' }}>legiscan.com</a>
              </div>
            </div>
          )}

          {/* ── ATF RULES ── */}
          {tab === 'atf' && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:8 }}>ATF RULES & REGULATIONS</h2>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7 }}>
                  Current ATF rulemaking that affects lawful gun owners. Status reflects post-Cargill and post-Bruen regulatory landscape.
                </p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {ATF_RULES.map(rule => {
                  const s = STATUS_CONFIG[rule.status] || STATUS_CONFIG.pending
                  return (
                    <div key={rule.id} style={{ background:'#111318', border:`1px solid #1F2428`, borderLeft:`4px solid ${s.color}`, padding:'24px 28px' }}>
                      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, flexWrap:'wrap' }}>
                        <StatusBadge status={rule.status} />
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:IMPACT_COLORS[rule.impact], background:'#111318', padding:'2px 6px', border:`1px solid ${IMPACT_COLORS[rule.impact]}40` }}>{rule.impact} IMPACT</span>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563' }}>{rule.date}</span>
                      </div>
                      <h3 style={{ fontSize:'17px', fontWeight:700, color:'#F0EDE6', lineHeight:1.3, marginBottom:10 }}>{rule.title}</h3>
                      <p style={{ fontSize:'13px', color:'#94A3B8', lineHeight:1.75, marginBottom:12 }}>{rule.summary}</p>
                      <a href={rule.url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#60A5FA', textDecoration:'none' }}>ATF SOURCE ↗</a>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── SCOTUS ── */}
          {tab === 'scotus' && (
            <div>
              <div style={{ marginBottom:20 }}>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:8 }}>SUPREME COURT — 2A CASES</h2>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7 }}>
                  Active and landmark Second Amendment decisions shaping the legal landscape for every gun owner in America.
                </p>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
                {SCOTUS_CASES.map(cas => (
                  <div key={cas.id} style={{ background:'#111318', border:`1px solid ${cas.outcome==='WON'?'#16603440':cas.outcome==='PENDING'?'#1F2428':'#7F1D1D40'}`, padding:'24px', display:'grid', gridTemplateColumns:'80px 1fr', gap:24 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color: cas.outcome==='WON' ? '#34D399' : cas.outcome==='PENDING' ? '#9CA3AF' : '#EF4444', lineHeight:1 }}>{cas.year}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color: cas.outcome==='WON' ? '#34D399' : cas.outcome==='PENDING' ? '#9CA3AF' : '#EF4444', marginTop:4, fontWeight:700 }}>{cas.outcome}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:IMPACT_COLORS[cas.significance], marginTop:4 }}>{cas.significance}</div>
                    </div>
                    <div>
                      <h3 style={{ fontSize:'16px', fontWeight:700, color:'#F0EDE6', marginBottom:8, lineHeight:1.3 }}>{cas.name}</h3>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginBottom:10, letterSpacing:'0.05em' }}>{cas.status}</div>
                      <p style={{ fontSize:'13px', color:'#94A3B8', lineHeight:1.75, marginBottom:12 }}>{cas.summary}</p>
                      <a href={cas.url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#60A5FA', textDecoration:'none' }}>READ OPINION ↗</a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── AI ASSISTANT ── */}
          {tab === 'assistant' && (
            <div style={{ maxWidth:720 }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:8 }}>AI LAW ASSISTANT</h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7, marginBottom:24 }}>
                Ask anything about US firearms law. Powered by Claude AI + DownRange state database.
                Requires ANTHROPIC_API_KEY in Vercel environment variables.
              </p>
              <LawAssistant />
            </div>
          )}

          {/* ── RECIPROCITY ── */}
          {tab === 'reciprocity' && (
            <div style={{ maxWidth:720 }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:8 }}>CCW RECIPROCITY PLANNER</h2>
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7, marginBottom:24 }}>
                Select your home state to see where your permit is honored. Data from stateProfile database.
              </p>
              <ReciprocityPlanner stateProfiles={stateProfiles} />
            </div>
          )}

        </div>
      </div>
      <Footer />
    </>
  )
}
