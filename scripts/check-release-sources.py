import os, json, urllib.request, urllib.parse

TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT = 'vbnsqnkg'

query = '*[_type=="firearmRelease"] | order(publishedAt desc) [0...20] {_id, brand, model, sourceUrl, publishedAt}'
url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(query)}&returnQuery=false'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
with urllib.request.urlopen(req, timeout=15) as r:
    docs = json.loads(r.read())['result']

print(f'Current releases ({len(docs)}):')
for d in docs:
    print(f'  {d.get("publishedAt","?")[:10]}  {d.get("brand","?"):20} {d.get("model","?")[:25]:25}')
    print(f'             {d.get("sourceUrl","?")[:80]}')
