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

    // Fetch all subscribers (no GROQ filtering to avoid syntax issues)
    const allSubscribers = await client.fetch(`*[_type == "newsletterSubscriber"] {
      _id,
      email,
      status,
      subscribedAt,
      source,
      notes,
    }`)
    
    console.log('[subscribers GET] Retrieved all subscribers:', allSubscribers.length)

    // Filter in JavaScript (safe, predictable)
    let filtered = allSubscribers
    
    if (search) {
      const searchLower = search.toLowerCase()
      filtered = filtered.filter(sub => 
        sub.email.toLowerCase().includes(searchLower)
      )
    }
    
    if (status && status !== 'all') {
      filtered = filtered.filter(sub => sub.status === status)
    }
    
    const totalCount = filtered.length
    console.log('[subscribers GET] Filtered count:', totalCount)

    // Sort
    const sortField = sort === 'email' ? 'email' : 'subscribedAt'
    filtered.sort((a, b) => {
      const aVal = a[sortField]
      const bVal = b[sortField]
      const cmp = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return order === 'asc' ? cmp : -cmp
    })

    // Paginate
    const subscribers = filtered.slice(page * limit, (page + 1) * limit)
    console.log('[subscribers GET] Paginated results:', subscribers.length)

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
