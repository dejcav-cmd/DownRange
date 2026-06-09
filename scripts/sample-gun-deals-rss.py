import urllib.request, os

URLs = [
    'https://gun.deals/feed/syndication/rss',
    'https://gun.deals/rss.xml',
    'https://gun.deals/feed',
]

for url in URLs:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'DownRange/1.0'})
        with urllib.request.urlopen(req, timeout=15) as r:
            xml = r.read().decode('utf-8', errors='replace')
        # Save first 3000 chars
        with open('scripts/gun-deals-rss-sample.txt', 'w') as f:
            f.write(xml[:4000])
        print(f'SUCCESS: {url}')
        break
    except Exception as e:
        print(f'FAIL {url}: {e}')
