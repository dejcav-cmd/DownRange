'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@sanity/client'

// Fallback static prices shown while Sanity loads
const FALLBACK = [
  { cal: '9mm',     price: '18.9¢/rd', trend: '↓', good: true  },
  { cal: '5.56',    price: '32.1¢/rd', trend: '↑', good: false },
  { cal: '.308',    price: '74.5¢/rd', trend: '↓', good: true  },
  { cal: '.45 ACP', price: '38.7¢/rd', trend: '↑', good: false },
  { cal: '.22 LR',  price: '7.1¢/rd',  trend: '↓', good: true  },
  { cal: '6.5 CM',  price: '$1.42',     trend: '↑', good: false },
  { cal: '7mm PRC', price: '$2.20',     trend: '↑', good: false },
  { cal: '6.5 PRC', price: '$1.75',     trend: '↑', good: false },
  { cal: '.300 PRC',price: '$2.85',     trend: '↑', good: false },
  { cal: '12 GA',   price: '41.2¢/rd', trend: '↓', good: true  },
  { cal: '7.62x39', price: '28.5¢/rd', trend: '↑', good: false },
  { cal: '.300 BLK',price: '56.8¢/rd', trend: '↑', good: false },
]

function fmtPrice(ppr) {
  if (!ppr) return '—'
  return ppr < 1 ? `${(ppr * 100).toFixed(1)}¢/rd` : `$${ppr.toFixed(2)}`
}

export default function AmmoPriceTicker() {
  const [items, setItems] = useState(FALLBACK)

  useEffect(() => {
    const client = createClient({
      projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
      dataset: 'production',
      apiVersion: '2024-01-01',
      useCdn: true,
    })
    client
      .fetch('*[_type=="ammoPrice"] | order(caliber asc) { caliber, caliberSlug, pricePerRound, trendDirection, trendPercent }')
      .then(docs => {
        if (!docs || docs.length < 3) return
        const live = docs.map(d => ({
          cal:   d.caliber || d.caliberSlug || '?',
          price: fmtPrice(d.pricePerRound),
          trend: d.trendDirection === 'up' ? '↑' : d.trendDirection === 'down' ? '↓' : '→',
          good:  d.trendDirection !== 'up',
        }))
        setItems(live)
      })
      .catch(() => { /* silent — fallback stays */ })
  }, [])

  const doubled = [...items, ...items]

  return (
    <div style={{
      background: 'var(--bg2)',
      borderTop: '1px solid var(--border)',
      borderBottom: '1px solid var(--border)',
      overflow: 'hidden',
      height: '32px',
      display: 'flex',
      alignItems: 'center',
    }}>
      {/* Label */}
      <div style={{
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: '9px',
        color: 'var(--text-dim)',
        background: 'var(--bg3)',
        padding: '0 12px',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        flexShrink: 0,
        borderRight: '1px solid var(--border)',
        letterSpacing: '0.1em',
        whiteSpace: 'nowrap',
      }}>
        AMMO INDEX
      </div>

      {/* Scrolling ticker */}
      <div style={{ overflow: 'hidden', flex: 1 }}>
        <div style={{
          display: 'flex',
          gap: '0',
          animation: 'ammoTicker 30s linear infinite',
          width: 'max-content',
        }}>
          {doubled.map((p, i) => (
            <div key={i} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '0 20px',
              borderRight: '1px solid var(--border)',
              height: '32px',
              flexShrink: 0,
            }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
                {p.cal}
              </span>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', fontWeight: 700, color: p.good ? '#22C55E' : 'var(--text)' }}>
                {p.price}
              </span>
              <span style={{ fontSize: '9px', color: p.good ? '#22C55E' : '#EF4444' }}>
                {p.trend}
              </span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes ammoTicker {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  )
}
