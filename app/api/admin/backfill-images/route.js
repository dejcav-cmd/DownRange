export const dynamic = 'force-dynamic'
export const maxDuration = 300

import { createClient } from '@sanity/client'
import { fetchAndUploadImage, uploadImageToSanity } from '@/lib/imageUpload.js'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

function auth(req) {
  return req.headers.get('x-admin-key') === process.env.ADMIN_KEY
}

export async function POST(req) {
  if (!auth(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const { types = ['canadaContent', 'brazilContent'], limit = 50 } = await req.json().catch(() => ({}))

  const results = []
  let fixed = 0

  for (const _type of types) {
    const docs = await sanity.fetch(
      `*[_type == $_type && defined(imageUrl) && !string::startsWith(imageUrl, "https://cdn.sanity.io")] | order(_createdAt desc) [0...$limit] { _id, title, imageUrl }`,
      { _type, limit }
    )

    for (const doc of docs) {
      const title = doc.title || ''
      const oldUrl = doc.imageUrl || ''
      const isBrazil = _type === 'brazilContent'
      const label = doc._id.slice(-8)

      // Try uploading existing URL to CDN first
      let cdnUrl = await uploadImageToSanity(oldUrl, label)

      // If that failed, fetch a new image
      if (!cdnUrl) {
        const q = title + (isBrazil ? ' Brazil firearms' : ' Canada firearms')
        cdnUrl = await fetchAndUploadImage(q, label)
      }

      if (cdnUrl) {
        await sanity.patch(doc._id).set({ imageUrl: cdnUrl }).commit()
        results.push({ id: doc._id, title: title.slice(0, 50), status: 'fixed', url: cdnUrl.slice(0, 60) })
        fixed++
      } else {
        results.push({ id: doc._id, title: title.slice(0, 50), status: 'failed' })
      }

      await new Promise(r => setTimeout(r, 300))
    }
  }

  return Response.json({ ok: true, fixed, total: results.length, results })
}
