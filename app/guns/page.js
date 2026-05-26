import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import { client } from '../../sanity/lib/client'

export const metadata = { title: 'Firearm Encyclopedia — DownRange', description: 'Specs, history and variants for every major firearm.' }
export const revalidate = 86400

const POPULAR = [
  { slug: 'glock-17', name: 'Glock 17', caliber: '9mm', type: 'Pistol' },
  { slug: 'ar-15', name: 'AR-15', caliber: '5.56 NATO', type: 'Rifle' },
  { slug: 'ak-47', name: 'AK-47', caliber: '7.62x39', type: 'Rifle' },
  { slug: 'remington-870', name: 'Remington 870', caliber: '12 Gauge', type: 'Shotgun' },
  { slug: 'sig-p320', name: 'SIG P320', caliber: '9mm', type: 'Pistol' },
  { slug: 'ruger-10-22', name: 'Ruger 10/22', caliber: '.22 LR', type: 'Rifle' },
  { slug: 'mossberg-500', name: 'Mossberg 500', caliber: '12 Gauge', type: 'Shotgun' },
  { slug: 'smith-wesson-mp9', name: 'S&W M&P 9', caliber: '9mm', type: 'Pistol' },
]

export default function GunsPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="ENCYCLOPEDIA">
        <div className="container">
          <h1 className="page-hero-title">Firearm Encyclopedia</h1>
          <p className="page-hero-sub">Specs, history, variants and buying guides for every major platform</p>
        </div>
      </div>
      <div style={{ padding: '40px 0' }}>
        <div className="container">
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '20px' }}>POPULAR PLATFORMS</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {POPULAR.map(g => (
              <a key={g.slug} href={`/guns/${g.slug}`}
                style={{ background: '#111318', border: '1px solid var(--border)', padding: '20px', textDecoration: 'none', display: 'block', transition: 'border-color 0.2s' }}>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: '10px', color: '#C8922A', marginBottom: '6px', letterSpacing: '0.1em' }}>{g.type?.toUpperCase()} · {g.caliber}</div>
                <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '18px', fontWeight: 700, color: '#F0EDE6' }}>{g.name}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
