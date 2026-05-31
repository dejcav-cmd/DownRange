#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, sys

TOKEN = os.environ.get("SANITY_TOKEN","")
PROJECT = "vbnsqnkg"
BASE = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        for k, v in params.items():
            url += "&" + urllib.parse.quote("$" + k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(BASE + "/mutate/production", data=body, method="POST",
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())

# 1. Find and delete the Belagavi article
print("Finding Belagavi article...", flush=True)
articles = sanity_query(
    '''*[_type == "newsArticle" && (
      title match "*Belagavi*" || 
      title match "*country-made guns*" || 
      title match "*country made guns*" ||
      externalUrl match "*thehindu*"
    )] { _id, title, source, externalUrl }'''
)
print(f"Found {len(articles)} article(s):", flush=True)
for a in articles:
    print(f"  [{a['_id']}] {a.get('title','')[:70]}", flush=True)
    print(f"  Source: {a.get('source','?')} | URL: {a.get('externalUrl','')[:80]}", flush=True)

for a in articles:
    try:
        sanity_mutate([{"delete": {"id": a["_id"]}}])
        print(f"  DELETED: {a['_id']}", flush=True)
    except Exception as e:
        print(f"  DELETE FAILED: {e}", flush=True)

# 2. Find and delete all articles from TheGunFeed source
print("\nFinding all TheGunFeed articles...", flush=True)
gunfeed_articles = sanity_query(
    '''*[_type == "newsArticle" && source == "TheGunFeed"] { _id, title }'''
)
print(f"Found {len(gunfeed_articles)} TheGunFeed articles", flush=True)

import time
for a in gunfeed_articles:
    try:
        sanity_mutate([{"delete": {"id": a["_id"]}}])
        print(f"  DELETED: {a.get('title','')[:60]}", flush=True)
        time.sleep(0.15)
    except Exception as e:
        print(f"  FAIL: {e}", flush=True)

# 3. Also check for any other international articles that slipped through
print("\nChecking for other non-US articles...", flush=True)
intl_articles = sanity_query(
    '''*[_type == "newsArticle" && (
      externalUrl match "*thehindu*" ||
      externalUrl match "*timesofindia*" ||
      externalUrl match "*ndtv*" ||
      title match "*karnataka*" ||
      title match "*mumbai*" ||
      title match "*bengaluru*"
    )] { _id, title, source }'''
)
print(f"Found {len(intl_articles)} other international articles", flush=True)
for a in intl_articles[:5]:
    print(f"  {a.get('source','?')} | {a.get('title','')[:60]}", flush=True)
    try:
        sanity_mutate([{"delete": {"id": a["_id"]}}])
        print(f"  DELETED", flush=True)
    except Exception as e:
        print(f"  FAIL: {e}", flush=True)

print("\nCleanup complete!", flush=True)
