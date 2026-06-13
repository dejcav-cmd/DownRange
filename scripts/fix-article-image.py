import urllib.request, urllib.parse, json, os, re, time

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"

def q(query):
    url = f"{BASE}/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read()).get("result")

def mutate(mutations):
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(f"{BASE}/mutate/production", data=body,
           headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def upload_image(img_url, label):
    req = urllib.request.Request(img_url, headers={
        "User-Agent": "Mozilla/5.0 (compatible; DownRange/1.0)",
        "Referer": "https://downrangeco.com"
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        buf = r.read()
        ct  = r.headers.get("Content-Type","image/jpeg")
    if len(buf) < 3000: return None
    ext = "png" if "png" in ct else "webp" if "webp" in ct else "jpg"
    up = urllib.request.Request(
        f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={label}.{ext}",
        data=buf, method="POST",
        headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": ct}
    )
    with urllib.request.urlopen(up, timeout=30) as r:
        d = json.loads(r.read())
    return d.get("document",{}).get("url") or d.get("url")

# Find article by slug fragment
slug = "another-reason-no-one-should-take-glock-switch-hysteria-seriously-6d860e"
doc = q(f'*[_type=="newsArticle" && slug.current=="{slug}"][0]{{_id,title,imageUrl,externalUrl,slug,_type}}')

if not doc:
    # Try partial match
    doc = q(f'*[_type=="newsArticle" && slug.current match "another-reason*glock-switch*"][0]{{_id,title,imageUrl,externalUrl,slug,_type}}')

print("=== Article State ===")
if not doc:
    print("NOT FOUND")
else:
    print(f"  _id:       {doc.get('_id')}")
    print(f"  title:     {doc.get('title','')[:80]}")
    print(f"  slug:      {doc.get('slug',{}).get('current','')}")
    print(f"  imageUrl:  {doc.get('imageUrl','') or 'MISSING'}")
    print(f"  externalUrl: {doc.get('externalUrl','')[:80]}")
    print(f"  imageUrl cdn?: {'YES' if 'cdn.sanity.io' in (doc.get('imageUrl') or '') else 'NO - hotlink or missing'}")

    # Diagnose image issue
    img = doc.get("imageUrl","") or ""
    if not img:
        print("\n  ISSUE: imageUrl is null/empty")
    elif "cdn.sanity.io" not in img:
        print(f"\n  ISSUE: imageUrl is a hotlink (not on Sanity CDN)")
        print(f"         {img[:100]}")
        # Test if hotlink loads
        try:
            req = urllib.request.Request(img, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, timeout=8) as r:
                size = len(r.read())
            print(f"         Hotlink loads: YES ({size} bytes)")
        except Exception as e:
            print(f"         Hotlink loads: NO — {e}")
    else:
        print("\n  imageUrl is on Sanity CDN — checking if URL returns 200")
        try:
            with urllib.request.urlopen(img, timeout=8) as r:
                size = len(r.read())
            print(f"  CDN image loads: YES ({size} bytes) — image should display")
        except Exception as e:
            print(f"  CDN image BROKEN: {e}")

    # Fetch OG image from source article
    ext_url = doc.get("externalUrl","")
    print(f"\n=== Fetching OG image from source ===")
    print(f"  Source: {ext_url}")
    if ext_url:
        try:
            req = urllib.request.Request(ext_url, headers={
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Accept": "text/html,application/xhtml+xml"
            })
            with urllib.request.urlopen(req, timeout=12) as r:
                html = r.read(100000).decode("utf-8", errors="ignore")
            for pat in [
                r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
                r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
            ]:
                m = re.search(pat, html, re.I)
                if m:
                    og = m.group(1).strip()
                    if og.startswith("http"):
                        print(f"  Found OG: {og[:100]}")
                        # Upload to CDN
                        print(f"  Uploading to Sanity CDN...")
                        cdn = upload_image(og, f"news-{doc['_id'][-8:]}")
                        if cdn:
                            print(f"  CDN URL: {cdn}")
                            mutate([{"patch": {"id": doc["_id"], "set": {"imageUrl": cdn}}}])
                            print(f"  ✓ Patched imageUrl → CDN")
                        else:
                            # Store direct OG URL
                            mutate([{"patch": {"id": doc["_id"], "set": {"imageUrl": og}}}])
                            print(f"  ~ Stored direct OG URL (CDN upload failed)")
                        break
            else:
                print(f"  No OG image found in source HTML")
        except Exception as e:
            print(f"  Source fetch failed: {e}")

print("\nDone.")
