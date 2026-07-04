import { ImageResponse } from 'next/og'
import { getArticleBySlug } from '../../../sanity/lib/client'

export const runtime = 'edge'
export const alt = 'DownRange News'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

const CAT_COLOR = {
  breaking: '#EF4444',
  law:      '#60A5FA',
  industry: '#C8922A',
  news:     '#9CA3AF',
  opinion:  '#C084FC',
  training: '#34D399',
  review:   '#C8922A',
}

export default async function Image({ params }) {
  let title   = 'DownRange — America\'s Firearms Intelligence Hub'
  let category = 'NEWS'
  let summary = 'Breaking 2A news, gun laws, releases, and intelligence.'
  let accentColor = '#C8922A'

  try {
    const article = await getArticleBySlug(params.slug).catch(() => null)
    if (article) {
      title       = article.title || title
      category    = (article.category || 'news').toUpperCase()
      summary     = (article.summary || article.excerpt || '').slice(0, 120)
      accentColor = CAT_COLOR[article.category] || '#C8922A'
    }
  } catch {}

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          background: '#09090B',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '60px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        {/* Gold top border */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: accentColor, display: 'flex' }} />

        {/* Category badge */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              background: accentColor + '20',
              border: `1px solid ${accentColor}60`,
              color: accentColor,
              fontSize: '14px',
              fontWeight: 700,
              padding: '6px 16px',
              letterSpacing: '0.15em',
              display: 'flex',
            }}
          >
            {category}
          </div>
          <div style={{ color: '#374151', fontSize: '13px', letterSpacing: '0.08em', display: 'flex' }}>
            DOWNRANGECO.COM
          </div>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: title.length > 60 ? '42px' : '52px',
            fontWeight: 900,
            color: '#F0EDE6',
            lineHeight: 1.1,
            letterSpacing: '0.01em',
            maxWidth: '1000px',
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {title}
        </div>

        {/* Summary + footer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {summary && (
            <div
              style={{
                fontSize: '18px',
                color: '#6B7280',
                lineHeight: 1.5,
                maxWidth: '900px',
                display: 'flex',
                flexWrap: 'wrap',
              }}
            >
              {summary}
            </div>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
            <div
              style={{
                fontSize: '28px',
                fontWeight: 900,
                color: '#C8922A',
                letterSpacing: '6px',
                display: 'flex',
              }}
            >
              DOWNRANGE
            </div>
            <div
              style={{
                width: '1px',
                height: '24px',
                background: '#1F2428',
                display: 'flex',
              }}
            />
            <div
              style={{
                fontSize: '13px',
                color: '#374151',
                letterSpacing: '0.1em',
                display: 'flex',
              }}
            >
              AMERICA&apos;S FIREARMS INTELLIGENCE HUB
            </div>
          </div>
        </div>

        {/* Bottom border */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', background: '#1F2428', display: 'flex' }} />
      </div>
    ),
    { ...size }
  )
}
