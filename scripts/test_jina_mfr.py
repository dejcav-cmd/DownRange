#!/usr/bin/env python3
"""Test Jina against manufacturer sites to find working image fetch strategy."""
import urllib.request, urllib.parse, re, json, os, base64
import html as html_mod

GH_PAT = os.environ.get("GH_PAT","").strip()

def jfetch(url, label):
    jina_url = f"https://r.jina.ai/{url}"
    try:
        req = urllib.request.Request(jina_url, headers={"User-Agent": "Mozilla/5.0", "Accept": "text/html"})
        with urllib.request.urlopen(req, timeout=15) as r:
            content = r.read().decode("utf-8", errors="replace")
        imgs = re.findall(r'https?://[^\s"\'<>]+\.(?:jpg|jpeg|png|webp)[^\s"\'<>]{0,100}', content, re.I)
        imgs = [html_mod.unescape(i) for i in imgs if 'logo' not in i.lower() and 'icon' not in i.lower()]
        print(f"  [{label}] HTTP OK: {len(content)} chars, {len(imgs)} images")
        for i in imgs[:3]: print(f"    {i[:90]}")
        return imgs
    except Exception as e:
        print(f"  [{label}] FAILED: {e}")
        return []

out = ["=== JINA MANUFACTURER TEST ===", ""]

print("1. Springfield Armory Kuna search")
out.append("1. Springfield Armory - Kuna search:")
imgs = jfetch("https://www.springfield-armory.com/search/?q=kuna", "SA search")
out.extend([f"  {i[:90]}" for i in imgs[:3]])

print("2. Springfield Armory Kuna product page")
out.append("2. Springfield Armory - Kuna product page:")
imgs2 = jfetch("https://www.springfield-armory.com/1911-pistols/kuna/", "SA kuna")
out.extend([f"  {i[:90]}" for i in imgs2[:3]])

print("3. Springfield Armory Romulus")
out.append("3. Springfield Armory - Romulus:")
imgs3 = jfetch("https://www.springfield-armory.com/search/?q=romulus", "SA romulus")
out.extend([f"  {i[:90]}" for i in imgs3[:3]])

print("4. SIG Sauer search")
out.append("4. SIG Sauer - P365:")
imgs4 = jfetch("https://www.sigsauer.com/search/?q=p365", "SIG search")
out.extend([f"  {i[:90]}" for i in imgs4[:3]])

print("5. Ruger search")
out.append("5. Ruger - 10/22:")
imgs5 = jfetch("https://www.ruger.com/search/index.html#q=10%2F22", "Ruger")
out.extend([f"  {i[:90]}" for i in imgs5[:3]])

result = "\n".join(out) + "\n"
print(f"\n{result}")

encoded = base64.b64encode(result.encode()).decode()
path = "scripts/news-diag-result.txt"
try:
    req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
        headers={"Authorization": f"Bearer {GH_PAT}", "Accept": "application/vnd.github.v3+json"})
    with urllib.request.urlopen(req) as r: sha = json.load(r)["sha"]
except: sha = None
payload = {"message": "diag: jina mfr test [skip ci]", "content": encoded}
if sha: payload["sha"] = sha
req = urllib.request.Request(f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}",
    data=json.dumps(payload).encode(), method="PUT",
    headers={"Authorization": f"Bearer {GH_PAT}", "Content-Type": "application/json"})
with urllib.request.urlopen(req) as r: print(f"Saved: {r.status}")
