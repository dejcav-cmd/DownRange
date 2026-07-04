'use client'
import { useState } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const CONDITIONS = ['Poor','Fair','Good','Very Good','Excellent','NIB (New in Box)']
const CONDITION_MULT = { 'Poor':0.35,'Fair':0.55,'Good':0.75,'Very Good':0.88,'Excellent':0.97,'NIB (New in Box)':1.05 }

const GUN_VALS = {
  'Glock 17':{ base:450,note:'Most common Glock — deep market = lower premium' },
  'Glock 19':{ base:480,note:'Highest demand pistol in US — holds value extremely well' },
  'Glock 43X':{ base:420,note:'Popular EDC — solid resale in most markets' },
  'SIG P320':{ base:480,note:'M17 military adoption boosted collector interest' },
  'SIG P365':{ base:460,note:'Strong demand — XL variant worth ~$20 more' },
  'AR-15 (mil-spec)':{ base:550,note:'Commodity market — brand matters significantly' },
  'AK-47 / AKM':{ base:650,note:'Imported AKs command premium; WASR vs Arsenal vary widely' },
  'Smith & Wesson M&P9':{ base:380,note:'Very common — highly liquid market, modest premium' },
  'Ruger 10/22':{ base:220,note:'Most popular .22 ever — extremely liquid market' },
  'Mossberg 500':{ base:280,note:'Budget shotgun — low collector premium, sells fast' },
  '1911 (standard)':{ base:550,note:'Brand critical: Colt/Springfield command more than no-name' },
  'Remington 870':{ base:250,note:'Post-bankruptcy 870s worth less; pre-2020 models command premium' },
}

export default function ValueEstimator() {
  const [form, setForm] = useState({ model:'Glock 19', condition:'Very Good', year:'', mods:'', original:true })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)

  async function estimate() {
    setLoading(true)
    const base = GUN_VALS[form.model]
    if (!base) { setLoading(false); return }
    const mult = CONDITION_MULT[form.condition] || 0.75
    const modsPenalty = !form.original ? -0.08 : 0
    const agePenalty = form.year && (new Date().getFullYear() - parseInt(form.year)) > 15 ? -0.05 : 0
    const low = Math.round(base.base * (mult + modsPenalty + agePenalty) * 0.88)
    const mid = Math.round(base.base * (mult + modsPenalty + agePenalty))
    const high = Math.round(base.base * (mult + modsPenalty + agePenalty) * 1.12)

    // Try Claude for enhanced analysis
    let aiNote = null
    try {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method:'POST', headers:{ 'Content-Type':'application/json', 'x-api-key':'', 'anthropic-version':'2023-06-01' },
        body:JSON.stringify({ model:'claude-haiku-4-5-20251001', max_tokens:150, messages:[{ role:'user', content:`In 1-2 sentences, what factors most affect the resale value of a ${form.condition} ${form.model}? Be specific about current market.` }] })
      })
      const d = await r.json()
      aiNote = d.content?.[0]?.text
    } catch {}

    setResult({ low, mid, high, note:base.note, aiNote })
    setLoading(false)
  }

  return (
    <>

      <Masthead />
      <div className="page-hero" data-title="VALUE">
        <div className="container">
          <h1 className="page-hero-title">Firearm Value Estimator</h1>
          <p className="page-hero-sub">AI-powered fair market value — know what your gun is worth before you sell or trade</p>
        </div>
      </div>
      <div style={{ padding:'40px 0' }}>
        <div className="container" style={{ maxWidth:800 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px' }}>
            <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'28px' }}>
              <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'18px', fontWeight:700 }}>APPRAISE YOUR FIREARM</div>
              <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                <div>
                  <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>MAKE & MODEL</label>
                  <select value={form.model} onChange={e=>setForm(p=>({...p,model:e.target.value}))}
                    style={{ width:'100%', background:'#0D1117', border:'1px solid var(--border)', color:'#F5F5F3', padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }}>
                    {Object.keys(GUN_VALS).map(m=><option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>CONDITION</label>
                  <select value={form.condition} onChange={e=>setForm(p=>({...p,condition:e.target.value}))}
                    style={{ width:'100%', background:'#0D1117', border:'1px solid var(--border)', color:'#F5F5F3', padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px' }}>
                    {CONDITIONS.map(c=><option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#6B7280', display:'block', marginBottom:'6px' }}>YEAR OF MANUFACTURE (optional)</label>
                  <input type="number" value={form.year} onChange={e=>setForm(p=>({...p,year:e.target.value}))} placeholder="e.g. 2019"
                    style={{ width:'100%', background:'#0D1117', border:'1px solid var(--border)', color:'#F5F5F3', padding:'10px 12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', boxSizing:'border-box' }} />
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <input type="checkbox" id="orig" checked={form.original} onChange={e=>setForm(p=>({...p,original:e.target.checked}))}
                    style={{ width:16, height:16, accentColor:'#C8922A' }} />
                  <label htmlFor="orig" style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280', cursor:'pointer' }}>All original (no aftermarket mods)</label>
                </div>
                <button onClick={estimate} disabled={loading}
                  style={{ background:'#C8922A', color:'#000', border:'none', padding:'13px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'13px', cursor:'pointer', opacity:loading?0.6:1 }}>
                  {loading ? 'ESTIMATING...' : 'GET ESTIMATE →'}
                </button>
              </div>
            </div>

            <div>
              {result ? (
                <div>
                  <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'24px', marginBottom:'16px' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'16px', fontWeight:700 }}>ESTIMATED MARKET VALUE</div>
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginBottom:'16px' }}>
                      {[['LOW',result.low,'#EF4444'],['MID RANGE',result.mid,'#C8922A'],['HIGH',result.high,'#34D399']].map(([l,v,c])=>(
                        <div key={l} style={{ textAlign:'center', background:'#0D1117', padding:'14px 8px' }}>
                          <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.8rem', color:c, lineHeight:1 }}>${v.toLocaleString()}</div>
                          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginTop:'4px' }}>{l}</div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.6 }}>{result.note}</p>
                  </div>
                  {result.aiNote && (
                    <div style={{ background:'#0D1117', border:'1px solid #C8922A40', borderLeft:'3px solid #C8922A', padding:'16px' }}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A', marginBottom:'8px', letterSpacing:'0.12em' }}>🤖 AI MARKET NOTE</div>
                      <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280', lineHeight:1.7 }}>{result.aiNote}</p>
                    </div>
                  )}
                  <div style={{ marginTop:'12px', fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#374151', lineHeight:1.6 }}>
                    Estimates based on recent private party sales. Dealer trade-in offers typically 20–40% below market. Check GunBroker.com completed listings to verify.
                  </div>
                </div>
              ) : (
                <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'28px', height:'100%', display:'flex', flexDirection:'column', justifyContent:'center', alignItems:'center', textAlign:'center', minHeight:'300px' }}>
                  <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'3rem', color:'#1F2428', marginBottom:'12px' }}>$</div>
                  <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#4B5563', lineHeight:1.7 }}>Select your firearm details and click "Get Estimate" to see fair market value</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ marginTop:'24px', padding:'16px 20px', background:'#111318', border:'1px solid var(--border)', fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#4B5563', lineHeight:1.7 }}>
            ⚠ Estimates are informational only. Actual values vary by location, market conditions, and specific configuration. Always verify with recent comparable sales on GunBroker, Armslist, or local gun shops.
          </div>
        </div>
      </div>
      {/* ── SEO Content Block ── */}
      <div style={{ background:'#09090B', borderTop:'1px solid #1F2428', padding:'48px 0' }}>
        <div style={{ maxWidth:'900px', margin:'0 auto', padding:'0 24px' }}>
          <h2 style={{ fontFamily:"'Bebas Neue',Impact,sans-serif", fontSize:'1.8rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'20px' }}>HOW GUN RESALE VALUE WORKS</h2>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'32px', marginBottom:'32px' }}>
            <div>
              <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', fontWeight:700, color:'#F0EDE6', marginBottom:'10px', letterSpacing:'0.04em' }}>THE CONDITION SPECTRUM</h3>
              <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'14px', color:'#9CA3AF', lineHeight:1.8, margin:0 }}>
                Condition is the largest single variable in firearm resale value — it can shift price by 50% or more on the same model. The standard grades run from Poor (heavy wear, questionable function) through Fair, Good, Very Good, and Excellent, up to NIB (New in Box, unfired with all factory contents). High-demand pistols like the Glock 19 and SIG P365 hold value across all condition grades better than most other platforms.
              </p>
            </div>
            <div>
              <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.1rem', fontWeight:700, color:'#F0EDE6', marginBottom:'10px', letterSpacing:'0.04em' }}>WHERE TO SELL</h3>
              <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'14px', color:'#9CA3AF', lineHeight:1.8, margin:0 }}>
                Private sale through GunBroker, Armslist, or local gun shows typically yields the highest price but requires you to handle paperwork and shipping logistics. Dealer trade-in is fastest but returns only 40–60% of retail. Consignment at a local gun shop splits the difference — the dealer handles the transaction and takes 10–20% of the sale price, leaving you more than a trade-in without the hassle of a private sale.
              </p>
            </div>
          </div>
          <div style={{ background:'#111318', border:'1px solid #1F2428', padding:'20px 24px', marginBottom:'24px' }}>
            <h3 style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:'1.05rem', fontWeight:700, color:'#F0EDE6', marginBottom:'10px', letterSpacing:'0.04em' }}>WHAT ADDS VALUE BEYOND CONDITION</h3>
            <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'14px', color:'#9CA3AF', lineHeight:1.8, margin:0 }}>
              Original factory box, all included magazines, cleaning kit, and paperwork add $30–100 to most modern pistols. Quality aftermarket upgrades (optics cuts, trigger work by a known smith, night sights) can add value if documented — but only to buyers who wanted those specific upgrades. Generic mods often reduce appeal. Rare configurations, limited editions, and production discontinuations can create collector premiums well above standard market value.
            </p>
          </div>
          <p style={{ fontFamily:"'IBM Plex Sans',sans-serif", fontSize:'13px', color:'#6B7280', lineHeight:1.7, margin:0 }}>
            Values are estimates based on market trends and condition grades. Actual sale prices vary by region, platform, and timing. Check the <a href="/deals" style={{ color:'#C8922A', textDecoration:'none' }}>Deals page</a> for current market pricing on new guns, or the <a href="/market" style={{ color:'#C8922A', textDecoration:'none' }}>Market Watch</a> for ammo price trends.
          </p>
        </div>
      </div>

      <Footer />
    </>
  )
}
