import { fetchBreakingAlerts } from '../../../sanity/lib/client'
import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'
import Link from 'next/link'
import { GUN_DATA } from '../../../lib/gunData'
import JsonLd, { breadcrumb, collectionPage } from '../../../components/seo/JsonLd'

export const revalidate = 86400

// Comprehensive static gun database — no API call on every render
export async function generateStaticParams() {
  return Object.keys(GUN_DATA).map(m => ({ model: m }))
}

export async function generateMetadata({ params }) {
  const g = GUN_DATA[params.model]
  if (!g) return { title: 'Firearm Encyclopedia — DownRange' }
  return {
    title: `${g.name} — Specs, History & Variants`,
    description: `Complete specs, variants, and review of the ${g.name}. History, pros/cons, buying guide.`,
    alternates: { canonical: `https://www.downrangeco.com/guns/${params.model}` },
    openGraph: { title: g.name, description: g.summary?.slice(0, 200), images: g.image ? [{ url: g.image }] : [] }
  }
}

export default async function GunPage({ params }) {
  const g = GUN_DATA[params.model]
  if (!g) notFound()

  const RELATED = Object.entries(GUN_DATA)
    .filter(([k]) => k !== params.model && GUN_DATA[k].type === g.type)
    .slice(0, 4)

  const alerts = await fetchBreakingAlerts(5).catch(() => [])

  return (
    <>
      <JsonLd data={[
        { '@context': 'https://schema.org', '@type': 'WebPage', name: `${g.name} — Specs, History & Variants`,
          url: `https://www.downrangeco.com/guns/${params.model}`, description: g.summary?.slice(0, 300),
          about: { '@type': 'Thing', name: g.name }, isPartOf: { '@type': 'WebSite', name: 'DownRange', url: 'https://www.downrangeco.com' } },
        breadcrumb([{ name: 'Guns', path: '/guns' }, { name: g.name, path: `/guns/${params.model}` }]),
      ]} />

      <Masthead />
      <div style={{ width:'100%', height:'clamp(280px, 40vw, 460px)', overflow:'hidden', position:'relative' }}>
        <img src={g.image} alt={g.name} style={{ width:'100%', height:'100%', objectFit:'cover', opacity:0.5 }} />
        <div style={{ position:'absolute', inset:0, background:'linear-gradient(0deg, #0A0B0C 10%, transparent 70%)' }} />
        <div className="container" style={{ position:'absolute', bottom:'28px', left:'50%', transform:'translateX(-50%)', width:'100%' }}>
          <div style={{ display:'flex', gap:'8px', marginBottom:'8px' }}>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', background:'#1A0E00', border:'1px solid #C8922A40', padding:'3px 10px' }}>{g.type?.toUpperCase()}</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', background:'#111318', border:'1px solid var(--border)', padding:'3px 10px' }}>{g.caliber}</span>
            <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', background:'#111318', border:'1px solid var(--border)', padding:'3px 10px' }}>{g.country}</span>
          </div>
          <h1 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'clamp(2.5rem,7vw,5rem)', color:'#F5F5F3', letterSpacing:'0.02em', lineHeight:1, marginBottom:'6px' }}>{g.name}</h1>
          <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#6B7280' }}>{g.manufacturer} · Est. {g.introduced} · MSRP {g.msrp}</div>
        </div>
      </div>

      <div style={{ padding:'40px 0', background:'var(--bg)' }}>
        <div className="container">
          <div style={{ display:'grid', gridTemplateColumns:'1fr 300px', gap:'48px' }}>

            {/* Main content */}
            <div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'10px', marginBottom:'32px' }}>
                {[['Capacity',g.capacity],['Barrel',g.barrel],['Weight',g.weight],['MSRP',g.msrp]].map(([k,v])=>(
                  <div key={k} style={{ background:'#111318', border:'1px solid var(--border)', padding:'14px', textAlign:'center' }}>
                    <div style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.1rem', color:'#C8922A', lineHeight:1.2 }}>{v}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#4B5563', marginTop:'4px' }}>{k.toUpperCase()}</div>
                  </div>
                ))}
              </div>

              <p style={{ fontSize:'15px', lineHeight:1.85, color:'#94A3B8', marginBottom:'20px', borderLeft:'3px solid #C8922A', paddingLeft:'16px' }}>{g.summary}</p>
              <p style={{ fontSize:'15px', lineHeight:1.85, color:'#94A3B8', marginBottom:'32px' }}>{g.summary2}</p>

              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px', marginBottom:'32px' }}>
                <div style={{ background:'#001A0A', border:'1px solid #16603440', padding:'18px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#34D399', letterSpacing:'0.15em', marginBottom:'12px', fontWeight:700 }}>✓ STRENGTHS</div>
                  {g.pros.map((p,i)=><div key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#86EFAC', marginBottom:'6px', paddingLeft:'8px' }}>{p}</div>)}
                </div>
                <div style={{ background:'#1A0000', border:'1px solid #7F1D1D40', padding:'18px' }}>
                  <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#EF4444', letterSpacing:'0.15em', marginBottom:'12px', fontWeight:700 }}>✗ WEAKNESSES</div>
                  {g.cons.map((c,i)=><div key={i} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'12px', color:'#FCA5A5', marginBottom:'6px', paddingLeft:'8px' }}>{c}</div>)}
                </div>
              </div>

              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'14px' }}>VARIANTS</h2>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'32px' }}>
                {g.variants.map(v=>(
                  <span key={v} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#D1D5DB', background:'#111318', border:'1px solid var(--border)', padding:'5px 12px' }}>{v}</span>
                ))}
              </div>

              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'14px' }}>COMMON USES</h2>
              <div style={{ display:'flex', flexWrap:'wrap', gap:'8px', marginBottom:'32px' }}>
                {g.uses.map(u=>(
                  <span key={u} style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'11px', color:'#34D399', background:'#001A0A', border:'1px solid #16603440', padding:'5px 12px' }}>{u}</span>
                ))}
              </div>

              {g.url && (
                <a href={g.url} target="_blank" rel="noreferrer"
                  style={{ display:'inline-flex', alignItems:'center', gap:'8px', background:'#C8922A', color:'#000', padding:'12px 24px', fontFamily:"'IBM Plex Mono',monospace", fontWeight:700, fontSize:'12px', textDecoration:'none', letterSpacing:'0.05em' }}>
                  VIEW MANUFACTURER SPECS ↗
                </a>
              )}
            </div>

            {/* Sidebar */}
            <aside>
              <div style={{ background:'#111318', border:'1px solid var(--border)', padding:'20px', marginBottom:'16px', position:'sticky', top:'80px' }}>
                <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#C8922A', letterSpacing:'0.12em', marginBottom:'16px', fontWeight:700 }}>SPECIFICATIONS</div>
                {[
                  ['Manufacturer', g.manufacturer],
                  ['Country', g.country],
                  ['Type', g.type],
                  ['Caliber', g.caliber],
                  ['Action', g.action],
                  ['Capacity', g.capacity],
                  ['Barrel Length', g.barrel],
                  ['Overall Length', g.length],
                  ['Width', g.width],
                  ['Height', g.height],
                  ['Weight', g.weight],
                  ['Introduced', g.introduced],
                  ['MSRP', g.msrp],
                  ...(g.specs || []),
                ].filter(([,v])=>v).map(([k,v])=>(
                  <div key={k} style={{ display:'flex', justifyContent:'space-between', padding:'7px 0', borderBottom:'1px solid var(--border)', gap:'8px' }}>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', flexShrink:0 }}>{k}</span>
                    <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#D1D5DB', textAlign:'right' }}>{v}</span>
                  </div>
                ))}
              </div>
            </aside>
          </div>

          {/* Related guns */}
          {RELATED.length > 0 && (
            <div style={{ marginTop:'48px' }}>
              <h2 style={{ fontFamily:"'Bebas Neue', sans-serif", fontSize:'1.4rem', color:'#C8922A', letterSpacing:'0.05em', marginBottom:'16px' }}>
                MORE {g.type?.toUpperCase()}S
              </h2>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:'12px' }}>
                {RELATED.map(([k,r])=>(
                  <Link key={k} href={`/guns/${k}`} style={{ background:'#111318', border:'1px solid var(--border)', padding:'16px', textDecoration:'none', display:'block' }}>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'9px', color:'#C8922A', marginBottom:'4px' }}>{r.type} · {r.caliber}</div>
                    <div style={{ fontSize:'14px', fontWeight:600, color:'#F0EDE6', lineHeight:1.3 }}>{r.name}</div>
                    <div style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:'10px', color:'#4B5563', marginTop:'4px' }}>{r.msrp}</div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
