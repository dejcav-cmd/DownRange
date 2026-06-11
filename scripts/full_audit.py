import os, json, urllib.request, urllib.parse, re, time
from collections import Counter

LOG = 'scripts/diag-result.txt'
open(LOG, 'w').close()
def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f: f.write(msg + '\n')

TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
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

# 1. Full source breakdown
log("=== ALL gunDeal SOURCES ===")
all_docs = q('*[_type=="gunDeal"]{_id, source, externalUrl, imageUrl, _createdAt}')
by_src = Counter(d.get('source','NULL') for d in all_docs)
log(f"Total: {len(all_docs)}")
for src, cnt in sorted(by_src.items(), key=lambda x: -x[1]):
    log(f"  {src}: {cnt}")

# 2. Docs with reddit.com in externalUrl
reddit_url = [d for d in all_docs if 'reddit.com' in (d.get('externalUrl') or '')]
log(f"\n=== REDDIT.COM externalUrl: {len(reddit_url)} ===")
for d in reddit_url:
    log(f"  {d['_id']} | {d.get('_createdAt','?')[:19]} | {d.get('source','')} | {d.get('externalUrl','')[:80]}")

# 3. Missing images - breakdown
missing = [d for d in all_docs if not d.get('imageUrl')]
log(f"\n=== MISSING imageUrl: {len(missing)} ===")
by_src_missing = Counter(d.get('source','NULL') for d in missing)
for src, cnt in sorted(by_src_missing.items(), key=lambda x: -x[1]):
    log(f"  {src}: {cnt}")

# Sample newest missing docs
log("\n=== NEWEST 10 MISSING IMAGE DOCS ===")
newest_missing = sorted(missing, key=lambda x: x.get('_createdAt',''), reverse=True)[:10]
for d in newest_missing:
    log(f"  {d['_id']} | {d.get('_createdAt','?')[:19]} | [{d.get('source','')}] | {d.get('externalUrl','')[:70]}")

# 4. NOW: delete all reddit.com externalUrl docs + fix all missing images
log(f"\n=== STEP 1: DELETE {len(reddit_url)} REDDIT DOCS ===")
if reddit_url:
    muts = [{'delete': {'id': d['_id']}} for d in reddit_url]
    for i in range(0, len(muts), 100):
        mutate(muts[i:i+100])
        log(f"  Deleted {len(muts[i:i+100])} docs")
    log(f"  DONE")

# 5. Scrape + upload images for ALL missing gun.deals docs
log(f"\n=== STEP 2: FIX {len([d for d in missing if d.get('source') == 'gun.deals'])} MISSING GUN.DEALS IMAGES ===")

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
            return r.read(), r.headers.get('content-type','image/jpeg')
    except: return None, None

def upload_sanity(data, ct, filename):
    try:
        ext = 'webp' if 'webp' in ct else 'png' if 'png' in ct else 'jpg'
        safe = re.sub(r'[^\w.-]','_', filename or 'deal')[:60] + '.' + ext
        res = urllib.request.urlopen(urllib.request.Request(
            f'https://vbnsqnkg.api.sanity.io/v2024-01-01/assets/images/production',
            data=data,
            headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': ct,
                     'Content-Disposition': f'attachment; filename="{safe}"'},
            method='POST'
        ), timeout=30)
        doc = json.loads(res.read()).get('document', {})
        return doc.get('url')
    except Exception as e:
        log(f"    upload error: {e}")
        return None

# Re-query missing after delete
missing_gd = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "") && source == "gun.deals"] | order(_createdAt desc) {_id, externalUrl}')
log(f"gun.deals docs needing images: {len(missing_gd)}")

updates = []
stats = {'scraped': 0, 'uploaded': 0, 'fallback': 0, 'failed': 0}

for doc in missing_gd:
    url = doc.get('externalUrl','')
    if not url: continue
    og = scrape_og(url)
    if not og:
        stats['failed'] += 1
        log(f"  ✗ scrape: {url[:70]}")
        continue
    stats['scraped'] += 1
    data, ct = download_img(og)
    if data:
        sanity_url = upload_sanity(data, ct, og.split('/')[-1].split('?')[0])
        if sanity_url:
            updates.append((doc['_id'], sanity_url))
            stats['uploaded'] += 1
            log(f"  ✓ cdn: {sanity_url[:80]}")
            if len(updates) >= 50:
                mutate([{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates])
                log(f"  → patched {len(updates)}")
                updates = []
            continue
    # fallback: store gun.deals URL (proxy handles it)
    updates.append((doc['_id'], og))
    stats['fallback'] += 1
    log(f"  ~ fallback: {og[:70]}")
    if len(updates) >= 50:
        mutate([{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates])
        log(f"  → patched {len(updates)}")
        updates = []
    time.sleep(0.2)

if updates:
    mutate([{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates])
    log(f"  → patched final {len(updates)}")

log(f"\nStats: scraped={stats['scraped']} uploaded={stats['uploaded']} fallback={stats['fallback']} failed={stats['failed']}")

# Final count
final_total = q('count(*[_type=="gunDeal"])')
final_missing = q('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')
final_reddit = q('count(*[_type=="gunDeal" && (source == "GunDeals Reddit" || source == "r/gundeals" || string::startsWith(externalUrl, "https://www.reddit.com"))])')
log(f"\n=== FINAL STATE ===")
log(f"Total: {final_total}  Missing images: {final_missing}  Reddit docs: {final_reddit}")
log("DONE")
