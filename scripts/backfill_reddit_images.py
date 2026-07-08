#!/usr/bin/env python3
"""
Backfill product images for Reddit deals using DuckDuckGo image search.
Exact product name query, dimension validation, stock photo domain rejection.
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

def ddg_image_search(product_name):
    """DuckDuckGo image search — more bot-friendly than Bing from datacenter IPs."""
    # Step 1: get a DDG token
    try:
        req = urllib.request.Request(
            "https://duckduckgo.com/",
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
        with urllib.request.urlopen(req, timeout=8) as r:
            html = r.read().decode("utf-8", errors="replace")
        vqd = re.search(r'vqd=([\d-]+)', html)
        vqd = vqd.group(1) if vqd else "3"
    except:
        vqd = "3"

    # Step 2: image search API
    query = urllib.parse.quote(f'"{product_name}" gun firearm product')
    api_url = f"https://duckduckgo.com/i.js?q={query}&vqd={vqd}&f=,,,,,&p=1&v7exp=a"
    try:
        req = urllib.request.Request(api_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Referer": "https://duckduckgo.com/",
            "Accept": "application/json",
        })
        with urllib.request.urlopen(req, timeout=10) as r:
            data = json.loads(r.read())
        results = data.get("results", [])
        return [r.get("image","") for r in results[:8] if r.get("image")]
    except Exception as e:
        return []

def validate_image(img_url):
    """Download and validate image — reject too small, banners, stock sites."""
    if any(d in img_url for d in ['shutterstock','getty','istock','alamy','dreamstime','stock.adobe','123rf','depositphotos']):
        return None
    try:
        req = urllib.request.Request(img_url, headers={
            "User-Agent": "Mozilla/5.0", "Referer": "https://duckduckgo.com"})
        with urllib.request.urlopen(req, timeout=8) as r:
            data = r.read()
    except:
        return None
    if len(data) < 15000:
        return None
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
    if w<300 or h<200: return None
    if w>0 and h>0 and (w/h>3.5 or h/w>3.5): return None
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

# Debug: test DDG first
print("=== DDG TEST ===")
test_urls = ddg_image_search("Springfield Kuna 9mm")
print(f"DDG returned {len(test_urls)} image URLs for 'Springfield Kuna 9mm'")
for u in test_urls[:3]:
    print(f"  {u[:90]}")

if not test_urls:
    save("DDG returned 0 results — may be bot-blocked too. Need alternative approach.\n")
    exit(0)

# Get Reddit deals without images
deals = sq('*[_type=="gunDeal" && approved==true && (source=="reddit" || source=="r/gundeals") && (!defined(imageUrl) || imageUrl=="" || imageUrl==null)] | order(publishedAt desc)[0...100]{_id, title}')
total = len(deals or [])
print(f"\nReddit deals to fix: {total}")

fixed = 0
not_found = 0
t0 = time.time()

for d in (deals or []):
    if time.time() - t0 > 3000: break
    product = extract_product_name(d['title'])
    print(f"  {product[:55]}")
    img_urls = ddg_image_search(product)
    found = False
    for img_url in img_urls:
        img_data = validate_image(img_url)
        if img_data:
            cdn = upload_to_sanity(img_data, d['_id'])
            if cdn:
                status = patch(d['_id'], cdn)
                if status == 200:
                    fixed += 1
                    found = True
                    print(f"    ✓ {cdn[-40:]}")
                    break
    if not found:
        not_found += 1
        print(f"    - no image")
    time.sleep(0.5)

msg = f"Reddit image backfill: {fixed} fixed, {not_found} no image, {total} total\n"
print(f"\n{msg}")
save(msg)
