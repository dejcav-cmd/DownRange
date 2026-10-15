import AdminPwa from '../../components/admin/AdminPwa'

export const metadata = {
  title: 'DownRange Admin',
  manifest: '/admin.webmanifest',
  robots: { index: false, follow: false },
  appleWebApp: { capable: true, title: 'DR Admin', statusBarStyle: 'black-translucent' },
}
export const viewport = { themeColor: '#09090B', viewportFit: 'cover', width: 'device-width', initialScale: 1 }

export default function AdminLayout({ children }) {
  return <>{children}<AdminPwa /></>
}
