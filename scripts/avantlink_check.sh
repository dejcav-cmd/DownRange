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
  echo "HTTP (after redirects): $code" >> "$OUT"
  redir=$(curl -s -o /dev/null -w "%{http_code} -> %{redirect_url}" -A "$UA" "$url" || echo "ERR")
  echo "First response: $redir" >> "$OUT"
  echo "-- authResponse token present? --" >> "$OUT"
  grep -o 'authResponse=[a-f0-9]*' /tmp/page.html >> "$OUT" || echo "(NOT FOUND)" >> "$OUT"
  echo "-- full avantlink script line --" >> "$OUT"
  grep -o '<script[^>]*avantlink[^>]*></script>' /tmp/page.html >> "$OUT" || echo "(no avantlink script tag)" >> "$OUT"
  echo "" >> "$OUT"
}

check "https://www.downrangeco.com/avantlink-verify/"
check "https://www.downrangeco.com/avantlink-verify"

echo "done at $(date -u)" >> "$OUT"
cat "$OUT"
