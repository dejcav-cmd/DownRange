import CcwPageClient from './PageClient'

export const metadata = {
  title: 'CCW Reciprocity & Concealed Carry Laws — DownRange',
  description: 'Concealed carry permit requirements, reciprocity, and gun laws for all 50 states and DC. Updated 2026.',
  alternates: { canonical: 'https://downrangeco.com/ccw' },
  openGraph: {
    title: 'CCW Reciprocity & Concealed Carry Laws — DownRange',
    description: 'Concealed carry permit requirements, reciprocity, and gun laws for all 50 states and DC.',
    url: 'https://downrangeco.com/ccw',
    type: 'website',
  },
}

export default function CcwPage() {
  return <CcwPageClient />
}
