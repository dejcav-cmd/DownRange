#!/usr/bin/env python3
"""Check RSS feeds vs Sanity to find new articles."""
import urllib.request, json, os, base64, time
from xml.etree import ElementTree as ET
import urllib.parse

GH_PAT = os.environ.get("GH_PAT","").strip()
SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
PROJECT = "vbnsqnkg"

def sq(q):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + \
          urllib.parse.quote(q) + "&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
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
    payload = {"message": "diag: rss check [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

lines = ["=== RSS vs SANITY CHECK ===", f"Time: {time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime())}", ""]

feeds = [
    ("TTAG", "https://www.thetruthaboutguns.com/feed/"),
    # AmmoLand removed
    ("NRA-ILA", "https://www.nraila.org/XML/RSS.aspx"),
    ("Bearing Arms", "https://bearingarms.com/feed/"),
    ("Gun News Daily", "https://gunnewsdaily.com/feed/"),
]

total_new = 0
for name, feed_url in feeds:
    try:
        req = urllib.request.Request(feed_url, headers={"User-Agent": "DownRangeBot/1.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            tree = ET.parse(r)
        items = []
        for item in tree.findall(".//item")[:10]:
            link = (item.findtext("link") or "").strip()
            title = (item.findtext("title") or "").strip()
            pub = (item.findtext("pubDate") or "").strip()[:25]
            if link:
                items.append((link, title, pub))
        
        # Check each against Sanity
        new_items = []
        for link, title, pub in items:
            norm = link.lower().rstrip('/')
            count = sq(f'count(*[_type=="newsArticle"&&lower(externalUrl)=="{norm}"])')
            if not count or int(count) == 0:
                new_items.append((link, title, pub))
        
        lines.append(f"{name}: {len(new_items)}/{len(items)} NEW")
        for link, title, pub in new_items[:3]:
            lines.append(f"  NEW: {pub[:16]} | {title[:60]}")
            lines.append(f"       {link[:80]}")
        total_new += len(new_items)
    except Exception as e:
        lines.append(f"{name}: ERROR - {e}")

lines.append("")
lines.append(f"TOTAL NEW articles across {len(feeds)} feeds: {total_new}")

output = "\n".join(lines) + "\n"
print(output)
save(output)
