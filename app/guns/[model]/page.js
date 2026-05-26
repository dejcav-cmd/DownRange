export async function generateStaticParams() {
  return ['glock-17','glock-43x','ar-15','ak-47','sig-p320','sig-p365','ruger-10-22','mossberg-500','remington-870','smith-wesson-mp9'].map(m=>({model:m}))
}

import { notFound } from 'next/navigation'
import Masthead from '../../../components/layout/Masthead'
import Footer from '../../../components/layout/Footer'

export const revalidate = 86400

async function generateFirearmContent(model) {
  const slug = model.replace(/-/g, ' ')
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: `Generate a firearms encyclopedia entry for: ${slug}

Return ONLY valid JSON with these fields:
{
  "name": "official product name",
  "manufacturer": "company name",
  "type": "Pistol/Rifle/Shotgun/etc",
  "caliber": "primary caliber(s)",
  "action": "action type",
  "capacity": "standard magazine capacity",
  "barrel": "barrel length",
  "weight": "unloaded weight",
  "overall_length": "overall length",
  "msrp": "approximate MSRP range",
  "introduced": "year introduced",
  "summary": "2-paragraph overview of the firearm, its history, and significance",
  "variants": ["list of 3-5 notable variants"],
  "common_uses": ["home defense", "competition", "hunting", etc],
  "pros": ["3-4 genuine strengths"],
  "cons": ["2-3 genuine weaknesses"]
}`
        }]
      })
    })
    const data = await res.json()
    const text = data.content?.[0]?.text || '{}'
    return JSON.parse(text.replace(/```json|```/g, '').trim())
  } catch { return null }
}

export default async function GunPage({ params }) {
  const { model } = params
  const info = await generateFirearmContent(model)
  if (!info?.name) notFound()

  const specs = [
    { label: 'Manufacturer',   value: info.manufacturer },
    { label: 'Type',           value: info.type },
    { label: 'Caliber',        value: info.caliber },
    { label: 'Action',         value: info.action },
    { label: 'Capacity',       value: info.capacity },
    { label: 'Barrel Length',  value: info.barrel },
    { label: 'Weight',         value: info.weight },
    { label: 'Overall Length', value: info.overall_length },
    { label: 'Introduced',     value: info.introduced },
    { label: 'MSRP',           value: info.msrp },
  ].filter(s => s.value)

  return (
    <>
      <Masthead />
      <div style={{ background: '#111318', borderBottom: '1px solid #1F2428', padding: '40px 0' }}>
        <div className="container" style={{ maxWidth: 900 }}>
          <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4B5563', marginBottom: '12px' }}>
            <a href="/guns" style={{ color: '#4B5563', textDecoration: 'none' }}>ENCYCLOPEDIA</a> › {info.type?.toUpperCase()}
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(2.5rem, 5vw, 4rem)', color: '#F5F5F3', letterSpacing: '0.03em', marginBottom: '8px' }}>{info.name}</h1>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {[info.type, info.caliber, info.manufacturer].filter(Boolean).map(t => (
              <span key={t} style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', background: '#1A0E00', padding: '3px 10px', border: '1px solid #C8922A30' }}>{t}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px', display: 'grid', gridTemplateColumns: '1fr 280px', gap: '40px' }}>
        <div>
          {info.summary && <div style={{ fontSize: '1.05rem', lineHeight: 1.8, color: '#D1D5DB', marginBottom: '32px', whiteSpace: 'pre-wrap' }}>{info.summary}</div>}

          {info.variants?.length > 0 && (
            <div style={{ marginBottom: '28px' }}>
              <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '1.4rem', color: '#C8922A', letterSpacing: '0.05em', marginBottom: '12px' }}>VARIANTS</h2>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {info.variants.map(v => <li key={v} style={{ fontFamily: 'monospace', fontSize: '13px', color: '#9CA3AF', paddingLeft: '16px', borderLeft: '2px solid #C8922A' }}>{v}</li>)}
              </ul>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            {info.pros?.length > 0 && (
              <div>
                <h3 style={{ fontFamily: 'monospace', fontSize: '11px', color: '#34D399', letterSpacing: '0.12em', marginBottom: '10px' }}>STRENGTHS</h3>
                {info.pros.map(p => <div key={p} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#9CA3AF', marginBottom: '6px' }}>✓ {p}</div>)}
              </div>
            )}
            {info.cons?.length > 0 && (
              <div>
                <h3 style={{ fontFamily: 'monospace', fontSize: '11px', color: '#EF4444', letterSpacing: '0.12em', marginBottom: '10px' }}>WEAKNESSES</h3>
                {info.cons.map(p => <div key={p} style={{ fontFamily: 'monospace', fontSize: '12px', color: '#9CA3AF', marginBottom: '6px' }}>✗ {p}</div>)}
              </div>
            )}
          </div>
        </div>

        <div>
          <div style={{ background: '#111318', border: '1px solid #1F2428', padding: '20px' }}>
            <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '16px' }}>SPECS</div>
            {specs.map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #1F2428' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#4B5563' }}>{s.label}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#D1D5DB', textAlign: 'right', maxWidth: '55%' }}>{s.value}</span>
              </div>
            ))}
          </div>
          {info.common_uses?.length > 0 && (
            <div style={{ background: '#111318', border: '1px solid #1F2428', padding: '20px', marginTop: '12px' }}>
              <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#C8922A', letterSpacing: '0.15em', marginBottom: '12px' }}>COMMON USES</div>
              {info.common_uses.map(u => (
                <span key={u} style={{ display: 'inline-block', background: '#1F2428', color: '#9CA3AF', fontFamily: 'monospace', fontSize: '10px', padding: '3px 8px', marginRight: '6px', marginBottom: '6px' }}>{u}</span>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  )
}
