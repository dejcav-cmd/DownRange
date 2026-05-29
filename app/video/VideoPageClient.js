'use client'
import { useState, useCallback, useEffect, useMemo } from 'react'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'

const PER_PAGE = 24  // videos per page in browse grid

const CATS = [
  { label: 'All',         val: null },
  { label: 'Reviews',     val: 'review' },
  { label: 'Training',    val: 'training' },
  { label: 'Builds',      val: 'build' },
  { label: 'News',        val: 'news' },
  { label: 'Competition', val: 'competition' },
  { label: 'History',     val: 'history' },
  { label: 'Ammo',        val: 'ammo' },
  { label: '🦌 Hunting',  val: 'hunting' },
]

const SORT_OPTS = [
  { label: '📅 Newest', val: 'newest' },
  { label: '★ Featured', val: 'featured' },
  { label: '🔤 A–Z', val: 'alpha' },
]

const CAT_C = { review:'#C8922A', training:'#22C55E', news:'#3B82F6', build:'#A855F7', interview:'#F97316', competition:'#06B6D4', history:'#84CC16', ammo:'#F59E0B', comparison:'#EC4899', hunting:'#65A30D' }

function fmt(n) {
  if (!n) return ''
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M views'
  if (n >= 1000)    return (n/1000).toFixed(0) + 'K views'
  return n + ' views'
}

function QueueItem({ video, active, onClick }) {
  const thumb = video.thumbnail || video.thumbnailUrl || 'https://i.ytimg.com/vi/' + video.videoId + '/mqdefault.jpg'
  return (
    <div onClick={onClick} style={{ display:'flex', gap:10, padding:'8px 10px', cursor:'pointer',
      background: active ? 'rgba(200,146,42,.12)' : 'transparent',
      borderLeft: '3px solid ' + (active ? '#C8922A' : 'transparent'), transition:'all .15s' }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = active ? 'rgba(200,146,42,.12)' : 'transparent' }}>
      <div style={{ width:100, flexShrink:0, aspectRatio:'16/9', position:'relative', overflow:'hidden', background:'#111' }}>
        <img src={thumb} alt={video.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
        {video.duration && (
          <div style={{ position:'absolute', bottom:3, right:3, background:'rgba(0,0,0,.85)',
            fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'1px 4px', color:'#fff' }}>
            {video.duration}
          </div>
        )}
        {active && (
          <div style={{ position:'absolute', inset:0, background:'rgba(200,146,42,.3)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <span style={{ color:'#C8922A', fontSize:14 }}>▶</span>
          </div>
        )}
      </div>
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:600,
          color: active ? '#C8922A' : '#F0EDE6', lineHeight:1.25, marginBottom:3,
          overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {video.title}
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6B7280' }}>
          {video.channelName}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          {isNewVideo(video.publishedAt || video.addedAt) && (
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:'.1em',
              background:'rgba(34,197,94,.15)', color:'#22c55e', border:'1px solid rgba(34,197,94,.4)',
              padding:'1px 5px', flexShrink:0 }}>NEW</span>
          )}
          {formatVideoDate(video.publishedAt || video.addedAt) && (
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151' }}>
              {formatVideoDate(video.publishedAt || video.addedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// Format publish date for display
function formatVideoDate(dateStr) {
  if (!dateStr) return null
  const d    = new Date(dateStr)
  if (isNaN(d)) return null
  const now  = Date.now()
  const diff = now - d.getTime()
  const hrs  = diff / 3600000
  const days = diff / 86400000
  if (hrs  < 1)   return 'Just now'
  if (hrs  < 24)  return Math.floor(hrs)  + 'h ago'
  if (days < 7)   return Math.floor(days) + 'd ago'
  return d.toLocaleDateString('en-US', { month:'short', day:'numeric' })
}

// A video is NEW if published within the last 24 hours
function isNewVideo(dateStr) {
  if (!dateStr) return false
  return (Date.now() - new Date(dateStr).getTime()) < 86400000
}

function VideoCard({ video, onClick }) {
  const thumb = video.thumbnail || video.thumbnailUrl || 'https://i.ytimg.com/vi/' + (video.videoId || video.youtubeId) + '/hqdefault.jpg'
  const catColor = CAT_C[video.category] || '#9CA3AF'
  return (
    <div onClick={onClick} style={{ cursor:'pointer', background:'#111318', border:'1px solid var(--border)', transition:'border-color .15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#C8922A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ position:'relative', aspectRatio:'16/9', overflow:'hidden', background:'#0a0b0c' }}>
        <img src={thumb} alt={video.title} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.85 }} />
        <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', opacity:0, transition:'opacity .2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
          <div style={{ width:44, height:44, background:'rgba(200,146,42,.9)', borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, color:'#09090B' }}>▶</div>
        </div>
        {video.duration && (
          <div style={{ position:'absolute', bottom:6, right:6, background:'rgba(0,0,0,.85)',
            fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'2px 6px', color:'#fff' }}>
            {video.duration}
          </div>
        )}
        {video.category && (
          <div style={{ position:'absolute', top:6, left:6, background:catColor + 'dd',
            fontFamily:"'IBM Plex Mono',monospace", fontSize:8, padding:'2px 6px', color:'#000', fontWeight:700, letterSpacing:'.06em', textTransform:'uppercase' }}>
            {video.category}
          </div>
        )}
      </div>
      <div style={{ padding:'10px 12px' }}>
        <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:600,
          color:'#F0EDE6', lineHeight:1.25, marginBottom:4,
          overflow:'hidden', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical' }}>
          {video.title}
        </div>
        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6B7280' }}>
          {video.channelName}{video.viewCount ? ' · ' + fmt(video.viewCount) : ''}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6, marginTop:4 }}>
          {isNewVideo(video.publishedAt || video.addedAt) && (
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, letterSpacing:'.1em',
              background:'rgba(34,197,94,.15)', color:'#22c55e', border:'1px solid rgba(34,197,94,.4)',
              padding:'1px 5px', flexShrink:0 }}>NEW</span>
          )}
          {formatVideoDate(video.publishedAt || video.addedAt) && (
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151' }}>
              {formatVideoDate(video.publishedAt || video.addedAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VideoPageClient({ videos = [], alerts = [], initialCat = null, initialSort = 'newest', initialSearch = null }) {
  const [active,   setActive]   = useState(null)
  const [cat,      setCat]      = useState(initialCat)
  const [sort,     setSort]     = useState(initialSort)
  const [search,   setSearch]   = useState(initialSearch || '')
  const [autoplay, setAutoplay] = useState(false)
  const [page,     setPage]     = useState(1)

  // Set first video as active on mount
  useEffect(() => {
    if (videos.length > 0) setActive(videos[0])
  }, [])

  // Apply filters & sort
  const applyFilters = useCallback((vids, catFilter, sortOpt, searchQ) => {
    let result = [...vids]
    if (catFilter) result = result.filter(v => v.category === catFilter)
    if (searchQ) {
      const q = searchQ.toLowerCase()
      result = result.filter(v =>
        (v.title || '').toLowerCase().includes(q) ||
        (v.channelName || '').toLowerCase().includes(q) ||
        (v.description || '').toLowerCase().includes(q)
      )
    }
    if (sortOpt === 'featured') result = [...result.filter(v => v.featured), ...result.filter(v => !v.featured)]
    else if (sortOpt === 'alpha') result.sort((a, b) => (a.title || '').localeCompare(b.title || ''))
    else result.sort((a, b) => new Date(b.publishedAt || b.addedAt || 0) - new Date(a.publishedAt || a.addedAt || 0))
    return result
  }, [])

  const filtered   = applyFilters(videos, cat, sort, search)
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
  const paged      = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE)
  const queue    = active ? filtered.filter(v => v._id !== active._id) : filtered.slice(1)

  const play = useCallback((video) => {
    setActive(video)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const playNext = useCallback(() => {
    if (!active || queue.length === 0) return
    const idx = queue.findIndex(v => v._id === active._id)
    play(queue[idx + 1] || queue[0])
  }, [active, queue, play])

  function buildUrl(overrides) {
    const params = {}
    const current = { cat, sort, q: search }
    const merged = { ...current, ...overrides }
    if (merged.cat) params.cat = merged.cat
    if (merged.sort && merged.sort !== 'newest') params.sort = merged.sort
    if (merged.q) params.q = merged.q
    const qs = new URLSearchParams(params).toString()
    return '/video' + (qs ? '?' + qs : '')
  }

  const embedUrl = active
    ? 'https://www.youtube.com/embed/' + active.videoId + '?autoplay=0&rel=0&modestbranding=1&color=white'
    : null

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* ── PAGE HERO ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', padding:'52px 0 36px', position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.07) 0%, transparent 55%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', right:0, top:0, bottom:0, width:'50%', overflow:'hidden', opacity:0.04, pointerEvents:'none' }}>
          <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'18vw', color:'var(--gold)', lineHeight:0.85, textAlign:'right', paddingRight:'20px', paddingTop:'10px' }}>VIDEO</div>
        </div>
        <div className="container" style={{ position:'relative' }}>
          <div style={{ maxWidth:640 }}>
            <div style={{ display:'flex', gap:'8px', marginBottom:'16px', flexWrap:'wrap', alignItems:'center' }}>
              <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'11px', fontWeight:700, letterSpacing:'0.2em', padding:'3px 12px' }}>FIREARMS VIDEO</span>
              <span style={{ display:'flex', alignItems:'center', gap:5, background:'#1a0a00', color:'#C8922A', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', fontWeight:700, padding:'3px 10px', border:'1px solid rgba(200,146,42,.3)' }}>
                ▶ {videos.length} VIDEOS
              </span>
            </div>
            <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(2.8rem,6vw,4.5rem)', color:'var(--text)', letterSpacing:'0.02em', lineHeight:0.95, marginBottom:'14px' }}>
              Firearms &amp; Training<br />
              <span style={{ color:'var(--gold)' }}>Video Library</span>
            </h1>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'16px', color:'var(--text-muted)', lineHeight:1.7 }}>
              Reviews, training, builds, and tactical education from trusted channels. Updated every 4 hours.
            </p>
          </div>
        </div>
      </div>

      {/* ── STICKY NAV BAR — matches News pattern ── */}
      <div style={{ background:'var(--bg2)', borderBottom:'1px solid var(--border)', position:'sticky', top:'60px', zIndex:20 }}>
        <div className="container">
          <div style={{ display:'flex', gap:0, overflowX:'auto', justifyContent:'space-between', alignItems:'stretch' }}>
            {/* Category tabs */}
            <div style={{ display:'flex', gap:0, overflowX:'auto' }}>
              {CATS.map(c => (
                <a key={c.val || 'all'} href={c.val ? buildUrl({ cat: c.val, q: search }) : buildUrl({ cat: null, q: search })}
                  style={{ display:'inline-flex', alignItems:'center', padding:'12px 16px',
                    fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px',
                    borderBottom: '2px solid ' + ((cat===c.val || (!cat && !c.val)) ? 'var(--gold)' : 'transparent'),
                    color: (cat===c.val || (!cat && !c.val)) ? 'var(--gold)' : 'var(--text-dim)',
                    textDecoration:'none', whiteSpace:'nowrap', letterSpacing:'0.05em', transition:'color 0.15s' }}>
                  {c.label}
                </a>
              ))}
            </div>

            {/* Sort */}
            <div style={{ display:'flex', gap:'5px', alignItems:'center', padding:'0 0 0 12px', borderLeft:'1px solid var(--border)', flexShrink:0 }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563' }}>SORT:</span>
              {SORT_OPTS.map(({ val, label }) => (
                <a key={val} href={buildUrl({ sort: val })}
                  style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', padding:'4px 10px',
                    border:'1px solid var(--border)',
                    color: sort === val ? '#C8922A' : '#4B5563',
                    textDecoration:'none',
                    background: sort === val ? '#C8922A20' : 'transparent' }}>
                  {label}
                </a>
              ))}
            </div>

            {/* Search */}
            <form action="/video" method="get" style={{ display:'flex', alignItems:'center', gap:6, padding:'0 0 0 12px', borderLeft:'1px solid var(--border)' }}>
              {cat && <input type="hidden" name="cat" value={cat} />}
              {sort && sort !== 'newest' && <input type="hidden" name="sort" value={sort} />}
              <input
                type="search" name="q"
                defaultValue={search || ''}
                placeholder="Search videos, channels…"
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, background:'var(--bg)',
                  border:'1px solid var(--border)', color:'var(--text)', padding:'5px 10px', width:180, outline:'none' }}
              />
              <button type="submit" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, background:'var(--gold)', color:'#000', border:'none', padding:'6px 12px', cursor:'pointer', fontWeight:700, flexShrink:0 }}>⌕</button>
              {search && <a href={buildUrl({ q: null })} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6b7280', textDecoration:'none', flexShrink:0 }}>✕</a>}
            </form>
          </div>
        </div>
      </div>

      {/* Search context */}
      {search && (
        <div style={{ background:'rgba(200,146,42,.05)', borderBottom:'1px solid var(--border)', padding:'10px 0' }}>
          <div className="container" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#6b7280' }}>
            {filtered.length} result{filtered.length !== 1 ? 's' : ''} for <span style={{ color:'var(--gold)' }}>"{search}"</span>
            {' — '}<a href="/video" style={{ color:'#6b7280' }}>Clear search</a>
          </div>
        </div>
      )}

      {/* ── PLAYER SECTION ── */}
      {active && (
        <div style={{ background:'#09090B', borderBottom:'1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth:1400, padding:'0 20px' }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:2, paddingTop:20 }}>
              <div>
                <div style={{ position:'relative', width:'100%', paddingTop:'56.25%', background:'#000', marginBottom:0 }}>
                  <iframe
                    key={active.videoId}
                    src={embedUrl}
                    title={active.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position:'absolute', inset:0, width:'100%', height:'100%', border:'none' }}
                  />
                </div>
                <div style={{ background:'#111318', border:'1px solid var(--border)', borderTop:'none', padding:'14px 18px' }}>
                  <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:16, flexWrap:'wrap' }}>
                    <div style={{ flex:1 }}>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'#F0EDE6', letterSpacing:'.04em', lineHeight:1.1, marginBottom:6 }}>
                        {active.title}
                      </div>
                      <div style={{ display:'flex', gap:12, flexWrap:'wrap', alignItems:'center' }}>
                        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#C8922A', fontWeight:700 }}>{active.channelName}</span>
                        {active.viewCount > 0 && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6B7280' }}>{fmt(active.viewCount)}</span>}
                        {active.duration && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563' }}>{active.duration}</span>}
                        {active.category && (
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700,
                            color: CAT_C[active.category] || '#9CA3AF', letterSpacing:'.06em', textTransform:'uppercase' }}>
                            {active.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                      <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563', display:'flex', alignItems:'center', gap:6, cursor:'pointer' }}>
                        <input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} />
                        Autoplay
                      </label>
                      <a href={'https://www.youtube.com/watch?v=' + active.videoId} target="_blank" rel="noreferrer"
                        style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6B7280', textDecoration:'none', padding:'4px 10px', border:'1px solid #374151' }}>
                        YouTube ↗
                      </a>
                      {queue.length > 0 && (
                        <button onClick={playNext}
                          style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A',
                            background:'none', border:'1px solid rgba(200,146,42,.4)', padding:'4px 10px', cursor:'pointer' }}>
                          Next ▶
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Queue */}
              <div style={{ background:'#111318', border:'1px solid var(--border)', overflowY:'auto', maxHeight:'calc(56.25vw * 0.75 + 60px)', minHeight:400 }}>
                <div style={{ padding:'10px 14px', borderBottom:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                  <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', fontWeight:700, letterSpacing:'.08em' }}>
                    UP NEXT — {queue.length} VIDEOS
                  </span>
                </div>
                {queue.slice(0, 20).map(v => (
                  <QueueItem key={v._id} video={v} active={false} onClick={() => play(v)} />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── BROWSE SECTION ── */}
      <div style={{ padding:'8px 0 60px', background:'var(--bg)' }}>
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:18 }}>
            <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'#F0EDE6', letterSpacing:'.05em' }}>
              {search ? 'Search Results' : cat ? cat.charAt(0).toUpperCase() + cat.slice(1) + ' Videos' : active ? 'More Videos' : 'All Videos'}
            </div>
            <div style={{ flex:1, height:1, background:'var(--border)' }} />
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563' }}>{filtered.length} videos</span>
          </div>

          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12 }}>
            {paged.map(v => (
              <VideoCard key={v._id || v.videoId} video={v} onClick={() => play(v)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign:'center', padding:'60px 0', fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#4B5563' }}>
              {search ? 'No videos match "' + search + '"' : 'No videos in this category yet.'}
            </div>
          )}

          {/* ── PAGINATION ── */}
          {totalPages > 1 && (
            <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:36, paddingBottom:8 }}>
              <button
                onClick={() => { setPage(p => Math.max(1, p-1)); window.scrollTo({top:0,behavior:'smooth'}) }}
                disabled={page === 1}
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 16px',
                  background:'none', border:'1px solid var(--border)', color: page===1 ? '#374151' : '#F0EDE6',
                  cursor: page===1 ? 'not-allowed' : 'pointer', transition:'border-color .15s' }}
                onMouseEnter={e => { if(page>1) e.currentTarget.style.borderColor='#C8922A' }}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
              >← Prev</button>

              {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                // Show pages around current
                let p
                if (totalPages <= 7) {
                  p = i + 1
                } else if (page <= 4) {
                  p = i + 1
                } else if (page >= totalPages - 3) {
                  p = totalPages - 6 + i
                } else {
                  p = page - 3 + i
                }
                return (
                  <button key={p} onClick={() => { setPage(p); window.scrollTo({top:0,behavior:'smooth'}) }}
                    style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, minWidth:36, padding:'8px',
                      background: p===page ? '#C8922A' : 'none',
                      border: p===page ? '1px solid #C8922A' : '1px solid var(--border)',
                      color: p===page ? '#000' : '#F0EDE6',
                      cursor:'pointer', fontWeight: p===page ? 700 : 400 }}>
                    {p}
                  </button>
                )
              })}

              <button
                onClick={() => { setPage(p => Math.min(totalPages, p+1)); window.scrollTo({top:0,behavior:'smooth'}) }}
                disabled={page === totalPages}
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'8px 16px',
                  background:'none', border:'1px solid var(--border)', color: page===totalPages ? '#374151' : '#F0EDE6',
                  cursor: page===totalPages ? 'not-allowed' : 'pointer', transition:'border-color .15s' }}
                onMouseEnter={e => { if(page<totalPages) e.currentTarget.style.borderColor='#C8922A' }}
                onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
              >Next →</button>

              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563', marginLeft:8 }}>
                {((page-1)*PER_PAGE)+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
              </span>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
