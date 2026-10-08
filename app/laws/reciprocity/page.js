import MyStatePage from '../my-state/page'

export const revalidate = 1800
export const metadata = {
  title: 'CCW Reciprocity Map — Where Your Permit Is Honored',
  description: 'Concealed carry reciprocity for all 50 states: pick your home state and see where your permit is honored, with source and verification date.',
  alternates: { canonical: 'https://www.downrangeco.com/laws/reciprocity' },
  openGraph: {
    title: 'CCW Reciprocity Map | DownRange',
    description: 'Where your concealed carry permit is honored, state by state.',
    url: 'https://www.downrangeco.com/laws/reciprocity',
  },
}

export default function ReciprocityPage() {
  return <MyStatePage initialView="reciprocity" />
}
