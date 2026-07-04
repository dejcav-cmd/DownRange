import urllib.request, urllib.error
import json, datetime, re

def fetch(url, label):
    req = urllib.request.Request(url, headers={
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    })
    try:
        with urllib.request.urlopen(req, timeout=12) as r:
            body = r.read().decode('utf-8', errors='replace')
            return {'status': r.status, 'len': len(body), 'preview': body[:500], 'url': url}
    except urllib.error.HTTPError as e:
        return {'error': f'HTTP {e.code}', 'url': url}
    except Exception as e:
        return {'error': str(e), 'url': url}

results = {'probed_at': datetime.datetime.utcnow().isoformat(), 'tests': {}}

# Test different AmmoSeek URL formats
tests = {
    'ammoseek_old_rss':     'https://www.ammoseek.com/ammo/9mm/rss',
    'ammoseek_feed':        'https://www.ammoseek.com/ammo/9mm?feed=rss',
    'ammoseek_rss2':        'https://www.ammoseek.com/rss/9mm',
    'ammoseek_search_html': 'https://www.ammoseek.com/ammo/9mm',
    # GunBot API (free, no auth, real-time ammo prices)
    'gunbot_9mm':           'https://www.gunbot.com/api/ammo/search/?caliber=9mm&qty=50',
    # WikiArms RSS (known working — already in news feed)
    'wikiarms_9mm':         'https://www.wikiarms.com/ammo/9mm/rss',
    'wikiarms_556':         'https://www.wikiarms.com/ammo/223/rss',
    'wikiarms_65cm':        'https://www.wikiarms.com/ammo/6.5-creedmoor/rss',
    'wikiarms_homepage':    'https://www.wikiarms.com/',
    # Slickguns RSS
    'slickguns_rss':        'https://www.slickguns.com/rss.xml',
    # GunDeals subreddit JSON
    'reddit_gundeals':      'https://www.reddit.com/r/gundeals/search.json?q=9mm&restrict_sr=1&sort=new&limit=5',
}

for label, url in tests.items():
    r = fetch(url, label)
    results['tests'][label] = {k: v for k, v in r.items() if k != 'preview'}
    if 'status' in r:
        # Show first 200 chars of content
        results['tests'][label]['preview'] = r.get('preview', '')[:300]
    print(f"{label}: {r.get('status', r.get('error', '?'))} | len={r.get('len',0)}", flush=True)

with open('scripts/ammoseek_probe_result.json', 'w') as f:
    json.dump(results, f, indent=2)
print('\nDone')
