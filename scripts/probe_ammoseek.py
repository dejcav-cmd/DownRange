import urllib.request
import json, sys, datetime

CALIBERS = [
    ('9mm',           'ammo/9mm'),
    ('223-remington', 'ammo/223-remington'),
    ('65-creedmoor',  'ammo/65-creedmoor'),
    ('7mm-prc',       'ammo/7mm-prc'),
]

results = {'probed_at': datetime.datetime.utcnow().isoformat()}

for slug, seg in CALIBERS:
    url = f'https://www.ammoseek.com/{seg}/rss'
    req = urllib.request.Request(url, headers={'User-Agent': 'DownRange/1.0'})
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            xml = r.read().decode('utf-8', errors='replace')
        import re
        items = re.findall(r'<item>([\s\S]*?)</item>', xml)[:4]
        results[slug] = []
        for item in items:
            title_m = re.search(r'<title[^>]*><!\[CDATA\[([\s\S]*?)\]\]></title>|<title[^>]*>([\s\S]*?)</title>', item)
            link_m  = re.search(r'<link[^>]*>([\s\S]*?)</link>', item)
            results[slug].append({
                'title': (title_m.group(1) or title_m.group(2) or '').strip()[:200] if title_m else None,
                'link':  link_m.group(1).strip()[:300] if link_m else None,
            })
        print(f'[{slug}] {len(items)} items fetched', flush=True)
    except Exception as e:
        results[slug] = {'error': str(e)}
        print(f'[{slug}] ERROR: {e}', flush=True)

output = json.dumps(results, indent=2)
print('\n--- RESULTS ---')
print(output)

# Also write to file
with open('scripts/ammoseek_probe_result.json', 'w') as f:
    f.write(output)
