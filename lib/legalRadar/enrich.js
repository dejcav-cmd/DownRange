// Hand-written case write-ups. Facts come from the court's docket, opinions and published
// reporting (SCOTUSblog, Jurist, Duke Center for Firearms Law, Faegre Drinker, AmmoLand).
// Fields: question, ruling, impact, legal (paragraphs split by blank line), plain (same),
// ifWin / ifLose (pending cases), watch (next step), terms (GLOSSARY keys).
export const ENRICH = {
  'viramontes-v-cook-county': {
    question: `Whether the Second and Fourteenth Amendments guarantee the right to possess AR-15 platform and similar semiautomatic rifles. The parties dispute whether "common use" under Heller decides that, or whether the Bruen historical-tradition test lets the ban stand regardless of popularity.`,
    impact: `This is the Court's first merits case on a rifle ban. A ruling for the challengers would put rifle bans, and likely magazine limits built on the same reasoning, in doubt in every state that has them. A ruling for the government would let those laws stand and set the test for the next wave of cases. The Court will hear it in one hour of argument with Grant v. Higgins, so one opinion should cover both.`,
    legal: `Cutberto Viramontes challenged a Cook County, Illinois ordinance that bans "assault weapons," defined as semi-automatic rifles that can accept a large-capacity magazine and have features such as a pistol grip or muzzle brake, plus a list of named models. The district court ruled for the county on summary judgment in March 2024. The Seventh Circuit affirmed on June 2, 2025. It held that its 2023 decision in Bevis v. City of Naperville, which upheld Illinois's statewide ban, controls, and that Viramontes had not built a record showing AR-15s differ from M16s in a way that would change that result. Bevis reasoned that AR-style rifles are not materially different from the M16 rifles used by the military and so fall outside the class of arms the Second Amendment protects. The Supreme Court denied review of the Illinois litigation (Harrel v. Raoul) in July 2024, with Justice Alito voting to grant and Justice Thomas writing separately.

The challengers argue the rifles are among the most common in the country, so Heller's "in common use" principle protects them. The county argues they are functionally military weapons and that the history-and-tradition test from Bruen allows the ban no matter how popular the rifles are. The Court agreed on June 30, 2026 to hear the case together with Grant v. Higgins, a challenge to Connecticut's similar law. The case turns on a methodology question that the lower courts have answered differently: does popularity decide whether an arm is protected, or does history?`,
    plain: `Cook County, Illinois says you cannot own the most popular rifle in America, the AR-15, or rifles like it. Gun owners say a rifle that millions of ordinary people own for home defense, hunting and target shooting is exactly what the Second Amendment covers. The county says these rifles work like military weapons, so they can be banned.

The Supreme Court has never settled this directly. In 2025, when it turned down a Maryland case on the same issue, Justice Kavanaugh wrote that the Court "should and presumably will address the AR-15 issue soon, in the next Term or two." It has now done that.

Argument is December 2, 2026. Rulings in argued cases usually come by the end of June or the first days of July.

Until the Court rules, these bans remain in force and can still be enforced. Do not assume a ban is unenforceable because the Court took the case.`,
    ifWin: `Rifle bans in Illinois, Connecticut and other states with similar laws would lose their legal footing, and challenges to magazine limits would likely get stronger.`,
    ifLose: `The bans stay. States would have a green light to pass similar laws, and lower courts would follow the Court's reasoning on "dangerous" or military-style arms.`,
    watch: `Dec 2, 2026: oral argument. Listen for whether the justices ask about "common use" or about historical analogues. That tells you which test is likely to win.`,
    terms: ['heller', 'bruen', 'common_use', 'circuit', 'nominal'],
  },
  'grant-v-higgins': {
    question: `Whether Connecticut's ban on AR-15-style rifles is consistent with the Second Amendment. Same question as Viramontes.`,
    impact: `Connecticut residents are directly affected, and so are owners in the other states with similar bans. The Court will hear the two cases together because they put the rifle-ban question to it from two circuits, the Second and the Seventh.`,
    legal: `Connecticut first restricted assault weapons in 1993 and expanded the law in 2013, four months after the 2012 Sandy Hook shooting. The law names dozens of firearms and uses feature tests, in a way similar to Cook County's ordinance. The challengers appealed the denial of a preliminary injunction. In August 2025 the Second Circuit affirmed, assuming without deciding that the rifles are protected, and held the law fits the nation's tradition of regulating "unusually dangerous weapons." That is a different route to the same result as the Seventh Circuit's Bevis reasoning, which put these rifles outside the Second Amendment's coverage altogether.

The Court granted review on June 30, 2026 and consolidated this case with Viramontes for one argument on December 2, 2026. The question presented is whether bans on AR-15s and other semi-automatic rifles violate the Second Amendment.`,
    plain: `Connecticut expanded its assault weapons ban after the Sandy Hook shooting in 2012. Gun owners sued, saying the state cannot ban rifles that are widely owned. A federal appeals court, the Second Circuit, said the law is fine because the rifles are especially dangerous. The Supreme Court will now decide.

The Court is hearing two cases from two regions together, and its ruling could set a national standard. Until it rules, Connecticut's law stays in force.`,
    ifWin: `Connecticut's ban would be struck down, and the decision would guide challenges to similar bans across the country.`,
    ifLose: `Connecticut's ban stands, and the same approach protects similar laws in other states.`,
    watch: `Dec 2, 2026: oral argument, shared with Viramontes.`,
    terms: ['heller', 'bruen', 'common_use', 'circuit'],
  },
  'united-states-v-hemani': {
    question: `Can Congress make it a crime for someone who regularly uses marijuana to possess a firearm under 18 U.S.C. 922(g)(3)?`,
    ruling: `The Court affirmed the Fifth Circuit and ruled for Ali Hemani. All nine justices agreed on the judgment. Justice Gorsuch wrote the majority opinion, joined by Chief Justice Roberts and Justices Thomas, Sotomayor, Kavanaugh, Barrett and Jackson. Justices Thomas and Jackson (joined by Sotomayor) wrote concurrences, and Justice Alito, joined by Justice Kagan, concurred in the judgment. The Court called its decision narrow.`,
    impact: `The ruling is a strong precedent against prosecutions that rest only on regular marijuana use, but it was an as-applied decision on Hemani's facts, and 922(g)(3) remains on the books. The Court did not address disarming addicts, people who are intoxicated, or individuals shown to be dangerous, and did not touch the felon ban, so lower courts will keep sorting out the edges case by case.`,
    legal: `Ali Hemani was investigated over suspected terrorism-related activity. He cooperated, surrendered a gun kept in his home, and said he used marijuana about every other day. He was charged under 18 U.S.C. 922(g)(3), which bars an "unlawful user of or addicted to any controlled substance" from possessing firearms. The district court dismissed the indictment on Second Amendment grounds and the Fifth Circuit affirmed, holding the statute unconstitutional as applied to him.

Under Bruen, the government conceded that the statute burdens conduct the Second Amendment presumptively protects, so the question was whether the law fits the nation's historical tradition. The government pointed to old "habitual drunkard" laws as the closest analogue. The Court rejected that analogy for three reasons: those laws reached people whose drinking left them unable to manage their affairs, not regular users; they were aimed mainly at protecting the drinker, the family and the community rather than disarming dangerous people; and they came with a process before disarmament, while 922(g)(3) applies automatically once someone is an unlawful user. The Court also noted that, after oral argument, the government moved some marijuana products from Schedule I to Schedule III.`,
    plain: `Federal law says you cannot own a gun if you are "an unlawful user" of a controlled substance. Marijuana is still a controlled substance federally, though some marijuana products were recently moved to Schedule III, so millions of people in states where it is legal were technically barred from owning guns. The government argued it could prosecute someone for regular marijuana use alone.

The Supreme Court said no, at least for a regular marijuana user like Hemani. (Agents also found cocaine in his home.) It compared the law to old laws about "habitual drunkards" and found the two were not close enough. All nine justices agreed Hemani should win, but only seven joined the Court's reasoning; Justices Alito and Kagan agreed only with the result.

The ruling is narrow. It does not say that anyone can possess a gun while using drugs, and it leaves open how the law applies to heavy users, people who are impaired, or people using other drugs. Do not treat it as a green light. If you use marijuana and own guns, talk to a lawyer about your own situation.`,
    terms: ['bruen', 'facial', 'circuit'],
  },
  'wolford-v-lopez': {
    question: `Can Hawaii bar permit holders from carrying onto private property that is open to the public unless the owner has given permission?`,
    ruling: `The Court held 6-3 that Hawaii's requirement violates the Second and Fourteenth Amendments. Justice Alito wrote the majority opinion, joined by Chief Justice Roberts and Justices Thomas, Gorsuch, Kavanaugh and Barrett. Justice Barrett wrote a concurrence joined by Justices Thomas and Gorsuch as to Part II-B. Justice Kagan dissented, and Justice Jackson dissented in an opinion joined by Justice Sotomayor.`,
    impact: `Licensed carriers in Hawaii no longer need an owner's express permission to carry onto private property open to the public, such as shops and restaurants, though owners may still prohibit carry. Similar consent-based default rules in other states are now exposed to challenge, and the Second Circuit had already struck down a comparable New York provision in Antonyuk v. James.`,
    legal: `After Bruen, Hawaii passed a 2023 law making it illegal for a licensed concealed-carry holder to bring a handgun onto private property open to the public unless the owner gave express permission. Critics called it the "vampire rule," because, like a vampire, a carrier needed an invitation to enter. A federal district judge blocked parts of the law in August 2023. In September 2024 a Ninth Circuit panel upheld Hawaii's rule, reasoning that owners could grant permission orally, in writing or by signs. The same panel struck down California's similar rule, which allowed permission by sign only. The Ninth Circuit denied rehearing en banc in January 2025.

The Supreme Court granted review on October 3, 2025, limited to how the Second Amendment applies to publicly accessible private property, and heard argument on January 20, 2026. On June 25, 2026 it held the Hawaii requirement violated the Second and Fourteenth Amendments. The majority found the restriction falls within the Second Amendment's text, making it presumptively unconstitutional, and reasoned that Hawaii's reversal of the common-law default, under which entry is allowed unless prohibited, imposed a significant new burden.`,
    plain: `Picture walking into a grocery store, gas station or restaurant with your licensed, legally carried handgun. Hawaii said that was a crime unless the owner had already said yes. Because most owners never say anything, that meant you could not carry almost anywhere you went, which gun owners saw as a back-door carry ban.

The Supreme Court struck that down, 6 to 3. The state cannot make "no" the default for places that are open to the public.

Owners keep their own authority. A business can still post a sign or ask you to leave. What changed is that the state cannot make you get permission first. The ruling covers private property open to the public, not sensitive places or private property closed to the public. Check your state's current rules before you carry.`,
    terms: ['bruen', 'circuit', 'enbanc'],
  },
  'beckwith-v-frey': {
    question: `Can a state make a lawful buyer wait 72 hours after clearing a background check, and can a court skip Bruen's historical test by treating buying a gun as a step before "keeping and bearing" arms?`,
    impact: `The Court has not yet taken a waiting-period case. A grant would put waiting periods nationwide in play. A denial leaves the First Circuit's April 2026 vacatur of the injunction in place and sends the case back to the district court. The First Circuit acknowledged that courts are split on this question, and the petition says the Tenth Circuit's Ortega v. Grisham decision conflicts with it.`,
    legal: `Maine's law (25 M.R.S. 2016, effective August 2024) generally bars a seller from delivering a firearm until 72 hours after the parties agree to the sale. The waiting period runs alongside the background check, but an instant approval does not end it. There are exemptions for law enforcement, corrections officers, some security personnel and dealers, certain family transfers and sales that require no background check, but no general exception for a buyer who has passed a check and faces an immediate threat. Violators face civil fines of $200 to $500, rising to $500 to $1,000.

A federal district judge blocked the law with a preliminary injunction, finding the challengers likely to win. In April 2026 the First Circuit vacated the injunction. It did not decide whether Maine could point to a historical tradition of mandatory delays. Instead it treated the wait as a "condition on the commercial sale of firearms," presumptively lawful unless the challengers show it is "abusive," reasoning that laws governing acquisition do not directly regulate conduct covered by the Second Amendment's plain text. The petition (No. 26-258) argues that this lets courts weigh how much infringement to tolerate, which Bruen rejected. It also points to a different approach in the Tenth Circuit, which in Ortega v. Grisham found that New Mexico's seven-day waiting period implicated the Second Amendment and rejected the state's historical defense.

Maine waived its right to respond on September 24. The Second Amendment Foundation and the NRA filed an amicus brief on September 22, followed on September 28 by briefs from Montana and 24 other states and from the Buckeye Institute. The petition is set for the Court's October 16 conference.`,
    plain: `Maine makes you wait 72 hours, three full days, after you buy a gun before you can take it home, even if you pass the background check on the spot. One example from the challengers: a woman who passed her check right away still could not take her gun home until Tuesday, because the store was closed Sunday and Monday.

A federal judge blocked the law. Then the First Circuit said the law was probably fine because it only regulates the sale, not owning or carrying, and put the burden on gun owners to prove it was "abusive." The gun-rights side says that dodges the test the Supreme Court set in Bruen.

On October 16 the justices will vote on whether to take the case. According to the petition, 13 states and D.C. have waiting periods, so the answer reaches well beyond Maine.`,
    ifWin: `If the Court takes the case and sides with the challengers, waiting periods in states with them would face the history test and many could fall.`,
    ifLose: `If the Court declines, Maine's law stands in the First Circuit, and states elsewhere may copy the First Circuit's approach.`,
    watch: `Oct 16, 2026: conference. An order list usually follows within days.`,
    terms: ['bruen', 'cert', 'conference', 'split', 'injunction'],
  },
  'duncan-v-bonta': {
    question: `Whether California's limit on magazines holding more than 10 rounds is consistent with the Second Amendment.`,
    impact: `A grant would give the Court a direct magazine case. The Court could also hold this petition for Viramontes and Grant, since the arms-ban test it adopts there may govern magazines too.`,
    legal: `California bans magazines that can hold more than 10 rounds. A federal district court struck the ban down on September 22, 2023. The en banc Ninth Circuit reversed and upheld the law on March 20, 2025. The challengers petitioned the Supreme Court (No. 25-198) on August 15, 2025. The petition was distributed for conference repeatedly through June 29, 2026, and supplemental briefs were filed in March, April and August 2026, the last after the Third Circuit struck down New Jersey's magazine ban en banc on July 17, 2026. The docket shows no later conference, hold or order. The petition also raises a Takings Clause claim.

The legal questions are the same ones in the rifle-ban cases: whether a magazine is an "arm" or an accessory, whether magazines that hold more than 10 rounds are in common use, and whether the history-and-tradition test supports a numeric cap. Because those questions overlap with Viramontes and Grant, the Court has options short of a grant or denial, including holding the petition until it decides those cases.`,
    plain: `California says no magazine can hold more than 10 rounds. Many common handguns and rifles are designed for magazines that hold more, so this affects a very large number of everyday firearms.

The Supreme Court has been asked to take this case for over a year. It has not said yes or no. One possibility, though the docket does not show it, is that the Court waits to see what it decides in the AR-15 cases, because the arguments overlap, and then tells the lower court to look at Duncan again in light of that ruling.`,
    ifWin: `California's cap could be struck down, and magazine limits in other states would be in jeopardy.`,
    ifLose: `The Ninth Circuit ruling stands and limits remain in force on the West Coast.`,
    watch: `Watch the order lists. An order may come, or the petition may sit on hold until the AR-15 cases are decided.`,
    terms: ['cert', 'hold', 'enbanc', 'common_use', 'bruen'],
  },
  'gator-s-custom-guns-v-washington': {
    question: `Whether Washington's ban on selling and manufacturing magazines over 10 rounds is consistent with the Second Amendment.`,
    impact: `A second magazine petition alongside Duncan. Together they give the Court several routes to the capacity-limit question.`,
  },
  'nagr-v-lamont': {
    question: `Whether Connecticut's assault weapons and large-capacity magazine laws are consistent with the Second Amendment.`,
    impact: `Decided together with Grant v. Lamont in the Second Circuit. Because the case comes from a preliminary-injunction denial, the Court could also deny it on that ground.`,
    terms: ['cert', 'hold', 'bruen'],
  },
}
