#!/usr/bin/env bash
set -e

QUERY='*[_type=="gunDeal" && source=="amazon"] | order(_createdAt desc) [0..9] { _id, title, price, imageUrl, externalUrl, _createdAt, tags }'
ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")

curl -s \
  -H "Authorization: Bearer ${SANITY_TOKEN}" \
  "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=${ENCODED}" \
  -o /tmp/deals.json

python3 - << 'PYEOF'
import json

with open('/tmp/deals.json') as f:
    data = json.load(f)

items = data.get('result', [])
print(f"Total Amazon deals: {len(items)}")
for item in items:
    url   = item.get('externalUrl', '')
    img   = item.get('imageUrl') or '(none)'
    title = (item.get('title') or '')[:60]
    price = item.get('price', '?')
    tags  = item.get('tags', [])
    asin  = next((t for t in tags if t.startswith('asin:')), '—')
    flag  = 'OK' if 'downrangeco-20' in url else '*** MISSING TAG ***'
    print(f"\n  {asin}")
    print(f"  title:    {title}")
    print(f"  price:    {price}")
    print(f"  imageUrl: {img[:100]}")
    print(f"  affiliate:{flag}")
PYEOF

python3 scripts/save_diag.py 2>/dev/null || true
