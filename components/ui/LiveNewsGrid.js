'use client'

import React from 'react'

const FALLBACKS = {
  pistol:     'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg',
  rifle:      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/M4A1_SOPMOD_Block_II.jpg/1280px-M4A1_SOPMOD_Block_II.jpg',
  shotgun:    'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Mossberg_500.jpg/1280px-Mossberg_500.jpg',
  suppressor: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/10/Silencer.jpg/1280px-Silencer.jpg',
  optic:      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9f/M4A1_SOPMOD_Block_II.jpg/1280px-M4A1_SOPMOD_Block_II.jpg',
  ammo:       'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg',
  law:        'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/US_Supreme_Court_Building.jpg/1280px-US_Supreme_Court_Building.jpg',
  breaking:   'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f5/US_Supreme_Court_Building.jpg/1280px-US_Supreme_Court_Building.jpg',
  industry:   'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg',
  news:       'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Glock17.jpg/1280px-Glock17.jpg',
}

const CAT_C = {
  breaking:'#ef4444', law:'#3b82f6', industry:'#C8922A',
  news:'#9ca3af', opinion:'#a855f7', training:'#22c55e',
}
const CAT_L = {
  breaking:'⚡ BREAKING', law:'⚖ LAW', industry:'◈ INDUSTRY',
  news:'◉ NEWS', opinion:'◇ OPINION', training:'▲ TRAINING',
}

function getImage(a) {
  if (a?.heroImage?.asset?.url) return a.heroImage.asset.url
  if (a?.imageUrl) return a.imageUrl
  const t = (a?.title || '').toLowerCase()
  if (/ar-?15|5\.56|\.223|rifle|carbine|m4|ak|308|6\.5|bolt/.test(t)) return FALLBACKS.rifle
  if (/shotgun|gauge|mossberg|remington|benelli/.test(t))               return FALLBACKS.shotgun
  if (/suppressor|silencer|nfa|silencerco/.test(t))                     return FALLBACKS.suppressor
  if (/optic|scope|red dot|eotech|aimpoint|vortex/.test(t))             return FALLBACKS.optic
  if (/ammo|ammunition|grain|fmj|caliber|bullet/.test(t))               return FALLBACKS.ammo
  if (/law|legislation|atf|scotus|court|ban|bill|rights|2a/.test(t))   return FALLBACKS.law
  return FALLBACKS[a?.category] || FALLBACKS.news
}

function timeAgoClient(iso) {
  if (!iso) return ''
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000)
  if (diff < 1)    return 'Just now'
  if (diff < 60)   return `${diff}m ago`
  if (diff < 1440) return `${Math.floor(diff/60)}h ago`
  return `${Math.floor(diff/1440)}d ago`
}

export default function LiveNewsGrid({ articles: initialArticles = [] }) {
  const [articles, setArticles]   = React.useState(initialArticles)
  const [newCount, setNewCount]   = React.useState(0)
  const [lastRefresh, setLastRefresh] = React.useState(null)
  const [refreshing, setRefreshing]   = React.useState(false)

  React.useEffect(() => {
    const knownIds = new Set(initialArticles.map(a => a._id))
    const refresh = async () => {
      try {
        setRefreshing(true)
        const res  = await fetch('/api/news-feed?limit=20&offset=6')
        const data = await res.json()
        if (data.articles?.length > 0) {
          const fresh = data.articles.filter(a => !knownIds.has(a._id))
          if (fresh.length > 0) {
            setNewCount(n => n + fresh.length)
            fresh.forEach(a => knownIds.add(a._id))
          }
          setArticles(data.articles)
          setLastRefresh(new Date())
        }
      } catch {}
      finally { setRefreshing(false) }
    }
    const timer = setInterval(refresh, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [])

  const display = articles.length > 0 ? articles : initialArticles

  return (
    <section style={{ padding:'36px 0', borderBottom:'1px solid var(--border)', background:'var(--bg)' }}>
      <style>{`
        .story-card { transition: transform 0.2s, border-color 0.2s; }
        .story-card:hover { transform: translateY(-3px); border-color: #C8922A !important; }
        .story-card:hover .story-img { transform: scale(1.04); }
        .story-img { transition: transform 0.4s ease; }
        @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin { to { transform:rotate(360deg); } }
        .spinner { animation: spin 1s linear infinite; }
        @keyframes pulseGreen { 0%,100%{opacity:1}50%{opacity:.4} }
        .pulse-green { animation: pulseGreen 1.5s infinite; }
      `}</style>

      <div className="container">
        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:12 }}>
            <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', letterSpacing:'0.04em', color:'var(--foreground)', margin:0 }}>
              MORE STORIES
            </h2>
            <span style={{ display:'flex', alignItems:'center', gap:5, fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#22c55e', background:'#14532d', padding:'2px 8px', borderRadius:2 }}>
              <span style={{ width:5, height:5, borderRadius:'50%', background:'#22c55e', display:'inline-block' }} className="pulse-green" />
              LIVE
            </span>
            {newCount > 0 && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#C8922A', background:'rgba(200,146,42,0.15)', border:'1px solid rgba(200,146,42,0.3)', padding:'2px 8px', borderRadius:2 }}>
                +{newCount} NEW
              </span>
            )}
            {refreshing && (
              <span className="spinner" style={{ width:10, height:10, border:'2px solid #334155', borderTopColor:'#C8922A', borderRadius:'50%', display:'inline-block' }} />
            )}
            {lastRefresh && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#334155' }}>
                Updated {timeAgoClient(lastRefresh.toISOString())}
              </span>
            )}
          </div>
          <a href="/news" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#C8922A', textDecoration:'none' }}>ALL NEWS →</a>
        </div>

        {/* Big card row */}
        <div style={{ display:'grid', gridTemplateColumns:'repeat(12,1fr)', gap:10 }}>
          {display.slice(0,8).map((a, i) => {
            const img  = getImage(a)
            const cc   = CAT_C[a.category] || '#9ca3af'
            const cl   = CAT_L[a.category] || (a.category?.toUpperCase() || 'NEWS')
            const slug = a.slug?.current || a._id
            const colSpan = i === 0 ? 6 : (i === 1 ? 6 : 4)
            const imgH    = i === 0 ? 260 : (i === 1 ? 220 : 180)
            const isHot   = a.urgencyScore >= 8

            return (
              <a key={a._id || i} href={`/news/${slug}`}
                className="story-card"
                style={{ gridColumn:`span ${colSpan}`, textDecoration:'none', display:'block', background:'var(--bg2)', border:'1px solid var(--border)', overflow:'hidden', borderRadius:3 }}
              >
                <div style={{ position:'relative', height:imgH, overflow:'hidden', background:'#0d1117' }}>
                  <img src={img} alt={a.title} className="story-img"
                    style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', opacity:0.85 }}
                    onError={e => { const fb = FALLBACKS[a.category]||FALLBACKS.news; if(e.target.src!==fb)e.target.src=fb }}
                  />
                  <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(9,9,11,.85) 0%,rgba(9,9,11,.2) 60%,transparent 100%)' }} />
                  <div style={{ position:'absolute', top:10, left:10, display:'flex', gap:6, alignItems:'center' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, fontWeight:700, color:(cc==='#C8922A')?'#000':'#fff', background:cc, padding:'2px 8px', letterSpacing:'0.08em' }}>{cl}</span>
                    {isHot && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#fff', background:'#B91C1C', padding:'2px 6px' }}>● HOT</span>}
                  </div>
                  {i < 2 && (
                    <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'12px 14px' }}>
                      <div style={{ fontFamily:"'Bebas Neue',cursive", fontSize:i===0?'1.45rem':'1.2rem', color:'#F0EDE6', letterSpacing:'0.03em', lineHeight:1.1, marginBottom:4 }}>{a.title}</div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#94a3b8' }}>{a.source} · {timeAgoClient(a.publishedAt)}</div>
                    </div>
                  )}
                </div>
                {i >= 2 && (
                  <div style={{ padding:'11px 13px' }}>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--foreground)', lineHeight:1.25, marginBottom:5, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.title}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#334155' }}>{a.source} · {timeAgoClient(a.publishedAt)}</div>
                  </div>
                )}
              </a>
            )
          })}
        </div>

        {/* Compact row */}
        {display.length > 8 && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10, marginTop:10 }}>
            {display.slice(8, 12).map((a, i) => {
              const img = getImage(a)
              const cc  = CAT_C[a.category] || '#9ca3af'
              return (
                <a key={a._id||i} href={`/news/${a.slug?.current||a._id}`}
                  className="story-card"
                  style={{ textDecoration:'none', display:'flex', gap:10, background:'var(--bg2)', border:'1px solid var(--border)', padding:10, borderRadius:3, alignItems:'flex-start' }}
                >
                  <div style={{ width:80, height:70, flexShrink:0, overflow:'hidden', borderRadius:2 }}>
                    <img src={img} alt={a.title} style={{ width:'100%', height:'100%', objectFit:'cover' }}
                      onError={e => { const fb=FALLBACKS[a.category]||FALLBACKS.news; if(e.target.src!==fb)e.target.src=fb }}
                    />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:cc, marginBottom:3, letterSpacing:'0.06em' }}>{a.category?.toUpperCase()}</div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:13, fontWeight:700, color:'var(--foreground)', lineHeight:1.2, marginBottom:3, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{a.title}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:8, color:'#334155' }}>{a.source} · {timeAgoClient(a.publishedAt)}</div>
                  </div>
                </a>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
