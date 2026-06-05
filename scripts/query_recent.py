import urllib.request, urllib.parse, json, os, sys
from datetime import datetime, timedelta, timezone

token = os.environ['SANITY_TOKEN']
project = 'vbnsqnkg'

# Last 24h to see all articles since outage
since = (datetime.now(timezone.utc) - timedelta(hours=24)).strftime('%Y-%m-%dT%H:%M:%SZ')
print(f"Querying articles since: {since}")

query = '*[_type=="newsArticle" && _createdAt > "' + since + '"] | order(_createdAt desc)[0...50]{title, "slug": slug.current, _createdAt, source}'
encoded = urllib.parse.quote(query)
url = f'https://{project}.api.sanity.io/v2024-01-01/data/query/production?query={encoded}&returnQuery=false'

print(f"URL: {url[:80]}...")
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        raw = r.read()
        print(f"HTTP {r.status}")
        data = json.loads(raw)
except Exception as e:
    print(f"ERROR: {e}", file=sys.stderr)
    sys.exit(1)

if 'error' in data:
    print(f"Sanity error: {data['error']}", file=sys.stderr)
    sys.exit(1)

results = data.get('result', [])
print(f"\nFound {len(results)} articles in last 24h:")
print("=" * 60)
for a in results:
    slug = a.get('slug','')
    title = a.get('title','')[:70]
    created = a.get('_createdAt','')[:19]
    source = a.get('source','')
    print(f"[{created}] {title}")
    print(f"  URL: https://downrangeco.com/news/{slug}")
    print(f"  Source: {source}")
    print()
