import urllib.request, re, json
URL='https://www.downrangeco.com/releases/smith-wesson-model-642-america-250-edition'
html=urllib.request.urlopen(urllib.request.Request(URL,headers={'User-Agent':'Mozilla/5.0 (compatible; Googlebot/2.1)'}),timeout=30).read().decode()
for b in re.findall(r'<script[^>]*application/ld\+json[^>]*>(.*?)</script>',html,re.S)[1:]:
    data=json.loads(b)
    print([n.get('@type') for n in data])
    print('aggregateRating' in b, 'Review' in b, '"brand"' in b, 'Product' in b)
