export const dynamic = 'force-dynamic'
export const maxDuration = 120

/**
 * POST /api/outreach/import
 * Accepts multipart/form-data with a CSV file.
 * Detects columns automatically and maps to outreachContact fields.
 * Deduplicates by email before saving.
 */

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) { return req.headers.get('x-admin-key') === process.env.ADMIN_KEY }

// Column name aliases — maps CSV header variations to our field names
const COL_MAP = {
  name:        ['name','business name','business_name','company','shop name','contact name','full name','channel name'],
  firstName:   ['first name','first_name','firstname','fname'],
  email:       ['email','email address','e-mail'],
  phone:       ['phone','telephone','tel','phone number'],
  city:        ['city'],
  state:       ['state','st'],
  zip:         ['zip','zip code','postal code','zipcode'],
  website:     ['website','url','web','site'],
  youtubeUrl:  ['youtube','youtube url','youtube channel','channel url'],
  subscribers: ['subscribers','subs','subscriber count'],
  instagram:   ['instagram','ig'],
  twitter:     ['twitter','x','twitter handle'],
  fflLicense:  ['ffl','ffl license','ffl number','license number'],
  notes:       ['notes','note','comments'],
  type:        ['type','contact type','category'],
}

function detectColumn(headers, fieldName) {
  const aliases = COL_MAP[fieldName] || [fieldName]
  return headers.findIndex(h => aliases.some(a => h.toLowerCase().trim() === a.toLowerCase()))
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (!lines.length) return []

  // Parse header
  const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim())

  // Map column indices
  const colIdx = {}
  for (const field of Object.keys(COL_MAP)) {
    colIdx[field] = detectColumn(headers, field)
  }

  const rows = []
  for (const line of lines.slice(1)) {
    if (!line.trim()) continue
    // Handle quoted commas
    const cols = []
    let cur = '', inQuote = false
    for (const ch of line) {
      if (ch === '"') { inQuote = !inQuote }
      else if (ch === ',' && !inQuote) { cols.push(cur.trim()); cur = '' }
      else cur += ch
    }
    cols.push(cur.trim())

    const row = {}
    for (const [field, idx] of Object.entries(colIdx)) {
      if (idx >= 0 && cols[idx]) row[field] = cols[idx].replace(/^"|"$/g, '').trim()
    }
    if (row.name || row.email) rows.push(row)
  }

  return rows
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const formData = await req.formData()
    const file     = formData.get('file')
    const type     = formData.get('type') || 'gun_shop'  // default contact type
    const source   = formData.get('source') || 'csv_import'
    const dryRun   = formData.get('dryRun') === 'true'

    if (!file) return Response.json({ error: 'No file uploaded' }, { status: 400 })

    const text = await file.text()
    const rows = parseCSV(text)

    if (!rows.length) return Response.json({ error: 'No valid rows found in CSV' }, { status: 400 })

    // Preview mode — return parsed rows without saving
    if (dryRun) {
      return Response.json({
        ok: true, dryRun: true,
        rowCount: rows.length,
        preview: rows.slice(0, 5),
        columns: rows[0] ? Object.keys(rows[0]) : [],
      })
    }

    // Save to Sanity
    let created = 0, skipped = 0, errors = []

    for (const row of rows) {
      try {
        // Dedup by email
        if (row.email) {
          const exists = await sanity.fetch(
            `*[_type == "outreachContact" && email == $email][0]._id`,
            { email: row.email }
          )
          if (exists) { skipped++; continue }
        }

        await sanity.create({
          _type: 'outreachContact',
          type: row.type || type,
          source,
          status: 'active',
          addedAt: new Date().toISOString(),
          ...row,
          subscribers: row.subscribers ? parseInt(row.subscribers.replace(/,/g,'')) : undefined,
        })
        created++
      } catch (err) {
        errors.push({ row: row.name || row.email, error: err.message })
      }
      await new Promise(r => setTimeout(r, 80))
    }

    return Response.json({ ok: true, total: rows.length, created, skipped, errors: errors.slice(0, 10) })
  } catch (err) {
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
