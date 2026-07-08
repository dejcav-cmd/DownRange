#!/usr/bin/env python3
"""Test Sanity write access and check latest news cron run details."""
import urllib.request, urllib.parse, json, os, sys, base64
from datetime import datetime, timezone, timedelta

TOKEN   = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT  = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def sanity_query(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + \
          urllib.parse.quote(query) + "&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read()).get("result")
    except Exception as e:
        return f"QUERY ERROR: {e}"

def sanity_mutate(mutations):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, json.loads(r.read())
    except urllib.request.HTTPError as e:
        return e.code, e.read().decode()
    except Exception as e:
        return 0, str(e)

lines = []
lines.append("=== SANITY WRITE TEST ===")
lines.append(f"Token: {'SET (' + str(len(TOKEN)) + ' chars)' if TOKEN else 'MISSING'}")
lines.append(f"Project: {PROJECT}")
lines.append("")

# Test write with a minimal createIfNotExists mutation
test_id = "news-test-write-diagnostic-001"
status, result = sanity_mutate([{"createIfNotExists": {
    "_id": test_id, "_type": "newsArticle",
    "title": "Test write diagnostic", "approved": True,
    "slug": {"_type": "slug", "current": "test-write-diagnostic-001"},
    "publishedAt": datetime.now(timezone.utc).isoformat()
}}])
lines.append(f"Write test result: HTTP {status}")
lines.append(f"  Response: {str(result)[:200]}")
lines.append("")

# If write worked, clean up
if status == 200:
    s2, r2 = sanity_mutate([{"delete": {"id": test_id}}])
    lines.append(f"Cleanup: HTTP {s2}")

lines.append("")
lines.append("=== LAST 5 NEWS CRON RUNS (full details) ===")
runs = sanity_query('*[_type=="cronRun"&&jobId=="news"]|order(at desc)[0...5]{at,status,ms,details,error}')
if isinstance(runs, list):
    for r in runs:
        lines.append(f"  {(r.get('at') or '?')[:16]} | {r.get('status')} | {int(r.get('ms',0)/1000)}s")
        lines.append(f"    Details: {str(r.get('details',''))[:200]}")
        if r.get('error'):
            lines.append(f"    Error: {str(r.get('error'))[:200]}")
else:
    lines.append(f"  {runs}")

output = "\n".join(lines) + "\n"
print(output)

# Save to repo
if GH_PAT:
    encoded = base64.b64encode(output.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r:
            sha = json.load(r)["sha"]
    except:
        sha = None
    payload = {"message": "diag: sanity write test result [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r:
        print(f"Saved: HTTP {r.status}")

# ── RSS SPOT CHECK ───────────────────────────────────────────────────────────
print()
print("=== RSS SPOT CHECK (first 5 items from 3 feeds) ===")
import urllib.request as ul

feeds_to_check = [
    ("TTAG", "https://www.thetruthaboutguns.com/feed/"),
    ("AmmoLand", "https://www.ammoland.com/feed/"),
    ("NRA-ILA", "https://www.nraila.org/XML/RSS.aspx"),
]

from xml.etree import ElementTree as ET

for name, url in feeds_to_check:
    try:
        req = ul.Request(url, headers={"User-Agent": "DownRangeBot/1.0"})
        with ul.urlopen(req, timeout=8) as r:
            tree = ET.parse(r)
        items = tree.findall(".//item")[:5]
        print(f"\n  {name} ({len(items)} items sampled):")
        for item in items:
            title = (item.findtext("title") or "?")[:50]
            link  = (item.findtext("link") or "?")
            pub   = (item.findtext("pubDate") or "?")[:25]
            # Check if URL is in Sanity dedup pool
            check = sanity_query(f'count(*[_type=="newsArticle"&&externalUrl=="{link}"])')
            in_sanity = "✓ IN SANITY" if check and int(check) > 0 else "✗ NEW"
            print(f"    {pub[:16]} | {in_sanity} | {title}")
    except Exception as e:
        print(f"  {name}: ERROR - {e}")

print()
print("=== LAST SUCCESSFUL NEWS CRON RUN ===")
last_ok = sanity_query('*[_type=="cronRun"&&jobId=="news"&&status=="success"]|order(at desc)[0]{at,status,ms,details}')
if isinstance(last_ok, dict):
    print(f"  Last success: {last_ok.get('at','?')[:16]}")
    print(f"  Details: {str(last_ok.get('details',''))[:200]}")
elif isinstance(last_ok, list) and last_ok:
    r = last_ok[0]
    print(f"  Last success: {r.get('at','?')[:16]}")
else:
    print(f"  {last_ok}")
