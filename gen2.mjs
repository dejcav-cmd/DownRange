import Anthropic from '@anthropic-ai/sdk'
import { readFileSync, writeFileSync } from 'fs'

const API_KEY = readFileSync('/tmp/apikey.txt', 'utf8').trim()
const client = new Anthropic({ apiKey: API_KEY })

const SLUGS = [
  { slug: 'home-defense-basics',          title: 'Home Defense Basics: What You Actually Need',               cat: 'Home Defense' },
  { slug: 'safe-storage-guide-beginners', title: 'Safe Storage 101: Keeping Your Guns Secure and Accessible',  cat: 'Safe Storage' },
  { slug: 'ammo-guide-beginners',         title: 'Ammunition Explained: What to Buy and Why',                 cat: 'Ammunition' },
  { slug: 'shooting-range-first-visit',   title: 'Your First Time at a Shooting Range: What to Expect',       cat: 'Getting Started' },
  { slug: 'cleaning-maintaining-your-gun',title: 'How to Clean and Maintain Your Firearm',                    cat: 'Maintenance' },
  { slug: 'understanding-gun-laws',       title: 'Understanding Gun Laws: A Beginner\'s Legal Overview',      cat: 'Legal' },
  { slug: 'choosing-holster-beginners',   title: 'How to Choose a Holster for Concealed Carry',               cat: 'CCW & Carry' },
  { slug: 'dry-fire-training-beginners',  title: 'Dry Fire Training: Get Better Without Spending on Ammo',    cat: 'Training' },
  { slug: 'what-is-nfa',                  title: 'What Is the NFA? Suppressors, SBRs, and Machine Guns Explained', cat: 'Legal' },
]

async function gen(meta) {
  const msg = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3500,
    messages: [{
      role: 'user',
      content: `You are writing for DownRange, a US firearms intelligence hub. Write a practical beginner guide.

Title: "${meta.title}"
Author: DJ Cavalcanti, DownRange Founder
Audience: American adults new to firearms. Practical, no lecturing.
Tone: Direct, authoritative, like talking to an intelligent adult. 2026 current info.

Return ONLY valid JSON (no markdown fences):
{
  "title": "${meta.title}",
  "subtitle": "one sentence subtitle answering what they will learn",
  "category": "${meta.cat}",
  "readTime": "X min read",
  "date": "May 2026",
  "tags": ["tag1","tag2","tag3","tag4"],
  "intro": "2 focused paragraphs — hook with a real problem beginners face. Separate with \\n\\n",
  "sections": [
    {"h": "Section Heading", "body": "3-4 paragraphs with specifics: brand names, prices, state laws. \\n\\n between paragraphs."}
  ],
  "keyTakeaways": ["5 actionable bullet points"]
}

4-5 sections. 1200-1500 words total body text. Specific, practical, current.`
    }]
  })
  
  const text = msg.content[0].text
  return JSON.parse(text.trim())
}

const results = {}
for (const meta of SLUGS) {
  console.log(`⚡ ${meta.title}`)
  try {
    results[meta.slug] = await gen(meta)
    const secs = results[meta.slug].sections?.length || 0
    console.log(`  ✓ ${secs} sections`)
  } catch(e) {
    console.error(`  ✗ ${e.message}`)
  }
  await new Promise(r => setTimeout(r, 800))
}

writeFileSync('/home/claude/articles2.json', JSON.stringify(results, null, 2))
console.log(`\n✓ ${Object.keys(results).length} articles → /home/claude/articles2.json`)
