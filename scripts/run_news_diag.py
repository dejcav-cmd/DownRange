#!/usr/bin/env python3
"""News feed diagnostic - query Sanity for article counts and recent cron run details."""
import urllib.request, urllib.parse, json, os, sys, base64, urllib.error
from datetime import datetime, timezone, timedelta

TOKEN   = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT  = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + \
          urllib.parse.quote(query) + "&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read()).get("result")
    except urllib.error.HTTPError as e:
        return f"HTTP {e.code}: {e.read().decode()[:100]}"
    except Exception as e:
        return f"ERROR: {e}"

lines = []
lines.append("=== NEWS DIAGNOSTIC ===")
lines.append(f"Run at: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}")
lines.append("")

lines.append("=== ARTICLE COUNTS ===")
total   = q('count(*[_type=="newsArticle"])')
approved= q('count(*[_type=="newsArticle"&&approved==true&&defined(slug.current)])')
last30  = q(f'count(*[_type=="newsArticle"&&approved==true&&publishedAt>="{(datetime.now(timezone.utc)-timedelta(days=30)).date().isoformat()}"])')
last7   = q(f'count(*[_type=="newsArticle"&&approved==true&&publishedAt>="{(datetime.now(timezone.utc)-timedelta(days=7)).date().isoformat()}"])')
last48h = q(f'count(*[_type=="newsArticle"&&approved==true&&publishedAt>="{(datetime.now(timezone.utc)-timedelta(hours=48)).isoformat()}"])')
lines.append(f"  Total all time:   {total}")
lines.append(f"  Approved+slug:    {approved}")
lines.append(f"  Last 30 days:     {last30}")
lines.append(f"  Last 7 days:      {last7}")
lines.append(f"  Last 48 hours:    {last48h}")

lines.append("")
lines.append("=== MOST RECENT 10 ARTICLES ===")
recent = q('*[_type=="newsArticle"&&approved==true]|order(publishedAt desc)[0...10]{_id,title,publishedAt,source,approved}')
if isinstance(recent, list):
    for a in recent:
        pub = (a.get('publishedAt') or '?')[:16]
        src = (a.get('source') or '?')[:20]
        ttl = (a.get('title') or '?')[:55]
        lines.append(f"  {pub} | {src:<20} | {ttl}")
else:
    lines.append(f"  {recent}")

lines.append("")
lines.append("=== LAST 8 NEWS CRON RUNS ===")
runs = q('*[_type=="cronRun"&&jobId=="news"]|order(at desc)[0...8]{at,status,details,error}')
if isinstance(runs, list):
    for r in runs:
        at = (r.get('at') or '?')[:16]
        st = r.get('status','?')
        dt = str(r.get('details') or '')[:100]
        lines.append(f"  {at} | {st} | {dt}")
        if r.get('error'):
            lines.append(f"    ERR: {str(r['error'])[:120]}")
else:
    lines.append(f"  {runs}")

lines.append("")
lines.append("=== DEDUP POOL SIZE (newsArticle+gunDeal last 7d) ===")
dedup_count = q(f'count(*[_type in ["newsArticle","gunDeal"]&&_createdAt>"{(datetime.now(timezone.utc)-timedelta(days=7)).isoformat()}"])')
lines.append(f"  Dedup pool size (7d): {dedup_count}")

output = "\n".join(lines) + "\n"
print(output)

# Write to repo via GitHub Contents API
if GH_PAT:
    encoded = base64.b64encode(output.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(
            f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"}
        )
        with urllib.request.urlopen(req) as r:
            sha = json.load(r)["sha"]
    except:
        sha = None
    payload = {"message": "diag: news diagnostic result [skip ci]", "content": encoded}
    if sha:
        payload["sha"] = sha
    req = urllib.request.Request(
        f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(),
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as r:
        print(f"Saved to repo: {r.status}")
