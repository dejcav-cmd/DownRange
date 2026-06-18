'use client'
import { useState } from 'react'

function isSafe(src) {
  if (!src || typeof src !== 'string' || !src.trim()) return false
  if (src.endsWith('.svg')) return false
  return src.startsWith('/') || src.startsWith('http')
}

export default function ArticleHeroImage({ src, alt, fallback }) {
  const initial    = isSafe(src) ? src : (fallback || '/img/photos/pistol.jpg')
  const [imgSrc, setImgSrc]   = useState(initial)
  const [loaded, setLoaded]   = useState(false)
  const [errored, setErrored] = useState(false)

  // Detect if image is a product shot on white/black bg (common for gun manufacturers)
  // vs a real scene photo — adjust objectFit accordingly
  const isManufacturerCDN = imgSrc.includes('smith-wesson.com') || imgSrc.includes('sigsauer.com') ||
    imgSrc.includes('ruger.com') || imgSrc.includes('glock.com') || imgSrc.includes('springfield-armory.com') ||
    imgSrc.includes('taurususa.com') || imgSrc.includes('mossberg.com') || imgSrc.includes('fnamerica.com') ||
    imgSrc.includes('waltherarms.com') || imgSrc.includes('canikusa.com') || imgSrc.includes('henryusa.com') ||
    imgSrc.includes('browning.com') || imgSrc.includes('winchesterguns.com') || imgSrc.includes('kimberamerica.com') ||
    imgSrc.includes('danieldefense.com') || imgSrc.includes('christensenarms.com')

  // Manufacturer product shots: contain = show full gun, no cropping
  // Scene photos: cover = fill the frame
  const fit = isManufacturerCDN ? 'contain' : 'cover'

  return (
    <>
      {/* Skeleton */}
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(90deg, #0d0d0f 25%, #1a1a1a 50%, #0d0d0f 75%)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 1.4s infinite',
        }} />
      )}
      <img
        src={imgSrc}
        alt={alt || ''}
        style={{
          width: '100%',
          height: '100%',
          objectFit: fit,
          objectPosition: 'center',
          display: 'block',
          opacity: loaded ? 1 : 0,
          transition: 'opacity .4s ease',
          // For product shots on dark bg, add subtle padding so gun isn't edge-to-edge
          padding: isManufacturerCDN ? '20px' : '0',
          boxSizing: 'border-box',
        }}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!errored) {
            setErrored(true)
            setImgSrc(fallback || '/img/photos/pistol.jpg')
          }
        }}
      />
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </>
  )
}
