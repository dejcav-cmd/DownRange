#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

TOKEN   = os.environ.get("SANITY_TOKEN","")
GH_PAT  = os.environ.get("GH_PAT","")
GH_HDRS = {"Authorization": f"token {GH_PAT}", "User-Agent": "curl",
           "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

# Trigger the fix-placeholder-images cron
result = None
try:
    req = urllib.request.Request(
        "https://www.downrangeco.com/api/cron/fix-placeholder-images",
        data=b"{}",
        headers={"authorization": f"Bearer {os.environ.get('CRON_SECRET','')}",
                 "x-vercel-cron": "1", "Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=290) as r:
        result = json.loads(r.read())
except Exception as e:
    result = {"error": str(e)}

print("=== FIX-PLACEHOLDER-IMAGES RESULT ===")
print(json.dumps(result, indent=2))

# Check the target article after
import time as t
t.sleep(3)

PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}"}

def sq(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

a = sq('*[_type=="newsArticle" && slug.current=="opinion-what-should-happen-to-the-atf-staff-who-wrongfully-imprisoned-adamiak"][0]{_id,title,imageUrl}')
print(f"\n=== ATF ARTICLE imageUrl AFTER FIX ===")
print(f"  {a.get('imageUrl','') if a else 'NOT FOUND'}")

remaining = sq('count(*[_type=="newsArticle" && string::startsWith(imageUrl,"/img/photos/")])')
print(f"\n=== REMAINING /img/photos/ articles: {remaining} ===")

output = json.dumps({"result": result, "atf_article_imageUrl": a.get("imageUrl","") if a else "not found", "remaining_placeholders": remaining}, indent=2)

req2 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/main", headers=GH_HDRS)
with urllib.request.urlopen(req2) as r:
    main_sha = json.loads(r.read())["object"]["sha"]

try:
    req3 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs",
        data=json.dumps({"ref":"refs/heads/status-output","sha":main_sha}).encode(), headers=GH_HDRS, method="POST")
    with urllib.request.urlopen(req3) as r: pass
except:
    req3b = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/status-output",
        data=json.dumps({"sha":main_sha,"force":True}).encode(), headers=GH_HDRS, method="PATCH")
    with urllib.request.urlopen(req3b) as r: pass

file_sha = None
try:
    req4 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt?ref=status-output", headers=GH_HDRS)
    with urllib.request.urlopen(req4) as r:
        file_sha = json.loads(r.read())["sha"]
except: pass

payload = {"message":"chore: fix result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
req5 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT")
with urllib.request.urlopen(req5) as r:
    print("STATUS WRITTEN")
