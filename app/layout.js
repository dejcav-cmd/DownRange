import '../styles/globals.css'
import ClerkWrapper from '../components/ui/ClerkWrapper'

import MobileTabBar from '../components/ui/MobileTabBar'
import { ThemeProvider } from '../components/ui/ThemeProvider'
import Script from 'next/script'
import PageViewTracker from '../components/ui/PageViewTracker'

const GA_ID = 'G-KDGZX3CLEC'

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#C8922A',
}

export const metadata = {
  title: { default: "DownRange — America's Firearms Intelligence Hub", template: '%s | DownRange' },
  description: "The central source for U.S. firearms news, Second Amendment law, gun reviews, new releases, and state-by-state firearms information.",
  keywords: ['firearms','guns','Second Amendment','ATF','gun laws','concealed carry','gun reviews','NFA','suppressor','2A'],
  metadataBase: new URL('https://downrangeco.com'),
  icons: {
    icon:       [{ url: '/favicon.svg', type: 'image/svg+xml' }],
    shortcut:   '/favicon.svg',
    apple:      '/favicon.svg',
  },
  alternates: { canonical: 'https://downrangeco.com' },
  openGraph: {
    type:'website', locale:'en_US', url:'https://downrangeco.com',
    siteName:'DownRange', title:"DownRange — America's Firearms Intelligence Hub",
    description:'Live. Loaded. Lawful. The central source for U.S. firearms intelligence.',
    images:[{ url:'https://downrangeco.com/og-default.svg', width:1200, height:630, alt:'DownRange — America\'s Firearms Intelligence Hub' }],
  },
  twitter: { card:'summary_large_image', site:'@downrangeco', creator:'@downrangeco' },
  robots: { index:true, follow:true, googleBot:{ index:true, follow:true } },
  verification: { google: process.env.GOOGLE_SITE_VERIFICATION || '' },
}

const SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'NewsMediaOrganization',
  name: 'DownRange',
  url: 'https://downrangeco.com',
  logo: 'https://downrangeco.com/logo.png',
  description: "America's Firearms Intelligence Hub",
  sameAs: ['https://twitter.com/downrangeco'],
  publishingPrinciples: 'https://downrangeco.com/about',
  foundingDate: '2026',
  contactPoint: { '@type':'ContactPoint', email:'contact@downrangeco.com', contactType:'editorial' }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <head>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(SCHEMA) }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />

        {/* ── Google Analytics GA4 — G-KDGZX3CLEC ── */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
        {/* AvantLink affiliate ownership verification — dangerouslySetInnerHTML forces into raw HTML */}
        <script dangerouslySetInnerHTML={{ __html: '' }} src="https://classic.avantlink.com/affiliate_app_confirm.php?mode=js&application_id=1604521" />
      </head>
      <ClerkWrapper>
      <body>
        <ThemeProvider>
          {children}
          <MobileTabBar />
        </ThemeProvider>
        {/* SPA route tracker — fires gtag on every client-side navigation */}
        <PageViewTracker />
      </body>
      </ClerkWrapper>
    </html>
  )
}
