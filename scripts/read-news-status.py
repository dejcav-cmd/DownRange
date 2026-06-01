#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

TOKEN   = os.environ.get("SANITY_TOKEN","")
GH_PAT  = os.environ.get("GH_PAT","")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}
GH_HDRS = {"Authorization": f"token {GH_PAT}", "User-Agent": "curl",
           "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

def sq(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

lines = []

# 1. Get the specific article
a = sq('*[_type=="newsArticle" && slug.current=="opinion-what-should-happen-to-the-atf-staff-who-wrongfully-imprisoned-adamiak"][0]{_id,title,imageUrl,externalUrl,editorLocked,approved}')
lines.append("=== TARGET ARTICLE ===")
if a:
    lines.append(f"  _id:          {a.get('_id')}")
    lines.append(f"  title:        {a.get('title','')[:70]}")
    lines.append(f"  imageUrl:     {a.get('imageUrl','')}")
    lines.append(f"  externalUrl:  {a.get('externalUrl','')}")
    lines.append(f"  editorLocked: {a.get('editorLocked')}")
    lines.append(f"  approved:     {a.get('approved')}")
else:
    lines.append("  NOT FOUND")

# 2. Count articles the GROQ would pick up
count = sq('count(*[_type=="newsArticle" && approved==true && editorLocked!=true && defined(externalUrl) && string::startsWith(imageUrl,"/img/photos/")])')
lines.append(f"\n=== GROQ MATCH COUNT: {count} articles with /img/photos/ imageUrl ===")

# 3. Sample 5 of them
sample = sq('*[_type=="newsArticle" && approved==true && editorLocked!=true && defined(externalUrl) && string::startsWith(imageUrl,"/img/photos/")] | order(publishedAt desc) [0...5] {_id,title,imageUrl,externalUrl}')
lines.append("SAMPLE:")
for s in sample:
    lines.append(f"  {s.get('imageUrl',''):<30} | {s.get('externalUrl','')[:50]} | {s.get('title','')[:40]}")

# 4. Check if target article matches GROQ
if a:
    img = a.get('imageUrl','')
    ext = a.get('externalUrl','')
    locked = a.get('editorLocked')
    approved = a.get('approved')
    starts = img.startswith('/img/photos/')
    lines.append(f"\n=== WHY ARTICLE MAY BE SKIPPED ===")
    lines.append(f"  imageUrl starts with /img/photos/: {starts}")
    lines.append(f"  approved==true: {approved}")
    lines.append(f"  editorLocked!=true: {locked} (should be None/False)")
    lines.append(f"  defined(externalUrl): {bool(ext)}")
    lines.append(f"  => Would GROQ match: {starts and approved and not locked and bool(ext)}")

output = chr(10).join(lines)
print(output)

# Write to status branch
req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/main", headers=GH_HDRS)
with urllib.request.urlopen(req) as r:
    main_sha = json.loads(r.read())["object"]["sha"]

branch_payload = json.dumps({"ref":"refs/heads/status-output","sha":main_sha}).encode()
try:
    req2 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs",
        data=branch_payload, headers=GH_HDRS, method="POST")
    with urllib.request.urlopen(req2) as r: pass
except:
    req2b = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/status-output",
        data=json.dumps({"sha":main_sha,"force":True}).encode(), headers=GH_HDRS, method="PATCH")
    with urllib.request.urlopen(req2b) as r: pass

file_sha = None
try:
    req3 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt?ref=status-output", headers=GH_HDRS)
    with urllib.request.urlopen(req3) as r:
        file_sha = json.loads(r.read())["sha"]
except: pass

payload = {"message":"chore: diag status","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
req4 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT")
with urllib.request.urlopen(req4) as r:
    print("STATUS WRITTEN")
