'use client'

import { useState } from 'react'
import Link from 'next/link'

// ── HELPERS ────────────────────────────────────────────────────────────────────
function fmt(ppr) {
  if (!ppr && ppr !== 0) return '—'
  return ppr < 1 ? `${(ppr * 100).toFixed(1)}¢` : `$${ppr.toFixed(2)}`
}
function availColor(n) { return n >= 80 ? '#22c55e' : n >= 55 ? '#f59e0b' : '#ef4444' }
function availLabel(n) { return n >= 80 ? 'STOCKED' : n >= 55 ? 'LIMITED' : 'LOW' }

// ── CATEGORY CONFIG ────────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'pistol',
    label: 'HANDGUN',
    sub: 'Pistol & Revolver',
    photo: '/img/photos/pistol.jpg',
    icon: '🔫',
    desc: 'EDC, duty, and competition handgun calibers',
  },
  {
    id: 'rifle',
    label: 'RIFLE',
    sub: 'Semi-Auto & Bolt Action',
    photo: '/img/photos/rifle.jpg',
    icon: '🎯',
    desc: 'Common rifle calibers for range and tactical use',
  },
  {
    id: 'precision',
    label: 'PRECISION',
    sub: 'PRC Family & Long Range',
    photo: '/img/photos/blog-ammo-market.jpg',
    icon: '◎',
    desc: 'Match-grade precision and PRC family cartridges',
  },
  {
    id: 'rimfire',
    label: 'RIMFIRE',
    sub: 'Training & Small Game',
    photo: '/img/photos/ammo.jpg',
    icon: '⚡',
    desc: 'High-volume training at the lowest cost per round',
  },
  {
    id: 'magnum',
    label: 'MAGNUM',
    sub: 'Hunting & Long Range',
    photo: '/img/photos/rifle.jpg',
    icon: '💥',
    desc: 'Magnum hunting cartridges for big game and distance',
  },
  {
    id: 'shotgun',
    label: 'SHOTGUN',
    sub: 'Home Defense & Sport',
    photo: '/img/photos/shotgun.jpg',
    icon: '🏹',
    desc: 'Buckshot, slug, and sport loads',
  },
]

// ── SIGNAL BADGE ───────────────────────────────────────────────────────────────
function SignalBadge({ signal, color, size = 'sm' }) {
  const fs = size === 'lg' ? 13 : 9
  const pad = size === 'lg' ? '5px 14px' : '2px 8px'
  return (
    <span style={{
      fontFamily: "'IBM Plex Mono', monospace",
      fontSize: fs,
      fontWeight: 700,
      color: color,
      background: color + '18',
      border: `1px solid ${color}55`,
      padding: pad,
      borderRadius: 2,
      letterSpacing: '0.1em',
      whiteSpace: 'nowrap',
    }}>
      {signal}
    </span>
  )
}

// ── AMMOSEEK SEARCH URL FALLBACK (honest, working, no fake links) ─────────────
function ammoseekUrl(caliberSlug) {
  return `https://www.ammoseek.com/ammo/${caliberSlug || ''}`
}

// ── CALIBER CARD ───────────────────────────────────────────────────────────────
// retailers come from Sanity (live AmmoSeek data) or fall back to AmmoSeek search
function CaliberCard({ a }) {
  const [open, setOpen] = useState(false)
  const up = a.dir === 'up'
  const tc = up ? '#ef4444' : '#22c55e'
  const ac = availColor(a.avail)

  // Live retailers from Sanity (populated by AmmoSeek RSS cron every 4h)
  // Each entry: { vendor, price, url (AmmoSeek redirect), inStock, label }
  const liveRetailers = a.liveRetailers || []
  const hasLive = liveRetailers.length > 0

  // Best price row: live data first, fallback to AmmoSeek search page
  const bestRetailer = hasLive ? liveRetailers[0] : null
  const fallbackUrl  = ammoseekUrl(a.caliberSlug || a.caliber.toLowerCase().replace(/[^a-z0-9]/g, '-'))

  return (
    <div style={{
      background: 'var(--bg2)',
      border: '1px solid var(--border)',
      borderTop: `3px solid ${a.signalColor}`,
      borderRadius: 4,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.15s, box-shadow 0.15s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 32px ${a.signalColor}18` }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none' }}
    >
      {/* ── MAIN ROW ── */}
      <div style={{ padding: '14px 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 22, color: 'var(--text)', letterSpacing: '0.04em', lineHeight: 1 }}>
            {a.caliber}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)', marginTop: 2 }}>
            {a.grain} · {a.brand}
          </div>
        </div>
        <SignalBadge signal={a.signal} color={a.signalColor} />
      </div>

      {/* ── PRICE ROW ── */}
      <div style={{ padding: '0 16px 10px', display: 'flex', alignItems: 'flex-end', gap: 12, borderBottom: '1px solid var(--border)' }}>
        <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 38, color: 'var(--gold)', lineHeight: 1, letterSpacing: '0.02em' }}>
          {fmt(a.ppr)}
        </div>
        <div style={{ paddingBottom: 4 }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--text-dim)' }}>per round avg</div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, color: tc }}>
            {up ? '▲' : '▼'} {Math.abs(a.trend).toFixed(1)}% 30d
          </div>
        </div>
        <div style={{ marginLeft: 'auto', paddingBottom: 4, textAlign: 'right' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: ac, fontWeight: 700 }}>
            ● {availLabel(a.avail)}
          </div>
          {hasLive && (
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: '#22c55e', marginTop: 1 }}>
              ✓ LIVE DATA
            </div>
          )}
        </div>
      </div>

      {/* ── BEST PRICE ROW ── */}
      {bestRetailer ? (
        <a href={bestRetailer.url} target="_blank" rel="noreferrer noopener" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 16px',
          background: 'rgba(200,146,42,0.06)',
          borderBottom: '1px solid var(--border)',
          textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, fontWeight: 700, color: 'var(--gold)', background: 'rgba(200,146,42,0.15)', padding: '1px 5px', borderRadius: 1 }}>
              BEST PRICE
            </span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{bestRetailer.vendor}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: bestRetailer.inStock !== false ? '#22c55e' : '#f59e0b' }}>
              ● {bestRetailer.inStock !== false ? 'In Stock' : 'Limited'}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 18, color: 'var(--gold)', letterSpacing: '0.03em' }}>{fmt(bestRetailer.price)}</span>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)' }}>↗</span>
          </div>
        </a>
      ) : (
        <a href={fallbackUrl} target="_blank" rel="noreferrer noopener" style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '9px 16px',
          background: 'rgba(30,41,59,0.3)',
          borderBottom: '1px solid var(--border)',
          textDecoration: 'none',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7, color: 'var(--text-dim)', background: 'rgba(30,41,59,0.5)', padding: '1px 5px', borderRadius: 1 }}>
              COMPARE PRICES
            </span>
            <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, color: 'var(--text-muted)' }}>AmmoSeek — All Retailers</span>
          </div>
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)' }}>↗</span>
        </a>
      )}

      {/* ── EXPAND TOGGLE ── */}
      {(a.analysis || liveRetailers.length > 1) && (
        <button
          onClick={() => setOpen(o => !o)}
          style={{
            width: '100%', padding: '7px 16px',
            background: 'transparent', border: 'none',
            borderBottom: open ? '1px solid var(--border)' : 'none',
            cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}
        >
          <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.08em' }}>
            {open ? '▲ COLLAPSE' : `▼ ${liveRetailers.length > 1 ? `${liveRetailers.length - 1} MORE RETAILERS` : 'ANALYSIS'}`}
          </span>
        </button>
      )}

      {/* ── EXPANDED CONTENT ── */}
      {open && (
        <div>
          {a.analysis && (
            <div style={{ padding: '10px 16px', borderBottom: liveRetailers.length > 1 ? '1px solid var(--border)' : 'none', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.6 }}>
                {a.analysis}
              </div>
            </div>
          )}
          {liveRetailers.length > 1 && (
            <div style={{ padding: '8px 16px 12px' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--text-dim)', letterSpacing: '0.1em', marginBottom: 6 }}>
                MORE RETAILERS — VIA AMMOSEEK
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {liveRetailers.slice(1).map((r, i) => (
                  <a key={i} href={r.url} target="_blank" rel="noreferrer noopener" style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 10px',
                    background: 'rgba(0,0,0,0.15)',
                    border: '1px solid rgba(30,41,59,0.5)',
                    borderRadius: 3, textDecoration: 'none',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{r.vendor}</span>
                      <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: r.inStock !== false ? '#22c55e' : '#f59e0b' }}>
                        ● {r.inStock !== false ? 'In Stock' : 'Limited'}
                      </span>
                    </div>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 15, color: 'var(--text-dim)', letterSpacing: '0.03em' }}>{fmt(r.price)}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── CATEGORY SECTION ───────────────────────────────────────────────────────────
function CategorySection({ cat, prices }) {
  const group = prices.filter(p => p.cat === cat.id)
  if (!group.length) return null

  const urgentCount = group.filter(p => p.signal === 'BUY NOW').length
  const buyCount    = group.filter(p => p.signal === 'BUY').length

  return (
    <section style={{ marginBottom: 48 }}>
      {/* ── CATEGORY BANNER ── */}
      <div style={{
        position: 'relative',
        height: 110,
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 20,
        border: '1px solid var(--border)',
      }}>
        {/* Photo */}
        <img
          src={cat.photo}
          alt={cat.label}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', filter: 'brightness(0.35) saturate(0.6)' }}
        />
        {/* Gold gradient scrrim */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(200,146,42,0.25) 0%, transparent 60%)' }} />
        {/* Content */}
        <div style={{ position: 'relative', height: '100%', display: 'flex', alignItems: 'center', padding: '0 28px', gap: 20 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'rgba(200,146,42,0.8)', letterSpacing: '0.2em', marginBottom: 4 }}>
              {cat.sub.toUpperCase()}
            </div>
            <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2rem,4vw,2.8rem)', color: '#fff', letterSpacing: '0.04em', lineHeight: 1 }}>
              {cat.label}
            </div>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 4 }}>
              {cat.desc}
            </div>
          </div>
          {/* Right stats */}
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: urgentCount > 0 ? '#ef4444' : '#22c55e', lineHeight: 1 }}>
                {group.length}
              </div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>CALIBERS</div>
            </div>
            {urgentCount > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: '#ef4444', lineHeight: 1 }}>{urgentCount}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>BUY NOW</div>
              </div>
            )}
            {buyCount > 0 && (
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 28, color: '#22c55e', lineHeight: 1 }}>{buyCount}</div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'rgba(255,255,255,0.35)' }}>BUY</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── CALIBER CARDS GRID ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
        {group.map(a => <CaliberCard key={a._id} a={a} />)}
      </div>
    </section>
  )
}

// ── NICS MINI BAR ──────────────────────────────────────────────────────────────
function NicsBar({ month, checks, max }) {
  const pct = Math.round((checks / max) * 100)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)', width: 44, textAlign: 'right', flexShrink: 0 }}>{month}</div>
      <div style={{ flex: 1, height: 18, background: 'rgba(0,0,0,0.4)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: 'linear-gradient(90deg,var(--gold),var(--gold-light))', borderRadius: 2, transition: 'width 0.8s ease' }} />
        <div style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-muted)' }}>
          {(checks / 1000000).toFixed(2)}M
        </div>
      </div>
    </div>
  )
}

// ── MAIN CLIENT COMPONENT ──────────────────────────────────────────────────────
export default function MarketClient({ prices, analysis, nicsData }) {
  const [activeFilter, setActiveFilter] = useState('all')

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
  const nicsMax = Math.max(...nicsData.map(d => d.checks))

  const buyNow  = prices.filter(p => p.signal === 'BUY NOW').sort((a, b) => b.trend - a.trend)
  const bestBuy = prices.filter(p => p.signal === 'BUY').sort((a, b) => a.ppr - b.ppr)[0]
  const lowStock = prices.filter(p => p.avail < 50)

  // Overall market signal
  const urgentCount = buyNow.length
  const overallSignal = urgentCount >= 4 ? 'ACT NOW' : urgentCount >= 2 ? 'ACTIVE BUYER' : 'BUYER MARKET'
  const overallColor  = urgentCount >= 4 ? '#ef4444' : urgentCount >= 2 ? '#f59e0b' : '#22c55e'

  const displayedCats = activeFilter === 'all'
    ? CATEGORIES
    : CATEGORIES.filter(c => c.id === activeFilter)

  return (
    <>
      <style>{`
        @keyframes tickerScroll { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .mkt-cat-btn:hover { background: rgba(200,146,42,0.12) !important; border-color: rgba(200,146,42,0.4) !important; }
        .mkt-cat-btn.active { background: rgba(200,146,42,0.15) !important; border-color: var(--gold) !important; color: var(--gold) !important; }
      `}</style>

      {/* ══════════════════════════════════════════════
          HERO — Full-width market status
      ══════════════════════════════════════════════ */}
      <div style={{
        background: 'linear-gradient(180deg, var(--bg2) 0%, var(--bg) 100%)',
        borderBottom: '1px solid var(--border)',
        padding: '36px 0 32px',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Ambient radial glow */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: `radial-gradient(circle, ${overallColor}10 0%, transparent 70%)`, pointerEvents: 'none' }} />

        <div className="container" style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 32, alignItems: 'flex-start', justifyContent: 'space-between' }}>

            {/* Left: headline */}
            <div style={{ animation: 'fadeUp 0.5s ease both' }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12, flexWrap: 'wrap' }}>
                <span style={{ background: 'var(--gold)', color: 'var(--bg)', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', padding: '3px 12px' }}>
                  MARKET WATCH
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#001A0A', color: '#22C55E', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, fontWeight: 700, padding: '3px 10px', border: '1px solid #22C55E40' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', animation: 'pulse 2s infinite', display: 'inline-block' }} />
                  LIVE
                </span>
              </div>

              <h1 style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 'clamp(2.4rem,5vw,3.8rem)', color: 'var(--text)', letterSpacing: '0.02em', lineHeight: 0.95, margin: '0 0 10px' }}>
                Ammo Price Index<br />
                <span style={{ color: 'var(--gold)' }}>19 Calibers · Direct Retailer Links</span>
              </h1>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-dim)', margin: 0 }}>
                {today} · Sources: AmmoSeek · gun.deals · r/gundeals
              </p>
            </div>

            {/* Right: overall signal + top stats */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'fadeUp 0.5s 0.1s ease both' }}>
              {/* Big signal card */}
              <div style={{
                background: 'var(--bg3)',
                border: `1px solid ${overallColor}44`,
                borderTop: `3px solid ${overallColor}`,
                borderRadius: 4, padding: '16px 24px', minWidth: 160, textAlign: 'center',
              }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.12em', marginBottom: 6 }}>
                  MARKET SIGNAL
                </div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 32, color: overallColor, lineHeight: 1, letterSpacing: '0.04em' }}>
                  {overallSignal}
                </div>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)', marginTop: 4 }}>
                  {urgentCount} urgent · {buyNow.length + prices.filter(p => p.signal === 'BUY').length} buy signals
                </div>
              </div>

              {/* Mini stat pills */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, justifyContent: 'center' }}>
                {bestBuy && (
                  <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 4, padding: '8px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)' }}>BEST BUY</span>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: '#22c55e', letterSpacing: '0.03em' }}>{bestBuy.caliber}</span>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: 'var(--gold)' }}>{fmt(bestBuy.ppr)}</span>
                  </div>
                )}
                {buyNow[0] && (
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 4, padding: '8px 16px', display: 'flex', gap: 10, alignItems: 'center' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#ef4444' }}>⚠ ACT FAST</span>
                    <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 20, color: 'var(--text)', letterSpacing: '0.03em' }}>{buyNow[0].caliber}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: '#ef4444', fontWeight: 700 }}>+{buyNow[0].trend.toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Scrolling price ticker */}
          <div style={{ marginTop: 24, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 3, overflow: 'hidden', height: 30, display: 'flex', alignItems: 'center' }}>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--text-dim)', background: 'var(--bg3)', padding: '0 12px', height: '100%', display: 'flex', alignItems: 'center', flexShrink: 0, borderRight: '1px solid var(--border)', letterSpacing: '0.15em', whiteSpace: 'nowrap' }}>
              AMMO INDEX
            </div>
            <div style={{ overflow: 'hidden', flex: 1 }}>
              <div style={{ display: 'flex', animation: 'tickerScroll 40s linear infinite', width: 'max-content' }}>
                {[...prices, ...prices].map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '0 18px', borderRight: '1px solid var(--border)', height: 30, flexShrink: 0 }}>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)' }}>{a.caliber}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, fontWeight: 700, color: 'var(--gold)' }}>{fmt(a.ppr)}</span>
                    <span style={{ fontSize: 9, color: a.dir === 'down' ? '#22c55e' : '#ef4444' }}>{a.dir === 'down' ? '▼' : '▲'}</span>
                    <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: a.signalColor }}>{a.signal}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          AI MARKET BRIEF
      ══════════════════════════════════════════════ */}
      {analysis && (
        <div style={{ background: 'rgba(200,146,42,0.04)', borderBottom: '1px solid rgba(200,146,42,0.2)' }}>
          <div className="container" style={{ padding: '20px 0' }}>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'flex-start' }}>
              <div style={{ borderLeft: '3px solid var(--gold)', paddingLeft: 16, flex: 1, minWidth: 260 }}>
                <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--gold)', letterSpacing: '0.15em', marginBottom: 6 }}>📊 AI MARKET BRIEF</div>
                <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.3rem', color: 'var(--text)', letterSpacing: '0.04em', marginBottom: 6 }}>{analysis.title}</div>
                <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.65, margin: 0 }}>{analysis.summary}</p>
              </div>
              {analysis.bullets?.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, minWidth: 240 }}>
                  {analysis.bullets.map((b, i) => (
                    <div key={i} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, color: 'var(--text-muted)', paddingLeft: 14, position: 'relative', lineHeight: 1.5 }}>
                      <span style={{ position: 'absolute', left: 0, color: 'var(--gold)' }}>◈</span> {b}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════
          MAIN CONTENT
      ══════════════════════════════════════════════ */}
      <div style={{ padding: '32px 0 64px' }}>
        <div className="container">

          {/* ── CATEGORY FILTER TABS ── */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 36, alignItems: 'center' }}>
            <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)', letterSpacing: '0.1em', marginRight: 4 }}>FILTER:</span>
            {[{ id: 'all', label: 'ALL 19', icon: '◼' }, ...CATEGORIES.map(c => ({ id: c.id, label: c.label, icon: c.icon }))].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`mkt-cat-btn${activeFilter === tab.id ? ' active' : ''}`}
                style={{
                  fontFamily: 'Barlow Condensed, sans-serif',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.1em',
                  color: activeFilter === tab.id ? 'var(--gold)' : 'var(--text-dim)',
                  background: activeFilter === tab.id ? 'rgba(200,146,42,0.15)' : 'var(--bg2)',
                  border: `1px solid ${activeFilter === tab.id ? 'var(--gold)' : 'var(--border)'}`,
                  borderRadius: 3, padding: '5px 14px',
                  cursor: 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}
              >
                <span style={{ fontSize: 10 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* ── URGENT ALERTS STRIP (shown when all view) ── */}
          {activeFilter === 'all' && buyNow.length > 0 && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.25)', borderLeft: '3px solid #ef4444', borderRadius: 4, padding: '12px 20px', marginBottom: 36, display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#ef4444', letterSpacing: '0.12em', fontWeight: 700, flexShrink: 0 }}>
                ⚠ BUY NOW ALERTS
              </div>
              {buyNow.map(p => (
                <div key={p._id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 3, padding: '4px 12px' }}>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 15, color: 'var(--text)', letterSpacing: '0.04em' }}>{p.caliber}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: '#ef4444', fontWeight: 700 }}>+{p.trend.toFixed(1)}%</span>
                  <span style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 15, color: 'var(--gold)' }}>{fmt(p.ppr)}</span>
                </div>
              ))}
            </div>
          )}

          {/* ── CALIBER SECTIONS BY CATEGORY ── */}
          {displayedCats.map(cat => (
            <CategorySection key={cat.id} cat={cat} prices={prices} />
          ))}

          {/* ══════════════════════════════════════════════
              BOTTOM ROW: NICS + Intel + Quick Links
          ══════════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16, marginTop: 16 }}>

            {/* NICS */}
            <div className="dr-card" style={{ padding: 20 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.05em', color: 'var(--gold)', margin: '0 0 4px' }}>NICS BACKGROUND CHECKS</div>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)', margin: '0 0 14px', lineHeight: 1.5 }}>
                NICS spikes precede ammo price surges by 30-60 days. Watch the trend.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {nicsData.map(d => <NicsBar key={d.month} {...d} max={nicsMax} />)}
              </div>
              <div style={{ marginTop: 10, fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--text-dim)' }}>
                Source: FBI NICS · data-liberation-project
              </div>
            </div>

            {/* Market Intel */}
            <div className="dr-card" style={{ padding: 20 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.05em', color: 'var(--text)', margin: '0 0 14px' }}>MARKET INTELLIGENCE</div>
              {[
                { label:'NICS Trend',    value:'↓ 3.2% MoM', detail:'Inventory building. Buyer market.', dir:'good' },
                { label:'Import Supply', value:'Constrained',  detail:'7.62x39 restricted. 9mm plentiful.', dir:'warn' },
                { label:'Best Value',    value:'9mm at 18.9¢', detail:'Near all-time low.',                dir:'good' },
                { label:'Urgent Buy',    value:'7.62x39',      detail:'+8.2% — import risk. Act now.',    dir:'bad'  },
                { label:'PRC Supply',    value:'Critical',      detail:'7mm PRC near zero — buy on sight.', dir:'bad' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '110px 1fr', gap: 8, padding: '7px 0', borderBottom: i < 4 ? '1px solid rgba(30,41,59,0.5)' : 'none' }}>
                  <div>
                    <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, color: 'var(--text-dim)', marginBottom: 1 }}>{item.label}</div>
                    <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: 13, letterSpacing: '0.04em', color: item.dir==='good'?'#22c55e':item.dir==='bad'?'#ef4444':'#f59e0b' }}>{item.value}</div>
                  </div>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.5, paddingTop: 2 }}>{item.detail}</div>
                </div>
              ))}
            </div>

            {/* Quick Links */}
            <div className="dr-card" style={{ padding: 20 }}>
              <div style={{ fontFamily: 'Bebas Neue, sans-serif', fontSize: '1.2rem', letterSpacing: '0.05em', color: 'var(--text)', margin: '0 0 14px' }}>GO DEEPER</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label:'Live Deals Feed',  href:'/deals',          desc:'r/gundeals + retailers hourly', icon:'📊' },
                  { label:'State Ammo Laws',  href:'/laws',           desc:'Capacity + restrictions by state', icon:'⚖' },
                  { label:'NFA Tracker',      href:'/nfa-tracker',    desc:'Form 4 suppressor wait times', icon:'🔫' },
                  { label:'Value Estimator',  href:'/value-estimator',desc:'What is your firearm worth today?', icon:'💰' },
                  { label:'Ballistics Calc',  href:'/ballistics',     desc:'Trajectory, drop, wind drift', icon:'◎' },
                ].map(t => (
                  <Link key={t.href} href={t.href} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border)', borderRadius: 3, textDecoration: 'none', transition: 'border-color 0.15s' }}>
                    <span style={{ fontSize: 14, flexShrink: 0 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontFamily: 'Barlow Condensed, sans-serif', fontSize: 13, fontWeight: 700, color: 'var(--text)', lineHeight: 1 }}>{t.label}</div>
                      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 9, color: 'var(--text-dim)' }}>{t.desc}</div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
