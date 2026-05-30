import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: 'vbnsqnkg',
  dataset: 'production',
  apiVersion: '2024-01-01',
  useCdn: false,
  token: process.env.SANITY_TOKEN,
})

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

const docs = await sanity.fetch('*[_type == "newsArticle" && defined(body) && body != ""]{ _id, body }')
console.log('Total articles:', docs.length)

for (let i = 0; i < Math.min(3, docs.length); i++) {
  console.log('SAMPLE TAIL', i, ':', docs[i].body.slice(-300).replace(/\n/g, ' '))
}

let patched = 0, skipped = 0
const BATCH = 50
for (let i = 0; i < docs.length; i += BATCH) {
  const batch = docs.slice(i, i + BATCH)
  const tx = sanity.transaction()
  let hasWork = false
  for (const doc of batch) {
    const { out, changed } = strip(doc.body)
    if (changed) { tx.patch(doc._id, p => p.set({ body: out })); hasWork = true; patched++ }
    else skipped++
  }
  if (hasWork) { await tx.commit(); console.log('Committed batch', i, '-', i + BATCH) }
}
console.log('DONE. Patched:', patched, '| Skipped:', skipped, '| Total:', docs.length)
