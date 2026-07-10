"""
fetch_reddit_deals.py
─────────────────────
Fetches r/gundeals hot RSS feed and writes new deals to Sanity.
Runs from GitHub Actions (IPs not blocked by Reddit's Cloudflare).

Auth: SANITY_API_TOKEN env var (set in workflow from SANITY_TOKEN secret).
Log:  Written to scripts/feed-result-reddit-deals.txt (committed by workflow step).
"""

import os, json, urllib.request, urllib.parse, re, time, hashlib
from datetime import datetime, timezone, timedelta
from email.utils import parsedate_to_datetime

LOG = 'scripts/feed-result-reddit-deals.txt'
open(LOG, 'w').close()

def log(msg):
    print(msg, flush=True)
    with open(LOG, 'a') as f:
        f.write(msg + '\n')

# ── Sanity setup ──────────────────────────────────────────────────────────────
TOKEN = os.environ.get('SANITY_API_TOKEN', '').lstrip('ST=').strip()
BASE  = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
H_READ  = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json'}
H_WRITE = {'Authorization': f'Bearer {TOKEN}', 'Accept': 'application/json', 'Content-Type': 'application/json'}

log(f"Config: SANITY_API_TOKEN={'set (' + str(len(TOKEN)) + ' chars)' if TOKEN else 'MISSING'}")

def sanity_query(groq):
    url = f'{BASE}/query/production?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers=H_READ)
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read()).get('result', [])

def sanity_mutate(mutations):
    url = f'{BASE}/mutate/production?returnDocuments=false'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers=H_WRITE, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

# ── Category mapping ──────────────────────────────────────────────────────────
FLAIR_MAP = {
    'rifle':'rifle','rifles':'rifle',
    'handgun':'pistol','handguns':'pistol','pistol':'pistol',
    'shotgun':'shotgun','shotguns':'shotgun',
    'ammo':'ammo','ammunition':'ammo',
    'nfa':'suppressor','suppressor':'suppressor','silencer':'suppressor',
    'optic':'optic','optics':'optic','scope':'optic',
    'archery':'archery',
    'accessory':'accessory','accessories':'accessory','gear':'accessory',
}
SKIP_FLAIRS   = {'discussion','meta','weekly thread','ban appeal','mod post','ama','megathread'}
SKIP_TITLE_RE = re.compile(r'\[expired\]|\[removed\]|\[deleted\]|\bweekly\b|\bmonthly\b|\bmod post\b|\bdiscussion\b', re.I)
IMAGE_URL_RE  = re.compile(r'\.(jpg|png|gif|webp|mp4)$|youtube\.com|youtu\.be|imgur\.com\/[^a]', re.I)

def map_flair(raw=''):
    return FLAIR_MAP.get(raw.lower().strip(), None)

def detect_category(title=''):
    t = title.lower()
    if re.search(r'\bnfa\b|suppressor|silencer|form 4', t):          return 'suppressor'
    if re.search(r'\bammo\b|9mm|\.223|5\.56|\.308|7\.62|\.45|rounds|gr fmj', t): return 'ammo'
    if re.search(r'rifle|ar-?15|ak-?47|carbine|sbr|bolt.action|lever.action', t): return 'rifle'
    if re.search(r'pistol|handgun|glock|sig |beretta|1911|revolver', t): return 'pistol'
    if re.search(r'shotgun|mossberg|remington 870|benelli', t):        return 'shotgun'
    if re.search(r'scope|optic|red dot|lpvo|eotech|aimpoint|vortex|holosun', t): return 'optic'
    if re.search(r'\bbow\b|archery|broadhead|crossbow|arrow ', t):     return 'archery'
    return 'accessory'

def extract_price(title=''):
    m = re.search(r'\$[\d,]+(?:\.\d{2})?', title)
    return m.group(0) if m else ''

def extract_store(title=''):
    m = re.search(r'(?:\bat\b|[@]|from)\s+([A-Z][A-Za-z0-9 &\'.]+?)(?:\s*[\[\(]|\s*$)', title, re.I)
    if m:
        return m.group(1).strip()[:40]
    return ''

def unescape(s=''):
    named = {'amp':'&','lt':'<','gt':'>','quot':'"','apos':"'",'#39':"'",'nbsp':' '}
    s = re.sub(r'&#(\d+);', lambda m: chr(int(m.group(1))), s)
    s = re.sub(r'&([a-z0-9#]+);', lambda m: named.get(m.group(1).lower(), m.group(0)), s)
    return s.strip()

# ── Fetch RSS — try browser UA first, then OAuth if creds available ───────────
log("Fetching r/gundeals hot RSS...")

rss_url = 'https://www.reddit.com/r/gundeals/hot.rss?limit=100'
xml = None

# Attempt 1: Browser UA (works when GHA IPs aren't rate-limited)
try:
    req = urllib.request.Request(
        rss_url,
        headers={
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.9',
            'Accept-Encoding': 'identity',
        }
    )
    with urllib.request.urlopen(req, timeout=25) as r:
        raw = r.read().decode('utf-8', errors='replace')
    # Validate it's actually RSS — Reddit sometimes returns a 200 with an HTML error page
    if '<entry' in raw or '<item>' in raw:
        xml = raw
        log(f"  RSS fetched via browser UA — {len(xml)} bytes")
    else:
        log(f"  Browser UA returned non-RSS response ({len(raw)} bytes) — Reddit is blocking GHA IPs")
except Exception as e:
    log(f"  Browser UA fetch failed: {e}")

# Attempt 2: Reddit OAuth app-only (if client creds provided as secrets)
if xml is None:
    import base64 as _b64
    REDDIT_CLIENT_ID     = os.environ.get('REDDIT_CLIENT_ID', '').strip()
    REDDIT_CLIENT_SECRET = os.environ.get('REDDIT_CLIENT_SECRET', '').strip()
    if REDDIT_CLIENT_ID and REDDIT_CLIENT_SECRET:
        log("  Trying Reddit OAuth app-only flow...")
        try:
            creds = _b64.b64encode(f'{REDDIT_CLIENT_ID}:{REDDIT_CLIENT_SECRET}'.encode()).decode()
            tok_req = urllib.request.Request(
                'https://www.reddit.com/api/v1/access_token',
                data=b'grant_type=client_credentials',
                method='POST',
                headers={
                    'User-Agent': 'DownRangeBot/2.0 by /u/downrangeco',
                    'Authorization': f'Basic {creds}',
                    'Content-Type': 'application/x-www-form-urlencoded',
                }
            )
            with urllib.request.urlopen(tok_req, timeout=15) as r:
                tok_data = json.loads(r.read())
            access_token = tok_data.get('access_token')
            if not access_token:
                raise ValueError(f'No token: {tok_data}')
            log(f"  OAuth token acquired")
            api_req = urllib.request.Request(
                'https://oauth.reddit.com/r/gundeals/hot?limit=100&raw_json=1',
                headers={
                    'User-Agent': 'DownRangeBot/2.0 by /u/downrangeco',
                    'Authorization': f'Bearer {access_token}',
                }
            )
            with urllib.request.urlopen(api_req, timeout=25) as r:
                json_data = json.loads(r.read())
            log(f"  OAuth JSON fetched — {len(json_data.get('data',{}).get('children',[]))} children")
            # Convert JSON to unified post list (bypass XML parsing)
            posts_from_oauth = []
            for child in json_data.get('data', {}).get('children', []):
                p = child.get('data', {})
                post_id = p.get('id', '')
                title   = p.get('title', '').strip()
                if not post_id or not title:
                    continue
                # Use external URL if it's not a reddit.com link, else skip self posts
                url = p.get('url', '')
                if not url or 'reddit.com' in url:
                    continue
                if IMAGE_URL_RE.search(url):
                    continue
                flair = (p.get('link_flair_text') or '').lower().strip()
                if flair in SKIP_FLAIRS:
                    continue
                if SKIP_TITLE_RE.search(title):
                    continue
                created_utc = p.get('created_utc', time.time())
                posts_from_oauth.append({
                    'id': post_id, 'title': title, 'url': url,
                    'created': created_utc, 'flair': flair,
                })
            # Skip straight to dedup/mutations — set xml sentinel to skip XML parse below
            xml = '__OAUTH_POSTS__'
        except Exception as e:
            log(f"  OAuth failed: {e}")
    else:
        log("  No REDDIT_CLIENT_ID/SECRET — skipping OAuth (add secrets to enable)")

if xml is None:
    log("FATAL: All Reddit fetch methods failed — no deals fetched this run")
    raise SystemExit(1)

# ── Parse RSS (or use OAuth posts) ───────────────────────────────────────────
if xml == '__OAUTH_POSTS__':
    posts = posts_from_oauth
    log(f"  Using {len(posts)} posts from OAuth JSON API")
else:
    posts = []
    block_tag = 'item' if '<item>' in xml else 'entry'
    block_re  = re.compile(rf'<{block_tag}>([\s\S]*?)</{block_tag}>', re.I)
    now_ts    = time.time()

    for m in block_re.finditer(xml):
        if len(posts) >= 100:
            break
        block = m.group(1)

        tm = re.search(r'<title[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?</title>', block, re.I)
        if not tm:
            continue
        title = unescape(tm.group(1))
        if len(title) < 10:
            continue

        link = ''
        lhm = re.search(r'<link[^>]+href="([^"]+)"', block, re.I)
        ltm = re.search(r'<link[^>]*>([^<]+)</link>', block, re.I)
        if lhm:      link = unescape(lhm.group(1))
        elif ltm:    link = unescape(ltm.group(1))
        if not link: continue

        deal_url = link
        post_id  = ''
        reddit_m = re.search(r'reddit\.com/r/[^/]+/comments/([a-z0-9]+)/', link, re.I)
        if reddit_m:
            post_id = reddit_m.group(1)
            dm = re.search(r'<description[^>]*>([\s\S]*?)</description>', block, re.I) \
              or re.search(r'<content[^>]*>([\s\S]*?)</content>', block, re.I)
            if dm:
                decoded = unescape(dm.group(1))
                hm = re.search(r'href="(https?://(?!(?:www\.)?reddit)[^"]+)"', decoded, re.I)
                if hm:
                    deal_url = hm.group(1)
                else:
                    continue  # self post
            else:
                continue
        else:
            gm = re.search(r'<guid[^>]*>([\s\S]*?)</guid>', block, re.I)
            if gm:
                gid_m = re.search(r'comments/([a-z0-9]+)', unescape(gm.group(1)), re.I)
                if gid_m:
                    post_id = gid_m.group(1)
            if not post_id:
                post_id = hashlib.md5(deal_url.encode()).hexdigest()[:10]

        if not deal_url or 'reddit.com' in deal_url:
            continue
        if IMAGE_URL_RE.search(deal_url):
            continue

        dm2 = re.search(r'<pubDate[^>]*>([^<]+)</pubDate>', block, re.I) \
           or re.search(r'<updated[^>]*>([^<]+)</updated>', block, re.I)
        created_utc = now_ts
        if dm2:
            try:
                created_utc = parsedate_to_datetime(unescape(dm2.group(1))).timestamp()
            except Exception:
                pass

        if SKIP_TITLE_RE.search(title):
            continue
        flair_m = re.search(r'\[([^\]]+)\]', title)
        flair_lc = flair_m.group(1).lower().strip() if flair_m else ''
        if flair_lc in SKIP_FLAIRS:
            continue

        posts.append({
            'id':      post_id,
            'title':   title,
            'url':     deal_url,
            'created': created_utc,
            'flair':   flair_lc,
        })

    log(f"  Parsed {len(posts)} posts from RSS")

# ── Load existing Reddit IDs to dedup ────────────────────────────────────────
existing_docs = sanity_query('*[_type == "gunDeal" && source == "reddit"] { tags }')
existing_ids  = set()
for d in existing_docs:
    for t in (d.get('tags') or []):
        if t.startswith('reddit:'):
            existing_ids.add(t[7:])
log(f"  {len(existing_ids)} existing Reddit deal IDs in Sanity")

# ── Build mutations ───────────────────────────────────────────────────────────
now_ts    = time.time()
cutoff_ts = now_ts - 48 * 3600
mutations = []
skipped   = 0
added     = 0

for post in posts:
    title    = post['title']
    flair_lc = post.get('flair', '')

    if post['created'] < cutoff_ts:
        skipped += 1; continue
    if post['id'] in existing_ids:
        skipped += 1; continue

    existing_ids.add(post['id'])

    category = map_flair(flair_lc) or detect_category(title)
    price    = extract_price(title)
    store    = extract_store(title) or 'r/gundeals'

    summary_parts = [p for p in [price, store, '▲50', 'r/gundeals'] if p]
    clean_title   = re.sub(r'^\[[^\]]+\]\s*', '', title)[:200]

    mutations.append({
        'create': {
            '_type':       'gunDeal',
            'title':       clean_title,
            'externalUrl': post['url'],
            'source':      'reddit',
            'store':       store,
            'price':       price,
            'category':    category,
            'summary':     ' · '.join(summary_parts),
            'imageUrl':    None,
            'approved':    True,
            'publishedAt': datetime.fromtimestamp(post['created'], tz=timezone.utc).isoformat(),
            'tags':        list(filter(None, [
                'reddit', 'r/gundeals', f'reddit:{post["id"]}',
                category, flair_lc or 'deal',
            ])),
        }
    })
    added += 1

log(f"  {added} new deals to add, {skipped} skipped")

# ── Write to Sanity in batches ────────────────────────────────────────────────
for i in range(0, len(mutations), 100):
    batch = mutations[i:i+100]
    try:
        sanity_mutate(batch)
        log(f"  Wrote batch {i//100 + 1}: {len(batch)} docs")
    except Exception as e:
        log(f"  ERROR batch {i//100 + 1}: {e}")
    time.sleep(0.15)

# ── Expire stale Reddit deals (>5 days old) ───────────────────────────────────
cutoff_iso = datetime.fromtimestamp(now_ts - 5 * 86400, tz=timezone.utc).isoformat()
stale = sanity_query(
    f'*[_type=="gunDeal" && source=="reddit" && approved==true && publishedAt < "{cutoff_iso}"]{{_id}}'
)
if stale:
    exp_muts = [{'patch': {'id': d['_id'], 'set': {'approved': False}}} for d in stale]
    for i in range(0, len(exp_muts), 100):
        try:
            sanity_mutate(exp_muts[i:i+100])
        except Exception as e:
            log(f"  EXPIRE ERROR: {e}")
    log(f"  Expired {len(stale)} stale Reddit deals")
else:
    log("  No stale deals to expire")

log(f"\nDONE: added={added} skipped={skipped} expired={len(stale) if stale else 0}")
