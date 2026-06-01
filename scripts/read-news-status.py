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

def slugify(text):
    text = text.lower().strip()
    text = re.sub(r'[^\w\s-]', '', text)
    text = re.sub(r'[\s_-]+', '-', text)
    text = re.sub(r'^-+|-+$', '', text)
    return text[:96]

lines = []

# Check Canada articles missing slugs
ca = sq('*[_type=="canadaContent" && type=="article" && (!defined(slug) || slug.current=="" || slug.current==null)] { _id, title }')
br = sq('*[_type=="brazilContent" && type=="artigo" && (!defined(slug) || slug.current=="" || slug.current==null)] { _id, title }')

lines.append(f"Canada articles missing slugs: {len(ca)}")
lines.append(f"Brazil articles missing slugs: {len(br)}")

mutations = []
for a in ca + br:
    if a.get('title'):
        slug = slugify(a['title'])
        mutations.append({"patch": {"id": a["_id"], "set": {"slug": {"_type": "slug", "current": slug}}}})
        lines.append(f"  Slugging: {a['_id']} → {slug}")

if mutations:
    mutate(mutations)
    lines.append(f"Applied {len(mutations)} slug patches")
else:
    lines.append("All articles already have slugs")

# Count total
ca_total = sq('count(*[_type=="canadaContent" && type=="article" && defined(slug) && slug.current!="" && slug.current!=null])')
br_total = sq('count(*[_type=="brazilContent" && type=="artigo" && defined(slug) && slug.current!="" && slug.current!=null])')
lines.append(f"\nCanada articles with slugs: {ca_total}")
lines.append(f"Brazil articles with slugs: {br_total}")

output = chr(10).join(lines)
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
payload = {"message":"chore: slug patch result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
