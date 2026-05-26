# OpenClaw Market Analysis — Setup Guide

## What This Does
Your local OpenClaw/Ollama agent posts a daily firearms ammo market analysis to DownRange at 6:00 AM. It appears as the "Daily Market Brief" on the Market Watch page.

## Step 1: Configure the Cron Job on Your Mac Mini

Add this to your crontab (`crontab -e`):
```
0 6 * * * /usr/local/bin/node /path/to/openclaw/market-analysis.js >> /tmp/market-analysis.log 2>&1
```

## Step 2: Create the Agent Script

Save as `market-analysis.js` on your Mac Mini:

```javascript
const { Ollama } = require('ollama')

const PROMPT = `You are DownRange's ammo market analyst. Analyze today's US civilian firearms ammunition market.

Write a brief market analysis with:
1. A headline (max 10 words)
2. A 2-sentence summary of key market conditions
3. 3-5 bullet points on specific calibers (price movements, availability, buying opportunities)

Base your analysis on general market knowledge as of today. Be specific about calibers and prices.
Use this format ONLY (valid JSON, no markdown):
{
  "title": "headline here",
  "summary": "Two sentences here.",
  "bullets": ["bullet 1", "bullet 2", "bullet 3"]
}`

async function runAnalysis() {
  const ollama = new Ollama()
  
  console.log('Running market analysis with Hermes 3...')
  const response = await ollama.chat({
    model: 'hermes3',
    messages: [{ role: 'user', content: PROMPT }],
    format: 'json'
  })
  
  const analysis = JSON.parse(response.message.content)
  
  // Post to DownRange API
  const res = await fetch('https://downrangeco.com/api/market-analysis', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.CRON_SECRET}`
    },
    body: JSON.stringify({
      ...analysis,
      author: 'OpenClaw AI (Hermes 3)',
      publishedAt: new Date().toISOString()
    })
  })
  
  const result = await res.json()
  console.log('Posted:', result)
}

runAnalysis().catch(console.error)
```

## Step 3: Add CRON_SECRET to your local .env

```
CRON_SECRET=your_cron_secret_here
```

## Step 4: Test manually

```bash
CRON_SECRET=your_secret node market-analysis.js
```

The analysis will appear on downrangeco.com/market within seconds.

## Template Output Example

```json
{
  "title": "9mm Hits 18¢ Floor — Buy Now",
  "summary": "9mm Luger continues its 6-month deflationary trend, touching 18¢/round at major retailers. Supply chains have normalized post-COVID, creating the best buying environment since 2019.",
  "bullets": [
    "9mm (115gr FMJ): 18-19¢/rd at PSA, Ammo Depot — 3-year low. Stock up.",
    "5.56 NATO: Slight uptick to 32¢. NSSF reports increased range day participation driving demand.",
    "7.62x39: Constrained supply from sanctions keeping prices elevated at 28-30¢.",
    "6.5 Creedmoor: Match-grade tightening before competition season. Buy before April.",
    ".22 LR: Abundant at 7¢/rd. Best time to train and build reserves."
  ]
}
```
