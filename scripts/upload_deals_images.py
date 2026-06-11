import os, json, urllib.request, urllib.parse, re, time
from html import unescape

LOG = 'scripts/diag-result.txt'
open(LOG, 'w').close()
def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f: f.write(msg + '\n')

TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
PROJECT = 'vbnsqnkg'
DATASET = 'production'
BASE = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data'
H_READ  = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}
H_WRITE = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json', 'Content-Type': 'application/json'}

def q(groq):
    url = f'{BASE}/query/{DATASET}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H_READ)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

def mutate(mutations):
    url = f'{BASE}/mutate/{DATASET}?returnDocuments=false'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers=H_WRITE, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

SCRAPE_H = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}
IMG_H = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://gun.deals/',
    'Accept': 'image/webp,image/apng,image/*,*/*',
}

def scrape_og(url):
    try:
        req = urllib.request.Request(url, headers=SCRAPE_H)
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode('utf-8', errors='replace')
        m = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', html, re.I) \
         or re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image', html, re.I)
        return m.group(1).strip() if m else None
    except Exception as e:
        return None

def download_image(url):
    """Download image bytes, trying with gun.deals referer."""
    try:
        req = urllib.request.Request(url, headers=IMG_H)
        with urllib.request.urlopen(req, timeout=15) as r:
            ct = r.headers.get('content-type', 'image/jpeg')
            data = r.read()
            return data, ct
    except Exception as e:
        log(f"    download error: {e}")
        return None, None

def upload_to_sanity(image_bytes, content_type, filename):
    """Upload image to Sanity and return cdn.sanity.io URL."""
    upload_url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/{DATASET}'
    # Determine extension
    ext = 'jpg'
    if 'webp' in content_type: ext = 'webp'
    elif 'png' in content_type: ext = 'png'
    elif 'gif' in content_type: ext = 'gif'
    safe_filename = re.sub(r'[^\w.-]', '_', filename)[:60] + '.' + ext
    
    headers = {
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': content_type,
        'Content-Disposition': f'attachment; filename="{safe_filename}"',
    }
    req = urllib.request.Request(upload_url, data=image_bytes, headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read())
    
    # Return the CDN URL
    doc = result.get('document', {})
    asset_id = doc.get('_id', '')
    url_field = doc.get('url', '')
    if url_field:
        return url_field
    # Construct from asset ID: image-{hash}-{dims}-{ext}
    if asset_id.startswith('image-'):
        return f'https://cdn.sanity.io/images/{PROJECT}/{DATASET}/{asset_id[6:]}'
    return None

# Get ALL docs missing imageUrl (gun.deals source only - those can be scraped)
log("=== FETCHING MISSING GUN.DEALS DOCS ===")
missing = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "") && source == "gun.deals"] | order(_createdAt desc) { _id, externalUrl, title }')
log(f"Found {len(missing)} gun.deals docs without imageUrl")

stats = {'attempted': 0, 'scraped': 0, 'downloaded': 0, 'uploaded': 0, 'patched': 0, 'failed': 0}
updates = []

for doc in missing:
    url = doc.get('externalUrl', '')
    if not url:
        stats['failed'] += 1
        continue
    
    stats['attempted'] += 1
    
    # Step 1: scrape OG image URL
    og_url = scrape_og(url)
    if not og_url:
        log(f"  ✗ scrape failed: {url[:70]}")
        stats['failed'] += 1
        continue
    stats['scraped'] += 1
    
    # Step 2: download image
    img_data, ct = download_image(og_url)
    if not img_data:
        log(f"  ✗ download failed: {og_url[:70]}")
        # Fall back to storing the gun.deals URL directly (proxy will handle it)
        updates.append((doc['_id'], og_url))
        stats['scraped'] += 0  # counted above
        continue
    stats['downloaded'] += 1
    
    # Step 3: upload to Sanity
    try:
        filename = og_url.split('/')[-1].split('?')[0] or 'deal-image'
        sanity_url = upload_to_sanity(img_data, ct or 'image/jpeg', filename)
        if sanity_url:
            updates.append((doc['_id'], sanity_url))
            stats['uploaded'] += 1
            log(f"  ✓ uploaded: {sanity_url[:80]}")
        else:
            # Fall back to gun.deals URL
            updates.append((doc['_id'], og_url))
            log(f"  ~ fallback to OG URL: {og_url[:70]}")
    except Exception as e:
        log(f"  ✗ upload error: {e} — fallback to OG URL")
        updates.append((doc['_id'], og_url))
    
    # Commit in batches of 50
    if len(updates) >= 50:
        muts = [{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates]
        mutate(muts)
        stats['patched'] += len(muts)
        log(f"  → Committed {len(muts)} patches")
        updates = []
    
    time.sleep(0.3)

# Commit remaining
if updates:
    muts = [{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates]
    mutate(muts)
    stats['patched'] += len(muts)
    log(f"  → Committed final {len(muts)} patches")

log(f"\n=== DONE ===")
log(f"Attempted:  {stats['attempted']}")
log(f"Scraped:    {stats['scraped']}")
log(f"Downloaded: {stats['downloaded']}")
log(f"Uploaded:   {stats['uploaded']}")
log(f"Patched:    {stats['patched']}")
log(f"Failed:     {stats['failed']}")

# Also try AmmoLand missing docs (simpler - just scrape OG, no hotlink issue)
log("\n=== AMMOLAND MISSING DOCS ===")
ammo_missing = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "") && source == "AmmoLand"] { _id, externalUrl }')
log(f"Found {len(ammo_missing)}")
ammo_updates = []
for doc in ammo_missing:
    url = doc.get('externalUrl', '')
    if not url: continue
    og = scrape_og(url)
    if og:
        ammo_updates.append((doc['_id'], og))
        log(f"  ✓ {og[:70]}")
    else:
        log(f"  ✗ {url[:60]}")

if ammo_updates:
    muts = [{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in ammo_updates]
    mutate(muts)
    log(f"  → Patched {len(muts)} AmmoLand docs")

log("ALL DONE")
