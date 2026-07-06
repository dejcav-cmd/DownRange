#!/usr/bin/env bash
set -e

BRAND="${1:-}"   # optional: pass brand id to test single brand
URL="https://www.downrangeco.com/api/cron/amazon-brands"
if [ -n "$BRAND" ]; then
  URL="${URL}?brand=${BRAND}"
fi

echo "Triggering: $URL"

response=$(curl -s -w "\n%{http_code}" \
  --max-time 290 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "$URL")

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n -1)

echo "HTTP $http_code"
echo "$body"

if [ "$http_code" != "200" ]; then
  echo "FAILED — HTTP $http_code"
  exit 1
fi

echo "SUCCESS"
