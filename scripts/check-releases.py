import urllib.request, urllib.parse, json, os
from datetime import datetime, timezone, timedelta

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

# Recent releases
print("=== Recent firearmRelease docs ===")
recent = q('*[_type=="firearmRelease"] | order(publishedAt desc) [0...10] {_id, title, brand, model, publishedAt, approved, slug, imageUrl}')
print(f"Total count: {q('count(*[_type==\"firearmRelease\"])')}")
print()
for r in recent:
    pub = r.get('publishedAt','')[:10]
    approved = r.get('approved', False)
    img = 'IMG' if r.get('imageUrl') else '   '
    slug = r.get('slug',{}).get('current','')[:40]
    print(f"  [{pub}] {'✓' if approved else '✗'} {img} {r.get('brand','')} {r.get('model','')[:30]:30s} | {slug}")

# Check cronRun for releases
print()
print("=== Recent releases cron runs ===")
since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
runs = q(f'*[_type=="cronRun" && (jobId match "release*" || jobId match "*release*")] | order(at desc) [0...10] {{jobId, status, ms, details, error, at}}')
if runs:
    for r in runs:
        t = r.get('at','')[:16]
        print(f"  [{t}] {r.get('jobId','')} — {r.get('status','')} — {(r.get('details','') or '')[:80]}")
else:
    print("  No release cronRun docs found")

# Check what the releases agent feed reports
print()
print("=== Checking agent feed=releases last runs ===")
agent_runs = q('*[_type=="cronRun" && jobId=="releases"] | order(at desc) [0...5] {jobId, status, ms, details, at}')
if agent_runs:
    for r in agent_runs:
        t = r.get('at','')[:16]
        print(f"  [{t}] {r.get('status','')} {r.get('ms',0)}ms — {(r.get('details','') or '')[:80]}")
else:
    print("  No 'releases' cronRun docs")
    # Try different jobId patterns  
    all_jobs = q('*[_type=="cronRun"] | order(at desc) [0...5] {jobId, at}')
    print(f"  Latest cronRun jobs: {[(r.get('jobId'), r.get('at','')[:10]) for r in all_jobs]}")
