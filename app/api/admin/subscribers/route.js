// app/api/admin/subscribers/route.js
import { client } from '@/sanity/lib/client'

export async function GET(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    console.log('[subscribers GET] adminKey present:', !!adminKey, 'ADMIN_KEY set:', !!process.env.ADMIN_KEY)
    
    if (adminKey !== process.env.ADMIN_KEY) {
      console.log('[subscribers GET] Auth failed')
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const page = parseInt(searchParams.get('page') || '0')
    const limit = parseInt(searchParams.get('limit') || '50')
    const sort = searchParams.get('sort') || 'subscribedAt'
    const order = searchParams.get('order') || 'desc'

    console.log('[subscribers GET] Fetching with params:', { search, status, page, limit, sort, order })

    // Build base query - GROQ safe
    let baseQuery = '*[_type == "newsletterSubscriber"'
    
    if (search) {
      // Use string::startsWith instead of match with wildcards
      const searchLower = search.toLowerCase()
      baseQuery += ` && email | startsWith("${searchLower}")`
    }
    
    if (status && status !== 'all') {
      baseQuery += ` && status == "${status}"`
    }
    
    baseQuery += ']'

    console.log('[subscribers GET] Base query:', baseQuery)

    // Get total count
    const totalCount = await client.fetch(`count(${baseQuery})`)
    console.log('[subscribers GET] Total count:', totalCount)

    // Get paginated results with proper ordering
    const sortDir = order === 'asc' ? '' : ' desc'
    const fullQuery = `${baseQuery} | order(${sort}${sortDir}) [${page * limit}...${(page + 1) * limit}] {
      _id,
      email,
      status,
      subscribedAt,
      source,
      notes,
    }`
    
    console.log('[subscribers GET] Full query:', fullQuery)
    const subscribers = await client.fetch(fullQuery)
    console.log('[subscribers GET] Retrieved subscribers:', subscribers.length)

    // Calculate stats
    const stats = await client.fetch(`{
      total: count(*[_type == "newsletterSubscriber"]),
      active: count(*[_type == "newsletterSubscriber" && status == "active"]),
      unsubscribed: count(*[_type == "newsletterSubscriber" && status == "unsubscribed"]),
      bounced: count(*[_type == "newsletterSubscriber" && status == "bounced"]),
    }`)

    console.log('[subscribers GET] Stats:', stats)

    return Response.json({
      subscribers,
      totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      stats,
    })
  } catch (error) {
    console.error('[subscribers GET] Error:', error)
    return Response.json({ error: error.message, details: error.toString() }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { email, source = 'admin', notes = '' } = await req.json()

    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return Response.json(
        { error: 'Invalid email address' },
        { status: 400 }
      )
    }

    // Check if already exists
    const existing = await client.fetch(
      `*[_type == "newsletterSubscriber" && email == $email][0]`,
      { email }
    )

    if (existing) {
      return Response.json(
        { error: 'Email already subscribed' },
        { status: 409 }
      )
    }

    // Create document
    const doc = await client.create({
      _type: 'newsletterSubscriber',
      email,
      status: 'active',
      subscribedAt: new Date().toISOString(),
      source,
      notes,
    })

    return Response.json(doc, { status: 201 })
  } catch (error) {
    console.error('Subscribers POST error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return Response.json(
        { error: 'ID parameter required' },
        { status: 400 }
      )
    }

    await client.delete(id)

    return Response.json({ success: true })
  } catch (error) {
    console.error('Subscribers DELETE error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, status, notes } = await req.json()

    if (!id) {
      return Response.json(
        { error: 'ID required' },
        { status: 400 }
      )
    }

    const updateData = {}
    if (status) updateData.status = status
    if (notes !== undefined) updateData.notes = notes

    const doc = await client.patch(id).set(updateData).commit()

    return Response.json(doc)
  } catch (error) {
    console.error('Subscribers PATCH error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }
}
