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

lines = []

slug = "the-mac-ix-review-an-mp5-alternative-most-shooters-can-actually-afford"
a = sq('*[_type=="newsArticle" && slug.current=="' + slug + '"][0]{_id,title,imageUrl,externalUrl,editorLocked}')
lines.append("=== MAC IX ARTICLE ===")
if a:
    lines.append("  _id:         " + str(a.get("_id")))
    lines.append("  imageUrl:    [" + repr(a.get("imageUrl")) + "]")
    lines.append("  externalUrl: " + str(a.get("externalUrl","")))
    lines.append("  locked:      " + str(a.get("editorLocked")))
else:
    lines.append("  NOT FOUND")

q2 = '*[_type=="newsArticle" && defined(imageUrl) && imageUrl != null && imageUrl != "" && !string::startsWith(imageUrl,"/img/photos/") && !string::startsWith(imageUrl,"https://cdn.sanity.io") && !string::startsWith(imageUrl,"https://img.youtube.com") && !string::startsWith(imageUrl,"https://i.ytimg.com")] | order(publishedAt desc) [0...10] {_id,title,imageUrl}'
broken = sq(q2)
lines.append("")
lines.append("=== EXTERNAL imageUrls (sample 10) ===")
for x in broken:
    lines.append("  [" + str(x.get("imageUrl",""))[:90] + "]")
    lines.append("    " + str(x.get("title",""))[:60])

q3 = 'count(*[_type=="newsArticle" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])'
null_count = sq(q3)
lines.append("")
lines.append("=== NULL/EMPTY imageUrl count: " + str(null_count) + " ===")

q4 = 'count(*[_type=="newsArticle" && defined(imageUrl) && imageUrl != null && imageUrl != "" && !string::startsWith(imageUrl,"/img/photos/") && !string::startsWith(imageUrl,"https://cdn.sanity.io") && !string::startsWith(imageUrl,"https://img.youtube.com") && !string::startsWith(imageUrl,"https://i.ytimg.com")])'
ext_count = sq(q4)
lines.append("=== EXTERNAL (non-CDN) imageUrl count: " + str(ext_count) + " ===")

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
payload = {"message":"chore: mac ix diag","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
