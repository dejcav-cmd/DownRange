#!/usr/bin/env python3
"""
Upload images directly to Sanity CDN using the Sanity Asset API.
Wikimedia blocks hotlinking from external sites, but Sanity CDN serves 
from cdn.sanity.io which is a CDN we control.
"""
import urllib.request, urllib.parse, json, os, subprocess, time, re

TOKEN = os.environ.get("SANITY_TOKEN","")
PROJECT = "vbnsqnkg"

def sanity_upload_image_from_url(url, filename):
    """Download image from URL and upload to Sanity CDN."""
    # Download with curl (more reliable than urllib for restricted sources)
    tmp = f"/tmp/{filename}"
    result = subprocess.run([
        "curl", "-L", "-s", "-o", tmp,
        "-H", "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124 Safari/537.36",
        "-H", "Referer: https://commons.wikimedia.org/",
        "-H", "Accept: image/*",
        "--max-time", "20",
        url
    ], capture_output=True)
    
    if result.returncode != 0 or not os.path.exists(tmp):
        print(f"  ❌ curl failed for {url[:55]}", flush=True)
        return None
    
    size = os.path.getsize(tmp)
    if size < 5000:
        print(f"  ❌ Too small ({size}B): {url[:55]}", flush=True)
        os.remove(tmp)
        return None
    
    # Upload to Sanity
    with open(tmp, 'rb') as f:
        img_data = f.read()
    os.remove(tmp)
    
    upload_url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production"
    req = urllib.request.Request(upload_url, data=img_data, method="POST", headers={
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "image/jpeg",
        "x-sanity-filename": filename,
    })
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read())
            cdn_url = result.get("document", {}).get("url") or result.get("url")
            if cdn_url:
                print(f"  ✅ Uploaded to Sanity CDN: {cdn_url[:70]}", flush=True)
                return cdn_url
    except Exception as e:
        print(f"  ❌ Sanity upload error: {e}", flush=True)
    return None

# Images to download + upload  
LEARN_IMAGES = {
    "buying-your-first-gun":          "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1280px-Walther_P99Q.jpg",
    "how-to-get-ccw-license":         "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Safariland_Level_III_Holster.jpg/1280px-Safariland_Level_III_Holster.jpg",
    "firearms-safety-four-rules":     "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg",
    "home-defense-basics":            "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Mossberg_500.jpg/1280px-Mossberg_500.jpg",
    "safe-storage-guide-beginners":   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Cannon_Safe.jpg/1280px-Cannon_Safe.jpg",
    "ammo-guide-beginners":           "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/9_mm_Parabellum.jpg/1280px-9_mm_Parabellum.jpg",
    "shooting-range-first-visit":     "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg",
    "cleaning-maintaining-your-gun":  "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Glock_17_fieldstripped.jpg/1280px-Glock_17_fieldstripped.jpg",
    "understanding-gun-laws":         "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Supreme_Court_Building.jpg/1280px-United_States_Supreme_Court_Building.jpg",
    "choosing-holster-beginners":     "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Safariland_Level_III_Holster.jpg/1280px-Safariland_Level_III_Holster.jpg",
    "dry-fire-training-beginners":    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg",
    "what-is-nfa":                    "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silencer-Group.jpg/1280px-Silencer-Group.jpg",
}

SECTION_IMAGES = {
    "section-rifle":   "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg",
    "section-pistol":  "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1280px-Walther_P99Q.jpg",
    "section-shotgun": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mossberg_590A1.jpg/1280px-Mossberg_590A1.jpg",
}

print("Uploading hero images to Sanity CDN...", flush=True)
hero_cdn = {}
for slug, url in LEARN_IMAGES.items():
    cdn_url = sanity_upload_image_from_url(url, f"learn-{slug}.jpg")
    hero_cdn[slug] = cdn_url
    time.sleep(0.5)

print("\nUploading section images...", flush=True)
section_cdn = {}
for name, url in SECTION_IMAGES.items():
    cdn_url = sanity_upload_image_from_url(url, f"learn-{name}.jpg")
    section_cdn[name] = cdn_url
    time.sleep(0.5)

# Patch app/learn/[slug]/page.js
print("\nPatching source file...", flush=True)
with open("app/learn/[slug]/page.js", "r") as f:
    content = f.read()

# Update HERO_IMAGES with cdn.sanity.io URLs
for slug, cdn_url in hero_cdn.items():
    if cdn_url:
        pattern = re.compile(r"'" + re.escape(slug) + r"':\s*'[^']*'")
        content = pattern.sub(f"'{slug}': '{cdn_url}'", content)
        print(f"  ✅ {slug}", flush=True)
    else:
        print(f"  ⚠ keeping existing: {slug}", flush=True)

# Update heroImage in ARTICLES
for slug, cdn_url in hero_cdn.items():
    if cdn_url:
        idx = content.find(f"'{slug}':")
        if idx > 0:
            chunk = content[idx:idx+600]
            new_chunk = re.sub(r"heroImage:\s*'[^']*'", f"heroImage: '{cdn_url}'", chunk, count=1)
            if new_chunk != chunk:
                content = content[:idx] + new_chunk + content[idx+600:]

# Update /img/learn/ paths with cdn.sanity.io
if section_cdn.get("section-rifle"):
    content = content.replace("image: '/img/learn/section-rifle.jpg'", f"image: '{section_cdn['section-rifle']}'")
    content = content.replace("src=\"/img/learn/section-rifle.jpg\"", f"src=\"{section_cdn['section-rifle']}\"")

with open("app/learn/[slug]/page.js", "w") as f:
    f.write(content)

# Update learn/page.js hero images too
with open("app/learn/page.js", "r") as f:
    lp = f.read()

for slug, cdn_url in hero_cdn.items():
    if cdn_url:
        idx = lp.find(f"slug:'{slug}'")
        if idx > 0:
            chunk = lp[idx:idx+600]
            new_chunk = re.sub(r"img:\s*'[^']*'", f"img: '{cdn_url}'", chunk, count=1)
            if new_chunk != chunk:
                lp = lp[:idx] + new_chunk + lp[idx+600:]

with open("app/learn/page.js", "w") as f:
    f.write(lp)

# Commit + push
subprocess.run(["git", "config", "user.email", "dj@downrangeco.com"])
subprocess.run(["git", "config", "user.name", "DJ Cavalcanti"])
subprocess.run(["git", "add", "app/learn/[slug]/page.js", "app/learn/page.js"])

successful = sum(1 for v in hero_cdn.values() if v)
res = subprocess.run([
    "git", "commit", "-m",
    f"fix: {successful}/12 learn images uploaded to Sanity CDN - served from cdn.sanity.io (no hotlinking)"
], capture_output=True, text=True)
print(res.stdout or res.stderr, flush=True)

token = os.environ.get("GITHUB_TOKEN", os.environ.get("GH_TOKEN",""))
repo_url = f"https://x-access-token:{token}@github.com/dejcav-cmd/DownRange.git" if token else "origin"
push = subprocess.run(["git", "push", repo_url, "main"], capture_output=True, text=True)
print(push.stdout or push.stderr, flush=True)
print("✅ Done!", flush=True)
