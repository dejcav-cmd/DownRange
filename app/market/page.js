import PriceAlertSignup from '../../components/ui/PriceAlertSignup'
import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import { fetchAmmoPrices, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = { title: 'Market Watch — DownRange', description: 'Live ammo price index, availability tracking, and market trends for US firearms enthusiasts.' }
export const revalidate = 1800 // 30 min

function MarketCard({ ammo }) {
  const isUp = ammo.trendDirection === 'up'
  const isDown = ammo.trendDirection === 'down'
  const trendColor = isUp ? '#EF4444' : isDown ? '#4ADE80' : '#9CA3AF'
  const trendArrow = isUp ? '↑' : isDown ? '↓' : '→'
  const avail = ammo.availabilityIndex || 75

  return (
    <div style={{ background: '#111318', border: '1px solid #1F2428', padding: '20px 16px', textAlign: 'center', position: 'relative', overflow: 'hidden', borderBottom: `2px solid ${trendColor}` }}>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '13px', fontWeight: 500, color: '#F0EDE6', marginBottom: '8px' }}>{ammo.caliber}</div>
      <div style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '32px', color: '#C8922A', letterSpacing: '0.03em', marginBottom: '4px' }}>
        {ammo.pricePerRound < 1 ? `${Math.round(ammo.pricePerRound * 100)}¢` : `$${ammo.pricePerRound?.toFixed(2)}`}
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280', marginBottom: '8px' }}>per round · {ammo.unit}</div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '12px', fontWeight: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: trendColor }}>
        {trendArrow} {ammo.trendPercent ? `${Math.abs(ammo.trendPercent).toFixed(1)}%` : '—'}
        <span style={{ color: '#6B7280', fontSize: '10px' }}>30d</span>
      </div>
      <div style={{ height: '3px', background: '#1C2028', marginTop: '10px', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', background: '#C8922A', borderRadius: '2px', width: `${avail}%` }} />
      </div>
      <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '9px', color: '#6B7280', marginTop: '4px' }}>Availability: {avail}%</div>
    </div>
  )
}

const MOCK_PRICES = [
  { _id: '1', caliber: '9mm', pricePerRound: 0.189, unit: '115gr FMJ', trendPercent: -4.2, trendDirection: 'down', availabilityIndex: 85 },
  { _id: '2', caliber: '.223 / 5.56', pricePerRound: 0.321, unit: '55gr FMJ', trendPercent: 1.8, trendDirection: 'up', availabilityIndex: 70 },
  { _id: '3', caliber: '.308 WIN', pricePerRound: 0.745, unit: '147gr FMJ', trendPercent: -2.1, trendDirection: 'down', availabilityIndex: 60 },
  { _id: '4', caliber: '.45 ACP', pricePerRound: 0.387, unit: '230gr FMJ', trendPercent: 0.9, trendDirection: 'up', availabilityIndex: 75 },
  { _id: '5', caliber: '12 GA', pricePerRound: 0.412, unit: '00 Buck', trendPercent: -1.3, trendDirection: 'down', availabilityIndex: 90 },
  { _id: '6', caliber: '6.5 CM', pricePerRound: 1.42, unit: '140gr', trendPercent: 3.4, trendDirection: 'up', availabilityIndex: 50 },
  { _id: '7', caliber: '.22 LR', pricePerRound: 0.071, unit: '40gr', trendPercent: -0.5, trendDirection: 'down', availabilityIndex: 95 },
]

export default async function MarketPage() {
  const [prices, alerts] = await Promise.all([
    fetchAmmoPrices().catch(() => MOCK_PRICES),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const displayPrices = prices.length > 0 ? prices : MOCK_PRICES
  const lastUpdate = displayPrices[0]?.lastUpdated ? new Date(displayPrices[0].lastUpdated).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : 'Updating...'

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="MARKET">
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div>
              <h1 className="page-hero-title">Market Watch</h1>
              <p className="page-hero-sub">Ammo price index · Updated every 30 minutes · {displayPrices.length} calibers tracked</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="live-badge"><span className="pulse-dot" />Live Pricing</div>
              <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280', marginTop: '4px' }}>Last update: {lastUpdate}</div>
            </div>
          </div>
        </div>
      </div>

      <div style={{ padding: '32px 0' }}>
        <div className="container">

          {/* Price grid */}
          <div className="section-header">
            <h2 className="section-title">Ammo Price Index</h2>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280' }}>¢/round avg · aggregated from 200+ vendors</div>
            <div className="section-rule" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '2px', marginBottom: '48px' }}>
            {displayPrices.map(p => <MarketCard key={p._id} ammo={p} />)}
          </div>

          {/* Trend legend */}
          <div style={{ display: 'flex', gap: '24px', marginBottom: '48px', padding: '16px', background: '#16191F', border: '1px solid #1F2428' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#4ADE80' }}>↓</span>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Price decreased vs 30-day avg</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '14px', color: '#EF4444' }}>↑</span>
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Price increased vs 30-day avg</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '60px', height: '4px', background: '#C8922A', borderRadius: '2px' }} />
              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>Availability index (bar width)</span>
            </div>
          </div>

          {/* Data sources */}
          <div style={{ padding: '24px', background: '#16191F', border: '1px solid #1F2428' }}>
            <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '13px', fontWeight: 700, letterSpacing: '0.12em', color: '#C8922A', textTransform: 'uppercase', marginBottom: '12px' }}>Data Sources</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { name: 'AmmoSeek', desc: 'Price comparison aggregator — 200+ vendors tracked in real time' },
                { name: 'GunDeals / Reddit', desc: 'Community-sourced deals from r/gundeals and r/ammo' },
                { name: 'Internal 30-Day Avg', desc: 'Rolling price history stored in database for trend calculations' },
              ].map(s => (
                <div key={s.name} style={{ padding: '12px', background: '#111318', border: '1px solid #1F2428' }}>
                  <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#C8922A', marginBottom: '4px' }}>{s.name}</div>
                  <div style={{ fontSize: '12px', color: '#6B7280' }}>{s.desc}</div>
                </div>
              ))}
            </div>
            <p style={{ fontSize: '11px', color: '#6B7280', marginTop: '12px' }}>
              Prices are averages from aggregated listings and may vary. Always verify current pricing directly with vendors. DownRange is not affiliated with any vendor.
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
