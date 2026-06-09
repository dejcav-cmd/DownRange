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
print(f"Sanity docs: {len(sanity_urls)}")

# Fetch live RSS
rss_req = urllib.request.Request(
    'https://gun.deals/feed/syndication/rss',
    headers={'User-Agent':'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
)
with urllib.request.urlopen(rss_req, timeout=15) as r:
    xml = r.read().decode('utf-8', errors='replace')

print(f"RSS fetched: {len(xml)} bytes")

# Parse items - use same approach as the working cron
rss_items = []
for block_match in re.finditer(r'<item>([\s\S]*?)</item>', xml):
    block = block_match.group(1)
    def get(tag):
        m = re.search(r'<' + tag + r'[^>]*><!\[CDATA\[([\s\S]*?)\]\]></' + tag + r'>', block)
        if not m: m = re.search(r'<' + tag + r'[^>]*>([^<]*)</' + tag + r'>', block)
        return m.group(1).strip() if m else ''
    
    title = get('title')
    link  = get('link') or get('guid')
    if link:
        rss_items.append({'link': link, 'title': title})

print(f"RSS items parsed: {len(rss_items)}")

rss_top50  = rss_items[:50]
rss_urls   = {i['link'] for i in rss_top50}
overlap    = rss_urls & sanity_urls
new_items  = [i for i in rss_top50 if i['link'] not in sanity_urls]

print(f"RSS top 50 URLs: {len(rss_urls)}")
print(f"Overlap (in Sanity): {len(overlap)}")
print(f"NOT in Sanity: {len(new_items)}")
print(f"\nFirst 5 items NOT in Sanity:")
for i in new_items[:5]:
    print(f"  {i['link'][:80]}")
    print(f"  title: {i['title'][:60]}")

result = f"RSS={len(rss_urls)} Sanity={len(sanity_urls)} overlap={len(overlap)} new_not_in_sanity={len(new_items)}"
with open('scripts/rss-vs-sanity.txt','w') as f:
    f.write(result+'\n')
    f.write('\nNew items:\n')
    for i in new_items:
        f.write(f"  {i['link']}\n")
