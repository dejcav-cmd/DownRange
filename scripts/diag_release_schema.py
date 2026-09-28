import urllib.request, re, json, os, urllib.parse
URL = 'https://www.downrangeco.com/releases/smith-wesson-model-642-america-250-edition'
req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)'})
html = urllib.request.urlopen(req, timeout=30).read().decode('utf-8', 'replace')
print('HTML bytes', len(html))
blocks = re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>', html, re.S)
print('LD+JSON blocks:', len(blocks))
for i, b in enumerate(blocks):
    print(f'--- block {i} ---'); print(b[:4000])
print('itemscope count', html.count('itemscope'), 'itemprop count', html.count('itemprop'))
for m in re.finditer(r'item(type|prop)="[^"]+"', html):
    print('MICRO', m.group(0))
print('rdfa typeof', len(re.findall(r'typeof=', html)))
tok = os.environ.get('SANITY_API_TOKEN', '').replace('ST=', '')
q = urllib.parse.quote('*[_type=="firearmRelease" && slug.current=="smith-wesson-model-642-america-250-edition"]{_id,brand,model,title,msrp,publishedAt,summary,"bodyLen":length(body),body}')
r = urllib.request.Request(f'https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query={q}', headers={'Authorization': 'Bearer ' + tok})
res = json.loads(urllib.request.urlopen(r, timeout=30).read())['result']
print('SANITY DOCS', len(res))
for d in res:
    body = d.pop('body', '') or ''
    print(json.dumps(d, default=str)[:1500])
    print('body has ld+json:', 'ld+json' in body, 'itemprop:', 'itemprop' in body, 'schema.org:', 'schema.org' in body)
    print('BODY HEAD', body[:1500])
