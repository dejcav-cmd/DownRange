import os, sys, json, urllib.request, urllib.parse

token = os.environ.get('SANITY_TOKEN', '')
if not token:
    print('ERROR: SANITY_TOKEN is empty or not set', file=sys.stderr)
    sys.exit(1)
print(f'SANITY_TOKEN present ({len(token)} chars)')

url = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query=count(*[_type%3D%3D%22firearmRelease%22])&returnQuery=false'
req = urllib.request.Request(url, headers={'Authorization': f'Bearer {token}'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read())
    print(f'Sanity OK — total firearmRelease docs: {d["result"]}')
except urllib.error.HTTPError as e:
    body = e.read().decode()
    print(f'Sanity HTTP {e.code}: {body[:300]}', file=sys.stderr)
    sys.exit(1)
except Exception as e:
    print(f'Sanity error: {e}', file=sys.stderr)
    sys.exit(1)
