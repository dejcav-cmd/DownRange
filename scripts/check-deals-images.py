import urllib.request, urllib.parse, json, os, re
from datetime import datetime, timezone

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

# Find the NEWEST deal with a CDN image — to see when images stopped working
newest_cdn = q('*[_type=="gunDeal" && imageUrl match "cdn.sanity.io*"] | order(_createdAt desc) [0...1] {_createdAt, title, imageUrl}')
oldest_missing = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl==null)] | order(_createdAt asc) [0...1] {_createdAt, title}')

print("=== Image pipeline timeline ===")
if newest_cdn:
    d = newest_cdn[0]
    print(f"Last successful CDN upload: {d.get('_createdAt','')[:16]} — {d.get('title','')[:50]}")
if oldest_missing:
    d = oldest_missing[0]
    print(f"First missing image deal:   {d.get('_createdAt','')[:16]} — {d.get('title','')[:50]}")

print()

# Scrape the OG URL and test the underlying image  
test_url = "https://gun.deals/product/uppers-free-suppressor-scope-code-freegoods-149999"
print(f"=== Full scrape pipeline test ===")
print(f"  Page: {test_url}")

# Fetch page
try:
    req = urllib.request.Request(test_url, headers={
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        html = r.read(100000).decode("utf-8", errors="ignore")
        code = r.status
    print(f"  Page fetch: HTTP {code}")
    
    m = re.search(r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']', html, re.I) \
     or re.search(r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']', html, re.I)
    og_url = m.group(1).strip() if m else None
    print(f"  OG image URL: {og_url}")
    
    if og_url:
        # Detect if cdn-cgi URL and extract underlying
        cdn_cgi_match = re.search(r'/cdn-cgi/image/[^/]+/(.*?)(\?|$)', og_url)
        if cdn_cgi_match:
            underlying_path = cdn_cgi_match.group(1)
            base_domain = re.match(r'(https?://[^/]+)', og_url).group(1)
            underlying_url = base_domain + "/" + underlying_path
            print(f"  CDN-CGI detected! Underlying: {underlying_url}")
            
            # Try to download the underlying URL
            for test_u in [underlying_url, og_url]:
                try:
                    req2 = urllib.request.Request(test_u, headers={
                        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
                        "Referer": "https://gun.deals/",
                        "Accept": "image/webp,image/avif,image/apng,image/*,*/*",
                    })
                    with urllib.request.urlopen(req2, timeout=15) as r2:
                        buf = r2.read()
                        ct = r2.headers.get("Content-Type","")
                        code2 = r2.status
                    print(f"  Download {test_u[:60]}: HTTP {code2}, {len(buf)} bytes, {ct}")
                    if len(buf) > 5000:
                        print(f"  ✓ Download WORKS — can upload to Sanity CDN")
                    break
                except Exception as e:
                    print(f"  Download {test_u[:60]}: FAILED — {e}")
        else:
            print(f"  Standard URL (no cdn-cgi)")
            # Try direct download
            try:
                req2 = urllib.request.Request(og_url, headers={
                    "User-Agent": "Mozilla/5.0 Chrome/124.0.0.0",
                    "Referer": "https://gun.deals/",
                })
                with urllib.request.urlopen(req2, timeout=15) as r2:
                    buf = r2.read()
                    ct = r2.headers.get("Content-Type","")
                print(f"  Download: {len(buf)} bytes, {ct}")
            except Exception as e:
                print(f"  Download FAILED: {e}")
    
    # Also look for product images directly in page HTML
    # gun.deals might have structured data with image
    json_ld = re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>([\s\S]*?)</script>', html, re.I)
    for jl in json_ld:
        try:
            d = json.loads(jl)
            img = d.get('image') or (d.get('offers',{}) or {}).get('image')
            if img:
                print(f"  JSON-LD image: {img}")
        except: pass

except Exception as e:
    print(f"  Page fetch FAILED: {e}")

print("\nDone.")
