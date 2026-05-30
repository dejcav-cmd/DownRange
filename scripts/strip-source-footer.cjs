const https = require('https')

const TOKEN = process.env.SANITY_TOKEN
const PROJECT = 'vbnsqnkg'

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url)
    const options = { hostname: opts.hostname, path: opts.pathname + opts.search, headers }
    https.get(options, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0,200)}`))
        resolve(JSON.parse(data))
      })
    }).on('error', reject)
  })
}

function httpsPost(url, headers, body) {
  return new Promise((resolve, reject) => {
    const opts = new URL(url)
    const buf = Buffer.from(JSON.stringify(body))
    const options = {
      hostname: opts.hostname, path: opts.pathname + opts.search,
      method: 'POST',
      headers: { ...headers, 'Content-Length': buf.length }
    }
    const req = https.request(options, res => {
      let data = ''
      res.on('data', d => data += d)
      res.on('end', () => {
        if (res.statusCode >= 400) return reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0,300)}`))
        resolve(JSON.parse(data))
      })
    })
    req.on('error', reject)
    req.write(buf)
    req.end()
  })
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

async function main() {
  console.log('Connecting to Sanity...')
  const q = encodeURIComponent('*[_type == "newsArticle" && defined(body) && body != ""]{ _id, body }')
  const data = await httpsGet(
    `https://${PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=${q}`,
    { Authorization: `Bearer ${TOKEN}` }
  )
  const docs = data.result
  console.log('Total articles:', docs.length)

  for (let i = 0; i < Math.min(3, docs.length); i++) {
    console.log('SAMPLE TAIL', i, ':', docs[i].body.slice(-250).replace(/\n/g, ' '))
  }

  let patched = 0, skipped = 0
  const BATCH = 50
  for (let i = 0; i < docs.length; i += BATCH) {
    const batch = docs.slice(i, i + BATCH)
    const mutations = []
    for (const doc of batch) {
      const { out, changed } = strip(doc.body)
      if (changed) { mutations.push({ patch: { id: doc._id, set: { body: out } } }); patched++ }
      else skipped++
    }
    if (mutations.length) {
      await httpsPost(
        `https://${PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production?returnIds=false`,
        { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' },
        { mutations }
      )
      console.log('Committed batch', i, '-', i + BATCH, '(' + mutations.length + ' patches)')
    }
  }
  console.log('DONE. Patched:', patched, '| Skipped:', skipped, '| Total:', docs.length)
}

main().catch(e => { console.error('FATAL:', e.message); process.exit(1) })
