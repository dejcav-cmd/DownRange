#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

TOKEN    = os.environ.get("SANITY_TOKEN","")
GH_TOKEN = os.environ.get("GITHUB_TOKEN","")
REPO     = "dejcav-cmd/DownRange"

HEADERS = {"Authorization": f"Bearer {TOKEN}"}
GH_HDRS = {"Authorization": f"token {GH_TOKEN}", "User-Agent": "curl",
           "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

groq = '*[_id == "debug-news-status-latest"][0] { details }'
url  = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(groq)
req  = urllib.request.Request(url, headers=HEADERS)
with urllib.request.urlopen(req) as r:
    d      = json.loads(r.read())
    result = d.get("result") or {}
    data   = result.get("details","No data found")

print(data)

# Write to repo file so sandbox can read it via GitHub API
content_b64 = base64.b64encode(data.encode()).decode()

# Check if file exists
try:
    req2 = urllib.request.Request(
        f"https://api.github.com/repos/{REPO}/contents/scripts/news-status-output.txt",
        headers=GH_HDRS
    )
    with urllib.request.urlopen(req2) as r:
        existing = json.loads(r.read())
        file_sha = existing["sha"]
except:
    file_sha = None

payload = {"message": "chore: write news status output", "content": content_b64,
           "author": {"name": "DJ Cavalcanti", "email": "dj@downrangeco.com"}}
if file_sha:
    payload["sha"] = file_sha

req3 = urllib.request.Request(
    f"https://api.github.com/repos/{REPO}/contents/scripts/news-status-output.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"
)
with urllib.request.urlopen(req3) as r:
    print("\n[Written to repo: scripts/news-status-output.txt]")
