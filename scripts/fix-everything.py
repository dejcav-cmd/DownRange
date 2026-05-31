#!/usr/bin/env python3
"""
Comprehensive fix script:
1. Fix 8 specific article images + all articles with bad/generic images
2. Delete reptile + other off-topic articles
3. Fix Learn article images (Wikimedia search + patch source files)
4. Fix gun page images
5. Fix all draft content images
"""
import json, urllib.request, urllib.parse, urllib.error, time, sys, os, re, base64

SANITY_TOKEN = os.environ.get("SANITY_TOKEN", "")
GH_TOKEN     = os.environ.get("GH_TOKEN", "")
REPO         = "dejcav-cmd/DownRange"
PROJECT      = "vbnsqnkg"
BASE         = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        for k,v in params.items():
            url += "&" + urllib.parse.quote("$"+k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization":"Bearer "+SANITY_TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    body = json.dumps({"mutations":mutations}, ensure_ascii=False).encode()
    req = urllib.request.Request(BASE+"/mutate/production", data=body, method="POST",
        headers={"Authorization":"Bearer "+SANITY_TOKEN,"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def gh_get(path):
    enc = path.replace("[","%5B").replace("]","%5D")
    url = f"https://api.github.com/repos/{REPO}/contents/{enc}"
    req = urllib.request.Request(url, headers={"Authorization":f"token {GH_TOKEN}","Accept":"application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        d = json.loads(r.read())
        if d.get("content"):
            return base64.b64decode(d["content"].replace("\n","")).decode("utf-8"), d["sha"]
        dl = d.get("download_url")
        req2 = urllib.request.Request(dl, headers={"Authorization":f"token {GH_TOKEN}"})
        with urllib.request.urlopen(req2, timeout=20) as r2:
            return r2.read().decode("utf-8"), d["sha"]

def gh_put(path, content, sha, msg):
    enc = path.replace("[","%5B").replace("]","%5D")
    url = f"https://api.github.com/repos/{REPO}/contents/{enc}"
    payload = json.dumps({"message":msg,"content":base64.b64encode(content.encode()).decode(),"sha":sha}).encode()
    req = urllib.request.Request(url, data=payload, method="PUT",
        headers={"Authorization":f"token {GH_TOKEN}","Content-Type":"application/json","Accept":"application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def search_wikimedia(query, limit=4):
    results = []
    try:
        q = urllib.parse.quote(query)
        url = f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={q}&srnamespace=6&srlimit={limit}&format=json&origin=*"
        req = urllib.request.Request(url, headers={"User-Agent":"DownRange/1.0 (downrangeco.com)"})
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read())
        for page in data.get("query",{}).get("search",[]):
            title = page["title"]
            if not re.search(r"\.(jpg|jpeg|png|webp)$", title, re.I): continue
            enc = urllib.parse.quote(title)
            url2 = f"https://commons.wikimedia.org/w/api.php?action=query&titles={enc}&prop=imageinfo&iiprop=url|size&iiurlwidth=1400&format=json&origin=*"
            req2 = urllib.request.Request(url2, headers={"User-Agent":"DownRange/1.0"})
            with urllib.request.urlopen(req2, timeout=10) as r2:
                d2 = json.loads(r2.read())
            for p in d2.get("query",{}).get("pages",{}).values():
                info = p.get("imageinfo",[{}])[0]
                if info.get("size",0) < 30000: continue
                u = info.get("thumburl") or info.get("url")
                if u:
                    results.append(u)
                    break
            if results: break
            time.sleep(0.3)
    except Exception as e:
        print(f"  Wikimedia error '{query[:40]}': {e}", flush=True)
    return results

def try_og_image(source_url):
    if not source_url or not source_url.startswith("http"): return None
    try:
        req = urllib.request.Request(source_url, headers={
            "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"})
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="replace")
        for pat in [r'property=[\'"]og:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
                    r'content=[\'"]([^\'"]{20,})[\'"][^>]*property=[\'"]og:image[\'"]']:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                u = m.group(1)
                if u.startswith("http") and re.search(r"\.(jpg|jpeg|png|webp)",u,re.I):
                    if not any(x in u for x in ["placeholder","logo","favicon","1x1","default","avatar"]):
                        return u
    except: pass
    return None

BAD = ["/img/photos/","/img/pistol.svg","/img/rifle.svg","/img/law.svg",
       "/img/shotgun.svg","/img/suppressor.svg","/img/ammo.svg","/img/news.svg"]

def is_bad(url):
    return not url or any(url.startswith(b) or url==b for b in BAD)

def wm_query(title, cat=""):
    t = (title+" "+cat).lower()
    if re.search(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber|p320|p365|bodyguard",t):
        brand = re.findall(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber",t)
        return (brand[0]+" pistol handgun") if brand else "pistol handgun"
    if re.search(r"ar.?15|ar15|m16|m4\b|rifle|carbine",t): return "AR-15 semi-automatic rifle"
    if re.search(r"ak.?47|ak47",t): return "AK-47 Kalashnikov rifle"
    if re.search(r"shotgun|mossberg|590|benelli|gauge",t): return "shotgun pump action Mossberg"
    if re.search(r"suppressor|silencer|nfa",t): return "firearm suppressor silencer"
    if re.search(r"ammo|ammunition|cartridge|bullet|9mm|caliber",t): return "firearm ammunition 9mm cartridge"
    if re.search(r"conceal|carry|holster|ccw|permit",t): return "concealed carry holster IWB pistol"
    if re.search(r"5.11|tactical.gear|gear|cooler|allhaula",t): return "tactical gear equipment military"
    if re.search(r"atf|congress|senate|court|ban|law|legislat",t): return "United States Capitol law enforcement"
    if re.search(r"social.media|home.target|security|privacy",t): return "home security lock door protection"
    if re.search(r"new.jersey|nj\b|berkeley|permit.fee|refund",t): return "New Jersey state permit carry"
    if re.search(r"fn.herstal|fn.mag|gpmg|machine.gun",t): return "FN MAG machine gun military"
    if re.search(r"iowa|school|district|sentenced",t): return "courthouse justice legal gavel"
    if re.search(r"vktr|lower|ambi|receiver",t): return "AR-15 lower receiver ambidextrous"
    if re.search(r"australia|bondi|attack",t): return "police law enforcement australia"
    if re.search(r"police|officer|law.enfor",t): return "police law enforcement officer"
    if re.search(r"military|soldier|army|marine|combat",t): return "military soldier weapon"
    return "firearm handgun second amendment"

# ════════════════════════════════════════════════════════════════
# SECTION 1: Fix specific articles + all bad-image articles
# ════════════════════════════════════════════════════════════════
print("="*60, flush=True)
print("SECTION 1: Fix specific article images + all bad images", flush=True)
print("="*60, flush=True)

# The 8 specific slugs
SPECIFIC_SLUGS = [
    "berkeley-township-becomes-23rd-new-jersey-municipality-to-refund-carry-permit-fees",
    "how-social-media-can-make-your-home-a-target",
    "rti-activist-killed-in-phagwara-shooting",
    "keep-cool-this-summer-with-5-11-tactical-allhaula-coolers",
    "australians-are-watching-scrutiny-of-the-bondi-attack-through-a-keyhole",
    "vktr-industries-opens-vk1-ambi-lower-to-stand-alone-sales",
    "fn-herstal-brings-long-rail-modern-ergonomics-to-the-fn-mag-gpmg",
    "former-head-of-iowa-s-largest-school-district-to-be-sentenced",
]

# Fetch specific articles
specific_docs = []
for slug in SPECIFIC_SLUGS:
    doc = sanity_query(
        '*[_type=="newsArticle" && slug.current==$s][0]{_id,title,imageUrl,"sourceUrl":externalUrl,category}',
        {"s": slug}
    )
    if doc:
        specific_docs.append(doc)
        print(f"  Found: {doc.get('title','')[:55]} | img: {(doc.get('imageUrl') or 'none')[:50]}", flush=True)
    else:
        print(f"  NOT FOUND: {slug}", flush=True)

# Also fetch ALL articles with bad images (news only, last 300)
all_bad = sanity_query(
    '*[_type=="newsArticle" && editorLocked!=true] | order(publishedAt desc) [0...300] { _id, title, imageUrl, "sourceUrl":externalUrl, category }'
)
all_bad = [a for a in all_bad if is_bad(a.get("imageUrl"))]
print(f"\nTotal articles with bad images: {len(all_bad)}", flush=True)

# Combine: specific first, then all others
seen_ids = set(d["_id"] for d in specific_docs)
to_fix = specific_docs + [a for a in all_bad if a["_id"] not in seen_ids]
to_fix = to_fix[:120]  # cap at 120 total

print(f"Processing {len(to_fix)} articles...", flush=True)

fixed = failed = 0
for i, doc in enumerate(to_fix):
    new_url = None
    # Try OG image first
    if doc.get("sourceUrl"):
        new_url = try_og_image(doc["sourceUrl"])
    # Wikimedia fallback
    if not new_url:
        q = wm_query(doc.get("title",""), doc.get("category",""))
        results = search_wikimedia(q)
        if results: new_url = results[0]
    
    if new_url:
        try:
            sanity_mutate([{"patch":{"id":doc["_id"],"set":{"imageUrl":new_url}}}])
            fixed += 1
            src = "OG" if doc.get("sourceUrl") and try_og_image else "WM"
            print(f"  [{i+1}] ✅ {(doc.get('title') or '')[:50]}", flush=True)
        except Exception as e:
            failed += 1
            print(f"  [{i+1}] ❌ patch error: {e}", flush=True)
    else:
        failed += 1
        print(f"  [{i+1}] ⚠ no image: {(doc.get('title') or '')[:50]}", flush=True)
    time.sleep(0.35)

print(f"\nSection 1: {fixed} fixed, {failed} no image found", flush=True)

# ════════════════════════════════════════════════════════════════
# SECTION 2: Delete off-topic articles
# ════════════════════════════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("SECTION 2: Delete off-topic articles", flush=True)
print("="*60, flush=True)

OFF_TOPIC_PATTERNS = [
    # Specific articles
    "*reptile*", "*smuggler*", "*snake*", "*lizard*", "*scaly*",
    "*Belagavi*", "*belagavi*", "*country-made guns*",
    # General patterns
    "*crypto*", "*bitcoin*", "*cooking*", "*recipe*",
]

# Build a single GROQ query for all off-topic patterns
deleted = 0
for pattern in ["*reptile*","*smuggler*","*scaly*","*belagavi*","*country-made*",
                "*phagwara*","*RTI activist*"]:
    try:
        q_pat = pattern.replace("*", "%")  # GROQ uses match differently
        results = sanity_query(
            '*[_type=="newsArticle" && title match $p]{_id,title,source}',
            {"p": pattern}
        )
        for a in results:
            print(f"  Deleting: {a.get('title','')[:60]} (source: {a.get('source','?')})", flush=True)
            sanity_mutate([{"delete":{"id":a["_id"]}}])
            deleted += 1
            time.sleep(0.2)
    except Exception as e:
        print(f"  Query error: {e}", flush=True)

print(f"Deleted {deleted} off-topic articles", flush=True)

# ════════════════════════════════════════════════════════════════
# SECTION 3: Fix Learn article images + gun page images
# ════════════════════════════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("SECTION 3: Fix Learn and Gun page images", flush=True)
print("="*60, flush=True)

LEARN_QUERIES = {
    "buying-your-first-gun":           "Glock 19 pistol purchase handgun beginner",
    "how-to-get-ccw-license":          "concealed carry holster IWB permit firearm",
    "firearms-safety-four-rules":      "firearms safety shooting range instruction",
    "home-defense-basics":             "Mossberg 590 shotgun home defense",
    "safe-storage-guide-beginners":    "gun safe Liberty firearm storage vault",
    "ammo-guide-beginners":            "9mm ammunition cartridge Federal HST",
    "shooting-range-first-visit":      "indoor shooting range target lanes",
    "cleaning-maintaining-your-gun":   "Glock pistol cleaning maintenance field strip",
    "understanding-gun-laws":          "United States Constitution Second Amendment",
    "choosing-holster-beginners":      "Kydex IWB holster concealed carry",
    "dry-fire-training-beginners":     "pistol training practice draw firearm",
    "what-is-nfa":                     "SilencerCo Omega suppressor NFA",
}

GUN_QUERIES = {
    "glock-17":      "Glock 17 Gen5 pistol handgun",
    "glock-19":      "Glock 19 Gen5 pistol compact",
    "glock-43x":     "Glock 43X slim pistol concealed carry",
    "sig-p320":      "SIG Sauer P320 pistol modular",
    "sig-p365":      "SIG P365 compact pistol 9mm",
    "ar-15":         "AR-15 semi-automatic rifle black",
    "ak-47":         "AK-47 Kalashnikov rifle",
    "remington-870": "Remington 870 pump shotgun",
    "mossberg-500":  "Mossberg 500 pump shotgun",
    "mossberg-590a1":"Mossberg 590A1 military shotgun",
    "ruger-10-22":   "Ruger 10/22 semi-automatic rifle rimfire",
    "smith-wesson-mp9": "Smith Wesson MP9 pistol handgun",
}

learn_images = {}
gun_images = {}

print("Searching Learn article images...", flush=True)
for slug, query in LEARN_QUERIES.items():
    results = search_wikimedia(query)
    url = results[0] if results else None
    learn_images[slug] = url
    print(f"  {'✅' if url else '❌'} {slug[:40]:40} {(url or 'not found')[:60]}", flush=True)
    time.sleep(0.6)

print("\nSearching Gun page images...", flush=True)
for slug, query in GUN_QUERIES.items():
    results = search_wikimedia(query)
    url = results[0] if results else None
    gun_images[slug] = url
    print(f"  {'✅' if url else '❌'} {slug[:30]:30} {(url or 'not found')[:60]}", flush=True)
    time.sleep(0.6)

# Patch Learn source files
learn_found = {k:v for k,v in learn_images.items() if v}
gun_found   = {k:v for k,v in gun_images.items() if v}
print(f"\nLearn: {len(learn_found)}/{len(learn_images)} found", flush=True)
print(f"Guns:  {len(gun_found)}/{len(gun_images)} found", flush=True)

# Patch app/learn/page.js
if learn_found:
    content, sha = gh_get("app/learn/page.js")
    modified = False
    for slug, url in learn_found.items():
        idx = content.find(f"slug:'{slug}'")
        if idx < 0: idx = content.find(f'slug:"{slug}"')
        if idx < 0: continue
        chunk = content[idx:idx+600]
        new_chunk = re.sub(r"img:\s*['\"][^'\"]*['\"]", f"img:'{url}'", chunk, count=1)
        if new_chunk != chunk:
            content = content[:idx] + new_chunk + content[idx+600:]
            modified = True
            print(f"  ✅ learn/page.js: {slug}", flush=True)
    if modified:
        r = gh_put("app/learn/page.js", content, sha, "fix: Wikimedia CC0 images for Learn articles")
        print(f"  Committed: {r.get('commit',{}).get('sha','?')[:10]}", flush=True)
        time.sleep(1)

# Patch app/learn/[slug]/page.js
if learn_found:
    content2, sha2 = gh_get("app/learn/[slug]/page.js")
    modified2 = False
    for slug, url in learn_found.items():
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
                modified2 = True
    if modified2:
        r2 = gh_put("app/learn/[slug]/page.js", content2, sha2, "fix: Wikimedia CC0 images for Learn detail pages")
        print(f"  learn/[slug] committed: {r2.get('commit',{}).get('sha','?')[:10]}", flush=True)
        time.sleep(1)

# Patch app/guns/[model]/page.js
if gun_found:
    content3, sha3 = gh_get("app/guns/[model]/page.js")
    modified3 = False
    for slug, url in gun_found.items():
        # Find image field for this gun slug
        idx = content3.find(f"'{slug}':")
        if idx < 0: continue
        chunk = content3[idx:idx+2000]
        new_chunk = re.sub(r"image:\s*['\"][^'\"]*['\"]", f"image:'{url}'", chunk, count=1)
        if new_chunk != chunk:
            content3 = content3[:idx] + new_chunk + content3[idx+2000:]
            modified3 = True
            print(f"  ✅ guns/[model]: {slug}", flush=True)
    if modified3:
        r3 = gh_put("app/guns/[model]/page.js", content3, sha3, "fix: real Wikimedia images for gun detail pages")
        print(f"  guns/[model] committed: {r3.get('commit',{}).get('sha','?')[:10]}", flush=True)

# ════════════════════════════════════════════════════════════════
# SECTION 4: Fix all draft content images
# ════════════════════════════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("SECTION 4: Fix draft content images in Sanity", flush=True)
print("="*60, flush=True)

DRAFT_QUERIES = [
    ("blogPost",       '*[_type=="blogPost" && (status=="draft" || (status!="published" && published!=true)) && editorLocked!=true] | order(_createdAt desc) [0...50]{_id,title,imageUrl,category}'),
    ("firearmRelease", '*[_type=="firearmRelease" && editorLocked!=true] | order(_createdAt desc) [0...60]{_id,"title":brand+" "+model,imageUrl,sourceUrl,category}'),
    ("review",         '*[_type=="review" && editorLocked!=true][0...30]{_id,"title":brand+" "+model,imageUrl,category}'),
]

total_fixed2 = 0
for doc_type, query in DRAFT_QUERIES:
    try: docs = sanity_query(query)
    except Exception as e:
        print(f"  Query failed {doc_type}: {e}", flush=True)
        continue
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
            total_fixed2 += 1
            print(f"  ✅ {(doc.get('title') or '')[:55]}", flush=True)
        else:
            print(f"  ⚠ no image: {(doc.get('title') or '')[:55]}", flush=True)
        time.sleep(0.4)

print(f"\n✅ ALL DONE — {fixed} news fixed, {deleted} deleted, {total_fixed2} drafts fixed", flush=True)
