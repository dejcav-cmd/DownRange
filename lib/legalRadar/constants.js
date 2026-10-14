export const STATES = {
  AL:'Alabama',AK:'Alaska',AZ:'Arizona',AR:'Arkansas',CA:'California',CO:'Colorado',CT:'Connecticut',DE:'Delaware',DC:'District of Columbia',FL:'Florida',GA:'Georgia',
  HI:'Hawaii',ID:'Idaho',IL:'Illinois',IN:'Indiana',IA:'Iowa',KS:'Kansas',KY:'Kentucky',LA:'Louisiana',ME:'Maine',MD:'Maryland',
  MA:'Massachusetts',MI:'Michigan',MN:'Minnesota',MS:'Mississippi',MO:'Missouri',MT:'Montana',NE:'Nebraska',NV:'Nevada',NH:'New Hampshire',NJ:'New Jersey',
  NM:'New Mexico',NY:'New York',NC:'North Carolina',ND:'North Dakota',OH:'Ohio',OK:'Oklahoma',OR:'Oregon',PA:'Pennsylvania',RI:'Rhode Island',SC:'South Carolina',
  SD:'South Dakota',TN:'Tennessee',TX:'Texas',UT:'Utah',VT:'Vermont',VA:'Virginia',WA:'Washington',WV:'West Virginia',WI:'Wisconsin',WY:'Wyoming',
}
export const STATE_CODES = Object.keys(STATES)

export const CIRCUITS = {
  '1': ['ME','NH','MA','RI'],
  '2': ['NY','VT','CT'],
  '3': ['PA','NJ','DE'],
  '4': ['MD','VA','WV','NC','SC'],
  '5': ['TX','LA','MS'],
  '6': ['OH','MI','KY','TN'],
  '7': ['IL','IN','WI'],
  '8': ['MN','IA','MO','AR','NE','SD','ND'],
  '9': ['CA','OR','WA','AK','HI','ID','MT','NV','AZ'],
  '10': ['CO','KS','NM','OK','UT','WY'],
  '11': ['AL','FL','GA'],
  'DC': ['DC'],
}
export const circuitOfState = (code) => Object.keys(CIRCUITS).find(c => CIRCUITS[c].includes(code)) || null
export const circuitLabel = (c) => c === 'DC' ? 'D.C. Circuit' : `${c}${['1','2','3'].includes(c) ? ['st','nd','rd'][+c-1] : 'th'} Circuit`

export const TOPICS = {
  magazines: 'Magazine limits',
  'assault-weapons': 'Assault weapon bans',
  carry: 'Public carry',
  'sensitive-places': 'Sensitive places',
  prohibited: 'Prohibited persons',
  'waiting-period': 'Waiting periods',
  permit: 'Permits and licensing',
  registration: 'Registration',
  age: 'Age limits',
  nfa: 'NFA and ATF rules',
  other: 'Other',
}

// Keyword (non-AI) topic classifier. Free; used for every ingested item.
const TOPIC_RULES = [
  ['magazines', /magazine|round limit|large.capacity/i],
  ['assault-weapons', /assault (weapon|firearm)|AR-15|semi-?automatic rifle|ban on rifles/i],
  ['sensitive-places', /sensitive place|private property|default rule/i],
  ['carry', /carry|concealed|bruen|open carry/i],
  ['prohibited', /felon|922\(g\)|drug user|unlawful user|prohibited person|domestic violence|protective order/i],
  ['waiting-period', /waiting period|cooling.off/i],
  ['permit', /permit|licens|purchase to own|permit-to-purchase/i],
  ['registration', /registration|registry/i],
  ['age', /under 21|age limit|18-to-20|eighteen/i],
  ['nfa', /\bNFA\b|suppressor|short.barrel|ATF|forced reset|brace|machine ?gun/i],
]
export function classifyTopic(text = '') {
  for (const [k, re] of TOPIC_RULES) if (re.test(text)) return k
  return 'other'
}
export const isFirearmText = (t = '') =>
  /second amendment|firearm|\bgun|ammunition|\bATF\b|magazine|handgun|rifle|concealed carry|machine ?gun|suppressor/i.test(t)

// Detect states named in free text.
export function statesInText(text = '') {
  const out = []
  for (const [code, name] of Object.entries(STATES)) {
    if (new RegExp(`\\b${name}\\b`, 'i').test(text)) out.push(code)
  }
  return out
}

export const STAGE_ORDER = ['filed', 'pending', 'petition', 'granted', 'argued', 'decided', 'denied']
export const slugify = (s) => String(s).toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80)

// Plain-language "what is at stake" by topic. Used when a case has no hand-written impact.
export const TOPIC_IMPACT = {
  magazines: 'Capacity limits are in force in a number of states, and the Supreme Court has not yet ruled on one. In June 2026 it agreed to hear two assault-weapon cases, which could affect how courts treat magazine limits too.',
  'assault-weapons': 'Bans on AR-15-style rifles exist in a number of states and localities. The Supreme Court agreed in June 2026 to hear Viramontes v. Cook County and Grant v. Higgins, so the standard for these bans may be set soon.',
  carry: 'Carry rules decide where permit holders can lawfully carry and who can get a permit. Rulings here follow the Bruen history-and-tradition test.',
  'sensitive-places': 'These cases decide how many places a state can put off limits to lawful carry, and what default rules it can set for private property.',
  prohibited: 'These cases decide who can be legally barred from owning firearms and how closely those bans must fit historical practice.',
  'waiting-period': 'Waiting periods delay a purchase by a set number of days. A ruling would show how long a state can make a buyer wait.',
  permit: 'Permit and licensing rules decide how much time, cost and discretion a state can put between a law-abiding person and a firearm.',
  registration: 'Registration rules decide whether a government can require owners to list their firearms, and whether it can refuse to register certain types, as DOJ says D.C. does with AR-15-style rifles.',
  age: 'Age-limit cases decide whether adults under 21 can be barred from buying or carrying firearms.',
  nfa: 'Federal rules and statutes on suppressors, short-barreled rifles, braces and triggers decide what is legal to own and how it is registered.',
  other: 'The outcome could affect how courts apply the Second Amendment in this circuit.',
}

// Plain-language glossary. Cases list the term keys they use; the detail page renders them.
export const GLOSSARY = {
  heller: ['Heller (2008)', 'The Supreme Court case that held the Second Amendment protects an individual right to keep a firearm for self-defense, and struck down D.C.\'s handgun ban and its home trigger-lock rule (2008, 5-4). The Court said the right protects arms "in common use" for lawful purposes, that "dangerous and unusual" weapons can be banned, and that some long-standing rules, such as bans for felons, are presumed lawful.'],
  bruen: ['Bruen (2022)', 'The Supreme Court case that struck down New York\'s rule requiring a special reason to get a permit to carry in public (2022, 6-3). It left "shall-issue" permit systems in place. It set the test courts use today: if the Second Amendment\'s text covers what you did, the government must show its law fits the country\'s historical tradition of firearm regulation.'],
  rahimi: ['Rahimi (2024)', 'The Supreme Court case (2024, 8-1) that upheld the federal ban on gun possession by a person under a domestic-violence restraining order, where a court has found the person is a credible threat to another\'s physical safety. It said a modern law does not need a "historical twin," only to fit the principles of historical regulation.'],
  cert: ['Certiorari ("cert")', 'The Supreme Court chooses most of its cases. A losing party files a petition asking it to take the case. Four of the nine justices must vote to grant it. Most petitions are denied, and a denial is not a ruling on the merits.'],
  conference: ['Conference', 'The private meeting where the justices vote on which petitions to take. Orders come out the same day or soon after, usually that Friday afternoon or the following Monday.'],
  relist: ['Relist', 'When the Court puts a petition back on the next conference instead of deciding it. The Court usually relists a case at least once before granting it, so a relist can mean a grant is possible. It can also precede a written dissent or a summary ruling.'],
  hold: ['Hold', 'The Court sets a petition aside until it decides a related case, then acts on it in light of that ruling.'],
  circuit: ['Circuit', 'The U.S. has 13 federal appeals courts. Twelve are regional (the 1st through 11th Circuits and the D.C. Circuit), and each one\'s rulings are binding precedent for the federal courts in its region. The 13th, the Federal Circuit, handles specialized cases nationwide.'],
  split: ['Circuit split', 'When two appeals courts reach opposite answers on the same legal question. A split is one of the strongest reasons for the Supreme Court to step in.'],
  enbanc: ['En banc', 'When all (or a large group of) the judges of an appeals court rehear a case, instead of the usual three-judge panel.'],
  facial: ['Facial vs. as-applied', 'A facial challenge says a law is unconstitutional in every case. An as-applied challenge says it is unconstitutional only for this person in these facts.'],
  scrutiny: ['Means-end scrutiny', 'Balancing a law\'s benefits against its burden on a right. Bruen rejected this approach for Second Amendment cases and replaced it with the history test.'],
  injunction: ['Preliminary injunction', 'A temporary court order that blocks a law while the case is decided, issued only if the challengers are likely to win and also show they would suffer harm without it.'],
  common_use: ['"Common use"', 'A Heller idea: arms commonly owned by law-abiding people for lawful purposes are protected. Challengers to rifle and magazine bans lean on it. Governments argue the real test is history, not popularity. The Supreme Court has agreed to decide in its 2026 term what counts as an "arm" in two assault-weapon ban cases, Viramontes v. Cook County and Grant v. Higgins.'],
  nominal: ['Nominal damages', 'A token payment, often one dollar, that lets a plaintiff keep a case alive after a law changes.'],
}

// Plain-English explainer by topic: what the law does and what the fight is about.
export const TOPIC_PLAIN = {
  magazines: ['Some states cap how many rounds a magazine can hold, commonly at 10 or 15. Many popular handguns and rifles are built for magazines that hold more.', 'States say high-capacity magazines make shootings deadlier. Challengers say they are ordinary equipment, owned by millions of people, and that Heller protects arms in common use.', ['heller', 'bruen', 'common_use']],
  'assault-weapons': ['These laws ban rifles, usually AR-15 style, by a list of features such as a pistol grip, or by model name.', 'States say these rifles are too dangerous and function like military arms. Challengers say they are the most popular rifles in America, used for sport and home defense, and so are protected.', ['heller', 'bruen', 'common_use']],
  carry: ['Carry laws decide who can get a permit and where they can carry.', 'After Bruen, a state has to show its carry rules fit historical tradition. The fights are over permit requirements, fees, training mandates and delays.', ['bruen', 'scrutiny']],
  'sensitive-places': ['Sensitive-place laws put locations such as schools, courthouses and sometimes parks or transit off limits to carry.', 'Bruen allowed some sensitive places but did not say how many a state can add. Courts are working out how far the list can stretch before it effectively bans carry.', ['bruen']],
  prohibited: ['Federal and state law bars certain groups from owning guns, including felons, some drug users and people under protective orders. In June 2026 the Supreme Court held in United States v. Hemani that the federal ban on gun possession by "unlawful drug users" could not be applied to Hemani, a marijuana user. The ruling is limited to the facts of that case.', 'The question is how closely each ban must match historical practice, and whether it can apply to everyone in the group automatically or only after someone is shown to be dangerous.', ['bruen', 'rahimi', 'facial']],
  'waiting-period': ['A waiting period makes a buyer wait a set number of days between buying a gun and taking it home, even after passing a background check.', 'States say it provides a cooling-off period. Challengers say a buyer who has already passed the check has been shown to be eligible, and the delay is a burden with no historical roots.', ['bruen']],
  permit: ['Some states require a permit or license just to buy a firearm, sometimes with training, fees and long processing times.', 'The legal fight is whether those requirements, and how long they take, are a reasonable condition or an obstacle to exercising the right.', ['bruen']],
  registration: ['Registration laws require owners to list their firearms with the government.', 'States say registries help trace crime guns. Challengers say they burden lawful owners and have no clear historical precedent.', ['bruen']],
  age: ['Age-limit laws stop adults under 21 from buying or carrying certain firearms.', 'The question is whether 18-to-20-year-olds are part of "the people" with full Second Amendment rights, and what history says about regulating young adults.', ['bruen']],
  nfa: ['The National Firearms Act and ATF rules regulate suppressors, short-barreled rifles, machine guns and certain accessories.', 'Disputes cover what ATF can regulate by rule and what only Congress can change.', []],
  other: ['This case raises a Second Amendment question that courts are still working out after Bruen.', 'The result in this circuit can shape how lower courts rule on similar laws elsewhere.', ['bruen']],
}
