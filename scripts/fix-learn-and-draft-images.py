#!/usr/bin/env python3
"""
Fix images for:
1. Learn articles (hardcoded in source files) - update via GitHub file API
2. All draft articles/blogs in Sanity - patch with real OG or Wikimedia images
3. Test content API image pull (newsArticle batch)
"""
import json, urllib.request, urllib.parse, urllib.error, time, sys, os, base64, re, hashlib

SANITY_TOKEN = os.environ.get("SANITY_TOKEN", "")
GH_TOKEN     = os.environ.get("GH_TOKEN", "")
REPO         = "dejcav-cmd/DownRange"
PROJECT      = "vbnsqnkg"
BASE         = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        for k, v in params.items():
            url += "&" + urllib.parse.quote("$" + k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + SANITY_TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    body = json.dumps({"mutations": mutations}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE + "/mutate/production", data=body, method="POST",
        headers={"Authorization": "Bearer " + SANITY_TOKEN, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def search_wikimedia(query, limit=5):
    """Returns list of image URLs from Wikimedia Commons (CC0/public domain)"""
    results = []
    try:
        q = urllib.parse.quote(query)
        url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={q}&srnamespace=6&srlimit={limit}&format=json&origin=*"
        req = urllib.request.Request(url, headers={"User-Agent": "DownRange/1.0 (downrangeco.com; dj@downrangeco.com)"})
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read())
        pages = data.get("query", {}).get("search", [])
        for page in pages:
            title = page["title"]
            if not re.search(r"\.(jpg|jpeg|png|webp)$", title, re.I):
                continue
            enc = urllib.parse.quote(title)
            url2 = f"https://commons.wikimedia.org/w/api.php?action=query&titles={enc}&prop=imageinfo&iiprop=url|size&iiurlwidth=1400&format=json&origin=*"
            req2 = urllib.request.Request(url2, headers={"User-Agent": "DownRange/1.0"})
            with urllib.request.urlopen(req2, timeout=10) as r2:
                d2 = json.loads(r2.read())
            for p in d2.get("query", {}).get("pages", {}).values():
                info = p.get("imageinfo", [{}])[0]
                # Skip tiny images
                if info.get("size", 0) < 50000:  # skip < 50KB
                    continue
                u = info.get("thumburl") or info.get("url")
                if u:
                    results.append(u)
                    break
            if len(results) >= 2:
                break
            time.sleep(0.3)
    except Exception as e:
        print(f"  Wikimedia error: {e}", flush=True)
    return results

def try_og_image(source_url):
    if not source_url or not source_url.startswith("http"):
        return None
    try:
        req = urllib.request.Request(source_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html",
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="replace")
        for pat in [
            r'property=[\'"]og:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
            r'content=[\'"]([^\'"]{20,})[\'"][^>]*property=[\'"]og:image[\'"]',
            r'name=[\'"]twitter:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
        ]:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                u = m.group(1)
                if u.startswith("http") and re.search(r"\.(jpg|jpeg|png|webp)", u, re.I):
                    if not any(x in u for x in ["placeholder", "logo", "favicon", "1x1", "default"]):
                        return u
    except:
        pass
    return None

BAD = ["/img/photos/", "/img/pistol.svg", "/img/rifle.svg", "/img/law.svg",
       "/img/shotgun.svg", "/img/suppressor.svg", "/img/ammo.svg"]

def is_bad(url):
    return not url or any(url.startswith(b) or url == b for b in BAD)

# ────────────────────────────────────────────────────────────────
# SECTION 1: Test content API - verify new articles get real images
# ────────────────────────────────────────────────────────────────
print("=" * 60, flush=True)
print("SECTION 1: Testing content image pull (last 10 news articles)", flush=True)
print("=" * 60, flush=True)

recent = sanity_query(
    '*[_type == "newsArticle" && editorLocked != true] | order(publishedAt desc) [0...10] { _id, title, imageUrl, "sourceUrl": externalUrl }'
)
real_images = 0
for a in recent:
    url = a.get("imageUrl", "")
    is_real = url and url.startswith("http") and not is_bad(url)
    status = "✅ real" if is_real else "❌ generic"
    if is_real: real_images += 1
    print(f"  {status}: {(a.get('title') or '')[:50]} → {url[:60] if url else 'none'}", flush=True)

print(f"\nResult: {real_images}/10 articles have real images", flush=True)

# Fix any that are still bad
bad_recent = [a for a in recent if is_bad(a.get("imageUrl"))]
if bad_recent:
    print(f"\nFixing {len(bad_recent)} remaining bad images...", flush=True)
    for a in bad_recent:
        new_url = None
        if a.get("sourceUrl"):
            new_url = try_og_image(a["sourceUrl"])
        if not new_url:
            # Wikimedia fallback for news articles
            title = a.get("title", "")
            if re.search(r"glock|sig|beretta|colt|ruger|pistol|handgun", title, re.I):
                results = search_wikimedia("pistol handgun firearm")
            elif re.search(r"ar.?15|rifle|carbine", title, re.I):
                results = search_wikimedia("AR-15 rifle firearm")
            elif re.search(r"law|court|atf|congress|senate|ban", title, re.I):
                results = search_wikimedia("united states congress law")
            else:
                results = search_wikimedia("firearm second amendment")
            if results:
                new_url = results[0]
        if new_url:
            sanity_mutate([{"patch": {"id": a["_id"], "set": {"imageUrl": new_url}}}])
            print(f"  Fixed: {(a.get('title') or '')[:50]}", flush=True)
            time.sleep(0.3)

# ────────────────────────────────────────────────────────────────
# SECTION 2: Learn article images - Wikimedia search per topic
# ────────────────────────────────────────────────────────────────
print("\n" + "=" * 60, flush=True)
print("SECTION 2: Find Wikimedia images for Learn articles", flush=True)
print("=" * 60, flush=True)

LEARN_SEARCHES = {
    "buying-your-first-gun":          ["Glock 19 handgun pistol purchase", "pistol handgun firearm beginner"],
    "how-to-get-ccw-license":         ["concealed carry holster pistol waistband", "IWB holster handgun carry"],
    "firearms-safety-four-rules":     ["shooting range safety instruction", "firearms safety range instructor"],
    "home-defense-basics":            ["home defense shotgun Mossberg", "AR-15 rifle home defense"],
    "safe-storage-guide-beginners":   ["gun safe firearm storage vault", "firearm safe storage secure"],
    "ammo-guide-beginners":           ["9mm ammunition cartridges hollow point", "firearm ammunition bullets"],
    "shooting-range-first-visit":     ["indoor shooting range target practice", "shooting range firearm"],
    "cleaning-maintaining-your-gun":  ["Glock pistol cleaning maintenance disassembly", "firearm cleaning kit"],
    "understanding-gun-laws":         ["United States Constitution Second Amendment", "bill of rights constitution"],
    "choosing-holster-beginners":     ["IWB holster concealed carry pistol", "holster Kydex firearm"],
    "dry-fire-training-beginners":    ["pistol dry fire training practice", "handgun shooting training"],
    "what-is-nfa":                    ["suppressor silencer firearm NFA", "SilencerCo suppressor Omega"],
}

learn_images = {}
for slug, queries in LEARN_SEARCHES.items():
    found = None
    for query in queries:
        results = search_wikimedia(query, limit=5)
        if results:
            found = results[0]
            print(f"  ✅ {slug[:40]:40} → {found[:70]}", flush=True)
            break
        time.sleep(0.5)
    if not found:
        print(f"  ❌ {slug[:40]:40} → not found", flush=True)
    learn_images[slug] = found
    time.sleep(0.8)

print(f"\nFound images: {sum(1 for v in learn_images.values() if v)}/{len(learn_images)}", flush=True)

# Output results as JSON for the GitHub Actions step to use
with open("/tmp/learn_images.json", "w") as f:
    json.dump(learn_images, f, indent=2)
print("\nSaved to /tmp/learn_images.json", flush=True)

# ────────────────────────────────────────────────────────────────
# SECTION 3: Fix all draft articles/blogs/releases images
# ────────────────────────────────────────────────────────────────
print("\n" + "=" * 60, flush=True)
print("SECTION 3: Fix images on all draft content", flush=True)
print("=" * 60, flush=True)

TYPES = [
    ("newsArticle",    '*[_type=="newsArticle" && (status!="published" || published!=true) && editorLocked!=true] | order(_createdAt desc) [0...100] { _id, title, imageUrl, "sourceUrl":externalUrl, category }'),
    ("blogPost",       '*[_type=="blogPost" && (status!="published" && published!=true) && editorLocked!=true] | order(_createdAt desc) [0...50] { _id, title, imageUrl, category }'),
    ("firearmRelease", '*[_type=="firearmRelease" && editorLocked!=true] | order(_createdAt desc) [0...50] { _id, "title": brand + " " + model, imageUrl, sourceUrl, category }'),
    ("review",         '*[_type=="review" && editorLocked!=true] [0...30] { _id, "title": brand + " " + model, imageUrl, category }'),
]

def get_wikimedia_for_article(title, category=""):
    t = (title + " " + category).lower()
    if re.search(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber|p320|p365", t):
        brand = re.findall(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber", t)
        q = (brand[0] + " pistol handgun") if brand else "pistol handgun"
    elif re.search(r"ar.?15|ar15|m16|m4\b|rifle|carbine", t): q = "AR-15 semi-automatic rifle"
    elif re.search(r"ak.?47|ak47", t): q = "AK-47 Kalashnikov rifle"
    elif re.search(r"shotgun|mossberg|benelli|gauge", t): q = "shotgun pump action Mossberg"
    elif re.search(r"suppressor|silencer|nfa", t): q = "suppressor silencer firearm"
    elif re.search(r"9mm|ammo|ammunition|cartridge|bullet", t): q = "9mm ammunition cartridge firearm"
    elif re.search(r"conceal|carry|holster|ccw", t): q = "concealed carry holster pistol"
    elif re.search(r"atf|congress|court|ban|law|legislat|senate", t): q = "United States Congress law enforcement"
    elif re.search(r"police|officer|law.enfor", t): q = "police law enforcement officer"
    elif re.search(r"military|soldier|army|marine|combat", t): q = "military soldier weapon"
    elif re.search(r"hunt|deer|elk|game|waterfowl", t): q = "deer hunting rifle forest"
    elif re.search(r"range|train|practice|shoot", t): q = "shooting range firearm practice"
    else: q = "firearm handgun second amendment"
    
    results = search_wikimedia(q, limit=3)
    return results[0] if results else None

total_fixed = total_failed = 0

for doc_type, query in TYPES:
    try:
        docs = sanity_query(query)
    except Exception as e:
        print(f"  Query failed for {doc_type}: {e}", flush=True)
        continue
    
    bad_docs = [d for d in docs if is_bad(d.get("imageUrl"))]
    print(f"\n{doc_type}: {len(docs)} fetched, {len(bad_docs)} need images", flush=True)
    
    for i, doc in enumerate(bad_docs[:40]):  # max 40 per type
        new_url = None
        
        # Try OG first for news/releases
        if doc.get("sourceUrl"):
            new_url = try_og_image(doc["sourceUrl"])
        
        # Wikimedia fallback
        if not new_url:
            new_url = get_wikimedia_for_article(doc.get("title", ""), doc.get("category", ""))
        
        if new_url:
            try:
                sanity_mutate([{"patch": {"id": doc["_id"], "set": {"imageUrl": new_url}}}])
                total_fixed += 1
                print(f"  [{i+1}] ✅ {(doc.get('title') or '')[:55]}", flush=True)
            except Exception as e:
                total_failed += 1
                print(f"  [{i+1}] ❌ patch failed: {e}", flush=True)
        else:
            total_failed += 1
            print(f"  [{i+1}] ⚠ no image: {(doc.get('title') or '')[:55]}", flush=True)
        
        time.sleep(0.4)

print(f"\n=== FINAL: {total_fixed} fixed, {total_failed} unresolved ===", flush=True)

# Output learn images for file patching step
print("\nLearn images found:", flush=True)
for slug, url in learn_images.items():
    print(f"  {slug}: {'FOUND' if url else 'MISSING'}", flush=True)
