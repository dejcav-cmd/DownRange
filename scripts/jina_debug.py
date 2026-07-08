#!/usr/bin/env python3
import urllib.request, os, base64, json, re

GH_PAT = os.environ.get("GH_PAT","").strip()

def jfetch(url):
    req = urllib.request.Request(f"https://r.jina.ai/{url}",
        headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html",
                 "X-Return-Format": "html"})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status, r.read().decode("utf-8", errors="replace")
    except Exception as e:
        return 0, str(e)

out = []
tests = [
    ("SA Kuna", "https://www.springfield-armory.com/kuna/"),
    ("SA Kuna 2", "https://www.springfield-armory.com/1911-pistols/kuna-9mm/"),
    ("Glock G19", "https://us.glock.com/products/pistols/g19"),
    ("Glock G19 gen5", "https://us.glock.com/products/pistols/g19-gen5"),
    ("Vortex Defender-ST", "https://www.vortexoptics.com/product/vortex-defender-st-reflex-sight"),
]

for label, url in tests:
    status, content = jfetch(url)
    og = ""
    if content:
        m = re.search(r'og:image.*?content=["\']([^"\']+)["\']', content, re.I|re.DOTALL)
        if not m:
            m = re.search(r'content=["\']([^"\']+)["\'].*?og:image', content, re.I|re.DOTALL)
        og = m.group(1)[:80] if m else ""
    out.append(f"{label}: HTTP {status}, {len(content)} chars, OG: {og or 'none'}")
    out.append(f"  First 300: {content[:300].replace(chr(10),' ')}")
    out.append("")

result = "\n".join(out)
print(result)

encoded = base64.b64encode(result.encode()).decode()
path = "scripts/news-diag-result.txt"
try:
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
    with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
except: sha = None
payload = {"message": "diag: jina raw debug [skip ci]", "content": encoded}
if sha: payload["sha"] = sha
req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
    data=json.dumps(payload).encode(), method="PUT",
    headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
with urllib.request.urlopen(req) as r: print(f"Saved: {r.status}")
