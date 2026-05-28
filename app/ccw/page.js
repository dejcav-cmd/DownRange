import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import CcwMap from '../../components/sections/CcwMap'
import { fetchAllStateProfiles, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'CCW Reciprocity Map — DownRange',
  description: 'Interactive map showing concealed carry permit reciprocity across all 50 states. Click any state to see where your permit works.',
}
export const revalidate = 3600

export default async function CcwPage() {
  const [profiles, alerts] = await Promise.all([
    fetchAllStateProfiles().catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const ccCount = profiles.filter(p => p.constitutionalCarry).length

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* Hero */}
      <div className="page-hero" data-title="CCW RECIPROCITY">
        <div className="container">
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:\"'Barlow Condensed',sans-serif\", fontSize:11, fontWeight:700, letterSpacing:'.1em', padding:'4px 10px' }}>CCW</span>
            <span style={{ fontFamily:\"'IBM Plex Mono',monospace\", fontSize:11, color:'#6b7280', padding:'4px 10px', border:'1px solid var(--border)' }}>Updated 2026</span>
          </div>
          <h1 className="page-hero-title">CCW Reciprocity Map</h1>
          <p className="page-hero-sub">
            Click any state to see where your permit is honored and what permits your state accepts.
          </p>
          <div style={{ display:'flex', gap:24, marginTop:16, flexWrap:'wrap' }}>
            {[
              { num: ccCount || 29, label:'Constitutional Carry', color:'#22c55e' },
              { num: 50-(ccCount||29), label:'Permit Required', color:'#9ca3af' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:\"'Bebas Neue',cursive\", fontSize:'2rem', color:s.color, lineHeight:1 }}>{s.num}</span>
                <span style={{ fontFamily:\"'IBM Plex Mono',monospace\", fontSize:9, color:'#6b7280' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map */}
      <div style={{ padding:'40px 0' }}>
        <div className="container">
          <div style={{ marginBottom:20, padding:'12px 16px', background:'rgba(200,146,42,.05)', border:'1px solid rgba(200,146,42,.2)', fontFamily:\"'IBM Plex Mono',monospace\", fontSize:11, color:'#9ca3af', lineHeight:1.8 }}>
            <strong style={{color:'#C8922A'}}>How to use:</strong> Click your home state.
            Toggle between <strong style={{color:'#fff'}}>"Where YOUR permit works"</strong> and <strong style={{color:'#fff'}}>"What this state accepts"</strong>.
            Green states = reciprocity honored. Click state badges in the panel to explore chains.{' '}
            <strong style={{color:'#ef4444'}}>Always verify with official state sources before carrying.</strong>
          </div>

          <CcwMap profiles={profiles} />

          {/* Sanity-driven table */}
          {profiles.length > 0 && (
            <div style={{ marginTop:48 }}>
              <h2 style={{ fontFamily:\"'Bebas Neue',cursive\", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:4 }}>All States — Quick Reference</h2>
              <p style={{ fontFamily:\"'IBM Plex Mono',monospace\", fontSize:11, color:'#6b7280', marginBottom:20 }}>Sorted alphabetically. Click state name for full gun law profile.</p>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:\"'IBM Plex Mono',monospace\", fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid var(--border)' }}>
                      {['State','Const. Carry','Red Flag','Mag Limit','AWB','Reciprocity (states)'].map(h => (
                        <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#C8922A', fontSize:9, letterSpacing:'.08em', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.sort((a,b) => (a.name||'').localeCompare(b.name||'')).map((p,i) => (
                      <tr key={p._id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'transparent':'rgba(255,255,255,.015)' }}>
                        <td style={{ padding:'8px 12px' }}>
                          <a href={'/state-hub/'+p.abbr?.toLowerCase()} style={{ color:'var(--text)', textDecoration:'none', fontWeight:600 }}>
                            <span style={{color:'#C8922A',marginRight:6}}>{p.abbr}</span>{p.name}
                          </a>
                        </td>
                        <td style={{ padding:'8px 12px', color: p.constitutionalCarry?'#22c55e':'#ef4444' }}>{p.constitutionalCarry?'Yes':'No'}</td>
                        <td style={{ padding:'8px 12px', color: p.redFlagLaw?'#fca5a5':'#22c55e' }}>{p.redFlagLaw?'Yes':'No'}</td>
                        <td style={{ padding:'8px 12px', color: p.magLimit?'#fca5a5':'#22c55e' }}>{p.magLimit||'None'}</td>
                        <td style={{ padding:'8px 12px', color: p.awbStatus&&p.awbStatus!=='none'?'#fca5a5':'#22c55e' }}>{p.awbStatus==='none'||!p.awbStatus?'No':'Yes'}</td>
                        <td style={{ padding:'8px 12px', color:'#22c55e', fontWeight:700 }}>{p.reciprocityStates?.length||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop:32, padding:'16px 20px', background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.2)', fontFamily:\"'IBM Plex Mono',monospace\", fontSize:10, color:'#9ca3af', lineHeight:1.8 }}>
            <strong style={{color:'#ef4444'}}>LEGAL DISCLAIMER:</strong> This map is for informational purposes only. Concealed carry laws change frequently.
            Always verify current reciprocity with official state sources. DownRange is not responsible for errors or outdated information.
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
