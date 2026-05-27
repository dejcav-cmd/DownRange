'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const FEEDS = [
  {
    id:       'all',
    title:    'All Content',
    emoji:    '📡',
    url:      '/feed.xml',
    color:    '#C8922A',
    desc:     'Everything — news, blog, releases, and more. The full DownRange feed.',
    badge:    'MASTER',
    count:    '60 items',
    update:   'Every 15 min',
    tags:     ['news','blog','releases','laws'],
  },
  {
    id:       'news',
    title:    'Firearms News',
    emoji:    '📰',
    url:      '/feeds/news',
    color:    '#3b82f6',
    desc:     'Live firearms and 2A news. ATF actions, legislation, industry, breaking stories pulled from 30+ sources.',
    badge:    'MOST POPULAR',
    count:    '50 items',
    update:   'Every 15 min',
    tags:     ['news','2A','ATF','NRA'],
  },
  {
    id:       'laws',
    title:    'Laws & Legislation',
    emoji:    '⚖',
    url:      '/feeds/laws',
    color:    '#ef4444',
    desc:     'Second Amendment legislation, court cases, ATF rules, Bruen decisions, and rights advocacy.',
    badge:    null,
    count:    '50 items',
    update:   'Every 15 min',
    tags:     ['law','ATF','court','SCOTUS'],
  },
  {
    id:       'blog',
    title:    'Blog & Analysis',
    emoji:    '✍',
    url:      '/feeds/blog',
    color:    '#22c55e',
    desc:     'In-depth articles, gear guides, and firearms analysis written by DJ Cavalcanti.',
    badge:    null,
    count:    '30 items',
    update:   'On publish',
    tags:     ['guides','analysis','howto'],
  },
  {
    id:       'releases',
    title:    'New Gun Releases',
    emoji:    '◈',
    url:      '/feeds/releases',
    color:    '#C8922A',
    desc:     'New firearm releases and product announcements. Glock, SIG, S&W, Ruger, Daniel Defense, and more.',
    badge:    null,
    count:    '30 items',
    update:   'On publish',
    tags:     ['pistol','rifle','new'],
  },
  {
    id:       'competitions',
    title:    'Competitions Calendar',
    emoji:    '🏆',
    url:      '/feeds/competitions',
    color:    '#f59e0b',
    desc:     'NRA, USPSA, IDPA, PRS, NRL22, Steel Challenge — upcoming matches with registration links.',
    badge:    null,
    count:    '50 items',
    update:   'Daily',
    tags:     ['NRA','USPSA','PRS','IDPA'],
  },
  {
    id:       'canada',
    title:    'Canada',
    emoji:    '🇨🇦',
    url:      '/feeds/canada',
    color:    '#dc2626',
    desc:     'Canadian firearms news — Bill C-21, OIC ban, PAL updates, CCFR legal challenges.',
    badge:    null,
    count:    '30 items',
    update:   'Every 15 min',
    tags:     ['C-21','PAL','CCFR','OIC'],
  },
  {
    id:       'reviews',
    title:    'Gun Reviews',
    emoji:    '🔬',
    url:      '/feeds/reviews',
    color:    '#a855f7',
    desc:     'Firearm and gear reviews — hands-on testing, honest assessments.',
    badge:    null,
    count:    '30 items',
    update:   'On publish',
    tags:     ['reviews','gear','testing'],
  },
]

const READERS = [
  { name:'Feedly',     icon:'F', color:'#2bb24c', url:'https://feedly.com/i/subscription/feed/' },
  { name:'Inoreader',  icon:'I', color:'#007bc7', url:'https://www.inoreader.com/feed/' },
  { name:'NewsBlur',   icon:'N', color:'#ff7200', url:'https://newsblur.com/?url=' },
  { name:'The Old Reader', icon:'R', color:'#666', url:'https://theoldreader.com/feeds/' },
  { name:'NetNewsWire',icon:'W', color:'#4a85fe', url:'netnewswire://add?url=' },
  { name:'Reeder',     icon:'R', color:'#e2443a', url:'reeder://add?url=' },
]

const S = `
@keyframes pulse-ring { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.5;transform:scale(1.4)} }
@keyframes slide-in { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
.feed-card { background:var(--bg2); border:1px solid var(--border); transition:all .2s; position:relative; overflow:hidden; }
.feed-card:hover { transform:translateY(-2px); box-shadow:0 8px 32px rgba(0,0,0,.4); }
.feed-card.active { border-color:var(--gold) !important; }
.copy-btn { background:none; border:1px solid var(--border); color:var(--text-dim); font-family:'IBM Plex Mono',monospace; font-size:10px; padding:5px 10px; cursor:pointer; transition:all .15s; white-space:nowrap; }
.copy-btn:hover { border-color:var(--gold); color:var(--gold); }
.copy-btn.copied { border-color:#22c55e; color:#22c55e; }
.sub-btn { font-family:'Barlow Condensed',sans-serif; font-size:13px; font-weight:700; letter-spacing:.06em; text-transform:uppercase; padding:6px 14px; cursor:pointer; text-decoration:none; display:inline-block; transition:opacity .15s; }
.sub-btn:hover { opacity:.85; }
`

function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false)
  return (
    <button className={'copy-btn' + (copied ? ' copied' : '')}
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}>
      {copied ? '✓ Copied' : '⎘ Copy URL'}
    </button>
  )
}

function LiveDot({ color }) {
  return (
    <span style={{ position:'relative', display:'inline-block', width:8, height:8, marginRight:6, verticalAlign:'middle' }}>
      <span style={{ position:'absolute', inset:0, borderRadius:'50%', background:color, animation:'pulse-ring 2s ease-in-out infinite' }} />
      <span style={{ position:'absolute', inset:1, borderRadius:'50%', background:color }} />
    </span>
  )
}

export default function RSSPageClient() {
  const [activeId,  setActiveId]  = useState(null)
  const [copied,    setCopied]    = useState(null)
  const [filterTag, setFilterTag] = useState(null)

  const BASE = 'https://downrangeco.com'

  const allTags = [...new Set(FEEDS.flatMap(f => f.tags))].sort()
  const visible = filterTag ? FEEDS.filter(f => f.tags.includes(filterTag)) : FEEDS

  const activeFeeed = FEEDS.find(f => f.id === activeId)

  return (
    <>
      <style>{S}</style>
      <Masthead />

      {/* ── HERO ── */}
      <div style={{
        background: 'linear-gradient(180deg, #09090B 0%, #0d1117 50%, #09090B 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '64px 0 48px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background grid */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(200,146,42,.03) 40px, rgba(200,146,42,.03) 41px), repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(200,146,42,.03) 40px, rgba(200,146,42,.03) 41px)',
          pointerEvents: 'none',
        }} />
        {/* Glowing orb */}
        <div style={{
          position: 'absolute', top: -100, right: '10%',
          width: 400, height: 400,
          background: 'radial-gradient(circle, rgba(200,146,42,.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 48, height: 48, background: 'rgba(200,146,42,.12)',
              border: '1px solid rgba(200,146,42,.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 24,
            }}>📡</div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#C8922A', letterSpacing: '.15em', fontWeight: 700, textTransform: 'uppercase' }}>
              RSS &amp; SYNDICATION
            </div>
          </div>

          <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(3rem,8vw,5.5rem)', color: '#F0EDE6', letterSpacing: '.04em', lineHeight: 1, margin: '0 0 16px' }}>
            Subscribe to<br /><span style={{ color: '#C8922A' }}>DownRange</span>
          </h1>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#6b7280', maxWidth: 560, lineHeight: 1.9, margin: '0 0 32px' }}>
            Every category has its own feed. Pull firearms news, legislation, new releases, competition calendars, or Canadian law directly into your RSS reader.
            Updated every 15 minutes. No paywalls. No tracking. Just content.
          </p>

          {/* Stats row */}
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
            {[
              ['8', 'Feeds'],
              ['30+', 'Sources'],
              ['15 min', 'Update cycle'],
              ['∞', 'Free forever'],
            ].map(([n, l]) => (
              <div key={l}>
                <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '2rem', color: '#C8922A', lineHeight: 1 }}>{n}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.1em' }}>{l}</div>
              </div>
            ))}
          </div>

          {/* Master feed CTA */}
          <div style={{
            display: 'inline-flex', gap: 12, alignItems: 'center',
            background: 'rgba(200,146,42,.08)', border: '1px solid rgba(200,146,42,.35)',
            padding: '12px 20px',
          }}>
            <LiveDot color="#C8922A" />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#C8922A', fontWeight: 700 }}>
              Master feed:
            </span>
            <code style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#F0EDE6' }}>
              downrangeco.com/feed.xml
            </code>
            <CopyBtn text="https://downrangeco.com/feed.xml" />
            <a href="/feed.xml" target="_blank" rel="noreferrer"
              style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#C8922A', textDecoration: 'none' }}>
              Preview ↗
            </a>
          </div>
        </div>
      </div>

      {/* ── READER QUICK-ADD ── */}
      <div style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', padding: '16px 0' }}>
        <div className="container">
          <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4b5563', letterSpacing: '.08em', textTransform: 'uppercase', flexShrink: 0 }}>
              Open master feed in:
            </span>
            {READERS.map(r => {
              const feedUrl = encodeURIComponent('https://downrangeco.com/feed.xml')
              const href = r.url + (r.url.startsWith('http') ? feedUrl : 'https://downrangeco.com/feed.xml')
              return (
                <a key={r.name} href={href} target="_blank" rel="noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, textDecoration: 'none',
                    padding: '5px 12px', border: `1px solid ${r.color}44`,
                    color: r.color, transition: 'all .15s',
                    background: `${r.color}08`,
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = r.color + '22' }}
                  onMouseLeave={e => { e.currentTarget.style.background = r.color + '08' }}>
                  <span style={{ fontWeight: 700, width: 14, textAlign: 'center', fontSize: 11 }}>{r.icon}</span>
                  {r.name}
                </a>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── FEED GRID ── */}
      <div style={{ padding: '40px 0 80px', background: 'var(--bg)' }}>
        <div className="container">

          {/* Filter tags */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4b5563', letterSpacing: '.06em' }}>FILTER:</span>
            <button onClick={() => setFilterTag(null)}
              style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, padding: '4px 10px', cursor: 'pointer', transition: 'all .15s',
                background: !filterTag ? '#C8922A' : 'transparent', color: !filterTag ? '#000' : '#6b7280',
                border: `1px solid ${!filterTag ? '#C8922A' : '#374151'}` }}>
              All
            </button>
            {allTags.map(tag => (
              <button key={tag} onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, padding: '4px 10px', cursor: 'pointer', transition: 'all .15s',
                  background: filterTag === tag ? '#C8922A' : 'transparent', color: filterTag === tag ? '#000' : '#6b7280',
                  border: `1px solid ${filterTag === tag ? '#C8922A' : '#374151'}` }}>
                {tag}
              </button>
            ))}
          </div>

          {/* Feed cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {visible.map(feed => {
              const isActive = activeId === feed.id
              const fullUrl = BASE + feed.url
              return (
                <div key={feed.id} className={'feed-card' + (isActive ? ' active' : '')}
                  style={{ borderColor: isActive ? feed.color : undefined }}>

                  {/* Color accent line */}
                  <div style={{ height: 3, background: `linear-gradient(90deg, ${feed.color}, ${feed.color}44)` }} />

                  <div style={{ padding: '20px 22px' }}>
                    {/* Header */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{
                        width: 44, height: 44, flexShrink: 0,
                        background: feed.color + '15', border: `1px solid ${feed.color}33`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 22,
                      }}>
                        {feed.emoji}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 3 }}>
                          <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.3rem', color: '#F0EDE6', letterSpacing: '.03em', lineHeight: 1 }}>
                            {feed.title}
                          </div>
                          {feed.badge && (
                            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, fontWeight: 700, padding: '2px 6px',
                              background: feed.color + '22', color: feed.color, letterSpacing: '.08em' }}>
                              {feed.badge}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563' }}>
                            <LiveDot color={feed.color} />{feed.update}
                          </span>
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#374151' }}>·</span>
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563' }}>{feed.count}</span>
                        </div>
                      </div>
                    </div>

                    {/* Description */}
                    <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.8, margin: '0 0 14px' }}>
                      {feed.desc}
                    </p>

                    {/* Tags */}
                    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 16 }}>
                      {feed.tags.map(t => (
                        <span key={t} style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, padding: '2px 6px',
                          background: 'rgba(255,255,255,.04)', border: '1px solid var(--border)', color: '#374151',
                          letterSpacing: '.06em', textTransform: 'uppercase' }}>
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* URL display */}
                    <div style={{
                      display: 'flex', gap: 0, alignItems: 'center',
                      background: 'rgba(0,0,0,.3)', border: '1px solid var(--border)',
                      marginBottom: 12, overflow: 'hidden',
                    }}>
                      <div style={{ flex: 1, padding: '8px 10px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        downrangeco.com{feed.url}
                      </div>
                      <CopyBtn text={fullUrl} />
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <a href={feed.url} target="_blank" rel="noreferrer"
                        className="sub-btn"
                        style={{ background: feed.color, color: '#000', border: 'none' }}>
                        Subscribe ↗
                      </a>
                      <button onClick={() => setActiveId(isActive ? null : feed.id)}
                        style={{ background: 'none', border: `1px solid ${feed.color}44`, color: feed.color, fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, padding: '6px 12px', cursor: 'pointer', transition: 'all .15s' }}
                        onMouseEnter={e => e.currentTarget.style.background = feed.color + '15'}
                        onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                        {isActive ? '▲ Hide' : '▼ Add to Reader'}
                      </button>
                    </div>

                    {/* Expanded reader buttons */}
                    {isActive && (
                      <div style={{ marginTop: 12, padding: '12px', background: 'rgba(0,0,0,.2)', border: `1px solid ${feed.color}22`, animation: 'slide-in .2s ease' }}>
                        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563', letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 8 }}>
                          Open in reader:
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {READERS.map(r => {
                            const href = r.url.startsWith('http')
                              ? r.url + encodeURIComponent(fullUrl)
                              : r.url + fullUrl
                            return (
                              <a key={r.name} href={href} target="_blank" rel="noreferrer"
                                style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, padding: '4px 10px',
                                  border: `1px solid ${r.color}55`, color: r.color, textDecoration: 'none',
                                  background: r.color + '08', transition: 'background .15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = r.color + '20'}
                                onMouseLeave={e => e.currentTarget.style.background = r.color + '08'}>
                                {r.name}
                              </a>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ── HOW RSS WORKS ── */}
          <div style={{ marginTop: 60, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            <div>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.6rem', color: '#F0EDE6', letterSpacing: '.04em', marginBottom: 16 }}>
                What is RSS?
              </div>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.9, marginBottom: 12 }}>
                RSS (Really Simple Syndication) is an open format that lets you follow websites without visiting them. Your RSS reader checks feeds periodically and shows you new content in one place — no algorithm, no ads, no engagement farming.
              </p>
              <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.9 }}>
                It's the fastest way to stay current on 2A news. Set it and forget it — articles come to you instead of you hunting for them.
              </p>
            </div>
            <div>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.6rem', color: '#F0EDE6', letterSpacing: '.04em', marginBottom: 16 }}>
                Recommended Readers
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { name: 'Feedly', url: 'https://feedly.com', desc: 'Best for desktop + mobile. Free tier covers most use cases.', platform: 'Web/Mobile' },
                  { name: 'NetNewsWire', url: 'https://netnewswire.com', desc: 'Free, fast, native Mac/iOS app. No account needed.', platform: 'Mac/iOS' },
                  { name: 'Inoreader', url: 'https://inoreader.com', desc: 'Advanced filtering and rule-based automation. Power users.', platform: 'Web/Mobile' },
                  { name: 'Reeder 5', url: 'https://reeder.app', desc: 'Beautiful native Mac and iOS reader. Syncs with Feedly.', platform: 'Mac/iOS' },
                ].map(r => (
                  <a key={r.name} href={r.url} target="_blank" rel="noreferrer"
                    style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '10px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', textDecoration: 'none', transition: 'border-color .15s' }}
                    onMouseEnter={e => e.currentTarget.style.borderColor = '#C8922A'}
                    onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: '#F0EDE6', marginBottom: 2 }}>{r.name}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#4b5563' }}>{r.desc}</div>
                    </div>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#374151', flexShrink: 0 }}>{r.platform}</span>
                    <span style={{ color: '#C8922A', fontSize: 14 }}>↗</span>
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── OPML BUNDLE ── */}
          <div style={{ marginTop: 40, padding: '24px 28px', background: 'rgba(200,146,42,.05)', border: '1px solid rgba(200,146,42,.25)', display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ fontSize: 32 }}>📦</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.3rem', color: '#F0EDE6', letterSpacing: '.04em', marginBottom: 4 }}>
                Import All Feeds at Once — OPML Bundle
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#6b7280', lineHeight: 1.7 }}>
                Download the OPML file to import all DownRange feeds into any RSS reader in one click. Works with Feedly, NetNewsWire, Inoreader, and all major readers.
              </div>
            </div>
            <a href="/feeds/opml" target="_blank" rel="noreferrer"
              style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase',
                background: '#C8922A', color: '#000', padding: '12px 24px', textDecoration: 'none', flexShrink: 0 }}>
              Download OPML ↓
            </a>
          </div>

          {/* ── USAGE POLICY ── */}
          <div style={{ marginTop: 24, padding: '16px 20px', border: '1px solid var(--border)', background: 'var(--bg2)' }}>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#C8922A', letterSpacing: '.1em', textTransform: 'uppercase', marginBottom: 8, fontWeight: 700 }}>
              Feed Usage Policy
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4b5563', lineHeight: 1.9 }}>
              These feeds are free for personal RSS reader use. Republishing full articles without attribution or commercial scraping is not permitted.
              For media or API partnerships, email <a href="mailto:dj@downrangeco.com" style={{ color: '#C8922A', textDecoration: 'none' }}>dj@downrangeco.com</a>.
              Feeds update every 15 minutes and are cached to keep response times fast.
            </div>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
