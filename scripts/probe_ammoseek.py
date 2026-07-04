import urllib.request
import json, sys

CALIBERS = [
    ('9mm',           'ammo/9mm'),
    ('223-remington', 'ammo/223-remington'),
    ('65-creedmoor',  'ammo/65-creedmoor'),
    ('7mm-prc',       'ammo/7mm-prc'),
]

results = {}

for slug, seg in CALIBERS:
    url = f'https://www.ammoseek.com/{seg}/rss'
    req = urllib.request.Request(url, headers={'User-Agent': 'DownRange/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=10) as r:
            xml = r.read().decode('utf-8', errors='replace')
        # Extract first 3 items raw
        import re
        items = re.findall(r'<item>([\s\S]*?)</item>', xml)[:3]
        results[slug] = []
        for item in items:
            title_m = re.search(r'<title[^>]*>([\s\S]*?)</title>', item)
            link_m  = re.search(r'<link[^>]*>([\s\S]*?)</link>', item)
            desc_m  = re.search(r'<description[^>]*>([\s\S]*?)</description>', item)
            results[slug].append({
                'title': title_m.group(1)[:200] if title_m else None,
                'link':  link_m.group(1)[:300]  if link_m  else None,
                'desc':  desc_m.group(1)[:300]  if desc_m  else None,
            })
    except Exception as e:
        results[slug] = {'error': str(e)}

with open('scripts/ammoseek_probe_result.json', 'w') as f:
    json.dump(results, f, indent=2)
print("Done")
