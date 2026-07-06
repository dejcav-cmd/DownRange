import json, base64, urllib.request, os

with open('/tmp/deals.json') as f:
    data = json.load(f)

items = data.get('result', [])
lines = [f"Total Amazon deals: {len(items)}", ""]
for item in items:
    tags  = item.get('tags') or []
    asin  = next((t for t in tags if t.startswith('asin:')), '—')
    img   = item.get('imageUrl') or '(none)'
    title = (item.get('title') or '')[:70]
    url   = item.get('externalUrl') or ''
    flag  = 'OK' if 'downrangeco-20' in url else 'MISSING_TAG'
    lines += [f"  {asin}", f"  title:    {title}", f"  imageUrl: {img[:120]}", f"  affiliate:{flag}", ""]

content = "\n".join(lines)
print(content)

# Write to repo
pat = os.environ.get('GH_PAT', '')
if not pat:
    print("No GH_PAT"); exit(0)

path = "scripts/amazon-check-result.txt"
req = urllib.request.Request(
    f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
    headers={"Authorization": f"token {pat}", "Accept": "application/vnd.github.v3+json"}
)
sha = ''
try:
    with urllib.request.urlopen(req) as r:
        sha = json.loads(r.read()).get('sha', '')
except: pass

payload = {"message": "chore: deal check result [skip ci]",
           "content": base64.b64encode(content.encode()).decode(),
           "committer": {"name": "DJ Cavalcanti", "email": "dj@downrangeco.com"}}
if sha: payload["sha"] = sha

req2 = urllib.request.Request(
    f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
    method="PUT", data=json.dumps(payload).encode(),
    headers={"Authorization": f"token {pat}", "Content-Type": "application/json",
             "Accept": "application/vnd.github.v3+json"})
try:
    with urllib.request.urlopen(req2) as r:
        print("Written to repo")
except Exception as e:
    print(f"Write failed: {e}")
