#!/usr/bin/env python3
import json, os, base64, urllib.request, urllib.error, time, re, sys

GH_TOKEN = os.environ.get("GH_TOKEN", "")
REPO = "dejcav-cmd/DownRange"

def gh_get(path):
    # URL-encode the path properly for files with special chars like [slug]
    encoded_path = path.replace("[", "%5B").replace("]", "%5D")
    url = f"https://api.github.com/repos/{REPO}/contents/{encoded_path}"
    req = urllib.request.Request(url, headers={
        "Authorization": f"token {GH_TOKEN}",
        "Accept": "application/vnd.github+json"
    })
    with urllib.request.urlopen(req, timeout=20) as r:
        d = json.loads(r.read())
        # Handle large files - content may be truncated
        if d.get("content"):
            content = base64.b64decode(d["content"].replace("\n","")).decode("utf-8")
        else:
            # File too large, fetch via download_url
            dl_url = d.get("download_url")
            if dl_url:
                req2 = urllib.request.Request(dl_url, headers={"Authorization": f"token {GH_TOKEN}"})
                with urllib.request.urlopen(req2, timeout=20) as r2:
                    content = r2.read().decode("utf-8")
            else:
                raise Exception(f"Cannot get content for {path}")
        return content, d["sha"]

def gh_put(path, content, sha, message):
    encoded_path = path.replace("[", "%5B").replace("]", "%5D")
    url = f"https://api.github.com/repos/{REPO}/contents/{encoded_path}"
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
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

if not os.path.exists("/tmp/learn_images.json"):
    print("ERROR: /tmp/learn_images.json not found", flush=True)
    sys.exit(1)

with open("/tmp/learn_images.json") as f:
    learn_images = json.load(f)

found = {k: v for k, v in learn_images.items() if v}
print(f"Found {len(found)}/{len(learn_images)} images to patch", flush=True)
for slug, url in found.items():
    print(f"  {slug}: {url[:80]}", flush=True)

if not found:
    print("No images to patch — exiting", flush=True)
    sys.exit(0)

# ─── Patch app/learn/page.js ──────────────────────────────────────
print("\nPatching app/learn/page.js...", flush=True)
content, sha = gh_get("app/learn/page.js")
modified = False

for slug, url in found.items():
    # Match: { slug:'buying-your-first-gun', ..., img:'/img/photos/pistol.jpg', ...}
    # Replace the img value for this specific slug's entry in the array
    # Use a two-pass approach: find the slug, then find img within 600 chars
    idx = content.find(f"slug:'{slug}'")
    if idx < 0:
        idx = content.find(f'slug:"{slug}"')
    if idx < 0:
        print(f"  ⚠ {slug}: not found in page.js", flush=True)
        continue
    
    # Look ahead 600 chars for the img field
    chunk = content[idx:idx+600]
    new_chunk = re.sub(r"img:\s*['\"][^'\"]*['\"]", f"img:'{url}'", chunk, count=1)
    if new_chunk != chunk:
        content = content[:idx] + new_chunk + content[idx+600:]
        print(f"  ✅ {slug}: updated in LEARN_ARTICLES", flush=True)
        modified = True
    else:
        print(f"  ⚠ {slug}: img field not found near slug", flush=True)

if modified:
    result = gh_put("app/learn/page.js", content, sha,
                    "fix: update Learn article images with real Wikimedia CC0 photos")
    print(f"Committed learn/page.js: {result.get('commit',{}).get('sha','?')[:10]}", flush=True)
else:
    print("No changes to learn/page.js", flush=True)

time.sleep(1)

# ─── Patch app/learn/[slug]/page.js ──────────────────────────────────
print("\nPatching app/learn/[slug]/page.js...", flush=True)
content2, sha2 = gh_get("app/learn/[slug]/page.js")
modified2 = False

for slug, url in found.items():
    changes = 0
    # 1. HERO_IMAGES map: 'slug': '/img/photos/xxx.jpg'
    old_hero = re.escape(f"'{slug}':") + r"\s*['\"][^'\"]*['\"]"
    new_hero  = f"'{slug}': '{url}'"
    new_content2 = re.sub(old_hero, new_hero, content2)
    if new_content2 != content2:
        content2 = new_content2
        changes += 1
    
    # 2. heroImage in article data object (within 1000 chars of slug)
    idx = content2.find(f"'{slug}'")
    if idx >= 0:
        chunk = content2[idx:idx+1000]
        new_chunk = re.sub(r"heroImage:\s*['\"][^'\"]*['\"]", f"heroImage: '{url}'", chunk, count=1)
        if new_chunk != chunk:
            content2 = content2[:idx] + new_chunk + content2[idx+1000:]
            changes += 1
    
    if changes > 0:
        print(f"  ✅ {slug}: {changes} replacement(s)", flush=True)
        modified2 = True
    else:
        print(f"  ⚠ {slug}: no match found", flush=True)

if modified2:
    result2 = gh_put("app/learn/[slug]/page.js", content2, sha2,
                     "fix: update Learn article hero images with Wikimedia CC0 photos")
    print(f"Committed learn/[slug]/page.js: {result2.get('commit',{}).get('sha','?')[:10]}", flush=True)
else:
    print("No changes to learn/[slug]/page.js", flush=True)

print("\nDone!", flush=True)
