"""
1. Call the gun-deals cron endpoint
2. Query Sanity for gunDeal doc count
3. Write results to scripts/deals-status-result.txt
"""
import urllib.request, urllib.parse, json, os, subprocess

CRON_SECRET  = os.environ.get('CRON_SECRET', '')
SANITY_TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT_ID   = 'vbnsqnkg'
DATASET      = 'production'
API_VER      = '2024-01-01'

lines = []

# 1. Call the cron
try:
    req = urllib.request.Request(
        'https://downrangeco.com/api/cron/gun-deals',
        headers={'Authorization': f'Bearer {CRON_SECRET}'}
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        body = r.read().decode()
    lines.append(f'CRON RESPONSE: {body}')
except Exception as e:
    lines.append(f'CRON ERROR: {e}')

# 2. Count gunDeal docs in Sanity
try:
    groq = 'count(*[_type == "gunDeal"])'
    url  = f'https://{PROJECT_ID}.api.sanity.io/v{API_VER}/data/query/{DATASET}?query={urllib.parse.quote(groq)}'
    req  = urllib.request.Request(url, headers={
        'Authorization': f'Bearer {SANITY_TOKEN}',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())
    lines.append(f'SANITY gunDeal count: {data["result"]}')
except Exception as e:
    lines.append(f'SANITY ERROR: {e}')

result = '\n'.join(lines)
print(result)
with open('scripts/deals-status-result.txt', 'w') as f:
    f.write(result + '\n')
