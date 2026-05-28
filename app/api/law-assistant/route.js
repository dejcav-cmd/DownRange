export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'
import { callAIText }   from '@/lib/aiClient.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
  useCdn: true,
})

export async function POST(req) {
  try {
    const { question } = await req.json()
    if (!question) return Response.json({ error: 'No question' }, { status: 400 })

    if (!process.env.ANTHROPIC_API_KEY && !process.env.GLM_API_KEY) {
      return Response.json({
        answer: "The AI law assistant requires an API key. Please add ANTHROPIC_API_KEY or GLM_API_KEY to your Vercel environment variables."
      })
    }

    // Fetch all state profiles for context
    const states = await sanity.fetch(`
      *[_type=="stateProfile"] {
        name, abbr, constitutionalCarry, ccwPermit, redFlagLaw,
        magLimit, waitPeriod, awbStatus, suppressors, openCarry,
        bgcPrivate, reciprocityStates[], rating
      }
    `).catch(() => [])

    const stateContext = states.length > 0
      ? `Current state law database (${states.length} states):\n${states.map(s =>
          `${s.name} (${s.abbr}): Constitutional carry: ${s.constitutionalCarry}, CCW: ${s.ccwPermit}, Red flag: ${s.redFlagLaw}, Mag limit: ${s.magLimit||'none'}, AWB: ${s.awbStatus||'no'}, Suppressors: ${s.suppressors||'check state'}, Open carry: ${s.openCarry||'check'}, Private sale BGC: ${s.bgcPrivate||'no'}, Reciprocity with: ${(s.reciprocityStates||[]).join(', ')||'check state'}`
        ).join('\n')}`
      : 'State database currently loading.'

    const prompt = `You are the DownRange Law Assistant — a firearms law expert for the United States. You answer questions about federal and state gun laws clearly, accurately, and directly.

${stateContext}

Rules:
- Answer factually based on the state data above when available
- Always remind users this is general information, not legal advice
- Be direct and specific — name the state, name the law
- If reciprocity is asked about, check the reciprocityStates array
- For constitutional carry states, say so explicitly
- Keep answers under 200 words
- Use plain language, not legalese

User question: ${question}

Provide a clear, helpful answer. End with: "⚠ Always verify current laws before carrying — laws change frequently."`

    const answer = await callAIText({ prompt, useCase: 'law-assistant', maxTokens: 400 })
    return Response.json({ answer: answer || 'Unable to answer right now.' })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
