import FFLFinderPage from "./PageClient"

export const metadata = {
  title:       "FFL Dealer Finder — 60,000+ Licensed Dealers Near You | DownRange",
  description: "Find licensed FFL firearms dealers by ZIP code. Search 60,000+ ATF-licensed dealers nationwide.",
  alternates:  { canonical: "https://downrangeco.com/ffl-finder" },
  openGraph: {
    title:       "FFL Dealer Finder — 60,000+ Licensed Dealers Near You | DownRange",
    description: "Find licensed FFL firearms dealers by ZIP code. Search 60,000+ ATF-licensed dealers nationwide.",
    url:         "https://downrangeco.com/ffl-finder",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "FFL Dealer Finder — 60,000+ Licensed Dealers Near You | DownRange",
    description: "Find licensed FFL firearms dealers by ZIP code. Search 60,000+ ATF-licensed dealers nationwide.",
  },
}

export default function Page() {
  return <FFLFinderPage />
}
