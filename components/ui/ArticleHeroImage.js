'use client'
import { useState } from 'react'

export default function ArticleHeroImage({ src, alt, fallback }) {
  const [imgSrc, setImgSrc] = useState(src || fallback)

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
