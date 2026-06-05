import urllib.request, urllib.parse, json, os
from datetime import datetime, timedelta, timezone

token = os.environ['SANITY_TOKEN']
project = 'vbnsqnkg'

since = (datetime.now(timezone.utc) - timedelta(hours=2)).strftime('%Y-%m-%dT%H:%M:%SZ')

query = '*[_type=="newsArticle" && _createdAt > "' + since + '"] | order(_createdAt desc)[0...30]{title, "slug": slug.current, _createdAt, source}'
encoded = urllib.parse.quote(query)
url = f'https://{project}.api.sanity.io/v2024-01-01/data/query/production?query={encoded}&returnQuery=false'

req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
with urllib.request.urlopen(req, timeout=15) as r:
    data = json.loads(r.read())

results = data.get('result', [])
print(f"Found {len(results)} articles in last 2 hours:")
for a in results:
    slug = a.get('slug','')
    title = a.get('title','')[:70]
    created = a.get('_createdAt','')[:19]
    source = a.get('source','')
    print(f"[{created}] {title}")
    print(f"  https://downrangeco.com/news/{slug}")
    print(f"  Source: {source}")
