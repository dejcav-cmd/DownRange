#!/usr/bin/env python3
"""Delete all AmmoLand newsArticle docs from Sanity."""
import urllib.request, urllib.parse, json, os, base64

TOKEN = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def sq(q):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(q)}&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def mutate(muts):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production?returnDocuments=false"
    body = json.dumps({"mutations": muts}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, json.loads(r.read())

def save_result(content):
    encoded = base64.b64encode(content.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": "fix: AmmoLand deletion result [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

print("Finding AmmoLand articles...")
articles = sq('''*[_type == "newsArticle" && (
  source == "AmmoLand" ||
  source == "ammoland" ||
  string::startsWith(coalesce(externalUrl, ""), "https://ammoland.com") ||
  string::startsWith(coalesce(externalUrl, ""), "https://www.ammoland.com")
)] { _id }''')

total = len(articles or [])
print(f"Found {total} AmmoLand articles")

deleted = 0
BATCH = 100
for i in range(0, total, BATCH):
    batch = (articles or [])[i:i+BATCH]
    muts = [{"delete": {"id": a["_id"]}} for a in batch]
    status, result = mutate(muts)
    batch_deleted = len(result.get("results", []))
    deleted += batch_deleted
    print(f"  Deleted batch {i//BATCH + 1}: {batch_deleted} docs (status {status})")

msg = f"AmmoLand purge complete: {deleted}/{total} articles deleted from Sanity"
print(msg)
save_result(msg)
