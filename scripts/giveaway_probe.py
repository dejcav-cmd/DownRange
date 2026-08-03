#!/usr/bin/env python3
"""Probe round 2: real anchor structure on the two reachable aggregators,
plus candidate replacement URLs for the dead manufacturer pages."""
import json, os, re, urllib.request, urllib.error, urllib.parse, time

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
H = {'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
     'Accept-Language': 'en-US,en;q=0.9'}

A_TAG = re.compile(r'<a\b[^>]*?href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', re.I | re.S)
TAGS  = re.compile(r'<[^>]+>')


def get(url, headers=H, timeout=25):
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=timeout) as r:
            return r.status, r.read().decode('utf-8', 'replace')
    except urllib.error.HTTPError as e:
        return e.code, ''
    except Exception as e:
        return 0, f'{type(e).__name__}: {e}'


def anchors(html, base):
    out = []
    for href, inner in A_TAG.findall(html):
        text = TAGS.sub(' ', inner)
        text = re.sub(r'\s+', ' ', text).strip()
        if not text or len(text) < 4:
            continue
        try:
            full = urllib.parse.urljoin(base, href)
        except Exception:
            continue
        if not full.startswith('http'):
            continue
        out.append({'text': text[:110], 'url': full[:160],
                    'host': urllib.parse.urlparse(full).hostname or ''})
    return out


report = {'ran_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())}

# --- Structure of the two reachable aggregators -------------------------------
for name, url in [('wintheguns.com', 'https://wintheguns.com/'),
                  ('gungiveaways.net', 'https://gungiveaways.net/')]:
    code, html = get(url)
    if code != 200:
        report[name] = {'status': code}
        continue
    a = anchors(html, url)
    host = urllib.parse.urlparse(url).hostname.replace('www.', '')
    offsite = [x for x in a if host not in x['host']]
    plat = [x for x in a if re.search(r'gleam\.io|wn\.nr|swee\.ps|rafflecopter|kingsumo|woobox|sweepwidget|viral-loops|share-w\.in', x['url'], re.I)]
    report[name] = {
        'status': code, 'bytes': len(html), 'anchors': len(a),
        'offsite': len(offsite), 'platform_links': len(plat),
        'sample_all': a[:12],
        'sample_offsite': offsite[:20],
        'sample_platform': plat[:12],
        'dollar_hits': len(re.findall(r'\$\s?[\d,]{3,}', html)),
        'date_hits': re.findall(r'\d{1,2}/\d{1,2}/\d{2,4}', html)[:10],
    }
    time.sleep(2)

# --- Candidate replacements for the 5 dead manufacturer pages -----------------
CANDIDATES = [
    ('PSA giveaways',        'https://palmettostatearmory.com/giveaways'),
    ('Lucky Gunner lounge',  'https://www.luckygunner.com/lounge/category/giveaways/'),
    ('Springfield promos',   'https://www.springfield-armory.com/promotions/'),
    ('GOA sweepstakes',      'https://www.gunowners.org/giveaway/'),
    ('Taurus promotions',    'https://www.taurususa.com/promotions/'),
    ('Ruger promotions',     'https://ruger.com/promotions/'),
    ('Brownells sweeps',     'https://www.brownells.com/aspx/general/sweepstakes.aspx'),
    ('SAF sweepstakes',      'https://www.saf.org/sweepstakes/'),
    ('Pew Pew giveaway',     'https://www.pewpewtactical.com/giveaway/'),
    ('Popular Suppressors',  'https://popularsuppressors.com/'),
    ('Gun Giveaways gunsam', 'https://www.gunsamerica.com/digest/gun-giveaways/'),
    ('Sweepstakes Fanatics', 'https://www.sweepstakesfanatics.com/gun-sweepstakes/'),
    ('OutdoorLife giveaway', 'https://www.outdoorlife.com/giveaways/'),
    ('AmmoToGo giveaway',    'https://www.ammunitiontogo.com/lodge/giveaways/'),
    ('Firearms News',        'https://www.firearmsnews.com/sweepstakes'),
]
cand = {}
for name, url in CANDIDATES:
    code, html = get(url, timeout=15)
    entry = {'url': url, 'status': code, 'bytes': len(html) if isinstance(html, str) else 0}
    if code == 200 and len(html) > 2000:
        a = anchors(html, url)
        host = (urllib.parse.urlparse(url).hostname or '').replace('www.', '')
        entry['anchors'] = len(a)
        entry['giveawayish'] = [x for x in a if re.search(
            r'win a|win an|giveaway|enter to win|sweepstake|contest', x['text'], re.I)][:8]
        entry['platform'] = [x for x in a if re.search(
            r'gleam\.io|wn\.nr|swee\.ps|rafflecopter|kingsumo|woobox|sweepwidget', x['url'], re.I)][:6]
    cand[name] = entry
    time.sleep(1)
report['candidates'] = cand

with open('probe.json', 'w') as f:
    json.dump(report, f, indent=2)
print('done')
