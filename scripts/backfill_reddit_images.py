#!/usr/bin/env python3
"""
Reddit deals don't have product pages — Bing search returns wrong generic images.
This script clears any wrong Bing-sourced images from Reddit deals.
Wrong image = worse than no image. Reddit deals show branded placeholder by design.
"""
import urllib.request, urllib.parse, json, os, base64, re

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
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status

def save(content):
    encoded = base64.b64encode(content.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": "fix: cleared wrong Bing images from Reddit deals [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

# Find Reddit deals that got a Bing/Sanity CDN image (wrong — those are generic stock photos)
# Reddit deals should have imageUrl=null. Clear any that got Bing images.
reddit_with_img = sq('''*[_type=="gunDeal" && approved==true && (source=="reddit" || source=="r/gundeals") && defined(imageUrl) && imageUrl != "" && imageUrl != null]{_id, title, imageUrl}''')

print(f"Reddit deals with images: {len(reddit_with_img or [])}")

# Clear them all — reddit deals can't have verified product images
to_clear = [d["_id"] for d in (reddit_with_img or [])]
cleared = 0
if to_clear:
    BATCH = 100
    for i in range(0, len(to_clear), BATCH):
        batch = to_clear[i:i+BATCH]
        muts = [{"patch": {"id": _id, "unset": ["imageUrl"]}} for _id in batch]
        status = mutate(muts)
        if status == 200:
            cleared += len(batch)
            print(f"  Cleared batch {i//BATCH+1}: {len(batch)} docs")

msg = f"Cleared {cleared} wrong Bing images from Reddit deals. They now show branded placeholder."
print(f"\n{msg}")
save(msg)
