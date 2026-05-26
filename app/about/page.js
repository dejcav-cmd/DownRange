import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export const metadata = { title: 'About DownRange — America\'s Firearms Intelligence Hub', description: 'DownRange is America\'s most comprehensive firearms news and intelligence portal. AI-powered, always current.' }

export default function AboutPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="ABOUT">
        <div className="container">
          <h1 className="page-hero-title">About DownRange</h1>
          <p className="page-hero-sub">America's Firearms Intelligence Hub · Live. Loaded. Lawful.</p>
        </div>
      </div>
      <div style={{ padding:'60px 0', background:'var(--bg)' }}>
        <div className="container" style={{ maxWidth:800 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'40px', marginBottom:'48px' }}>
            {[
              { num:'50', label:'States Covered', sub:'Full law database' },
              { num:'15min', label:'News Updates', sub:'AI-aggregated feeds' },
              { num:'10k+', label:'Articles Indexed', sub:'Growing daily' },
              { num:'Free', label:'Always Free', sub:'No paywalls' },
            ].map(s => (
              <div key={s.num} style={{ background:'#111318', border:'1px solid var(--border)', padding:'28px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'3rem', color:'#C8922A', letterSpacing:'0.05em', lineHeight:1 }}>{s.num}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#F0EDE6', letterSpacing:'0.1em', marginTop:'6px' }}>{s.label.toUpperCase()}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginTop:'3px' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ marginBottom:'40px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>OUR MISSION</h2>
            <p style={{ fontSize:'16px', color:'#94A3B8', lineHeight:1.8, marginBottom:'16px' }}>
              DownRange is the central intelligence hub for America's 100 million gun owners. We aggregate, analyze, and deliver firearms news, legislation, market data, and law intelligence — faster and more comprehensively than any other source.
            </p>
            <p style={{ fontSize:'16px', color:'#94A3B8', lineHeight:1.8 }}>
              We believe in the Second Amendment as a fundamental, individual right. Our editorial AI is trained to report objectively on 2A issues, prioritize breaking legal developments, and surface information that affects lawful gun owners across all 50 states.
            </p>
          </div>

          <div style={{ marginBottom:'40px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>HOW IT WORKS</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
              {[
                { icon:'📡', title:'AI-Powered Aggregation', desc:'Our agent pulls from 50+ sources every 15 minutes — RSS feeds, Congress.gov, LegiScan, YouTube channels, and market data APIs.' },
                { icon:'🤖', title:'Claude Editorial AI', desc:'Every article is processed by Claude AI — categorized, scored for urgency (1-10), summarized, and tagged with relevant states and topics.' },
                { icon:'⚖', title:'Law Intelligence', desc:'Federal and state legislation tracked in real time. ATF rules, SCOTUS cases, and reciprocity data updated daily.' },
                { icon:'📊', title:'Market Data', desc:'Ammo prices tracked across 7 calibers. New firearms releases monitored from 50+ manufacturers. Price alerts via email.' },
              ].map(f => (
                <div key={f.title} style={{ background:'#111318', border:'1px solid var(--border)', borderLeft:'3px solid #C8922A', padding:'20px 24px', display:'flex', gap:'16px' }}>
                  <span style={{ fontSize:'24px', flexShrink:0 }}>{f.icon}</span>
                  <div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', fontWeight:700, color:'#F0EDE6', marginBottom:'6px' }}>{f.title}</div>
                    <p style={{ fontSize:'13px', color:'#6B7280', lineHeight:1.6 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:'24px', background:'#111318', border:'1px solid #C8922A40', textAlign:'center' }}>
            <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', marginBottom:'8px' }}>BUILT BY GUN OWNERS, FOR GUN OWNERS</div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7 }}>
              DownRange is proudly independent. We are not funded by manufacturers, advertisers, or political organizations. Our only obligation is to you — the American gun owner.
            </p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
