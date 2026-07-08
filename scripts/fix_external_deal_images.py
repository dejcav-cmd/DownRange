#!/usr/bin/env python3
"""Audit and fix external deal images - either re-upload or clear them."""
import urllib.request, urllib.parse, json, os, base64, time
from collections import Counter

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
    payload = {"message": "fix: cleared blocked external deal images [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

# Get all external imageUrl deals
deals = sq('*[_type=="gunDeal" && approved==true && defined(imageUrl) && imageUrl != "" && !string::startsWith(coalesce(imageUrl,""), "https://cdn.sanity.io")] | order(publishedAt desc) [0...200]{_id, title, imageUrl, externalUrl}')

print(f"Found {len(deals or [])} deals with external images")

# Audit domains
from urllib.parse import urlparse
domains = Counter()
blocked_ids = []
for d in (deals or []):
    img = d.get("imageUrl","")
    try:
        domain = urlparse(img).netloc
    except:
        domain = "?"
    domains[domain] += 1
    # gun.deals CDN and similar hotlink-blocked domains
    if any(x in domain for x in ["gun.deals", "slickguns", "wikiarms", "cdn-cgi", "images.wikiarms"]):
        blocked_ids.append(d["_id"])

print("\nImage domains:")
for domain, count in domains.most_common(15):
    print(f"  {count:3d}  {domain}")

print(f"\nHotlink-blocked (to clear): {len(blocked_ids)}")

# Clear imageUrl on hotlink-blocked deals so they show clean placeholder
if blocked_ids:
    cleared = 0
    BATCH = 100
    for i in range(0, len(blocked_ids), BATCH):
        batch = blocked_ids[i:i+BATCH]
        muts = [{"patch": {"id": _id, "unset": ["imageUrl"]}} for _id in batch]
        status = mutate(muts)
        if status == 200:
            cleared += len(batch)
            print(f"  Cleared batch {i//BATCH+1}: {len(batch)} docs")
        else:
            print(f"  Batch failed: HTTP {status}")

    msg = f"Cleared imageUrl on {cleared} hotlink-blocked deals (gun.deals/slickguns CDN)"
else:
    msg = "No hotlink-blocked deals found to clear"

print(f"\n{msg}")
save(msg)
