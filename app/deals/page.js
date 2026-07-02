import DealsPage from "./PageClient"

export const metadata = {
  title:       "Gun & Ammo Deals — Best Prices Live | DownRange",
  description: "Today's best firearms, ammo, and accessories deals from top retailers. Real-time pricing on guns, bulk ammo, and gear.",
  alternates:  { canonical: "https://www.downrangeco.com/deals" },
  openGraph: {
    title:       "Gun & Ammo Deals — Best Prices Live | DownRange",
    description: "Today's best firearms, ammo, and accessories deals from top retailers. Real-time pricing on guns, bulk ammo, and gear.",
    url:         "https://www.downrangeco.com/deals",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Gun & Ammo Deals — Best Prices Live | DownRange",
    description: "Today's best firearms, ammo, and accessories deals from top retailers. Real-time pricing on guns, bulk ammo, and gear.",
  },
}

export default function Page() {
  return <DealsPage />
}
