/**
 * lib/cronReporter.js
 * Call reportCronRun() at the end of every cron route to record the result.
 */

export async function reportCronRun(jobId, { status, ms, error, details } = {}) {
  try {
    const origin = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://www.downrangeco.com'

    await fetch(`${origin}/api/admin/cron-status`, {
      method:  'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key':  process.env.ADMIN_KEY || '',
      },
      body: JSON.stringify({ jobId, status, ms, error, details }),
    })
  } catch {
    // Never let reporting fail a cron job
  }
}
