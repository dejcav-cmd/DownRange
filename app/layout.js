import '../styles/globals.css'
import { ThemeProvider } from '../components/ui/ThemeProvider'

export const metadata = {
  title: { default: "DownRange — America's Firearms Intelligence Hub", template: '%s | DownRange' },
  description: 'The central source for U.S. firearms news, Second Amendment law, gun reviews, new releases, and state-by-state firearms information.',
  keywords: ['firearms', 'guns', 'Second Amendment', 'ATF', 'gun laws', 'concealed carry', 'gun reviews'],
  openGraph: {
    type: 'website', locale: 'en_US',
    url: 'https://downrangeco.com',
    siteName: 'DownRange',
    title: "DownRange — America's Firearms Intelligence Hub",
    description: 'Live. Loaded. Lawful. The central source for U.S. firearms intelligence.',
  },
  twitter: { card: 'summary_large_image', site: '@downrangeco' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="dark">
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
