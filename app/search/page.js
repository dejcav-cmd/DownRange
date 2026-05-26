import SearchPage from "./PageClient"

export const metadata = {
  title:       "Search DownRange — News, Laws, Reviews and More",
  description: "Search all DownRange content: firearms news, 2A law, gun reviews, ammo prices, and state-by-state legislation.",
  alternates:  { canonical: "https://downrangeco.com/search" },
  openGraph: {
    title:       "Search DownRange — News, Laws, Reviews and More",
    description: "Search all DownRange content: firearms news, 2A law, gun reviews, ammo prices, and state-by-state legislation.",
    url:         "https://downrangeco.com/search",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Search DownRange — News, Laws, Reviews and More",
    description: "Search all DownRange content: firearms news, 2A law, gun reviews, ammo prices, and state-by-state legislation.",
  },
}

export default function Page() {
  return <SearchPage />
}
