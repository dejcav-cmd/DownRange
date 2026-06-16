import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import Link from 'next/link'
import { fetchAllStateProfiles } from '../../../sanity/lib/client'
import { STATE_SEED } from '../../../lib/stateSeed'

export const metadata = {
  title: 'Gun Laws by State — All 50 States | DownRange',
  description: 'Complete gun law comparison for all 50 states: constitutional carry, CCW permits, magazine limits, AWB status, and red flag laws.',
  alternates: { canonical: 'https://downrangeco.com/laws/states' },
}
export const revalidate = 3600

const S = { mono:"'IBM Plex Mono',monospace", bebas:"'Bebas Neue',sans-serif", sans:"'IBM Plex Sans',sans-serif", cond:"'Barlow Condensed',sans-serif" }

export default async function StatesPage() {
  const sanityProfiles = await fetchAllStateProfiles().catch(() => [])
  const profileMap = {}
  for (const p of Object.values(STATE_SEED)) { profileMap[p.abbr] = { ...p } }
  for (const p of sanityProfiles) { if (p?.abbr && profileMap[p.abbr]) { for (const [k,v] of Object.entries(p)) { if (v !== null && v !== undefined) profileMap[p.abbr][k] = v } } }
  const profiles = Object.values(profileMap).sort((a,b) => a.name.localeCompare(b.name))
  const sorted = profiles.sort((a, b) => a.name?.localeCompare(b.name))

  const ccCount = profiles.filter(p => p.constitutionalCarry).length
  const magCount = profiles.filter(p => p.magLimit).length
  const awbCount = profiles.filter(p => p.awbStatus && p.awbStatus !== 'none' && p.awbStatus !== 'None').length
  const rfCount  = profiles.filter(p => p.redFlagLaw).length

  return (
    <>
      <Masthead />

      <div style={{ background:'#0d0d10', borderBottom:'1px solid #1a1a1a', padding:'52px 0 32px' }}>
        <div className="container">
          <div style={{ fontFamily:S.mono, fontSize:10, color:'#4B5563', letterSpacing:'0.15em', marginBottom:8 }}>
            <Link href="/laws" style={{ color:'#4B5563', textDecoration:'none' }}>Laws</Link>
            <span style={{ margin:'0 8px' }}>›</span>
            <span style={{ color:'#C8922A' }}>All States</span>
          </div>
          <h1 style={{ fontFamily:S.bebas, fontSize:'clamp(2.5rem,5vw,4rem)', color:'#fff', lineHeight:0.92, margin:'0 0 20px', letterSpacing:'0.02em' }}>
            Gun Laws<br /><span style={{ color:'#C8922A' }}>All 50 States</span>
          </h1>
          <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
            {[
              [ccCount, 'Constitutional Carry', '#34D399'],
              [50 - ccCount, 'Permit Required', '#6B7280'],
              [magCount, 'Magazine Limits', '#EF4444'],
              [awbCount, 'AWB in Effect', '#EF4444'],
              [rfCount, 'Red Flag Laws', '#FCA5A5'],
            ].map(([n, label, color]) => (
              <div key={label}>
                <div style={{ fontFamily:S.bebas, fontSize:36, color, lineHeight:1 }}>{n}</div>
                <div style={{ fontFamily:S.mono, fontSize:9, color:'#4B5563', letterSpacing:'0.1em', textTransform:'uppercase' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div style={{ padding:'0 0 64px' }}>
        <div className="container">
          <div style={{ overflowX:'auto', marginTop:0 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontFamily:S.mono, fontSize:12 }}>
              <thead>
                <tr style={{ borderBottom:'2px solid #C8922A' }}>
                  {['State','Rating','Const. Carry','Mag Limit','AWB','Wait','Red Flag','Reciprocity'].map(h => (
                    <th key={h} style={{ padding:'12px 14px', textAlign:'left', color:'#C8922A', fontSize:10, letterSpacing:'0.1em', fontWeight:700, whiteSpace:'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((p, i) => {
                  const rColor = p.rating?.startsWith('A') ? '#34D399' : p.rating?.startsWith('B') ? '#60A5FA' : p.rating?.startsWith('C') ? '#FBBF24' : '#EF4444'
                  return (
                    <tr key={p._id} style={{ borderBottom:'1px solid #1a1a1a', background: i%2===0?'#09090B':'#0d0d10' }}>
                      <td style={{ padding:'11px 14px' }}>
                        <Link href={`/laws/${p.abbr?.toLowerCase()}`} style={{ color:'#E5E5E5', textDecoration:'none', fontWeight:600, letterSpacing:'0.03em' }}>{p.name}</Link>
                      </td>
                      <td style={{ padding:'11px 14px', color:rColor, fontWeight:700 }}>{p.rating || '—'}</td>
                      <td style={{ padding:'11px 14px', color:p.constitutionalCarry?'#34D399':'#EF4444' }}>{p.constitutionalCarry?'YES':'NO'}</td>
                      <td style={{ padding:'11px 14px', color:p.magLimit?'#EF4444':'#34D399' }}>{p.magLimit?`${p.magLimit}rd`:'None'}</td>
                      <td style={{ padding:'11px 14px', color:p.awbStatus&&p.awbStatus!=='none'&&p.awbStatus!=='None'?'#EF4444':'#34D399' }}>
                        {p.awbStatus&&p.awbStatus!=='none'&&p.awbStatus!=='None'?p.awbStatus:'None'}
                      </td>
                      <td style={{ padding:'11px 14px', color:p.waitPeriod>0?'#FBBF24':'#34D399' }}>{p.waitPeriod>0?`${p.waitPeriod}d`:'None'}</td>
                      <td style={{ padding:'11px 14px', color:p.redFlagLaw?'#FCA5A5':'#34D399' }}>{p.redFlagLaw?'Yes':'No'}</td>
                      <td style={{ padding:'11px 14px', color:'#6B7280' }}>{p.reciprocityStates?.length||0} states</td>
                    </tr>
                  )
                })}
                {profiles.length===0 && (
                  <tr><td colSpan={8} style={{ padding:40, textAlign:'center', color:'#4B5563' }}>Loading state data…</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
