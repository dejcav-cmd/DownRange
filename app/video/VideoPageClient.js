'use client'
import { useState, useCallback } from 'react'
import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'

const CATS = [
  { label: 'All',      val: null },
  { label: 'Reviews',  val: 'review' },
  { label: 'Training', val: 'training' },
  { label: 'News',     val: 'news' },
  { label: 'Builds',   val: 'build' },
]

const CAT_C = { review:'#C8922A', training:'#22C55E', news:'#3B82F6', build:'#A855F7', interview:'#F97316' }

function fmt(n) {
  if (!n) return ''
  if (n >= 1000000) return (n/1000000).toFixed(1) + 'M views'
  if (n >= 1000)    return (n/1000).toFixed(0) + 'K views'
  return n + ' views'
}

// ── Small queue item (sidebar) ──────────────────────────────────────────────
function QueueItem({ video, active, onClick }) {
  const thumb = video.thumbnail || video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`
  return (
    <div onClick={onClick} style={{
      display: 'flex', gap: 10, padding: '8px 10px', cursor: 'pointer',
      background: active ? 'rgba(200,146,42,.12)' : 'transparent',
      borderLeft: `3px solid ${active ? '#C8922A' : 'transparent'}`,
      transition: 'all .15s',
    }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,.04)' }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent' }}>
      <div style={{ width: 100, flexShrink: 0, aspectRatio: '16/9', position: 'relative', overflow: 'hidden', background: '#111' }}>
        <img src={thumb} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {video.duration && (
          <div style={{ position: 'absolute', bottom: 3, right: 3, background: 'rgba(0,0,0,.85)',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, padding: '1px 4px', color: '#fff' }}>
            {video.duration}
          </div>
        )}
        {active && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(200,146,42,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: '#C8922A', fontSize: 14 }}>▶</span>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 13, fontWeight: 600,
          color: active ? '#C8922A' : '#F0EDE6', lineHeight: 1.25, marginBottom: 3,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {video.title}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#6B7280' }}>
          {video.channelName}
        </div>
      </div>
    </div>
  )
}

// ── Grid card ──────────────────────────────────────────────────────────────
function VideoCard({ video, onClick }) {
  const thumb = video.thumbnail || video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`
  const catColor = CAT_C[video.category] || '#9CA3AF'
  return (
    <div onClick={onClick} style={{ cursor: 'pointer', background: '#111318', border: '1px solid var(--border)', transition: 'border-color .15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = '#C8922A'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
      <div style={{ position: 'relative', aspectRatio: '16/9', overflow: 'hidden', background: '#0a0b0c' }}>
        <img src={thumb} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: .85, transition: 'opacity .2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = .85} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s' }}
          onMouseEnter={e => e.currentTarget.style.opacity = 1}
          onMouseLeave={e => e.currentTarget.style.opacity = 0}>
          <div style={{ width: 44, height: 44, background: 'rgba(200,146,42,.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, color: '#09090B' }}>▶</div>
        </div>
        {video.duration && (
          <div style={{ position: 'absolute', bottom: 6, right: 6, background: 'rgba(0,0,0,.85)',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, padding: '2px 6px', color: '#fff' }}>
            {video.duration}
          </div>
        )}
        {video.category && (
          <div style={{ position: 'absolute', top: 6, left: 6, background: catColor + 'dd',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 8, padding: '2px 6px', color: '#000', fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase' }}>
            {video.category}
          </div>
        )}
      </div>
      <div style={{ padding: '10px 12px' }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 600,
          color: '#F0EDE6', lineHeight: 1.25, marginBottom: 4,
          overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
          {video.title}
        </div>
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#6B7280' }}>
          {video.channelName}{video.viewCount ? ' · ' + fmt(video.viewCount) : ''}
        </div>
      </div>
    </div>
  )
}

export default function VideoPageClient({ videos = [], alerts = [] }) {
  const [active,  setActive]  = useState(videos[0] || null)
  const [cat,     setCat]     = useState(null)
  const [autoplay,setAutoplay]= useState(true)

  const filtered = cat ? videos.filter(v => v.category === cat) : videos
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

  const embedUrl = active
    ? 'https://www.youtube.com/embed/' + active.videoId + '?autoplay=1&rel=0&modestbranding=1&color=white'
    : null

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* ── PLAYER SECTION ── */}
      {active && (
        <div style={{ background: '#09090B', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 1400, padding: '0 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 2, paddingTop: 20 }}>

              {/* ── Main player ── */}
              <div>
                {/* YouTube embed */}
                <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', background: '#000', marginBottom: 0 }}>
                  <iframe
                    key={active.videoId}
                    src={embedUrl}
                    title={active.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    allowFullScreen
                    style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                  {/* Fallback overlay — YouTube itself shows an error inside the iframe for bad IDs, this just styles the container */}
                </div>

                {/* Video info bar */}
                <div style={{ background: '#111318', border: '1px solid var(--border)', borderTop: 'none', padding: '14px 18px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.4rem', color: '#F0EDE6', letterSpacing: '.04em', lineHeight: 1.1, marginBottom: 6 }}>
                        {active.title}
                      </div>
                      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#C8922A', fontWeight: 700 }}>
                          {active.channelName}
                        </span>
                        {active.viewCount > 0 && (
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#6B7280' }}>
                            {fmt(active.viewCount)}
                          </span>
                        )}
                        {active.duration && (
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4B5563' }}>
                            {active.duration}
                          </span>
                        )}
                        {active.category && (
                          <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, fontWeight: 700,
                            color: CAT_C[active.category] || '#9CA3AF', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                            {active.category}
                          </span>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <label style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4B5563', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={autoplay} onChange={e => setAutoplay(e.target.checked)} />
                        Autoplay
                      </label>
                      <a href={'https://www.youtube.com/watch?v=' + active.videoId} target="_blank" rel="noreferrer"
                        style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#6B7280', textDecoration: 'none',
                          padding: '4px 10px', border: '1px solid #374151', transition: 'all .15s' }}
                        onMouseEnter={e => { e.currentTarget.style.color = '#F0EDE6'; e.currentTarget.style.borderColor = '#6B7280' }}
                        onMouseLeave={e => { e.currentTarget.style.color = '#6B7280'; e.currentTarget.style.borderColor = '#374151' }}>
                        YouTube ↗
                      </a>
                      {queue.length > 0 && (
                        <button onClick={playNext}
                          style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#C8922A',
                            background: 'none', border: '1px solid rgba(200,146,42,.4)', padding: '4px 10px', cursor: 'pointer', transition: 'all .15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(200,146,42,.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'none'}>
                          Next ▶
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Sidebar queue ── */}
              <div style={{ background: '#111318', border: '1px solid var(--border)', overflowY: 'auto', maxHeight: 'calc(56.25vw * 0.75 + 60px)', minHeight: 400 }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#C8922A', fontWeight: 700, letterSpacing: '.08em' }}>
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
      <div style={{ padding: '32px 0 60px', background: 'var(--bg)' }}>
        <div className="container">

          {/* Category filter */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4B5563', letterSpacing: '.08em' }}>FILTER:</span>
            {CATS.map(c => (
              <button key={c.val || 'all'} onClick={() => setCat(c.val)}
                style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, padding: '5px 14px', cursor: 'pointer',
                  background: cat === c.val ? '#C8922A' : 'transparent',
                  color:      cat === c.val ? '#000' : '#6B7280',
                  border:     `1px solid ${cat === c.val ? '#C8922A' : '#374151'}`,
                  transition: 'all .15s', letterSpacing: '.06em', textTransform: 'uppercase' }}>
                {c.label}
              </button>
            ))}
          </div>

          {/* Section header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
            <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.4rem', color: '#F0EDE6', letterSpacing: '.05em' }}>
              {active ? 'More Videos' : 'All Videos'}
            </div>
            <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#4B5563' }}>
              {filtered.length} videos
            </span>
          </div>

          {/* Video grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {filtered.map(v => (
              <VideoCard key={v._id} video={v} onClick={() => play(v)} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div style={{ textAlign: 'center', padding: '60px 0', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#4B5563' }}>
              No videos in this category yet.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
