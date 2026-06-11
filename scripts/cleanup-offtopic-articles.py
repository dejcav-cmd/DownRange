#!/usr/bin/env python3
"""
cleanup-offtopic-articles.py
Finds and deletes newsArticle docs that have no firearms/2A relevance.
Targets articles from general political feeds (Breitbart, Daily Caller, Townhall, etc.)
that slipped through before GATE 4 was added.

Usage:
  SANITY_TOKEN=xxx python3 scripts/cleanup-offtopic-articles.py         # dry run
  SANITY_TOKEN=xxx python3 scripts/cleanup-offtopic-articles.py --delete  # real delete
"""
import json, urllib.request, urllib.parse, os, sys, re, time

TOKEN   = os.environ.get("SANITY_TOKEN", "").replace("ST=", "")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}
DRY_RUN = "--delete" not in sys.argv

# ── Firearms keyword set (mirrors news.js GATE 4) ─────────────────────────────
FIREARMS_KEYWORDS = [
    "gun","guns","firearm","firearms","pistol","pistols","rifle","rifles",
    "shotgun","shotguns","revolver","handgun","handguns","ammo","ammunition",
    "caliber","calibre","cartridge","bullet","bullets","suppressor","silencer",
    "holster","magazine","trigger","barrel","receiver","suppressor",
    "second amendment","2nd amendment","2a","gun rights","gun control","gun law",
    "gun bill","gun ban","assault weapon","nra","saf","fpc","goa",
    "gun owners","concealed carry","ccw","constitutional carry",
    "red flag","atf","batfe","background check","nics","ffl",
    "bruen","heller","mcdonald","ghost gun",
    "glock","sig sauer","smith wesson","ruger","colt","springfield","beretta",
    "fn ","hk","walther","taurus","mossberg","remington","winchester","hornady",
    "ar-15","ar15","ak-47","ak47","1911","9mm","45 acp",".357",".44 mag",
    ".308","5.56","hunting","hunter","shooting range","self-defense","self defense",
    "home defense","concealed","open carry","gun store","gun shop","gunsmith",
    "gun show","gun sale","gun dealer",
    "bear arms","keep and bear","carry permit","carry law","carry rights",
    "campus carry","permitless carry","carry license","gun permit",
    "background check","background checks","reloading",
]

FIREARMS_RE = re.compile(
    r'\b(' + '|'.join(re.escape(k) for k in FIREARMS_KEYWORDS) + r')\b',
    re.IGNORECASE
)

def is_firearms_relevant(title, excerpt=""):
    text = (title or "") + " " + (excerpt or "")
    return bool(FIREARMS_RE.search(text[:600]))

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        url += "&" + urllib.parse.urlencode({f"${k}": json.dumps(v) for k, v in params.items()})
    req = urllib.request.Request(url, headers=HEADERS)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# ── Sources known to bleed off-topic content ──────────────────────────────────
SUSPECT_SOURCES = [
    "Daily Caller Guns", "Breitbart 2A", "National Review Guns",
    "Townhall Guns", "Washington Free Beacon Guns", "AmmoLand",
    "Bearing Arms", "Guns & Patriots", "Gun News Daily",
]

print(f"{'[DRY RUN] ' if DRY_RUN else '[LIVE DELETE] '}Scanning for off-topic newsArticles...")
print()

total_scanned = 0
total_offopic = 0
total_deleted = 0
BATCH_SIZE    = 100
offset        = 0

while True:
    # Fetch articles from suspect sources
    q = f'*[_type=="newsArticle" && defined(slug.current) && defined(publishedAt)][{offset}...{offset+BATCH_SIZE}]{{_id, title, excerpt, source, externalUrl, publishedAt}}'
    docs = sanity_query(q)
    if not docs:
        break

    total_scanned += len(docs)
    to_delete = []

    for doc in docs:
        title   = doc.get("title", "")
        excerpt = doc.get("excerpt", "")
        source  = doc.get("source", "")

        # Only check suspect sources — pure firearms sites are fine
        if source not in SUSPECT_SOURCES:
            continue

        if not is_firearms_relevant(title, excerpt):
            total_offopic += 1
            to_delete.append(doc)
            print(f"  OFF-TOPIC [{source}]: {title[:80]}")
            print(f"             {doc.get('externalUrl','')[:70]}")

    if to_delete and not DRY_RUN:
        mutations = [{"delete": {"id": d["_id"]}} for d in to_delete]
        # Batch at 100 max
        for i in range(0, len(mutations), 100):
            result = sanity_mutate(mutations[i:i+100])
            total_deleted += len(result.get("results", []))
            time.sleep(0.3)

    offset += BATCH_SIZE
    print(f"  ... scanned {total_scanned} articles total", end="\r")

print()
print()
print("─" * 60)
print(f"Scanned:    {total_scanned} articles")
print(f"Off-topic:  {total_offopic} found")
if DRY_RUN:
    print(f"Action:     DRY RUN — pass --delete to actually remove them")
else:
    print(f"Deleted:    {total_deleted} articles")
print("─" * 60)
