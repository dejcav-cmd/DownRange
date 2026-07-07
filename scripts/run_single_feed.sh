#!/usr/bin/env bash
set -e
FEED="${1:-reddit-deals}"
echo "Running: $FEED"
RESULT=$(curl -s --max-time 120 \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  "https://www.downrangeco.com/api/cron/$FEED")
echo "$RESULT"

# Save result
python3 - "$FEED" "$RESULT" << 'PYEOF'
import sys, json, base64, urllib.request, os
feed = sys.argv[1]
raw  = sys.argv[2]
path = f"scripts/feed-result-{feed.replace('/','-')}.txt"
pat  = os.environ.get('GH_PAT','')
if not pat: exit(0)

# Try to pretty-print JSON, fall back to raw
try:
    content = json.dumps(json.loads(raw), indent=2)
except:
    content = raw

req = urllib.request.Request(
    f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
    headers={"Authorization": f"token {pat}", "Accept": "application/vnd.github.v3+json"})
sha = ''
try:
    with urllib.request.urlopen(req) as r:
        sha = json.loads(r.read()).get('sha','')
except: pass

payload = {"message": f"chore: {feed} result [skip ci]",
           "content": base64.b64encode(content.encode()).decode(),
           "committer": {"name": "DJ Cavalcanti", "email": "dj@downrangeco.com"}}
if sha: payload["sha"] = sha

req2 = urllib.request.Request(
    f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
    method="PUT", data=json.dumps(payload).encode(),
    headers={"Authorization": f"token {pat}", "Content-Type": "application/json",
             "Accept": "application/vnd.github.v3+json"})
try:
    with urllib.request.urlopen(req2) as r: print(f"Saved to repo: {path}")
except Exception as e: print(f"Save failed: {e}")
PYEOF
