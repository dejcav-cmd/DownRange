#!/usr/bin/env python3
"""
Backfill Reddit deal images via manufacturer websites through Jina.
Jina returns Markdown-formatted content — links look like [text](url) or url).
"""
import urllib.request, urllib.parse, json, os, base64, time, re
import html as html_mod

TOKEN  = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"
_log = []

def log(msg): print(msg); _log.append(str(msg))

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

# Brand → (search URL, product URL pattern to follow)
BRANDS = {
    r'\bglock\b': (
        lambda p: f"https://us.glock.com/en/search#?q={urllib.parse.quote(p)}",
        r'us\.glock\.com/products/[^\s)\]"\'<>]+'
    ),
    r'\bruger\b': (
        lambda p: f"https://www.ruger.com/search/index.html#q={urllib.parse.quote(p)}",
        r'ruger\.com/products/[^\s)\]"\'<>]+'
    ),
    r'\bsig sauer|sig p\d{3}|mcx\b': (
        lambda p: f"https://www.sigsauer.com/search/?q={urllib.parse.quote(p)}",
        r'sigsauer\.com/firearms/[^\s)\]"\'<>]+'
    ),
    r'\bsilencerco\b': (
        lambda p: f"https://silencerco.com/search?type=product&q={urllib.parse.quote(p)}",
        r'silencerco\.com/products/[^\s)\]"\'<>]+'
    ),
    r'\bvortex\b': (
        lambda p: f"https://www.vortexoptics.com/search?q={urllib.parse.quote(p)}",
        r'vortexoptics\.com/product/[^\s)\]"\'<>]+'
    ),
    r'\btrijicon\b': (
        lambda p: f"https://www.trijicon.com/search-results/?q={urllib.parse.quote(p)}",
        r'trijicon\.com/products/[^\s)\]"\'<>]+'
    ),
    r'\bholosun\b': (
        lambda p: f"https://www.holosun.com/index.php?route=product/search&search={urllib.parse.quote(p)}",
        r'holosun\.com/index\.php\?route=product/product[^\s)\]"\'<>]+'
    ),
    r'\bgeissele\b': (
        lambda p: f"https://www.geissele.com/search?q={urllib.parse.quote(p)}",
        r'geissele\.com/[^\s)\]"\'<>]+(?:trigger|rail|charging|handguard|upper)[^\s)\]"\'<>]*'
    ),
    r'\bstaccato|romulus|kuna\b': (
        lambda p: f"https://staccato2011.com/search?q={urllib.parse.quote(p)}",
        r'staccato2011\.com/products/[^\s)\]"\'<>]+'
    ),
    r'\bspringfield\b': (
        lambda p: f"https://www.springfield-armory.com/search/?q={urllib.parse.quote(p.replace('Springfield','').strip())}",
        r'springfield-armory\.com/(?!search)[^\s)\]"\'<>]+(?:pistol|rifle|1911|echelon|hellcat|kuna|romulus|prodigy)[^\s)\]"\'<>]*'
    ),
}

def get_brand_urls(title):
    tl = title.lower()
    for pattern, (search_fn, link_pat) in BRANDS.items():
        if re.search(pattern, tl, re.I):
            return search_fn, link_pat
    return None, None

def jina_fetch(url):
    jina_url = f"https://r.jina.ai/{url}"
    req = urllib.request.Request(jina_url, headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return None

def extract_links(content, pattern):
    """Extract URLs from Jina Markdown output, stripping ]) suffixes."""
    raw = re.findall(r'https?://[^\s"\'<>){]+', content, re.I)
    cleaned = []
    for u in raw:
        u = re.sub(r'[\)\]\s]+$', '', u)  # strip trailing ) ] from Markdown
        u = html_mod.unescape(u)
        if re.search(pattern, u, re.I):
            cleaned.append(u)
    return list(dict.fromkeys(cleaned))[:5]  # dedupe, max 5

def extract_og_image(content, base_url):
    patterns = [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    for pat in patterns:
        m = re.search(pat, content, re.I)
        if m:
            url = html_mod.unescape(m.group(1)).strip()
            if url.startswith('//'): url = 'https:' + url
            if url.startswith('/'):
                p = urllib.parse.urlparse(base_url)
                url = f"{p.scheme}://{p.netloc}{url}"
            if re.search(r'\.(jpg|jpeg|png|webp)', url, re.I) and 'logo' not in url.lower():
                return url
    # Also look for large image URLs in the Jina markdown output
    imgs = re.findall(r'https?://[^\s"\'<>)\]]+\.(?:jpg|jpeg|png|webp)[^\s"\'<>)\]]*', content, re.I)
    for img in imgs:
        img = re.sub(r'[\)\]\s]+$', '', img)
        if any(x in img.lower() for x in ['logo','icon','favicon','sprite','thumbnail']): continue
        return img
    return None

def validate_download(img_url):
    if any(d in img_url for d in ['shutterstock','getty','istock','alamy','dreamstime']): return None
    try:
        req = urllib.request.Request(img_url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = r.read()
    except: return None
    if len(data) < 8000: return None
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

def save():
    content = "\n".join(_log) + "\n"
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

def find_image(title):
    product = extract_product_name(title)
    search_fn, link_pat = get_brand_urls(title)
    if not search_fn:
        return None

    search_url = search_fn(product)
    log(f"    Search: {search_url[:70]}")
    page = jina_fetch(search_url)
    if not page:
        return None

    prod_links = extract_links(page, link_pat)
    log(f"    Found {len(prod_links)} product links")

    for prod_url in prod_links:
        log(f"    → {prod_url[:70]}")
        prod_page = jina_fetch(prod_url)
        if not prod_page:
            continue
        og = extract_og_image(prod_page, prod_url)
        if og:
            log(f"    OG: {og[:70]}")
            return validate_download(og)
    return None

# ── Main ──────────────────────────────────────────────────────────────────────
deals = sq('*[_type=="gunDeal" && approved==true && (source=="reddit" || source=="r/gundeals") && (!defined(imageUrl) || imageUrl=="" || imageUrl==null)] | order(publishedAt desc)[0...80]{_id, title}')
total = len(deals or [])
log(f"Reddit deals missing images: {total}")

fixed = 0; not_found = 0; no_brand = 0
t0 = time.time()

for d in (deals or []):
    if time.time() - t0 > 3200: log("Time limit"); break
    product = extract_product_name(d['title'])
    search_fn, _ = get_brand_urls(d['title'])
    if not search_fn:
        no_brand += 1
        continue
    log(f"\n  [{product[:50]}]")
    img_data = find_image(d['title'])
    if img_data:
        cdn = upload_to_sanity(img_data, d['_id'])
        if cdn:
            status = patch(d['_id'], cdn)
            if status == 200:
                fixed += 1
                log(f"  ✓ {cdn[-40:]}")
    else:
        not_found += 1
        log(f"  - no image")
    time.sleep(0.5)

log(f"\nDone: {fixed} fixed, {not_found} no image, {no_brand} no brand match, {total} total")
save()
