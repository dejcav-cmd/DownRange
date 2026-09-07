import { fetchBreakingAlerts } from '../../sanity/lib/client'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
export const metadata = { title: 'Cookie Policy — DownRange', description: 'How DownRange uses cookies and similar technologies across the site.', alternates: { canonical: 'https://www.downrangeco.com/cookies' } }
export default async function Cookies() {
  const sections = [
    ['What Are Cookies','Cookies are small text files stored on your device when you visit a website. They help sites remember information about your visit, like preferences and session state.'],
    ['How DownRange Uses Cookies','We use cookies to keep the site functioning (session management, admin authentication), to remember display preferences, and to understand aggregate traffic patterns through analytics. We do not use cookies to sell your personal information.'],
    ['Types of Cookies We Use','Essential cookies required for core site features like admin login and form submissions; analytics cookies that help us understand how visitors use the site; and preference cookies that remember choices like your selected state for legal content.'],
    ['Third-Party Cookies','Some pages embed third-party content (such as video players) that may set their own cookies. We don\u2019t control these cookies — refer to the relevant third party\u2019s policy for details.'],
    ['Managing Cookies','Most browsers let you block or delete cookies through their settings. Blocking essential cookies may affect site functionality, such as staying logged into the admin panel.'],
  ]
  const alerts = await fetchBreakingAlerts(5).catch(() => [])

  return (
    <>
      <Masthead />
      <div style={{ padding:'60px 0', background:'var(--bg)' }}>
        <div className="container" style={{ maxWidth:720 }}>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'3rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'32px' }}>COOKIE POLICY</h1>
          {sections.map(([h,t]) => (
            <div key={h} style={{ marginBottom:'28px' }}>
              <h2 style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#C8922A', fontWeight:700, marginBottom:'10px' }}>{h.toUpperCase()}</h2>
              <p style={{ fontSize:'14px', color:'#6B7280', lineHeight:1.8 }}>{t}</p>
            </div>
          ))}
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151', marginTop:'40px' }}>Last updated: September 2026</p>
        </div>
      </div>
      <Footer />
    </>
  )
}
