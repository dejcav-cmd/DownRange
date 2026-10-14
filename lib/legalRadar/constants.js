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
