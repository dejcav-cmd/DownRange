import urllib.request, urllib.parse, json, os, re

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

# Get the ACTUAL recent missing deals with their real URLs
recent_missing = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(_createdAt desc) [0...5] {_id, title, externalUrl, _createdAt}')

print("=== Recent deals WITHOUT images ===")
for d in recent_missing:
    print(f"  {d.get('title','')[:60]}")
    print(f"  URL: {d.get('externalUrl','')}")
    print()

# Also check recent deals WITH images for comparison
recent_with = q('*[_type=="gunDeal" && defined(imageUrl) && imageUrl != null] | order(_createdAt desc) [0...3] {title, externalUrl, imageUrl, _createdAt}')
print("=== Recent deals WITH images (working) ===")
for d in recent_with:
    print(f"  {d.get('title','')[:60]}")
    print(f"  externalUrl: {d.get('externalUrl','')[:70]}")
    print(f"  imageUrl:    {d.get('imageUrl','')[:70]}")
    print()

# Now test OG scraping with a REAL missing URL
if recent_missing and recent_missing[0].get('externalUrl'):
    test_url = recent_missing[0]['externalUrl']
    print(f"=== OG scrape test on real URL ===")
    print(f"  URL: {test_url}")
    for ua in [
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
        "curl/7.68.0",
    ]:
        try:
            req = urllib.request.Request(test_url, headers={
                "User-Agent": ua,
                "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            })
            with urllib.request.urlopen(req, timeout=12) as r:
                html = r.read(80000).decode("utf-8", errors="ignore")
                code = r.status
            m = re.search(r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']', html, re.I) \
             or re.search(r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']', html, re.I)
            og = m.group(1)[:80] if m else "NOT FOUND"
            print(f"  UA='{ua[:30]}...' → HTTP {code} → OG: {og}")
            if m:
                break
        except Exception as e:
            print(f"  UA='{ua[:30]}...' → FAILED: {e}")

print("\nDone.")
