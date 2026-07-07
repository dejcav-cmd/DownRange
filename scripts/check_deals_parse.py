import json, base64, urllib.request, os

with open('/tmp/deals.json') as f:
    data = json.load(f)

items = data.get('result', [])
by_source = {}
for item in items:
    src = item.get('source','?')
    by_source.setdefault(src, []).append(item)

lines = [f"Total deals: {len(items)}", ""]
for src, deals in sorted(by_source.items()):
    lines.append(f"  [{src}] {len(deals)} deals")
    for d in deals[:3]:
        img = d.get('imageUrl') or '(none)'
        url = d.get('externalUrl','')[:70]
        title = (d.get('title') or '')[:60]
        has_tag = 'downrangeco-20' in url if 'amazon' in (d.get('source','')) else True
        lines.append(f"    • {title}")
        lines.append(f"      url: {url}")
        lines.append(f"      img: {img[:80]}  {'✓' if img != '(none)' else '✗'}")
    if len(deals) > 3:
        lines.append(f"    ... and {len(deals)-3} more")
    lines.append("")

content = "\n".join(lines)
print(content)

pat = os.environ.get('GH_PAT', '')
if not pat: exit(0)

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
    with urllib.request.urlopen(req2) as r: print("Written to repo")
except Exception as e: print(f"Write failed: {e}")
