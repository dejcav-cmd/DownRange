#!/usr/bin/env python3
"""
Backfill product images for Reddit deals that have no image.
Searches by exact product name (NOT generic "firearm" anchors).
Validates dimensions, rejects stock photos.
"""
import urllib.request, urllib.parse, json, os, base64, time, re
import html as html_mod

TOKEN   = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT  = os.environ.get("GH_PAT","").strip()
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
    clean = re.sub(r'\b(no code needed|in stock|oos|fss|free shipping|in various lengths?|w/\(?\d+\)?\s*\w+)\b.*', '', clean, flags=re.I)
    clean = re.sub(r'\s+for\s+\$.*', '', clean, flags=re.I)
    clean = re.sub(r'\s*[-–]\s*\$.*', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip().rstrip(',.-')
    return clean[:100]

def search_and_validate_image(product_name):
    query = f'"{product_name}" product'
    encoded = urllib.parse.quote(query)
    search_url = f"https://www.bing.com/images/search?q={encoded}&first=1&count=10&qft=+filterui:photo-photo"
    try:
        req = urllib.request.Request(search_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html", "Referer": "https://www.bing.com/"})
        with urllib.request.urlopen(req, timeout=12) as r:
            page = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return None

    img_urls = [html_mod.unescape(u) for u in re.findall(r'"murl":"([^"]+)"', page)]
    for img_url in img_urls[:8]:
        if not re.search(r'\.(jpg|jpeg|png|webp)(\?|$)', img_url, re.I): continue
        if any(d in img_url for d in ['shutterstock','getty','istock','alamy','dreamstime','stock.adobe','123rf','depositphotos']): continue
        try:
            req2 = urllib.request.Request(img_url, headers={"User-Agent":"Mozilla/5.0","Referer":"https://www.bing.com"})
            with urllib.request.urlopen(req2, timeout=8) as r:
                data = r.read()
        except: continue
        if len(data) < 15000: continue
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
        if w<300 or h<200: continue
        if w>0 and h>0 and (w/h>3.5 or h/w>3.5): continue
        return data
    return None

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
    payload = {"message": "fix: reddit deals image backfill result [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

# Get Reddit deals without images (all time, not just recent)
deals = sq('*[_type=="gunDeal" && approved==true && (source=="reddit" || source=="r/gundeals") && (!defined(imageUrl) || imageUrl=="" || imageUrl==null)] | order(publishedAt desc)[0...300]{_id, title}')
total = len(deals or [])
print(f"Reddit deals missing images: {total}")

fixed = 0
not_found = 0
t0 = time.time()

for d in (deals or []):
    if time.time() - t0 > 3000:
        print(f"Time limit. Fixed {fixed}/{total} so far.")
        break

    product = extract_product_name(d['title'])
    print(f"  [{d['_id'][-6:]}] {product[:55]}")

    img_data = search_and_validate_image(product)
    if img_data:
        cdn = upload_to_sanity(img_data, d['_id'])
        if cdn:
            status = patch(d['_id'], cdn)
            if status == 200:
                fixed += 1
                print(f"    ✓ CDN: {cdn[-40:]}")
            else:
                print(f"    ✗ patch failed {status}")
        else:
            print(f"    ✗ CDN upload failed")
    else:
        not_found += 1
        print(f"    - no valid image")

    time.sleep(0.4)

msg = f"Reddit image backfill: {fixed} fixed, {not_found} no image found, {total} total\n"
print(f"\n{msg}")
save(msg)
