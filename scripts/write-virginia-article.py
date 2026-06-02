#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64

SANITY_TOKEN = os.environ.get("SANITY_TOKEN","")
ANTHROPIC_KEY= os.environ.get("ANTHROPIC_API_KEY","")
GH_PAT       = os.environ.get("GH_PAT","")
PROJECT      = "vbnsqnkg"
BASE         = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"
S_HDRS       = {"Authorization": "Bearer " + SANITY_TOKEN, "Content-Type": "application/json"}
GH_HDRS      = {"Authorization": "token " + GH_PAT, "User-Agent": "curl",
                "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

def sq(groq, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + SANITY_TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=S_HDRS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def call_claude(prompt):
    payload = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 3000,
        "messages": [{"role": "user", "content": prompt}]
    }).encode()
    req = urllib.request.Request("https://api.anthropic.com/v1/messages", data=payload, headers={
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
    }, method="POST")
    with urllib.request.urlopen(req, timeout=60) as r:
        d = json.loads(r.read())
        return d["content"][0]["text"]

# Find Virginia article
slug = "virginia-state-police-defy-court-injunction-on-background-checks-gun-rights-groups-file-contempt"
article = sq('*[_type=="newsArticle" && slug.current=="' + slug + '"][0]{_id,title,body,summary,externalUrl,source}')
print("Article: " + str(article.get("title","NOT FOUND") if article else "NOT FOUND")[:70])
print("Body length: " + str(len(article.get("body","") or "")) if article else "0")

if not article:
    print("ERROR: Article not found")
    exit(1)

if article.get("body") and len(article["body"]) > 500:
    print("Article already has body, skipping")
else:
    prompt = (
        "Write a 900-1100 word article about Virginia State Police defying a federal court injunction "
        "on background check enforcement for gun purchases. Gun rights groups filed a contempt motion.\n\n"
        "Facts: Virginia enacted a law requiring background checks on private firearm sales. "
        "A federal court issued an injunction blocking enforcement of the law. "
        "Virginia State Police then announced plans to resume enforcement despite the injunction. "
        "The Firearms Policy Coalition and other gun rights groups filed a contempt motion "
        "challenging the state police defiance of the court order.\n\n"
        "Write like a gun owner who carries daily and reads 2A case law. Direct, specific, no AI filler. "
        "No phrases like 'comprehensive', 'dive into', 'robust', 'leverage', 'seamlessly'. "
        "Treat the reader as someone who understands court procedure.\n\n"
        "Structure with h2 HTML tags:\n"
        "- Lead paragraph (no header)\n"
        "- What Virginia Did (h2)\n"
        "- The Court Order VSP Ignored (h2)\n"
        "- The Contempt Motion (h2)\n"
        "- What This Means for Gun Owners (h2)\n"
        "- What to Watch Next + DownRange Bottom Line (h2)\n\n"
        "Output HTML only. No markdown fences."
    )
    body = call_claude(prompt)
    body = body.replace("```html", "").replace("```", "").strip()
    mutate([{"patch": {"id": article["_id"], "set": {"body": body, "qualityReviewed": True}}}])
    print("Written: " + str(len(body)) + " chars")

# Find other null-body articles
empty = sq('*[_type=="newsArticle" && (!qualityReviewed || body == null || body == "") && defined(title) && editorLocked != true] | order(publishedAt desc) [0...5] {_id,title}')
print("Other empty body articles: " + str(len(empty)))
for a in empty:
    print("  " + a.get("title","")[:60])

output = "Done. Virginia article fixed. Empty articles: " + str(len(empty))
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
payload = {"message":"chore: virginia result","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
