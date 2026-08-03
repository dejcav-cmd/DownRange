/**
 * Giveaways Feed — manual/on-demand path (/api/agent?feed=giveaways)
 *
 * This used to carry its own copy of the scrapers, pointed at 11 sources, all
 * fetched through r.jina.ai. Jina moved behind Cloudflare and started 403ing
 * every datacenter IP, so the whole list went silently dead — the same outage
 * that took down the scheduled cron.
 *
 * There is now exactly one implementation of "how do we read a giveaway
 * source": lib/giveawaySources.js. This file is just the manual trigger and the
 * Sanity write.
 */
import { scrapeAllSources, dedup, dedupSimilar, normalizeUrl, giveawayQualityIssue } from '../../lib/giveawaySources.js'

export async function runGiveawaysFeed() {
  console.log('[GIVEAWAYS] ===== Giveaways feed (manual) =====')
  const t = Date.now()
  let done = 0, skipped = 0, expired = 0
  const errors = [], saved = []

  const { createClient } = await import('@sanity/client')
  const sanity = createClient({
    projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
    dataset: 'production', apiVersion: '2024-01-01',
    token: process.env.SANITY_API_TOKEN, useCdn: false,
  })
  const today = new Date().toISOString().split('T')[0]

  let existingUrls = new Set()
  try {
    const existing = await sanity.fetch(
      '*[_type=="giveaway"]{_id,title,entryUrl,endDate,prizeValue,addedAt,active}'
    )
    existingUrls = new Set((existing || []).map(g => normalizeUrl(g.entryUrl)))

    // Same retirement sweep as the cron — ended, never-a-giveaway, or too old to
    // confirm. Shared gate so the two entry points cannot drift apart.
    const retire = []
    for (const g of existing || []) {
      if (!g.active) continue
      if (g.endDate && g.endDate < today) { retire.push([g, 'ended ' + g.endDate]); continue }
      const issue = giveawayQualityIssue(g)
      if (issue) retire.push([g, issue])
    }
    if (retire.length > 0) {
      await sanity.mutate(retire.map(([g, reason]) => ({
        patch: { id: g._id, set: { active: false, editorNote: `Auto-retired ${today}: ${reason}` } }
      })))
      expired = retire.length
    }
  } catch (e) { errors.push('existing/retire: ' + e.message.slice(0, 80)) }

  const results = await scrapeAllSources()
  const perSource = {}
  const allRaw = []
  for (const r of results) {
    perSource[r.name] = { count: r.giveaways.length, via: r.via, status: r.status }
    if (r.reason) errors.push(`${r.name}: ${r.reason}`)
    allRaw.push(...r.giveaways)
  }

  const giveaways = dedupSimilar(dedup(allRaw))
  console.log(`[GIVEAWAYS] ${allRaw.length} raw → ${giveaways.length} after dedup`)

  const mutations = []
  for (const g of giveaways) {
    if (g.endDate && g.endDate < today) { skipped++; continue }
    if (giveawayQualityIssue({ ...g, addedAt: new Date().toISOString() })) { skipped++; continue }
    const normUrl = normalizeUrl(g.entryUrl)
    if (existingUrls.has(normUrl)) { skipped++; continue }
    existingUrls.add(normUrl)

    const doc = {
      _id: 'giveaway-' + Buffer.from(normUrl).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 32),
      _type: 'giveaway',
      title: g.title.slice(0, 200),
      entryUrl: g.entryUrl,
      prize: (g.prize || g.title).slice(0, 200),
      prizeValue: g.prizeValue || 0,
      category: g.category || 'accessories',
      sponsor: g.sponsor || 'Various',
      sourceType: g.sourceType || 'aggregator',
      featured: g.featured || false,
      active: true,
      addedAt: new Date().toISOString(),
    }
    // Omit endDate entirely when unknown — never send null to Sanity.
    if (g.endDate) doc.endDate = g.endDate

    mutations.push({ createIfNotExists: doc })
    done++
    saved.push(g.title.slice(0, 60))
  }

  for (let i = 0; i < mutations.length; i += 50) {
    try { await sanity.mutate(mutations.slice(i, i + 50), { returnDocuments: false }) }
    catch (e) { errors.push('sanity: ' + e.message.slice(0, 80)) }
  }

  const ms = Date.now() - t
  console.log(`[GIVEAWAYS] ${done} new, ${skipped} skipped, ${expired} expired, ${errors.length} errors in ${ms}ms`)
  return { done, skipped, expired, errors, ms, saved, perSource, headlines: saved.slice(0, 20) }
}
