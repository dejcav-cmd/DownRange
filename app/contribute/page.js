'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const WHAT_WE_PUBLISH = [
  { icon:'⚖', title:'Legal Analysis', desc:'In-depth analysis of firearms laws, ATF rulings, SCOTUS decisions. We want attorney-authored or law-school-credentialed writers for legal content.' },
  { icon:'🔍', title:'Investigative Pieces', desc:'Original reporting on industry trends, regulatory failures, or underreported 2A stories. Data-driven, sourced, verifiable.' },
  { icon:'★', title:'Expert Reviews', desc:'Hands-on firearms reviews from professional instructors, competitors, or industry professionals. Must include round count tested.' },
  { icon:'🎯', title:'Training & Technique', desc:'Evidence-based training advice from certified instructors. Drills, fundamentals, scenario analysis.' },
  { icon:'📊', title:'Industry Intelligence', desc:'Market analysis, manufacturer developments, supply chain reporting with real sourcing.' },
  { icon:'◇', title:'Opinion & Commentary', desc:'Well-reasoned 2A advocacy from credentialed voices. We publish diverse perspectives within the pro-2A spectrum.' },
]

const RATES = [
  { type:'Standard Article (800–1200 words)', rate:'$75–$150', notes:'News and general content' },
  { type:'Expert Review (1500–2500 words)', rate:'$150–$300', notes:'Must include hands-on testing' },
  { type:'Investigative Feature (2000+)', rate:'$250–$500', notes:'Original reporting with sources' },
  { type:'Legal Analysis (1000–2000 words)', rate:'$200–$400', notes:'Attorney/JD credential required' },
  { type:'Training Guide', rate:'$100–$200', notes:'Certified instructor preferred' },
]

export default function ContributePage() {
  const [form, setForm] = useState({ name:'', email:'', bio:'', expertise:'', topic:'', outline:'', sampleUrl:'' })
  const [state, setState] = useState(null)
  const [active, setActive] = useState('guidelines')

  async function submit(e) {
    e.preventDefault()
    setState('sending')
    try {
      const res = await fetch('/api/submissions', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const d = await res.json()
      setState(d.success ? 'sent' : 'error')
    } catch { setState('error') }
  }

  const tabs = [
    { key:'guidelines', label:'Guidelines' },
    { key:'rates', label:'Rates & Pay' },
    { key:'submit', label:'Submit Pitch' },
  ]

  return (
    <>
      <Masthead />
      <div style={{ background:'#0A0B0C', minHeight:'100vh' }}>
        <div className="page-hero" data-title="CONTRIBUTE">
          <div className="container">
            <h1 className="page-hero-title">Write For DownRange</h1>
            <p className="page-hero-sub">Join America's fastest-growing 2A intelligence platform · Paid contributions · National reach</p>
          </div>
        </div>

        <div style={{ padding:'40px 0' }}>
          <div className="container" style={{ maxWidth:900 }}>

            {/* Tab bar */}
            <div style={{ display:'flex', gap:0, borderBottom:'1px solid #1F2428', marginBottom:'36px' }}>
              {tabs.map(t=>(
                <button key={t.key} onClick={()=>setActive(t.key)}
                  style={{ background:'none', border:'none', borderBottom:`2px solid ${active===t.key?'#C8922A':'transparent'}`, color:active===t.key?'#C8922A':'#4B5563', padding:'12px 24px', fontFamily:'monospace', fontSize:'12px', cursor:'pointer', letterSpacing:'0.05em' }}>
                  {t.label.toUpperCase()}
                </button>
              ))}
            </div>

            {/* GUIDELINES */}
            {active==='guidelines' && (
              <div>
                <div style={{ background:'#111318', border:'1px solid #C8922A40', borderLeft:'4px solid #C8922A', padding:'20px 24px', marginBottom:'32px' }}>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', color:'#94A3B8', lineHeight:1.8 }}>
                    DownRange reaches dedicated firearms owners, concealed carriers, legal professionals, and 2A advocates across all 50 states. We publish original, expert-driven content — not AI slop or recycled press releases. If you know firearms law, technique, or the industry from the inside, we want to hear from you.
                  </p>
                </div>

                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>WHAT WE PUBLISH</h2>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'36px' }}>
                  {WHAT_WE_PUBLISH.map(w=>(
                    <div key={w.title} style={{ background:'#111318', border:'1px solid #1F2428', padding:'18px 20px', borderLeft:'3px solid #C8922A' }}>
                      <div style={{ display:'flex', gap:'10px', marginBottom:'8px' }}>
                        <span style={{ fontSize:'18px' }}>{w.icon}</span>
                        <span style={{ fontFamily:'monospace', fontSize:'13px', fontWeight:700, color:'#F0EDE6' }}>{w.title}</span>
                      </div>
                      <p style={{ fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.6 }}>{w.desc}</p>
                    </div>
                  ))}
                </div>

                <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>EDITORIAL STANDARDS</h2>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'32px' }}>
                  {[
                    ['Accuracy','All factual claims must be verifiable. Legal claims require statutory citations. No rumors or unverified manufacturer statements.'],
                    ['Originality','Must be original, not published elsewhere. We run plagiarism detection on all submissions.'],
                    ['Voice','Direct, authoritative, practical. Our readers are educated gun owners, not beginners. Avoid condescension.'],
                    ['Disclosure','Disclose any manufacturer relationships, free samples, or financial interests related to reviewed products.'],
                    ['Rights','First digital rights for 90 days. Authors retain copyright. We may republish with credit after 90 days.'],
                  ].map(([k,v])=>(
                    <div key={k} style={{ background:'#111318', border:'1px solid #1F2428', padding:'12px 16px', display:'grid', gridTemplateColumns:'120px 1fr', gap:16, alignItems:'start' }}>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#C8922A', fontWeight:700 }}>{k.toUpperCase()}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'11px', color:'#6B7280', lineHeight:1.6 }}>{v}</span>
                    </div>
                  ))}
                </div>
                <button onClick={()=>setActive('submit')} style={{ background:'#C8922A', color:'#000', border:'none', padding:'13px 28px', fontFamily:'monospace', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
                  SUBMIT A PITCH →
                </button>
              </div>
            )}

            {/* RATES */}
            {active==='rates' && (
              <div>
                <div style={{ background:'#111318', border:'1px solid #1F2428', borderLeft:'4px solid #C8922A', padding:'20px 24px', marginBottom:'28px' }}>
                  <p style={{ fontFamily:'monospace', fontSize:'13px', color:'#94A3B8', lineHeight:1.8 }}>
                    We pay for quality content. Rates are negotiable based on credentials, exclusivity, and publication slot. Payment via PayPal, Venmo, or check within 30 days of publication.
                  </p>
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:'8px', marginBottom:'32px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 120px 180px', gap:12, padding:'8px 14px', fontFamily:'monospace', fontSize:'9px', color:'#4B5563', letterSpacing:'0.12em', borderBottom:'1px solid #1F2428' }}>
                    <span>CONTENT TYPE</span><span>RATE</span><span>NOTES</span>
                  </div>
                  {RATES.map(r=>(
                    <div key={r.type} style={{ background:'#111318', border:'1px solid #1F2428', padding:'14px', display:'grid', gridTemplateColumns:'1fr 120px 180px', gap:12, alignItems:'center' }}>
                      <span style={{ fontFamily:'monospace', fontSize:'12px', color:'#F0EDE6' }}>{r.type}</span>
                      <span style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.2rem', color:'#C8922A' }}>{r.rate}</span>
                      <span style={{ fontFamily:'monospace', fontSize:'10px', color:'#4B5563' }}>{r.notes}</span>
                    </div>
                  ))}
                </div>
                <div style={{ padding:'16px 20px', background:'#111318', border:'1px solid #1F2428', fontFamily:'monospace', fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
                  Rates listed are per-piece, for first-time contributors. Regular contributors may negotiate ongoing rates. All rates in USD.
                </div>
                <button onClick={()=>setActive('submit')} style={{ marginTop:'24px', background:'#C8922A', color:'#000', border:'none', padding:'13px 28px', fontFamily:'monospace', fontWeight:700, fontSize:'13px', cursor:'pointer' }}>
                  SUBMIT A PITCH →
                </button>
              </div>
            )}

            {/* SUBMIT */}
            {active==='submit' && (
              <div style={{ maxWidth:680 }}>
                {state==='sent' ? (
                  <div style={{ background:'#001A0A', border:'1px solid #16603440', padding:'40px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:'#34D399', marginBottom:'12px' }}>PITCH RECEIVED ✓</div>
                    <p style={{ fontFamily:'monospace', fontSize:'13px', color:'#6B7280', lineHeight:1.7 }}>
                      We review all pitches within 5 business days. If we're interested, we'll reach out to discuss the piece, timeline, and rate.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                    {[
                      { label:'FULL NAME *', key:'name', placeholder:'Your name' },
                      { label:'EMAIL *', key:'email', type:'email', placeholder:'your@email.com' },
                      { label:'EXPERTISE / CREDENTIALS', key:'expertise', placeholder:'e.g. FFL dealer, firearms attorney, USPSA GM, USMC veteran' },
                    ].map(f=>(
                      <div key={f.key}>
                        <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>{f.label}</label>
                        <input type={f.type||'text'} value={form[f.key]} onChange={e=>setForm(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} required={f.label.includes('*')}
                          style={{ width:'100%', background:'#111318', border:'1px solid #1F2428', color:'#F5F5F3', padding:'11px 13px', fontFamily:'monospace', fontSize:'12px', boxSizing:'border-box' }} />
                      </div>
                    ))}
                    <div>
                      <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>SHORT BIO (2-3 sentences)</label>
                      <textarea value={form.bio} onChange={e=>setForm(p=>({...p,bio:e.target.value}))} rows={3} placeholder="Who you are, your background, why you're qualified to write this piece"
                        style={{ width:'100%', background:'#111318', border:'1px solid #1F2428', color:'#F5F5F3', padding:'11px 13px', fontFamily:'monospace', fontSize:'12px', resize:'vertical', boxSizing:'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>ARTICLE TOPIC / HEADLINE *</label>
                      <input value={form.topic} onChange={e=>setForm(p=>({...p,topic:e.target.value}))} placeholder="e.g. How Bruen Changes the Standard for AWB Challenges" required
                        style={{ width:'100%', background:'#111318', border:'1px solid #1F2428', color:'#F5F5F3', padding:'11px 13px', fontFamily:'monospace', fontSize:'12px', boxSizing:'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>BRIEF OUTLINE *</label>
                      <textarea value={form.outline} onChange={e=>setForm(p=>({...p,outline:e.target.value}))} rows={6} required placeholder="3-5 sentences describing what you'll cover, your angle, what makes it timely/unique for DownRange readers"
                        style={{ width:'100%', background:'#111318', border:'1px solid #1F2428', color:'#F5F5F3', padding:'11px 13px', fontFamily:'monospace', fontSize:'12px', resize:'vertical', boxSizing:'border-box' }} />
                    </div>
                    <div>
                      <label style={{ fontFamily:'monospace', fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>WRITING SAMPLE URL (optional)</label>
                      <input value={form.sampleUrl} onChange={e=>setForm(p=>({...p,sampleUrl:e.target.value}))} placeholder="https://..." type="url"
                        style={{ width:'100%', background:'#111318', border:'1px solid #1F2428', color:'#F5F5F3', padding:'11px 13px', fontFamily:'monospace', fontSize:'12px', boxSizing:'border-box' }} />
                    </div>
                    {state==='error' && <div style={{ fontFamily:'monospace', fontSize:'12px', color:'#EF4444', padding:'10px', background:'#1A0000', border:'1px solid #7F1D1D' }}>✗ Submission failed. Please try again or email directly.</div>}
                    <button type="submit" disabled={state==='sending'}
                      style={{ background:'#C8922A', color:'#000', border:'none', padding:'14px', fontFamily:'monospace', fontWeight:700, fontSize:'13px', cursor:'pointer', opacity:state==='sending'?0.6:1 }}>
                      {state==='sending' ? 'SUBMITTING...' : 'SUBMIT PITCH →'}
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
