"""
Fix articles with placeholder /img/photos/* imageUrl.
Strategy by source:
- Reddit links: use Pexels to fetch a relevant image based on title keywords
- News sites (TTAG etc): try multiple OG patterns + try Twitter card image
- On complete failure: use category-matched Wikimedia commons image
"""
import urllib.request, urllib.parse, json, re, os

TOKEN      = os.environ.get('SANITY_TOKEN','')
PEXELS_KEY = os.environ.get('PEXELS_API_KEY','')
BASE       = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'
MUTATE     = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production'

SCRAPE_HEADERS = {
    'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
    'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language':'en-US,en;q=0.5',
}

# Category fallback images from Wikimedia Commons (freely licensed, no hotlink block)
CAT_IMAGES = {
    'law':       'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/US_Court_of_Appeals.jpg/1200px-US_Court_of_Appeals.jpg',
    'news':      'https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/June_odd-eyed-cat_cropped.jpg/1200px-June_odd-eyed-cat_cropped.jpg',
    'industry':  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Glock_17-4.jpg/1200px-Glock_17-4.jpg',
    'pistol':    'https://upload.wikimedia.org/wikipedia/commons/thumb/1/18/Glock_17-4.jpg/1200px-Glock_17-4.jpg',
    'rifle':     'https://upload.wikimedia.org/wikipedia/commons/thumb/2/25/Colt_AR-15_sporter_SP1_carbine.jpg/1200px-Colt_AR-15_sporter_SP1_carbine.jpg',
    'ammo':      'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bullet_casings.jpg/1200px-Bullet_casings.jpg',
    'breaking':  'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/US_Court_of_Appeals.jpg/1200px-US_Court_of_Appeals.jpg',
    'opinion':   'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/US_Court_of_Appeals.jpg/1200px-US_Court_of_Appeals.jpg',
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
    except:
        pass
    return None

def pexels_search(query):
    if not PEXELS_KEY:
        return None
    try:
        url = f'https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&per_page=1&orientation=landscape'
        req = urllib.request.Request(url, headers={'Authorization': PEXELS_KEY})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        photos = data.get('photos', [])
        if photos:
            return photos[0].get('src', {}).get('large2x') or photos[0].get('src', {}).get('original')
    except:
        pass
    return None

def get_pexels_query(title, category):
    """Extract good search keywords from article title"""
    t = title.lower()
    if 'glock' in t: return 'Glock pistol'
    if 'ar-15' in t or 'ar15' in t: return 'AR-15 rifle'
    if 'ak-47' in t or 'ak47' in t: return 'AK-47 rifle'
    if '9mm' in t or 'ammo' in t or 'round' in t: return 'ammunition bullets'
    if 'suppressor' in t or 'silencer' in t: return 'gun suppressor'
    if 'rifle' in t: return 'rifle firearm'
    if 'pistol' in t or 'handgun' in t: return 'pistol handgun'
    if 'shotgun' in t: return 'shotgun firearm'
    if 'scope' in t or 'optic' in t: return 'rifle scope optic'
    if 'law' in t or 'bill' in t or 'court' in t or 'ban' in t: return 'courthouse law'
    if 'vortex' in t: return 'rifle scope optic'
    if 'walther' in t or 'sig' in t or 'beretta' in t or 'ruger' in t: return 'handgun pistol'
    return f'firearm {category}' if category else 'firearm gun'

# Get all placeholder articles
docs = q('*[_type=="newsArticle" && approved==true && defined(externalUrl) && imageUrl match "/img/*" && !defined(heroImage.asset)] | order(publishedAt desc) [0..99] { _id, title, imageUrl, externalUrl, slug, category }')
print(f'Found {len(docs)} articles with placeholder images')

updated = 0
failed  = 0
lines   = [f'=== ARTICLE IMAGE FIX v2 ===\nFound: {len(docs)}\n']

for doc in docs:
    ext_url  = doc.get('externalUrl','')
    title    = doc.get('title','')
    category = doc.get('category','news')
    slug     = doc.get('slug',{}).get('current','')[:50]
    
    img = None
    method = ''
    
    is_reddit = 'reddit.com' in (ext_url or '')
    
    if not is_reddit and ext_url:
        img = scrape_og(ext_url)
        if img: method = 'og_scrape'
    
    if not img and PEXELS_KEY:
        query = get_pexels_query(title, category)
        img   = pexels_search(query)
        if img: method = f'pexels:{query}'
    
    if not img:
        img    = CAT_IMAGES.get(category, CAT_IMAGES['news'])
        method = f'category_fallback:{category}'
    
    patch(doc['_id'], img)
    updated += 1
    lines.append(f'  ✓ [{method}] {slug}')
    print(f'  ✓ [{method}] {slug}')

lines.append(f'\nUpdated: {updated}')
result = '\n'.join(lines)
with open('scripts/article-fix-result.txt','w') as f:
    f.write(result+'\n')
print(f'\nDone: {updated} updated')
