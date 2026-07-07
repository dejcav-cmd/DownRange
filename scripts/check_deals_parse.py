import json, base64, urllib.request, urllib.parse, os

# ── 1. Load deals from /tmp/deals.json ───────────────────────────────────────
with open('/tmp/deals.json') as f:
    data = json.load(f)

items = data.get('result', [])
by_source = {}
for item in items:
    src = item.get('source','?')
    by_source.setdefault(src, []).append(item)

lines = [f"Total deals in Sanity: {len(items)}", ""]
for src, deals in sorted(by_source.items()):
    has_img = sum(1 for d in deals if d.get('imageUrl'))
    lines.append(f"  [{src}]  {len(deals)} deals  ({has_img} with images)")
    for d in deals[:2]:
        img  = d.get('imageUrl') or '(none)'
        url  = d.get('externalUrl','')[:70]
        title= (d.get('title') or '')[:55]
        lines.append(f"    • {title}")
        lines.append(f"      url: {url}")
        lines.append(f"      img: {'✓' if img!='(none)' else '✗'}")
    if len(deals) > 2:
        lines.append(f"    ... +{len(deals)-2} more")
    lines.append("")

# ── 2. Fetch recent cronRun docs ──────────────────────────────────────────────
token = os.environ.get('SANITY_TOKEN','')
if token:
    cron_query = '*[_type=="cronRun" && jobId in ["reddit-deals","web-deals","fix-placeholder-images","gun-deals"]] | order(_createdAt desc) [0..7] { jobId, status, details, error, _createdAt }'
    enc = urllib.parse.quote(cron_query)
    try:
        req = urllib.request.Request(
            f"https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query={enc}",
            headers={"Authorization": f"Bearer {token}"}
        )
        with urllib.request.urlopen(req, timeout=10) as r:
            cron_data = json.loads(r.read())
        runs = cron_data.get('result', [])
        lines.append("── Recent cron runs ──")
        if not runs:
            lines.append("  No cronRun docs found for these jobs (never ran or reportCronRun failed)")
        for run in runs:
            ts = run.get('_createdAt','?')[:16]
            lines.append(f"  [{run.get('jobId')}]  {run.get('status')}  {ts}")
            if run.get('details'):
                lines.append(f"    {run['details']}")
            if run.get('error'):
                lines.append(f"    ERROR: {run['error']}")
    except Exception as e:
        lines.append(f"  cronRun fetch failed: {e}")

content = "\n".join(lines)
print(content)

# ── 3. Write to repo ──────────────────────────────────────────────────────────
pat = os.environ.get('GH_PAT','')
if not pat: exit(0)

path = "scripts/amazon-check-result.txt"
req = urllib.request.Request(
    f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
    headers={"Authorization": f"token {pat}", "Accept": "application/vnd.github.v3+json"})
sha = ''
try:
    with urllib.request.urlopen(req) as r:
        sha = json.loads(r.read()).get('sha','')
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
