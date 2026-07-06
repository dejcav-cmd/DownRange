"""
Fetch Amazon product page for a given ASIN, extract title + image,
and patch the Sanity gunDeal document.
"""
import json, base64, urllib.request, urllib.parse, os, re, sys

ASIN          = os.environ.get('FIX_ASIN', 'B0D1KXJYR6')
SANITY_TOKEN  = os.environ.get('SANITY_TOKEN', '')
PROJECT_ID    = 'vbnsqnkg'
DATASET       = 'production'
API_BASE      = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01/data'

# ── 1. Find the Sanity doc for this ASIN ──────────────────────────────────────
query = f'*[_type=="gunDeal" && source=="amazon" && "asin:{ASIN}" in tags][0]{{_id, title, imageUrl}}'
url   = f'{API_BASE}/query/{DATASET}?query={urllib.parse.quote(query)}'
req   = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
with urllib.request.urlopen(req) as r:
    doc = json.loads(r.read()).get('result')
if not doc:
    print(f'No Sanity doc found for ASIN {ASIN}')
    sys.exit(1)
print(f'Found doc: {doc["_id"]}  current title: {doc["title"]}')

# ── 2. Fetch the Amazon product page for title + image ────────────────────────
product_url = f'https://www.amazon.com/dp/{ASIN}'
headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache',
}
req2 = urllib.request.Request(product_url, headers=headers)
try:
    with urllib.request.urlopen(req2, timeout=15) as r:
        html = r.read().decode('utf-8', errors='replace')
    print(f'Fetched product page: {len(html)} bytes')
except Exception as e:
    print(f'Fetch failed: {e}')
    html = ''

# ── 3. Extract title and image from HTML ──────────────────────────────────────
title = None
image_url = None

if html:
    # OG title
    m = re.search(r'<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
    if not m:
        m = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:title["\']', html, re.I)
    if m:
        title = m.group(1).strip()
        title = re.sub(r'\s*[-–|]\s*amazon\.com.*$', '', title, flags=re.I).strip()
        print(f'Extracted title: {title}')

    # OG image
    m2 = re.search(r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']', html, re.I)
    if not m2:
        m2 = re.search(r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']', html, re.I)
    if m2:
        image_url = m2.group(1).strip()
        print(f'Extracted image: {image_url[:80]}')

# ── 4. Fallback title if scrape failed ────────────────────────────────────────
if not title:
    title = 'Eberlestock Bando Bag Tactical Fanny Pack for Men'
    print(f'Using fallback title: {title}')

# ── 5. Upload image to Sanity CDN ─────────────────────────────────────────────
sanity_image_url = None
if image_url:
    try:
        req3 = urllib.request.Request(image_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req3, timeout=10) as r:
            img_data = r.read()
        upload_url = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/{DATASET}'
        req4 = urllib.request.Request(
            upload_url, method='POST', data=img_data,
            headers={
                'Authorization': f'Bearer {SANITY_TOKEN}',
                'Content-Type': 'image/jpeg',
                'x-sanity-label': f'amazon-{ASIN}',
            }
        )
        with urllib.request.urlopen(req4, timeout=20) as r:
            asset = json.loads(r.read())
            sanity_image_url = asset.get('url')
            print(f'Uploaded to Sanity CDN: {sanity_image_url}')
    except Exception as e:
        print(f'Image upload failed: {e}')
        sanity_image_url = image_url  # use direct URL as fallback

# ── 6. Patch the Sanity document ──────────────────────────────────────────────
patch = {'set': {'title': title}}
if sanity_image_url:
    patch['set']['imageUrl'] = sanity_image_url

mutation = {'mutations': [{'patch': {'id': doc['_id'], **patch}}]}
req5 = urllib.request.Request(
    f'{API_BASE}/mutate/{DATASET}?returnDocuments=false',
    method='POST',
    data=json.dumps(mutation).encode(),
    headers={'Authorization': f'Bearer {SANITY_TOKEN}', 'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req5) as r:
    result = json.loads(r.read())
    print(f'Sanity patch result: {result}')
    print(f'Done — title: "{title}"  image: {"uploaded" if sanity_image_url else "none"}')
