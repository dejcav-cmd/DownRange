#!/usr/bin/env python3
"""Cleanup: delete Google News firearmRelease docs + fix bad images via direct Sanity API"""
import os, sys, json, re, urllib.request, urllib.parse, time

SANITY_TOKEN = os.environ.get('SANITY_TOKEN', '')
if not SANITY_TOKEN:
    print('ERROR: SANITY_TOKEN not set', file=sys.stderr)
    sys.exit(1)

PROJECT_ID = 'vbnsqnkg'
DATASET    = 'production'
BASE_URL   = f'https://{PROJECT_ID}.api.sanity.io/v2024-01-01/data'

def sanity_query(groq):
    url = f'{BASE_URL}/query/{DATASET}?query={urllib.parse.quote(groq)}&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            body = r.read()
            return json.loads(body)['result']
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'Sanity query HTTP {e.code}: {body[:200]}', file=sys.stderr)
        raise
    except Exception as e:
        print(f'Sanity query error: {e}', file=sys.stderr)
        raise

def sanity_mutate(mutations):
    url  = f'{BASE_URL}/mutate/{DATASET}'
    body = json.dumps({'mutations': mutations}).encode()
    req  = urllib.request.Request(url, data=body,
                                   headers={'Content-Type': 'application/json',
                                            'Authorization': f'Bearer {SANITY_TOKEN}'},
                                   method='POST')
    try:
        with urllib.request.urlopen(req, timeout=20) as r:
            return json.loads(r.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f'Sanity mutate HTTP {e.code}: {body[:200]}', file=sys.stderr)
        raise

def scrape_og(page_url):
    if not page_url:
        return None
    try:
        req = urllib.request.Request(page_url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
        })
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode('utf-8', errors='replace')
        for pat in [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        ]:
            m = re.search(pat, html, re.I)
            if m:
                url = m.group(1).strip()
                if url.startswith('//'): url = 'https:' + url
                bad = re.search(r'googleusercontent|news\.google|gstatic\.com/news|/logo|favicon|1x1|pixel|spacer|\.svg', url, re.I)
                has_ext = re.search(r'\.(jpg|jpeg|png|webp)', url, re.I)
                if not bad and has_ext:
                    return url
    except Exception as e:
        print(f'    scrape error: {e}')
    return None

print('=== Phase 1: Delete Google News releases ===')
gnews_docs = sanity_query(
    '*[_type=="firearmRelease" && (sourceUrl match "*news.google.com*" || sourceUrl match "*google.com/rss*")] {_id,title,sourceUrl}'
)
print(f'Found: {len(gnews_docs)}')
if gnews_docs:
    mutations = [{'delete': {'id': d['_id']}} for d in gnews_docs]
    for i in range(0, len(mutations), 50):
        batch = mutations[i:i+50]
        sanity_mutate(batch)
    for d in gnews_docs:
        print(f'  DELETED: {d.get("title","?")[:60]}')
else:
    print('  None found — already clean')

print()
print('=== Phase 2: Fix bad/missing images ===')
bad = sanity_query(
    '''*[_type=="firearmRelease"
        && !defined(heroImage)
        && defined(sourceUrl)
        && (
          !defined(imageUrl)
          || imageUrl == ""
          || imageUrl match "*googleusercontent.com*"
          || imageUrl match "*gstatic.com*"
          || imageUrl match "*news.google.com*"
        )
    ] | order(publishedAt desc) [0...60] {_id, brand, model, title, sourceUrl, imageUrl}'''
)
print(f'Found: {len(bad)} releases with bad/missing images')
fixed = 0; skipped = 0

for rel in bad:
    label = f"{rel.get('brand','?')} {rel.get('model', rel.get('title','?'))}"
    print(f'  "{label[:50]}" — {(rel.get("sourceUrl") or "")[:70]}')
    og = scrape_og(rel.get('sourceUrl'))
    if og:
        sanity_mutate([{'patch': {'id': rel['_id'], 'set': {'imageUrl': og}}}])
        print(f'    ✓ imageUrl: {og[:80]}')
        fixed += 1
    else:
        print(f'    ✗ no image found')
        skipped += 1
    time.sleep(0.4)

print()
print(f'=== DONE ===')
print(f'Phase 1: {len(gnews_docs)} Google News releases deleted')
print(f'Phase 2: {fixed} images fixed, {skipped} skipped')
