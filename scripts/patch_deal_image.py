"""
Patch imageUrl on a Sanity gunDeal by downloading from a known URL
and uploading to Sanity CDN.
"""
import json, urllib.request, os, sys

ASIN         = os.environ.get('FIX_ASIN', 'B0D1KXJYR6')
IMAGE_URL    = os.environ.get('IMAGE_URL', 'https://underyours.com/cdn/shop/files/41DA6TsWniL._AC.jpg?v=1747274053')
SANITY_TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT_ID   = 'vbnsqnkg'
DATASET      = 'production'
API_BASE     = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01/data'

import urllib.parse
query  = f'*[_type=="gunDeal" && "asin:{ASIN}" in tags][0]{{_id,title,imageUrl}}'
req    = urllib.request.Request(
    f'{API_BASE}/query/{DATASET}?query={urllib.parse.quote(query)}',
    headers={'Authorization': f'Bearer {SANITY_TOKEN}'}
)
with urllib.request.urlopen(req) as r:
    doc = json.loads(r.read()).get('result')
if not doc:
    print(f'No doc found for ASIN {ASIN}'); sys.exit(1)
print(f'Doc: {doc["_id"]}  current imageUrl: {doc.get("imageUrl") or "(none)"}')

# Download image
print(f'Downloading: {IMAGE_URL}')
req2 = urllib.request.Request(IMAGE_URL, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://underyours.com/'})
with urllib.request.urlopen(req2, timeout=15) as r:
    img_data = r.read()
print(f'Downloaded {len(img_data)} bytes')

# Upload to Sanity CDN
upload_url = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01/assets/images/{DATASET}'
req3 = urllib.request.Request(
    upload_url, method='POST', data=img_data,
    headers={
        'Authorization': f'Bearer {SANITY_TOKEN}',
        'Content-Type': 'image/jpeg',
        'x-sanity-label': f'amazon-{ASIN}',
    }
)
with urllib.request.urlopen(req3, timeout=30) as r:
    asset = json.loads(r.read())

sanity_url = asset.get('url')
print(f'Sanity CDN URL: {sanity_url}')

# Patch the doc
mutation = {'mutations': [{'patch': {'id': doc['_id'], 'set': {'imageUrl': sanity_url}}}]}
req4 = urllib.request.Request(
    f'{API_BASE}/mutate/{DATASET}?returnDocuments=false',
    method='POST', data=json.dumps(mutation).encode(),
    headers={'Authorization': f'Bearer {SANITY_TOKEN}', 'Content-Type': 'application/json'}
)
with urllib.request.urlopen(req4) as r:
    result = json.loads(r.read())
    print(f'Patched OK: {result}')
