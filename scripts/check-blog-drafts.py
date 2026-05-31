#!/usr/bin/env python3
import json, urllib.request, urllib.parse, time, os, sys

TOKEN = os.environ.get("SANITY_TOKEN", "")
PROJECT = "vbnsqnkg"
BASE = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        for k, v in params.items():
            url += "&" + urllib.parse.quote("$" + k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    body = json.dumps({"mutations": mutations}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE + "/mutate/production", data=body, method="POST",
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read())

print("Checking all blog posts...", flush=True)

# Get all blog posts including drafts
all_posts = sanity_query(
    "*[_type == \"blogPost\"] | order(_createdAt desc) { _id, title, \"slug\": slug.current, body, status, published, excerpt, _createdAt }"
)

print(f"Total blog posts: {len(all_posts)}", flush=True)
print("", flush=True)

# Categorize
has_body = []
no_body  = []
published = []
drafts    = []

for p in all_posts:
    body_len = len(p.get("body") or "")
    is_pub = p.get("status") == "published" or p.get("published") == True
    
    if body_len > 100:
        has_body.append(p)
    else:
        no_body.append(p)
    
    if is_pub:
        published.append(p)
    else:
        drafts.append(p)

print(f"Has body: {len(has_body)}", flush=True)
print(f"No body:  {len(no_body)}", flush=True)
print(f"Published: {len(published)}", flush=True)
print(f"Drafts:    {len(drafts)}", flush=True)
print("", flush=True)

# Show all drafts with body status
print("=== DRAFTS ===", flush=True)
for p in drafts[:20]:
    body_len = len(p.get("body") or "")
    slug = p.get("slug") or "no-slug"
    title = (p.get("title") or "untitled")[:60]
    print(f"  {'✅' if body_len > 100 else '❌'} [{body_len:4d} chars] {title}", flush=True)

# Show published posts with no body (these are broken)
print("", flush=True)
print("=== PUBLISHED WITH NO BODY (need fix) ===", flush=True)
broken = [p for p in published if len(p.get("body") or "") < 100]
for p in broken[:10]:
    body_len = len(p.get("body") or "")
    title = (p.get("title") or "untitled")[:60]
    slug = p.get("slug") or "no-slug"
    print(f"  ❌ [{body_len:4d} chars] {title}", flush=True)
    print(f"     slug: {slug}", flush=True)

if not broken:
    print("  ✅ None — all published posts have body content!", flush=True)

# Fix drafts with no body by generating them via the blog-regen API
# (we just report here, let DJ trigger regeneration)
print(f"\nSummary: {len(broken)} published posts need body fix | {len([d for d in drafts if len(d.get('body') or '') < 100])} drafts need body", flush=True)
