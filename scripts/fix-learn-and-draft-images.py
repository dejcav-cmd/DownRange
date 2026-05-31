#!/usr/bin/env python3
"""
All-in-one: Search Wikimedia, then immediately patch the source files via GitHub API.
No /tmp file sharing needed.
"""
import json, os, base64, urllib.request, urllib.error, urllib.parse, time, re, sys

SANITY_TOKEN = os.environ.get("SANITY_TOKEN", "")
GH_TOKEN = os.environ.get("GH_TOKEN", "")
REPO = "dejcav-cmd/DownRange"
PROJECT = "vbnsqnkg"
BASE = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

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

def gh_get(path):
    encoded_path = path.replace("[", "%5B").replace("]", "%5D")
    url = f"https://api.github.com/repos/{REPO}/contents/{encoded_path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {GH_TOKEN}",
        "Accept": "application/vnd.github+json"
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        d = json.loads(r.read())
        if d.get("content"):
            content = base64.b64decode(d["content"].replace("\n","")).decode("utf-8")
        else:
            dl_url = d.get("download_url")
            req2 = urllib.request.Request(dl_url, headers={"Authorization": f"token {GH_TOKEN}"})
            with urllib.request.urlopen(req2, timeout=20) as r2:
                content = r2.read().decode("utf-8")
        return content, d["sha"]

def gh_put(path, content, sha, message):
    encoded_path = path.replace("[", "%5B").replace("]", "%5D")
    url = f"https://api.github.com/repos/{REPO}/contents/{encoded_path}"
    payload = json.dumps({
        "message": message,
        "content": base64.b64encode(content.encode("utf-8")).decode(),
        "sha": sha
    }).encode()
    req = urllib.request.Request(url, data=payload, method="PUT", headers={
        "Authorization": f"token {GH_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json"
    })
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def search_wikimedia(query, limit=5):
    results = []
    try:
        q = urllib.parse.quote(query)
        url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={q}&srnamespace=6&srlimit={limit}&format=json&origin=*"
        req = urllib.request.Request(url, headers={"User-Agent": "DownRange/1.0 (downrangeco.com)"})
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
                if info.get("size", 0) < 30000:
                    continue
                u = info.get("thumburl") or info.get("url")
                if u:
                    results.append(u)
                    break
            if results:
                break
            time.sleep(0.3)
    except Exception as e:
        print(f"  Wikimedia error for '{query}': {e}", flush=True)
    return results

def try_og_image(source_url):
    if not source_url or not source_url.startswith("http"):
        return None
    try:
        req = urllib.request.Request(source_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="replace")
        for pat in [
            r'property=[\'"]og:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
            r'content=[\'"]([^\'"]{20,})[\'"][^>]*property=[\'"]og:image[\'"]',
        ]:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                u = m.group(1)
                if u.startswith("http") and re.search(r"\.(jpg|jpeg|png|webp)", u, re.I):
                    if not any(x in u for x in ["placeholder","logo","favicon","1x1","default"]):
                        return u
    except: pass
    return None

BAD = ["/img/photos/", "/img/pistol.svg", "/img/rifle.svg", "/img/law.svg",
       "/img/shotgun.svg", "/img/suppressor.svg", "/img/ammo.svg"]

def is_bad(url):
    return not url or any(url.startswith(b) or url == b for b in BAD)

# ════════════════════════════════════════════════════════════════════
# SECTION 1: Test content API - last 10 news articles image status
# ════════════════════════════════════════════════════════════════════
print("=" * 60, flush=True)
print("SECTION 1: Content API image test (last 10 news articles)", flush=True)
print("=" * 60, flush=True)

recent = sanity_query('*[_type=="newsArticle"] | order(publishedAt desc) [0...10] { _id, title, imageUrl, "sourceUrl":externalUrl }')
real_count = sum(1 for a in recent if not is_bad(a.get("imageUrl")))
print(f"✅ {real_count}/10 recent articles have real images", flush=True)

for a in recent:
    url = a.get("imageUrl","")
    bad = is_bad(url)
    print(f"  {'❌' if bad else '✅'} {(a.get('title') or '')[:50]}", flush=True)
    if bad and a.get("sourceUrl"):
        new_url = try_og_image(a["sourceUrl"])
        if not new_url:
            new_url = search_wikimedia("firearm gun news", 2)[0] if search_wikimedia("firearm gun news",2) else None
        if new_url:
            sanity_mutate([{"patch":{"id":a["_id"],"set":{"imageUrl":new_url}}}])
            print(f"    Fixed → {new_url[:60]}", flush=True)
            time.sleep(0.3)

# ════════════════════════════════════════════════════════════════════
# SECTION 2: Learn article images via Wikimedia
# ════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60, flush=True)
print("SECTION 2: Wikimedia images for Learn articles", flush=True)
print("=" * 60, flush=True)

LEARN_QUERIES = {
    "buying-your-first-gun":          "Glock 19 handgun pistol new",
    "how-to-get-ccw-license":         "concealed carry permit holster IWB pistol",
    "firearms-safety-four-rules":     "firearms safety shooting range instruction",
    "home-defense-basics":            "Mossberg 590 shotgun home defense",
    "safe-storage-guide-beginners":   "gun safe firearm storage vault Liberty",
    "ammo-guide-beginners":           "9mm Luger ammunition cartridges Federal HST",
    "shooting-range-first-visit":     "indoor shooting range target practice lanes",
    "cleaning-maintaining-your-gun":  "pistol field strip cleaning Glock disassembly",
    "understanding-gun-laws":         "United States Constitution Second Amendment text",
    "choosing-holster-beginners":     "Kydex IWB holster concealed carry Glock",
    "dry-fire-training-beginners":    "pistol dry fire practice training draw",
    "what-is-nfa":                    "SilencerCo Omega suppressor NFA firearm",
}

learn_images = {}
for slug, query in LEARN_QUERIES.items():
    results = search_wikimedia(query)
    url = results[0] if results else None
    learn_images[slug] = url
    status = "✅" if url else "❌"
    print(f"  {status} {slug[:40]:40} → {(url or 'not found')[:60]}", flush=True)
    time.sleep(0.6)

found = {k: v for k, v in learn_images.items() if v}
print(f"\nFound {len(found)}/{len(learn_images)} Learn article images", flush=True)

# ════════════════════════════════════════════════════════════════════
# SECTION 3: Fix draft content images in Sanity
# ════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60, flush=True)
print("SECTION 3: Fix draft article images in Sanity", flush=True)
print("=" * 60, flush=True)

def wm_query(title, cat=""):
    t = (title + " " + cat).lower()
    if re.search(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber", t):
        brand = re.findall(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber", t)
        return (brand[0] + " pistol") if brand else "pistol handgun"
    if re.search(r"ar.?15|ar15|m16|rifle|carbine", t): return "AR-15 rifle semi-automatic"
    if re.search(r"ak.?47", t): return "AK-47 Kalashnikov"
    if re.search(r"shotgun|mossberg|gauge", t): return "shotgun pump action"
    if re.search(r"suppressor|silencer", t): return "suppressor silencer firearm"
    if re.search(r"ammo|ammunition|bullet|9mm", t): return "9mm ammunition cartridge"
    if re.search(r"carry|holster|ccw|conceal", t): return "concealed carry holster"
    if re.search(r"atf|court|congress|senate|law|ban", t): return "United States Congress capitol"
    if re.search(r"police|officer|law.enfor", t): return "police law enforcement"
    return "firearm second amendment handgun"

DRAFT_QUERIES = [
    ('blogPost',       '*[_type=="blogPost" && (status=="draft" || (status!="published" && published!=true)) && editorLocked!=true] | order(_createdAt desc) [0...50] { _id, title, imageUrl, category }'),
    ('firearmRelease', '*[_type=="firearmRelease" && editorLocked!=true] | order(_createdAt desc) [0...60] { _id, "title": brand + " " + model, imageUrl, sourceUrl, category }'),
    ('review',         '*[_type=="review" && editorLocked!=true] [0...30] { _id, "title": brand + " " + model, imageUrl, category }'),
    ('newsArticle',    '*[_type=="newsArticle" && editorLocked!=true] | order(publishedAt desc) [0...100] { _id, title, imageUrl, "sourceUrl":externalUrl, category }'),
]

total_fixed = 0
for doc_type, query in DRAFT_QUERIES:
    docs = sanity_query(query)
    bad = [d for d in docs if is_bad(d.get("imageUrl"))]
    print(f"\n{doc_type}: {len(docs)} total, {len(bad)} need images", flush=True)
    
    for i, doc in enumerate(bad[:30]):
        new_url = None
        if doc.get("sourceUrl"):
            new_url = try_og_image(doc["sourceUrl"])
        if not new_url:
            results = search_wikimedia(wm_query(doc.get("title",""), doc.get("category","")))
            new_url = results[0] if results else None
        if new_url:
            sanity_mutate([{"patch":{"id":doc["_id"],"set":{"imageUrl":new_url}}}])
            total_fixed += 1
            print(f"  ✅ [{i+1}] {(doc.get('title') or '')[:55]}", flush=True)
        else:
            print(f"  ⚠ [{i+1}] no image: {(doc.get('title') or '')[:55]}", flush=True)
        time.sleep(0.4)

print(f"\nFixed {total_fixed} draft/release/review images", flush=True)

# ════════════════════════════════════════════════════════════════════
# SECTION 4: Patch Learn source files via GitHub API
# ════════════════════════════════════════════════════════════════════
print("\n" + "=" * 60, flush=True)
print("SECTION 4: Patch Learn source files in GitHub", flush=True)
print("=" * 60, flush=True)

if not found:
    print("No Learn images found — skipping file patches", flush=True)
    sys.exit(0)

# Patch learn/page.js
content, sha = gh_get("app/learn/page.js")
modified = False
for slug, url in found.items():
    idx = content.find(f"slug:'{slug}'")
    if idx < 0: idx = content.find(f'slug:"{slug}"')
    if idx < 0:
        print(f"  ⚠ {slug}: not found in LEARN_ARTICLES", flush=True)
        continue
    chunk = content[idx:idx+600]
    new_chunk = re.sub(r"img:\s*['\"][^'\"]*['\"]", f"img:'{url}'", chunk, count=1)
    if new_chunk != chunk:
        content = content[:idx] + new_chunk + content[idx+600:]
        print(f"  ✅ learn/page.js: {slug}", flush=True)
        modified = True

if modified:
    r = gh_put("app/learn/page.js", content, sha, "fix: real Wikimedia images for Learn articles")
    print(f"  Committed: {r.get('commit',{}).get('sha','?')[:10]}", flush=True)

time.sleep(1)

# Patch learn/[slug]/page.js  
content2, sha2 = gh_get("app/learn/[slug]/page.js")
modified2 = False
for slug, url in found.items():
    # HERO_IMAGES map
    new_c = re.sub(re.escape(f"'{slug}':") + r"\s*['\"][^'\"]*['\"]", f"'{slug}': '{url}'", content2)
    if new_c != content2:
        content2 = new_c
        modified2 = True
    
    # heroImage in article objects  
    idx = content2.find(f"'{slug}'")
    if idx >= 0:
        chunk = content2[idx:idx+1000]
        new_chunk = re.sub(r"heroImage:\s*['\"][^'\"]*['\"]", f"heroImage: '{url}'", chunk, count=1)
        if new_chunk != chunk:
            content2 = content2[:idx] + new_chunk + content2[idx+1000:]
            print(f"  ✅ learn/[slug]/page.js heroImage: {slug}", flush=True)
            modified2 = True

if modified2:
    r2 = gh_put("app/learn/[slug]/page.js", content2, sha2, "fix: real Wikimedia images for Learn article detail pages")
    print(f"  Committed: {r2.get('commit',{}).get('sha','?')[:10]}", flush=True)

print("\n✅ All done!", flush=True)
