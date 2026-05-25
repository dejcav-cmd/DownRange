import Masthead from '../../components/layout/Masthead'
import Footer   from '../../components/layout/Footer'

export const metadata = {
  title: 'About | DownRange',
  description: 'DownRange is the most comprehensive 2A news and intelligence platform in the country.',
}

export default function AboutPage() {
  return (
    <>
      <Masthead />
      <main style={{ background: '#0A0B0C', minHeight: '100vh' }}>
        <section style={{ borderBottom: '1px solid #1F2428', padding: '80px 0 60px', background: 'linear-gradient(180deg, #111318 0%, #0A0B0C 100%)' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
            <p style={{ color: '#C8922A', fontSize: 13, letterSpacing: 4, textTransform: 'uppercase', margin: '0 0 16px' }}>About DownRange</p>
            <h1 style={{ fontFamily: 'var(--font-bebas, Impact)', fontSize: 'clamp(52px, 8vw, 86px)', letterSpacing: 4, color: '#F5F5F3', margin: '0 0 24px', lineHeight: 1 }}>
              AMERICA'S FIREARMS<br /><span style={{ color: '#C8922A' }}>INTELLIGENCE HUB</span>
            </h1>
            <p style={{ color: '#94A3B8', fontSize: 18, lineHeight: 1.8, maxWidth: 620, margin: 0 }}>
              DownRange exists because the firearms community deserves better than scattered forums, biased coverage, and outdated law databases. We built the platform we always wanted.
            </p>
          </div>
        </section>
        <section style={{ padding: '60px 0', borderBottom: '1px solid #1F2428' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32 }}>
              {[
                { icon: '⚡', label: 'Live', text: 'Real-time breaking alerts on ATF rulings, court decisions, and major legislation — the moment they happen.' },
                { icon: '◈', label: 'Loaded', text: 'Comprehensive market data, ammo pricing, new releases, and expert field reviews on the gear that matters.' },
                { icon: '⚖', label: 'Lawful', text: 'Complete state-by-state law tracking so you always know your rights — and your restrictions — wherever you are.' },
              ].map(({ icon, label, text }) => (
                <div key={label} style={{ background: '#111318', border: '1px solid #1F2428', padding: 32, borderTop: '3px solid #C8922A' }}>
                  <div style={{ fontSize: 32, marginBottom: 16 }}>{icon}</div>
                  <h3 style={{ color: '#C8922A', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 12px' }}>{label}</h3>
                  <p style={{ color: '#94A3B8', fontSize: 15, lineHeight: 1.7, margin: 0 }}>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section style={{ padding: '60px 0', borderBottom: '1px solid #1F2428' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
            <h2 style={{ color: '#F5F5F3', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 40px' }}>What We Cover</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              {[['📰 Breaking News','ATF, SCOTUS, legislation, industry'],['⚖ Federal Laws','Every bill tracked live'],['🗺 State Hub','All 50 states. Laws mapped.'],['★ Reviews','Pistols, rifles, optics, ammo'],['⬡ New Releases','Every new firearm. Day one.'],['◈ Market Watch','Live ammo prices.'],['▶ Video Hub','Top channels curated.'],['📡 Intelligence','AI-powered. Not just headlines.']].map(([title, sub]) => (
                <div key={title} style={{ background: '#111318', border: '1px solid #1F2428', padding: '20px 24px', borderLeft: '3px solid #1F2428' }}>
                  <div style={{ color: '#F5F5F3', fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{title}</div>
                  <div style={{ color: '#475569', fontSize: 13 }}>{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section style={{ padding: '60px 0', borderBottom: '1px solid #1F2428' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
            <h2 style={{ color: '#F5F5F3', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 16px' }}>How It Works</h2>
            <p style={{ color: '#94A3B8', fontSize: 15, lineHeight: 1.8, maxWidth: 640, margin: '0 0 40px' }}>DownRange runs a continuous AI agent pipeline monitoring 20+ data sources, rewriting content into plain editorial language, scoring urgency, and publishing to the site automatically, around the clock.</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {['NewsAPI','GNews','Congress.gov','LegiScan','GunBroker','AmmoSeek','YouTube Data API','RSS Feeds','Manufacturer RSS','FBI NICS Data','Claude AI','Sanity CMS','Next.js 14','Vercel Edge'].map(tech => (
                <span key={tech} style={{ background: '#1C2028', border: '1px solid #2A2F37', color: '#94A3B8', padding: '6px 14px', fontSize: 13, fontFamily: 'monospace' }}>{tech}</span>
              ))}
            </div>
          </div>
        </section>
        <section style={{ padding: '60px 0' }}>
          <div style={{ maxWidth: 900, margin: '0 auto', padding: '0 24px' }}>
            <h2 style={{ color: '#F5F5F3', fontSize: 13, letterSpacing: 3, textTransform: 'uppercase', margin: '0 0 24px' }}>Contact</h2>
            {[['Tips','tips@downrangeco.com'],['Advertising','ads@downrangeco.com'],['Press','press@downrangeco.com'],['Support','support@downrangeco.com']].map(([l,e]) => (
              <div key={l} style={{ display: 'flex', gap: 24, alignItems: 'center', marginBottom: 12 }}>
                <span style={{ color: '#475569', fontSize: 13, width: 120 }}>{l}</span>
                <a href={`mailto:${e}`} style={{ color: '#C8922A', fontSize: 14, textDecoration: 'none' }}>{e}</a>
              </div>
            ))}
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
