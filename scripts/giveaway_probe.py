#!/usr/bin/env python3
"""One-shot diagnostic: why did every giveaway source return 0?

Runs on a GitHub Actions runner (real datacenter IP, unlike Claude's sandbox).
Writes findings to docs/giveaway-probe.json via the Contents API caller.
"""
import json, os, re, sys, urllib.request, urllib.error, urllib.parse, time

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')

MD_LINK = re.compile(r'\[([^\]]{6,200})\]\((https?://[^\s\)]{10,300})\)')
HTML_A  = re.compile(r'<a\s+href="(https?://[^"]+)"[^>]*>([^<]{10,140})</a>', re.I)

TARGETS = [
    ('wintheguns.com',   'https://wintheguns.com/'),
    ('gungiveaways.net', 'https://gungiveaways.net/'),
    ('gunmade.com',      'https://www.gunmade.com/gun-giveaways/'),
]
MFR = [
    ('Palmetto State Armory', 'https://palmettostatearmory.com/blog/category/psa-giveaways/'),
    ('Lucky Gunner',          'https://www.luckygunner.com/blog/category/giveaway/'),
    ('Springfield Armory',    'https://www.springfield-armory.com/promotions/'),
    ('Gun Owners of America', 'https://gunowners.org/goa-giveaway/'),
    ('Taurus USA',            'https://www.taurususa.com/promotions'),
]


def get(url, headers, timeout=30):
    req = urllib.request.Request(url, headers=headers)
    t0 = time.time()
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            body = r.read().decode('utf-8', 'replace')
            return {'status': r.status, 'ms': int((time.time() - t0) * 1000),
                    'len': len(body), 'body': body}
    except urllib.error.HTTPError as e:
        body = e.read().decode('utf-8', 'replace')[:400]
        return {'status': e.code, 'ms': int((time.time() - t0) * 1000),
                'len': 0, 'body': '', 'err': body}
    except Exception as e:
        return {'status': 0, 'ms': int((time.time() - t0) * 1000),
                'len': 0, 'body': '', 'err': f'{type(e).__name__}: {e}'}


def analyse(body):
    md = MD_LINK.findall(body)
    ah = HTML_A.findall(body)
    giveawayish = [t for t, u in md
                   if re.search(r'win a|win an|giveaway|enter to win|sweepstake|contest|free (gun|rifle|pistol|ammo)', t, re.I)]
    return {'md_links': len(md), 'html_anchors': len(ah),
            'giveawayish_md': len(giveawayish),
            'sample_md': [{'text': t[:90], 'url': u[:120]} for t, u in md[:8]],
            'head': body[:300].replace('\n', ' ')}


report = {'ran_at': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'jina': {}, 'direct': {}, 'mfr': {}}

# 1. Jina proxy, anonymous (exactly what the cron does today)
for name, url in TARGETS:
    r = get('https://r.jina.ai/' + url, {'User-Agent': UA, 'Accept': 'text/html,*/*'})
    entry = {'status': r['status'], 'ms': r['ms'], 'bytes': r['len']}
    if r.get('err'):
        entry['err'] = r['err'][:200]
    if r['len'] > 200:
        entry.update(analyse(r['body']))
    report['jina'][name] = entry
    time.sleep(3)

# 2. Direct fetch with a browser UA (candidate fallback path)
for name, url in TARGETS:
    r = get(url, {'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml',
                  'Accept-Language': 'en-US,en;q=0.9'})
    entry = {'status': r['status'], 'ms': r['ms'], 'bytes': r['len']}
    if r.get('err'):
        entry['err'] = r['err'][:200]
    if r['len'] > 200:
        entry.update(analyse(r['body']))
    report['direct'][name] = entry
    time.sleep(2)

# 3. Manufacturer pages: bot UA (current code) vs browser UA
for name, url in MFR:
    bot = get(url, {'User-Agent': 'Mozilla/5.0 (compatible; DownRangeBot/1.0; +https://downrangeco.com)'}, 15)
    time.sleep(1)
    br = get(url, {'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml',
                   'Accept-Language': 'en-US,en;q=0.9'}, 15)
    report['mfr'][name] = {
        'bot_ua':     {'status': bot['status'], 'bytes': bot['len'], 'err': bot.get('err', '')[:120]},
        'browser_ua': {'status': br['status'],  'bytes': br['len'],  'err': br.get('err', '')[:120]},
    }
    time.sleep(1)

# 4. Are the OTHER Jina-dependent crons healthy? Tells us if JINA_API_KEY is
#    set in Vercel (gun-deals/web-deals send it; giveaways does not).
tok = (os.environ.get('SANITY_TOKEN') or '').replace('ST=', '').strip()
if tok:
    q = ('*[_type=="cronRun" && jobId in ["gun-deals","web-deals","giveaways"]]'
         '|order(_createdAt desc)[0...25]{jobId,status,ms,error,_createdAt}')
    u = ('https://vbnsqnkg.api.sanity.io/v2024-01-01/data/query/production?query='
         + urllib.parse.quote(q))
    r = get(u, {'Authorization': 'Bearer ' + tok})
    try:
        report['cron_history'] = json.loads(r['body']).get('result', [])
    except Exception as e:
        report['cron_history'] = {'error': str(e), 'status': r['status']}

print(json.dumps(report, indent=2)[:6000])
with open('probe.json', 'w') as f:
    json.dump(report, f, indent=2)
