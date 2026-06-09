"""
One-time migration: find newsArticle docs miscategorized as news/industry
that look like deals (price pattern in title), patch them to category='deals'.
"""
import urllib.request, urllib.parse, json, re, time, sys

SANITY_PROJECT = 'vbnsqnkg'
SANITY_DATASET = 'production'
SANITY_TOKEN   = 'skbUvbYYIvf0Uwc43kqoHa7MX556BIABP7tNDQjW06yeBHY9ImiPeEjgMs87ZxlUafA5XRt6LXwn8d5Y9JcmDaZN13fvjxt6Tm3QgSAE8LqSvP6oU7zgF3W4dGb3jnjVIuBnZTICBsln2LHqgKjFIAybBohK6JCJWR8qHmP6CMhPVpsiPB79'
BASE = f'https://{SANITY_PROJECT}.api.sanity.io/v2023-08-01/data'

DEAL_RE = re.compile(
    r'\$\d+|'
    r'\d+%\s*off|'
    r'save\s+\$|'
    r'\bdiscount\b|'
    r'\bcoupon\b|'
    r'sale price|'
    r'ships for|'
    r'only\s+\$|'
    r'starting at\s+\$|'
    r'drops to\s+\$|'
    r'priced at\s+\$',
    re.IGNORECASE
)

def sanity_query(groq):
    q = urllib.parse.quote(groq)
    url = f'{BASE}/query/{SANITY_DATASET}?query={q}'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['result']

def sanity_patch(doc_id, patches):
    url = f'{BASE}/mutate/{SANITY_DATASET}'
    payload = json.dumps({'mutations': [{'patch': {'id': doc_id, 'set': patches}}]}).encode()
    req = urllib.request.Request(url, data=payload, method='POST', headers={
        'Authorization': f'Bearer {SANITY_TOKEN}',
        'Content-Type': 'application/json',
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

print('Fetching articles...')
try:
    groq = '*[_type=="newsArticle" && category!="deals" && defined(publishedAt)] | order(publishedAt desc) [0..500] {_id, title, category}'
    articles = sanity_query(groq)
    print(f'Fetched {len(articles)} articles')
except Exception as e:
    print(f'FATAL: Sanity query failed: {e}', file=sys.stderr)
    sys.exit(1)

to_fix = [a for a in articles if a.get('title') and DEAL_RE.search(a['title'])]
print(f'Found {len(to_fix)} deal articles to reclassify')
for a in to_fix:
    print(f'  [{a["category"]}] {a["title"][:80]}')

fixed = 0
errors = 0
for a in to_fix:
    try:
        sanity_patch(a['_id'], {'category': 'deals'})
        print(f'  FIXED: {a["title"][:70]}')
        fixed += 1
        time.sleep(0.15)
    except Exception as e:
        print(f'  ERROR {a["_id"]}: {e}', file=sys.stderr)
        errors += 1

result = f'fix-deal-articles: fixed={fixed} errors={errors} total={len(to_fix)}\n'
print(result)
for a in to_fix:
    result += f'  {a["_id"]} | {a["category"]} | {a["title"][:80]}\n'

import os
os.makedirs('scripts', exist_ok=True)
with open('scripts/diag-result.txt', 'w') as f:
    f.write(result)

if errors > 0:
    sys.exit(1)
