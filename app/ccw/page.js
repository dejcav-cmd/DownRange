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

  const ccCount      = profiles.filter(p => p.constitutionalCarry).length
  const permitStates = profiles.filter(p => !p.constitutionalCarry).length

  return (
    <>
      <BreakingTicker alerts={alerts} />
      <Masthead />

      {/* Hero */}
      <div className="page-hero" data-title="CCW RECIPROCITY">
        <div className="container">
          <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
            <span style={{ background:'var(--gold)', color:'#09090B', fontFamily:"'Barlow Condensed',sans-serif", fontSize:11, fontWeight:700, letterSpacing:'.1em', padding:'4px 10px' }}>CCW</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#6b7280', padding:'4px 10px', border:'1px solid var(--border)' }}>Updated 2026</span>
          </div>
          <h1 className="page-hero-title">CCW Reciprocity Map</h1>
          <p className="page-hero-sub">
            Click any state to see where your permit is honored — and what permits your state accepts.
            {ccCount > 0 && <> <strong style={{color:'var(--gold)'}}>{ccCount} states</strong> have constitutional carry.</>}
          </p>
          <div style={{ display:'flex', gap:16, marginTop:16, flexWrap:'wrap' }}>
            {[
              { num: ccCount, label:'Constitutional Carry', color:'#22c55e' },
              { num: 50-ccCount, label:'Permit Required', color:'#9ca3af' },
              { num: profiles.filter(p=>p.redFlagLaw).length, label:'Red Flag Laws', color:'#ef4444' },
            ].map(s => (
              <div key={s.label} style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:s.color, lineHeight:1 }}>{s.num}</span>
                <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:9, color:'#6b7280', lineHeight:1.4 }}>{s.label.replace(' ','
')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Map + Info */}
      <div style={{ padding:'40px 0' }}>
        <div className="container">

          {/* How to use */}
          <div style={{ marginBottom:24, padding:'14px 18px', background:'rgba(200,146,42,.05)', border:'1px solid rgba(200,146,42,.2)', fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#9ca3af', lineHeight:1.8 }}>
            <strong style={{color:'#C8922A'}}>How to use:</strong> Click your home state on the map.
            Switch between <strong style={{color:'#fff'}}>"Where YOUR permit works"</strong> (green = honored) and
            <strong style={{color:'#fff'}}> "What this state accepts"</strong> modes.
            Click state abbreviation badges in the detail panel to explore reciprocity chains.
            <strong style={{color:'#ef4444'}}> Always verify current laws before carrying — this map is for reference only.</strong>
          </div>

          <CcwMap profiles={profiles} />

          {/* State-by-state table */}
          <div style={{ marginTop:48 }}>
            <h2 style={{ fontFamily:"'Bebas Neue',cursive", fontSize:'1.8rem', color:'var(--text)', letterSpacing:'.04em', marginBottom:4 }}>All States At a Glance</h2>
            <p style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, color:'#6b7280', marginBottom:20 }}>Sorted by number of states that honor the permit. Click any row for full state details.</p>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:"'IBM Plex Mono',monospace", fontSize:11 }}>
                <thead>
                  <tr style={{ borderBottom:'2px solid var(--border)' }}>
                    {['State','Type','Min Age','Const. Carry','Honored In','Honors','Notes'].map(h => (
                      <th key={h} style={{ padding:'8px 12px', textAlign:'left', color:'#C8922A', fontSize:9, letterSpacing:'.08em', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(require('./ccw-data').CCW_DATA || {}).length === 0
                    ? null
                    : null}
                  {/* Table rows rendered client-side from CCW_DATA — see component */}
                  {profiles.sort((a,b) => (b.reciprocityStates?.length||0)-(a.reciprocityStates?.length||0)).map((p,i) => (
                    <tr key={p._id} style={{ borderBottom:'1px solid var(--border)', background: i%2===0?'transparent':'rgba(255,255,255,.01)' }}>
                      <td style={{ padding:'8px 12px' }}>
                        <a href={'/state-hub/'+p.abbr?.toLowerCase()} style={{ color:'var(--text)', textDecoration:'none', fontWeight:600 }}>{p.name}</a>
                      </td>
                      <td style={{ padding:'8px 12px', color:'#6b7280', fontSize:10 }}>{p.constitutionalCarry ? 'Permitless' : 'Permit'}</td>
                      <td style={{ padding:'8px 12px', color:'#9ca3af' }}>21</td>
                      <td style={{ padding:'8px 12px', color: p.constitutionalCarry?'#22c55e':'#ef4444' }}>{p.constitutionalCarry?'Yes':'No'}</td>
                      <td style={{ padding:'8px 12px', color:'#22c55e', fontWeight:700 }}>{p.reciprocityStates?.length||0}</td>
                      <td style={{ padding:'8px 12px', color:'#3b82f6' }}>{p.reciprocityStates?.length||0}</td>
                      <td style={{ padding:'8px 12px', color:'#6b7280', fontSize:10, maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.summary?.slice(0,60)||'—'}</td>
                    </tr>
                  ))}
                  {profiles.length === 0 && (
                    <tr><td colSpan={7} style={{ padding:40, textAlign:'center', color:'#6b7280' }}>State data loading...</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Disclaimer */}
          <div style={{ marginTop:40, padding:'20px 24px', background:'rgba(239,68,68,.05)', border:'1px solid rgba(239,68,68,.2)', fontFamily:"'IBM Plex Mono',monospace", fontSize:10, color:'#9ca3af', lineHeight:1.8 }}>
            <strong style={{color:'#ef4444'}}>LEGAL DISCLAIMER:</strong> This reciprocity map is for informational purposes only and may not reflect the most current laws.
            Concealed carry laws change frequently. Always verify current reciprocity with official state sources before carrying.
            DownRange is not responsible for errors or outdated information. When in doubt, consult an attorney licensed in the relevant state.
          </div>
        </div>
      </div>

      <Footer />
    </>
  )
}
