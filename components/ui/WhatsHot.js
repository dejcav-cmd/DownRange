'use client'
import { useState, useEffect } from 'react'

const HOT_FALLBACK = [
  { rank:1, title:'ATF 34-Rule Reform Package — April 2026', href:'/laws?tab=atf',     cat:'law',     score:98 },
  { rank:2, title:'NFA Tax Stamp Eliminated Jan 1 2026',     href:'/laws?tab=atf',     cat:'law',     score:95 },
  { rank:3, title:'SCOTUS: Hemani (Drug Users & 2A)',        href:'/laws?tab=scotus',  cat:'scotus',  score:91 },
  { rank:5, title:'SIG P365XL Review — 9.5/10',             href:'/reviews',          cat:'review',  score:82 },
]

const CAT_COLORS = { law:'#60A5FA', scotus:'#EF4444', market:'#C8922A', review:'#34D399', news:'#9CA3AF' }

export default function WhatsHot({ articles = [] }) {
  const [items, setItems] = useState(HOT_FALLBACK)

  useEffect(() => {
    // Use top-urgency articles if available
    if (articles.length > 0) {
      const hot = articles
        .filter(a => a.urgencyScore >= 6)
        .sort((a, b) => b.urgencyScore - a.urgencyScore)
        .slice(0, 5)
        .map((a, i) => ({
          rank: i + 1,
          title: a.title,
          href: `/news/${a.slug?.current || a._id}`,
          cat: a.category || 'news',
          score: Math.round(a.urgencyScore * 10),
        }))
      if (hot.length >= 3) setItems(hot)
    }
  }, [articles])

  return (
    <div style={{ background:'var(--bg2)', border:'1px solid var(--border)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:'8px', padding:'12px 16px', borderBottom:'1px solid var(--border)', background:'var(--bg3)' }}>
        <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--gold)', letterSpacing:'0.15em', fontWeight:700 }}>🔥 WHAT'S HOT RIGHT NOW</span>
        <span style={{ width:6, height:6, borderRadius:'50%', background:'#22C55E', animation:'pulse 1.2s ease-in-out infinite', display:'inline-block' }} />
      </div>
      {items.map(item => (
        <a key={item.rank} href={item.href}
          style={{ display:'flex', alignItems:'center', gap:'12px', padding:'10px 16px', borderBottom:'1px solid var(--border)', textDecoration:'none', transition:'background 0.12s' }}
          onMouseEnter={e => e.currentTarget.style.background='var(--bg3)'}
          onMouseLeave={e => e.currentTarget.style.background='transparent'}>
          <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.4rem', color:'var(--text-dim)', width:20, textAlign:'center', flexShrink:0, lineHeight:1 }}>{item.rank}</span>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:600, color:'var(--text)', lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {item.title}
            </div>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'8px', color:CAT_COLORS[item.cat]||'#9CA3AF', letterSpacing:'0.1em', textTransform:'uppercase' }}>{item.cat}</span>
          </div>
          <div style={{ flexShrink:0 }}>
            <div style={{ width:30, height:30, borderRadius:'50%', border:`2px solid ${CAT_COLORS[item.cat]||'#374151'}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:CAT_COLORS[item.cat]||'#9CA3AF' }}>
              {item.score}
            </div>
          </div>
        </a>
      ))}
    </div>
  )
}
