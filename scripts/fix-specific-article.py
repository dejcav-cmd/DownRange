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
    body = json.dumps({"mutations":mutations},ensure_ascii=False).encode()
    req = urllib.request.Request(BASE+"/mutate/production",data=body,method="POST",
        headers={"Authorization":"Bearer "+TOKEN,"Content-Type":"application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def og(url):
    if not url or not url.startswith("http"): return None
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36","Accept":"text/html"})
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode("utf-8",errors="replace")
        for pat in [
            r'property=[\'"]og:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
            r'content=[\'"]([^\'"]{20,})[\'"][^>]*property=[\'"]og:image[\'"]',
            r'name=[\'"]twitter:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
            r'<img[^>]+src=[\'"](https?://[^\'"]{30,}\.(?:jpg|jpeg|png|webp))[\'"]',
        ]:
            m = re.search(pat, html, re.I)
            if m:
                u = m.group(1)
                if u.startswith("http") and not any(x in u for x in ["placeholder","logo","favicon","1x1","default","avatar","icon","pixel","blank","spacer"]):
                    if re.search(r"\.(jpg|jpeg|png|webp)", u, re.I) or "images" in u:
                        print(f"  OG found: {u[:80]}", flush=True)
                        return u
    except Exception as e:
        print(f"  OG error: {e}", flush=True)
    return None

def wikimedia(query):
    try:
        enc = urllib.parse.quote(query)
        r1 = urllib.request.Request(
            f"https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch={enc}&srnamespace=6&srlimit=6&format=json&origin=*",
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
                    if u:
                        print(f"  Wikimedia found: {u[:80]}", flush=True)
                        return u
            time.sleep(0.3)
    except Exception as e:
        print(f"  Wikimedia error: {e}", flush=True)
    return None

BAD_PATTERNS = ["/img/photos/","/img/pistol","/img/rifle","/img/law","/img/shotgun","/img/suppressor","/img/ammo","/img/news","/img/gear","/img/training"]

def is_bad(url):
    return not url or any(url.startswith(b) for b in BAD_PATTERNS)

# ── Specific article diagnosis ─────────────────────────────
slug = "berkeley-township-becomes-23rd-new-jersey-municipality-to-refund-carry-permit-fees"
print(f"DIAGNOSING: {slug}", flush=True)
art = q('*[_type=="newsArticle" && slug.current==$s][0]{_id,title,imageUrl,"sourceUrl":externalUrl,category,status,published}', {"s":slug})
if art:
    print(f"  _id:      {art['_id']}", flush=True)
    print(f"  title:    {art.get('title','')[:70]}", flush=True)
    print(f"  imageUrl: {art.get('imageUrl','NONE')}", flush=True)
    print(f"  sourceUrl:{art.get('sourceUrl','NONE')[:80]}", flush=True)
    print(f"  category: {art.get('category','')}", flush=True)
    print(f"  is_bad:   {is_bad(art.get('imageUrl',''))}", flush=True)
    
    # Try to fix it
    print("\nAttempting fix...", flush=True)
    
    # Strategy 1: OG from source
    new_url = og(art.get("sourceUrl",""))
    
    # Strategy 2: Wikimedia - New Jersey carry permit topic
    if not new_url:
        new_url = wikimedia("New Jersey carry permit handgun firearm")
    if not new_url:
        new_url = wikimedia("concealed carry permit license pistol")
    if not new_url:
        new_url = wikimedia("handgun pistol firearm permit")
    
    if new_url:
        result = mutate([{"patch":{"id":art["_id"],"set":{"imageUrl":new_url}}}])
        print(f"\n  ✅ FIXED: {new_url[:80]}", flush=True)
    else:
        print("\n  ❌ No image found", flush=True)
else:
    print("  Article NOT found in Sanity!", flush=True)
    # Try title search
    results = q('*[_type=="newsArticle" && title match "*Berkeley Township*"]{_id,title,imageUrl,slug}')
    print(f"  Title search results: {len(results)}", flush=True)
    for r in results[:3]:
        print(f"    {r.get('title','')[:60]} | img: {r.get('imageUrl','')[:50]}", flush=True)

# ── Also scan ALL articles with bad images right now ───────
print("\n\nSCANNING ALL BAD IMAGES...", flush=True)
all_arts = q('*[_type=="newsArticle" && editorLocked!=true] | order(publishedAt desc) [0...600]{_id,title,imageUrl,"sourceUrl":externalUrl,category}')
bad = [a for a in all_arts if is_bad(a.get("imageUrl"))]
print(f"Articles with bad images: {len(bad)} / {len(all_arts)}", flush=True)

# Show first 10 to understand the pattern
for a in bad[:10]:
    print(f"  [{a.get('imageUrl','NONE')[:40]}] {a.get('title','')[:50]}", flush=True)

print("\nFixing all bad articles...", flush=True)
fixed = failed = 0
for i, a in enumerate(bad[:200]):
    new_url = None
    src = a.get("sourceUrl","")
    title = a.get("title","")
    cat = a.get("category","")
    
    # OG first
    if src: new_url = og(src)
    
    # Wikimedia fallback with topic-specific queries
    if not new_url:
        t = (title + " " + cat).lower()
        if re.search(r"new.jersey|nj\b|berkeley|carry.permit|permit.fee|refund",t):
            new_url = wikimedia("New Jersey state government concealed carry firearm") or wikimedia("pistol handgun permit license")
        elif re.search(r"social.media|home.target|security|privacy|burglar",t):
            new_url = wikimedia("home security door lock protection safety")
        elif re.search(r"australia|bondi",t):
            new_url = wikimedia("Sydney Australia landmark city")
        elif re.search(r"iowa|school|district|sentenc|court|judge|probation|clerk",t):
            new_url = wikimedia("United States courthouse justice gavel law")
        elif re.search(r"5.56|22.suppressor|suppressor|silencer",t):
            new_url = wikimedia("firearm suppressor silencer NFA can")
        elif re.search(r"bay.county|court.clerk|probation|stolen",t):
            new_url = wikimedia("police law enforcement courthouse")
        elif re.search(r"vktr|lower.receiver|ambi",t):
            new_url = wikimedia("AR-15 lower receiver ambidextrous firearm")
        elif re.search(r"big.horn.armory|youtube|channel",t):
            new_url = wikimedia("rifle firearm manufacturer gun")
        elif re.search(r"fn.herstal|fn.mag|gpmg|machine.gun",t):
            new_url = wikimedia("FN MAG machine gun military belt-fed")
        elif re.search(r"atf|congress|senate|court|law|ban|bill\b|act\b|legislat",t):
            new_url = wikimedia("United States Capitol Congress law")
        elif re.search(r"glock|pistol|handgun",t):
            new_url = wikimedia("Glock pistol handgun")
        elif re.search(r"rifle|ar.?15|carbine",t):
            new_url = wikimedia("AR-15 rifle semi-automatic")
        elif re.search(r"shotgun|mossberg",t):
            new_url = wikimedia("Mossberg shotgun pump action")
        else:
            new_url = wikimedia("firearm handgun pistol")
    
    if new_url:
        mutate([{"patch":{"id":a["_id"],"set":{"imageUrl":new_url}}}])
        fixed += 1
        print(f"  [{i+1:3d}] ✅ {title[:55]}", flush=True)
    else:
        failed += 1
        print(f"  [{i+1:3d}] ⚠  {title[:55]}", flush=True)
    
    time.sleep(0.3)

print(f"\nFINAL: {fixed} fixed, {failed} couldn't find image", flush=True)
