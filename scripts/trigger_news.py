#!/usr/bin/env python3
"""Manually trigger the news feed cron and capture the result."""
import urllib.request, json, os, base64, time

GH_PAT = os.environ.get("GH_PAT","").strip()
CRON_SECRET = os.environ.get("CRON_SECRET","").strip()
PROJECT = "vbnsqnkg"
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()

def sanity_query(q):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + \
          __import__('urllib.parse', fromlist=['quote']).quote(q) + "&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def save_result(content):
    encoded = base64.b64encode(content.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r:
            sha = json.load(r)["sha"]
    except:
        sha = None
    payload = {"message": "diag: news trigger result [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        return r.status

lines = ["=== NEWS FEED TRIGGER RESULT ==="]

# Test Sanity write directly first
lines.append("\n-- Sanity write test --")
try:
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production"
    body = json.dumps({"mutations": [{"createIfNotExists": {
        "_id": "news-test-diag-002", "_type": "newsArticle",
        "title": "Diag test", "approved": True,
        "slug": {"_type": "slug", "current": "diag-test-002"},
        "publishedAt": "2026-01-01T00:00:00Z"
    }}]}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {SANITY_TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=10) as r:
        res = json.loads(r.read())
        lines.append(f"Sanity write: HTTP 200 → {res.get('results', [{}])[0].get('operation','?')}")
except urllib.request.HTTPError as e:
    lines.append(f"Sanity write FAILED: HTTP {e.code} → {e.read().decode()[:200]}")
except Exception as e:
    lines.append(f"Sanity write ERROR: {e}")

# Now trigger news feed
lines.append("\n-- News feed trigger --")
preview_url = "https://down-range-indol.vercel.app/api/agent?feed=news"
req = urllib.request.Request(preview_url,
    headers={"Authorization": f"Bearer {CRON_SECRET}"})
try:
    start = time.time()
    with urllib.request.urlopen(req, timeout=310) as r:
        elapsed = time.time() - start
        body = json.loads(r.read())
        result = body.get('result', {})
        lines.append(f"HTTP {r.status} in {elapsed:.1f}s")
        lines.append(f"done={result.get('done')} total={result.get('total')} dupes={result.get('dupes')}")
        lines.append(f"headlines: {result.get('headlines', [])[:5]}")
except Exception as e:
    elapsed = time.time() - start
    lines.append(f"Request failed after {elapsed:.1f}s: {e}")

# Check latest cron run for details
time.sleep(3)
lines.append("\n-- Last 3 news cron runs --")
runs = sanity_query('*[_type=="cronRun"&&jobId=="news"]|order(at desc)[0...3]{at,status,ms,details,error}')
for r in (runs or []):
    lines.append(f"{r.get('at','?')[:16]} | {r.get('status')} | {int(r.get('ms',0)/1000)}s")
    lines.append(f"  details: {str(r.get('details',''))[:150]}")
    if r.get('error'):
        lines.append(f"  error: {str(r.get('error'))[:150]}")

output = "\n".join(lines) + "\n"
print(output)
save_result(output)
