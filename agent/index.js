/**
 * DownRange Agent Orchestrator
 * Master cron scheduler for all data feeds
 * Run: npm run agent
 */
require('dotenv').config({ path: '.env.local' })
const cron = require('node-cron')
const { discordNotify } = require('./utils')
const { runNewsFeed }     = require('./feeds/news')
const { runLawsFeed }     = require('./feeds/laws')
const { runReleasesFeed } = require('./feeds/releases')
const { runMarketFeed }   = require('./feeds/market')
const { runVideoFeed }    = require('./feeds/video')
const { runStateFeed }    = require('./feeds/state')

let cycleCount = 0
const startTime = Date.now()

function uptime() {
  const sec = Math.floor((Date.now() - startTime) / 1000)
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60
  return `${h}h ${m}m ${s}s`
}

async function safeRun(name, fn) {
  try {
    console.log(`\n[${new Date().toISOString()}] Starting ${name}...`)
    const result = await fn()
    console.log(`[${new Date().toISOString()}] ✓ ${name} complete`)
    return result
  } catch (err) {
    console.error(`[${new Date().toISOString()}] ✗ ${name} failed:`, err.message)
    await discordNotify('error', `Feed failed: **${name}**\n\`\`\`${err.message}\`\`\``)
    return null
  }
}

// ── SCHEDULE ─────────────────────────────────────────────────────────
// News:     every 15 min
cron.schedule('*/15 * * * *', () => safeRun('News Feed',     runNewsFeed))

// Laws:     every 2 hours
cron.schedule('0 */2 * * *',  () => safeRun('Laws Feed',     runLawsFeed))

// Releases: every hour
cron.schedule('0 * * * *',    () => safeRun('Releases Feed', runReleasesFeed))

// Market:   every 30 min
cron.schedule('*/30 * * * *', () => safeRun('Market Feed',   runMarketFeed))

// Video:    every 4 hours
cron.schedule('0 */4 * * *',  () => safeRun('Video Feed',    runVideoFeed))

// States:   daily at 8am
cron.schedule('0 8 * * *',    () => safeRun('State Feed',    runStateFeed))

// Status update: every 60 minutes
cron.schedule('0 * * * *', async () => {
  cycleCount++
  await discordNotify('status', [
    `**DownRange Agent — Hourly Status**`,
    `Cycle: ${cycleCount} | Uptime: ${uptime()}`,
    `Feeds: News (15m) | Laws (2h) | Releases (1h) | Market (30m) | Video (4h) | States (daily 8am)`,
    `Status: 🟢 All systems operational`,
  ].join('\n'))
})

console.log('🎯 DownRange Agent started')
console.log('   News:     every 15 min')
console.log('   Laws:     every 2 hours')
console.log('   Releases: every hour')
console.log('   Market:   every 30 min')
console.log('   Video:    every 4 hours')
console.log('   States:   daily at 8am')
console.log('   Discord:  status every 60 min\n')

// Run all feeds once on startup
;(async () => {
  console.log('Running initial feed pass...')
  await discordNotify('status', '🚀 **DownRange Agent started** — Running initial feed pass...')
  await safeRun('News Feed',     runNewsFeed)
  await safeRun('Laws Feed',     runLawsFeed)
  await safeRun('Releases Feed', runReleasesFeed)
  await safeRun('Market Feed',   runMarketFeed)
  await safeRun('Video Feed',    runVideoFeed)
  await safeRun('State Feed',    runStateFeed)
  await discordNotify('status', '✅ **Initial feed pass complete.** Cron schedules now active.')
  console.log('\n✅ Initial pass complete. Cron active.')
})()
