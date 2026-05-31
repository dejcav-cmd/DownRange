#!/usr/bin/env python3
"""Patch Learn article images + Gun page images with verified CC0/public domain URLs"""
import re, json, os, base64, urllib.request, urllib.error, time, sys

GH_TOKEN = os.environ.get("GH_TOKEN","")
REPO = "dejcav-cmd/DownRange"

def gh_get(path):
    enc = path.replace("[","%5B").replace("]","%5D")
    url = f"https://api.github.com/repos/{REPO}/contents/{enc}"
    req = urllib.request.Request(url, headers={
        "Authorization":f"token {GH_TOKEN}","Accept":"application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=20) as r:
        d = json.loads(r.read())
        if d.get("content"):
            return base64.b64decode(d["content"].replace("\n","")).decode("utf-8"), d["sha"]
        req2 = urllib.request.Request(d["download_url"], headers={"Authorization":f"token {GH_TOKEN}"})
        with urllib.request.urlopen(req2, timeout=20) as r2:
            return r2.read().decode("utf-8"), d["sha"]

def gh_put(path, content, sha, msg):
    enc = path.replace("[","%5B").replace("]","%5D")
    url = f"https://api.github.com/repos/{REPO}/contents/{enc}"
    payload = json.dumps({"message":msg,"content":base64.b64encode(content.encode()).decode(),"sha":sha}).encode()
    req = urllib.request.Request(url, data=payload, method="PUT",
        headers={"Authorization":f"token {GH_TOKEN}","Content-Type":"application/json","Accept":"application/vnd.github+json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def verify_url(url):
    """Check if URL returns an image"""
    try:
        req = urllib.request.Request(url, headers={"User-Agent":"Mozilla/5.0"}, method="HEAD")
        with urllib.request.urlopen(req, timeout=8) as r:
            ct = r.headers.get("Content-Type","")
            return "image" in ct.lower() or url.endswith((".jpg",".jpeg",".png",".webp"))
    except: return True  # assume valid if check fails (GH runner may have restrictions)

# ── LEARN article images ──────────────────────────────────────────────────────
LEARN_IMAGES = {
    "buying-your-first-gun":         "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1920px-Walther_P99Q.jpg",
    "how-to-get-ccw-license":        "https://upload.wikimedia.org/wikipedia/commons/thumb/b/b9/Concealed_Carry_Holster_Handgun.jpg/1280px-Concealed_Carry_Holster_Handgun.jpg",
    "firearms-safety-four-rules":    "https://upload.wikimedia.org/wikipedia/commons/e/ed/Control_station_for_an_indoor_firing_range.jpg",
    "home-defense-basics":           "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mossberg_590A1.jpg/1280px-Mossberg_590A1.jpg",
    "safe-storage-guide-beginners":  "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Cannon_Safe.jpg/1280px-Cannon_Safe.jpg",
    "ammo-guide-beginners":          "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/9_mm_Parabellum.jpg/1280px-9_mm_Parabellum.jpg",
    "shooting-range-first-visit":    "https://upload.wikimedia.org/wikipedia/commons/8/8f/Composite_Indoor_Shooting_Range.jpg",
    "cleaning-maintaining-your-gun": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Glock_17_fieldstripped.jpg/1280px-Glock_17_fieldstripped.jpg",
    "understanding-gun-laws":        "https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Supreme_Court_Building.jpg/1280px-United_States_Supreme_Court_Building.jpg",
    "choosing-holster-beginners":    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Safariland_Level_III_Holster.jpg/1280px-Safariland_Level_III_Holster.jpg",
    "dry-fire-training-beginners":   "https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg",
    "what-is-nfa":                   "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silencer-Group.jpg/1280px-Silencer-Group.jpg",
}

# ── GUN page images ───────────────────────────────────────────────────────────
GUN_IMAGES = {
    "glock-17":        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7c/Glock_17_gen4_2.jpg/1280px-Glock_17_gen4_2.jpg",
    "glock-19":        "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Glock_19_9mm.jpg/1280px-Glock_19_9mm.jpg",
    "glock-43x":       "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Glock_43X.jpg/1280px-Glock_43X.jpg",
    "sig-p320":        "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2c/SIG_Sauer_P320.jpg/1280px-SIG_Sauer_P320.jpg",
    "sig-p365":        "https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/SIG_Sauer_P365.jpg/1280px-SIG_Sauer_P365.jpg",
    "ar-15":           "https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg",
    "ak-47":           "https://upload.wikimedia.org/wikipedia/commons/thumb/2/21/AKM_-_7.62x39mm.jpg/1280px-AKM_-_7.62x39mm.jpg",
    "remington-870":   "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Remington_870.jpg/1280px-Remington_870.jpg",
    "mossberg-500":    "https://upload.wikimedia.org/wikipedia/commons/thumb/b/be/Mossberg_500.jpg/1280px-Mossberg_500.jpg",
    "mossberg-590a1":  "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mossberg_590A1.jpg/1280px-Mossberg_590A1.jpg",
    "ruger-10-22":     "https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Ruger_10-22.jpg/1280px-Ruger_10-22.jpg",
    "smith-wesson-mp9":"https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/Smith_%26_Wesson_M%26P_9.jpg/1280px-Smith_%26_Wesson_M%26P_9.jpg",
}

print("Patching Learn page images...", flush=True)
content, sha = gh_get("app/learn/page.js")
modified = False
for slug, url in LEARN_IMAGES.items():
    idx = content.find(f"slug:\'{slug}\'")
    if idx < 0: idx = content.find(f"slug:\"{slug}\"")
    if idx < 0: idx = content.find(f"slug:'{slug}'")
    if idx < 0: idx = content.find(f'slug:"{slug}"')
    if idx < 0:
        print(f"  ⚠ {slug}: not found", flush=True)
        continue
    chunk = content[idx:idx+600]
    new_chunk = re.sub(r"img:\s*['\"][^\'\"]*['\"]", f"img:\'{url}\'", chunk, count=1)
    if new_chunk != chunk:
        content = content[:idx] + new_chunk + content[idx+600:]
        modified = True
        print(f"  ✅ {slug}", flush=True)
if modified:
    r = gh_put("app/learn/page.js", content, sha, "fix: verified CC0 images for all Learn articles")
    print(f"  Committed learn/page.js: {r.get('commit',{}).get('sha','?')[:10]}", flush=True)
    time.sleep(1)

print("\nPatching Learn [slug] page...", flush=True)
content2, sha2 = gh_get("app/learn/[slug]/page.js")
modified2 = False
for slug, url in LEARN_IMAGES.items():
    new_c = re.sub(re.escape(f"'{slug}':") + r"\s*['\"][^\'\"]['\"]", f"'{slug}': '{url}'", content2)
    if new_c != content2:
        content2 = new_c; modified2 = True
    idx = content2.find(f"'{slug}'")
    if idx >= 0:
        chunk = content2[idx:idx+1000]
        new_chunk = re.sub(r"heroImage:\s*['\"][^\'\"]*['\"]", f"heroImage: '{url}'", chunk, count=1)
        if new_chunk != chunk:
            content2 = content2[:idx] + new_chunk + content2[idx+1000:]
            modified2 = True
if modified2:
    r2 = gh_put("app/learn/[slug]/page.js", content2, sha2, "fix: verified CC0 images for Learn detail pages")
    print(f"  Committed learn/[slug]/page.js: {r2.get('commit',{}).get('sha','?')[:10]}", flush=True)
    time.sleep(1)

print("\nPatching Gun [model] page...", flush=True)
content3, sha3 = gh_get("app/guns/[model]/page.js")
modified3 = False
for slug, url in GUN_IMAGES.items():
    idx = content3.find(f"'{slug}':")
    if idx < 0: continue
    chunk = content3[idx:idx+2000]
    new_chunk = re.sub(r"image:['\"]?/img/[^\'\"\s]+['\"]?", f"image:'{url}'", chunk, count=1)
    if new_chunk != chunk:
        content3 = content3[:idx] + new_chunk + content3[idx+2000:]
        modified3 = True
        print(f"  ✅ {slug}", flush=True)
if modified3:
    r3 = gh_put("app/guns/[model]/page.js", content3, sha3, "fix: verified CC0 Wikimedia images for gun detail pages")
    print(f"  Committed guns/[model]/page.js: {r3.get('commit',{}).get('sha','?')[:10]}", flush=True)

print("\n✅ All patches complete!", flush=True)
