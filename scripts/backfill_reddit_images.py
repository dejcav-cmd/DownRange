#!/usr/bin/env python3
"""Backfill images for existing Reddit deals that have imageUrl=null."""
import urllib.request, urllib.parse, json, os, base64, time, re
import html as html_mod

TOKEN = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
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
    body = json.dumps({"mutations": muts}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status

def search_product_image(title):
    clean = re.sub(r'\$[\d,]+(?:\.\d{2})?', '', title)
    clean = re.sub(r'\b(no code|free ship|oos|fss|percent off|%\s*off)\b.*', '', clean, flags=re.I)
    clean = re.sub(r'\s+', ' ', clean).strip()[:80]
    firearm_terms = ['pistol','rifle','shotgun','handgun','suppressor','silencer',
                     'optic','scope','ammo','magazine','holster','trigger','barrel',
                     'muzzle','compensator','flashhider','bcg','upper','lower',
                     'ar-15','ar15','ak','glock','sig','ruger','springfield']
    has_firearm = any(t in clean.lower() for t in firearm_terms)
    query = clean + (" firearm" if not has_firearm else "")
    try:
        encoded = urllib.parse.quote(query)
        url = f"https://www.bing.com/images/search?q={encoded}&first=1&count=3"
        req = urllib.request.Request(url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Accept": "text/html"})
        with urllib.request.urlopen(req, timeout=8) as r:
            page = r.read().decode("utf-8", errors="replace")
        urls = re.findall(r'"murl":"([^"]+)"', page)
        for img_url in urls[:5]:
            img_url = html_mod.unescape(img_url)
            if re.search(r'\.(jpg|jpeg|png|webp)(\?|$)', img_url, re.I):
                return img_url
    except:
        pass
    return None

def upload_to_sanity(img_url, doc_id):
    try:
        req = urllib.request.Request(img_url,
            headers={"User-Agent": "Mozilla/5.0", "Referer": "https://www.bing.com"})
        with urllib.request.urlopen(req, timeout=10) as r:
            data = r.read()
        if len(data) < 5000:
            return None
        fname = f"reddit-{doc_id[-8:]}.jpg"
        upload_url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fname}"
        req2 = urllib.request.Request(upload_url, data=data, method="POST",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "image/jpeg",
                     "Content-Disposition": f"attachment; filename={fname}"})
        with urllib.request.urlopen(req2, timeout=20) as r:
            return json.loads(r.read()).get("url")
    except:
        return None

def save(content):
    encoded = base64.b64encode(content.encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": f"fix: reddit deal images backfill [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: return r.status

# Get all Reddit deals missing images
deals = sq('*[_type=="gunDeal" && approved==true && source=="reddit" && (!defined(imageUrl) || imageUrl == "" || imageUrl == null)] | order(publishedAt desc)[0...200]{_id, title}')
print(f"Found {len(deals or [])} Reddit deals missing images")

fixed = 0
t0 = time.time()
for d in (deals or []):
    if time.time() - t0 > 3000:
        print("Time limit")
        break
    img = search_product_image(d['title'])
    if img:
        cdn = upload_to_sanity(img, d['_id'])
        final = cdn or img
        status = patch(d['_id'], final)
        if status == 200:
            fixed += 1
            print(f"  ✓ {d['title'][:60]}")
        else:
            print(f"  ✗ patch failed {status}")
    else:
        print(f"  - no image: {d['title'][:60]}")
    time.sleep(0.5)

msg = f"Reddit deals image backfill: {fixed}/{len(deals or [])} fixed"
print(f"\n{msg}")
save(msg)

# ── Also patch any deals where source is reddit but imageUrl check was missed ──
missed = sq('*[_type=="gunDeal" && approved==true && source=="reddit" && (!defined(imageUrl) || imageUrl == "" || imageUrl == null)]{_id, title}')
if not missed:
    # Try broader: any reddit deal from last 7 days without image
    from datetime import datetime, timezone, timedelta
    since = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    missed = sq(f'*[_type=="gunDeal" && approved==true && (source=="reddit" || source=="r/gundeals") && (!defined(imageUrl) || imageUrl == "" || imageUrl == null) && publishedAt>"{since}"]{{_id, title}}')

print(f"\nMissed deals to patch: {len(missed or [])}")
for d in (missed or []):
    img = search_product_image(d['title'])
    if img:
        cdn = upload_to_sanity(img, d['_id'])
        final = cdn or img
        status = patch(d['_id'], final)
        print(f"  {'✓' if status==200 else '✗'} {d['title'][:60]}")
    time.sleep(0.5)
