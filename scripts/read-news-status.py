#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

TOKEN   = os.environ.get("SANITY_TOKEN","")
GH_PAT  = os.environ.get("GH_PAT","")
PROJECT = "vbnsqnkg"
BASE    = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": "Bearer " + TOKEN}
GH_HDRS = {"Authorization": "token " + GH_PAT, "User-Agent": "curl",
           "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

def sq(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

# Find the Canada Gun Rights News article
a = sq('*[_type=="canadaContent" && title match "Canada Gun Rights*Week*June*"][0]{_id,title,body,type,source,publishedAt,active}')
if not a:
    a = sq('*[_type=="canadaContent" && title match "*Canada Gun Rights*"] | order(publishedAt desc) [0]{_id,title,body,type,source,publishedAt,active}')
if not a:
    a = sq('*[_type=="canadaContent"] | order(publishedAt desc) [0]{_id,title,body,type,source,publishedAt,active}')

output = json.dumps(a, indent=2) if a else "NOT FOUND"
print(output)

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
payload = {"message":"chore: fetch canada article","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("WRITTEN")
