"""Test the live /api/deals endpoint to see what it returns"""
import urllib.request, json, os

ADMIN_KEY = os.environ.get('ADMIN_KEY','')
BASE = 'https://downrangeco.com'

# Hit the actual deals API endpoint
req = urllib.request.Request(f'{BASE}/api/deals', headers={'x-admin-key': ADMIN_KEY})
with urllib.request.urlopen(req, timeout=30) as r:
    data = json.loads(r.read())

deals   = data.get('deals', [])
sources = data.get('sources', {})
total   = data.get('total', 0)

with_img = sum(1 for d in deals if d.get('imageUrl'))
no_img   = sum(1 for d in deals if not d.get('imageUrl'))

lines = [
    f"=== LIVE /api/deals RESPONSE ===",
    f"Total deals: {total}",
    f"Sources: {sources}",
    f"With imageUrl: {with_img}",
    f"Without imageUrl: {no_img}",
    f"\nFirst 5 deals:",
]
for d in deals[:5]:
    lines.append(f"  [{d.get('source','')}] {d.get('title','')[:50]}")
    lines.append(f"    imageUrl: {d.get('imageUrl') or 'NULL'}")

result = '\n'.join(lines)
print(result)
with open('scripts/deals-api-test.txt','w') as f:
    f.write(result+'\n')
