import RangesPage from "./PageClient"

export const metadata = {
  title:       "Shooting Ranges Near Me — Find Gun Ranges | DownRange",
  description: "Find shooting ranges near you. Search indoor and outdoor gun ranges by location.",
  alternates:  { canonical: "https://downrangeco.com/ranges" },
  openGraph: {
    title:       "Shooting Ranges Near Me — Find Gun Ranges | DownRange",
    description: "Find shooting ranges near you. Search indoor and outdoor gun ranges by location.",
    url:         "https://downrangeco.com/ranges",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Shooting Ranges Near Me — Find Gun Ranges | DownRange",
    description: "Find shooting ranges near you. Search indoor and outdoor gun ranges by location.",
  },
}

export default function Page() {
  return <RangesPage />
}
