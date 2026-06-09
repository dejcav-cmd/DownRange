import sys, os
os.makedirs('scripts', exist_ok=True)
with open('scripts/diag-result.txt', 'w') as f:
    f.write('STARTED\n')

try:
    import urllib.request, urllib.parse, json, re, time

    PROJECT = 'vbnsqnkg'
    DATASET = 'production'
    TOKEN   = 'skbUvbYYIvf0Uwc43kqoHa7MX556BIABP7tNDQjW06yeBHY9ImiPeEjgMs87ZxlUafA5XRt6LXwn8d5Y9JcmDaZN13fvjxt6Tm3QgSAE8LqSvP6oU7zgF3W4dGb3jnjVIuBnZTICBsln2LHqgKjFIAybBohK6JCJWR8qHmP6CMhPVpsiPB79'
    BASE    = f'https://{PROJECT}.api.sanity.io/v2023-08-01/data'
    H       = {'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'}

    DEAL_RE = re.compile(r'\$\d+|\d+%\s*off|save\s+\$|ships for|only\s+\$|drops to\s+\$|priced at\s+\$', re.IGNORECASE)

    with open('scripts/diag-result.txt', 'a') as f:
        f.write('IMPORTS OK\n')

    groq = "*[_type=='newsArticle' && category!='deals'] | order(publishedAt desc) [0..500] {_id, title, category}"
    url  = f'{BASE}/query/{DATASET}?query={urllib.parse.quote(groq)}'
    req  = urllib.request.Request(url, headers=H)

    with open('scripts/diag-result.txt', 'a') as f:
        f.write(f'QUERYING: {url[:100]}\n')

    with urllib.request.urlopen(req, timeout=30) as r:
        articles = json.loads(r.read()).get('result', [])

    with open('scripts/diag-result.txt', 'a') as f:
        f.write(f'GOT {len(articles)} articles\n')

    to_fix = [a for a in articles if a.get('title') and DEAL_RE.search(a['title'])]

    with open('scripts/diag-result.txt', 'a') as f:
        f.write(f'TO FIX: {len(to_fix)}\n')
        for a in to_fix:
            f.write(f'  {a["_id"]} | {a.get("category")} | {(a.get("title") or "")[:80]}\n')

    fixed = errors = 0
    for a in to_fix:
        try:
            body = json.dumps({'mutations': [{'patch': {'id': a['_id'], 'set': {'category': 'deals'}}}]}).encode()
            req2 = urllib.request.Request(f'{BASE}/mutate/{DATASET}', data=body, method='POST', headers=H)
            with urllib.request.urlopen(req2, timeout=15): pass
            fixed += 1
            time.sleep(0.15)
        except Exception as e:
            errors += 1
            with open('scripts/diag-result.txt', 'a') as f:
                f.write(f'  ERROR: {a["_id"]}: {e}\n')

    with open('scripts/diag-result.txt', 'a') as f:
        f.write(f'DONE: fixed={fixed} errors={errors}\n')

    print(f'Done: fixed={fixed} errors={errors}')

except Exception as e:
    import traceback
    with open('scripts/diag-result.txt', 'a') as f:
        f.write(f'EXCEPTION: {e}\n')
        f.write(traceback.format_exc())
    print(f'EXCEPTION: {e}', file=sys.stderr)
    sys.exit(1)
