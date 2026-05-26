import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import { fetchVideos, fetchBreakingAlerts } from '../../sanity/lib/client'


// Real verified firearms video IDs — used as fallback when YouTube API is unavailable
const SEED_VIDEOS = [
  { _id:'v1', title:'How a Neutral Country Built One of the Best Combat Rifles Ever', videoId:'IdCJNilFjVM', channelName:'Garand Thumb', category:'review', viewCount:0, thumbnail:'https://img.youtube.com/vi/IdCJNilFjVM/hqdefault.jpg', url:'https://www.youtube.com/watch?v=IdCJNilFjVM' },
  { _id:'v2', title:'Garand Thumb Roasts Our Guns', videoId:'GYifZbidKw0', channelName:'Garand Thumb', category:'review', viewCount:0, thumbnail:'https://img.youtube.com/vi/GYifZbidKw0/hqdefault.jpg', url:'https://www.youtube.com/watch?v=GYifZbidKw0' },
  { _id:'v3', title:'The Best Handgun For You', videoId:'XtpGpnWkSgU', channelName:'Garand Thumb', category:'review', viewCount:0, thumbnail:'https://img.youtube.com/vi/XtpGpnWkSgU/hqdefault.jpg', url:'https://www.youtube.com/watch?v=XtpGpnWkSgU' },
  { _id:'v4', title:'Garand Thumbs Favorite Guns — Inside the Armory', videoId:'4qLAOsm5vuE', channelName:'Classic Firearms', category:'review', viewCount:0, thumbnail:'https://img.youtube.com/vi/4qLAOsm5vuE/hqdefault.jpg', url:'https://www.youtube.com/watch?v=4qLAOsm5vuE' },
  { _id:'v5', title:"Garand Thumb's Coolest Guns (Top Five)", videoId:'YEW4U9DUtrw', channelName:'Classic Firearms', category:'review', viewCount:0, thumbnail:'https://img.youtube.com/vi/YEW4U9DUtrw/hqdefault.jpg', url:'https://www.youtube.com/watch?v=YEW4U9DUtrw' },
]


export const metadata = { title: 'Video — DownRange', description: 'Firearms video reviews, training, news, and interviews from trusted channels.' }
export const revalidate = 7200

const CATS = [
  { label: 'All', val: null },
  { label: 'Reviews', val: 'review' },
  { label: 'Training', val: 'training' },
  { label: 'News', val: 'news' },
  { label: 'Interviews', val: 'interview' },
  { label: 'Match', val: 'match' },
]

function VideoCard({ video, large = false }) {
  const ytUrl = `https://www.youtube.com/watch?v=${video.videoId}`
  const thumb = video.thumbnailUrl || `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`

  if (large) {
    return (
      <div>
        <a href={ytUrl} target="_blank" rel="noreferrer" style={{ display: 'block', textDecoration: 'none' }}>
          <div style={{ background: '#16191F', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }}>
            <img src={thumb} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            <div style={{ position: 'absolute', width: '64px', height: '64px', background: 'rgba(200,146,42,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#09090B' }}>▶</div>
          </div>
        </a>
        <div style={{ padding: '16px', background: '#111318', border: '1px solid var(--border)', borderTop: 'none' }}>
          <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.2, marginBottom: '6px' }}>{video.title}</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280' }}>
            {video.channelName} · {video.duration} · {video.viewCount?.toLocaleString()} views
          </div>
        </div>
      </div>
    )
  }

  return (
    <a href={ytUrl} target="_blank" rel="noreferrer"
      style={{ display: 'flex', gap: '12px', background: '#111318', border: '1px solid var(--border)', padding: '12px', textDecoration: 'none', transition: 'border-color 0.2s' }}>
      <div style={{ width: '80px', flexShrink: 0, height: '60px', background: '#16191F', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <img src={thumb} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        {video.duration && (
          <div style={{ position: 'absolute', bottom: '3px', right: '3px', background: 'rgba(0,0,0,0.8)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', padding: '1px 4px', color: '#fff' }}>{video.duration}</div>
        )}
      </div>
      <div>
        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.2, marginBottom: '4px' }}>{video.title}</div>
        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280' }}>{video.channelName} · {video.viewCount?.toLocaleString()} views</div>
      </div>
    </a>
  )
}

export default async function VideoPage({ searchParams }) {
  const cat = searchParams?.cat || null
  const [sanityVideos, ytResult, alerts] = await Promise.all([
    fetchVideos(20, cat).catch(() => []),
    fetch('https://downrangeco.com/api/youtube?limit=16', { next: { revalidate: 3600 } })
      .then(r => r.json()).then(d => d.videos || []).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])
  const seen = new Set()
  const merged = [...sanityVideos, ...ytResult].filter(v => {
    const id = v.videoId || v._id
    if (seen.has(id)) return false
    seen.add(id); return true
  })
  const videos = cat ? merged.filter(v => v.category === cat) : merged
  const displayVideos = videos.length > 0 ? videos : SEED_VIDEOS
  const featured = displayVideos.find(v => v.featured) || displayVideos[0]
  const queue = displayVideos.filter(v => v._id !== featured?._id).slice(0, 4)
  const rest = displayVideos.filter(v => v._id !== featured?._id).slice(4)
  const isLive = videos.length > 0

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="WATCH">
        <div className="container">
          <h1 className="page-hero-title">Watch</h1>
          <p className="page-hero-sub">YouTube suppresses firearm content. We surface it. Updated every 4 hours.</p>
        </div>
      </div>

      <div style={{ padding: '32px 0' }}>
        <div className="container">
          <div className="filter-tabs">
            {CATS.map(c => (
              <a key={c.val || 'all'} href={c.val ? `/video?cat=${c.val}` : '/video'}
                className={`filter-tab ${(cat === c.val || (!cat && !c.val)) ? 'active' : ''}`}>
                {c.label}
              </a>
            ))}
          </div>

          {/* Featured + queue */}
          {/* Always shows — live from Sanity or seed data */}
          {featured && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2px', marginBottom: '48px' }}>
              <VideoCard video={featured} large />
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                {queue.map(v => <VideoCard key={v._id} video={v} />)}
              </div>
            </div>
          )}

          {/* More videos */}
          {rest.length > 0 && (
            <>
              <div className="section-header">
                <h2 className="section-title">More Videos</h2>
                <div className="section-rule" />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                {rest.map(v => (
                  <a key={v._id} href={`https://youtube.com/watch?v=${v.videoId}`} target="_blank" rel="noreferrer" style={{ textDecoration: 'none' }}>
                    <div className="card" style={{ overflow: 'hidden' }}>
                      <div style={{ position: 'relative', aspectRatio: '16/9' }}>
                        <img src={v.thumbnailUrl || `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`}
                          alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }} />
                        {v.duration && <div style={{ position: 'absolute', bottom: '6px', right: '6px', background: 'rgba(0,0,0,0.8)', fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', padding: '2px 6px', color: '#fff' }}>{v.duration}</div>}
                      </div>
                      <div style={{ padding: '12px' }}>
                        <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '14px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.25 }}>{v.title}</div>
                        <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>{v.channelName}</div>
                      </div>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}

          {!isLive && (
            <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: 'var(--text-dim)', padding: '8px 14px', background: 'var(--bg2)', border: '1px solid var(--border)', marginTop: '24px' }}>
              ◈ Live video feed activates when YouTube API key is configured in Vercel env vars.
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
