#!/usr/bin/env bash
set -e

echo "Querying Sanity for Amazon deals..."

QUERY='*[_type=="gunDeal" && source=="amazon"] | order(_createdAt desc) [0..9] { _id, title, price, store, externalUrl, _createdAt, tags }'
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
print(f"Total Amazon deals in Sanity: {len(items)}")
print()
for item in items:
    url = item.get('externalUrl', '')
    tags = item.get('tags', [])
    asin = next((t for t in tags if t.startswith('asin:')), 'no-asin')
    has_tag = 'downrangeco-20' in url
    added = item.get('_createdAt', '?')[:16]
    store = item.get('store', '?')
    title = (item.get('title') or '')[:60]
    price = item.get('price', '?')
    flag = 'OK' if has_tag else 'MISSING_TAG'
    print(f"  [{store}] {title}")
    print(f"    price={price}  {asin}  affiliate={flag}  added={added}")
    print()
PYEOF
