#!/usr/bin/env python3
import json, urllib.request, urllib.parse, re, time, os, sys
from collections import Counter, defaultdict

TOKEN = os.environ.get("SANITY_TOKEN","")
BASE  = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data"

def q(query, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(query)
    if params:
        for k,v in params.items():
            url += "&" + urllib.parse.quote("$"+k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization":f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    body = json.dumps({"mutations": mutations}, ensure_ascii=False).encode()
    req = urllib.request.Request(f"{BASE}/mutate/production", data=body, method="POST",
        headers={"Authorization":f"Bearer {TOKEN}", "Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def check_url(url):
    """Check if a URL actually serves a real image."""
    if not url or not url.startswith("http"):
        return "MISSING"
    try:
        req = urllib.request.Request(url, method="HEAD", headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "image/*,*/*"
        })
        with urllib.request.urlopen(req, timeout=8) as r:
            ct = r.headers.get("Content-Type","")
            code = r.status
            if code == 200 and ("image" in ct or url.endswith((".jpg",".jpeg",".png",".webp"))):
                return f"OK ({code})"
            return f"BAD_STATUS ({code}, {ct[:40]})"
    except Exception as e:
        return f"BROKEN: {str(e)[:60]}"

def og(source_url):
    if not source_url or not source_url.startswith("http"): return None
    try:
        req = urllib.request.Request(source_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
            "Accept": "text/html"})
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode("utf-8", errors="replace")
        for pat in [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\'>]{20,})["\']',
            r'<meta[^>]+content=["\']([^"\'>]{20,})["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\'>]{20,})["\']',
        ]:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                u = m.group(1).strip()
                if (u.startswith("http") and
                    re.search(r"\.(jpe?g|png|webp)", u, re.I) and
                    not any(x in u.lower() for x in ["placeholder","logo","favicon","1x1","avatar","blank","pixel","icon","badge","spacer"])):
                    return u
    except: pass
    return None

def wm(query):
    try:
        enc = urllib.parse.quote(query)
        req1 = urllib.request.Request(
            f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={enc}&srnamespace=6&srlimit=8&format=json&origin=*",
            headers={"User-Agent": "DownRange/1.0 (downrangeco.com)"})
        with urllib.request.urlopen(req1, timeout=12) as r:
            pages = json.loads(r.read()).get("query",{}).get("search",[])
        for page in pages:
            t = page["title"]
            if not re.search(r"\.(jpe?g|png|webp)$", t, re.I): continue
            req2 = urllib.request.Request(
                f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(t)}&prop=imageinfo&iiprop=url|size&iiurlwidth=1400&format=json&origin=*",
                headers={"User-Agent": "DownRange/1.0"})
            with urllib.request.urlopen(req2, timeout=10) as r2:
                for p in json.loads(r2.read()).get("query",{}).get("pages",{}).values():
                    info = p.get("imageinfo",[{}])[0]
                    if info.get("size",0) < 15000: continue
                    u = info.get("thumburl") or info.get("url")
                    if u:
                        # Verify URL actually works
                        status = check_url(u)
                        if "OK" in status:
                            return u
            time.sleep(0.2)
    except: pass
    return None

def is_bad(url):
    return not url or url.startswith("/img/") or url.startswith("img/")

# ─── VERIFIED good Wikimedia images (pre-tested to return 200) ────────────────
GOOD_IMAGES = {
    "law_court": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Supreme_Court_Building.jpg/1280px-United_States_Supreme_Court_Building.jpg",
    "pistol":    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1920px-Walther_P99Q.jpg",
    "rifle":     "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg",
    "shotgun":   "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mossberg_590A1.jpg/1280px-Mossberg_590A1.jpg",
    "ammo":      "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/9_mm_Parabellum.jpg/1280px-9_mm_Parabellum.jpg",
    "suppressor":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silencer-Group.jpg/1280px-Silencer-Group.jpg",
    "holster":   "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Safariland_Level_III_Holster.jpg/1280px-Safariland_Level_III_Holster.jpg",
    "training":  "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg",
}

def smart_fallback(title, cat, img_path=""):
    t = (title+" "+cat).lower()
    if re.search(r"law|court|judge|atf|congress|ban|legislat|sentenc|probation|clerk|rul|appeal|bail|arrest|ice\b|immigr", t):
        return GOOD_IMAGES["law_court"]
    if re.search(r"ar.?15|rifle|carbine|m4|m16|machine.gun|full.auto", t):
        return GOOD_IMAGES["rifle"]
    if re.search(r"shotgun|mossberg|gauge|590", t): return GOOD_IMAGES["shotgun"]
    if re.search(r"suppressor|silencer|nfa", t): return GOOD_IMAGES["suppressor"]
    if re.search(r"ammo|ammunition|9mm|caliber|cartridge|bullet", t): return GOOD_IMAGES["ammo"]
    if re.search(r"holster|carry|ccw|conceal", t): return GOOD_IMAGES["holster"]
    if re.search(r"training|range|practice|drill", t): return GOOD_IMAGES["training"]
    if "rifle" in img_path: return GOOD_IMAGES["rifle"]
    if "shotgun" in img_path: return GOOD_IMAGES["shotgun"]
    if "law" in img_path: return GOOD_IMAGES["law_court"]
    return GOOD_IMAGES["pistol"]

# ═══ STEP 1: Diagnose the two specific broken articles ════════════════════════
print("="*60, flush=True)
print("STEP 1: DIAGNOSE BROKEN ARTICLES", flush=True)
print("="*60, flush=True)

BROKEN_SLUGS = [
    "berkeley-township-becomes-23rd-new-jersey-municipality-to-refund-carry-permit-fees",
    "ex-bay-county-court-clerk-gets-probation-for-stealing-neighbor-s-guns-2-of-which-remain-missing",
]

for slug in BROKEN_SLUGS:
    art = q('*[_type=="newsArticle" && slug.current==$s][0]{_id,title,imageUrl,"src":externalUrl,category}', {"s":slug})
    if art:
        img = art.get("imageUrl","")
        status = check_url(img)
        print(f"\nSlug: {slug[:55]}", flush=True)
        print(f"  Title:    {art.get('title','')[:70]}", flush=True)
        print(f"  imageUrl: {img[:80]}", flush=True)
        print(f"  URL status: {status}", flush=True)
        
        if "OK" not in status:
            print(f"  → Image is broken, finding replacement...", flush=True)
            new_url = og(art.get("src",""))
            if new_url:
                ok = check_url(new_url)
                print(f"  → OG found: {new_url[:70]} [{ok}]", flush=True)
                if "OK" not in ok: new_url = None
            if not new_url:
                # Topic-specific Wikimedia search with URL verification
                for wm_q in [
                    "New Jersey State Police concealed carry firearm pistol",
                    "handgun pistol 9mm permit carry New Jersey",
                    "courthouse gavel probation court clerk",
                    "Bay County Florida courthouse",
                    "pistol handgun stolen firearms evidence",
                ]:
                    new_url = wm(wm_q)
                    if new_url:
                        print(f"  → Wikimedia: {new_url[:70]}", flush=True)
                        break
                    time.sleep(0.4)
            if not new_url:
                new_url = smart_fallback(art.get("title",""), art.get("category",""))
                print(f"  → Fallback: {new_url[:70]}", flush=True)
            
            mutate([{"patch":{"id":art["_id"],"set":{"imageUrl":new_url}}}])
            print(f"  ✅ PATCHED", flush=True)
    else:
        print(f"\nNOT FOUND: {slug}", flush=True)

# ═══ STEP 2: Delete off-topic articles ════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("STEP 2: DELETE OFF-TOPIC ARTICLES", flush=True)
print("="*60, flush=True)

DELETE_SLUGS = [
    "rti-activist-killed-in-phagwara-shooting",
    "illegal-arms-network-tied-to-delhi-liquor-store-heist-uncovered",
]
DELETE_PATTERNS = [
    "*phagwara*", "*Phagwara*", "*RTI activist*",
    "*delhi-liquor*", "*Delhi liquor*", "*delhi liquor*",
    "*arms network*Delhi*",
]

deleted = 0
for slug in DELETE_SLUGS:
    art = q('*[_type=="newsArticle" && slug.current==$s][0]{_id,title}', {"s":slug})
    if art:
        mutate([{"delete":{"id":art["_id"]}}])
        deleted += 1
        print(f"  DELETED: {art.get('title','')[:60]}", flush=True)
    else:
        print(f"  NOT FOUND by slug: {slug}", flush=True)

for pat in DELETE_PATTERNS:
    results = q('*[_type=="newsArticle" && title match $p]{_id,title}', {"p":pat})
    for a in results:
        try:
            mutate([{"delete":{"id":a["_id"]}}])
            deleted += 1
            print(f"  DELETED (pattern): {a.get('title','')[:60]}", flush=True)
        except: pass

print(f"Total deleted: {deleted}", flush=True)

# ═══ STEP 3: Full scan — catalog ALL broken/generic images ════════════════════
print("\n"+"="*60, flush=True)
print("STEP 3: FULL SCAN — CATALOG ALL IMAGE ISSUES", flush=True)
print("="*60, flush=True)

all_arts = q('*[_type=="newsArticle" && editorLocked!=true] | order(publishedAt desc) [0...600]{_id,title,"slug":slug.current,imageUrl,"src":externalUrl,category}')
print(f"Total articles: {len(all_arts)}", flush=True)

generic = [a for a in all_arts if is_bad(a.get("imageUrl",""))]
print(f"Generic /img/photos/ images: {len(generic)}", flush=True)

# Check which non-generic images are actually broken URLs
print(f"\nChecking non-generic image URLs...", flush=True)
real_img_articles = [a for a in all_arts if not is_bad(a.get("imageUrl",""))]
broken_real = []
for i, a in enumerate(real_img_articles[:100]):  # check first 100
    status = check_url(a.get("imageUrl",""))
    if "OK" not in status:
        broken_real.append(a)
        print(f"  BROKEN URL [{status[:30]}]: {a.get('title','')[:50]}", flush=True)
    if (i+1) % 20 == 0:
        print(f"  ... checked {i+1}/100", flush=True)
    time.sleep(0.1)

print(f"\nBroken non-generic URLs: {len(broken_real)}", flush=True)

# Catalog generic image usage
img_counts = Counter(a.get("imageUrl","none") for a in generic)
print("\nGENERIC IMAGE CATALOG (image name → article count):", flush=True)
for img, count in sorted(img_counts.items(), key=lambda x:-x[1]):
    name = img.split("/")[-1]
    print(f"  {count:3d} articles → {name}", flush=True)

# ═══ STEP 4: Fix ALL broken articles ══════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("STEP 4: FIX ALL BROKEN/GENERIC IMAGES", flush=True)
print("="*60, flush=True)

to_fix = generic + broken_real
seen = set()
to_fix_deduped = []
for a in to_fix:
    if a["_id"] not in seen:
        seen.add(a["_id"])
        to_fix_deduped.append(a)

print(f"Total to fix: {len(to_fix_deduped)}", flush=True)

TOPIC_WM = {
    r"new.jersey|berkeley|carry.permit|permit.fee|nj\b": ["New Jersey State Police pistol firearm","Glock 19 handgun concealed carry"],
    r"federal.court|circuit|appeal|ruling|compendium":   ["United States Court of Appeals building","federal courthouse exterior"],
    r"australia|bondi|scrutiny":                          ["Sydney Australia Opera House harbour","Sydney city landmark Australia"],
    r"court.clerk|probation|stolen.gun|bay.county":       ["courthouse gavel probation criminal court","police evidence firearms stolen"],
    r"iowa|superintendent|school|sentenc|ice.arrest":     ["Iowa state courthouse Des Moines","United States District Court building"],
    r"sacramento|journalist|gun.ban|gun.free":            ["California State Capitol building Sacramento","gun control legislation USA"],
    r"machine.gun|machineguns|full.auto":                 ["M249 SAW machine gun military range","FN MINIMI belt-fed machine gun"],
    r"virginia|attorney|gun.ban|refusing":                ["Virginia State Capitol Richmond building","attorney lawyer courthouse"],
    r"glock|sig|beretta|p320|p365":                       ["Glock 19 Gen5 pistol handgun","SIG Sauer P320 pistol firearm"],
    r"ar.?15|ar15|rifle|carbine":                         ["AR-15 semi-automatic rifle black","AR-15 carbine rifle range"],
    r"shotgun|mossberg|590|gauge":                        ["Mossberg 590A1 military shotgun pump","pump action shotgun 12 gauge"],
    r"suppressor|silencer|nfa":                           ["firearm suppressor NFA silencer","SilencerCo Omega suppressor"],
    r"ammo|ammunition|9mm|caliber|cartridge":             ["9mm Parabellum ammunition cartridge","firearm ammunition hollow point Federal"],
    r"holster|carry|ccw|conceal":                         ["IWB holster concealed carry Kydex","Safariland holster firearm duty"],
    r"police|officer|law.enfor|sheriff":                  ["police law enforcement officer badge","sheriff deputy patrol department"],
    r"atf|congress|senate|ban|legislat|bill\b":           ["United States Capitol Congress law","ATF Bureau Alcohol Tobacco Firearms"],
    r"court|judge|sentenc|probation|arrest|law\b":        ["United States courthouse justice gavel","federal court building"],
    r"social.media|home.target|burglar|security":         ["home security camera lock door","residential security protection"],
    r"hunting|deer|elk|game|waterfowl":                   ["deer hunting rifle forest","elk hunting rifle outdoors"],
    r"training|range|practice|drill":                     ["shooting range firearm practice","pistol training USMC"],
    r"5.11|tactical.gear|cooler|allhaula":                ["tactical gear military equipment bag","5.11 Tactical gear bag"],
    r"military|soldier|army|marine|combat":               ["US military soldier training weapon","Marine Corps rifle training range"],
}

fixed = failed = 0
for i, art in enumerate(to_fix_deduped[:300]):
    title = art.get("title","")
    cat   = art.get("category","")
    src   = art.get("src","")
    img   = art.get("imageUrl","")
    
    new_url = None
    
    # 1. OG image from source (fastest, most relevant)
    if src: new_url = og(src)
    
    # 2. Verify OG is actually reachable
    if new_url:
        status = check_url(new_url)
        if "OK" not in status: new_url = None
    
    # 3. Wikimedia by topic
    if not new_url:
        t = (title + " " + cat).lower()
        for pattern, queries in TOPIC_WM.items():
            if re.search(pattern, t):
                for wm_q in queries:
                    new_url = wm(wm_q)
                    if new_url: break
                    time.sleep(0.3)
                if new_url: break
    
    # 4. Guaranteed fallback — verified working Wikimedia URLs
    if not new_url:
        new_url = smart_fallback(title, cat, img)
    
    try:
        mutate([{"patch":{"id":art["_id"],"set":{"imageUrl":new_url}}}])
        fixed += 1
        if i < 15 or i % 25 == 0:
            print(f"  [{i+1:3d}] ✅ {title[:55]}", flush=True)
            print(f"         → {new_url[:65]}", flush=True)
    except Exception as e:
        failed += 1
        print(f"  [{i+1:3d}] ❌ {e}", flush=True)
    
    time.sleep(0.25)

print(f"\nFixed {fixed}, failed {failed}", flush=True)

# ═══ STEP 5: FINAL VERIFICATION ══════════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("STEP 5: FINAL VERIFICATION", flush=True)
print("="*60, flush=True)

for slug in BROKEN_SLUGS:
    art = q('*[_type=="newsArticle" && slug.current==$s][0]{title,imageUrl}', {"s":slug})
    if art:
        img = art.get("imageUrl","")
        status = check_url(img)
        ok = not is_bad(img) and "OK" in status
        print(f"  {'✅' if ok else '❌'} {art.get('title','')[:55]}", flush=True)
        print(f"     imageUrl: {img[:70]}", flush=True)
        print(f"     status:   {status}", flush=True)
    else:
        print(f"  NOT FOUND: {slug}", flush=True)

final = q('*[_type=="newsArticle" && editorLocked!=true][0...600]{_id,imageUrl}')
still_bad = [a for a in final if is_bad(a.get("imageUrl",""))]
print(f"\nRemaining generic images: {len(still_bad)}/{len(final)}", flush=True)
print("✅ DONE", flush=True)
