// lib/mailerLite.js
// MailerLite v2 (new API) helper — connect.mailerlite.com
// ENV: MAILERLITE_API_KEY, MAILERLITE_GROUP_ID

const BASE = 'https://connect.mailerlite.com/api'

function headers() {
  return {
    'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

/**
 * Add or update a subscriber and assign them to the DownRange group.
 * @param {string} email
 * @param {object} [fields] - optional MailerLite fields, e.g. { name }
 * @returns {Promise<object>} subscriber data
 */
export async function mlSubscribe(email, fields = {}) {
  const body = {
    email: email.toLowerCase().trim(),
    status: 'active',
    groups: process.env.MAILERLITE_GROUP_ID ? [process.env.MAILERLITE_GROUP_ID] : [],
  }
  if (fields.name) body.fields = { name: fields.name }

  const res = await fetch(`${BASE}/subscribers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify(body),
  })

  const json = await res.json()
  if (!res.ok) throw new Error(json?.message || `MailerLite subscribe failed: ${res.status}`)
  return json.data
}

/**
 * Unsubscribe (set status = unsubscribed) for an email.
 * Looks up subscriber by email first, then patches status.
 * @param {string} email
 * @returns {Promise<void>}
 */
export async function mlUnsubscribe(email) {
  const emailLower = email.toLowerCase().trim()

  // Look up by email
  const lookupRes = await fetch(`${BASE}/subscribers/${encodeURIComponent(emailLower)}`, {
    headers: headers(),
  })

  if (lookupRes.status === 404) return // already gone, nothing to do
  if (!lookupRes.ok) {
    const json = await lookupRes.json().catch(() => ({}))
    throw new Error(json?.message || `MailerLite lookup failed: ${lookupRes.status}`)
  }

  const { data: subscriber } = await lookupRes.json()

  // Patch status to unsubscribed
  const patchRes = await fetch(`${BASE}/subscribers/${subscriber.id}`, {
    method: 'PUT',
    headers: headers(),
    body: JSON.stringify({ status: 'unsubscribed' }),
  })

  if (!patchRes.ok) {
    const json = await patchRes.json().catch(() => ({}))
    throw new Error(json?.message || `MailerLite unsubscribe failed: ${patchRes.status}`)
  }
}

/**
 * Fetch all active subscribers in the DownRange group (handles pagination).
 * @returns {Promise<Array<{email: string, id: string}>>}
 */
export async function mlGetGroupSubscribers() {
  const groupId = process.env.MAILERLITE_GROUP_ID
  if (!groupId) throw new Error('MAILERLITE_GROUP_ID not set')

  const subscribers = []
  let cursor = null

  do {
    const url = new URL(`${BASE}/groups/${groupId}/subscribers`)
    url.searchParams.set('filter[status]', 'active')
    url.searchParams.set('limit', '1000')
    if (cursor) url.searchParams.set('cursor', cursor)

    const res = await fetch(url.toString(), { headers: headers() })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      throw new Error(json?.message || `MailerLite group fetch failed: ${res.status}`)
    }

    const json = await res.json()
    subscribers.push(...(json.data || []))
    cursor = json.meta?.next_cursor || null
  } while (cursor)

  return subscribers
}

/**
 * Get subscriber count for the DownRange group.
 * @returns {Promise<number>}
 */
export async function mlGetGroupCount() {
  const groupId = process.env.MAILERLITE_GROUP_ID
  if (!groupId) return 0

  const res = await fetch(`${BASE}/groups/${groupId}`, { headers: headers() })
  if (!res.ok) return 0

  const { data } = await res.json()
  return data?.active_count ?? 0
}
