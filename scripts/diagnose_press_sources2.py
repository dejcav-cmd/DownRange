import json, re, urllib.request, urllib.error, urllib.parse
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
def get(url, t=25):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': '*/*', 'Accept-Language': 'en-US,en;q=0.9'})
    try:
        r = urllib.request.urlopen(req, timeout=t); return r.status, r.geturl(), r.read(3000000).decode('utf-8','ignore')
    except urllib.error.HTTPError as e: return e.code, url, ''
    except Exception as e: return 0, url, str(e)[:100]
out = {}
def newslike(final, body, pat):
    host = urllib.parse.urlparse(final).netloc.replace('www.','')
    res = []
    for h in re.findall(r'<a\b[^>]*?href=["\']([^"\']+)["\']', body, re.I):
        a = urllib.parse.urljoin(final, h.split('#')[0]); p = urllib.parse.urlparse(a)
        if p.netloc.replace('www.','') == host and re.search(pat, p.path, re.I) and a not in res and a.rstrip('/') != final.rstrip('/'): res.append(a)
    return res[:15]
def sitemap_urls(root, pat, depth=0):
    st, f, b = get(root)
    if st != 200: return []
    locs = re.findall(r'<loc>\s*([^<\s]+)\s*</loc>', b)
    hits = [l for l in locs if re.search(pat, l, re.I) and not l.endswith('.xml')]
    if hits or depth: return hits[:12]
    subs = [l for l in locs if l.endswith('.xml')]
    allh = []
    for s in subs[:12]:
        allh += sitemap_urls(s, pat, 1)
        if len(allh) >= 12: break
    return allh[:12]
checks = {
 'Remington': ('https://www.remington.com/news', r'/news', 'https://www.remington.com/sitemap.xml', r'/news'),
 'CZ-USA': ('https://www.czfirearms.com/en-us/news/', r'/news', 'https://www.czfirearms.com/sitemap.xml', r'/news'),
 'Canik': ('https://www.canik.com/blogs/news', r'/blogs/news|/news', 'https://www.canik.com/sitemap.xml', r'/blogs/news/|/news/'),
 'Tikka': ('https://www.sako.global/en/news', r'/news', 'https://www.sako.global/sitemap.xml', r'/news/'),
 'Henry': ('https://www.henryusa.com/about-us/henry-news/', r'news', 'https://www.henryusa.com/sitemap.xml', r'news'),
}
for name, (page, pat, sm, spat) in checks.items():
    st, f, b = get(page)
    out[name] = {'status': st, 'final': f, 'page_news_links': newslike(f, b, pat) if st == 200 else [], 'sitemap_news_urls': sitemap_urls(sm, spat)}
# feeds: parse first items
for name, feed in {'Henry':'https://www.henryusa.com/feed/','Barrett':'https://barrett.net/feed/','Weatherby':'https://weatherby.com/feed/','H&K':'https://www.hk-usa.com/feed/','Colt':'https://www.colt.com/feed/','Kel-Tec':'https://www.keltecweapons.com/feed/'}.items():
    st, f, b = get(feed)
    items = re.findall(r'<item>.*?<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>.*?<link>(.*?)</link>.*?<pubDate>(.*?)</pubDate>', b, re.S)
    out.setdefault(name, {})['feed'] = {'status': st, 'items': len(re.findall(r'<item>', b)), 'sample': [(t.strip()[:70], l.strip(), d.strip()) for t, l, d in items[:4]]}
json.dump(out, open('scripts/press_sources_diagnosis2.json','w'), indent=2); print('done')
