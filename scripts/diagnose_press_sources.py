import json, re, sys, urllib.request, urllib.error, urllib.parse, ssl
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
SRC = {
 'Taurus':'https://www.taurususa.com/company/news','Remington':'https://www.remington.com/news.html',
 'Henry':'https://www.henryusa.com/about-us/henry-news/','CZ-USA':'https://www.czfirearms.com/en-us/news/',
 'H&K':'https://www.hk-usa.com/news/','Beretta':'https://www.beretta.com/en-us/blog',
 'Canik':'https://www.canik.com/blogs/news','Barrett':'https://barrett.net/news/',
 'Weatherby':'https://www.weatherby.com/blog/','Tikka':'https://www.sako.global/en/news',
 'Colt':'https://www.colt.com/colt-news/','Walther':'https://www.waltherarms.com/news/',
 'Kel-Tec':'https://keltecweapons.com/blog/category/press/','Benelli':'https://www.benelliusa.com/resources/press-releases',
}
def get(url, t=25):
    req = urllib.request.Request(url, headers={'User-Agent': UA, 'Accept': 'text/html,application/xhtml+xml,application/xml', 'Accept-Language': 'en-US,en;q=0.9'})
    try:
        r = urllib.request.urlopen(req, timeout=t)
        return r.status, r.geturl(), r.read(900000).decode('utf-8', 'ignore'), r.headers.get('content-type','')
    except urllib.error.HTTPError as e:
        return e.code, url, (e.read(2000).decode('utf-8','ignore') if hasattr(e,'read') else ''), ''
    except Exception as e:
        return 0, url, str(e)[:120], ''
out = {}
for name, url in SRC.items():
    st, final, body, ct = get(url)
    info = {'url': url, 'status': st, 'final': final, 'bytes': len(body)}
    if st == 200:
        host = urllib.parse.urlparse(final).netloc.replace('www.', '')
        hrefs = re.findall(r'<a\b[^>]*?href=["\']([^"\']+)["\']', body, re.I)
        info['anchors'] = len(hrefs)
        links = []
        for h in hrefs:
            a = urllib.parse.urljoin(final, h.split('#')[0])
            p = urllib.parse.urlparse(a)
            if p.netloc.replace('www.', '') != host: continue
            last = [s for s in p.path.split('/') if s][-1:] or ['']
            if len(last[0]) >= 8 and re.search('[a-z]', last[0], re.I) and a not in links: links.append(a)
        info['same_host_slug_links'] = links[:14]
        info['js_rendered_hint'] = bool(re.search(r'__NEXT_DATA__|id="__nuxt"|window\.__INITIAL_STATE__|ng-app|data-reactroot', body)) and len(hrefs) < 40
        info['has_jsonld_items'] = len(re.findall(r'"@type"\s*:\s*"(?:NewsArticle|Article|BlogPosting)"', body))
        m = re.search(r'<link[^>]+type=["\']application/(?:rss|atom)\+xml["\'][^>]*href=["\']([^"\']+)', body, re.I)
        info['feed_link'] = urllib.parse.urljoin(final, m.group(1)) if m else None
        info['title'] = (re.search(r'<title[^>]*>(.*?)</title>', body, re.S|re.I) or [0,''])[1].strip()[:100]
        info['blocked_hint'] = bool(re.search(r'cloudflare|captcha|access denied|just a moment', body[:3000], re.I))
    else:
        info['snippet'] = re.sub(r'\s+', ' ', body)[:160]
    # probe common feeds off the site root
    root = '{0.scheme}://{0.netloc}'.format(urllib.parse.urlparse(url))
    probes = {}
    for pth in ('/feed', '/feed/', '/rss', '/rss.xml', '/blog/feed', '/blogs/news.atom', '/wp-json/wp/v2/posts?per_page=3', '/sitemap.xml'):
        s2, f2, b2, c2 = get(root + pth, 12)
        if s2 == 200 and len(b2) > 200 and not b2.lstrip().lower().startswith('<!doctype html'):
            probes[pth] = len(b2)
    info['feed_probes_ok'] = probes
    out[name] = info
json.dump(out, open('scripts/press_sources_diagnosis.json', 'w'), indent=2)
print('done', len(out))
