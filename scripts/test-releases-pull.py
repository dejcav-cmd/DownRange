"""
Test script: scrape 20 manufacturer listing pages, report candidates found.
Run: SANITY_TOKEN=xxx python3 scripts/test-releases-pull.py
"""
import urllib.request, urllib.parse, json, os, re, sys, time

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) '
      'AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36')

PRODUCT = [
    'introduces','launches','announces','unveiled','debuts','now available',
    'new model','new for 20','released','new pistol','new rifle','new shotgun',
    'new suppressor','new optic','first look','now shipping','new revolver',
    'new carbine','introducing','limited edition',
]
FIREARM = [
    'pistol','handgun','revolver','rifle','shotgun','carbine','suppressor',
    'silencer','firearm','gun','barrel','9mm','.45','10mm','5.56','6.5','.308',
    '.300','.357','semi-auto','striker-fired','bolt-action','optic','scope',
    'red dot','caliber','slide','trigger','frame','receiver','threaded barrel',
]
SKIP = [
    'earnings','quarterly','lawsuit','recall','hiring','scholarship','how to clean',
    'sale ends','coupon','cleaning solution','lubricant','holster review','ammo test',
    'financial','revenue','donation','board of directors','appointed ceo',
]

def passes(title, brand=''):
    txt = (title + ' ' + brand).lower()
    if any(s in txt for s in SKIP): return False
    return any(s in txt for s in PRODUCT) and any(s in txt for s in FIREARM)

SOURCES = [
    # Pistols
    {'brand':'Glock',             'url':'https://us.glock.com/en/press-release/news-page',            'pat':r'/press-release/news-page/[a-z0-9-]{5,}$'},
    {'brand':'SIG Sauer',         'url':'https://www.sigsauer.com/blog/category/new-products',         'pat':r'/blog/[a-z0-9-]{10,}$'},
    {'brand':'Smith & Wesson',    'url':'https://www.smith-wesson.com/company/news',                   'pat':r'/company/news/[a-z0-9-]+$'},
    {'brand':'Springfield Armory','url':'https://www.springfield-armory.com/intel/press-releases/',    'pat':r'/intel/press-releases/.{5,}'},
    {'brand':'Ruger',             'url':'https://ruger.com/news/',                                     'pat':r'ruger\.com/news/[\d-]{5,}'},
    {'brand':'Taurus',            'url':'https://www.taurususa.com/company/news/',                     'pat':r'/company/news/.{5,}'},
    {'brand':'Beretta',           'url':'https://www.berettausa.com/en-us/press-releases/',            'pat':r'/press-releases?/.{5,}'},
    {'brand':'Kimber',            'url':'https://www.kimberamerica.com/press/',                        'pat':r'/press/.{5,}'},
    {'brand':'Staccato',          'url':'https://staccato2011.com/blogs/news',                         'pat':r'/blogs/news/.{5,}'},
    # 2011/Comp
    {'brand':'Bul Armory',        'url':'https://www.global.bularmory.com/blog',                       'pat':r'/blog/.{5,}'},
    {'brand':'Colt',              'url':'https://www.colt.com/category/colt-news/',                    'pat':r'/colt-news/.{5,}'},
    # Rifles
    {'brand':'Daniel Defense',    'url':'https://danieldefense.com/press-media',                       'pat':r'danieldefense\.com/(blog|press|new)/.{5,}'},
    {'brand':'Mossberg',          'url':'https://www.mossberg.com/news/',                              'pat':r'/news/.{5,}'},
    {'brand':'Browning',          'url':'https://www.browning.com/news/',                              'pat':r'/news/.{5,}'},
    {'brand':'MPA',               'url':'https://www.masterpiece-arms.com/news/',                      'pat':r'/news/.{5,}'},
    # Shotguns
    {'brand':'Stoeger',           'url':'https://www.stoegerindustries.com/news/',                     'pat':r'/news/.{5,}'},
    {'brand':'TriStar Arms',      'url':'https://tristararms.com/news/',                               'pat':r'/news/.{5,}'},
    {'brand':'Weatherby',         'url':'https://www.weatherby.com/blog/',                             'pat':r'/blog/.{5,}'},
    # Suppressors
    {'brand':'SilencerCo',        'url':'https://silencerco.com/news/',                                'pat':r'/news/.{5,}'},
    {'brand':'Dead Air',          'url':'https://deadairsilencers.com/news/',                          'pat':r'/news/.{5,}'},
    {'brand':'Griffin Armament',  'url':'https://griffinarmament.com/blog/',                           'pat':r'griffinarmament\.com/blog/.{5,}'},
    {'brand':'Rugged Suppressors','url':'https://ruggedsuppressors.com/blog/',                         'pat':r'/blog/.{5,}'},
    {'brand':'Q LLC',             'url':'https://www.theqcompany.com/blogs/news',                      'pat':r'/blogs/news/.{5,}'},
    # Turkish
    {'brand':'SAR USA',           'url':'https://www.sarusa.com/news/',                                'pat':r'sarusa\.com/news/.{5,}'},
    {'brand':'Girsan (EAA)',      'url':'https://www.eaacorp.com/news/',                               'pat':r'eaacorp\.com/(news|blog)/.{5,}'},
    # Nordic
    {'brand':'Sako',              'url':'https://www.sako.global/articles/press-release',              'pat':r'sako\.global/article/.{5,}'},
]

total = 0
results = []

print(f"Testing {len(SOURCES)} manufacturer sources...\n")

for src in SOURCES:
    try:
        req = urllib.request.Request(
            src['url'],
            headers={'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml'}
        )
        with urllib.request.urlopen(req, timeout=12) as r:
            html = r.read().decode('utf-8', errors='replace')

        pat  = re.compile(src['pat'], re.I)
        base = re.match(r'https?://[^/]+', src['url'])
        base_url = base.group(0) if base else ''

        found, seen = [], set()
        for m in re.finditer(r'<a[^>]+href="([^"#?][^"]*)"[^>]*>([\s\S]*?)</a>', html, re.I):
            href = m.group(1).strip()
            if href.startswith('/'): href = base_url + href
            if not href.startswith('http'): continue
            if not pat.search(href) or href in seen: continue
            seen.add(href)
            inner = re.sub(r'\s+', ' ', re.sub('<[^>]+>', ' ', m.group(2))).strip()[:160]
            if len(inner) < 12: continue
            if passes(inner, src['brand']):
                found.append(inner[:90])

        total += len(found)
        status = f'✓ {len(found)} candidates' if found else '— 0 candidates'
        print(f'{src["brand"]:22} {status}')
        for t in found[:2]:
            print(f'  → {t}')
        results.append({'brand': src['brand'], 'count': len(found), 'samples': found[:2]})

    except Exception as e:
        print(f'{src["brand"]:22} ✗ {type(e).__name__}: {str(e)[:70]}')
        results.append({'brand': src['brand'], 'count': -1, 'error': str(e)[:70]})

    time.sleep(0.3)

print(f'\n{"=" * 65}')
print(f'Total candidates: {total}')
working = sum(1 for r in results if r.get('count', 0) >= 0)
with_hits = sum(1 for r in results if r.get('count', 0) > 0)
print(f'Sources reachable: {working}/{len(SOURCES)}')
print(f'Sources with candidates: {with_hits}/{len(SOURCES)}')
