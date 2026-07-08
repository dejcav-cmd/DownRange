#!/usr/bin/env python3
"""
Directly patch the Springfield Kuna deal by fetching its image from
Springfield Armory's website via Jina.
"""
import urllib.request, urllib.parse, json, os, base64, re
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
        headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return ""

def get_og_image(page_content, base_url):
    for pat in [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
    ]:
        m = re.search(pat, page_content, re.I)
        if m:
            u = html_mod.unescape(m.group(1)).strip()
            if u.startswith('//'): u = 'https:' + u
            if u.startswith('/'):
                from urllib.parse import urlparse
                p = urlparse(base_url)
                u = f"{p.scheme}://{p.netloc}{u}"
            if re.search(r'\.(jpg|jpeg|png|webp)', u, re.I):
                return u
    return None

def download_image(img_url):
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=10) as r:
            return r.read()
    except:
        return None

def upload_to_sanity(data, name):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={name}"
    req = urllib.request.Request(url, data=data, method="POST", headers={
        "Authorization": f"Bearer {TOKEN}", "Content-Type": "image/jpeg",
        "Content-Disposition": f"attachment; filename={name}"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read()).get("url")
    except:
        return None

def save(msg):
    encoded = base64.b64encode(msg.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": "fix: kuna direct patch [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

results = []

# Direct product pages to try for each deal
DIRECT_PAGES = [
    # (search query, [product page URLs to try directly])
    ("Springfield Kuna", [
        "https://www.springfield-armory.com/kuna/",
        "https://www.springfield-armory.com/1911-pistols/kuna-9mm/",
        "https://www.springfield-armory.com/products/kuna/",
    ]),
    ("Glock 19 Gen 5", [
        "https://us.glock.com/products/pistols/g19-gen5",
        "https://us.glock.com/products/pistols/g19",
    ]),
    ("Glock 22 Gen4", [
        "https://us.glock.com/products/pistols/g22-gen4",
        "https://us.glock.com/products/pistols/g22",
    ]),
    ("Glock 17 Gen 6", [
        "https://us.glock.com/products/pistols/g17-gen5",
        "https://us.glock.com/products/pistols/g17",
    ]),
    ("SilencerCo Scythe-Ti", [
        "https://silencerco.com/products/scythe-ti/",
        "https://silencerco.com/products/scythe/",
    ]),
    ("Vortex Defender-ST", [
        "https://www.vortexoptics.com/product/vortex-defender-st-reflex-sight",
        "https://www.vortexoptics.com/category/red-dot-sights",
    ]),
    ("Ruger Mini-14", [
        "https://www.ruger.com/products/mini14RanchRifle/models.html",
        "https://www.ruger.com/products/mini14/models.html",
    ]),
    ("SilencerCo Spectre 9", [
        "https://silencerco.com/products/spectre-9/",
        "https://silencerco.com/products/spectre/",
    ]),
    ("SIG MCX SPEAR", [
        "https://www.sigsauer.com/mcx-spear",
        "https://www.sigsauer.com/firearms/rifles/mcx-spear.html",
    ]),
    ("Vortex Strike Eagle 1-8x24", [
        "https://www.vortexoptics.com/product/vortex-strike-eagle-1-8x24-second-focal-plane-riflescope",
        "https://www.vortexoptics.com/category/riflescopes/strike-eagle",
    ]),
]

for label, pages in DIRECT_PAGES:
    print(f"\n{label}:")
    # Find the matching deal in Sanity
    deals = sq(f'*[_type=="gunDeal" && approved==true && (source=="reddit"||source=="r/gundeals") && title match "*{label.split()[0]}*{label.split()[-1]}*" && (!defined(imageUrl)||imageUrl==""||imageUrl==null)] | order(publishedAt desc)[0...3]{{_id,title}}')
    if not deals:
        # Try broader search
        deals = sq(f'*[_type=="gunDeal" && approved==true && (source=="reddit"||source=="r/gundeals") && lower(title) match "*{label.lower().split()[0]}*" && (!defined(imageUrl)||imageUrl==""||imageUrl==null)] | order(publishedAt desc)[0...3]{{_id,title}}')
    if not deals:
        print(f"  No matching deal found")
        continue
    deal = deals[0]
    print(f"  Deal: {deal['title'][:60]}")

    found_img = None
    for page_url in pages:
        print(f"  Trying: {page_url}")
        content = jfetch(page_url)
        og = get_og_image(content, page_url) if content else None
        if og:
            print(f"  OG: {og[:80]}")
            img_data = download_image(og)
            if img_data and len(img_data) > 8000:
                fname = f"reddit-{deal['_id'][-8:]}.jpg"
                cdn = upload_to_sanity(img_data, fname)
                if cdn:
                    status = patch_doc(deal['_id'], cdn)
                    if status == 200:
                        print(f"  ✓ PATCHED → {cdn[-40:]}")
                        results.append(f"✓ {label}: patched")
                        found_img = cdn
                        break
    if not found_img:
        results.append(f"✗ {label}: no image found")
        print(f"  ✗ no valid image")

msg = "Direct patch results:\n" + "\n".join(results) + "\n"
print(f"\n{msg}")
save(msg)
