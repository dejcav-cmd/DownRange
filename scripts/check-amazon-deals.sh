#!/usr/bin/env bash
set -e

QUERY='*[_type=="gunDeal" && source=="amazon"] | order(_createdAt desc) [0..9] { _id, title, price, store, externalUrl, _createdAt, tags }'
ENCODED=$(python3 -c "import urllib.parse,sys; print(urllib.parse.quote(sys.argv[1]))" "$QUERY")

curl -s \
  -H "Authorization: Bearer ${SANITY_TOKEN}" \
  "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=${ENCODED}" \
  -o /tmp/deals.json

python3 - << 'PYEOF'
import json, base64, urllib.request, os

with open('/tmp/deals.json') as f:
    data = json.load(f)

items = data.get('result', [])
lines = [f"Total Amazon deals in Sanity: {len(items)}", ""]

for item in items:
    url = item.get('externalUrl', '')
    tags = item.get('tags', [])
    asin = next((t for t in tags if t.startswith('asin:')), 'no-asin')
    has_tag = 'downrangeco-20' in url
    added = item.get('_createdAt', '?')[:16]
    store = item.get('store', '?')
    title = (item.get('title') or '')[:70]
    price = item.get('price', '?')
    flag = 'AFFILIATE_OK' if has_tag else '*** MISSING TAG ***'
    lines.append(f"[{store}] {title}")
    lines.append(f"  price={price}  {asin}  {flag}  added={added}")
    lines.append(f"  url={url[:90]}")
    lines.append("")

content = "\n".join(lines)
print(content)

# Write to repo via GitHub Contents API
pat = os.environ.get('GH_PAT','')
if not pat:
    print("No GH_PAT — skipping file write")
    exit(0)

repo = "dejcav-cmd/DownRange"
path = "scripts/amazon-check-result.txt"

# Get current file SHA if it exists
req = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/contents/{path}",
    headers={"Authorization": f"token {pat}", "Accept": "application/vnd.github.v3+json"}
)
try:
    with urllib.request.urlopen(req) as resp:
        existing = json.loads(resp.read())
        sha = existing.get('sha','')
except Exception:
    sha = ''

payload = {
    "message": "chore: amazon deals check result [skip ci]",
    "content": base64.b64encode(content.encode()).decode(),
    "committer": {"name": "DJ Cavalcanti", "email": "dj@downrangeco.com"}
}
if sha:
    payload["sha"] = sha

req2 = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/contents/{path}",
    method="PUT",
    data=json.dumps(payload).encode(),
    headers={
        "Authorization": f"token {pat}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github.v3+json"
    }
)
try:
    with urllib.request.urlopen(req2) as resp:
        result = json.loads(resp.read())
        print(f"\nFile written to repo: {result.get('content',{}).get('path','?')}")
except Exception as e:
    print(f"\nFailed to write file: {e}")
PYEOF
