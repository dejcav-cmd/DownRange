import '../styles/globals.css'
import ClerkWrapper from '../components/ui/ClerkWrapper'
import MobileTabBar from '../components/ui/MobileTabBar'
import { ThemeProvider } from '../components/ui/ThemeProvider'
import Script from 'next/script'
import PageViewTracker from '../components/ui/PageViewTracker'
import GlobalBreakingTicker from '../components/layout/GlobalBreakingTicker'

const GA_ID = 'G-KDGZX3CLEC'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#C8922A',
  viewportFit: 'cover',
}

export const metadata = {
  title: { default: "DownRange — America's Firearms Intelligence Hub", template: '%s | DownRange' },
  description: 'The central source for U.S. firearms news, Second Amendment law, gun reviews, new releases, ammo prices, and state-by-state carry information.',
  metadataBase: new URL('https://downrangeco.com'),
  icons: {
    icon:    [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut:'/favicon.svg',
    apple:   '/apple-touch-icon.png',
  },
  openGraph: {
    type:'website', locale:'en_US', url:'https://downrangeco.com',
    siteName:'DownRange',
    title:"DownRange — America's Firearms Intelligence Hub",
    description:'Live. Loaded. Lawful. Real-time 2A news, gun laws, ammo prices, and new releases.',
    // PNG fallback — SVGs don't render on all social platforms
    images:[{ url:'https://downrangeco.com/og-default.png', width:1200, height:630, alt:"DownRange — America's Firearms Intelligence Hub" }],
  },
  twitter: { card:'summary_large_image', site:'@downrangeco', creator:'@downrangeco' },
  robots: {
    index:true, follow:true,
    googleBot:{ index:true, follow:true, 'max-image-preview':'large', 'max-snippet':-1, 'max-video-preview':-1 },
  },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || '' },
}

// ── Root schema.org — Organization + SiteLinksSearchBox ─────────────────────
const ROOT_SCHEMA = [
  {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    '@id': 'https://downrangeco.com/#organization',
    name: 'DownRange',
    alternateName: 'DownRange Firearms Intelligence',
    url: 'https://downrangeco.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://downrangeco.com/img/logo.png',
      width: 560, height: 162,
    },
    description: "America's central intelligence hub for firearms news, Second Amendment law, ammo prices, and state gun laws.",
    foundingDate: '2026',
    areaServed: 'United States',
    knowsAbout: [
      'Second Amendment', 'Firearms', 'Gun Laws', 'Concealed Carry',
      'National Firearms Act', 'ATF Regulations', 'Ammunition', 'Handguns',
      'Rifles', 'Shotguns', 'Gun Rights', '2A Legislation',
    ],
    sameAs: [
      'https://twitter.com/downrangeco',
      'https://bsky.app/profile/downrangeco.com',
    ],
    publishingPrinciples: 'https://downrangeco.com/about',
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'contact@downrangeco.com',
      contactType: 'editorial',
    },
  },
  {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://downrangeco.com/#website',
    url: 'https://downrangeco.com',
    name: 'DownRange',
    publisher: { '@id': 'https://downrangeco.com/#organization' },
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: 'https://downrangeco.com/search?q={search_term_string}' },
      'query-input': 'required name=search_term_string',
    },
  },
]

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ROOT_SCHEMA) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { page_path: window.location.pathname });
          `}
        </Script>
        <script dangerouslySetInnerHTML={{ __html: '' }} src="https://classic.avantlink.com/affiliate_app_confirm.php?mode=js&application_id=1604521" />
      </head>
      <ClerkWrapper>
      <body>
        <ThemeProvider>
          <GlobalBreakingTicker />
          {children}
          <MobileTabBar />
        </ThemeProvider>
        <PageViewTracker />
      </body>
      </ClerkWrapper>
    </html>
  )
}
