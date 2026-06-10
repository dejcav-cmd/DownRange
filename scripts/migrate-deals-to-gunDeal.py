"""
Migrate all newsArticle docs with category='deals' to gunDeal type.
Steps:
1. Query all newsArticle category=deals
2. For each: scrape OG image from externalUrl
3. Create corresponding gunDeal doc
4. Delete the original newsArticle doc
"""
import urllib.request, urllib.parse, json, re, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed

TOKEN  = os.environ.get('SANITY_TOKEN','')
BASE   = f'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'
MUTATE = f'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production'

SCRAPE_HEADERS = {
    'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language':'en-US,en;q=0.5',
}

def q(groq):
    url = f'{BASE}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())['result']

def mutate(mutations):
    body = json.dumps({'mutations': mutations}).encode()
    req  = urllib.request.Request(MUTATE, data=body, method='POST', headers={
        'Authorization': f'Bearer {TOKEN}',
        'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def scrape_og(url):
    if 'reddit.com' in (url or ''):
        return None  # Reddit blocks scrapers
    try:
        req = urllib.request.Request(url, headers=SCRAPE_HEADERS)
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='replace')
        for pat in [
            r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']',
            r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']',
            r'<meta[\s\S]*?name=["\']twitter:image["\'][\s\S]*?content=["\']([^"\']+)["\']',
        ]:
            m = re.search(pat, html, re.I)
            if m and m.group(1).startswith('http'):
                return m.group(1).strip()
    except:
        pass
    return None

def detect_category(title, cats=''):
    t = (title + ' ' + cats).lower()
    if re.search(r'ammo|9mm|rounds?|\.223|5\.56|bulk|cartridge|grain|fmj|jhp', t): return 'ammo'
    if re.search(r'ar-15|ar15|rifle|ak-47|carbine', t): return 'rifle'
    if re.search(r'pistol|glock|handgun|sig |p365|p320|1911|revolver', t): return 'pistol'
    if re.search(r'shotgun|gauge|mossberg', t): return 'shotgun'
    if re.search(r'suppressor|silencer|nfa', t): return 'suppressor'
    if re.search(r'optic|scope|red dot|sight|eotech|vortex', t): return 'optic'
    if re.search(r'holster|magazine|mag |parts|trigger|light|sling|grip', t): return 'accessory'
    return 'deal'

# ── STEP 1: Count and fetch all newsArticle category=deals ────────────────────
total = q('count(*[_type=="newsArticle" && category=="deals"])')
print(f'Found {total} newsArticle docs with category=deals')

docs = q('*[_type=="newsArticle" && category=="deals"] | order(publishedAt desc) [0..499] { _id, title, summary, externalUrl, source, publishedAt, imageUrl, tags }')
print(f'Processing {len(docs)} docs')

lines = [f'=== MIGRATE newsArticle category=deals → gunDeal ===']
lines.append(f'Total found: {total}')
lines.append(f'Processing: {len(docs)}\n')

# ── STEP 2: Process each doc ──────────────────────────────────────────────────
stats = {'created': 0, 'deleted': 0, 'skipped': 0, 'img_ok': 0}
BATCH_SIZE = 20

for i in range(0, len(docs), BATCH_SIZE):
    batch = docs[i:i+BATCH_SIZE]
    mutations = []

    # Scrape OG images concurrently for this batch
    img_map = {}
    with ThreadPoolExecutor(max_workers=5) as ex:
        futures = {ex.submit(scrape_og, d.get('externalUrl','')): d['_id'] for d in batch}
        for future in as_completed(futures):
            doc_id = futures[future]
            img = future.result()
            if img:
                img_map[doc_id] = img
                stats['img_ok'] += 1

    for doc in batch:
        ext    = doc.get('externalUrl','')
        title  = doc.get('title','')
        src    = doc.get('source','')
        pub    = doc.get('publishedAt','')
        price  = (title or '').split('$')[1].split()[0] if '$' in (title or '') else ''
        price  = f'${price}' if price else ''
        img    = img_map.get(doc['_id']) or None
        
        # Don't replace existing good imageUrl if we couldn't scrape a new one
        existing_img = doc.get('imageUrl','')
        bad_prefixes = ['/img/', '/public/']
        if not img and existing_img and not any(existing_img.startswith(p) for p in bad_prefixes):
            img = existing_img

        gd_id = doc['_id'].replace('news-', 'gd-')
        
        # Create gunDeal doc
        mutations.append({'createOrReplace': {
            '_id':         gd_id,
            '_type':       'gunDeal',
            'title':       title,
            'summary':     doc.get('summary',''),
            'externalUrl': ext,
            'source':      src,
            'category':    detect_category(title),
            'approved':    True,
            'publishedAt': pub or new_time if (new_time := None) else pub,
            'imageUrl':    img,
            'price':       price,
            'tags':        doc.get('tags',[]) or ['deals'],
        }})

        # Delete original newsArticle
        mutations.append({'delete': {'id': doc['_id']}})
        stats['created'] += 1
        stats['deleted'] += 1

    if mutations:
        try:
            mutate(mutations)
            print(f'  Batch {i//BATCH_SIZE + 1}: created {len(batch)} gunDeals, deleted {len(batch)} newsArticles')
        except Exception as e:
            print(f'  Batch error: {e}')
            stats['skipped'] += len(batch)

    time.sleep(0.5)  # rate limit

# ── STEP 3: Verify ────────────────────────────────────────────────────────────
remaining = q('count(*[_type=="newsArticle" && category=="deals"])')
new_deals  = q('count(*[_type=="gunDeal"])')
with_img   = q('count(*[_type=="gunDeal" && defined(imageUrl) && imageUrl != ""])')

lines.append(f'Created gunDeal docs: {stats["created"]}')
lines.append(f'Deleted newsArticles: {stats["deleted"]}')
lines.append(f'Images scraped: {stats["img_ok"]}')
lines.append(f'\nPOST-MIGRATION:')
lines.append(f'newsArticle category=deals remaining: {remaining}')
lines.append(f'Total gunDeal docs: {new_deals}')
lines.append(f'gunDeal with image: {with_img}')

result = '\n'.join(lines)
print(f'\n{result}')
with open('scripts/migrate-result.txt','w') as f:
    f.write(result+'\n')
