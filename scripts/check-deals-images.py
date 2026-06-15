import urllib.request, urllib.parse, json, os, re

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

total        = q('count(*[_type=="gunDeal"])')
has_image    = q('count(*[_type=="gunDeal" && defined(imageUrl) && imageUrl != null && imageUrl != ""])')
on_cdn       = q('count(*[_type=="gunDeal" && imageUrl match "cdn.sanity.io*"])')
missing      = q('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')

print("=== gunDeal image audit ===")
print(f"Total: {total}  Has image: {has_image}  CDN: {on_cdn}  Missing: {missing}")
print()

# Sample recent missing — with their actual URLs
recent_missing = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(_createdAt desc) [0...5] {_id, title, externalUrl, _createdAt}')
print("Recent deals with missing imageUrl:")
for d in recent_missing:
    print(f"  {d.get('title','')[:55]}")
    print(f"  → {d.get('externalUrl','')}")
    print()

# Sample deals WITH images to see what format works
recent_cdn = q('*[_type=="gunDeal" && imageUrl match "cdn.sanity.io*"] | order(_createdAt desc) [0...3] {imageUrl, externalUrl}')
print("Recent deals WITH CDN images (working):")
for d in recent_cdn:
    print(f"  externalUrl: {d.get('externalUrl','')[:70]}")
    print(f"  imageUrl:    {d.get('imageUrl','')[:70]}")
    print()

# Test OG scraping on one of the missing deal URLs
if recent_missing and recent_missing[0].get('externalUrl'):
    test_url = recent_missing[0]['externalUrl']
    print(f"=== Testing OG scrape on: {test_url} ===")
    try:
        req = urllib.request.Request(test_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read(100000).decode("utf-8", errors="ignore")
            code = r.status
        print(f"  HTTP: {code}")
        m = re.search(r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']', html, re.I) \
         or re.search(r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']', html, re.I)
        print(f"  OG image: {m.group(1)[:80] if m else 'NOT FOUND'}")
        if not m:
            # Check if it's a redirect or CF block
            print(f"  HTML preview: {html[:400]}")
    except Exception as e:
        print(f"  FAILED: {e}")

print("\nDone.")
