import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ background: '#0A0B0C', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '24px', padding: '40px' }}>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 'clamp(80px, 20vw, 160px)', color: '#1F2428', lineHeight: 1 }}>404</div>
      <div style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: '2rem', color: '#C8922A', letterSpacing: '0.05em' }}>ARTICLE NOT FOUND</div>
      <p style={{ fontFamily: 'monospace', fontSize: '13px', color: '#4B5563', textAlign: 'center', maxWidth: '400px', lineHeight: 1.7 }}>
        This article may have been removed, or the URL is incorrect. News content updates every 15 minutes.
      </p>
      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link href="/news" style={{ background: '#C8922A', color: '#000', padding: '10px 24px', fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', textDecoration: 'none' }}>
          LATEST NEWS →
        </Link>
        <Link href="/" style={{ background: 'transparent', color: '#9CA3AF', border: '1px solid #1F2428', padding: '10px 24px', fontFamily: 'monospace', fontSize: '13px', textDecoration: 'none' }}>
          HOME
        </Link>
      </div>
    </div>
  )
}
