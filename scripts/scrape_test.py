import os, json, urllib.request, urllib.parse, re

LOG = 'scripts/diag-result.txt'
def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f: f.write(msg + '\n')
open(LOG, 'w').close()

SCRAPE_H = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

# Test the exact URLs from the missing docs (from screenshot)
test_urls = [
    "https://gun.deals/product/lmt-defense-mlc-mars-556-nato-223-rem-16-30r",  # truncated — get full URL
    "https://gun.deals/product/cz-usa-bobwhite-g2-20-ga-3-28-side-side-shot",
    "https://gun.deals/product/holosun-3moa-shake-awake-red-dot-pistol-sigh",
]

# Also get full URLs from Sanity
TOKEN = os.environ['SANITY_API_TOKEN'].lstrip('ST=')
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
H = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}

def q(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result')

# Get full externalUrls for missing docs
missing = q('*[_type=="gunDeal" && (!defined(imageUrl) || imageUrl == null) && source == "gun.deals"] | order(_createdAt desc) [0..4] {_id, externalUrl, _createdAt}')
log("=== MISSING DOCS FULL URLs ===")
for d in missing:
    log(f"  {d['_id']} | created={d.get('_createdAt','')[:19]}")
    log(f"  url: {d.get('externalUrl','')}")

log("\n=== SCRAPE TESTS ===")
for doc in missing[:3]:
    url = doc.get('externalUrl', '')
    if not url: continue
    log(f"\nTesting: {url}")
    try:
        req = urllib.request.Request(url, headers=SCRAPE_H)
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode('utf-8', errors='replace')
            status = r.status
        m = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', html, re.I) \
         or re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image', html, re.I)
        log(f"HTTP {status}, len={len(html)}")
        log(f"og:image: {'FOUND: ' + m.group(1)[:100] if m else 'NOT FOUND'}")
        if not m:
            # Show all og: meta tags
            all_og = re.findall(r'<meta[^>]+og:[^>]+>', html[:10000])
            log(f"All OG tags: {all_og[:5]}")
    except Exception as e:
        log(f"ERROR: {type(e).__name__}: {e}")

# Also test what the cron sees: try to fetch the RSS and scrape first item
log("\n=== CRON RSS TEST ===")
try:
    rss_req = urllib.request.Request(
        'https://gun.deals/feed/syndication/rss',
        headers={'User-Agent': 'DownRange/1.0 (+https://downrangeco.com)'}
    )
    with urllib.request.urlopen(rss_req, timeout=10) as r:
        rss = r.read().decode('utf-8', errors='replace')
    log(f"RSS fetched, len={len(rss)}")
    # Get first item link
    m = re.search(r'<item>.*?<link>(.*?)</link>', rss, re.S)
    if m:
        first_link = m.group(1).strip()
        log(f"First RSS link: {first_link}")
        # Scrape that
        req2 = urllib.request.Request(first_link, headers=SCRAPE_H)
        with urllib.request.urlopen(req2, timeout=10) as r2:
            html2 = r2.read().decode('utf-8', errors='replace')
        m2 = re.search(r'property=["\']og:image["\'][^>]*content=["\']([^"\']+)', html2, re.I) \
          or re.search(r'content=["\']([^"\']+)["\'][^>]*property=["\']og:image', html2, re.I)
        log(f"Scrape result: {'FOUND: ' + m2.group(1)[:100] if m2 else 'NOT FOUND'}, HTTP {r2.status}")
except Exception as e:
    log(f"RSS ERROR: {e}")

log("\nDONE")
