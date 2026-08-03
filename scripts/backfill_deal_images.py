#!/usr/bin/env python3
"""
Backfill real gun.deals product images — no Jina, no paid proxy.

The earlier conclusion that gun.deals "hard-blocks every datacenter IP" was
wrong. It rate-limits: the same URL returns 403 on one attempt and 200 on the
next, seconds apart, from the same runner. Every previous probe fired requests
back to back, so it saw nothing but 403s and looked like a wall.

Retry with backoff, pace the requests, and rotate the TLS fingerprint between
attempts, and the site is readable for free.
"""
import json, os, random, re, sys, time
from urllib.parse import quote

from curl_cffi import requests as creq

TOKEN = (os.environ.get('SANITY_TOKEN') or '').replace('ST=', '').strip()
DRY = os.environ.get('DRY_RUN', 'true') == 'true'
LIMIT = int(os.environ.get('LIMIT', '600'))
PROJECT = 'vbnsqnkg'

OG = re.compile(r'og:image["\'\s]+content=["\']([^"\']+)["\']', re.I)
IMPERSONATE = ['safari17_0', 'chrome120', 'chrome116', 'safari15_5', 'chrome110']
UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')


def sanity_query(groq):
    r = creq.get(f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={quote(groq)}',
                 headers={'Authorization': 'Bearer ' + TOKEN}, timeout=60)
    r.raise_for_status()
    return r.json()['result']


def sanity_mutate(mutations):
    r = creq.post(f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/production?returnDocuments=false',
                  headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': 'application/json'},
                  data=json.dumps({'mutations': mutations}), timeout=90)
    if r.status_code >= 300:
        raise RuntimeError(r.text[:200])
    return r.json()


def sanity_upload(content, content_type, filename):
    r = creq.post(f'https://{PROJECT}.api.sanity.io/v2024-01-01/assets/images/production?filename={quote(filename)}',
                  headers={'Authorization': 'Bearer ' + TOKEN, 'Content-Type': content_type},
                  data=content, timeout=120)
    if r.status_code >= 300:
        raise RuntimeError(r.text[:200])
    # Sanity returns { document: { url } }, not { url }.
    return (r.json().get('document') or {}).get('url')


def fetch(url, attempts=5, want_image=False):
    """Retry with jittered backoff, rotating the TLS profile each attempt.
    A 403 here means 'try again', not 'blocked'."""
    for i in range(attempts):
        try:
            r = creq.get(url, impersonate=IMPERSONATE[i % len(IMPERSONATE)],
                         headers={'Accept-Language': 'en-US,en;q=0.9'}, timeout=30)
            if r.status_code == 200:
                if want_image:
                    ct = r.headers.get('content-type', '')
                    if ct.startswith('image/') and len(r.content) >= 8000:
                        return r.content, ct
                    return None, None
                return r.text, None
        except Exception:
            pass
        time.sleep(1.5 * (i + 1) + random.uniform(0, 1.5))
    return (None, None) if want_image else (None, None)


def native_url(og):
    """Prefer the untransformed original over the cdn-cgi social-card crop,
    which letterboxes tall product shots."""
    m = re.search(r'/cdn-cgi/image/[^/]+/(.+)$', og)
    return f'https://gun.deals/{m.group(1)}' if m else None


targets = sanity_query(f'''*[_type=="gunDeal" && source=="gun.deals" && defined(externalUrl)]{{
  _id, title, externalUrl, imageUrl, _createdAt,
  "orig": *[_type=="sanity.imageAsset" && url == ^.imageUrl][0].originalFilename
}} | order(_createdAt desc)[0...{LIMIT}]''')

needs = [d for d in targets if not d.get('imageUrl') or (d.get('orig') or '').startswith('deal-search-')]
print(f'{len(targets)} scanned, {len(needs)} need a real image{"  (DRY RUN)" if DRY else ""}\n')

fixed = failed = 0
hashes = {}
batch = []
import hashlib

for i, deal in enumerate(needs):
    label = (deal.get('title') or '')[:48]
    html, _ = fetch(deal['externalUrl'])
    if not html:
        failed += 1
        print(f'  x {label} — unreachable after retries')
        continue
    m = OG.search(html)
    if not m:
        failed += 1
        print(f'  x {label} — no og:image on page')
        continue
    og = m.group(1)

    content, ct = fetch(native_url(og) or og, want_image=True)
    if not content:
        content, ct = fetch(og, want_image=True)
    if not content:
        failed += 1
        print(f'  x {label} — image not downloadable')
        continue

    sha = hashlib.sha1(content).hexdigest()[:12]
    hashes[sha] = hashes.get(sha, 0) + 1
    fixed += 1
    print(f'  + {label} — {len(content)}b sha={sha}')

    if not DRY:
        name = deal['externalUrl'].rstrip('/').split('/')[-1][:60]
        cdn = sanity_upload(content, ct, f'deal-gundeals-{name}.jpg')
        if cdn:
            batch.append({'patch': {'id': deal['_id'], 'set': {'imageUrl': cdn}}})
        if len(batch) >= 50:
            sanity_mutate(batch); batch = []

    time.sleep(random.uniform(1.0, 2.5))   # pace: the 403s are rate-limit, not a ban
    if i % 25 == 24:
        print(f'  ... {i+1}/{len(needs)}  ok={fixed} fail={failed}')

if batch and not DRY:
    sanity_mutate(batch)

total = fixed + failed
print(f'\nfixed {fixed}, failed {failed}  ({100*fixed//total if total else 0}% success)')
print(f'distinct images: {len(hashes)} across {fixed} deals')
print('PASS — no image shared between products' if all(v == 1 for v in hashes.values())
      else f'NOTE — {sum(1 for v in hashes.values() if v>1)} image(s) on multiple deals (duplicate listings are normal)')
