import urllib.request, urllib.parse, json, os, time, base64

T        = os.environ['SANITY_TOKEN']
GH       = os.environ.get('GH_PAT','')
PEXELS   = os.environ.get('PEXELS_API_KEY','')
PIXABAY  = os.environ.get('PIXABAY_API_KEY','')
PROJECT  = 'vbnsqnkg'
BASE     = f'https://{PROJECT}.api.sanity.io/v2024-01-01'

def sanity_q(q):
    url = f'{BASE}/data/query/production?query={urllib.parse.quote(q)}&returnQuery=false'
    with urllib.request.urlopen(urllib.request.Request(url, headers={'Authorization': f'Bearer {T}'}), timeout=15) as r:
        return json.loads(r.read()).get('result',[])

def sanity_patch(doc_id, fields):
    url = f'{BASE}/data/mutate/production'
    body = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': fields}}]}).encode()
    req = urllib.request.Request(url, data=body, headers={'Authorization': f'Bearer {T}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

def upload_to_cdn(img_url, label):
    try:
        req = urllib.request.Request(img_url, headers={'User-Agent':'Mozilla/5.0','Referer':'https://downrangeco.com'})
        with urllib.request.urlopen(req, timeout=15) as r:
            ct = r.headers.get('Content-Type','image/jpeg')
            buf = r.read()
        if len(buf) < 5000: return None
        ext = 'png' if 'png' in ct else 'jpg'
        fn  = f'{label}-{int(time.time())}.{ext}'
        upload_req = urllib.request.Request(
            f'https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fn}',
            data=buf, headers={'Authorization': f'Bearer {T}', 'Content-Type': ct}, method='POST'
        )
        with urllib.request.urlopen(upload_req, timeout=20) as r:
            d = json.loads(r.read())
        return d.get('document',{}).get('url') or d.get('url')
    except Exception as e:
        print(f'  upload err: {e}')
        return None

def fetch_and_upload(query, label):
    if PEXELS:
        try:
            url = f'https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&per_page=3&orientation=landscape'
            with urllib.request.urlopen(urllib.request.Request(url, headers={'Authorization':PEXELS}), timeout=10) as r:
                d = json.loads(r.read())
            p = d.get('photos',[])
            if p:
                cdn = upload_to_cdn(p[0]['src'].get('large2x') or p[0]['src']['large'], label)
                if cdn: return cdn
        except: pass
    if PIXABAY:
        try:
            url = f'https://pixabay.com/api/?key={PIXABAY}&q={urllib.parse.quote(query)}&image_type=photo&orientation=horizontal&per_page=3&safesearch=true'
            with urllib.request.urlopen(url, timeout=10) as r:
                d = json.loads(r.read())
            h = d.get('hits',[])
            if h:
                cdn = upload_to_cdn(h[0].get('largeImageURL') or h[0].get('webformatURL'), label)
                if cdn: return cdn
        except: pass
    return None

# Find all docs with hotlinked (non-CDN) images
docs = sanity_q(
    '*[(_type=="canadaContent"||_type=="brazilContent") && defined(imageUrl) && '
    '!string::startsWith(imageUrl,"https://cdn.sanity.io")]'
    '|order(_createdAt desc)[0...60]{_id,_type,title,imageUrl}'
)
print(f'Found {len(docs)} docs with non-CDN images')

lines = [f'Backfill: {len(docs)} docs to process\n']
fixed = 0

for doc in docs:
    doc_id = doc['_id']
    title  = (doc.get('title') or '')
    old    = (doc.get('imageUrl') or '')
    is_br  = doc.get('_type') == 'brazilContent'
    label  = doc_id[-8:]

    print(f'\n[{doc_id[:12]}] {title[:50]}')
    print(f'  old: {old[:70]}')

    # Try re-uploading existing URL first
    cdn = upload_to_cdn(old, label)
    if not cdn:
        q = title + (' Brazil firearms' if is_br else ' Canada firearms law')
        print(f'  fetching new image: {q[:50]}')
        cdn = fetch_and_upload(q, label)

    if cdn:
        sanity_patch(doc_id, {'imageUrl': cdn})
        print(f'  ✅ {cdn[:70]}')
        lines.append(f'✅ {title[:50]}\n  {cdn[:70]}')
        fixed += 1
    else:
        print('  ❌ failed')
        lines.append(f'❌ {title[:50]}')

    time.sleep(0.4)

print(f'\nFixed {fixed}/{len(docs)}')
lines.append(f'\nFixed {fixed}/{len(docs)}')
output = '\n'.join(lines)

if GH:
    try:
        sha_r = urllib.request.urlopen(urllib.request.Request(
            'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
            headers={'Authorization': f'token {GH}'}), timeout=10)
        sha = json.loads(sha_r.read()).get('sha','')
        body = json.dumps({'message':'ci: backfill result','committer':{'name':'CI','email':'dj@downrangeco.com'},
                           'content':base64.b64encode(output.encode()).decode(),'sha':sha}).encode()
        urllib.request.urlopen(urllib.request.Request(
            'https://api.github.com/repos/dejcav-cmd/DownRange/contents/scripts/ARTICLES.txt',
            data=body, headers={'Authorization':f'token {GH}','Content-Type':'application/json'}, method='PUT'), timeout=10)
        print('Written to ARTICLES.txt')
    except Exception as e:
        print(f'GH write failed: {e}')
