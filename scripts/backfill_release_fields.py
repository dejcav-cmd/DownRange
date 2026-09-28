"""One-off: repair firearmRelease records written by the old weekly-gun-releases
writer. Fixes truncated titles, missing MSRP (re-read from sourceUrl), and
Wikimedia stock images. Writes a before/after log for rollback."""
import os, re, json, html as H, urllib.request, urllib.parse, time

TOK = os.environ['SANITY_API_TOKEN'].replace('ST=', '').strip()
BASE = 'https://vbnsqnkg.api.sanity.io/v2024-01-01/data'
PRICE = r'\$\s?(\d{1,2},?\d{3}|\d{2,4})(?:\.(\d{2}))?'
LABEL = r'(?:MSRP|M\.S\.R\.P\.|suggested retail(?: price)?|retail price|starting (?:MSRP|price)|priced (?:at|from|starting at))'
LABEL2 = r'(?:MSRP|M\.S\.R\.P\.|suggested retail(?: price)?|retail price|starting (?:MSRP|price))'
PATS = [re.compile(LABEL + r'\s*(?:of|is|:|at|from|starts at|starting at|begins at)?\s*(?:just|only|around|approximately)?\s*' + PRICE, re.I),
        re.compile(PRICE + r'\s*(?:USD\s*)?(?:\(|-|–)?\s*' + LABEL2, re.I)]
KNOWN = {'release-0ae6fc473711': 579}  # S&W 642 America 250 — $579 MSRP per manufacturer launch coverage

def extract_msrp(t):
    hits = []
    for p in PATS:
        for m in p.finditer(t):
            n = int(m.group(1).replace(',', ''))
            if 99 <= n <= 15000: hits.append((m.start(), n))
    return sorted(hits)[0][1] if hits else 0

def q(query):
    u = f'{BASE}/query/production?query=' + urllib.parse.quote(query)
    return json.loads(urllib.request.urlopen(urllib.request.Request(u, headers={'Authorization': 'Bearer ' + TOK}), timeout=30).read())['result']

def mutate(muts):
    for i in range(0, len(muts), 100):
        body = json.dumps({'mutations': muts[i:i+100]}).encode()
        r = urllib.request.Request(f'{BASE}/mutate/production?returnDocuments=false', data=body, method='POST',
                                   headers={'Authorization': 'Bearer ' + TOK, 'Content-Type': 'application/json'})
        urllib.request.urlopen(r, timeout=60).read()

def page_text(url):
    try:
        r = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/125 Safari/537.36'})
        raw = urllib.request.urlopen(r, timeout=15).read().decode('utf-8', 'replace')
        raw = re.sub(r'<(script|style)[\s\S]*?</\1>', ' ', raw, flags=re.I)
        return re.sub(r'\s+', ' ', H.unescape(re.sub(r'<[^>]+>', ' ', raw)))
    except Exception as e:
        return ''

docs = q('*[_type=="firearmRelease"]{_id,title,brand,model,msrp,sourceUrl,imageUrl,"hero":defined(heroImage.asset)}')
log = {'total': len(docs), 'titles': [], 'msrp': [], 'images': [], 'msrp_not_found': 0}
muts = []
for d in docs:
    sets, unsets = {}, []
    brand, model = (d.get('brand') or '').strip(), (d.get('model') or '').strip()
    name = re.sub(r'\s+', ' ', f'{brand} {model}').strip()
    t = d.get('title') or ''
    # Title: only the broken "Brand Model: first summary sentence..." pattern
    if brand and model and t != name and t.startswith(name + ':'):
        sets['title'] = name
        log['titles'].append({'id': d['_id'], 'was': t, 'now': name})
    # MSRP
    if not d.get('msrp'):
        n = KNOWN.get(d['_id']) or (extract_msrp(page_text(d['sourceUrl'])) if d.get('sourceUrl') else 0)
        if n:
            sets['msrp'] = n
            log['msrp'].append({'id': d['_id'], 'name': name, 'msrp': n})
        else:
            log['msrp_not_found'] += 1
        time.sleep(0.3)
    # Wikimedia stock photos on releases are never the actual product
    img = d.get('imageUrl') or ''
    if not d.get('hero') and 'wikimedia.org' in img:
        unsets.append('imageUrl')
        log['images'].append({'id': d['_id'], 'name': name, 'was': img})
    if sets: muts.append({'patch': {'id': d['_id'], 'set': sets}})
    if unsets: muts.append({'patch': {'id': d['_id'], 'unset': unsets}})
mutate(muts)
log['mutations'] = len(muts)
print(json.dumps(log, indent=1))
