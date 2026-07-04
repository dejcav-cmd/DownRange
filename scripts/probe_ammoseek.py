import urllib.request, urllib.error
import json, datetime

HDR = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
}

def fetch(url):
    req = urllib.request.Request(url, headers=HDR)
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            body = r.read().decode('utf-8', errors='replace')
            # Look for price patterns in HTML
            import re
            prices = re.findall(r'\$[\d]+\.[\d]{2}\s*/\s*(?:rd|round)', body[:50000])
            return {'status': r.status, 'len': len(body), 'prices_found': prices[:5], 'preview': body[:300]}
    except urllib.error.HTTPError as e:
        return {'error': f'HTTP {e.code}'}
    except Exception as e:
        return {'error': str(e)}

results = {'probed_at': datetime.datetime.utcnow().isoformat(), 'tests': {}}

tests = {
    # AmmoSeek search formats
    'ammoseek_q_9mm':        'https://www.ammoseek.com/?q=9mm',
    'ammoseek_search_9mm':   'https://www.ammoseek.com/search?q=9mm',
    'ammoseek_caliber_9mm':  'https://www.ammoseek.com/caliber/9mm',
    # WikiArms search formats
    'wikiarms_search_9mm':   'https://www.wikiarms.com/search?term=9mm',
    'wikiarms_ammo_9mm':     'https://www.wikiarms.com/ammo/9mm-luger',
    'wikiarms_prices_9mm':   'https://www.wikiarms.com/prices/9mm',
    # GunBot search
    'gunbot_search':         'https://www.gunbot.com/ammo/9mm-luger-ammo/',
    # Luckygunner — known good prices, check if scrapeable
    'luckygunner_9mm':       'https://www.luckygunner.com/handgun/9mm-ammo',
}

for label, url in tests.items():
    r = fetch(url)
    results['tests'][label] = {'url': url, **{k: v for k, v in r.items() if k != 'preview'}}
    prices = r.get('prices_found', [])
    print(f"{label}: {r.get('status', r.get('error','?'))} len={r.get('len',0)} prices={prices[:3]}", flush=True)

with open('scripts/ammoseek_probe_result.json', 'w') as f:
    json.dump(results, f, indent=2)
print('Done')
