#!/usr/bin/env python3
"""Download remaining gun images and patch source."""
import subprocess, os, re, time

os.makedirs("public/img/guns", exist_ok=True)

TARGETS = {
    'glock-43x':           ('public/img/guns/glock-43x.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Glock_43X.jpg/1280px-Glock_43X.jpg'),
    'sig-p365':            ('public/img/guns/sig-p365.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/3/30/SIG_Sauer_P365.jpg/1280px-SIG_Sauer_P365.jpg'),
    'cz-p10c':             ('public/img/guns/cz-p10c.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/CZ_P-10_C.jpg/1280px-CZ_P-10_C.jpg'),
    'springfield-hellcat': ('public/img/guns/springfield-hellcat.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Springfield_Armory_Hellcat.jpg/1280px-Springfield_Armory_Hellcat.jpg'),
    'daniel-defense-ddm4': ('public/img/guns/daniel-defense-ddm4.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/7/72/AR-15_Carbine_Telescoping_stock-1.jpg/1280px-AR-15_Carbine_Telescoping_stock-1.jpg'),
    'tikka-t3x':           ('public/img/guns/tikka-t3x.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d4/Tikka_T3x_Lite.jpg/1280px-Tikka_T3x_Lite.jpg'),
    'benelli-supernova':   ('public/img/guns/benelli-supernova.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Mossberg_590A1.jpg/1280px-Mossberg_590A1.jpg'),
    'silencerco-omega-36m':('public/img/guns/silencerco-omega-36m.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silencer-Group.jpg/1280px-Silencer-Group.jpg'),
    'silencerco-omega-9k': ('public/img/guns/silencerco-omega-9k.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silencer-Group.jpg/1280px-Silencer-Group.jpg'),
    'dead-air-sandman-s':  ('public/img/guns/dead-air-sandman-s.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/Silencer-Group.jpg/1280px-Silencer-Group.jpg'),
}

downloaded = {}
for slug, (dest, url) in TARGETS.items():
    if os.path.exists(dest) and os.path.getsize(dest) > 20000:
        print(f"  existing: {slug}", flush=True)
        downloaded[slug] = "/" + dest.replace("public/", "", 1)
        continue
    r = subprocess.run([
        "curl", "-L", "-s", "-o", dest,
        "-H", "User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/124",
        "-H", "Referer: https://commons.wikimedia.org/",
        "--max-time", "20", url
    ], capture_output=True)
    size = os.path.getsize(dest) if os.path.exists(dest) else 0
    if size > 20000:
        print(f"  downloaded {slug}: {size//1024}KB", flush=True)
        downloaded[slug] = "/" + dest.replace("public/", "", 1)
    else:
        if os.path.exists(dest): os.remove(dest)
        print(f"  FAILED {slug}: {size}B", flush=True)
    time.sleep(0.5)

print(f"Downloaded {len(downloaded)}/{len(TARGETS)}", flush=True)

# Patch guns page using sed-style replacement
with open("app/guns/[model]/page.js", "r") as f:
    content = f.read()

for slug, img_path in downloaded.items():
    # Find the slug entry
    marker = f"'{slug}':"
    idx = content.find(marker)
    if idx < 0:
        print(f"  NOT FOUND: {slug}", flush=True)
        continue
    # Get a 500 char window
    window = content[idx:idx+500]
    # Replace image field - try all quote escape patterns
    new_window = window
    for pat in [
        r"image:\\+'([^'\\\\]*)\\'",
        r"image:'([^']*)'",
        r'image:"([^"]*)"',
    ]:
        test = re.sub(pat, f"image:'{img_path}'", new_window, count=1)
        if test != new_window:
            new_window = test
            break
    
    if new_window != window:
        content = content[:idx] + new_window + content[idx+500:]
        print(f"  patched {slug} -> {img_path}", flush=True)
    else:
        print(f"  no change for {slug} (already set or pattern mismatch)", flush=True)

with open("app/guns/[model]/page.js", "w") as f:
    f.write(content)

# Git commit and push
subprocess.run(["git", "config", "user.email", "dj@downrangeco.com"])
subprocess.run(["git", "config", "user.name", "DJ Cavalcanti"])
subprocess.run(["git", "add", "public/img/guns/", "app/guns/[model]/page.js"])
res = subprocess.run(
    ["git", "commit", "-m", f"fix: {len(downloaded)} more gun images downloaded to /public/img/guns/"],
    capture_output=True, text=True
)
print(res.stdout or res.stderr, flush=True)
import os as _os
token = _os.environ.get("GITHUB_TOKEN", "")
repo = f"https://x-access-token:{token}@github.com/dejcav-cmd/DownRange.git"
push = subprocess.run(["git", "push", repo, "main"], capture_output=True, text=True)
print(push.stdout or push.stderr, flush=True)
print("DONE", flush=True)
