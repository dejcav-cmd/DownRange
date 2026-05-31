import BrazilClient from "./PageClient"
import BreakingTicker from "../../components/layout/BreakingTicker"
import { fetchBreakingAlerts } from "../../sanity/lib/client"
import { createClient } from "@sanity/client"

export const metadata = {
  title:       "Brasil — Armas de Fogo, Leis e CAC | DownRange",
  description: "Legislação sobre armas no Brasil: Estatuto do Desarmamento, CAC, decretos Bolsonaro/Lula, e direitos do atirador brasileiro.",
  alternates:  { canonical: "https://downrangeco.com/brazil" },
}

export const revalidate = 1800

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || "vbnsqnkg",
  dataset:   "production",
  apiVersion:"2024-01-01",
  useCdn:    true,
  token:     process.env.SANITY_API_TOKEN,
})

export default async function BrazilPage() {
  const [items, breakingAlerts] = await Promise.all([
    sanity.fetch(
      '*[_type=="brazilContent"] | order(order asc, publishedAt desc) { _id, type, title, slug, status, impact, effectiveDate, summary, detail, sourceUrl, abbr, rating, highlights, body, imageUrl, tag, readMins, author, brlPrice, usdEquiv, availability, trend, note, value, color, order, publishedAt }'
    ).catch(() => []),
    fetchBreakingAlerts(3).catch(() => []),
  ])

  const leis      = items.filter(i => i.type === "lei")
  const estados   = items.filter(i => i.type === "estado")
  const artigos   = items.filter(i => i.type === "artigo")
  const municao   = items.filter(i => i.type === "municao")
  const alertas   = items.filter(i => i.type === "alerta")
  const stats     = items.filter(i => i.type === "stat")
  const cac_info  = items.filter(i => i.type === "cac_info")

  return (
    <>
      <BreakingTicker alerts={breakingAlerts} />
      <BrazilClient
        leis={leis}
        estados={estados}
        artigos={artigos}
        municao={municao}
        alertas={alertas}
        stats={stats}
        cac_info={cac_info}
      />
    </>
  )
}
