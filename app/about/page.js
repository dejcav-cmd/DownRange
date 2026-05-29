import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'
import BreakingTicker from '../../components/layout/BreakingTicker'
import { fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'About DownRange — Built for Gun Owners',
  description: 'DownRange covers Second Amendment news, state gun laws, new releases, and ammo prices for American gun owners. Independent, free, no manufacturer money.',
}

export default function AboutPage() {
  return (
    <>
      <BreakingTicker alerts={alerts || []} />
      M />
      <div className="page-hero" data-title="ABOUT">
        <div className="container">
          <h1 className="page-hero-title">About DownRange</h1>
          <p className="page-hero-sub">Built by a gun owner. For gun owners.</p>
        </div>
      </div>
      <div style={{ padding:'60px 0', background:'var(--bg)' }}>
        <div className="container" style={{ maxWidth:800 }}>

          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(180px, 1fr))', gap:'16px', marginBottom:'56px' }}>
            {[
              { num:'50',    label:'States Covered',       sub:'Full carry law database' },
              { num:'15min', label:'News Refresh',         sub:'Every 15 minutes, all day' },
              { num:'30+',   label:'Manufacturers Tracked',sub:'New releases, day they drop' },
              { num:'Free',  label:'Always',               sub:'No paywalls, no subscriptions' },
            ].map(s => (
              <div key={s.num} style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px', textAlign:'center' }}>
                <div style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'2.8rem', color:'#C8922A', letterSpacing:'0.05em', lineHeight:1 }}>{s.num}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#F0EDE6', letterSpacing:'0.1em', marginTop:'6px' }}>{s.label.toUpperCase()}</div>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginTop:'3px' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* Mission */}
          <div style={{ marginBottom:'48px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>WHY THIS EXISTS</h2>
            <p style={{ fontSize:'16px', color:'#94A3B8', lineHeight:1.85, marginBottom:'18px' }}>
              I built DownRange because there wasn't a single place where a gun owner could check what changed in their state's carry laws, see what Glock announced this week, find out why 9mm prices spiked, and read about the ATF rule that passed yesterday — all without wading through 10 different websites.
            </p>
            <p style={{ fontSize:'16px', color:'#94A3B8', lineHeight:1.85, marginBottom:'18px' }}>
              Washington State is a difficult place to be a gun owner. The laws change constantly, the media coverage is mostly hostile, and the information you actually need is scattered. That experience shaped what DownRange covers and how it's written.
            </p>
            <p style={{ fontSize:'16px', color:'#94A3B8', lineHeight:1.85 }}>
              We cover the Second Amendment as an individual right. We don't soften language to make the subject more palatable, and we don't accept money from manufacturers or political organizations to stay favorable. The only obligation here is to the person reading the page.
            </p>
          </div>

          {/* How it works */}
          <div style={{ marginBottom:'48px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>HOW IT WORKS</h2>
            <div style={{ display:'flex', flexDirection:'column', gap:'12px' }}>
              {[
                { icon:'📡', title:'50+ Sources, Every 15 Minutes', desc:'RSS feeds, Congress.gov, LegiScan, YouTube channels, manufacturer press feeds, and market data APIs. If something happens, it shows up here within the hour.' },
                { icon:'🤖', title:'AI Writes the First Draft', desc:'Every article gets processed by Claude — categorized, scored for urgency from 1–10, summarized, and tagged with affected states and topics. A human sets the editorial direction.' },
                { icon:'⚖',  title:'State Laws in Real Time', desc:'ATF rules, pending legislation, SCOTUS cases, and carry law changes across all 50 states. When your state passes a mag ban, DownRange covers it the day it happens.' },
                { icon:'📊', title:'Market Data That\'s Actually Useful', desc:'9mm, 5.56, .308, 12 gauge, and more — tracked daily. New releases with full specs and MSRP the day they drop. Price alerts if you want them.' },
              ].map(f => (
                <div key={f.title} style={{ background:'#111318', border:'1px solid var(--border)', borderLeft:'3px solid #C8922A', padding:'18px 22px', display:'flex', gap:'16px' }}>
                  <span style={{ fontSize:'22px', flexShrink:0, paddingTop:'2px' }}>{f.icon}</span>
                  <div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', fontWeight:700, color:'#F0EDE6', marginBottom:'5px' }}>{f.title}</div>
                    <p style={{ fontSize:'13px', color:'#6B7280', lineHeight:1.65, margin:0 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Editorial policy */}
          <div style={{ marginBottom:'48px' }}>
            <h2 style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>EDITORIAL POLICY</h2>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
              {[
                ['No manufacturer money', 'We don\'t accept payments for coverage. A new release from Glock gets the same treatment as one from a brand we\'ve never mentioned.'],
                ['No political funding',  'No NRA money, no gun control money, no PAC money. We cover legislation on its merits.'],
                ['No paywalls',           'Every article is free. The goal is more gun owners who know their rights, not more subscribers.'],
                ['Corrections policy',    'We fix mistakes. If something we published is wrong, email legal@downrangeco.com and we\'ll correct it with a note.'],
              ].map(([t,d]) => (
                <div key={t} style={{ background:'#111318', border:'1px solid var(--border)', padding:'16px 18px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', fontWeight:700, color:'#F0EDE6', marginBottom:'8px' }}>{t}</div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.65, margin:0 }}>{d}</p>
                </div>
              ))}
            </div>
          </div>

          <div style={{ padding:'24px', background:'#111318', border:'1px solid #C8922A40', textAlign:'center' }}>
            <div style={{ fontFamily:"'Bebas Neue', cursive", fontSize:'1.6rem', color:'#C8922A', marginBottom:'10px' }}>BUILT BY GUN OWNERS, FOR GUN OWNERS</div>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7, margin:0 }}>
              DownRange is independent. No advertisers. No manufacturers. No political organizations. <br />
              If you find something wrong or missing, tell us: <a href="mailto:press@downrangeco.com" style={{ color:'#C8922A', textDecoration:'none' }}>press@downrangeco.com</a>
            </p>
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
