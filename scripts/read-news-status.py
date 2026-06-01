#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

TOKEN   = os.environ.get("SANITY_TOKEN","")
GH_PAT  = os.environ.get("GH_PAT","")
CRON    = os.environ.get("CRON_SECRET","")
GH_HDRS = {"Authorization": "token " + GH_PAT, "User-Agent": "curl",
           "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

print("Triggering fix-placeholder-images cron...")
req = urllib.request.Request(
    "https://www.downrangeco.com/api/cron/fix-placeholder-images",
    data=b"{}",
    headers={"authorization": "Bearer " + CRON, "x-vercel-cron": "1", "Content-Type": "application/json"},
    method="POST"
)
with urllib.request.urlopen(req, timeout=290) as r:
    result = json.loads(r.read())

print(json.dumps(result, indent=2))

# Check target article
PROJECT = "vbnsqnkg"
BASE    = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": "Bearer " + TOKEN}

def sq(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

slug = "the-mac-ix-review-an-mp5-alternative-most-shooters-can-actually-afford"
a = sq('*[_type=="newsArticle" && slug.current=="' + slug + '"][0]{imageUrl}')
print("MAC IX imageUrl: " + str(a.get("imageUrl","") if a else "NOT FOUND"))

remaining = sq('count(*[_type=="newsArticle" && (!defined(imageUrl) || imageUrl==null || imageUrl=="" || string::startsWith(imageUrl,"/img/") || (!string::startsWith(imageUrl,"https://cdn.sanity.io") && !string::startsWith(imageUrl,"https://img.youtube.com") && !string::startsWith(imageUrl,"https://i.ytimg.com") && defined(imageUrl) && imageUrl != null && imageUrl != ""))])')
print("Remaining broken: " + str(remaining))

output = json.dumps({"result": result, "mac_ix": a.get("imageUrl","") if a else None, "remaining": remaining}, indent=2)

req2 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/main", headers=GH_HDRS)
with urllib.request.urlopen(req2) as r:
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
payload = {"message":"chore: image fix result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
