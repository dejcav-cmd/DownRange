"""
Patch title + image on a Sanity gunDeal for a given ASIN.
Image strategy (in order):
  1. Use IMAGE_URL env var if provided (manual override)
  2. Try Bing image search for the product title → first real product photo
  3. Try direct Amazon product page scrape (often blocked but worth trying)
"""
import json, urllib.request, urllib.parse, os, sys, re, time

ASIN         = os.environ.get('FIX_ASIN', '')
IMAGE_URL    = os.environ.get('IMAGE_URL', '').strip()
SANITY_TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT_ID   = 'vbnsqnkg'
DATASET      = 'production'
API_BASE     = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01/data'

if not ASIN:
    print('FIX_ASIN env var is required'); sys.exit(1)

# ── 1. Find the Sanity doc ─────────────────────────────────────────────────────
query = f'*[_type=="gunDeal" && "asin:{ASIN}" in tags][0]{{_id,title,imageUrl}}'
req = urllib.request.Request(
    f'{API_BASE}/query/{DATASET}?query={urllib.parse.quote(query)}',
    headers={'Authorization': f'Bearer {SANITY_TOKEN}'}
)
with urllib.request.urlopen(req) as r:
    doc = json.loads(r.read()).get('result')
if not doc:
    print(f'No doc found for ASIN {ASIN}'); sys.exit(1)
print(f'Doc: {doc["_id"]}')
print(f'Title: {doc.get("title","?")}')
print(f'Current imageUrl: {doc.get("imageUrl") or "(none)"}')

title = doc.get('title') or ''

# ── 2. Determine the image URL to use ─────────────────────────────────────────
def try_fetch(url, label='', extra_headers=None):
    headers = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
    }
    if extra_headers:
        headers.update(extra_headers)
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode('utf-8', errors='replace')
    except Exception as e:
        print(f'{label} fetch failed: {e}')
        return None

def bing_image_search(query):
    """Scrape Bing Images for a product photo. Returns first valid image URL."""
    search_url = f'https://www.bing.com/images/search?q={urllib.parse.quote(query)}&form=HDRSC2&first=1'
    print(f'Bing image search: {query}')
    html = try_fetch(search_url, 'Bing', {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Referer': 'https://www.bing.com/',
    })
    if not html:
        return None

    # Bing embeds image data in <a class="iusc" m="{...}"> elements
    # The JSON contains "murl" (direct image URL) and "turl" (thumbnail)
    urls = []
    for m_data in re.findall(r'class="iusc"[^>]*\sm="({[^"]+})"', html):
        try:
            m_data_clean = m_data.replace('&quot;', '"')
            obj = json.loads(m_data_clean)
            murl = obj.get('murl', '')
            if murl and murl.startswith('http') and any(ext in murl.lower() for ext in ['.jpg','.jpeg','.png','.webp']):
                # Skip tiny images and obvious logos
                if not any(x in murl.lower() for x in ['logo','icon','banner','sprite','badge']):
                    urls.append(murl)
        except:
            pass

    # Also try the alternative m-attr format
    for m_data in re.findall(r'"murl"\s*:\s*"([^"]+)"', html):
        if m_data.startswith('http') and m_data not in urls:
            urls.append(m_data)

    print(f'Found {len(urls)} candidate image URLs from Bing')
    if urls:
        print(f'Top candidate: {urls[0][:100]}')
        return urls[0]
    return None

def extract_og_image(html):
    if not html:
        return None
    for pat in [
        r'<meta[^>]*property=["\']og:image["\'][^>]*content=["\']([^"\']+)["\']',
        r'<meta[^>]*content=["\']([^"\']+)["\'][^>]*property=["\']og:image["\']',
    ]:
        m = re.search(pat, html, re.I)
        if m:
            return m.group(1).strip()
    return None

# Priority 1: manual IMAGE_URL
source_url = IMAGE_URL or None

# Priority 2: Bing image search
if not source_url and title:
    # Search for the product specifically — append "product" to get product photos not editorial
    search_query = f'{title} product'
    source_url = bing_image_search(search_query)

# Priority 3: Try manufacturer page via OG image (brand-aware)
if not source_url and title:
    brand_map = {
        'olight': 'https://www.olight.com/store/',
        'magpul': 'https://www.magpul.com/products/',
        'vortex': 'https://www.vortexoptics.com/search?q=',
        'holosun': 'https://www.holosun.com/search?q=',
        'streamlight': 'https://www.streamlight.com/en-us/search.html?q=',
        'caldwell': 'https://www.battenfeld-technologies.com/search?q=',
    }
    title_lower = title.lower()
    for brand, base_url in brand_map.items():
        if brand in title_lower:
            product_name = urllib.parse.quote(title)
            html = try_fetch(base_url + product_name, f'{brand} site')
            if html:
                img = extract_og_image(html)
                if img:
                    source_url = img
                    print(f'Got image from {brand} site: {img[:80]}')
                    break

if not source_url:
    print('No image source found — skipping image update')
else:
    print(f'Using image: {source_url[:100]}')

# ── 3. Download + upload image to Sanity CDN ──────────────────────────────────
sanity_url = None
if source_url:
    try:
        req2 = urllib.request.Request(source_url, headers={
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://www.google.com/',
        })
        with urllib.request.urlopen(req2, timeout=15) as r:
            img_data = r.read()
        print(f'Downloaded {len(img_data)} bytes')

        # Detect content type
        ct = 'image/jpeg'
        if source_url.lower().endswith('.png'):
            ct = 'image/png'
        elif source_url.lower().endswith('.webp'):
            ct = 'image/webp'

        upload_url = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/{DATASET}'
        req3 = urllib.request.Request(
            upload_url, method='POST', data=img_data,
            headers={
                'Authorization': f'Bearer {SANITY_TOKEN}',
                'Content-Type': ct,
                'x-sanity-label': f'amazon-{ASIN}',
            }
        )
        with urllib.request.urlopen(req3, timeout=30) as r:
            asset = json.loads(r.read())

        sanity_url = (asset.get('document') or {}).get('url') or asset.get('url')
        print(f'Sanity CDN: {sanity_url}')
    except Exception as e:
        print(f'Image upload failed: {e}')

# ── 4. Patch the Sanity document ──────────────────────────────────────────────
patch_set = {}
# Only update title if it's still the generic fallback
if not doc.get('title') or doc['title'].startswith('Amazon Product'):
    # Don't override a real title — only patch if it's the generic placeholder
    pass

if sanity_url:
    patch_set['imageUrl'] = sanity_url

if not patch_set:
    print('Nothing to patch'); sys.exit(0)

mutation = {'mutations': [{'patch': {'id': doc['_id'], 'set': patch_set}}]}
req4 = urllib.request.Request(
    f'{API_BASE}/mutate/{DATASET}?returnDocuments=false',
    method='POST', data=json.dumps(mutation).encode(),
    headers={'Authorization': f'Bearer {SANITY_TOKEN}', 'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req4) as r:
    result = json.loads(r.read())
    print(f'Patched: {result}')
    print(f'Done — imageUrl updated to Sanity CDN')
