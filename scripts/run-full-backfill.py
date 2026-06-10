"""
Backfill OG images for gunDeal docs missing imageUrl.
Runs in batches of 100 to fit within GH Actions time limit.
"""
import urllib.request, urllib.parse, json, re, os, time
from concurrent.futures import ThreadPoolExecutor, as_completed

SANITY_TOKEN = os.environ.get('SANITY_TOKEN','')
PROJECT_ID   = 'vbnsqnkg'
DATASET      = 'production'
BASE         = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01/data'

SCRAPE_HEADERS = {
    'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language':'en-US,en;q=0.5',
}

def sanity_query(groq):
    url = f'{BASE}/query/{DATASET}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {SANITY_TOKEN}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['result']

def sanity_patch(doc_id, image_url):
    body = json.dumps({'mutations':[{'patch':{'id':doc_id,'set':{'imageUrl':image_url}}}]}).encode()
    req  = urllib.request.Request(f'{BASE}/mutate/{DATASET}', data=body, method='POST', headers={
        'Authorization':f'Bearer {SANITY_TOKEN}', 'Content-Type':'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def scrape_og(url):
    if not url or 'reddit.com' in url:
        return None
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

def needs_image(doc):
    img = doc.get('imageUrl','') or ''
    if not img: return True
    if img.startswith('/img/') or img.startswith('/public/'): return True
    return False

# Fetch docs without valid images
print('[BACKFILL] Fetching gunDeal docs without valid images...')
all_docs   = sanity_query('*[_type == "gunDeal"] { _id, title, externalUrl, imageUrl }')
to_process = [d for d in all_docs if d.get('externalUrl') and needs_image(d)]
already    = len(all_docs) - len(to_process)
print(f'[BACKFILL] Total: {len(all_docs)} | Have image: {already} | Need image: {len(to_process)}')

# Cap at 100 per run
batch = to_process[:100]
print(f'[BACKFILL] Processing batch of {len(batch)}...')

stats = {'updated':0,'failed':0,'skipped':0}

def process_doc(doc):
    img = scrape_og(doc['externalUrl'])
    if img:
        sanity_patch(doc['_id'], img)
        return ('updated', doc['_id'])
    return ('failed', doc['_id'])

CONCURRENCY = 5
with ThreadPoolExecutor(max_workers=CONCURRENCY) as ex:
    futures = {ex.submit(process_doc, d): d for d in batch}
    for i, future in enumerate(as_completed(futures), 1):
        status, doc_id = future.result()
        stats[status] = stats.get(status,0) + 1
        if i % 10 == 0: print(f'  [{i}/{len(batch)}] updated:{stats["updated"]} failed:{stats["failed"]}')

final_with_img = sanity_query('count(*[_type == "gunDeal" && defined(imageUrl) && imageUrl != "" && !string::startsWith(imageUrl, "/img/")])')

result = f"""=== FULL DEALS IMAGE BACKFILL ===
Docs processed: {len(batch)}
Updated:        {stats['updated']}
Failed:         {stats['failed']}
Remaining need: {len(to_process) - len(batch)}
Final with img: {final_with_img}/{len(all_docs)}
"""
print(result)
with open('scripts/full-backfill-result.txt','w') as f:
    f.write(result+'\n')
