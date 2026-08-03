#!/usr/bin/env python3
"""
Cloudflare fingerprints the TLS handshake (JA3), not just headers. Plain Node
fetch, python-requests and stock curl all present non-browser fingerprints,
which is why every transport we tried got 403 while a real Chrome gets 200.

curl_cffi replays Chrome's actual TLS/HTTP2 fingerprint. If it works, gun.deals
becomes free to scrape and Jina is unnecessary for deal images.
"""
import json, re, sys, time

UA = ('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
      '(KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36')

# Pull live product URLs from the RSS feed (RSS is not blocked).
import urllib.request
rss = urllib.request.urlopen(urllib.request.Request(
    'https://gun.deals/rss.xml', headers={'User-Agent': UA}), timeout=30).read().decode('utf-8', 'replace')
links = re.findall(r'<link>(https://gun\.deals/product/[^<]+)<', rss)[:4]
print(f'{len(links)} product urls from RSS\n')

OG = re.compile(r'og:image["\'\s]+content=["\']([^"\']+)["\']', re.I)


def report(label, status, body, ms):
    og = OG.search(body or '')
    ok = status == 200 and og
    print(f'  {label:<34} {status:<5} {ms:>6}ms {len(body or ""):>8}b '
          f'{"og=" + og.group(1)[:52] if og else ("CHALLENGE" if "Just a moment" in (body or "")[:2000] else "")}')
    return bool(ok)


print('=== 1. stock urllib (control — expect 403) ===')
for url in links[:1]:
    t = time.time()
    try:
        r = urllib.request.urlopen(urllib.request.Request(url, headers={'User-Agent': UA}), timeout=25)
        body, st = r.read().decode('utf-8', 'replace'), r.status
    except Exception as e:
        body, st = '', getattr(e, 'code', 0)
    report('urllib', st, body, int((time.time() - t) * 1000))

print('\n=== 2. curl_cffi impersonating Chrome ===')
try:
    from curl_cffi import requests as creq
except ImportError:
    print('  curl_cffi not installed'); sys.exit(0)

wins = 0
for imp in ['chrome124', 'chrome120', 'safari17_0']:
    print(f'  -- impersonate={imp}')
    for url in links[:2]:
        t = time.time()
        try:
            r = creq.get(url, impersonate=imp, timeout=25)
            body, st = r.text, r.status_code
        except Exception as e:
            body, st = '', 0
            print(f'     error: {type(e).__name__}: {str(e)[:80]}')
        if report(f'    {url.split("/")[-1][:26]}', st, body, int((time.time() - t) * 1000)):
            wins += 1

print(f'\n  successes: {wins}')
if wins:
    print('  PASS — gun.deals is reachable without Jina')
    # Confirm the image itself downloads and is a real product photo
    r = creq.get(links[0], impersonate='chrome124', timeout=25)
    og = OG.search(r.text)
    if og:
        img = creq.get(og.group(1), impersonate='chrome124', timeout=25)
        print(f'  image download: {img.status_code} {len(img.content)}b {img.headers.get("content-type")}')
else:
    print('  FAIL — TLS impersonation does not defeat this WAF')
