#!/usr/bin/env python3
"""
One-shot cleanup script:
  Phase 1: Delete all firearmRelease docs with Google News sourceUrl
  Phase 2: Find releases with null/bad imageUrl, scrape real OG image,
           patch the Sanity doc with imageUrl (CDN upload requires Sanity token write access)
"""
import os, sys, json, re, urllib.request, urllib.parse, urllib.error, time

SANITY_TOKEN  = os.environ['SANITY_TOKEN']
PROJECT_ID    = 'vbnsqnkg'
DATASET       = 'production'
API_VERSION   = '2024-01-01'
BASE_URL      = f'https://{PROJECT_ID}.api.sanity.io/v{API_VERSION}/data'

HEADERS_JSON  = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {SANITY_TOKEN}',
}
HEADERS_FORM  = {
    'Content-Type': 'application/json',
    'Authorization': f'Bearer {SANITY_TOKEN}',
}

def sanity_query(groq):
    url = f'{BASE_URL}/query/{DATASET}?query={urllib.parse.quote(groq)}&returnQuery=false'
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())['result']

def sanity_mutate(mutations):
    url = f'{BASE_URL}/mutate/{DATASET}'
    body = json.dumps({'mutations': mutations}).encode()
    req = urllib.request.Request(url, data=body, headers=HEADERS_JSON, method='POST')
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read())

def scrape_og_image(page_url):
    if not page_url:
        return None
    try:
        req = urllib.request.Request(page_url, headers={
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html,application/xhtml+xml',
        })
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode('utf-8', errors='replace')
        for pattern in [
            r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']',
            r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
            r'<meta[^>]+name=["\']twitter:image["\'][^>]+content=["\']([^"\']+)["\']',
        ]:
            m = re.search(pattern, html, re.I)
            if m:
                url = m.group(1).strip()
                if url.startswith('//'):
                    url = 'https:' + url
                # Reject bad patterns
                bad = re.search(r'googleusercontent|news\.google|gstatic\.com/news|logo|favicon|1x1|pixel|spacer', url, re.I)
                has_ext = re.search(r'\.(jpg|jpeg|png|webp)', url, re.I)
                if not bad and has_ext:
                    return url
    except Exception as e:
        print(f'  scrape error: {e}')
    return None

# ── PHASE 1 ──────────────────────────────────────────────────────────────────
print('=== Phase 1: Delete Google News releases ===')
docs = sanity_query('*[_type=="firearmRelease" && (sourceUrl match "*news.google.com*" || sourceUrl match "*google.com/rss*")] {_id,title}')
print(f'Found {len(docs)} Google News releases')

if docs:
    mutations = [{'delete': {'id': d['_id']}} for d in docs]
    # Batch 50 at a time
    for i in range(0, len(mutations), 50):
        batch = mutations[i:i+50]
        result = sanity_mutate(batch)
        print(f'  Deleted batch {i//50+1}: {len(batch)} docs')
    print(f'Deleted titles:')
    for d in docs:
        print(f'  - {d.get("title","?")[:70]}')
else:
    print('  None found - already clean')

# ── PHASE 2 ──────────────────────────────────────────────────────────────────
print()
print('=== Phase 2: Fix missing/bad images on releases ===')
bad_img_docs = sanity_query('''*[_type=="firearmRelease"
  && !defined(heroImage)
  && defined(sourceUrl)
  && (
    !defined(imageUrl)
    || imageUrl == ""
    || imageUrl match "*googleusercontent.com*"
    || imageUrl match "*news.google.com*"
    || imageUrl match "*gstatic.com*"
  )
] | order(publishedAt desc) [0...60] {_id, brand, model, title, sourceUrl, imageUrl}''')

print(f'Found {len(bad_img_docs)} releases with bad/missing images')
fixed = 0
skipped = 0

for rel in bad_img_docs:
    label = f"{rel.get('brand','?')} {rel.get('model', rel.get('title','?'))}"
    print(f'  Fixing: "{label[:55]}"')
    print(f'    sourceUrl: {(rel.get("sourceUrl") or "")[:80]}')

    og_url = scrape_og_image(rel.get('sourceUrl'))
    if og_url:
        # Patch imageUrl (heroImage CDN upload requires binary upload, just store the URL)
        mutation = {'patch': {'id': rel['_id'], 'set': {'imageUrl': og_url}}}
        try:
            sanity_mutate([mutation])
            print(f'    ✓ imageUrl set: {og_url[:80]}')
            fixed += 1
        except Exception as e:
            print(f'    ✗ patch failed: {e}')
            skipped += 1
    else:
        print(f'    ✗ no image found at source')
        skipped += 1

    time.sleep(0.5)

print()
print(f'=== Summary ===')
print(f'Phase 1: {len(docs)} Google News releases deleted')
print(f'Phase 2: {fixed} images fixed, {skipped} skipped')
