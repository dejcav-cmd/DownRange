/**
 * lib/aiModels.js — single source of truth for AI model IDs on DownRange.
 *
 * The admin page, the AI client, the router and every direct API call read from here,
 * so a model change happens in one place. Retired IDs that may still sit in Vercel env
 * vars (AI_CHAIN_*) are mapped to their current replacement automatically.
 */

export const CLAUDE_MODELS = [
  { id: 'claude-haiku-5-5',  label: 'Claude Haiku 5.5',  tier: 'fast',     cost: '$',    note: 'Cheapest. News rewrites, summaries, bulk work.' },
  { id: 'claude-sonnet-5-5', label: 'Claude Sonnet 5.5', tier: 'balanced', cost: '$$',   note: 'Strong writing. Blog, releases, intel, newsletter.' },
  { id: 'claude-opus-5-5',   label: 'Claude Opus 5.5',   tier: 'strong',   cost: '$$$',  note: 'Hardest reasoning. Manual use only.' },
  { id: 'claude-fable-5-1',  label: 'Claude Fable 5.1',  tier: 'flagship', cost: '$$$$', note: 'Top tier. Manual use only.' },
]

export const OPENAI_MODELS = [
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', tier: 'fast',     cost: '$'   },
  { id: 'gpt-4o',      label: 'GPT-4o',      tier: 'balanced', cost: '$$$' },
]

// GLM is switched off site-wide (aiClient.parseChain drops it). Kept only so old env values are recognised.
export const GLM_DISABLED = true

export const FAST_MODEL     = 'claude-haiku-5-5'
export const BALANCED_MODEL = 'claude-sonnet-5-5'
export const STRONG_MODEL   = 'claude-opus-5-5'

// Retired / mistyped IDs -> current model.
export const MODEL_ALIASES = {
  'claude-sonnet-4-5':          BALANCED_MODEL,
  'claude-sonnet-4-5-20251022': BALANCED_MODEL,
  'claude-sonnet-4-5-20250929': BALANCED_MODEL,
  'claude-sonnet-4-6':          BALANCED_MODEL,
  'claude-sonnet-4':            BALANCED_MODEL,
  'claude-3-5-sonnet-latest':   BALANCED_MODEL,
  'claude-opus-4-5':            STRONG_MODEL,
  'claude-opus-4-6':            STRONG_MODEL,
  'claude-opus-4':              STRONG_MODEL,
  'claude-haiku-4-5':           FAST_MODEL,
  'claude-3-5-haiku-latest':    FAST_MODEL,
}

export const KNOWN_IDS = new Set([
  ...CLAUDE_MODELS.map(m => m.id),
  ...OPENAI_MODELS.map(m => m.id),
])

/** Map a retired Anthropic ID to its replacement. Unknown IDs pass through unchanged. */
export function resolveModel(provider, model) {
  if (!model) return model
  if (provider === 'anthropic' || !provider) return MODEL_ALIASES[model] || model
  return model
}

/** 'ok' | 'retired' (auto-mapped) | 'unknown' */
export function modelState(provider, model) {
  if (!model) return 'ok'
  if (provider === 'anthropic' && MODEL_ALIASES[model]) return 'retired'
  if (provider === 'glm') return 'disabled'
  return KNOWN_IDS.has(model) ? 'ok' : 'unknown'
}

export const labelFor = (id) =>
  [...CLAUDE_MODELS, ...OPENAI_MODELS].find(m => m.id === id)?.label || id

/** Task catalog shared by the admin page and the status API. */
export const USE_CASES = [
  { key: 'default',       label: 'Default',        env: 'AI_CHAIN',                desc: 'Anything not listed below' },
  { key: 'news',          label: 'News feed',      env: 'AI_CHAIN_NEWS',           desc: 'Article rewrites, runs every 15 min' },
  { key: 'backfill',      label: 'Backfill',       env: 'AI_CHAIN_BACKFILL',       desc: 'Hourly article backfill' },
  { key: 'law',           label: 'Laws',           env: 'AI_CHAIN_LAW',            desc: 'Bill analysis every 2 h' },
  { key: 'law-assistant', label: 'Law assistant',  env: 'AI_CHAIN_LAW_ASSISTANT',  desc: 'Live Q&A on /laws' },
  { key: 'article',       label: 'Articles',       env: 'AI_CHAIN_ARTICLE',        desc: 'Blog posts and release write-ups' },
  { key: 'intel',         label: 'Intel',          env: 'AI_CHAIN_INTEL',          desc: 'Daily intelligence briefing' },
  { key: 'newsletter',    label: 'Newsletter',     env: 'AI_CHAIN_NEWSLETTER',     desc: 'Daily email to subscribers' },
  { key: 'outreach',      label: 'Outreach',       env: 'AI_CHAIN_OUTREACH',       desc: 'Email drafts' },
  { key: 'fast',          label: 'Fast / bulk',    env: 'AI_CHAIN_FAST',           desc: 'Bulk operations' },
  // No dedicated env var: these follow the built-in defaults (or AI_CHAIN) and are changed in lib/aiClient.js.
  { key: 'generation',    label: 'Generation',     env: null, desc: 'Newsletter drafts, admin one-offs' },
  { key: 'social',        label: 'Social posts',   env: null, desc: 'Short social posts' },
  { key: 'laws',          label: 'Law enrichment', env: null, desc: 'Bill enrichment' },
  { key: 'blog',          label: 'Blog',           env: null, desc: 'Blog post drafts' },
  { key: 'canada',        label: 'Canada',         env: null, desc: 'Canada content' },
  { key: 'brazil',        label: 'Brazil',         env: null, desc: 'Brazil content' },
]
