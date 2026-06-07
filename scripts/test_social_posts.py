#!/usr/bin/env python3
"""Check recent socialPost docs in Sanity for 'Full article:' format."""
import os, json, urllib.request, urllib.parse

SANITY_TOKEN = os.environ.get("SANITY_TOKEN","")
PROJECT = "vbnsqnkg"
DATASET = "production"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/{DATASET}?query={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())["result"]

print("=== CHECKING RECENT SOCIAL POSTS IN SANITY ===\n")

# Get the 10 most recent posts (any status)
posts = q("""*[_type == "socialPost"] | order(_createdAt desc) [0...10] {
    _id, platform, status, content, articleTitle, postedAt, _createdAt
}""")

print(f"Found {len(posts)} recent socialPost docs")

LIMITS = {"twitter":280,"bluesky":300,"threads":500,"facebook":800,"reddit":300}
results = {}
all_pass = True

for p in posts:
    platform = p.get("platform","?")
    content  = p.get("content","")
    status   = p.get("status","?")
    title    = p.get("articleTitle","?")[:50]
    chars    = len(content)
    limit    = LIMITS.get(platform, 300)
    over     = chars > limit
    has_fa   = "Full article:" in content
    has_url  = "downrangeco.com" in content
    passed   = has_fa and has_url and not over
    
    created_at = p.get("_createdAt","")[:10]
    
    print(f"\n[{created_at}] {platform.upper()} ({status}) — {title}")
    print(f"  Content: {content[:300]}")
    if len(content) > 300: print(f"  ... ({chars} chars total)")
    print(f"  Chars: {chars}/{limit} ({'OVER' if over else 'OK'})")
    print(f"  Full article: {'YES ✓' if has_fa else 'NO ✗'}")
    print(f"  Portal URL:   {'YES ✓' if has_url else 'NO ✗'}")
    
    if platform not in results:
        results[platform] = {"pass":0,"fail":0,"samples":[]}
    if passed:
        results[platform]["pass"] += 1
    else:
        results[platform]["fail"] += 1
        all_pass = False
    results[platform]["samples"].append({"status":status,"chars":chars,"has_fa":has_fa,"has_url":has_url})

print(f"\n=== SUMMARY ===")
for plat, data in results.items():
    p = data["pass"]; f = data["fail"]
    print(f"  {plat}: {p} pass, {f} fail")
print(f"\nOVERALL: {'ALL PASS ✓' if all_pass else 'SOME FAIL ✗'}")

with open("fix_results.json","w") as f:
    json.dump({"test":"social_sanity_check","overall":"PASS" if all_pass else "FAIL",
               "total_posts":len(posts),"by_platform":results},f,indent=2)
print("Saved to fix_results.json")
