import sys, os, time, json, re
import urllib.request, urllib.parse
from html import unescape

os.makedirs('scripts', exist_ok=True)
LOG = 'scripts/diag-result.txt'

def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f:
        f.write(msg + '\n')

with open(LOG, 'w') as f:
    f.write('DEALS IMAGE BACKFILL\n')

try:
    TOKEN = os.environ['SANITY_API_TOKEN']
    if TOKEN.startswith('ST='):
        TOKEN = TOKEN[3:]

    BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
    H_READ  = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}
    H_WRITE = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json', 'Content-Type': 'application/json'}

    def sanity_query(groq):
        url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
        req = urllib.request.Request(url, headers=H_READ)
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()).get('result', [])

    def sanity_mutate(mutations):
        url = f'{BASE}/mutate/production?returnDocuments=false'
        body = json.dumps({'mutations': mutations}).encode()
        req = urllib.request.Request(url, data=body, headers=H_WRITE, method='POST')
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read())

    SCRAPE_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    def scrape_og_image(url):
        try:
            req = urllib.request.Request(url, headers=SCRAPE_HEADERS)
            with urllib.request.urlopen(req, timeout=12) as r:
                html = r.read().decode('utf-8', errors='replace')
            m = re.search(r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']', html, re.I) \
             or re.search(r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']', html, re.I)
            return m.group(1).strip() if m else None
        except Exception as e:
            return None

    # Get all docs missing imageUrl
    log("\nFetching docs without images...")
    groq = '*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")] | order(publishedAt desc) { _id, externalUrl, title }'
    docs = sanity_query(groq)
    log(f"Found {len(docs)} docs without images")

    stats = {'attempted': 0, 'scraped': 0, 'failed': 0, 'no_url': 0, 'patched': 0, 'patch_errors': 0}

    # Process in batches of 5 concurrent (sequential for reliability in Actions)
    BATCH = 5
    updates = []  # accumulate (id, imageUrl) pairs for batch patching

    for i in range(0, len(docs), BATCH):
        chunk = docs[i:i+BATCH]
        results = []
        for doc in chunk:
            url = doc.get('externalUrl')
            if not url:
                stats['no_url'] += 1
                continue
            stats['attempted'] += 1
            img = scrape_og_image(url)
            if img:
                stats['scraped'] += 1
                updates.append((doc['_id'], img))
                log(f"  ✓ {doc['_id'][:20]} | {img[:70]}")
            else:
                stats['failed'] += 1
                log(f"  ✗ {doc['_id'][:20]} | {url[:60]} - no image")

        # Commit accumulated updates in batches of 100
        if len(updates) >= 50:
            mutations = [{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates]
            try:
                sanity_mutate(mutations)
                stats['patched'] += len(mutations)
                log(f"  → Committed {len(mutations)} patches")
                updates = []
            except Exception as e:
                stats['patch_errors'] += len(mutations)
                log(f"  → PATCH ERROR: {e}")
                updates = []

        time.sleep(0.5)  # brief pause between chunks

    # Commit remaining
    if updates:
        mutations = [{'patch': {'id': uid, 'set': {'imageUrl': img}}} for uid, img in updates]
        try:
            sanity_mutate(mutations)
            stats['patched'] += len(mutations)
            log(f"  → Committed final {len(mutations)} patches")
        except Exception as e:
            stats['patch_errors'] += len(mutations)
            log(f"  → FINAL PATCH ERROR: {e}")

    log(f"\n=== BACKFILL COMPLETE ===")
    log(f"Attempted:    {stats['attempted']}")
    log(f"Scraped OK:   {stats['scraped']}")
    log(f"Failed scrape:{stats['failed']}")
    log(f"No URL:       {stats['no_url']}")
    log(f"Patched:      {stats['patched']}")
    log(f"Patch errors: {stats['patch_errors']}")

    # Also fix HTML entities in titles while we're at it
    log(f"\n=== FIXING HTML ENTITIES IN TITLES ===")
    entity_groq = '*[_type=="gunDeal" && (title match "*&amp;*" || title match "*&quot;*" || title match "*&#*")]{_id, title}'
    entity_docs = sanity_query(entity_groq)
    log(f"Found {len(entity_docs)} docs with HTML entities in title")

    entity_updates = []
    for doc in entity_docs:
        clean = unescape(doc.get('title', ''))
        if clean != doc.get('title'):
            entity_updates.append((doc['_id'], clean))

    if entity_updates:
        mutations = [{'patch': {'id': uid, 'set': {'title': t}}} for uid, t in entity_updates]
        # Batch at 100
        for j in range(0, len(mutations), 100):
            batch = mutations[j:j+100]
            try:
                sanity_mutate(batch)
                log(f"  → Fixed {len(batch)} entity titles")
            except Exception as e:
                log(f"  → Entity fix error: {e}")
    else:
        log("  No entity titles found (may use different pattern)")

    # Try broader entity check with raw field read
    broad_groq = '*[_type=="gunDeal"] | order(publishedAt desc) [0..300] {_id, title}'
    all_titles = sanity_query(broad_groq)
    broad_fixes = []
    for doc in all_titles:
        t = doc.get('title', '')
        clean = unescape(t)
        if clean != t:
            broad_fixes.append((doc['_id'], clean))
    
    if broad_fixes:
        log(f"  Found {len(broad_fixes)} more docs with entities via broad scan")
        mutations = [{'patch': {'id': uid, 'set': {'title': t}}} for uid, t in broad_fixes]
        for j in range(0, len(mutations), 100):
            batch = mutations[j:j+100]
            try:
                sanity_mutate(batch)
                log(f"  → Fixed {len(batch)} entity titles (broad)")
            except Exception as e:
                log(f"  → Broad fix error: {e}")
    else:
        log("  No additional entity titles found")

    log(f"\nALL DONE")

except Exception as e:
    import traceback
    log(f"FATAL: {e}")
    log(traceback.format_exc())
