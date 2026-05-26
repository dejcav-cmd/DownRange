import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'

export const metadata = { title: 'Press Kit — DownRange', description: 'DownRange media resources. Brand assets, editorial guidelines, and contact for press inquiries.' }

const STATS = [
  { num:'50', label:'States Covered', sub:'Complete legal database' },
  { num:'15 min', label:'News Refresh', sub:'AI-powered aggregation' },
  { num:'100M+', label:'Gun Owners Served', sub:'Target US audience' },
  { num:'2026', label:'Founded', sub:'Washington State' },
]

const COVERAGE_AREAS = [
  'Breaking federal and state firearms legislation', 'ATF rulemaking and regulatory updates',
  'US Supreme Court Second Amendment cases', 'State-by-state carry law and reciprocity',
  'New firearms releases and industry news', 'Ammo pricing and market trends',
  'Expert firearms reviews and buyer guides', 'NFA / suppressor intelligence',
]

const BRAND_GUIDELINES = [
  { do:"Use 'DownRange' (one word, capital D and R)", dont:"downrange, Down Range, DOWNRANGE" },
  { do:"'DownRange — America\'s Firearms Intelligence Hub'", dont:"'DownRange News' or 'DownRange Blog'" },
  { do:"Describe as an 'AI-powered firearms intelligence platform'", dont:"'gun website' or 'firearms blog'" },
  { do:"Reference as 'pro-Second Amendment, editorially independent'", dont:"'NRA-affiliated' or 'extremist' — we are neither" },
]

export default function PressPage() {
  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="PRESS">
        <div className="container">
          <div className="dr-breadcrumb" style={{ marginBottom:'12px' }}>
            <span className="t-label-xs">PRESS KIT · MEDIA RESOURCES · {new Date().getFullYear()}</span>
          </div>
          <h1 className="page-hero-title">Press Kit</h1>
          <p className="page-hero-sub">Media resources · Brand guidelines · Coverage areas · Contact</p>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginTop:'16px' }}>
            <Link href="/contact" className="dr-btn-primary">Press Inquiry →</Link>
            <a href="mailto:press@downrangeco.com" className="dr-btn-outline">press@downrangeco.com</a>
          </div>
        </div>
      </div>
      <div>

        {/* Stats */}
        <div style={{ padding:'48px 0', borderBottom:'1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth:900 }}>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'24px' }}>
              {STATS.map(s=>(
                <div key={s.num} style={{ textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'3rem', color:'#C8922A', letterSpacing:'0.05em', lineHeight:1 }}>{s.num}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text)', letterSpacing:'0.08em', marginTop:'6px' }}>{s.label.toUpperCase()}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', marginTop:'3px' }}>{s.sub}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* About + Coverage */}
        <div style={{ padding:'48px 0', borderBottom:'1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth:900 }}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'48px' }}>
              <div>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>ABOUT DOWNRANGE</h2>
                <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.85, marginBottom:'16px' }}>
                  DownRange is an independent firearms intelligence platform founded in 2026 and headquartered in Washington State. We operate a proprietary AI news aggregation system that monitors 50+ sources every 15 minutes, covering the full spectrum of Second Amendment news, federal and state legislation, ATF rulemaking, and SCOTUS developments.
                </p>
                <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.85 }}>
                  Unlike traditional firearms media, DownRange uses AI to provide real-time legal analysis across all 50 states, maintain a live ammo price index, and deliver personalized alerts when laws change in users' home states. We are editorially independent, funded by readers, and accept no money from manufacturers or political organizations.
                </p>
              </div>
              <div>
                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>COVERAGE AREAS</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'6px' }}>
                  {COVERAGE_AREAS.map(c=>(
                    <div key={c} style={{ display:'flex', gap:'10px', alignItems:'flex-start', padding:'6px 0', borderBottom:'1px solid var(--border)' }}>
                      <span style={{ color:'#C8922A', flexShrink:0, marginTop:'1px' }}>◈</span>
                      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'var(--text-muted)' }}>{c}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Brand guidelines */}
        <div style={{ padding:'48px 0', borderBottom:'1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth:900 }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'24px' }}>BRAND GUIDELINES</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {BRAND_GUIDELINES.map((g,i)=>(
                <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'16px 18px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34D399', letterSpacing:'0.12em', marginBottom:'6px' }}>✓ DO</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#D1D5DB', marginBottom:'10px', lineHeight:1.5 }}>{g.do}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#EF4444', letterSpacing:'0.12em', marginBottom:'6px' }}>✗ DON'T</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'var(--text-dim)', lineHeight:1.5 }}>{g.dont}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Brand colors */}
        <div style={{ padding:'48px 0', borderBottom:'1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth:900 }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'24px' }}>BRAND IDENTITY</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'16px', marginBottom:'32px' }}>
              {[
                { name:'Brass Gold', hex:'#C8922A', on:'Primary brand color — CTAs, headlines, accents' },
                { name:'Obsidian', hex:'#0A0B0C', on:'Primary background' },
                { name:'Charcoal', hex:'#111318', on:'Card backgrounds' },
                { name:'Field Gray', hex:'#6B7280', on:'Secondary text, metadata' },
              ].map(c=>(
                <div key={c.name}>
                  <div style={{ height:60, background:c.hex, border:'1px solid var(--border)', marginBottom:'8px' }} />
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text)', marginBottom:'2px' }}>{c.name}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', marginBottom:'4px' }}>{c.hex}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)', lineHeight:1.5 }}>{c.on}</div>
                </div>
              ))}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:'16px' }}>
              {[
                { name:'Bebas Neue', use:'Headlines, callouts, data numerals', sample:'DOWNRANGE 2A INTELLIGENCE' },
                { name:'IBM Plex Mono', use:'Metadata, badges, technical labels', sample:'BREAKING · 9/10 · FEDERAL LAW' },
              ].map(f=>(
                <div key={f.name} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'16px 20px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', marginBottom:'8px' }}>TYPEFACE</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'var(--text)', fontWeight:700, marginBottom:'4px' }}>{f.name}</div>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', marginBottom:'12px' }}>{f.use}</div>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#C8922A', letterSpacing:'0.05em' }}>{f.sample}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact */}
        <div style={{ padding:'48px 0 60px' }}>
          <div className="container" style={{ maxWidth:900 }}>
            <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'24px' }}>MEDIA CONTACTS</h2>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'16px' }}>
              {[
                { role:'Press & Media', email:'press@downrangeco.com', desc:'Interview requests, fact-checking, embargoed announcements' },
                { role:'Legal & Corrections', email:'legal@downrangeco.com', desc:'DMCA, corrections requests, legal inquiries' },
                { role:'Advertising', email:'ads@downrangeco.com', desc:'Sponsored content, display advertising, partnerships' },
              ].map(c=>(
                <div key={c.role} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'20px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.1em', marginBottom:'8px', fontWeight:700 }}>{c.role.toUpperCase()}</div>
                  <a href={`mailto:${c.email}`} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#60A5FA', display:'block', marginBottom:'8px', textDecoration:'none' }}>{c.email}</a>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.6 }}>{c.desc}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop:'24px', padding:'20px 24px', background:'var(--bg2)', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'var(--text-dim)', lineHeight:1.7 }}>
              Response time: 24 hours for press inquiries · 48 hours for general contact · All media inquiries must include publication name, circulation/reach, and deadline.
            </div>
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}
