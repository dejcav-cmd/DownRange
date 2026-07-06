#!/usr/bin/env bash
set -e

RESULT=$(curl -s --max-time 70 \
  -H "x-admin-key: ${ADMIN_KEY}" \
  "https://www.downrangeco.com/api/admin/amazon-diag")

echo "$RESULT" | python3 - << 'PYEOF'
import json, sys, os

raw = sys.stdin.read()
with open('/tmp/diag.json','w') as f: f.write(raw)

d = json.loads(raw)
print(f"Total time: {d.get('ms','?')}ms")
print()
for key in ['without_filter','with_filter']:
    r = d.get(key, {})
    print(f"=== {key} ===")
    print(f"  HTTP: {r.get('httpStatus','?')}  htmlLength: {r.get('htmlLength','?')}  error: {r.get('error','none')}")
    print(f"  ASINs found: {r.get('totalAsins','?')}  samples: {r.get('asins',[][:5])}")
    sigs = r.get('dealSignals',{})
    print(f"  Deal signals: {sigs}")
    print(f"  Any deal signal: {r.get('anyDealSignal','?')}")
    print(f"  HTML start: {r.get('htmlStart','')[:100]}")
    print(f"  Sample ASIN block: {r.get('sampleBlock','')[:200]}")
    print()
PYEOF

# Write result to repo via GitHub Contents API
python3 - << 'PYEOF'
import json, base64, urllib.request, os

with open('/tmp/diag.json') as f:
    content = f.read()

pat = os.environ.get('GH_PAT','')
if not pat:
    print("No GH_PAT")
    exit(0)

repo = "dejcav-cmd/DownRange"
path = "scripts/amazon-diag-result.txt"

req = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/contents/{path}",
    headers={"Authorization": f"token {pat}", "Accept": "application/vnd.github.v3+json"}
)
sha = ''
try:
    with urllib.request.urlopen(req) as resp:
        sha = json.loads(resp.read()).get('sha','')
except: pass

payload = {
    "message": "chore: amazon diag result [skip ci]",
    "content": base64.b64encode(content.encode()).decode(),
    "committer": {"name": "DJ Cavalcanti", "email": "dj@downrangeco.com"}
}
if sha: payload["sha"] = sha

req2 = urllib.request.Request(
    f"https://api.github.com/repos/{repo}/contents/{path}",
    method="PUT", data=json.dumps(payload).encode(),
    headers={"Authorization": f"token {pat}", "Content-Type": "application/json",
             "Accept": "application/vnd.github.v3+json"}
)
try:
    with urllib.request.urlopen(req2) as resp:
        print("Diag result written to repo")
except Exception as e:
    print(f"Write failed: {e}")
PYEOF
