import urllib.request, urllib.parse, json, os, time

T = os.environ['SANITY_TOKEN']
PIXABAY = os.environ.get('PIXABAY_API_KEY','')
PEXELS  = os.environ.get('PEXELS_API_KEY','')
PROJECT = 'vbnsqnkg'
BASE    = f'https://{PROJECT}.api.sanity.io/v2024-01-01'

def sanity_query(q):
    url = f'{BASE}/data/query/production?query={urllib.parse.quote(q)}&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {T}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get('result', [])

def sanity_patch(doc_id, fields):
    url = f'{BASE}/data/mutate/production'
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': fields}}]}).encode()
    req = urllib.request.Request(url, data=body, headers={
        'Authorization': f'Bearer {T}', 'Content-Type': 'application/json'
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def fetch_image(query):
    """Try Pexels first, then Pixabay. Returns raw URL."""
    if PEXELS:
        try:
            url = f'https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&per_page=5&orientation=landscape'
            req = urllib.request.Request(url, headers={'Authorization': PEXELS})
            with urllib.request.urlopen(req, timeout=10) as r:
                d = json.loads(r.read())
                p = d.get('photos', [])
                if p: return p[0]['src'].get('large2x') or p[0]['src'].get('large')
        except Exception as e: print(f'  Pexels err: {e}')
    if PIXABAY:
        try:
            url = f'https://pixabay.com/api/?key={PIXABAY}&q={urllib.parse.quote(query)}&image_type=photo&orientation=horizontal&per_page=5&safesearch=true'
            with urllib.request.urlopen(url, timeout=10) as r:
                d = json.loads(r.read())
                h = d.get('hits', [])
                if h: return h[0].get('largeImageURL') or h[0].get('webformatURL')
        except Exception as e: print(f'  Pixabay err: {e}')
    return None

def upload_to_sanity(img_url, label):
    """Download image and upload to Sanity CDN. Returns CDN URL."""
    try:
        req = urllib.request.Request(img_url, headers={
            'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)',
            'Referer': 'https://downrangeco.com'
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            content_type = r.headers.get('Content-Type', 'image/jpeg')
            buf = r.read()
        if len(buf) < 5000:
            print(f'  Image too small: {len(buf)} bytes')
            return None
        ext = 'png' if 'png' in content_type else 'webp' if 'webp' in content_type else 'jpg'
        filename = f'{label}-{int(time.time())}.{ext}'
        upload_url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={filename}'
        req2 = urllib.request.Request(upload_url, data=buf, headers={
            'Authorization': f'Bearer {T}', 'Content-Type': content_type
        })
        req2.method = 'POST'
        with urllib.request.urlopen(req2, timeout=20) as r:
            data = json.loads(r.read())
        return data.get('document', {}).get('url') or data.get('url')
    except Exception as e:
        print(f'  Upload err: {e}')
        return None

# Find all Canada + Brazil articles with hotlinked (non-Sanity-CDN) images
bad_canada = sanity_query(
    '*[_type=="canadaContent" && defined(imageUrl) && !string::startsWith(imageUrl, "https://cdn.sanity.io")]'
    '| order(_createdAt desc)[0...50]{_id, title, imageUrl}'
)
bad_brazil = sanity_query(
    '*[_type=="brazilContent" && defined(imageUrl) && !string::startsWith(imageUrl, "https://cdn.sanity.io")]'
    '| order(_createdAt desc)[0...50]{_id, title, imageUrl}'
)

print(f'Canada articles with non-CDN images: {len(bad_canada)}')
print(f'Brazil articles with non-CDN images: {len(bad_brazil)}')

fixed = 0
for doc in bad_canada + bad_brazil:
    doc_id = doc['_id']
    title  = doc.get('title','') or ''
    old_url = doc.get('imageUrl','') or ''
    is_brazil = doc_id.startswith('br-') or 'brazil' in doc_id.lower()

    print(f'\n  [{doc_id[:12]}] {title[:50]}')
    print(f'  Old: {old_url[:80]}')

    # Build search query
    q = title + (' Brazil firearms' if is_brazil else ' Canada firearms')

    # Try to upload existing URL to CDN first (faster than new search)
    cdn_url = upload_to_sanity(old_url, doc_id[-8:])
    if not cdn_url:
        print('  Could not re-upload existing URL, fetching new image...')
        new_url = fetch_image(q)
        if new_url:
            cdn_url = upload_to_sanity(new_url, doc_id[-8:])

    if cdn_url:
        sanity_patch(doc_id, {'imageUrl': cdn_url})
        print(f'  ✅ -> {cdn_url[:80]}')
        fixed += 1
    else:
        print('  ❌ Could not get a working image')

    time.sleep(0.5)

print(f'\nDone. Fixed {fixed} images.')
