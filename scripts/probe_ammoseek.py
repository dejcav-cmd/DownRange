import urllib.request, urllib.error
import json, datetime, re

HDR = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

def fetch(url):
    req = urllib.request.Request(url, headers=HDR)
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            body = r.read().decode('utf-8', errors='replace')
            return {'status': r.status, 'len': len(body), 'preview': body[:800]}
    except urllib.error.HTTPError as e:
        return {'error': f'HTTP {e.code}'}
    except Exception as e:
        return {'error': str(e)}

results = {'probed_at': datetime.datetime.utcnow().isoformat(), 'tests': {}}

tests = {
    # WikiArms: try their actual API/feed paths
    'wikiarms_api_9mm':      'https://www.wikiarms.com/api/ammo?caliber=9mm&limit=5',
    'wikiarms_feed_9mm':     'https://www.wikiarms.com/feed/ammo/9mm',
    'wikiarms_group_9mm':    'https://www.wikiarms.com/group/9mm-ammo',
    'wikiarms_group_556':    'https://www.wikiarms.com/group/223-556-ammo',
    'wikiarms_deals':        'https://www.wikiarms.com/deals',
    # AmmoSeek: try root and alternate paths  
    'ammoseek_root':         'https://www.ammoseek.com/',
    'ammoseek_compare_9mm':  'https://www.ammoseek.com/compare/9mm',
    'ammoseek_embed':        'https://www.ammoseek.com/embed/9mm',
    # GunDeals: different RSS paths
    'gundeals_rss_main':     'https://gun.deals/feed/syndication/rss',
    'gundeals_ammo_cat':     'https://gun.deals/category/ammo',
    'gundeals_ammo_rss':     'https://gun.deals/category/ammo/feed',
    # Bing shopping search (no auth, scraping)
    'bing_shopping_9mm':     'https://www.bing.com/shop?q=9mm+ammo+bulk&filters=price%3A%220%2B%22',
}

for label, url in tests.items():
    r = fetch(url)
    results['tests'][label] = {'url': url, **{k: v for k, v in r.items() if k != 'preview'}}
    if 'status' in r:
        results['tests'][label]['preview'] = r.get('preview', '')[:400]
    print(f"{label}: {r.get('status', r.get('error','?'))} len={r.get('len',0)}", flush=True)

with open('scripts/ammoseek_probe_result.json', 'w') as f:
    json.dump(results, f, indent=2)
print('Done')
