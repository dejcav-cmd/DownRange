import urllib.request, urllib.parse, json, os

TOKEN = os.environ.get('SANITY_TOKEN','')
BASE  = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(groq):
    url = f'{BASE}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())['result']

slugs = ['virginia-bill-sponsor-attacks-prosecutors-refusing-to-enforce-his-gun-ban-e2f031',
         'vortex-hunter-constantine-collaboration-benefits-saf-s-legal-efforts-c9b513']

for slug in slugs:
    groq = f'*[_type=="newsArticle" && slug.current=="${slug}"][0]{{ _id, title, imageUrl, heroImage{{asset->{{url}}}}, approved, source, externalUrl }}'
    doc = q(groq)
    print(f"\nSlug: {slug}")
    if doc:
        print(f"  _id:       {doc.get('_id')}")
        print(f"  approved:  {doc.get('approved')}")
        print(f"  imageUrl:  {doc.get('imageUrl') or 'NULL'}")
        print(f"  heroImage: {doc.get('heroImage') or 'NULL'}")
        print(f"  source:    {doc.get('source')}")
        print(f"  externalUrl: {doc.get('externalUrl') or 'NULL'}")
    else:
        print("  NOT FOUND in Sanity")

# Also check how many articles have no images at all
total = q('count(*[_type=="newsArticle" && approved==true && defined(slug.current)])')
no_img = q('count(*[_type=="newsArticle" && approved==true && defined(slug.current) && !defined(heroImage) && !defined(imageUrl)])')
with_ext = q('count(*[_type=="newsArticle" && approved==true && defined(slug.current) && defined(externalUrl)])')
print(f"\n=== IMAGE AUDIT ===")
print(f"Total approved articles: {total}")
print(f"No heroImage AND no imageUrl: {no_img}")
print(f"Has externalUrl: {with_ext}")

# Sample 5 no-image articles with externalUrl
no_img_sample = q('*[_type=="newsArticle" && approved==true && defined(slug.current) && !defined(heroImage) && (!defined(imageUrl) || imageUrl=="")] | order(publishedAt desc) [0..4] { _id, title, externalUrl, source }')
print(f"\nSample imageless articles:")
for a in no_img_sample:
    print(f"  [{a.get('source','')}] {a.get('title','')[:55]}")
    print(f"    externalUrl: {a.get('externalUrl') or 'NULL'}")

with open('scripts/article-check.txt','w') as f:
    f.write('done')
