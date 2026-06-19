import { callAIText } from '@/lib/aiClient.js'
export const dynamic   = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset:   'production',
  apiVersion:'2024-01-01',
  useCdn:    false,
  token:     process.env.SANITY_API_TOKEN,
})

// ── Fetch real image from Pexels or Pixabay ───────────────────────────────────
async function fetchImage(query) {
  // Try Pexels first
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=5&orientation=landscape`,
        { headers: { Authorization: pexelsKey } }
      )
      const data = await res.json()
      const photo = data.photos?.[0]
      if (photo) return photo.src.large2x || photo.src.large
    } catch {}
  }
  // Pixabay fallback
  const pixabayKey = process.env.PIXABAY_API_KEY
  if (pixabayKey) {
    try {
      const url = new URL('https://pixabay.com/api/')
      url.searchParams.set('key', pixabayKey)
      url.searchParams.set('q', query)
      url.searchParams.set('image_type', 'photo')
      url.searchParams.set('orientation', 'horizontal')
      url.searchParams.set('min_width', '1200')
      url.searchParams.set('per_page', '5')
      url.searchParams.set('safesearch', 'true')
      const res = await fetch(url.toString())
      const data = await res.json()
      const hit = data.hits?.[0]
      if (hit) return hit.largeImageURL || hit.webformatURL
    } catch {}
  }
  return null
}

function buildImageQuery(tag, title) {
  const t = (title + ' ' + tag).toLowerCase()
  if (/estatuto|desarmamento|lei|decreto|stf|regulament/.test(t)) return 'Brazil law justice courthouse'
  if (/cac|atirador|clube de tiro|competição/.test(t))             return 'shooting range competition firearm'
  if (/munição|municio|cartucho|calibre/.test(t))                  return 'firearm ammunition bullets caliber'
  if (/pistola|revólver|handgun|porte/.test(t))                    return 'handgun pistol firearm concealed carry'
  if (/fuzil|rifle|carabina/.test(t))                              return 'rifle firearm AR-15 shooting range'
  if (/espingarda|shotgun|caça/.test(t))                           return 'shotgun hunting firearm outdoors'
  if (/tráfico|crime|violência|homicídio/.test(t))                 return 'police law enforcement crime scene'
  if (/policia|pm|pf|policial/.test(t))                           return 'police officer law enforcement Brazil'
  if (/bolsonaro|lula|governo|política/.test(t))                   return 'Brazil government congress politics'
  if (/exército|militar|forças armadas/.test(t))                   return 'military soldier weapon armed forces'
  if (/colecionar|colecionador/.test(t))                           return 'firearm collection weapons display'
  if (/canada|pal|rpal|restrição/.test(t))                         return 'Canada firearms law regulation'
  return 'firearm gun second amendment'
}

const VOICE_BR = `REGRAS OBRIGATÓRIAS — ESTILO DOWNRANGE BRASIL:
- Escreva EM PORTUGUÊS BRASILEIRO fluente e natural
- Autor: DJ Cavalcanti — fundador do DownRange
- Tom direto, sem rodeios, como quem conhece a lei de armas de cor
- PROIBIDO: "abrangente", "mergulhar em", "robusto", "alavancar", "empoderar", "game-changer", "sinergias"
- Comece com o fato mais importante, sem introdução vaga
- Voz ativa, números específicos, nomes reais de organizações (CNCAP, ATIBS, CBC, SIGMA, etc.)
- NÃO adicione rodapé de fonte, atribuição ou "visite o artigo original" no final
- Título DEVE ser formulação original DownRange — não copie o título da fonte
- Todo parágrafo: text-align:justify no CSS inline`

const BRAZIL_TOPICS = [
  {
    slug:'estatuto-desarmamento-o-que-atirador-precisa-saber-2025',
    title:'Estatuto do Desarmamento: O Que o Atirador Precisa Saber em 2025',
    tag:'LEI', readMins:'8 min', imageQuery:'Brazil law justice firearms regulation',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Estatuto do Desarmamento (Lei 10.826/2003). Cubra: o que é proibido vs permitido para civis, categorias de uso permitido vs restrito, penalidades, como o Estatuto mudou desde 2003, impacto real no atirador legal.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'como-se-tornar-cac-guia-completo-atirador-desportivo',
    title:'Como Virar CAC em 2025: Guia Completo para Atirador Desportivo',
    tag:'GUIA', readMins:'10 min', imageQuery:'shooting range sport pistol competition Brazil',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Como se tornar Atirador Desportivo CAC no Brasil em 2025. Cubra: documentação necessária, custo real total, laudo psicológico, clube homologado pelo Exército, processo SIGMA, quanto tempo demora, erros comuns que atrasam o processo.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'decreto-lula-cac-o-que-mudou-o-que-permanece',
    title:'Decreto Lula e o CAC: O Que Realmente Mudou — e O Que Permanece',
    tag:'POLÍTICA', readMins:'9 min', imageQuery:'Brazil government congress law politics',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Decreto 11.366/2023 do governo Lula sobre armas. Cubra: o que foi revogado dos decretos Bolsonaro, limites atuais de armas por categoria CAC, situação das liminares judiciais, o que o atirador deve fazer agora, perspectivas para 2025-2026.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'armas-de-uso-permitido-vs-restrito-no-brasil',
    title:'Uso Permitido vs. Uso Restrito no Brasil: Entenda de Uma Vez Por Todas',
    tag:'LEI', readMins:'8 min', imageQuery:'handgun pistol firearm law Brazil police',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Diferença entre armas de uso permitido e restrito no Brasil. Cubra: quais calibres/modelos pertencem a cada categoria, quem pode ter o quê, como o CAC muda o acesso, calibres .40 e .45, armas semiautomáticas, penalidades por porte de uso restrito sem autorização.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'municao-no-brasil-precos-disponibilidade-2025',
    title:'Munição no Brasil em 2025: Preços Reais, Onde Comprar e Por Que É Tão Cara',
    tag:'GUIA', readMins:'7 min', imageQuery:'ammunition bullets 9mm firearm Brazil',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Mercado de munição no Brasil em 2025. Cubra: preços atuais em reais (9mm, .38, .40, .22LR, 12 gauge), por que a munição é cara (CBC monopólio, tributos), limites legais de estoque, compra online, melhores distribuidores, perspectiva de preços.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'porte-de-arma-civil-no-brasil-possivel-ou-impossivel',
    title:'Porte Civil no Brasil: É Possível ou É Impossível na Prática?',
    tag:'LEI', readMins:'8 min', imageQuery:'concealed carry holster firearm law enforcement',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Porte de arma civil no Brasil. Cubra: quem tem direito ao porte (rural, risco comprovado, etc.), processo real na Polícia Federal, taxa de concessão, renovação anual, o que acontece numa abordagem policial, comparação com outros países da América do Sul.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'sigma-exercito-brasileiro-registro-armas-cac',
    title:'SIGMA: O Sistema do Exército que Controla Cada Arma CAC no Brasil',
    tag:'GUIA', readMins:'7 min', imageQuery:'military army Brazil Exército registration system',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Sistema SIGMA do Exército Brasileiro. Cubra: o que é o SIGMA, como funciona o registro, transferência e desfazimento, fiscalização domiciliar de colecionadores, mínimo de competições para atiradores, o que acontece se perder o prazo, como acessar o portal online.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'legitima-defesa-com-arma-no-brasil-o-que-a-lei-diz',
    title:'Legítima Defesa com Arma no Brasil: O Que a Lei Diz — e o Que Não Diz',
    tag:'LEI', readMins:'9 min', imageQuery:'home defense self defense law firearm protection',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Legítima defesa com arma de fogo no Brasil. Cubra: o que o Código Penal diz sobre legítima defesa, casos reais julgados pelo STJ/STF, como atirar em intruder em casa pode resultar em processo, o que fazer após disparar em legítima defesa, diferença entre excesso doloso e culposo.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'cbc-imbel-industria-de-armas-brasileira',
    title:'CBC e IMBEL: A Indústria de Armas Brasileira Que Poucos Conhecem',
    tag:'SETOR', readMins:'8 min', imageQuery:'ammunition factory manufacturing firearms Brazil',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Indústria nacional de armas e munição no Brasil — CBC (Companhia Brasileira de Cartuchos) e IMBEL. Cubra: história, capacidade produtiva, exportações, por que o monopólio mantém preços altos, produtos mais vendidos, perspectivas de concorrência.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'estados-mais-amigaveis-para-atiradores-no-brasil',
    title:'Os Estados Mais (e Menos) Amigáveis para Atiradores no Brasil em 2025',
    tag:'GUIA', readMins:'9 min', imageQuery:'Brazil map states flag gun rights',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Análise por estado para atiradores desportivos no Brasil. Classifique e analise: Rio Grande do Sul (melhor), Mato Grosso, Minas Gerais, Paraná vs São Paulo, Rio de Janeiro (piores). Cubra: postura da PF local, burocracia, clubes ativos, pressão política.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`
  },
  {
    slug:'novas-pistolas-2025-mercado-brasileiro-cac',
    title:'Novas Pistolas no Mercado Brasileiro em 2025: O Que o CAC Pode Comprar Agora',
    tag:'PRODUTO', readMins:'7 min', imageQuery:'pistol handgun 9mm firearm product Brazil',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Melhores pistolas novas disponíveis para CAC no Brasil em 2025. Cubra: Glock 47 MOS, SIG P365 XMACRO, Beretta APX-A1, Taurus TX22 Competition, preços reais em reais, onde comprar, vantagens práticas para atirador desportivo.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`
  },
  {
    slug:'atirador-desportivo-minimo-competicoes-2025',
    title:'Mínimo de Competições para Manter o CR de Atirador Desportivo em 2025',
    tag:'GUIA', readMins:'7 min', imageQuery:'shooting competition sport target range Brazil',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Requisitos de competições para manter o CR de Atirador Desportivo. Cubra: mínimo atual de competições por ano, como registrar no SIGMA, o que acontece se não cumprir, competições reconhecidas pelo Exército, como encontrar competições na sua região, dicas práticas.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`
  },
  {
    slug:'transportar-arma-legalmente-brasil-2025',
    title:'Como Transportar Sua Arma Legalmente no Brasil em 2025: Guia Atualizado',
    tag:'LEI', readMins:'8 min', imageQuery:'firearm transport case law enforcement Brazil',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Transporte legal de armas no Brasil em 2025. Cubra: diferença entre porte e transporte, regras da PF para transporte ao clube, maleta lacrada vs desmuniciada, transporte aéreo (ANAC), o que fazer em abordagem policial, multas e penalidades.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`
  },
  {
    slug:'reforma-estatuto-desarmamento-perspectivas-2026',
    title:'Reforma do Estatuto do Desarmamento: O Que Está em Jogo para 2026',
    tag:'POLÍTICA', readMins:'8 min', imageQuery:'Brazil congress parliament legislation politics',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Perspectivas de reforma do Estatuto do Desarmamento para 2026. Cubra: projetos de lei em tramitação, posição do governo Lula vs oposição, demandas da CNCAP e ATIBS, o que atiradores devem monitorar, linha do tempo realista.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`
  },
  {
    slug:'cofre-ideal-colecionador-brasil-guia-compra',
    title:'Cofre para Armas no Brasil: Como Escolher o Cofre Certo para Sua Coleção',
    tag:'GUIA', readMins:'7 min', imageQuery:'gun safe firearm storage security vault',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Como escolher cofre para armas no Brasil. Cubra: normas da PF e Exército para guarda, diferença entre cofres homologados vs não-homologados, marcas disponíveis no mercado brasileiro e preços reais, capacidade vs acesso rápido, cofres para uso doméstico vs coleção extensa.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`
  },
  {
    slug:'fuzis-brasil-o-que-cac-pode-ter-2025',
    title:'Fuzis e Rifles de Alta Potência: O Que o CAC Brasileiro Pode Ter em 2025',
    tag:'LEI', readMins:'9 min', imageQuery:'rifle AR-15 firearm shooting range sport',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Acesso de CACs a fuzis e rifles de uso restrito no Brasil. Cubra: o que mudou com os decretos Lula, calibres ainda acessíveis, diferença entre colecionador e atirador para rifles, impacto das liminares do STF, qual o limite prático hoje.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`
  },
  {
    slug:'mercado-armas-brasil-2025-numeros-tendencias',
    title:'O Mercado de Armas no Brasil em 2025: Números, Tendências e Perspectivas',
    tag:'SETOR', readMins:'8 min', imageQuery:'firearms industry market gun shop Brazil',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Mercado de armas no Brasil em 2025. Cubra: número de CACs registrados, crescimento vs anos anteriores, impacto dos decretos Lula nas vendas, marcas mais vendidas, importação vs produção nacional, perspectivas para 2026.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`
  },
  {
    slug:'armas-de-colecao-criterios-brasil-guia-completo',
    title:'Armas de Coleção no Brasil: Critérios, Limites e Como Manter Seu Acervo Legal',
    tag:'GUIA', readMins:'9 min', imageQuery:'firearm collection antique weapons display',
    prompt:`${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Colecionismo de armas no Brasil. Cubra: quem pode ser colecionador, quais armas são elegíveis (históricas, artísticas, esportivas), limites de quantidade, fiscalização do Exército, como adquirir peças raras legalmente, cuidados com documentação.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`
  },
]

export async function GET() {
  return Response.json({ topics: BRAZIL_TOPICS.map(t => ({ slug: t.slug, title: t.title, tag: t.tag })) })
}

export async function POST(req) {
  const key    = req.headers.get('x-admin-key')
  const auth   = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  const valid  = (key && key === process.env.ADMIN_KEY) || (secret && auth === 'Bearer ' + secret) || !process.env.ADMIN_KEY
  if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { limit = 10, force = false } = await req.json().catch(() => ({}))
  // Find which topics haven't been written yet
  const existingSlugs = await sanity.fetch(
    `*[_type == "brazilContent" && type == "artigo"]{ "slug": slug.current }`
  ).then(docs => new Set(docs.map(d => d.slug))).catch(() => new Set())

  // Prioritise unwritten topics, fall back to all if force=true
  const unwritten = BRAZIL_TOPICS.filter(t => !existingSlugs.has(t.slug))
  const pool = force ? BRAZIL_TOPICS : (unwritten.length > 0 ? unwritten : BRAZIL_TOPICS)
  const topics = pool.slice(0, Math.min(limit, pool.length))
  console.log(`[BRAZIL] ${unwritten.length} unwritten, writing ${topics.length}`)
  const results = []

  for (const article of topics) {
    try {
      const existing = await sanity.fetch(
        '*[_type == "brazilContent" && type == "artigo" && slug.current == $slug][0]{ _id }',
        { slug: article.slug }
      )
      if (existing && !force) {
        results.push({ slug: article.slug, status: 'skipped' })
        continue
      }

      // Generate article body in Portuguese
      const body = await callAIText({ prompt: article.prompt, useCase: 'brazil', maxTokens: 2000 })
      if (!body || body.length < 200) throw new Error('Empty AI response')

      // Get real image
      const imageUrl = await fetchImage(article.imageQuery) || '/img/photos/law.jpg'

      const summary = body.replace(/<[^>]+>/g, '').slice(0, 240).trim() + '...'

      const doc = {
        _type:       'brazilContent',
        type:        'artigo',
        title:       article.title,
        slug:        { _type: 'slug', current: article.slug },
        tag:         article.tag,
        readMins:    article.readMins,
        imageUrl,
        body,
        summary,
        author:      'DJ Cavalcanti',
        publishedAt: new Date().toISOString(),
        qualityReviewed: false,
        active:      true,
      }

      if (existing && force) {
        await sanity.patch(existing._id).set({ body, summary, imageUrl }).commit()
        results.push({ slug: article.slug, status: 'updated', title: article.title, imageUrl })
      } else {
        const created = await sanity.create(doc)
        results.push({ slug: article.slug, status: 'created', title: article.title, id: created._id, imageUrl })
      }

      await new Promise(r => setTimeout(r, 500))
    } catch (e) {
      results.push({ slug: article.slug, status: 'error', error: e.message })
    }
  }

  return Response.json({ ok: true, results })
}
