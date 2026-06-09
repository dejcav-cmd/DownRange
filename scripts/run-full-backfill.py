"""
Run the deals image backfill on ALL existing gunDeal docs.
Calls the Vercel endpoint in batches until all docs have images.
"""
import urllib.request, json, os, time

ADMIN_KEY = os.environ.get('ADMIN_KEY', '')
BASE      = 'https://downrangeco.com'

def call_backfill(limit=50, force=True):
    url  = f'{BASE}/api/admin/deals-image-backfill'
    body = json.dumps({'limit': limit, 'force': force}).encode()
    req  = urllib.request.Request(url, data=body, method='POST', headers={
        'x-admin-key':   ADMIN_KEY,
        'Content-Type':  'application/json',
    })
    with urllib.request.urlopen(req, timeout=120) as r:
        return json.loads(r.read())

def sanity_count(token):
    import urllib.parse
    pid = 'vbnsqnkg'
    groq = 'count(*[_type == "gunDeal" && defined(imageUrl) && imageUrl != ""])'
    url  = f'https://{pid}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(groq)}'
    req  = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['result']

lines = ['=== DEALS IMAGE FULL BACKFILL ===']

# Run backfill - force=True so it processes ALL docs regardless of current imageUrl
print('Running backfill (force=True, limit=100)...')
try:
    result = call_backfill(limit=100, force=True)
    lines.append(f'Round 1: {result}')
    print(f'Round 1: {result}')

    # If there are still more, run again
    if result.get('failed', 0) > 0 or result.get('total', 0) >= 50:
        time.sleep(5)
        result2 = call_backfill(limit=100, force=False)  # only remaining no-image ones
        lines.append(f'Round 2: {result2}')
        print(f'Round 2: {result2}')
except Exception as e:
    lines.append(f'ERROR: {e}')
    print(f'ERROR: {e}')

# Final count from Sanity
try:
    token = os.environ.get('SANITY_TOKEN', '')
    with_img = sanity_count(token)
    lines.append(f'Final Sanity count with imageUrl: {with_img}')
    print(f'Final: {with_img} docs now have images')
except Exception as e:
    lines.append(f'Count error: {e}')

result_text = '\n'.join(lines)
with open('scripts/full-backfill-result.txt', 'w') as f:
    f.write(result_text + '\n')
print('Done. Results written to scripts/full-backfill-result.txt')
