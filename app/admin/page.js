'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const TABS = [
  { key:'dashboard',  label:'Dashboard',       icon:'◈' },
  { key:'mission',    label:'Mission Control', icon:'🛰' },
  { key:'feeds',      label:'AI Agent',        icon:'⚡' },
  { key:'content',    label:'Content',         icon:'📰' },
  { key:'alerts',     label:'Breaking Alerts', icon:'🔴' },
  { key:'channels',   label:'Video',           icon:'▶' },
  { key:'rss',        label:'RSS Sources',     icon:'📡' },
  { key:'deals',      label:'Deals Config',    icon:'🔥' },
  { key:'ranges',     label:'Range Database',  icon:'◎' },
  { key:'newsletter', label:'Newsletter',      icon:'📧' },
  { key:'seo',        label:'SEO & Meta',      icon:'🔍' },
  { key:'identity',   label:'Site Identity',   icon:'🎨' },
  { key:'openclaw',   label:'OpenClaw Agent',  icon:'🤖' },
  { key:'keys',       label:'API Keys',        icon:'🔑' },
  { key:'blog',       label:'Blog Manager',    icon:'📝' },
  { key:'schedule',   label:'Pub. Schedule',   icon:'📅' },
  { key:'pulllog',    label:'Pull Log',        icon:'📡' },
  { key:'settings',  label:'Settings',        icon:'⚙' },
]

const FEEDS = [
  { key:'news',    label:'News Feed',     schedule:'Every 15 min', icon:'📰', status:'active' },
  { key:'laws',    label:'Laws Feed',     schedule:'Every 2 hrs',  icon:'⚖', status:'active' },
  { key:'releases',label:'Releases Feed', schedule:'Every 1 hr',   icon:'🔫', status:'active' },
  { key:'market',  label:'Market Feed',   schedule:'Every 30 min', icon:'📊', status:'active' },
  { key:'video',   label:'Video Feed',    schedule:'Every 4 hrs',  icon:'▶', status:'active' },
  { key:'state',   label:'State Feed',    schedule:'Daily 8am',    icon:'🗺', status:'active' },
]

const RSS_FEEDS = [
  { name:'The Firearm Blog',  url:'https://www.thefirearmblog.com/blog/feed/', cat:'industry', active:true },
  { name:'TTAG',              url:'https://www.thetruthaboutguns.com/feed/',   cat:'news',     active:true },
  { name:'NRA-ILA',           url:'https://www.nraila.org/rss/',               cat:'law',      active:true },
  { name:'SAF',               url:'https://www.saf.org/feed/',                  cat:'law',      active:true },
  { name:'GOA',               url:'https://gunowners.org/feed/',                cat:'law',      active:true },
  { name:'Concealed Nation',  url:'https://concealednation.org/feed/',          cat:'news',     active:true },
  { name:'Duke Firearms Law', url:'https://firearmslaw.duke.edu/feed/',         cat:'law',      active:true },
  { name:'ATF News',          url:'https://www.atf.gov/rss/news_whats-new.xml', cat:'law',      active:true },
  { name:'AmmoLand',          url:'https://www.ammoland.com/feed/',             cat:'deals',    active:true },
  { name:'Firearms News',     url:'https://www.firearmsnews.com/feed/',         cat:'industry', active:true },
]

const API_KEYS_CONFIG = [
  { group:'Required (Core)', keys:[
    { key:'ANTHROPIC_API_KEY',    label:'Claude AI (Full rewrites)', hint:'console.anthropic.com',     required:true,  url:'https://console.anthropic.com' },
    { key:'SANITY_API_TOKEN',     label:'Sanity CMS Token',          hint:'sanity.io/manage',           required:true,  url:'https://www.sanity.io/manage' },
    { key:'RESEND_API_KEY',       label:'Resend Email API',          hint:'resend.com/api-keys',        required:true,  url:'https://resend.com/api-keys' },
    { key:'CRON_SECRET',          label:'Cron Job Secret',           hint:'Random secure string',       required:true,  url:null },
  ]},
  { group:'Tier 2 — Free APIs (High Priority)', keys:[
    { key:'YOUTUBE_API_KEY',      label:'YouTube Data API v3',       hint:'console.cloud.google.com → YouTube Data API v3', required:false, url:'https://console.cloud.google.com' },
    { key:'CONGRESS_GOV_KEY',     label:'Congress.gov Legislation',  hint:'api.congress.gov/sign-up',  required:false, url:'https://api.congress.gov/sign-up/' },
    { key:'LEGISCAN_KEY',         label:'LegiScan 50-State Bills',   hint:'legiscan.com/legiscan',     required:false, url:'https://legiscan.com/legiscan' },
    { key:'NEWSAPI_KEY',          label:'NewsAPI.org',               hint:'newsapi.org/register',      required:false, url:'https://newsapi.org/register' },
    { key:'GNEWS_KEY',            label:'GNews API',                 hint:'gnews.io/#register',        required:false, url:'https://gnews.io/#register' },
    { key:'GOOGLE_PLACES_API_KEY',label:'Google Places (Ranges)',    hint:'console.cloud.google.com',  required:false, url:'https://console.cloud.google.com' },
  ]},
  { group:'Tier 3 — Paid/Subscription APIs', keys:[
    { key:'GUNBROKER_API_KEY',    label:'GunBroker REST API',        hint:'gunbroker.com — request developer key', required:false, url:'https://support.gunbroker.com/hc/en-us/articles/221711267' },
    { key:'GUN_DEALS_API_KEY',    label:'gun.deals Dealer API',      hint:'gun.deals/content/dealers-api-access',  required:false, url:'https://gun.deals/content/dealers-api-access' },
    { key:'ALGOLIA_ADMIN_KEY',    label:'Algolia Search',            hint:'algolia.com',               required:false, url:'https://www.algolia.com' },
  ]},
  { group:'Notifications', keys:[
    { key:'DISCORD_WEBHOOK_URL',       label:'Discord #agent-status', hint:'Discord server settings', required:false, url:null },
    { key:'DISCORD_ERRORS_WEBHOOK',    label:'Discord #errors',       hint:'Discord server settings', required:false, url:null },
    { key:'DISCORD_BREAKING_WEBHOOK',  label:'Discord #breaking',     hint:'Discord server settings', required:false, url:null },
  ]},
]

const QUICK_LINKS = [
  { label:'Sanity Studio',   url:'/studio',                   icon:'📝', desc:'Edit content directly' },
  { label:'Laws Page',       url:'/laws',                     icon:'⚖', desc:'Federal & state bills' },
  { label:'Market Watch',    url:'/market',                   icon:'📊', desc:'Ammo price index' },
  { label:'State Hub',       url:'/state-hub',                icon:'🗺', desc:'50-state map' },
  { label:'Ranges',          url:'/ranges',                   icon:'◎', desc:'Range finder' },
  { label:'Deals',           url:'/deals',                    icon:'🔥', desc:'Live deal feed' },
  { label:'Reviews',         url:'/reviews',                  icon:'★', desc:'Gear reviews' },
]

const SITE_STATS = [
  { num:'50', label:'States', sub:'Full legal database' },
  { num:'15', label:'News Sources', sub:'RSS + API feeds' },
  { num:'86', label:'Ranges', sub:'National database' },
  { num:'15m', label:'Refresh', sub:'News update cycle' },
]


// ── BLOG DATA ─────────────────────────────────────────────────────────────────
const BLOG_CATS = ['Getting Started','CCW & Carry','Safety','Home Defense','Safe Storage','Ammunition','Maintenance','Legal','Training']

const ALL_ARTICLES = [
  { slug:'buying-your-first-gun',       title:'Buying Your First Gun: The Complete Guide',        cat:'Getting Started', date:'May 15, 2026', status:'live',    readTime:'12 min', image:'🔫', featured:true },
  { slug:'how-to-get-ccw-license',      title:'How to Get Your CCW License (State-by-State)',      cat:'CCW & Carry',    date:'May 18, 2026', status:'live',    readTime:'15 min', image:'🪪', featured:true },
  { slug:'firearms-safety-four-rules',  title:'The Four Rules of Firearms Safety',                 cat:'Safety',         date:'May 20, 2026', status:'live',    readTime:'8 min',  image:'🛡', featured:true },
  { slug:'home-defense-basics',         title:'Home Defense Basics: What You Actually Need',       cat:'Home Defense',   date:'Jun 2, 2026',  status:'ready',   readTime:'11 min', image:'🏠' },
  { slug:'safe-storage-guide-beginners',title:'Safe Storage 101: Secure and Accessible',           cat:'Safe Storage',   date:'Jun 5, 2026',  status:'ready',   readTime:'9 min',  image:'🔒' },
  { slug:'ammo-guide-beginners',        title:'Ammunition Explained: What to Buy and Why',         cat:'Ammunition',     date:'Jun 9, 2026',  status:'ready',   readTime:'10 min', image:'🔶' },
  { slug:'shooting-range-first-visit',  title:'Your First Time at a Shooting Range',               cat:'Getting Started',date:'Jun 12, 2026', status:'ready',   readTime:'7 min',  image:'◎' },
  { slug:'cleaning-maintaining-your-gun',title:'How to Clean and Maintain Your Firearm',           cat:'Maintenance',    date:'Jun 16, 2026', status:'ready',   readTime:'10 min', image:'🔧' },
  { slug:'understanding-gun-laws',      title:'Understanding Gun Laws: Beginner Overview',          cat:'Legal',          date:'Jun 19, 2026', status:'ready',   readTime:'13 min', image:'⚖' },
  { slug:'choosing-holster-beginners',  title:'How to Choose a Holster for Concealed Carry',       cat:'CCW & Carry',    date:'Jun 23, 2026', status:'ready',   readTime:'11 min', image:'🔫' },
  { slug:'dry-fire-training-beginners', title:'Dry Fire Training: Get Better Without Ammo',        cat:'Training',       date:'Jun 26, 2026', status:'ready',   readTime:'9 min',  image:'🎯' },
  { slug:'what-is-nfa',                 title:'What Is the NFA? Suppressors, SBRs Explained',      cat:'Legal',          date:'Jun 30, 2026', status:'ready',   readTime:'12 min', image:'📋' },
]

const STATUS_META = {
  live:    { label:'LIVE',      cls:'dr-badge-green', desc:'Published and live on site' },
  ready:   { label:'READY',     cls:'dr-badge-gold',  desc:'Written, scheduled, awaiting publish' },
  draft:   { label:'DRAFT',     cls:'dr-badge-dim',   desc:'Work in progress' },
  planned: { label:'PLANNED',   cls:'dr-badge-dim',   desc:'On calendar, not yet written' },
}

// ── BLOG MANAGER COMPONENT ────────────────────────────────────────────────────
// ── MISSION CONTROL ────────────────────────────────────────────────────────────
function MissionControl({ secret, setMsg }) {
  const [activeSection, setActiveSection] = useState('overview')
  const [editingSource, setEditingSource] = useState(null)

  // ── ALL DATA SOURCES CATALOG ──────────────────────────────────────────────
  const MANUFACTURER_SOURCES = [
    // Press release pages — scraped via agent/feeds/releases.js
    { id:'glock',        name:'GLOCK Inc.',           type:'HTML_SCRAPE',  url:'https://us.glock.com/en/press-release/news-page', cat:'releases', status:'active',   schedule:'Every 4h', notes:'No RSS. Scrape press release page. Each PR has date + title + slug. Gen6 launches, mag releases, LE contracts.', keyRequired:false },
    { id:'sig',          name:'SIG Sauer',             type:'HTML_SCRAPE',  url:'https://www.sigsauer.com/news/',                  cat:'releases', status:'active',   schedule:'Every 4h', notes:'No public RSS. Scrape /news/ page. Covers P365, MCX, ROMEO optics, ammo launches.', keyRequired:false },
    { id:'ruger',        name:'Sturm, Ruger & Co.',    type:'HTML_SCRAPE',  url:'https://ruger.com/news/',                         cat:'releases', status:'active',   schedule:'Every 4h', notes:'News at ruger.com/news/YYYY-MM-DD.html format. RXM, Marlin lever guns, American Gen II. Also SEC (RGR) filings for financial.', keyRequired:false },
    { id:'sw',           name:'Smith & Wesson',        type:'HTML_SCRAPE',  url:'https://www.smith-wesson.com/news',               cat:'releases', status:'pending',  schedule:'Every 6h', notes:'S&W press releases. M&P Shield Plus EZ, Model 940-3. IR feed at ir.smith-wesson.com for SEC filings.', keyRequired:false },
    { id:'springfield',  name:'Springfield Armory',    type:'HTML_SCRAPE',  url:'https://www.springfield-armory.com/news/',        cat:'releases', status:'active',   schedule:'Every 6h', notes:'Hellcat, Echelon, 1911 DS Prodigy. Product announcement page. No RSS detected.', keyRequired:false },
    { id:'beretta',      name:'Beretta USA',            type:'HTML_SCRAPE',  url:'https://www.berettausa.com/en-us/news/',          cat:'releases', status:'pending',  schedule:'Every 6h', notes:'APX A1, CX4 Storm. Beretta Holding now 9.95% of Ruger — watch for acquisition news.', keyRequired:false },
    { id:'cz',           name:'CZ-USA',                type:'HTML_SCRAPE',  url:'https://cz-usa.com/news/',                       cat:'releases', status:'active',   schedule:'Every 6h', notes:'P-10 F Competition, Scorpion EVO, 457 rifles.', keyRequired:false },
    { id:'walther',      name:'Walther Arms',           type:'HTML_SCRAPE',  url:'https://waltherarms.com/press-releases/',         cat:'releases', status:'active',   schedule:'Every 6h', notes:'PDP series, PPS M2, CCP M2+. Press release archive.', keyRequired:false },
    { id:'hhk',          name:'Heckler & Koch',        type:'HTML_SCRAPE',  url:'https://www.heckler-koch.com/en/newsroom/',       cat:'releases', status:'pending',  schedule:'Every 12h', notes:'VP9, P30, SP5. International newsroom.', keyRequired:false },
    { id:'ddarms',       name:'Daniel Defense',        type:'HTML_SCRAPE',  url:'https://danieldefense.com/blogs/news',            cat:'releases', status:'active',   schedule:'Every 6h', notes:'Shopify-based blog RSS available at /blogs/news.atom — USE THIS.', keyRequired:false, rssUrl:'https://danieldefense.com/blogs/news.atom' },
    { id:'bcm',          name:'Bravo Company MFG',     type:'HTML_SCRAPE',  url:'https://www.bravocompanymfg.com/news/',           cat:'releases', status:'pending',  schedule:'Every 12h', notes:'BCM Recon, MCMR rails, AR components.', keyRequired:false },
    { id:'mossberg',     name:'Mossberg',              type:'HTML_SCRAPE',  url:'https://www.mossberg.com/news/',                  cat:'releases', status:'active',   schedule:'Every 6h', notes:'590A1, Maverick 88, Patriot rifles.', keyRequired:false },
    { id:'winchester',   name:'Winchester Firearms',   type:'HTML_SCRAPE',  url:'https://www.winchesterguns.com/news/',            cat:'releases', status:'pending',  schedule:'Every 12h', notes:'Model 70, XPR, SXP. Olin Corp subsidiary.', keyRequired:false },
    { id:'browning',     name:'Browning',              type:'HTML_SCRAPE',  url:'https://www.browning.com/news/',                  cat:'releases', status:'pending',  schedule:'Every 12h', notes:'Citori, X-Bolt, Hi-Power. FN Holding subsidiary.', keyRequired:false },
    { id:'silencerco',   name:'SilencerCo',            type:'HTML_SCRAPE',  url:'https://silencerco.com/news/',                   cat:'releases', status:'active',   schedule:'Every 6h', notes:'Omega 9K, Omega 36M, Hybrid 46M. Critical post-NFA-reform coverage.', keyRequired:false },
    { id:'deadair',      name:'Dead Air Silencers',    type:'HTML_SCRAPE',  url:'https://deadairsilencers.com/news/',              cat:'releases', status:'pending',  schedule:'Every 12h', notes:'Sandman-S, Ghost-M, Primal. Key suppressor competitor to SilencerCo.', keyRequired:false },
  ]

  const NEWS_SOURCES = [
    { id:'tfb',       name:'The Firearm Blog',       type:'RSS',   url:'https://www.thefirearmblog.com/blog/feed/', cat:'industry', status:'active',  schedule:'Every 15m', keyRequired:false },
    { id:'ttag',      name:'TTAG',                   type:'RSS',   url:'https://www.thetruthaboutguns.com/feed/',  cat:'news',     status:'active',  schedule:'Every 15m', keyRequired:false },
    { id:'gunscom',   name:'Guns.com',               type:'RSS',   url:'https://www.guns.com/feed',               cat:'industry', status:'active',  schedule:'Every 15m', keyRequired:false },
    { id:'ganma',     name:'Guns & Ammo',            type:'RSS',   url:'https://www.gunsandammo.com/feed/',       cat:'industry', status:'active',  schedule:'Every 15m', keyRequired:false },
    { id:'ammoland', name:'AmmoLand',                type:'RSS',   url:'https://www.ammoland.com/feed/',          cat:'deals',    status:'active',  schedule:'Every 15m', notes:'LOCKED to deals — never routes to news', keyRequired:false },
    { id:'concnation',name:'Concealed Nation',       type:'RSS',   url:'https://concealednation.org/feed/',       cat:'news',     status:'active',  schedule:'Every 15m', keyRequired:false },
    { id:'recoil',    name:'RECOIL Magazine',        type:'RSS',   url:'https://recoilweb.com/news/feed/',        cat:'industry', status:'pending', schedule:'Every 1h',  keyRequired:false },
    { id:'shootwire', name:'Shooting Wire',          type:'RSS',   url:'https://www.shootingwire.com/feed',       cat:'industry', status:'active',  schedule:'Every 1h',  keyRequired:false },
    { id:'firearmsn', name:'Firearms News',          type:'RSS',   url:'https://www.firearmsnews.com/feed/',      cat:'industry', status:'active',  schedule:'Every 1h',  keyRequired:false },
    { id:'luckygn',   name:'Lucky Gunner Lounge',    type:'RSS',   url:'https://www.luckygunner.com/lounge/feed/',cat:'training', status:'pending', schedule:'Every 4h',  keyRequired:false },
    { id:'shotshow',  name:'SHOT Show / NSSF Blog',  type:'RSS',   url:'https://shotshow.org/feed/',              cat:'releases', status:'pending', schedule:'Every 4h',  notes:'NSSF official — new product announcements at SHOT Show', keyRequired:false },
    { id:'newsapi',   name:'NewsAPI.org',            type:'API',   url:'https://newsapi.org/v2/everything',       cat:'news',     status:'active',  schedule:'Every 15m', keyRequired:true,  keyName:'NEWSAPI_KEY', keyUrl:'https://newsapi.org/register' },
    { id:'gnews',     name:'GNews API',              type:'API',   url:'https://gnews.io/api/v4/search',          cat:'news',     status:'active',  schedule:'Every 15m', keyRequired:true,  keyName:'GNEWS_KEY',   keyUrl:'https://gnews.io/#register' },
  ]

  const LAW_SOURCES = [
    { id:'nraila',   name:'NRA-ILA',              type:'RSS',  url:'https://www.nraila.org/rss/',                            cat:'law', status:'active', schedule:'Every 1h', keyRequired:false },
    { id:'saf',      name:'Second Amendment Foundation', type:'RSS', url:'https://www.saf.org/feed/',                       cat:'law', status:'active', schedule:'Every 1h', keyRequired:false },
    { id:'goa',      name:'Gun Owners of America',type:'RSS',  url:'https://gunowners.org/feed/',                            cat:'law', status:'active', schedule:'Every 1h', keyRequired:false },
    { id:'cleanatf', name:'CleanUpATF',           type:'RSS',  url:'https://www.cleanupatf.org/feed/',                       cat:'law', status:'active', schedule:'Every 2h', keyRequired:false },
    { id:'dukefirms',name:'Duke Firearms Law',    type:'RSS',  url:'https://firearmslaw.duke.edu/feed/',                     cat:'law', status:'active', schedule:'Every 2h', notes:'Duke Center for Firearms Law — academic case tracking' },
    { id:'atf',      name:'ATF Official News',    type:'RSS',  url:'https://www.atf.gov/rss/news_whats-new.xml',             cat:'law', status:'active', schedule:'Every 2h', keyRequired:false },
    { id:'scotusblog',name:'SCOTUSblog',          type:'RSS',  url:'https://www.scotusblog.com/feed/',                       cat:'law', status:'pending',schedule:'Every 4h', notes:'Supreme Court case tracking — filter for 2A keywords' },
    { id:'congress', name:'Congress.gov Bills',   type:'API',  url:'https://api.congress.gov/v3/bill',                       cat:'law', status:'active', schedule:'Every 2h', keyRequired:true,  keyName:'CONGRESS_GOV_KEY', keyUrl:'https://api.congress.gov/sign-up/' },
    { id:'legiscan', name:'LegiScan State Bills', type:'API',  url:'https://api.legiscan.com/',                              cat:'law', status:'active', schedule:'Daily 8am',keyRequired:true,  keyName:'LEGISCAN_KEY',      keyUrl:'https://legiscan.com/legiscan' },
    { id:'fpc',      name:'FPC Action Foundation', type:'RSS', url:'https://www.firearmspolicy.org/feed/',                   cat:'law', status:'pending',schedule:'Every 4h', notes:'Firearms Policy Coalition litigation updates' },
    { id:'crpa',     name:'CRPA (California)',    type:'RSS',  url:'https://crpa.org/feed/',                                 cat:'law', status:'pending',schedule:'Every 4h', notes:'California Rifle & Pistol Association — CA-specific 2A litigation' },
  ]

  const MARKET_SOURCES = [
    { id:'reddit_gd', name:'r/gundeals',          type:'JSON', url:'https://www.reddit.com/r/gundeals/hot.json?limit=50',   cat:'deals',  status:'active', schedule:'Every 30m', keyRequired:false, notes:'Free JSON endpoint. No auth needed. Returns hot posts with flair, score, URL.' },
    { id:'gundeals',  name:'gun.deals',            type:'RSS',  url:'https://gun.deals/feed/json',                          cat:'deals',  status:'active', schedule:'Every 30m', keyRequired:false },
    { id:'gundeals_api',name:'gun.deals Dealer API',type:'API', url:'https://gun.deals/api/prices',                        cat:'deals',  status:'pending',schedule:'On demand', keyRequired:true, keyName:'GUN_DEALS_API_KEY', keyUrl:'https://gun.deals/content/dealers-api-access', notes:'Paid subscription — price optimization data for top products' },
    { id:'gunbroker', name:'GunBroker REST API',  type:'API',  url:'https://api.gunbroker.com',                             cat:'market', status:'pending',schedule:'On demand', keyRequired:true, keyName:'GUNBROKER_API_KEY', keyUrl:'https://www.gunbroker.com/user/settings/myprofile', notes:'Full REST API. GET /Items, /Categories, /ItemsCompleted for sold prices. Dev sandbox available.' },
    { id:'ammoseek',  name:'AmmoSeek XML Feed',   type:'XML',  url:'https://ammoseek.com/xml/',                             cat:'market', status:'pending',schedule:'Every 5m',  keyRequired:false, notes:'Retailer-submitted XML feeds. DownRange can subscribe to receive price data from 300+ calibers in real time.' },
    { id:'wikiarms',  name:'WikiArms AmmoEngine',  type:'HTML_SCRAPE', url:'https://www.wikiarms.com/deals/ammo',           cat:'market', status:'pending',schedule:'Every 1h',  keyRequired:false, notes:'HTML scrape — lowest prices by caliber. No official API.' },
    { id:'nics',      name:'FBI NICS Background Checks', type:'CSV', url:'https://github.com/data-liberation-project/nics-firearm-background-checks', cat:'market', status:'active', schedule:'Monthly 1st', keyRequired:false, notes:'Monthly CSV from GitHub pipeline of FBI PDF data. Covers state-by-state check volume back to 1998. Critical market indicator.' },
  ]

  const VIDEO_SOURCES = [
    { id:'yt_garand',  name:'Garand Thumb',          type:'YOUTUBE', channelId:'UCvB3solmh5NXa0VmCnWCMWg', subs:'2.5M', status:'active',  cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY' },
    { id:'yt_hickok',  name:'hickok45',              type:'YOUTUBE', channelId:'UCvB3solmh5NXa0VmCnWCMWg', subs:'8.1M', status:'active',  cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY' },
    { id:'yt_mac',     name:'Military Arms Channel',  type:'YOUTUBE', channelId:'UCv0KAWX2xO3wQgFiGnLwXcw', subs:'860K', status:'active',  cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY' },
    { id:'yt_lucky',   name:'Lucky Gunner',           type:'YOUTUBE', channelId:'UCcRrsfqUHWBfTU_lcB9nVwg', subs:'600K', status:'active',  cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY' },
    { id:'yt_iv8888',  name:'IraqVeteran8888',        type:'YOUTUBE', channelId:'UCvB3solmh5NXa0VmCnWCMWg', subs:'2.6M', status:'active',  cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY' },
    { id:'yt_mrgng',   name:'Mr. Guns N Gear',        type:'YOUTUBE', channelId:'UCvB3solmh5NXa0VmCnWCMWg', subs:'1.3M', status:'active',  cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY' },
    { id:'yt_colion',  name:'Colion Noir',            type:'YOUTUBE', channelId:'UCvB3solmh5NXa0VmCnWCMWg', subs:'1.8M', status:'pending', cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY', notes:'NRA TV alumni. Legal/constitutional commentary.' },
    { id:'yt_paul',    name:'Paul Harrell',           type:'YOUTUBE', channelId:'UCvB3solmh5NXa0VmCnWCMWg', subs:'1.1M', status:'pending', cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY', notes:'Practical demonstrations. Extremely credible terminal ballistics content.' },
    { id:'yt_brownell',name:'Brownells',              type:'YOUTUBE', channelId:'UCvB3solmh5NXa0VmCnWCMWg', subs:'260K', status:'active',  cat:'video', keyRequired:true, keyName:'YOUTUBE_API_KEY', notes:'Industry retailer channel. Parts, builds, upgrades.' },
  ]

  const SEC_SOURCES = [
    { id:'sec_rgr',   name:'Ruger (RGR) SEC EDGAR',   type:'SEC_EDGAR', cik:'0000095029', ticker:'RGR',  status:'active',  schedule:'On filing', notes:'8-K press releases include quarterly earnings, new product launches, dividend announcements. RSS at https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000095029&type=8-K&dateb=&owner=include&count=10&search_text=&output=atom' },
    { id:'sec_swbi',  name:'S&W Brands (SWBI) EDGAR',  type:'SEC_EDGAR', cik:'0001585583', ticker:'SWBI', status:'active',  schedule:'On filing', notes:'Smith & Wesson parent. Quarterly results and new product press releases.' },
    { id:'sec_vsto',  name:'Vista Outdoor (VSTO)',     type:'SEC_EDGAR', cik:'0001616862', ticker:'VSTO', status:'pending', schedule:'On filing', notes:'Federal Premium, CCI, Speer, Alliant Powder. Ammo market data.' },
    { id:'sec_aout',  name:'American Outdoor Brands',  type:'SEC_EDGAR', cik:'0001776197', ticker:'AOUT', status:'pending', schedule:'On filing', notes:'Outdoor survival, not firearms, but good market indicator.' },
  ]

  const ALL_SECTIONS = [
    { key:'overview',       label:'📡 Overview',              count: MANUFACTURER_SOURCES.length + NEWS_SOURCES.length + LAW_SOURCES.length + MARKET_SOURCES.length + VIDEO_SOURCES.length + SEC_SOURCES.length },
    { key:'manufacturers',  label:'🏭 Manufacturer Feeds',    count: MANUFACTURER_SOURCES.length },
    { key:'news',           label:'📰 News & Media',          count: NEWS_SOURCES.length },
    { key:'laws',           label:'⚖ Legal & Legislation',   count: LAW_SOURCES.length },
    { key:'market',         label:'📊 Market & Deals',        count: MARKET_SOURCES.length },
    { key:'video',          label:'▶ Video Channels',         count: VIDEO_SOURCES.length },
    { key:'sec',            label:'📈 Public Company Feeds',  count: SEC_SOURCES.length },
  ]

  const TYPE_COLORS = { RSS:'#22C55E', API:'#60A5FA', HTML_SCRAPE:'#C8922A', JSON:'#FBBF24', XML:'#F97316', CSV:'#8B5CF6', YOUTUBE:'#EF4444', SEC_EDGAR:'#9CA3AF' }
  const STATUS_COLORS = { active:'#22C55E', pending:'#FBBF24', disabled:'#EF4444' }

  function SourceRow({ src }) {
    const typeColor = TYPE_COLORS[src.type] || '#9CA3AF'
    const statColor = STATUS_COLORS[src.status] || '#9CA3AF'
    return (
      <div style={{ display:'grid', gridTemplateColumns:'180px 70px 70px 140px 1fr auto', gap:10, alignItems:'start', padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
        <div>
          <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'var(--text)', lineHeight:1.2, marginBottom:2 }}>{src.name}</div>
          {src.channelId && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)' }}>{src.subs} subscribers</div>}
          {src.ticker && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--gold)' }}>NYSE: {src.ticker}</div>}
        </div>
        <span style={{ display:'inline-flex', alignItems:'center', height:'fit-content', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', fontWeight:700, color:typeColor, background:`${typeColor}18`, padding:'2px 7px', border:`1px solid ${typeColor}30`, letterSpacing:'0.05em', whiteSpace:'nowrap' }}>{src.type}</span>
        <div style={{ display:'flex', alignItems:'center', gap:4 }}>
          <span style={{ width:6, height:6, borderRadius:'50%', background:statColor, flexShrink:0 }} />
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:statColor, letterSpacing:'0.05em' }}>{src.status?.toUpperCase()}</span>
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563' }}>{src.schedule}</div>
        <div>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', wordBreak:'break-all', marginBottom:src.notes?4:0 }}>{src.rssUrl || src.url}</div>
          {src.notes && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#6B7280', lineHeight:1.5 }}>{src.notes}</div>}
          {src.keyRequired && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A', marginTop:3 }}>🔑 Requires: <code style={{ color:'var(--gold)' }}>{src.keyName}</code></div>}
        </div>
        <div style={{ display:'flex', gap:4, flexShrink:0 }}>
          {src.keyUrl && <a href={src.keyUrl} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#60A5FA', textDecoration:'none', padding:'3px 7px', border:'1px solid #60A5FA30', whiteSpace:'nowrap' }}>GET KEY ↗</a>}
          {(src.rssUrl || src.url) && <a href={src.rssUrl || src.url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', textDecoration:'none', padding:'3px 7px', border:'1px solid var(--border)', whiteSpace:'nowrap' }}>TEST ↗</a>}
        </div>
      </div>
    )
  }

  function SourceTable({ sources, title }) {
    const active  = sources.filter(s=>s.status==='active').length
    const pending = sources.filter(s=>s.status==='pending').length
    return (
      <div style={{ marginBottom:32 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12, paddingBottom:8, borderBottom:'1px solid var(--border)' }}>
          <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.05em', margin:0 }}>{title}</h2>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#22C55E' }}>{active} ACTIVE</span>
          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#FBBF24' }}>{pending} PENDING</span>
        </div>
        <div style={{ border:'1px solid var(--border)', overflow:'hidden' }}>
          <div style={{ display:'grid', gridTemplateColumns:'180px 70px 70px 140px 1fr auto', gap:10, padding:'8px 16px', background:'var(--bg2)', borderBottom:'1px solid var(--border)' }}>
            {['Source','Type','Status','Schedule','URL / Notes',''].map(h=>(
              <div key={h} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', letterSpacing:'0.1em', fontWeight:700 }}>{h}</div>
            ))}
          </div>
          {sources.map(s => <SourceRow key={s.id} src={s} />)}
        </div>
      </div>
    )
  }

  const allSources = [...MANUFACTURER_SOURCES, ...NEWS_SOURCES, ...LAW_SOURCES, ...MARKET_SOURCES, ...VIDEO_SOURCES, ...SEC_SOURCES]
  const totalActive = allSources.filter(s=>s.status==='active').length
  const totalPending = allSources.filter(s=>s.status==='pending').length
  const apiRequired = allSources.filter(s=>s.keyRequired).length

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 className="dr-section-title" style={{ margin:0, marginBottom:4 }}>🛰 Mission Control</h1>
          <p className="dr-section-sub" style={{ margin:0 }}>Complete inventory of all data sources — manufacturer feeds, news APIs, legal trackers, market data, and video channels.</p>
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {[
            { n:allSources.length, l:'Total Sources',   c:'var(--gold)' },
            { n:totalActive,       l:'Active',           c:'#22C55E' },
            { n:totalPending,      l:'Pending Config',   c:'#FBBF24' },
            { n:apiRequired,       l:'API Keys Needed',  c:'#60A5FA' },
          ].map(s=>(
            <div key={s.l} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'10px 14px', textAlign:'center', minWidth:80 }}>
              <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.6rem', color:s.c, lineHeight:1 }}>{s.n}</div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', marginTop:2 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Section nav */}
      <div style={{ display:'flex', gap:0, borderBottom:'1px solid var(--border)', marginBottom:24, overflowX:'auto' }}>
        {ALL_SECTIONS.map(s=>(
          <button key={s.key} onClick={()=>setActiveSection(s.key)}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'10px 16px', background:'none', border:'none', borderBottom:`2px solid ${activeSection===s.key?'var(--gold)':'transparent'}`, color:activeSection===s.key?'var(--gold)':'var(--text-dim)', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', whiteSpace:'nowrap', letterSpacing:'0.04em', transition:'color 0.15s' }}>
            {s.label}
            <span style={{ background:'var(--bg3)', color:'#4B5563', padding:'1px 5px', fontSize:'8px' }}>{s.count}</span>
          </button>
        ))}
      </div>

      {/* Overview */}
      {activeSection==='overview' && (
        <div>
          {/* Priority implementation guide */}
          <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'3px solid var(--gold)', padding:'20px 24px', marginBottom:24 }}>
            <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)', letterSpacing:'0.15em', marginBottom:12, fontWeight:700 }}>IMPLEMENTATION PRIORITY GUIDE</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
              {[
                { tier:'TIER 1 — Free, Zero Config', color:'#22C55E', items:[
                  'GLOCK / SIG / Ruger press pages (scrape)',
                  'Daniel Defense Atom feed (already RSS)',
                  'r/gundeals JSON endpoint',
                  'ATF / NRA-ILA / GOA / SAF RSS',
                  'FBI NICS CSV via GitHub pipeline',
                  'SCOTUSblog RSS + Duke Firearms Law RSS',
                ]},
                { tier:'TIER 2 — Free API Key Required', color:'#FBBF24', items:[
                  'YouTube Data API v3 (video feeds)',
                  'Congress.gov API (federal bills)',
                  'LegiScan API (all 50 state bills)',
                  'NewsAPI.org (broader news coverage)',
                  'SEC EDGAR RSS (RGR + SWBI 8-K filings)',
                  'GNews API (backup news source)',
                ]},
                { tier:'TIER 3 — Paid API or Subscription', color:'#60A5FA', items:[
                  'GunBroker REST API (market pricing, dev key)',
                  'gun.deals Dealer API (price optimization)',
                  'AmmoSeek XML feed (retailer pricing data)',
                  'WikiArms data (price scrape, no official API)',
                  'NSSF Industry data (membership required)',
                  'Vista Outdoor MSRP data (contact required)',
                ]},
              ].map(t=>(
                <div key={t.tier}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:t.color, fontWeight:700, letterSpacing:'0.08em', marginBottom:8 }}>{t.tier}</div>
                  {t.items.map(i=>(
                    <div key={i} style={{ display:'flex', gap:6, marginBottom:4 }}>
                      <span style={{ color:t.color, fontSize:'10px', flexShrink:0, marginTop:1 }}>▸</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-muted)', lineHeight:1.4 }}>{i}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Status grid by category */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:24 }}>
            {[
              { label:'Manufacturer Feeds', sources:MANUFACTURER_SOURCES, icon:'🏭' },
              { label:'News & Media',       sources:NEWS_SOURCES,        icon:'📰' },
              { label:'Legal & Law',        sources:LAW_SOURCES,         icon:'⚖' },
              { label:'Market & Deals',     sources:MARKET_SOURCES,      icon:'📊' },
              { label:'Video Channels',     sources:VIDEO_SOURCES,       icon:'▶' },
              { label:'Public Companies',   sources:SEC_SOURCES,         icon:'📈' },
            ].map(cat=>{
              const a = cat.sources.filter(s=>s.status==='active').length
              const p = cat.sources.filter(s=>s.status==='pending').length
              return (
                <div key={cat.label} className="dr-card" style={{ padding:'16px 18px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
                    <span style={{ fontSize:'18px' }}>{cat.icon}</span>
                    <div className="dr-card-title" style={{ margin:0, fontSize:'0.9rem' }}>{cat.label}</div>
                  </div>
                  <div style={{ display:'flex', gap:12 }}>
                    <div><div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'#22C55E', lineHeight:1 }}>{a}</div><div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#22C55E' }}>ACTIVE</div></div>
                    <div><div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'#FBBF24', lineHeight:1 }}>{p}</div><div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#FBBF24' }}>PENDING</div></div>
                    <div><div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text-dim)', lineHeight:1 }}>{cat.sources.length}</div><div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'var(--text-dim)' }}>TOTAL</div></div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Deployment note */}
          <div className="dr-alert-info">
            <strong>⚠ Push to GitHub to Deploy:</strong> This environment cannot push to GitHub directly — it requires your credentials. Run <code style={{ color:'var(--gold)' }}>git push origin main</code> from your local machine, or push via GitHub Desktop. Vercel auto-deploys on every push to main. Check deployment status at <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" style={{ color:'#60A5FA' }}>vercel.com/dashboard ↗</a>
          </div>
        </div>
      )}

      {activeSection==='manufacturers' && <SourceTable sources={MANUFACTURER_SOURCES} title="Manufacturer Press Release Feeds" />}
      {activeSection==='news'          && <SourceTable sources={NEWS_SOURCES}         title="News & Media Sources" />}
      {activeSection==='laws'          && <SourceTable sources={LAW_SOURCES}          title="Legal & Legislation Sources" />}
      {activeSection==='market'        && <SourceTable sources={MARKET_SOURCES}       title="Market & Deals Sources" />}
      {activeSection==='video'         && <SourceTable sources={VIDEO_SOURCES}        title="YouTube Channels" />}
      {activeSection==='sec'           && (
        <div>
          <SourceTable sources={SEC_SOURCES} title="Public Company SEC Filings" />
          <div className="dr-alert-info">
            <strong>SEC EDGAR RSS pattern:</strong> Each public company has a free RSS feed for 8-K filings at <code style={{ color:'var(--gold)' }}>https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=&#123;CIK&#125;&type=8-K&dateb=&owner=include&count=10&search_text=&output=atom</code>. These cover quarterly earnings, product launches, and major corporate announcements. No API key required.
          </div>
        </div>
      )}
    </div>
  )
}

function BlogManager({ secret, setMsg }) {
  const [view, setView] = useState('list')         // list | editor | preview
  const [editing, setEditing] = useState(null)     // slug being edited
  const [filter, setFilter] = useState('all')
  const [draftTitle, setDraftTitle] = useState('')
  const [draftCat, setDraftCat] = useState('Getting Started')
  const [draftDate, setDraftDate] = useState('')
  const [draftBody, setDraftBody] = useState('')
  const [draftTags, setDraftTags] = useState('')
  const [publishing, setPublishing] = useState(false)

  const live  = ALL_ARTICLES.filter(a => a.status === 'live')
  const ready = ALL_ARTICLES.filter(a => a.status === 'ready')
  const shown = filter === 'all' ? ALL_ARTICLES : ALL_ARTICLES.filter(a => a.status === filter || a.cat === filter)

  async function publishArticle(slug) {
    if (!secret) { setMsg('Enter CRON_SECRET first'); return }
    setPublishing(true)
    try {
      const res = await fetch('/api/blog-publish', {
        method: 'POST',
        headers: { 'Content-Type':'application/json', 'Authorization':`Bearer ${secret}` },
        body: JSON.stringify({ slug, action:'publish' })
      })
      const d = await res.json()
      setMsg(d.message || `Published: ${slug}`)
    } catch(e) { setMsg(`Error: ${e.message}`) }
    setPublishing(false)
  }

  if (view === 'editor') return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'24px' }}>
        <button onClick={()=>setView('list')} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-dim)', padding:'7px 14px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>← Back</button>
        <h1 className="dr-section-title" style={{ margin:0 }}>{editing ? 'Edit Article' : 'New Article'}</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'24px' }}>
        <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
          {/* Title */}
          <div>
            <div className="t-label-xs" style={{ marginBottom:'6px' }}>ARTICLE TITLE</div>
            <input value={draftTitle} onChange={e=>setDraftTitle(e.target.value)} placeholder="Enter article title..."
              style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'10px 14px', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'18px', fontWeight:700, letterSpacing:'0.03em', outline:'none' }} />
          </div>

          {/* Body editor */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'6px' }}>
              <div className="t-label-xs">ARTICLE BODY</div>
              <div style={{ display:'flex', gap:'4px' }}>
                {['## Heading','**bold**','> Quote','- List item'].map(t => (
                  <button key={t} onClick={()=>setDraftBody(b => b + '\n\n' + t)}
                    style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text-dim)', padding:'3px 8px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={draftBody} onChange={e=>setDraftBody(e.target.value)}
              placeholder="Write your article here using Markdown...&#10;&#10;## Section Heading&#10;&#10;Body text here. Use **bold** for emphasis.&#10;&#10;• Bullet points&#10;• Like this"
              style={{ width:'100%', minHeight:400, background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', lineHeight:1.7, outline:'none', resize:'vertical' }} />
          </div>

          {/* Key takeaways */}
          <div>
            <div className="t-label-xs" style={{ marginBottom:'6px' }}>KEY TAKEAWAYS (one per line)</div>
            <textarea placeholder="Each line becomes a takeaway bullet point" rows={5}
              style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'10px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', outline:'none', resize:'vertical' }} />
          </div>
        </div>

        {/* Sidebar metadata */}
        <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
          {/* Status */}
          <div className="dr-card">
            <div className="dr-card-meta" style={{ marginBottom:'10px' }}>PUBLISH SETTINGS</div>
            <div style={{ marginBottom:'10px' }}>
              <div className="t-label-xs" style={{ marginBottom:'5px' }}>STATUS</div>
              <select style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'7px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
                <option value="draft">Draft</option>
                <option value="ready">Ready to Publish</option>
                <option value="live">Live</option>
              </select>
            </div>
            <div style={{ marginBottom:'10px' }}>
              <div className="t-label-xs" style={{ marginBottom:'5px' }}>PUBLISH DATE</div>
              <input type="date" value={draftDate} onChange={e=>setDraftDate(e.target.value)}
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'7px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }} />
            </div>
            <button onClick={()=>publishArticle('new')} disabled={publishing} className="dr-btn-primary" style={{ width:'100%', justifyContent:'center', opacity:publishing?0.5:1 }}>
              {publishing ? '⚡ Publishing...' : '▶ Publish Now'}
            </button>
            <button style={{ width:'100%', background:'none', border:'1px solid var(--border)', color:'var(--text-dim)', padding:'8px', marginTop:'6px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
              Save Draft
            </button>
          </div>

          {/* Category + Tags */}
          <div className="dr-card">
            <div className="dr-card-meta" style={{ marginBottom:'10px' }}>CATEGORY & TAGS</div>
            <div style={{ marginBottom:'10px' }}>
              <div className="t-label-xs" style={{ marginBottom:'5px' }}>CATEGORY</div>
              <select value={draftCat} onChange={e=>setDraftCat(e.target.value)}
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'7px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
                {BLOG_CATS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="t-label-xs" style={{ marginBottom:'5px' }}>TAGS (comma separated)</div>
              <input value={draftTags} onChange={e=>setDraftTags(e.target.value)} placeholder="9mm, Beginner, CCW"
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'7px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }} />
            </div>
          </div>

          {/* Hero image */}
          <div className="dr-card">
            <div className="dr-card-meta" style={{ marginBottom:'10px' }}>HERO IMAGE</div>
            <input placeholder="https://images.unsplash.com/..."
              style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'7px 10px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', marginBottom:'6px' }} />
            <div style={{ height:80, background:'var(--bg3)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <span className="t-label-xs">Image preview</span>
            </div>
          </div>

          {/* Author */}
          <div className="dr-card">
            <div className="dr-card-meta" style={{ marginBottom:'8px' }}>AUTHOR</div>
            <div style={{ display:'flex', gap:'8px', alignItems:'center' }}>
              <span style={{ fontSize:'22px' }}>🎯</span>
              <div>
                <div className="t-label-md" style={{ color:'var(--text)', fontWeight:700 }}>DJ Cavalcanti</div>
                <div className="t-label-xs">DownRange Founder</div>
              </div>
            </div>
          </div>

          {/* Word count */}
          <div className="dr-card" style={{ textAlign:'center' }}>
            <div className="dr-stat-num" style={{ fontSize:'1.8rem' }}>{draftBody.split(/\s+/).filter(Boolean).length}</div>
            <div className="dr-stat-label">Words</div>
            <div className="dr-stat-sub">~{Math.ceil(draftBody.split(/\s+/).filter(Boolean).length / 200)} min read</div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 className="dr-section-title" style={{ margin:0 }}>Blog Manager</h1>
          <p className="dr-section-sub" style={{ marginTop:'4px', marginBottom:0 }}>Learning Center — {live.length} live · {ready.length} ready to publish</p>
        </div>
        <div style={{ display:'flex', gap:'8px' }}>
          <a href="/learn" target="_blank" className="dr-btn-outline" style={{ fontSize:'11px' }}>View Site ↗</a>
          <button onClick={()=>{setEditing(null);setDraftTitle('');setDraftBody('');setView('editor')}} className="dr-btn-primary" style={{ fontSize:'11px' }}>
            + New Article
          </button>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'10px', marginBottom:'24px' }}>
        {[
          { num: String(live.length),  label:'Live',    cls:'dr-badge-green', key:'live' },
          { num: String(ready.length), label:'Ready',   cls:'dr-badge-gold',  key:'ready' },
          { num: String(ALL_ARTICLES.filter(a=>a.featured).length), label:'Featured', cls:'dr-badge-blue', key:'featured' },
          { num: String(ALL_ARTICLES.length), label:'Total',   cls:'dr-badge-dim',   key:'all' },
        ].map(s => (
          <div key={s.key} onClick={()=>setFilter(s.key==='featured'?'all':s.key)} className="dr-stat" style={{ cursor:'pointer', borderTop:`2px solid ${filter===s.key?'var(--gold)':'transparent'}`, transition:'border-color 0.15s' }}>
            <div className="dr-stat-num">{s.num}</div>
            <div style={{ display:'flex', justifyContent:'center', marginTop:'4px' }}>
              <span className={`dr-badge ${s.cls}`}>{s.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter bar */}
      <div style={{ display:'flex', gap:'6px', marginBottom:'16px', flexWrap:'wrap' }}>
        <button onClick={()=>setFilter('all')} className={`dr-badge ${filter==='all'?'dr-badge-gold':'dr-badge-dim'}`} style={{ cursor:'pointer', border:'none', padding:'5px 12px' }}>All</button>
        {['live','ready','draft','planned'].map(s => (
          <button key={s} onClick={()=>setFilter(s)} className={`dr-badge ${filter===s?(s==='live'?'dr-badge-green':s==='ready'?'dr-badge-gold':'dr-badge-dim'):'dr-badge-dim'}`} style={{ cursor:'pointer', border:'none', padding:'5px 12px' }}>
            {STATUS_META[s]?.label || s.toUpperCase()}
          </button>
        ))}
        <div style={{ marginLeft:'auto', display:'flex', gap:'6px' }}>
          {BLOG_CATS.slice(0,4).map(cat => (
            <button key={cat} onClick={()=>setFilter(cat)} className={`dr-badge ${filter===cat?'dr-badge-gold':'dr-badge-dim'}`} style={{ cursor:'pointer', border:'none', padding:'5px 10px', fontSize:'9px' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Article list */}
      <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
        {shown.map(a => {
          const sm = STATUS_META[a.status] || STATUS_META.draft
          return (
            <div key={a.slug} className="dr-card" style={{ display:'grid', gridTemplateColumns:'44px 1fr 140px 90px 90px auto', gap:12, alignItems:'center', padding:'12px 16px', borderLeft:`3px solid ${a.status==='live'?'#22C55E':a.status==='ready'?'var(--gold)':'var(--border)'}` }}>
              <div style={{ width:44, height:44, background:'var(--bg3)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'20px', flexShrink:0 }}>{a.image}</div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'14px', fontWeight:700, color:'var(--text)', lineHeight:1.2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {a.featured && <span style={{ color:'var(--gold)', marginRight:'6px' }}>★</span>}
                  {a.title}
                </div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', marginTop:'2px' }}>{a.cat} · {a.readTime}</div>
              </div>
              <div className="t-label-sm">{a.date}</div>
              <span className={`dr-badge ${sm.cls}`}>{sm.label}</span>
              <div className="t-label-sm" style={{ textAlign:'center' }}>
                {a.status === 'ready' ? (
                  <button onClick={()=>publishArticle(a.slug)} disabled={publishing} style={{ background:'var(--gold)', color:'#000', border:'none', padding:'4px 10px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', fontWeight:700, opacity:publishing?0.5:1 }}>
                    {publishing ? '...' : '▶ PUBLISH'}
                  </button>
                ) : '—'}
              </div>
              <div style={{ display:'flex', gap:'4px' }}>
                <button onClick={()=>{setEditing(a.slug);setDraftTitle(a.title);setDraftCat(a.cat);setView('editor')}}
                  style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text-dim)', padding:'5px 10px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px' }}>
                  EDIT
                </button>
                <a href={`/learn/${a.slug}`} target="_blank"
                  style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text-dim)', padding:'5px 10px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', textDecoration:'none' }}>
                  ↗
                </a>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom help */}
      <div className="dr-alert-info" style={{ marginTop:'20px' }}>
        <strong style={{ color:'var(--gold)' }}>Ready articles</strong> have full content written and images assigned. Click <strong>▶ PUBLISH</strong> to push live. 
        Articles marked <span className="dr-badge dr-badge-green" style={{ verticalAlign:'middle' }}>LIVE</span> are already published at /learn/[slug].
        Use <strong>+ New Article</strong> to write a new post with the inline editor.
      </div>
    </div>
  )
}

// ── PUBLICATION SCHEDULE COMPONENT ───────────────────────────────────────────
function PublicationSchedule({ secret, setMsg }) {
  const [view, setView] = useState('calendar')   // calendar | list | add
  const [newTitle, setNewTitle] = useState('')
  const [newCat, setNewCat] = useState('Getting Started')
  const [newDate, setNewDate] = useState('')
  const [newStatus, setNewStatus] = useState('planned')

  const SCHEDULE = [
    { date:'May 15', dateSort:'2026-05-15', title:'Buying Your First Gun',               cat:'Getting Started', author:'DJ Cavalcanti', status:'live',    slug:'buying-your-first-gun',        img:'🔫' },
    { date:'May 18', dateSort:'2026-05-18', title:'How to Get Your CCW License',          cat:'CCW & Carry',    author:'DJ Cavalcanti', status:'live',    slug:'how-to-get-ccw-license',         img:'🪪' },
    { date:'May 20', dateSort:'2026-05-20', title:'The Four Rules of Firearms Safety',    cat:'Safety',         author:'DJ Cavalcanti', status:'live',    slug:'firearms-safety-four-rules',     img:'🛡' },
    { date:'Jun 2',  dateSort:'2026-06-02', title:'Home Defense Basics',                  cat:'Home Defense',   author:'DJ Cavalcanti', status:'ready',   slug:'home-defense-basics',            img:'🏠' },
    { date:'Jun 5',  dateSort:'2026-06-05', title:'Safe Storage 101',                     cat:'Safe Storage',   author:'DJ Cavalcanti', status:'ready',   slug:'safe-storage-guide-beginners',   img:'🔒' },
    { date:'Jun 9',  dateSort:'2026-06-09', title:'Ammunition Explained',                 cat:'Ammunition',     author:'DJ Cavalcanti', status:'ready',   slug:'ammo-guide-beginners',           img:'🔶' },
    { date:'Jun 12', dateSort:'2026-06-12', title:'Your First Range Visit',               cat:'Getting Started',author:'DJ Cavalcanti', status:'ready',   slug:'shooting-range-first-visit',     img:'◎' },
    { date:'Jun 16', dateSort:'2026-06-16', title:'How to Clean Your Firearm',            cat:'Maintenance',    author:'DJ Cavalcanti', status:'ready',   slug:'cleaning-maintaining-your-gun',  img:'🔧' },
    { date:'Jun 19', dateSort:'2026-06-19', title:'Understanding Gun Laws',               cat:'Legal',          author:'DJ Cavalcanti', status:'ready',   slug:'understanding-gun-laws',          img:'⚖' },
    { date:'Jun 23', dateSort:'2026-06-23', title:'How to Choose a Holster',             cat:'CCW & Carry',    author:'DJ Cavalcanti', status:'ready',   slug:'choosing-holster-beginners',      img:'🔫' },
    { date:'Jun 26', dateSort:'2026-06-26', title:'Dry Fire Training Guide',              cat:'Training',       author:'DJ Cavalcanti', status:'ready',   slug:'dry-fire-training-beginners',    img:'🎯' },
    { date:'Jun 30', dateSort:'2026-06-30', title:'What Is the NFA?',                    cat:'Legal',          author:'DJ Cavalcanti', status:'ready',   slug:'what-is-nfa',                    img:'📋' },
    { date:'Jul 7',  dateSort:'2026-07-07', title:'9mm vs .45 ACP — Which to Choose?',   cat:'Ammunition',     author:'DJ Cavalcanti', status:'planned', slug:'',                               img:'🔶' },
    { date:'Jul 11', dateSort:'2026-07-11', title:'Red Dot vs Iron Sights for Beginners',cat:'Getting Started',author:'DJ Cavalcanti', status:'planned', slug:'',                               img:'◉' },
    { date:'Jul 14', dateSort:'2026-07-14', title:'Women and Firearms: Fit & Ergonomics',cat:'Getting Started',author:'DJ Cavalcanti', status:'planned', slug:'',                               img:'🔫' },
    { date:'Jul 18', dateSort:'2026-07-18', title:'Apartment Home Defense',              cat:'Home Defense',   author:'DJ Cavalcanti', status:'planned', slug:'',                               img:'🏠' },
    { date:'Jul 21', dateSort:'2026-07-21', title:'Constitutional Carry 2026',           cat:'Legal',          author:'DJ Cavalcanti', status:'planned', slug:'',                               img:'⚖' },
    { date:'Jul 25', dateSort:'2026-07-25', title:'Trigger Upgrades for Beginners',      cat:'Maintenance',    author:'DJ Cavalcanti', status:'planned', slug:'',                               img:'🔧' },
  ]

  const months = ['May 2026','Jun 2026','Jul 2026']
  const live   = SCHEDULE.filter(a => a.status === 'live')
  const ready  = SCHEDULE.filter(a => a.status === 'ready')
  const planned = SCHEDULE.filter(a => a.status === 'planned')

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'24px' }}>
        <div>
          <h1 className="dr-section-title" style={{ margin:0 }}>Publication Schedule</h1>
          <p className="dr-section-sub" style={{ marginTop:'4px', marginBottom:0 }}>Editorial calendar — {live.length} live · {ready.length} ready · {planned.length} planned</p>
        </div>
        <div style={{ display:'flex', gap:'6px' }}>
          {['calendar','list'].map(v => (
            <button key={v} onClick={()=>setView(v)} style={{ background:view===v?'var(--gold)':'var(--bg3)', color:view===v?'#000':'var(--text-dim)', border:'1px solid var(--border)', padding:'7px 14px', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:view===v?700:400 }}>
              {v === 'calendar' ? '📅 Calendar' : '☰ List'}
            </button>
          ))}
          <button onClick={()=>setView('add')} className="dr-btn-primary" style={{ fontSize:'11px' }}>+ Schedule</button>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background:'var(--bg3)', border:'1px solid var(--border)', padding:'14px 18px', marginBottom:'20px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:'8px' }}>
          <span className="t-label-xs">EDITORIAL PROGRESS — 2026</span>
          <span className="t-label-xs text-gold">{live.length + ready.length}/{SCHEDULE.length} articles written</span>
        </div>
        <div style={{ height:6, background:'var(--bg)', borderRadius:3, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${((live.length + ready.length)/SCHEDULE.length)*100}%`, background:'linear-gradient(90deg, var(--gold), #22C55E)', borderRadius:3, transition:'width 0.6s ease' }} />
        </div>
        <div style={{ display:'flex', gap:'16px', marginTop:'10px' }}>
          {[{l:'Live', n:live.length, c:'#22C55E'},{l:'Ready', n:ready.length, c:'var(--gold)'},{l:'Planned', n:planned.length, c:'var(--text-dim)'}].map(s=>(
            <div key={s.l} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:s.c }} />
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)' }}>{s.n} {s.l}</span>
            </div>
          ))}
        </div>
      </div>

      {view === 'add' && (
        <div className="dr-card dr-card-accent" style={{ marginBottom:'20px' }}>
          <div className="dr-card-meta" style={{ marginBottom:'14px' }}>SCHEDULE NEW ARTICLE</div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 160px 140px 120px auto', gap:10, alignItems:'end' }}>
            <div>
              <div className="t-label-xs" style={{ marginBottom:'4px' }}>TITLE</div>
              <input value={newTitle} onChange={e=>setNewTitle(e.target.value)} placeholder="Article title..."
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }} />
            </div>
            <div>
              <div className="t-label-xs" style={{ marginBottom:'4px' }}>CATEGORY</div>
              <select value={newCat} onChange={e=>setNewCat(e.target.value)}
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
                {BLOG_CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <div className="t-label-xs" style={{ marginBottom:'4px' }}>PUBLISH DATE</div>
              <input type="date" value={newDate} onChange={e=>setNewDate(e.target.value)}
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }} />
            </div>
            <div>
              <div className="t-label-xs" style={{ marginBottom:'4px' }}>STATUS</div>
              <select value={newStatus} onChange={e=>setNewStatus(e.target.value)}
                style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
                <option value="planned">Planned</option><option value="draft">Draft</option><option value="ready">Ready</option>
              </select>
            </div>
            <button onClick={()=>{setMsg(`Scheduled: ${newTitle}`);setNewTitle('');setView('list')}} className="dr-btn-primary" style={{ padding:'8px 16px', fontSize:'11px' }}>ADD</button>
          </div>
        </div>
      )}

      {view === 'calendar' && (
        <div>
          {months.map(month => {
            const items = SCHEDULE.filter(a => a.date.includes(month.split(' ')[0]))
            if (!items.length) return null
            return (
              <div key={month} style={{ marginBottom:'28px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'12px', marginBottom:'12px', paddingBottom:'8px', borderBottom:'1px solid var(--border)' }}>
                  <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.05em', margin:0 }}>{month}</h2>
                  <span className="t-label-xs">{items.filter(a=>a.status==='live').length} live · {items.filter(a=>a.status==='ready').length} ready · {items.filter(a=>a.status==='planned').length} planned</span>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:'8px' }}>
                  {items.map((a, i) => (
                    <div key={i} className="dr-card" style={{ padding:'12px 14px', borderLeft:`3px solid ${a.status==='live'?'#22C55E':a.status==='ready'?'var(--gold)':'var(--border)'}` }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:'8px' }}>
                        <div style={{ flex:1 }}>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', marginBottom:'3px' }}>
                            {a.date} · {a.cat}
                          </div>
                          <div style={{ display:'flex', gap:'6px', alignItems:'center' }}>
                            <span style={{ fontSize:'14px' }}>{a.img}</span>
                            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, color:'var(--text)', lineHeight:1.2 }}>{a.title}</div>
                          </div>
                        </div>
                        <div style={{ flexShrink:0 }}>
                          <span className={`dr-badge ${STATUS_META[a.status]?.cls || 'dr-badge-dim'}`} style={{ fontSize:'8px' }}>
                            {STATUS_META[a.status]?.label}
                          </span>
                        </div>
                      </div>
                      {a.slug && (
                        <a href={`/learn/${a.slug}`} target="_blank" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--gold)', textDecoration:'none', display:'block', marginTop:'6px' }}>
                          /learn/{a.slug} ↗
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {(view === 'list' || view === 'add') && (
        <div className="dr-table">
          <div className="dr-table-head" style={{ gridTemplateColumns:'70px 32px 1fr 140px 110px 90px' }}>
            {['Date','','Title','Category','Author','Status'].map(h=><span key={h}>{h}</span>)}
          </div>
          {SCHEDULE.map((a, i) => (
            <div key={i} className="dr-table-row" style={{ gridTemplateColumns:'70px 32px 1fr 140px 110px 90px', background: i % 2 === 0 ? 'var(--bg)' : 'var(--bg2)' }}>
              <span className="t-label-sm">{a.date}</span>
              <span style={{ fontSize:'14px', textAlign:'center' }}>{a.img}</span>
              <div>
                <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:600, color:'var(--text)', lineHeight:1.2 }}>{a.title}</div>
                {a.slug && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'var(--text-dim)', marginTop:'1px' }}>{a.slug}</div>}
              </div>
              <span className="t-label-sm">{a.cat}</span>
              <span className="t-label-sm">{a.author}</span>
              <span className={`dr-badge ${STATUS_META[a.status]?.cls || 'dr-badge-dim'}`}>
                {STATUS_META[a.status]?.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const [tab, setTab]       = useState('dashboard')
  const [secret, setSecret] = useState('')
  const [msg, setMsg]       = useState('')
  const [running, setRunning] = useState({})

  async function runFeed(key) {
    if (!secret) { setMsg('Enter CRON_SECRET first'); return }
    setRunning(r => ({...r, [key]:true}))
    try {
      const res = await fetch(`/api/agent?feed=${key}`, { headers:{ Authorization:`Bearer ${secret}` } })
      const d = await res.json()
      setMsg(`${key} feed: ${d.processed || d.message || JSON.stringify(d)}`)
    } catch(e) { setMsg(`Error: ${e.message}`) }
    setRunning(r => ({...r, [key]:false}))
  }

  return (
    <div style={{ minHeight:'100vh', background:'var(--bg)', display:'flex', flexDirection:'column' }}>
      {/* Admin header */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'14px 0', position:'sticky', top:0, zIndex:50 }}>
        <div className="container" style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div style={{ display:'flex', alignItems:'center', gap:'16px' }}>
            <Link href="/" style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--gold)', letterSpacing:'0.05em', textDecoration:'none' }}>DOWNRANGE</Link>
            <span className="dr-badge dr-badge-dim">ADMIN CONSOLE</span>
          </div>
          <div style={{ display:'flex', gap:'10px', alignItems:'center' }}>
            <input value={secret} onChange={e=>setSecret(e.target.value)} type="password" placeholder="CRON_SECRET for agent triggers"
              style={{ background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'6px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', width:'240px' }} />
            <Link href="/" className="dr-btn-outline" style={{ padding:'6px 14px', fontSize:'11px' }}>← Site</Link>
          </div>
        </div>
      </div>

      <div style={{ display:'flex', flex:1 }}>
        {/* Sidebar */}
        <div style={{ width:200, background:'var(--bg2)', borderRight:'1px solid var(--border)', flexShrink:0, position:'sticky', top:'57px', height:'calc(100vh - 57px)', overflowY:'auto' }}>
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              style={{ width:'100%', display:'flex', alignItems:'center', gap:'10px', padding:'11px 16px', background:tab===t.key?'var(--bg3)':'none', border:'none', borderLeft:`3px solid ${tab===t.key?'var(--gold)':'transparent'}`, color:tab===t.key?'var(--gold)':'var(--text-dim)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', cursor:'pointer', textAlign:'left', letterSpacing:'0.03em', transition:'all 0.12s' }}>
              <span>{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex:1, padding:'32px', overflowY:'auto', maxHeight:'calc(100vh - 57px)' }}>

          {/* Status message */}
          {msg && (
            <div className="dr-alert-info" style={{ marginBottom:'20px', display:'flex', justifyContent:'space-between' }}>
              <span>{msg}</span>
              <button onClick={()=>setMsg('')} style={{ background:'none', border:'none', color:'var(--gold)', cursor:'pointer', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px' }}>✕</button>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {tab==='dashboard' && (
            <div>
              <h1 className="dr-section-title">Site Dashboard</h1>
              <p className="dr-section-sub">DownRange Control Center — Configure everything from here</p>

              {/* Stats */}
              <div className="dr-grid-4" style={{ marginBottom:'28px' }}>
                {SITE_STATS.map(s => (
                  <div key={s.num} className="dr-stat">
                    <div className="dr-stat-num">{s.num}</div>
                    <div className="dr-stat-label">{s.label}</div>
                    <div className="dr-stat-sub">{s.sub}</div>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <h2 className="dr-section-title" style={{ marginBottom:'12px' }}>Quick Access</h2>
              <div className="dr-grid-4" style={{ marginBottom:'28px' }}>
                {QUICK_LINKS.map(l => (
                  <a key={l.label} href={l.url} className="dr-card" style={{ textDecoration:'none', textAlign:'center', padding:'16px' }}>
                    <div style={{ fontSize:'22px', marginBottom:'6px' }}>{l.icon}</div>
                    <div className="dr-card-title" style={{ fontSize:'0.9rem' }}>{l.label}</div>
                    <div className="dr-card-body" style={{ fontSize:'10px' }}>{l.desc}</div>
                  </a>
                ))}
              </div>

              {/* Feed status */}
              <h2 className="dr-section-title" style={{ marginBottom:'12px' }}>Agent Feed Status</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {FEEDS.map(f => (
                  <div key={f.key} className="dr-card" style={{ display:'grid', gridTemplateColumns:'32px 1fr 120px 100px auto', gap:12, alignItems:'center', padding:'12px 16px' }}>
                    <span style={{ fontSize:'16px' }}>{f.icon}</span>
                    <div>
                      <div className="t-label-md" style={{ color:'var(--text)', fontWeight:700 }}>{f.label}</div>
                      <div className="t-label-xs">{f.schedule}</div>
                    </div>
                    <span className="dr-badge dr-badge-green">● {f.status}</span>
                    <div className="t-label-xs">Vercel Cron</div>
                    <button onClick={()=>runFeed(f.key)} disabled={running[f.key]}
                      className="dr-btn-outline" style={{ padding:'5px 12px', fontSize:'10px', opacity:running[f.key]?0.5:1 }}>
                      {running[f.key]?'RUNNING...':'RUN NOW'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── MISSION CONTROL ── */}
          {tab==='mission' && <MissionControl secret={secret} setMsg={setMsg} />}

          {/* ── AI AGENT ── */}
          {tab==='feeds' && (
            <div>
              <h1 className="dr-section-title">AI Agent Control</h1>
              <p className="dr-section-sub">Trigger feeds manually or view schedule</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'10px', marginBottom:'28px' }}>
                {FEEDS.map(f => (
                  <div key={f.key} className="dr-card" style={{ display:'grid', gridTemplateColumns:'40px 1fr 150px 1fr auto', gap:16, alignItems:'center' }}>
                    <span style={{ fontSize:'20px' }}>{f.icon}</span>
                    <div>
                      <div className="dr-card-title" style={{ fontSize:'1rem' }}>{f.label}</div>
                      <div className="dr-card-meta" style={{ marginBottom:0 }}>Schedule: {f.schedule}</div>
                    </div>
                    <span className="dr-badge dr-badge-green" style={{ justifyContent:'center' }}>● ACTIVE</span>
                    <div className="t-label-sm">Runs automatically via Vercel Cron. API key required.</div>
                    <button onClick={()=>runFeed(f.key)} disabled={running[f.key]} className="dr-btn-primary" style={{ padding:'8px 16px', fontSize:'11px', opacity:running[f.key]?0.5:1 }}>
                      {running[f.key]?'⚡ RUNNING...':'▶ RUN NOW'}
                    </button>
                  </div>
                ))}
              </div>
              <div className="dr-alert-info">
                <strong style={{ color:'var(--gold)' }}>How to trigger manually:</strong> Enter your CRON_SECRET in the header field, then click RUN NOW. All feeds run automatically via vercel.json cron configuration — manual triggers are for debugging only.
              </div>
            </div>
          )}

          {/* ── RSS SOURCES ── */}
          {tab==='rss' && (
            <div>
              <h1 className="dr-section-title">RSS Sources</h1>
              <p className="dr-section-sub">These feeds are parsed by the AI agent every cycle. Category controls where articles appear.</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                {RSS_FEEDS.map(f => (
                  <div key={f.name} className="dr-card" style={{ display:'grid', gridTemplateColumns:'180px 1fr 80px 60px', gap:12, alignItems:'center' }}>
                    <div className="dr-card-title" style={{ fontSize:'0.9rem' }}>{f.name}</div>
                    <div className="t-label-sm" style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', opacity:0.6 }}>{f.url}</div>
                    <span className={`dr-badge ${f.cat==='law'?'dr-badge-blue':f.cat==='deals'?'dr-badge-gold':'dr-badge-dim'}`}>{f.cat}</span>
                    <span className={`dr-badge ${f.active?'dr-badge-green':'dr-badge-red'}`}>{f.active?'ON':'OFF'}</span>
                  </div>
                ))}
              </div>
              <div className="dr-alert-info" style={{ marginTop:'16px' }}>
                To add/remove feeds, edit <code style={{ color:'var(--gold)' }}>agent/feeds/news.js</code> RSS_FEEDS array and redeploy. AmmoLand is locked to <code style={{ color:'var(--gold)' }}>cat: 'deals'</code> and will never appear in news.
              </div>
            </div>
          )}

          {/* ── OPENCLAW ── */}
          {tab==='openclaw' && (
            <div>
              <h1 className="dr-section-title">OpenClaw Agent</h1>
              <p className="dr-section-sub">Your local Ollama/Hermes 3 Mac Mini agent — setup and configuration</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'24px' }}>
                {[
                  { title:'Market Analysis', schedule:'Daily 6:00 AM', status:'Manual setup', endpoint:'/api/market-analysis', desc:'Posts daily ammo price analysis to Market Watch page' },
                  { title:'News Enrichment', schedule:'On demand', status:'Available', endpoint:'/api/agent?feed=news', desc:'Run news feed enrichment locally using Hermes 3' },
                ].map(c => (
                  <div key={c.title} className="dr-card dr-card-accent">
                    <div className="dr-card-meta">{c.schedule}</div>
                    <div className="dr-card-title">{c.title}</div>
                    <div className="dr-badge dr-badge-gold" style={{ margin:'6px 0 8px' }}>{c.status}</div>
                    <p className="dr-card-body">{c.desc}</p>
                    <div className="dr-spec-row" style={{ marginTop:'8px' }}>
                      <span className="dr-spec-key">Endpoint</span>
                      <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)' }}>{c.endpoint}</code>
                    </div>
                  </div>
                ))}
              </div>

              <h2 className="dr-section-title" style={{ fontSize:'1.4rem', marginBottom:'12px' }}>Mac Mini Setup</h2>
              {[
                { step:'1', title:'Install Ollama', cmd:'curl -fsSL https://ollama.com/install.sh | sh' },
                { step:'2', title:'Pull Hermes 3 model', cmd:'ollama pull hermes3' },
                { step:'3', title:'Clone agent script', cmd:'# See docs/openclaw-market-analysis.md' },
                { step:'4', title:'Add to crontab', cmd:'0 6 * * * /usr/local/bin/node /path/to/market-analysis.js' },
              ].map(s => (
                <div key={s.step} className="dr-card" style={{ display:'grid', gridTemplateColumns:'32px 1fr', gap:'12px', marginBottom:'8px' }}>
                  <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.5rem', color:'var(--gold)', textAlign:'center' }}>{s.step}</div>
                  <div>
                    <div className="dr-infoblock-title">{s.title}</div>
                    <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--green)', background:'var(--bg)', padding:'4px 8px', display:'block', marginTop:'4px' }}>{s.cmd}</code>
                  </div>
                </div>
              ))}
              <div style={{ marginTop:'12px' }}>
                <a href="/docs/openclaw-market-analysis.md" target="_blank" className="dr-btn-outline" style={{ fontSize:'11px' }}>
                  View Full Setup Guide ↗
                </a>
              </div>
            </div>
          )}

          {/* ── API KEYS ── */}
          {tab==='keys' && (
            <div>
              <h1 className="dr-section-title">API Keys</h1>
              <p className="dr-section-sub">All secrets are stored in Vercel Environment Variables — never in code</p>
              <div className="dr-alert-warn" style={{ marginBottom:'20px' }}>
                🔒 API keys are managed in your Vercel dashboard → Settings → Environment Variables. They are never stored client-side. Use the links below to obtain each key.
              </div>
              {API_KEYS_CONFIG.map(group => (
                <div key={group.group} style={{ marginBottom:'24px' }}>
                  <h2 className="dr-section-title" style={{ fontSize:'1.3rem', marginBottom:'10px' }}>{group.group}</h2>
                  <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                    {group.keys.map(k => (
                      <div key={k.key} className="dr-card" style={{ display:'grid', gridTemplateColumns:'220px 1fr 100px auto', gap:12, alignItems:'center' }}>
                        <div>
                          <div className="dr-card-title" style={{ fontSize:'0.9rem', marginBottom:2 }}>{k.label}</div>
                          <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)' }}>{k.key}</code>
                        </div>
                        <div className="t-label-sm">{k.hint}</div>
                        <span className={`dr-badge ${k.required?'dr-badge-red':'dr-badge-dim'}`}>{k.required?'REQUIRED':'OPTIONAL'}</span>
                        {k.url && <a href={k.url} target="_blank" rel="noreferrer" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#60A5FA', textDecoration:'none', padding:'4px 10px', border:'1px solid #60A5FA30', whiteSpace:'nowrap' }}>GET KEY ↗</a>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              <a href="https://vercel.com/dashboard" target="_blank" rel="noreferrer" className="dr-btn-primary">
                Open Vercel Dashboard ↗
              </a>
            </div>
          )}

          {/* ── SEO ── */}
          {tab==='seo' && (
            <div>
              <h1 className="dr-section-title">SEO & Metadata</h1>
              <p className="dr-section-sub">Current SEO configuration overview</p>
              <div className="dr-grid-2" style={{ marginBottom:'24px' }}>
                {[
                  { label:'Site Name', val:'DownRange — America\'s Firearms Intelligence Hub' },
                  { label:'Base URL', val:'https://downrangeco.com' },
                  { label:'Twitter Card', val:'summary_large_image' },
                  { label:'OG Type', val:'website' },
                  { label:'Sitemap', val:'/sitemap.xml (auto-generated)' },
                  { label:'Robots.txt', val:'/robots.txt (allows all)' },
                ].map(s => (
                  <div key={s.label} className="dr-spec-row">
                    <span className="dr-spec-key">{s.label}</span>
                    <span className="dr-spec-val" style={{ fontSize:'11px' }}>{s.val}</span>
                  </div>
                ))}
              </div>
              <div className="dr-alert-info">
                SEO metadata is defined per-page via Next.js <code style={{ color:'var(--gold)' }}>export const metadata</code>. Global defaults are in <code style={{ color:'var(--gold)' }}>app/layout.js</code>.
              </div>
            </div>
          )}



          {/* ── PULL LOG ── */}
          {tab==='pulllog' && (
            <div style={{ margin: '-32px' }}>
              <iframe
                src="/admin/pull-log"
                style={{ width: '100%', height: 'calc(100vh - 57px)', border: 'none', display: 'block' }}
                title="Pull Log Dashboard"
              />
            </div>
          )}

          {/* ── SETTINGS ── */}
          {tab==='settings' && (
            <div>
              <h1 className="dr-section-title">Site Settings</h1>
              <p className="dr-section-sub">Runtime configuration overview</p>
              <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
                {[
                  { label:'News Revalidation',  val:'300 seconds (5 min)',    desc:'How often Next.js refreshes news pages' },
                  { label:'State Hub Cache',     val:'1800 seconds (30 min)', desc:'State law data refresh interval' },
                  { label:'Market Data Cache',   val:'1800 seconds (30 min)', desc:'Ammo price data refresh' },
                  { label:'Deals Page',          val:'Client-side (no cache)', desc:'Browser fetches Reddit on every load' },
                  { label:'Range Finder',        val:'No cache (dynamic)',     desc:'Always fetches fresh from all sources' },
                  { label:'Laws Page',           val:'3600 seconds (1 hr)',    desc:'Federal/state bill data refresh' },
                  { label:'Theme Toggle',        val:'Dark/Light (CSS vars)',  desc:'User preference stored in localStorage' },
                ].map(s => (
                  <div key={s.label} className="dr-card" style={{ display:'grid', gridTemplateColumns:'200px 200px 1fr', gap:16, alignItems:'center' }}>
                    <div className="dr-infoblock-title" style={{ margin:0 }}>{s.label}</div>
                    <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--gold)' }}>{s.val}</code>
                    <div className="t-label-sm">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── BLOG MANAGER ── */}
          {/* ── BLOG MANAGER (World-class) ── */}
          {tab==='blog' && <BlogManager secret={secret} setMsg={setMsg} />}

          {/* ── PUBLICATION SCHEDULE (World-class) ── */}
          {tab==='schedule' && <PublicationSchedule secret={secret} setMsg={setMsg} />}

          {/* ── CONTENT MANAGER ── */}
          {tab==='content' && (
            <div>
              <h1 className="dr-section-title">Content Manager</h1>
              <p className="dr-section-sub">Manage all content types: news articles, reviews, guns, state profiles, and more.</p>

              <div className="dr-grid-2" style={{ marginBottom:20 }}>
                {[
                  { label:'News Articles',     icon:'📰', count:'30+',  desc:'AI-fetched + manually authored news stories', path:'/news', edit:'/api/agent?feed=news' },
                  { label:'Gun Reviews',        icon:'★',  count:'12+',  desc:'Full field-tested firearm and gear reviews',  path:'/reviews', edit:null },
                  { label:'Gun Encyclopedia',   icon:'📖', count:'200+', desc:'Firearm specs, history, variants database',    path:'/guns', edit:null },
                  { label:'State Profiles',     icon:'🗺', count:'50',   desc:'Per-state laws, CCW, and permit data',         path:'/state-hub', edit:null },
                  { label:'New Releases',       icon:'🔫', count:'10+',  desc:'Latest firearm and gear launches',             path:'/releases', edit:null },
                  { label:'Learn Center',       icon:'📚', count:'12',   desc:'Beginner guides and educational articles',     path:'/learn', edit:null },
                ].map(c => (
                  <div key={c.label} className="dr-card" style={{ padding:'18px 20px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <span style={{ fontSize:'22px' }}>{c.icon}</span>
                        <div>
                          <div className="dr-card-title" style={{ fontSize:'1rem', marginBottom:2 }}>{c.label}</div>
                          <div className="dr-card-meta" style={{ marginBottom:0 }}>{c.count} records</div>
                        </div>
                      </div>
                      <a href={c.path} target="_blank" className="dr-btn-outline" style={{ fontSize:'10px', padding:'5px 12px', textDecoration:'none' }}>VIEW ↗</a>
                    </div>
                    <div className="t-label-sm" style={{ marginBottom:10 }}>{c.desc}</div>
                    {c.edit && (
                      <button onClick={()=>runFeed('news')} disabled={running['news']} className="dr-btn-primary" style={{ fontSize:'10px', padding:'5px 14px', opacity:running['news']?0.5:1 }}>
                        {running['news']?'RUNNING...':'▶ REFRESH FEED'}
                      </button>
                    )}
                    {!c.edit && (
                      <div className="t-label-xs" style={{ color:'var(--text-dim)' }}>Edit via code: <code style={{ color:'var(--gold)' }}>sanity/schemas/</code> + Sanity dataset</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="dr-alert-info">
                <strong style={{ color:'var(--gold)' }}>Content architecture:</strong> News articles are auto-ingested via the AI agent every 15 minutes. Reviews, gun profiles, and state data are managed in the Sanity dataset. To add content manually, use the Sanity API with your <code style={{ color:'var(--gold)' }}>SANITY_API_TOKEN</code>.
              </div>
            </div>
          )}

          {/* ── BREAKING ALERTS ── */}
          {tab==='alerts' && (
            <div>
              <h1 className="dr-section-title">Breaking Alerts</h1>
              <p className="dr-section-sub">High-urgency alerts shown in the ticker and sidebar. Auto-created when urgency score is 8/10 or higher.</p>

              {/* Current alert config */}
              <div className="dr-card dr-card-accent" style={{ marginBottom:20 }}>
                <div className="dr-card-meta" style={{ marginBottom:12 }}>HOW ALERTS ARE CREATED</div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
                  {[
                    { step:'1', title:'Agent Scores Story', desc:'Every news item receives an urgencyScore 1-10 based on legal impact, breadth of affect, and recency.' },
                    { step:'2', title:'Auto-Alert at 8+', desc:'Stories scoring ≥ 8 are automatically flagged as Breaking Alerts and pushed to the BreakingTicker component.' },
                    { step:'3', title:'Manual Override', desc:'You can manually set any story as breaking by updating its urgencyScore to 8 or higher in the Sanity dataset via API.' },
                  ].map(s => (
                    <div key={s.step} className="dr-card" style={{ padding:'14px 16px' }}>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2rem', color:'var(--gold)', lineHeight:1, marginBottom:6 }}>0{s.step}</div>
                      <div className="dr-card-title" style={{ fontSize:'0.9rem', marginBottom:4 }}>{s.title}</div>
                      <div className="t-label-sm">{s.desc}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Seed alerts preview */}
              <h2 className="dr-section-title" style={{ fontSize:'1.1rem', marginBottom:12 }}>Current Alert Seeds</h2>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {[
                  { headline:'ATF Finalizes Pistol Brace Rule — 5th Circuit Injunction Holds', urgencyScore:9, category:'law' },
                  { headline:'House Passes SHARE Act — Suppressor Reform Advances', urgencyScore:8, category:'law' },
                  { headline:'California AWB Ruled Unconstitutional — Appeal Filed', urgencyScore:8, category:'law' },
                  { headline:'SCOTUS Conference: Viramontes v. Cook County Listed for Review', urgencyScore:9, category:'scotus' },
                  { headline:'ATF 34-Rule Package Effective — Pistol Brace, Engaged in Business Rules Rescinded', urgencyScore:8, category:'atf' },
                ].map((a,i) => (
                  <div key={i} className="dr-card" style={{ display:'grid', gridTemplateColumns:'50px 1fr 80px 80px', gap:12, alignItems:'center', padding:'12px 16px', borderLeft:`3px solid #EF4444` }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.5rem', color:'#EF4444', lineHeight:1 }}>{a.urgencyScore}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:'#EF4444' }}>/10</div>
                    </div>
                    <div className="t-label-md" style={{ color:'var(--text)', fontWeight:600, lineHeight:1.3 }}>{a.headline}</div>
                    <span className="dr-badge dr-badge-dim">{a.category}</span>
                    <span className="dr-badge dr-badge-red">ACTIVE</span>
                  </div>
                ))}
              </div>

              <div className="dr-alert-info" style={{ marginTop:16 }}>
                <strong>To create a manual alert:</strong> POST to <code style={{ color:'var(--gold)' }}>/api/agent?feed=news</code> with your CRON_SECRET, or increase a news article urgencyScore to 8+ via Sanity dataset API at <code style={{ color:'var(--gold)' }}>https://vbnsqnkg.api.sanity.io</code>
              </div>
            </div>
          )}

          {/* ── VIDEO CHANNELS ── */}
          {tab==='channels' && (
            <div>
              <h1 className="dr-section-title">Video Channels</h1>
              <p className="dr-section-sub">YouTube channels populating the Video page. Configured in the video feed agent. YouTube API key enables live subscriber counts and latest video data.</p>

              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:20 }}>
                {[
                  { name:'Military Arms Channel', handle:'@MilitaryArmsChannel', cat:'Reviews & Industry', subs:'~860K', active:true },
                  { name:'Lucky Gunner',           handle:'@LuckyGunner',         cat:'Ammo & Testing',    subs:'~600K', active:true },
                  { name:'Brownells',              handle:'@Brownells',            cat:'Industry & Gear',   subs:'~260K', active:true },
                  { name:'IraqVeteran8888',        handle:'@IraqVeteran8888',      cat:'General Firearms',  subs:'~2.6M', active:true },
                  { name:'Hickok45',               handle:'@hickok45',             cat:'Demonstrations',    subs:'~6.6M', active:true },
                  { name:'Mr. Guns N Gear',        handle:'@MrGunsNGear',          cat:'Reviews',           subs:'~1.3M', active:true },
                  { name:'Garand Thumb',           handle:'@GarandThumb',          cat:'Reviews & Training',subs:'~2.5M', active:true },
                  { name:'Paul Harrell',           handle:'@PaulHarrell',          cat:'Demonstrations',    subs:'~1.1M', active:true },
                ].map(c => (
                  <div key={c.name} className="dr-card" style={{ display:'grid', gridTemplateColumns:'200px 160px 160px 80px 60px auto', gap:12, alignItems:'center', padding:'12px 16px' }}>
                    <div className="dr-card-title" style={{ fontSize:'0.9rem', margin:0 }}>{c.name}</div>
                    <div className="t-label-sm" style={{ color:'var(--gold)' }}>{c.handle}</div>
                    <div className="t-label-xs">{c.cat}</div>
                    <div className="t-label-sm">{c.subs}</div>
                    <span className={`dr-badge ${c.active?'dr-badge-green':'dr-badge-dim'}`}>{c.active?'ON':'OFF'}</span>
                    <a href={`https://youtube.com/${c.handle}`} target="_blank" rel="noreferrer" className="dr-btn-outline" style={{ fontSize:'9px', padding:'4px 8px', textDecoration:'none' }}>YT ↗</a>
                  </div>
                ))}
              </div>

              <div className="dr-alert-info">
                <strong>To add channels:</strong> Edit <code style={{ color:'var(--gold)' }}>agent/feeds/video.js</code> CHANNELS array and redeploy. Set <code style={{ color:'var(--gold)' }}>YOUTUBE_API_KEY</code> in Vercel to enable live video data — without it, seed channel data is displayed.
              </div>
            </div>
          )}

          {/* ── DEALS CONFIG ── */}
          {tab==='deals' && (
            <div>
              <h1 className="dr-section-title">Deals Configuration</h1>
              <p className="dr-section-sub">Live deal sources powering the Deals page. Data aggregated from Reddit, AmmoLand, and direct retailer feeds.</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:20 }}>
                {[
                  { name:'r/gundeals',      icon:'🔴', type:'Reddit JSON API', status:'active', url:'https://old.reddit.com/r/gundeals/hot.json?limit=50&raw_json=1', desc:'Community-curated firearm deals. Hot + New feeds. Score, comments, images from post previews. No API key needed.' },
                  { name:'gun.deals',       icon:'🔫', type:'RSS Feed',        status:'active', url:'https://gun.deals/feed/snap', desc:'Aggregated retailer pricing feed. Tries /feed/snap then /feed as fallback. Images extracted from enclosure tags.' },
                  { name:'AmmoLand',        icon:'📰', type:'RSS Feed',        status:'active', url:'https://www.ammoland.com/feed/', desc:'AmmoLand is locked to deals category — never routes to news feed. Images from media:content tags.' },
                ].map(s => (
                  <div key={s.name} className="dr-card dr-card-accent" style={{ padding:'18px' }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontSize:'20px' }}>{s.icon}</span>
                        <div>
                          <div className="dr-card-title" style={{ marginBottom:2 }}>{s.name}</div>
                          <div className="dr-card-meta" style={{ marginBottom:0 }}>{s.type}</div>
                        </div>
                      </div>
                      <span className="dr-badge dr-badge-green">● {s.status}</span>
                    </div>
                    <div className="t-label-sm" style={{ marginBottom:8 }}>{s.desc}</div>
                    <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', wordBreak:'break-all' }}>{s.url}</code>
                  </div>
                ))}
              </div>

              <div className="dr-alert-info">
                <strong>To modify deal sources:</strong> Edit <code style={{ color:'var(--gold)' }}>app/api/deals/route.js</code>. AmmoLand is hardcoded to <code style={{ color:'var(--gold)' }}>feedCat: &apos;deals&apos;</code> via the <code style={{ color:'var(--gold)' }}>agent/feeds/news.js</code> feedCat propagation — this was a known critical bug that was fixed.
              </div>
            </div>
          )}

          {/* ── RANGE DATABASE ── */}
          {tab==='ranges' && (
            <div>
              <h1 className="dr-section-title">Range Database</h1>
              <p className="dr-section-sub">86 ranges in the national database. Google Places API enables live search and additional ranges near the user.</p>

              <div className="dr-grid-4" style={{ marginBottom:20 }}>
                {[{n:'86',l:'Total Ranges',s:'In database'},{n:'48',l:'States',s:'Coverage'},{n:'~35',l:'Indoor',s:'Climate controlled'},{n:'~51',l:'Outdoor',s:'Long range available'}].map(s=>(
                  <div key={s.l} className="dr-card" style={{ textAlign:'center', padding:'20px 12px' }}>
                    <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'2.2rem', color:'var(--gold)', lineHeight:1 }}>{s.n}</div>
                    <div className="t-label-md" style={{ color:'var(--text)', fontWeight:700, marginTop:4 }}>{s.l}</div>
                    <div className="t-label-xs">{s.s}</div>
                  </div>
                ))}
              </div>

              <div className="dr-card" style={{ marginBottom:16, padding:'18px 20px' }}>
                <div className="dr-card-meta" style={{ marginBottom:10 }}>ADD A RANGE TO DATABASE</div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr auto', gap:10, alignItems:'end' }}>
                  {[['Name','Range name...'],['City, State','Location...'],['Website (optional)','https://...']].map(([label,ph])=>(
                    <div key={label}>
                      <div className="t-label-xs" style={{ marginBottom:4 }}>{label.toUpperCase()}</div>
                      <input placeholder={ph} style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', outline:'none' }} />
                    </div>
                  ))}
                  <button onClick={()=>setMsg('Range submitted — add to app/api/ranges/route.js to go live')} className="dr-btn-primary" style={{ padding:'8px 16px', fontSize:'11px' }}>ADD</button>
                </div>
                <div className="t-label-xs" style={{ marginTop:8, color:'var(--text-dim)' }}>Submitted ranges must be manually added to <code style={{ color:'var(--gold)' }}>app/api/ranges/route.js</code> RANGES array then redeployed.</div>
              </div>

              <div className="dr-alert-info">
                <strong>Live search:</strong> Set <code style={{ color:'var(--gold)' }}>GOOGLE_PLACES_API_KEY</code> in Vercel to enable Google Places search for ranges near the user. Without the key, the static 86-range database is displayed.
              </div>
            </div>
          )}

          {/* ── NEWSLETTER ── */}
          {tab==='newsletter' && (
            <div>
              <h1 className="dr-section-title">Newsletter</h1>
              <p className="dr-section-sub">Managed via Resend. Requires RESEND_API_KEY and RESEND_AUDIENCE_ID environment variables.</p>

              <div className="dr-grid-2" style={{ marginBottom:20 }}>
                <div className="dr-card dr-card-accent" style={{ padding:'20px' }}>
                  <div className="dr-card-meta" style={{ marginBottom:12 }}>RESEND CONFIGURATION</div>
                  {[
                    { key:'RESEND_API_KEY',      label:'API Key',     hint:'resend.com/api-keys',        status: secret ? '✓ Configured via CRON_SECRET field' : '⚠ Set in Vercel env vars' },
                    { key:'RESEND_AUDIENCE_ID',   label:'Audience ID', hint:'Your Resend audience UUID',  status:'Set in Vercel env vars' },
                    { key:'RESEND_FROM_EMAIL',     label:'From Email',  hint:'noreply@downrangeco.com',    status:'Requires domain DNS verification' },
                  ].map(k => (
                    <div key={k.key} style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:10, padding:'8px 0', borderBottom:'1px solid var(--border)' }}>
                      <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)' }}>{k.label}</code>
                      <div className="t-label-xs">{k.status}</div>
                    </div>
                  ))}
                  <a href="https://resend.com/dashboard" target="_blank" rel="noreferrer" className="dr-btn-outline" style={{ display:'inline-block', marginTop:14, fontSize:'10px', padding:'6px 14px', textDecoration:'none' }}>OPEN RESEND DASHBOARD ↗</a>
                </div>

                <div className="dr-card" style={{ padding:'20px' }}>
                  <div className="dr-card-meta" style={{ marginBottom:12 }}>SEND NEWSLETTER</div>
                  <div style={{ marginBottom:10 }}>
                    <div className="t-label-xs" style={{ marginBottom:5 }}>SUBJECT LINE</div>
                    <input placeholder="DownRange Weekly — May 25, 2026" style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', outline:'none' }} />
                  </div>
                  <div style={{ marginBottom:10 }}>
                    <div className="t-label-xs" style={{ marginBottom:5 }}>PREVIEW TEXT</div>
                    <input placeholder="This week in 2A: SCOTUS updates, new releases, best deals..." style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', outline:'none' }} />
                  </div>
                  <div style={{ marginBottom:14 }}>
                    <div className="t-label-xs" style={{ marginBottom:5 }}>TEMPLATE</div>
                    <select style={{ width:'100%', background:'var(--bg3)', border:'1px solid var(--border)', color:'var(--text)', padding:'8px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px' }}>
                      <option>Weekly Digest (top 5 stories + top deal)</option>
                      <option>Breaking Alert (single story)</option>
                      <option>Law Update (legislation roundup)</option>
                    </select>
                  </div>
                  <button onClick={()=>setMsg('Newsletter requires RESEND_API_KEY and RESEND_AUDIENCE_ID in Vercel env vars')} className="dr-btn-primary" style={{ width:'100%', padding:'9px', fontSize:'11px' }}>
                    📧 SEND TO SUBSCRIBERS
                  </button>
                </div>
              </div>

              <div className="dr-alert-info">
                <strong>Automation:</strong> The newsletter API route at <code style={{ color:'var(--gold)' }}>app/api/newsletter</code> is pending implementation (item #8 on the pending list). Once built, it will automatically compile top stories and send weekly digests via Resend.
              </div>
            </div>
          )}

          {/* ── SITE IDENTITY ── */}
          {tab==='identity' && (
            <div>
              <h1 className="dr-section-title">Site Identity</h1>
              <p className="dr-section-sub">Brand configuration, design tokens, and visual identity settings for DownRange.</p>

              <div className="dr-grid-2" style={{ marginBottom:20 }}>
                <div className="dr-card" style={{ padding:'20px' }}>
                  <div className="dr-card-meta" style={{ marginBottom:14 }}>DESIGN TOKENS</div>
                  {[
                    { label:'Primary Gold',    val:'#C8922A', preview:true },
                    { label:'Background',      val:'#09090B', preview:true },
                    { label:'Background 2',    val:'#0D0E10', preview:true },
                    { label:'Background 3',    val:'#1F2428', preview:true },
                    { label:'Border Color',    val:'var(--border)', preview:false },
                    { label:'Text Primary',    val:'#F0EDE6', preview:true },
                    { label:'Text Muted',      val:'#9CA3AF', preview:true },
                    { label:'Text Dim',        val:'#4B5563', preview:true },
                  ].map(t => (
                    <div key={t.label} style={{ display:'grid', gridTemplateColumns:'140px 1fr 28px', gap:8, alignItems:'center', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)' }}>{t.label}</code>
                      <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)' }}>{t.val}</code>
                      {t.preview && <div style={{ width:20, height:20, background:t.val, border:'1px solid var(--border)', borderRadius:2 }} />}
                    </div>
                  ))}
                </div>

                <div className="dr-card" style={{ padding:'20px' }}>
                  <div className="dr-card-meta" style={{ marginBottom:14 }}>TYPOGRAPHY</div>
                  {[
                    { role:'Display / Headlines', font:'Bebas Neue', usage:'H1 titles, hero text, section headers' },
                    { role:'Body / Labels',       font:'Barlow Condensed', usage:'Navigation, card titles, UI labels' },
                    { role:'Monospace / Code',    font:'IBM Plex Mono', usage:'Metadata, badges, timestamps, code' },
                  ].map(t => (
                    <div key={t.role} className="dr-card" style={{ padding:'12px 14px', marginBottom:8 }}>
                      <div className="t-label-xs" style={{ marginBottom:4 }}>{t.role.toUpperCase()}</div>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.3rem', color:'var(--gold)', letterSpacing:'0.05em', marginBottom:2 }}>{t.font}</div>
                      <div className="t-label-sm">{t.usage}</div>
                    </div>
                  ))}

                  <div className="dr-card-meta" style={{ marginBottom:10, marginTop:16 }}>SITE SETTINGS</div>
                  {[
                    { label:'Site Name',      val:'DownRange Intelligence Hub' },
                    { label:'Domain',         val:'downrangeco.com' },
                    { label:'Default Theme',  val:'Dark (var(--bg) = #09090B)' },
                    { label:'Logo Type',      val:'SVG inline — crosshair + wordmark' },
                    { label:'DESIGN_SYSTEM',  val:'See /DESIGN_SYSTEM.md in repo root' },
                  ].map(s => (
                    <div key={s.label} style={{ display:'grid', gridTemplateColumns:'120px 1fr', gap:8, padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)' }}>{s.label}</code>
                      <code style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--gold)' }}>{s.val}</code>
                    </div>
                  ))}
                </div>
              </div>

              <div className="dr-alert-info">
                <strong>Design rules from DESIGN_SYSTEM.md:</strong> Never hardcode hex colors — always use CSS vars. Never use bare monospace font family. Use <code style={{ color:'var(--gold)' }}>var(--border)</code> for all borders (not #1F2428). Use <code style={{ color:'var(--gold)' }}>.page-hero + .dr-card + var(--border)</code> pattern throughout. See <code style={{ color:'var(--gold)' }}>DESIGN_SYSTEM.md</code> in the repo root.
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
