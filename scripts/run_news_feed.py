#!/usr/bin/env python3
"""Run the news feed directly via Vercel API, bypassing warm Lambda cache."""
import urllib.request, json, os, base64, time
import urllib.parse
from xml.etree import ElementTree as ET
import hashlib, re, html

SANITY_TOKEN = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
ANTHROPIC_KEY = os.environ.get("ANTHROPIC_API_KEY","").strip()
GLM_KEY = os.environ.get("GLM_API_KEY","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def sanity_query(q):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query=" + \
          urllib.parse.quote(q) + "&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {SANITY_TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def sanity_mutate(mutations):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production?returnDocuments=false"
    body = json.dumps({"mutations": mutations}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {SANITY_TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        return r.status, json.loads(r.read())

def ai_rewrite(title, description, source):
    """Use Anthropic or GLM to generate article content."""
    prompt = f"""Write a 2-sentence news summary for a firearms portal. Be direct and factual.

Title: {title}
Source: {source}
Context: {description[:300] if description else ''}

Return JSON only: {{"summary": "2 sentences max", "category": "news|law|industry|breaking", "urgencyScore": 1-10}}
Start with {{ end with }}. No markdown."""

    # Try Anthropic
    if ANTHROPIC_KEY:
        try:
            body = json.dumps({"model": "claude-haiku-4-5-20251001", "max_tokens": 300,
                "messages": [{"role": "user", "content": prompt}]}).encode()
            req = urllib.request.Request("https://api.anthropic.com/v1/messages",
                data=body, method="POST",
                headers={"x-api-key": ANTHROPIC_KEY, "anthropic-version": "2023-06-01",
                         "content-type": "application/json"})
            with urllib.request.urlopen(req, timeout=15) as r:
                d = json.loads(r.read())
                text = d["content"][0]["text"].strip()
                return json.loads(text.strip().lstrip("```json").rstrip("```"))
        except: pass
    return None

def fetch_rss(url, name, cat):
    """Fetch RSS feed and return items."""
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "DownRangeBot/1.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            tree = ET.parse(r)
        items = []
        for item in tree.findall(".//item")[:8]:
            link = (item.findtext("link") or "").strip()
            title = html.unescape(item.findtext("title") or "").strip()
            desc = html.unescape(item.findtext("description") or "").strip()[:400]
            pub = item.findtext("pubDate") or ""
            if link and title:
                items.append({"url": link, "title": title, "desc": desc, "pub": pub,
                              "source": name, "cat": cat})
        return items
    except Exception as e:
        print(f"  Feed error {name}: {e}")
        return []

# Load existing URLs from Sanity (last 48h) for dedup
print("Loading dedup cache...")
from datetime import datetime, timezone, timedelta
since48 = (datetime.now(timezone.utc) - timedelta(hours=48)).isoformat()
existing = sanity_query(f'*[_type=="newsArticle"&&_createdAt>"{since48}"]{{externalUrl}}')
seen_urls = set((e.get("externalUrl") or "").lower().rstrip("/") for e in (existing or []) if e.get("externalUrl"))
print(f"Dedup cache: {len(seen_urls)} URLs from last 48h")

# Fetch key RSS feeds
FEEDS = [
    ("TTAG", "https://www.thetruthaboutguns.com/feed/", "news"),
    ("AmmoLand", "https://www.ammoland.com/feed/", "news"),
    ("NRA-ILA", "https://www.nraila.org/XML/RSS.aspx", "law"),
    ("Bearing Arms", "https://bearingarms.com/feed/", "news"),
    ("FPC", "https://www.firearmspolicy.org/feed/", "law"),
    ("SAF", "https://www.saf.org/feed/", "law"),
    ("American Rifleman", "https://www.americanrifleman.org/feed/", "industry"),
    ("Guns.com News", "https://www.guns.com/feed", "industry"),
    ("Concealed Nation", "https://concealednation.org/feed/", "news"),
    ("Gun News Daily", "https://gunnewsdaily.com/feed/", "news"),
]

FIREARMS_KEYWORDS = re.compile(
    r'\b(gun|guns|firearm|firearms|pistol|rifle|shotgun|revolver|handgun|ammo|ammunition|'
    r'second amendment|2nd amendment|atf|nra|goa|fpc|concealed carry|ccw|red flag|'
    r'glock|sig sauer|ruger|ar-15|ar15|ak-47|9mm|\.308|5\.56|suppressor|silencer)\b',
    re.IGNORECASE
)

all_items = []
for name, url, cat in FEEDS:
    items = fetch_rss(url, name, cat)
    all_items.extend(items)
    print(f"  {name}: {len(items)} items")

print(f"\nTotal fetched: {len(all_items)}")

# Process items
published = 0
skipped_dup = 0
skipped_topic = 0
t0 = time.time()

for item in all_items:
    if time.time() - t0 > 240:
        print("Time limit approaching, stopping")
        break

    url = item["url"]
    norm_url = url.lower().rstrip("/")
    
    if norm_url in seen_urls:
        skipped_dup += 1
        continue
    
    if not FIREARMS_KEYWORDS.search(item["title"] + " " + item["desc"]):
        skipped_topic += 1
        continue
    
    # Get AI summary
    ai = ai_rewrite(item["title"], item["desc"], item["source"])
    
    url_hash = hashlib.md5(url.encode()).hexdigest()
    slug_base = re.sub(r'[^a-z0-9]+', '-', item["title"].lower()).strip('-')[:80]
    slug = f"{slug_base}-{url_hash[:6]}"
    
    doc = {
        "_id": f"news-{url_hash}",
        "_type": "newsArticle",
        "title": item["title"],
        "slug": {"_type": "slug", "current": slug},
        "excerpt": (ai or {}).get("summary") or item["desc"][:300] or item["title"],
        "summary": (ai or {}).get("summary") or item["desc"][:300] or item["title"],
        "category": (ai or {}).get("category") or item["cat"],
        "urgencyScore": (ai or {}).get("urgencyScore") or 3,
        "source": item["source"],
        "publishedAt": datetime.now(timezone.utc).isoformat(),
        "autoGenerated": True,
        "approved": True,
        "dedupHash": url_hash,
    }
    
    # externalUrl added via patch only (url type)
    try:
        status, result = sanity_mutate([
            {"createIfNotExists": doc},
            {"patch": {"id": doc["_id"], "set": {
                "externalUrl": url,
                "source": item["source"],
                "category": doc["category"],
            }}}
        ])
        if status == 200:
            seen_urls.add(norm_url)
            published += 1
            print(f"  ✓ [{item['source']}] {item['title'][:60]}")
        else:
            print(f"  ✗ Sanity {status}: {str(result)[:100]}")
    except Exception as e:
        print(f"  ✗ Error: {e}")

print(f"\n=== DONE: {published} published, {skipped_dup} duped, {skipped_topic} off-topic ===")

# Report to Sanity cronRun
try:
    ts = datetime.now(timezone.utc).isoformat()
    sanity_mutate([{"createOrReplace": {
        "_id": f"cronRun-news-gha-{int(time.time())}",
        "_type": "cronRun",
        "jobId": "news",
        "at": ts,
        "status": "success" if published > 0 else "warning",
        "ms": int((time.time() - t0) * 1000),
        "details": f"{published} published of {len(all_items)} fetched · {skipped_dup} duped · {skipped_topic} off-topic (GHA run)",
    }}])
except Exception as e:
    print(f"cronRun report failed: {e}")

# Save result
result_text = f"GHA news run: {published} published, {skipped_dup} duped, {skipped_topic} off-topic\nTotal items: {len(all_items)}\nTime: {time.time()-t0:.1f}s\n"
print(result_text)
