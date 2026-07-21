/**
 * agent/feeds/giveaways.js — RETIRED
 *
 * The AI-based approach (asking an LLM to invent giveaway URLs) produced
 * hallucinated links. This module is now a no-op stub.
 *
 * The real scraper lives at: app/api/cron/giveaways/route.js
 * It fetches wintheguns.com, gungiveaways.net, and manufacturer promo pages.
 * Cron: /api/cron/giveaways — runs 3×/day at 8am, 2pm, 8pm UTC.
 */
export async function runGiveawaysFeed() {
  console.log('[GIVEAWAYS-AGENT] This stub is no longer the active giveaways worker.')
  console.log('[GIVEAWAYS-AGENT] Real scraper: /api/cron/giveaways (runs 3×/day)')
  return { done: 0, skipped: 0, errors: [], ms: 0, headlines: [] }
}
