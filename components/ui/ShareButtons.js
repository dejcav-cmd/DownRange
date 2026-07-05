'use client'

export default function ShareButtons({ title, slug }) {
  const pageUrl = `https://www.downrangeco.com/news/${slug}`

  const buttons = [
    {
      label: 'X / TWITTER',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(pageUrl)}`,
    },
    {
      label: 'FACEBOOK',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`,
    },
  ]

  return (
    <>
      {buttons.map(s => (
        <a
          key={s.label}
          href={s.href}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => {
            if (typeof window !== 'undefined' && window.gtag) {
              window.gtag('event', 'article_share', {
                method: s.label.toLowerCase().replace(' / ', '_'),
                content_id: slug,
              })
            }
          }}
          style={{
            color: '#4B5563',
            textDecoration: 'none',
            fontFamily: "'IBM Plex Mono',monospace",
            fontSize: '0.68rem',
            padding: '4px 8px',
            border: '1px solid var(--border)',
            transition: 'color 0.2s, border-color 0.2s',
          }}
        >
          {s.label}
        </a>
      ))}
    </>
  )
}
