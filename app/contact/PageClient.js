'use client'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export default function ContactPage() {
  return (
    <>

      <Masthead />
      <div className="page-hero" data-title="CONTACT">
        <div className="container">
          <h1 className="page-hero-title">Contact</h1>
          <p className="page-hero-sub">Tips, corrections, press inquiries, advertising — we read everything</p>
        </div>
      </div>
      <div style={{ padding:'60px 0', background:'var(--bg)' }}>
        <div className="container" style={{ maxWidth:1000 }}>
          <div className="dr-contact-grid">
            <div>
              <style>{`.dr-contact-frame{width:100%;height:1280px;border:0;border-radius:4px;background:transparent;color-scheme:normal;display:block}@media(max-width:640px){.dr-contact-frame{height:1600px}}.dr-contact-grid{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:48px}@media(max-width:820px){.dr-contact-grid{grid-template-columns:minmax(0,1fr);gap:28px}}`}</style>
              <iframe
                src="https://api.vantaroai.com/widget/form/fRndUSjTcnfRXJAQ7qKo"
                title="Contact DownRange"
                className="dr-contact-frame"
                loading="lazy"
              />
              <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', lineHeight:1.6, marginTop:12 }}>
                Your email is used only to respond to your inquiry. We never share contact information with third parties.
              </p>
            </div>

            <aside style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {[
                { icon:'📰', title:'Press & Media', desc:'For interview requests, fact-checking, or media inquiries. We respond within 24 hours.' },
                { icon:'💡', title:'Tips & Corrections', desc:'See something wrong or have a story tip? We appreciate corrections and reader tips.' },
                { icon:'📣', title:'Advertise', desc:'Reach 2A-focused audiences. We offer sponsored content and display options.' },
                { icon:'✍️', title:'Write For Us', desc:'Experienced firearms writer or attorney? See our contributor guidelines.', link:'/contribute' },
              ].map(c=>(
                <div key={c.title} style={{ background:'#111318', border:'1px solid var(--border)', padding:'16px 18px' }}>
                  <div style={{ display:'flex', gap:'10px', alignItems:'flex-start' }}>
                    <span style={{ fontSize:'18px', flexShrink:0 }}>{c.icon}</span>
                    <div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:700, color:'#F0EDE6', marginBottom:'4px' }}>{c.title}</div>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.6 }}>{c.desc}</p>
                      {c.link && <a href={c.link} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', textDecoration:'none' }}>Learn more →</a>}
                    </div>
                  </div>
                </div>
              ))}
            </aside>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
