#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, re, base64

TOKEN   = os.environ.get("SANITY_TOKEN","")
GH_PAT  = os.environ.get("GH_PAT","")
PROJECT = "vbnsqnkg"
BASE    = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"}
GH_HDRS = {"Authorization": "token " + GH_PAT, "User-Agent": "curl",
           "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

def sq(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def strip_fences(text):
    if not text: return text
    # Strip ```html, ```HTML, ```, etc. at start and end
    cleaned = re.sub(r'^```[a-zA-Z]*\s*', '', text.strip())
    cleaned = re.sub(r'\s*```\s*$', '', cleaned)
    return cleaned.strip()

print("Fetching all blog posts...")
posts = sq('*[_type == "blogPost"] { _id, title, body }')
print(f"Total: {len(posts)}")

to_fix = []
for p in posts:
    body = p.get("body") or ""
    if body.strip().startswith("```"):
        to_fix.append(p)

print(f"Posts with ``` fences: {len(to_fix)}")
for p in to_fix:
    print(f"  {p['_id'][:30]} | {p.get('title','')[:50]}")

if not to_fix:
    print("Nothing to fix!")
else:
    mutations = []
    for p in to_fix:
        cleaned = strip_fences(p.get("body", ""))
        mutations.append({"patch": {"id": p["_id"], "set": {"body": cleaned}}})
    
    # Batch in groups of 50
    fixed = 0
    for i in range(0, len(mutations), 50):
        result = mutate(mutations[i:i+50])
        fixed += len(mutations[i:i+50])
        print(f"Fixed {fixed}/{len(mutations)}...")
        import time; time.sleep(0.3)
    
    print(f"\nDONE: fixed {fixed} blog posts")

output = f"Fixed {len(to_fix)} blog posts with code fence issue"
req = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/main", headers=GH_HDRS)
with urllib.request.urlopen(req) as r:
    main_sha = json.loads(r.read())["object"]["sha"]
try:
    urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs",
        data=json.dumps({"ref":"refs/heads/status-output","sha":main_sha}).encode(), headers=GH_HDRS, method="POST"), timeout=10)
except:
    urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/status-output",
        data=json.dumps({"sha":main_sha,"force":True}).encode(), headers=GH_HDRS, method="PATCH"), timeout=10)
file_sha = None
try:
    req3 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt?ref=status-output", headers=GH_HDRS)
    with urllib.request.urlopen(req3) as r: file_sha = json.loads(r.read())["sha"]
except: pass
payload = {"message":"chore: blog fix result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
