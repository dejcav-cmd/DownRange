'use client'
import { useState, useEffect } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const FORM_META = {
  'suppressor':      { icon: '🔇', label: 'Suppressor / Can',    color: '#34D399' },
  'sbr-make':        { icon: '🔫', label: 'SBR / SBS (Form 1)',  color: '#60A5FA' },
  'dealer-transfer': { icon: '🏪', label: 'Dealer Transfer',     color: '#A78BFA' },
  'paper':           { icon: '📄', label: 'Paper Submission',    color: '#FBBF24' },
  'machinegun':      { icon: '⚙',  label: 'Machine Gun',         color: '#EF4444' },
}

function TrendArrow({ trend, delta }) {
  if (trend === 'up')     return <span style={{ color:'#EF4444', fontSize:14 }}>▲ {delta != null ? `+${delta}d` : 'slower'}</span>
  if (trend === 'down')   return <span style={{ color:'#34D399', fontSize:14 }}>▼ {delta != null ? `${delta}d` : 'faster'}</span>
  return <span style={{ color:'#6B7280', fontSize:12 }}>— stable</span>
}

function BarIndicator({ days, maxDays = 400 }) {
  const pct = Math.min(100, (days / maxDays) * 100)
  const color = days <= 14 ? '#34D399' : days <= 60 ? '#60A5FA' : days <= 120 ? '#FBBF24' : '#EF4444'
  return (
    <div style={{ height: 4, background: '#1F2428', marginTop: 8, borderRadius: 2, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width .6s ease' }} />
    </div>
  )
}

export default function NFATracker() {
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const [ageHours, setAgeHours] = useState(null)
  const [stale,   setStale]   = useState(false)
  const [fallback, setFallback] = useState(false)

  const [form, setForm] = useState({ item: '', type: 'Form 4 eFile Individual', submitted: '' })
  const [estimate, setEstimate] = useState(null)

  useEffect(() => {
    fetch('/api/nfa-wait-times')
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.data) {
          setData(d.data)
          setAgeHours(d.ageHours)
          setStale(d.stale)
          setFallback(d.fallback)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function calcEstimate() {
    if (!data?.forms) return
    const match = data.forms.find(f =>
      f.formType?.toLowerCase().includes(form.type.toLowerCase().split(' ')[1]) ||
      f.formType === form.type
    ) || data.forms[0]

    const submitted  = form.submitted ? new Date(form.submitted) : new Date()
    const avgDate    = new Date(submitted); avgDate.setDate(avgDate.getDate() + match.avgDays)
    const minDate    = new Date(submitted); minDate.setDate(minDate.getDate() + (match.minDays || Math.round(match.avgDays * 0.5)))
    const maxDate    = new Date(submitted); maxDate.setDate(maxDate.getDate() + (match.maxDays || Math.round(match.avgDays * 2)))
    const elapsed    = Math.max(0, Math.floor((Date.now() - submitted) / 86400000))
    const pct        = Math.min(100, Math.round((elapsed / match.avgDays) * 100))
    const fmt        = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    setEstimate({ ...match, minDate: fmt(minDate), avgDate: fmt(avgDate), maxDate: fmt(maxDate), elapsed, pct })
  }

  const forms = data?.forms || []
  const mainForms = forms.filter(f => f.category !== 'paper' && f.category !== 'machinegun')
  const otherForms = forms.filter(f => f.category === 'paper' || f.category === 'machinegun')

  return (
    <>
      <Masthead />
      <div className="page-hero" data-title="NFA">
        <div className="container">
          <h1 className="page-hero-title">NFA Wait Time Tracker</h1>
          <p className="page-hero-sub">Current ATF Form 4 processing times · Scraped daily from ATF.gov & industry trackers · Estimate your approval date</p>
        </div>
      </div>

      <div style={{ padding:'40px 0' }}>
        <div className="container">

          {/* Data freshness banner */}
          <div style={{
            marginBottom: 28, padding: '10px 16px',
            background: stale ? 'rgba(239,68,68,.06)' : 'rgba(34,197,94,.06)',
            border: `1px solid ${stale ? 'rgba(239,68,68,.25)' : 'rgba(34,197,94,.25)'}`,
            display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap',
            fontFamily: "'IBM Plex Mono',monospace", fontSize: 11,
          }}>
            <span style={{ color: stale ? '#EF4444' : '#34D399' }}>
              {stale ? '⚠' : '●'} {stale ? 'DATA MAY BE STALE' : 'LIVE DATA'}
            </span>
            {data?.reportMonth && (
              <span style={{ color: '#6B7280' }}>ATF reporting period: {data.reportMonth}</span>
            )}
            {ageHours != null && (
              <span style={{ color: '#4B5563' }}>
                {ageHours < 1 ? 'Updated < 1 hour ago' : ageHours < 24 ? `Updated ${ageHours}h ago` : `Updated ${Math.round(ageHours/24)}d ago`}
              </span>
            )}
            {fallback && <span style={{ color: '#6B7280' }}>Using baseline data · daily cron will update at 6am UTC</span>}
            {data?.sourceUrl && (
              <a href={data.sourceUrl} target="_blank" rel="noreferrer"
                style={{ color: '#C8922A', marginLeft: 'auto', textDecoration: 'none', fontSize: 10 }}>
                SOURCE: {data.sourceUrl.includes('atf.gov') ? 'ATF.GOV' : data.sourceUrl.replace(/https?:\/\/(www\.)?/, '').split('/')[0].toUpperCase()} ↗
              </a>
            )}
            {data?.reportedByAtf && (
              <span style={{ background: 'rgba(200,146,42,.15)', color: '#C8922A', padding: '1px 8px', fontSize: 10, fontWeight: 700 }}>
                ✓ ATF OFFICIAL
              </span>
            )}
          </div>

          {/* Main wait time cards */}
          <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color:'#C8922A', letterSpacing:'.05em', marginBottom:20 }}>
            CURRENT ATF PROCESSING TIMES
          </h2>

          {loading ? (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12, marginBottom:48 }}>
              {[1,2,3,4,5,6].map(i => (
                <div key={i} style={{ background:'#111318', border:'1px solid #1F2428', padding:24, height:140,
                  animation:'pulse 1.5s ease-in-out infinite', borderRadius:4 }} />
              ))}
            </div>
          ) : (
            <>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(260px,1fr))', gap:12, marginBottom: otherForms.length ? 16 : 48 }}>
                {mainForms.map((w, i) => {
                  const meta = FORM_META[w.category] || FORM_META['suppressor']
                  return (
                    <div key={i} style={{ background:'#111318', border:'1px solid #1F2428', padding:24, position:'relative' }}>
                      <div style={{ position:'absolute', top:16, right:16 }}>
                        <TrendArrow trend={w.trend} delta={w.delta} />
                      </div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563', marginBottom:8, letterSpacing:'.1em' }}>
                        {meta.icon} {meta.label}
                      </div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2.8rem', lineHeight:1, color: meta.color }}>
                        {w.avgDays}
                        <span style={{ fontSize:'1.1rem', color:'#6B7280', marginLeft:4 }}>days avg</span>
                      </div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#374151', marginTop:6 }}>
                        {w.formType}
                      </div>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:4 }}>
                        Range: {w.minDays}–{w.maxDays} days
                      </div>
                      <BarIndicator days={w.avgDays} maxDays={100} />
                      {w.note && (
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:8, lineHeight:1.6 }}>
                          {w.note}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {otherForms.length > 0 && (
                <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))', gap:12, marginBottom:48 }}>
                  {otherForms.map((w, i) => {
                    const meta = FORM_META[w.category] || FORM_META['paper']
                    return (
                      <div key={i} style={{ background:'#111318', border:'1px solid #1F2428', padding:20, opacity: 0.8 }}>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563', marginBottom:6 }}>
                          {meta.icon} {meta.label}
                        </div>
                        <div style={{ display:'flex', alignItems:'baseline', gap:8 }}>
                          <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'2.2rem', color: meta.color }}>{w.avgDays}</span>
                          <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#6B7280' }}>days avg</span>
                          <TrendArrow trend={w.trend} delta={w.delta} />
                        </div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:4 }}>{w.formType}</div>
                        <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:2 }}>Range: {w.minDays}–{w.maxDays} days</div>
                        {w.note && <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#374151', marginTop:6, lineHeight:1.6 }}>{w.note}</div>}
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* Estimate calculator */}
          <div style={{ background:'#111318', border:'1px solid #C8922A33', padding:32, marginBottom:48 }}>
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', color:'#C8922A', letterSpacing:'.05em', marginBottom:6 }}>
              ESTIMATE YOUR APPROVAL DATE
            </h2>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#4B5563', marginBottom:20 }}>
              Enter your item and submission date to get a projected approval window based on current ATF averages.
            </p>
            <div style={{ display:'flex', gap:12, flexWrap:'wrap', marginBottom:16 }}>
              <input type="text" placeholder="Item (e.g. SilencerCo Omega 9K)" value={form.item}
                onChange={e => setForm(f => ({...f, item: e.target.value}))}
                style={{ flex:2, minWidth:200, background:'#0D1117', border:'1px solid #1F2428', color:'#F5F5F3', padding:'12px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }} />
              <select value={form.type} onChange={e => setForm(f => ({...f, type: e.target.value}))}
                style={{ flex:2, minWidth:180, background:'#0D1117', border:'1px solid #1F2428', color:'#F5F5F3', padding:'12px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }}>
                {forms.map(w => <option key={w.formType} value={w.formType}>{w.formType}</option>)}
              </select>
              <input type="date" value={form.submitted} onChange={e => setForm(f => ({...f, submitted: e.target.value}))}
                style={{ flex:1, minWidth:150, background:'#0D1117', border:'1px solid #1F2428', color:'#F5F5F3', padding:'12px 14px', fontFamily:"'IBM Plex Mono',monospace", fontSize:12 }} />
              <button onClick={calcEstimate}
                style={{ background:'#C8922A', color:'#000', border:'none', padding:'12px 24px', fontFamily:"'Bebas Neue',sans-serif", fontSize:'1rem', letterSpacing:'.06em', cursor:'pointer', whiteSpace:'nowrap' }}>
                CALCULATE →
              </button>
            </div>

            {estimate && (
              <div style={{ borderTop:'1px solid #1F2428', paddingTop:20, marginTop:8 }}>
                <div style={{ display:'flex', gap:24, flexWrap:'wrap', marginBottom:16 }}>
                  {[
                    { label:'Best Case',  val: estimate.minDate, color:'#34D399' },
                    { label:'Average',    val: estimate.avgDate, color:'#C8922A' },
                    { label:'Worst Case', val: estimate.maxDate, color:'#EF4444' },
                  ].map(col => (
                    <div key={col.label}>
                      <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563', marginBottom:4, letterSpacing:'.1em' }}>{col.label}</div>
                      <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color: col.color }}>{col.val}</div>
                    </div>
                  ))}
                  <div style={{ marginLeft:'auto', textAlign:'right' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#4B5563', marginBottom:4 }}>PROGRESS</div>
                    <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.6rem', color: estimate.pct >= 100 ? '#34D399' : '#C8922A' }}>
                      {estimate.elapsed}d / {estimate.avgDays}d ({estimate.pct}%)
                    </div>
                  </div>
                </div>
                <div style={{ height:8, background:'#1F2428', borderRadius:4, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${estimate.pct}%`, background: estimate.pct >= 100 ? '#34D399' : '#C8922A', borderRadius:4, transition:'width .6s' }} />
                </div>
                {estimate.pct >= 100 && (
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:12, color:'#34D399', marginTop:10 }}>
                    ✓ You are past the average approval window. Check eforms.atf.gov for your status.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* How to check status */}
          <div style={{ background:'#0D1117', border:'1px solid #1F2428', padding:28, marginBottom:40 }}>
            <h3 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.2rem', color:'#C8922A', letterSpacing:'.05em', marginBottom:14 }}>
              CHECK YOUR APPLICATION STATUS
            </h3>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:16 }}>
              {[
                { step:'01', title:'eForms Portal', desc:'Log in at eforms.atf.gov · Status shows: Submitted → In Process → Pending Research → Approved', color:'#60A5FA' },
                { step:'02', title:'NFA Branch Phone', desc:'Call (304) 616-4500 · Have your case number ready · Mon–Fri 8am–5pm EST', color:'#34D399' },
                { step:'03', title:'Pending Research', desc:'Means additional review needed — not denied. Can add weeks. Follow up after 90 days.', color:'#FBBF24' },
              ].map(s => (
                <div key={s.step} style={{ display:'flex', gap:12 }}>
                  <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:'1.5rem', color: s.color, flexShrink:0, lineHeight:1 }}>{s.step}</div>
                  <div>
                    <div style={{ fontFamily:"'Barlow Condensed',sans-serif", fontSize:14, fontWeight:700, color:'var(--text)', marginBottom:4 }}>{s.title}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#4B5563', lineHeight:1.7 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Data sources */}
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#374151', lineHeight:2, borderTop:'1px solid #1F2428', paddingTop:20 }}>
            <strong style={{ color:'#4B5563' }}>DATA SOURCES:</strong>{' '}
            ATF official processing times (atf.gov/resource-center/current-processing-times) · 
            Silencer Shop daily tracker (silencershop.com/atf-wait-times) · 
            Silencer Central community data (silencercentral.com) ·
            DownRange scrapes these sources daily at 6am UTC and stores the latest snapshot.
            Individual results vary based on NICS check outcome, trust complexity, and examiner workload.
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
