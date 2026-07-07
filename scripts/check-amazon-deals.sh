#!/usr/bin/env bash
set -e
QUERY='*[_type=="gunDeal" && approved==true] | order(_createdAt desc) [0..49] { _id, title, price, imageUrl, externalUrl, source, store, _createdAt }'
ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")
curl -s -H "Authorization: Bearer ${SANITY_TOKEN}" \
  "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=${ENCODED}" \
  -o /tmp/deals.json
python3 scripts/check_deals_parse.py
