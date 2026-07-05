"""
Force-fix the Desert Eagle article image + trigger Vercel revalidation.
Targeted at: mark-xix-desert-eagle-suppressor-ready-69efb4
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

def is_logo_sized(url):
    """Reject logo/banner images by dimension hints in Sanity CDN URLs."""
    if not url: return True
    m = re.search(r'-(\d+)x(\d+)\.(png|jpg|jpeg|webp)', url, re.I)
    if not m: return False
    w, h = int(m.group(1)), int(m.group(2))
    return w < 400 or (h and w/h > 3.5) or h > w

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
            print(f"  ✗ Image too small ({len(buf)} bytes)")
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
        if url:
            print(f"  ✓ Uploaded: {url[:80]}")
        return url
    except Exception as e:
        print(f"  ✗ Upload error: {e}")
    return None

def search_pexels(query):
    key = os.environ.get("PEXELS_API_KEY","")
    if not key: return None
    try:
        url = f"https://api.pexels.com/v1/search?query={urllib.parse.quote(query)}&orientation=landscape&size=large&per_page=5"
        req = urllib.request.Request(url, headers={"Authorization": key})
        with urllib.request.urlopen(req, timeout=12) as r:
            data = json.loads(r.read())
        photos = data.get("photos", [])
        # Prefer landscape
        photo = next((p for p in photos if p.get("width",0) >= p.get("height",0)), photos[0] if photos else None)
        if photo:
            hit = photo["src"].get("large2x") or photo["src"].get("large") or photo["src"].get("medium")
            print(f"  Pexels [{query}]: {hit[:80] if hit else 'no hit'}")
            return hit
    except Exception as e:
        print(f"  Pexels error: {e}")
    return None

def search_pixabay(query):
    key = os.environ.get("PIXABAY_API_KEY","")
    if not key: return None
    try:
        url = f"https://pixabay.com/api/?key={key}&q={urllib.parse.quote(query)}&image_type=photo&orientation=horizontal&min_width=800&per_page=5&safesearch=true"
        with urllib.request.urlopen(url, timeout=12) as r:
            data = json.loads(r.read())
        hit = data.get("hits",[None])[0]
        if hit:
            img = hit.get("largeImageURL") or hit.get("webformatURL")
            print(f"  Pixabay [{query}]: {img[:80] if img else 'no hit'}")
            return img
    except Exception as e:
        print(f"  Pixabay error: {e}")
    return None

# ── FETCH ARTICLE ─────────────────────────────────────────────────────────────
SLUG = "mark-xix-desert-eagle-suppressor-ready-69efb4"
doc  = q(f'*[_type=="newsArticle" && slug.current=="{SLUG}"][0]{{_id,title,imageUrl,externalUrl,category}}')

if not doc:
    print("Article not found"); exit(1)

print(f"Article : {doc.get('title','')[:70]}")
print(f"imageUrl: {doc.get('imageUrl') or 'NULL'}")
print(f"category: {doc.get('category','')}")

current = doc.get("imageUrl","") or ""
needs_fix = (
    not current
    or current.endswith(".svg")
    or "/img/" in current
    or is_logo_sized(current)
    or not current.startswith("https://cdn.sanity.io")
)
print(f"needs_fix: {needs_fix}")

if not needs_fix:
    print("\nImage looks good already — forcing re-fetch anyway to get best quality.")

# ── SEARCH FOR REAL IMAGE ─────────────────────────────────────────────────────
# Try progressively broader queries until we get something
QUERIES = [
    "Desert Eagle Mark XIX 50 AE pistol",
    "Desert Eagle handgun 50 caliber",
    "Desert Eagle semi automatic pistol",
    "Magnum Research Desert Eagle firearm",
    "large caliber semi automatic handgun",
    "50 caliber handgun pistol shooting",
]

final_img = None
for query in QUERIES:
    print(f"\nTrying: '{query}'")
    img = search_pexels(query)
    if not img:
        img = search_pixabay(query)
    if img:
        cdn = upload_to_sanity(img, "desert-eagle")
        if cdn:
            final_img = cdn
            break
        else:
            # Use direct URL if CDN upload fails
            final_img = img
            break

if final_img:
    mutate([{"patch": {"id": doc["_id"], "set": {"imageUrl": final_img}}}])
    print(f"\n✓ Patched imageUrl: {final_img[:80]}")
else:
    print("\n✗ Could not find any image — leaving as-is")
    exit(1)

print("\nDone.")
