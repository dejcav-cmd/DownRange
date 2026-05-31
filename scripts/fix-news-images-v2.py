#!/usr/bin/env python3
"""
Comprehensive news image fix:
1. Find Big Horn Armory article image - find all articles using same bad URL
2. Fix ALL news articles with generic /img/photos/ images
3. Fix ALL law-tagged articles  
4. Delete phagwara article
"""
import json, urllib.request, urllib.parse, urllib.error, re, time, os, sys

TOKEN = os.environ.get("SANITY_TOKEN","")
PROJECT = "vbnsqnkg"
BASE = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def q(query, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(query)
    if params:
        for k,v in params.items():
            url += "&" + urllib.parse.quote("$"+k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization":"Bearer "+TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    body = json.dumps({"mutations":mutations},ensure_ascii=False).encode()
    req = urllib.request.Request(BASE+"/mutate/production",data=body,method="POST",
        headers={"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def wikimedia(query, limit=5):
    urls = []
    try:
        enc = urllib.parse.quote(query)
        r1 = urllib.request.Request(
            f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={enc}&srnamespace=6&srlimit={limit}&format=json&origin=*",
            headers={"User-Agent":"DownRange/1.0 (downrangeco.com)"})
        with urllib.request.urlopen(r1, timeout=12) as res:
            pages = json.loads(res.read()).get("query",{}).get("search",[])
        for page in pages:
            t = page["title"]
            if not re.search(r"\.(jpg|jpeg|png|webp)$",t,re.I): continue
            r2 = urllib.request.Request(
                f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(t)}&prop=imageinfo&iiprop=url|size&iiurlwidth=1400&format=json&origin=*",
                headers={"User-Agent":"DownRange/1.0"})
            with urllib.request.urlopen(r2, timeout=10) as res2:
                for p in json.loads(res2.read()).get("query",{}).get("pages",{}).values():
                    info = p.get("imageinfo",[{}])[0]
                    if info.get("size",0) < 20000: continue
                    u = info.get("thumburl") or info.get("url")
                    if u: urls.append(u); break
            if urls: break
            time.sleep(0.25)
    except Exception as e:
        pass
    return urls

def og(url):
    if not url or not url.startswith("http"): return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36"})
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8",errors="replace")
        for pat in [r'property=[\'"]og:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
                    r'content=[\'"]([^\'"]{20,})[\'"][^>]*property=[\'"]og:image[\'"]',
                    r'name=[\'"]twitter:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]']:
            m = re.search(pat,html,re.I)
            if m:
                u = m.group(1)
                if u.startswith("http") and re.search(r"\.(jpg|jpeg|png|webp)",u,re.I):
                    if not any(x in u for x in ["placeholder","logo","favicon","1x1","default","avatar","icon"]):
                        return u
    except: pass
    return None

BAD = ["/img/photos/","/img/pistol.svg","/img/rifle.svg","/img/law.svg",
       "/img/shotgun.svg","/img/suppressor.svg","/img/ammo.svg","/img/news.svg",
       "/img/training.svg","/img/gear.svg","/img/competition.svg"]

def is_bad(url):
    return not url or any(url.startswith(b) or url==b for b in BAD)

def wm_query(title, cat=""):
    t = (title+" "+cat).lower()
    if re.search(r"big.horn.armory|youtube|channel|remov",t): return "firearm rifle manufacturer gun"
    if re.search(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber",t):
        brand = re.findall(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber",t)
        return (brand[0]+" pistol") if brand else "pistol handgun"
    if re.search(r"ar.?15|ar15|rifle|carbine",t): return "AR-15 semi-automatic rifle"
    if re.search(r"shotgun|mossberg|590|gauge",t): return "shotgun pump action"
    if re.search(r"suppressor|silencer",t): return "firearm suppressor silencer NFA"
    if re.search(r"ammo|ammunition|cartridge|9mm|caliber|\\.56|\\.308",t): return "firearm ammunition cartridge 9mm"
    if re.search(r"conceal|carry|holster|ccw|permit",t): return "concealed carry holster IWB"
    if re.search(r"5.11|tactical.gear|cooler",t): return "tactical gear military equipment"
    if re.search(r"social.media|home.target|security|privacy|burglar",t): return "home security door lock protection"
    if re.search(r"new.jersey|nj\b|berkeley|permit.fee|refund",t): return "New Jersey state government building"
    if re.search(r"fn.herstal|fn.mag|gpmg|machine.gun|gpg",t): return "FN MAG machine gun military NATO"
    if re.search(r"iowa|school|district|sentenc|court|judge|probation|clerk",t): return "courthouse justice legal gavel United States"
    if re.search(r"vktr|lower.receiver|ambi|ambidextrous",t): return "AR-15 lower receiver ambidextrous firearm"
    if re.search(r"australia|bondi|attack",t): return "Sydney Australia harbour bridge landmark"
    if re.search(r"5.56|22.suppressor|can\b|bore",t): return "AR-15 rifle suppressor silencer"
    if re.search(r"bay.county|court.clerk|probation|stolen.gun",t): return "courthouse justice gavel law"
    if re.search(r"police|officer|law.enfor|sheriff",t): return "police law enforcement officer"
    if re.search(r"military|soldier|army|marine|combat",t): return "military soldier weapon"
    if re.search(r"atf|congress|senate|court|ban|law|legislat|bill\b|act\b",t): return "United States Capitol law Congress"
    return "firearm handgun pistol"

# ═══════════════════════════════════════════════════════════
# 1. Find Big Horn Armory image URL and all articles using it
# ═══════════════════════════════════════════════════════════
print("="*60, flush=True)
print("STEP 1: Big Horn Armory article & shared bad image URL", flush=True)
print("="*60, flush=True)

bh = q('*[_type=="newsArticle" && slug.current=="big-horn-armory-youtube-channel-is-removed"][0]{_id,title,imageUrl,"sourceUrl":externalUrl}')
if bh:
    bad_img = bh.get("imageUrl","")
    print(f"Big Horn Armory image: {bad_img}", flush=True)
    
    # Find ALL articles using this same image
    if bad_img and not is_bad(bad_img):
        # It's a "real" URL but might be a YouTube thumbnail reused across articles
        shared = q('*[_type=="newsArticle" && imageUrl==$u]{_id,title,imageUrl}', {"u":bad_img})
        print(f"Articles sharing this image: {len(shared)}", flush=True)
        for a in shared[:5]:
            print(f"  {a.get('title','')[:60]}", flush=True)
        
        # Fix all of them
        for a in shared:
            new_url = og(a.get("sourceUrl")) if a.get("sourceUrl") else None
            if not new_url:
                new_url = (wikimedia(wm_query(a.get("title",""),a.get("category",""))) or [None])[0]
            if new_url:
                mutate([{"patch":{"id":a["_id"],"set":{"imageUrl":new_url}}}])
                print(f"  ✅ Fixed: {a.get('title','')[:50]}", flush=True)
            time.sleep(0.3)
    elif is_bad(bad_img):
        print("Big Horn article has generic image - will be fixed in main batch", flush=True)
else:
    print("Big Horn article not found (may already be fixed)", flush=True)

# ═══════════════════════════════════════════════════════════
# 2. Delete phagwara article
# ═══════════════════════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("STEP 2: Delete off-topic articles", flush=True)
print("="*60, flush=True)

for pattern in ["*phagwara*","*Phagwara*","*RTI activist*","*rti-activist*"]:
    results = q('*[_type=="newsArticle" && title match $p]{_id,title}', {"p":pattern})
    for a in results:
        print(f"  Deleting: {a.get('title','')[:60]}", flush=True)
        mutate([{"delete":{"id":a["_id"]}}])

# Also check slug directly
slug_check = q('*[_type=="newsArticle" && slug.current=="rti-activist-killed-in-phagwara-shooting"][0]{_id,title}')
if slug_check:
    print(f"  Deleting by slug: {slug_check.get('title','')[:60]}", flush=True)
    mutate([{"delete":{"id":slug_check["_id"]}}])

# ═══════════════════════════════════════════════════════════
# 3. Fix ALL news articles with bad/generic images
# ═══════════════════════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("STEP 3: Fix ALL articles with bad images", flush=True)
print("="*60, flush=True)

# Fetch in batches - news articles, all categories including law
all_articles = q('*[_type=="newsArticle" && editorLocked!=true] | order(publishedAt desc) [0...500]{_id,title,imageUrl,"sourceUrl":externalUrl,category}')
bad_articles = [a for a in all_articles if is_bad(a.get("imageUrl"))]
print(f"Total articles: {len(all_articles)}, Bad images: {len(bad_articles)}", flush=True)

# Also get law-tagged articles specifically
law_articles = q('*[_type=="newsArticle" && (category=="law"||category=="Law") && editorLocked!=true][0...200]{_id,title,imageUrl,"sourceUrl":externalUrl,category}')
law_bad = [a for a in law_articles if is_bad(a.get("imageUrl"))]
print(f"Law articles: {len(law_articles)}, Bad images: {len(law_bad)}", flush=True)

# Combine, dedup
seen = set()
to_fix = []
for a in bad_articles + law_bad:
    if a["_id"] not in seen:
        seen.add(a["_id"])
        to_fix.append(a)
to_fix = to_fix[:200]  # cap at 200
print(f"Total to fix: {len(to_fix)}", flush=True)

fixed = failed = 0
for i, art in enumerate(to_fix):
    new_url = None
    # Try OG image from source
    if art.get("sourceUrl"):
        new_url = og(art["sourceUrl"])
    # Wikimedia fallback
    if not new_url:
        results = wikimedia(wm_query(art.get("title",""), art.get("category","")))
        new_url = results[0] if results else None
    
    if new_url:
        try:
            mutate([{"patch":{"id":art["_id"],"set":{"imageUrl":new_url}}}])
            fixed += 1
            print(f"  [{i+1}] ✅ {art.get('title','')[:55]}", flush=True)
        except Exception as e:
            failed += 1
            print(f"  [{i+1}] ❌ {e}", flush=True)
    else:
        failed += 1
        print(f"  [{i+1}] ⚠ no image: {art.get('title','')[:55]}", flush=True)
    time.sleep(0.3)

print(f"\n✅ DONE: {fixed} fixed, {failed} no image found", flush=True)

# ═══════════════════════════════════════════════════════════
# 4. Fix blog drafts and other content too
# ═══════════════════════════════════════════════════════════
print("\n"+"="*60, flush=True)
print("STEP 4: Fix blog drafts + releases", flush=True)
print("="*60, flush=True)

for doc_type, dq in [
    ("blogPost", '*[_type=="blogPost" && editorLocked!=true && (status=="draft" || published!=true)][0...60]{_id,title,imageUrl,category}'),
    ("firearmRelease", '*[_type=="firearmRelease" && editorLocked!=true][0...80]{_id,"title":brand+" "+model,imageUrl,sourceUrl,category}'),
]:
    try:
        docs = q(dq)
        bad = [d for d in docs if is_bad(d.get("imageUrl"))]
        print(f"\n{doc_type}: {len(bad)} need images", flush=True)
        for d in bad[:40]:
            new_url = og(d.get("sourceUrl")) if d.get("sourceUrl") else None
            if not new_url:
                results = wikimedia(wm_query(d.get("title",""), d.get("category","")))
                new_url = results[0] if results else None
            if new_url:
                mutate([{"patch":{"id":d["_id"],"set":{"imageUrl":new_url}}}])
                print(f"  ✅ {d.get('title','')[:55]}", flush=True)
            time.sleep(0.35)
    except Exception as e:
        print(f"  Error: {e}", flush=True)

print("\n✅ ALL DONE!", flush=True)
