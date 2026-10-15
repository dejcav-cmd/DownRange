import MyStatePage from '../my-state/page'

export const revalidate = 1800
export const metadata = {
  title: 'CCW Reciprocity Map: Where Your Permit Works',
  description: 'Concealed carry reciprocity for all 50 states: pick your home state and see where your permit is honored, with source and verification date.',
  alternates: { canonical: 'https://www.downrangeco.com/laws/reciprocity' },
  openGraph: {
    title: 'CCW Reciprocity Map | DownRange',
    description: 'Where your concealed carry permit is honored, state by state.',
    url: 'https://www.downrangeco.com/laws/reciprocity',
    images: [{ url: 'https://www.downrangeco.com/og-default.png', width: 1200, height: 630, alt: 'CCW Reciprocity Map' }],
  },
}

export default function ReciprocityPage() {
  return <MyStatePage initialView="reciprocity" />
}
