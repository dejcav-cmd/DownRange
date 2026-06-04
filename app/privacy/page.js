import { fetchBreakingAlerts } from '../../sanity/lib/client'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
export const metadata = { title: 'Privacy Policy — DownRange', alternates: { canonical: 'https://downrangeco.com/privacy' } }
export default async function Privacy() {
  const sections = [
    ['Information We Collect','We collect email addresses when you subscribe to our newsletter or set price alerts. We collect anonymous usage data to improve the site. We do not sell your data.'],
    ['How We Use Your Information','Email addresses are used solely to send newsletters and alerts you explicitly subscribed to. Unsubscribe anytime via the link in any email.'],
    ['Cookies','We use cookies to remember your theme preference and session data. No advertising or tracking cookies.'],
    ['Third-Party Services','We use Sanity (CMS), Vercel (hosting), Resend (email), and Algolia (search). We do not share personal data beyond what is required for operation.'],
    ['Contact','For privacy questions: privacy@downrangeco.com'],
  ]
  const alerts = await fetchBreakingAlerts(5).catch(() => [])

  return (
    <>

      <Masthead />
      <div style={{ padding:'60px 0', background:'var(--bg)' }}>
        <div className="container" style={{ maxWidth:720 }}>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'3rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'32px' }}>PRIVACY POLICY</h1>
          {sections.map(([h,t]) => (
            <div key={h} style={{ marginBottom:'28px' }}>
              <h2 style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#C8922A', fontWeight:700, marginBottom:'10px' }}>{h.toUpperCase()}</h2>
              <p style={{ fontSize:'14px', color:'#6B7280', lineHeight:1.8 }}>{t}</p>
            </div>
          ))}
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#374151', marginTop:'40px' }}>Last updated: May 2026</p>
        </div>
      </div>
      <Footer />
    </>
  )
}
