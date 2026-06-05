import urllib.request, urllib.parse, json, os, sys, traceback
from datetime import datetime, timedelta, timezone

outlines = []
def log(s): print(s, flush=True); outlines.append(str(s))

try:
    token = os.environ.get('SANITY_TOKEN', '')
    if not token:
        raise Exception('SANITY_TOKEN is empty')

    since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ')
    log(f'Since: {since}')

    query = '*[_type=="newsArticle"&&_createdAt>"' + since + '"]|order(_createdAt desc)[0...50]{title,"slug":slug.current,_createdAt,source}'
    url = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=' + urllib.parse.quote(query) + '&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read())

    results = data.get('result', [])
    log(f'FOUND: {len(results)} articles in last 24h')
    log('---')
    for a in results:
        slug = a.get('slug', '')
        title = (a.get('title') or '')[:80]
        created = (a.get('_createdAt') or '')[:19]
        source = a.get('source', '')
        log(f'[{created}] {title}')
        log(f'  https://downrangeco.com/news/{slug}  ({source})')
        log('')

except Exception as e:
    log(f'EXCEPTION: {e}')
    traceback.print_exc()

with open('scripts/query_recent_result.txt', 'w') as f:
    f.write('\n'.join(outlines))
print('File written.')
