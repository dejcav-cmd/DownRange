import urllib.request, urllib.parse, json, os, sys, traceback
from datetime import datetime, timedelta, timezone

try:
    token = os.environ.get('SANITY_TOKEN','')
    if not token:
        raise Exception("SANITY_TOKEN env var is empty")
    
    since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ')
    print(f"Since: {since}")
    
    query = '*[_type=="newsArticle" && _createdAt > "' + since + '"] | order(_createdAt desc)[0...50]{title, "slug": slug.current, _createdAt, source}'
    encoded = urllib.parse.quote(query)
    url = f'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query={encoded}&returnQuery=false'
    
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        data = json.loads(r.read())
    
    results = data.get('result', [])
    print(f"FOUND: {len(results)} articles")
    for a in results:
        slug = a.get('slug','NO_SLUG')
        title = (a.get('title','') or '')[:70]
        created = (a.get('_createdAt','') or '')[:19]
        source = a.get('source','')
        print(f"[{created}] {title}")
        print(f"  https://downrangeco.com/news/{slug}  ({source})")

except Exception as e:
    print(f"EXCEPTION: {e}")
    traceback.print_exc()
    sys.exit(1)
