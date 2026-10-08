#!/usr/bin/env python3
"""Download the 50 handgunlaw.us state PDFs, cut out the 'Permits/Licenses This State Honors'
section and the 'Last Updated' date, and POST them to the DownRange ingest route."""
import json, os, re, subprocess, sys, time, urllib.request

SLUGS = {
 'AL':'alabama','AK':'alaska','AZ':'arizona','AR':'arkansas','CA':'california','CO':'colorado','CT':'connecticut',
 'DE':'delaware','FL':'florida','GA':'georgia','HI':'hawaii','ID':'idaho','IL':'illinois','IN':'indiana','IA':'iowa',
 'KS':'kansas','KY':'kentucky','LA':'louisiana','ME':'maine','MD':'maryland','MA':'massachusetts','MI':'michigan',
 'MN':'minnesota','MS':'mississippi','MO':'missouri','MT':'montana','NE':'nebraska','NV':'nevada','NH':'newhampshire',
 'NJ':'newjersey','NM':'newmexico','NY':'newyork','NC':'northcarolina','ND':'northdakota','OH':'ohio','OK':'oklahoma',
 'OR':'oregon','PA':'pennsylvania','RI':'rhodeisland','SC':'southcarolina','SD':'southdakota','TN':'tennessee',
 'TX':'texas','UT':'utah','VT':'vermont','VA':'virginia','WA':'washington','WV':'westvirginia','WI':'wisconsin','WY':'wyoming'}
UA = 'Mozilla/5.0 (compatible; DownRangeBot/1.0; +https://www.downrangeco.com)'
out, problems = {}, []
for code, slug in SLUGS.items():
    pdf = f'/tmp/{slug}.pdf'
    ok = False
    for attempt in range(3):
        try:
            req = urllib.request.Request(f'https://www.handgunlaw.us/states/{slug}.pdf', headers={'User-Agent': UA})
            open(pdf, 'wb').write(urllib.request.urlopen(req, timeout=60).read()); ok = True; break
        except Exception as e:
            time.sleep(3)
    if not ok: problems.append(f'{code}: download failed'); continue
    txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    a = txt.find('Permits/Licenses This State Honors')
    b = txt.find('Reciprocity/How This State Honors')
    if a < 0: problems.append(f'{code}: honors section not found'); continue
    if b < a: b = a + 4000
    sec = txt[a:b]
    # the right-hand link column shares lines on page 1; drop obvious link-column words
    m = re.search(r'Last Updated:\s*([0-9/]+)', txt)
    out[code] = {'honorsText': sec.strip()[:6000], 'updated': m.group(1) if m else None}
    time.sleep(0.4)
print('collected', len(out), 'problems', problems, file=sys.stderr)
if len(out) < 45:
    print('too few states, aborting', file=sys.stderr); sys.exit(1)
payload = json.dumps({'states': out, 'dry': os.environ.get('DRY') == '1'}).encode()
req = urllib.request.Request('https://www.downrangeco.com/api/admin/reciprocity-ingest', data=payload,
    headers={'content-type': 'application/json', 'x-admin-key': os.environ['ADMIN_KEY']}, method='POST')
try:
    r = urllib.request.urlopen(req, timeout=290); print(r.status, r.read().decode()[:3000])
except urllib.error.HTTPError as e:
    print(e.code, e.read().decode()[:3000]); sys.exit(1)
