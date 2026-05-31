#!/usr/bin/env python3
import json, urllib.request, urllib.parse, re, time, os

TOKEN = os.environ.get("SANITY_TOKEN","")
BASE  = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data"

def sq(query, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(query)
    if params:
        for k,v in params.items():
            url += "&" + urllib.parse.quote("$"+k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization":f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def smutate(mutations):
    body = json.dumps({"mutations":mutations},ensure_ascii=False).encode()
    req = urllib.request.Request(f"{BASE}/mutate/production",data=body,method="POST",
        headers={"Authorization":f"Bearer {TOKEN}","Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def check_img(url, label=""):
    """Verify image URL actually serves content."""
    if not url or not url.startswith("http"):
        return False, "NO_URL"
    try:
        req = urllib.request.Request(url, method="HEAD", headers={
            "User-Agent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept":"image/*,*/*;q=0.8"})
        with urllib.request.urlopen(req, timeout=10) as r:
            ct = r.headers.get("Content-Type","")
            cl = r.headers.get("Content-Length","0")
            ok = r.status == 200 and ("image" in ct.lower() or int(cl or 0) > 5000)
            return ok, f"HTTP {r.status} {ct[:30]} size={cl}"
    except Exception as e:
        return False, str(e)[:60]

def og_image(source_url):
    if not source_url or not source_url.startswith("http"): return None
    try:
        req = urllib.request.Request(source_url, headers={
            "User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124 Safari/537.36",
            "Accept":"text/html"})
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode("utf-8",errors="replace")
        for pat in [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\'<>]{20,})["\']',
            r'<meta[^>]+content=["\']([^"\'<>]{20,})["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\'<>]{20,})["\']',
        ]:
            m = re.search(pat, html, re.I)
            if m:
                u = m.group(1).strip()
                if (u.startswith("http") and
                    re.search(r"\.(jpe?g|png|webp)", u, re.I) and
                    not any(x in u.lower() for x in ["placeholder","logo","favicon","1x1","default","avatar","blank"])):
                    ok, stat = check_img(u)
                    if ok:
                        print(f"  OG found & verified: {u[:70]} [{stat}]", flush=True)
                        return u
                    else:
                        print(f"  OG found but broken: {u[:60]} [{stat}]", flush=True)
    except Exception as e:
        print(f"  OG error: {e}", flush=True)
    return None

def wm_search(query):
    """Search Wikimedia and verify each result URL before returning."""
    try:
        enc = urllib.parse.quote(query)
        req1 = urllib.request.Request(
            f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={enc}&srnamespace=6&srlimit=12&format=json&origin=*",
            headers={"User-Agent":"DownRange/1.0 (downrangeco.com)"})
        with urllib.request.urlopen(req1, timeout=15) as r:
            pages = json.loads(r.read()).get("query",{}).get("search",[])
        
        for page in pages:
            t = page["title"]
            if not re.search(r"\.(jpe?g|png|webp)$", t, re.I): continue
            
            req2 = urllib.request.Request(
                f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(t)}&prop=imageinfo&iiprop=url|size|mime&iiurlwidth=1200&format=json&origin=*",
                headers={"User-Agent":"DownRange/1.0"})
            with urllib.request.urlopen(req2, timeout=10) as r2:
                data = json.loads(r2.read())
            
            for p in data.get("query",{}).get("pages",{}).values():
                info = p.get("imageinfo",[{}])[0]
                if info.get("size",0) < 20000: continue
                if "svg" in info.get("mime","").lower(): continue
                
                # Try thumburl first (resized), then full url
                for u in [info.get("thumburl"), info.get("url")]:
                    if not u: continue
                    ok, stat = check_img(u)
                    if ok:
                        print(f"  WM verified: {t[:50]} → {stat}", flush=True)
                        return u
                    else:
                        print(f"  WM broken: {t[:40]} [{stat}]", flush=True)
            time.sleep(0.2)
    except Exception as e:
        print(f"  WM error: {e}", flush=True)
    return None

# ── STEP 1: Diagnose Berkeley article ────────────────────────────────────────
print("="*60, flush=True)
print("DIAGNOSING Berkeley article", flush=True)

slug = "berkeley-township-becomes-23rd-new-jersey-municipality-to-refund-carry-permit-fees"
art = sq('*[_type=="newsArticle" && slug.current==$s][0]{_id,title,imageUrl,"src":externalUrl}', {"s":slug})
print(f"Found: {bool(art)}", flush=True)
if art:
    img = art.get("imageUrl","")
    print(f"imageUrl: {img}", flush=True)
    ok, stat = check_img(img)
    print(f"URL check: {ok} | {stat}", flush=True)

    if not ok:
        print("\nFinding working image...", flush=True)
        new_url = None
        
        # Try OG from TTAG source
        new_url = og_image(art.get("src",""))
        
        # Try specific Wikimedia queries with URL verification
        if not new_url:
            for q in [
                "New Jersey State Police permit pistol firearm",
                "concealed carry firearm permit New Jersey state",
                "handgun pistol concealed carry holster permit",
                "Glock 19 pistol handgun black background",
                "pistol firearm carry permit license",
            ]:
                print(f"  Searching: {q}", flush=True)
                new_url = wm_search(q)
                if new_url: break
                time.sleep(0.5)
        
        if new_url:
            smutate([{"patch":{"id":art["_id"],"set":{"imageUrl":new_url}}}])
            ok2, stat2 = check_img(new_url)
            print(f"\n✅ FIXED: {new_url[:70]}", flush=True)
            print(f"  Verification: {ok2} | {stat2}", flush=True)
        else:
            print("❌ No working image found", flush=True)

# ── STEP 2: Scan ALL articles — test EVERY stored image URL ─────────────────
print("\n" + "="*60, flush=True)
print("FULL SCAN — testing every article imageUrl", flush=True)

all_arts = sq('*[_type=="newsArticle" && editorLocked!=true] | order(publishedAt desc) [0...400]{_id,title,"slug":slug.current,imageUrl,"src":externalUrl,category}')
print(f"Scanning {len(all_arts)} articles...", flush=True)

bad_generic = []
bad_broken  = []
good = 0

for i, a in enumerate(all_arts):
    img = a.get("imageUrl","")
    
    # Generic/local path
    if not img or img.startswith("/img/") or img.startswith("img/"):
        bad_generic.append(a)
        continue
    
    # Test the URL
    ok, stat = check_img(img)
    if ok:
        good += 1
    else:
        bad_broken.append(a)
        if len(bad_broken) <= 15:
            print(f"  BROKEN [{stat[:40]}]: {a.get('title','')[:50]}", flush=True)
    
    if (i+1) % 50 == 0:
        print(f"  Checked {i+1}/{len(all_arts)} — good:{good} generic:{len(bad_generic)} broken:{len(bad_broken)}", flush=True)
    
    time.sleep(0.05)  # gentle rate limit

print(f"\nResults: {good} good | {len(bad_generic)} generic | {len(bad_broken)} broken URLs", flush=True)

# ── STEP 3: Fix ALL broken URLs ──────────────────────────────────────────────
print("\n" + "="*60, flush=True)
print("FIXING broken image URLs", flush=True)

# Combine: generics + broken URLs
to_fix = bad_generic + bad_broken
print(f"Total to fix: {len(to_fix)}", flush=True)

TOPIC_QUERIES = {
    r"new.jersey|berkeley|carry.permit|permit.fee": ["New Jersey firearm carry permit pistol","Glock 19 handgun New Jersey"],
    r"court|judge|sentenc|probation|clerk|appeal|ruling|circuit": ["United States federal courthouse exterior","courthouse gavel justice United States"],
    r"australia|bondi|scrutiny": ["Sydney Australia harbour opera house","Sydney city waterfront Australia"],
    r"iowa|superintendent|school|ice.arrest|sentenc": ["Iowa state capitol Des Moines","United States district courthouse federal"],
    r"sacramento|journalist|gun.ban|gun.free": ["California State Capitol Sacramento building","gun legislation Capitol building"],
    r"machine.gun|machinegun|full.auto|belt.fed": ["M249 SAW light machine gun military","FN MINIMI machine gun NATO"],
    r"virginia|attorney|gun.ban|refusing|defend": ["Virginia state capitol Richmond","Virginia courthouse government building"],
    r"social.media|home.target|burglar|security": ["home security camera front door","residential security lock door"],
    r"vktr|ambi.*lower|lower.*ambi": ["AR-15 lower receiver firearm black","ambidextrous AR-15 rifle firearm"],
    r"fn.herstal|fn.mag|gpmg": ["FN MAG belt-fed machine gun military","NATO machine gun military range"],
    r"5.11|tactical.gear|allhaula|cooler": ["tactical gear military bag equipment","5.11 tactical gear backpack"],
    r"atf|congress|senate|ban|legislat|bill\b": ["United States Capitol building Congress","ATF federal law enforcement building"],
    r"glock|sig.sauer|beretta|p320|p365": ["Glock 19 Gen5 pistol handgun","SIG Sauer P320 pistol black"],
    r"ar.?15|ar15|rifle|carbine|m4\b": ["AR-15 semi-automatic rifle black","M4 carbine rifle military"],
    r"shotgun|mossberg|590|gauge": ["Mossberg 590A1 pump shotgun military","12 gauge pump shotgun firearm"],
    r"suppressor|silencer|nfa": ["suppressor silencer NFA firearm","SilencerCo Omega suppressor can"],
    r"ammo|ammunition|9mm|caliber|cartridge": ["9mm Luger ammunition cartridge Federal","firearm ammunition hollow point box"],
    r"holster|carry|ccw|conceal": ["IWB holster concealed carry Kydex","Safariland holster duty firearm"],
    r"police|officer|law.enfor|sheriff|deputy": ["police officer law enforcement badge","sheriff deputy patrol car lights"],
    r"military|soldier|army|marine|combat": ["US Army soldier training range weapon","Marine Corps firearms training range"],
    r"hunt|deer|elk|game|waterfowl|turkey": ["deer hunting rifle forest autumn","elk hunting rifle mountains"],
}

FALLBACKS = {
    "law":      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Supreme_Court_Building.jpg/1280px-United_States_Supreme_Court_Building.jpg",
    "rifle":    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg",
    "shotgun":  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mossberg_590A1.jpg/1280px-Mossberg_590A1.jpg",
    "suppressor":"https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silencer-Group.jpg/1280px-Silencer-Group.jpg",
    "ammo":     "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/9_mm_Parabellum.jpg/1280px-9_mm_Parabellum.jpg",
    "holster":  "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Safariland_Level_III_Holster.jpg/1280px-Safariland_Level_III_Holster.jpg",
    "training": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg",
    "default":  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1920px-Walther_P99Q.jpg",
}

# Pre-verify fallbacks
print("Pre-verifying fallback images...", flush=True)
VERIFIED_FALLBACKS = {}
for k, u in FALLBACKS.items():
    ok, stat = check_img(u)
    if ok:
        VERIFIED_FALLBACKS[k] = u
        print(f"  ✅ {k}: verified", flush=True)
    else:
        print(f"  ❌ {k}: BROKEN [{stat}]", flush=True)

def get_fallback(title, cat, img):
    t = (title+" "+cat).lower()
    if re.search(r"law|court|judge|atf|congress|ban|legislat|sentenc|probation|clerk|rul|appeal|bail|arrest|ice\b", t):
        return VERIFIED_FALLBACKS.get("law", VERIFIED_FALLBACKS.get("default"))
    if re.search(r"rifle|ar.?15|m4\b|carbine|machine.gun|full.auto", t):
        return VERIFIED_FALLBACKS.get("rifle", VERIFIED_FALLBACKS.get("default"))
    if re.search(r"shotgun|mossberg|590|gauge", t):
        return VERIFIED_FALLBACKS.get("shotgun", VERIFIED_FALLBACKS.get("default"))
    if re.search(r"suppressor|silencer|nfa", t):
        return VERIFIED_FALLBACKS.get("suppressor", VERIFIED_FALLBACKS.get("default"))
    if re.search(r"ammo|ammunition|9mm|caliber|cartridge", t):
        return VERIFIED_FALLBACKS.get("ammo", VERIFIED_FALLBACKS.get("default"))
    if re.search(r"holster|carry|ccw|conceal", t):
        return VERIFIED_FALLBACKS.get("holster", VERIFIED_FALLBACKS.get("default"))
    if re.search(r"training|range|practice|drill", t):
        return VERIFIED_FALLBACKS.get("training", VERIFIED_FALLBACKS.get("default"))
    if "rifle" in img: return VERIFIED_FALLBACKS.get("rifle", VERIFIED_FALLBACKS.get("default"))
    if "shotgun" in img: return VERIFIED_FALLBACKS.get("shotgun", VERIFIED_FALLBACKS.get("default"))
    if "law" in img: return VERIFIED_FALLBACKS.get("law", VERIFIED_FALLBACKS.get("default"))
    return VERIFIED_FALLBACKS.get("default")

fixed = failed = 0
for i, art in enumerate(to_fix[:250]):
    title = art.get("title","")
    cat   = art.get("category","")
    src   = art.get("src","")
    img   = art.get("imageUrl","")
    
    new_url = None
    
    # 1. OG from source (with verification)
    if src: new_url = og_image(src)
    
    # 2. Wikimedia with topic queries + verification
    if not new_url:
        t = (title+" "+cat).lower()
        for pattern, queries in TOPIC_QUERIES.items():
            if re.search(pattern, t):
                for wq in queries:
                    new_url = wm_search(wq)
                    if new_url: break
                    time.sleep(0.3)
                if new_url: break
    
    # 3. Generic Wikimedia for remaining
    if not new_url:
        new_url = wm_search("pistol handgun firearm 9mm black background")
    
    # 4. Pre-verified fallback — guaranteed to work
    if not new_url:
        new_url = get_fallback(title, cat, img)
    
    if new_url:
        try:
            smutate([{"patch":{"id":art["_id"],"set":{"imageUrl":new_url}}}])
            fixed += 1
            if i < 20 or i % 30 == 0:
                print(f"  [{i+1:3d}] ✅ {title[:50]}", flush=True)
                print(f"         → {new_url[:65]}", flush=True)
        except Exception as e:
            failed += 1
            print(f"  [{i+1:3d}] ❌ {e}", flush=True)
    else:
        failed += 1
    
    time.sleep(0.25)

print(f"\nFixed {fixed}, failed {failed}", flush=True)

# ── STEP 4: Final verification of Berkeley ───────────────────────────────────
print("\n" + "="*60, flush=True)
final = sq('*[_type=="newsArticle" && slug.current==$s][0]{title,imageUrl}', {"s":slug})
if final:
    img = final.get("imageUrl","")
    ok, stat = check_img(img)
    print(f"Berkeley final: {'✅ WORKING' if ok else '❌ STILL BROKEN'}", flush=True)
    print(f"imageUrl: {img}", flush=True)
    print(f"status: {stat}", flush=True)
print("✅ DONE", flush=True)
