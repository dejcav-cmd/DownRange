#!/usr/bin/env python3
"""Fix hash-slug articles in Sanity and rewrite the specific broken article."""
import os, urllib.request, json, urllib.parse, re

SANITY_TOKEN = os.environ['SANITY_TOKEN']
PROJECT = 'vbnsqnkg'
DATASET = 'production'
ADMIN_KEY = os.environ.get('ADMIN_KEY', '')

def sanity_query(groq):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/query/{DATASET}?query={urllib.parse.quote(groq)}"
    req = urllib.request.Request(url, headers={'Authorization': f'Bearer {SANITY_TOKEN}'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())['result']

def sanity_mutate(mutations):
    url = f"https://{PROJECT}.api.sanity.io/v2024-01-01/data/mutate/{DATASET}"
    req = urllib.request.Request(url, 
        data=json.dumps({'mutations': mutations}).encode(),
        headers={'Authorization': f'Bearer {SANITY_TOKEN}', 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req) as r:
        return json.loads(r.read())

def is_hash_slug(slug):
    return bool(re.match(r'^[a-z]+-[a-f0-9]{20,}$', slug or ''))

def build_slug(title, _id):
    raw = re.sub(r'[^a-z0-9]+', '-', (title or '').lower()).strip('-')[:80]
    suffix = re.sub(r'^[a-z]+-', '', _id or '')[:6] or 'fixed'
    return f"{raw}-{suffix}" if raw else f"article-{suffix}"

# 1. Find and fix all hash-slug articles
print("=== SCANNING FOR HASH-SLUG ARTICLES ===")
articles = sanity_query(
    '*[_type=="newsArticle" && defined(slug.current) && editorLocked != true]'
    '| order(_createdAt desc) [0...500]'
    '{_id, title, sourceTitle, "slugCurrent": slug.current}'
)
bad = [a for a in articles if is_hash_slug(a.get('slugCurrent'))]
print(f"Found {len(bad)} hash-slug articles out of {len(articles)} checked")

fixed = 0
for art in bad:
    new_slug = build_slug(art.get('title') or art.get('sourceTitle'), art['_id'])
    try:
        sanity_mutate([{'patch': {'id': art['_id'], 'set': {'slug': {'_type': 'slug', 'current': new_slug}}}}])
        print(f"  FIXED: {art['_id']} → {new_slug}")
        fixed += 1
    except Exception as e:
        print(f"  ERROR: {art['_id']}: {e}")

print(f"Fixed {fixed}/{len(bad)} hash-slug articles")

# 2. Trigger rewrite of the specific broken article
BAD_ID = 'news-eed497e6be7af0dc1180944d6c718f95'
print(f"\n=== TRIGGERING REWRITE OF {BAD_ID} ===")
try:
    url = 'https://downrangeco.com/api/admin/backfill-articles'
    req = urllib.request.Request(url,
        data=json.dumps({'types':['newsArticle'],'singleId':BAD_ID,'force':True}).encode(),
        headers={'x-admin-key': ADMIN_KEY, 'Content-Type': 'application/json'})
    with urllib.request.urlopen(req, timeout=120) as r:
        result = json.loads(r.read())
    print('Rewrite result:', json.dumps(result)[:300])
except Exception as e:
    print(f'Rewrite error: {e}')
