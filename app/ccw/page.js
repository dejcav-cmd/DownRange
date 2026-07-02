import CcwPageClient from './PageClient'

export const metadata = {
  title: 'CCW Reciprocity & Concealed Carry Laws — DownRange',
  description: 'Concealed carry permit requirements, reciprocity, and gun laws for all 50 states and DC. Updated 2026.',
  alternates: { canonical: 'https://www.downrangeco.com/laws/my-state' },
  openGraph: {
    title: 'CCW Reciprocity & Concealed Carry Laws — DownRange',
    description: 'Concealed carry permit requirements, reciprocity, and gun laws for all 50 states and DC.',
    url: 'https://www.downrangeco.com/laws/my-state',
    type: 'website',
  },
}

export default function CcwPage() {
  return <CcwPageClient />
}
