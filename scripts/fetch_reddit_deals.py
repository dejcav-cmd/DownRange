#!/usr/bin/env python3
"""
Reddit deals fetcher — r/gundeals hot feed → Sanity gunDeal docs.
Auth: Reddit OAuth app-only (REDDIT_CLIENT_ID + REDDIT_CLIENT_SECRET).
      Falls back to direct RSS with browser UA if OAuth creds are absent.
Images: extract product name from title, Bing image search, validate dimensions,
upload to Sanity CDN. Wrong image = no image (never use generic stock photos).
"""
import os, json, urllib.request, urllib.parse, re, time, hashlib, base64
import html as html_mod
from datetime import datetime, timezone
from xml.etree import ElementTree as ET

# ── Config ────────────────────────────────────────────────────────────────────
SANITY_TOKEN    = os.environ.get('SANITY_TOKEN', '').replace('ST=', '').strip()
PROJECT         = 'vbnsqnkg'
BASE            = f'https://{PROJECT}.api.sanity.io/v2024-01-01/data'
H_READ          = {'Authorization': f'Bearer {SANITY_TOKEN}'}
H_WRITE         = {'Authorization': f'Bearer {SANITY_TOKEN}', 'Content-Type': 'application/json'}

REDDIT_CLIENT_ID     = os.environ.get('REDDIT_CLIENT_ID', '').strip()
REDDIT_CLIENT_SECRET = os.environ.get('REDDIT_CLIENT_SECRET', '').strip()
GH_PAT          = os.environ.get('GH_PAT', '').strip()
RESULTS_FILE    = 'scripts/feed-result-reddit-deals.txt'

log_lines = []
def log(msg): print(msg); log_lines.append(msg)

# ── Sanity helpers ────────────────────────────────────────────────────────────
def sanity_query(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}&returnQuery=false'
    req = urllib.request.Request(url, headers=H_READ)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result', [])

def sanity_mutate(mutations):
    url = f'{BASE}/mutate/production?returnDocuments=false'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers=H_WRITE, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# ── Reddit OAuth ──────────────────────────────────────────────────────────────
def get_reddit_oauth_token():
    """Get app-only OAuth token using client credentials."""
    creds = base64.b64encode(f'{REDDIT_CLIENT_ID}:{REDDIT_CLIENT_SECRET}'.encode()).decode()
    req = urllib.request.Request(
        'https://www.reddit.com/api/v1/access_token',
        data=b'grant_type=client_credentials',
        method='POST',
        headers={
            'User-Agent': 'DownRangeBot/2.0 by /u/downrangeco',
            'Authorization': f'Basic {creds}',
            'Content-Type': 'application/x-www-form-urlencoded',
        }
    )
    with urllib.request.urlopen(req, timeout=15) as r:
        data = json.loads(r.read())
    token = data.get('access_token')
    if not token:
        raise ValueError(f'No access_token in response: {data}')
    return token

def fetch_reddit_json_oauth(token):
    """Fetch r/gundeals hot posts via OAuth JSON API."""
    req = urllib.request.Request(
        'https://oauth.reddit.com/r/gundeals/hot?limit=100&raw_json=1',
        headers={
            'User-Agent': 'DownRangeBot/2.0 by /u/downrangeco',
            'Authorization': f'Bearer {token}',
        }
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return json.loads(r.read())

def fetch_reddit_rss_direct():
    """Fallback: direct RSS fetch with browser UA (works if GHA IPs not blocked)."""
    req = urllib.request.Request(
        'https://www.reddit.com/r/gundeals/hot.rss?limit=100',
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
        }
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        return r.read().decode('utf-8', errors='replace')

# ── Parse JSON API response ───────────────────────────────────────────────────
def parse_oauth_json(data):
    """Parse r/gundeals JSON API response into list of post dicts."""
    posts = []
    children = data.get('data', {}).get('children', [])
    for child in children:
        p = child.get('data', {})
        post_id = p.get('id', '')
        if not post_id:
            continue
        title = html_mod.unescape(p.get('title', '')).strip()
        if not title or '[Meta]' in title or '[Discussion]' in title:
            continue
        # Skip non-deal posts
        if re.search(r'\b(discussion|meta|weekly|monthly|question|help|looking for)\b', title, re.I):
            continue
        if not re.search(r'\$\d|%\s*off|free ship|deal|sale|oos', title, re.I):
            continue
        # Prefer external URL over reddit post URL
        url = p.get('url', '') or f"https://reddit.com{p.get('permalink','')}"
        if 'reddit.com' in url and p.get('url'):
            url = p['url']  # direct product link
        flair = (p.get('link_flair_text') or '').lower()
        created = p.get('created_utc', time.time())
        # Skip WTS/WTB posts
        if re.search(r'\b(WTS|WTB|WTT|selling|ISO)\b', title, re.I):
            continue
        posts.append({'id': post_id, 'title': title, 'url': url, 'flair': flair, 'created': created})
    return posts

# ── Parse RSS response ────────────────────────────────────────────────────────
def unescape(s): return html_mod.unescape(s) if s else s

def parse_rss(raw):
    """Parse RSS XML into list of post dicts."""
    posts = []
    entries = re.split(r'<entry[^>]*>', raw)[1:]
    for block in entries:
        post_id = ''
        idm = re.search(r'<id[^>]*>([^<]+)</id>', block)
        if idm:
            m = re.search(r'comments/([a-z0-9]+)/', idm.group(1))
            if m: post_id = m.group(1)
        if not post_id: continue

        titlem = re.search(r'<title[^>]*>([^<]+)</title>', block)
        title = unescape(titlem.group(1)).strip() if titlem else ''
        if not title or '[Meta]' in title or '[Discussion]' in title: continue

        link = ''
        lhm = re.search(r'<link[^>]+href="([^"]+)"', block, re.I)
        ltm = re.search(r'<link[^>]*>([^<]+)</link>', block, re.I)
        if lhm:   link = unescape(lhm.group(1))
        elif ltm: link = unescape(ltm.group(1))
        if not link: continue

        deal_url = link
        reddit_m = re.search(r'reddit\.com/r/[^/]+/comments/([a-z0-9]+)/', link, re.I)
        if reddit_m:
            content_m = re.search(r'<content[^>]*>(.*?)</content>', block, re.DOTALL)
            if content_m:
                hm = re.search(r'href="(https?://(?!(?:www\.)?reddit\.com)[^"]+)"', content_m.group(1))
                if hm: deal_url = unescape(hm.group(1))

        if re.search(r'\b(discussion|meta|weekly|monthly|question|help|looking for)\b', title, re.I): continue
        if not re.search(r'\$\d|%\s*off|free ship|deal|sale|oos', title, re.I): continue

        flair_m = re.search(r'\[([^\]]+)\]', title)
        flair_lc = flair_m.group(1).lower() if flair_m else ''

        created = time.time()
        cm = re.search(r'<published[^>]*>([^<]+)</published>', block)
        if cm:
            try:
                created = datetime.fromisoformat(cm.group(1).replace('Z', '+00:00')).timestamp()
            except: pass

        if re.search(r'\b(WTS|WTB|WTT|selling|ISO)\b', title, re.I): continue
        posts.append({'id': post_id, 'title': title, 'url': deal_url, 'flair': flair_lc, 'created': created})
    return posts

# ── Product name extraction ───────────────────────────────────────────────────
def extract_product_name(title):
    """Strip price/promo/code noise, return the core product name for image search."""
    clean = title
    clean = re.sub(r'^\[[^\]]+\]\s*', '', clean)
    clean = re.sub(r'\$[\d,]+(?:\.\d{2})?', '', clean)
    clean = re.sub(r'\b(code:?\s*\w+|use code \w+|promo pack|promo code \w+)\b', '', clean, flags=re.I)
    clean = re.sub(r'\+\s*(free ship\w*|no tax\s+\w+(\s+\w+)?)\b.*', '', clean, flags=re.I)
    clean = re.sub(r'\b(no code needed|in stock|oos|[Ff][Ss][Ss]|free shipping|in various lengths?|w/\(?\d+\)?\s*\w+)\b.*', '', clean, flags=re.I)
    clean = re.sub(r'\s+for\s+\$.*', '', clean, flags=re.I)
    clean = re.sub(r'\s*[-–]\s*\$.*', '', clean)
    clean = re.sub(r'\s+', ' ', clean).strip().rstrip(',.-')
    return clean[:100]

# ── Image search + validation ─────────────────────────────────────────────────
def search_and_validate_image(product_name):
    """
    Bing image search for product_name. Returns validated image bytes or None.
    Query anchored with brand/model terms — never generic stock terms.
    Rejects: too small, wrong aspect ratio (banners/logos), generic stock photos.
    """
    query = f'"{product_name}" product'
    encoded = urllib.parse.quote(query)
    search_url = f"https://www.bing.com/images/search?q={encoded}&first=1&count=10&qft=+filterui:photo-photo"

    try:
        req = urllib.request.Request(search_url, headers={
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
            "Accept": "text/html,application/xhtml+xml",
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.bing.com/",
        })
        with urllib.request.urlopen(req, timeout=12) as r:
            page = r.read().decode("utf-8", errors="replace")
    except Exception as e:
        log(f"    Bing search failed: {e}")
        return None

    img_urls = [html_mod.unescape(u) for u in re.findall(r'"murl":"([^"]+)"', page)]

    for img_url in img_urls[:8]:
        if not re.search(r'\.(jpg|jpeg|png|webp)(\?|$)', img_url, re.I):
            continue
        if any(d in img_url for d in ['shutterstock', 'getty', 'istock', 'alamy', 'dreamstime', 'stock.adobe', '123rf', 'depositphotos']):
            continue

        try:
            req2 = urllib.request.Request(img_url, headers={
                "User-Agent": "Mozilla/5.0",
                "Referer": "https://www.bing.com"
            })
            with urllib.request.urlopen(req2, timeout=8) as r:
                data = r.read()
        except:
            continue

        if len(data) < 15000:
            continue

        b = bytearray(data)
        w, h = 0, 0
        try:
            if b[0] == 0x89 and b[1] == 0x50:  # PNG
                w = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19]
                h = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23]
            elif b[0] == 0xFF and b[1] == 0xD8:  # JPEG
                i = 2
                while i < len(b) - 9:
                    if b[i] != 0xFF: i += 1; continue
                    mk = b[i + 1]
                    if mk in (0xC0, 0xC1, 0xC2):
                        h = (b[i + 5] << 8) | b[i + 6]
                        w = (b[i + 7] << 8) | b[i + 8]
                        break
                    seg = (b[i + 2] << 8) | b[i + 3]
                    i += 2 + seg
        except:
            pass

        if w < 300 or h < 200:
            continue
        if w > 0 and h > 0 and (w / h > 3.5 or h / w > 3.5):
            continue

        return data

    return None

def upload_to_sanity(img_data, deal_id):
    """Upload image bytes to Sanity CDN, return CDN URL."""
    fname = f"reddit-deal-{deal_id[-8:]}.jpg"
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={fname}"
    req = urllib.request.Request(url, data=img_data, method='POST', headers={
        'Authorization': f'Bearer {SANITY_TOKEN}',
        'Content-Type': 'image/jpeg',
        'Content-Disposition': f'attachment; filename={fname}',
    })
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read()).get('url')
    except:
        return None

# ── Flair / category mapping ──────────────────────────────────────────────────
FLAIR_MAP = {
    'handgun': 'handgun', 'pistol': 'handgun', 'revolver': 'handgun',
    'rifle': 'rifle', 'ar': 'rifle', 'ak': 'rifle', 'carbine': 'rifle',
    'shotgun': 'shotgun',
    'ammo': 'ammo', 'ammunition': 'ammo',
    'optic': 'optic', 'scope': 'optic', 'red dot': 'optic',
    'suppressor': 'suppressor', 'silencer': 'suppressor',
    'gear': 'accessories', 'accessory': 'accessories', 'accessories': 'accessories',
    'nfa': 'nfa',
}

def map_flair(flair_lc):
    for k, v in FLAIR_MAP.items():
        if k in flair_lc: return v
    return None

def detect_category(title):
    tl = title.lower()
    if re.search(r'\bpistol|handgun|glock|sig|1911|2011|p365|hellcat|shield\b', tl): return 'handgun'
    if re.search(r'\brifle|ar-?15|ak-?47|carbine|bolt action\b', tl): return 'rifle'
    if re.search(r'\bshotgun|mossberg|remington 870|benelli\b', tl): return 'shotgun'
    if re.search(r'\bammo|ammunition|rounds?|gr grain\b', tl): return 'ammo'
    if re.search(r'\bscope|optic|red dot|eotech|aimpoint|vortex|trijicon\b', tl): return 'optic'
    if re.search(r'\bsuppressor|silencer\b', tl): return 'suppressor'
    return 'accessories'

def extract_price(title):
    m = re.search(r'\$([\d,]+(?:\.\d{2})?)', title)
    return f"${m.group(1)}" if m else None

def extract_store(title):
    stores = ['brownells', 'palmetto', 'psa', 'primary arms', 'kygunco', 'opticsplanet',
              'grabagun', 'midwayusa', 'cabelas', 'bass pro', 'sportsmans warehouse',
              'sgammo', 'lucky gunner', 'cheaper than dirt', 'aim surplus', 'buds gun shop']
    tl = title.lower()
    for s in stores:
        if s in tl: return s.title()
    return None

# ── Load existing deal IDs for dedup ─────────────────────────────────────────
log("Loading existing Reddit deal IDs...")
existing_docs = sanity_query(
    '*[_type=="gunDeal" && (source=="reddit" || source=="r/gundeals")] | order(_createdAt desc) [0...500]'
    '{ "id": tags[@ match "reddit:*"][0] }'
)
existing_ids = set()
for d in (existing_docs or []):
    tag = d.get('id', '')
    if tag.startswith('reddit:'):
        existing_ids.add(tag[7:])
log(f"  {len(existing_ids)} existing Reddit deal IDs loaded")

# ── Fetch r/gundeals ─────────────────────────────────────────────────────────
posts = []
fetch_method = 'unknown'

if REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET:
    log("Fetching via Reddit OAuth (JSON API)...")
    try:
        token = get_reddit_oauth_token()
        log(f"  OAuth token acquired")
        data = fetch_reddit_json_oauth(token)
        posts = parse_oauth_json(data)
        fetch_method = 'oauth-json'
        log(f"  {len(posts)} candidate posts via OAuth")
    except Exception as e:
        log(f"  OAuth fetch failed: {e} — falling back to direct RSS")
        fetch_method = 'rss-fallback'

if not posts:
    log("Fetching via direct Reddit RSS...")
    try:
        raw = fetch_reddit_rss_direct()
        log(f"  RSS fetched — {len(raw)} bytes")
        posts = parse_rss(raw)
        fetch_method = 'rss-direct'
        log(f"  {len(posts)} candidate posts via RSS")
    except Exception as e:
        log(f"  RSS fetch failed: {e}")
        log("FATAL: No Reddit data source succeeded")
        # Write failure log before exiting
        result_text = '\n'.join(log_lines)
        try:
            encoded = base64.b64encode(result_text.encode()).decode()
            path = RESULTS_FILE
            api = f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}"
            try:
                req = urllib.request.Request(api, headers={'Authorization': f'Bearer {GH_PAT}', 'Accept': 'application/vnd.github.v3+json'})
                with urllib.request.urlopen(req) as r: sha = json.load(r)['sha']
            except: sha = None
            payload = {'message': 'fix: reddit deals fetch — FAILED [skip ci]', 'content': encoded}
            if sha: payload['sha'] = sha
            req = urllib.request.Request(api, data=json.dumps(payload).encode(), method='PUT',
                headers={'Authorization': f'Bearer {GH_PAT}', 'Content-Type': 'application/json'})
            with urllib.request.urlopen(req) as r: pass
        except Exception as log_err:
            print(f"Result save failed: {log_err}")
        exit(1)

log(f"Fetch method: {fetch_method} | {len(posts)} candidate posts")

# ── Build mutations ───────────────────────────────────────────────────────────
mutations = []
skipped = 0
added = 0

for post in posts:
    if post['id'] in existing_ids:
        skipped += 1
        continue

    existing_ids.add(post['id'])
    category = map_flair(post['flair']) or detect_category(post['title'])
    price = extract_price(post['title'])
    store = extract_store(post['title']) or 'r/gundeals'
    clean_title = re.sub(r'^\[[^\]]+\]\s*', '', post['title'])[:200]

    mutations.append({
        'create': {
            '_type':       'gunDeal',
            'title':       clean_title,
            'externalUrl': post['url'],
            'source':      'reddit',
            'store':       store,
            'price':       price,
            'category':    category,
            'summary':     ' · '.join(filter(None, [price, store, 'r/gundeals'])),
            'imageUrl':    None,
            'approved':    True,
            'publishedAt': datetime.fromtimestamp(post['created'], tz=timezone.utc).isoformat(),
            'tags':        list(filter(None, ['reddit', 'r/gundeals', f'reddit:{post["id"]}', category, post['flair'] or 'deal'])),
        }
    })
    added += 1

log(f"  {added} new deals to add, {skipped} skipped")

# ── Find product images ───────────────────────────────────────────────────────
imgs_found = 0
for mut in mutations:
    doc = mut['create']
    product_name = extract_product_name(doc['title'])
    log(f"  Searching image for: {product_name[:60]}")

    img_data = search_and_validate_image(product_name)
    if img_data:
        cdn_url = upload_to_sanity(img_data, hashlib.md5(doc['title'].encode()).hexdigest()[:8])
        if cdn_url:
            doc['imageUrl'] = cdn_url
            imgs_found += 1
            log(f"    ✓ uploaded to CDN")
        else:
            log(f"    - CDN upload failed, no image")
    else:
        log(f"    - no valid image found")

    time.sleep(0.5)

log(f"Images found: {imgs_found}/{len(mutations)}")

# ── Write to Sanity ───────────────────────────────────────────────────────────
written = 0
for i in range(0, len(mutations), 100):
    batch = mutations[i:i + 100]
    try:
        sanity_mutate(batch)
        written += len(batch)
        log(f"  Wrote batch {i // 100 + 1}: {len(batch)} docs")
    except Exception as e:
        log(f"  Batch {i // 100 + 1} failed: {e}")

log(f"\nDone: {written} deals written, {imgs_found} with images")
log(f"added={written} skipped={skipped} fetch_method={fetch_method}")

# ── Commit result ─────────────────────────────────────────────────────────────
result_text = '\n'.join(log_lines)
try:
    encoded = base64.b64encode(result_text.encode()).decode()
    path = RESULTS_FILE
    api = f"https://api.github.com/repos/dejcav-cmd/DownRange/contents/{path}"
    try:
        req = urllib.request.Request(api, headers={'Authorization': f'Bearer {GH_PAT}', 'Accept': 'application/vnd.github.v3+json'})
        with urllib.request.urlopen(req) as r: sha = json.load(r)['sha']
    except: sha = None
    payload = {'message': f'feat: reddit deals fetch — {written} new [skip ci]', 'content': encoded}
    if sha: payload['sha'] = sha
    req = urllib.request.Request(api, data=json.dumps(payload).encode(), method='PUT',
        headers={'Authorization': f'Bearer {GH_PAT}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r: pass
except Exception as e:
    print(f"Result save failed: {e}")
