/**
 * Image relevance check for stock photos.
 *
 * Stock search returns whatever ranks first, which once put a soccer ball on a
 * gun-releases post. Every stock image must pass this check before it is used.
 * Fail-closed: if the check cannot run, the image is rejected.
 */
const MODEL = 'claude-haiku-4-5-20251001'

function mediaType(ct, buf) {
  const c = (ct || '').toLowerCase()
  if (c.includes('png')) return 'image/png'
  if (c.includes('webp')) return 'image/webp'
  if (c.includes('gif')) return 'image/gif'
  const b = new Uint8Array(buf.slice(0, 4))
  if (b[0] === 0x89 && b[1] === 0x50) return 'image/png'
  return 'image/jpeg'
}

/**
 * True only when the image clearly shows firearms, ammunition, shooting gear,
 * a shooting range, hunting, or the legal/constitutional subject given in `topic`.
 */
export async function isOnTopicImage(buf, contentType, topic = 'firearms, ammunition, shooting or hunting') {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key || !buf || buf.byteLength < 2000 || buf.byteLength > 4_500_000) return false
  try {
    const data = Buffer.from(buf).toString('base64')
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 5,
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType(contentType, buf), data } },
            { type: 'text', text: `This image will illustrate a gun-news article about: ${topic}. Does the image clearly show firearms, ammunition, firearm accessories, a shooting range, hunting, or the article subject itself? Sports balls, people unrelated to the subject, food, generic objects and abstract art are NO. Answer with one word: YES or NO.` },
          ],
        }],
      }),
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) return false
    const d = await res.json()
    return /^\s*yes/i.test(d?.content?.[0]?.text || '')
  } catch {
    return false
  }
}

/** Download an image URL for checking. Returns { buf, contentType } or null. */
export async function downloadForCheck(url) {
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)' },
      signal: AbortSignal.timeout(12000),
    })
    if (!r.ok) return null
    return { buf: await r.arrayBuffer(), contentType: r.headers.get('content-type') || 'image/jpeg' }
  } catch {
    return null
  }
}
