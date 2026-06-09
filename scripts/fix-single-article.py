import urllib.request, urllib.parse, json, re, os

TOKEN = os.environ.get('SANITY_TOKEN','')
BASE   = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'
MUTATE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production'

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

def patch(doc_id, image_url):
    body = json.dumps({'mutations':[{'patch':{'id':doc_id,'set':{'imageUrl':image_url}}}]}).encode()
    req  = urllib.request.Request(MUTATE, data=body, method='POST', headers={
        'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def scrape_og(url):
    try:
        req = urllib.request.Request(url, headers=SCRAPE_HEADERS)
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode('utf-8', errors='replace')
        for pat in [
            r'<meta[\s\S]*?property=["\']og:image["\'][\s\S]*?content=["\']([^"\']+)["\']',
            r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?property=["\']og:image["\']',
            r'<meta[\s\S]*?name=["\']twitter:image["\'][\s\S]*?content=["\']([^"\']+)["\']',
            r'<meta[\s\S]*?content=["\']([^"\']+)["\'][\s\S]*?name=["\']twitter:image["\']',
        ]:
            m = re.search(pat, html, re.I)
            if m and m.group(1).startswith('http'):
                return m.group(1).strip()
    except Exception as e:
        print(f'  Scrape error: {e}')
    return None

slug = 'everytown-s-outrage-over-new-atf-rule-proposals-downright-hilarious-c6b105'
doc  = q(f'*[_type=="newsArticle" && slug.current=="{slug}"][0]{{ _id, title, imageUrl, heroImage{{asset->{{url}}}}, externalUrl, source, category }}')

lines = [f'=== FIX SINGLE ARTICLE ===']
lines.append(f'slug:       {slug}')

if not doc:
    lines.append('NOT FOUND in Sanity')
    print('\n'.join(lines))
else:
    lines.append(f'_id:        {doc["_id"]}')
    lines.append(f'source:     {doc.get("source")}')
    lines.append(f'category:   {doc.get("category")}')
    lines.append(f'imageUrl:   {doc.get("imageUrl") or "NULL"}')
    hi = doc.get('heroImage')
    lines.append(f'heroImage:  {hi["asset"]["url"] if hi and hi.get("asset") else "NULL"}')
    lines.append(f'externalUrl:{doc.get("externalUrl") or "NULL"}')

    ext = doc.get('externalUrl','')
    img = None

    if ext:
        lines.append(f'\nScraping: {ext}')
        img = scrape_og(ext)
        lines.append(f'OG result: {img or "NONE"}')

    if not img:
        # Category-based Wikimedia fallback
        cat = doc.get('category','news')
        WIKIMEDIA = {
            'law':     'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/ATF_HSI.png/1200px-ATF_HSI.png',
            'news':    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Glock_17-4.jpg/1200px-Glock_17-4.jpg',
            'industry':'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Glock_17-4.jpg/1200px-Glock_17-4.jpg',
        }
        img = WIKIMEDIA.get(cat, WIKIMEDIA['news'])
        lines.append(f'Using fallback: {img}')

    patch(doc['_id'], img)
    lines.append(f'\n✓ Patched imageUrl → {img}')

result = '\n'.join(lines)
print(result)
with open('scripts/single-fix-result.txt','w') as f:
    f.write(result+'\n')
