export const dynamic = 'force-dynamic'

import { createClient } from '@sanity/client'

const sanity = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'vbnsqnkg',
  dataset: 'production', apiVersion: '2024-01-01',
  useCdn: false, token: process.env.SANITY_API_TOKEN,
})

// GET /api/outreach/unsubscribe?email=xxx
export async function GET(req) {
  const email = new URL(req.url).searchParams.get('email')
  if (!email) return new Response('Invalid unsubscribe link.', { status: 400, headers: { 'Content-Type': 'text/html' } })

  try {
    const contact = await sanity.fetch(`*[_type == "outreachContact" && email == $email][0]._id`, { email })
    if (contact) {
      await sanity.patch(contact).set({ status: 'unsubscribed' }).commit()
    }
  } catch {}

  return new Response(`<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Unsubscribed — DownRange</title></head>
<body style="background:#09090B;color:#e5e7eb;font-family:Arial,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;">
  <div style="text-align:center;max-width:400px;padding:40px;">
    <div style="font-size:48px;margin-bottom:16px;">✅</div>
    <h1 style="font-family:Georgia,serif;color:#C8922A;margin:0 0 12px;">Unsubscribed</h1>
    <p style="color:#9ca3af;line-height:1.7;margin:0 0 24px;">
      You've been removed from DownRange outreach emails.<br>
      We respect your inbox.
    </p>
    <a href="https://www.downrangeco.com" style="color:#C8922A;text-decoration:none;font-size:13px;">← Return to DownRange</a>
  </div>
</body>
</html>`, { status: 200, headers: { 'Content-Type': 'text/html' } })
}
