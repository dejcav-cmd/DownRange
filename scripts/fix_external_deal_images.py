#!/usr/bin/env python3
"""Re-fetch deals with external (non-CDN) imageUrls and upload to Sanity CDN."""
import urllib.request, urllib.parse, json, os, base64, time, hashlib

TOKEN = os.environ.get("SANITY_API_TOKEN","").replace("ST=","").strip()
GH_PAT = os.environ.get("GH_PAT","").strip()
PROJECT = "vbnsqnkg"

def sq(q):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={urllib.parse.quote(q)}&returnQuery=false"
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def patch_image(doc_id, cdn_url):
    muts = [{"patch": {"id": doc_id, "set": {"imageUrl": cdn_url}}}]
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production?returnDocuments=false"
    body = json.dumps({"mutations": muts}).encode()
    req = urllib.request.Request(url, data=body, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return r.status

def fetch_and_upload(page_url, doc_id):
    """Fetch OG image via Jina proxy and upload to Sanity CDN."""
    # Try Jina proxy for gun.deals and other hotlink-blocked sources
    jina_url = f"https://r.jina.ai/{page_url}"
    try:
        req = urllib.request.Request(jina_url,
            headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html"},
            )
        req.add_header("X-Timeout", "8")
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        print(f"    Jina failed: {e}")
        return None

    # Extract og:image
    import re
    patterns = [
        r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
        r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
        r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
    ]
    img_url = None
    for pat in patterns:
        m = re.search(pat, html, re.IGNORECASE)
        if m:
            u = m.group(1).strip()
            if u.startswith("//"):  u = "https:" + u
            if re.search(r'\.(jpg|jpeg|png|webp)', u, re.I) and "logo" not in u.lower():
                img_url = u
                break

    if not img_url:
        return None

    # Download the image
    try:
        req2 = urllib.request.Request(img_url,
            headers={"User-Agent": "Mozilla/5.0", "Referer": page_url})
        with urllib.request.urlopen(req2, timeout=10) as r:
            img_data = r.read()
        if len(img_data) < 5000:
            return None
    except:
        return None

    # Upload to Sanity CDN
    fname = f"deal-{doc_id[-8:]}.jpg"
    upload_url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fname}"
    req3 = urllib.request.Request(upload_url, data=img_data, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "image/jpeg",
                 "Content-Disposition": f"attachment; filename={fname}"})
    try:
        with urllib.request.urlopen(req3, timeout=20) as r:
            result = json.loads(r.read())
            return result.get("url")
    except:
        return None

# Get all deals with external (non-CDN) imageUrls
print("Fetching deals with external images...")
deals = sq('*[_type=="gunDeal" && approved==true && defined(imageUrl) && imageUrl != "" && !string::startsWith(coalesce(imageUrl,""), "https://cdn.sanity.io")]{_id, title, imageUrl, externalUrl, source}')
print(f"Found {len(deals or [])} deals with external images to re-upload")

fixed = 0
failed = 0
t0 = time.time()

for deal in (deals or []):
    if time.time() - t0 > 3000:
        print("Time limit, stopping")
        break

    doc_id = deal["_id"]
    page_url = deal.get("externalUrl") or ""
    title = deal.get("title","?")[:50]

    if not page_url or not page_url.startswith("http"):
        failed += 1
        continue

    cdn_url = fetch_and_upload(page_url, doc_id)
    if cdn_url:
        status = patch_image(doc_id, cdn_url)
        if status == 200:
            fixed += 1
            print(f"  ✓ [{deal.get('source','?')}] {title}")
        else:
            failed += 1
            print(f"  ✗ patch failed {status}: {title}")
    else:
        failed += 1
        print(f"  - no image found: {title}")

    time.sleep(0.3)

msg = f"External deal image fix: {fixed} uploaded to CDN, {failed} failed/skipped of {len(deals or [])} total"
print(f"\n{msg}")

# Save result
if GH_PAT:
    encoded = base64.b64encode((msg + "\n").encode()).decode()
    path = "scripts/news-diag-result.txt"
    try:
        req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
            headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
        with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
    except: sha = None
    payload = {"message": f"fix: {fixed} deal images uploaded to CDN [skip ci]", "content": encoded}
    if sha: payload["sha"] = sha
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        data=json.dumps(payload).encode(), method="PUT",
        headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
    with urllib.request.urlopen(req) as r: print(f"Result saved: {r.status}")
