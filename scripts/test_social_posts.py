#!/usr/bin/env python3
"""Dry-run test for social post format across all platforms."""
import urllib.request, json, os

ADMIN_KEY = os.environ.get("ADMIN_KEY", "")
BASE = "https://downrangeco.com"
PLATFORMS = ["twitter", "bluesky", "threads", "facebook", "reddit"]
LIMITS = {"twitter":280,"bluesky":300,"threads":500,"facebook":800,"reddit":300}

results = {}
all_pass = True

print("=== SOCIAL POST DRY-RUN TEST ===")
for platform in PLATFORMS:
    print(f"\n--- {platform.upper()} ---")
    url = f"{BASE}/api/social/cron/{platform}"
    req = urllib.request.Request(url,
        data=json.dumps({"count":1,"dryRun":True}).encode(),
        headers={"x-admin-key":ADMIN_KEY,"Content-Type":"application/json"})
    req.method = "POST"
    try:
        with urllib.request.urlopen(req, timeout=60) as r:
            d = json.loads(r.read())
        posts = d.get("posts",d.get("results",d.get("dryRun",[])))
        if not posts:
            print(f"  NO POSTS: {json.dumps(d)[:300]}")
            results[platform] = {"status":"NO_POST","raw":json.dumps(d)[:300]}
            all_pass = False
            continue
        p = posts[0] if isinstance(posts,list) else posts
        content = p.get("content",p.get("text",""))
        char_count = len(content)
        limit = LIMITS[platform]
        over = char_count > limit
        has_fa = "Full article:" in content
        has_url = "downrangeco.com" in content
        status = "PASS" if (has_fa and has_url and not over) else "FAIL"
        if status == "FAIL": all_pass = False
        print(f"  Content: {content}")
        print(f"  Chars: {char_count}/{limit} {'OVER!' if over else 'OK'}")
        print(f"  Full article: {'YES' if has_fa else 'NO'}")
        print(f"  Portal URL: {'YES' if has_url else 'NO'}")
        print(f"  STATUS: {status}")
        results[platform] = {"status":status,"chars":char_count,"limit":limit,"content":content,"has_full_article":has_fa,"has_url":has_url}
    except Exception as e:
        print(f"  ERROR: {e}")
        results[platform] = {"status":"ERROR","error":str(e)}
        all_pass = False

print(f"\n=== OVERALL: {'ALL PASS' if all_pass else 'FAILURES DETECTED'} ===")
with open("fix_results.json","w") as f:
    json.dump({"test":"social_posts","overall":"PASS" if all_pass else "FAIL","platforms":results},f,indent=2)
print("Results saved to fix_results.json")
