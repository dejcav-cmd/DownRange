"""
Fix specific articles with placeholder imageUrl.
Scrape real OG images from their externalUrl and patch Sanity.
Also find and fix all articles with /img/photos/* as imageUrl.
"""
import urllib.request, urllib.parse, json, re, os

TOKEN = os.environ.get('SANITY_TOKEN','')
BASE  = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'
MUTATE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production'

SCRAPE_HEADERS = {
    'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept':          'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
}

def q(groq):
    url = f'{BASE}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())['result']

def patch(doc_id, imageUrl):
    body = json.dumps({'mutations':[{'patch':{'id':doc_id,'set':{'imageUrl':imageUrl}}}]}).encode()
    req  = urllib.request.Request(MUTATE, data=body, method='POST', headers={
        'Authorization': f'Bearer {TOKEN}',
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

lines = ['=== ARTICLE IMAGE FIX ===\n']

# Find all articles with placeholder /img/photos/* as imageUrl (AND no heroImage)
docs = q('*[_type=="newsArticle" && approved==true && defined(externalUrl) && imageUrl match "/img/*" && !defined(heroImage.asset)] | order(publishedAt desc) [0..99] { _id, title, imageUrl, externalUrl, slug }')
lines.append(f'Articles with placeholder imageUrl: {len(docs)}')

updated = 0
failed  = 0

for doc in docs:
    ext_url = doc.get('externalUrl','')
    if not ext_url:
        failed += 1
        continue
    
    img = scrape_og(ext_url)
    if img and img.startswith('http'):
        patch(doc['_id'], img)
        updated += 1
        lines.append(f'  ✓ {doc["slug"].get("current","")[:50]} → {img[:60]}')
    else:
        failed += 1
        lines.append(f'  ✗ {doc["slug"].get("current","")[:50]} (no OG at {ext_url[:60]})')

lines.append(f'\nUpdated: {updated}, Failed: {failed}')
result = '\n'.join(lines)
print(result)
with open('scripts/article-fix-result.txt', 'w') as f:
    f.write(result + '\n')
