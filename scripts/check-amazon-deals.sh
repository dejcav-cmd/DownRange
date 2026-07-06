#!/usr/bin/env bash
set -e

echo "=== Querying Sanity for Amazon deals ==="

QUERY='*[_type=="gunDeal" && source=="amazon"] | order(_createdAt desc) [0..9] { _id, title, price, store, externalUrl, _createdAt, tags }'
ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")

RESULT=$(curl -s \
  -H "Authorization: Bearer ${SANITY_TOKEN}" \
  "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=${ENCODED}")

python3 << PYEOF
import json, sys

data = json.loads('''${RESULT}'''.replace("'", "\\'"))
items = data.get('result', [])
print(f"Total Amazon deals in Sanity: {len(items)}")
print()
for item in items:
    url = item.get('externalUrl','')
    tags = item.get('tags',[])
    asin = next((t for t in tags if t.startswith('asin:')),'—')
    has_tag = 'downrangeco-20' in url
    added = item.get('_createdAt','?')[:16]
    print(f"  [{item.get('store','?'):<28}] {item.get('title','?')[:55]:<55}")
    print(f"   price={item.get('price','?'):<10} {asin:<20} affiliate_tag={'✓' if has_tag else '✗ MISSING!'} added={added}")
    print()
PYEOF
