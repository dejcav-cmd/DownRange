// app/api/admin/setup/create-newsletter-schedule/route.js
import { client } from '@/sanity/lib/client'

export async function POST(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if already exists
    const existing = await client.fetch(
      `*[_type == "newsletterSchedule"][0]._id`
    ).catch(() => null)

    if (existing) {
      return Response.json({ 
        ok: true, 
        message: 'Newsletter schedule already exists',
        id: existing 
      })
    }

    // Create the schedule document
    const doc = {
      _type: 'newsletterSchedule',
      title: 'Daily Newsletter Schedule',
      enabled: true,
      days: ['monday', 'thursday'],
      hour: 7,
      minute: 0,
      notes: 'Default daily newsletter schedule'
    }

    const created = await client.create(doc)

    return Response.json({ 
      ok: true, 
      message: 'Newsletter schedule created successfully',
      id: created._id 
    })
  } catch (error) {
    console.error('[create-newsletter-schedule] Error:', error)
    return Response.json({ 
      error: error.message,
      details: 'This might be a permissions issue. Try creating the document manually in Sanity Studio.'
    }, { status: 500 })
  }
}
