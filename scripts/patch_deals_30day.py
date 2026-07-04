"""
Patch gunDeal docs from the last 30 days that have broken/missing images.
Targets: null imageUrl OR gun.deals hotlink-blocked URLs.
Scrapes og:image from source page, downloads, uploads to Sanity CDN.
"""
import os, json, urllib.request, urllib.parse, re, time, datetime

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
SCRAPE_H = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}
IMG_H = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://gun.deals/',
    'Accept': 'image/webp,image/apng,image/*,*/*',
}

def q(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H_R)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

def mutate(muts):
    url = f'{BASE}/mutate/production?returnDocuments=false'
    body = json.dumps({'mutations': muts}).encode()
    req = urllib.request.Request(url, data=body, headers=H_W, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def scrape_og(page_url):
    try:
        req = urllib.request.Request(page_url, headers=SCRAPE_H)
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode('utf-8', errors='replace')
        m = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', html, re.I) \
         or re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image', html, re.I)
        if not m:
            return None
        img_url = m.group(1).strip()
        # Unwrap Cloudflare cdn-cgi transforms
        cgi = re.match(r'.*/cdn-cgi/image/[^/]+/(.+)', img_url)
        if cgi:
            ds = cgi.group(1)
            img_url = ds if ds.startswith('http') else 'https://gun.deals/' + ds.lstrip('/')
        return img_url
    except:
        return None

def download_img(url):
    try:
        req = urllib.request.Request(url, headers=IMG_H)
        with urllib.request.urlopen(req, timeout=15) as r:
            ct = r.headers.get('content-type', 'image/jpeg')
            data = r.read()
            return (data, ct) if len(data) > 3000 else (None, None)
    except:
        return None, None

def upload_sanity(data, ct, filename):
    try:
        ext = 'webp' if 'webp' in ct else 'png' if 'png' in ct else 'jpg'
        safe = re.sub(r'[^\w.-]', '_', filename or 'deal')[:60] + '.' + ext
        url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production'
        req = urllib.request.Request(url, data=data, headers={
            'Authorization': f'Bearer {TOKEN}', 'Content-Type': ct,
            'Content-Disposition': f'attachment; filename="{safe}"',
        }, method='POST')
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()).get('document', {}).get('url')
    except:
        return None

cutoff = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(days=30)).isoformat()

docs = q(f'''*[_type=="gunDeal" && publishedAt > "{cutoff}" && (
  !defined(imageUrl) || imageUrl == null || imageUrl == ""
  || string::startsWith(imageUrl, "https://gun.deals")
  || string::startsWith(imageUrl, "http://gun.deals")
)] | order(publishedAt desc) [0..299] {{ _id, externalUrl, title, imageUrl }}''')

log(f'Last 30 days needing fix: {len(docs)}')
stats = {'uploaded': 0, 'fallback': 0, 'failed': 0, 'skipped': 0}
mutations = []

for doc in docs:
    doc_id  = doc['_id']
    ext_url = doc.get('externalUrl', '')
    title   = (doc.get('title') or '')[:50]

    if not ext_url or '/content/coupon' in ext_url:
        stats['skipped'] += 1
        continue

    og_url = scrape_og(ext_url)
    if not og_url:
        stats['failed'] += 1
        log(f'  X {ext_url[:70]}')
        time.sleep(0.3)
        continue

    data, ct = download_img(og_url)
    if data:
        slug = re.sub(r'[^a-z0-9]', '-', title.lower())[:40]
        cdn_url = upload_sanity(data, ct, f'deal-{slug}-{doc_id[-6:]}')
        if cdn_url:
            mutations.append({'patch': {'id': doc_id, 'set': {'imageUrl': cdn_url}}})
            stats['uploaded'] += 1
            log(f'  ok cdn: {cdn_url[:70]}')
        else:
            mutations.append({'patch': {'id': doc_id, 'set': {'imageUrl': og_url}}})
            stats['fallback'] += 1
            log(f'  ~ og fallback: {og_url[:70]}')
    else:
        mutations.append({'patch': {'id': doc_id, 'set': {'imageUrl': og_url}}})
        stats['fallback'] += 1
        log(f'  ~ og no-dl: {og_url[:70]}')

    time.sleep(0.4)

if mutations:
    for i in range(0, len(mutations), 100):
        mutate(mutations[i:i+100])
    log(f'  wrote {len(mutations)} mutations')

log(f'Stats: uploaded={stats["uploaded"]} fallback={stats["fallback"]} failed={stats["failed"]} skipped={stats["skipped"]}')
log(f'FIXED: {stats["uploaded"] + stats["fallback"]}')
