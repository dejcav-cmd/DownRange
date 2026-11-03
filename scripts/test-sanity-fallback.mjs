// Validates the CDN read wrapper `rf`: uses CDN on success, falls back to token client on failure.
import assert from 'node:assert/strict'
const mod = await import('../sanity/lib/client.js')
const { rf, readClient, client } = mod
let cdnCalls = 0, apiCalls = 0
const origCdn = readClient.fetch.bind(readClient), origApi = client.fetch.bind(client)

// 1) success path: CDN answers, token client never called
readClient.fetch = async () => { cdnCalls++; return ['cdn'] }
client.fetch = async () => { apiCalls++; return ['api'] }
assert.deepEqual(await rf('q', {}), ['cdn'])
assert.equal(cdnCalls, 1); assert.equal(apiCalls, 0)

// 2) failure path: CDN throws, falls back to token client
readClient.fetch = async () => { cdnCalls++; throw new Error('403') }
assert.deepEqual(await rf('q', {}, { next: { revalidate: 5 } }), ['api'])
assert.equal(apiCalls, 1)

// 3) both fail: error propagates (same behaviour as before the change)
client.fetch = async () => { throw new Error('boom') }
await assert.rejects(() => rf('q'), /boom/)

// 4) options are forwarded
let seen
readClient.fetch = async (q, p, o) => { seen = o; return [] }
await rf('q', {}, { next: { revalidate: 9 } })
assert.deepEqual(seen, { next: { revalidate: 9 } })
console.log('FALLBACK TESTS PASSED')
