// Shared "Write with AI" handler for the admin editor (action: 'ai-write').
// Builds the article from the real source page when the item has a URL, falls back to the item's
// own text, and refuses to save anything shorter than a real article.
import { callAIText } from './aiClient.js'
import { fetchSourceFacts, wordCount } from './sourceFacts.js'

const BANNED = 'comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, synergy, moving forward, stakeholders, holistic'

export async function aiWriteDoc(doc, { topic } = {}) {
  const title = doc.title || topic || [doc.brand, doc.model].filter(Boolean).join(' ')
  if (!title) throw new Error('Item has no title or topic')
  const url = doc.externalUrl || doc.sourceUrl || ''
  const facts = (await fetchSourceFacts(url, { maxChars: 4000 })) ||
    [doc.body, doc.summary, doc.excerpt].filter(Boolean).join('\n').replace(/<[^>]+>/g, ' ').slice(0, 3000)

  const prompt = `You write for DownRange, a firearms and Second Amendment news portal. Voice: a gun owner who carries daily and reads case law. Direct, specific, active voice, short sentences.
BANNED WORDS: ${BANNED}.

Write an original article titled or about: "${title}"${topic && topic !== title ? `\nEditor's note: ${topic}` : ''}
Use only facts from the material below (names, numbers, dates, places). Do not copy sentences or the source structure. Do not invent quotes or facts that are not in the material.

MATERIAL:
${facts || '(none: write only what is certain from the title, and keep it short)'}

STRUCTURE (HTML only: h2, p, ul, li, strong, em): 4 <h2> sections: the hardest fact first, Key Details, Why It Matters for Gun Owners, DownRange Bottom Line. 500-700 words.

Return only JSON: {"body":"<html>","summary":"2-3 plain sentences under 300 chars"}`

  const raw = await callAIText({ prompt, useCase: 'article', maxTokens: 2800 })
  const m = raw.replace(/```json\s*/g, '').replace(/```\s*/g, '').match(/\{[\s\S]*\}/)
  if (!m) throw new Error('AI returned no JSON')
  const ai = JSON.parse(m[0])
  if (typeof ai.body !== 'string' || wordCount(ai.body) < 300) throw new Error(`AI draft too short (${wordCount(ai.body || '')} words); nothing saved`)
  return { body: ai.body.trim(), summary: (ai.summary || '').trim() }
}
