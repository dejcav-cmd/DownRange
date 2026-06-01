import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
export const metadata = { title: 'Terms of Service — DownRange', alternates: { canonical: 'https://downrangeco.com/terms' } }
export default function Terms() {
  const sections = [
    ['Not Legal Advice','All content on DownRange is for informational purposes only and does not constitute legal advice. Always consult a licensed attorney regarding firearms laws.'],
    ['Content Accuracy','DownRange aggregates content from third-party sources using AI. Laws change frequently — always verify with official government sources.'],
    ['Acceptable Use','DownRange may be used for lawful purposes only. You may not use our platform to facilitate illegal transactions or circumvent background check requirements.'],
    ['Intellectual Property','Original DownRange editorial content is owned by DownRange Media LLC. Aggregated content remains property of original publishers.'],
    ['Limitation of Liability','DownRange is not liable for any damages arising from use of this site or reliance on information provided.'],
  ]
  return (
    <>
      <Masthead />
      <div style={{ padding:'60px 0', background:'var(--bg)' }}>
        <div className="container" style={{ maxWidth:720 }}>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'3rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'32px' }}>TERMS OF SERVICE</h1>
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
