#!/usr/bin/env python3
"""Collect state-law inputs and POST them to the DownRange ingest route.
 - Wikipedia 'Gun laws in <state>' articles: the 'Summary table' rows
 - handgunlaw.us: the list of permitless-carry states (printed on every state PDF)"""
import json, os, re, subprocess, sys, time, urllib.parse, urllib.request

NAMES = {'AL':'Alabama','AK':'Alaska','AZ':'Arizona','AR':'Arkansas','CA':'California','CO':'Colorado','CT':'Connecticut','DE':'Delaware','FL':'Florida','GA':'Georgia','HI':'Hawaii','ID':'Idaho','IL':'Illinois','IN':'Indiana','IA':'Iowa','KS':'Kansas','KY':'Kentucky','LA':'Louisiana','ME':'Maine','MD':'Maryland','MA':'Massachusetts','MI':'Michigan','MN':'Minnesota','MS':'Mississippi','MO':'Missouri','MT':'Montana','NE':'Nebraska','NV':'Nevada','NH':'New Hampshire','NJ':'New Jersey','NM':'New Mexico','NY':'New York','NC':'North Carolina','ND':'North Dakota','OH':'Ohio','OK':'Oklahoma','OR':'Oregon','PA':'Pennsylvania','RI':'Rhode Island','SC':'South Carolina','SD':'South Dakota','TN':'Tennessee','TX':'Texas','UT':'Utah','VT':'Vermont','VA':'Virginia','WA':'Washington','WV':'West Virginia','WI':'Wisconsin','WY':'Wyoming'}
UA = 'DownRangeBot/1.0 (https://www.downrangeco.com; dj@downrangeco.com)'

def get(url, tries=3):
    for i in range(tries):
        try:
            return urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=60).read()
        except Exception as e:
            err = e; time.sleep(3)
    raise err

def clean(t):
    t = re.sub(r'<ref[^>]*/>', '', t)
    t = re.sub(r'<ref[^>]*>.*?</ref>', '', t, flags=re.S)
    t = re.sub(r'<br\s*/?>', ' ', t)
    t = re.sub(r'\[\[(?:[^\]|]*\|)?([^\]]*)\]\]', r'\1', t)
    t = re.sub(r'\[https?://\S+ ([^\]]*)\]', r'\1', t)
    t = re.sub(r'\[https?://\S+\]', '', t)
    t = re.sub(r"'''?", '', t)
    t = re.sub(r'\{\{[^{}]*\}\}', '', t)
    return re.sub(r'\s+', ' ', t).strip()

def wiki_rows(name):
    for title in (f'Gun laws in {name}', f'Gun laws in {name} (state)'):
        url = 'https://en.wikipedia.org/w/api.php?' + urllib.parse.urlencode({'action':'query','prop':'revisions','rvprop':'content','rvslots':'main','titles':title,'redirects':1,'format':'json','formatversion':2})
        d = json.loads(get(url))
        pages = d.get('query', {}).get('pages', [])
        if not pages or pages[0].get('missing'): continue
        txt = pages[0]['revisions'][0]['slots']['main']['content']
        m = re.search(r'^=+\s*Summary table\s*=+\s*$', txt, re.M)
        if not m: continue
        a = m.start()
        mb = re.search(r'^==[^=]', txt[m.end():], re.M)
        b = m.end() + mb.start() if mb else a + 40000
        tbl = txt[a:b]
        out = []
        for line in tbl.split('\n'):
            if not line.startswith('| ') or '||' not in line: continue
            cells = [clean(c) for c in line[2:].split('||')]
            if len(cells) < 2: continue
            subj = cells[0]
            if not re.search(r'assault|magazine|red flag|waiting|concealed|permit|open carry|licen', subj, re.I): continue
            notes = cells[4] if len(cells) > 4 else ''
            out.append(f'{subj} | {cells[1]} | {cells[2] if len(cells)>2 else ""} | {notes[:260]}')
        if out: return '\n'.join(out)
    return ''

def permitless_list():
    pdf = '/tmp/wa.pdf'
    open(pdf, 'wb').write(get('https://www.handgunlaw.us/states/washington.pdf'))
    txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    flat = re.sub(r'\s+', ' ', txt)
    m = re.search(r'Note:\s*([A-Z][^"]{20,700}?)\s+have\s+"?Permitless', flat)
    if not m: return [], None
    seg = m.group(1)
    names = []
    for n in sorted(NAMES.values(), key=len, reverse=True):
        if re.search(r'\b' + re.escape(n) + r'\b', seg):
            names.append(n)
            seg = re.sub(r'\b' + re.escape(n) + r'\b', ' ', seg)  # so 'Virginia' does not match inside 'West Virginia'
    names = sorted(set(names))
    upd = re.search(r'Last Updated:\s*([0-9/]+)', txt)
    return names, upd.group(1) if upd else None

states, problems = {}, []
for code, name in NAMES.items():
    try:
        rows = wiki_rows(name)
        if len(rows) < 60: problems.append(f'{code}: summary table not found'); continue
        states[code] = {'rows': rows}
    except Exception as e:
        problems.append(f'{code}: {e}')
    time.sleep(0.3)
perm, verified = permitless_list()
print('states', len(states), 'problems', problems, 'permitless', len(perm), perm, file=sys.stderr)
if len(states) < 45 or len(perm) < 20:
    print('input too thin, aborting', file=sys.stderr); sys.exit(1)
payload = json.dumps({'states': states, 'permitless': perm, 'verified': verified, 'dry': os.environ.get('DRY') == '1'}).encode()
req = urllib.request.Request('https://www.downrangeco.com/api/admin/state-laws-ingest', data=payload, headers={'content-type': 'application/json', 'x-admin-key': os.environ['ADMIN_KEY']}, method='POST')
try:
    r = urllib.request.urlopen(req, timeout=290); print(r.status, r.read().decode()[:6000])
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode()[:3000]); sys.exit(1)
