'use client'
import { useState } from 'react'
import Link from 'next/link'
import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'

// Static seed data with real gun images — shown when Sanity has no releases yet
const SEED_RELEASES = [
  { _id:'s1', brand:'Glock', model:'G47 MOS', category:'Pistol', caliber:'9mm', action:'Safe Action', msrp:599, isJustDropped:true, imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', summary:'Full-size duty pistol with optics-ready slide, 17+1 capacity. The latest addition to Glock\'s Gen5 MOS lineup.', sourceUrl:'https://us.glock.com' },
  { _id:'s2', brand:'SIG Sauer', model:'P365-XMACRO Comp', category:'Pistol', caliber:'9mm', action:'Striker-Fired', msrp:699, isJustDropped:true, imageUrl:'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=800&q=80', summary:'Compensated micro-compact with 17+1 capacity. Integrated compensator cuts muzzle flip dramatically.', sourceUrl:'https://www.sigsauer.com' },
  { _id:'s3', brand:'Smith & Wesson', model:'M&P15 Sport III', category:'Rifle', caliber:'5.56 NATO', action:'Semi-Auto', msrp:749, isJustDropped:true, imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', summary:'Updated MSR platform with M-LOK handguard, dust cover, and forward assist standard. Best-value AR-15.', sourceUrl:'https://www.smith-wesson.com' },
  { _id:'s4', brand:'Ruger', model:'LC Carbine', category:'Rifle', caliber:'5.7x28mm', action:'Semi-Auto', msrp:829, isJustDropped:false, imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', summary:'Pistol-caliber carbine chambered in 5.7x28mm. Takes FN FiveseveN magazines, threaded barrel standard.', sourceUrl:'https://www.ruger.com' },
  { _id:'s5', brand:'Mossberg', model:'590S Shockwave', category:'Shotgun', caliber:'12 Gauge', action:'Pump', msrp:549, isJustDropped:false, imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', summary:'Multi-caliber pump accepting 1.75", 2.75", and 3" shells. Raptor grip, non-NFA classification.', sourceUrl:'https://www.mossberg.com' },
  { _id:'s6', brand:'Taurus', model:'GX4 XL', category:'Pistol', caliber:'9mm', action:'Striker-Fired', msrp:399, isJustDropped:false, imageUrl:'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=800&q=80', summary:'Extended micro-compact with improved ergonomics, 13+1 capacity. Best budget EDC in 2024.', sourceUrl:'https://www.taurususa.com' },
  { _id:'s7', brand:'Beretta', model:'APX A1 Carry', category:'Pistol', caliber:'9mm', action:'Striker-Fired', msrp:449, isJustDropped:false, imageUrl:'https://images.unsplash.com/photo-1574180045827-681f8a1a9622?w=800&q=80', summary:'Slim EDC with removable chassis system. Optics-ready, flush 8+1 or extended 15-round magazines.', sourceUrl:'https://www.beretta.com' },
  { _id:'s8', brand:'Daniel Defense', model:'DDM4 V7 Pro', category:'Rifle', caliber:'5.56 NATO', action:'Semi-Auto', msrp:2299, isJustDropped:false, imageUrl:'https://images.unsplash.com/photo-1595590424283-b8f17842773f?w=800&q=80', summary:'Pro-series with Geissele SSA trigger, Surefire SOCOM suppressor-ready muzzle device, Milspec+ specs.', sourceUrl:'https://danieldefense.com' },
]

function ReleaseCard({ release, size = 'normal' }) {
  const img = release.heroImage?.asset?.url || release.imageUrl || release.productImage?.asset?.url
  const isLarge = size === 'large'

  return (
    <a href={release.sourceUrl || release.specUrl || '#'} target="_blank" rel="noreferrer" style={{ textDecoration: 'none', display: 'block' }}>
      <div style={{ background: '#111318', border: '1px solid var(--border)', overflow: 'hidden', width: isLarge ? '100%' : '220px', flexShrink: 0, transition: 'border-color 0.2s' }}
        onMouseEnter={e => e.currentTarget.style.borderColor = '#C8922A'}
        onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

        {/* Image */}
        <div style={{ width: '100%', height: isLarge ? '240px' : '150px', background: '#0D1117', position: 'relative', overflow: 'hidden' }}>
          {img ? (
            <img src={img} alt={`${release.brand} ${release.model}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }}
              onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='#16191F' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #111318, #1C2028)' }}>
              <span style={{ fontSize: isLarge ? '60px' : '40px', opacity: 0.2 }}>◈</span>
            </div>
          )}
          {/* Badges */}
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            {(release.isJustDropped || release.isNew) && (
              <span style={{ background: '#B91C1C', color: '#fff', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', fontWeight: 700, letterSpacing: '0.15em', padding: '3px 8px' }}>● NEW</span>
            )}
            {release.category && (
              <span style={{ background: 'rgba(0,0,0,0.7)', color: '#C8922A', fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', letterSpacing: '0.1em', padding: '3px 8px', backdropFilter: 'blur(4px)' }}>
                {release.category.toUpperCase()}
              </span>
            )}
          </div>
        </div>

        {/* Info */}
        <div style={{ padding: isLarge ? '20px' : '14px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#C8922A', letterSpacing: '0.1em', marginBottom: '4px' }}>{release.brand}</div>
          <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: isLarge ? '28px' : '20px', color: '#F0EDE6', letterSpacing: '0.03em', lineHeight: 1, marginBottom: '8px' }}>
            {release.model || release.title}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '10px' }}>
            {release.caliber && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', padding: '2px 7px', background: '#1C2028', border: '1px solid #2A2F38', color: '#6B7280' }}>{release.caliber}</span>}
            {(release.action || release.actionType) && <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '9px', padding: '2px 7px', background: '#1C2028', border: '1px solid #2A2F38', color: '#6B7280' }}>{release.action || release.actionType}</span>}
          </div>
          {release.summary && isLarge && (
            <p style={{ fontSize: '13px', color: '#6B7280', lineHeight: 1.6, marginBottom: '12px' }}>{release.summary}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            {release.msrp ? (
              <span style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '22px', color: '#C8922A', letterSpacing: '0.05em' }}>
                ${release.msrp.toLocaleString()}
              </span>
            ) : <span />}
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#4B5563' }}>VIEW →</span>
          </div>
        </div>
      </div>
    </a>
  )
}

export default function ReleasesPage({ releases = [], alerts = [] }) {
  const [activeCat, setActiveCat] = useState(null)
  const all = releases.length > 0 ? releases : SEED_RELEASES
  const filtered = activeCat ? all.filter(r => r.category === activeCat) : all
  const justDropped = filtered.filter(r => r.isJustDropped || r.isNew)
  const recent = filtered.filter(r => !r.isJustDropped && !r.isNew)
  const cats = [...new Set(all.map(r => r.category).filter(Boolean))]

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />
      <div className="page-hero" data-title="RELEASES">
        <div className="container">
          <h1 className="page-hero-title">New Releases</h1>
          <p className="page-hero-sub">Latest firearm announcements · {all.length} models tracked · Updated hourly</p>
        </div>
      </div>

      <div style={{ padding: '32px 0' }}>
        <div className="container">
          {/* Category filter */}
          <div className="filter-tabs" style={{ marginBottom: '32px' }}>
            {[{ label: 'All', val: null }, ...cats.map(c => ({ label: c, val: c }))].map(c => (
              <button key={c.val || 'all'} onClick={() => setActiveCat(c.val)}
                className={`filter-tab ${activeCat === c.val ? 'active' : ''}`}>{c.label}</button>
            ))}
          </div>

          {/* Just Dropped */}
          {justDropped.length > 0 && (
            <div style={{ marginBottom: '48px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#EF4444', letterSpacing: '0.05em' }}>⚡ JUST DROPPED</h2>
                <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#EF4444', background: '#1A0000', padding: '3px 10px', border: '1px solid #EF444440' }}>NEW THIS WEEK</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {justDropped.map(r => <ReleaseCard key={r._id} release={r} />)}
              </div>
            </div>
          )}

          {/* Recent releases */}
          {recent.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.8rem', color: '#C8922A', letterSpacing: '0.05em', marginBottom: '24px' }}>RECENT RELEASES</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>
                {recent.map(r => <ReleaseCard key={r._id} release={r} />)}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
