'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

export default function ContactPage() {
  const [form, setForm] = useState({ name:'', email:'', phone:'', subject:'', message:'' })
  const [state, setState] = useState(null) // null | 'sending' | 'sent' | 'error'
  const [errMsg, setErrMsg] = useState('')

  async function submit(e) {
    e.preventDefault()
    if (!form.name||!form.email||!form.message) return
    setState('sending')
    try {
      const res = await fetch('/api/contact', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(form) })
      const d = await res.json()
      if (d.success) { setState('sent'); setForm({ name:'',email:'',phone:'',subject:'',message:'' }) }
      else { setState('error'); setErrMsg(d.error||'Send failed') }
    } catch { setState('error'); setErrMsg('Connection error. Please try again.') }
  }

  const I = (props) => (
    <input {...props} style={{ width:'100%', background:'#111318', border:'1px solid var(--border)', color:'#F5F5F3', padding:'12px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', boxSizing:'border-box', transition:'border-color 0.2s', ...props.style }}
      onFocus={e=>e.target.style.borderColor='#C8922A'} onBlur={e=>e.target.style.borderColor='#1F2428'} />
  )

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
        <div className="container" style={{ maxWidth:800 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:'48px' }}>
            <div>
              {state==='sent' ? (
                <div style={{ background:'#001A0A', border:'1px solid #16603440', padding:'32px', textAlign:'center' }}>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'2rem', color:'#34D399', marginBottom:'12px' }}>MESSAGE SENT ✓</div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', color:'#6B7280', lineHeight:1.7 }}>
                    We received your message and will respond within 24–48 hours to the email you provided.
                  </p>
                  <button onClick={()=>setState(null)} style={{ marginTop:'20px', background:'transparent', border:'1px solid #C8922A', color:'#C8922A', padding:'10px 24px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'12px', cursor:'pointer' }}>
                    SEND ANOTHER
                  </button>
                </div>
              ) : (
                <form onSubmit={submit} style={{ display:'flex', flexDirection:'column', gap:'16px' }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>NAME *</label>
                      <I value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Your name" required />
                    </div>
                    <div>
                      <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>EMAIL *</label>
                      <I type="email" value={form.email} onChange={e=>setForm(p=>({...p,email:e.target.value}))} placeholder="your@email.com" required />
                    </div>
                  </div>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px' }}>
                    <div>
                      <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>PHONE (optional)</label>
                      <I value={form.phone} onChange={e=>setForm(p=>({...p,phone:e.target.value}))} placeholder="(555) 000-0000" />
                    </div>
                    <div>
                      <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>SUBJECT</label>
                      <I value={form.subject} onChange={e=>setForm(p=>({...p,subject:e.target.value}))} placeholder="General inquiry" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>MESSAGE *</label>
                    <textarea value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} rows={7} required placeholder="How can we help?"
                      style={{ width:'100%', background:'#111318', border:'1px solid var(--border)', color:'#F5F5F3', padding:'12px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'13px', resize:'vertical', boxSizing:'border-box' }}
                      onFocus={e=>e.target.style.borderColor='#C8922A'} onBlur={e=>e.target.style.borderColor='#1F2428'} />
                  </div>
                  {state==='error' && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#EF4444', padding:'10px', background:'#1A0000', border:'1px solid #7F1D1D' }}>✗ {errMsg}</div>}
                  <button type="submit" disabled={state==='sending'}
                    style={{ background:'#C8922A', color:'#000', border:'none', padding:'14px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'13px', cursor:'pointer', letterSpacing:'0.05em', opacity:state==='sending'?0.6:1 }}>
                    {state==='sending' ? 'SENDING...' : 'SEND MESSAGE →'}
                  </button>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151', lineHeight:1.6 }}>
                    Your email is used only to respond to your inquiry. We never share contact information with third parties.
                  </p>
                </form>
              )}
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
