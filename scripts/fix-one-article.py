import urllib.request, urllib.parse, json, os, re, time

TOKEN   = os.environ.get("SANITY_TOKEN","").replace("ST=","")
PROJECT = "vbnsqnkg"
BASE    = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data"
HEADERS = {"Authorization": f"Bearer {TOKEN}", "Content-Type": "application/json"}

def q(query):
    url = f"{BASE}/query/production?query=" + urllib.parse.quote(query)
    req = urllib.request.Request(url, headers={"Authorization": f"Bearer {TOKEN}"})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())["result"]

def mutate(mutations):
    body = json.dumps({"mutations": mutations}).encode()
    req  = urllib.request.Request(f"{BASE}/mutate/production", data=body, headers=HEADERS, method="POST")
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def fetch_og_image(page_url):
    try:
        req = urllib.request.Request(page_url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
            "Accept": "text/html,application/xhtml+xml",
        })
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read(100000).decode("utf-8", errors="ignore")
        patterns = [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        ]
        for p in patterns:
            m = re.search(p, html, re.I)
            if m:
                url = m.group(1).strip()
                if url.startswith('http') and any(ext in url.lower() for ext in ['.jpg','.jpeg','.png','.webp']):
                    return url
    except Exception as e:
        print(f"  OG fetch error: {e}")
    return None

def upload_to_sanity(image_url, label):
    try:
        req = urllib.request.Request(image_url, headers={
            "User-Agent": "Mozilla/5.0 (compatible; DownRange/1.0)",
            "Referer": "https://downrangeco.com",
        })
        with urllib.request.urlopen(req, timeout=15) as r:
            buf = r.read()
            ct  = r.headers.get("Content-Type","image/jpeg")
        if len(buf) < 5000:
            return None
        ext = "png" if "png" in ct else "webp" if "webp" in ct else "jpg"
        fname = f"{label}-{int(time.time())}.{ext}"
        up = urllib.request.Request(
            f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fname}",
            data=buf, method="POST",
            headers={"Authorization": f"Bearer {TOKEN}", "Content-Type": ct}
        )
        with urllib.request.urlopen(up, timeout=30) as r:
            data = json.loads(r.read())
        return data.get("document",{}).get("url") or data.get("url")
    except Exception as e:
        print(f"  Upload error: {e}")
    return None

def call_ai(prompt):
    """Call Anthropic API for the rewrite."""
    api_key = os.environ.get("ANTHROPIC_API_KEY","")
    url = "https://api.anthropic.com/v1/messages"
    payload = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 3500,
        "messages": [{"role": "user", "content": prompt}]
    }).encode()
    req = urllib.request.Request(url, data=payload, method="POST", headers={
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
    })
    with urllib.request.urlopen(req, timeout=60) as r:
        data = json.loads(r.read())
    return data["content"][0]["text"]

# ── Fetch article ─────────────────────────────────────────────────────────────
slug = "liberals-extend-gun-confiscation-amnesty-while-continuing-seizures"
doc  = q(f'*[_type=="canadaContent" && slug.current=="{slug}"][0]{{_id,title,body,imageUrl,sourceUrl,summary}}')

if not doc:
    print("Article not found"); exit(1)

print(f"Article: {doc.get('title','')[:70]}")
print(f"imageUrl: {doc.get('imageUrl','')[:60]}")
body  = doc.get("body","") or ""
words = len(re.sub(r'<[^>]+>',' ',body).split())
print(f"body: {len(body)} chars, {words} words")

# ── Step 1: Fix image ─────────────────────────────────────────────────────────
current_img = doc.get("imageUrl","") or ""
is_placeholder = not current_img or "thegunblog.ca" in current_img or "law.jpg" in current_img or not current_img.startswith("https://cdn.sanity.io")

if is_placeholder:
    print("\n── Fetching real OG image...")
    source_url = doc.get("sourceUrl","")
    og = fetch_og_image(source_url) if source_url else None
    
    if not og:
        # Try Pexels as fallback
        print("  No OG image from source — trying Pexels...")
        pexels_key = os.environ.get("PEXELS_API_KEY","")
        if pexels_key:
            try:
                req = urllib.request.Request(
                    "https://api.pexels.com/v1/search?query=canada+firearms+gun+law&per_page=3&orientation=landscape",
                    headers={"Authorization": pexels_key}
                )
                with urllib.request.urlopen(req, timeout=10) as r:
                    pdata = json.loads(r.read())
                photo = pdata.get("photos",[None])[0]
                if photo:
                    og = photo["src"].get("large2x") or photo["src"].get("large")
                    print(f"  Pexels hit: {og[:60]}")
            except Exception as e:
                print(f"  Pexels error: {e}")
    
    if og:
        cdn = upload_to_sanity(og, "ca-img")
        final_img = cdn or og
        mutate([{"patch": {"id": doc["_id"], "set": {"imageUrl": final_img}}}])
        print(f"  ✓ Image updated: {final_img[:60]}")
    else:
        print("  No image found — leaving current")
else:
    print(f"\nImage OK: {current_img[:60]}")

# ── Step 2: AI rewrite body ────────────────────────────────────────────────────
print(f"\n── AI rewriting body (currently {words} words)...")

src_text = re.sub(r'<[^>]+>',' ', body).strip()[:1500]

prompt = f"""You write for DownRange — a firearms and Second Amendment portal covering Canada.

Write a complete, properly structured news article about this topic for Canadian gun owners.
The article must:
- Be 500-700 words
- Have exactly 4 <h2> sections (no h1)
- Use active voice, specific facts, real names
- Sound like a Canadian gun owner who knows firearms law cold
- NOT use banned words: comprehensive, dive into, robust, seamlessly, leverage, empower, game-changer, landmark, significant development, furthermore, in conclusion, stakeholders, holistic, unpack, groundbreaking, notably

REQUIRED STRUCTURE:
<h2>[Lead — state the hardest fact]</h2>
<p>Opening paragraph with who/what/when/where.</p>
<h2>What This Means for PAL Holders</h2>
<p>Direct practical impact on licensed gun owners.</p>
<h2>Background</h2>
<p>Context: CCFR challenge, OIC history, amnesty timeline.</p>
<h2>DownRange Bottom Line</h2>
<p>Blunt one-paragraph take for the daily carrier.</p>

Source article title: {doc.get('title','')}
Source URL: {doc.get('sourceUrl','')}
Source content: {src_text}

Return ONLY valid JSON with no markdown fences:
{{"title":"original DownRange headline max 12 words","body":"<full HTML article>","summary":"2-3 sentence plain text under 250 chars"}}"""

try:
    raw    = call_ai(prompt)
    clean  = raw.replace("```json","").replace("```","").strip()
    m      = re.search(r'\{[\s\S]*\}', clean)
    parsed = json.loads(m.group(0)) if m else {}
    
    new_body  = parsed.get("body","")
    new_title = parsed.get("title","") or doc.get("title","")
    new_sum   = parsed.get("summary","") or doc.get("summary","")
    
    new_words = len(re.sub(r'<[^>]+>',' ', new_body).split())
    new_h2s   = len(re.findall(r'<h2', new_body, re.I))
    print(f"  AI output: {new_words} words, {new_h2s} h2s")
    
    if new_words >= 300 and new_h2s >= 2:
        mutate([{"patch": {"id": doc["_id"], "set": {
            "body":            new_body,
            "title":           new_title,
            "summary":         new_sum,
            "qualityReviewed": True,
        }}}])
        print(f"  ✓ Body rewritten: {new_words} words")
        print(f"  ✓ Title: {new_title[:70]}")
    else:
        print(f"  ✗ Output too short or no h2s — not saving")
except Exception as e:
    print(f"  ✗ AI rewrite failed: {e}")
    print(f"  Raw: {raw[:200] if 'raw' in dir() else 'N/A'}")

print("\nDone.")
