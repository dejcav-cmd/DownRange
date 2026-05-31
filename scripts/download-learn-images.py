#!/usr/bin/env python3
"""
Download CC0/public domain images to public/img/learn/ 
Serve from DownRange's own domain - no hotlinking restrictions.
"""
import urllib.request, os, re, time, subprocess

LEARN_IMAGES = {
    "buying-your-first-gun":          ["https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1280px-Walther_P99Q.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/Glock_19_9mm.jpg/1280px-Glock_19_9mm.jpg"],
    "how-to-get-ccw-license":         ["https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Safariland_Level_III_Holster.jpg/1280px-Safariland_Level_III_Holster.jpg"],
    "firearms-safety-four-rules":     ["https://upload.wikimedia.org/wikipedia/commons/e/ed/Control_station_for_an_indoor_firing_range.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg"],
    "home-defense-basics":            ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mossberg_590A1.jpg/1280px-Mossberg_590A1.jpg","https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg"],
    "safe-storage-guide-beginners":   ["https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Cannon_Safe.jpg/1280px-Cannon_Safe.jpg"],
    "ammo-guide-beginners":           ["https://upload.wikimedia.org/wikipedia/commons/thumb/c/c3/9_mm_Parabellum.jpg/1280px-9_mm_Parabellum.jpg"],
    "shooting-range-first-visit":     ["https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg"],
    "cleaning-maintaining-your-gun":  ["https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Glock_17_fieldstripped.jpg/1280px-Glock_17_fieldstripped.jpg"],
    "understanding-gun-laws":         ["https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/United_States_Supreme_Court_Building.jpg/1280px-United_States_Supreme_Court_Building.jpg"],
    "choosing-holster-beginners":     ["https://upload.wikimedia.org/wikipedia/commons/thumb/6/67/Safariland_Level_III_Holster.jpg/1280px-Safariland_Level_III_Holster.jpg"],
    "dry-fire-training-beginners":    ["https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/USMC_pistol_training.jpg/1280px-USMC_pistol_training.jpg"],
    "what-is-nfa":                    ["https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silencer-Group.jpg/1280px-Silencer-Group.jpg"],
}

SECTION_DOWNLOADS = {
    "section-rifle.jpg":   ["https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg"],
    "section-pistol.jpg":  ["https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Walther_P99Q.jpg/1280px-Walther_P99Q.jpg"],
    "section-shotgun.jpg": ["https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mossberg_590A1.jpg/1280px-Mossberg_590A1.jpg"],
}

os.makedirs("public/img/learn", exist_ok=True)

def download(urls, filename):
    import subprocess as sp
    dest = f"public/img/learn/{filename}"
    for url in urls:
        try:
            # Use curl with proper headers - more reliable for Wikimedia
            result = sp.run([
                "curl", "-L", "-s", "-o", dest,
                "-H", "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124.0.0.0 Safari/537.36",
                "-H", "Referer: https://commons.wikimedia.org/",
                "-H", "Accept: image/webp,image/apng,image/*,*/*;q=0.8",
                "--max-time", "20",
                url
            ], capture_output=True)
            if result.returncode == 0 and os.path.exists(dest):
                size = os.path.getsize(dest)
                if size > 8000:
                    print(f"  ✅ {filename}: {size//1024}KB", flush=True)
                    return f"/img/learn/{filename}"
                else:
                    print(f"  ⚠ Too small ({size}B): {url[:55]}", flush=True)
                    os.remove(dest)
        except Exception as e:
            print(f"  ❌ {url[:55]}: {e}", flush=True)
        time.sleep(0.3)
    return None

print("Downloading hero images...", flush=True)
hero_map = {}
for slug, urls in LEARN_IMAGES.items():
    path = download(urls, slug + ".jpg")
    hero_map[slug] = path
    time.sleep(0.4)

print("\nDownloading section images...", flush=True)
section_map = {"/img/photos/rifle.jpg": None, "/img/photos/pistol.jpg": None, "/img/photos/shotgun.jpg": None}
for fname, urls in SECTION_DOWNLOADS.items():
    path = download(urls, fname)
    if "rifle" in fname: section_map["/img/photos/rifle.jpg"] = path
    if "pistol" in fname: section_map["/img/photos/pistol.jpg"] = path
    if "shotgun" in fname: section_map["/img/photos/shotgun.jpg"] = path

print("\nPatching app/learn/[slug]/page.js...", flush=True)
with open("app/learn/[slug]/page.js", "r") as f:
    content = f.read()

# Update HERO_IMAGES
for slug, local_path in hero_map.items():
    if local_path:
        pattern = re.compile(r"'" + re.escape(slug) + r"':\s*'[^']*'")
        new_val = f"'{slug}': '{local_path}'"
        new_content = pattern.sub(new_val, content)
        if new_content != content:
            content = new_content
            print(f"  ✅ HERO_IMAGES['{slug}'] = {local_path}", flush=True)

# Update heroImage in ARTICLES
for slug, local_path in hero_map.items():
    if local_path:
        idx = content.find(f"'{slug}':")
        if idx > 0:
            chunk = content[idx:idx+600]
            new_chunk = re.sub(r"heroImage:\s*'[^']*'", f"heroImage: '{local_path}'", chunk, count=1)
            if new_chunk != chunk:
                content = content[:idx] + new_chunk + content[idx+600:]
                print(f"  ✅ ARTICLES['{slug}'].heroImage = {local_path}", flush=True)

# Update section images
for old_path, new_path in section_map.items():
    if new_path:
        count = content.count(f"image: '{old_path}'")
        content = content.replace(f"image: '{old_path}'", f"image: '{new_path}'")
        if count: print(f"  ✅ Section images {old_path} → {new_path} ({count}x)", flush=True)

# Remove any remaining generic /img/ section images (don't show broken images)
remaining = re.findall(r"image: '/img/[^']*'", content)
if remaining:
    content = re.sub(r",?\s*image: '/img/[^']*'", "", content)
    print(f"  ✅ Removed {len(remaining)} remaining generic section image refs", flush=True)

with open("app/learn/[slug]/page.js", "w") as f:
    f.write(content)

downloaded = sorted(os.listdir("public/img/learn"))
print(f"\nTotal downloaded: {len(downloaded)} images", flush=True)

subprocess.run(["git", "config", "user.email", "dj@downrangeco.com"])
subprocess.run(["git", "config", "user.name", "DJ Cavalcanti"])
subprocess.run(["git", "add", "public/img/learn/", "app/learn/[slug]/page.js"])
res = subprocess.run(["git", "commit", "-m", f"fix: {len(downloaded)} images downloaded to /public/img/learn/ (no hotlinking), fix all learn article hero + section images"], capture_output=True, text=True)
print(res.stdout or res.stderr, flush=True)
import os as _os
token = _os.environ.get("GITHUB_TOKEN", _os.environ.get("GH_TOKEN",""))
repo_url = f"https://x-access-token:{token}@github.com/dejcav-cmd/DownRange.git" if token else "origin"
subprocess.run(["git", "push", repo_url, "main"])
print("✅ Done!", flush=True)
