#!/usr/bin/env python3
import urllib.request, urllib.parse, json, os, base64
from datetime import datetime, timezone, timedelta

TOKEN = os.environ.get("SANITY_TOKEN","").replace("ST=","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def q(query):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(query)}&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def save(content):
    encoded = base64.b64encode(content.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": "diag: deal image status [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

lines = ["=== DEAL IMAGE STATUS ===", f"Time: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M UTC')}", ""]

total   = q('count(*[_type=="gunDeal" && approved==true])')
missing = q('count(*[_type=="gunDeal" && approved==true && (!defined(imageUrl) || imageUrl == "" || imageUrl == null)])')
with_img = q('count(*[_type=="gunDeal" && approved==true && defined(imageUrl) && imageUrl != "" && imageUrl != null])')
cdn = q('count(*[_type=="gunDeal" && approved==true && string::startsWith(coalesce(imageUrl,""), "https://cdn.sanity.io")])')
external = q('count(*[_type=="gunDeal" && approved==true && defined(imageUrl) && imageUrl != "" && !string::startsWith(coalesce(imageUrl,""), "https://cdn.sanity.io")])')

lines.append(f"Total approved deals:  {total}")
lines.append(f"With images:           {with_img}")
lines.append(f"  → Sanity CDN:        {cdn}")
lines.append(f"  → External URL:      {external}")
lines.append(f"Missing images:        {missing}")
lines.append(f"Coverage:              {round(int(with_img or 0)/max(int(total or 1),1)*100)}%")

lines.append("")
lines.append("Sample missing (most recent 8):")
samples = q('*[_type=="gunDeal" && approved==true && (!defined(imageUrl) || imageUrl == "" || imageUrl == null)] | order(publishedAt desc)[0...8]{_id, title, externalUrl, source}')
for d in (samples or []):
    lines.append(f"  [{d.get('source','?')}] {d.get('title','?')[:60]}")
    lines.append(f"    {(d.get('externalUrl') or '')[:70]}")

out = "\n".join(lines) + "\n"
print(out)
save(out)
