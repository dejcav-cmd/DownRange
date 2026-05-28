export const dynamic = 'force-dynamic'
import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01', useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

const DOC_ID = 'nav-visibility-config'

export async function GET(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  try {
    const doc = await sanity.fetch(`*[_id == "${DOC_ID}"][0]{hiddenItems}`)
    return Response.json({ ok: true, hiddenItems: doc?.hiddenItems || [] })
  } catch(e) {
    return Response.json({ ok: true, hiddenItems: [] })
  }
}

export async function POST(req) {
  const key = req.headers.get('x-admin-key')
  if (key !== process.env.ADMIN_KEY) return Response.json({ error: 'Unauthorized' }, { status: 401 })
  const { hiddenItems } = await req.json()
  await sanity.createOrReplace({ _id: DOC_ID, _type: 'navConfig', hiddenItems })
  return Response.json({ ok: true, hiddenItems })
}
