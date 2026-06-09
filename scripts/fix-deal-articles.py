"""
One-time migration: reclassify deal articles in newsArticle collection.
Uses Sanity REST API with single-quoted GROQ to avoid shell escaping issues.
"""
import urllib.request, urllib.parse, json, re, time, sys, os

PROJECT = 'vbnsqnkg'
DATASET = 'production'
TOKEN   = 'skbUvbYYIvf0Uwc43kqoHa7MX556BIABP7tNDQjW06yeBHY9ImiPeEjgMs87ZxlUafA5XRt6LXwn8d5Y9JcmDaZN13fvjxt6Tm3QgSAE8LqSvP6oU7zgF3W4dGb3jnjVIuBnZTICBsln2LHqgKjFIAybBohK6JCJWR8qHmP6CMhPVpsiPB79'
BASE    = f'https://{PROJECT}.api.sanity.io/v2023-08-01/data'

DEAL_RE = re.compile(
    r'\$\d+|\d+%\s*off|save\s+\$|\bdiscount\b|\bcoupon\b|sale price|'
    r'ships for|only\s+\$|starting at\s+\$|drops to\s+\$|priced at\s+\$',
    re.IGNORECASE
)

HEADERS = {'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}

def api_get(path):
    req = urllib.request.Request(f'{BASE}{path}', headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def api_post(path, body):
    data = json.dumps(body).encode()
    req = urllib.request.Request(f'{BASE}{path}', data=data, method='POST', headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# Use URL-encoded GROQ with single quotes
groq = "*[_type=='newsArticle' && category!='deals' && defined(publishedAt)] | order(publishedAt desc) [0..500] {_id, title, category}"
print(f'Querying Sanity: {PROJECT}/{DATASET}')
print(f'GROQ: {groq[:80]}...')

try:
    result = api_get(f'/query/{DATASET}?query={urllib.parse.quote(groq)}')
    articles = result.get('result', [])
    print(f'Got {len(articles)} articles')
except Exception as e:
    print(f'FATAL query error: {type(e).__name__}: {e}', file=sys.stderr)
    # Write diag anyway
    os.makedirs('scripts', exist_ok=True)
    with open('scripts/diag-result.txt', 'w') as f:
        f.write(f'FATAL: {e}\n')
    sys.exit(1)

to_fix = [a for a in articles if a.get('title') and DEAL_RE.search(a['title'])]
print(f'Deal articles to reclassify: {len(to_fix)}')

fixed = errors = 0
lines = [f'fix-deal-articles: found={len(to_fix)}\n']

for a in to_fix:
    title = (a.get('title') or '')[:80]
    cat   = a.get('category', '?')
    print(f'  [{cat}] -> [deals]: {title}')
    try:
        api_post(f'/mutate/{DATASET}', {
            'mutations': [{'patch': {'id': a['_id'], 'set': {'category': 'deals'}}}]
        })
        fixed += 1
        lines.append(f'FIXED | {a["_id"]} | {cat} | {title}\n')
        time.sleep(0.15)
    except Exception as e:
        errors += 1
        lines.append(f'ERROR | {a["_id"]} | {e}\n')
        print(f'  ERROR: {e}', file=sys.stderr)

summary = f'Done: fixed={fixed} errors={errors} total={len(to_fix)}'
print(summary)
lines.insert(1, summary + '\n')

os.makedirs('scripts', exist_ok=True)
with open('scripts/diag-result.txt', 'w') as f:
    f.writelines(lines)

sys.exit(1 if errors else 0)
