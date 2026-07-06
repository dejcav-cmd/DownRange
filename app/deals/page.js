import DealsPage from "./PageClient"
import { fetchAllStateProfiles } from "../../sanity/lib/client"

export const revalidate = 3600

export const metadata = {
  title:       "Gun & Ammo Deals — Best Prices Live | DownRange",
  description: "Today's best firearms, ammo, and accessories deals from top retailers. Real-time pricing on guns, bulk ammo, and gear — checked against your state's laws.",
  alternates:  { canonical: "https://www.downrangeco.com/deals" },
  openGraph: {
    title:       "Gun & Ammo Deals — Best Prices Live | DownRange",
    description: "Today's best firearms, ammo, and accessories deals from top retailers, checked against your state's laws.",
    url:         "https://www.downrangeco.com/deals",
    type:        "website",
  },
  twitter: {
    card:        "summary_large_image",
    title:       "Gun & Ammo Deals — Best Prices Live | DownRange",
    description: "Today's best firearms, ammo, and accessories deals, checked against your state's laws.",
  },
}

const BAN_SUPP = new Set(['CA', 'DE', 'HI', 'IL', 'MA', 'NJ', 'NY', 'RI'])

export default async function Page() {
  let states = []
  try {
    const profiles = await fetchAllStateProfiles()
    states = (profiles || []).map(p => {
      const awb = (p.awbStatus || '').toLowerCase()
      return {
        abbr: p.abbr, name: p.name, mag: p.magLimit || null,
        awbFull: awb === 'full', awbRestricted: awb === 'banned',
        suppLegal: !BAN_SUPP.has(p.abbr),
      }
    }).filter(s => s.abbr && s.name).sort((a, b) => a.name.localeCompare(b.name))
  } catch { /* fall back to empty — filter simply won't show */ }
  return <DealsPage states={states} />
}
