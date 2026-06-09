import urllib.request, urllib.parse, json, re, os

TOKEN = os.environ.get('SANITY_TOKEN','')
BASE  = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production'

def q(groq):
    url = f'{BASE}?query={urllib.parse.quote(groq)}'
    req = urllib.request.Request(url, headers={'Authorization':f'Bearer {TOKEN}'})
    with urllib.request.urlopen(req, timeout=20) as r:
        return json.loads(r.read())['result']

# Get all Sanity URLs
sanity_urls = set(u for u in q('*[_type=="gunDeal"]{externalUrl}.externalUrl') if u)

# Fetch live RSS
rss_req = urllib.request.Request(
    'https://gun.deals/feed/syndication/rss',
    headers={'User-Agent':'Mozilla/5.0'}
)
with urllib.request.urlopen(rss_req, timeout=15) as r:
    xml = r.read().decode('utf-8', errors='replace')

# Parse RSS
rss_items = []
for m in re.finditer(r'<item>([\s\S]*?)</item>', xml):
    block = m.group(1)
    link_m = re.search(r'<link>([^<]+)</link>', block) or re.search(r'<guid[^>]*>([^<]+)</guid>', block)
    title_m = re.search(r'<title><!\[CDATA\[([\s\S]*?)\]\]></title>', block)
    link  = link_m.group(1).strip() if link_m else ''
    title = title_m.group(1).strip() if title_m else ''
    if link: rss_items.append({'link':link,'title':title})

rss_urls   = {i['link'] for i in rss_items[:50]}
overlap    = rss_urls & sanity_urls
new_items  = [i for i in rss_items[:50] if i['link'] not in sanity_urls]

print(f"RSS items (first 50): {len(rss_urls)}")
print(f"Sanity docs: {len(sanity_urls)}")
print(f"Overlap (RSS in Sanity): {len(overlap)}")
print(f"New items not in Sanity: {len(new_items)}")
print(f"\nFirst 5 new items (not in Sanity):")
for i in new_items[:5]:
    print(f"  {i['link'][:70]}")

result = f"RSS={len(rss_urls)} Sanity={len(sanity_urls)} overlap={len(overlap)} new={len(new_items)}"
with open('scripts/rss-vs-sanity.txt','w') as f: f.write(result+'\n')
