"""
Force-fix the Desert Eagle article with correct firearm-specific search queries.
Never search bare gun model names — always append 'handgun' or 'pistol firearm'.
"""
import urllib.request, urllib.parse, json, os, re, time

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def q(query):
    url = f"{BASE}/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(f"{BASE}/mutate/production", data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def upload_to_sanity(image_url, label):
    try:
        req = urllib.request.Request(image_url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Referer": "https://downrangeco.com",
            "Accept": "image/*,*/*",
        })
        with urllib.request.urlopen(req, timeout=20) as r:
            buf = r.read()
            ct  = r.headers.get("Content-Type","image/jpeg")
        if len(buf) < 8000:
            print(f"  Too small ({len(buf)} bytes)")
            return None
        ext   = "png" if "png" in ct else "webp" if "webp" in ct else "jpg"
        fname = f"{label}-{int(time.time())}.{ext}"
        up = urllib.request.Request(
            f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fname}",
            data=buf, method="POST",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": ct}
        )
        with urllib.request.urlopen(up, timeout=30) as r:
            data = json.loads(r.read())
        url = data.get("document",{}).get("url") or data.get("url")
        if url: print(f"  CDN: {url[:80]}")
        return url
    except Exception as e:
        print(f"  Upload error: {e}")
    return None

def search_pixabay(query):
    key = os.environ.get("PIXABAY_API_KEY","")
    if not key: return None
    try:
        url = f"https://pixabay.com/api/?key={key}&q={urllib.parse.quote(query)}&image_type=photo&orientation=horizontal&min_width=800&per_page=5&safesearch=true"
        with urllib.request.urlopen(url, timeout=12) as r:
            data = json.loads(r.read())
        hits = data.get("hits",[])
        if hits:
            img = hits[0].get("largeImageURL") or hits[0].get("webformatURL")
            print(f"  Pixabay hit: {img[:80] if img else 'none'}")
            return img
    except Exception as e:
        print(f"  Pixabay error: {e}")
    return None

def search_pexels(query):
    key = os.environ.get("PEXELS_API_KEY","")
    if not key: return None
    try:
        url = f"https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&orientation=landscape&size=large&per_page=5"
        req = urllib.request.Request(url, headers={"Authorization": key})
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read())
        photos = data.get("photos",[])
        photo = next((p for p in photos if p.get("width",0) >= p.get("height",0)), photos[0] if photos else None)
        if photo:
            img = photo["src"].get("large2x") or photo["src"].get("large") or photo["src"].get("medium")
            print(f"  Pexels hit: {img[:80] if img else 'none'}")
            return img
    except Exception as e:
        print(f"  Pexels error: {e}")
    return None

# ── FETCH ARTICLE ─────────────────────────────────────────────────────────────
SLUG = "mark-xix-desert-eagle-suppressor-ready-69efb4"
doc  = q(f'*[_type=="newsArticle" && slug.current=="{SLUG}"][0]{{_id,title,imageUrl,externalUrl,category}}')

if not doc:
    print("Article not found"); exit(1)

print(f"Article : {doc.get('title','')[:70]}")
print(f"imageUrl: {doc.get('imageUrl') or 'NULL'}")

# ── SEARCH WITH FIREARM-SPECIFIC QUERIES ─────────────────────────────────────
# CRITICAL: always include 'pistol', 'handgun', or 'semi-automatic' to avoid
# returning photos of animals, places, or other things named similarly.
QUERIES = [
    "Desert Eagle 50 caliber semi-automatic pistol",
    "Magnum Research Desert Eagle handgun",
    "50 AE semi-automatic pistol suppressor threaded",
    "large caliber semi-automatic pistol 50 caliber",
    "semi-automatic pistol shooting range large caliber",
    "handgun pistol suppressor ready threaded barrel",
]

final_img = None
for query in QUERIES:
    print(f"\nQuery: '{query}'")
    img = search_pexels(query)
    if not img:
        img = search_pixabay(query)
    if img:
        cdn = upload_to_sanity(img, "desert-eagle-pistol")
        final_img = cdn or img
        break

if final_img:
    mutate([{"patch": {"id": doc["_id"], "set": {"imageUrl": final_img}}}])
    print(f"\n✓ Patched: {final_img[:80]}")
else:
    print("\n✗ No image found")
    exit(1)

print("Done.")
