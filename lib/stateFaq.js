// FAQ structured data for state gun law pages
// Each state gets 5 high-intent questions Google will show as expandable answers in SERPs

const BASE_FAQS = [
  {
    q: (state, abbr) => `Do I need a permit to carry a concealed handgun in ${state}?`,
    a: (d, state) => d.constitutionalCarry
      ? `${state} has constitutional carry — no permit is required to carry a concealed handgun if you are legally allowed to own a firearm. You may still obtain an optional permit for reciprocity in other states.`
      : `${state} requires a permit to carry a concealed handgun. The permit is called the ${d.ccwPermit || 'Concealed Carry Permit'}. You must apply through your local law enforcement agency and meet state eligibility requirements.`,
  },
  {
    q: (state, abbr) => `Does ${state} have a red flag law?`,
    a: (d, state) => d.redFlagLaw
      ? `Yes, ${state} has a red flag law (also called an Extreme Risk Protection Order or ERPO). Courts can temporarily remove firearms from individuals deemed a risk to themselves or others. Hearings are required within a set number of days.`
      : `No, ${state} does not currently have a red flag law. Firearm removal requires due process through standard criminal or civil proceedings.`,
  },
  {
    q: (state, abbr) => `What is the magazine capacity limit in ${state}?`,
    a: (d, state) => d.magLimit
      ? `${state} restricts magazines to ${d.magLimit} rounds maximum. Magazines over this limit may be banned for sale or possession depending on when they were acquired. Always verify current statutes as this law is subject to legal challenges.`
      : `${state} has no magazine capacity restrictions. Standard and high-capacity magazines are legal to own and use.`,
  },
  {
    q: (state, abbr) => `Is open carry legal in ${state}?`,
    a: (d, state) => {
      const oc = d.openCarry || ''
      if (oc.toLowerCase().includes('prohibited')) return `Open carry of handguns is prohibited in ${state}. Firearms must be concealed if carried in public, and a valid permit is required.`
      if (oc.toLowerCase().includes('no permit') || oc.toLowerCase().includes('legal')) return `Open carry is legal in ${state} without a permit, provided the individual is legally allowed to possess a firearm. Some municipalities may have additional restrictions.`
      return `Open carry rules in ${state}: ${oc}. Check with local authorities for municipal restrictions that may apply in your area.`
    },
  },
  {
    q: (state, abbr) => `How many states honor a ${abbr} concealed carry permit?`,
    a: (d, state, abbr) => {
      const count = d.reciprocityStates?.length || 0
      if (count === 0) return `${state}'s concealed carry permit currently has limited reciprocity. Always verify the most current reciprocity agreements before traveling with a firearm.`
      return `A ${state} concealed carry permit is honored in ${count} other states, including: ${(d.reciprocityStates || []).slice(0, 8).join(', ')}${count > 8 ? ` and ${count - 8} more` : ''}. Always confirm reciprocity laws before traveling, as agreements change.`
    },
  },
]

export function buildStateFaqSchema(stateName, abbr, data) {
  const items = BASE_FAQS.map(faq => ({
    '@type': 'Question',
    name: faq.q(stateName, abbr),
    acceptedAnswer: {
      '@type': 'Answer',
      text: faq.a(data, stateName, abbr),
    },
  }))

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items,
  }
}

export function buildStateFaqHtml(stateName, abbr, data) {
  return BASE_FAQS.map(faq => ({
    question: faq.q(stateName, abbr),
    answer:   faq.a(data, stateName, abbr),
  }))
}
