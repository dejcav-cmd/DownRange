import os, json, urllib.request, urllib.parse, re

TOKEN = os.environ.get('SANITY_TOKEN', '')
PROJECT = 'vbnsqnkg'

query = '*[_type=="firearmRelease"] | order(publishedAt desc) [0...3] {title, brand, model, summary, body}'
url = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(query)}&returnQuery=false'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
with urllib.request.urlopen(req, timeout=15) as r:
    docs = json.loads(r.read())['result']

for d in docs:
    print(f"\n{'='*60}")
    print(f"TITLE: {d.get('title','')[:80]}")
    print(f"SUMMARY: {d.get('summary','')[:300]}")
    body = d.get('body','') or ''
    plain = re.sub('<[^>]+>', ' ', body).replace('  ',' ').strip()
    print(f"BODY ({len(body)} chars raw, {len(plain)} plain):")
    print(plain[:800])
