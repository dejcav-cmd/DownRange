#!/usr/bin/env python3
import json, urllib.request, urllib.parse, urllib.error, time, sys, os

TOKEN = os.environ.get("SANITY_TOKEN", "")
PROJECT = "vbnsqnkg"
BASE = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"

def sanity_query(q, params=None):
    url = BASE + "/query/production?query=" + urllib.parse.quote(q)
    if params:
        for k, v in params.items():
            url += "&" + urllib.parse.quote("$" + k) + "=" + urllib.parse.quote(json.dumps(v))
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def sanity_mutate(mutations):
    body = json.dumps({"mutations": mutations}, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(BASE + "/mutate/production", data=body, method="POST",
        headers={"Authorization": "Bearer " + TOKEN, "Content-Type": "application/json; charset=utf-8"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def try_og_image(source_url):
    if not source_url or not source_url.startswith("http"):
        return None
    try:
        req = urllib.request.Request(source_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html"
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            html = r.read().decode("utf-8", errors="replace")
        import re
        patterns = [
            r'property=[\'"]og:image[\'"][^>]*content=[\'"]([^\'"]{20,})[\'"]',
            r'content=[\'"]([^\'"]{20,})[\'"][^>]*property=[\'"]og:image[\'"]'
        ]
        for pat in patterns:
            m = re.search(pat, html, re.IGNORECASE)
            if m:
                u = m.group(1)
                if u.startswith("http") and re.search(r"\.(jpg|jpeg|png|webp)", u, re.I):
                    if "placeholder" not in u and "logo" not in u and "favicon" not in u:
                        return u
    except:
        pass
    return None

def search_wikimedia(query):
    try:
        q = urllib.parse.quote(query)
        url = "https://commons.wikimedia.org/w/api.php?action=query&list=search&srsearch=" + q + "&srnamespace=6&srlimit=3&format=json&origin=*"
        req = urllib.request.Request(url, headers={"User-Agent": "DownRange/1.0 (downrangeco.com)"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        pages = data.get("query", {}).get("search", [])
        import re
        for page in pages:
            if not re.search(r"\.(jpg|jpeg|png|webp)", page["title"], re.I):
                continue
            enc = urllib.parse.quote(page["title"])
            url2 = "https://commons.wikimedia.org/w/api.php?action=query&titles=" + enc + "&prop=imageinfo&iiprop=url&iiurlwidth=1200&format=json&origin=*"
            req2 = urllib.request.Request(url2, headers={"User-Agent": "DownRange/1.0"})
            with urllib.request.urlopen(req2, timeout=8) as r2:
                d2 = json.loads(r2.read())
            for p in d2.get("query", {}).get("pages", {}).values():
                info = p.get("imageinfo", [{}])[0]
                u = info.get("thumburl") or info.get("url")
                if u:
                    return u
    except:
        pass
    return None

def pick_wikimedia_query(title):
    t = title.lower()
    import re
    if re.search(r"glock|sig.sauer|p320|beretta|colt|smith.wesson|ruger|springfield|walther|kimber", t):
        brand = re.findall(r"glock|sig|beretta|colt|ruger|springfield|walther|kimber", t)
        return (brand[0] + " pistol handgun") if brand else "pistol handgun"
    if re.search(r"ar.?15|ar15|m16|m4\b", t): return "AR-15 semi-automatic rifle"
    if re.search(r"ak.?47|ak47", t): return "AK-47 rifle"
    if re.search(r"shotgun|gauge|mossberg", t): return "shotgun firearm"
    if re.search(r"suppressor|silencer", t): return "firearm suppressor"
    if re.search(r"9mm|ammo|ammunition", t): return "firearm ammunition"
    if re.search(r"conceal|carry.permit|holster", t): return "concealed carry holster firearm"
    if re.search(r"atf|congress|senate|court|legislature", t): return "united states capitol congress"
    if re.search(r"police|law.enforcement|officer", t): return "police law enforcement officer"
    if re.search(r"murder|shooting|crime|killed|dead|shot", t): return "crime scene police"
    return "firearm handgun second amendment"

# BAD URL patterns
BAD = ["/img/photos/", "/img/pistol.svg", "/img/rifle.svg", "/img/law.svg", "/img/shotgun.svg", "/img/suppressor.svg"]

def is_bad(url):
    if not url: return True
    return any(url.startswith(b) or url == b for b in BAD)

print("Testing Sanity connection...", flush=True)
test = sanity_query("count(*[_type == \"newsArticle\"])")
print("OK — news article count:", test, flush=True)

# Fetch articles with bad images (batch of 100)
print("Fetching articles with bad images...", flush=True)
articles = sanity_query(
    "*[_type == \"newsArticle\" && editorLocked != true] | order(publishedAt desc) [0...200] { _id, title, imageUrl, \"sourceUrl\": externalUrl }"
)
bad = [a for a in articles if is_bad(a.get("imageUrl", ""))]
print("Articles with bad images:", len(bad), flush=True)

fixed = failed = 0
for i, article in enumerate(bad[:80]):  # process up to 80
    print(f"[{i+1}/{len(bad[:80])}] {article['title'][:55]}...", flush=True)
    new_url = None
    
    # Try OG image first
    if article.get("sourceUrl"):
        new_url = try_og_image(article["sourceUrl"])
        if new_url:
            print(f"  -> OG image: {new_url[:60]}", flush=True)
    
    # Wikimedia fallback
    if not new_url:
        wm_q = pick_wikimedia_query(article["title"])
        new_url = search_wikimedia(wm_q)
        if new_url:
            print(f"  -> Wikimedia: {new_url[:60]}", flush=True)
    
    if new_url:
        try:
            sanity_mutate([{"patch": {"id": article["_id"], "set": {"imageUrl": new_url}}}])
            fixed += 1
        except Exception as e:
            print(f"  -> PATCH FAILED: {e}", flush=True)
            failed += 1
    else:
        print(f"  -> No image found", flush=True)
        failed += 1
    
    time.sleep(0.3)

print(f"\nDONE: {fixed} fixed, {failed} no image found", flush=True)
sys.exit(0 if failed < len(bad[:80]) * 0.5 else 1)
