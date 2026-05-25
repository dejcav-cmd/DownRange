'use client'
import dynamic from 'next/dynamic'

// Load Sanity Studio only on the client — never bundle at build time
const Studio = dynamic(
  () => import('./StudioComponent'),
  {
    ssr: false,
    loading: () => (
      <div style={{
        background: '#0A0B0C', minHeight: '100vh',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: '#C8922A', fontFamily: 'monospace', fontSize: '14px', letterSpacing: '0.1em'
      }}>
        LOADING STUDIO...
      </div>
    )
  }
)

export default function StudioPage() {
  return <Studio />
}
