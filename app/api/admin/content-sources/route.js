export const dynamic = 'force-dynamic'
export const maxDuration = 60
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

// The hardcoded RSS sources from agent/feeds/news.js — these are the live sources
// When we add/pause/delete sources we store overrides in Sanity feedConfig documents
// The agent reads these overrides at runtime

const DEFAULT_SOURCES = {
  news: [
    { id: 'tfb', name: 'The Firearm Blog', url: 'https://www.thefirearmblog.com/blog/feed/', cat: 'industry', type: 'rss' },
    { id: 'ttag', name: 'TTAG', url: 'https://www.thetruthaboutguns.com/feed/', cat: 'news', type: 'rss' },
    { id: 'gunsdotcom', name: 'Guns.com News', url: 'https://www.guns.com/feed', cat: 'industry', type: 'rss' },
    { id: 'gunsandammo', name: 'Guns & Ammo', url: 'https://www.gunsandammo.com/feed/', cat: 'industry', type: 'rss' },
    { id: 'shootingwire', name: 'Shooting Wire', url: 'https://www.shootingwire.com/feed', cat: 'industry', type: 'rss' },
    { id: 'firearmsnews', name: 'Firearms News', url: 'https://www.firearmsnews.com/feed/', cat: 'industry', type: 'rss' },
    { id: 'cn', name: 'Concealed Nation', url: 'https://concealednation.org/feed/', cat: 'news', type: 'rss' },
    { id: 'outdoorlife', name: 'Outdoor Life Guns', url: 'https://www.outdoorlife.com/category/guns/feed/', cat: 'industry', type: 'rss' },
    { id: 'fieldstream', name: 'Field & Stream Guns', url: 'https://www.fieldandstream.com/category/guns/feed/', cat: 'industry', type: 'rss' },
    { id: 'tacticallife', name: 'Tactical Life', url: 'https://www.tactical-life.com/feed/', cat: 'industry', type: 'rss' },
    { id: 'pdw', name: 'Personal Defense World', url: 'https://www.personaldefenseworld.com/feed/', cat: 'news', type: 'rss' },
    { id: 'combathandguns', name: 'Combat Handguns', url: 'https://www.combathandguns.com/feed/', cat: 'industry', type: 'rss' },
    { id: 'handgunsmag', name: 'Handguns Magazine', url: 'https://www.handgunsmag.com/feed/', cat: 'industry', type: 'rss' },
    { id: 'gundigest', name: 'Gun Digest', url: 'https://gundigest.com/feed/', cat: 'industry', type: 'rss' },
    { id: 'ammoland', name: 'AmmoLand', url: 'https://www.ammoland.com/feed/', cat: 'news', type: 'rss' },
    { id: 'bearingarms', name: 'Bearing Arms', url: 'https://bearingarms.com/feed/', cat: 'news', type: 'rss' },
  ],
  laws: [
    { id: 'atf-rss', name: 'ATF News', url: 'https://www.atf.gov/news/rss.xml', cat: 'law', type: 'rss' },
    { id: 'congress-api', name: 'Congress.gov Bills', url: 'https://api.congress.gov/v3/bill', cat: 'law', type: 'api' },
    { id: 'legiscan', name: 'LegiScan State Bills', url: 'https://api.legiscan.com', cat: 'law', type: 'api' },
    { id: 'scotusblog', name: 'SCOTUSblog', url: 'https://www.scotusblog.com/feed/', cat: 'law', type: 'rss' },
    { id: 'goa', name: 'Gun Owners of America', url: 'https://gunowners.org/feed/', cat: 'law', type: 'rss' },
    { id: 'nra-ila', name: 'NRA-ILA', url: 'https://www.nraila.org/XML/RSS.aspx', cat: 'law', type: 'rss' },
  ],
  releases: [
    { id: 'glock', name: 'GLOCK Inc', url: 'https://us.glock.com/rss/news.xml', cat: 'releases', type: 'rss' },
    { id: 'sig', name: 'SIG Sauer', url: 'https://www.sigsauer.com/news/feed', cat: 'releases', type: 'rss' },
    { id: 'ruger', name: 'Ruger', url: 'https://www.ruger.com/news/feed', cat: 'releases', type: 'rss' },
    { id: 'springfield', name: 'Springfield Armory', url: 'https://www.springfield-armory.com/feed/', cat: 'releases', type: 'rss' },
    { id: 'sw', name: 'Smith & Wesson', url: 'https://www.smith-wesson.com/news/feed', cat: 'releases', type: 'rss' },
    { id: 'prn-releases', name: 'PRNewswire (Firearms)', url: 'https://www.prnewswire.com/rss/news-releases-list.rss', cat: 'releases', type: 'rss' },
    { id: 'daniel-defense', name: 'Daniel Defense', url: 'https://danieldefense.com/blogs/news.atom', cat: 'releases', type: 'rss' },
  ],
  market: [
    { id: 'gundeals-rss', name: 'gun.deals RSS', url: 'https://gun.deals/feed/syndication', cat: 'market', type: 'rss' },
    { id: 'reddit-gundeals', name: 'r/gundeals JSON', url: 'https://www.reddit.com/r/gundeals/new.json', cat: 'market', type: 'api' },
    { id: 'ammoseek', name: 'AmmoSeek API', url: 'https://ammoseek.com/api/', cat: 'market', type: 'api' },
    { id: 'nics', name: 'FBI NICS CSV (GitHub)', url: 'https://raw.githubusercontent.com/BuzzFeedNews/nics-firearm-background-checks/master/data/nics-firearm-background-checks.csv', cat: 'market', type: 'api' },
  ],
  video: [
    { id: 'hickok45', name: 'Hickok45 (Greg Kinman)', url: 'UCMFABkq5UjA2fkmYX95VvBQ', cat: 'video', type: 'youtube' },
    { id: 'garandthumb', name: 'Garand Thumb (Mike Jones)', url: 'UCJQfl8QxjNen736AVO3ecFg', cat: 'video', type: 'youtube' },
    { id: 'tfbtv', name: 'TFB TV', url: 'UCy2QWRT2v6CnBUFKzq2KwXA', cat: 'video', type: 'youtube' },
    { id: 'asp', name: 'Active Self Protection (John Correia)', url: 'UCe-Z-UkpkXrJ-cHI0NR9Gfg', cat: 'video', type: 'youtube' },
    { id: 'forgottenweapons', name: 'Forgotten Weapons (Ian McCollum)', url: 'UCh-GhnQ7qDQmS6Bz3pGc1Mw', cat: 'video', type: 'youtube' },
    { id: 'warriorpoet', name: 'Warrior Poet Society (John Lovell)', url: 'UCe0jZ0JKLBemV_FBr7RTdHQ', cat: 'video', type: 'youtube' },
    { id: 'kentuckyballistics', name: 'Kentucky Ballistics (Scott Duran)', url: 'UCPV7RL1L-usPo1uGAKsZGmQ', cat: 'video', type: 'youtube' },
    { id: 'colionnoir', name: 'Colion Noir', url: 'UCHCIHkYuA6oJoTIqTUqX_BA', cat: 'video', type: 'youtube' },
    { id: 'iv8888', name: 'IraqVeteran8888 (Eric Blandford)', url: 'UCUN01uCIW0DN3l5Uj5gHBxw', cat: 'video', type: 'youtube' },
  ],
}

// GET: list all sources with their status (active/paused/deleted + overrides from Sanity)
export async function GET(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  // Load overrides from Sanity
  const overrides = await sanity.fetch(
    `*[_type == "feedConfig"] { _id, sourceId, feedType, status, customUrl, customName, addedAt, pausedAt, deletedAt, deleteContent }`
  ).catch(() => [])

  const overrideMap = {}
  for (const o of overrides) {
    overrideMap[o.sourceId] = o
  }

  const result = {}
  for (const [feedType, sources] of Object.entries(DEFAULT_SOURCES)) {
    result[feedType] = sources.map(src => {
      const override = overrideMap[src.id]
      return {
        ...src,
        status: override?.status || 'active',
        _overrideId: override?._id || null,
        pausedAt: override?.pausedAt || null,
        deletedAt: override?.deletedAt || null,
      }
    })

    // Add any custom-added sources
    const customs = overrides.filter(o => o.feedType === feedType && o.status !== 'deleted' && !result[feedType].find(s => s.id === o.sourceId))
    for (const c of customs) {
      result[feedType].push({
        id: c.sourceId,
        name: c.customName || c.sourceId,
        url: c.customUrl || '',
        cat: feedType,
        type: 'rss',
        status: c.status || 'active',
        _overrideId: c._id,
        _custom: true,
      })
    }
  }

  const counts = {}
  for (const [feedType, sources] of Object.entries(result)) {
    counts[feedType] = {
      total: sources.length,
      active: sources.filter(s => s.status === 'active').length,
      paused: sources.filter(s => s.status === 'paused').length,
    }
  }

  return Response.json({ ok: true, sources: result, counts })
}

// POST: add/pause/resume/delete a source
export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { action, sourceId, feedType, name, url, type } = body

  if (!action || !sourceId) {
    return Response.json({ error: 'action and sourceId required' }, { status: 400 })
  }

  const docId = 'feedConfig-' + sourceId.replace(/[^a-zA-Z0-9]/g, '-')
  const now = new Date().toISOString()

  if (action === 'add') {
    if (!name || !url || !feedType) {
      return Response.json({ error: 'name, url, feedType required for add' }, { status: 400 })
    }
    await sanity.createOrReplace({
      _id: docId,
      _type: 'feedConfig',
      sourceId,
      feedType,
      status: 'active',
      customName: name,
      customUrl: url,
      customType: type || 'rss',
      addedAt: now,
    })
    return Response.json({ ok: true, action: 'added', sourceId })
  }

  if (action === 'pause') {
    await sanity.createOrReplace({
      _id: docId,
      _type: 'feedConfig',
      sourceId,
      feedType: feedType || 'news',
      status: 'paused',
      pausedAt: now,
    })
    return Response.json({ ok: true, action: 'paused', sourceId })
  }

  if (action === 'resume') {
    const existing = await sanity.fetch(`*[_type=="feedConfig"&&sourceId==$sid][0]._id`, { sid: sourceId }).catch(() => null)
    if (existing) {
      await sanity.patch(existing).set({ status: 'active', pausedAt: null }).commit()
    }
    return Response.json({ ok: true, action: 'resumed', sourceId })
  }

  if (action === 'delete') {
    const deleteContent = body.deleteContent === true

    // Mark as deleted in Sanity
    await sanity.createOrReplace({
      _id: docId,
      _type: 'feedConfig',
      sourceId,
      feedType: feedType || 'news',
      status: 'deleted',
      deletedAt: now,
      deleteContent,
    })

    if (deleteContent) {
      // Purge all content from this source
      let purged = 0
      try {
        if (feedType === 'news') {
          // Find news articles from this source
          const articles = await sanity.fetch(
            `*[_type=="newsArticle" && source == $src] { _id }`,
            { src: name || sourceId }
          ).catch(() => [])
          for (const a of articles) {
            await sanity.delete(a._id).catch(() => {})
            purged++
            if (purged % 10 === 0) await new Promise(r => setTimeout(r, 200))
          }
        }
      } catch (e) {
        return Response.json({ ok: true, action: 'deleted', sourceId, purged, warning: e.message })
      }
      return Response.json({ ok: true, action: 'deleted_with_purge', sourceId, purged })
    }

    return Response.json({ ok: true, action: 'deleted', sourceId })
  }

  if (action === 'test') {
    // Test if the feed URL is reachable
    const testUrl = url || DEFAULT_SOURCES[feedType]?.find(s => s.id === sourceId)?.url
    if (!testUrl) return Response.json({ ok: false, error: 'No URL to test' })

    try {
      const res = await fetch(testUrl, {
        headers: { 'User-Agent': 'DownRange/1.0 Feed Tester' },
        signal: AbortSignal.timeout(8000),
      })
      return Response.json({
        ok: res.ok,
        status: res.status,
        contentType: res.headers.get('content-type'),
        sourceId,
      })
    } catch (e) {
      return Response.json({ ok: false, error: e.message, sourceId })
    }
  }

  return Response.json({ error: 'Unknown action: ' + action }, { status: 400 })
}
