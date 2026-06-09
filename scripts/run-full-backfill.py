"""
Full backfill: scrape OG image for every gunDeal doc and patch Sanity directly.
Runs from GH Actions where gun.deals is accessible.
"""
import urllib.request, urllib.parse, json, re, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed

SANITY_TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT_ID   = 'vbnsqnkg'
DATASET      = 'production'
API_VER      = '2024-01-01'
BASE         = f'https://{PROJECT_ID}.api.sanity.io/v{API_VER}/data'

SCRAPE_HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

def sanity_query(groq):
    url = f'{BASE}/query/{DATASET}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['result']

def sanity_patch(doc_id, image_url):
    url  = f'{BASE}/mutate/{DATASET}'
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': {'imageUrl': image_url}}}]}).encode()
    req  = urllib.request.Request(url, data=body, method='POST', headers={
        'Authorization': f'Bearer {SANITY_TOKEN}',
        'Content-Type':  'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def scrape_og(url):
    try:
        req = urllib.request.Request(url, headers=SCRAPE_HEADERS)
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode('utf-8', errors='replace')
        m = re.search(r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']', html, re.I)
        if not m:
            m = re.search(r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']', html, re.I)
        return m.group(1).strip() if m else None
    except Exception as e:
        return None

# Fetch ALL gunDeal docs regardless of imageUrl
print('[BACKFILL] Fetching all gunDeal docs...')
docs = sanity_query('*[_type == "gunDeal"] { _id, title, externalUrl, imageUrl }')
print(f'[BACKFILL] Found {len(docs)} docs total')

to_process = [d for d in docs if d.get('externalUrl')]
already    = sum(1 for d in docs if d.get('imageUrl'))
print(f'[BACKFILL] {already} already have images. Processing all {len(to_process)}...')

stats = {'updated': 0, 'failed': 0, 'skipped': 0}

def process_doc(doc):
    img = scrape_og(doc['externalUrl'])
    if img:
        sanity_patch(doc['_id'], img)
        return ('updated', doc['_id'], img[:60])
    return ('failed', doc['_id'], doc['externalUrl'][:60])

# 5 concurrent scrapers
CONCURRENCY = 5
with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
    futures = {ex.submit(process_doc, d): d for d in to_process}
    for i, future in enumerate(as_completed(futures), 1):
        status, doc_id, info = future.result()
        stats[status] = stats.get(status, 0) + 1
        if i % 5 == 0 or i == len(to_process):
            print(f'  [{i}/{len(to_process)}] {status}: {info[:50]}')

# Final count
final_count = sanity_query('count(*[_type == "gunDeal" && defined(imageUrl) && imageUrl != ""])')

result = f"""=== FULL DEALS IMAGE BACKFILL ===
Docs processed: {len(to_process)}
Updated:        {stats['updated']}
Failed:         {stats['failed']}
Final with img: {final_count}/{len(docs)}
"""

print(result)
with open('scripts/full-backfill-result.txt', 'w') as f:
    f.write(result + '\n')
