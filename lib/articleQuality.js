// One place for the article-length rules so generation, the quality-rewrite cron and the
// admin Content Quality panel can never disagree again.
//
//  MIN_PUBLISH_WORDS  an article must reach this before it is published (generation retries once to get there)
//  MIN_ACCEPT_WORDS   floor for a rewrite to be saved
//  THIN_CHARS         live articles under this many characters of HTML are "thin" (about 230 words)
//  TARGET_WORDS       what the writer is told to produce
export const MIN_PUBLISH_WORDS = 450
export const MIN_ACCEPT_WORDS  = 450
export const THIN_CHARS        = 1500
export const TARGET_WORDS      = '650-850'

export const wordsOf = (html) => (html || '').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
