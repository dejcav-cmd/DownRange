#!/usr/bin/env python3
import urllib.request, urllib.parse, json, sys

TOKEN = "skbUvbYYIvf0Uwc43kqoHa7MX556BIABP7tNDQjW06yeBHY9ImiPeEjgMs87ZxlUafA5XRt6LXwn8d5Y9JcmDaZN13fvjxt6Tm3QgSAE8LqSvP6oU7zgF3W4dGb3jnjVIuBnZTICBsln2LHqgKjFIAybBohK6JCJWR8qHmP6CMhPVpsiPB79"
PROJECT = "vbnsqnkg"
BASE = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def sanity_query(q):
    url = f"{BASE}/query/production?query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())["result"]

def sanity_mutate(mutations):
    url = f"{BASE}/mutate/production?returnIds=false"
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    resp = urllib.request.urlopen(req)
    return json.loads(resp.read())

import re

PATTERNS = [
    re.compile(r"<p[^>]*>[^<]*[Ss]ource:[^<]*[Vv]isit the original[^<]*</p>", re.IGNORECASE),
    re.compile(r"<p[^>]*>[^<]*[Ss]ource:[^<]*[Bb]earing Arms[^<]*</p>", re.IGNORECASE),
    re.compile(r"<p[^>]*>\s*<em>[^<]*[Ss]ource:[^<]*</em>\s*</p>", re.IGNORECASE),
    re.compile(r"\n?<p[^>]*>[^<]*visit the original[^<]*article[^<]*</p>", re.IGNORECASE),
    re.compile(r"\n?Source:[^\n]*visit the original[^\n]*", re.IGNORECASE),
    re.compile(r"\n?Source:[^\n]*[Bb]earing Arms[^\n]*", re.IGNORECASE),
]

def strip(body):
    if not body: return body, False
    out = body
    for p in PATTERNS:
        out = p.sub("", out)
    out = out.strip()
    return out, out != body

print("Fetching articles from Sanity...")
docs = sanity_query('*[_type == "newsArticle" && defined(body) && body != ""]{ _id, body }')
print(f"Total articles: {len(docs)}")

# Show sample tails
for i in range(min(3, len(docs))):
    tail = docs[i]["body"][-300:].replace("\n", " ")
    print(f"SAMPLE {i}: {tail}")

patched = 0
skipped = 0
BATCH = 50

for i in range(0, len(docs), BATCH):
    batch = docs[i:i+BATCH]
    mutations = []
    for doc in batch:
        out, changed = strip(doc["body"])
        if changed:
            mutations.append({"patch": {"id": doc["_id"], "set": {"body": out}}})
            patched += 1
        else:
            skipped += 1
    if mutations:
        sanity_mutate(mutations)
        print(f"Committed batch {i}-{i+BATCH} ({len(mutations)} patches)")

print(f"DONE. Patched: {patched} | Skipped: {skipped} | Total: {len(docs)}")
