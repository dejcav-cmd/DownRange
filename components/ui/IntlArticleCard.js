'use client'
import Link from 'next/link'

function timeAgo(date) {
  if (!date) return ''
  const d = Date.now() - new Date(date).getTime()
  const m = Math.floor(d / 60000)
  if (m < 60) return m+'m ago'
  const h = Math.floor(m / 60)
  if (h < 24) return h+'h ago'
  return Math.floor(h / 24)+'d ago'
}

function timeAgoPt(date) {
  if (!date) return ''
  const d = Date.now() - new Date(date).getTime()
  const m = Math.floor(d / 60000)
  if (m < 60) return m+'min atrás'
  const h = Math.floor(m / 60)
  if (h < 24) return h+'h atrás'
  return Math.floor(h / 24)+'d atrás'
}

const TAG_COLORS = {
  LEI: '#60A5FA', LAW: '#60A5FA',
  POLICY: '#C8922A', POLÍTICA: '#C084FC',
  GUIDE: '#34D399', GUIA: '#34D399',
  SETOR: '#C8922A', ALERT: '#EF4444',
}

// ── FEATURED (full-width hero card) ──────────────────────────────────────────
export function IntlFeaturedArticle({ article, lang = 'en' }) {
  const img    = article.imageUrl || '/img/photos/law.jpg'
  const tag    = article.tag || 'NEWS'
  const tColor = TAG_COLORS[tag] || '#9CA3AF'
  const ta     = lang === 'pt' ? timeAgoPt(article.publishedAt) : timeAgo(article.publishedAt)
  const base   = lang === 'pt' ? '/brazil' : '/canada'
  const href   = article.slug?.current ? `${base}/${article.slug.current}` : base

  return (
    <Link href={href} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        style={{ position:'relative', minHeight:420, overflow:'hidden', background:'#0d1117', cursor:'pointer' }}
      >
        <img
          src={img} alt={article.title}
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', opacity:0.45 }}
          onError={e => { e.target.src='/img/photos/law.jpg' }}
        />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(9,9,11,.97) 0%,rgba(9,9,11,.6) 50%,rgba(9,9,11,.2) 100%)' }} />
        <div style={{ position:'absolute', bottom:0, left:0, right:0, padding:'28px 32px' }}>
          <span style={{ color:tColor, fontSize:11, fontWeight:700, letterSpacing:'.15em', display:'block', marginBottom:10, fontFamily:"'IBM Plex Mono',monospace" }}>{tag}</span>
          <h2 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:'clamp(1.8rem,4vw,3rem)', lineHeight:1, color:'#F5F5F3', letterSpacing:'.02em', marginBottom:12, maxWidth:700 }}>
            {article.title}
          </h2>
          {article.summary && (
            <p style={{ fontSize:14, color:'#94A3B8', maxWidth:580, marginBottom:16, lineHeight:1.65,
              display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
              {article.summary}
            </p>
          )}
          <div style={{ display:'flex', alignItems:'center', gap:16 }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#6B7280' }}>
              {article.author || 'DownRange'} · {ta}
            </span>
            <span style={{ background:'#C8922A', color:'#000', fontSize:11, fontWeight:700, padding:'4px 12px', letterSpacing:'.08em', fontFamily:"'IBM Plex Mono',monospace" }}>
              {lang === 'pt' ? 'LER ARTIGO →' : 'READ STORY →'}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}

// ── GRID CARD ─────────────────────────────────────────────────────────────────
export default function IntlArticleCard({ article, lang = 'en' }) {
  const img    = article.imageUrl || '/img/photos/law.jpg'
  const tag    = article.tag || 'NEWS'
  const tColor = TAG_COLORS[tag] || '#9CA3AF'
  const ta     = lang === 'pt' ? timeAgoPt(article.publishedAt) : timeAgo(article.publishedAt)
  const base   = lang === 'pt' ? '/brazil' : '/canada'
  const href   = article.slug?.current ? `${base}/${article.slug.current}` : base

  return (
    <Link href={href} style={{ textDecoration:'none', display:'block', height:'100%' }}>
      <div
        style={{ background:'#111318', border:'1px solid var(--border)', overflow:'hidden',
          height:'100%', display:'flex', flexDirection:'column', cursor:'pointer', transition:'border-color .2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor='#C8922A'}
        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border)'}
      >
        <div style={{ width:'100%', aspectRatio:'16/9', minHeight:180, maxHeight:210, overflow:'hidden', position:'relative', flexShrink:0 }}>
          <img
            src={img} alt={article.title}
            style={{ width:'100%', height:'100%', objectFit:'cover' }}
            onError={e => { e.target.src='/img/photos/law.jpg' }}
          />
          <div style={{ position:'absolute', top:9, left:9, background:'rgba(0,0,0,.75)', padding:'3px 8px', backdropFilter:'blur(4px)' }}>
            <span style={{ color:tColor, fontSize:10, fontWeight:700, letterSpacing:'.1em', fontFamily:"'IBM Plex Mono',monospace" }}>{tag}</span>
          </div>
        </div>
        <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', flex:1 }}>
          <h3 style={{ fontSize:14, fontWeight:600, color:'#E5E5E5', lineHeight:1.3, marginBottom:8, flex:1,
            display:'-webkit-box', WebkitLineClamp:3, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {article.title}
          </h3>
          <div style={{ display:'flex', justifyContent:'space-between', paddingTop:10, borderTop:'1px solid #1A1E24', marginTop:'auto' }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563' }}>{article.author || 'DownRange'}</span>
            <div style={{ display:'flex', gap:8 }}>
              {article.readMins && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563' }}>{article.readMins}</span>}
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563' }}>{ta}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
