#!/usr/bin/env python3
import json, urllib.request, urllib.parse, re, time, os

TOKEN = os.environ.get("SANITY_TOKEN","")
BASE = "https://vbnsqnkg.api.sanity.io/v2024-01-01/data"

def q(query, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(query)
    if params:
        for k,v in params.items():
            url += "&" + urllib.parse.quote("$"+k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization":"Bearer "+TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    body = json.dumps({"mutations":mutations}).encode()
    req = urllib.request.Request(BASE+"/mutate/production",data=body,method="POST",
        headers={"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def wikimedia(query):
    try:
        enc = urllib.parse.quote(query)
        req = urllib.request.Request(
            f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={enc}&srnamespace=6&srlimit=8&format=json&origin=*",
            headers={"User-Agent":"DownRange/1.0 (downrangeco.com)"})
        with urllib.request.urlopen(req, timeout=15) as r:
            pages = json.loads(r.read()).get("query",{}).get("search",[])
        for page in pages:
            t = page["title"]
            if not re.search(r"\.(jpg|jpeg|png|webp)$",t,re.I): continue
            req2 = urllib.request.Request(
                f"https://commons.wikimedia.org/w/api.php?action=query&titles={urllib.parse.quote(t)}&prop=imageinfo&iiprop=url|size&iiurlwidth=1400&format=json&origin=*",
                headers={"User-Agent":"DownRange/1.0"})
            with urllib.request.urlopen(req2, timeout=10) as r2:
                for p in json.loads(r2.read()).get("query",{}).get("pages",{}).values():
                    info = p.get("imageinfo",[{}])[0]
                    if info.get("size",0) < 15000: continue
                    u = info.get("thumburl") or info.get("url")
                    if u: return u
            time.sleep(0.25)
    except: pass
    return None

BAD = ["/img/photos/","/img/pistol","/img/rifle","/img/law","/img/shotgun",
       "/img/suppressor","/img/ammo","/img/news","/img/gear","/img/training"]

def is_bad(url): return not url or any(url.startswith(b) for b in BAD)

# DIAGNOSE THE EXACT ARTICLE
print("="*60)
slug = "berkeley-township-becomes-23rd-new-jersey-municipality-to-refund-carry-permit-fees"
art = q('*[_type=="newsArticle" && slug.current==$s][0]{_id,title,imageUrl,"sourceUrl":externalUrl,category}', {"s":slug})
print(f"Slug lookup: {'FOUND' if art else 'NOT FOUND'}")
if art:
    print(f"  _id:      {art['_id']}")
    print(f"  imageUrl: [{art.get('imageUrl','NONE')}]")
    print(f"  bad:      {is_bad(art.get('imageUrl',''))}")
    if is_bad(art.get("imageUrl","")):
        # Fix it with multiple fallback queries
        new_url = None
        for wm_q in [
            "New Jersey state police permit carry firearm",
            "concealed carry holster pistol license permit",
            "handgun permit license application form",
            "Glock pistol New Jersey firearm",
        ]:
            new_url = wikimedia(wm_q)
            if new_url:
                print(f"  WM found ({wm_q[:30]}): {new_url[:70]}")
                break
            time.sleep(0.5)
        if new_url:
            mutate([{"patch":{"id":art["_id"],"set":{"imageUrl":new_url}}}])
            print(f"  PATCHED -> {new_url[:70]}")
        else:
            # Hard fallback - use a known-good Wikimedia URL for NJ permit topic
            fallback = "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Concealed_Carry_Holster_Handgun.jpg/1280px-Concealed_Carry_Holster_Handgun.jpg"
            mutate([{"patch":{"id":art["_id"],"set":{"imageUrl":fallback}}}])
            print(f"  HARD FALLBACK: {fallback}")

# FULL RESCAN WITH BETTER QUERIES
print("\n" + "="*60)
print("FULL RESCAN - all bad-image articles")
all_arts = q('*[_type=="newsArticle" && editorLocked!=true] | order(publishedAt desc) [0...600]{_id,title,imageUrl,"sourceUrl":externalUrl,category}')
bad = [a for a in all_arts if is_bad(a.get("imageUrl"))]
print(f"Bad: {len(bad)}/{len(all_arts)}")

# Hard-coded Wikimedia fallbacks by category to always have an image
CATEGORY_FALLBACKS = {
    "law":      "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Supreme_Court_Building.jpg/1280px-United_States_Supreme_Court_Building.jpg",
    "news":     "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1920px-Walther_P99Q.jpg",
    "industry": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg",
    "breaking": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Supreme_Court_Building.jpg/1280px-United_States_Supreme_Court_Building.jpg",
    "default":  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1920px-Walther_P99Q.jpg",
}

def topic_query(title, cat):
    t = (title+" "+cat).lower()
    if re.search(r"new.jersey|berkeley|permit.fee|carry.permit|nj\b|refund",t):
        return ["New Jersey carry permit pistol firearm","concealed carry permit license"]
    if re.search(r"social.media|home.target|security|burglar|home.a.target",t):
        return ["home security door lock protection","residential security camera"]
    if re.search(r"australia|bondi|scrutiny",t):
        return ["Sydney Australia city harbour","Australia police law enforcement"]
    if re.search(r"bay.county|court.clerk|probation|stolen.gun",t):
        return ["courthouse gavel justice law","police station law enforcement"]
    if re.search(r"5\.56|22.suppressor|bore.*suppressor|suppressor.*bore",t):
        return ["firearm suppressor silencer NFA","AR-15 rifle with suppressor"]
    if re.search(r"iowa|school.district|sentenc",t):
        return ["courthouse justice gavel United States","federal court building"]
    if re.search(r"big.horn.armory|youtube.channel.*remov",t):
        return ["rifle firearm manufacturer American","bolt action rifle firearm"]
    if re.search(r"vktr|ambi.*lower|lower.*ambi",t):
        return ["AR-15 lower receiver firearm","ambidextrous rifle firearm"]
    if re.search(r"fn.herstal|fn.mag|gpmg",t):
        return ["FN MAG machine gun military","belt-fed machine gun military NATO"]
    if re.search(r"atf|congress|senate|ban|bill\b|act\b|legislature",t):
        return ["United States Capitol Congress Washington","ATF Bureau Alcohol Tobacco Firearms"]
    if re.search(r"glock|pistol|handgun|9mm",t):
        return ["Glock 19 pistol handgun","pistol handgun firearm 9mm"]
    if re.search(r"ar.?15|rifle|carbine|m4",t):
        return ["AR-15 rifle semi-automatic","M4 carbine rifle military"]
    if re.search(r"shotgun|mossberg|gauge",t):
        return ["Mossberg 590 shotgun pump","pump shotgun 12 gauge"]
    if re.search(r"suppressor|silencer|nfa",t):
        return ["suppressor silencer firearm NFA","SilencerCo firearm suppressor"]
    if re.search(r"ammo|ammunition|caliber|bullet",t):
        return ["9mm ammunition cartridge Federal","firearm ammunition hollow point"]
    if re.search(r"carry|holster|ccw",t):
        return ["concealed carry holster Kydex IWB","holster firearm carry"]
    if re.search(r"police|officer|sheriff|law.enfor",t):
        return ["police law enforcement officer","sheriff deputy police department"]
    if re.search(r"military|soldier|army|marine",t):
        return ["US military soldier weapon training","Marine Corps rifle training"]
    return ["handgun pistol firearm","firearm second amendment"]

fixed = failed = 0
for i, a in enumerate(bad[:250]):
    new_url = None
    title = a.get("title","")
    cat = a.get("category","")
    src = a.get("sourceUrl","")
    
    # OG first
    if src:
        try:
            req = urllib.request.Request(src, headers={"User-Agent":"Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as r:
                html = r.read().decode("utf-8",errors="replace")
            for pat in [r'property=[\'"]og:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
                        r'content=[\'"]([^\'"]{20,})[\'"][^>]*property=[\'"]og:image[\'"]']:
                m = re.search(pat,html,re.I)
                if m:
                    u = m.group(1)
                    if u.startswith("http") and re.search(r"\.(jpg|jpeg|png|webp)",u,re.I):
                        if not any(x in u for x in ["placeholder","logo","favicon","1x1","default","avatar"]):
                            new_url = u
                            break
        except: pass
    
    # Wikimedia with topic queries
    if not new_url:
        for wm_q in topic_query(title, cat):
            new_url = wikimedia(wm_q)
            if new_url: break
            time.sleep(0.3)
    
    # Hard fallback by category - never leave an article imageless
    if not new_url:
        new_url = CATEGORY_FALLBACKS.get(cat.lower(), CATEGORY_FALLBACKS["default"])
        print(f"  [{i+1:3d}] FALLBACK {cat}: {title[:45]}", flush=True)
    
    try:
        mutate([{"patch":{"id":a["_id"],"set":{"imageUrl":new_url}}}])
        fixed += 1
        if (i+1) % 10 == 0 or i < 15:
            print(f"  [{i+1:3d}] ✅ {title[:55]}", flush=True)
    except Exception as e:
        failed += 1
        print(f"  [{i+1:3d}] ❌ {e}", flush=True)
    
    time.sleep(0.3)

print(f"\nFINAL: {fixed} fixed, {failed} failed", flush=True)

# Final check - Berkeley article
final = q('*[_type=="newsArticle" && slug.current==$s][0]{imageUrl}', {"s":slug})
print(f"\nBerkeley article final imageUrl: {final.get('imageUrl','NONE') if final else 'NOT FOUND'}", flush=True)
