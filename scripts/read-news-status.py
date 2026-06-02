#!/usr/bin/env python3
import json, urllib.request, urllib.parse, os, base64, time, re

SANITY_TOKEN = os.environ.get("SANITY_TOKEN","")
PIXABAY_KEY  = os.environ.get("PIXABAY_API_KEY","")
PEXELS_KEY   = os.environ.get("PEXELS_API_KEY","")
GH_PAT       = os.environ.get("GH_PAT","")
PROJECT      = "vbnsqnkg"
BASE         = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/data"
S_HDRS       = {"Authorization": "Bearer " + SANITY_TOKEN, "Content-Type": "application/json"}
GH_HDRS      = {"Authorization": "token " + GH_PAT, "User-Agent": "curl",
                "Accept": "application/vnd.github+json", "Content-Type": "application/json"}

def sq(groq):
    url = BASE + "/query/production?query=" + urllib.parse.quote(groq)
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + SANITY_TOKEN})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    url  = BASE + "/mutate/production"
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(url, data=body, headers=S_HDRS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def upload_to_sanity(image_url, filename):
    try:
        req = urllib.request.Request(image_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Accept": "image/*,*/*",
            "Referer": image_url,
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            data = r.read()
            ct   = r.headers.get("content-type","image/jpeg")
        if len(data) < 5000 or "image" not in ct:
            return None
        upload_url = "https://" + PROJECT + ".api.sanity.io/v2024-01-01/assets/images/production"
        upload_req = urllib.request.Request(upload_url, data=data, headers={
            "Authorization": "Bearer " + SANITY_TOKEN,
            "Content-Type": ct,
            "Content-Disposition": 'attachment; filename="' + filename + '"',
        }, method="POST")
        with urllib.request.urlopen(upload_req, timeout=30) as r:
            asset = json.loads(r.read())
            return asset.get("document",{}).get("url","")
    except Exception as e:
        print("    Upload error: " + str(e))
        return None

def search_pexels(query):
    if not PEXELS_KEY:
        return None
    try:
        url = "https://api.pexels.com/v1/search?" + urllib.parse.urlencode({
            "query": query, "per_page": 5, "orientation": "landscape"
        })
        req = urllib.request.Request(url, headers={"Authorization": PEXELS_KEY, "User-Agent":"curl"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        photos = data.get("photos",[])
        if photos:
            return photos[0].get("src",{}).get("large2x") or photos[0].get("src",{}).get("large")
    except Exception as e:
        print("    Pexels error: " + str(e))
    return None

def search_pixabay(query):
    if not PIXABAY_KEY:
        return None
    try:
        params = urllib.parse.urlencode({
            "key": PIXABAY_KEY,
            "q": query,
            "image_type": "photo",
            "orientation": "horizontal",
            "min_width": 800,
            "per_page": 5,
            "safesearch": "true",
        })
        req = urllib.request.Request("https://pixabay.com/api/?" + params, headers={"User-Agent":"curl"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        hits = data.get("hits",[])
        if hits:
            return hits[0].get("largeImageURL") or hits[0].get("webformatURL")
    except Exception as e:
        print("    Pixabay error: " + str(e))
    return None

def fetch_og_image(source_url):
    if not source_url:
        return None
    try:
        req = urllib.request.Request(source_url, headers={"User-Agent":"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"})
        with urllib.request.urlopen(req, timeout=8) as r:
            html = r.read(200000).decode("utf-8","replace")
        for pat in [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        ]:
            m = re.search(pat, html, re.I)
            if m:
                img = m.group(1).strip()
                if img.startswith("//"):
                    img = "https:" + img
                if img.startswith("/"):
                    p = urllib.parse.urlparse(source_url)
                    img = p.scheme + "://" + p.netloc + img
                if any(img.lower().endswith(x) for x in [".jpg",".jpeg",".png",".webp"]) and len(img) > 20:
                    return img
    except:
        pass
    return None

# Per-model search config: OG page, Pexels/Pixabay query, category fallback
SEARCH_MAP = {
    "staccato": {
        "og": "https://staccato2011.com/collections/hd-c4x",
        "q1": "Staccato 2011 pistol handgun competition",
        "q2": "2011 pistol handgun tactical carry"
    },
    "fn-309": {
        "og": "https://fnamerica.com/products/pistols/fn-309-mrd/",
        "q1": "FN pistol handgun compact carry",
        "q2": "compact pistol handgun 9mm"
    },
    "tx9": {
        "og": "https://www.taurususa.com/product/tx9/",
        "q1": "Taurus pistol handgun modular",
        "q2": "modular pistol handgun striker fired"
    },
    "competitor": {
        "og": "https://www.smith-wesson.com/product/m-p-9-m2-0-competitor-hd",
        "q1": "Smith Wesson pistol competition shooting",
        "q2": "competition pistol stainless frame shooting"
    },
    "686": {
        "og": "https://www.smith-wesson.com/product/model-686-plus-spec-series-r",
        "q1": "revolver 357 magnum stainless steel",
        "q2": "Smith Wesson revolver handgun classic"
    },
    "cc9": {
        "og": "https://www.heckler-koch.com",
        "q1": "HK pistol compact concealed carry handgun",
        "q2": "compact pistol concealed carry 9mm"
    },
    "rpc": {
        "og": "https://www.taurususa.com",
        "q1": "PDW pistol carbine compact rifle",
        "q2": "pistol carbine folding compact tactical"
    },
    "harrier": {
        "og": "https://www.ruger.com/products/harrier/",
        "q1": "AR-15 rifle black tactical shooting range",
        "q2": "modern sporting rifle AR15 black"
    },
    "scar": {
        "og": "https://fnamerica.com/products/rifles/fn-scar/",
        "q1": "FN SCAR rifle tactical military shooting",
        "q2": "tactical rifle combat shooting military"
    },
    "sdx": {
        "og": "https://maximdefense.com",
        "q1": "suppressed rifle integrally suppressed short barrel",
        "q2": "SBR suppressed AR pistol compact"
    },
    "spectre": {
        "og": "https://silencerco.com",
        "q1": "gun suppressor silencer titanium firearm",
        "q2": "firearm suppressor pistol silencer"
    },
    "990-spx": {
        "og": "https://www.mossberg.com/product-category/shotguns/990-series/",
        "q1": "Mossberg shotgun tactical 12 gauge semi-auto",
        "q2": "tactical shotgun pistol grip semi-automatic"
    },
    "590rm": {
        "og": "https://www.mossberg.com",
        "q1": "Mossberg 590 pump shotgun 12 gauge tactical",
        "q2": "pump action shotgun folding tactical"
    },
    "red-label": {
        "og": "https://ruger.com/products/redLabel/",
        "q1": "over under shotgun double barrel hunting walnut",
        "q2": "over under shotgun sporting clays elegant"
    },
}

CAT_FALLBACKS = {
    "pistol":    ["pistol handgun shooting range firearm", "handgun semi-automatic 9mm"],
    "rifle":     ["AR-15 rifle tactical black shooting", "modern sporting rifle range"],
    "shotgun":   ["shotgun 12 gauge tactical range", "pump shotgun defense firearm"],
    "suppressor":["gun suppressor firearm silencer", "suppressed pistol shooting"],
    "revolver":  ["revolver handgun 357 magnum stainless", "wheel gun revolver firearm"],
}

def get_search_info(title, slug, cat):
    title_l = title.lower()
    slug_l  = (slug or "").lower()
    for key, info in SEARCH_MAP.items():
        if key in title_l or key in slug_l:
            return info
    return {}

# Fetch releases without CDN images
releases = sq('*[_type=="firearmRelease" && approved==true] | order(publishedAt desc) [0...30] {_id, title, slug, category, imageUrl, brand, model}')
print("Found " + str(len(releases)) + " releases")

mutations = []
results   = []

for rel in releases:
    title   = rel.get("title","")
    slug    = rel.get("slug",{}).get("current","")
    cat     = rel.get("category","pistol")
    cur_img = rel.get("imageUrl","")
    brand   = rel.get("brand","")
    model   = rel.get("model","")

    if cur_img and "cdn.sanity.io" in cur_img:
        print("SKIP (CDN): " + title[:50])
        continue

    print("Processing: " + title[:55])
    info = get_search_info(title, slug, cat)

    img_url = None

    # 1. OG image from manufacturer page
    if info.get("og") and not img_url:
        img_url = fetch_og_image(info["og"])
        if img_url:
            print("  OG: " + img_url[:60])

    # 2. Pexels with specific query
    if not img_url and info.get("q1"):
        img_url = search_pexels(info["q1"])
        if img_url:
            print("  Pexels q1: " + img_url[:60])

    # 3. Pixabay with specific query
    if not img_url and info.get("q1"):
        img_url = search_pixabay(info["q1"])
        if img_url:
            print("  Pixabay q1: " + img_url[:60])

    # 4. Alternative query
    if not img_url and info.get("q2"):
        img_url = search_pexels(info["q2"]) or search_pixabay(info["q2"])
        if img_url:
            print("  q2 fallback: " + img_url[:60])

    # 5. Category fallback
    if not img_url:
        for q in CAT_FALLBACKS.get(cat, CAT_FALLBACKS["pistol"]):
            img_url = search_pexels(q) or search_pixabay(q)
            if img_url:
                print("  cat fallback: " + img_url[:60])
                break

    if img_url:
        safe  = (slug or title)[:35].replace(" ","-").replace("/","-")
        cdn   = upload_to_sanity(img_url, "release-" + safe + ".jpg")
        final = cdn if cdn else img_url
        mutations.append({"patch": {"id": rel["_id"], "set": {"imageUrl": final}}})
        results.append("OK: " + title[:45] + " -> " + final[:50])
        print("  Saved: " + final[:60])
    else:
        results.append("FAIL: " + title[:45])
        print("  No image found")

    time.sleep(0.8)

if mutations:
    mutate(mutations)

output = "Updated " + str(len(mutations)) + "/" + str(len(releases)) + " releases\n" + "\n".join(results)
print(output)

req  = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/main", headers=GH_HDRS)
with urllib.request.urlopen(req) as r:
    main_sha = json.loads(r.read())["object"]["sha"]
try:
    urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs",
        data=json.dumps({"ref":"refs/heads/status-output","sha":main_sha}).encode(), headers=GH_HDRS, method="POST"), timeout=10)
except:
    urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/git/refs/heads/status-output",
        data=json.dumps({"sha":main_sha,"force":True}).encode(), headers=GH_HDRS, method="PATCH"), timeout=10)
file_sha = None
try:
    r2 = urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt?ref=status-output", headers=GH_HDRS)
    with urllib.request.urlopen(r2) as r: file_sha = json.loads(r.read())["sha"]
except: pass
payload = {"message":"chore: image results","content":base64.b64encode(output.encode()).decode(),"branch":"status-output","author":{"name":"DJ Cavalcanti","email":"dj@downrangeco.com"}}
if file_sha: payload["sha"] = file_sha
urllib.request.urlopen(urllib.request.Request("https://api.github.com/repos/dejcav-cmd/DownRange/contents/STATUS.txt",
    data=json.dumps(payload).encode(), headers=GH_HDRS, method="PUT"), timeout=10)
print("STATUS WRITTEN")
