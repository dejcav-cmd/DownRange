import Masthead from '../../components/layout/Masthead'
import Image from 'next/image'
import Footer from '../../components/layout/Footer'
import Link from 'next/link'
import BreakingTicker from '../../components/layout/BreakingTicker'

export const metadata = {
  title: 'Press & Media Kit — DownRange Intelligence Hub',
  description: "DownRange is America's independent firearms and Second Amendment intelligence platform. Press kit, media contacts, brand guidelines, partnership inquiries, and manufacturer PR submissions.",
  openGraph: {
    title: 'DownRange Press Kit — Media Resources',
    description: "America's firearms intelligence hub. Brand assets, editorial guidelines, partnership inquiries, and press contacts.",
    url: 'https://www.downrangeco.com/press',
  }
}

const STATS = [
  { num:'50',    label:'States Covered',       sub:'Full legal + carry law database' },
  { num:'30+',   label:'Manufacturers Tracked', sub:'Real-time release monitoring' },
  { num:'24/7',  label:'News Intelligence',     sub:'AI-powered, 15-min refresh cycle' },
  { num:'2026',  label:'Founded',               sub:'Washington State, USA' },
]

const COVERAGE = [
  { icon:'⚖', area:'Second Amendment Law',      desc:'Federal and state legislation, ATF rulemaking, SCOTUS cases, and court rulings — tracked and analyzed as they happen.' },
  { icon:'🔫', area:'New Releases',              desc:'Manufacturer product announcements from 30+ brands, with full specs, MSRP, and direct links to manufacturer pages.' },
  { icon:'📊', area:'Market Intelligence',       desc:'Live ammo pricing, market trend analysis, and daily deal tracking across major retailers.' },
  { icon:'🗺', area:'State-by-State Rights',     desc:'Carry laws, permit requirements, reciprocity, magazine limits, and NFA rules for all 50 states.' },
  { icon:'🎯', area:'Training & Education',      desc:'Beginner guides, CCW resources, dry fire training, and home defense — written for real gun owners.' },
  { icon:'📡', area:'Industry News',             desc:'Manufacturer earnings, retail trends, distributor news, and competitive intelligence for the trade.' },
]

const BRAND_RULES = [
  { do:"Use 'DownRange' — one word, capital D and R", dont:"downrange, Down Range, or DOWNRANGE" },
  { do:"'DownRange — America's Firearms Intelligence Hub'", dont:"'DownRange News' or 'DownRange Blog'" },
  { do:"'AI-powered firearms intelligence platform'", dont:"'gun website' or 'firearms blog'" },
  { do:"'Editorially independent, reader-funded'", dont:"'NRA-affiliated' or 'gun lobby'" },
]

const WHO_WE_SERVE = [
  { group:'Gun Owners',     desc:'Daily intelligence briefings, state law alerts, ammo prices, and new release notifications.' },
  { group:'FFL Dealers',    desc:'Real-time regulatory updates, manufacturer releases, and market data for the shop floor.' },
  { group:'Instructors',    desc:'State law breakdowns, training resources, and curriculum-ready legal explainers.' },
  { group:'Manufacturers',  desc:'A free press platform to reach engaged gun owners directly — submit releases for editorial coverage.' },
  { group:'Attorneys',      desc:'2A case tracking, legislative analysis, and state law database for legal research.' },
  { group:'Journalists',    desc:'Verified source for firearms law, manufacturer data, and industry trends.' },
]

const PARTNERSHIP_TYPES = [
  { type:'Manufacturer Coverage',  icon:'🏭', desc:'Send us your press releases and we will publish editorial coverage to our audience of gun owners, dealers, and enthusiasts. No fee. No guaranteed positive coverage — we cover what matters.' },
  { type:'Content Partnership',    icon:'✍',  desc:'Instructors, attorneys, and industry experts who want to write for DownRange. Full byline credit, editorial independence, published under your name.' },
  { type:'Dealer Partnership',     icon:'🏪', desc:'Online and retail dealers who want to promote their inventory, deals, or brand to an engaged audience of active buyers.' },
  { type:'Creator Partnership',    icon:'▶',  desc:'YouTubers and content creators featured in our Video section. We distribute your content to an audience that cannot find you through YouTube search.' },
  { type:'Media & Press',          icon:'📰', desc:'Interview requests, fact-checking, embargoed announcements, and source inquiries. We respond to press within 24 hours.' },
  { type:'Advertising',            icon:'◈',  desc:'Contextual placements to a verified firearms-interested audience. No programmatic. No ad networks. Direct relationships only.' },
]

export default function PressPage() {
  return (
    <>
      <BreakingTicker alerts={[]} />
      <Masthead />

      {/* Hero */}
      <div className="page-hero" data-title="PRESS">
        <div className="container">
          <div className="dr-breadcrumb" style={{ marginBottom:'12px' }}>
            <span className="t-label-xs">PRESS KIT · MEDIA RESOURCES · {new Date().getFullYear()}</span>
          </div>
          <h1 className="page-hero-title">Press & Media Kit</h1>
          <p className="page-hero-sub" style={{ maxWidth:640 }}>
            DownRange is an independent firearms and Second Amendment intelligence platform headquartered in Washington State.
            Resources for press, manufacturers, dealers, and partners.
          </p>
          <div style={{ display:'flex', gap:'10px', flexWrap:'wrap', marginTop:'20px' }}>
            <a href="mailto:press@downrangeco.com" className="dr-btn-primary">Press Inquiry →</a>
            <a href="mailto:partnerships@downrangeco.com" className="dr-btn-outline">Partnership Inquiry</a>
            <a href="mailto:releases@downrangeco.com" className="dr-btn-outline">Submit a Press Release</a>
          </div>
        </div>
      </div>

      {/* Stats */}
      <section style={{ padding:'48px 0', borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
        <div className="container" style={{ maxWidth:960 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'24px' }}>
            {STATS.map(s=>(
              <div key={s.num} style={{ textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'3rem', color:'#C8922A', letterSpacing:'0.05em', lineHeight:1 }}>{s.num}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text)', letterSpacing:'0.08em', marginTop:'6px' }}>{s.label.toUpperCase()}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'var(--text-dim)', marginTop:'3px' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Mission */}
      <section style={{ padding:'56px 0', borderBottom:'1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth:960 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'56px', alignItems:'start' }}>
            <div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', marginBottom:'12px' }}>OUR MISSION</div>
              <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'2.2rem', color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1, marginBottom:'20px' }}>
                GROW THE SECOND AMENDMENT COMMUNITY ACROSS AMERICA
              </h2>
              <p style={{ fontSize:'15px', color:'var(--text-muted)', lineHeight:1.85, marginBottom:'16px' }}>
                DownRange exists because gun owners, dealers, instructors, and Second Amendment advocates deserve a dedicated intelligence platform — one that covers what matters without apology, without a corporate agenda, and without the sanitization that defines mainstream firearms media.
              </p>
              <p style={{ fontSize:'15px', color:'var(--text-muted)', lineHeight:1.85, marginBottom:'16px' }}>
                We built DownRange to be the first place you check when a law changes in your state, when a new firearm drops, when the ATF publishes a new rule, or when a court hands down a Second Amendment decision. Everything in one place, verified, explained in plain English.
              </p>
              <p style={{ fontSize:'15px', color:'var(--text-muted)', lineHeight:1.85 }}>
                We are editorially independent. We accept no money from manufacturers for coverage, no funding from political organizations, and no advertising that compromises what we write. Our loyalty is to the gun owner reading the page.
              </p>
            </div>
            <div>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', marginBottom:'12px' }}>ABOUT THE FOUNDER</div>
              <div style={{ background:'var(--bg2)', border:'1px solid var(--border)', borderLeft:'3px solid #C8922A', padding:'24px' }}>
                <div style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'1.6rem', color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1, marginBottom:'4px' }}>DJ CAVALCANTI</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.1em', marginBottom:'16px' }}>FOUNDER & PUBLISHER · DOWNRANGE</div>
                <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8, marginBottom:'12px' }}>
                  DJ Cavalcanti is a Second Amendment advocate, firearms enthusiast, and entrepreneur based in Washington State. He founded DownRange in 2026 with the conviction that the gun community deserves better media — more intelligent, more honest, and more useful than what existed.
                </p>
                <p style={{ fontSize:'14px', color:'var(--text-muted)', lineHeight:1.8 }}>
                  Washington State is one of the most challenging legal environments for gun owners in the country. That context shapes DownRange's editorial focus: real intelligence that helps you navigate your rights, understand what's changing, and stay ahead of legislation that affects you.
                </p>
                <div style={{ marginTop:'16px', display:'flex', gap:'10px', flexWrap:'wrap' }}>
                  <a href="mailto:dj@downrangeco.com" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#C8922A', textDecoration:'none' }}>dj@downrangeco.com</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section style={{ padding:'56px 0', borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
        <div className="container" style={{ maxWidth:960 }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', marginBottom:'12px' }}>AUDIENCE</div>
          <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'2rem', color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1, marginBottom:'32px' }}>WHO WE SERVE</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' }}>
            {WHO_WE_SERVE.map(w=>(
              <div key={w.group} style={{ background:'var(--bg)', border:'1px solid var(--border)', padding:'20px' }}>
                <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:'16px', fontWeight:700, color:'var(--foreground)', marginBottom:'8px' }}>{w.group}</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>{w.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Coverage areas */}
      <section style={{ padding:'56px 0', borderBottom:'1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth:960 }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', marginBottom:'12px' }}>EDITORIAL</div>
          <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'2rem', color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1, marginBottom:'32px' }}>COVERAGE AREAS</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px' }}>
            {COVERAGE.map(c=>(
              <div key={c.area} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'20px' }}>
                <div style={{ fontSize:'24px', marginBottom:'8px' }}>{c.icon}</div>
                <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:'16px', fontWeight:700, color:'#C8922A', marginBottom:'8px', letterSpacing:'0.03em' }}>{c.area}</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>{c.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership types */}
      <section style={{ padding:'56px 0', borderBottom:'1px solid var(--border)', background:'var(--bg2)' }}>
        <div className="container" style={{ maxWidth:960 }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', marginBottom:'12px' }}>WORK WITH US</div>
          <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'2rem', color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1, marginBottom:'8px' }}>PARTNERSHIP & PR OPPORTUNITIES</h2>
          <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'var(--text-dim)', marginBottom:'32px', lineHeight:1.7 }}>
            DownRange is actively building partnerships with manufacturers, dealers, instructors, attorneys, and creators who share our mission. Here is how we work together.
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'12px', marginBottom:'32px' }}>
            {PARTNERSHIP_TYPES.map(p=>(
              <div key={p.type} style={{ background:'var(--bg)', border:'1px solid var(--border)', padding:'20px' }}>
                <div style={{ fontSize:'24px', marginBottom:'8px' }}>{p.icon}</div>
                <div style={{ fontFamily:"'Barlow Condensed', sans-serif", fontSize:'16px', fontWeight:700, color:'var(--foreground)', marginBottom:'8px' }}>{p.type}</div>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.7, margin:0 }}>{p.desc}</p>
              </div>
            ))}
          </div>

          {/* Manufacturer PR submission callout */}
          <div style={{ background:'rgba(200,146,42,0.08)', border:'1px solid rgba(200,146,42,0.3)', padding:'28px 32px' }}>
            <div style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'8px' }}>
              MANUFACTURERS & DISTRIBUTORS — SUBMIT YOUR PRESS RELEASES
            </div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'var(--text-dim)', lineHeight:1.8, marginBottom:'16px', maxWidth:620 }}>
              We cover new product launches, spec releases, pricing announcements, and industry news from firearms manufacturers, suppressors companies, optics brands, accessories makers, and distributors. Send us your release and our editorial team will review it for publication. No fee. No guaranteed coverage — we publish what matters to gun owners.
            </p>
            <div style={{ display:'flex', gap:'12px', flexWrap:'wrap' }}>
              <a href="mailto:releases@downrangeco.com" style={{ background:'#C8922A', color:'#000', fontFamily:"'Barlow Condensed',sans-serif", fontSize:'13px', fontWeight:700, letterSpacing:'0.1em', padding:'10px 20px', textDecoration:'none', display:'inline-block' }}>
                SUBMIT A RELEASE →
              </a>
              <a href="mailto:partnerships@downrangeco.com" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#C8922A', padding:'10px 0', textDecoration:'none', display:'inline-flex', alignItems:'center' }}>
                partnerships@downrangeco.com
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Brand guidelines */}
      <section style={{ padding:'56px 0', borderBottom:'1px solid var(--border)' }}>
        <div className="container" style={{ maxWidth:960 }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', marginBottom:'12px' }}>STYLE GUIDE</div>
          <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'2rem', color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1, marginBottom:'32px' }}>BRAND GUIDELINES</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'40px' }}>
            {BRAND_RULES.map((g,i)=>(
              <div key={i} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'16px 18px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34D399', letterSpacing:'0.12em', marginBottom:'6px' }}>✓ DO</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#D1D5DB', marginBottom:'10px', lineHeight:1.5 }}>{g.do}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#EF4444', letterSpacing:'0.12em', marginBottom:'6px' }}>✗ DON'T</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'var(--text-dim)', lineHeight:1.5 }}>{g.dont}</div>
              </div>
            ))}
          </div>

          {/* Brand colors */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'16px', marginBottom:'24px' }}>
            {[
              { name:'Brass Gold', hex:'#C8922A', role:'Primary — CTAs, headlines, accents' },
              { name:'Obsidian',   hex:'#09090B', role:'Primary background' },
              { name:'Charcoal',   hex:'#111318', role:'Card backgrounds' },
              { name:'Field Gray', hex:'#6B7280', role:'Secondary text, metadata' },
            ].map(c=>(
              <div key={c.name}>
                <div style={{ height:48, background:c.hex, border:'1px solid var(--border)', marginBottom:'8px' }} />
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text)', marginBottom:'2px' }}>{c.name}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', marginBottom:'3px' }}>{c.hex}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'var(--text-dim)' }}>{c.role}</div>
              </div>
            ))}
          </div>

          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.8 }}>
            <strong style={{ color:'var(--text)' }}>Typefaces:</strong> Bebas Neue (headlines, callouts) · IBM Plex Mono (data, labels, metadata) · Barlow Condensed (body, navigation)
          </div>
        </div>
      </section>

      {/* Media contacts */}
      <section style={{ padding:'56px 0 72px' }}>
        <div className="container" style={{ maxWidth:960 }}>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.15em', marginBottom:'12px' }}>GET IN TOUCH</div>
          <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'2rem', color:'var(--foreground)', letterSpacing:'0.04em', lineHeight:1, marginBottom:'32px' }}>MEDIA & PARTNERSHIP CONTACTS</h2>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))', gap:'12px', marginBottom:'24px' }}>
            {[
              { role:'Press & Media',           email:'press@downrangeco.com',        desc:'Interview requests, fact-checking, embargoed announcements, source inquiries. Response within 24 hours.' },
              { role:'Manufacturer PR',          email:'releases@downrangeco.com',     desc:'Product launches, press releases, spec sheets, and manufacturer announcements for editorial consideration.' },
              { role:'Partnerships',             email:'partnerships@downrangeco.com', desc:'Dealer partnerships, content collaborations, creator partnerships, and co-promotion inquiries.' },
              { role:'Founder (Direct)',         email:'dj@downrangeco.com',           desc:'Direct line to DJ Cavalcanti for significant partnership or media inquiries.' },
              { role:'Legal & Corrections',      email:'legal@downrangeco.com',        desc:'DMCA notices, factual corrections, legal inquiries.' },
              { role:'Advertising',             email:'ads@downrangeco.com',           desc:'Contextual placements, sponsorships, and direct advertising relationships.' },
            ].map(c=>(
              <div key={c.role} style={{ background:'var(--bg2)', border:'1px solid var(--border)', padding:'20px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.1em', marginBottom:'8px', fontWeight:700 }}>{c.role.toUpperCase()}</div>
                <a href={`mailto:${c.email}`} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#60A5FA', display:'block', marginBottom:'8px', textDecoration:'none' }}>{c.email}</a>
                <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.6, margin:0 }}>{c.desc}</p>
              </div>
            ))}
          </div>

          <div style={{ padding:'20px 24px', background:'var(--bg2)', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'var(--text-dim)', lineHeight:1.8 }}>
            <strong style={{ color:'var(--text)' }}>Headquarters:</strong> Washington State, USA &nbsp;·&nbsp;
            <strong style={{ color:'var(--text)' }}>Website:</strong> downrangeco.com &nbsp;·&nbsp;
            <strong style={{ color:'var(--text)' }}>Response time:</strong> 24 hours for press · 48 hours for partnerships &nbsp;·&nbsp;
            Press inquiries should include publication name and deadline.
          </div>
        </div>
      </section>

      <Footer />
    </>
  )
}
