import urllib.request, urllib.parse, json, os

TOKEN = os.environ.get('SANITY_TOKEN','')
BASE  = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(groq):
    url = f'{BASE}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())['result']

# Get sample image URLs and test if they load
samples = q('*[_type=="gunDeal" && defined(imageUrl)] | order(publishedAt desc) [0..9] { _id, title, imageUrl, externalUrl }')

lines = ['=== IMAGE URL ANALYSIS ===\n']
for s in samples:
    img = s.get('imageUrl','')
    lines.append(f"Title: {s.get('title','')[:50]}")
    lines.append(f"ImageURL: {img}")
    
    # Test if image loads without referer
    try:
        req = urllib.request.Request(img, headers={'User-Agent':'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=8) as r:
            size = len(r.read())
            lines.append(f"  → HTTP {r.status}, {size} bytes — LOADS OK")
    except Exception as e:
        lines.append(f"  → ERROR: {e}")
    
    # Test with referer header (simulating browser on downrangeco.com)
    try:
        req = urllib.request.Request(img, headers={
            'User-Agent': 'Mozilla/5.0',
            'Referer': 'https://downrangeco.com/'
        })
        with urllib.request.urlopen(req, timeout=8) as r:
            size = len(r.read())
            lines.append(f"  → With Referer: HTTP {r.status}, {size} bytes")
    except Exception as e:
        lines.append(f"  → With Referer: ERROR: {e}")
    lines.append('')

result = '\n'.join(lines)
print(result)
with open('scripts/image-url-check.txt', 'w') as f:
    f.write(result)
