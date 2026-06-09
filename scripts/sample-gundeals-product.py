import urllib.request

URL = 'https://gun.deals/product/hk45c-v1-45-acp-394-8rd-pistol-night-sights-69999'
req = urllib.request.Request(URL, headers={'User-Agent': 'Mozilla/5.0 (compatible; DownRange/1.0)'})
try:
    with urllib.request.urlopen(req, timeout=15) as r:
        html = r.read().decode('utf-8', errors='replace')
    # Extract og:image and any img tags
    import re
    og = re.findall(r'<meta[^>]+property=["\']og:image["\'][^>]+content=["\']([^"\']+)["\']', html)
    imgs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html)[:10]
    with open('scripts/gun-deals-product-sample.txt', 'w') as f:
        f.write(f'og:image: {og}\n\nFirst 10 imgs:\n')
        for i in imgs:
            f.write(f'  {i}\n')
    print('og:image:', og)
    print('imgs:', imgs[:5])
except Exception as e:
    with open('scripts/gun-deals-product-sample.txt', 'w') as f:
        f.write(f'ERROR: {e}\n')
    print('ERROR:', e)
