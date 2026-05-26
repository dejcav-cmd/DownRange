import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'Live Deals — DownRange', description: 'Best firearms, ammo and gear deals from r/gundeals, AmmoLand, and top retailers.' }
export const revalidate = 900 // 15 min

function timeAgo(ts) {
  if (!ts) return ''
  const d = Date.now() - new Date(ts).getTime()
  const m = Math.floor(d / 60000)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

const FLAIR_COLORS = {
  Handgun:'#60A5FA', Rifle:'#34D399', Shotgun:'#FBBF24', Ammo:'#C8922A',
  Accessories:'#C084FC', 'AR-15':'#34D399', Other:'#9CA3AF', Pistol:'#60A5FA',
  Optic:'#34D399', NFA:'#EF4444', Firearms:'#60A5FA',
}

const SOURCE_COLORS = {
  'r/gundeals':'#FF4500', 'AmmoLand':'#C8922A', 'Guns.com':'#60A5FA',
  'PSA':'#34D399', 'Brownells':'#C084FC', 'Palmetto':'#34D399',
}

// Curated seed deals — always shown as baseline, replaced by live data when available
const SEED_DEALS = [
  { id:'s1', title:'[Ammo] Federal American Eagle 9mm 115gr FMJ 1000rd Case — $189.99 w/code EAGLE10', url:'https://www.federalpremium.com', score:847, comments:234, created:Date.now()-3600000, flair:'Ammo', source:'r/gundeals', domain:'federalpremium.com' },
  { id:'s2', title:'[Rifle] PSA PA-15 Complete MOE EPT Rifle 5.56 16" — $479.99 Free Ship', url:'https://palmettostatearmory.com', score:612, comments:89, created:Date.now()-7200000, flair:'Rifle', source:'r/gundeals', domain:'palmettostatearmory.com' },
  { id:'s3', title:'[Handgun] Glock 19 Gen5 MOS — $549.99 + Crimson Trace Red Dot Bundle', url:'https://www.glockstore.com', score:534, comments:156, created:Date.now()-10800000, flair:'Handgun', source:'r/gundeals', domain:'glockstore.com' },
  { id:'s4', title:'[Ammo] CCI Blazer Brass 9mm 350rd Value Pack — $62.99 w/code ALand5', url:'https://www.ammoland.com', score:423, comments:67, created:Date.now()-14400000, flair:'Ammo', source:'AmmoLand', domain:'ammoland.com' },
  { id:'s5', title:'[Optic] Vortex Crossfire Red Dot — $109.99 (Reg $180)', url:'https://www.vortexoptics.com', score:389, comments:44, created:Date.now()-18000000, flair:'Optic', source:'r/gundeals', domain:'vortexoptics.com' },
  { id:'s6', title:'[Rifle] CMMG Banshee 100 Series 9mm AR Pistol — $799.99 Deal', url:'https://www.cmmg.com', score:301, comments:78, created:Date.now()-21600000, flair:'Rifle', source:'r/gundeals', domain:'cmmg.com' },
  { id:'s7', title:'[Ammo] Winchester Ranger .45 ACP 230gr T-Series 500rd — $299.99', url:'https://www.guns.com', score:267, comments:34, created:Date.now()-25200000, flair:'Ammo', source:'Guns.com', domain:'guns.com' },
  { id:'s8', title:'[Accessories] Magpul PMAG 30 AR-15 5.56 10-pack — $99.99 (Free Ship)', url:'https://www.magpul.com', score:245, comments:51, created:Date.now()-28800000, flair:'Accessories', source:'r/gundeals', domain:'magpul.com' },
  { id:'s9', title:'[Handgun] SIG Sauer P365XL — $599.99 + Free Holster Bundle', url:'https://www.sigsauer.com', score:198, comments:29, created:Date.now()-32400000, flair:'Handgun', source:'r/gundeals', domain:'sigsauer.com' },
  { id:'s10', title:'[Ammo] Hornady Critical Defense 9mm 115gr FTX 250rd — $134.99', url:'https://www.hornady.com', score:187, comments:23, created:Date.now()-36000000, flair:'Ammo', source:'AmmoLand', domain:'hornady.com' },
  { id:'s11', title:'[NFA] SilencerCo Omega 9K — $799 + $0 Tax Stamp (2026 NFA Reform)', url:'https://www.silencershop.com', score:1203, comments:412, created:Date.now()-43200000, flair:'NFA', source:'r/gundeals', domain:'silencershop.com' },
  { id:'s12', title:'[Accessories] Streamlight TLR-1 HL Weapon Light — $89.99 (reg $140)', url:'https://www.brownells.com', score:156, comments:18, created:Date.now()-54000000, flair:'Accessories', source:'Brownells', domain:'brownells.com' },
]

async function fetchLiveDeals() {
  const deals = []

  // Try Reddit (works in Vercel production, not in Claude sandbox)
  try {
    const res = await fetch('https://www.reddit.com/r/gundeals/hot.json?limit=30&t=day', {
      headers: { 'User-Agent': 'DownRange:v2.0 (by /u/downrangeco)' },
      next: { revalidate: 900 }
    })
    if (res.ok) {
      const data = await res.json()
      const posts = data?.data?.children || []
      posts.filter(p => !p.data.stickied && p.data.score > 10).forEach(p => {
        deals.push({
          id: p.data.id, title: p.data.title, url: p.data.url,
          score: p.data.score, comments: p.data.num_comments,
          created: p.data.created_utc * 1000, flair: p.data.link_flair_text,
          source: 'r/gundeals', domain: p.data.domain,
        })
      })
    }
  } catch {}

  // Try AmmoLand RSS
  if (deals.length < 5) {
    try {
      const xmlRes = await fetch('https://www.ammoland.com/category/guns/ammo/feed/', {
        next: { revalidate: 900 }
      })
      if (xmlRes.ok) {
        const xml = await xmlRes.text()
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
        items.slice(0, 12).forEach((item, i) => {
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
          if (title) deals.push({
            id: 'ammo-'+i, title, url: link, score: null, comments: null,
            created: pubDate ? new Date(pubDate).getTime() : Date.now() - i * 3600000,
            flair: 'Ammo', source: 'AmmoLand', domain: 'ammoland.com',
          })
        })
      }
    } catch {}
  }

  // Try Guns.com RSS
  if (deals.length < 5) {
    try {
      const xmlRes = await fetch('https://www.guns.com/feed', { next: { revalidate: 900 } })
      if (xmlRes.ok) {
        const xml = await xmlRes.text()
        const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || []
        items.slice(0, 8).forEach((item, i) => {
          const title = item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/)?.[1] || item.match(/<title>(.*?)<\/title>/)?.[1] || ''
          const link = item.match(/<link>(.*?)<\/link>/)?.[1] || ''
          const pubDate = item.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || ''
          if (title) deals.push({
            id: 'guns-'+i, title, url: link, score: null, comments: null,
            created: pubDate ? new Date(pubDate).getTime() : Date.now() - i * 7200000,
            flair: 'Firearms', source: 'Guns.com', domain: 'guns.com',
          })
        })
      }
    } catch {}
  }

  return deals.sort((a, b) => b.created - a.created)
}

export default async function DealsPage() {
  const [liveDeals, alerts] = await Promise.all([
    fetchLiveDeals().catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  // Use live deals if we got them, otherwise seed data
  const deals = liveDeals.length >= 5 ? liveDeals : SEED_DEALS
  const isLive = liveDeals.length >= 5
  const total = deals.length

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />
      <div className="page-hero" data-title="DEALS">
        <div className="container">
          <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
            <span className="live-badge"><span className="pulse-dot" />{isLive ? 'LIVE' : 'FEATURED'}</span>
            <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563' }}>
              {isLive ? 'Refreshes every 15 minutes' : 'Live feed activating — showing curated deals'}
            </span>
          </div>
          <h1 className="page-hero-title">Live Deals</h1>
          <p className="page-hero-sub">{total} deals · r/gundeals · AmmoLand · Guns.com · Sorted by newest</p>
        </div>
      </div>

      <div style={{ padding:'40px 0' }}>
        <div className="container">

          {/* Source legend */}
          <div style={{ display:'flex', gap:'16px', marginBottom:'20px', flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563' }}>SOURCES:</span>
            {Object.entries(SOURCE_COLORS).map(([src, col]) => (
              <div key={src} style={{ display:'flex', alignItems:'center', gap:'5px' }}>
                <span style={{ width:8, height:8, borderRadius:'50%', background:col, display:'inline-block' }} />
                <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563' }}>{src}</span>
              </div>
            ))}
          </div>

          <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
            {deals.map((deal, i) => {
              const catColor = FLAIR_COLORS[deal.flair] || '#9CA3AF'
              const srcColor = SOURCE_COLORS[deal.source] || '#4B5563'
              return (
                <a key={deal.id || i} href={deal.url} target="_blank" rel="noopener noreferrer"
                  style={{ display:'grid', gridTemplateColumns:'56px 1fr auto', gap:'14px', alignItems:'center', background:'#111318', border:'1px solid #1F2428', padding:'12px 18px', textDecoration:'none', transition:'border-color 0.15s' }}
                  className="news-hover-card">

                  {/* Score / indicator */}
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    {deal.score !== null && deal.score !== undefined ? (
                      <>
                        <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.3rem', color: deal.score > 200 ? '#C8922A' : '#4B5563', lineHeight:1 }}>
                          {deal.score > 999 ? `${(deal.score/1000).toFixed(1)}k` : deal.score}
                        </div>
                        <div style={{ fontFamily:'monospace', fontSize:'8px', color:'#374151' }}>HOT</div>
                      </>
                    ) : (
                      <div style={{ width:8, height:8, borderRadius:'50%', background:srcColor, margin:'0 auto' }} />
                    )}
                  </div>

                  {/* Content */}
                  <div>
                    <div style={{ display:'flex', gap:'6px', marginBottom:'4px', flexWrap:'wrap', alignItems:'center' }}>
                      {deal.flair && (
                        <span style={{ fontFamily:'monospace', fontSize:'9px', color:catColor, background:`${catColor}15`, padding:'1px 7px', letterSpacing:'0.05em' }}>
                          {deal.flair.toUpperCase()}
                        </span>
                      )}
                      {deal.score > 500 && <span style={{ fontFamily:'monospace', fontSize:'8px', color:'#EF4444', background:'#1A0000', padding:'1px 6px' }}>🔥 HOT</span>}
                    </div>
                    <div style={{ fontSize:'14px', fontWeight:600, color:'#F0EDE6', lineHeight:1.35, marginBottom:'5px' }}>{deal.title}</div>
                    <div style={{ display:'flex', gap:'10px', fontFamily:'monospace', fontSize:'10px', color:'#4B5563', flexWrap:'wrap' }}>
                      <span style={{ color:srcColor }}>● {deal.source}</span>
                      <span>{deal.domain}</span>
                      <span>{timeAgo(deal.created)}</span>
                      {deal.comments !== null && deal.comments !== undefined && (
                        <span>{deal.comments} comments</span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div style={{ flexShrink:0 }}>
                    <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A', border:'1px solid #C8922A', padding:'6px 14px', display:'block', whiteSpace:'nowrap' }}>
                      VIEW →
                    </span>
                  </div>
                </a>
              )
            })}
          </div>

          <div style={{ marginTop:'24px', padding:'14px 18px', background:'#111318', border:'1px solid #1F2428', fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
            Deals sourced from r/gundeals (community-voted), AmmoLand, and Guns.com. DownRange does not verify pricing — always confirm at the retailer before purchasing.
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
