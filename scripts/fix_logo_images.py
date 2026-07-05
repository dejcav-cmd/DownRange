"""
One-shot cleanup: find newsArticle docs whose stored imageUrl is a logo/banner
(identified by Sanity CDN dimension suffix pattern -WxH.ext where W<400 or W/H>3.5 or H>W)
and null them out so the fix-placeholder-images cron re-scrapes real photos.
"""
import urllib.request, urllib.parse, json, os, re, sys

token = os.environ.get("SANITY_TOKEN", "")
if not token:
    print("ERROR: No SANITY_TOKEN")
    sys.exit(1)

BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01"

def sanity_get(q):
    url = f"{BASE}/data/query/production?query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result", [])

def sanity_mutate(mutations):
    data = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(
        f"{BASE}/data/mutate/production?returnDocuments=false",
        data=data, method="POST",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def is_logo_sized_url(url):
    """Return True if Sanity CDN URL contains dimension suffix indicating logo/banner."""
    if not url or "cdn.sanity.io" not in url:
        return False
    m = re.search(r'-(\d+)x(\d+)\.(png|jpg|jpeg|webp)', url, re.I)
    if not m:
        return False
    w, h = int(m.group(1)), int(m.group(2))
    if w < 400:       return True   # too narrow
    if h and w/h > 3.5: return True # banner aspect
    if h > w:         return True   # portrait logo
    return False

# Fetch all newsArticles that have a cdn.sanity.io imageUrl
print("Fetching articles with CDN images...")
articles = sanity_get(
    '*[_type == "newsArticle" && defined(imageUrl) && string::startsWith(imageUrl, "https://cdn.sanity.io")] '
    '| order(publishedAt desc) [0...500] { _id, title, imageUrl }'
)
print(f"  Checked {len(articles)} articles")

bad = [a for a in articles if is_logo_sized_url(a.get("imageUrl", ""))]
print(f"  Found {len(bad)} articles with logo/banner-shaped images:")
for a in bad:
    print(f"    [{a['_id'][-8:]}] {a.get('title','')[:60]} -> {a.get('imageUrl','')}")

if not bad:
    print("Nothing to fix.")
    sys.exit(0)

# Null out imageUrl so fix-placeholder-images cron re-scrapes them
mutations = [{"patch": {"id": a["_id"], "unset": ["imageUrl"]}} for a in bad]

# Batch in groups of 100
for i in range(0, len(mutations), 100):
    batch = mutations[i:i+100]
    result = sanity_mutate(batch)
    print(f"  Patched batch {i//100 + 1}: {len(batch)} docs → {result.get('transactionId', 'ok')}")

print(f"\nDone. {len(bad)} articles queued for re-scrape (imageUrl cleared).")
print("fix-placeholder-images cron will refetch real photos on next hourly run.")

# Write summary to file for verification
with open("scripts/logo_fix_results.txt", "w") as f:
    f.write(f"Articles with logo-shaped images found: {len(bad)}\n")
    for a in bad:
        f.write(f"  CLEARED: [{a['_id'][-8:]}] {a.get('title','')[:60]} was: {a.get('imageUrl','')[-50:]}\n")
    f.write(f"\nCleared {len(bad)} articles. fix-placeholder-images cron will re-scrape photos.\n")
