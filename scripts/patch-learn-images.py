#!/usr/bin/env python3
"""
After fix-learn-and-draft-images.py runs and saves /tmp/learn_images.json,
this script patches the learn/page.js and learn/[slug]/page.js source files
via GitHub API to embed real Wikimedia image URLs.
"""
import json, os, base64, urllib.request, urllib.error, time, re, sys

GH_TOKEN = os.environ.get("GH_TOKEN", "")
REPO = "dejcav-cmd/DownRange"

def gh_get(path):
    url = f"https://api.github.com/repos/{REPO}/contents/{path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {GH_TOKEN}",
        "Accept": "application/vnd.github+json"
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        d = json.loads(r.read())
        content = base64.b64decode(d["content"].replace("\n","")).decode("utf-8")
        return content, d["sha"]

def gh_put(path, content, sha, message):
    url = f"https://api.github.com/repos/{REPO}/contents/{path}"
    payload = json.dumps({
        "message": message,
        "content": base64.b64encode(content.encode("utf-8")).decode(),
        "sha": sha
    }).encode()
    req = urllib.request.Request(url, data=payload, method="PUT", headers={
        "Authorization": f"token {GH_TOKEN}",
        "Content-Type": "application/json",
        "Accept": "application/vnd.github+json"
    })
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# Load learn images found in previous step
if not os.path.exists("/tmp/learn_images.json"):
    print("ERROR: /tmp/learn_images.json not found", flush=True)
    sys.exit(1)

with open("/tmp/learn_images.json") as f:
    learn_images = json.load(f)

# Only update if we found images
found = {k: v for k, v in learn_images.items() if v}
print(f"Found {len(found)}/{len(learn_images)} images to patch", flush=True)

if not found:
    print("No images found, nothing to patch", flush=True)
    sys.exit(0)

# ─── Patch learn/page.js ─────────────────────────────────────────
print("\nPatching app/learn/page.js...", flush=True)
content, sha = gh_get("app/learn/page.js")

# Replace img: '/img/photos/xxx.jpg' for each slug
for slug, url in found.items():
    if not url: continue
    # Replace the img field in the LEARN_ARTICLES array for this slug  
    pattern = r"(slug:'" + re.escape(slug) + r"'[^}]*img:)'/img/photos/[^']+'"
    replacement = r"\g<1>'" + url + "'"
    new_content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    if new_content != content:
        print(f"  ✅ {slug}: updated", flush=True)
        content = new_content
    else:
        # Try alternate format (double quotes or multiline)
        pattern2 = f"slug:'{slug}'"
        idx = content.find(pattern2)
        if idx >= 0:
            # Find the img field within 500 chars after the slug
            chunk = content[idx:idx+500]
            new_chunk = re.sub(r"img:'/img/photos/[^']+'", f"img:'{url}'", chunk)
            if new_chunk != chunk:
                content = content[:idx] + new_chunk + content[idx+500:]
                print(f"  ✅ {slug}: updated (method 2)", flush=True)
            else:
                print(f"  ⚠ {slug}: no img field found nearby", flush=True)

result = gh_put("app/learn/page.js", content, sha, "fix: update Learn article images with real Wikimedia CC0 images")
print(f"Committed: {result.get('commit', {}).get('sha', '')[:10]}", flush=True)

# ─── Patch learn/[slug]/page.js ─────────────────────────────────────
print("\nPatching app/learn/[slug]/page.js...", flush=True)
content2, sha2 = gh_get("app/learn/%5Bslug%5D/page.js")

# Replace in HERO_IMAGES map and article heroImage fields
for slug, url in found.items():
    if not url: continue
    # HERO_IMAGES map: 'slug': '/img/photos/xxx.jpg'
    pattern = r"'" + re.escape(slug) + r"':\s*'/img/photos/[^']+'"
    replacement = f"'{slug}': '{url}'"
    new = re.sub(pattern, replacement, content2)
    if new != content2:
        print(f"  ✅ {slug}: HERO_IMAGES updated", flush=True)
        content2 = new
    
    # heroImage field in article objects
    pattern2 = r"(slug:\s*'" + re.escape(slug) + r"'[^}]*?heroImage:\s*)'/img/photos/[^']+'"
    new2 = re.sub(pattern2, r"\g<1>'" + url + "'", content2, flags=re.DOTALL)
    if new2 != content2:
        print(f"  ✅ {slug}: heroImage updated", flush=True)
        content2 = new2

result2 = gh_put("app/learn/%5Bslug%5D/page.js", content2, sha2, "fix: update Learn article hero images with real Wikimedia CC0 images")
print(f"Committed: {result2.get('commit', {}).get('sha', '')[:10]}", flush=True)

print("\nLearn article image patching complete!", flush=True)
