#!/usr/bin/env node
const TOKEN = process.env.SANITY_TOKEN
const PROJECT = 'vbnsqnkg'
const BASE = `https://${PROJECT}.api.sanity.io/v2024-01-01/data`

async function query(q) {
  const url = `${BASE}/query/production?query=${encodeURIComponent(q)}`
  const r = await fetch(url, { headers: { Authorization: `Bearer ${TOKEN}` } })
  if (!r.ok) throw new Error(`GROQ ${r.status}: ${await r.text()}`)
  return (await r.json()).result
}

async function mutate(mutations) {
  const r = await fetch(`${BASE}/mutate/production?returnIds=false`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ mutations })
  })
  if (!r.ok) throw new Error(`Mutate ${r.status}: ${await r.text()}`)
  return r.json()
}

function strip(body) {
  if (!body) return { out: body, changed: false }
  let out = body
  out = out.replace(/<p[^>]*>[^<]*[Ss]ource:[^<]*[Vv]isit the original[^<]*<\/p>/gi, '')
  out = out.replace(/<p[^>]*>[^<]*[Ss]ource:[^<]*[Bb]earing Arms[^<]*<\/p>/gi, '')
  out = out.replace(/<p[^>]*>\s*<em>[^<]*[Ss]ource:[^<]*<\/em>\s*<\/p>/gi, '')
  out = out.replace(/\n?<p[^>]*>[^<]*visit the original[^<]*article[^<]*<\/p>/gi, '')
  out = out.replace(/\n?Source:[^\n]*visit the original[^\n]*/gi, '')
  out = out.replace(/\n?Source:[^\n]*[Bb]earing Arms[^\n]*/gi, '')
  out = out.trim()
  return { out, changed: out !== body }
}

const docs = await query('*[_type == "newsArticle" && defined(body) && body != ""]{ _id, body }')
console.log('Total articles:', docs.length)

// Print 3 sample tails
for (let i = 0; i < Math.min(3, docs.length); i++) {
  console.log('SAMPLE', i, docs[i].body.slice(-250).replace(/\n/g,' '))
}

let patched = 0, skipped = 0
const BATCH = 50
for (let i = 0; i < docs.length; i += BATCH) {
  const batch = docs.slice(i, i + BATCH)
  const mutations = []
  for (const doc of batch) {
    const { out, changed } = strip(doc.body)
    if (changed) {
      mutations.push({ patch: { id: doc._id, set: { body: out } } })
      patched++
    } else skipped++
  }
  if (mutations.length) {
    await mutate(mutations)
    console.log('Committed batch', i, '-', i + BATCH, '(', mutations.length, 'patches)')
  }
}
console.log('DONE. Patched:', patched, '| Skipped:', skipped, '| Total:', docs.length)
