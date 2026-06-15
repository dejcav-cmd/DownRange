import urllib.request, urllib.parse, json, os, re

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

# Counts
total        = q('count(*[_type=="gunDeal"])')
total_gunsde = q('count(*[_type=="gunDeal" && source=="gun.deals"])')
has_image    = q('count(*[_type=="gunDeal" && defined(imageUrl) && imageUrl != null && imageUrl != ""])')
on_cdn       = q('count(*[_type=="gunDeal" && imageUrl match "cdn.sanity.io*"])')
missing      = q('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')

print("=== gunDeal image audit ===")
print(f"Total gunDeal docs:     {total}")
print(f"From gun.deals:         {total_gunsde}")
print(f"Has imageUrl:           {has_image}")
print(f"On Sanity CDN:          {on_cdn}")
print(f"Missing imageUrl:       {missing}")
print(f"Image fill rate:        {int(has_image/total*100) if total else 0}%")
print()

# Sample docs
recent = q('*[_type=="gunDeal"] | order(_createdAt desc) [0...10] {_id, title, imageUrl, source, _createdAt}')
print("Recent 10 deals:")
for d in recent:
    img = d.get("imageUrl","") or ""
    cdn = "CDN" if "cdn.sanity.io" in img else ("hotlink" if img else "MISSING")
    print(f"  [{cdn:8s}] {d.get('title','')[:60]}")
    if img: print(f"             {img[:70]}")

# Test if gun.deals OG scraping works right now
print()
print("=== Testing OG image scrape from gun.deals ===")
test_url = "https://gun.deals/entry/norma-ammo-safeguard-9mm-115gr-jhp-50-rounds-18-99-13-99-after-mir"
try:
    req = urllib.request.Request(test_url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        html = r.read(50000).decode("utf-8", errors="ignore")
        status = r.status
    print(f"  HTTP status: {status}")
    m = re.search(r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']', html, re.I) \
     or re.search(r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']', html, re.I)
    if m:
        print(f"  OG image found: {m.group(1)[:80]}")
    else:
        print(f"  OG image: NOT FOUND in HTML")
        print(f"  HTML snippet (first 500): {html[:500]}")
except Exception as e:
    print(f"  FAILED: {e}")
