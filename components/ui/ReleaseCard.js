'use client'
import { useState } from 'react'

const FALLBACKS = {
  Pistol:     '/img/photos/pistol.jpg',
  Revolver:   '/img/photos/pistol.jpg',
  Rifle:      '/img/photos/rifle.jpg',
  Shotgun:    '/img/photos/shotgun.jpg',
  Suppressor: '/img/photos/suppressor.jpg',
  default:    '/img/photos/pistol.jpg',
}

export default function ReleaseCard({ rel }) {
  const rawImg   = rel?.heroImage?.asset?.url || rel?.imageUrl || null
  const fallback = FALLBACKS[rel?.category] || FALLBACKS.default
  const [src, setSrc]         = useState(rawImg || fallback)
  const [loaded, setLoaded]   = useState(false)
  const [errored, setErrored] = useState(!rawImg)

  const href     = rel?.slug?.current ? `/releases/${rel.slug.current}` : '/releases'
  const catColor = {
    Pistol:'#60A5FA', Rifle:'#34D399', Shotgun:'#F59E0B',
    Revolver:'#C084FC', Suppressor:'#9CA3AF',
  }[rel?.category] || '#C8922A'

  function handleError() {
    if (!errored) {
      setErrored(true)
      setSrc(fallback)
    }
  }

  return (
    <a href={href} style={{ textDecoration:'none', display:'block' }}>
      <div
        style={{ background:'#111318', border:'1px solid var(--border,#1e1e1e)', overflow:'hidden', transition:'border-color .2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor='#C8922A'}
        onMouseLeave={e => e.currentTarget.style.borderColor='var(--border,#1e1e1e)'}
      >
        {/* Image container with skeleton */}
        <div style={{ width:'100%', height:180, overflow:'hidden', position:'relative', background:'#0d1117' }}>

          {/* Skeleton shimmer — visible until image loads */}
          {!loaded && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(90deg, #111 25%, #1a1a1a 50%, #111 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.4s infinite',
            }} />
          )}

          <img
            src={src}
            alt={rel?.title || rel?.model || 'Firearm release'}
            loading="lazy"
            decoding="async"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              opacity: loaded ? 0.88 : 0,
              transition: 'opacity .3s ease',
              display: 'block',
            }}
            onLoad={() => setLoaded(true)}
            onError={handleError}
          />

          {/* Gradient overlay */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg,rgba(9,9,11,.75) 0%,transparent 55%)', pointerEvents:'none' }} />

          {/* JUST DROPPED badge */}
          {rel?.isJustDropped && (
            <span style={{
              position:'absolute', top:8, left:8,
              background:'#C8922A', color:'#000',
              fontFamily:"'IBM Plex Mono',monospace", fontSize:9, fontWeight:700,
              padding:'2px 7px', letterSpacing:'.08em',
            }}>
              JUST DROPPED
            </span>
          )}

          {/* Category label */}
          <span style={{
            position:'absolute', bottom:8, left:10,
            fontFamily:"'IBM Plex Mono',monospace", fontSize:9,
            color: catColor, fontWeight:700, letterSpacing:'.1em', textTransform:'uppercase',
          }}>
            {rel?.category}
          </span>
        </div>

        {/* Card body */}
        <div style={{ padding:'12px 14px 14px' }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6B7280', marginBottom:4, letterSpacing:'.04em' }}>
            {rel?.brand}
          </div>
          <div style={{
            fontFamily:"'Barlow Condensed',sans-serif", fontSize:16, fontWeight:700,
            color:'#E5E5E5', lineHeight:1.25, marginBottom:8,
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden',
          }}>
            {rel?.model}
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
            {rel?.caliber && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'2px 7px', background:'#1C2028', border:'1px solid #2A2F38', color:'#9CA3AF' }}>
                {rel.caliber}
              </span>
            )}
            {(rel?.action || rel?.actionType) && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, padding:'2px 7px', background:'#1C2028', border:'1px solid #2A2F38', color:'#9CA3AF' }}>
                {rel.action || rel.actionType}
              </span>
            )}
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            {rel?.msrp > 0 && (
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#C8922A', fontWeight:700 }}>
                ${rel.msrp.toLocaleString()}
              </span>
            )}
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginLeft:'auto' }}>
              READ →
            </span>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </a>
  )
}
