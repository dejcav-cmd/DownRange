import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'Live Deals — DownRange', description: 'Real-time firearms and ammo deals. Best prices on guns, ammo, and gear updated every 30 minutes.' }
export const revalidate = 1800

async function fetchDeals() {
  try {
    // Fetch from Reddit r/gundeals API
    const res = await fetch('https://www.reddit.com/r/gundeals/hot.json?limit=25', {
      headers: { 'User-Agent': 'DownRange/1.0' },
      next: { revalidate: 1800 }
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.data.children
      .filter(p => !p.data.stickied)
      .map(p => ({
        id:        p.data.id,
        title:     p.data.title,
        url:       p.data.url,
        permalink: `https://reddit.com${p.data.permalink}`,
        score:     p.data.score,
        comments:  p.data.num_comments,
        created:   p.data.created_utc * 1000,
        flair:     p.data.link_flair_text,
      }))
  } catch { return [] }
}

function timeAgo(ts) {
  const diff = Date.now() - ts
  const min = Math.floor(diff/60000)
  if (min < 60) return `${min}m ago`
  const hr = Math.floor(min/60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.floor(hr/24)}d ago`
}

const FLAIR_COLORS = { Handgun:'#60A5FA',Rifle:'#34D399',Shotgun:'#FBBF24',Ammo:'#C8922A',Accessories:'#C084FC',Other:'#9CA3AF' }

export default async function DealsPage() {
  const [deals, alerts] = await Promise.all([fetchDeals(), fetchBreakingAlerts(5).catch(()=>[])])

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
          <p className="page-hero-sub">Best firearms and ammo deals aggregated from r/gundeals and top retailers · {deals.length} active deals</p>
        </div>
      </div>

      <div style={{ padding: '40px 0' }}>
        <div className="container">
          {deals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {deals.map(deal => (
                <a key={deal.id} href={deal.url} target="_blank" rel="noopener noreferrer"
                  style={{ display: 'grid', gridTemplateColumns: '48px 1fr auto', gap: '16px', alignItems: 'center', background: '#111318', border: '1px solid #1F2428', padding: '16px 20px', textDecoration: 'none', transition: 'border-color 0.2s' }}>
                  {/* Score */}
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#C8922A', lineHeight: 1 }}>{deal.score}</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '9px', color: '#4B5563' }}>HOT</div>
                  </div>
                  {/* Title */}
                  <div>
                    {deal.flair && (
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: FLAIR_COLORS[deal.flair]||'#9CA3AF', marginBottom: '4px', display: 'inline-block', letterSpacing: '0.08em' }}>
                        {deal.flair?.toUpperCase()}
                      </span>
                    )}
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#F0EDE6', lineHeight: 1.4 }}>{deal.title}</div>
                    <div style={{ display: 'flex', gap: '12px', marginTop: '6px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563' }}>{timeAgo(deal.created)}</span>
                      <a href={deal.permalink} target="_blank" rel="noopener noreferrer" onClick={e=>e.stopPropagation()}
                        style={{ fontFamily: 'monospace', fontSize: '10px', color: '#4B5563', textDecoration: 'none' }}>
                        {deal.comments} comments
                      </a>
                    </div>
                  </div>
                  {/* CTA */}
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', border: '1px solid #C8922A', padding: '6px 14px', display: 'block' }}>DEAL →</span>
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '80px', color: '#4B5563', fontFamily: 'monospace' }}>
              Loading live deals... Check back in a moment.
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
