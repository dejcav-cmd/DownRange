'use client'
import { useState } from 'react'

// Validate that a URL is likely to actually load as an image.
// Rejects null, empty, SVGs, and obviously broken paths.
function isSafeImageSrc(src) {
  if (!src || typeof src !== 'string' || src.trim() === '') return false
  if (src.endsWith('.svg')) return false
  // Must be a real path or http URL
  if (!src.startsWith('/') && !src.startsWith('http')) return false
  return true
}

export default function ArticleHeroImage({ src, alt, fallback }) {
  const initial = isSafeImageSrc(src) ? src : fallback
  const [imgSrc, setImgSrc] = useState(initial)

  return (
    <img
      src={imgSrc}
      alt={alt || ''}
      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      onError={() => {
        if (imgSrc !== fallback) setImgSrc(fallback)
      }}
    />
  )
}
