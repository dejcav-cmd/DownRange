import CanadaPage from "./PageClient"

export const metadata = {
  title:       "Canadian Firearms Law — PAL, C-21, Province Laws | DownRange",
  description: "Canadian firearms regulations: PAL licensing, Bill C-21 updates, and province-by-province laws.",
  alternates:  { canonical: "https://downrangeco.com/canada" },
  openGraph: {
    title:       "Canadian Firearms Law — PAL, C-21, Province Laws | DownRange",
    description: "Canadian firearms regulations: PAL licensing, Bill C-21 updates, and province-by-province laws.",
    url:         "https://downrangeco.com/canada",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Canadian Firearms Law — PAL, C-21, Province Laws | DownRange",
    description: "Canadian firearms regulations: PAL licensing, Bill C-21 updates, and province-by-province laws.",
  },
}

export default function Page() {
  return <CanadaPage />
}
