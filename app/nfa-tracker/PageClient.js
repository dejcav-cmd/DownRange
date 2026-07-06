'use client'
import { useState, useEffect } from 'react'
import Masthead from '../../components/layout/Masthead'
import Footer from '../../components/layout/Footer'

const FORM_TYPES = [
  { key: 'suppressor',      icon: '🔇', label: 'Suppressor / Can',     color: '#34D399', bg: 'rgba(52,211,153,.08)',  border: 'rgba(52,211,153,.2)'  },
  { key: 'sbr-make',        icon: '🎯', label: 'SBR / SBS (Form 1)',   color: '#60A5FA', bg: 'rgba(96,165,250,.08)',  border: 'rgba(96,165,250,.2)'  },
  { key: 'dealer-transfer', icon: '🏪', label: 'Dealer Transfer (F3)', color: '#A78BFA', bg: 'rgba(167,139,250,.08)', border: 'rgba(167,139,250,.2)' },
  { key: 'machinegun',      icon: '⚙️', label: 'Machine Gun (Pre-86)', color: '#EF4444', bg: 'rgba(239,68,68,.08)',   border: 'rgba(239,68,68,.2)'   },
  { key: 'paper',           icon: '📄', label: 'Paper Submission',     color: '#F59E0B', bg: 'rgba(245,158,11,.08)',  border: 'rgba(245,158,11,.2)'  },
]

function TrendBadge({ trend, delta }) {
  const cfg = {
    up:     { color: '#EF4444', bg: 'rgba(239,68,68,.12)',  label: delta ? `+${delta}d slower` : '▲ Slower'  },
    down:   { color: '#34D399', bg: 'rgba(52,211,153,.12)', label: delta ? `${delta}d faster` : '▼ Faster'   },
    stable: { color: '#6B7280', bg: 'rgba(107,114,128,.1)', label: '— Stable' },
  }
  const t = cfg[trend] || cfg.stable
  return (
    <span style={{
      background: t.bg, color: t.color,
      padding: '2px 8px', fontSize: 10,
      fontFamily: "'IBM Plex Mono',monospace",
      fontWeight: 700, letterSpacing: '.05em',
    }}>{t.label}</span>
  )
}

function WaitBar({ days, maxDays = 400 }) {
  const pct   = Math.min(100, (days / maxDays) * 100)
  const color = days <= 14 ? '#34D399' : days <= 60 ? '#60A5FA' : days <= 120 ? '#F59E0B' : '#EF4444'
  return (
    <div style={{ height: 3, background: '#1a1a1a', marginTop: 12, overflow: 'hidden' }}>
      <div style={{ height: '100%', width: `${pct}%`, background: color, transition: 'width .8s ease' }} />
    </div>
  )
}

function FormCard({ w, meta, large }) {
  return (
    <div style={{
      background: '#0f0f0f',
      border: `1px solid ${meta.border}`,
      padding: large ? 28 : 22,
      position: 'relative',
      display: 'flex', flexDirection: 'column', gap: 0,
    }}>
      {/* Top row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 14, fontWeight: 700, color: '#c8922a', letterSpacing: '.12em', textTransform: 'uppercase' }}>
          <span style={{ marginRight: 6 }}>{meta.icon}</span>{meta.label}
        </div>
        <TrendBadge trend={w.trend} delta={w.delta} />
      </div>

      {/* Big number */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: "'Bebas Neue',cursive", fontSize: large ? '4rem' : '3.2rem', lineHeight: 1, color: meta.color }}>
          {w.avgDays}
        </span>
        <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#555', fontWeight: 600 }}>DAYS AVG</span>
      </div>

      {/* Sub info */}
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#999', marginBottom: 2 }}>{w.formType}</div>
      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#888' }}>
        Range: <span style={{ color: '#34D399' }}>{w.minDays}d</span> — <span style={{ color: '#EF4444' }}>{w.maxDays}d</span>
      </div>

      <WaitBar days={w.avgDays} maxDays={400} />

      {w.note && (
        <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#999', marginTop: 10, lineHeight: 1.7, borderTop: '1px solid #222', paddingTop: 10 }}>
          {w.note}
        </div>
      )}
    </div>
  )
}

export default function NFATracker() {
  const [data,     setData]     = useState(null)
  const [loading,  setLoading]  = useState(true)
  const [ageHours, setAgeHours] = useState(null)
  const [stale,    setStale]    = useState(false)
  const [fallback, setFallback] = useState(false)
  const [form,     setForm]     = useState({ item: '', type: '', submitted: '' })
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
          if (d.data.forms?.[0]) setForm(f => ({ ...f, type: d.data.forms[0].formType }))
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  function calcEstimate() {
    if (!data?.forms) return
    const match = data.forms.find(f => f.formType === form.type) || data.forms[0]
    const submitted = form.submitted ? new Date(form.submitted) : new Date()
    const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    const addDays = (d, n) => { const r = new Date(d); r.setDate(r.getDate() + n); return r }
    const elapsed = Math.max(0, Math.floor((Date.now() - submitted) / 86400000))
    const pct = Math.min(100, Math.round((elapsed / match.avgDays) * 100))
    setEstimate({
      ...match, elapsed, pct,
      minDate: fmt(addDays(submitted, match.minDays || Math.round(match.avgDays * .5))),
      avgDate: fmt(addDays(submitted, match.avgDays)),
      maxDate: fmt(addDays(submitted, match.maxDays || Math.round(match.avgDays * 2))),
    })
  }

  const forms = data?.forms || []

  // Map forms to FORM_TYPES to ensure all categories show
  const getMeta = (w) => FORM_TYPES.find(t => t.key === w.category) || FORM_TYPES[0]

  // Split into primary (suppressor, sbr, dealer) and secondary (paper, machinegun)
  const primaryForms  = forms.filter(f => !['paper','machinegun'].includes(f.category))
  const secondaryForms = forms.filter(f => ['paper','machinegun'].includes(f.category))

  return (
    <>
      <Masthead />

      {/* HERO */}
      <div style={{ background: '#0a0a0a', borderBottom: '2px solid #c8922a', padding: '56px 0 44px', position:'relative', overflow:'hidden' }}>
        <div aria-hidden style={{ position:'absolute', inset:0, backgroundImage:'url(/img/photos/rifle.jpg)', backgroundSize:'cover', backgroundPosition:'center', opacity:.5, pointerEvents:'none' }} />
        <div aria-hidden style={{ position:'absolute', inset:0, background:'linear-gradient(95deg, rgba(10,10,10,.9) 0%, rgba(10,10,10,.6) 48%, rgba(10,10,10,.28) 100%)', pointerEvents:'none' }} />
        <div aria-hidden style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, rgba(10,10,10,.88) 0%, transparent 58%)', pointerEvents:'none' }} />
        <div aria-hidden style={{ position:'absolute', inset:0, background:'radial-gradient(ellipse 70% 90% at 12% 0%, rgba(200,146,42,.12), transparent 60%)', pointerEvents:'none' }} />
        <div className="container" style={{ position:'relative' }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:12 }}>
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#c8922a', letterSpacing: '.2em' }}>⏱ NFA PROCESSING INTELLIGENCE</span>
            <span style={{ display:'flex', alignItems:'center', gap:6, fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#22C55E', letterSpacing:'.1em' }}><span className="nfa-live-dot" /> LIVE</span>
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: 'clamp(2.8rem,6vw,5rem)', color: '#fff', lineHeight: 1, margin: '0 0 16px', letterSpacing: '.02em' }}>
            NFA WAIT TIME<br /><span style={{ color: '#c8922a' }}>TRACKER</span>
          </h1>
          <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#cbd5e1', maxWidth: 600, lineHeight: 1.8, margin: 0 }}>
            Current ATF Form 4 processing times · Scraped from ATF.gov &amp; industry trackers · Estimate your approval date
          </p>
        </div>
        <style>{`@keyframes nfaPulse{0%,100%{opacity:1}50%{opacity:.35}} .nfa-live-dot{display:inline-block;width:6px;height:6px;border-radius:50%;background:#22c55e;animation:nfaPulse 1.6s infinite}`}</style>
      </div>

      <div style={{ padding: '40px 0 80px' }}>
        <div className="container">

          {/* STATUS BAR */}
          <div style={{
            marginBottom: 36,
            padding: '12px 20px',
            background: stale ? '#100a0a' : '#0a100a',
            border: `1px solid ${stale ? 'rgba(239,68,68,.3)' : 'rgba(52,211,153,.3)'}`,
            display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap',
            fontFamily: "'IBM Plex Mono',monospace",
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                width: 8, height: 8, borderRadius: '50%',
                background: stale ? '#EF4444' : '#34D399',
                boxShadow: stale ? '0 0 6px #EF4444' : '0 0 6px #34D399',
                display: 'inline-block',
              }} />
              <span style={{ color: stale ? '#EF4444' : '#34D399', fontSize: 11, fontWeight: 700, letterSpacing: '.1em' }}>
                {stale ? 'DATA MAY BE STALE' : 'LIVE DATA'}
              </span>
            </span>
            {data?.reportMonth && (
              <span style={{ color: '#bbb', fontSize: 11 }}>ATF reporting period: <strong style={{ color: '#ccc' }}>{data.reportMonth}</strong></span>
            )}
            {ageHours != null && (
              <span style={{ color: '#888', fontSize: 11 }}>
                Updated {ageHours < 1 ? '< 1 hour' : ageHours < 24 ? `${ageHours}h` : `${Math.round(ageHours/24)}d`} ago
              </span>
            )}
            {data?.sourceUrl && (
              <a href={data.sourceUrl} target="_blank" rel="noreferrer" style={{
                marginLeft: 'auto', color: '#c8922a', fontSize: 10,
                textDecoration: 'none', letterSpacing: '.05em',
              }}>
                SOURCE: {data.sourceUrl.includes('atf.gov') ? 'ATF.GOV' : data.sourceUrl.replace(/https?:\/\/(www\.)?/,'').split('/')[0].toUpperCase()} ↗
              </a>
            )}
            {data?.reportedByAtf && (
              <span style={{ background: 'rgba(200,146,42,.15)', color: '#c8922a', padding: '2px 10px', fontSize: 9, fontWeight: 700, letterSpacing: '.1em' }}>
                ✓ ATF OFFICIAL
              </span>
            )}
          </div>

          {/* SECTION HEADER */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.8rem', color: '#fff', margin: 0, letterSpacing: '.05em' }}>
              CURRENT ATF PROCESSING TIMES
            </h2>
            <div style={{ flex: 1, height: 1, background: '#1e1e1e' }} />
            <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#444' }}>
              {forms.length} FORM TYPES
            </span>
          </div>

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 48 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', padding: 28, height: 160, opacity: .4 }} />
              ))}
            </div>
          ) : forms.length === 0 ? (
            <div style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', padding: 40, marginBottom: 48, textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.4rem', color: '#555', marginBottom: 8 }}>NO DATA LOADED</div>
              <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#444' }}>Run the NFA Wait Times cron from the admin panel to fetch current data.</div>
            </div>
          ) : (
            <>
              {/* Primary forms grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 12 }}>
                {primaryForms.map((w, i) => (
                  <FormCard key={i} w={w} meta={getMeta(w)} large={i === 0} />
                ))}
              </div>

              {/* Secondary forms (paper + MG) — dimmer, smaller */}
              {secondaryForms.length > 0 && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0 12px' }}>
                    <span style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#666', letterSpacing: '.12em' }}>ADDITIONAL FORM TYPES</span>
                    <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 12, marginBottom: 48, opacity: .8 }}>
                    {secondaryForms.map((w, i) => (
                      <FormCard key={i} w={w} meta={getMeta(w)} />
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {/* ESTIMATE CALCULATOR */}
          <div style={{ background: '#0a0a0a', border: '1px solid #2a1a0a', padding: '36px 32px', marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.8rem', color: '#c8922a', margin: 0, letterSpacing: '.05em' }}>
                ESTIMATE YOUR APPROVAL DATE
              </h2>
              <div style={{ flex: 1, height: 1, background: '#2a1a0a' }} />
            </div>
            <p style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#aaa', marginBottom: 24, lineHeight: 1.8 }}>
              Enter your item and submission date to project your approval window based on current ATF averages.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
              <input type="text" placeholder="Item (e.g. SilencerCo Omega 9K)" value={form.item}
                onChange={e => setForm(f => ({ ...f, item: e.target.value }))}
                style={{ flex: 2, minWidth: 180, background: '#111', border: '1px solid #222', color: '#eee', padding: '13px 16px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, outline: 'none' }} />
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                style={{ flex: 2, minWidth: 200, background: '#111', border: '1px solid #222', color: '#eee', padding: '13px 16px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }}>
                {forms.map(w => <option key={w.formType} value={w.formType}>{w.formType}</option>)}
              </select>
              <input type="date" value={form.submitted} onChange={e => setForm(f => ({ ...f, submitted: e.target.value }))}
                style={{ flex: 1, minWidth: 160, background: '#111', border: '1px solid #222', color: '#eee', padding: '13px 16px', fontFamily: "'IBM Plex Mono',monospace", fontSize: 12 }} />
              <button onClick={calcEstimate}
                style={{ background: '#c8922a', color: '#000', border: 'none', padding: '13px 28px', fontFamily: "'Bebas Neue',cursive", fontSize: '1.1rem', letterSpacing: '.08em', cursor: 'pointer', whiteSpace: 'nowrap', borderBottom: '3px solid #7a5010' }}>
                CALCULATE →
              </button>
            </div>

            {estimate && (
              <div style={{ background: '#0f0f0f', border: '1px solid #1e1e1e', padding: 24, marginTop: 8 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 20, marginBottom: 20 }}>
                  {[
                    { label: 'BEST CASE',  val: estimate.minDate, color: '#34D399' },
                    { label: 'AVERAGE',    val: estimate.avgDate, color: '#c8922a' },
                    { label: 'WORST CASE', val: estimate.maxDate, color: '#EF4444' },
                    { label: 'PROGRESS',   val: `${estimate.elapsed}d / ${estimate.avgDays}d`, sub: `${estimate.pct}% complete`, color: estimate.pct >= 100 ? '#34D399' : '#c8922a' },
                  ].map(col => (
                    <div key={col.label}>
                      <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 9, color: '#555', marginBottom: 6, letterSpacing: '.12em' }}>{col.label}</div>
                      <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.6rem', color: col.color, lineHeight: 1 }}>{col.val}</div>
                      {col.sub && <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 10, color: '#666', marginTop: 4 }}>{col.sub}</div>}
                    </div>
                  ))}
                </div>
                <div style={{ height: 6, background: '#1a1a1a', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${estimate.pct}%`, background: estimate.pct >= 100 ? '#34D399' : '#c8922a', transition: 'width .6s' }} />
                </div>
                {estimate.pct >= 100 && (
                  <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#34D399', marginTop: 12 }}>
                    ✓ Past average window — check eforms.atf.gov for your status
                  </div>
                )}
              </div>
            )}
          </div>

          {/* QUICK FACTS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 12, marginBottom: 40 }}>
            {[
              { icon: '⚡', title: 'eForms = Fastest', desc: 'eFile Form 4 is 10–50× faster than paper. Always use eForms if given a choice.', color: '#34D399' },
              { icon: '🏦', title: 'Trust vs Individual', desc: 'Individuals with NICS approval can get same-day approvals. Trusts take 2–8 weeks.', color: '#60A5FA' },
              { icon: '📊', title: 'Paper is Dead', desc: '286+ day average for paper Form 4. There is no reason to submit paper in 2026.', color: '#F59E0B' },
              { icon: '🔍', title: 'Check Status', desc: 'Log in at eforms.atf.gov · "Pending Research" ≠ denied · Call (304) 616-4500', color: '#A78BFA' },
            ].map(f => (
              <div key={f.title} style={{ background: '#0f0f0f', border: '1px solid #1a1a1a', padding: 20 }}>
                <div style={{ fontSize: 24, marginBottom: 10 }}>{f.icon}</div>
                <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontSize: 15, fontWeight: 700, color: f.color, marginBottom: 8, letterSpacing: '.03em' }}>{f.title}</div>
                <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#aaa', lineHeight: 1.8 }}>{f.desc}</div>
              </div>
            ))}
          </div>

          {/* HOW TO CHECK STATUS */}
          <div style={{ background: '#0a0a0a', border: '1px solid #1a1a1a', padding: '32px 28px', marginBottom: 40 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
              <h3 style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '1.5rem', color: '#fff', margin: 0, letterSpacing: '.05em' }}>
                CHECK YOUR APPLICATION STATUS
              </h3>
              <div style={{ flex: 1, height: 1, background: '#1a1a1a' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(240px,1fr))', gap: 20 }}>
              {[
                { step: '01', title: 'eForms Portal', desc: 'Log in at eforms.atf.gov · Status: Submitted → In Process → Pending Research → Approved', color: '#60A5FA', href: 'https://eforms.atf.gov' },
                { step: '02', title: 'NFA Branch Phone', desc: 'Call (304) 616-4500 · Have your case number ready · Mon–Fri 8am–5pm EST', color: '#34D399', href: 'tel:+13046164500' },
                { step: '03', title: 'Pending Research', desc: '"Pending Research" means additional review — not denied. Follow up after 90 days.', color: '#F59E0B', href: null },
              ].map(s => (
                <div key={s.step} style={{ display: 'flex', gap: 16 }}>
                  <div style={{ fontFamily: "'Bebas Neue',cursive", fontSize: '2rem', color: s.color, flexShrink: 0, lineHeight: 1, opacity: .5 }}>{s.step}</div>
                  <div>
                    {s.href
                      ? <a href={s.href} target="_blank" rel="noreferrer" style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: s.color, textDecoration: 'none', display: 'block', marginBottom: 6, letterSpacing: '.03em' }}>{s.title} ↗</a>
                      : <div style={{ fontFamily: "'Barlow Condensed',sans-serif", fontWeight: 700, fontSize: 15, color: s.color, marginBottom: 6, letterSpacing: '.03em' }}>{s.title}</div>
                    }
                    <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 12, color: '#aaa', lineHeight: 1.8 }}>{s.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DATA SOURCES FOOTER */}
          <div style={{ fontFamily: "'IBM Plex Mono',monospace", fontSize: 11, color: '#666', lineHeight: 2, borderTop: '1px solid #222', paddingTop: 20 }}>
            <strong style={{ color: '#999', letterSpacing: '.08em' }}>DATA SOURCES:</strong>{' '}
            <a href="https://www.atf.gov/resource-center/current-processing-times" target="_blank" rel="noreferrer" style={{ color: '#888', textDecoration: 'none' }}>ATF.gov official processing times</a> ·{' '}
            <a href="https://www.silencershop.com/atf-wait-times" target="_blank" rel="noreferrer" style={{ color: '#888', textDecoration: 'none' }}>Silencer Shop tracker</a> ·{' '}
            Silencer Central community data · Updated Mon + Thu 6am UTC · Individual results vary.
          </div>

        </div>
      </div>
      <Footer />
    </>
  )
}
