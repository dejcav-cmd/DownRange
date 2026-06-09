"""
Deep diagnosis: 
1. Check gun.deals RSS - get actual URLs
2. Try to scrape OG image from 3 sample URLs
3. Check current Sanity gunDeal docs - how many have imageUrl vs null
4. Sample 5 docs to see their imageUrl values
"""
import urllib.request, urllib.parse, json, re, os

SANITY_TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT_ID   = 'vbnsqnkg'
DATASET      = 'production'
API_VER      = '2024-01-01'

def sanity_query(groq):
    url = f'https://{PROJECT_ID}.api.sanity.io/v{API_VER}/data/query/{DATASET}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['result']

lines = []

# 1. How many gunDeal docs total / with image / without
total     = sanity_query('count(*[_type == "gunDeal"])')
with_img  = sanity_query('count(*[_type == "gunDeal" && defined(imageUrl) && imageUrl != ""])')
no_img    = sanity_query('count(*[_type == "gunDeal" && (!defined(imageUrl) || imageUrl == "")])')
lines.append(f'=== SANITY gunDeal COUNTS ===')
lines.append(f'Total:      {total}')
lines.append(f'With image: {with_img}')
lines.append(f'No image:   {no_img}')

# 2. Sample 5 docs
samples = sanity_query('*[_type == "gunDeal"] | order(publishedAt desc) [0..4] { _id, title, externalUrl, imageUrl }')
lines.append(f'\n=== SAMPLE 5 RECENT gunDeal DOCS ===')
for s in samples:
    lines.append(f'  [{s["_id"][:12]}] {s.get("title","")[:50]}')
    lines.append(f'    url:   {s.get("externalUrl","")[:70]}')
    lines.append(f'    image: {s.get("imageUrl") or "NULL"}')

# 3. Try scraping OG from a real gun.deals URL
lines.append(f'\n=== OG SCRAPE TEST ===')
if samples:
    test_urls = [s['externalUrl'] for s in samples[:3] if s.get('externalUrl')]
    for url in test_urls:
        try:
            req = urllib.request.Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                'Accept-Language': 'en-US,en;q=0.5',
            })
            with urllib.request.urlopen(req, timeout=15) as r:
                html = r.read().decode('utf-8', errors='replace')
            status = r.status
            # Try multiple OG patterns
            og1 = re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html, re.I)
            og2 = re.findall(r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']', html, re.I)
            img_tags = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)[:5]
            lines.append(f'  URL: {url[:60]}')
            lines.append(f'  HTTP: {status}')
            lines.append(f'  og:image pattern1: {og1}')
            lines.append(f'  og:image pattern2: {og2}')
            lines.append(f'  First 5 img srcs: {img_tags}')
            # Show meta tags section
            meta_section = re.findall(r'<meta[^>]+og:image[^>]+>', html, re.I)
            lines.append(f'  Full og:image meta tags: {meta_section}')
        except Exception as e:
            lines.append(f'  URL: {url[:60]} → ERROR: {e}')

# 4. Try gun.deals homepage to see if it's accessible
lines.append(f'\n=== gun.deals ACCESSIBILITY ===')
for test_url in ['https://gun.deals/', 'https://gun.deals/rss.xml']:
    try:
        req = urllib.request.Request(test_url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as r:
            lines.append(f'  {test_url}: HTTP {r.status}, {len(r.read())} bytes')
    except Exception as e:
        lines.append(f'  {test_url}: ERROR {e}')

result = '\n'.join(lines)
print(result)
with open('scripts/deep-deals-diagnosis.txt', 'w') as f:
    f.write(result + '\n')
