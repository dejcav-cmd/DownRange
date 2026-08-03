#!/usr/bin/env python3
"""
Validate the deal image backfill.

The failure this whole thread is about was invisible for days because nobody
checked whether the stored images were actually the right products. These
checks are written to catch that class of problem, not just "did the job run".
"""
import hashlib, io, json, os, re, sys
from collections import Counter
from urllib.parse import quote

from curl_cffi import requests as creq

TOKEN = (os.environ.get('SANITY_TOKEN') or '').replace('ST=', '').strip()
PROJECT = 'vbnsqnkg'
fails = []


def q(groq):
    r = creq.get(f'https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/production?query={quote(groq)}',
                 headers={'Authorization': 'Bearer ' + TOKEN}, timeout=90)
    r.raise_for_status()
    return r.json()['result']


def check(name, ok, detail=''):
    print(f'  [{"PASS" if ok else "FAIL"}] {name}{"  — " + detail if detail else ""}')
    if not ok:
        fails.append(name)


deals = q('''*[_type=="gunDeal" && source=="gun.deals"] | order(_createdAt desc)[0...600]{
  _id, title, externalUrl, imageUrl, approved, _createdAt,
  "orig": *[_type=="sanity.imageAsset" && url == ^.imageUrl][0].originalFilename,
  "dims": *[_type=="sanity.imageAsset" && url == ^.imageUrl][0].metadata.dimensions
}''')
print(f'{len(deals)} gun.deals docs examined\n')

# ── 1. No stock photos left ───────────────────────────────────────────────────
print('1. Stock photo removal')
stock = [d for d in deals if (d.get('orig') or '').startswith('deal-search-')]
check('no Pexels/Pixabay stock images remain', len(stock) == 0, f'{len(stock)} left')
for d in stock[:5]:
    print(f'        {d["title"][:60]}')

# ── 2. Coverage ───────────────────────────────────────────────────────────────
print('\n2. Coverage')
withimg = [d for d in deals if d.get('imageUrl')]
real = [d for d in deals if (d.get('orig') or '').startswith('deal-gundeals-')]
check('most deals have an image', len(withimg) >= len(deals) * 0.75,
      f'{len(withimg)}/{len(deals)} ({100*len(withimg)//max(len(deals),1)}%)')
print(f'        {len(real)} carry a freshly scraped gun.deals image')

# ── 3. Images are not shared between different products ───────────────────────
print('\n3. Image uniqueness')
counts = Counter(d['imageUrl'] for d in withimg)
shared = {u: n for u, n in counts.items() if n > 1}
worst = sorted(shared.items(), key=lambda kv: -kv[1])[:5]
check('no image used by more than 3 deals', all(n <= 3 for n in counts.values()),
      f'worst: {worst[0][1]}x' if worst else 'all unique')
for url, n in worst:
    titles = [d['title'][:44] for d in withimg if d['imageUrl'] == url][:3]
    print(f'        {n}x  {" | ".join(titles)}')

# ── 4. The image genuinely came from THAT product's page ──────────────────────
# The uploader names each asset deal-gundeals-<product-slug>. If that slug does
# not match the deal's own externalUrl slug, the image belongs to another deal.
print('\n4. Image provenance (asset filename vs deal URL slug)')
mismatch = []
for d in real:
    slug = d['externalUrl'].rstrip('/').split('/')[-1][:60].lower()
    orig = (d['orig'] or '').lower()
    if slug and slug[:30] not in orig:
        mismatch.append(d)
check('every scraped image traces to its own product page', not mismatch,
      f'{len(mismatch)} mismatched')
for d in mismatch[:5]:
    print(f'        {d["title"][:44]} :: {d["orig"]}')

# ── 5. Dimensions obey the image rules ────────────────────────────────────────
print('\n5. Dimensions')
bad = []
for d in real:
    dm = d.get('dims') or {}
    w, h = dm.get('width'), dm.get('height')
    if not w or not h:
        bad.append((d, 'no dimensions')); continue
    if w < 200 or h < 200: bad.append((d, f'{w}x{h} too small'))
    elif w / h > 8: bad.append((d, f'{w}x{h} strip/banner'))
    elif h / w > 3: bad.append((d, f'{w}x{h} extreme portrait'))
check('all images pass the size/aspect rules', not bad, f'{len(bad)} violations')
for d, why in bad[:5]:
    print(f'        {d["title"][:44]} — {why}')

# ── 6. URLs actually resolve ──────────────────────────────────────────────────
print('\n6. Live URL check (sample of 15)')
import random
sample = random.sample(real, min(15, len(real))) if real else []
broken = []
for d in sample:
    try:
        r = creq.get(d['imageUrl'], timeout=25)
        if r.status_code != 200 or not r.headers.get('content-type', '').startswith('image/'):
            broken.append((d, r.status_code))
    except Exception as e:
        broken.append((d, type(e).__name__))
check('sampled image URLs return a real image', not broken, f'{len(broken)} broken')

# ── 7. Homepage query returns populated deals ─────────────────────────────────
print('\n7. Homepage query')
home = q('''*[_type=="gunDeal" && approved==true && defined(imageUrl)
  && imageUrl match "*cdn.sanity.io*"] | order(publishedAt desc)[0...12]{title, imageUrl}''')
check('homepage returns a full set of deals', len(home) >= 8, f'{len(home)} returned')
print('\n   what the homepage will show:')
for d in home[:8]:
    print(f'     {d["title"][:66]}')

print('\n' + ('ALL CHECKS PASSED' if not fails else f'FAILED: {", ".join(fails)}'))
sys.exit(1 if fails else 0)
