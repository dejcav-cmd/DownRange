import CanadaClient from "./PageClient"
import BreakingTicker from "../../components/layout/BreakingTicker"
import { fetchBreakingAlerts } from "../../sanity/lib/client"
import { createClient } from "@sanity/client"

export const metadata = {
  title:       "Canadian Firearms Law — PAL, C-21, Province Laws | DownRange",
  description: "Canadian firearms regulations: PAL licensing, Bill C-21 updates, and province-by-province laws.",
  alternates:  { canonical: "https://downrangeco.com/canada" },
}

export const revalidate = 1800

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "vbnsqnkg",
  dataset:   "production",
  apiVersion:"2024-01-01",
  useCdn:    true,
  token:     process.env.SANITY_API_TOKEN,
})

export default async function CanadaPage() {
  const [items, breakingAlerts] = await Promise.all([
    sanity.fetch(
      '*[_type=="canadaContent"] | order(order asc, publishedAt desc) { _id, type, title, slug, status, impact, effectiveDate, summary, detail, sourceUrl, abbr, rating, highlights, body, imageUrl, tag, readMins, author, cadPrice, usdEquiv, availability, trend, note, value, color, order, publishedAt }'
    ).catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])

  const laws      = items.filter(i => i.type === "law")
  const provinces = items.filter(i => i.type === "province")
  const articles  = items.filter(i => i.type === "article")
  const ammo      = items.filter(i => i.type === "ammo")
  const alerts    = items.filter(i => i.type === "alert")
  const stats     = items.filter(i => i.type === "stat")

  return (
    <>
      <BreakingTicker alerts={breakingAlerts} />
      <CanadaClient
        laws={laws}
        provinces={provinces}
        articles={articles}
        ammo={ammo}
        alerts={alerts}
        stats={stats}
      />
    </>
  )
}
