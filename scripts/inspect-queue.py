import os, json, urllib.request

TOKEN = os.environ.get('UPSTASH_REDIS_REST_TOKEN', '')
URL   = os.environ.get('UPSTASH_REDIS_REST_URL', '')

if not TOKEN or not URL:
    print("ERROR: UPSTASH env vars missing")
    import sys; sys.exit(1)

# LRANGE to see queue contents
req = urllib.request.Request(
    f"{URL}/lrange/dr:releases:backfill/0/20",
    headers={"Authorization": f"Bearer {TOKEN}"}
)
with urllib.request.urlopen(req, timeout=10) as r:
    data = json.loads(r.read())

items = data.get('result', [])
print(f"Backfill queue depth: {len(items)}")
for i, raw in enumerate(items[:10]):
    try:
        item = json.loads(raw)
        print(f"  [{i}] {item.get('brand','?'):20} | {item.get('title','?')[:60]}")
        print(f"        link: {item.get('link','?')[:80]}")
    except:
        print(f"  [{i}] raw: {str(raw)[:80]}")

# Also check the regular queue
req2 = urllib.request.Request(
    f"{URL}/lrange/dr:releases:queue/0/5",
    headers={"Authorization": f"Bearer {TOKEN}"}
)
with urllib.request.urlopen(req2, timeout=10) as r:
    data2 = json.loads(r.read())
items2 = data2.get('result', [])
print(f"\nRegular queue depth: {len(items2)}")
