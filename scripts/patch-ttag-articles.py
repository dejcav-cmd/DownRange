"""
Patch specific TTAG articles that can't be scraped with 
high-quality Wikimedia Commons licensed images matching their topic.
"""
import urllib.request, urllib.parse, json, os

TOKEN  = os.environ.get('SANITY_TOKEN','')
MUTATE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/mutate/production'
BASE   = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(groq):
    url = f'{BASE}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())['result']

def patch(doc_id, image_url):
    body = json.dumps({'mutations':[{'patch':{'id':doc_id,'set':{'imageUrl':image_url}}}]}).encode()
    req  = urllib.request.Request(MUTATE, data=body, method='POST', headers={
        'Authorization':f'Bearer {TOKEN}','Content-Type':'application/json'})
    with urllib.request.urlopen(req, timeout=15) as r:
        return json.loads(r.read())

# Verified Wikimedia Commons URLs - freely licensed, no hotlink restrictions
PATCHES = [
    {
        'slug': 'watson-coleman-reintroduces-hear-act-to-ban-suppressors-just-as-the-suppressor-m-da853c',
        'image': 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/73/AAC_762-SDN-6.jpg/1200px-AAC_762-SDN-6.jpg',
        'note': 'AAC suppressor - Wikimedia Commons CC-BY-SA',
    },
    {
        'slug': 'the-best-cartridges-for-suppressed-shooting-1fed0c',
        'image': 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Bullet_casings.jpg/1200px-Bullet_casings.jpg',
        'note': 'Bullet casings - Wikimedia Commons CC',
    },
    {
        'slug': 'virginia-bill-sponsor-attacks-prosecutors-refusing-to-enforce-his-gun-ban-e2f031',
        'image': 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/US_Court_of_Appeals_for_the_Fourth_Circuit_Courthouse.jpg/1200px-US_Court_of_Appeals_for_the_Fourth_Circuit_Courthouse.jpg',
        'note': '4th Circuit courthouse (Virginia) - Wikimedia Commons',
    },
]

lines = ['=== PATCH TTAG ARTICLES ===\n']

for p in PATCHES:
    doc = q(f'*[_type=="newsArticle" && slug.current=="{p["slug"]}"][0]{{_id,title,imageUrl}}')
    if not doc:
        lines.append(f'NOT FOUND: {p["slug"][:50]}')
        continue
    patch(doc['_id'], p['image'])
    lines.append(f'✓ {doc["title"][:60]}')
    lines.append(f'  → {p["image"][:80]}')
    lines.append(f'  ({p["note"]})')

result = '\n'.join(lines)
print(result)
with open('scripts/ttag-patch-result.txt','w') as f:
    f.write(result+'\n')
