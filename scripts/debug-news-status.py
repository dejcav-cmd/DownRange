#!/usr/bin/env python3
"""Debug: check news feed status via Sanity, write result to Sanity debugLog doc"""
import json, urllib.request, urllib.parse, os, time

TOKEN   = os.environ.get("SANITY_TOKEN", "")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def q(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

lines = []
lines.append("=== ARTICLE COUNT ===")
count = q('count(*[_type == "newsArticle"])')
lines.append(f"Total newsArticles: {count}")

lines.append("\n=== LAST 10 ARTICLES (by publishedAt) ===")
recent = q('*[_type == "newsArticle"] | order(publishedAt desc) [0...10] { title, publishedAt, source, _createdAt }')
for a in recent:
    lines.append(f"  {a.get('publishedAt','?')[:16]} | {a.get('source','?')[:25]:<25} | {a.get('title','?')[:55]}")

lines.append("\n=== LAST 5 cronRun DOCS (news feed) ===")
try:
    crons = q('*[_type == "cronRun" && feed == "news"] | order(_createdAt desc) [0...5] { feed, status, details, _createdAt, ms }')
    for c in crons:
        lines.append(f"  {c.get('_createdAt','?')[:16]} | {c.get('status')} | {c.get('details','')[:80]}")
    if not crons:
        lines.append("  (no cronRun docs found for feed=news)")
except Exception as e:
    lines.append(f"  Error querying cronRuns: {e}")

lines.append("\n=== LAST 5 cronRun DOCS (any feed) ===")
try:
    allcrons = q('*[_type == "cronRun"] | order(_createdAt desc) [0...5] { feed, status, details, _createdAt }')
    for c in allcrons:
        lines.append(f"  {c.get('_createdAt','?')[:16]} | {c.get('feed','?'):<15} | {c.get('status')} | {c.get('details','')[:50]}")
    if not allcrons:
        lines.append("  (no cronRun docs found at all)")
except Exception as e:
    lines.append(f"  Error: {e}")

output = "\n".join(lines)
print(output)

# Write to Sanity as a debugLog document so it can be read back
try:
    mutate([{
        "createOrReplace": {
            "_id": "debug-news-status-latest",
            "_type": "cronRun",
            "feed": "debug-news-status",
            "status": "success",
            "details": output[:4000],
            "ms": 0
        }
    }])
    print("\n[Written to Sanity doc: debug-news-status-latest]")
except Exception as e:
    print(f"\n[Sanity write failed: {e}]")
