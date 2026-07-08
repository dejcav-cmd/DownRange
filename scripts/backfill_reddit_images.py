#!/usr/bin/env python3
"""
Backfill Reddit deal images by searching manufacturer websites via Jina.
Brand detected from title → search manufacturer site search page → scrape first product OG image.
"""
import urllib.request, urllib.parse, json, os, base64, time, re
import html as html_mod

TOKEN  = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def sq(q):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(q)}&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def patch(doc_id, img_url):
    muts = [{"patch": {"id": doc_id, "set": {"imageUrl": img_url}}}]
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production?returnDocuments=false"
    req = urllib.request.Request(url, data=json.dumps({"mutations": muts}).encode(), method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status

def extract_product_name(title):
    clean = re.sub(r'^\[[^\]]+\]\s*', '', title)
    clean = re.sub(r'\$[\d,]+(?:\.\d{2})?', '', clean)
    clean = re.sub(r'\b(code:?\s*\w+|use code \w+|promo pack|promo code \w+)\b', '', clean, flags=re.I)
    clean = re.sub(r'\+\s*(free ship\w*|no tax\s+\w+(\s+\w+)?)\b.*', '', clean, flags=re.I)
    clean = re.sub(r'\b(no code needed|in stock|oos|fss|free shipping|in various lengths?)\b.*', '', clean, flags=re.I)
    clean = re.sub(r'\s+for\s+\$.*', '', clean, flags=re.I)
    clean = re.sub(r'\s*[-–]\s*\$.*', '', clean)
    return re.sub(r'\s+', ' ', clean).strip().rstrip(',.-')[:100]

# Brand → (search URL template, link pattern to follow)
BRAND_SEARCH = {
    r'\bspringfield|springfield armory\b': (
        'https://www.springfield-armory.com/search/?q={query}',
        r'springfield-armory\.com/[^"\'<>\s]+(?:handgun|pistol|rifle|1911|hellcat|echelon|kuna|romulus)[^"\'<>\s]*'
    ),
    r'\bsig sauer|sig p\d{3}\b': (
        'https://www.sigsauer.com/search/?q={query}',
        r'sigsauer\.com/[^"\'<>\s]+(?:p\d{3}|pistol|rifle)[^"\'<>\s]*'
    ),
    r'\bglock\b': (
        'https://us.glock.com/en/search#?q={query}',
        r'us\.glock\.com/[^"\'<>\s]+pistols?[^"\'<>\s]*'
    ),
    r'\bruger\b': (
        'https://www.ruger.com/search/index.html#q={query}',
        r'ruger\.com/products[^"\'<>\s]*'
    ),
    r'\btrijicon\b': (
        'https://www.trijicon.com/search-results/?q={query}',
        r'trijicon\.com/products[^"\'<>\s]*'
    ),
    r'\bvortex\b': (
        'https://www.vortexoptics.com/search?q={query}',
        r'vortexoptics\.com/product[^"\'<>\s]*'
    ),
    r'\bholosun\b': (
        'https://www.holosun.com/index.php?route=product/search&search={query}',
        r'holosun\.com/[^"\'<>\s]*product[^"\'<>\s]*'
    ),
    r'\bmagpul\b': (
        'https://www.magpul.com/search/?q={query}',
        r'magpul\.com/products[^"\'<>\s]*'
    ),
    r'\bsilencerco\b': (
        'https://silencerco.com/search?type=product&q={query}',
        r'silencerco\.com/products[^"\'<>\s]*'
    ),
    r'\bgeissele\b': (
        'https://www.geissele.com/search?q={query}',
        r'geissele\.com/[^"\'<>\s]*(?:trigger|rail|charging|handguard)[^"\'<>\s]*'
    ),
    r'\bstaccato\b': (
        'https://staccato2011.com/search?q={query}',
        r'staccato2011\.com/products[^"\'<>\s]*'
    ),
}

def get_brand_search(title):
    tl = title.lower()
    for pattern, (search_tpl, link_pat) in BRAND_SEARCH.items():
        if re.search(pattern, tl, re.I):
            return search_tpl, link_pat
    return None, None

def jina_fetch(url):
    """Fetch a page via Jina proxy."""
    jina_url = f"https://r.jina.ai/{url}"
    try:
        req = urllib.request.Request(jina_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return None

def extract_og_image(html_content, base_url=None):
    """Extract og:image or first large product image from HTML."""
    patterns = [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    for pat in patterns:
        m = re.search(pat, html_content, re.I)
        if m:
            url = html_mod.unescape(m.group(1)).strip()
            if url.startswith('//'): url = 'https:' + url
            if url.startswith('/') and base_url:
                from urllib.parse import urlparse
                p = urlparse(base_url)
                url = f"{p.scheme}://{p.netloc}{url}"
            if re.search(r'\.(jpg|jpeg|png|webp)', url, re.I) and 'logo' not in url.lower():
                return url
    return None

def validate_and_download(img_url):
    if any(d in img_url for d in ['shutterstock','getty','istock','alamy','dreamstime']): return None
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = r.read()
    except: return None
    if len(data) < 10000: return None
    b = bytearray(data); w, h = 0, 0
    try:
        if b[0]==0x89 and b[1]==0x50:
            w=(b[16]<<24)|(b[17]<<16)|(b[18]<<8)|b[19]; h=(b[20]<<24)|(b[21]<<16)|(b[22]<<8)|b[23]
        elif b[0]==0xFF and b[1]==0xD8:
            i=2
            while i<len(b)-9:
                if b[i]!=0xFF: i+=1; continue
                mk=b[i+1]
                if mk in (0xC0,0xC1,0xC2): h=(b[i+5]<<8)|b[i+6]; w=(b[i+7]<<8)|b[i+8]; break
                seg=(b[i+2]<<8)|b[i+3]; i+=2+seg
    except: pass
    if w>0 and h>0 and (w<200 or h<150 or w/h>4 or h/w>4): return None
    return data

def upload_to_sanity(img_data, doc_id):
    fname = f"reddit-{doc_id[-8:]}.jpg"
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fname}"
    req = urllib.request.Request(url, data=img_data, method="POST", headers={
        "Authorization": f"Bearer {TOKEN}", "Content-Type": "image/jpeg",
        "Content-Disposition": f"attachment; filename={fname}"})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read()).get("url")
    except: return None

def save(content):
    encoded = base64.b64encode(content.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": "fix: reddit image backfill [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

def find_product_image(title):
    """Full pipeline: brand detect → manufacturer search → OG image."""
    product = extract_product_name(title)
    search_tpl, link_pat = get_brand_search(title)
    
    if search_tpl:
        search_url = search_tpl.format(query=urllib.parse.quote(product))
        print(f"    Searching: {search_url[:70]}")
        page = jina_fetch(search_url)
        if page:
            # Find first product link
            links = re.findall(r'https?://[^\s"\'<>]+', page)
            if link_pat:
                prod_links = [l for l in links if re.search(link_pat, l, re.I)][:3]
            else:
                prod_links = links[:5]
            
            for prod_url in prod_links:
                print(f"    Product page: {prod_url[:70]}")
                prod_page = jina_fetch(prod_url)
                if prod_page:
                    og = extract_og_image(prod_page, prod_url)
                    if og:
                        print(f"    OG image: {og[:70]}")
                        return validate_and_download(og)
    
    # Fallback: try direct URL construction for known models
    # e.g. "Springfield Kuna 9mm" → search springfield-armory.com
    return None

# ── TEST ──────────────────────────────────────────────────────────────────────
print("=== TEST: Springfield Kuna 9mm ===")
test_result = find_product_image("Springfield Kuna 9mm $999")
print(f"Result: {'✓ image found' if test_result else '✗ no image'} ({len(test_result) if test_result else 0} bytes)")

print("\n=== TEST: Romulus 3.5 Comp ===")
test_result2 = find_product_image("Romulus 3.5 Comp promo pack, code: ROMMY for $1480")
print(f"Result: {'✓ image found' if test_result2 else '✗ no image'} ({len(test_result2) if test_result2 else 0} bytes)")

# ── BACKFILL ─────────────────────────────────────────────────────────────────
deals = sq('*[_type=="gunDeal" && approved==true && (source=="reddit" || source=="r/gundeals") && (!defined(imageUrl) || imageUrl=="" || imageUrl==null)] | order(publishedAt desc)[0...100]{_id, title}')
total = len(deals or [])
print(f"\nReddit deals to fix: {total}")

fixed = 0; not_found = 0
t0 = time.time()

for d in (deals or []):
    if time.time() - t0 > 3000: break
    product = extract_product_name(d['title'])
    print(f"\n  {product[:60]}")
    img_data = find_product_image(d['title'])
    if img_data:
        cdn = upload_to_sanity(img_data, d['_id'])
        if cdn:
            status = patch(d['_id'], cdn)
            if status == 200:
                fixed += 1
                print(f"  ✓ patched")
    else:
        not_found += 1
    time.sleep(0.5)

msg = f"Reddit image backfill: {fixed} fixed, {not_found} no image, {total} total\n"
print(f"\n{msg}")
save(msg)
