import '../styles/globals.css'
import MobileTabBar from '../components/ui/MobileTabBar'
import { ThemeProvider } from '../components/ui/ThemeProvider'

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
  alternates: { canonical: '/' },
  openGraph: {
    type:'website', locale:'en_US', url:'https://downrangeco.com',
    siteName:'DownRange', title:"DownRange — America's Firearms Intelligence Hub",
    description:'Live. Loaded. Lawful. The central source for U.S. firearms intelligence.',
    images:[{ url:'/og-default.png', width:1200, height:630, alt:'DownRange' }],
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
      </head>
      <body>
        <ThemeProvider>
          {children}
        <MobileTabBar />
      </ThemeProvider>
      </body>
    </html>
  )
}
