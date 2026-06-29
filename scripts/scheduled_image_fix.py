"""
Scheduled image fix — runs every 30min via GH Actions.
1. Deletes any gunDeal docs with reddit.com externalUrl
2. Scrapes + uploads images to Sanity CDN for all missing-image gun.deals docs
3. Scrapes OG images for missing AmmoLand docs
"""
import os, json, urllib.request, urllib.parse, re, time

LOG = 'scripts/diag-result.txt'
open(LOG, 'w').close()
def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f: f.write(msg + '\n')

TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
PROJECT = 'vbnsqnkg'
BASE = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data'
H_R = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}
H_W = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json', 'Content-Type': 'application/json'}

def q(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H_R)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

def mutate(mutations):
    url = f'{BASE}/mutate/production?returnDocuments=false'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers=H_W, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

SCRAPE_H = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
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
    except: return None

def download_img(url):
    try:
        req = urllib.request.Request(url, headers=IMG_H)
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read(), r.headers.get('content-type', 'image/jpeg')
    except: return None, None

def upload_sanity(data, ct, filename):
    try:
        ext = 'webp' if 'webp' in ct else 'png' if 'png' in ct else 'jpg'
        safe = re.sub(r'[^\w.-]', '_', filename or 'deal')[:60] + '.' + ext
        res = urllib.request.urlopen(urllib.request.Request(
            f'https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production',
            data=data,
            headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': ct,
                     'Content-Disposition': f'attachment; filename="{safe}"'},
            method='POST'
        ), timeout=30)
        doc = json.loads(res.read()).get('document', {})
        return doc.get('url')
    except Exception as e:
        return None

# ── STEP 1: Delete Reddit docs ────────────────────────────────────────────────
log("=== STEP 1: DELETE REDDIT DOCS ===")
reddit_docs = q('''*[_type=="gunDeal" && (
    source == "GunDeals Reddit" ||
    source == "r/gundeals" ||
    string::startsWith(externalUrl, "https://www.reddit.com") ||
    string::startsWith(externalUrl, "https://reddit.com")
)] { _id, source, externalUrl }''')

if reddit_docs:
    muts = [{'delete': {'id': d['_id']}} for d in reddit_docs]
    for i in range(0, len(muts), 100):
        mutate(muts[i:i+100])
    log(f"Deleted {len(reddit_docs)} Reddit docs")
else:
    log("No Reddit docs found ✓")

# ── STEP 2: Fix missing images ────────────────────────────────────────────────
log("\n=== STEP 2: FIX MISSING IMAGES ===")
missing = q('''*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(_createdAt desc) { _id, externalUrl, source }''')
log(f"Missing: {len(missing)}")

updates = []
stats = {'uploaded': 0, 'fallback': 0, 'failed': 0}

for doc in missing:
    url = doc.get('externalUrl', '')
    src = doc.get('source', '')
    if not url:
        continue

    # Skip coupon/category pages (no product image)
    if '/content/coupon-store' in url or '/content/coupon' in url:
        log(f"  skip coupon: {url[:60]}")
        continue

    og = scrape_og(url)
    if not og:
        stats['failed'] += 1
        log(f"  ✗ {url[:70]}")
        continue

    # For gun.deals: download + upload to Sanity CDN
    if 'gun.deals' in url or 'gun.deals' in (og or ''):
        data, ct = download_img(og)
        if data:
            cdn_url = upload_sanity(data, ct, og.split('/')[-1].split('?')[0])
            if cdn_url:
                updates.append((doc['_id'], cdn_url))
                stats['uploaded'] += 1
                log(f"  ✓ cdn: {cdn_url[:80]}")
                if len(updates) >= 50:
                    mutate([{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates])
                    log(f"  → patched {len(updates)}")
                    updates = []
                time.sleep(0.1)
                continue

    # For AmmoLand and others: store OG URL directly (publicly accessible)
    updates.append((doc['_id'], og))
    stats['fallback'] += 1
    log(f"  ~ og: {og[:70]}")
    if len(updates) >= 50:
        mutate([{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates])
        log(f"  → patched {len(updates)}")
        updates = []
    time.sleep(0.1)

if updates:
    mutate([{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates])
    log(f"  → patched final {len(updates)}")

log(f"\nStats: uploaded={stats['uploaded']} fallback={stats['fallback']} failed={stats['failed']}")

# ── FINAL STATE ───────────────────────────────────────────────────────────────
total   = q('count(*[_type=="gunDeal"])')
missing = q('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')
reddit  = q('count(*[_type=="gunDeal" && (source == "GunDeals Reddit" || string::startsWith(externalUrl, "https://www.reddit.com"))])')
log(f"\n=== FINAL: total={total} missing_images={missing} reddit={reddit} ===")

# ── COMMIT SIGNAL ─────────────────────────────────────────────────────────────
# Write a machine-readable line so the GH Actions workflow knows whether
# to commit this file. "FIXED: 0" means nothing changed → no commit.
fixed_total = stats['uploaded'] + stats['fallback']
log(f"\nFIXED: {fixed_total}")
