#!/usr/bin/env python3
"""Monthly ATF FFL import. Run from a machine atf.gov does not block (home/office IP), e.g. the Mac mini.
   export DR_ADMIN_KEY=...   (same value as ADMIN_KEY in Vercel)
   python3 scripts/atf_ffl_fetch.py            # latest month
   python3 scripts/atf_ffl_fetch.py --dry      # download + parse, don't upload
Needs: pip install requests openpyxl
"""
import os, re, sys, io, csv, json, time, datetime, requests

PAGE = 'https://www.atf.gov/firearms/tools-and-services-firearms-industry/federal-firearms-listings'
SITE = os.environ.get('DR_SITE', 'https://www.downrangeco.com')
KEY = os.environ.get('DR_ADMIN_KEY', '')
DRY = '--dry' in sys.argv
STATES = 'AL AK AZ AR CA CO CT DE FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY'.split()
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

def rows_from(content, ctype):
    """ATF files are tab/pipe/comma delimited text or xlsx. Returns list of dict rows (upper-case headers)."""
    if content[:2] == b'PK':
        import openpyxl
        ws = openpyxl.load_workbook(io.BytesIO(content), read_only=True).active
        it = ws.iter_rows(values_only=True)
        hdr = [str(h or '').strip().upper() for h in next(it)]
        return [dict(zip(hdr, [str(c).strip() if c is not None else '' for c in r])) for r in it]
    txt = content.decode('latin-1')
    first = txt.split('\n', 1)[0]
    delim = '\t' if '\t' in first else '|' if '|' in first else ','
    rd = csv.reader(io.StringIO(txt), delimiter=delim)
    hdr = [h.strip().upper() for h in next(rd)]
    return [dict(zip(hdr, [c.strip() for c in r])) for r in rd if r]

def pick(r, *names):
    for n in names:
        if r.get(n): return r[n]
    return ''

def dealer(r):
    lic = '-'.join(x for x in [pick(r, 'LIC_REGN'), pick(r, 'LIC_DIST'), pick(r, 'LIC_CNTY'), pick(r, 'LIC_TYPE'), pick(r, 'LIC_XPRDTE'), pick(r, 'LIC_SEQN')] if x) or pick(r, 'LICENSE', 'LICENSE NUMBER')
    return {
        'lic': lic, 'name': pick(r, 'LICENSE_NAME', 'LICENSE NAME'), 'biz': pick(r, 'BUSINESS_NAME', 'BUSINESS NAME'),
        'street': pick(r, 'PREMISE_STREET', 'PREMISE STREET'), 'city': pick(r, 'PREMISE_CITY', 'PREMISE CITY'),
        'zip': pick(r, 'PREMISE_ZIP_CODE', 'PREMISE ZIP CODE', 'PREMISE_ZIP')[:5], 'phone': pick(r, 'VOICE_PHONE', 'VOICE PHONE'),
        'type': pick(r, 'LIC_TYPE', 'TYPE') or (lic.split('-')[3] if lic.count('-') > 3 else ''),
    }

def fetch_state(s, st, yy, mm):
    g = s.get(PAGE, headers={'User-Agent': UA}, timeout=60); g.raise_for_status()
    m = re.search(r'name="form_build_id"[^>]*value="([^"]+)"', g.text) or re.search(r'value="([^"]+)"[^>]*name="form_build_id"', g.text)
    if not m: raise RuntimeError('no form_build_id (blocked?)')
    p = s.post(PAGE, data={'year': yy, 'month': mm, 'state': st, 'form_build_id': m.group(1), 'form_id': 'ffl-listing-export-form', 'op': 'Apply'},
               headers={'User-Agent': UA, 'Referer': PAGE, 'Origin': 'https://www.atf.gov'}, timeout=120)
    p.raise_for_status()
    ct = p.headers.get('content-type', '')
    if 'html' in ct:  # page with a download link instead of the file
        links = re.findall(r'href="([^"]+ffl-list[^"]*)"', p.text)
        if not links: raise RuntimeError('no file link in response')
        u = links[0] if links[0].startswith('http') else 'https://www.atf.gov' + links[0]
        p = s.get(u, headers={'User-Agent': UA, 'Referer': PAGE}, timeout=120); p.raise_for_status()
    return rows_from(p.content, p.headers.get('content-type', ''))

def main():
    if not DRY and not KEY: sys.exit('set DR_ADMIN_KEY')
    today = datetime.date.today()
    # try this month then last month (ATF publishes mid/late month)
    cands = [today, (today.replace(day=1) - datetime.timedelta(days=1))]
    s = requests.Session(); total = 0; failed = []; used = None
    for st in STATES:
        ok = False
        for d in cands:
            yy, mm = d.strftime('%y'), d.strftime('%m')
            try:
                rows = [dealer(r) for r in fetch_state(s, st, yy, mm)]
                rows = [r for r in rows if r['lic']]
                if len(rows) < 5: continue
                month = d.strftime('%Y-%m'); used = used or month
                print(st, month, len(rows), flush=True)
                if not DRY:
                    r = requests.post(SITE + '/api/admin/ffl-ingest', json={'state': st, 'month': month, 'dealers': rows}, headers={'x-admin-key': KEY}, timeout=120)
                    r.raise_for_status()
                total += len(rows); ok = True; break
            except Exception as e:
                print(st, d.strftime('%Y-%m'), 'ERR', str(e)[:120], flush=True)
        if not ok: failed.append(st)
        time.sleep(1.5)
    print('total', total, 'failed', failed)
    if not DRY:
        requests.post(SITE + '/api/admin/ffl-ingest', json={'done': True, 'month': used, 'states': len(STATES) - len(failed), 'total': total, 'failed': failed}, headers={'x-admin-key': KEY}, timeout=60)
    sys.exit(1 if len(failed) > 5 else 0)

if __name__ == '__main__': main()
