import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'DownRange Gun Giveaways'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    <div style={{
      background: '#09090B',
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      justifyContent: 'center',
      padding: '60px 80px',
    }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 20% 50%, rgba(200,146,42,0.15) 0%, transparent 60%)' }} />
      <div style={{ fontFamily: 'sans-serif', fontSize: 18, fontWeight: 700, letterSpacing: '0.3em', color: '#C8922A', marginBottom: 20, textTransform: 'uppercase' }}>DOWNRANGE.CO</div>
      <div style={{ fontFamily: 'sans-serif', fontSize: 80, fontWeight: 900, color: '#F0EDE6', lineHeight: 1, marginBottom: 16, letterSpacing: '-0.02em' }}>GUN GIVEAWAYS</div>
      <div style={{ fontFamily: 'sans-serif', fontSize: 28, color: '#C8922A', fontWeight: 700, letterSpacing: '0.1em', marginBottom: 32 }}>WIN FREE FIREARMS & GEAR</div>
      <div style={{ fontFamily: 'sans-serif', fontSize: 18, color: '#6B7280' }}>Active giveaways from top manufacturers & 2A organizations. Updated daily.</div>
      <div style={{ position: 'absolute', bottom: 40, right: 80, fontFamily: 'sans-serif', fontSize: 14, color: '#374151', letterSpacing: '0.1em' }}>downrangeco.com/giveaways</div>
    </div>,
    { ...size }
  )
}
