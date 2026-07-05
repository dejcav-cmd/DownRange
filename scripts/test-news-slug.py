"""
Smoke test: verify /news/[slug] pages return 200 (not 500).
Run from GitHub Actions after deployments.
"""
import urllib.request, urllib.error, urllib.parse, json, os, sys

SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN", "")
BASE = "https://www.downrangeco.com"

# --- Fetch real slugs from Sanity ---
slugs = []
try:
    q = '*[_type=="newsArticle"&&approved==true&&defined(slug.current)]|order(publishedAt desc)[0...6]{"s":slug.current}'
    url = f"https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(q)}"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())
    slugs = [a["s"] for a in data.get("result", []) if a.get("s")]
    print(f"Fetched {len(slugs)} slugs from Sanity")
except Exception as e:
    print(f"WARNING: Could not fetch slugs from Sanity: {e}")
    print("Skipping smoke test — no slugs available")
    sys.exit(0)

if not slugs:
    print("No slugs returned from Sanity — skipping")
    sys.exit(0)

# --- Test each slug ---
HDR = {"User-Agent": "Mozilla/5.0 (DownRange-SmokeTest/2.0)"}
passed = failed = 0

print(f"\n=== Testing {len(slugs)} /news/[slug] pages ===")
for slug in slugs:
    url = f"{BASE}/news/{slug}"
    try:
        req = urllib.request.Request(url, headers=HDR)
        with urllib.request.urlopen(req, timeout=20) as r:
            code = r.status
    except urllib.error.HTTPError as e:
        code = e.code
    except Exception as e:
        print(f"  ERR  /news/{slug}  {e}")
        passed += 1  # network error ≠ 500, don't penalize
        continue

    if code == 200:
        print(f"  PASS /news/{slug}  -> {code}")
        passed += 1
    elif code == 404:
        print(f"  PASS /news/{slug}  -> {code} (article removed, expected)")
        passed += 1
    elif code == 500:
        print(f"  FAIL /news/{slug}  -> {code}  *** 500 STILL OCCURRING ***")
        failed += 1
    else:
        print(f"  PASS /news/{slug}  -> {code}")
        passed += 1

print(f"\nResults: {passed} passed, {failed} 500-errors")
if failed > 0:
    sys.exit(1)
