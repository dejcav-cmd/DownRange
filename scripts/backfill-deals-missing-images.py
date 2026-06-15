#!/usr/bin/env python3
"""
Backfill imageUrl for gunDeal docs that are missing it.
Scrapes gun.deals product pages, extracts og:image (handling cdn-cgi transforms),
downloads the image, uploads to Sanity CDN.
"""
import urllib.request, urllib.parse, json, os, re, time

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def q(query):
    url = f"{BASE}/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def mutate(mutations):
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(f"{BASE}/mutate/production", data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

SCRAPE_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Cache-Control": "no-cache",
}

IMG_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Referer": "https://gun.deals/",
    "Accept": "image/webp,image/avif,image/apng,image/*,*/*",
}

def scrape_og_image(page_url):
    try:
        req = urllib.request.Request(page_url, headers=SCRAPE_HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read(100000).decode("utf-8", errors="ignore")
        m = re.search(r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']', html, re.I) \
         or re.search(r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']', html, re.I)
        if not m:
            # Fallback: direct file path in HTML
            fm = re.search(r'sites/default/files/[^\s"\']+\.(jpg|jpeg|png|webp|gif)', html, re.I)
            return ("https://gun.deals/" + fm.group(0)) if fm else None
        img_url = m.group(1).strip()
        # Extract underlying URL from Cloudflare cdn-cgi image transforms
        cdn_m = re.search(r'/cdn-cgi/image/[^/]+/(.*)', img_url)
        if cdn_m:
            base = re.match(r'https?://[^/]+', img_url).group(0)
            img_url = base + "/" + cdn_m.group(1)
        return img_url
    except Exception as e:
        print(f"    scrape error: {e}")
        return None

def download_image(url):
    try:
        req = urllib.request.Request(url, headers=IMG_HEADERS)
        with urllib.request.urlopen(req, timeout=15) as r:
            buf = r.read()
            ct  = r.headers.get("Content-Type", "image/jpeg")
        return (buf, ct) if len(buf) > 3000 else (None, None)
    except Exception as e:
        print(f"    download error: {e}")
        return (None, None)

def upload_to_sanity(buf, ct, filename):
    try:
        ext = "png" if "png" in ct else "webp" if "webp" in ct else "jpg"
        fname = re.sub(r'[^\w.-]', '_', filename)[:60] + f".{ext}"
        up = urllib.request.Request(
            f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fname}",
            data=buf, method="POST",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": ct}
        )
        with urllib.request.urlopen(up, timeout=30) as r:
            d = json.loads(r.read())
        return d.get("document", {}).get("url") or d.get("url")
    except Exception as e:
        print(f"    upload error: {e}")
        return None

print("=== Backfill missing deal images ===\n")

missing = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(_createdAt desc) [0...50] {_id, title, externalUrl}')
print(f"Found {len(missing)} deals missing images\n")

fixed = 0
failed = 0

for deal in missing:
    url = deal.get("externalUrl","")
    title = deal.get("title","")[:50]
    print(f"  {title}")
    
    if not url:
        print("    SKIP — no externalUrl")
        failed += 1
        continue
    
    og_url = scrape_og_image(url)
    if not og_url:
        print("    SKIP — no OG image found")
        failed += 1
        time.sleep(0.5)
        continue
    
    print(f"    OG: {og_url[:70]}")
    buf, ct = download_image(og_url)
    if not buf:
        # Try storing direct URL as fallback
        mutate([{"patch": {"id": deal["_id"], "set": {"imageUrl": og_url}}}])
        print(f"    ~ Stored direct URL (download failed)")
        fixed += 1
        time.sleep(0.5)
        continue
    
    filename = og_url.split("/")[-1].split("?")[0] or "deal"
    cdn_url = upload_to_sanity(buf, ct, filename)
    if cdn_url:
        mutate([{"patch": {"id": deal["_id"], "set": {"imageUrl": cdn_url}}}])
        print(f"    ✓ CDN: {cdn_url[:60]}")
        fixed += 1
    else:
        mutate([{"patch": {"id": deal["_id"], "set": {"imageUrl": og_url}}}])
        print(f"    ~ Stored direct URL (CDN upload failed)")
        fixed += 1
    
    time.sleep(0.8)

print(f"\n=== Done: {fixed} fixed, {failed} failed ===")
