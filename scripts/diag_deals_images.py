import sys, os, time, json, re
import urllib.request, urllib.parse

os.makedirs('scripts', exist_ok=True)

LOG = 'scripts/diag-result.txt'
def log(msg):
    print(msg)
    with open(LOG, 'a') as f:
        f.write(msg + '\n')

with open(LOG, 'w') as f:
    f.write('DEALS IMAGE DIAGNOSTIC\n')

try:
    TOKEN = os.environ['SANITY_API_TOKEN']
    # Strip ST= prefix if present
    if TOKEN.startswith('ST='):
        TOKEN = TOKEN[3:]

    BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
    H = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}

    def sanity_query(groq):
        url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
        req = urllib.request.Request(url, headers=H)
        with urllib.request.urlopen(req, timeout=30) as r:
            return json.loads(r.read()).get('result', [])

    # 1. Count totals
    total = sanity_query('count(*[_type=="gunDeal"])') 
    has_img = sanity_query('count(*[_type=="gunDeal" && defined(imageUrl) && imageUrl != null && imageUrl != ""])')
    missing = sanity_query('count(*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")])')
    has_url = sanity_query('count(*[_type=="gunDeal" && defined(externalUrl)])')

    log(f"\n=== COUNTS ===")
    log(f"Total gunDeal docs:   {total}")
    log(f"Has imageUrl:         {has_img}")
    log(f"Missing imageUrl:     {missing}")
    log(f"Has externalUrl:      {has_url}")

    # 2. Sample docs with images — check if URLs look valid
    log(f"\n=== SAMPLE WITH IMAGES (first 5) ===")
    with_img = sanity_query('*[_type=="gunDeal" && defined(imageUrl) && imageUrl != null][0..4]{_id, title, imageUrl, source}')
    for d in with_img:
        log(f"  [{d.get('source','')}] {(d.get('title') or '')[:60]}")
        log(f"    img: {(d.get('imageUrl') or '')[:100]}")

    # 3. Sample docs WITHOUT images
    log(f"\n=== SAMPLE WITHOUT IMAGES (first 10) ===")
    without_img = sanity_query('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null || imageUrl == "")][0..9]{_id, title, externalUrl, source}')
    for d in without_img:
        log(f"  [{d.get('source','')}] {(d.get('title') or '')[:60]}")
        log(f"    url: {(d.get('externalUrl') or 'NO URL')[:80]}")

    # 4. Sources breakdown
    log(f"\n=== SOURCE BREAKDOWN ===")
    sources = sanity_query('*[_type=="gunDeal"]{source}')
    src_counts = {}
    for s in sources:
        k = s.get('source') or 'unknown'
        src_counts[k] = src_counts.get(k, 0) + 1
    for k, v in sorted(src_counts.items(), key=lambda x: -x[1]):
        log(f"  {k}: {v}")

    # 5. Test OG scrape on a few missing-image URLs
    log(f"\n=== OG SCRAPE TEST (3 docs without images) ===")
    test_docs = sanity_query('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null) && defined(externalUrl)][0..2]{_id, externalUrl, title}')
    
    SCRAPE_HEADERS = {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
    }

    for doc in test_docs:
        url = doc.get('externalUrl')
        if not url:
            log(f"  SKIP (no URL): {doc['_id']}")
            continue
        log(f"\n  Testing: {url[:80]}")
        try:
            req = urllib.request.Request(url, headers=SCRAPE_HEADERS)
            with urllib.request.urlopen(req, timeout=10) as r:
                html = r.read().decode('utf-8', errors='replace')
                status = r.status
            log(f"  HTTP {status}, HTML len={len(html)}")
            m = re.search(r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']', html, re.I) \
             or re.search(r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']', html, re.I)
            if m:
                log(f"  OG IMAGE FOUND: {m.group(1)[:100]}")
            else:
                log(f"  NO OG IMAGE in HTML")
                # Show first og: meta we find
                og_tags = re.findall(r'<meta[^>]+property=["\']og:[^"\']+["\'][^>]*>', html[:5000])
                log(f"  OG tags found: {og_tags[:3]}")
        except Exception as e:
            log(f"  SCRAPE ERROR: {e}")

    log(f"\nDIAGNOSTIC COMPLETE")

except Exception as e:
    import traceback
    log(f"FATAL ERROR: {e}")
    log(traceback.format_exc())
