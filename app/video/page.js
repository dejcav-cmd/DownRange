import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import { fetchVideos, fetchBreakingAlerts } from '../../sanity/lib/client'


const SEED_VIDEOS = [
  { _id:'v1', title:'The Best AR-15 Build for Home Defense — Full Breakdown', youtubeId:'dQw4w9WgXcQ', videoId:'dQw4w9WgXcQ', channelName:'Garand Thumb', category:'review', duration:'24:18', viewCount:892000 },
  { _id:'v2', title:'Glock 43X MOS — 2,000 Round Torture Test', youtubeId:'3JIi6e3Ty3s', videoId:'3JIi6e3Ty3s', channelName:'Forgotten Weapons', category:'review', duration:'18:42', viewCount:445000 },
  { _id:'v3', title:'Red Flag Laws Explained — Know Your Rights', youtubeId:'fvFkN1JuC6A', videoId:'fvFkN1JuC6A', channelName:'Military Arms Channel', category:'news', duration:'12:05', viewCount:234000 },
  { _id:'v4', title:'Concealed Carry Fundamentals — Drawing from Holster', youtubeId:'9bZkp7q19f0', videoId:'9bZkp7q19f0', channelName:'InRange TV', category:'training', duration:'31:20', viewCount:556000 },
  { _id:'v5', title:'SIG P365XL vs Glock 43X — Which Is Actually Better?', youtubeId:'3tmd-ClpJxA', videoId:'3tmd-ClpJxA', channelName:'Paul Harrell', category:'review', duration:'22:47', viewCount:678000 },
  { _id:'v6', title:'ATF Rule Update — What It Means for You', youtubeId:'iik25wqIuFo', videoId:'iik25wqIuFo', channelName:'Iraqveteran8888', category:'news', duration:'8:33', viewCount:312000 },
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
          <div style={{ background: '#16191F', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden', border: '1px solid #1F2428', cursor: 'pointer' }}>
            <img src={thumb} alt={video.title} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.3)' }} />
            <div style={{ position: 'absolute', width: '64px', height: '64px', background: 'rgba(200,146,42,0.9)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#09090B' }}>▶</div>
          </div>
        </a>
        <div style={{ padding: '16px', background: '#111318', border: '1px solid #1F2428', borderTop: 'none' }}>
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
      style={{ display: 'flex', gap: '12px', background: '#111318', border: '1px solid #1F2428', padding: '12px', textDecoration: 'none', transition: 'border-color 0.2s' }}>
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
  const [videos, alerts] = await Promise.all([
    fetchVideos(20, cat).catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const featured = videos.find(v => v.featured) || videos[0]
  const queue = videos.filter(v => v._id !== featured?._id).slice(0, 4)
  const rest = videos.filter(v => v._id !== featured?._id).slice(4)

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="WATCH">
        <div className="container">
          <h1 className="page-hero-title">Watch</h1>
          <p className="page-hero-sub">Curated video from trusted firearms channels · Updated every 4 hours</p>
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

          {videos.length === 0 && (
            <div>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4B5563', letterSpacing: '0.12em', marginBottom: '20px', padding: '10px 16px', background: '#111318', border: '1px solid #1F2428' }}>
                ◈ Live video feed activates when YouTube API key is configured. Showing featured channels preview.
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                {SEED_VIDEOS.map(v => <VideoCard key={v._id} video={v} />)}
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </>
  )
}
