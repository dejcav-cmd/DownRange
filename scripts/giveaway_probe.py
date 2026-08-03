#!/usr/bin/env python3
"""Probe round 3: dump the raw context window around real giveaway anchors so
the value/end-date association can be written against fact, not assumption."""
import json, re, urllib.request, urllib.error, urllib.parse, time

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')
H = {'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,*/*;q=0.8',
     'Accept-Language': 'en-US,en;q=0.9'}
A_TAG = re.compile(r'<a\b[^>]*?href=["\']([^"\']+)["\'][^>]*>(.*?)</a>', re.I | re.S)
TAGS = re.compile(r'<[^>]+>')

out = {}
for name, url in [('wintheguns.com', 'https://wintheguns.com/'),
                  ('gungiveaways.net', 'https://gungiveaways.net/')]:
    try:
        with urllib.request.urlopen(urllib.request.Request(url, headers=H), timeout=25) as r:
            html = r.read().decode('utf-8', 'replace')
    except Exception as e:
        out[name] = {'err': str(e)}
        continue

    host = (urllib.parse.urlparse(url).hostname or '').replace('www.', '')
    rows = []
    for m in A_TAG.finditer(html):
        href, inner = m.group(1), m.group(2)
        text = re.sub(r'\s+', ' ', TAGS.sub(' ', inner)).strip()
        if len(text) < 8:
            continue
        full = urllib.parse.urljoin(url, href)
        if host in (urllib.parse.urlparse(full).hostname or ''):
            continue
        for lo, hi in [(200, 400), (400, 700)]:
            pass
        ctx_before = re.sub(r'\s+', ' ', TAGS.sub(' ', html[max(0, m.start() - 400):m.start()]))
        ctx_after = re.sub(r'\s+', ' ', TAGS.sub(' ', html[m.end():m.end() + 500]))
        rows.append({
            'text': text[:100], 'url': full[:130],
            'before_tail': ctx_before[-220:],
            'after_head': ctx_after[:260],
            'dates_before': re.findall(r'\d{1,2}/\d{1,2}/\d{2,4}', ctx_before)[-4:],
            'dates_after': re.findall(r'\d{1,2}/\d{1,2}/\d{2,4}', ctx_after)[:4],
            'money_before': re.findall(r'\$\s?[\d,]+', ctx_before)[-3:],
            'money_after': re.findall(r'\$\s?[\d,]+', ctx_after)[:3],
        })
        if len(rows) >= 6:
            break
    out[name] = {'rows': rows}
    time.sleep(2)

with open('probe.json', 'w') as f:
    json.dump(out, f, indent=2)
print('done')
