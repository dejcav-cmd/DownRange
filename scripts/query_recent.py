import urllib.request, urllib.parse, json, os, sys, traceback
from datetime import datetime, timedelta, timezone

outlines = []

def log(s):
    print(s)
    outlines.append(s + '\n')

try:
    token = os.environ.get('SANITY_TOKEN', '')
    log(f'Token present: {bool(token)} len={len(token)}')
    
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ')
    log(f'Since: {since}')
    
    query = '*[_type=="newsArticle"&&_createdAt>"' + since + '"]|order(_createdAt desc)[0...50]{title,"slug":slug.current,_createdAt,source}'
    url = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=' + urllib.parse.quote(query) + '&returnQuery=false'
    
    req = urllib.request.Request(url, headers={'Authorization': 'Bearer ' + token})
    with urllib.request.urlopen(req, timeout=20) as r:
        status = r.status
        raw = r.read()
    log(f'HTTP status: {status}')
    data = json.loads(raw)
    
    if 'error' in data:
        log(f'Sanity error: {data["error"]}')
    else:
        results = data.get('result', [])
        log(f'FOUND: {len(results)} articles')
        for a in results:
            slug = a.get('slug', '')
            title = (a.get('title') or '')[:70]
            created = (a.get('_createdAt') or '')[:19]
            source = a.get('source', '')
            log(f'[{created}] {title}')
            log(f'  https://downrangeco.com/news/{slug}  ({source})')

except Exception as e:
    log(f'ERROR: {e}')
    traceback.print_exc()

with open('scripts/query_recent_result.txt', 'w') as f:
    f.writelines(outlines)
log('Written to scripts/query_recent_result.txt')
