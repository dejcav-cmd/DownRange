// app/api/admin/newsletter-schedule/route.js
import { client } from '@/sanity/lib/client'

export async function GET(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch the single schedule document
    const schedule = await client.fetch(
      `*[_type == "newsletterSchedule"][0]`
    )

    if (!schedule) {
      // Create default if doesn't exist
      const defaultSchedule = {
        _type: 'newsletterSchedule',
        title: 'Daily Newsletter Schedule',
        enabled: true,
        days: ['monday', 'thursday'],
        hour: 7,
        minute: 0,
      }
      const created = await client.create(defaultSchedule)
      return Response.json(created)
    }

    return Response.json(schedule)
  } catch (error) {
    console.error('[newsletter-schedule GET] Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { enabled, days, hour, minute, notes } = await req.json()

    // Validate
    if (typeof enabled !== 'boolean' || !Array.isArray(days) || days.length === 0) {
      return Response.json(
        { error: 'Invalid schedule data' },
        { status: 400 }
      )
    }

    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return Response.json(
        { error: 'Invalid time' },
        { status: 400 }
      )
    }

    // Get existing schedule
    const existing = await client.fetch(
      `*[_type == "newsletterSchedule"][0]._id`
    )

    if (!existing) {
      return Response.json(
        { error: 'Schedule not found' },
        { status: 404 }
      )
    }

    // Update
    const updated = await client
      .patch(existing)
      .set({ enabled, days, hour, minute, notes })
      .commit()

    console.log('[newsletter-schedule PATCH] Updated:', { enabled, days, hour, minute })

    return Response.json(updated)
  } catch (error) {
    console.error('[newsletter-schedule PATCH] Error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
