// lib/mailerLite.js
// MailerLite v2 (new API) helper — connect.mailerlite.com
// ENV: MAILERLITE_API_KEY, MAILERLITE_GROUP_ID (optional — falls back to name lookup)

const BASE = 'https://connect.mailerlite.com/api'
const DOWNRANGE_GROUP_NAME = 'DownRange'

function headers() {
  return {
    'Authorization': `Bearer ${process.env.MAILERLITE_API_KEY}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
}

// In-memory cache so we only look up the group ID once per cold start
let _resolvedGroupId = null

/**
 * Returns the DownRange group ID.
 * Uses MAILERLITE_GROUP_ID env var if set; otherwise searches by name "DownRange".
 * Result is cached for the lifetime of the server instance.
 */
async function resolveGroupId() {
  if (_resolvedGroupId) return _resolvedGroupId

  // Prefer explicit env var
  if (process.env.MAILERLITE_GROUP_ID) {
    _resolvedGroupId = process.env.MAILERLITE_GROUP_ID
    return _resolvedGroupId
  }

  // Fall back to name lookup
  const res = await fetch(`${BASE}/groups?limit=100`, { headers: headers() })
  if (!res.ok) {
    const json = await res.json().catch(() => ({}))
    throw new Error(json?.message || `MailerLite group list failed: ${res.status}`)
  }

  const { data: groups } = await res.json()
  const match = groups.find(g => g.name.toLowerCase() === DOWNRANGE_GROUP_NAME.toLowerCase())
  if (!match) {
    throw new Error(`MailerLite group "${DOWNRANGE_GROUP_NAME}" not found. Create it at connect.mailerlite.com or set MAILERLITE_GROUP_ID.`)
  }

  _resolvedGroupId = match.id
  console.log(`[mailerLite] Resolved group "${DOWNRANGE_GROUP_NAME}" → id: ${_resolvedGroupId}`)
  return _resolvedGroupId
}

/**
 * Add or update a subscriber and assign them to the DownRange group.
 * @param {string} email
 * @param {object} [fields] - optional MailerLite fields, e.g. { name }
 * @returns {Promise<object>} subscriber data
 */
export async function mlSubscribe(email, fields = {}) {
  const groupId = await resolveGroupId()

  const body = {
    email: email.toLowerCase().trim(),
    status: 'active',
    groups: [groupId],
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

  const lookupRes = await fetch(`${BASE}/subscribers/${encodeURIComponent(emailLower)}`, {
    headers: headers(),
  })

  if (lookupRes.status === 404) return // already gone
  if (!lookupRes.ok) {
    const json = await lookupRes.json().catch(() => ({}))
    throw new Error(json?.message || `MailerLite lookup failed: ${lookupRes.status}`)
  }

  const { data: subscriber } = await lookupRes.json()

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
  const groupId = await resolveGroupId()

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
 * Get active subscriber count for the DownRange group.
 * @returns {Promise<number>}
 */
export async function mlGetGroupCount() {
  try {
    const groupId = await resolveGroupId()
    const res = await fetch(`${BASE}/groups/${groupId}`, { headers: headers() })
    if (!res.ok) return 0
    const { data } = await res.json()
    return data?.active_count ?? 0
  } catch {
    return 0
  }
}
