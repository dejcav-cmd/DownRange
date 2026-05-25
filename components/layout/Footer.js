import Link from 'next/link'

const FOOTER_COLS = [
  { title: 'News', links: [['Latest News','/news'],['Breaking','/news?cat=breaking'],['Opinion','/news?cat=opinion'],['Industry','/news?cat=industry'],['Training','/news?cat=training']] },
  { title: 'Reviews', links: [['Pistols','/reviews?cat=pistol'],['Rifles','/reviews?cat=rifle'],['Shotguns','/reviews?cat=shotgun'],['Optics','/reviews?cat=optic'],['Suppressors','/reviews?cat=suppressor'],['Accessories','/reviews?cat=accessory']] },
  { title: 'Laws & Hub', links: [['Federal Law','/laws?level=federal'],['State Laws','/laws?level=state'],['ATF Rules','/laws?cat=atf'],['State Hub','/state-hub'],['SCOTUS Tracker','/laws?cat=scotus'],['Find FFLs','/ffl-finder']] },
  { title: 'Company', links: [['About DownRange','/about'],['Advertise','/advertise'],['Write For Us','/contribute'],['Press Kit','/press'],['Contact','/contact'],['RSS Feeds','/rss']] },
]

export default function Footer() {
  return (
    <footer style={{ background: '#07080A', borderTop: '1px solid #1F2428', padding: '48px 0 24px' }}>
      <div className="container">
        <div style={{ display: 'grid', gridTemplateColumns: '280px repeat(4, 1fr)', gap: '40px', marginBottom: '40px' }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ fontFamily: "'Bebas Neue', cursive", fontSize: '48px', color: '#C8922A', letterSpacing: '0.02em', lineHeight: 1, display: 'block', marginBottom: '12px' }}>DOWNRANGE</Link>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '16px' }}>
              Proudly Independent · Pro-Second Amendment
            </div>
            <p style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.5 }}>
              DownRange content is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney regarding firearms laws in your jurisdiction.
            </p>
          </div>

          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid #1F2428' }}>
                {col.title}
              </div>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link href={href} style={{ fontSize: '13px', color: '#6B7280', transition: 'color 0.2s' }}
                      onMouseEnter={e => e.target.style.color = '#C8922A'}
                      onMouseLeave={e => e.target.style.color = '#6B7280'}>
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: '1px solid #1F2428', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280', letterSpacing: '0.06em' }}>
            © 2026 DOWNRANGE MEDIA LLC · ALL RIGHTS RESERVED
          </div>
          <div style={{ display: 'flex', gap: '20px' }}>
            {[['Privacy Policy','/privacy'],['Terms','/terms'],['DMCA','/dmca'],['Cookies','/cookies']].map(([l,h]) => (
              <Link key={h} href={h} style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#6B7280', letterSpacing: '0.06em' }}>{l}</Link>
            ))}
          </div>
          <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '10px', color: '#8A6320', letterSpacing: '0.06em' }}>
            BUILT IN THE USA 🇺🇸
          </div>
        </div>
      </div>
    </footer>
  )
}
