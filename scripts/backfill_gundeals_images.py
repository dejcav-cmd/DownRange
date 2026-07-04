"""
One-shot backfill: re-scrape and upload to Sanity CDN for ALL gunDeal docs
that have a gun.deals imageUrl (hotlink-blocked by Cloudflare) or null imageUrl.

Run via GitHub Actions: .github/workflows/backfill-gundeals-images.yml
"""
import os, json, urllib.request, urllib.parse, re, time

LOG = 'scripts/diag-result.txt'
open(LOG, 'w').close()
def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f: f.write(msg + '\n')

TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
PROJECT = 'vbnsqnkg'
DATASET = 'production'
BASE = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data'
H_R = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}
H_W = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json', 'Content-Type': 'application/json'}

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

def q(groq):
    url = f'{BASE}/query/{DATASET}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H_R)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

def mutate(mutations):
    url = f'{BASE}/mutate/{DATASET}?returnDocuments=false'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers=H_W, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def scrape_og(page_url):
    """Scrape og:image from a page, unwrapping cdn-cgi transforms."""
    try:
        req = urllib.request.Request(page_url, headers=SCRAPE_H)
        with urllib.request.urlopen(req, timeout=15) as r:
            html = r.read().decode('utf-8', errors='replace')
    except Exception as e:
        return None, f'fetch_fail:{e}'

    m = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', html, re.I) \
     or re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image', html, re.I)
    if not m:
        return None, 'no_og_tag'

    img_url = m.group(1).strip()

    # Unwrap Cloudflare cdn-cgi image transforms:
    # https://gun.deals/cdn-cgi/image/format=auto,width=800/https://gun.deals/sites/default/files/foo.jpg
    # https://gun.deals/cdn-cgi/image/f=auto/sites/default/files/foo.jpg
    cgi = re.match(r'.*/cdn-cgi/image/[^/]+/(.+)', img_url)
    if cgi:
        downstream = cgi.group(1)
        if downstream.startswith('http://') or downstream.startswith('https://'):
            img_url = downstream  # full URL — use as-is
        else:
            img_url = 'https://gun.deals/' + downstream.lstrip('/')

    return img_url, 'ok'

def download_img(url):
    """Download image bytes with gun.deals Referer header."""
    try:
        req = urllib.request.Request(url, headers=IMG_H)
        with urllib.request.urlopen(req, timeout=15) as r:
            ct = r.headers.get('content-type', 'image/jpeg')
            data = r.read()
            if len(data) < 3000:
                return None, None  # too small — likely an error page
            return data, ct
    except:
        return None, None

def upload_sanity(data, ct, filename):
    """Upload image bytes to Sanity CDN. Returns cdn.sanity.io URL."""
    try:
        ext = 'webp' if 'webp' in ct else 'png' if 'png' in ct else 'jpg'
        safe = re.sub(r'[^\w.-]', '_', filename or 'deal')[:60] + '.' + ext
        url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/{DATASET}'
        req = urllib.request.Request(url, data=data, headers={
            'Authorization': f'Bearer {TOKEN}',
            'Content-Type': ct,
            'Content-Disposition': f'attachment; filename="{safe}"',
        }, method='POST')
        with urllib.request.urlopen(req, timeout=30) as r:
            doc = json.loads(r.read()).get('document', {})
            return doc.get('url')
    except:
        return None

# ── AUDIT ─────────────────────────────────────────────────────────────────────
log('=== AUDIT: counting deals by image state ===')
total_count = q('count(*[_type=="gunDeal"])')
cdn_count   = q('count(*[_type=="gunDeal" && string::startsWith(imageUrl, "https://cdn.sanity.io")])')
gd_count    = q('count(*[_type=="gunDeal" && string::startsWith(imageUrl, "https://gun.deals")])')
null_count  = q('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')
other_count = total_count - cdn_count - gd_count - null_count

log(f'Total deals:              {total_count}')
log(f'  cdn.sanity.io (stable): {cdn_count}')
log(f'  gun.deals URL (broken): {gd_count}')
log(f'  Null/empty:             {null_count}')
log(f'  Other URL:              {other_count}')
log(f'  NEEDS FIX:              {gd_count + null_count}')

# ── PROCESS IN BATCHES ────────────────────────────────────────────────────────
BATCH = 100
stats = {'uploaded': 0, 'fallback_og': 0, 'failed': 0, 'skipped': 0}

offset = 0
while True:
    docs = q(f'''*[_type=="gunDeal" && (
      !defined(imageUrl) || imageUrl == null || imageUrl == ""
      || string::startsWith(imageUrl, "https://gun.deals")
      || string::startsWith(imageUrl, "http://gun.deals")
    )] | order(_createdAt desc) [{offset}..{offset + BATCH - 1}] {{
      _id, externalUrl, title, imageUrl
    }}''')

    if not docs:
        break

    log(f'\n--- Batch offset={offset}, count={len(docs)} ---')
    mutations = []

    for doc in docs:
        doc_id  = doc['_id']
        ext_url = doc.get('externalUrl', '')
        title   = (doc.get('title') or '')[:50]
        old_img = (doc.get('imageUrl') or 'null')[:70]

        if not ext_url:
            stats['skipped'] += 1
            continue

        # Skip coupon/category pages — they have no product image
        if '/content/coupon-store' in ext_url or '/content/coupon' in ext_url:
            stats['skipped'] += 1
            continue

        og_url, method = scrape_og(ext_url)
        if not og_url:
            stats['failed'] += 1
            log(f'  ✗ scrape fail ({method}): {ext_url[:60]}')
            time.sleep(0.3)
            continue

        # Try to download + upload to Sanity CDN
        data, ct = download_img(og_url)
        if data:
            slug = re.sub(r'[^a-z0-9]', '-', title.lower())[:40]
            cdn_url = upload_sanity(data, ct, f'deal-{slug}-{doc_id[-6:]}')
            if cdn_url:
                mutations.append({'patch': {'id': doc_id, 'set': {'imageUrl': cdn_url}}})
                stats['uploaded'] += 1
                log(f'  ✓ cdn: {cdn_url[:70]}')
            else:
                # CDN upload failed — store the scraped URL (not gun.deals hotlink)
                mutations.append({'patch': {'id': doc_id, 'set': {'imageUrl': og_url}}})
                stats['fallback_og'] += 1
                log(f'  ~ og fallback: {og_url[:70]}')
        else:
            # Download blocked — store scraped URL anyway
            mutations.append({'patch': {'id': doc_id, 'set': {'imageUrl': og_url}}})
            stats['fallback_og'] += 1
            log(f'  ~ og (no download): {og_url[:70]}')

        time.sleep(0.4)  # rate-limit scraping

    if mutations:
        mutate(mutations)
        log(f'  → wrote {len(mutations)} mutations')

    offset += BATCH
    if len(docs) < BATCH:
        break  # last batch

# ── FINAL STATE ───────────────────────────────────────────────────────────────
cdn_after  = q('count(*[_type=="gunDeal" && string::startsWith(imageUrl, "https://cdn.sanity.io")])')
gd_after   = q('count(*[_type=="gunDeal" && string::startsWith(imageUrl, "https://gun.deals")])')
null_after = q('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')

log(f'\n=== FINAL STATE ===')
log(f'  cdn.sanity.io: {cdn_after} (was {cdn_count})')
log(f'  gun.deals URL: {gd_after}  (was {gd_count})')
log(f'  null/empty:    {null_after} (was {null_count})')
log(f'\nStats: uploaded={stats["uploaded"]} fallback={stats["fallback_og"]} failed={stats["failed"]} skipped={stats["skipped"]}')
log(f'FIXED: {stats["uploaded"] + stats["fallback_og"]}')
