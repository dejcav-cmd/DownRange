'use client'
import Link from 'next/link'
import SocialIcons from '../ui/SocialIcons'

const FOOTER_COLS = [
  { title: 'News & Intel', links: [['Latest News','/news'],['Live Deals','/deals'],['Video','/video'],['Canada','/canada']] },
  { title: 'Tools', links: [['NFA Tracker','/nfa-tracker'],['CCW Insurance','/carry-insurance'],['FFL Finder','/ffl-finder'],['Range Finder','/ranges']] },
  { title: 'Laws & States', links: [['Federal Bills','/laws?tab=federal'],['State Laws','/laws?tab=state'],['ATF Rules','/laws?tab=atf'],['SCOTUS Cases','/laws?tab=scotus'],['State Map','/state-hub'],['AI Law Assistant','/laws?tab=assistant']] },
  { title: 'Community', links: [['Write For Us','/contribute'],['Contact','/contact'],['Press Kit','/press'],['Hunting','/hunting'],['Precision','/precision'],['About','/about']] },
]

export default function Footer() {
  return (
    <footer style={{ background: '#07080A', borderTop: '1px solid var(--border)', padding: '48px 0 24px' }}>
      <div className="container">
        <div className="footer-grid" style={{ display: 'grid', gridTemplateColumns: '280px repeat(4, 1fr)', gap: '40px', marginBottom: '40px' }}>
          {/* Brand */}
          <div>
            <Link href="/" style={{ display: 'block', marginBottom: '12px' }}>
              <img
                src="/img/logo-footer.png"
                alt="DownRange Co."
                style={{ width: '220px', height: 'auto', display: 'block' }}
              />
            </Link>
            <div style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: '11px', color: '#6B7280', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '12px' }}>
              Proudly Independent · Pro-Second Amendment
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:'14px' }}>
              <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>Social Media:</span>
              <SocialIcons size="md" />
            </div>
            <p style={{ fontSize: '11px', color: '#6B7280', lineHeight: 1.5 }}>
              DownRange content is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney regarding firearms laws in your jurisdiction.
            </p>
          </div>

          {FOOTER_COLS.map(col => (
            <div key={col.title}>
              <div style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: '12px', fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#9CA3AF', marginBottom: '16px', paddingBottom: '8px', borderBottom: '1px solid var(--border)' }}>
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

        <div style={{ borderTop: '1px solid var(--border)', paddingTop: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
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
