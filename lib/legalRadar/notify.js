// Discord alert for big radar moments. Silent no-op when the webhook is not configured.
export async function notifyDiscord(lines) {
  const url = process.env.DISCORD_WEBHOOK_ALERTS
  if (!url || !lines?.length) return false
  try {
    const r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: ('**2A Radar**\n' + lines.map(l => '• ' + l).join('\n')).slice(0, 1900) }),
      signal: AbortSignal.timeout(8000),
    })
    return r.ok
  } catch { return false }
}
