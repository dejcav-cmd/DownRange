"""
One-time migration: find newsArticle docs miscategorized as news/industry
that look like deals (price pattern in title), patch them to category='deals'.
"""
import urllib.request, urllib.parse, json, re, time

SANITY_PROJECT = 'vbnsqnkg'
SANITY_DATASET = 'production'
SANITY_TOKEN   = 'skbUvbYYIvf0Uwc43kqoHa7MX556BIABP7tNDQjW06yeBHY9ImiPeEjgMs87ZxlUafA5XRt6LXwn8d5Y9JcmDaZN13fvjxt6Tm3QgSAE8LqSvP6oU7zgF3W4dGb3jnjVIuBnZTICBsln2LHqgKjFIAybBohK6JCJWR8qHmP6CMhPVpsiPB79'
BASE            = f'https://{SANITY_PROJECT}.api.sanity.io/v2023-08-01/data'

DEAL_RE = re.compile(
    r'\$\d+|(\d+%\s*off)|(save\s+\$)|(discount)|(coupon)|(sale price)|'
    r'(ships for)|(only\s+\$)|(starting at\s+\$)|(drops to\s+\$)|(priced at\s+\$)',
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

# Fetch non-deal news articles from the last 7 days
groq = '*[_type=="newsArticle" && category!="deals" && defined(publishedAt)] | order(publishedAt desc) [0..500] {_id, title, category}'
print('Fetching articles...')
articles = sanity_query(groq)
print(f'Fetched {len(articles)} articles')

to_fix = [a for a in articles if a.get('title') and DEAL_RE.search(a['title'])]
print(f'Found {len(to_fix)} deal articles miscategorized as: {set(a["category"] for a in to_fix)}')

fixed = 0
for a in to_fix:
    print(f'  Patching [{a["category"]}] -> [deals]: {a["title"][:80]}')
    try:
        sanity_patch(a['_id'], {'category': 'deals'})
        fixed += 1
        time.sleep(0.1)  # be nice to Sanity rate limits
    except Exception as e:
        print(f'    ERROR: {e}')

print(f'\nDone. Fixed {fixed}/{len(to_fix)} articles.')
with open('scripts/diag-result.txt', 'w') as f:
    f.write(f'fix-deal-articles: fixed {fixed}/{len(to_fix)} articles\n')
    for a in to_fix:
        f.write(f'  {a["_id"]} | {a["category"]} | {a["title"][:80]}\n')
