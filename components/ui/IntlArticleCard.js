'use client'
import { useState } from 'react'

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

// ── FEATURED (full-width hero card, identical to NewsCard featured) ────────
export function IntlFeaturedArticle({ article, lang = 'en' }) {
  const [open, setOpen] = useState(false)
  const img    = article.imageUrl || '/img/photos/law.jpg'
  const tag    = article.tag || 'NEWS'
  const tColor = TAG_COLORS[tag] || '#9CA3AF'
  const ta     = lang === 'pt' ? timeAgoPt(article.publishedAt) : timeAgo(article.publishedAt)

  return (
    <>
      <div
        onClick={() => setOpen(true)}
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

      {/* Article body modal */}
      {open && <ArticleModal article={article} lang={lang} onClose={() => setOpen(false)} />}
    </>
  )
}

// ── GRID CARD ─────────────────────────────────────────────────────────────────
export default function IntlArticleCard({ article, lang = 'en' }) {
  const [open, setOpen] = useState(false)
  const img    = article.imageUrl || '/img/photos/law.jpg'
  const tag    = article.tag || 'NEWS'
  const tColor = TAG_COLORS[tag] || '#9CA3AF'
  const ta     = lang === 'pt' ? timeAgoPt(article.publishedAt) : timeAgo(article.publishedAt)

  return (
    <>
      <div
        onClick={() => setOpen(true)}
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

      {open && <ArticleModal article={article} lang={lang} onClose={() => setOpen(false)} />}
    </>
  )
}

// ── ARTICLE MODAL ─────────────────────────────────────────────────────────────
function ArticleModal({ article, lang, onClose }) {
  return (
    <div
      style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.85)', display:'flex', alignItems:'flex-start', justifyContent:'center', overflowY:'auto', padding:'32px 16px' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background:'#111318', border:'1px solid #1e293b', maxWidth:780, width:'100%', position:'relative' }}>
        {/* Header */}
        <div style={{ padding:'20px 24px', borderBottom:'1px solid #1e293b', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <div style={{ display:'flex', gap:8, alignItems:'center' }}>
            {article.tag && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700, padding:'2px 8px', background:'#C8922A', color:'#000' }}>{article.tag}</span>}
            {article.readMins && <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4b5563' }}>{article.readMins}</span>}
          </div>
          <button onClick={onClose} style={{ background:'none', border:'1px solid #374151', color:'#9ca3af', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, padding:'4px 12px', cursor:'pointer' }}>✕ {lang === 'pt' ? 'Fechar' : 'Close'}</button>
        </div>

        {/* Image */}
        {article.imageUrl && (
          <div style={{ height:260, overflow:'hidden' }}>
            <img src={article.imageUrl} alt={article.title} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:.75 }} onError={e => { e.target.style.display='none' }} />
          </div>
        )}

        {/* Content */}
        <div style={{ padding:'24px 28px' }}>
          <h1 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'clamp(1.6rem,3vw,2.4rem)', color:'#F5F5F3', letterSpacing:'.03em', lineHeight:1.05, marginBottom:16 }}>
            {article.title}
          </h1>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4b5563', marginBottom:20 }}>
            {article.author || 'DownRange'} · {article.publishedAt ? new Date(article.publishedAt).toLocaleDateString(lang === 'pt' ? 'pt-BR' : 'en-CA', { year:'numeric', month:'long', day:'numeric' }) : ''}
          </div>

          {article.body ? (
            <div
              className="dr-article-body"
              style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:15, color:'#D1D5DB', lineHeight:1.8 }}
              dangerouslySetInnerHTML={{ __html: article.body }}
            />
          ) : (
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:15, color:'#9ca3af', lineHeight:1.8, textAlign:'justify' }}>
              {article.summary}
            </p>
          )}

          {article.sourceUrl && (
            <div style={{ marginTop:24, paddingTop:16, borderTop:'1px solid #1e293b' }}>
              <a href={article.sourceUrl} target="_blank" rel="noreferrer"
                style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#C8922A', textDecoration:'none' }}>
                → {lang === 'pt' ? 'Fonte original ↗' : 'Original source ↗'}
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
