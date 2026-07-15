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

import { fetchAndUploadImage } from '@/lib/imageUpload.js'

async function fetchImage(query) {
  return fetchAndUploadImage(query, 'brazil')
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

// 22 topics — day-of-year rotation picks a different topic each day.
// Date-stamped slugs allow re-publishing refreshed content each month.
const BRAZIL_TOPICS = [
  {
    baseSlug: 'estatuto-desarmamento-atirador-precisa-saber',
    title: 'Estatuto do Desarmamento: O Que o Atirador Precisa Saber',
    tag: 'LEI', readMins: '8 min', imageQuery: 'Brazil law justice firearms regulation',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Estatuto do Desarmamento (Lei 10.826/2003). Cubra: o que é proibido vs permitido para civis, categorias de uso permitido vs restrito, penalidades, como o Estatuto mudou desde 2003, impacto real no atirador legal.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'como-se-tornar-cac-guia-completo',
    title: 'Como Virar CAC: Guia Completo para Atirador Desportivo',
    tag: 'GUIA', readMins: '10 min', imageQuery: 'shooting range sport pistol competition Brazil',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Como se tornar Atirador Desportivo CAC no Brasil em 2025. Cubra: documentação necessária, custo real total, laudo psicológico, clube homologado pelo Exército, processo SIGMA, quanto tempo demora, erros comuns que atrasam o processo.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'decreto-lula-cac-o-que-mudou',
    title: 'Decreto Lula e o CAC: O Que Realmente Mudou — e O Que Permanece',
    tag: 'POLÍTICA', readMins: '9 min', imageQuery: 'Brazil government congress law politics',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Decreto 11.366/2023 do governo Lula sobre armas. Cubra: o que foi revogado dos decretos Bolsonaro, limites atuais de armas por categoria CAC, situação das liminares judiciais, o que o atirador deve fazer agora, perspectivas para 2025-2026.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'armas-uso-permitido-vs-restrito',
    title: 'Uso Permitido vs. Uso Restrito no Brasil: Entenda de Uma Vez Por Todas',
    tag: 'LEI', readMins: '8 min', imageQuery: 'handgun pistol firearm law Brazil police',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Diferença entre armas de uso permitido e restrito no Brasil. Cubra: quais calibres/modelos pertencem a cada categoria, quem pode ter o quê, como o CAC muda o acesso, calibres .40 e .45, armas semiautomáticas, penalidades por porte de uso restrito sem autorização.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'municao-precos-onde-comprar',
    title: 'Munição no Brasil: Preços Reais, Onde Comprar e Por Que É Tão Cara',
    tag: 'GUIA', readMins: '7 min', imageQuery: 'ammunition bullets 9mm firearm Brazil',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Mercado de munição no Brasil em 2025. Cubra: preços atuais em reais (9mm, .38, .40, .22LR, 12 gauge), por que a munição é cara (CBC monopólio, tributos), limites legais de estoque, compra online, melhores distribuidores, perspectiva de preços.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'porte-civil-brasil-possivel-ou-impossivel',
    title: 'Porte Civil no Brasil: É Possível ou É Impossível na Prática?',
    tag: 'LEI', readMins: '8 min', imageQuery: 'concealed carry holster firearm law enforcement',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Porte de arma civil no Brasil. Cubra: quem tem direito ao porte (rural, risco comprovado, etc.), processo real na Polícia Federal, taxa de concessão, renovação anual, o que acontece numa abordagem policial, comparação com outros países da América do Sul.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'sigma-exercito-brasileiro-registro-armas',
    title: 'SIGMA: O Sistema do Exército que Controla Cada Arma CAC no Brasil',
    tag: 'GUIA', readMins: '7 min', imageQuery: 'military army Brazil Exército registration system',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Sistema SIGMA do Exército Brasileiro. Cubra: o que é o SIGMA, como funciona o registro, transferência e desfazimento, fiscalização domiciliar de colecionadores, mínimo de competições para atiradores, o que acontece se perder o prazo, como acessar o portal online.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'legitima-defesa-arma-brasil-lei',
    title: 'Legítima Defesa com Arma no Brasil: O Que a Lei Diz — e o Que Não Diz',
    tag: 'LEI', readMins: '9 min', imageQuery: 'home defense self defense law firearm protection',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Legítima defesa com arma de fogo no Brasil. Cubra: o que o Código Penal diz sobre legítima defesa, casos reais julgados pelo STJ/STF, como atirar em intruso em casa pode resultar em processo, o que fazer após disparar em legítima defesa, diferença entre excesso doloso e culposo.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'cbc-imbel-industria-armas-brasileira',
    title: 'CBC e IMBEL: A Indústria de Armas Brasileira Que Poucos Conhecem',
    tag: 'SETOR', readMins: '8 min', imageQuery: 'ammunition factory manufacturing firearms Brazil',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Indústria nacional de armas e munição no Brasil — CBC e IMBEL. Cubra: história, capacidade produtiva, exportações, por que o monopólio mantém preços altos, produtos mais vendidos, perspectivas de concorrência.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'estados-mais-amigaveis-atiradores',
    title: 'Os Estados Mais (e Menos) Amigáveis para Atiradores no Brasil',
    tag: 'GUIA', readMins: '9 min', imageQuery: 'Brazil map states flag gun rights',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil, byline DJ Cavalcanti.\nTópico: Análise por estado para atiradores desportivos no Brasil. Classifique e analise: Rio Grande do Sul (melhor), Mato Grosso, Minas Gerais, Paraná vs São Paulo, Rio de Janeiro (piores). Cubra: postura da PF local, burocracia, clubes ativos, pressão política.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify" em todos os p. Sem h1.`,
  },
  {
    baseSlug: 'novas-pistolas-mercado-brasileiro-cac',
    title: 'Novas Pistolas no Mercado Brasileiro: O Que o CAC Pode Comprar Agora',
    tag: 'PRODUTO', readMins: '7 min', imageQuery: 'pistol handgun 9mm firearm product Brazil',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Melhores pistolas novas disponíveis para CAC no Brasil em 2025. Cubra: Glock 47 MOS, SIG P365 XMACRO, Beretta APX-A1, Taurus TX22 Competition, preços reais em reais, onde comprar, vantagens práticas para atirador desportivo.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'minimo-competicoes-atirador-desportivo',
    title: 'Mínimo de Competições para Manter o CR de Atirador Desportivo',
    tag: 'GUIA', readMins: '7 min', imageQuery: 'shooting competition sport target range Brazil',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Requisitos de competições para manter o CR de Atirador Desportivo. Cubra: mínimo atual de competições por ano, como registrar no SIGMA, o que acontece se não cumprir, competições reconhecidas pelo Exército, como encontrar competições na sua região.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'transportar-arma-legalmente-brasil',
    title: 'Como Transportar Sua Arma Legalmente no Brasil: Guia Atualizado',
    tag: 'LEI', readMins: '8 min', imageQuery: 'firearm transport case law enforcement Brazil',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Transporte legal de armas no Brasil em 2025. Cubra: diferença entre porte e transporte, regras da PF para transporte ao clube, maleta lacrada vs desmuniciada, transporte aéreo (ANAC), o que fazer em abordagem policial, multas e penalidades.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'reforma-estatuto-desarmamento-perspectivas',
    title: 'Reforma do Estatuto do Desarmamento: O Que Está em Jogo',
    tag: 'POLÍTICA', readMins: '8 min', imageQuery: 'Brazil congress parliament legislation politics',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Perspectivas de reforma do Estatuto do Desarmamento para 2025-2026. Cubra: projetos de lei em tramitação, posição do governo Lula vs oposição, demandas da CNCAP e ATIBS, o que atiradores devem monitorar, linha do tempo realista.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'cofre-armas-brasil-como-escolher',
    title: 'Cofre para Armas no Brasil: Como Escolher o Cofre Certo para Sua Coleção',
    tag: 'GUIA', readMins: '7 min', imageQuery: 'gun safe firearm storage security vault',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Como escolher cofre para armas no Brasil. Cubra: normas da PF e Exército para guarda, diferença entre cofres homologados vs não-homologados, marcas disponíveis no mercado brasileiro e preços reais, capacidade vs acesso rápido, cofres para uso doméstico vs coleção extensa.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'fuzis-rifles-o-que-cac-pode-ter',
    title: 'Fuzis e Rifles de Alta Potência: O Que o CAC Brasileiro Pode Ter',
    tag: 'LEI', readMins: '9 min', imageQuery: 'rifle AR-15 firearm shooting range sport',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Acesso de CACs a fuzis e rifles de uso restrito no Brasil. Cubra: o que mudou com os decretos Lula, calibres ainda acessíveis, diferença entre colecionador e atirador para rifles, impacto das liminares do STF, qual o limite prático hoje.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'mercado-armas-brasil-numeros-tendencias',
    title: 'O Mercado de Armas no Brasil: Números, Tendências e Perspectivas',
    tag: 'SETOR', readMins: '8 min', imageQuery: 'firearms industry market gun shop Brazil',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Mercado de armas no Brasil em 2025. Cubra: número de CACs registrados, crescimento vs anos anteriores, impacto dos decretos Lula nas vendas, marcas mais vendidas, importação vs produção nacional, perspectivas para 2026.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'armas-colecao-criterios-como-manter-legal',
    title: 'Armas de Coleção no Brasil: Critérios, Limites e Como Manter Seu Acervo Legal',
    tag: 'GUIA', readMins: '9 min', imageQuery: 'firearm collection antique weapons display',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Colecionismo de armas no Brasil. Cubra: quem pode ser colecionador, quais armas são elegíveis (históricas, artísticas, esportivas), limites de quantidade, fiscalização do Exército, como adquirir peças raras legalmente, cuidados com documentação.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'primeiros-passos-atirador-desportivo-brasil',
    title: 'Primeiros Passos como Atirador Desportivo no Brasil: Do Zero ao CR',
    tag: 'GUIA', readMins: '10 min', imageQuery: 'shooting range beginner training pistol Brazil',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Guia do zero para quem quer começar no tiro desportivo no Brasil. Cubra: escolher a modalidade certa (IPSC, IDPA, tiro prático, olimpismo), encontrar um clube, quanto custa realmente começar, sequência de documentação, erros de principiantes, quanto tempo até o primeiro CR.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'melhores-calibres-tiro-desportivo',
    title: 'Melhores Calibres para Tiro Desportivo no Brasil em 2025',
    tag: 'GUIA', readMins: '7 min', imageQuery: 'ammunition caliber firearm sport shooting target',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Melhores calibres para atirador desportivo no Brasil em 2025. Cubra: 9mm (para iniciantes e IPSC), .38 Super (para competição), .40 S&W (uso restrito, acesso CAC), .22LR (treino econômico), preços atuais de cada calibre, disponibilidade, vantagens e desvantagens para cada modalidade.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'seguranca-no-clube-de-tiro-regras',
    title: 'Segurança no Clube de Tiro: As Regras Que Você Precisa Saber Antes de Atirar',
    tag: 'GUIA', readMins: '7 min', imageQuery: 'shooting range safety rules target practice',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Segurança em clubes de tiro no Brasil. Cubra: as quatro regras universais do manuseio seguro de armas, regras específicas de cada modalidade (IPSC, IDPA, tiro livre), proteção auditiva e visual obrigatória, o que acontece quando você comete um erro de segurança, etiqueta básica no estande.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'manutencao-pistola-guia-cac',
    title: 'Manutenção de Pistola: Guia Prático para o Atirador CAC',
    tag: 'GUIA', readMins: '8 min', imageQuery: 'firearm cleaning maintenance pistol kit',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Manutenção de pistola para atirador desportivo. Cubra: frequência de limpeza, desmontagem básica (Glock, Taurus, Sig), produtos disponíveis no mercado brasileiro (CLP, Break-Free, lubrificantes), pontos críticos de inspeção, quando levar ao armeiro, armazenamento correto para conservar a arma.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
  {
    baseSlug: 'ipsc-idpa-brasil-como-comecar',
    title: 'IPSC e IDPA no Brasil: Como Começar a Competir em 2025',
    tag: 'GUIA', readMins: '9 min', imageQuery: 'IPSC IDPA competition shooting sport pistol',
    prompt: `${VOICE_BR}\n\nEscreva um artigo de 900-1100 palavras para DownRange Brasil.\nTópico: Como começar a competir em IPSC e IDPA no Brasil. Cubra: diferença entre IPSC e IDPA, federações e aprovação pelo Exército, classificação de atiradores, equipamento necessário no início (pistola, coldre, pouch), custos realistas de inscrição, encontrar stages e clubes com calendário ativo.\nFormato: HTML com h2/p/ul/li/strong, style="text-align:justify". Sem h1.`,
  },
]

export async function GET() {
  return Response.json({ topics: BRAZIL_TOPICS.map(t => ({ baseSlug: t.baseSlug, title: t.title, tag: t.tag })) })
}

export async function POST(req) {
  const key    = req.headers.get('x-admin-key')
  const auth   = req.headers.get('authorization')
  const secret = process.env.CRON_SECRET
  const valid  = (key && key === process.env.ADMIN_KEY) || (secret && auth === 'Bearer ' + secret) || !process.env.ADMIN_KEY
  if (!valid) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { limit = 1, force = false } = await req.json().catch(() => ({}))

  // ── DATE-BASED ROTATION ──────────────────────────────────────────────────────
  // Pick which topic to write today by rotating through the list using day-of-year.
  // A new date-stamped slug is generated each month so the same topic can be
  // refreshed with current content rather than being skipped as "already exists".
  const now        = new Date()
  const dayOfYear  = Math.floor((now - new Date(now.getUTCFullYear(), 0, 0)) / 86400000)
  const monthStamp = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`

  const startIdx = dayOfYear % BRAZIL_TOPICS.length
  const pool = []
  for (let i = 0; i < Math.min(limit, BRAZIL_TOPICS.length); i++) {
    pool.push(BRAZIL_TOPICS[(startIdx + i) % BRAZIL_TOPICS.length])
  }

  const results = []

  for (const article of pool) {
    const slug = `${article.baseSlug}-${monthStamp}`

    try {
      if (!force) {
        const existing = await sanity.fetch(
          '*[_type == "brazilContent" && slug.current == $slug][0]{ _id }',
          { slug }
        )
        if (existing) {
          results.push({ slug, status: 'skipped', reason: 'already published this month' })
          continue
        }
      }

      const rawBody = await callAIText({ prompt: article.prompt, useCase: 'brazil', maxTokens: 2000 })
      // Strip any markdown fences GLM/Haiku may wrap the HTML in (```html ... ```)
      const body = (rawBody || '').replace(/^```[a-z]*\r?\n?/im, '').replace(/\r?\n?```\s*$/im, '').trim()
      if (!body || body.length < 200) throw new Error('Empty AI response')

      const summary  = body.replace(/<[^>]+>/g, '').slice(0, 240).trim() + '...'
      const imageUrl = (await fetchImage(article.imageQuery)) || '/img/photos/law.jpg'

      await sanity.createOrReplace({
        _id:             `br-written-${slug}`,
        _type:           'brazilContent',
        type:            'artigo',
        title:           article.title,
        slug:            { _type: 'slug', current: slug },
        tag:             article.tag,
        readMins:        article.readMins,
        imageUrl,
        body,
        summary,
        author:          'DJ Cavalcanti',
        publishedAt:     now.toISOString(),
        qualityReviewed: false,
        active:          true,
      })
      results.push({ slug, status: 'created', title: article.title, imageUrl })

      await new Promise(r => setTimeout(r, 500))
    } catch (e) {
      results.push({ slug, status: 'failed', error: e.message })
    }
  }

  const created = results.filter(r => r.status === 'created').length
  const skipped = results.filter(r => r.status === 'skipped').length
  const failed  = results.filter(r => r.status === 'failed').length

  return Response.json({
    ok: true,
    message: `${created} created · ${skipped} skipped · ${failed} failed.`,
    results,
  })
}
