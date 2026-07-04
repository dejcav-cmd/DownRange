import os, sys, json, urllib.request, urllib.parse

token = os.environ.get('SANITY_TOKEN', '')
if not token:
    print('ERROR: SANITY_TOKEN missing', file=sys.stderr); sys.exit(1)

queries = [
    ('Total firearmRelease docs',       'count(*[_type=="firearmRelease"])'),
    ('Google News sourceUrl remaining', 'count(*[_type=="firearmRelease" && (sourceUrl match "*news.google.com*" || sourceUrl match "*google.com/rss*")])'),
    ('No heroImage AND no imageUrl',    'count(*[_type=="firearmRelease" && !defined(heroImage) && (!defined(imageUrl) || imageUrl == "")])'),
    ('Bad google imageUrl',             'count(*[_type=="firearmRelease" && (imageUrl match "*googleusercontent.com*" || imageUrl match "*gstatic.com*")])'),
    ('Has real imageUrl',               'count(*[_type=="firearmRelease" && defined(imageUrl) && imageUrl != ""])'),
    ('Has heroImage (CDN)',             'count(*[_type=="firearmRelease" && defined(heroImage)])'),
]

for label, groq in queries:
    url = f'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(groq)}&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        result = json.loads(r.read())['result']
    print(f'  {label}: {result}')
