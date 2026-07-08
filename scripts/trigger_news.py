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

# Trigger news feed
print("Triggering news feed via preview URL...")
preview_url = "https://down-range-indol.vercel.app/api/agent?feed=news"
req = urllib.request.Request(preview_url,
    headers={"Authorization": f"Bearer {CRON_SECRET}"})
try:
    start = time.time()
    with urllib.request.urlopen(req, timeout=310) as r:
        elapsed = time.time() - start
        body = json.loads(r.read())
        result = f"""=== NEWS FEED TRIGGER RESULT ===
Status: HTTP {r.status}
Time: {elapsed:.1f}s

done: {body.get('result', {}).get('done', '?')}
total: {body.get('result', {}).get('total', '?')}
dupes: {body.get('result', {}).get('dupes', '?')}
withAI: {body.get('result', {}).get('withAI', '?')}

headlines: {json.dumps(body.get('result', {}).get('headlines', [])[:10], indent=2)}

full result: {json.dumps(body.get('result', {}), indent=2)[:500]}
"""
        print(result)
        save_result(result)
except Exception as e:
    err = f"ERROR: {e}"
    print(err)
    # Still check last cron run
    time.sleep(5)
    runs = sanity_query('*[_type=="cronRun"&&jobId=="news"]|order(at desc)[0...3]{at,status,details,error}')
    r2 = f"Trigger failed: {err}\n\nLast 3 cron runs:\n"
    for r in (runs or []):
        r2 += f"  {r.get('at','?')[:16]} | {r.get('status')} | {str(r.get('details',''))[:100]}\n"
    print(r2)
    save_result(r2)
