// app/api/admin/debug/subscribers/route.js
import { client } from '@/sanity/lib/client'

export async function GET(req) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== process.env.ADMIN_KEY) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch all types in database (will dedupe in JS)
    const allTypesRaw = await client.fetch(`*[]._type`)
    const allTypes = [...new Set(allTypesRaw)] // Dedupe in JavaScript
    console.log('All types:', allTypes)

    // Try to fetch newsletterSubscriber documents
    const subscribers = await client.fetch(`*[_type == "newsletterSubscriber"]`)
    console.log('Newsletter subscribers found:', subscribers.length)

    // Try to fetch with more details
    const subscribersDetailed = await client.fetch(`*[_type == "newsletterSubscriber"] { _id, _type, _createdAt, email, status }`)
    console.log('Detailed subscribers:', subscribersDetailed)

    // Check if documents exist at all
    const totalDocs = await client.fetch(`count(*)`)
    console.log('Total documents in database:', totalDocs)

    // Check specific query that MailingListManager uses
    const testQuery = await client.fetch(`*[_type == "newsletterSubscriber"] {
      _id,
      email,
      status,
      subscribedAt,
      source,
      notes,
    }`)
    console.log('Test query results:', testQuery.length, testQuery)

    return Response.json({
      allTypes,
      subscriberCount: subscribers.length,
      subscribers,
      subscribersDetailed,
      totalDocs,
      testQueryResults: testQuery,
      message: 'Check server logs for detailed output',
    })
  } catch (error) {
    console.error('[debug] Error:', error)
    return Response.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
