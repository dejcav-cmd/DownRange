#!/usr/bin/env python3
"""
Patch Reddit deals with known working product page URLs.
SA Kuna confirmed working: /1911-pistols/kuna-9mm/
"""
import urllib.request, urllib.parse, json, os, base64, re, time
import html as html_mod

TOKEN  = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def sq(q):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(q)}&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def patch_doc(doc_id, img_url):
    muts = [{"patch": {"id": doc_id, "set": {"imageUrl": img_url}}}]
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production?returnDocuments=false"
    req = urllib.request.Request(url, data=json.dumps({"mutations": muts}).encode(), method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status

def jfetch(url):
    req = urllib.request.Request(f"https://r.jina.ai/{url}",
        headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html", "X-Return-Format": "html"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8", errors="replace")
    except:
        return ""

def get_og_image(content, base_url):
    for pat in [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
    ]:
        m = re.search(pat, content, re.I)
        if m:
            u = html_mod.unescape(m.group(1)).strip()
            if u.startswith('//'): u = 'https:' + u
            if u.startswith('/'):
                p = urllib.parse.urlparse(base_url)
                u = f"{p.scheme}://{p.netloc}{u}"
            if re.search(r'\.(jpg|jpeg|png|webp)', u, re.I):
                return u
    return None

def download_img(url):
    try:
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Referer": "https://www.springfield-armory.com/",
            "Accept": "image/webp,image/apng,image/*,*/*;q=0.8",
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        print(f"    download: {len(data)} bytes from {url[:60]}")
        return data if len(data) > 8000 else None
    except Exception as e:
        print(f"    download error: {e} for {url[:60]}")
        return None

def upload_sanity(data, doc_id, img_url=""):
    # Detect content type from magic bytes or URL
    b = bytearray(data[:4])
    if b[0]==0x89 and b[1]==0x50:
        ct, ext = "image/png", "png"
    elif b[0]==0xFF and b[1]==0xD8:
        ct, ext = "image/jpeg", "jpg"
    elif b[0]==0x52 and b[1]==0x49:  # RIFF (webp)
        ct, ext = "image/webp", "webp"
    elif img_url.lower().endswith(".png"):
        ct, ext = "image/png", "png"
    else:
        ct, ext = "image/jpeg", "jpg"
    fname = f"reddit-{doc_id[-8:]}.{ext}"
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fname}"
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Authorization": f"Bearer {TOKEN}", "Content-Type": ct,
        "Content-Disposition": f"attachment; filename={fname}"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            result = json.loads(r.read())
            print(f"    CDN upload OK: {result.get('url','')[:60]}")
            return result.get("url")
    except Exception as e:
        print(f"    CDN upload error: {e}")
        return None

def save(msg):
    encoded = base64.b64encode(msg.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": "fix: known deal patches [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

# Known working product page URLs (confirmed by Jina debug)
KNOWN_PAGES = {
    r'springfield kuna':       'https://www.springfield-armory.com/1911-pistols/kuna-9mm/',
    r'springfield romulus':    'https://www.springfield-armory.com/1911-pistols/romulus/',
    r'springfield prodigy':    'https://www.springfield-armory.com/1911-pistols/prodigy/',
    r'springfield echelon':    'https://www.springfield-armory.com/xd-m-pistols/echelon/',
    r'springfield hellcat':    'https://www.springfield-armory.com/hellcat-pistols/',
    r'springfield saint':      'https://www.springfield-armory.com/saint-rifles/',
    r'glock 19':               'https://us.glock.com/products/pistols/g19-gen5',
    r'glock 17':               'https://us.glock.com/products/pistols/g17-gen5',
    r'glock 22':               'https://us.glock.com/products/pistols/g22',
    r'glock 43':               'https://us.glock.com/products/pistols/g43',
    r'glock 26':               'https://us.glock.com/products/pistols/g26',
    r'glock 20':               'https://us.glock.com/products/pistols/g20',
    r'ruger mini-14':          'https://www.ruger.com/products/mini14RanchRifle/models.html',
    r'ruger 10.?22':           'https://www.ruger.com/products/1022Carbine/models.html',
    r'ruger lcr':              'https://www.ruger.com/products/lcr/models.html',
    r'ruger lcp':              'https://www.ruger.com/products/lcp/models.html',
    r'sig sauer p320':         'https://www.sigsauer.com/p320.html',
    r'sig sauer p365':         'https://www.sigsauer.com/p365.html',
    r'sig mcx spear':          'https://www.sigsauer.com/mcx-spear.html',
    r'vortex defender.st':     'https://www.vortexoptics.com/product/vortex-defender-st-reflex-sight',
    r'vortex strike eagle':    'https://www.vortexoptics.com/category/riflescopes/strike-eagle',
    r'silencerco scythe':      'https://silencerco.com/products/scythe-ti/',
    r'silencerco spectre':     'https://silencerco.com/products/spectre-9/',
    r'trijicon rmr':           'https://www.trijicon.com/products/category/rmr',
    r'trijicon acog':          'https://www.trijicon.com/products/category/acog',
    r'geissele super duty':    'https://www.geissele.com/super-duty-lower-build-kit.html',
    r'geissele ssa':           'https://www.geissele.com/geissele-ssa-trigger.html',
}

def find_product_page(title):
    tl = title.lower()
    for pattern, url in KNOWN_PAGES.items():
        if re.search(pattern, tl, re.I):
            return url
    return None

# Get all Reddit deals without images
deals = sq('*[_type=="gunDeal" && approved==true && (source=="reddit"||source=="r/gundeals") && (!defined(imageUrl)||imageUrl==""||imageUrl==null)] | order(publishedAt desc)[0...100]{_id,title}')
total = len(deals or [])
print(f"Reddit deals without images: {total}")

results = []
fixed = 0

for d in (deals or []):
    page_url = find_product_page(d['title'])
    if not page_url:
        continue

    print(f"\n  {d['title'][:60]}")
    print(f"  → {page_url}")

    content = jfetch(page_url)
    if not content:
        print(f"  ✗ Jina fetch failed")
        results.append(f"✗ {d['title'][:40]}: jina failed")
        continue

    og = get_og_image(content, page_url)
    if not og:
        print(f"  ✗ no OG image in page ({len(content)} chars)")
        results.append(f"✗ {d['title'][:40]}: no OG image")
        continue

    print(f"  OG: {og[:80]}")
    img_data = download_img(og)
    if not img_data:
        print(f"  ✗ image download failed")
        results.append(f"✗ {d['title'][:40]}: download failed")
        continue

    cdn = upload_sanity(img_data, d['_id'], og)
    if not cdn:
        results.append(f"✗ {d['title'][:40]}: CDN upload failed")
        continue

    status = patch_doc(d['_id'], cdn)
    if status == 200:
        fixed += 1
        print(f"  ✓ PATCHED")
        results.append(f"✓ {d['title'][:40]}")
    else:
        results.append(f"✗ {d['title'][:40]}: patch HTTP {status}")

    time.sleep(0.5)

msg = f"Patched {fixed} deals with known product page URLs:\n" + "\n".join(results) + "\n"
print(f"\n{msg}")
save(msg)
