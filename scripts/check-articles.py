import urllib.request, urllib.parse, json, os, sys

TOKEN = os.environ.get('SANITY_TOKEN','')
BASE  = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(groq):
    url = f'{BASE}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())['result']

lines = []
def log(s):
    print(s)
    lines.append(s)

slugs = [
    'virginia-bill-sponsor-attacks-prosecutors-refusing-to-enforce-his-gun-ban-e2f031',
    'vortex-hunter-constantine-collaboration-benefits-saf-s-legal-efforts-c9b513'
]

for slug in slugs:
    doc = q(f'*[_type=="newsArticle" && slug.current=="{slug}"][0]{{ _id, title, imageUrl, heroImage{{asset->{{url}}}}, approved, source, externalUrl }}')
    log(f"\n--- {slug[:50]} ---")
    if doc:
        log(f"  _id:       {doc.get('_id')}")
        log(f"  approved:  {doc.get('approved')}")
        log(f"  imageUrl:  {doc.get('imageUrl') or 'NULL'}")
        hi = doc.get('heroImage')
        log(f"  heroImage: {hi.get('asset',{}).get('url') if hi else 'NULL'}")
        log(f"  source:    {doc.get('source')}")
        log(f"  externalUrl: {(doc.get('externalUrl') or 'NULL')[:80]}")
    else:
        log("  NOT FOUND")

total  = q('count(*[_type=="newsArticle" && approved==true && defined(slug.current)])')
no_img = q('count(*[_type=="newsArticle" && approved==true && defined(slug.current) && !defined(heroImage.asset) && (!defined(imageUrl) || imageUrl=="")])')
log(f"\n=== IMAGE AUDIT ===")
log(f"Total approved: {total}")
log(f"No image at all: {no_img}")

sample = q('*[_type=="newsArticle" && approved==true && defined(slug.current) && !defined(heroImage.asset) && (!defined(imageUrl)||imageUrl=="")] | order(publishedAt desc) [0..9] { _id, title, externalUrl, source, slug }')
log(f"\nRecent imageless articles ({len(sample)}):")
for a in sample:
    log(f"  /news/{a.get('slug',{}).get('current','')} [{a.get('source','')}]")
    log(f"    {a.get('title','')[:70]}")
    log(f"    externalUrl: {(a.get('externalUrl') or 'none')[:80]}")

result = '\n'.join(lines)
with open('scripts/article-check.txt', 'w') as f:
    f.write(result + '\n')
