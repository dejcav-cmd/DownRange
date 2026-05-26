import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'Live Deals — DownRange', description: 'Best firearms, ammo and gear deals aggregated from top sources.' }
export const revalidate = 1800

function timeAgo(ts) {
  const d = Date.now() - ts
  const m = Math.floor(d/60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m/60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h/24)}d ago`
}

const FLAIR_COLORS = {
  Handgun:'#60A5FA', Rifle:'#34D399', Shotgun:'#FBBF24',
  Ammo:'#C8922A', Accessories:'#C084FC', 'AR-15':'#34D399',
  Other:'#9CA3AF', Pistol:'#60A5FA',
}

async function fetchRedditDeals() {
  try {
    const res = await fetch('https://www.reddit.com/r/gundeals/hot.json?limit=30', {
      headers: { 'User-Agent': 'DownRange/1.0' },
      next: { revalidate: 1800 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data.children
      .filter(p => !p.data.stickied && p.data.title)
      .map(p => ({
        id:       p.data.id,
        title:    p.data.title,
        url:      p.data.url,
        score:    p.data.score,
        comments: p.data.num_comments,
        created:  p.data.created_utc * 1000,
        flair:    p.data.link_flair_text,
        source:   'r/gundeals',
        domain:   p.data.domain,
      }))
  } catch { return [] }
}

async function fetchAmmoLandDeals() {
  try {
    const Parser = (await import('rss-parser')).default
    const parser = new Parser({ timeout: 5000 })
    const feed = await parser.parseURL('https://www.ammoland.com/category/guns/ammo/feed/')
    return feed.items.slice(0, 15).map((item, i) => ({
      id:       'ammoland-' + i,
      title:    item.title,
      url:      item.link,
      score:    null,
      comments: null,
      created:  item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
      flair:    'Ammo',
      source:   'AmmoLand',
      domain:   'ammoland.com',
    }))
  } catch { return [] }
}

async function fetchGunDealsRSS() {
  try {
    const Parser = (await import('rss-parser')).default
    const parser = new Parser({ timeout: 5000 })
    const feed = await parser.parseURL('https://www.guns.com/feed')
    return feed.items.slice(0, 10).map((item, i) => ({
      id:       'guns-' + i,
      title:    item.title,
      url:      item.link,
      score:    null,
      comments: null,
      created:  item.pubDate ? new Date(item.pubDate).getTime() : Date.now(),
      flair:    'Firearms',
      source:   'Guns.com',
      domain:   'guns.com',
    }))
  } catch { return [] }
}

const SOURCE_COLORS = {
  'r/gundeals': '#FF4500',
  'AmmoLand':   '#C8922A',
  'Guns.com':   '#60A5FA',
  'Firearms':   '#34D399',
}

export default async function DealsPage() {
  const [reddit, ammoland, gunscom, alerts] = await Promise.all([
    fetchRedditDeals(),
    fetchAmmoLandDeals(),
    fetchGunDealsRSS(),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  // Merge all, sort by newest
  const all = [...reddit, ...ammoland, ...gunscom]
    .sort((a, b) => b.created - a.created)

  const total = all.length

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />
      <div className="page-hero" data-title="DEALS">
        <div className="container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#34D399' }}>● LIVE</span>
            <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4B5563' }}>Updates every 30 minutes</span>
          </div>
          <h1 className="page-hero-title">Live Deals</h1>
          <p className="page-hero-sub">{total} deals aggregated · r/gundeals · AmmoLand · Guns.com · Sorted by newest</p>
        </div>
      </div>

      <div style={{ padding: '40px 0' }}>
        <div className="container">
          {/* Source legend */}
          <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
            {Object.entries(SOURCE_COLORS).map(([src, col]) => (
              <div key={src} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: col, display: 'inline-block' }} />
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4B5563' }}>{src}</span>
              </div>
            ))}
          </div>

          {all.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {all.map((deal, i) => (
                <a key={deal.id || i} href={deal.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'grid', gridTemplateColumns: '56px 1fr auto', gap: '16px', alignItems: 'center', background: '#111318', border: '1px solid #1F2428', padding: '14px 20px', textDecoration: 'none', transition: 'border-color 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#C8922A'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#1F2428'}>

                  {/* Score / rank */}
                  <div style={{ textAlign: 'center' }}>
                    {deal.score !== null ? (
                      <>
                        <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: deal.score > 100 ? '#C8922A' : '#4B5563', lineHeight: 1 }}>{deal.score > 999 ? `${(deal.score/1000).toFixed(1)}k` : deal.score}</div>
                        <div style={{ fontFamily: 'monospace', fontSize: '8px', color: '#374151' }}>HOT</div>
                      </>
                    ) : (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: SOURCE_COLORS[deal.source] || '#4B5563', margin: '0 auto' }} />
                    )}
                  </div>

                  {/* Title + meta */}
                  <div>
                    {deal.flair && (
                      <span style={{ fontFamily: 'monospace', fontSize: '9px', color: FLAIR_COLORS[deal.flair] || '#9CA3AF', letterSpacing: '0.08em', display: 'inline-block', marginBottom: '4px' }}>
                        {deal.flair.toUpperCase()}
                      </span>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.4, marginBottom: '6px' }}>{deal.title}</div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: SOURCE_COLORS[deal.source] || '#4B5563' }}>{deal.source}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563' }}>{deal.domain}</span>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#374151' }}>{timeAgo(deal.created)}</span>
                      {deal.comments !== null && (
                        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#374151' }}>{deal.comments} comments</span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', border: '1px solid #C8922A', padding: '6px 14px', display: 'block', whiteSpace: 'nowrap' }}>
                      VIEW DEAL →
                    </span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px', color: '#4B5563', fontFamily: 'monospace' }}>
              Loading deals from r/gundeals, AmmoLand and Guns.com...
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
