import Masthead from '../../components/layout/Masthead'
import BreakingTicker from '../../components/layout/BreakingTicker'
import Footer from '../../components/layout/Footer'
import CcwMapReal from '../../components/sections/CcwMapReal'
import { fetchAllStateProfiles, fetchBreakingAlerts } from '../../sanity/lib/client'

export const metadata = {
  title: 'CCW Reciprocity Map — DownRange',
  description: 'Interactive US map showing concealed carry permit reciprocity for all 50 states. Select any state to see where your permit is honored.',
}
export const revalidate = 604800

const mono  = "'IBM Plex Mono',monospace"
const bebas = "'Bebas Neue',cursive"
const barlow= "'Barlow Condensed',sans-serif"

export default async function CcwPage() {
  const [profiles, alerts] = await Promise.all([
    fetchAllStateProfiles().catch(() => []),
    fetchBreakingAlerts(5).catch(() => []),
  ])

  const ccCount = profiles.filter(p => p.constitutionalCarry).length || 29

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      <div className="page-hero" data-title="CCW RECIPROCITY">
        <div className="container">
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap', alignItems:'center' }}>
            <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:barlow, fontSize:11, fontWeight:700, letterSpacing:'.1em', padding:'4px 10px' }}>CCW</span>
            <span style={{ fontFamily:mono, fontSize:11, color:'#6b7280', padding:'4px 10px', border:'1px solid var(--border)' }}>Updated Weekly</span>
          </div>
          <h1 className="page-hero-title">CCW Reciprocity Map</h1>
          <p className="page-hero-sub">
            Select your home state to see where your permit is honored across all 50 states.
          </p>
          <div style={{ display:'flex', gap:24, marginTop:16, flexWrap:'wrap' }}>
            {[
              { num: ccCount,      label:'Constitutional Carry', color:'#3b82f6' },
              { num: 50-ccCount,   label:'Permit Required',       color:'#9ca3af' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:bebas, fontSize:'2rem', color:s.color, lineHeight:1 }}>{s.num}</span>
                <span style={{ fontFamily:mono, fontSize:9, color:'#6b7280' }}>{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ padding:'32px 0' }}>
        <div className="container">
          <div style={{ marginBottom:16, padding:'10px 14px', background:'rgba(200,146,42,.05)', border:'1px solid rgba(200,146,42,.15)', fontFamily:mono, fontSize:11, color:'#9ca3af', lineHeight:1.7 }}>
            <strong style={{color:'#C8922A'}}>How to use:</strong>{' '}
            Select your home state from the dropdown or click it on the map.
            Toggle between <strong style={{color:'#fff'}}>&quot;Where MY permit works&quot;</strong> and{' '}
            <strong style={{color:'#fff'}}>&quot;What this state accepts&quot;</strong>.
            Click any state badge in the detail panel to explore reciprocity chains.{' '}
            <strong style={{color:'#ef4444'}}>Always verify current laws before carrying — laws change.</strong>
          </div>

          <CcwMapReal />

          {profiles.length > 0 && (
            <div style={{ marginTop:40 }}>
              <h2 style={{ fontFamily:bebas, fontSize:'1.6rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:4 }}>All States — Quick Reference</h2>
              <p style={{ fontFamily:mono, fontSize:11, color:'#6b7280', marginBottom:16 }}>Sorted alphabetically. Click state name for full gun law profile.</p>
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:mono, fontSize:11 }}>
                  <thead>
                    <tr style={{ borderBottom:'2px solid var(--border)' }}>
                      {['State','Type','Const. Carry','Red Flag','Mag Limit','AWB','Reciprocity'].map(h => (
                        <th key={h} style={{ padding:'7px 10px', textAlign:'left', color:'#C8922A', fontSize:9, letterSpacing:'.08em', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {profiles.sort((a,b) => (a.name||'').localeCompare(b.name||'')).map((p,i) => (
                      <tr key={p._id} style={{ borderBottom:'1px solid var(--border)', background:i%2===0?'transparent':'rgba(255,255,255,.012)' }}>
                        <td style={{ padding:'7px 10px' }}>
                          <a href={'/state-hub/'+p.abbr?.toLowerCase()} style={{ color:'var(--text)', textDecoration:'none', fontWeight:600 }}>
                            <span style={{color:'#C8922A',marginRight:6}}>{p.abbr}</span>{p.name}
                          </a>
                        </td>
                        <td style={{ padding:'7px 10px', color:'#6b7280', fontSize:9 }}>{p.constitutionalCarry?'Permitless':'Permit'}</td>
                        <td style={{ padding:'7px 10px', color:p.constitutionalCarry?'#22c55e':'#ef4444' }}>{p.constitutionalCarry?'Yes':'No'}</td>
                        <td style={{ padding:'7px 10px', color:p.redFlagLaw?'#fca5a5':'#22c55e' }}>{p.redFlagLaw?'Yes':'No'}</td>
                        <td style={{ padding:'7px 10px', color:p.magLimit?'#fca5a5':'#22c55e' }}>{p.magLimit||'None'}</td>
                        <td style={{ padding:'7px 10px', color:p.awbStatus&&p.awbStatus!=='none'?'#fca5a5':'#22c55e' }}>{p.awbStatus==='none'||!p.awbStatus?'No':'Yes'}</td>
                        <td style={{ padding:'7px 10px', color:'#22c55e', fontWeight:700 }}>{p.reciprocityStates?.length||'—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div style={{ marginTop:24, padding:'14px 18px', background:'rgba(239,68,68,.04)', border:'1px solid rgba(239,68,68,.15)', fontFamily:mono, fontSize:10, color:'#9ca3af', lineHeight:1.8 }}>
            <strong style={{color:'#ef4444'}}>LEGAL DISCLAIMER:</strong> This map is for informational purposes only.
            Concealed carry laws change frequently. Always verify current reciprocity with official state sources before carrying.
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
