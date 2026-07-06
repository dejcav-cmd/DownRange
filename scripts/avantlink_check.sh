#!/usr/bin/env bash
set -e
UA="Mozilla/5.0 (compatible; AvantLinkDebug/1.0)"
OUT=scripts/avantlink_check_result.txt
: > "$OUT"

check() {
  local url="$1"
  echo "==================================================" >> "$OUT"
  echo "URL: $url" >> "$OUT"
  code=$(curl -s -o /tmp/page.html -w "%{http_code}" -L -A "$UA" "$url" || echo "ERR")
  echo "HTTP: $code" >> "$OUT"
  echo "bytes: $(wc -c < /tmp/page.html)" >> "$OUT"
  echo "-- avantlink lines --" >> "$OUT"
  grep -in "avantlink" /tmp/page.html >> "$OUT" || echo "(none found)" >> "$OUT"
  echo "-- <head> excerpt (first 60 lines of head) --" >> "$OUT"
  awk 'BEGIN{h=0} /<head/{h=1} h{print} /<\/head>/{exit}' /tmp/page.html | head -60 >> "$OUT"
  echo "" >> "$OUT"
}

check "https://www.downrangeco.com/"
check "https://downrangeco.com/"
check "https://www.downrangeco.com/avantlink-verify"

echo "done at $(date -u)" >> "$OUT"
cat "$OUT"
