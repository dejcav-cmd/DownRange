import { callAIText } from '@/lib/aiClient.js'
import crypto from 'crypto'

// ── CLAUDE REWRITER ───────────────────────────────────────────────────
// opts.lang: 'en' (default) or 'pt-BR'. Brazil content MUST use 'pt-BR' —
// the site's /brazil section is entirely Portuguese-language; passing the
// default English prompt here was the root cause of Brazil articles
// publishing in English (fixed 2026-08-22).
async function rewriteWithClaude(item, opts = {}) {
  const lang = opts.lang || 'en'
  // Copyright-safe: extract facts only, use max 400 chars of source to avoid derivative work
  const inputContent = (item.description || item.content || item.contentSnippet || '').slice(0, 400)

  if (lang === 'pt-BR') {
    const promptPt = `Você está escrevendo um resumo de notícia para a DownRange Brasil — um portal sobre armas de fogo e legislação no Brasil.

REGRAS DE DIREITOS AUTORAIS — OBRIGATÓRIO:
- Isto é um RESUMO DE NOTÍCIA, não uma tradução ou reescrita do artigo-fonte.
- Extraia APENAS FATOS: quem, o quê, quando, onde, números, nomes, datas, números de decreto/lei.
- NÃO reproduza a estrutura, o fluxo ou as palavras do artigo-fonte.
- NÃO faça uma tradução parágrafo por parágrafo da fonte.
- Construa um artigo NOVO na estrutura própria da DownRange, com análise original.
- O leitor deve ainda se beneficiar de visitar a fonte original para mais detalhes.

REGRA DE IDIOMA — OBRIGATÓRIO E INEGOCIÁVEL:
- Escreva TUDO em português brasileiro fluente e natural — título, resumo e corpo do artigo.
- Isso vale mesmo que a fonte esteja em português ou em qualquer outro idioma.
- NUNCA escreva em inglês. Nenhuma palavra do artigo final deve estar em inglês.

VOZ E ESTILO:
- Escreva como um atirador que conhece a lei de armas de cor. Direto. Específico. Voz ativa.
- PROIBIDO: "abrangente", "mergulhar em", "robusto", "alavancar", "empoderar", "game-changer", "sinergias", "panorama", "navegar", "paradigma", "inovador", "sem precedentes", "partes interessadas", "holístico", "daqui para frente"
- Comece com o fato mais forte. A primeira frase diz quem fez o quê.
- Sem voz passiva. Sem qualificações vagas. Sem introduções genéricas.
- Frases curtas. Nomes reais, números específicos, calibres, valores em reais.

REGRA DE TÍTULO — OBRIGATÓRIO:
- NUNCA use o título da fonte. Escreva uma manchete totalmente original da DownRange.
- Máximo 12 palavras. Voz ativa. Preciso — sem exagero.

ESTRUTURA OBRIGATÓRIA DO ARTIGO — use exatamente esta estrutura:

<h2>[Manchete original — declare o fato principal com as próprias palavras da DownRange]</h2>
<p>[Parágrafo de abertura: o essencial (quem/o quê/quando/onde) em 80-100 palavras. Só fatos, redação original.]</p>

<h2>Detalhes Importantes</h2>
<p>[2-3 fatos específicos, números ou desdobramentos do evento. 80-120 palavras.]</p>

<h2>Por Que Isso Importa para o Atirador</h2>
<p>[Impacto prático. O que isso significa para quem é CAC, atira ou coleciona no Brasil? ANÁLISE ORIGINAL — não da fonte. 100-130 palavras.]</p>

<h2>Análise DownRange</h2>
<p>[Perspectiva original da DownRange. O que o atirador brasileiro deve fazer agora? 80-110 palavras. Comentário totalmente original.]</p>

REQUISITOS:
- 500-800 palavras no total. Conciso, sem enchimento.
- APENAS HTML: h2, p, strong, em, ul, li, a. Sem div, span, br.
- strong = nomes, números de lei/decreto, fatos-chave apenas.
- O artigo deve ser CONTEÚDO ORIGINAL, não uma tradução da fonte.

FATOS-FONTE (extraia fatos disso — não reproduza a redação):
Título: ${item.title}
Fonte: ${item.source || 'Desconhecida'}
Publicado: ${item.publishedAt || new Date().toISOString()}
Fatos principais: ${inputContent}

Retorne APENAS um JSON válido, com todo o texto em português:
{
  "title": "Manchete ORIGINAL da DownRange em português — NÃO o título da fonte. Máximo 12 palavras.",
  "summary": "2-3 frases em português. Fatos principais. Máximo 300 caracteres.",
  "body": "<artigo completo em HTML na estrutura acima, tudo em português>",
  "category": "law",
  "urgencyScore": 1-10,
  "tags": ["4-8 tags em kebab-case"],
  "relatedStates": [],
  "isBreaking": false
}
Comece com { termine com }. Sem markdown, sem crases.`

    try {
      const text = await callAIText({ prompt: promptPt, useCase: 'news', maxTokens: 1500 })
      let clean = text.split('```json').join('').split('```').join('').trim()
      const jsonStart = clean.indexOf('{')
      const jsonEnd   = clean.lastIndexOf('}')
      if (jsonStart > 0 && jsonEnd > jsonStart) clean = clean.slice(jsonStart, jsonEnd + 1)
      const parsed = JSON.parse(clean)
      if (typeof parsed.body !== 'string') parsed.body = null
      if (parsed.body) {
        const wordCount = parsed.body.replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length
        if (wordCount < 150) {
          console.warn(`[REWRITE-PT] Body too short (${wordCount} words) for "${(item.title || '').slice(0, 50)}" — discarding`)
          parsed.body = null
        }
      }
      return parsed
    } catch (err) {
      console.error('Claude PT-BR rewrite error:', err.message)
      return null
    }
  }

  const prompt = `You are writing a news summary for DownRange — a firearms and Second Amendment portal.

COPYRIGHT RULES — MANDATORY:
- This is a NEWS SUMMARY, not a rewrite of the source article.
- Extract FACTS ONLY: who, what, when, where, numbers, names, dates, bill numbers, rulings.
- DO NOT reproduce the source article's structure, flow, narrative, or wording.
- DO NOT do a paragraph-by-paragraph rewrite of the source.
- Build a NEW article in DownRange's own structure with original analysis.
- The reader should still benefit from visiting the original source for full details.
- Use the facts to create original commentary, not to reproduce the original reporting.

VOICE & STYLE:
- Write like a gun owner who carries daily and reads 2A case law. Direct. Specific. Active voice.
- BANNED WORDS: comprehensive, dive into, cutting-edge, robust, seamlessly, leverage, empower, game-changer, landscape, navigate, delve, utilize, innovative, unprecedented, paradigm, synergy, moving forward, shed light on, it remains to be seen, stakeholders, holistic, takeaway, unpack, explore
- Start with the hardest fact. First sentence names who did what.
- No passive voice. No hedging. No padded openings.
- Short sentences. Named people, specific numbers, calibers, dollar amounts.

TITLE RULE — MANDATORY:
- NEVER use the source title. Write a completely original DownRange headline.
- Make a gun owner STOP SCROLLING. Lead with the most specific, provocative fact.
- Use real names: courts, states, ATF rule numbers, gun models, dollar amounts, politicians.
- Formats that work: "ATF Just Lost Its Fight Over [Specific Rule]" / "New Jersey Can Now Seize Your Guns Without a Crime" / "SIG's New P365 Drops at $599 — Here's What Changed"
- Max 12 words. Active voice. Present tense preferred. Accurate — no overpromising.
- NEVER: "Everything You Need to Know", vague openers like "New Developments in...", or "Update on..."

MANDATORY ARTICLE STRUCTURE — use this exact structure, not the source's:

<h2>[Original headline — state the key fact in DownRange's own words]</h2>
<p>[Lead paragraph: the essential who/what/when/where in 80-100 words. Key facts only, original phrasing.]</p>

<h2>Key Details</h2>
<p>[2-3 specific facts, numbers, or developments from the event. Bullet points allowed. 80-120 words.]</p>

<h2>Why It Matters for Gun Owners</h2>
<p>[Practical impact. What does this mean for someone who carries, competes, or collects? Which states, which guns, what to do. 100-130 words. ORIGINAL ANALYSIS — not from source.]</p>

<h2>DownRange Analysis</h2>
<p>[Original DownRange perspective. Does this survive Bruen scrutiny? Market implications? What should a gun owner actually do right now? 80-110 words. Pure original commentary.]</p>

REQUIREMENTS:
- 500-800 words total. Concise, not padded to fill space.
- HTML ONLY: h2, p, strong, em, ul, li, a. No div, span, br.
- strong = names, bill numbers, key facts only.
- The article must read as ORIGINAL CONTENT, not a rephrasing of the source.

SOURCE FACTS (extract facts from this — do NOT reproduce the writing):
Title: ${item.title}
Source: ${item.source || 'Unknown'}
Published: ${item.publishedAt || new Date().toISOString()}
Key facts to report: ${inputContent}

Return ONLY valid JSON:
{
  "title": "ORIGINAL DownRange headline — NOT the source title. Specific, active, click-worthy, max 12 words.",
  "summary": "2-3 sentences. Key facts in original language. Max 300 chars. No AI phrases.",
  "body": "<full HTML article in the structure above>",
  "category": "one of: breaking|news|law|industry|opinion|training|deals — STRICT RULES: use 'deals' ONLY for articles primarily about a product sale, discount, price drop, coupon, rebate, or limited-time price offer. Court cases, legislation, product announcements, reviews, history pieces, and company news are NEVER deals even if they mention a price.",
  "urgencyScore": 1-10,
  "tags": ["4-8 kebab-case tags"],
  "relatedStates": ["state abbreviations"],
  "isBreaking": false
}
Start with { end with }. No markdown fences.`
  try {
    const text = await callAIText({ prompt, useCase: 'news', maxTokens: 1500 })
    // Strip markdown fences and extract JSON robustly
    let clean = text.split('```json').join('').split('```').join('').trim()
    // If response starts with prose before JSON, extract the JSON object
    const jsonStart = clean.indexOf('{')
    const jsonEnd   = clean.lastIndexOf('}')
    if (jsonStart > 0 && jsonEnd > jsonStart) {
      clean = clean.slice(jsonStart, jsonEnd + 1)
    }
    const parsed = JSON.parse(clean)
    // Ensure body is a string
    if (typeof parsed.body !== 'string') parsed.body = null
    // Validate body length — must be at least 150 words to be usable
    // (short-but-complete articles are valid; only discard truly empty/placeholder responses)
    if (parsed.body) {
      const wordCount = parsed.body.replace(/<[^>]+>/g,' ').split(/\s+/).filter(Boolean).length
      if (wordCount < 150) {
        console.warn(`[REWRITE] Body too short (${wordCount} words) for "${(item.title||'').slice(0,50)}" — discarding`)
        parsed.body = null
      }
    }
    // Attribution is rendered by the page component — not baked into body HTML
    return parsed
  } catch (err) {
    console.error('Claude rewrite error:', err.message)
    // Return null body so backfill-articles cron can retry with AI later
    return null
  }
}

// ── CLAUDE LAW ENRICHER ────────────────────────────────────────────────
async function enrichLawWithClaude(bill) {
  const prompt = `Analyze this firearms bill or law for DownRange gun owners. No AI phrases. No "comprehensive", "landmark", "significant development", "it remains to be seen", or padded language. Write like a gun owner who reads case law.

Produce a JSON response with:
- summary: 4-6 direct sentences. What the bill does, who sponsored it, current status, what it means for gun owners in plain terms. Include bill number, sponsor name, committee, vote counts if known. First sentence states the bottom line.
- impact: one of: HIGH, MED, LOW
- analysis: 2-3 sentences. Does this survive Bruen/Heller scrutiny? What circuit, what timeline? State a conclusion — do not hedge.

Bill data:
Title: ${bill.title}
Number: ${bill.billNumber || 'N/A'}
Status: ${bill.status}
State: ${bill.state || 'Federal'}
Level: ${bill.level}
Current summary: ${bill.summary || 'None'}
Last action: ${bill.lastActionText || bill.lastActionDate || 'Unknown'}

Return ONLY valid JSON, no markdown, no explanation.`

  try {
    const text = await callAIText({ prompt, useCase: 'laws', maxTokens: 400 })  // COST: laws tier
    const clean = text.split('```json').join('').split('```').join('').trim()
    return JSON.parse(clean)
  } catch (err) {
    console.error('Claude law enrichment error:', err.message)
    return { summary: bill.summary, impact: 'MED', analysis: '' }
  }
}

// ── DEDUPLICATION ─────────────────────────────────────────────────────
const seenHashes = new Set()
// Sanity-backed dedup: titles and URLs we've seen across cron cycles.
// NOTE: this cache lives in module scope, which on Vercel persists across
// multiple invocations of the same warm serverless instance. Previously it
// only loaded once (loaded=true forever), so a warm instance handed several
// consecutive 15-min cron runs would keep using an increasingly stale view —
// missing articles that genuinely published elsewhere in the meantime, and
// causing runs to report "all items deduped" even when new content existed.
// Fix: expire and reload every 10 minutes, well under the 15-min cron interval,
// so each run sees what was actually published since the cache last refreshed.
const DEDUP_TTL_MS = 10 * 60 * 1000
const _sanityDedup = { urls: new Set(), titles: new Set(), loaded: false, loadedAt: 0 }

async function loadSanityDedup() {
  if (_sanityDedup.loaded && (Date.now() - _sanityDedup.loadedAt) < DEDUP_TTL_MS) return
  try {
    // Use a fast count + recent-first approach instead of loading ALL articles
    // Only load last 2000 articles — anything older won't appear in RSS feeds anyway
    // newsArticle only — gunDeal URLs are completely different domains (gun.deals, brownells,
    // etc.) and were causing 300+ false-positive dedup hits. Deals run via their own cron.
    const query = encodeURIComponent(
      `*[_type == "newsArticle" && _createdAt > $since] | order(_createdAt desc)[0...2000]{ "u": externalUrl, "t": title, "c": _createdAt }`
    )
    const res = await fetch(
      `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/query/production?query=${query}&%24since=${encodeURIComponent(new Date(Date.now()-48*60*60*1000).toISOString())}&returnQuery=false`,
      { headers: { Authorization: `Bearer ${process.env.SANITY_API_TOKEN}` }, signal: AbortSignal.timeout(10000) }
    )
    const data = await res.json()
    // Rebuild from scratch each refresh rather than only adding, so removed/edited
    // docs don't leave phantom entries behind indefinitely.
    _sanityDedup.urls = new Set()
    _sanityDedup.titles = new Set()
    // Title dedup is kept to a 48h window — titles are often similar across outlets covering the
    // same news event, and a 7-day title window causes false-positive dedup as RSS feeds
    // continue serving old articles. URL dedup stays at 7 days since URLs are precise.
    const titleCutoff = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString()
    for (const doc of (data.result || [])) {
      if (doc.u) _sanityDedup.urls.add(doc.u.toLowerCase().replace(/\/+$/, ''))
      if (doc.t && (doc.c || '') >= titleCutoff) _sanityDedup.titles.add(doc.t.toLowerCase().slice(0, 80))
    }
    _sanityDedup.loaded = true
    _sanityDedup.loadedAt = Date.now()
    console.log(`[DEDUP] Loaded ${_sanityDedup.urls.size} URLs, ${_sanityDedup.titles.size} titles from Sanity (last 2000 articles, refreshes every ${DEDUP_TTL_MS/60000}min)`)
  } catch (e) {
    console.warn('[DEDUP] Could not load Sanity dedup cache:', e.message)
    // Don't block — continue without dedup cache rather than failing the whole feed.
    // Mark as loaded so we don't retry every item this run, but DON'T set loadedAt,
    // so the next run will retry the fetch rather than being stuck on a failed load.
    _sanityDedup.loaded = true
  }
}

export async function isSanityDuplicate(url, title) {
  await loadSanityDedup()
  const normUrl = (url || '').toLowerCase().replace(/\/+$/, '')
  const normTitle = (title || '').toLowerCase().slice(0,80)
  if (normUrl && _sanityDedup.urls.has(normUrl)) return true
  if (normTitle && _sanityDedup.titles.has(normTitle)) return true
  // Add URL to in-session cache to prevent same URL appearing twice in one run
  // Do NOT add title — different outlets legitimately cover the same news event
  // with similar titles, and we want all outlets' versions published
  if (normUrl) _sanityDedup.urls.add(normUrl)
  return false
}

function hashUrl(url) {
  return crypto.createHash('md5').update(url || '').digest('hex')
}

function isDuplicate(url) {
  const h = hashUrl(url)
  if (seenHashes.has(h)) return true
  seenHashes.add(h)
  return false
}

function resetDedup() { seenHashes.clear(); seenHashes._runId = Date.now() }

// ── DISCORD NOTIFIER ─────────────────────────────────────────────────
async function discordNotify(webhookUrl, embed) {
  if (!webhookUrl) return
  try {
    await fetch(webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ embeds: [embed] }) })
  } catch (err) {
    console.error('Discord notify error:', err.message)
  }
}

async function notifyStatus({ done, total, failed, lastFeed, cycleNum, eta }) {
  await discordNotify(process.env.DISCORD_WEBHOOK_URL, {
    title: '⚡ DownRange Agent Status',
    color: 0xC8922A,
    fields: [
      { name: 'Cycle', value: `#${cycleNum}`, inline: true },
      { name: 'Progress', value: `${done}/${total}`, inline: true },
      { name: 'Failed', value: `${failed}`, inline: true },
      { name: 'Last Feed', value: lastFeed || '—', inline: true },
      { name: 'ETA', value: eta || 'Calculating...', inline: true },
    ],
    timestamp: new Date().toISOString()
  })
}

async function notifyBreaking(item) {
  await discordNotify(process.env.DISCORD_BREAKING_WEBHOOK, {
    title: '🚨 BREAKING: ' + item.title,
    description: item.summary || item.description?.slice(0, 200),
    color: 0xB91C1C,
    fields: [
      { name: 'Score', value: `${item.urgencyScore}/10`, inline: true },
      { name: 'Source', value: item.source || 'Unknown', inline: true },
    ],
    url: item.url || item.externalUrl,
    timestamp: new Date().toISOString()
  })
}

async function notifyError(message, context = '') {
  await discordNotify(process.env.DISCORD_ERRORS_WEBHOOK, {
    title: '❌ Agent Error',
    description: message,
    color: 0xEF4444,
    fields: context ? [{ name: 'Context', value: context }] : [],
    timestamp: new Date().toISOString()
  })
}

// ── SANITY WRITER ─────────────────────────────────────────────────────
const TRUSTED_IMAGE_DOMAINS = ['cdn.sanity.io','img.youtube.com','i.ytimg.com','upload.wikimedia.org','images.unsplash.com','pexels.com']

// Parse PNG/JPEG dimensions from raw bytes — no external deps
function parseImageDimensions(buf) {
  try {
    const bytes = new Uint8Array(buf)
    if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) {
      const w = (bytes[16] << 24) | (bytes[17] << 16) | (bytes[18] << 8) | bytes[19]
      const h = (bytes[20] << 24) | (bytes[21] << 16) | (bytes[22] << 8) | bytes[23]
      return { w, h }
    }
    if (bytes[0] === 0xFF && bytes[1] === 0xD8) {
      let i = 2
      while (i < bytes.length - 9) {
        if (bytes[i] !== 0xFF) { i++; continue }
        const marker = bytes[i + 1]
        if (marker === 0xC0 || marker === 0xC1 || marker === 0xC2) {
          const h = (bytes[i + 5] << 8) | bytes[i + 6]
          const w = (bytes[i + 7] << 8) | bytes[i + 8]
          return { w, h }
        }
        const segLen = (bytes[i + 2] << 8) | bytes[i + 3]
        i += 2 + segLen
      }
    }
  } catch {}
  return null
}
function isPhotoSized(buf) {
  const dims = parseImageDimensions(buf)
  if (!dims) return true
  const { w, h } = dims
  if (w < 400) return false
  if (h > 0 && w / h > 3.5) return false
  if (h > w) return false
  return true
}

// ── TITLE-AWARE IMAGE SEARCH (Pexels → Pixabay) ──────────────────────────────
// Searches for the specific gun model/brand in the article title.
// Never falls back to generic category silhouettes.

function buildSearchQuery(title = '', category = '') {
  const t = title.toLowerCase()
  // Named handgun models
  const handgunModel = title.match(/\b(glock\s*\d+|sig\s*(?:sauer\s*)?(?:p\d{3}|m\d{3}|p365|p320|p226|p229)|colt\s*(?:python|cobra|anaconda|1911|delta\s*elite)|smith\s*(?:&|and)\s*wesson\s*(?:m&p|shield|bodyguard|\d+)|springfield\s*(?:armory\s*)?(?:hellcat|xd[sm]?|ronin|echelon|prodigy)|ruger\s*(?:lcp|lc9|sr\d+|security\s*\d+|gp100|sp101|max\s*9)|walther\s*(?:ppk|pdp|pps|q[45])|canik\s*(?:tp9|mete|rival)|kimber\s*(?:micro|pro|raptor|eclipse)|beretta\s*(?:apx|m9|92|px4)|fn\s*(?:509|five\s*seven|fns|fnx)|hk\s*(?:vp9|p30|usp|hk45|sp5)|desert\s*eagle|taurus\s*(?:g2c|g3[c]?|th9|judge|tx22)|hellcat|p365)\b/i)?.[1]
  const rifleModel = title.match(/\b(ar-?15|ar-?10|m4\s*carbine|ak-?47|ak-?74|scar\s*(?:16|17|20)|m1a|mini-?14|ruger\s*pc\s*carbine|sub-?2000|mpx|mcx|rattler|honey\s*badger|cz\s*(?:bren|scorpion)|steyr\s*aug|kel-?tec\s*(?:sub|rdb|p15)|kriss\s*vector|fn\s*(?:scar|fal|p90)|hk\s*(?:416|g36|mp5|sp5)|sig\s*(?:mcx|mpx|rattler|cross)|barrett\s*(?:m82|m107|mrad|rec\d+)|psa\s*\w+|ddm4|dd\s*m4|bcm\s*recce|lwrci\s*\w+)\b/i)?.[1]
  const shotgunModel = title.match(/\b(mossberg\s*(?:500|590|940|930|shockwave)|remington\s*(?:870|1100|v3|versa)|benelli\s*(?:m2|m4|supernova|ethos|sbe)|beretta\s*(?:a300|a400)|browning\s*(?:maxus|bps|citori|a5)|winchester\s*(?:sxp|sx4|model\s*12)|kel-?tec\s*ksg)\b/i)?.[1]
  const suppressorModel = title.match(/\b(dead\s*air\s*(?:sandman|nomad|mask|primal|wolf)|silencerco\s*(?:omega|hybrid|harvester|switchback|maxim|sparrow)|surefire\s*(?:socom|ryder)|thunder\s*beast\s*\w+|sig\s*sauer\s*srd|rugged\s*\w+|obsidian\s*45|banish\s*\w+)\b/i)?.[1]
  const opticsModel = title.match(/\b(trijicon\s*(?:acog|rmr|sro|vcog|mro)|eotech\s*(?:exps|vudu|xps)|aimpoint\s*(?:pro|comp|micro|acro)|vortex\s*(?:razor|viper|strike\s*eagle|sparc|defender)|leupold\s*(?:deltapoint|mark|vx)|nightforce\s*\w+|holosun\s*(?:\d+|eps|507|510|aems)|sig\s*(?:romeo|tango|kilo))\b/i)?.[1]

  const specificModel = handgunModel || rifleModel || shotgunModel || suppressorModel || opticsModel
  if (specificModel) {
    const cleaned = specificModel.replace(/\s+/g, ' ').trim()
    // Always append firearm type — never return bare model name.
    // "desert eagle" returns the bird. "python"/"cobra"/"viper" return snakes.
    if (suppressorModel) return `${cleaned} suppressor firearm`
    if (opticsModel)     return `${cleaned} rifle optic scope`
    if (shotgunModel)    return `${cleaned} shotgun firearm`
    if (rifleModel)      return `${cleaned} rifle firearm`
    return `${cleaned} pistol handgun firearm`
  }

  const brandMatch = title.match(/\b(glock|sig\s*sauer|smith\s*(?:&|and)\s*wesson|s&w|ruger|kimber|springfield|colt|beretta|fn\s*america|heckler\s*(?:&|and)\s*koch|hk|walther|canik|taurus|kel-?tec|mossberg|remington|benelli|winchester|browning|savage|tikka|barrett|christensen|daniel\s*defense|aero\s*precision|bcm|larue|lwrci|noveske|silencerco|dead\s*air|surefire|leupold|vortex|nightforce|trijicon|eotech|aimpoint|holosun)\b/i)?.[1]
  if (brandMatch) {
    const brand = brandMatch.replace(/\s+/g, ' ').trim()
    if (/suppressor|silencer|nfa/i.test(t)) return `${brand} suppressor firearm`
    if (/pistol|handgun|carry|edc|ccw/i.test(t)) return `${brand} pistol handgun`
    if (/rifle|carbine|ar|sbr/i.test(t)) return `${brand} rifle`
    if (/shotgun|gauge/i.test(t)) return `${brand} shotgun`
    return `${brand} firearm`
  }

  if (/suppressor|silencer|nfa/i.test(t))            return 'suppressor silencer rifle shooting'
  if (/desert\s*eagle/i.test(t))                     return 'desert eagle 50AE handgun'
  if (/concealed\s*carry|ccw|edc/i.test(t))          return 'concealed carry holster pistol'
  if (/constitutional\s*carry|permitless/i.test(t))  return 'concealed carry handgun holster'
  if (/atf\b|bureau\s*alcohol/i.test(t))             return 'ATF firearms bureau'
  if (/second\s*amend|2a\s*rights/i.test(t))         return 'second amendment gun rights'
  if (/scotus|supreme\s*court|bruen|heller/i.test(t)) return 'supreme court second amendment'
  if (/gun\s*control|ban\s*(?:on|the|guns)/i.test(t)) return 'gun control legislation firearms'
  if (/ar-?15|assault\s*(?:weapon|rifle)/i.test(t))  return 'AR-15 rifle range shooting'
  if (/9mm|handgun|pistol|semi-?auto/i.test(t))      return 'handgun pistol shooting range'
  if (/rifle|carbine|long\s*gun/i.test(t))           return 'rifle shooting range outdoors'
  if (/shotgun|12\s*gauge/i.test(t))                 return 'shotgun shooting range'
  if (/ammo|ammunition|cartridge|bullet/i.test(t))   return 'ammunition bullets firearm'
  if (/hunt|deer|elk|game\s*(?:season|animal)/i.test(t)) return 'hunting rifle outdoors'
  if (/competi|uspsa|idpa|ipsc|3.gun/i.test(t))     return 'shooting competition sport'
  if (/train|range|practice|marksmanship/i.test(t))  return 'shooting range training firearms'
  if (/military|army|marine|soldier|veteran/i.test(t)) return 'military soldier weapons training'
  if (/home\s*defense|self.?defense/i.test(t))       return 'home defense firearm shotgun'
  return 'firearm shooting range gun'
}

async function searchForImage(title, category) {
  // Try Pexels first (higher quality photography)
  const pexelsKey = process.env.PEXELS_API_KEY
  if (pexelsKey) {
    try {
      const q = buildSearchQuery(title, category)
      const res = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&orientation=landscape&size=large&per_page=5`,
        { headers: { Authorization: pexelsKey }, signal: AbortSignal.timeout(8000) }
      )
      if (res.ok) {
        const data = await res.json()
        const photo = data.photos?.find(p => p.width >= p.height) || data.photos?.[0]
        const url = photo?.src?.large2x || photo?.src?.large || photo?.src?.medium
        if (url) return url
      }
    } catch {}
  }
  // Fallback to Pixabay
  const pixabayKey = process.env.PIXABAY_API_KEY
  if (pixabayKey) {
    try {
      const q = buildSearchQuery(title, category)
      const res = await fetch(
        `https://pixabay.com/api/?key=${pixabayKey}&q=${encodeURIComponent(q)}&image_type=photo&orientation=horizontal&min_width=800&per_page=5&safesearch=true`,
        { signal: AbortSignal.timeout(8000) }
      )
      if (res.ok) {
        const data = await res.json()
        const url = data.hits?.[0]?.largeImageURL || data.hits?.[0]?.webformatURL
        if (url) return url
      }
    } catch {}
  }
  return null
}

// Extract og:image from article source page and upload to Sanity CDN
// Returns cdn.sanity.io URL or null
async function fetchAndUploadOgImage(pageUrl, articleId) {
  if (!pageUrl || !process.env.SANITY_API_TOKEN) return null
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html',
      },
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) return null
    const html = await res.text()

    // Extract og:image
    const patterns = [
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i),
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i),
      html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i),
    ]

    let imgUrl = null
    for (const m of patterns) {
      if (m?.[1]) {
        let u = m[1].trim()
        if (u.startsWith('//')) u = 'https:' + u
        if (u.startsWith('/')) { const b = new URL(pageUrl); u = b.origin + u }
        // Skip SVGs, logos, tiny images
        if (u.match(/\.(jpg|jpeg|png|webp)/i) && !u.includes('.svg') && !u.includes('logo')) {
          imgUrl = u; break
        }
      }
    }
    if (!imgUrl) return null

    // Fetch image and upload to Sanity
    const imgRes = await fetch(imgUrl, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Referer': pageUrl },
      signal: AbortSignal.timeout(10000),
    })
    if (!imgRes.ok) return null
    const buf = await imgRes.arrayBuffer()
    if (buf.byteLength < 8000) return null // skip tiny placeholders
    if (!isPhotoSized(buf)) return null    // skip logos/banners by pixel dimensions

    // Upload to Sanity CDN
    const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg'
    const filename = `article-${articleId.slice(-8)}.jpg`
    const uploadRes = await fetch(
      `https://${projectId}.api.sanity.io/v2024-01-01/assets/images/production?filename=${filename}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SANITY_API_TOKEN}`,
          'Content-Type': imgRes.headers.get('content-type') || 'image/jpeg',
        },
        body: buf,
      }
    )
    if (!uploadRes.ok) return null
    const asset = await uploadRes.json()
    return asset?.document?.url || asset?.url || null
  } catch {
    return null
  }
}
function isTrustedImage(url) {
  if (!url) return false
  return TRUSTED_IMAGE_DOMAINS.some(d => url.includes(d))
}

// ── SLUG GUARD: detect and fix hash-style slugs (type-prefix + 32hex) ──────
function isHashSlug(slug) {
  return typeof slug === 'string' && /^[a-z]+-[a-f0-9]{20,}$/.test(slug)
}

function fixSlugFromTitle(title, _id) {
  const raw = (title || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80)
  const suffix = _id ? _id.replace(/^[a-z]+-/, '').slice(0, 6) : 'fixed'
  return raw ? `${raw}-${suffix}` : `article-${suffix}`
}

async function publishToSanity(doc) {
  try {
    // ── SLUG VALIDATION: never allow hash-style slugs (type-xxxxxx...) ──
    if (doc.slug?.current && isHashSlug(doc.slug.current)) {
      const fixed = fixSlugFromTitle(doc.title || doc.sourceTitle, doc._id)
      console.warn(`[SLUG FIX] Hash slug detected on ${doc._id}: "${doc.slug.current}" → "${fixed}"`)
      doc = { ...doc, slug: { _type: 'slug', current: fixed } }
    }

    // For news articles: use createIfNotExists + patch to avoid overwriting
    // good imageUrls that were manually set by the patch-article job.
    // For other doc types (breakingAlert, etc.): still use createOrReplace.
    // Strip null/undefined AND url-type fields from createIfNotExists.
    // Sanity rejects: (1) null on url fields, (2) any field not in the deployed schema.
    // imageUrl and externalUrl are url fields handled by the patch below — exclude from create.
    const URL_FIELDS = new Set(['imageUrl', 'externalUrl'])
    const cleanDoc = Object.fromEntries(
      Object.entries(doc).filter(([k, v]) => v !== null && v !== undefined && !URL_FIELDS.has(k))
    )
    const mutations = doc._type === 'newsArticle'
      ? [
          // Create if new (preserves all fields on first write)
          { createIfNotExists: cleanDoc },
          // Only update metadata fields — never overwrite body/summary if already written
          { patch: {
              id: doc._id,
              set: {
                ...Object.fromEntries(
                  Object.entries(doc)
                    .filter(([k]) => !['_id','_type','imageUrl','body','summary','excerpt'].includes(k))
                ),
                // Include imageUrl in set only if it's a real HTTP URL
                ...(doc.imageUrl && doc.imageUrl.startsWith('http') ? { imageUrl: doc.imageUrl } : {}),
              },
              // Fill in body/summary/excerpt ONLY if missing (don't destroy backfilled content)
              setIfMissing: {
                body:    doc.body,
                summary: doc.summary,
                excerpt: doc.excerpt,
              },
          }},
          // Force-overwrite imageUrl ONLY if it's a real CDN/Wikimedia URL (never for /img/photos/ local fallbacks)
          ...(isTrustedImage(doc.imageUrl) && doc.imageUrl?.startsWith('http') ? [{ patch: { id: doc._id, set: { imageUrl: doc.imageUrl } } }] : []),
        ]
      : [{ createOrReplace: doc }]

    const _sanityR = await fetch(
      `https://${process.env.NEXT_PUBLIC_SANITY_PROJECT_ID}.api.sanity.io/v2024-01-01/data/mutate/${process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'}`,
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.SANITY_API_TOKEN}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ mutations })
      }
    )
    if (!_sanityR.ok) { const e = await _sanityR.text(); throw new Error(e) }
    return await _sanityR.json()
  } catch (err) {
    console.error('Sanity write error:', err.response?.data || err.message)
    throw err
  }
}

// ── RATE LIMITER ──────────────────────────────────────────────────────
function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function rateLimitedBatch(items, fn, delayMs = 1000) {
  const results = []
  for (const item of items) {
    try {
      results.push(await fn(item))
    } catch (err) {
      console.error('Batch item error:', err.message)
      results.push(null)
    }
    await sleep(delayMs)
  }
  return results
}

export { rewriteWithClaude, enrichLawWithClaude, hashUrl, isDuplicate, resetDedup, discordNotify, notifyStatus, notifyBreaking, notifyError, publishToSanity, sleep, rateLimitedBatch, fetchAndUploadOgImage, searchForImage }
