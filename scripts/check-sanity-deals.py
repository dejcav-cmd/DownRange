import urllib.request, urllib.parse, json, os

TOKEN = os.environ.get('SANITY_TOKEN','')
BASE  = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(groq):
    url = f'{BASE}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())['result']

total   = q('count(*[_type=="gunDeal"])')
approved= q('count(*[_type=="gunDeal" && approved==true])')
has_img = q('count(*[_type=="gunDeal" && defined(imageUrl) && imageUrl != ""])')
approved_img = q('count(*[_type=="gunDeal" && approved==true && defined(imageUrl) && imageUrl != ""])')

sample = q('*[_type=="gunDeal"] | order(publishedAt desc) [0..2] { _id, title, approved, imageUrl }')

print(f"Total gunDeal: {total}")
print(f"approved==true: {approved}")
print(f"has imageUrl: {has_img}")
print(f"approved+imageUrl: {approved_img}")
print(f"\nSample docs:")
for s in sample:
    print(f"  approved={s.get('approved')} imageUrl={str(s.get('imageUrl','NULL'))[:60]}")
    
result = f"total={total} approved={approved} has_img={has_img} approved+img={approved_img}"
with open('scripts/sanity-deals-check.txt','w') as f: f.write(result+'\n')
print('\nDone')

# Show sample image URLs
sample_imgs = q('*[_type=="gunDeal" && defined(imageUrl)] | order(publishedAt desc) [0..4] { imageUrl }')
print("\nSample imageUrls:")
for s in sample_imgs:
    print(f"  {s.get('imageUrl','')}")
