# OpenClaw Blog Content Generation — Prompt Templates

## Usage
POST to: `https://downrangeco.com/api/blog-publish` (see API section below)
Model: Hermes 3 or any capable LLM
Author: Always "DJ Cavalcanti" | Title: "DownRange Founder"

---

## TOP BLOG CATEGORIES (from Reddit, r/guns, r/CCW, r/Firearms community research)

### Tier 1: Highest Traffic Topics (most searched by beginners)
1. "First gun" purchase advice — #1 question in r/guns
2. CCW/carry permit process — constant stream of state-specific questions  
3. Safe storage with kids in the home — emotionally high-stakes, practical need
4. 9mm vs other calibers for defense — endless debate, good for SEO
5. Cleaning a pistol for the first time — high search volume, beginner anxiety
6. Legal questions about transport across state lines — huge confusion area
7. What to buy at a gun store vs online — price shopping is common
8. NFA items after 2026 tax stamp elimination — major recent event

### Tier 2: Strong Engagement
9. Red dot vs iron sights for beginners
10. Best guns under $500 (current market)
11. Constitutional carry state — what it means for you
12. Hollow point vs FMJ for home defense
13. How to read your state's gun laws
14. Range bag essentials — what to bring
15. Printing (showing) while carrying — how to avoid it
16. Defensive shooting mindset — Cooper's color code

### Tier 3: Niche but Loyal Audience
17. Women and firearms — specific ergonomic considerations  
18. Seniors and firearms — arthritis, grip strength, racking slides
19. Apartment dweller home defense — penetration concerns
20. Gun rights for veterans — VA and firearms rights
21. Firearms and mental health — navigating legal questions
22. Hunting: getting started as an adult
23. Gear on a budget — best bang-for-buck accessories
24. The language of guns — glossary for complete beginners

---

## PROMPT TEMPLATES FOR OPENCLAW

### Template A: How-To Guide
```
Write a comprehensive, beginner-friendly guide for the DownRange Learning Center titled:
"[TITLE]"

Author: DJ Cavalcanti (DownRange Founder)
Audience: American adults who are new to firearms or considering their first purchase.
Tone: Direct, authoritative, practical, never condescending. Treat readers as intelligent adults making responsible choices. Pro-2A without being political.

Format as JSON:
{
  "title": "[TITLE]",
  "subtitle": "one sentence that answers 'what will I learn?'",
  "category": "[CATEGORY]",
  "readTime": "X min read",
  "date": "MONTH YEAR",
  "tags": ["tag1", "tag2", "tag3", "tag4"],
  "intro": "2-3 paragraphs. Hook with a real problem or misconception beginners have. \\n\\n between paragraphs.",
  "sections": [
    {
      "h": "Section Heading (actionable, specific)",
      "body": "3-4 paragraphs of practical, specific advice. Include numbers, prices, specific product recommendations where appropriate. \\n\\n between paragraphs."
    }
  ],
  "keyTakeaways": ["5 concise, actionable bullet points"],
  "relatedLinks": []
}

Write 5-6 sections. Total length: 1,200-1,800 words (body text only).
Include specific brand names, prices, and state-specific information where relevant.
Do NOT include general safety disclaimers or "consult a professional" boilerplate.
```

### Template B: Comparison Article
```
Write a detailed comparison guide for the DownRange Learning Center titled:
"[TITLE: Product A vs Product B] — Which Is Right for You?"

[Same format as Template A]

Structure:
- Section 1: Quick summary (who should pick each)
- Section 2: [Product A] — full analysis with pros/cons
- Section 3: [Product B] — full analysis with pros/cons  
- Section 4: Head-to-head comparison (table format embedded in body text)
- Section 5: Our verdict by use case (EDC, home defense, range, beginner)
```

### Template C: Legal/State Guide
```
Write a state-specific legal guide for the DownRange Learning Center:
"Firearms Laws in [STATE]: What Every Gun Owner Must Know"

Focus on:
1. Constitutional carry status (yes/no and details)
2. CCW permit process and requirements
3. Magazine restrictions (if any)
4. AWB status (if any)  
5. Open carry rules
6. Suppressor legality
7. Transport laws (in vehicle, traveling through state)
8. Reciprocity summary
9. Red flag law status

Include direct links to: state AG website, state legislature, official permit application
Always cite current 2026 status.
```

### Template D: Gear Review
```
Write a detailed product review for the DownRange Learning Center:
"[PRODUCT NAME] Review — [Year]"

Structure:
1. Introduction: who this product is for
2. Specs and features (specific, not marketing copy)
3. Hands-on performance: what it does well
4. Weaknesses: be honest, no product is perfect
5. Comparison to top alternatives
6. Our verdict with score X/10
7. Where to buy (MSRP, current street price)

DownRange review scoring:
9.0-10: Best in class, buy this
8.0-8.9: Excellent, minor flaws only
7.0-7.9: Good option with clear caveats
Below 7.0: We won't publish it — reader's time is valuable
```

---

## PUBLISHING API

### POST to /api/blog-publish
```javascript
// Run this with your OpenClaw Mac Mini agent
const article = {
  title: "Article Title",
  slug: "article-slug", // lowercase-hyphenated
  subtitle: "Subtitle",
  category: "Getting Started", // from approved categories
  readTime: "10 min read",
  date: "May 2026",
  tags: ["tag1", "tag2"],
  intro: "...",
  sections: [{ h: "Heading", body: "Body text" }],
  keyTakeaways: ["takeaway 1", "takeaway 2"],
  author: "DJ Cavalcanti",
  status: "published", // or "draft"
}

const res = await fetch('https://downrangeco.com/api/blog-publish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.CRON_SECRET}`
  },
  body: JSON.stringify(article)
})
```

---

## EDITORIAL CALENDAR TEMPLATE

| Week | Title | Category | Status |
|------|-------|----------|--------|
| Week 1 | Buying Your First Gun | Getting Started | ✓ Published |
| Week 1 | The Four Rules of Firearms Safety | Safety | ✓ Published |
| Week 1 | How to Get Your CCW License | CCW | ✓ Published |
| Week 2 | 9mm vs .45 ACP — Which Should You Choose? | Ammunition | 📝 Queue |
| Week 2 | Red Dot vs Iron Sights for Beginners | Getting Started | 📝 Queue |
| Week 3 | Safe Storage With Kids in the Home | Safe Storage | 📝 Queue |
| Week 3 | Constitutional Carry Explained | Legal | 📝 Queue |
| Week 4 | Your First Cleaning Kit: What You Actually Need | Maintenance | 📝 Queue |
| Week 4 | Hollow Point vs FMJ: Which Ammo for Defense? | Ammunition | 📝 Queue |
| Month 2 | Women and Firearms: Ergonomics and Fit Guide | Getting Started | 📅 Planned |
| Month 2 | Apartment Home Defense: Penetration Concerns | Home Defense | 📅 Planned |
| Month 2 | State Gun Laws: The 10 States You Must Know | Legal | 📅 Planned |

---

## QUALITY CHECKLIST (before publishing)
- [ ] Author: "DJ Cavalcanti" — DownRange Founder
- [ ] Minimum 1,000 words
- [ ] 4+ sections with specific h2 headings
- [ ] Key Takeaways (5 bullet points)
- [ ] Category assigned from approved list
- [ ] Tags: 3-5 relevant tags
- [ ] No copyright-protected content reproduced
- [ ] Prices verified (approximate is fine, note as "approximate")
- [ ] Legal information: accurate for 2026, states current law
