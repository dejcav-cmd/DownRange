import urllib.request, urllib.parse, json, re, sys

TOKEN   = 'skbUvbYYIvf0Uwc43kqoHa7MX556BIABP7tNDQjW06yeBHY9ImiPeEjgMs87ZxlUafA5XRt6LXwn8d5Y9JcmDaZN13fvjxt6Tm3QgSAE8LqSvP6oU7zgF3W4dGb3jnjVIuBnZTICBsln2LHqgKjFIAybBohK6JCJWR8qHmP6CMhPVpsiPB79'
PROJECT = 'vbnsqnkg'
BASE    = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data'

def q(query):
    url = f"{BASE}/query/production?query={urllib.parse.quote(query)}"
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {TOKEN}'})
    return json.loads(urllib.request.urlopen(req).read())['result']

def mutate(mutations):
    body = json.dumps({'mutations': mutations}).encode()
    req  = urllib.request.Request(f"{BASE}/mutate/production", data=body, method='POST',
           headers={'Authorization': f'Bearer {TOKEN}', 'Content-Type': 'application/json'})
    return json.loads(urllib.request.urlopen(req).read())

def iso_to_secs(iso):
    if not iso: return 9999
    m = re.search(r'PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?', iso)
    if not m: return 9999
    return int(m.group(1) or 0)*3600 + int(m.group(2) or 0)*60 + int(m.group(3) or 0)

print('Fetching all videos...')
videos = q('*[_type == "video"]{ _id, title, duration }')
print(f'Total videos: {len(videos)}')

short = [v for v in videos if iso_to_secs(v.get('duration')) <= 120]
print(f'Videos under 2 min: {len(short)}')
for v in short:
    print(f'  DELETE: {v["_id"]} | {v.get("duration","?")} | {v.get("title","?")[:60]}')

if not short:
    print('Nothing to delete.')
    sys.exit(0)

# Delete in batches of 50
BATCH = 50
deleted = 0
for i in range(0, len(short), BATCH):
    batch = short[i:i+BATCH]
    mutations = [{'delete': {'id': v['_id']}} for v in batch]
    mutate(mutations)
    deleted += len(batch)
    print(f'Deleted batch {i}-{i+BATCH} ({len(batch)} videos)')

print(f'DONE. Deleted {deleted} short videos.')
