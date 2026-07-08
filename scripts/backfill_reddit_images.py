#!/usr/bin/env python3
"""
Backfill Reddit deal images by:
1. Detecting the brand from the title
2. Searching the manufacturer's own site via their search page
3. Scraping OG image from the first product result
Falls back to Google Images via Jina proxy if no brand match.
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
    clean = re.sub(r'\b(code:?\s*\w+|use code \w+|promo pack)\b', '', clean, flags=re.I)
    clean = re.sub(r'\+\s*(free ship\w*|no tax\s+\w+(\s+\w+)?)\b.*', '', clean, flags=re.I)
    clean = re.sub(r'\b(no code needed|in stock|oos|fss|free shipping|in various lengths?)\b.*', '', clean, flags=re.I)
    clean = re.sub(r'\s+for\s+\$.*', '', clean, flags=re.I)
    clean = re.sub(r'\s*[-–]\s*\$.*', '', clean)
    return re.sub(r'\s+', ' ', clean).strip().rstrip(',.-')[:100]

# Brand → Google site: search
BRAND_SITES = {
    r'\bspringfield\b':     'site:springfield-armory.com',
    r'\bsig sauer|sig p\d':  'site:sigsauer.com',
    r'\bglock\b':            'site:glock.com',
    r'\bruger\b':            'site:ruger.com',
    r'\bsmith.?wesson|s&w\b':'site:smith-wesson.com',
    r'\bcolt\b':             'site:colt.com',
    r'\bberetta\b':          'site:beretta.com',
    r'\bfn\b|\bfns\b|\bfnx\b':'site:fnamerica.com',
    r'\bhk\b|\bh&k\b':       'site:heckler-koch.com',
    r'\bwalther\b':          'site:waltherarms.com',
    r'\btaurus\b':           'site:taurususa.com',
    r'\bkimber\b':           'site:kimberamerica.com',
    r'\bcz\b':               'site:cz-usa.com',
    r'\bstaccato\b':         'site:staccato2011.com',
    r'\bvortex\b':           'site:vortexoptics.com',
    r'\btrijicon\b':         'site:trijicon.com',
    r'\bholosun\b':          'site:holosun.com',
    r'\baimpoint\b':         'site:aimpoint.com',
    r'\beotech\b':           'site:eotechinc.com',
    r'\bsilencerco\b':       'site:silencerco.com',
    r'\bdead air\b':         'site:deadairsilencers.com',
    r'\bmagpul\b':           'site:magpul.com',
    r'\bgeissele\b':         'site:geissele.com',
    r'\bradian\b':           'site:radianweapons.com',
    r'\bromulus\b|\bspringfield romulus\b': 'site:springfield-armory.com',
}

def get_site_filter(title):
    tl = title.lower()
    for pattern, site in BRAND_SITES.items():
        if re.search(pattern, tl, re.I):
            return site
    return None

def google_search_via_jina(product_name, site_filter=None):
    """
    Use Jina proxy to hit Google Images search.
    Jina routes through non-datacenter IPs — bypasses bot detection.
    """
    query = product_name
    if site_filter:
        query = f"{product_name} {site_filter}"
    
    # Google Images search via Jina
    google_url = f"https://www.google.com/search?q={urllib.parse.quote(query)}&tbm=isch&num=5"
    jina_url   = f"https://r.jina.ai/{google_url}"
    
    try:
        req = urllib.request.Request(jina_url, headers={
            "User-Agent": "Mozilla/5.0",
            "Accept": "text/html",
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            content = r.read().decode("utf-8", errors="replace")
        
        # Extract image URLs from Jina-rendered content
        img_urls = re.findall(r'https://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)(?:[?&][^\s"\'<>]*)?', content, re.I)
        # Also check for escaped JSON URLs
        escaped = re.findall(r'\\u0022(https://[^\\]+\.(?:jpg|jpeg|png|webp)[^\\]*)\\u0022', content, re.I)
        img_urls += [html_mod.unescape(u) for u in escaped]
        
        # Filter: skip thumbnails, icons, favicons
        filtered = []
        for u in img_urls:
            u = html_mod.unescape(u)
            if any(x in u for x in ['favicon','logo','icon','sprite','1x1','pixel','blank']): continue
            if 'encrypted-tbn' in u: continue  # Google thumbnail cache
            if any(d in u for d in ['shutterstock','getty','istock','alamy']): continue
            filtered.append(u)
        
        return filtered[:10]
    except Exception as e:
        return []

def validate_and_download(img_url):
    """Download image, validate dimensions. Returns bytes or None."""
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
    if w>0 and h>0:
        if w<200 or h<150: return None
        if w/h>4 or h/w>4: return None
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

# ── Debug: verify Jina + Google works ────────────────────────────────────────
print("=== JINA+GOOGLE TEST ===")
test_product = "Springfield Kuna 9mm"
test_site    = get_site_filter("Springfield Kuna 9mm")
print(f"Product: {test_product}")
print(f"Site filter: {test_site}")
test_imgs = google_search_via_jina(test_product, test_site)
print(f"Images found: {len(test_imgs)}")
for u in test_imgs[:4]:
    print(f"  {u[:90]}")

if not test_imgs:
    save("Jina+Google returned 0 images. Need to check Jina availability.\n")
    exit(0)

# ── Backfill ─────────────────────────────────────────────────────────────────
deals = sq('*[_type=="gunDeal" && approved==true && (source=="reddit" || source=="r/gundeals") && (!defined(imageUrl) || imageUrl=="" || imageUrl==null)] | order(publishedAt desc)[0...100]{_id, title}')
total = len(deals or [])
print(f"\nReddit deals missing images: {total}")

fixed = 0; not_found = 0
t0 = time.time()

for d in (deals or []):
    if time.time() - t0 > 3000: break
    product    = extract_product_name(d['title'])
    site_filter = get_site_filter(d['title'])
    print(f"  [{site_filter or 'no brand'}] {product[:55]}")
    
    img_urls = google_search_via_jina(product, site_filter)
    found = False
    for img_url in img_urls:
        img_data = validate_and_download(img_url)
        if img_data:
            cdn = upload_to_sanity(img_data, d['_id'])
            if cdn:
                status = patch(d['_id'], cdn)
                if status == 200:
                    fixed += 1; found = True
                    print(f"    ✓ {cdn[-40:]}")
                    break
    if not found:
        not_found += 1
        print(f"    - no valid image")
    time.sleep(0.5)

msg = f"Reddit image backfill: {fixed} fixed, {not_found} no image, {total} total\n"
print(f"\n{msg}")
save(msg)
